use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSourceDocumentRequest {
    extraction: SaveDocumentTextExtraction,
    extraction_run_id: String,
    segments: Vec<SaveDocumentSegment>,
    source_document: SaveSourceDocumentCandidate,
    source_document_id: String,
    traces: Vec<SaveExtractionTrace>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSourceDocumentCandidate {
    candidate_id: String,
    file_name: String,
    file_type: String,
    local_path_policy: String,
    parser_status: String,
    review: SaveCandidateReviewSnapshot,
    source_metadata: SaveSourceMetadata,
    title: String,
    validation_status: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSourceMetadata {
    completeness: String,
    title: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveCandidateReviewSnapshot {
    review_status: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDocumentTextExtraction {
    cleaned_text: String,
    confidence_score: u32,
    document_id: String,
    extraction_status: String,
    raw_text: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDocumentSegment {
    content: String,
    page_end: i64,
    page_start: i64,
    segment_id: String,
    segment_type: String,
    tags: Vec<String>,
    title: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveExtractionTrace {
    chunk_reference: String,
    page_number: i64,
    section_title: String,
    segment_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSourceDocumentResult {
    blockers: Vec<String>,
    db_path: String,
    extraction_run_id: String,
    saved: bool,
    segment_count: usize,
    source_document_id: String,
    trace_count: usize,
    warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadSavedSourceDocumentRequest {
    source_document_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceDocumentListItem {
    source_document_id: String,
    title: String,
    file_name: String,
    file_type: String,
    metadata_status: String,
    extraction_status: String,
    created_at: String,
    updated_at: String,
    segment_count: i64,
    trace_count: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceDocumentDetail {
    source_document: SavedSourceDocumentRecord,
    extraction_run: SavedExtractionRunRecord,
    segments: Vec<SavedExtractionSegmentRecord>,
    traces: Vec<SavedEvidenceTraceRecord>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceDocumentRecord {
    source_document_id: String,
    title: String,
    file_name: String,
    file_type: String,
    metadata_status: String,
    citation_readiness: String,
    parser_status: String,
    review_status: String,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedExtractionRunRecord {
    extraction_run_id: String,
    extraction_status: String,
    confidence_score: Option<i64>,
    raw_text_length: i64,
    cleaned_text_length: i64,
    warning_count: i64,
    created_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedExtractionSegmentRecord {
    segment_id: String,
    title: String,
    segment_type: String,
    content: String,
    page_start: Option<i64>,
    page_end: Option<i64>,
    page_numbers_trusted: bool,
    sort_order: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedEvidenceTraceRecord {
    trace_id: String,
    segment_id: Option<String>,
    chunk_reference: String,
    page_number: Option<i64>,
    page_number_trusted: bool,
    section_title: Option<String>,
}

#[tauri::command]
pub fn initialize_vault_database(
    app: tauri::AppHandle,
) -> Result<VaultDatabaseInitializationStatus, String> {
    let (db_path, connection, applied_migrations) = open_initialized_vault_database(&app)?;
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

#[tauri::command]
pub fn save_source_document_candidate(
    app: tauri::AppHandle,
    request: SaveSourceDocumentRequest,
) -> Result<SaveSourceDocumentResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    save_source_document_candidate_to_connection(&mut connection, db_path, request)
}

#[tauri::command]
pub fn list_saved_source_documents(
    app: tauri::AppHandle,
) -> Result<Vec<SavedSourceDocumentListItem>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    list_saved_source_documents_from_connection(&connection)
}

#[tauri::command]
pub fn read_saved_source_document(
    app: tauri::AppHandle,
    request: ReadSavedSourceDocumentRequest,
) -> Result<SavedSourceDocumentDetail, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    read_saved_source_document_from_connection(&connection, &request.source_document_id)
}

pub fn resolve_vault_database_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Unable to resolve ATP app data directory: {error}"))?;

    Ok(app_data_dir.join(VAULT_DIR_NAME).join(DB_FILE_NAME))
}

fn open_initialized_vault_database(
    app: &tauri::AppHandle,
) -> Result<(PathBuf, Connection, Vec<String>), String> {
    let db_path = resolve_vault_database_path(app)?;
    let vault_dir = db_path
        .parent()
        .ok_or_else(|| "Unable to resolve Knowledge Vault database directory.".to_string())?;

    fs::create_dir_all(vault_dir)
        .map_err(|error| format!("Unable to create Knowledge Vault database directory: {error}"))?;

    let connection = Connection::open(&db_path)
        .map_err(|error| format!("Unable to open Knowledge Vault database: {error}"))?;
    connection
        .execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|error| format!("Unable to enable Knowledge Vault foreign keys: {error}"))?;
    let applied_migrations = apply_migrations(&connection)?;

    Ok((db_path, connection, applied_migrations))
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

fn save_source_document_candidate_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: SaveSourceDocumentRequest,
) -> Result<SaveSourceDocumentResult, String> {
    let validation = validate_source_document_save_request(&request);

    if !validation.blockers.is_empty() {
        return Ok(SaveSourceDocumentResult {
            blockers: validation.blockers,
            db_path: db_path.to_string_lossy().to_string(),
            extraction_run_id: request.extraction_run_id,
            saved: false,
            segment_count: 0,
            source_document_id: request.source_document_id,
            trace_count: 0,
            warnings: validation.warnings,
        });
    }

    let saved_at = create_unix_millis_timestamp();
    let tx = connection
        .transaction()
        .map_err(|error| format!("Unable to start SourceDocument save transaction: {error}"))?;

    tx.execute(
        "INSERT INTO source_documents (
            id,
            project_id,
            title,
            file_name,
            file_type,
            mime_type,
            file_size,
            local_path_reference,
            local_path_policy,
            metadata_status,
            citation_metadata_required,
            citation_readiness,
            parser_status,
            review_status,
            created_from_candidate_id,
            created_at,
            updated_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, NULL, NULL, NULL, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            file_name = excluded.file_name,
            file_type = excluded.file_type,
            local_path_policy = excluded.local_path_policy,
            metadata_status = excluded.metadata_status,
            citation_metadata_required = excluded.citation_metadata_required,
            citation_readiness = excluded.citation_readiness,
            parser_status = excluded.parser_status,
            review_status = excluded.review_status,
            created_from_candidate_id = excluded.created_from_candidate_id,
            updated_at = excluded.updated_at",
        params![
            request.source_document_id,
            "project-product-service",
            request.source_document.title,
            request.source_document.file_name,
            request.source_document.file_type,
            request.source_document.local_path_policy,
            request.source_document.source_metadata.completeness,
            1,
            "missing_metadata",
            request.source_document.parser_status,
            request.source_document.review.review_status,
            request.source_document.candidate_id,
            saved_at
        ],
    )
    .map_err(|error| format!("Unable to save SourceDocument root: {error}"))?;

    tx.execute(
        "DELETE FROM evidence_traces WHERE source_document_id = ?1",
        params![request.source_document_id],
    )
    .map_err(|error| format!("Unable to clear existing evidence traces: {error}"))?;
    tx.execute(
        "DELETE FROM extraction_segments WHERE source_document_id = ?1",
        params![request.source_document_id],
    )
    .map_err(|error| format!("Unable to clear existing extraction segments: {error}"))?;
    tx.execute(
        "DELETE FROM extraction_runs WHERE source_document_id = ?1",
        params![request.source_document_id],
    )
    .map_err(|error| format!("Unable to clear existing extraction run: {error}"))?;

    tx.execute(
        "INSERT INTO extraction_runs (
            id,
            source_document_id,
            extraction_document_id,
            parser_name,
            parser_version,
            extraction_status,
            confidence_score,
            raw_text_hash,
            cleaned_text_hash,
            raw_text_length,
            cleaned_text_length,
            warning_count,
            created_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, NULL, ?8, ?9, 0, ?10)",
        params![
            request.extraction_run_id,
            request.source_document_id,
            request.extraction.document_id,
            "docx-wordprocessingml-mvp",
            "4C-3D",
            request.extraction.extraction_status,
            request.extraction.confidence_score,
            request.extraction.raw_text.chars().count() as i64,
            request.extraction.cleaned_text.chars().count() as i64,
            saved_at
        ],
    )
    .map_err(|error| format!("Unable to save extraction run: {error}"))?;

    for (index, segment) in request.segments.iter().enumerate() {
        tx.execute(
            "INSERT INTO extraction_segments (
                id,
                extraction_run_id,
                source_document_id,
                segment_id,
                segment_type,
                title,
                content,
                content_hash,
                page_start,
                page_end,
                page_numbers_trusted,
                sort_order,
                tags_json,
                created_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                create_extraction_segment_row_id(&request.source_document_id, segment),
                request.extraction_run_id,
                request.source_document_id,
                segment.segment_id,
                segment.segment_type,
                segment.title,
                segment.content,
                nullable_positive_i64(segment.page_start),
                nullable_positive_i64(segment.page_end),
                page_numbers_trusted(segment.page_start, segment.page_end),
                index as i64 + 1,
                serde_json::to_string(&segment.tags)
                    .map_err(|error| format!("Unable to serialize segment tags: {error}"))?,
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to save extraction segment: {error}"))?;
    }

    for trace in &request.traces {
        tx.execute(
            "INSERT INTO evidence_traces (
                id,
                source_document_id,
                extraction_run_id,
                extraction_segment_id,
                trace_type,
                chunk_reference,
                page_number,
                page_number_trusted,
                section_title,
                parser_warning,
                created_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL, ?10)",
            params![
                create_evidence_trace_row_id(&request.source_document_id, trace),
                request.source_document_id,
                request.extraction_run_id,
                find_segment_row_id_for_trace(
                    &request.source_document_id,
                    &request.segments,
                    trace
                ),
                "document_extraction",
                trace.chunk_reference,
                nullable_positive_i64(trace.page_number),
                if trace.page_number > 0 { 1 } else { 0 },
                trace.section_title,
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to save evidence trace: {error}"))?;
    }

    tx.commit()
        .map_err(|error| format!("Unable to commit SourceDocument save transaction: {error}"))?;

    Ok(SaveSourceDocumentResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        extraction_run_id: request.extraction_run_id,
        saved: true,
        segment_count: request.segments.len(),
        source_document_id: request.source_document_id,
        trace_count: request.traces.len(),
        warnings: validation.warnings,
    })
}

fn list_saved_source_documents_from_connection(
    connection: &Connection,
) -> Result<Vec<SavedSourceDocumentListItem>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                sd.id,
                sd.title,
                sd.file_name,
                sd.file_type,
                sd.metadata_status,
                COALESCE(er.extraction_status, 'missing') AS extraction_status,
                sd.created_at,
                sd.updated_at,
                COUNT(DISTINCT es.id) AS segment_count,
                COUNT(DISTINCT et.id) AS trace_count
            FROM source_documents sd
            LEFT JOIN extraction_runs er ON er.source_document_id = sd.id
            LEFT JOIN extraction_segments es ON es.source_document_id = sd.id
            LEFT JOIN evidence_traces et ON et.source_document_id = sd.id
            GROUP BY
                sd.id,
                sd.title,
                sd.file_name,
                sd.file_type,
                sd.metadata_status,
                er.extraction_status,
                sd.created_at,
                sd.updated_at
            ORDER BY sd.updated_at DESC",
        )
        .map_err(|error| format!("Unable to prepare saved SourceDocument list: {error}"))?;

    let rows = statement
        .query_map([], |row| {
            Ok(SavedSourceDocumentListItem {
                source_document_id: row.get(0)?,
                title: row.get(1)?,
                file_name: row.get(2)?,
                file_type: row.get(3)?,
                metadata_status: row.get(4)?,
                extraction_status: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
                segment_count: row.get(8)?,
                trace_count: row.get(9)?,
            })
        })
        .map_err(|error| format!("Unable to read saved SourceDocument list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map saved SourceDocument list: {error}"))
}

fn read_saved_source_document_from_connection(
    connection: &Connection,
    source_document_id: &str,
) -> Result<SavedSourceDocumentDetail, String> {
    let trimmed_id = source_document_id.trim();

    if trimmed_id.is_empty() {
        return Err("sourceDocumentId is required.".to_string());
    }

    let source_document = connection
        .query_row(
            "SELECT
                id,
                title,
                file_name,
                file_type,
                metadata_status,
                citation_readiness,
                parser_status,
                review_status,
                created_at,
                updated_at
            FROM source_documents
            WHERE id = ?1",
            params![trimmed_id],
            |row| {
                Ok(SavedSourceDocumentRecord {
                    source_document_id: row.get(0)?,
                    title: row.get(1)?,
                    file_name: row.get(2)?,
                    file_type: row.get(3)?,
                    metadata_status: row.get(4)?,
                    citation_readiness: row.get(5)?,
                    parser_status: row.get(6)?,
                    review_status: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("Unable to read saved SourceDocument: {error}"))?
        .ok_or_else(|| format!("Saved SourceDocument not found: {trimmed_id}"))?;

    let extraction_run = connection
        .query_row(
            "SELECT
                id,
                extraction_status,
                confidence_score,
                raw_text_length,
                cleaned_text_length,
                warning_count,
                created_at
            FROM extraction_runs
            WHERE source_document_id = ?1
            ORDER BY created_at DESC
            LIMIT 1",
            params![trimmed_id],
            |row| {
                Ok(SavedExtractionRunRecord {
                    extraction_run_id: row.get(0)?,
                    extraction_status: row.get(1)?,
                    confidence_score: row.get(2)?,
                    raw_text_length: row.get(3)?,
                    cleaned_text_length: row.get(4)?,
                    warning_count: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("Unable to read saved extraction run: {error}"))?
        .ok_or_else(|| format!("Saved SourceDocument has no extraction run: {trimmed_id}"))?;

    let segments = read_saved_extraction_segments(connection, trimmed_id)?;
    let traces = read_saved_evidence_traces(connection, trimmed_id)?;

    Ok(SavedSourceDocumentDetail {
        source_document,
        extraction_run,
        segments,
        traces,
    })
}

fn read_saved_extraction_segments(
    connection: &Connection,
    source_document_id: &str,
) -> Result<Vec<SavedExtractionSegmentRecord>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                segment_id,
                title,
                segment_type,
                content,
                page_start,
                page_end,
                page_numbers_trusted,
                sort_order
            FROM extraction_segments
            WHERE source_document_id = ?1
            ORDER BY sort_order ASC",
        )
        .map_err(|error| format!("Unable to prepare saved extraction segments: {error}"))?;

    let rows = statement
        .query_map(params![source_document_id], |row| {
            Ok(SavedExtractionSegmentRecord {
                segment_id: row.get(0)?,
                title: row.get(1)?,
                segment_type: row.get(2)?,
                content: row.get(3)?,
                page_start: row.get(4)?,
                page_end: row.get(5)?,
                page_numbers_trusted: read_sqlite_bool(row.get::<_, i64>(6)?),
                sort_order: row.get(7)?,
            })
        })
        .map_err(|error| format!("Unable to read saved extraction segments: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map saved extraction segments: {error}"))
}

fn read_saved_evidence_traces(
    connection: &Connection,
    source_document_id: &str,
) -> Result<Vec<SavedEvidenceTraceRecord>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                et.id,
                es.segment_id,
                et.chunk_reference,
                et.page_number,
                et.page_number_trusted,
                et.section_title
            FROM evidence_traces et
            LEFT JOIN extraction_segments es ON es.id = et.extraction_segment_id
            WHERE et.source_document_id = ?1
            ORDER BY et.chunk_reference ASC",
        )
        .map_err(|error| format!("Unable to prepare saved evidence traces: {error}"))?;

    let rows = statement
        .query_map(params![source_document_id], |row| {
            Ok(SavedEvidenceTraceRecord {
                trace_id: row.get(0)?,
                segment_id: row.get(1)?,
                chunk_reference: row.get(2)?,
                page_number: row.get(3)?,
                page_number_trusted: read_sqlite_bool(row.get::<_, i64>(4)?),
                section_title: row.get(5)?,
            })
        })
        .map_err(|error| format!("Unable to read saved evidence traces: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map saved evidence traces: {error}"))
}

fn read_sqlite_bool(value: i64) -> bool {
    value != 0
}

struct SaveRequestValidation {
    blockers: Vec<String>,
    warnings: Vec<String>,
}

fn validate_source_document_save_request(
    request: &SaveSourceDocumentRequest,
) -> SaveRequestValidation {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();

    require_text(
        &mut blockers,
        "sourceDocumentId",
        &request.source_document_id,
    );
    require_text(&mut blockers, "extractionRunId", &request.extraction_run_id);
    require_text(
        &mut blockers,
        "sourceDocument.candidateId",
        &request.source_document.candidate_id,
    );
    require_text(
        &mut blockers,
        "sourceDocument.title",
        &request.source_document.title,
    );
    require_text(
        &mut blockers,
        "sourceDocument.fileName",
        &request.source_document.file_name,
    );
    require_text(
        &mut blockers,
        "sourceDocument.sourceMetadata.title",
        &request.source_document.source_metadata.title,
    );
    require_text(
        &mut blockers,
        "extraction.documentId",
        &request.extraction.document_id,
    );

    if !matches!(
        request.source_document.file_type.as_str(),
        "PDF" | "DOCX" | "MD"
    ) {
        blockers.push("SourceDocument file type must be PDF, DOCX, or MD.".to_string());
    }

    if request.source_document.review.review_status != "approved" {
        blockers.push("SourceDocument candidate must be approved before save.".to_string());
    }

    if request.source_document.validation_status == "blocked" {
        blockers.push("Blocked SourceDocument candidate cannot be saved.".to_string());
    }

    if request.segments.is_empty() {
        blockers.push("At least one extraction segment is required.".to_string());
    }

    if request.traces.is_empty() {
        blockers.push("At least one evidence trace is required.".to_string());
    }

    if request
        .traces
        .iter()
        .any(|trace| trace.chunk_reference.trim().is_empty())
    {
        blockers.push("Every evidence trace must preserve a chunk reference.".to_string());
    }

    if request.source_document.file_type == "DOCX"
        && request.traces.iter().any(|trace| trace.page_number > 0)
    {
        blockers.push(
            "DOCX page numbers must remain nullable/untrusted until pagination is resolved."
                .to_string(),
        );
    }

    if request.source_document.source_metadata.completeness != "complete" {
        warnings.push(
            "SourceDocument metadata is incomplete; SourceCard citation metadata remains unsaved."
                .to_string(),
        );
    }

    if request.source_document.file_type == "DOCX" {
        warnings.push(
            "DOCX page numbers are not trusted; saved traces rely on chunk references such as docx:pN."
                .to_string(),
        );
    }

    SaveRequestValidation { blockers, warnings }
}

fn require_text(blockers: &mut Vec<String>, field: &str, value: &str) {
    if value.trim().is_empty() {
        blockers.push(format!("{field} is required."));
    }
}

fn create_extraction_segment_row_id(
    source_document_id: &str,
    segment: &SaveDocumentSegment,
) -> String {
    format!("{}::segment::{}", source_document_id, segment.segment_id)
}

fn create_evidence_trace_row_id(source_document_id: &str, trace: &SaveExtractionTrace) -> String {
    format!(
        "{}::trace::{}::{}",
        source_document_id, trace.segment_id, trace.chunk_reference
    )
}

fn find_segment_row_id_for_trace(
    source_document_id: &str,
    segments: &[SaveDocumentSegment],
    trace: &SaveExtractionTrace,
) -> Option<String> {
    segments
        .iter()
        .find(|segment| segment.segment_id == trace.segment_id)
        .map(|segment| create_extraction_segment_row_id(source_document_id, segment))
}

fn nullable_positive_i64(value: i64) -> Option<i64> {
    if value > 0 {
        Some(value)
    } else {
        None
    }
}

fn page_numbers_trusted(page_start: i64, page_end: i64) -> i64 {
    if page_start > 0 && page_end >= page_start {
        1
    } else {
        0
    }
}

fn create_unix_millis_timestamp() -> String {
    format!("unix-ms:{}", unix_millis_now())
}

fn unix_millis_now() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
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
            .query_row("SELECT COUNT(*) FROM source_documents", [], |row| {
                row.get(0)
            })
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

    #[test]
    fn saves_valid_source_document_candidate_to_temp_database() {
        let db_path = temp_database_path("source-document-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let result = save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document candidate");

        assert!(result.saved);
        assert_eq!(result.segment_count, 2);
        assert_eq!(result.trace_count, 2);
        assert_eq!(count_rows(&connection, "source_documents"), 1);
        assert_eq!(count_rows(&connection, "extraction_runs"), 1);
        assert_eq!(count_rows(&connection, "extraction_segments"), 2);
        assert_eq!(count_rows(&connection, "evidence_traces"), 2);
        assert_table_missing(&connection, "source_cards");
        assert_table_missing(&connection, "knowledge_cards");
        assert_table_missing(&connection, "draft_artifacts");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn duplicate_source_document_save_replaces_children_without_corruption() {
        let db_path = temp_database_path("duplicate-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("first save");
        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("duplicate save");

        assert_eq!(count_rows(&connection, "source_documents"), 1);
        assert_eq!(count_rows(&connection, "extraction_runs"), 1);
        assert_eq!(count_rows(&connection, "extraction_segments"), 2);
        assert_eq!(count_rows(&connection, "evidence_traces"), 2);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn save_preserves_docx_page_numbers_as_null() {
        let db_path = temp_database_path("docx-null-pages");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document");

        let null_page_number_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM evidence_traces WHERE page_number IS NULL AND page_number_trusted = 0",
                [],
                |row| row.get(0),
            )
            .expect("count null page number traces");

        assert_eq!(null_page_number_count, 2);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn missing_required_source_document_fields_return_blockers() {
        let db_path = temp_database_path("missing-fields");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        let mut request = valid_save_request();
        request.source_document.title = " ".to_string();

        let result =
            save_source_document_candidate_to_connection(&mut connection, db_path.clone(), request)
                .expect("return blocked save result");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker == "sourceDocument.title is required."));
        assert_eq!(count_rows(&connection, "source_documents"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn list_returns_saved_source_document_summary() {
        let db_path = temp_database_path("list-saved-source-documents");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document");

        let saved_documents =
            list_saved_source_documents_from_connection(&connection).expect("list saved docs");

        assert_eq!(saved_documents.len(), 1);
        assert_eq!(
            saved_documents[0].source_document_id,
            "candidate-document-qa-docx-file-intake-job"
        );
        assert_eq!(saved_documents[0].segment_count, 2);
        assert_eq!(saved_documents[0].trace_count, 2);
        assert_eq!(saved_documents[0].extraction_status, "extracted");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn read_returns_saved_source_document_detail() {
        let db_path = temp_database_path("read-saved-source-document");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document");

        let detail = read_saved_source_document_from_connection(
            &connection,
            "candidate-document-qa-docx-file-intake-job",
        )
        .expect("read saved source document");

        assert_eq!(
            detail.source_document.source_document_id,
            "candidate-document-qa-docx-file-intake-job"
        );
        assert_eq!(detail.extraction_run.extraction_status, "extracted");
        assert_eq!(detail.extraction_run.cleaned_text_length, 28);
        assert_eq!(detail.segments.len(), 2);
        assert_eq!(detail.traces.len(), 2);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn read_saved_source_document_includes_segments_and_traces() {
        let db_path = temp_database_path("read-segments-traces");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document");

        let detail = read_saved_source_document_from_connection(
            &connection,
            "candidate-document-qa-docx-file-intake-job",
        )
        .expect("read saved source document");

        assert!(detail
            .segments
            .iter()
            .any(|segment| segment.segment_id == "qa-segment-theory"));
        assert!(detail
            .traces
            .iter()
            .any(|trace| trace.chunk_reference == "docx:p2"));
        assert!(detail
            .traces
            .iter()
            .all(|trace| trace.page_number.is_none()));
        assert!(detail.traces.iter().all(|trace| !trace.page_number_trusted));

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn read_missing_source_document_returns_not_found_error() {
        let db_path = temp_database_path("read-missing-source-document");
        let connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let error = match read_saved_source_document_from_connection(&connection, "missing-id") {
            Ok(_) => panic!("missing source document should fail"),
            Err(error) => error,
        };

        assert!(error.contains("Saved SourceDocument not found: missing-id"));

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn read_list_does_not_require_downstream_saved_tables() {
        let db_path = temp_database_path("read-without-downstream-tables");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        assert_table_missing(&connection, "source_cards");
        assert_table_missing(&connection, "knowledge_cards");
        assert_table_missing(&connection, "draft_artifacts");

        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document");

        let saved_documents =
            list_saved_source_documents_from_connection(&connection).expect("list saved docs");
        let detail = read_saved_source_document_from_connection(
            &connection,
            "candidate-document-qa-docx-file-intake-job",
        )
        .expect("read saved source document");

        assert_eq!(saved_documents.len(), 1);
        assert_eq!(detail.segments.len(), 2);
        assert_eq!(detail.traces.len(), 2);
        assert_table_missing(&connection, "source_cards");
        assert_table_missing(&connection, "knowledge_cards");
        assert_table_missing(&connection, "draft_artifacts");

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

    fn assert_table_missing(connection: &Connection, table_name: &str) {
        let exists: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?1",
                params![table_name],
                |row| row.get(0),
            )
            .expect("inspect sqlite table");

        assert_eq!(exists, 0, "{table_name} should not exist");
    }

    fn count_rows(connection: &Connection, table_name: &str) -> i64 {
        connection
            .query_row(&format!("SELECT COUNT(*) FROM {table_name}"), [], |row| {
                row.get(0)
            })
            .expect("count sqlite rows")
    }

    fn valid_save_request() -> SaveSourceDocumentRequest {
        SaveSourceDocumentRequest {
            extraction: SaveDocumentTextExtraction {
                cleaned_text: "Cleaned service quality text".to_string(),
                confidence_score: 86,
                document_id: "qa-docx-file-intake-job".to_string(),
                extraction_status: "extracted".to_string(),
                raw_text: "Raw service quality text".to_string(),
            },
            extraction_run_id: "extraction-run-qa-docx-file-intake-job".to_string(),
            segments: vec![
                SaveDocumentSegment {
                    content: "Service quality overview.".to_string(),
                    page_end: 0,
                    page_start: 0,
                    segment_id: "qa-segment-introduction".to_string(),
                    segment_type: "introduction".to_string(),
                    tags: vec!["service quality".to_string()],
                    title: "Service Quality Overview".to_string(),
                },
                SaveDocumentSegment {
                    content: "Thai service quality explanation.".to_string(),
                    page_end: 0,
                    page_start: 0,
                    segment_id: "qa-segment-theory".to_string(),
                    segment_type: "theory".to_string(),
                    tags: vec!["service marketing".to_string()],
                    title: "Thai Textbook Explanation".to_string(),
                },
            ],
            source_document: SaveSourceDocumentCandidate {
                candidate_id: "save-candidate-candidate-document-qa-docx-file-intake-job"
                    .to_string(),
                file_name: "qa-service-quality-chapter.docx".to_string(),
                file_type: "DOCX".to_string(),
                local_path_policy: "local_path_reference_only".to_string(),
                parser_status: "mock_needs_review".to_string(),
                review: SaveCandidateReviewSnapshot {
                    review_status: "approved".to_string(),
                },
                source_metadata: SaveSourceMetadata {
                    completeness: "missing".to_string(),
                    title: "qa-service-quality-chapter".to_string(),
                },
                title: "qa-service-quality-chapter".to_string(),
                validation_status: "needs_review".to_string(),
            },
            source_document_id: "candidate-document-qa-docx-file-intake-job".to_string(),
            traces: vec![
                SaveExtractionTrace {
                    chunk_reference: "docx:p1".to_string(),
                    page_number: 0,
                    section_title: "Service Quality Overview".to_string(),
                    segment_id: "qa-segment-introduction".to_string(),
                },
                SaveExtractionTrace {
                    chunk_reference: "docx:p2".to_string(),
                    page_number: 0,
                    section_title: "Thai Textbook Explanation".to_string(),
                    segment_id: "qa-segment-theory".to_string(),
                },
            ],
        }
    }

    fn temp_database_path(label: &str) -> PathBuf {
        let mut path = std::env::temp_dir();
        path.push(format!(
            "atp-knowledge-studio-{label}-{}-{}.sqlite",
            std::process::id(),
            unix_millis_now()
        ));

        if Path::new(&path).exists() {
            fs::remove_file(&path).ok();
        }

        path
    }
}
