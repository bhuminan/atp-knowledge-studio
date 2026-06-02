use rusqlite::{Connection, OptionalExtension};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const DB_FILE_NAME: &str = "atp-knowledge-vault.sqlite";
const VAULT_DIR_NAME: &str = "knowledge-vault";
const INIT_SOURCE_DOCUMENT_ROOT_MIGRATION_ID: &str = "001_init_source_document_root";
const INIT_SOURCE_DOCUMENT_ROOT_MIGRATION_SQL: &str =
    include_str!("../migrations/001_init_source_document_root.sql");

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultDatabaseInitializationStatus {
    db_path: String,
    initialized: bool,
    applied_migrations: Vec<String>,
    schema_version: u32,
    persisted: bool,
}

#[tauri::command]
pub fn initialize_vault_database(
    app: tauri::AppHandle,
) -> Result<VaultDatabaseInitializationStatus, String> {
    let db_path = resolve_vault_database_path(&app)?;
    let vault_dir = db_path
        .parent()
        .ok_or_else(|| "Unable to resolve Knowledge Vault database directory.".to_string())?;

    fs::create_dir_all(vault_dir)
        .map_err(|error| format!("Unable to create Knowledge Vault database directory: {error}"))?;

    let connection = Connection::open(&db_path)
        .map_err(|error| format!("Unable to open Knowledge Vault database: {error}"))?;
    let applied_migrations = apply_migrations(&connection)?;
    let schema_version = read_schema_version(&connection)?
        .ok_or_else(|| "Knowledge Vault schema version was not initialized.".to_string())?;

    Ok(VaultDatabaseInitializationStatus {
        db_path: db_path.to_string_lossy().to_string(),
        initialized: true,
        applied_migrations,
        schema_version,
        persisted: false,
    })
}

pub fn resolve_vault_database_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Unable to resolve ATP app data directory: {error}"))?;

    Ok(app_data_dir.join(VAULT_DIR_NAME).join(DB_FILE_NAME))
}

fn apply_migrations(connection: &Connection) -> Result<Vec<String>, String> {
    let current_version = read_schema_version(connection)?.unwrap_or(0);
    let mut applied_migrations = Vec::new();

    if current_version < 1 {
        connection
            .execute_batch(INIT_SOURCE_DOCUMENT_ROOT_MIGRATION_SQL)
            .map_err(|error| {
                format!("Unable to apply SourceDocument root SQLite migration: {error}")
            })?;
        applied_migrations.push(INIT_SOURCE_DOCUMENT_ROOT_MIGRATION_ID.to_string());
    }

    Ok(applied_migrations)
}

fn read_schema_version(connection: &Connection) -> Result<Option<u32>, String> {
    let has_schema_version_table = connection
        .query_row(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_version'",
            [],
            |_| Ok(()),
        )
        .optional()
        .map_err(|error| format!("Unable to inspect Knowledge Vault schema: {error}"))?
        .is_some();

    if !has_schema_version_table {
        return Ok(None);
    }

    connection
        .query_row(
            "SELECT version FROM schema_version WHERE id = 1",
            [],
            |row| row.get::<_, u32>(0),
        )
        .optional()
        .map_err(|error| format!("Unable to read Knowledge Vault schema version: {error}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    use std::path::Path;

    #[test]
    fn applies_source_document_root_migration_to_empty_database() {
        let db_path = temp_database_path("migration");
        let connection = Connection::open(&db_path).expect("open temp sqlite database");

        let applied_migrations = apply_migrations(&connection).expect("apply migrations");

        assert_eq!(
            applied_migrations,
            vec![INIT_SOURCE_DOCUMENT_ROOT_MIGRATION_ID.to_string()]
        );
        assert_eq!(
            read_schema_version(&connection).expect("read schema version"),
            Some(1)
        );
        assert_table_exists(&connection, "schema_version");
        assert_table_exists(&connection, "source_documents");
        assert_table_exists(&connection, "extraction_runs");
        assert_table_exists(&connection, "extraction_segments");
        assert_table_exists(&connection, "evidence_traces");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn evidence_trace_page_number_allows_null() {
        let db_path = temp_database_path("nullable-page-number");
        let connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let page_number_is_not_null: i64 = connection
            .query_row(
                "SELECT \"notnull\" FROM pragma_table_info('evidence_traces') WHERE name = 'page_number'",
                [],
                |row| row.get(0),
            )
            .expect("read evidence_traces page_number metadata");

        assert_eq!(page_number_is_not_null, 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn initialization_migration_does_not_insert_source_documents() {
        let db_path = temp_database_path("no-source-documents");
        let connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let source_document_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM source_documents", [], |row| row.get(0))
            .expect("count source documents");

        assert_eq!(source_document_count, 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn applying_migrations_twice_does_not_reapply_completed_migration() {
        let db_path = temp_database_path("idempotent");
        let connection = Connection::open(&db_path).expect("open temp sqlite database");

        let first_result = apply_migrations(&connection).expect("apply initial migration");
        let second_result = apply_migrations(&connection).expect("apply migration again");

        assert_eq!(first_result.len(), 1);
        assert!(second_result.is_empty());

        fs::remove_file(db_path).ok();
    }

    fn assert_table_exists(connection: &Connection, table_name: &str) {
        let exists: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?1",
                params![table_name],
                |row| row.get(0),
            )
            .expect("inspect sqlite table");

        assert_eq!(exists, 1, "{table_name} should exist");
    }

    fn temp_database_path(label: &str) -> PathBuf {
        let mut path = std::env::temp_dir();
        path.push(format!(
            "atp-knowledge-studio-{label}-{}-{}.sqlite",
            std::process::id(),
            crate::unix_millis_now()
        ));

        if Path::new(&path).exists() {
            fs::remove_file(&path).ok();
        }

        path
    }
}
