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
const ADD_DRAFT_ARTIFACTS_MIGRATION_ID: &str = "005_add_draft_artifacts";
const ADD_DRAFT_ARTIFACTS_MIGRATION_SQL: &str =
    include_str!("../migrations/005_add_draft_artifacts.sql");
const ADD_SOURCE_CARD_BIBLIOGRAPHIC_METADATA_MIGRATION_ID: &str =
    "006_add_source_card_bibliographic_metadata";
const ADD_SOURCE_CARD_BIBLIOGRAPHIC_METADATA_MIGRATION_SQL: &str =
    include_str!("../migrations/006_add_source_card_bibliographic_metadata.sql");
const ADD_SOURCE_CARD_APA_REFERENCE_REVIEWS_MIGRATION_ID: &str =
    "007_add_source_card_apa_reference_reviews";
const ADD_SOURCE_CARD_APA_REFERENCE_REVIEWS_MIGRATION_SQL: &str =
    include_str!("../migrations/007_add_source_card_apa_reference_reviews.sql");

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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSourceCardMetadataRequest {
    authors: Option<String>,
    citation_readiness: String,
    citation_text: String,
    metadata_status: String,
    source_card_id: String,
    title: String,
    year: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSourceCardMetadataResult {
    blockers: Vec<String>,
    db_path: String,
    saved: bool,
    source_card_id: String,
    warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceCardBibliographicMetadataRequest {
    source_card_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertSourceCardBibliographicMetadataRequest {
    access_date: Option<String>,
    apa_readiness: String,
    container_title: Option<String>,
    doi: Option<String>,
    edition: Option<String>,
    human_verified_at: Option<String>,
    issue: Option<String>,
    journal: Option<String>,
    metadata_source: String,
    notes: Option<String>,
    page_range: Option<String>,
    publisher: Option<String>,
    source_card_id: String,
    structured_metadata_status: String,
    url: Option<String>,
    volume: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceCardBibliographicMetadata {
    access_date: Option<String>,
    apa_final_verified: bool,
    apa_readiness: String,
    apa_readiness_notice: String,
    container_title: Option<String>,
    created_at: String,
    doi: Option<String>,
    edition: Option<String>,
    human_verified_at: Option<String>,
    issue: Option<String>,
    journal: Option<String>,
    metadata_source: String,
    notes: Option<String>,
    page_range: Option<String>,
    publisher: Option<String>,
    source_card_id: String,
    structured_metadata_status: String,
    updated_at: String,
    url: Option<String>,
    volume: Option<String>,
    warnings: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertSourceCardBibliographicMetadataResult {
    blockers: Vec<String>,
    db_path: String,
    metadata: Option<SavedSourceCardBibliographicMetadata>,
    saved: bool,
    source_card_id: String,
    warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceCardApaReferenceReviewRequest {
    source_card_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSourceCardApaReferenceReviewRequest {
    apa_style_version: String,
    blockers_resolved: Vec<String>,
    candidate_blockers: Vec<String>,
    candidate_reference_text: String,
    checklist: Vec<SaveApaReferenceChecklistItem>,
    review_id: String,
    reviewer_note: Option<String>,
    source_card_id: String,
    source_metadata_snapshot_json: String,
    verification_scope: String,
    verification_status: String,
    verified_reference_text: String,
    warnings_accepted: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveApaReferenceChecklistItem {
    key: String,
    label: String,
    state: String,
    reviewer_note: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSourceCardApaReferenceReviewResult {
    blockers: Vec<String>,
    db_path: String,
    review: Option<SavedSourceCardApaReferenceReview>,
    saved: bool,
    source_card_id: String,
    warnings: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSourceCardApaReferenceReview {
    apa_style_version: String,
    blockers_resolved_json: String,
    candidate_reference_text: String,
    checklist_json: String,
    created_at: String,
    human_reviewed_at: String,
    review_id: String,
    reviewer_note: Option<String>,
    source_card_id: String,
    source_metadata_snapshot_json: String,
    updated_at: String,
    verification_scope: String,
    verification_status: String,
    verified_reference_text: String,
    warnings_accepted_json: String,
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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDraftArtifactRequest {
    draft_artifact: SaveDraftArtifactCandidate,
    linked_knowledge_card_ids: Vec<String>,
    sections: Vec<SaveDraftSectionCandidate>,
    source_card_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDraftArtifactCandidate {
    artifact_type: String,
    candidate_id: String,
    mock_only: bool,
    not_final_draft: bool,
    section_count: usize,
    title: String,
    validation_status: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDraftSectionCandidate {
    approved_tags: Vec<String>,
    citation_placeholders: Vec<String>,
    linked_case_ids: Vec<String>,
    linked_evidence_ids: Vec<String>,
    linked_quote_ids: Vec<String>,
    mock_paragraph: String,
    section_id: String,
    section_title: String,
    warnings: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDraftArtifactResult {
    blockers: Vec<String>,
    db_path: String,
    draft_artifact_id: String,
    linked_knowledge_card_count: usize,
    saved: bool,
    section_count: usize,
    source_card_id: String,
    warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListSavedDraftArtifactsForSourceCardRequest {
    source_card_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadSavedDraftArtifactRequest {
    draft_artifact_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedDraftArtifactListItem {
    artifact_status: String,
    created_at: String,
    draft_artifact_id: String,
    draft_type: String,
    linked_knowledge_card_count: i64,
    mock_only: bool,
    not_final: bool,
    section_count: i64,
    source_card_id: String,
    title: String,
    updated_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedDraftArtifactDetail {
    draft_artifact: SavedDraftArtifactRecord,
    knowledge_cards: Vec<SavedDraftArtifactKnowledgeCardRecord>,
    sections: Vec<SavedDraftSectionRecord>,
    source_card: SavedSourceCardCompactReference,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedDraftArtifactRecord {
    artifact_status: String,
    citation_readiness: String,
    created_at: String,
    draft_artifact_id: String,
    draft_type: String,
    mock_only: bool,
    not_final: bool,
    source_card_id: String,
    title: String,
    trace_readiness: String,
    updated_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedDraftSectionRecord {
    approved_tags_json: String,
    citation_placeholders_json: String,
    linked_case_ids_json: String,
    linked_evidence_ids_json: String,
    linked_quote_ids_json: String,
    mock_paragraph: String,
    section_id: String,
    section_title: String,
    sort_order: i64,
    warnings_json: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedDraftArtifactKnowledgeCardRecord {
    card_type: String,
    knowledge_card_id: String,
    title: String,
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
pub fn update_source_card_metadata(
    app: tauri::AppHandle,
    request: UpdateSourceCardMetadataRequest,
) -> Result<UpdateSourceCardMetadataResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    update_source_card_metadata_to_connection(&mut connection, db_path, request)
}

#[tauri::command]
pub fn upsert_source_card_bibliographic_metadata(
    app: tauri::AppHandle,
    request: UpsertSourceCardBibliographicMetadataRequest,
) -> Result<UpsertSourceCardBibliographicMetadataResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    upsert_source_card_bibliographic_metadata_to_connection(&mut connection, db_path, request)
}

#[tauri::command]
pub fn get_source_card_bibliographic_metadata(
    app: tauri::AppHandle,
    request: SourceCardBibliographicMetadataRequest,
) -> Result<Option<SavedSourceCardBibliographicMetadata>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    get_source_card_bibliographic_metadata_from_connection(&connection, &request.source_card_id)
}

#[tauri::command]
pub fn save_source_card_apa_reference_review(
    app: tauri::AppHandle,
    request: SaveSourceCardApaReferenceReviewRequest,
) -> Result<SaveSourceCardApaReferenceReviewResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    save_source_card_apa_reference_review_to_connection(&mut connection, db_path, request)
}

#[tauri::command]
pub fn get_source_card_apa_reference_review(
    app: tauri::AppHandle,
    request: SourceCardApaReferenceReviewRequest,
) -> Result<Option<SavedSourceCardApaReferenceReview>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    get_source_card_apa_reference_review_from_connection(&connection, &request.source_card_id)
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

#[tauri::command]
pub fn save_draft_artifact_candidate(
    app: tauri::AppHandle,
    request: SaveDraftArtifactRequest,
) -> Result<SaveDraftArtifactResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    save_draft_artifact_candidate_to_connection(&mut connection, db_path, request)
}

#[tauri::command]
pub fn list_saved_draft_artifacts(
    app: tauri::AppHandle,
) -> Result<Vec<SavedDraftArtifactListItem>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    list_saved_draft_artifacts_from_connection(&connection)
}

#[tauri::command]
pub fn list_saved_draft_artifacts_for_source_card(
    app: tauri::AppHandle,
    request: ListSavedDraftArtifactsForSourceCardRequest,
) -> Result<Vec<SavedDraftArtifactListItem>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    list_saved_draft_artifacts_for_source_card_from_connection(&connection, &request.source_card_id)
}

#[tauri::command]
pub fn read_saved_draft_artifact(
    app: tauri::AppHandle,
    request: ReadSavedDraftArtifactRequest,
) -> Result<SavedDraftArtifactDetail, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    read_saved_draft_artifact_from_connection(&connection, &request.draft_artifact_id)
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

    if current_version < 5 {
        connection
            .execute_batch(ADD_DRAFT_ARTIFACTS_MIGRATION_SQL)
            .map_err(|error| format!("Unable to apply DraftArtifact SQLite migration: {error}"))?;
        applied_migrations.push(ADD_DRAFT_ARTIFACTS_MIGRATION_ID.to_string());
    }

    if current_version < 6 {
        connection
            .execute_batch(ADD_SOURCE_CARD_BIBLIOGRAPHIC_METADATA_MIGRATION_SQL)
            .map_err(|error| {
                format!("Unable to apply SourceCard bibliographic metadata SQLite migration: {error}")
            })?;
        applied_migrations
            .push(ADD_SOURCE_CARD_BIBLIOGRAPHIC_METADATA_MIGRATION_ID.to_string());
    }

    if current_version < 7 {
        connection
            .execute_batch(ADD_SOURCE_CARD_APA_REFERENCE_REVIEWS_MIGRATION_SQL)
            .map_err(|error| {
                format!("Unable to apply SourceCard APA reference review SQLite migration: {error}")
            })?;
        applied_migrations.push(ADD_SOURCE_CARD_APA_REFERENCE_REVIEWS_MIGRATION_ID.to_string());
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

fn update_source_card_metadata_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: UpdateSourceCardMetadataRequest,
) -> Result<UpdateSourceCardMetadataResult, String> {
    let validation = validate_source_card_metadata_update_request(connection, &request)?;

    if !validation.blockers.is_empty() {
        return Ok(UpdateSourceCardMetadataResult {
            blockers: validation.blockers,
            db_path: db_path.to_string_lossy().to_string(),
            saved: false,
            source_card_id: request.source_card_id,
            warnings: validation.warnings,
        });
    }

    let saved_at = create_unix_millis_timestamp();
    let tx = connection.transaction().map_err(|error| {
        format!("Unable to start SourceCard metadata update transaction: {error}")
    })?;
    let updated_row_count = tx
        .execute(
            "UPDATE source_cards
            SET
                title = ?2,
                authors = ?3,
                year = ?4,
                citation_text = ?5,
                metadata_status = ?6,
                citation_readiness = ?7,
                review_status = ?8,
                updated_at = ?9
            WHERE id = ?1",
            params![
                request.source_card_id.trim(),
                request.title.trim(),
                normalize_optional_text(request.authors.as_deref()),
                normalize_optional_text(request.year.as_deref()),
                request.citation_text.trim(),
                request.metadata_status,
                request.citation_readiness,
                get_source_card_metadata_review_status(&request),
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to update SourceCard metadata: {error}"))?;

    if updated_row_count == 0 {
        return Err(format!(
            "Saved SourceCard not found: {}",
            request.source_card_id.trim()
        ));
    }

    tx.commit()
        .map_err(|error| format!("Unable to commit SourceCard metadata update: {error}"))?;

    Ok(UpdateSourceCardMetadataResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        saved: true,
        source_card_id: request.source_card_id,
        warnings: validation.warnings,
    })
}

fn upsert_source_card_bibliographic_metadata_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: UpsertSourceCardBibliographicMetadataRequest,
) -> Result<UpsertSourceCardBibliographicMetadataResult, String> {
    let validation =
        validate_source_card_bibliographic_metadata_upsert_request(connection, &request)?;

    if !validation.blockers.is_empty() {
        return Ok(UpsertSourceCardBibliographicMetadataResult {
            blockers: validation.blockers,
            db_path: db_path.to_string_lossy().to_string(),
            metadata: None,
            saved: false,
            source_card_id: request.source_card_id,
            warnings: validation.warnings,
        });
    }

    let saved_at = create_unix_millis_timestamp();
    let warnings_json = if validation.warnings.is_empty() {
        None
    } else {
        Some(join_json_like(&validation.warnings))
    };
    let tx = connection.transaction().map_err(|error| {
        format!("Unable to start SourceCard bibliographic metadata transaction: {error}")
    })?;

    tx.execute(
        "INSERT INTO source_card_bibliographic_metadata (
            source_card_id,
            publisher,
            journal,
            container_title,
            edition,
            volume,
            issue,
            page_range,
            doi,
            url,
            access_date,
            metadata_source,
            structured_metadata_status,
            apa_readiness,
            human_verified_at,
            notes,
            warnings,
            created_at,
            updated_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?18)
        ON CONFLICT(source_card_id) DO UPDATE SET
            publisher = excluded.publisher,
            journal = excluded.journal,
            container_title = excluded.container_title,
            edition = excluded.edition,
            volume = excluded.volume,
            issue = excluded.issue,
            page_range = excluded.page_range,
            doi = excluded.doi,
            url = excluded.url,
            access_date = excluded.access_date,
            metadata_source = excluded.metadata_source,
            structured_metadata_status = excluded.structured_metadata_status,
            apa_readiness = excluded.apa_readiness,
            human_verified_at = excluded.human_verified_at,
            notes = excluded.notes,
            warnings = excluded.warnings,
            updated_at = excluded.updated_at",
        params![
            request.source_card_id.trim(),
            normalize_optional_text(request.publisher.as_deref()),
            normalize_optional_text(request.journal.as_deref()),
            normalize_optional_text(request.container_title.as_deref()),
            normalize_optional_text(request.edition.as_deref()),
            normalize_optional_text(request.volume.as_deref()),
            normalize_optional_text(request.issue.as_deref()),
            normalize_optional_text(request.page_range.as_deref()),
            normalize_optional_text(request.doi.as_deref()),
            normalize_optional_text(request.url.as_deref()),
            normalize_optional_text(request.access_date.as_deref()),
            request.metadata_source.trim(),
            request.structured_metadata_status.trim(),
            request.apa_readiness.trim(),
            normalize_optional_text(request.human_verified_at.as_deref()),
            normalize_optional_text(request.notes.as_deref()),
            warnings_json,
            saved_at
        ],
    )
    .map_err(|error| {
        format!("Unable to upsert SourceCard bibliographic metadata: {error}")
    })?;

    tx.commit().map_err(|error| {
        format!("Unable to commit SourceCard bibliographic metadata transaction: {error}")
    })?;

    let metadata = get_source_card_bibliographic_metadata_from_connection(
        connection,
        &request.source_card_id,
    )?
    .ok_or_else(|| {
        format!(
            "Structured bibliographic metadata read-back failed for SourceCard: {}",
            request.source_card_id.trim()
        )
    })?;

    Ok(UpsertSourceCardBibliographicMetadataResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        metadata: Some(metadata),
        saved: true,
        source_card_id: request.source_card_id,
        warnings: validation.warnings,
    })
}

fn get_source_card_bibliographic_metadata_from_connection(
    connection: &Connection,
    source_card_id: &str,
) -> Result<Option<SavedSourceCardBibliographicMetadata>, String> {
    let trimmed_id = source_card_id.trim();

    if trimmed_id.is_empty() {
        return Err("sourceCardId is required.".to_string());
    }

    if !source_card_exists(connection, trimmed_id)? {
        return Err(format!("Saved SourceCard not found: {trimmed_id}"));
    }

    connection
        .query_row(
            "SELECT
                source_card_id,
                publisher,
                journal,
                container_title,
                edition,
                volume,
                issue,
                page_range,
                doi,
                url,
                access_date,
                metadata_source,
                structured_metadata_status,
                apa_readiness,
                human_verified_at,
                notes,
                warnings,
                created_at,
                updated_at
            FROM source_card_bibliographic_metadata
            WHERE source_card_id = ?1",
            params![trimmed_id],
            |row| {
                let apa_readiness = row.get::<_, String>(13)?;

                Ok(SavedSourceCardBibliographicMetadata {
                    source_card_id: row.get(0)?,
                    publisher: row.get(1)?,
                    journal: row.get(2)?,
                    container_title: row.get(3)?,
                    edition: row.get(4)?,
                    volume: row.get(5)?,
                    issue: row.get(6)?,
                    page_range: row.get(7)?,
                    doi: row.get(8)?,
                    url: row.get(9)?,
                    access_date: row.get(10)?,
                    metadata_source: row.get(11)?,
                    structured_metadata_status: row.get(12)?,
                    apa_final_verified: false,
                    apa_readiness,
                    apa_readiness_notice:
                        "APA readiness is a structured metadata preview state, not APA-final verification."
                            .to_string(),
                    human_verified_at: row.get(14)?,
                    notes: row.get(15)?,
                    warnings: row.get(16)?,
                    created_at: row.get(17)?,
                    updated_at: row.get(18)?,
                })
            },
        )
        .optional()
        .map_err(|error| {
            format!("Unable to read SourceCard bibliographic metadata: {error}")
        })
}

fn save_source_card_apa_reference_review_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: SaveSourceCardApaReferenceReviewRequest,
) -> Result<SaveSourceCardApaReferenceReviewResult, String> {
    let validation = validate_source_card_apa_reference_review_request(connection, &request)?;

    if !validation.blockers.is_empty() {
        return Ok(SaveSourceCardApaReferenceReviewResult {
            blockers: validation.blockers,
            db_path: db_path.to_string_lossy().to_string(),
            review: None,
            saved: false,
            source_card_id: request.source_card_id,
            warnings: validation.warnings,
        });
    }

    let saved_at = create_unix_millis_timestamp();
    let checklist_json = checklist_json_like(&request.checklist);
    let warnings_accepted_json = join_json_like(&request.warnings_accepted);
    let blockers_resolved_json = join_json_like(&request.blockers_resolved);
    let tx = connection.transaction().map_err(|error| {
        format!("Unable to start SourceCard APA reference review transaction: {error}")
    })?;

    tx.execute(
        "INSERT INTO source_card_apa_reference_reviews (
            id,
            source_card_id,
            candidate_reference_text,
            verified_reference_text,
            verification_status,
            verification_scope,
            checklist_json,
            reviewer_note,
            source_metadata_snapshot_json,
            warnings_accepted_json,
            blockers_resolved_json,
            apa_style_version,
            human_reviewed_at,
            created_at,
            updated_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13, ?13)
        ON CONFLICT(id) DO UPDATE SET
            source_card_id = excluded.source_card_id,
            candidate_reference_text = excluded.candidate_reference_text,
            verified_reference_text = excluded.verified_reference_text,
            verification_status = excluded.verification_status,
            verification_scope = excluded.verification_scope,
            checklist_json = excluded.checklist_json,
            reviewer_note = excluded.reviewer_note,
            source_metadata_snapshot_json = excluded.source_metadata_snapshot_json,
            warnings_accepted_json = excluded.warnings_accepted_json,
            blockers_resolved_json = excluded.blockers_resolved_json,
            apa_style_version = excluded.apa_style_version,
            human_reviewed_at = excluded.human_reviewed_at,
            updated_at = excluded.updated_at",
        params![
            request.review_id.trim(),
            request.source_card_id.trim(),
            request.candidate_reference_text.trim(),
            request.verified_reference_text.trim(),
            request.verification_status.trim(),
            request.verification_scope.trim(),
            checklist_json,
            normalize_optional_text(request.reviewer_note.as_deref()),
            request.source_metadata_snapshot_json.trim(),
            warnings_accepted_json,
            blockers_resolved_json,
            request.apa_style_version.trim(),
            saved_at
        ],
    )
    .map_err(|error| format!("Unable to save SourceCard APA reference review: {error}"))?;

    tx.commit().map_err(|error| {
        format!("Unable to commit SourceCard APA reference review transaction: {error}")
    })?;

    let review = get_source_card_apa_reference_review_by_id_from_connection(
        connection,
        request.review_id.trim(),
    )?
    .ok_or_else(|| {
        format!(
            "APA reference review read-back failed for SourceCard: {}",
            request.source_card_id.trim()
        )
    })?;

    Ok(SaveSourceCardApaReferenceReviewResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        review: Some(review),
        saved: true,
        source_card_id: request.source_card_id,
        warnings: validation.warnings,
    })
}

fn get_source_card_apa_reference_review_from_connection(
    connection: &Connection,
    source_card_id: &str,
) -> Result<Option<SavedSourceCardApaReferenceReview>, String> {
    let trimmed_id = source_card_id.trim();

    if trimmed_id.is_empty() {
        return Err("sourceCardId is required.".to_string());
    }

    if !source_card_exists(connection, trimmed_id)? {
        return Err(format!("Saved SourceCard not found: {trimmed_id}"));
    }

    connection
        .query_row(
            "SELECT
                id,
                source_card_id,
                candidate_reference_text,
                verified_reference_text,
                verification_status,
                verification_scope,
                checklist_json,
                reviewer_note,
                source_metadata_snapshot_json,
                warnings_accepted_json,
                blockers_resolved_json,
                apa_style_version,
                human_reviewed_at,
                created_at,
                updated_at
            FROM source_card_apa_reference_reviews
            WHERE source_card_id = ?1
            ORDER BY updated_at DESC
            LIMIT 1",
            params![trimmed_id],
            map_source_card_apa_reference_review_row,
        )
        .optional()
        .map_err(|error| format!("Unable to read SourceCard APA reference review: {error}"))
}

fn get_source_card_apa_reference_review_by_id_from_connection(
    connection: &Connection,
    review_id: &str,
) -> Result<Option<SavedSourceCardApaReferenceReview>, String> {
    connection
        .query_row(
            "SELECT
                id,
                source_card_id,
                candidate_reference_text,
                verified_reference_text,
                verification_status,
                verification_scope,
                checklist_json,
                reviewer_note,
                source_metadata_snapshot_json,
                warnings_accepted_json,
                blockers_resolved_json,
                apa_style_version,
                human_reviewed_at,
                created_at,
                updated_at
            FROM source_card_apa_reference_reviews
            WHERE id = ?1",
            params![review_id],
            map_source_card_apa_reference_review_row,
        )
        .optional()
        .map_err(|error| format!("Unable to read SourceCard APA reference review by ID: {error}"))
}

fn map_source_card_apa_reference_review_row(
    row: &rusqlite::Row<'_>,
) -> rusqlite::Result<SavedSourceCardApaReferenceReview> {
    Ok(SavedSourceCardApaReferenceReview {
        review_id: row.get(0)?,
        source_card_id: row.get(1)?,
        candidate_reference_text: row.get(2)?,
        verified_reference_text: row.get(3)?,
        verification_status: row.get(4)?,
        verification_scope: row.get(5)?,
        checklist_json: row.get(6)?,
        reviewer_note: row.get(7)?,
        source_metadata_snapshot_json: row.get(8)?,
        warnings_accepted_json: row.get(9)?,
        blockers_resolved_json: row.get(10)?,
        apa_style_version: row.get(11)?,
        human_reviewed_at: row.get(12)?,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
    })
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

fn save_draft_artifact_candidate_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: SaveDraftArtifactRequest,
) -> Result<SaveDraftArtifactResult, String> {
    let validation = validate_draft_artifact_save_request(connection, &request)?;

    if !validation.blockers.is_empty() {
        return Ok(SaveDraftArtifactResult {
            blockers: validation.blockers,
            db_path: db_path.to_string_lossy().to_string(),
            draft_artifact_id: request.draft_artifact.candidate_id,
            linked_knowledge_card_count: 0,
            saved: false,
            section_count: 0,
            source_card_id: request.source_card_id,
            warnings: validation.warnings,
        });
    }

    let saved_at = create_unix_millis_timestamp();
    let tx = connection
        .transaction()
        .map_err(|error| format!("Unable to start DraftArtifact save transaction: {error}"))?;

    tx.execute(
        "INSERT INTO draft_artifacts (
            id,
            source_card_id,
            title,
            draft_type,
            artifact_status,
            mock_only,
            not_final,
            citation_readiness,
            trace_readiness,
            created_from_candidate_id,
            created_at,
            updated_at
        )
        VALUES (?1, ?2, ?3, ?4, 'mock_only', 1, 1, ?5, ?6, ?1, ?7, ?7)
        ON CONFLICT(id) DO UPDATE SET
            source_card_id = excluded.source_card_id,
            title = excluded.title,
            draft_type = excluded.draft_type,
            artifact_status = excluded.artifact_status,
            mock_only = excluded.mock_only,
            not_final = excluded.not_final,
            citation_readiness = excluded.citation_readiness,
            trace_readiness = excluded.trace_readiness,
            updated_at = excluded.updated_at",
        params![
            request.draft_artifact.candidate_id,
            request.source_card_id,
            request.draft_artifact.title,
            request.draft_artifact.artifact_type,
            "needs_review",
            "needs_review",
            saved_at
        ],
    )
    .map_err(|error| format!("Unable to save DraftArtifact metadata: {error}"))?;

    tx.execute(
        "DELETE FROM draft_sections WHERE draft_artifact_id = ?1",
        params![request.draft_artifact.candidate_id],
    )
    .map_err(|error| format!("Unable to refresh DraftArtifact sections: {error}"))?;
    tx.execute(
        "DELETE FROM draft_artifact_knowledge_cards WHERE draft_artifact_id = ?1",
        params![request.draft_artifact.candidate_id],
    )
    .map_err(|error| format!("Unable to refresh DraftArtifact KnowledgeCard links: {error}"))?;

    for (index, section) in request.sections.iter().enumerate() {
        tx.execute(
            "INSERT INTO draft_sections (
                id,
                draft_artifact_id,
                section_id,
                section_title,
                mock_paragraph,
                citation_placeholders_json,
                linked_evidence_ids_json,
                linked_quote_ids_json,
                linked_case_ids_json,
                approved_tags_json,
                warnings_json,
                sort_order,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)",
            params![
                format!(
                    "{}::section::{}",
                    request.draft_artifact.candidate_id, section.section_id
                ),
                request.draft_artifact.candidate_id,
                section.section_id,
                section.section_title,
                section.mock_paragraph,
                join_json_like(&section.citation_placeholders),
                join_json_like(&section.linked_evidence_ids),
                join_json_like(&section.linked_quote_ids),
                join_json_like(&section.linked_case_ids),
                join_json_like(&section.approved_tags),
                join_json_like(&section.warnings),
                index as i64 + 1,
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to save DraftArtifact section preview: {error}"))?;
    }

    for knowledge_card_id in &request.linked_knowledge_card_ids {
        tx.execute(
            "INSERT INTO draft_artifact_knowledge_cards (
                draft_artifact_id,
                knowledge_card_id,
                created_at
            )
            VALUES (?1, ?2, ?3)
            ON CONFLICT(draft_artifact_id, knowledge_card_id) DO NOTHING",
            params![
                request.draft_artifact.candidate_id,
                knowledge_card_id,
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to link KnowledgeCard to DraftArtifact: {error}"))?;
    }

    tx.commit()
        .map_err(|error| format!("Unable to commit DraftArtifact save transaction: {error}"))?;

    Ok(SaveDraftArtifactResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        draft_artifact_id: request.draft_artifact.candidate_id,
        linked_knowledge_card_count: request.linked_knowledge_card_ids.len(),
        saved: true,
        section_count: request.sections.len(),
        source_card_id: request.source_card_id,
        warnings: validation.warnings,
    })
}

fn list_saved_draft_artifacts_from_connection(
    connection: &Connection,
) -> Result<Vec<SavedDraftArtifactListItem>, String> {
    list_saved_draft_artifacts_with_filter(connection, None)
}

fn list_saved_draft_artifacts_for_source_card_from_connection(
    connection: &Connection,
    source_card_id: &str,
) -> Result<Vec<SavedDraftArtifactListItem>, String> {
    let trimmed_id = source_card_id.trim();

    if trimmed_id.is_empty() {
        return Err("sourceCardId is required.".to_string());
    }

    list_saved_draft_artifacts_with_filter(connection, Some(trimmed_id))
}

fn list_saved_draft_artifacts_with_filter(
    connection: &Connection,
    source_card_id: Option<&str>,
) -> Result<Vec<SavedDraftArtifactListItem>, String> {
    let (sql, params): (&str, Vec<&str>) = if let Some(source_card_id) = source_card_id {
        (
            "SELECT
                da.id,
                da.source_card_id,
                da.title,
                da.draft_type,
                da.artifact_status,
                da.mock_only,
                da.not_final,
                da.created_at,
                da.updated_at,
                COUNT(DISTINCT ds.id) AS section_count,
                COUNT(DISTINCT dakc.knowledge_card_id) AS linked_knowledge_card_count
            FROM draft_artifacts da
            LEFT JOIN draft_sections ds ON ds.draft_artifact_id = da.id
            LEFT JOIN draft_artifact_knowledge_cards dakc ON dakc.draft_artifact_id = da.id
            WHERE da.source_card_id = ?1
            GROUP BY da.id
            ORDER BY da.created_at DESC, da.title ASC",
            vec![source_card_id],
        )
    } else {
        (
            "SELECT
                da.id,
                da.source_card_id,
                da.title,
                da.draft_type,
                da.artifact_status,
                da.mock_only,
                da.not_final,
                da.created_at,
                da.updated_at,
                COUNT(DISTINCT ds.id) AS section_count,
                COUNT(DISTINCT dakc.knowledge_card_id) AS linked_knowledge_card_count
            FROM draft_artifacts da
            LEFT JOIN draft_sections ds ON ds.draft_artifact_id = da.id
            LEFT JOIN draft_artifact_knowledge_cards dakc ON dakc.draft_artifact_id = da.id
            GROUP BY da.id
            ORDER BY da.created_at DESC, da.title ASC",
            Vec::new(),
        )
    };

    let mut statement = connection
        .prepare(sql)
        .map_err(|error| format!("Unable to prepare saved DraftArtifact list: {error}"))?;
    let rows = statement
        .query_map(rusqlite::params_from_iter(params), |row| {
            Ok(SavedDraftArtifactListItem {
                draft_artifact_id: row.get(0)?,
                source_card_id: row.get(1)?,
                title: row.get(2)?,
                draft_type: row.get(3)?,
                artifact_status: row.get(4)?,
                mock_only: row.get::<_, i64>(5)? == 1,
                not_final: row.get::<_, i64>(6)? == 1,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                section_count: row.get(9)?,
                linked_knowledge_card_count: row.get(10)?,
            })
        })
        .map_err(|error| format!("Unable to read saved DraftArtifact list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map saved DraftArtifact list: {error}"))
}

fn read_saved_draft_artifact_from_connection(
    connection: &Connection,
    draft_artifact_id: &str,
) -> Result<SavedDraftArtifactDetail, String> {
    let trimmed_id = draft_artifact_id.trim();

    if trimmed_id.is_empty() {
        return Err("draftArtifactId is required.".to_string());
    }

    let (draft_artifact, source_card) = connection
        .query_row(
            "SELECT
                da.id,
                da.source_card_id,
                da.title,
                da.draft_type,
                da.artifact_status,
                da.mock_only,
                da.not_final,
                da.citation_readiness,
                da.trace_readiness,
                da.created_at,
                da.updated_at,
                sc.source_document_id,
                sc.title,
                sc.source_type
            FROM draft_artifacts da
            INNER JOIN source_cards sc ON sc.id = da.source_card_id
            WHERE da.id = ?1",
            params![trimmed_id],
            |row| {
                let source_card_id: String = row.get(1)?;
                Ok((
                    SavedDraftArtifactRecord {
                        draft_artifact_id: row.get(0)?,
                        source_card_id: source_card_id.clone(),
                        title: row.get(2)?,
                        draft_type: row.get(3)?,
                        artifact_status: row.get(4)?,
                        mock_only: row.get::<_, i64>(5)? == 1,
                        not_final: row.get::<_, i64>(6)? == 1,
                        citation_readiness: row.get(7)?,
                        trace_readiness: row.get(8)?,
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
        .map_err(|error| format!("Unable to read saved DraftArtifact: {error}"))?
        .ok_or_else(|| format!("Saved DraftArtifact not found: {trimmed_id}"))?;

    Ok(SavedDraftArtifactDetail {
        draft_artifact,
        knowledge_cards: list_saved_knowledge_cards_for_draft_artifact_from_connection(
            connection, trimmed_id,
        )?,
        sections: list_saved_sections_for_draft_artifact_from_connection(connection, trimmed_id)?,
        source_card,
    })
}

fn list_saved_sections_for_draft_artifact_from_connection(
    connection: &Connection,
    draft_artifact_id: &str,
) -> Result<Vec<SavedDraftSectionRecord>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                section_id,
                section_title,
                mock_paragraph,
                citation_placeholders_json,
                linked_evidence_ids_json,
                linked_quote_ids_json,
                linked_case_ids_json,
                approved_tags_json,
                warnings_json,
                sort_order
            FROM draft_sections
            WHERE draft_artifact_id = ?1
            ORDER BY sort_order ASC",
        )
        .map_err(|error| format!("Unable to prepare DraftArtifact section list: {error}"))?;
    let rows = statement
        .query_map(params![draft_artifact_id], |row| {
            Ok(SavedDraftSectionRecord {
                section_id: row.get(0)?,
                section_title: row.get(1)?,
                mock_paragraph: row.get(2)?,
                citation_placeholders_json: row.get(3)?,
                linked_evidence_ids_json: row.get(4)?,
                linked_quote_ids_json: row.get(5)?,
                linked_case_ids_json: row.get(6)?,
                approved_tags_json: row.get(7)?,
                warnings_json: row.get(8)?,
                sort_order: row.get(9)?,
            })
        })
        .map_err(|error| format!("Unable to read DraftArtifact section list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map DraftArtifact section list: {error}"))
}

fn list_saved_knowledge_cards_for_draft_artifact_from_connection(
    connection: &Connection,
    draft_artifact_id: &str,
) -> Result<Vec<SavedDraftArtifactKnowledgeCardRecord>, String> {
    let mut statement = connection
        .prepare(
            "SELECT kc.id, kc.card_type, kc.title
            FROM draft_artifact_knowledge_cards dakc
            INNER JOIN knowledge_cards kc ON kc.id = dakc.knowledge_card_id
            WHERE dakc.draft_artifact_id = ?1
            ORDER BY kc.title ASC",
        )
        .map_err(|error| format!("Unable to prepare DraftArtifact KnowledgeCard list: {error}"))?;
    let rows = statement
        .query_map(params![draft_artifact_id], |row| {
            Ok(SavedDraftArtifactKnowledgeCardRecord {
                knowledge_card_id: row.get(0)?,
                card_type: row.get(1)?,
                title: row.get(2)?,
            })
        })
        .map_err(|error| format!("Unable to read DraftArtifact KnowledgeCard list: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to map DraftArtifact KnowledgeCard list: {error}"))
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

fn knowledge_card_exists(connection: &Connection, knowledge_card_id: &str) -> Result<bool, String> {
    connection
        .query_row(
            "SELECT 1 FROM knowledge_cards WHERE id = ?1",
            params![knowledge_card_id],
            |_| Ok(()),
        )
        .optional()
        .map(|value| value.is_some())
        .map_err(|error| format!("Unable to verify linked KnowledgeCard root: {error}"))
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

fn validate_draft_artifact_save_request(
    connection: &Connection,
    request: &SaveDraftArtifactRequest,
) -> Result<SaveRequestValidation, String> {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();

    require_text(&mut blockers, "sourceCardId", &request.source_card_id);
    require_text(
        &mut blockers,
        "draftArtifact.candidateId",
        &request.draft_artifact.candidate_id,
    );
    require_text(
        &mut blockers,
        "draftArtifact.title",
        &request.draft_artifact.title,
    );

    if request.draft_artifact.artifact_type != "mock_draft_section_preview" {
        blockers.push(format!(
            "DraftArtifact type is unsupported: {}",
            request.draft_artifact.artifact_type
        ));
    }

    if !request.draft_artifact.mock_only || !request.draft_artifact.not_final_draft {
        blockers
            .push("DraftArtifact save is limited to mock_only / not_final candidates.".to_string());
    }

    if request.sections.is_empty() {
        blockers.push("At least one draft section preview is required.".to_string());
    }

    if request.draft_artifact.section_count != request.sections.len() {
        warnings.push(format!(
            "DraftArtifact candidate section count ({}) differs from supplied section previews ({}).",
            request.draft_artifact.section_count,
            request.sections.len()
        ));
    }

    if request.linked_knowledge_card_ids.is_empty() {
        blockers.push("At least one linked KnowledgeCard is required.".to_string());
    }

    for section in &request.sections {
        require_text(&mut blockers, "section.sectionId", &section.section_id);
        require_text(
            &mut blockers,
            "section.sectionTitle",
            &section.section_title,
        );
        require_text(
            &mut blockers,
            "section.mockParagraph",
            &section.mock_paragraph,
        );
    }

    if blockers.is_empty() && !source_card_exists(connection, request.source_card_id.trim())? {
        blockers.push(format!(
            "Linked SourceCard does not exist: {}",
            request.source_card_id
        ));
    }

    if blockers.is_empty() {
        for knowledge_card_id in &request.linked_knowledge_card_ids {
            if !knowledge_card_exists(connection, knowledge_card_id.trim())? {
                blockers.push(format!(
                    "Linked KnowledgeCard does not exist: {}",
                    knowledge_card_id
                ));
            }
        }
    }

    if request.draft_artifact.validation_status != "ready" {
        warnings.push(format!(
            "DraftArtifact candidate validation is {}.",
            request.draft_artifact.validation_status
        ));
    }

    warnings.push(
        "DraftArtifact is saved as mock_only / not_final; no DOCX or Obsidian export is created."
            .to_string(),
    );

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

fn validate_source_card_metadata_update_request(
    connection: &Connection,
    request: &UpdateSourceCardMetadataRequest,
) -> Result<SaveRequestValidation, String> {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();
    let source_card_id = request.source_card_id.trim();

    require_text(&mut blockers, "sourceCardId", source_card_id);
    require_text(&mut blockers, "title", &request.title);
    require_text(&mut blockers, "citationText", &request.citation_text);

    if !matches!(
        request.metadata_status.as_str(),
        "ready" | "needs_metadata" | "blocked"
    ) {
        blockers.push("SourceCard metadata status is unsupported.".to_string());
    }

    if !matches!(
        request.citation_readiness.as_str(),
        "ready" | "needs_review" | "blocked"
    ) {
        blockers.push("SourceCard citation readiness is unsupported.".to_string());
    }

    if request.metadata_status == "blocked" {
        blockers.push("SourceCard metadata update is blocked.".to_string());
    }

    if request.citation_readiness == "blocked" {
        blockers.push("SourceCard citation readiness update is blocked.".to_string());
    }

    let authors = normalize_optional_text(request.authors.as_deref());
    let year = normalize_optional_text(request.year.as_deref());
    let citation_text = request.citation_text.trim();

    if authors.is_none() {
        warnings.push("SourceCard authors are not resolved yet.".to_string());
    }

    if year.is_none() {
        warnings.push("SourceCard year is not resolved yet.".to_string());
    }

    if request.metadata_status == "ready" && (authors.is_none() || year.is_none()) {
        blockers.push(
            "SourceCard metadata cannot be ready while authors or year are missing."
                .to_string(),
        );
    }

    if request.citation_readiness == "ready" {
        if authors.is_none() || year.is_none() {
            blockers.push(
                "Citation readiness cannot be ready until authors and year are human-confirmed."
                    .to_string(),
            );
        }

        if is_metadata_placeholder(citation_text) {
            blockers.push(
                "Citation readiness cannot be ready while citation text is placeholder or metadata-required text."
                    .to_string(),
            );
        }
    }

    if request.citation_readiness == "needs_review" {
        warnings.push("SourceCard citation text still requires citation review.".to_string());
    }

    if request.metadata_status == "needs_metadata" {
        warnings.push("SourceCard metadata is incomplete.".to_string());
    }

    if blockers.is_empty() && !source_card_exists(connection, source_card_id)? {
        return Err(format!("Saved SourceCard not found: {source_card_id}"));
    }

    Ok(SaveRequestValidation { blockers, warnings })
}

fn get_source_card_metadata_review_status(
    request: &UpdateSourceCardMetadataRequest,
) -> String {
    if request.citation_readiness == "ready" && request.metadata_status == "ready" {
        "approved".to_string()
    } else {
        "needs_review".to_string()
    }
}

fn is_metadata_placeholder(value: &str) -> bool {
    let lower = value.to_ascii_lowercase();
    lower.contains("metadata required")
        || lower.contains("draft")
        || lower.contains("unverified")
        || lower.contains("placeholder")
}

fn validate_source_card_bibliographic_metadata_upsert_request(
    connection: &Connection,
    request: &UpsertSourceCardBibliographicMetadataRequest,
) -> Result<SaveRequestValidation, String> {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();
    let source_card_id = request.source_card_id.trim();
    let structured_metadata_status = request.structured_metadata_status.trim();
    let apa_readiness = request.apa_readiness.trim();

    require_text(&mut blockers, "sourceCardId", source_card_id);
    require_text(
        &mut blockers,
        "metadataSource",
        &request.metadata_source,
    );
    require_text(
        &mut blockers,
        "structuredMetadataStatus",
        structured_metadata_status,
    );
    require_text(&mut blockers, "apaReadiness", apa_readiness);

    if !matches!(
        structured_metadata_status,
        "not_started" | "incomplete" | "complete" | "needs_review"
    ) {
        blockers.push("Structured metadata status is unsupported.".to_string());
    }

    if !matches!(
        apa_readiness,
        "not_ready" | "candidate_ready" | "needs_review" | "final_verified"
    ) {
        blockers.push("APA readiness state is unsupported.".to_string());
    }

    if apa_readiness == "final_verified" {
        blockers.push(
            "APA final verification is not implemented in Sprint 4H-3.".to_string(),
        );
    }

    if structured_metadata_status == "complete" && apa_readiness == "not_ready" {
        warnings.push(
            "Structured metadata is marked complete, but APA readiness remains not_ready."
                .to_string(),
        );
    }

    if apa_readiness == "candidate_ready" {
        warnings.push(
            "APA reference candidate readiness is not APA-final verification.".to_string(),
        );
    } else if apa_readiness == "needs_review" {
        warnings.push("APA readiness still needs human academic review.".to_string());
    }

    if let Some(doi) = normalize_optional_text(request.doi.as_deref()) {
        if !doi.to_ascii_lowercase().starts_with("10.") {
            warnings.push(
                "DOI was saved as human-entered text; format was not externally verified."
                    .to_string(),
            );
        }
    }

    if let Some(url) = normalize_optional_text(request.url.as_deref()) {
        if !url.starts_with("http://") && !url.starts_with("https://") {
            warnings.push(
                "URL was saved as human-entered text; external reachability was not checked."
                    .to_string(),
            );
        }
    }

    warnings.push(
        "No DOI lookup, web search, AI extraction, APA generation, or APA finalization was performed."
            .to_string(),
    );

    if blockers.is_empty() && !source_card_exists(connection, source_card_id)? {
        return Err(format!("Saved SourceCard not found: {source_card_id}"));
    }

    Ok(SaveRequestValidation { blockers, warnings })
}

fn validate_source_card_apa_reference_review_request(
    connection: &Connection,
    request: &SaveSourceCardApaReferenceReviewRequest,
) -> Result<SaveRequestValidation, String> {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();
    let source_card_id = request.source_card_id.trim();
    let verification_status = request.verification_status.trim();
    let verification_scope = request.verification_scope.trim();

    require_text(&mut blockers, "reviewId", &request.review_id);
    require_text(&mut blockers, "sourceCardId", source_card_id);
    require_text(
        &mut blockers,
        "candidateReferenceText",
        &request.candidate_reference_text,
    );
    require_text(
        &mut blockers,
        "verifiedReferenceText",
        &request.verified_reference_text,
    );
    require_text(&mut blockers, "verificationStatus", verification_status);
    require_text(&mut blockers, "verificationScope", verification_scope);
    require_text(&mut blockers, "apaStyleVersion", &request.apa_style_version);
    require_text(
        &mut blockers,
        "sourceMetadataSnapshotJson",
        &request.source_metadata_snapshot_json,
    );

    if !matches!(
        verification_status,
        "needs_correction" | "verified_for_internal_use" | "apa_final_verified"
    ) {
        blockers.push(format!(
            "APA reference verification status is unsupported: {verification_status}"
        ));
    }

    if verification_status == "apa_final_verified" {
        blockers.push(
            "APA final verification is not implemented in Sprint 4H-8A.".to_string(),
        );
    }

    if !matches!(verification_scope, "internal_drafting" | "teaching_preparation") {
        blockers.push(format!(
            "APA reference verification scope is unsupported for this MVP: {verification_scope}"
        ));
    }

    if !request.candidate_blockers.is_empty() && verification_status != "needs_correction" {
        blockers.push(
            "APA reference candidate has unresolved blockers and cannot be verified for internal use."
                .to_string(),
        );
    }

    if verification_status == "verified_for_internal_use" {
        if request.checklist.is_empty() {
            blockers.push(
                "Checklist items are required before saving verified_for_internal_use."
                    .to_string(),
            );
        }

        for item in &request.checklist {
            require_text(&mut blockers, "checklist.key", &item.key);
            require_text(&mut blockers, "checklist.label", &item.label);

            if !matches!(
                item.state.as_str(),
                "confirmed" | "needs_correction" | "not_applicable"
            ) {
                blockers.push(format!(
                    "APA checklist item state is unsupported: {}",
                    item.state
                ));
            }

            if item.state == "needs_correction" {
                blockers.push(format!(
                    "Checklist item still needs correction: {}",
                    item.label
                ));
            }
        }

        if !request.warnings_accepted.is_empty()
            && normalize_optional_text(request.reviewer_note.as_deref()).is_none()
        {
            blockers.push(
                "Reviewer note is required when saving with accepted APA candidate warnings."
                    .to_string(),
            );
        }
    }

    if verification_status == "needs_correction" {
        warnings.push(
            "APA reference review saved as needs_correction; no verified reference is available yet."
                .to_string(),
        );
    }

    if verification_status == "verified_for_internal_use" {
        warnings.push(
            "APA reference is verified for internal use only and is not publication-ready."
                .to_string(),
        );
    }

    warnings.push(
        "SourceCard citationText is not overwritten by APA reference review save.".to_string(),
    );
    warnings.push(
        "No DOI lookup, web search, AI generation, or APA finalization was performed."
            .to_string(),
    );

    if blockers.is_empty() && !source_card_exists(connection, source_card_id)? {
        return Err(format!("Saved SourceCard not found: {source_card_id}"));
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

fn join_json_like(values: &[String]) -> String {
    format!(
        "[{}]",
        values
            .iter()
            .map(|value| format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\"")))
            .collect::<Vec<_>>()
            .join(",")
    )
}

fn checklist_json_like(values: &[SaveApaReferenceChecklistItem]) -> String {
    format!(
        "[{}]",
        values
            .iter()
            .map(|item| {
                format!(
                    "{{\"key\":\"{}\",\"label\":\"{}\",\"state\":\"{}\",\"reviewerNote\":{}}}",
                    escape_json_like(&item.key),
                    escape_json_like(&item.label),
                    escape_json_like(&item.state),
                    item.reviewer_note
                        .as_deref()
                        .and_then(|note| normalize_optional_text(Some(note)))
                        .map(|note| format!("\"{}\"", escape_json_like(&note)))
                        .unwrap_or_else(|| "null".to_string())
                )
            })
            .collect::<Vec<_>>()
            .join(",")
    )
}

fn escape_json_like(value: &str) -> String {
    value.replace('\\', "\\\\").replace('"', "\\\"")
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
                ADD_KNOWLEDGE_CARDS_MIGRATION_ID.to_string(),
                ADD_DRAFT_ARTIFACTS_MIGRATION_ID.to_string(),
                ADD_SOURCE_CARD_BIBLIOGRAPHIC_METADATA_MIGRATION_ID.to_string(),
                ADD_SOURCE_CARD_APA_REFERENCE_REVIEWS_MIGRATION_ID.to_string()
            ]
        );
        assert_eq!(
            read_schema_version(&connection).expect("read schema version"),
            Some(7)
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
        assert_table_exists(&connection, "draft_artifacts");
        assert_table_exists(&connection, "draft_sections");
        assert_table_exists(&connection, "draft_artifact_knowledge_cards");
        assert_table_exists(&connection, "source_card_bibliographic_metadata");
        assert_table_exists(&connection, "source_card_apa_reference_reviews");

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

        assert_eq!(first_result.len(), 7);
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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

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
    fn update_source_card_metadata_updates_existing_card_only() {
        let db_path = temp_database_path("source-card-metadata-update");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());

        let result = update_source_card_metadata_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSourceCardMetadataRequest {
                authors: Some("Parasuraman, Zeithaml, and Berry".to_string()),
                citation_readiness: "ready".to_string(),
                citation_text:
                    "Parasuraman, Zeithaml, and Berry (1988). SERVQUAL. Human verified."
                        .to_string(),
                metadata_status: "ready".to_string(),
                source_card_id: "candidate-source-card-qa".to_string(),
                title: "SERVQUAL measurement foundation".to_string(),
                year: Some("1988".to_string()),
            },
        )
        .expect("update source card metadata");
        let detail =
            read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
                .expect("read updated source card");

        assert!(result.saved);
        assert_eq!(count_rows(&connection, "source_cards"), 1);
        assert_eq!(
            detail.source_card.title,
            "SERVQUAL measurement foundation"
        );
        assert_eq!(
            detail.source_card.authors,
            Some("Parasuraman, Zeithaml, and Berry".to_string())
        );
        assert_eq!(detail.source_card.year, Some("1988".to_string()));
        assert_eq!(detail.source_card.metadata_status, "ready");
        assert_eq!(detail.source_card.citation_readiness, "ready");
        assert_eq!(detail.source_card.review_status, "approved");
        assert_eq!(detail.source_card.source_type, "DOCX");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn update_source_card_metadata_requires_existing_card() {
        let db_path = temp_database_path("source-card-metadata-update-missing");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let error = update_source_card_metadata_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSourceCardMetadataRequest {
                authors: Some("Human Author".to_string()),
                citation_readiness: "ready".to_string(),
                citation_text: "Human Author (2024). Human title.".to_string(),
                metadata_status: "ready".to_string(),
                source_card_id: "missing-source-card".to_string(),
                title: "Human title".to_string(),
                year: Some("2024".to_string()),
            },
        )
        .expect_err("missing source card should error");

        assert!(error.contains("Saved SourceCard not found"));
        assert_eq!(count_rows(&connection, "source_cards"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn source_card_can_read_without_structured_bibliographic_metadata() {
        let db_path = temp_database_path("source-card-no-structured-metadata");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());

        let detail =
            read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
                .expect("read source card without structured metadata");
        let metadata = get_source_card_bibliographic_metadata_from_connection(
            &connection,
            "candidate-source-card-qa",
        )
        .expect("read missing structured metadata safely");

        assert_eq!(detail.source_card.source_card_id, "candidate-source-card-qa");
        assert!(metadata.is_none());
        assert_eq!(count_rows(&connection, "source_card_bibliographic_metadata"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn upsert_source_card_bibliographic_metadata_inserts_for_existing_source_card() {
        let db_path = temp_database_path("source-card-bibliographic-insert");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());

        let result = upsert_source_card_bibliographic_metadata_to_connection(
            &mut connection,
            db_path.clone(),
            valid_bibliographic_metadata_request(),
        )
        .expect("upsert structured bibliographic metadata");
        let metadata = result.metadata.expect("metadata read-back");

        assert!(result.saved);
        assert_eq!(count_rows(&connection, "source_card_bibliographic_metadata"), 1);
        assert_eq!(metadata.source_card_id, "candidate-source-card-qa");
        assert_eq!(metadata.publisher, Some("Journal of Marketing".to_string()));
        assert_eq!(metadata.journal, Some("Journal of Retail Service".to_string()));
        assert_eq!(metadata.doi, Some("10.1234/service-quality".to_string()));
        assert_eq!(metadata.structured_metadata_status, "complete");
        assert_eq!(metadata.apa_readiness, "candidate_ready");
        assert!(!metadata.apa_final_verified);
        assert!(metadata
            .apa_readiness_notice
            .contains("not APA-final verification"));

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn upsert_source_card_bibliographic_metadata_updates_without_duplicate_row() {
        let db_path = temp_database_path("source-card-bibliographic-update");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());

        upsert_source_card_bibliographic_metadata_to_connection(
            &mut connection,
            db_path.clone(),
            valid_bibliographic_metadata_request(),
        )
        .expect("initial structured metadata upsert");
        let mut update_request = valid_bibliographic_metadata_request();
        update_request.publisher = Some("Updated Publisher".to_string());
        update_request.doi = Some("10.5678/updated".to_string());
        update_request.notes = Some("Updated by human reviewer.".to_string());

        let result = upsert_source_card_bibliographic_metadata_to_connection(
            &mut connection,
            db_path.clone(),
            update_request,
        )
        .expect("update structured bibliographic metadata");
        let metadata = result.metadata.expect("metadata read-back");

        assert!(result.saved);
        assert_eq!(count_rows(&connection, "source_card_bibliographic_metadata"), 1);
        assert_eq!(metadata.publisher, Some("Updated Publisher".to_string()));
        assert_eq!(metadata.doi, Some("10.5678/updated".to_string()));
        assert_eq!(
            metadata.notes,
            Some("Updated by human reviewer.".to_string())
        );

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn upsert_source_card_bibliographic_metadata_requires_existing_source_card() {
        let db_path = temp_database_path("source-card-bibliographic-missing");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let error = upsert_source_card_bibliographic_metadata_to_connection(
            &mut connection,
            db_path.clone(),
            valid_bibliographic_metadata_request(),
        )
        .expect_err("missing source card should error");

        assert!(error.contains("Saved SourceCard not found"));
        assert_eq!(count_rows(&connection, "source_card_bibliographic_metadata"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn upsert_source_card_bibliographic_metadata_does_not_mutate_compact_source_card() {
        let db_path = temp_database_path("source-card-bibliographic-no-compact-mutation");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        let before =
            read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
                .expect("read source card before structured upsert");

        upsert_source_card_bibliographic_metadata_to_connection(
            &mut connection,
            db_path.clone(),
            valid_bibliographic_metadata_request(),
        )
        .expect("upsert structured metadata");
        let after =
            read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
                .expect("read source card after structured upsert");

        assert_eq!(before.source_card.title, after.source_card.title);
        assert_eq!(before.source_card.authors, after.source_card.authors);
        assert_eq!(before.source_card.year, after.source_card.year);
        assert_eq!(
            before.source_card.citation_text,
            after.source_card.citation_text
        );
        assert_eq!(
            before.source_card.citation_readiness,
            after.source_card.citation_readiness
        );
        assert_eq!(count_rows(&connection, "source_documents"), 1);
        assert_eq!(count_rows(&connection, "source_cards"), 1);
        assert_eq!(count_rows(&connection, "marketing_tags"), 0);
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn upsert_source_card_bibliographic_metadata_blocks_apa_final_verified() {
        let db_path = temp_database_path("source-card-bibliographic-apa-final-block");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        let mut request = valid_bibliographic_metadata_request();
        request.apa_readiness = "final_verified".to_string();

        let result = upsert_source_card_bibliographic_metadata_to_connection(
            &mut connection,
            db_path.clone(),
            request,
        )
        .expect("return blocked result");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("APA final verification is not implemented")));
        assert_eq!(count_rows(&connection, "source_card_bibliographic_metadata"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn save_apa_reference_review_needs_correction_succeeds() {
        let db_path = temp_database_path("apa-review-needs-correction");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        let mut request = valid_apa_reference_review_request();
        request.verification_status = "needs_correction".to_string();
        request.candidate_blockers = vec!["Missing required structured metadata field: URL.".to_string()];

        let result = save_source_card_apa_reference_review_to_connection(
            &mut connection,
            db_path.clone(),
            request,
        )
        .expect("save needs correction APA review");
        let review = result.review.expect("review read-back");

        assert!(result.saved);
        assert_eq!(review.verification_status, "needs_correction");
        assert_eq!(count_rows(&connection, "source_card_apa_reference_reviews"), 1);
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn save_apa_reference_review_internal_use_succeeds_with_checklist() {
        let db_path = temp_database_path("apa-review-internal-use");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());

        let result = save_source_card_apa_reference_review_to_connection(
            &mut connection,
            db_path.clone(),
            valid_apa_reference_review_request(),
        )
        .expect("save internal APA review");
        let review = result.review.expect("review read-back");

        assert!(result.saved);
        assert_eq!(review.source_card_id, "candidate-source-card-qa");
        assert_eq!(review.verification_status, "verified_for_internal_use");
        assert_eq!(review.verification_scope, "internal_drafting");
        assert!(review.checklist_json.contains("author_order_spelling"));
        assert!(review
            .warnings_accepted_json
            .contains("DOCX source note warning accepted"));

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn save_apa_reference_review_requires_existing_source_card() {
        let db_path = temp_database_path("apa-review-missing-source-card");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let error = save_source_card_apa_reference_review_to_connection(
            &mut connection,
            db_path.clone(),
            valid_apa_reference_review_request(),
        )
        .expect_err("missing source card should error");

        assert!(error.contains("Saved SourceCard not found"));
        assert_eq!(count_rows(&connection, "source_card_apa_reference_reviews"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn save_apa_reference_review_blocks_apa_final_verified() {
        let db_path = temp_database_path("apa-review-final-blocked");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        let mut request = valid_apa_reference_review_request();
        request.verification_status = "apa_final_verified".to_string();

        let result = save_source_card_apa_reference_review_to_connection(
            &mut connection,
            db_path.clone(),
            request,
        )
        .expect("return blocked APA final result");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("APA final verification is not implemented")));
        assert_eq!(count_rows(&connection, "source_card_apa_reference_reviews"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn save_apa_reference_review_blocks_unresolved_candidate_blockers() {
        let db_path = temp_database_path("apa-review-unresolved-blockers");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        let mut request = valid_apa_reference_review_request();
        request.candidate_blockers = vec!["Structured metadata missing.".to_string()];

        let result = save_source_card_apa_reference_review_to_connection(
            &mut connection,
            db_path.clone(),
            request,
        )
        .expect("return blocked unresolved blocker result");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("unresolved blockers")));
        assert_eq!(count_rows(&connection, "source_card_apa_reference_reviews"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn save_apa_reference_review_does_not_overwrite_source_card_citation_text() {
        let db_path = temp_database_path("apa-review-no-source-card-overwrite");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        let before =
            read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
                .expect("read source card before APA review");

        save_source_card_apa_reference_review_to_connection(
            &mut connection,
            db_path.clone(),
            valid_apa_reference_review_request(),
        )
        .expect("save APA review");
        let after =
            read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
                .expect("read source card after APA review");

        assert_eq!(
            before.source_card.citation_text,
            after.source_card.citation_text
        );
        assert_eq!(before.source_card.title, after.source_card.title);
        assert_eq!(before.source_card.metadata_status, after.source_card.metadata_status);
        assert_eq!(count_rows(&connection, "source_card_apa_reference_reviews"), 1);
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);
        assert_eq!(count_rows(&connection, "knowledge_cards"), 0);
        assert_eq!(count_rows(&connection, "marketing_tags"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn read_apa_reference_review_returns_saved_review_and_missing_is_safe() {
        let db_path = temp_database_path("apa-review-read-back");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());

        let missing = get_source_card_apa_reference_review_from_connection(
            &connection,
            "candidate-source-card-qa",
        )
        .expect("missing review reads safely");
        assert!(missing.is_none());

        save_source_card_apa_reference_review_to_connection(
            &mut connection,
            db_path.clone(),
            valid_apa_reference_review_request(),
        )
        .expect("save APA review");
        let review = get_source_card_apa_reference_review_from_connection(
            &connection,
            "candidate-source-card-qa",
        )
        .expect("read saved APA review")
        .expect("review exists");

        assert_eq!(review.review_id, "apa-review-candidate-source-card-qa");
        assert_eq!(review.verified_reference_text, "Parasuraman, Zeithaml, and Berry (1988). SERVQUAL measurement foundation. [DOCX manuscript/source note - internal candidate only]");

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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);
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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);
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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

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
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);
        seed_source_document_card_and_tags(&mut connection, db_path.clone());

        let result = save_knowledge_cards_for_source_card_to_connection(
            &mut connection,
            db_path.clone(),
            valid_knowledge_card_save_request(),
        )
        .expect("save knowledge cards");

        assert!(result.saved);
        assert_eq!(count_rows(&connection, "knowledge_cards"), 2);
        assert_table_exists(&connection, "draft_artifacts");
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn saves_draft_artifact_linked_to_existing_source_card_and_knowledge_cards() {
        let db_path = temp_database_path("draft-artifact-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_full_persistence_roots(&mut connection, db_path.clone());

        let result = save_draft_artifact_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_draft_artifact_save_request(),
        )
        .expect("save draft artifact");

        assert!(result.saved);
        assert_eq!(result.draft_artifact_id, "draft-artifact-qa");
        assert_eq!(result.section_count, 2);
        assert_eq!(result.linked_knowledge_card_count, 2);
        assert_eq!(count_rows(&connection, "draft_artifacts"), 1);
        assert_eq!(count_rows(&connection, "draft_sections"), 2);
        assert_eq!(count_rows(&connection, "draft_artifact_knowledge_cards"), 2);
        assert_table_missing(&connection, "docx_exports");
        assert_table_missing(&connection, "obsidian_exports");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn draft_artifact_save_with_missing_source_card_is_blocked() {
        let db_path = temp_database_path("draft-artifact-missing-source-card");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let result = save_draft_artifact_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_draft_artifact_save_request(),
        )
        .expect("return blocked draft artifact save result");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("Linked SourceCard does not exist")));
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);
        assert_eq!(count_rows(&connection, "draft_sections"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn draft_artifact_save_with_missing_knowledge_card_is_blocked() {
        let db_path = temp_database_path("draft-artifact-missing-knowledge-card");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_card_and_tags(&mut connection, db_path.clone());

        let result = save_draft_artifact_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_draft_artifact_save_request(),
        )
        .expect("return blocked draft artifact save result");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("Linked KnowledgeCard does not exist")));
        assert_eq!(count_rows(&connection, "draft_artifacts"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn duplicate_draft_artifact_save_is_idempotent() {
        let db_path = temp_database_path("draft-artifact-duplicate-save");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_full_persistence_roots(&mut connection, db_path.clone());

        save_draft_artifact_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_draft_artifact_save_request(),
        )
        .expect("first draft artifact save");
        save_draft_artifact_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_draft_artifact_save_request(),
        )
        .expect("duplicate draft artifact save");

        assert_eq!(count_rows(&connection, "draft_artifacts"), 1);
        assert_eq!(count_rows(&connection, "draft_sections"), 2);
        assert_eq!(count_rows(&connection, "draft_artifact_knowledge_cards"), 2);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn list_and_read_saved_draft_artifacts_work() {
        let db_path = temp_database_path("draft-artifact-read-list");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_full_persistence_roots(&mut connection, db_path.clone());
        save_draft_artifact_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_draft_artifact_save_request(),
        )
        .expect("save draft artifact");

        let saved_artifacts =
            list_saved_draft_artifacts_from_connection(&connection).expect("list artifacts");
        let source_card_artifacts = list_saved_draft_artifacts_for_source_card_from_connection(
            &connection,
            "candidate-source-card-qa",
        )
        .expect("list artifacts for source card");
        let detail = read_saved_draft_artifact_from_connection(&connection, "draft-artifact-qa")
            .expect("read draft artifact detail");

        assert_eq!(saved_artifacts.len(), 1);
        assert_eq!(source_card_artifacts.len(), 1);
        assert_eq!(detail.draft_artifact.draft_artifact_id, "draft-artifact-qa");
        assert_eq!(detail.sections.len(), 2);
        assert_eq!(detail.knowledge_cards.len(), 2);
        assert!(detail.draft_artifact.mock_only);
        assert!(detail.draft_artifact.not_final);
        assert!(detail.sections[0].mock_paragraph.contains("MOCK"));

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn saved_draft_artifact_is_mock_only_and_not_final() {
        let db_path = temp_database_path("draft-artifact-mock-only");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_full_persistence_roots(&mut connection, db_path.clone());

        save_draft_artifact_candidate_to_connection(
            &mut connection,
            db_path.clone(),
            valid_draft_artifact_save_request(),
        )
        .expect("save draft artifact");

        let detail = read_saved_draft_artifact_from_connection(&connection, "draft-artifact-qa")
            .expect("read draft artifact detail");

        assert_eq!(detail.draft_artifact.artifact_status, "mock_only");
        assert!(detail.draft_artifact.mock_only);
        assert!(detail.draft_artifact.not_final);
        assert_table_missing(&connection, "docx_exports");
        assert_table_missing(&connection, "obsidian_exports");

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

    fn valid_bibliographic_metadata_request() -> UpsertSourceCardBibliographicMetadataRequest {
        UpsertSourceCardBibliographicMetadataRequest {
            access_date: None,
            apa_readiness: "candidate_ready".to_string(),
            container_title: Some("Service Quality Research Collection".to_string()),
            doi: Some("10.1234/service-quality".to_string()),
            edition: None,
            human_verified_at: Some("qa-mode:human-verified".to_string()),
            issue: Some("2".to_string()),
            journal: Some("Journal of Retail Service".to_string()),
            metadata_source: "human_entered".to_string(),
            notes: Some("Human-entered structured metadata for QA.".to_string()),
            page_range: Some("12-24".to_string()),
            publisher: Some("Journal of Marketing".to_string()),
            source_card_id: "candidate-source-card-qa".to_string(),
            structured_metadata_status: "complete".to_string(),
            url: Some("https://example.com/service-quality".to_string()),
            volume: Some("15".to_string()),
        }
    }

    fn valid_apa_reference_review_request() -> SaveSourceCardApaReferenceReviewRequest {
        SaveSourceCardApaReferenceReviewRequest {
            apa_style_version: "APA 7".to_string(),
            blockers_resolved: Vec::new(),
            candidate_blockers: Vec::new(),
            candidate_reference_text: "Parasuraman, Zeithaml, and Berry (1988). SERVQUAL measurement foundation. [DOCX manuscript/source note - internal candidate only]".to_string(),
            checklist: vec![
                SaveApaReferenceChecklistItem {
                    key: "author_order_spelling".to_string(),
                    label: "Author order and spelling".to_string(),
                    reviewer_note: None,
                    state: "confirmed".to_string(),
                },
                SaveApaReferenceChecklistItem {
                    key: "year_date_accuracy".to_string(),
                    label: "Year/date accuracy".to_string(),
                    reviewer_note: None,
                    state: "confirmed".to_string(),
                },
                SaveApaReferenceChecklistItem {
                    key: "source_type_correctness".to_string(),
                    label: "Source type correctness".to_string(),
                    reviewer_note: None,
                    state: "confirmed".to_string(),
                },
            ],
            review_id: "apa-review-candidate-source-card-qa".to_string(),
            reviewer_note: Some("Internal-use APA review only.".to_string()),
            source_card_id: "candidate-source-card-qa".to_string(),
            source_metadata_snapshot_json:
                "{\"sourceCardId\":\"candidate-source-card-qa\",\"notFinal\":true}".to_string(),
            verification_scope: "internal_drafting".to_string(),
            verification_status: "verified_for_internal_use".to_string(),
            verified_reference_text: "Parasuraman, Zeithaml, and Berry (1988). SERVQUAL measurement foundation. [DOCX manuscript/source note - internal candidate only]".to_string(),
            warnings_accepted: vec!["DOCX source note warning accepted".to_string()],
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

    fn seed_full_persistence_roots(connection: &mut Connection, db_path: PathBuf) {
        seed_source_document_card_and_tags(connection, db_path.clone());
        save_knowledge_cards_for_source_card_to_connection(
            connection,
            db_path,
            valid_knowledge_card_save_request(),
        )
        .expect("seed knowledge cards");
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

    fn valid_draft_artifact_save_request() -> SaveDraftArtifactRequest {
        SaveDraftArtifactRequest {
            draft_artifact: SaveDraftArtifactCandidate {
                artifact_type: "mock_draft_section_preview".to_string(),
                candidate_id: "draft-artifact-qa".to_string(),
                mock_only: true,
                not_final_draft: true,
                section_count: 2,
                title: "QA Mock Draft Section Preview".to_string(),
                validation_status: "needs_review".to_string(),
            },
            linked_knowledge_card_ids: vec![
                "knowledge-card-concept-qa".to_string(),
                "knowledge-card-evidence-qa".to_string(),
            ],
            sections: vec![
                SaveDraftSectionCandidate {
                    approved_tags: vec!["service quality".to_string()],
                    citation_placeholders: vec![
                        "[MOCK CITATION PLACEHOLDER — verify source metadata; trace docx:p1]"
                            .to_string(),
                    ],
                    linked_case_ids: Vec::new(),
                    linked_evidence_ids: vec!["knowledge-card-evidence-qa".to_string()],
                    linked_quote_ids: Vec::new(),
                    mock_paragraph: "[MOCK DETERMINISTIC DRAFT PREVIEW] Service quality section."
                        .to_string(),
                    section_id: "phenomenon".to_string(),
                    section_title: "Phenomenon / Real-world problem".to_string(),
                    warnings: vec!["Citation readiness is still review-gated.".to_string()],
                },
                SaveDraftSectionCandidate {
                    approved_tags: vec!["customer journey".to_string()],
                    citation_placeholders: vec![
                        "[MOCK CITATION PLACEHOLDER — verify source metadata; trace docx:p2]"
                            .to_string(),
                    ],
                    linked_case_ids: Vec::new(),
                    linked_evidence_ids: vec!["knowledge-card-evidence-qa".to_string()],
                    linked_quote_ids: Vec::new(),
                    mock_paragraph: "[MOCK DETERMINISTIC DRAFT PREVIEW] Thai textbook explanation."
                        .to_string(),
                    section_id: "concept-theory".to_string(),
                    section_title: "Concept / Theory".to_string(),
                    warnings: Vec::new(),
                },
            ],
            source_card_id: "candidate-source-card-qa".to_string(),
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
