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
const ADD_SOURCE_CARDS_MIGRATION_ID: &str = "002_add_source_cards";
const ADD_SOURCE_CARDS_MIGRATION_SQL: &str = include_str!("../migrations/002_add_source_cards.sql");
const ADD_MARKETING_TAGS_MIGRATION_ID: &str = "003_add_marketing_tags";
const ADD_MARKETING_TAGS_MIGRATION_SQL: &str =
    include_str!("../migrations/003_add_marketing_tags.sql");
const ADD_KNOWLEDGE_CARDS_MIGRATION_ID: &str = "004_add_knowledge_cards";
const ADD_KNOWLEDGE_CARDS_MIGRATION_SQL: &str =
    include_str!("../migrations/004_add_knowledge_cards.sql");

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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSourceCardRequest {
    authors: Option<String>,
    linked_source_document_id: String,
    source_card: SaveSourceCardCandidate,
    source_card_id: String,
    year: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSourceCardCandidate {
    candidate_id: String,
    citation_readiness: String,
    citation_text: String,
    file_reference: String,
    metadata_status: String,
    review: SaveCandidateReviewSnapshot,
    source_type: String,
    title: String,
    validation_status: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSourceCardResult {
    blockers: Vec<String>,
    db_path: String,
    saved: bool,
    source_card_id: String,
    source_document_id: String,
    warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadSavedSourceCardRequest {
    source_card_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceCardListItem {
    source_card_id: String,
    source_document_id: String,
    source_document_title: String,
    title: String,
    source_type: String,
    metadata_status: String,
    citation_readiness: String,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceCardDetail {
    source_card: SavedSourceCardRecord,
    source_document: SavedSourceDocumentCompactReference,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceCardRecord {
    source_card_id: String,
    source_document_id: String,
    title: String,
    authors: Option<String>,
    year: Option<String>,
    source_type: String,
    citation_text: String,
    metadata_status: String,
    citation_readiness: String,
    file_reference: String,
    review_status: String,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceDocumentCompactReference {
    source_document_id: String,
    title: String,
    file_name: String,
    file_type: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveMarketingTagsForSourceCardRequest {
    source_card_id: String,
    tags: Vec<SaveMarketingTagCandidate>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveMarketingTagCandidate {
    category: String,
    label: String,
    review_status: String,
    tag_id: String,
    tier: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveMarketingTagsResult {
    blockers: Vec<String>,
    db_path: String,
    linked_tag_count: usize,
    saved: bool,
    source_card_id: String,
    tag_count: usize,
    warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListSavedTagsForSourceCardRequest {
    source_card_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedMarketingTagRecord {
    category: String,
    label: String,
    review_status: String,
    tag_id: String,
    tier: String,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceCardTagRecord {
    category: String,
    label: String,
    review_status: String,
    source_card_id: String,
    tag_id: String,
    tier: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveKnowledgeCardsForSourceCardRequest {
    cards: Vec<SaveKnowledgeCardCandidate>,
    source_card_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveKnowledgeCardCandidate {
    card_type: String,
    citation_readiness: String,
    content_preview: String,
    knowledge_card_id: String,
    review_status: String,
    tag_ids: Vec<String>,
    title: String,
    trace_reference: Option<SaveKnowledgeCardTraceReference>,
    validation_status: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveKnowledgeCardTraceReference {
    chunk_reference: String,
    page_number: i64,
    page_number_trusted: bool,
    section_title: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveKnowledgeCardsResult {
    blockers: Vec<String>,
    db_path: String,
    knowledge_card_count: usize,
    linked_tag_count: usize,
    saved: bool,
    source_card_id: String,
    trace_ref_count: usize,
    warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListSavedKnowledgeCardsForSourceCardRequest {
    source_card_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadSavedKnowledgeCardRequest {
    knowledge_card_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedKnowledgeCardListItem {
    card_type: String,
    citation_readiness: String,
    created_at: String,
    knowledge_card_id: String,
    source_card_id: String,
    title: String,
    trace_count: i64,
    tag_count: i64,
    updated_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedKnowledgeCardDetail {
    knowledge_card: SavedKnowledgeCardRecord,
    source_card: SavedSourceCardCompactReference,
    tags: Vec<SavedKnowledgeCardTagRecord>,
    traces: Vec<SavedKnowledgeCardTraceRecord>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedKnowledgeCardRecord {
    card_type: String,
    citation_readiness: String,
    content_preview: String,
    created_at: String,
    knowledge_card_id: String,
    review_status: String,
    source_card_id: String,
    title: String,
    trace_readiness: String,
    updated_at: String,
    validation_status: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceCardCompactReference {
    source_card_id: String,
    source_document_id: String,
    title: String,
    source_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedKnowledgeCardTagRecord {
    category: String,
    label: String,
    review_status: String,
    tag_id: String,
    tier: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedKnowledgeCardTraceRecord {
    chunk_reference: String,
    page_number: Option<i64>,
    page_number_trusted: bool,
    section_title: Option<String>,
    trace_id: String,
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

#[tauri::command]
pub fn save_source_card_candidate(
    app: tauri::AppHandle,
    request: SaveSourceCardRequest,
) -> Result<SaveSourceCardResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    save_source_card_candidate_to_connection(&mut connection, db_path, request)
}

#[tauri::command]
pub fn list_saved_source_cards(
    app: tauri::AppHandle,
) -> Result<Vec<SavedSourceCardListItem>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    list_saved_source_cards_from_connection(&connection)
}

#[tauri::command]
pub fn read_saved_source_card(
    app: tauri::AppHandle,
    request: ReadSavedSourceCardRequest,
) -> Result<SavedSourceCardDetail, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    read_saved_source_card_from_connection(&connection, &request.source_card_id)
}

#[tauri::command]
pub fn save_marketing_tags_for_source_card(
    app: tauri::AppHandle,
    request: SaveMarketingTagsForSourceCardRequest,
) -> Result<SaveMarketingTagsResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    save_marketing_tags_for_source_card_to_connection(&mut connection, db_path, request)
}

#[tauri::command]
pub fn list_saved_marketing_tags(
    app: tauri::AppHandle,
) -> Result<Vec<SavedMarketingTagRecord>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    list_saved_marketing_tags_from_connection(&connection)
}

#[tauri::command]
pub fn list_saved_tags_for_source_card(
    app: tauri::AppHandle,
    request: ListSavedTagsForSourceCardRequest,
) -> Result<Vec<SavedSourceCardTagRecord>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    list_saved_tags_for_source_card_from_connection(&connection, &request.source_card_id)
}

#[tauri::command]
pub fn save_knowledge_cards_for_source_card(
    app: tauri::AppHandle,
    request: SaveKnowledgeCardsForSourceCardRequest,
) -> Result<SaveKnowledgeCardsResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    save_knowledge_cards_for_source_card_to_connection(&mut connection, db_path, request)
}

#[tauri::command]
pub fn list_saved_knowledge_cards(
    app: tauri::AppHandle,
) -> Result<Vec<SavedKnowledgeCardListItem>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    list_saved_knowledge_cards_from_connection(&connection)
}

#[tauri::command]
pub fn list_saved_knowledge_cards_for_source_card(
    app: tauri::AppHandle,
    request: ListSavedKnowledgeCardsForSourceCardRequest,
) -> Result<Vec<SavedKnowledgeCardListItem>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    list_saved_knowledge_cards_for_source_card_from_connection(&connection, &request.source_card_id)
}

#[tauri::command]
pub fn read_saved_knowledge_card(
    app: tauri::AppHandle,
    request: ReadSavedKnowledgeCardRequest,
) -> Result<SavedKnowledgeCardDetail, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    read_saved_knowledge_card_from_connection(&connection, &request.knowledge_card_id)
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

    if current_version < 2 {
        connection
            .execute_batch(ADD_SOURCE_CARDS_MIGRATION_SQL)
            .map_err(|error| format!("Unable to apply SourceCard SQLite migration: {error}"))?;
        applied_migrations.push(ADD_SOURCE_CARDS_MIGRATION_ID.to_string());
    }

    if current_version < 3 {
        connection
            .execute_batch(ADD_MARKETING_TAGS_MIGRATION_SQL)
            .map_err(|error| format!("Unable to apply MarketingTag SQLite migration: {error}"))?;
        applied_migrations.push(ADD_MARKETING_TAGS_MIGRATION_ID.to_string());
    }

    if current_version < 4 {
        connection
            .execute_batch(ADD_KNOWLEDGE_CARDS_MIGRATION_SQL)
            .map_err(|error| format!("Unable to apply KnowledgeCard SQLite migration: {error}"))?;
        applied_migrations.push(ADD_KNOWLEDGE_CARDS_MIGRATION_ID.to_string());
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

fn save_source_card_candidate_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: SaveSourceCardRequest,
) -> Result<SaveSourceCardResult, String> {
    let validation = validate_source_card_save_request(connection, &request)?;

    if !validation.blockers.is_empty() {
        return Ok(SaveSourceCardResult {
            blockers: validation.blockers,
            db_path: db_path.to_string_lossy().to_string(),
            saved: false,
            source_card_id: request.source_card_id,
            source_document_id: request.linked_source_document_id,
            warnings: validation.warnings,
        });
    }

    let saved_at = create_unix_millis_timestamp();
    let tx = connection
        .transaction()
        .map_err(|error| format!("Unable to start SourceCard save transaction: {error}"))?;

    tx.execute(
        "INSERT INTO source_cards (
            id,
            source_document_id,
            title,
            authors,
            year,
            source_type,
            citation_text,
            metadata_status,
            citation_readiness,
            file_reference,
            review_status,
            created_from_candidate_id,
            created_at,
            updated_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)
        ON CONFLICT(id) DO UPDATE SET
            source_document_id = excluded.source_document_id,
            title = excluded.title,
            authors = excluded.authors,
            year = excluded.year,
            source_type = excluded.source_type,
            citation_text = excluded.citation_text,
            metadata_status = excluded.metadata_status,
            citation_readiness = excluded.citation_readiness,
            file_reference = excluded.file_reference,
            review_status = excluded.review_status,
            created_from_candidate_id = excluded.created_from_candidate_id,
            updated_at = excluded.updated_at",
        params![
            request.source_card_id,
            request.linked_source_document_id,
            request.source_card.title,
            normalize_optional_text(request.authors.as_deref()),
            normalize_optional_text(request.year.as_deref()),
            request.source_card.source_type,
            request.source_card.citation_text,
            request.source_card.metadata_status,
            request.source_card.citation_readiness,
            request.source_card.file_reference,
            request.source_card.review.review_status,
            request.source_card.candidate_id,
            saved_at
        ],
    )
    .map_err(|error| format!("Unable to save SourceCard metadata: {error}"))?;

    tx.commit()
        .map_err(|error| format!("Unable to commit SourceCard save transaction: {error}"))?;

    Ok(SaveSourceCardResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        saved: true,
        source_card_id: request.source_card_id,
        source_document_id: request.linked_source_document_id,
        warnings: validation.warnings,
    })
}

fn list_saved_source_cards_from_connection(
    connection: &Connection,
) -> Result<Vec<SavedSourceCardListItem>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                sc.id,
                sc.source_document_id,
                sd.title,
                sc.title,
                sc.source_type,
                sc.metadata_status,
                sc.citation_readiness,
                sc.created_at,
                sc.updated_at
            FROM source_cards sc
            INNER JOIN source_documents sd ON sd.id = sc.source_document_id
            ORDER BY sc.updated_at DESC",
        )
        .map_err(|error| format!("Unable to prepare saved SourceCard list: {error}"))?;

    let rows = statement
        .query_map([], |row| {
            Ok(SavedSourceCardListItem {
                source_card_id: row.get(0)?,
                source_document_id: row.get(1)?,
                source_document_title: row.get(2)?,
                title: row.get(3)?,
                source_type: row.get(4)?,
                metadata_status: row.get(5)?,
                citation_readiness: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|error| format!("Unable to read saved SourceCard list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map saved SourceCard list: {error}"))
}

fn read_saved_source_card_from_connection(
    connection: &Connection,
    source_card_id: &str,
) -> Result<SavedSourceCardDetail, String> {
    let trimmed_id = source_card_id.trim();

    if trimmed_id.is_empty() {
        return Err("sourceCardId is required.".to_string());
    }

    connection
        .query_row(
            "SELECT
                sc.id,
                sc.source_document_id,
                sc.title,
                sc.authors,
                sc.year,
                sc.source_type,
                sc.citation_text,
                sc.metadata_status,
                sc.citation_readiness,
                sc.file_reference,
                sc.review_status,
                sc.created_at,
                sc.updated_at,
                sd.title,
                sd.file_name,
                sd.file_type
            FROM source_cards sc
            INNER JOIN source_documents sd ON sd.id = sc.source_document_id
            WHERE sc.id = ?1",
            params![trimmed_id],
            |row| {
                let source_document_id = row.get::<_, String>(1)?;

                Ok(SavedSourceCardDetail {
                    source_card: SavedSourceCardRecord {
                        source_card_id: row.get(0)?,
                        source_document_id: source_document_id.clone(),
                        title: row.get(2)?,
                        authors: row.get(3)?,
                        year: row.get(4)?,
                        source_type: row.get(5)?,
                        citation_text: row.get(6)?,
                        metadata_status: row.get(7)?,
                        citation_readiness: row.get(8)?,
                        file_reference: row.get(9)?,
                        review_status: row.get(10)?,
                        created_at: row.get(11)?,
                        updated_at: row.get(12)?,
                    },
                    source_document: SavedSourceDocumentCompactReference {
                        source_document_id,
                        title: row.get(13)?,
                        file_name: row.get(14)?,
                        file_type: row.get(15)?,
                    },
                })
            },
        )
        .optional()
        .map_err(|error| format!("Unable to read saved SourceCard: {error}"))?
        .ok_or_else(|| format!("Saved SourceCard not found: {trimmed_id}"))
}

fn normalize_optional_text(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|trimmed| !trimmed.is_empty())
        .map(ToString::to_string)
}

fn source_document_exists(
    connection: &Connection,
    source_document_id: &str,
) -> Result<bool, String> {
    connection
        .query_row(
            "SELECT 1 FROM source_documents WHERE id = ?1",
            params![source_document_id],
            |_| Ok(()),
        )
        .optional()
        .map(|value| value.is_some())
        .map_err(|error| format!("Unable to verify linked SourceDocument root: {error}"))
}

fn save_marketing_tags_for_source_card_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: SaveMarketingTagsForSourceCardRequest,
) -> Result<SaveMarketingTagsResult, String> {
    let validation = validate_marketing_tag_save_request(connection, &request)?;

    if !validation.blockers.is_empty() {
        return Ok(SaveMarketingTagsResult {
            blockers: validation.blockers,
            db_path: db_path.to_string_lossy().to_string(),
            linked_tag_count: 0,
            saved: false,
            source_card_id: request.source_card_id,
            tag_count: 0,
            warnings: validation.warnings,
        });
    }

    let approved_tags = request
        .tags
        .iter()
        .filter(|tag| tag.review_status == "approved")
        .collect::<Vec<_>>();
    let saved_at = create_unix_millis_timestamp();
    let tx = connection
        .transaction()
        .map_err(|error| format!("Unable to start MarketingTag save transaction: {error}"))?;

    for tag in &approved_tags {
        tx.execute(
            "INSERT INTO marketing_tags (
                id,
                label,
                tier,
                category,
                review_status,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
            ON CONFLICT(id) DO UPDATE SET
                label = excluded.label,
                tier = excluded.tier,
                category = excluded.category,
                review_status = excluded.review_status,
                updated_at = excluded.updated_at",
            params![
                tag.tag_id,
                tag.label,
                tag.tier,
                tag.category,
                tag.review_status,
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to save MarketingTag metadata: {error}"))?;

        tx.execute(
            "INSERT INTO source_card_tags (
                source_card_id,
                marketing_tag_id,
                review_status,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?4)
            ON CONFLICT(source_card_id, marketing_tag_id) DO UPDATE SET
                review_status = excluded.review_status,
                updated_at = excluded.updated_at",
            params![
                request.source_card_id,
                tag.tag_id,
                tag.review_status,
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to link MarketingTag to SourceCard: {error}"))?;
    }

    tx.commit()
        .map_err(|error| format!("Unable to commit MarketingTag save transaction: {error}"))?;

    Ok(SaveMarketingTagsResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        linked_tag_count: approved_tags.len(),
        saved: true,
        source_card_id: request.source_card_id,
        tag_count: approved_tags.len(),
        warnings: validation.warnings,
    })
}

fn list_saved_marketing_tags_from_connection(
    connection: &Connection,
) -> Result<Vec<SavedMarketingTagRecord>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, label, tier, category, review_status, created_at, updated_at
            FROM marketing_tags
            ORDER BY label ASC",
        )
        .map_err(|error| format!("Unable to prepare saved MarketingTag list: {error}"))?;

    let rows = statement
        .query_map([], |row| {
            Ok(SavedMarketingTagRecord {
                tag_id: row.get(0)?,
                label: row.get(1)?,
                tier: row.get(2)?,
                category: row.get(3)?,
                review_status: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|error| format!("Unable to read saved MarketingTag list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map saved MarketingTag list: {error}"))
}

fn list_saved_tags_for_source_card_from_connection(
    connection: &Connection,
    source_card_id: &str,
) -> Result<Vec<SavedSourceCardTagRecord>, String> {
    let trimmed_id = source_card_id.trim();

    if trimmed_id.is_empty() {
        return Err("sourceCardId is required.".to_string());
    }

    let mut statement = connection
        .prepare(
            "SELECT
                sct.source_card_id,
                mt.id,
                mt.label,
                mt.tier,
                mt.category,
                sct.review_status
            FROM source_card_tags sct
            INNER JOIN marketing_tags mt ON mt.id = sct.marketing_tag_id
            WHERE sct.source_card_id = ?1
            ORDER BY mt.label ASC",
        )
        .map_err(|error| format!("Unable to prepare SourceCard tag list: {error}"))?;

    let rows = statement
        .query_map(params![trimmed_id], |row| {
            Ok(SavedSourceCardTagRecord {
                source_card_id: row.get(0)?,
                tag_id: row.get(1)?,
                label: row.get(2)?,
                tier: row.get(3)?,
                category: row.get(4)?,
                review_status: row.get(5)?,
            })
        })
        .map_err(|error| format!("Unable to read SourceCard tag list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map SourceCard tag list: {error}"))
}

fn save_knowledge_cards_for_source_card_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: SaveKnowledgeCardsForSourceCardRequest,
) -> Result<SaveKnowledgeCardsResult, String> {
    let validation = validate_knowledge_card_save_request(connection, &request)?;

    if !validation.blockers.is_empty() {
        return Ok(SaveKnowledgeCardsResult {
            blockers: validation.blockers,
            db_path: db_path.to_string_lossy().to_string(),
            knowledge_card_count: 0,
            linked_tag_count: 0,
            saved: false,
            source_card_id: request.source_card_id,
            trace_ref_count: 0,
            warnings: validation.warnings,
        });
    }

    let approved_cards = request
        .cards
        .iter()
        .filter(|card| card.review_status == "approved")
        .collect::<Vec<_>>();
    let saved_at = create_unix_millis_timestamp();
    let tx = connection
        .transaction()
        .map_err(|error| format!("Unable to start KnowledgeCard save transaction: {error}"))?;
    let mut linked_tag_count = 0;
    let mut trace_ref_count = 0;

    for card in &approved_cards {
        let trace_readiness = if card.trace_reference.is_some() {
            "ready"
        } else {
            "needs_review"
        };

        tx.execute(
            "INSERT INTO knowledge_cards (
                id,
                source_card_id,
                card_type,
                title,
                content_preview,
                citation_readiness,
                trace_readiness,
                review_status,
                validation_status,
                created_from_candidate_id,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?1, ?10, ?10)
            ON CONFLICT(id) DO UPDATE SET
                source_card_id = excluded.source_card_id,
                card_type = excluded.card_type,
                title = excluded.title,
                content_preview = excluded.content_preview,
                citation_readiness = excluded.citation_readiness,
                trace_readiness = excluded.trace_readiness,
                review_status = excluded.review_status,
                validation_status = excluded.validation_status,
                updated_at = excluded.updated_at",
            params![
                card.knowledge_card_id,
                request.source_card_id,
                card.card_type,
                card.title,
                card.content_preview,
                card.citation_readiness,
                trace_readiness,
                card.review_status,
                card.validation_status,
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to save KnowledgeCard metadata: {error}"))?;

        tx.execute(
            "DELETE FROM knowledge_card_traces WHERE knowledge_card_id = ?1",
            params![card.knowledge_card_id],
        )
        .map_err(|error| format!("Unable to refresh KnowledgeCard trace links: {error}"))?;

        if let Some(trace) = &card.trace_reference {
            tx.execute(
                "INSERT INTO knowledge_card_traces (
                    id,
                    knowledge_card_id,
                    chunk_reference,
                    page_number,
                    page_number_trusted,
                    section_title,
                    created_at
                )
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    format!(
                        "{}::trace::{}",
                        card.knowledge_card_id, trace.chunk_reference
                    ),
                    card.knowledge_card_id,
                    trace.chunk_reference,
                    trusted_page_number(trace.page_number, trace.page_number_trusted),
                    if trace.page_number_trusted { 1 } else { 0 },
                    trace.section_title,
                    saved_at
                ],
            )
            .map_err(|error| format!("Unable to save KnowledgeCard trace reference: {error}"))?;
            trace_ref_count += 1;
        }

        for tag_id in &card.tag_ids {
            tx.execute(
                "INSERT INTO knowledge_card_tags (
                    knowledge_card_id,
                    marketing_tag_id,
                    review_status,
                    created_at,
                    updated_at
                )
                VALUES (?1, ?2, ?3, ?4, ?4)
                ON CONFLICT(knowledge_card_id, marketing_tag_id) DO UPDATE SET
                    review_status = excluded.review_status,
                    updated_at = excluded.updated_at",
                params![card.knowledge_card_id, tag_id, "approved", saved_at],
            )
            .map_err(|error| format!("Unable to link MarketingTag to KnowledgeCard: {error}"))?;
            linked_tag_count += 1;
        }
    }

    tx.commit()
        .map_err(|error| format!("Unable to commit KnowledgeCard save transaction: {error}"))?;

    Ok(SaveKnowledgeCardsResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        knowledge_card_count: approved_cards.len(),
        linked_tag_count,
        saved: true,
        source_card_id: request.source_card_id,
        trace_ref_count,
        warnings: validation.warnings,
    })
}

fn list_saved_knowledge_cards_from_connection(
    connection: &Connection,
) -> Result<Vec<SavedKnowledgeCardListItem>, String> {
    list_saved_knowledge_cards_with_filter(connection, None)
}

fn list_saved_knowledge_cards_for_source_card_from_connection(
    connection: &Connection,
    source_card_id: &str,
) -> Result<Vec<SavedKnowledgeCardListItem>, String> {
    let trimmed_id = source_card_id.trim();

    if trimmed_id.is_empty() {
        return Err("sourceCardId is required.".to_string());
    }

    list_saved_knowledge_cards_with_filter(connection, Some(trimmed_id))
}

fn list_saved_knowledge_cards_with_filter(
    connection: &Connection,
    source_card_id: Option<&str>,
) -> Result<Vec<SavedKnowledgeCardListItem>, String> {
    let (sql, params): (&str, Vec<&str>) = if let Some(source_card_id) = source_card_id {
        (
            "SELECT
                kc.id,
                kc.source_card_id,
                kc.card_type,
                kc.title,
                kc.citation_readiness,
                kc.created_at,
                kc.updated_at,
                COUNT(DISTINCT kct.id) AS trace_count,
                COUNT(DISTINCT ktag.marketing_tag_id) AS tag_count
            FROM knowledge_cards kc
            LEFT JOIN knowledge_card_traces kct ON kct.knowledge_card_id = kc.id
            LEFT JOIN knowledge_card_tags ktag ON ktag.knowledge_card_id = kc.id
            WHERE kc.source_card_id = ?1
            GROUP BY kc.id
            ORDER BY kc.created_at DESC, kc.title ASC",
            vec![source_card_id],
        )
    } else {
        (
            "SELECT
                kc.id,
                kc.source_card_id,
                kc.card_type,
                kc.title,
                kc.citation_readiness,
                kc.created_at,
                kc.updated_at,
                COUNT(DISTINCT kct.id) AS trace_count,
                COUNT(DISTINCT ktag.marketing_tag_id) AS tag_count
            FROM knowledge_cards kc
            LEFT JOIN knowledge_card_traces kct ON kct.knowledge_card_id = kc.id
            LEFT JOIN knowledge_card_tags ktag ON ktag.knowledge_card_id = kc.id
            GROUP BY kc.id
            ORDER BY kc.created_at DESC, kc.title ASC",
            Vec::new(),
        )
    };

    let mut statement = connection
        .prepare(sql)
        .map_err(|error| format!("Unable to prepare saved KnowledgeCard list: {error}"))?;
    let rows = statement
        .query_map(rusqlite::params_from_iter(params), |row| {
            Ok(SavedKnowledgeCardListItem {
                knowledge_card_id: row.get(0)?,
                source_card_id: row.get(1)?,
                card_type: row.get(2)?,
                title: row.get(3)?,
                citation_readiness: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                trace_count: row.get(7)?,
                tag_count: row.get(8)?,
            })
        })
        .map_err(|error| format!("Unable to read saved KnowledgeCard list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map saved KnowledgeCard list: {error}"))
}

fn read_saved_knowledge_card_from_connection(
    connection: &Connection,
    knowledge_card_id: &str,
) -> Result<SavedKnowledgeCardDetail, String> {
    let trimmed_id = knowledge_card_id.trim();

    if trimmed_id.is_empty() {
        return Err("knowledgeCardId is required.".to_string());
    }

    let (knowledge_card, source_card) = connection
        .query_row(
            "SELECT
                kc.id,
                kc.source_card_id,
                kc.card_type,
                kc.title,
                kc.content_preview,
                kc.citation_readiness,
                kc.trace_readiness,
                kc.review_status,
                kc.validation_status,
                kc.created_at,
                kc.updated_at,
                sc.source_document_id,
                sc.title,
                sc.source_type
            FROM knowledge_cards kc
            INNER JOIN source_cards sc ON sc.id = kc.source_card_id
            WHERE kc.id = ?1",
            params![trimmed_id],
            |row| {
                let source_card_id: String = row.get(1)?;
                Ok((
                    SavedKnowledgeCardRecord {
                        knowledge_card_id: row.get(0)?,
                        source_card_id: source_card_id.clone(),
                        card_type: row.get(2)?,
                        title: row.get(3)?,
                        content_preview: row.get(4)?,
                        citation_readiness: row.get(5)?,
                        trace_readiness: row.get(6)?,
                        review_status: row.get(7)?,
                        validation_status: row.get(8)?,
                        created_at: row.get(9)?,
                        updated_at: row.get(10)?,
                    },
                    SavedSourceCardCompactReference {
                        source_card_id,
                        source_document_id: row.get(11)?,
                        title: row.get(12)?,
                        source_type: row.get(13)?,
                    },
                ))
            },
        )
        .optional()
        .map_err(|error| format!("Unable to read saved KnowledgeCard: {error}"))?
        .ok_or_else(|| format!("Saved KnowledgeCard not found: {trimmed_id}"))?;

    Ok(SavedKnowledgeCardDetail {
        tags: list_saved_tags_for_knowledge_card_from_connection(connection, trimmed_id)?,
        traces: list_saved_traces_for_knowledge_card_from_connection(connection, trimmed_id)?,
        knowledge_card,
        source_card,
    })
}

fn list_saved_tags_for_knowledge_card_from_connection(
    connection: &Connection,
    knowledge_card_id: &str,
) -> Result<Vec<SavedKnowledgeCardTagRecord>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                mt.id,
                mt.label,
                mt.tier,
                mt.category,
                kct.review_status
            FROM knowledge_card_tags kct
            INNER JOIN marketing_tags mt ON mt.id = kct.marketing_tag_id
            WHERE kct.knowledge_card_id = ?1
            ORDER BY mt.label ASC",
        )
        .map_err(|error| format!("Unable to prepare KnowledgeCard tag list: {error}"))?;
    let rows = statement
        .query_map(params![knowledge_card_id], |row| {
            Ok(SavedKnowledgeCardTagRecord {
                tag_id: row.get(0)?,
                label: row.get(1)?,
                tier: row.get(2)?,
                category: row.get(3)?,
                review_status: row.get(4)?,
            })
        })
        .map_err(|error| format!("Unable to read KnowledgeCard tag list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map KnowledgeCard tag list: {error}"))
}

fn list_saved_traces_for_knowledge_card_from_connection(
    connection: &Connection,
    knowledge_card_id: &str,
) -> Result<Vec<SavedKnowledgeCardTraceRecord>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                id,
                chunk_reference,
                page_number,
                page_number_trusted,
                section_title
            FROM knowledge_card_traces
            WHERE knowledge_card_id = ?1
            ORDER BY chunk_reference ASC",
        )
        .map_err(|error| format!("Unable to prepare KnowledgeCard trace list: {error}"))?;
    let rows = statement
        .query_map(params![knowledge_card_id], |row| {
            Ok(SavedKnowledgeCardTraceRecord {
                trace_id: row.get(0)?,
                chunk_reference: row.get(1)?,
                page_number: row.get(2)?,
                page_number_trusted: row.get::<_, i64>(3)? == 1,
                section_title: row.get(4)?,
            })
        })
        .map_err(|error| format!("Unable to read KnowledgeCard trace list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map KnowledgeCard trace list: {error}"))
}

fn source_card_exists(connection: &Connection, source_card_id: &str) -> Result<bool, String> {
    connection
        .query_row(
            "SELECT 1 FROM source_cards WHERE id = ?1",
            params![source_card_id],
            |_| Ok(()),
        )
        .optional()
        .map(|value| value.is_some())
        .map_err(|error| format!("Unable to verify linked SourceCard root: {error}"))
}

fn marketing_tag_exists(connection: &Connection, tag_id: &str) -> Result<bool, String> {
    connection
        .query_row(
            "SELECT 1 FROM marketing_tags WHERE id = ?1",
            params![tag_id],
            |_| Ok(()),
        )
        .optional()
        .map(|value| value.is_some())
        .map_err(|error| format!("Unable to verify linked MarketingTag root: {error}"))
}

struct SaveRequestValidation {
    blockers: Vec<String>,
    warnings: Vec<String>,
}

fn validate_marketing_tag_save_request(
    connection: &Connection,
    request: &SaveMarketingTagsForSourceCardRequest,
) -> Result<SaveRequestValidation, String> {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();

    require_text(&mut blockers, "sourceCardId", &request.source_card_id);

    if request.tags.is_empty() {
        blockers.push("At least one marketing tag candidate is required.".to_string());
    }

    for tag in &request.tags {
        require_text(&mut blockers, "tag.tagId", &tag.tag_id);
        require_text(&mut blockers, "tag.label", &tag.label);
        require_text(&mut blockers, "tag.category", &tag.category);

        if !matches!(tag.tier.as_str(), "core" | "extended" | "suggested") {
            blockers.push(format!("MarketingTag tier is unsupported: {}", tag.tier));
        }

        if !matches!(
            tag.review_status.as_str(),
            "approved" | "needs_review" | "rejected"
        ) {
            blockers.push(format!(
                "MarketingTag review status is unsupported: {}",
                tag.review_status
            ));
        }
    }

    let approved_count = request
        .tags
        .iter()
        .filter(|tag| tag.review_status == "approved")
        .count();
    let excluded_count = request.tags.len().saturating_sub(approved_count);

    if approved_count == 0 {
        blockers.push("No approved marketing tags are available to save.".to_string());
    }

    if excluded_count > 0 {
        warnings.push(format!(
            "{excluded_count} marketing tag candidate(s) were excluded because they are not approved."
        ));
    }

    if blockers.is_empty() && !source_card_exists(connection, request.source_card_id.trim())? {
        blockers.push(format!(
            "Linked SourceCard does not exist: {}",
            request.source_card_id
        ));
    }

    Ok(SaveRequestValidation { blockers, warnings })
}

fn validate_knowledge_card_save_request(
    connection: &Connection,
    request: &SaveKnowledgeCardsForSourceCardRequest,
) -> Result<SaveRequestValidation, String> {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();

    require_text(&mut blockers, "sourceCardId", &request.source_card_id);

    if request.cards.is_empty() {
        blockers.push("At least one KnowledgeCard candidate is required.".to_string());
    }

    for card in &request.cards {
        require_text(
            &mut blockers,
            "card.knowledgeCardId",
            &card.knowledge_card_id,
        );
        require_text(&mut blockers, "card.title", &card.title);
        require_text(&mut blockers, "card.contentPreview", &card.content_preview);

        if !matches!(
            card.card_type.as_str(),
            "concept" | "evidence" | "quote" | "case" | "writing_angle"
        ) {
            blockers.push(format!(
                "KnowledgeCard type is unsupported: {}",
                card.card_type
            ));
        }

        if !matches!(
            card.review_status.as_str(),
            "approved" | "needs_review" | "rejected"
        ) {
            blockers.push(format!(
                "KnowledgeCard review status is unsupported: {}",
                card.review_status
            ));
        }

        if !matches!(
            card.citation_readiness.as_str(),
            "ready" | "needs_review" | "blocked"
        ) {
            blockers.push(format!(
                "KnowledgeCard citation readiness is unsupported: {}",
                card.citation_readiness
            ));
        }
    }

    let approved_count = request
        .cards
        .iter()
        .filter(|card| card.review_status == "approved")
        .count();
    let excluded_count = request.cards.len().saturating_sub(approved_count);

    if approved_count == 0 {
        blockers.push("No approved KnowledgeCard candidates are available to save.".to_string());
    }

    if excluded_count > 0 {
        warnings.push(format!(
            "{excluded_count} KnowledgeCard candidate(s) were excluded because they are not approved."
        ));
    }

    if blockers.is_empty() && !source_card_exists(connection, request.source_card_id.trim())? {
        blockers.push(format!(
            "Linked SourceCard does not exist: {}",
            request.source_card_id
        ));
    }

    if blockers.is_empty() {
        for card in request
            .cards
            .iter()
            .filter(|card| card.review_status == "approved")
        {
            if card.trace_reference.is_none()
                && matches!(card.card_type.as_str(), "evidence" | "quote")
            {
                warnings.push(format!(
                    "{} has no trace reference; it was saved with trace readiness needs_review.",
                    card.knowledge_card_id
                ));
            }

            for tag_id in &card.tag_ids {
                if !marketing_tag_exists(connection, tag_id.trim())? {
                    blockers.push(format!(
                        "Linked MarketingTag does not exist for KnowledgeCard {}: {}",
                        card.knowledge_card_id, tag_id
                    ));
                }
            }
        }
    }

    Ok(SaveRequestValidation { blockers, warnings })
}

fn validate_source_card_save_request(
    connection: &Connection,
    request: &SaveSourceCardRequest,
) -> Result<SaveRequestValidation, String> {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();

    require_text(&mut blockers, "sourceCardId", &request.source_card_id);
    require_text(
        &mut blockers,
        "linkedSourceDocumentId",
        &request.linked_source_document_id,
    );
    require_text(
        &mut blockers,
        "sourceCard.candidateId",
        &request.source_card.candidate_id,
    );
    require_text(
        &mut blockers,
        "sourceCard.title",
        &request.source_card.title,
    );
    require_text(
        &mut blockers,
        "sourceCard.sourceType",
        &request.source_card.source_type,
    );
    require_text(
        &mut blockers,
        "sourceCard.citationText",
        &request.source_card.citation_text,
    );
    require_text(
        &mut blockers,
        "sourceCard.fileReference",
        &request.source_card.file_reference,
    );

    if !matches!(
        request.source_card.metadata_status.as_str(),
        "ready" | "needs_metadata" | "blocked"
    ) {
        blockers.push("SourceCard metadata status is unsupported.".to_string());
    }

    if !matches!(
        request.source_card.citation_readiness.as_str(),
        "ready" | "needs_review" | "blocked"
    ) {
        blockers.push("SourceCard citation readiness is unsupported.".to_string());
    }

    if request.source_card.validation_status == "blocked" {
        blockers.push("Blocked SourceCard candidate cannot be saved.".to_string());
    }

    if request.source_card.metadata_status == "blocked" {
        blockers.push("SourceCard metadata is blocked.".to_string());
    }

    if request.source_card.citation_readiness == "blocked" {
        blockers.push("SourceCard citation readiness is blocked.".to_string());
    }

    if request.source_card.review.review_status == "rejected" {
        blockers.push("Rejected SourceCard candidate cannot be saved.".to_string());
    }

    if request.source_card.metadata_status == "needs_metadata" {
        warnings.push(
            "SourceCard metadata is incomplete; authors/year may remain unresolved.".to_string(),
        );
    }

    if request.source_card.citation_readiness == "needs_review" {
        warnings.push("SourceCard citation text still requires citation review.".to_string());
    }

    if normalize_optional_text(request.authors.as_deref()).is_none() {
        warnings.push("SourceCard authors are not resolved yet.".to_string());
    }

    if normalize_optional_text(request.year.as_deref()).is_none() {
        warnings.push("SourceCard year is not resolved yet.".to_string());
    }

    if blockers.is_empty()
        && !source_document_exists(connection, request.linked_source_document_id.trim())?
    {
        blockers.push(format!(
            "Linked SourceDocument does not exist: {}",
            request.linked_source_document_id
        ));
    }

    Ok(SaveRequestValidation { blockers, warnings })
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

fn trusted_page_number(page_number: i64, page_number_trusted: bool) -> Option<i64> {
    if page_number_trusted && page_number > 0 {
        Some(page_number)
    } else {
        None
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
            vec![
                INIT_SOURCE_DOCUMENT_ROOT_MIGRATION_ID.to_string(),
                ADD_SOURCE_CARDS_MIGRATION_ID.to_string(),
                ADD_MARKETING_TAGS_MIGRATION_ID.to_string(),
                ADD_KNOWLEDGE_CARDS_MIGRATION_ID.to_string()
            ]
        );
        assert_eq!(
            read_schema_version(&connection).expect("read schema version"),
            Some(4)
        );
        assert_table_exists(&connection, "schema_version");
        assert_table_exists(&connection, "source_documents");
        assert_table_exists(&connection, "extraction_runs");
        assert_table_exists(&connection, "extraction_segments");
        assert_table_exists(&connection, "evidence_traces");
        assert_table_exists(&connection, "source_cards");
        assert_table_exists(&connection, "marketing_tags");
        assert_table_exists(&connection, "source_card_tags");
        assert_table_exists(&connection, "knowledge_cards");
        assert_table_exists(&connection, "knowledge_card_traces");
        assert_table_exists(&connection, "knowledge_card_tags");

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

        assert_eq!(first_result.len(), 4);
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
        assert_eq!(count_rows(&connection, "source_cards"), 0);
        assert_table_exists(&connection, "knowledge_cards");
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
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
        assert_table_exists(&connection, "source_cards");
        assert_eq!(count_rows(&connection, "source_cards"), 0);
        assert_table_exists(&connection, "knowledge_cards");
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
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
        assert_eq!(count_rows(&connection, "source_cards"), 0);
        assert_table_exists(&connection, "knowledge_cards");
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_table_missing(&connection, "draft_artifacts");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn saves_source_card_linked_to_existing_source_document() {
        let db_path = temp_database_path("source-card-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document");

        let result = save_source_card_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_source_card_save_request(),
        )
        .expect("save source card candidate");

        assert!(result.saved);
        assert_eq!(result.source_card_id, "candidate-source-card-qa");
        assert_eq!(
            result.source_document_id,
            "candidate-document-qa-docx-file-intake-job"
        );
        assert_eq!(count_rows(&connection, "source_cards"), 1);
        assert_table_exists(&connection, "knowledge_cards");
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_table_missing(&connection, "draft_artifacts");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn source_card_save_with_missing_source_document_is_blocked() {
        let db_path = temp_database_path("source-card-missing-root");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let result = save_source_card_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_source_card_save_request(),
        )
        .expect("return blocked source card save result");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("Linked SourceDocument does not exist")));
        assert_eq!(count_rows(&connection, "source_cards"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn duplicate_source_card_save_is_idempotent() {
        let db_path = temp_database_path("source-card-duplicate-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document");

        save_source_card_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_source_card_save_request(),
        )
        .expect("first source card save");
        save_source_card_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_source_card_save_request(),
        )
        .expect("duplicate source card save");

        assert_eq!(count_rows(&connection, "source_cards"), 1);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn list_and_read_saved_source_cards_work() {
        let db_path = temp_database_path("source-card-read-list");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document");
        save_source_card_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_source_card_save_request(),
        )
        .expect("save source card");

        let saved_source_cards =
            list_saved_source_cards_from_connection(&connection).expect("list source cards");
        let detail =
            read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
                .expect("read source card detail");

        assert_eq!(saved_source_cards.len(), 1);
        assert_eq!(
            saved_source_cards[0].source_card_id,
            "candidate-source-card-qa"
        );
        assert_eq!(
            saved_source_cards[0].source_document_id,
            "candidate-document-qa-docx-file-intake-job"
        );
        assert_eq!(
            detail.source_card.source_card_id,
            "candidate-source-card-qa"
        );
        assert_eq!(
            detail.source_document.source_document_id,
            "candidate-document-qa-docx-file-intake-job"
        );
        assert_eq!(detail.source_card.authors, None);
        assert_eq!(detail.source_card.year, None);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn source_card_save_does_not_require_tag_knowledge_or_draft_tables() {
        let db_path = temp_database_path("source-card-without-downstream-tables");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        assert_table_exists(&connection, "source_cards");
        assert_table_exists(&connection, "marketing_tags");
        assert_table_exists(&connection, "source_card_tags");
        assert_eq!(count_rows(&connection, "marketing_tags"), 0);
        assert_eq!(count_rows(&connection, "source_card_tags"), 0);
        assert_table_exists(&connection, "knowledge_cards");
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_table_missing(&connection, "draft_artifacts");
        save_source_document_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("save source document");

        let result = save_source_card_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_source_card_save_request(),
        )
        .expect("save source card");

        assert!(result.saved);
        assert_eq!(count_rows(&connection, "source_cards"), 1);
        assert_eq!(count_rows(&connection, "marketing_tags"), 0);
        assert_eq!(count_rows(&connection, "source_card_tags"), 0);
        assert_table_exists(&connection, "knowledge_cards");
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_table_missing(&connection, "draft_artifacts");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn saves_approved_marketing_tags_linked_to_existing_source_card() {
        let db_path = temp_database_path("marketing-tags-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());

        let result = save_marketing_tags_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_marketing_tag_save_request(),
        )
        .expect("save marketing tags");

        assert!(result.saved);
        assert_eq!(result.source_card_id, "candidate-source-card-qa");
        assert_eq!(result.tag_count, 2);
        assert_eq!(result.linked_tag_count, 2);
        assert_eq!(count_rows(&connection, "marketing_tags"), 2);
        assert_eq!(count_rows(&connection, "source_card_tags"), 2);
        assert_table_exists(&connection, "knowledge_cards");
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_table_missing(&connection, "draft_artifacts");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn marketing_tag_save_excludes_rejected_and_needs_review_candidates() {
        let db_path = temp_database_path("marketing-tags-exclude-unapproved");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());

        let result = save_marketing_tags_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            mixed_marketing_tag_save_request(),
        )
        .expect("save approved marketing tags only");

        assert!(result.saved);
        assert_eq!(result.tag_count, 1);
        assert_eq!(result.linked_tag_count, 1);
        assert!(result
            .warnings
            .iter()
            .any(|warning| warning.contains("2 marketing tag candidate(s) were excluded")));
        assert_eq!(count_rows(&connection, "marketing_tags"), 1);
        assert_eq!(count_rows(&connection, "source_card_tags"), 1);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn marketing_tag_save_with_missing_source_card_is_blocked() {
        let db_path = temp_database_path("marketing-tags-missing-source-card");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let result = save_marketing_tags_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_marketing_tag_save_request(),
        )
        .expect("return blocked marketing tag save result");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("Linked SourceCard does not exist")));
        assert_eq!(count_rows(&connection, "marketing_tags"), 0);
        assert_eq!(count_rows(&connection, "source_card_tags"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn duplicate_marketing_tag_save_is_idempotent() {
        let db_path = temp_database_path("marketing-tags-duplicate-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());

        save_marketing_tags_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_marketing_tag_save_request(),
        )
        .expect("first marketing tag save");
        save_marketing_tags_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_marketing_tag_save_request(),
        )
        .expect("duplicate marketing tag save");

        assert_eq!(count_rows(&connection, "marketing_tags"), 2);
        assert_eq!(count_rows(&connection, "source_card_tags"), 2);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn list_saved_marketing_tags_and_source_card_tag_links_work() {
        let db_path = temp_database_path("marketing-tags-read-list");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        save_marketing_tags_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_marketing_tag_save_request(),
        )
        .expect("save marketing tags");

        let saved_tags = list_saved_marketing_tags_from_connection(&connection).expect("list tags");
        let linked_tags = list_saved_tags_for_source_card_from_connection(
            &connection,
            "candidate-source-card-qa",
        )
        .expect("list source card tags");

        assert_eq!(saved_tags.len(), 2);
        assert!(saved_tags
            .iter()
            .any(|tag| tag.label == "service quality" && tag.tier == "core"));
        assert_eq!(linked_tags.len(), 2);
        assert!(linked_tags
            .iter()
            .all(|tag| tag.source_card_id == "candidate-source-card-qa"));
        assert!(linked_tags
            .iter()
            .all(|tag| tag.review_status == "approved"));

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn marketing_tag_save_does_not_require_knowledge_or_draft_tables() {
        let db_path = temp_database_path("marketing-tags-without-downstream-tables");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        assert_table_exists(&connection, "knowledge_cards");
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_table_missing(&connection, "draft_artifacts");
        seed_source_document_and_card(&mut connection, db_path.clone());

        let result = save_marketing_tags_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_marketing_tag_save_request(),
        )
        .expect("save marketing tags");

        assert!(result.saved);
        assert_eq!(count_rows(&connection, "marketing_tags"), 2);
        assert_eq!(count_rows(&connection, "source_card_tags"), 2);
        assert_table_exists(&connection, "knowledge_cards");
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_table_missing(&connection, "draft_artifacts");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn saves_approved_knowledge_cards_linked_to_existing_source_card() {
        let db_path = temp_database_path("knowledge-cards-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_card_and_tags(&mut connection, db_path.clone());

        let result = save_knowledge_cards_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_knowledge_card_save_request(),
        )
        .expect("save knowledge cards");

        assert!(result.saved);
        assert_eq!(result.source_card_id, "candidate-source-card-qa");
        assert_eq!(result.knowledge_card_count, 2);
        assert_eq!(result.trace_ref_count, 2);
        assert_eq!(result.linked_tag_count, 2);
        assert_eq!(count_rows(&connection, "knowledge_cards"), 2);
        assert_eq!(count_rows(&connection, "knowledge_card_traces"), 2);
        assert_eq!(count_rows(&connection, "knowledge_card_tags"), 2);
        assert_table_missing(&connection, "draft_artifacts");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn knowledge_card_save_excludes_rejected_and_needs_review_candidates() {
        let db_path = temp_database_path("knowledge-cards-exclude-unapproved");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_card_and_tags(&mut connection, db_path.clone());

        let result = save_knowledge_cards_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            mixed_knowledge_card_save_request(),
        )
        .expect("save approved knowledge cards only");

        assert!(result.saved);
        assert_eq!(result.knowledge_card_count, 1);
        assert_eq!(result.trace_ref_count, 1);
        assert!(result
            .warnings
            .iter()
            .any(|warning| warning.contains("2 KnowledgeCard candidate(s) were excluded")));
        assert_eq!(count_rows(&connection, "knowledge_cards"), 1);
        assert_eq!(count_rows(&connection, "knowledge_card_traces"), 1);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn knowledge_card_save_with_missing_source_card_is_blocked() {
        let db_path = temp_database_path("knowledge-cards-missing-source-card");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let result = save_knowledge_cards_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_knowledge_card_save_request(),
        )
        .expect("return blocked knowledge card save result");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("Linked SourceCard does not exist")));
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_eq!(count_rows(&connection, "knowledge_card_traces"), 0);
        assert_eq!(count_rows(&connection, "knowledge_card_tags"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn duplicate_knowledge_card_save_is_idempotent() {
        let db_path = temp_database_path("knowledge-cards-duplicate-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_card_and_tags(&mut connection, db_path.clone());

        save_knowledge_cards_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_knowledge_card_save_request(),
        )
        .expect("first knowledge card save");
        save_knowledge_cards_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_knowledge_card_save_request(),
        )
        .expect("duplicate knowledge card save");

        assert_eq!(count_rows(&connection, "knowledge_cards"), 2);
        assert_eq!(count_rows(&connection, "knowledge_card_traces"), 2);
        assert_eq!(count_rows(&connection, "knowledge_card_tags"), 2);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn list_and_read_saved_knowledge_cards_work() {
        let db_path = temp_database_path("knowledge-cards-read-list");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_card_and_tags(&mut connection, db_path.clone());
        save_knowledge_cards_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_knowledge_card_save_request(),
        )
        .expect("save knowledge cards");

        let saved_cards =
            list_saved_knowledge_cards_from_connection(&connection).expect("list cards");
        let source_card_cards = list_saved_knowledge_cards_for_source_card_from_connection(
            &connection,
            "candidate-source-card-qa",
        )
        .expect("list cards for source card");
        let detail =
            read_saved_knowledge_card_from_connection(&connection, "knowledge-card-concept-qa")
                .expect("read knowledge card detail");

        assert_eq!(saved_cards.len(), 2);
        assert_eq!(source_card_cards.len(), 2);
        assert_eq!(
            detail.knowledge_card.knowledge_card_id,
            "knowledge-card-concept-qa"
        );
        assert_eq!(
            detail.source_card.source_card_id,
            "candidate-source-card-qa"
        );
        assert_eq!(detail.tags.len(), 1);
        assert_eq!(detail.traces.len(), 1);
        assert_eq!(detail.traces[0].chunk_reference, "docx:p1");
        assert_eq!(detail.traces[0].page_number, None);
        assert!(!detail.traces[0].page_number_trusted);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn knowledge_card_save_does_not_require_draft_tables() {
        let db_path = temp_database_path("knowledge-cards-without-draft-tables");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        assert_table_exists(&connection, "knowledge_cards");
        assert_table_missing(&connection, "draft_artifacts");
        seed_source_document_card_and_tags(&mut connection, db_path.clone());

        let result = save_knowledge_cards_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_knowledge_card_save_request(),
        )
        .expect("save knowledge cards");

        assert!(result.saved);
        assert_eq!(count_rows(&connection, "knowledge_cards"), 2);
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

    fn valid_source_card_save_request() -> SaveSourceCardRequest {
        SaveSourceCardRequest {
            authors: None,
            linked_source_document_id: "candidate-document-qa-docx-file-intake-job".to_string(),
            source_card: SaveSourceCardCandidate {
                candidate_id: "save-candidate-candidate-source-card-qa".to_string(),
                citation_readiness: "needs_review".to_string(),
                citation_text:
                    "Author metadata required (Year metadata required). qa-service-quality-chapter. [DRAFT - metadata required]"
                        .to_string(),
                file_reference: "qa-service-quality-chapter.docx".to_string(),
                metadata_status: "needs_metadata".to_string(),
                review: SaveCandidateReviewSnapshot {
                    review_status: "mock_preview".to_string(),
                },
                source_type: "DOCX".to_string(),
                title: "qa-service-quality-chapter".to_string(),
                validation_status: "needs_review".to_string(),
            },
            source_card_id: "candidate-source-card-qa".to_string(),
            year: None,
        }
    }

    fn seed_source_document_and_card(connection: &mut Connection, db_path: PathBuf) {
        save_source_document_candidate_to_connection(
            connection,
            db_path.clone(),
            valid_save_request(),
        )
        .expect("seed source document");
        save_source_card_candidate_to_connection(
            connection,
            db_path,
            valid_source_card_save_request(),
        )
        .expect("seed source card");
    }

    fn seed_source_document_card_and_tags(connection: &mut Connection, db_path: PathBuf) {
        seed_source_document_and_card(connection, db_path.clone());
        save_marketing_tags_for_source_card_to_connection(
            connection,
            db_path,
            valid_marketing_tag_save_request(),
        )
        .expect("seed marketing tags");
    }

    fn valid_marketing_tag_save_request() -> SaveMarketingTagsForSourceCardRequest {
        SaveMarketingTagsForSourceCardRequest {
            source_card_id: "candidate-source-card-qa".to_string(),
            tags: vec![
                SaveMarketingTagCandidate {
                    category: "Service Management".to_string(),
                    label: "service quality".to_string(),
                    review_status: "approved".to_string(),
                    tag_id: "marketing-term-service-quality".to_string(),
                    tier: "core".to_string(),
                },
                SaveMarketingTagCandidate {
                    category: "Customer Experience".to_string(),
                    label: "customer journey".to_string(),
                    review_status: "approved".to_string(),
                    tag_id: "marketing-term-customer-journey".to_string(),
                    tier: "extended".to_string(),
                },
            ],
        }
    }

    fn mixed_marketing_tag_save_request() -> SaveMarketingTagsForSourceCardRequest {
        SaveMarketingTagsForSourceCardRequest {
            source_card_id: "candidate-source-card-qa".to_string(),
            tags: vec![
                SaveMarketingTagCandidate {
                    category: "Service Management".to_string(),
                    label: "service quality".to_string(),
                    review_status: "approved".to_string(),
                    tag_id: "marketing-term-service-quality".to_string(),
                    tier: "core".to_string(),
                },
                SaveMarketingTagCandidate {
                    category: "Digital Marketing".to_string(),
                    label: "service chatbot".to_string(),
                    review_status: "needs_review".to_string(),
                    tag_id: "marketing-term-service-chatbot".to_string(),
                    tier: "suggested".to_string(),
                },
                SaveMarketingTagCandidate {
                    category: "Branding".to_string(),
                    label: "legacy brand marker".to_string(),
                    review_status: "rejected".to_string(),
                    tag_id: "marketing-term-legacy-brand-marker".to_string(),
                    tier: "extended".to_string(),
                },
            ],
        }
    }

    fn valid_knowledge_card_save_request() -> SaveKnowledgeCardsForSourceCardRequest {
        SaveKnowledgeCardsForSourceCardRequest {
            source_card_id: "candidate-source-card-qa".to_string(),
            cards: vec![
                SaveKnowledgeCardCandidate {
                    card_type: "concept".to_string(),
                    citation_readiness: "ready".to_string(),
                    content_preview: "Service quality is a reusable textbook concept.".to_string(),
                    knowledge_card_id: "knowledge-card-concept-qa".to_string(),
                    review_status: "approved".to_string(),
                    tag_ids: vec!["marketing-term-service-quality".to_string()],
                    title: "Service Quality Concept".to_string(),
                    trace_reference: Some(SaveKnowledgeCardTraceReference {
                        chunk_reference: "docx:p1".to_string(),
                        page_number: 0,
                        page_number_trusted: false,
                        section_title: "Service Quality Overview".to_string(),
                    }),
                    validation_status: "ready".to_string(),
                },
                SaveKnowledgeCardCandidate {
                    card_type: "evidence".to_string(),
                    citation_readiness: "needs_review".to_string(),
                    content_preview:
                        "Thai service quality explanation is evidence for classroom use."
                            .to_string(),
                    knowledge_card_id: "knowledge-card-evidence-qa".to_string(),
                    review_status: "approved".to_string(),
                    tag_ids: vec!["marketing-term-customer-journey".to_string()],
                    title: "Service Quality Evidence".to_string(),
                    trace_reference: Some(SaveKnowledgeCardTraceReference {
                        chunk_reference: "docx:p2".to_string(),
                        page_number: 0,
                        page_number_trusted: false,
                        section_title: "Thai Textbook Explanation".to_string(),
                    }),
                    validation_status: "needs_review".to_string(),
                },
            ],
        }
    }

    fn mixed_knowledge_card_save_request() -> SaveKnowledgeCardsForSourceCardRequest {
        SaveKnowledgeCardsForSourceCardRequest {
            source_card_id: "candidate-source-card-qa".to_string(),
            cards: vec![
                SaveKnowledgeCardCandidate {
                    card_type: "concept".to_string(),
                    citation_readiness: "ready".to_string(),
                    content_preview: "Approved concept preview.".to_string(),
                    knowledge_card_id: "knowledge-card-concept-qa".to_string(),
                    review_status: "approved".to_string(),
                    tag_ids: vec!["marketing-term-service-quality".to_string()],
                    title: "Service Quality Concept".to_string(),
                    trace_reference: Some(SaveKnowledgeCardTraceReference {
                        chunk_reference: "docx:p1".to_string(),
                        page_number: 0,
                        page_number_trusted: false,
                        section_title: "Service Quality Overview".to_string(),
                    }),
                    validation_status: "ready".to_string(),
                },
                SaveKnowledgeCardCandidate {
                    card_type: "quote".to_string(),
                    citation_readiness: "needs_review".to_string(),
                    content_preview: "Needs review quote preview.".to_string(),
                    knowledge_card_id: "knowledge-card-quote-qa".to_string(),
                    review_status: "needs_review".to_string(),
                    tag_ids: vec!["marketing-term-service-quality".to_string()],
                    title: "Needs Review Quote".to_string(),
                    trace_reference: Some(SaveKnowledgeCardTraceReference {
                        chunk_reference: "docx:p2".to_string(),
                        page_number: 0,
                        page_number_trusted: false,
                        section_title: "Thai Textbook Explanation".to_string(),
                    }),
                    validation_status: "needs_review".to_string(),
                },
                SaveKnowledgeCardCandidate {
                    card_type: "case".to_string(),
                    citation_readiness: "blocked".to_string(),
                    content_preview: "Rejected case preview.".to_string(),
                    knowledge_card_id: "knowledge-card-case-qa".to_string(),
                    review_status: "rejected".to_string(),
                    tag_ids: vec!["marketing-term-customer-journey".to_string()],
                    title: "Rejected Case".to_string(),
                    trace_reference: None,
                    validation_status: "blocked".to_string(),
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
