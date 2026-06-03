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
const ADD_BATCH_RESEARCH_INTAKE_JOBS_MIGRATION_ID: &str = "008_add_batch_research_intake_jobs";
const ADD_BATCH_RESEARCH_INTAKE_JOBS_MIGRATION_SQL: &str =
    include_str!("../migrations/008_add_batch_research_intake_jobs.sql");
const ADD_SUGGESTED_METADATA_CORRECTIONS_MIGRATION_ID: &str =
    "009_add_suggested_metadata_corrections";
const ADD_SUGGESTED_METADATA_CORRECTIONS_MIGRATION_SQL: &str =
    include_str!("../migrations/009_add_suggested_metadata_corrections.sql");
const ADD_METADATA_CORRECTION_AUDIT_EVENTS_MIGRATION_ID: &str =
    "010_add_metadata_correction_audit_events";
const ADD_METADATA_CORRECTION_AUDIT_EVENTS_MIGRATION_SQL: &str =
    include_str!("../migrations/010_add_metadata_correction_audit_events.sql");
const EXPAND_METADATA_CORRECTION_AUDIT_PREFLIGHT_EVENTS_MIGRATION_ID: &str =
    "011_expand_metadata_correction_audit_preflight_events";
const EXPAND_METADATA_CORRECTION_AUDIT_PREFLIGHT_EVENTS_MIGRATION_SQL: &str =
    include_str!("../migrations/011_expand_metadata_correction_audit_preflight_events.sql");

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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBatchResearchIntakeJobsRequest {
    files: Vec<CreateBatchResearchIntakeJobFile>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBatchResearchIntakeJobFile {
    intake_job_id: String,
    file_name: String,
    file_path: Option<String>,
    file_type: String,
    mime_type: Option<String>,
    file_size: Option<i64>,
    selected_at: Option<String>,
    warnings: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBatchResearchIntakeJobsResult {
    blockers: Vec<String>,
    db_path: String,
    jobs: Vec<SavedBatchResearchIntakeJob>,
    saved: bool,
    warnings: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedBatchResearchIntakeJob {
    intake_job_id: String,
    file_name: String,
    file_path: Option<String>,
    file_type: String,
    mime_type: Option<String>,
    file_size: Option<i64>,
    source_type_guess: String,
    queue_status: String,
    parser_status: String,
    metadata_extraction_status: String,
    external_match_status: String,
    review_status: String,
    duplicate_status: String,
    warnings_json: String,
    blockers_json: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMockExternalMetadataReviewQueueResult {
    blockers: Vec<String>,
    correction_count: usize,
    db_path: String,
    match_result_count: usize,
    saved: bool,
    warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SuggestedMetadataCorrectionListRequest {
    confidence_band: Option<String>,
    intake_job_id: Option<String>,
    review_status: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SuggestedMetadataCorrectionListResult {
    corrections: Vec<SavedSuggestedMetadataCorrection>,
    db_path: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSuggestedMetadataCorrection {
    correction_id: String,
    match_result_id: String,
    intake_job_id: String,
    source_card_id: Option<String>,
    target_metadata_table: String,
    field_name: String,
    current_value: Option<String>,
    suggested_value: String,
    provider_name: String,
    provider_record_ref: String,
    confidence_score: i64,
    confidence_band: String,
    reason: String,
    mismatch_reasons_json: String,
    warning_flags_json: String,
    review_status: String,
    review_decision: String,
    reviewer_edited_value: Option<String>,
    reviewer_note: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSuggestedMetadataCorrectionReviewStateRequest {
    correction_id: String,
    reviewer_edited_value: Option<String>,
    reviewer_note: Option<String>,
    review_decision: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSuggestedMetadataCorrectionReviewStateResult {
    audit_event_count: usize,
    blockers: Vec<String>,
    correction: Option<SavedSuggestedMetadataCorrection>,
    db_path: String,
    latest_audit_event: Option<SavedMetadataCorrectionAuditEvent>,
    saved: bool,
    warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMetadataCorrectionAuditEventRequest {
    correction_id: String,
    event_summary: Option<String>,
    event_type: String,
    reviewer_note: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataCorrectionAuditEventListRequest {
    correction_id: Option<String>,
    intake_job_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMetadataCorrectionAuditEventResult {
    blockers: Vec<String>,
    db_path: String,
    event: Option<SavedMetadataCorrectionAuditEvent>,
    saved: bool,
    warnings: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataCorrectionAuditEventListResult {
    db_path: String,
    events: Vec<SavedMetadataCorrectionAuditEvent>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedMetadataCorrectionAuditEvent {
    audit_event_id: String,
    correction_id: String,
    intake_job_id: String,
    source_card_id: Option<String>,
    event_type: String,
    event_summary: String,
    target_metadata_table: Option<String>,
    target_field_name: Option<String>,
    original_atp_value: Option<String>,
    external_suggested_value: Option<String>,
    reviewer_edited_value: Option<String>,
    applied_value: Option<String>,
    provider_name: Option<String>,
    provider_record_ref: Option<String>,
    confidence_score: Option<i64>,
    confidence_band: Option<String>,
    source_metadata_snapshot_json: String,
    warning_flags_json: String,
    reviewer_note: Option<String>,
    created_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunMetadataCorrectionApplyDryRunRequest {
    correction_id: String,
    write_audit_event: Option<bool>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataCorrectionApplyDryRunResult {
    audit_event_preview: String,
    audit_event_written: bool,
    audit_event: Option<SavedMetadataCorrectionAuditEvent>,
    blockers: Vec<String>,
    confidence_band: String,
    confidence_score: i64,
    correction_id: String,
    current_stored_value: Option<String>,
    dry_run_status: String,
    intake_job_id: String,
    intended_apply_value: Option<String>,
    next_action: String,
    no_overwrite_policy: Vec<String>,
    original_correction_value: Option<String>,
    reviewer_edited_value: Option<String>,
    source_card_id: Option<String>,
    stale_check_status: String,
    suggested_value: String,
    target_field_name: String,
    target_metadata_table: String,
    warnings: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct MockExternalMetadataMatchCandidate {
    matched_authors: Vec<String>,
    matched_container_title: Option<String>,
    matched_doi: Option<String>,
    matched_isbn: Option<String>,
    matched_issue: Option<String>,
    matched_journal: Option<String>,
    matched_page_range: Option<String>,
    matched_publisher: Option<String>,
    matched_source_type: String,
    matched_title: String,
    matched_url: Option<String>,
    matched_volume: Option<String>,
    matched_year: Option<String>,
    provider_confidence: i64,
    provider_id: String,
    provider_name: String,
    provider_record_ref: String,
    provider_type: String,
    warnings: Vec<String>,
}

struct MockExternalMetadataMatchSummary {
    blockers: Vec<String>,
    confidence_band: String,
    confidence_score: i64,
    match_reasons: Vec<String>,
    match_status: String,
    mismatch_reasons: Vec<String>,
    provider_candidates: Vec<MockExternalMetadataMatchCandidate>,
    warnings: Vec<String>,
}

struct MockSuggestedMetadataCorrection {
    confidence_band: String,
    confidence_score: i64,
    current_value: Option<String>,
    field_name: String,
    provider_name: String,
    provider_record_ref: String,
    reason: String,
    suggested_value: String,
    target_metadata_table: String,
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

#[tauri::command]
pub fn create_batch_research_intake_jobs(
    app: tauri::AppHandle,
    request: CreateBatchResearchIntakeJobsRequest,
) -> Result<CreateBatchResearchIntakeJobsResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    create_batch_research_intake_jobs_to_connection(&mut connection, db_path, request)
}

#[tauri::command]
pub fn list_batch_research_intake_jobs(
    app: tauri::AppHandle,
) -> Result<Vec<SavedBatchResearchIntakeJob>, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    list_batch_research_intake_jobs_from_connection(&connection)
}

#[tauri::command]
pub fn create_mock_external_metadata_review_queue_for_intake_jobs(
    app: tauri::AppHandle,
) -> Result<CreateMockExternalMetadataReviewQueueResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    create_mock_external_metadata_review_queue_for_intake_jobs_to_connection(
        &mut connection,
        db_path,
    )
}

#[tauri::command]
pub fn list_suggested_metadata_corrections(
    app: tauri::AppHandle,
    request: SuggestedMetadataCorrectionListRequest,
) -> Result<SuggestedMetadataCorrectionListResult, String> {
    let (db_path, connection, _) = open_initialized_vault_database(&app)?;
    let corrections = list_suggested_metadata_corrections_from_connection(&connection, request)?;

    Ok(SuggestedMetadataCorrectionListResult {
        corrections,
        db_path: db_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub fn update_suggested_metadata_correction_review_state(
    app: tauri::AppHandle,
    request: UpdateSuggestedMetadataCorrectionReviewStateRequest,
) -> Result<UpdateSuggestedMetadataCorrectionReviewStateResult, String> {
    let (db_path, mut connection, _) = open_initialized_vault_database(&app)?;
    update_suggested_metadata_correction_review_state_to_connection(
        &mut connection,
        db_path,
        request,
    )
}

#[tauri::command]
pub fn create_metadata_correction_audit_event(
    app: tauri::AppHandle,
    request: CreateMetadataCorrectionAuditEventRequest,
) -> Result<CreateMetadataCorrectionAuditEventResult, String> {
    let (db_path, connection, _) = open_initialized_vault_database(&app)?;
    create_metadata_correction_audit_event_to_connection(&connection, db_path, request)
}

#[tauri::command]
pub fn list_metadata_correction_audit_events(
    app: tauri::AppHandle,
    request: MetadataCorrectionAuditEventListRequest,
) -> Result<MetadataCorrectionAuditEventListResult, String> {
    let (db_path, connection, _) = open_initialized_vault_database(&app)?;
    let events = list_metadata_correction_audit_events_from_connection(&connection, request)?;

    Ok(MetadataCorrectionAuditEventListResult {
        db_path: db_path.to_string_lossy().to_string(),
        events,
    })
}

#[tauri::command]
pub fn run_metadata_correction_apply_dry_run(
    app: tauri::AppHandle,
    request: RunMetadataCorrectionApplyDryRunRequest,
) -> Result<MetadataCorrectionApplyDryRunResult, String> {
    let (_, connection, _) = open_initialized_vault_database(&app)?;
    run_metadata_correction_apply_dry_run_to_connection(&connection, request)
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
                format!(
                    "Unable to apply SourceCard bibliographic metadata SQLite migration: {error}"
                )
            })?;
        applied_migrations.push(ADD_SOURCE_CARD_BIBLIOGRAPHIC_METADATA_MIGRATION_ID.to_string());
    }

    if current_version < 7 {
        connection
            .execute_batch(ADD_SOURCE_CARD_APA_REFERENCE_REVIEWS_MIGRATION_SQL)
            .map_err(|error| {
                format!("Unable to apply SourceCard APA reference review SQLite migration: {error}")
            })?;
        applied_migrations.push(ADD_SOURCE_CARD_APA_REFERENCE_REVIEWS_MIGRATION_ID.to_string());
    }

    if current_version < 8 {
        connection
            .execute_batch(ADD_BATCH_RESEARCH_INTAKE_JOBS_MIGRATION_SQL)
            .map_err(|error| {
                format!("Unable to apply batch research intake queue SQLite migration: {error}")
            })?;
        applied_migrations.push(ADD_BATCH_RESEARCH_INTAKE_JOBS_MIGRATION_ID.to_string());
    }

    if current_version < 9 {
        connection
            .execute_batch(ADD_SUGGESTED_METADATA_CORRECTIONS_MIGRATION_SQL)
            .map_err(|error| {
                format!("Unable to apply suggested metadata corrections SQLite migration: {error}")
            })?;
        applied_migrations.push(ADD_SUGGESTED_METADATA_CORRECTIONS_MIGRATION_ID.to_string());
    }

    if current_version < 10 {
        connection
            .execute_batch(ADD_METADATA_CORRECTION_AUDIT_EVENTS_MIGRATION_SQL)
            .map_err(|error| {
                format!("Unable to apply metadata correction audit event SQLite migration: {error}")
            })?;
        applied_migrations.push(ADD_METADATA_CORRECTION_AUDIT_EVENTS_MIGRATION_ID.to_string());
    }

    if current_version < 11 {
        connection
            .execute_batch(EXPAND_METADATA_CORRECTION_AUDIT_PREFLIGHT_EVENTS_MIGRATION_SQL)
            .map_err(|error| {
                format!("Unable to apply metadata correction preflight audit event SQLite migration: {error}")
            })?;
        applied_migrations
            .push(EXPAND_METADATA_CORRECTION_AUDIT_PREFLIGHT_EVENTS_MIGRATION_ID.to_string());
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

fn create_batch_research_intake_jobs_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: CreateBatchResearchIntakeJobsRequest,
) -> Result<CreateBatchResearchIntakeJobsResult, String> {
    let validation = validate_batch_research_intake_jobs_request(&request);

    if !validation.blockers.is_empty() {
        return Ok(CreateBatchResearchIntakeJobsResult {
            blockers: validation.blockers,
            db_path: db_path.to_string_lossy().to_string(),
            jobs: Vec::new(),
            saved: false,
            warnings: validation.warnings,
        });
    }

    let saved_at = create_unix_millis_timestamp();
    let tx = connection
        .transaction()
        .map_err(|error| format!("Unable to start batch intake queue transaction: {error}"))?;

    for file in &request.files {
        let created_at = file
            .selected_at
            .as_ref()
            .filter(|selected_at| !selected_at.trim().is_empty())
            .cloned()
            .unwrap_or_else(|| saved_at.clone());
        let warnings_json = serde_json::to_string(&file.warnings)
            .map_err(|error| format!("Unable to serialize batch intake warnings: {error}"))?;
        let blockers_json = "[]".to_string();

        tx.execute(
            "INSERT INTO batch_research_intake_jobs (
                id,
                file_name,
                file_path,
                file_type,
                mime_type,
                file_size,
                source_type_guess,
                queue_status,
                parser_status,
                metadata_extraction_status,
                external_match_status,
                review_status,
                duplicate_status,
                warnings_json,
                blockers_json,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
            ON CONFLICT(id) DO UPDATE SET
                file_name = excluded.file_name,
                file_path = excluded.file_path,
                file_type = excluded.file_type,
                mime_type = excluded.mime_type,
                file_size = excluded.file_size,
                warnings_json = excluded.warnings_json,
                blockers_json = excluded.blockers_json,
                updated_at = excluded.updated_at",
            params![
                file.intake_job_id.trim(),
                file.file_name.trim(),
                normalize_optional_text(file.file_path.as_deref()),
                file.file_type.trim(),
                normalize_optional_text(file.mime_type.as_deref()),
                file.file_size,
                "unknown_pending_review",
                "queued",
                "not_started",
                "not_started",
                "not_started",
                "pending",
                "not_checked",
                warnings_json,
                blockers_json,
                created_at,
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to save batch research intake job: {error}"))?;
    }

    tx.commit()
        .map_err(|error| format!("Unable to commit batch intake queue transaction: {error}"))?;

    let jobs = list_batch_research_intake_jobs_from_connection(connection)?;

    Ok(CreateBatchResearchIntakeJobsResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        jobs,
        saved: true,
        warnings: validation.warnings,
    })
}

fn list_batch_research_intake_jobs_from_connection(
    connection: &Connection,
) -> Result<Vec<SavedBatchResearchIntakeJob>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                id,
                file_name,
                file_path,
                file_type,
                mime_type,
                file_size,
                source_type_guess,
                queue_status,
                parser_status,
                metadata_extraction_status,
                external_match_status,
                review_status,
                duplicate_status,
                warnings_json,
                blockers_json,
                created_at,
                updated_at
            FROM batch_research_intake_jobs
            ORDER BY created_at DESC, id ASC",
        )
        .map_err(|error| format!("Unable to prepare batch intake queue list: {error}"))?;

    let rows = statement
        .query_map([], map_batch_research_intake_job_row)
        .map_err(|error| format!("Unable to list batch intake queue jobs: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to read batch intake queue job row: {error}"))
}

fn map_batch_research_intake_job_row(
    row: &rusqlite::Row<'_>,
) -> rusqlite::Result<SavedBatchResearchIntakeJob> {
    Ok(SavedBatchResearchIntakeJob {
        intake_job_id: row.get(0)?,
        file_name: row.get(1)?,
        file_path: row.get(2)?,
        file_type: row.get(3)?,
        mime_type: row.get(4)?,
        file_size: row.get(5)?,
        source_type_guess: row.get(6)?,
        queue_status: row.get(7)?,
        parser_status: row.get(8)?,
        metadata_extraction_status: row.get(9)?,
        external_match_status: row.get(10)?,
        review_status: row.get(11)?,
        duplicate_status: row.get(12)?,
        warnings_json: row.get(13)?,
        blockers_json: row.get(14)?,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
    })
}

fn create_mock_external_metadata_review_queue_for_intake_jobs_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
) -> Result<CreateMockExternalMetadataReviewQueueResult, String> {
    let jobs = list_batch_research_intake_jobs_from_connection(connection)?;

    if jobs.is_empty() {
        return Ok(CreateMockExternalMetadataReviewQueueResult {
            blockers: vec![
                "No batch intake jobs are available for mock metadata review queue generation."
                    .to_string(),
            ],
            correction_count: 0,
            db_path: db_path.to_string_lossy().to_string(),
            match_result_count: 0,
            saved: false,
            warnings: vec![
                "Mock provider only: no real external metadata API was called.".to_string(),
                "No SourceCard or structured metadata is mutated.".to_string(),
            ],
        });
    }

    let saved_at = create_unix_millis_timestamp();
    let tx = connection.transaction().map_err(|error| {
        format!("Unable to start suggested metadata correction transaction: {error}")
    })?;
    let mut match_result_count = 0usize;
    let mut correction_count = 0usize;

    for job in &jobs {
        let match_summary = map_mock_external_metadata_match(job);
        let first_candidate = match_summary.provider_candidates.first();
        let provider_id = first_candidate
            .map(|candidate| candidate.provider_id.as_str())
            .unwrap_or("mock-no-match-local-fixture");
        let provider_name = first_candidate
            .map(|candidate| candidate.provider_name.as_str())
            .unwrap_or("Mock No Match Fixture");
        let provider_type = first_candidate
            .map(|candidate| candidate.provider_type.as_str())
            .unwrap_or("manual_fixture_mock");
        let provider_record_ref = first_candidate
            .map(|candidate| candidate.provider_record_ref.as_str())
            .unwrap_or("mock:no-match");
        let match_result_id = create_match_result_id(&job.intake_job_id, provider_record_ref);
        let raw_candidate_snapshot_json = serde_json::to_string(&match_summary.provider_candidates)
            .map_err(|error| {
                format!("Unable to serialize mock provider candidate snapshot: {error}")
            })?;
        let match_reasons_json = serialize_string_vec(&match_summary.match_reasons)?;
        let mismatch_reasons_json = serialize_string_vec(&match_summary.mismatch_reasons)?;
        let warning_flags_json = serialize_string_vec(&match_summary.warnings)?;
        let blockers_json = serialize_string_vec(&match_summary.blockers)?;

        tx.execute(
            "INSERT INTO external_metadata_match_results (
                id,
                intake_job_id,
                provider_id,
                provider_name,
                provider_type,
                provider_record_ref,
                is_mock,
                match_status,
                confidence_score,
                confidence_band,
                match_reasons_json,
                mismatch_reasons_json,
                warning_flags_json,
                blockers_json,
                raw_candidate_snapshot_json,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?15)
            ON CONFLICT(intake_job_id, provider_id, provider_record_ref) DO UPDATE SET
                provider_name = excluded.provider_name,
                provider_type = excluded.provider_type,
                is_mock = excluded.is_mock,
                match_status = excluded.match_status,
                confidence_score = excluded.confidence_score,
                confidence_band = excluded.confidence_band,
                match_reasons_json = excluded.match_reasons_json,
                mismatch_reasons_json = excluded.mismatch_reasons_json,
                warning_flags_json = excluded.warning_flags_json,
                blockers_json = excluded.blockers_json,
                raw_candidate_snapshot_json = excluded.raw_candidate_snapshot_json,
                updated_at = excluded.updated_at",
            params![
                match_result_id,
                job.intake_job_id,
                provider_id,
                provider_name,
                provider_type,
                provider_record_ref,
                match_summary.match_status,
                match_summary.confidence_score,
                match_summary.confidence_band,
                match_reasons_json,
                mismatch_reasons_json,
                warning_flags_json,
                blockers_json,
                raw_candidate_snapshot_json,
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to persist external metadata match result: {error}"))?;
        match_result_count += 1;

        for correction in create_mock_suggested_metadata_corrections(job, &match_summary) {
            let correction_id = create_correction_id(
                &job.intake_job_id,
                &correction.provider_record_ref,
                &correction.field_name,
            );
            let review_status = route_suggested_correction_review_status(&correction);
            let correction_mismatch_reasons_json =
                serialize_string_vec(&match_summary.mismatch_reasons)?;
            let correction_warning_flags_json = serialize_string_vec(&match_summary.warnings)?;

            tx.execute(
                "INSERT INTO suggested_metadata_corrections (
                    id,
                    match_result_id,
                    intake_job_id,
                    source_card_id,
                    target_metadata_table,
                    field_name,
                    current_value,
                    suggested_value,
                    provider_name,
                    provider_record_ref,
                    confidence_score,
                    confidence_band,
                    reason,
                    mismatch_reasons_json,
                    warning_flags_json,
                    review_status,
                    review_decision,
                    reviewer_edited_value,
                    reviewer_note,
                    created_at,
                    updated_at
                )
                VALUES (?1, ?2, ?3, NULL, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, 'not_decided', NULL, NULL, ?16, ?16)
                ON CONFLICT(intake_job_id, provider_record_ref, field_name) DO UPDATE SET
                    match_result_id = excluded.match_result_id,
                    target_metadata_table = excluded.target_metadata_table,
                    current_value = excluded.current_value,
                    suggested_value = excluded.suggested_value,
                    provider_name = excluded.provider_name,
                    confidence_score = excluded.confidence_score,
                    confidence_band = excluded.confidence_band,
                    reason = excluded.reason,
                    mismatch_reasons_json = excluded.mismatch_reasons_json,
                    warning_flags_json = excluded.warning_flags_json,
                    review_status = CASE
                        WHEN suggested_metadata_corrections.review_decision = 'not_decided'
                        THEN excluded.review_status
                        ELSE suggested_metadata_corrections.review_status
                    END,
                    updated_at = excluded.updated_at",
                params![
                    correction_id,
                    match_result_id,
                    job.intake_job_id,
                    correction.target_metadata_table,
                    correction.field_name,
                    correction.current_value,
                    correction.suggested_value,
                    correction.provider_name,
                    correction.provider_record_ref,
                    correction.confidence_score,
                    correction.confidence_band,
                    correction.reason,
                    correction_mismatch_reasons_json,
                    correction_warning_flags_json,
                    review_status,
                    saved_at
                ],
            )
            .map_err(|error| format!("Unable to persist suggested metadata correction: {error}"))?;
            let persisted_correction =
                read_suggested_metadata_correction_from_connection(&tx, &correction_id)?;
            insert_metadata_correction_audit_event_from_correction(
                &tx,
                &persisted_correction,
                "correction_created",
                "Suggested metadata correction was created or refreshed for human review.",
                None,
                &saved_at,
            )?;
            correction_count += 1;
        }
    }

    tx.commit().map_err(|error| {
        format!("Unable to commit suggested metadata correction transaction: {error}")
    })?;

    Ok(CreateMockExternalMetadataReviewQueueResult {
        blockers: Vec::new(),
        correction_count,
        db_path: db_path.to_string_lossy().to_string(),
        match_result_count,
        saved: true,
        warnings: vec![
            "Mock provider only: no real external metadata API was called.".to_string(),
            "No SourceCard or structured bibliographic metadata is mutated.".to_string(),
            "Approval in this sprint updates correction review state only.".to_string(),
        ],
    })
}

fn list_suggested_metadata_corrections_from_connection(
    connection: &Connection,
    request: SuggestedMetadataCorrectionListRequest,
) -> Result<Vec<SavedSuggestedMetadataCorrection>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                id,
                match_result_id,
                intake_job_id,
                source_card_id,
                target_metadata_table,
                field_name,
                current_value,
                suggested_value,
                provider_name,
                provider_record_ref,
                confidence_score,
                confidence_band,
                reason,
                mismatch_reasons_json,
                warning_flags_json,
                review_status,
                review_decision,
                reviewer_edited_value,
                reviewer_note,
                created_at,
                updated_at
            FROM suggested_metadata_corrections
            ORDER BY updated_at DESC, intake_job_id ASC, field_name ASC",
        )
        .map_err(|error| format!("Unable to prepare suggested correction list: {error}"))?;

    let rows = statement
        .query_map([], map_suggested_metadata_correction_row)
        .map_err(|error| format!("Unable to list suggested metadata corrections: {error}"))?;
    let mut corrections = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to read suggested metadata correction row: {error}"))?;

    if let Some(filter) = normalize_optional_text(request.review_status.as_deref()) {
        corrections.retain(|correction| correction.review_status == filter);
    }
    if let Some(filter) = normalize_optional_text(request.confidence_band.as_deref()) {
        corrections.retain(|correction| correction.confidence_band == filter);
    }
    if let Some(filter) = normalize_optional_text(request.intake_job_id.as_deref()) {
        corrections.retain(|correction| correction.intake_job_id == filter);
    }

    Ok(corrections)
}

fn read_suggested_metadata_correction_from_connection(
    connection: &Connection,
    correction_id: &str,
) -> Result<SavedSuggestedMetadataCorrection, String> {
    let trimmed_id = correction_id.trim();
    connection
        .query_row(
            "SELECT
                id,
                match_result_id,
                intake_job_id,
                source_card_id,
                target_metadata_table,
                field_name,
                current_value,
                suggested_value,
                provider_name,
                provider_record_ref,
                confidence_score,
                confidence_band,
                reason,
                mismatch_reasons_json,
                warning_flags_json,
                review_status,
                review_decision,
                reviewer_edited_value,
                reviewer_note,
                created_at,
                updated_at
            FROM suggested_metadata_corrections
            WHERE id = ?1",
            params![trimmed_id],
            map_suggested_metadata_correction_row,
        )
        .optional()
        .map_err(|error| format!("Unable to read suggested metadata correction: {error}"))?
        .ok_or_else(|| format!("Suggested metadata correction not found: {trimmed_id}"))
}

fn update_suggested_metadata_correction_review_state_to_connection(
    connection: &mut Connection,
    db_path: PathBuf,
    request: UpdateSuggestedMetadataCorrectionReviewStateRequest,
) -> Result<UpdateSuggestedMetadataCorrectionReviewStateResult, String> {
    let mut blockers = Vec::new();
    let mut warnings = vec![
        "Review state update only: metadata is not applied to SourceCards.".to_string(),
        "SourceCard citationText is not overwritten.".to_string(),
    ];
    let correction_id = request.correction_id.trim().to_string();
    let review_decision = request.review_decision.trim().to_string();

    require_text(&mut blockers, "correctionId", &correction_id);
    require_text(&mut blockers, "reviewDecision", &review_decision);

    let review_status = match review_decision.as_str() {
        "approved_suggested_value" => "approved",
        "rejected_suggested_value" => "rejected",
        "edited_before_approval" => {
            if normalize_optional_text(request.reviewer_edited_value.as_deref()).is_none() {
                blockers.push(
                    "Reviewer edited value is required for edit-before-approval.".to_string(),
                );
            }
            "edited"
        }
        "deferred_needs_more_evidence" => "deferred_needs_more_evidence",
        _ => {
            blockers.push("Review decision is unsupported.".to_string());
            "pending"
        }
    };

    if !blockers.is_empty() {
        return Ok(UpdateSuggestedMetadataCorrectionReviewStateResult {
            audit_event_count: 0,
            blockers,
            correction: None,
            db_path: db_path.to_string_lossy().to_string(),
            latest_audit_event: None,
            saved: false,
            warnings,
        });
    }

    let previous_correction =
        read_suggested_metadata_correction_from_connection(connection, &correction_id)?;

    let saved_at = create_unix_millis_timestamp();
    let tx = connection.transaction().map_err(|error| {
        format!("Unable to start suggested correction review transaction: {error}")
    })?;
    let updated_rows = tx
        .execute(
            "UPDATE suggested_metadata_corrections
            SET
                review_status = ?2,
                review_decision = ?3,
                reviewer_edited_value = ?4,
                reviewer_note = ?5,
                updated_at = ?6
            WHERE id = ?1",
            params![
                correction_id,
                review_status,
                review_decision,
                normalize_optional_text(request.reviewer_edited_value.as_deref()),
                normalize_optional_text(request.reviewer_note.as_deref()),
                saved_at
            ],
        )
        .map_err(|error| format!("Unable to update suggested metadata correction: {error}"))?;

    if updated_rows == 0 {
        return Err(format!(
            "Suggested metadata correction not found: {correction_id}"
        ));
    }

    let mut correction = previous_correction.clone();
    correction.review_status = review_status.to_string();
    correction.review_decision = review_decision.clone();
    correction.reviewer_edited_value =
        normalize_optional_text(request.reviewer_edited_value.as_deref());
    correction.reviewer_note = normalize_optional_text(request.reviewer_note.as_deref());
    correction.updated_at = saved_at.clone();
    let event_type = audit_event_type_for_review_decision(&review_decision);
    let event_summary = format!(
        "Review decision updated from {}/{} to {}/{}.",
        previous_correction.review_status,
        previous_correction.review_decision,
        correction.review_status,
        correction.review_decision
    );
    let latest_audit_event = insert_metadata_correction_audit_event_from_correction(
        &tx,
        &correction,
        event_type,
        &event_summary,
        correction.reviewer_note.clone(),
        &saved_at,
    )?;

    tx.commit().map_err(|error| {
        format!("Unable to commit suggested correction review transaction: {error}")
    })?;

    let correction =
        read_suggested_metadata_correction_from_connection(connection, &correction_id)?;
    let audit_event_count =
        count_metadata_correction_audit_events_for_correction(connection, &correction_id)?;
    warnings
        .push("Approval here means review decision only, not metadata application.".to_string());

    Ok(UpdateSuggestedMetadataCorrectionReviewStateResult {
        audit_event_count,
        blockers: Vec::new(),
        correction: Some(correction),
        db_path: db_path.to_string_lossy().to_string(),
        latest_audit_event: Some(latest_audit_event),
        saved: true,
        warnings,
    })
}

fn create_metadata_correction_audit_event_to_connection(
    connection: &Connection,
    db_path: PathBuf,
    request: CreateMetadataCorrectionAuditEventRequest,
) -> Result<CreateMetadataCorrectionAuditEventResult, String> {
    let mut blockers = Vec::new();
    let correction_id = request.correction_id.trim().to_string();
    let event_type = request.event_type.trim().to_string();

    require_text(&mut blockers, "correctionId", &correction_id);
    require_text(&mut blockers, "eventType", &event_type);
    if !is_supported_metadata_correction_audit_event_type(&event_type) {
        blockers.push("Metadata correction audit event type is unsupported.".to_string());
    }

    if !blockers.is_empty() {
        return Ok(CreateMetadataCorrectionAuditEventResult {
            blockers,
            db_path: db_path.to_string_lossy().to_string(),
            event: None,
            saved: false,
            warnings: metadata_correction_audit_warnings(),
        });
    }

    let correction =
        read_suggested_metadata_correction_from_connection(connection, &correction_id)?;
    let saved_at = create_unix_millis_timestamp();
    let event_summary = request
        .event_summary
        .as_deref()
        .and_then(|value| normalize_optional_text(Some(value)))
        .unwrap_or_else(|| format!("Metadata correction audit event recorded: {event_type}."));
    let event = insert_metadata_correction_audit_event_from_correction(
        connection,
        &correction,
        &event_type,
        &event_summary,
        normalize_optional_text(request.reviewer_note.as_deref()),
        &saved_at,
    )?;

    Ok(CreateMetadataCorrectionAuditEventResult {
        blockers: Vec::new(),
        db_path: db_path.to_string_lossy().to_string(),
        event: Some(event),
        saved: true,
        warnings: metadata_correction_audit_warnings(),
    })
}

fn run_metadata_correction_apply_dry_run_to_connection(
    connection: &Connection,
    request: RunMetadataCorrectionApplyDryRunRequest,
) -> Result<MetadataCorrectionApplyDryRunResult, String> {
    let correction_id = request.correction_id.trim();
    if correction_id.is_empty() {
        return Err("correctionId is required.".to_string());
    }

    let correction = read_suggested_metadata_correction_from_connection(connection, correction_id)?;
    let mut blockers = Vec::new();
    let mut warnings = metadata_correction_apply_dry_run_warnings();
    let target_table = correction.target_metadata_table.clone();
    let target_field = correction.field_name.clone();
    let target_status = resolve_metadata_correction_target(&target_table, &target_field);
    let mut current_stored_value: Option<String> = None;

    if let Err(blocker) = target_status {
        blockers.push(blocker);
    }

    if correction.review_decision != "approved_suggested_value"
        && correction.review_decision != "edited_before_approval"
    {
        blockers.push(
            "Correction must be approved or edited-before-approval before dry-run apply."
                .to_string(),
        );
    }

    let intended_apply_value = if correction.review_decision == "edited_before_approval" {
        correction.reviewer_edited_value.clone()
    } else {
        Some(correction.suggested_value.clone())
    }
    .and_then(|value| normalize_optional_text(Some(&value)));

    if intended_apply_value.is_none() {
        blockers.push("Intended future apply value is empty.".to_string());
    }

    if correction.confidence_band == "low" && correction.reviewer_note.is_none() {
        blockers.push(
            "Low confidence correction requires reviewer note before dry-run can pass.".to_string(),
        );
    }

    let warning_flags = parse_json_string_array_fallback(&correction.warning_flags_json);
    if warning_flags
        .iter()
        .any(|flag| contains_review_blocking_warning(flag))
    {
        blockers.push(
            "Correction warning flags require human review before apply dry-run can pass."
                .to_string(),
        );
    }

    if target_field == "citationText"
        || target_field == "verifiedReferenceText"
        || target_field == "apaFinalVerified"
    {
        blockers.push(
            "Blocked target: correction dry-run cannot target citationText or APA-final fields."
                .to_string(),
        );
    }

    let source_card_id = correction.source_card_id.clone();
    let mut source_card_detail: Option<SavedSourceCardDetail> = None;
    if source_card_id
        .as_deref()
        .and_then(|id| normalize_optional_text(Some(id)))
        .is_none()
    {
        blockers.push("SourceCard linkage is required before apply dry-run.".to_string());
    } else if let Some(id) = source_card_id.as_deref() {
        match read_saved_source_card_from_connection(connection, id) {
            Ok(detail) => {
                current_stored_value =
                    read_current_stored_value_for_correction(connection, &detail, &correction)?;
                source_card_detail = Some(detail);
            }
            Err(_) => {
                blockers.push(format!("Linked SourceCard not found: {id}"));
            }
        }
    }

    let stale_check_status = stale_check_status_for_values(
        current_stored_value.as_deref(),
        correction.current_value.as_deref(),
    );
    if stale_check_status == "stale_current_value" {
        blockers.push(
            "Current stored metadata differs from the correction original ATP value.".to_string(),
        );
    }

    if source_card_detail.is_some() && target_table == "source_card_bibliographic_metadata" {
        warnings.push(
            "Structured metadata dry-run reads current value only; future apply still needs explicit command."
                .to_string(),
        );
    }

    let dry_run_status = derive_metadata_correction_apply_dry_run_status(
        &blockers,
        &correction,
        &target_table,
        &target_field,
        &stale_check_status,
    );
    let audit_event_type = if blockers.is_empty() {
        "apply_preflight_passed"
    } else {
        "apply_preflight_blocked"
    };
    let audit_event_preview = format!(
        "{} for {}. No metadata will be applied.",
        audit_event_type, correction.correction_id
    );
    let mut audit_event = None;
    let write_audit_event = request.write_audit_event.unwrap_or(true);
    if write_audit_event {
        let saved_at = create_unix_millis_timestamp();
        audit_event = Some(insert_metadata_correction_audit_event_from_correction(
            connection,
            &correction,
            audit_event_type,
            &audit_event_preview,
            correction.reviewer_note.clone(),
            &saved_at,
        )?);
    }

    Ok(MetadataCorrectionApplyDryRunResult {
        audit_event_preview,
        audit_event_written: audit_event.is_some(),
        audit_event,
        blockers,
        confidence_band: correction.confidence_band,
        confidence_score: correction.confidence_score,
        correction_id: correction.correction_id,
        current_stored_value,
        dry_run_status: dry_run_status.to_string(),
        intake_job_id: correction.intake_job_id,
        intended_apply_value,
        next_action: next_action_for_apply_dry_run_status(dry_run_status).to_string(),
        no_overwrite_policy: metadata_correction_apply_dry_run_no_overwrite_policy(),
        original_correction_value: correction.current_value,
        reviewer_edited_value: correction.reviewer_edited_value,
        source_card_id,
        stale_check_status,
        suggested_value: correction.suggested_value,
        target_field_name: target_field,
        target_metadata_table: target_table,
        warnings,
    })
}

fn list_metadata_correction_audit_events_from_connection(
    connection: &Connection,
    request: MetadataCorrectionAuditEventListRequest,
) -> Result<Vec<SavedMetadataCorrectionAuditEvent>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
                id,
                correction_id,
                intake_job_id,
                source_card_id,
                event_type,
                event_summary,
                target_metadata_table,
                target_field_name,
                original_atp_value,
                external_suggested_value,
                reviewer_edited_value,
                applied_value,
                provider_name,
                provider_record_ref,
                confidence_score,
                confidence_band,
                source_metadata_snapshot_json,
                warning_flags_json,
                reviewer_note,
                created_at
            FROM metadata_correction_audit_events
            ORDER BY created_at DESC, id ASC",
        )
        .map_err(|error| {
            format!("Unable to prepare metadata correction audit event list: {error}")
        })?;

    let rows = statement
        .query_map([], map_metadata_correction_audit_event_row)
        .map_err(|error| format!("Unable to list metadata correction audit events: {error}"))?;
    let mut events = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Unable to read metadata correction audit event row: {error}"))?;

    if let Some(filter) = normalize_optional_text(request.correction_id.as_deref()) {
        events.retain(|event| event.correction_id == filter);
    }
    if let Some(filter) = normalize_optional_text(request.intake_job_id.as_deref()) {
        events.retain(|event| event.intake_job_id == filter);
    }

    Ok(events)
}

fn insert_metadata_correction_audit_event_from_correction(
    connection: &Connection,
    correction: &SavedSuggestedMetadataCorrection,
    event_type: &str,
    event_summary: &str,
    reviewer_note: Option<String>,
    created_at: &str,
) -> Result<SavedMetadataCorrectionAuditEvent, String> {
    if !is_supported_metadata_correction_audit_event_type(event_type) {
        return Err(format!(
            "Metadata correction audit event type is unsupported: {event_type}"
        ));
    }

    let audit_event_id = create_metadata_correction_audit_event_id(
        connection,
        &correction.correction_id,
        event_type,
        created_at,
    )?;
    let source_metadata_snapshot_json = serde_json::json!({
        "correctionId": correction.correction_id,
        "intakeJobId": correction.intake_job_id,
        "sourceCardId": correction.source_card_id,
        "targetMetadataTable": correction.target_metadata_table,
        "fieldName": correction.field_name,
        "reviewStatus": correction.review_status,
        "reviewDecision": correction.review_decision,
        "noApplyBoundary": true
    })
    .to_string();

    connection
        .execute(
            "INSERT INTO metadata_correction_audit_events (
                id,
                correction_id,
                intake_job_id,
                source_card_id,
                event_type,
                event_summary,
                target_metadata_table,
                target_field_name,
                original_atp_value,
                external_suggested_value,
                reviewer_edited_value,
                applied_value,
                provider_name,
                provider_record_ref,
                confidence_score,
                confidence_band,
                source_metadata_snapshot_json,
                warning_flags_json,
                reviewer_note,
                created_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, NULL, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            params![
                audit_event_id,
                correction.correction_id,
                correction.intake_job_id,
                correction.source_card_id,
                event_type,
                event_summary,
                correction.target_metadata_table,
                correction.field_name,
                correction.current_value,
                correction.suggested_value,
                correction.reviewer_edited_value,
                correction.provider_name,
                correction.provider_record_ref,
                correction.confidence_score,
                correction.confidence_band,
                source_metadata_snapshot_json,
                correction.warning_flags_json,
                reviewer_note,
                created_at
            ],
        )
        .map_err(|error| format!("Unable to insert metadata correction audit event: {error}"))?;

    read_metadata_correction_audit_event_from_connection(connection, &audit_event_id)
}

fn read_metadata_correction_audit_event_from_connection(
    connection: &Connection,
    audit_event_id: &str,
) -> Result<SavedMetadataCorrectionAuditEvent, String> {
    connection
        .query_row(
            "SELECT
                id,
                correction_id,
                intake_job_id,
                source_card_id,
                event_type,
                event_summary,
                target_metadata_table,
                target_field_name,
                original_atp_value,
                external_suggested_value,
                reviewer_edited_value,
                applied_value,
                provider_name,
                provider_record_ref,
                confidence_score,
                confidence_band,
                source_metadata_snapshot_json,
                warning_flags_json,
                reviewer_note,
                created_at
            FROM metadata_correction_audit_events
            WHERE id = ?1",
            params![audit_event_id],
            map_metadata_correction_audit_event_row,
        )
        .optional()
        .map_err(|error| format!("Unable to read metadata correction audit event: {error}"))?
        .ok_or_else(|| format!("Metadata correction audit event not found: {audit_event_id}"))
}

fn count_metadata_correction_audit_events_for_correction(
    connection: &Connection,
    correction_id: &str,
) -> Result<usize, String> {
    connection
        .query_row(
            "SELECT COUNT(*) FROM metadata_correction_audit_events WHERE correction_id = ?1",
            params![correction_id],
            |row| row.get::<_, i64>(0),
        )
        .map(|count| count as usize)
        .map_err(|error| format!("Unable to count metadata correction audit events: {error}"))
}

fn create_metadata_correction_audit_event_id(
    connection: &Connection,
    correction_id: &str,
    event_type: &str,
    created_at: &str,
) -> Result<String, String> {
    let existing_count =
        count_metadata_correction_audit_events_for_correction(connection, correction_id)?;
    Ok(format!(
        "metadata-audit-{}-{}-{}-{}",
        slugify_identifier(correction_id),
        slugify_identifier(event_type),
        slugify_identifier(created_at),
        existing_count + 1
    ))
}

fn audit_event_type_for_review_decision(review_decision: &str) -> &'static str {
    match review_decision {
        "approved_suggested_value" => "correction_approved",
        "rejected_suggested_value" => "correction_rejected",
        "edited_before_approval" => "correction_edited_before_approval",
        "deferred_needs_more_evidence" => "correction_deferred",
        _ => "correction_routed",
    }
}

fn is_supported_metadata_correction_audit_event_type(event_type: &str) -> bool {
    matches!(
        event_type,
        "correction_created"
            | "correction_approved"
            | "correction_rejected"
            | "correction_edited_before_approval"
            | "correction_deferred"
            | "correction_routed"
            | "match_result_persisted"
            | "apply_preflight_passed"
            | "apply_preflight_blocked"
    )
}

fn metadata_correction_audit_warnings() -> Vec<String> {
    vec![
        "Audit trail only: metadata corrections are not applied.".to_string(),
        "SourceCard metadata is not changed by audit events.".to_string(),
        "Structured bibliographic metadata is not changed by audit events.".to_string(),
        "SourceCard citationText is not overwritten.".to_string(),
        "APA-final verification is not set.".to_string(),
    ]
}

fn map_metadata_correction_audit_event_row(
    row: &rusqlite::Row<'_>,
) -> rusqlite::Result<SavedMetadataCorrectionAuditEvent> {
    Ok(SavedMetadataCorrectionAuditEvent {
        audit_event_id: row.get(0)?,
        correction_id: row.get(1)?,
        intake_job_id: row.get(2)?,
        source_card_id: row.get(3)?,
        event_type: row.get(4)?,
        event_summary: row.get(5)?,
        target_metadata_table: row.get(6)?,
        target_field_name: row.get(7)?,
        original_atp_value: row.get(8)?,
        external_suggested_value: row.get(9)?,
        reviewer_edited_value: row.get(10)?,
        applied_value: row.get(11)?,
        provider_name: row.get(12)?,
        provider_record_ref: row.get(13)?,
        confidence_score: row.get(14)?,
        confidence_band: row.get(15)?,
        source_metadata_snapshot_json: row.get(16)?,
        warning_flags_json: row.get(17)?,
        reviewer_note: row.get(18)?,
        created_at: row.get(19)?,
    })
}

fn resolve_metadata_correction_target(
    target_table: &str,
    target_field: &str,
) -> Result<(), String> {
    match (target_table, target_field) {
        ("source_cards", "title")
        | ("source_cards", "authors")
        | ("source_cards", "year")
        | ("source_cards", "sourceType") => Ok(()),
        ("source_cards", "citationText") => Err(
            "Unsupported target: SourceCard citationText cannot be changed by correction dry-run."
                .to_string(),
        ),
        (
            "source_card_bibliographic_metadata",
            "publisher"
            | "journal"
            | "containerTitle"
            | "edition"
            | "volume"
            | "issue"
            | "pageRange"
            | "doi"
            | "url"
            | "accessDate",
        ) => Ok(()),
        ("source_card_bibliographic_metadata", "isbn") => Err(
            "Unsupported target: ISBN is not stored in the current structured metadata schema."
                .to_string(),
        ),
        ("source_card_bibliographic_metadata", "apaFinalVerified")
        | ("source_card_bibliographic_metadata", "verifiedReferenceText") => Err(
            "Unsupported target: APA-final verification fields cannot be changed by correction dry-run."
                .to_string(),
        ),
        _ => Err(format!(
            "Unsupported metadata correction target: {target_table}.{target_field}"
        )),
    }
}

fn read_current_stored_value_for_correction(
    connection: &Connection,
    source_card_detail: &SavedSourceCardDetail,
    correction: &SavedSuggestedMetadataCorrection,
) -> Result<Option<String>, String> {
    if correction.target_metadata_table == "source_cards" {
        return Ok(match correction.field_name.as_str() {
            "title" => Some(source_card_detail.source_card.title.clone()),
            "authors" => source_card_detail.source_card.authors.clone(),
            "year" => source_card_detail.source_card.year.clone(),
            "sourceType" => Some(source_card_detail.source_card.source_type.clone()),
            "citationText" => Some(source_card_detail.source_card.citation_text.clone()),
            _ => None,
        });
    }

    if correction.target_metadata_table == "source_card_bibliographic_metadata" {
        let metadata = get_source_card_bibliographic_metadata_from_connection(
            connection,
            &source_card_detail.source_card.source_card_id,
        )?;

        return Ok(
            metadata.and_then(|metadata| match correction.field_name.as_str() {
                "publisher" => metadata.publisher,
                "journal" => metadata.journal,
                "containerTitle" => metadata.container_title,
                "edition" => metadata.edition,
                "volume" => metadata.volume,
                "issue" => metadata.issue,
                "pageRange" => metadata.page_range,
                "doi" => metadata.doi,
                "url" => metadata.url,
                "accessDate" => metadata.access_date,
                _ => None,
            }),
        );
    }

    Ok(None)
}

fn stale_check_status_for_values(
    current_stored_value: Option<&str>,
    original_correction_value: Option<&str>,
) -> String {
    if normalize_string(current_stored_value) == normalize_string(original_correction_value) {
        "matches_original".to_string()
    } else {
        "stale_current_value".to_string()
    }
}

fn derive_metadata_correction_apply_dry_run_status<'a>(
    blockers: &[String],
    correction: &SavedSuggestedMetadataCorrection,
    target_table: &str,
    target_field: &str,
    stale_check_status: &str,
) -> &'a str {
    if blockers
        .iter()
        .any(|blocker| blocker.contains("SourceCard linkage"))
    {
        return "missing_source_card";
    }
    if blockers
        .iter()
        .any(|blocker| blocker.contains("Linked SourceCard not found"))
    {
        return "missing_source_card";
    }
    if resolve_metadata_correction_target(target_table, target_field).is_err() {
        return "unsupported_target";
    }
    if correction.confidence_band == "low" && correction.reviewer_note.is_none() {
        return "low_confidence_requires_note";
    }
    if stale_check_status == "stale_current_value" {
        return "stale_current_value";
    }
    if !blockers.is_empty() {
        return "blocked";
    }
    if correction.review_status == "needs_human_review"
        || correction.review_status == "low_confidence"
    {
        return "needs_review";
    }
    "ready_to_apply_later"
}

fn next_action_for_apply_dry_run_status(status: &str) -> &'static str {
    match status {
        "ready_to_apply_later" => {
            "Dry-run passed. A future explicit apply command is still required."
        }
        "stale_current_value" => "Review current metadata before any future apply.",
        "unsupported_target" => "Choose a supported metadata field before future apply.",
        "missing_source_card" => "Link the correction to a saved SourceCard before future apply.",
        "low_confidence_requires_note" => "Add reviewer note and evidence before future apply.",
        "needs_review" => "Complete human review before future apply.",
        _ => "Resolve blockers before future apply.",
    }
}

fn metadata_correction_apply_dry_run_warnings() -> Vec<String> {
    vec![
        "Dry-run only: no metadata has been applied.".to_string(),
        "Approval is not verified metadata.".to_string(),
        "SourceCard metadata is not changed.".to_string(),
        "Structured bibliographic metadata is not changed.".to_string(),
        "SourceCard citationText is not overwritten.".to_string(),
        "APA-final verification is not set.".to_string(),
        "A future explicit apply command is still required.".to_string(),
    ]
}

fn metadata_correction_apply_dry_run_no_overwrite_policy() -> Vec<String> {
    vec![
        "No SourceCard update command is called.".to_string(),
        "No structured bibliographic metadata upsert command is called.".to_string(),
        "SourceCard citationText is blocked.".to_string(),
        "APA-final verification is blocked.".to_string(),
        "Dry-run may write apply_preflight audit events only.".to_string(),
    ]
}

fn parse_json_string_array_fallback(value: &str) -> Vec<String> {
    serde_json::from_str::<Vec<String>>(value).unwrap_or_default()
}

fn contains_review_blocking_warning(value: &str) -> bool {
    let normalized = value.to_ascii_lowercase();
    normalized.contains("provider conflict")
        || normalized.contains("duplicate")
        || normalized.contains("blocker")
        || normalized.contains("requires review")
}

fn map_suggested_metadata_correction_row(
    row: &rusqlite::Row<'_>,
) -> rusqlite::Result<SavedSuggestedMetadataCorrection> {
    Ok(SavedSuggestedMetadataCorrection {
        correction_id: row.get(0)?,
        match_result_id: row.get(1)?,
        intake_job_id: row.get(2)?,
        source_card_id: row.get(3)?,
        target_metadata_table: row.get(4)?,
        field_name: row.get(5)?,
        current_value: row.get(6)?,
        suggested_value: row.get(7)?,
        provider_name: row.get(8)?,
        provider_record_ref: row.get(9)?,
        confidence_score: row.get(10)?,
        confidence_band: row.get(11)?,
        reason: row.get(12)?,
        mismatch_reasons_json: row.get(13)?,
        warning_flags_json: row.get(14)?,
        review_status: row.get(15)?,
        review_decision: row.get(16)?,
        reviewer_edited_value: row.get(17)?,
        reviewer_note: row.get(18)?,
        created_at: row.get(19)?,
        updated_at: row.get(20)?,
    })
}

fn map_mock_external_metadata_match(
    job: &SavedBatchResearchIntakeJob,
) -> MockExternalMetadataMatchSummary {
    let mut candidates = get_mock_external_metadata_match_candidates(job);
    candidates.sort_by(|left, right| right.provider_confidence.cmp(&left.provider_confidence));
    let Some(best_candidate) = candidates.first() else {
        return MockExternalMetadataMatchSummary {
            blockers: Vec::new(),
            confidence_band: "none".to_string(),
            confidence_score: 0,
            match_reasons: Vec::new(),
            match_status: "no_match".to_string(),
            mismatch_reasons: vec![
                "No mock provider candidate matched this queue record.".to_string()
            ],
            provider_candidates: Vec::new(),
            warnings: create_mock_match_boundary_warnings(vec![
                "No external metadata match is available from the mock provider fixture."
                    .to_string(),
            ]),
        };
    };

    let confidence_score = score_mock_candidate(job, best_candidate);
    let confidence_band = confidence_band_for_score(confidence_score);
    let title_overlap = title_token_overlap(
        &derive_local_title(&job.file_name),
        &best_candidate.matched_title,
    );
    let source_type_compatible = is_mock_source_type_compatible(job, best_candidate);
    let candidate_warnings = best_candidate.warnings.clone();

    MockExternalMetadataMatchSummary {
        blockers: Vec::new(),
        confidence_band: confidence_band.to_string(),
        confidence_score,
        match_reasons: vec![
            format!(
                "Mock provider confidence: {}/100.",
                best_candidate.provider_confidence
            ),
            format!(
                "Title token overlap: {}%.",
                (title_overlap * 100.0).round() as i64
            ),
            if source_type_compatible {
                "File type and suggested source type are compatible.".to_string()
            } else {
                "File type and suggested source type need human confirmation.".to_string()
            },
        ],
        match_status: match confidence_band {
            "high" => "high_confidence_match",
            "medium" => "medium_confidence_match",
            "low" => "low_confidence_match",
            _ => "no_match",
        }
        .to_string(),
        mismatch_reasons: if source_type_compatible {
            Vec::new()
        } else {
            vec![format!(
                "Queue file type {} does not directly confirm {}.",
                job.file_type, best_candidate.matched_source_type
            )]
        },
        provider_candidates: candidates,
        warnings: create_mock_match_boundary_warnings(candidate_warnings),
    }
}

fn get_mock_external_metadata_match_candidates(
    job: &SavedBatchResearchIntakeJob,
) -> Vec<MockExternalMetadataMatchCandidate> {
    let normalized_file_name = job.file_name.to_lowercase();

    if normalized_file_name.contains("nomatch") || normalized_file_name.contains("unmatched") {
        return Vec::new();
    }

    if normalized_file_name.contains("service-quality-chapter") {
        return vec![MockExternalMetadataMatchCandidate {
            matched_authors: vec![
                "Parasuraman, A.".to_string(),
                "Zeithaml, V. A.".to_string(),
                "Berry, L. L.".to_string(),
            ],
            matched_container_title: Some("Services Marketing Teaching Compendium".to_string()),
            matched_doi: None,
            matched_isbn: Some("978-0-0000-0000-0".to_string()),
            matched_issue: None,
            matched_journal: None,
            matched_page_range: Some("41-58".to_string()),
            matched_publisher: Some("Mock Academic Press".to_string()),
            matched_source_type: "book_chapter".to_string(),
            matched_title: "Service Quality Foundations for Customer Satisfaction".to_string(),
            matched_url: None,
            matched_volume: None,
            matched_year: Some("1988".to_string()),
            provider_confidence: 91,
            provider_id: "mock-crossref-local-fixture".to_string(),
            provider_name: "Mock Crossref Fixture".to_string(),
            provider_record_ref: "mock:crossref:service-quality-chapter".to_string(),
            provider_type: "crossref_mock".to_string(),
            warnings: vec![
                "Mock high-confidence fixture; bibliographic details are not verified authority data."
                    .to_string(),
            ],
        }];
    }

    if normalized_file_name.contains("article") || normalized_file_name.contains("report") {
        return vec![MockExternalMetadataMatchCandidate {
            matched_authors: vec!["Cronin, J. J.".to_string(), "Taylor, S. A.".to_string()],
            matched_container_title: None,
            matched_doi: Some("10.0000/mock-service-quality-article".to_string()),
            matched_isbn: None,
            matched_issue: Some("1".to_string()),
            matched_journal: Some("Journal of Service Quality Studies".to_string()),
            matched_page_range: Some("12-29".to_string()),
            matched_publisher: None,
            matched_source_type: "academic_journal_article".to_string(),
            matched_title: "Service Quality Article on Satisfaction and Performance".to_string(),
            matched_url: Some("https://example.invalid/mock-service-quality-article".to_string()),
            matched_volume: Some("7".to_string()),
            matched_year: Some("1992".to_string()),
            provider_confidence: 64,
            provider_id: "mock-openalex-local-fixture".to_string(),
            provider_name: "Mock OpenAlex Fixture".to_string(),
            provider_record_ref: "mock:openalex:service-quality-article".to_string(),
            provider_type: "openalex_mock".to_string(),
            warnings: vec![
                "Mock medium-confidence fixture; title and source type require human confirmation."
                    .to_string(),
            ],
        }];
    }

    if normalized_file_name.contains("ambiguous") {
        return vec![MockExternalMetadataMatchCandidate {
            matched_authors: Vec::new(),
            matched_container_title: None,
            matched_doi: None,
            matched_isbn: None,
            matched_issue: None,
            matched_journal: None,
            matched_page_range: None,
            matched_publisher: None,
            matched_source_type: "unknown_pending_review".to_string(),
            matched_title: "Ambiguous Local Source Note".to_string(),
            matched_url: None,
            matched_volume: None,
            matched_year: None,
            provider_confidence: 28,
            provider_id: "mock-manual-metadata-fixture".to_string(),
            provider_name: "Mock Manual Metadata Fixture".to_string(),
            provider_record_ref: "mock:manual-fixture:ambiguous-source".to_string(),
            provider_type: "manual_fixture_mock".to_string(),
            warnings: vec!["Mock low-confidence fixture; use only as a review prompt.".to_string()],
        }];
    }

    Vec::new()
}

fn create_mock_suggested_metadata_corrections(
    job: &SavedBatchResearchIntakeJob,
    match_summary: &MockExternalMetadataMatchSummary,
) -> Vec<MockSuggestedMetadataCorrection> {
    let Some(candidate) = match_summary.provider_candidates.first() else {
        return Vec::new();
    };

    let mut corrections = Vec::new();
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "title",
        Some(derive_local_title(&job.file_name)),
        Some(candidate.matched_title.clone()),
        "source_cards",
        "Provider title differs from the local file-name-derived title.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "sourceType",
        Some(job.source_type_guess.clone()),
        Some(candidate.matched_source_type.clone()),
        "source_cards",
        "Provider suggests a bibliographic source type.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "authors",
        None,
        optional_joined_authors(&candidate.matched_authors),
        "source_cards",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "year",
        None,
        candidate.matched_year.clone(),
        "source_cards",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "journal",
        None,
        candidate.matched_journal.clone(),
        "source_card_bibliographic_metadata",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "publisher",
        None,
        candidate.matched_publisher.clone(),
        "source_card_bibliographic_metadata",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "containerTitle",
        None,
        candidate.matched_container_title.clone(),
        "source_card_bibliographic_metadata",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "volume",
        None,
        candidate.matched_volume.clone(),
        "source_card_bibliographic_metadata",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "issue",
        None,
        candidate.matched_issue.clone(),
        "source_card_bibliographic_metadata",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "pageRange",
        None,
        candidate.matched_page_range.clone(),
        "source_card_bibliographic_metadata",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "doi",
        None,
        candidate.matched_doi.clone(),
        "source_card_bibliographic_metadata",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "isbn",
        None,
        candidate.matched_isbn.clone(),
        "source_card_bibliographic_metadata",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );
    push_mock_correction(
        &mut corrections,
        job,
        candidate,
        "url",
        None,
        candidate.matched_url.clone(),
        "source_card_bibliographic_metadata",
        "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    );

    corrections
}

fn push_mock_correction(
    corrections: &mut Vec<MockSuggestedMetadataCorrection>,
    _job: &SavedBatchResearchIntakeJob,
    candidate: &MockExternalMetadataMatchCandidate,
    field_name: &str,
    current_value: Option<String>,
    suggested_value: Option<String>,
    target_metadata_table: &str,
    reason: &str,
) {
    let Some(suggested_value) = suggested_value.filter(|value| !value.trim().is_empty()) else {
        return;
    };

    if normalize_string(current_value.as_deref()) == normalize_string(Some(&suggested_value)) {
        return;
    }

    let confidence_score = score_raw_candidate(candidate);
    corrections.push(MockSuggestedMetadataCorrection {
        confidence_band: confidence_band_for_score(confidence_score).to_string(),
        confidence_score,
        current_value,
        field_name: field_name.to_string(),
        provider_name: candidate.provider_name.clone(),
        provider_record_ref: candidate.provider_record_ref.clone(),
        reason: reason.to_string(),
        suggested_value,
        target_metadata_table: target_metadata_table.to_string(),
    });
}

fn route_suggested_correction_review_status(
    correction: &MockSuggestedMetadataCorrection,
) -> String {
    match correction.confidence_band.as_str() {
        "high" => "ready_for_batch_approval",
        "medium" => "needs_human_review",
        "low" => "low_confidence",
        _ => "needs_human_review",
    }
    .to_string()
}

fn create_mock_match_boundary_warnings(candidate_warnings: Vec<String>) -> Vec<String> {
    let mut warnings = vec![
        "Mock provider only - no Crossref, OpenAlex, DOI, ISBN, web, or AI lookup was performed."
            .to_string(),
        "External metadata is evidence, not truth.".to_string(),
        "No metadata is overwritten automatically.".to_string(),
        "No SourceDocument or SourceCard is created automatically.".to_string(),
        "Human approval is required before any future metadata mutation.".to_string(),
    ];
    warnings.extend(candidate_warnings);
    warnings
}

fn score_mock_candidate(
    job: &SavedBatchResearchIntakeJob,
    candidate: &MockExternalMetadataMatchCandidate,
) -> i64 {
    let title_overlap = title_token_overlap(
        &derive_local_title(&job.file_name),
        &candidate.matched_title,
    );
    let compatibility_adjustment = if is_mock_source_type_compatible(job, candidate) {
        4
    } else {
        -8
    };
    let title_adjustment = if title_overlap >= 0.55 {
        4
    } else if title_overlap >= 0.25 {
        0
    } else {
        -12
    };
    clamp_score(candidate.provider_confidence + compatibility_adjustment + title_adjustment)
}

fn score_raw_candidate(candidate: &MockExternalMetadataMatchCandidate) -> i64 {
    clamp_score(candidate.provider_confidence)
}

fn confidence_band_for_score(score: i64) -> &'static str {
    if score >= 80 {
        "high"
    } else if score >= 55 {
        "medium"
    } else if score >= 25 {
        "low"
    } else {
        "none"
    }
}

fn is_mock_source_type_compatible(
    job: &SavedBatchResearchIntakeJob,
    candidate: &MockExternalMetadataMatchCandidate,
) -> bool {
    match job.file_type.to_uppercase().as_str() {
        "DOCX" => matches!(
            candidate.matched_source_type.as_str(),
            "book_chapter"
                | "docx_manuscript_source_note"
                | "report_white_paper"
                | "unknown_pending_review"
        ),
        "PDF" => matches!(
            candidate.matched_source_type.as_str(),
            "academic_journal_article"
                | "book"
                | "book_chapter"
                | "report_white_paper"
                | "unknown_pending_review"
        ),
        _ => candidate.matched_source_type == "unknown_pending_review",
    }
}

fn title_token_overlap(left: &str, right: &str) -> f64 {
    let left_tokens = title_tokens(left);
    let right_tokens = title_tokens(right);

    if left_tokens.is_empty() || right_tokens.is_empty() {
        return 0.0;
    }

    let matched = left_tokens
        .iter()
        .filter(|token| right_tokens.contains(token))
        .count();
    matched as f64 / left_tokens.len().max(right_tokens.len()) as f64
}

fn title_tokens(value: &str) -> Vec<String> {
    value
        .to_lowercase()
        .split(|character: char| !character.is_ascii_alphanumeric())
        .filter(|token| token.len() > 2 && *token != "the" && *token != "and")
        .map(|token| token.to_string())
        .collect()
}

fn derive_local_title(file_name: &str) -> String {
    file_name
        .rsplit_once('.')
        .map(|(title, _)| title)
        .unwrap_or(file_name)
        .replace(['-', '_'], " ")
        .trim()
        .to_string()
}

fn optional_joined_authors(authors: &[String]) -> Option<String> {
    if authors.is_empty() {
        None
    } else {
        Some(authors.join("; "))
    }
}

fn create_match_result_id(intake_job_id: &str, provider_record_ref: &str) -> String {
    format!(
        "external-match-{}-{}",
        slugify_identifier(intake_job_id),
        slugify_identifier(provider_record_ref)
    )
}

fn create_correction_id(
    intake_job_id: &str,
    provider_record_ref: &str,
    field_name: &str,
) -> String {
    format!(
        "suggested-correction-{}-{}-{}",
        slugify_identifier(intake_job_id),
        slugify_identifier(provider_record_ref),
        slugify_identifier(field_name)
    )
}

fn slugify_identifier(value: &str) -> String {
    let slug = value
        .to_lowercase()
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() {
                character
            } else {
                '-'
            }
        })
        .collect::<String>()
        .split('-')
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("-");

    if slug.is_empty() {
        "unknown".to_string()
    } else {
        slug
    }
}

fn serialize_string_vec(items: &[String]) -> Result<String, String> {
    serde_json::to_string(items)
        .map_err(|error| format!("Unable to serialize string array: {error}"))
}

fn normalize_string(value: Option<&str>) -> String {
    value.unwrap_or("").trim().to_lowercase()
}

fn clamp_score(value: i64) -> i64 {
    value.clamp(0, 100)
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
            "SourceCard metadata cannot be ready while authors or year are missing.".to_string(),
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

fn get_source_card_metadata_review_status(request: &UpdateSourceCardMetadataRequest) -> String {
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
    require_text(&mut blockers, "metadataSource", &request.metadata_source);
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
        blockers.push("APA final verification is not implemented in Sprint 4H-3.".to_string());
    }

    if structured_metadata_status == "complete" && apa_readiness == "not_ready" {
        warnings.push(
            "Structured metadata is marked complete, but APA readiness remains not_ready."
                .to_string(),
        );
    }

    if apa_readiness == "candidate_ready" {
        warnings
            .push("APA reference candidate readiness is not APA-final verification.".to_string());
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
        blockers.push("APA final verification is not implemented in Sprint 4H-8A.".to_string());
    }

    if !matches!(
        verification_scope,
        "internal_drafting" | "teaching_preparation"
    ) {
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
                "Checklist items are required before saving verified_for_internal_use.".to_string(),
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
        "No DOI lookup, web search, AI generation, or APA finalization was performed.".to_string(),
    );

    if blockers.is_empty() && !source_card_exists(connection, source_card_id)? {
        return Err(format!("Saved SourceCard not found: {source_card_id}"));
    }

    Ok(SaveRequestValidation { blockers, warnings })
}

fn validate_batch_research_intake_jobs_request(
    request: &CreateBatchResearchIntakeJobsRequest,
) -> SaveRequestValidation {
    let mut blockers = Vec::new();
    let mut warnings = vec![
        "Queue only: files are not parsed in Sprint 4I-1.".to_string(),
        "No external metadata lookup is performed.".to_string(),
        "No SourceDocument or SourceCard is created automatically.".to_string(),
        "No metadata is overwritten.".to_string(),
    ];

    if request.files.is_empty() {
        blockers.push("At least one PDF or DOCX file is required for batch intake.".to_string());
    }

    for file in &request.files {
        require_text(&mut blockers, "file.intakeJobId", &file.intake_job_id);
        require_text(&mut blockers, "file.fileName", &file.file_name);
        require_text(&mut blockers, "file.fileType", &file.file_type);

        if !matches!(file.file_type.as_str(), "PDF" | "DOCX") {
            blockers.push(format!(
                "Batch intake supports PDF and DOCX only: {}",
                file.file_type
            ));
        }

        if file.file_size.is_none() {
            warnings.push(format!(
                "File size is unavailable for batch intake item: {}",
                file.file_name
            ));
        }

        if normalize_optional_text(file.file_path.as_deref()).is_none() {
            warnings.push(format!(
                "Local file path/reference is unavailable for batch intake item: {}",
                file.file_name
            ));
        }
    }

    SaveRequestValidation { blockers, warnings }
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
                ADD_SOURCE_CARD_APA_REFERENCE_REVIEWS_MIGRATION_ID.to_string(),
                ADD_BATCH_RESEARCH_INTAKE_JOBS_MIGRATION_ID.to_string(),
                ADD_SUGGESTED_METADATA_CORRECTIONS_MIGRATION_ID.to_string(),
                ADD_METADATA_CORRECTION_AUDIT_EVENTS_MIGRATION_ID.to_string(),
                EXPAND_METADATA_CORRECTION_AUDIT_PREFLIGHT_EVENTS_MIGRATION_ID.to_string()
            ]
        );
        assert_eq!(
            read_schema_version(&connection).expect("read schema version"),
            Some(11)
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
        assert_table_exists(&connection, "batch_research_intake_jobs");
        assert_table_exists(&connection, "external_metadata_match_results");
        assert_table_exists(&connection, "suggested_metadata_corrections");
        assert_table_exists(&connection, "metadata_correction_audit_events");

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

        assert_eq!(first_result.len(), 11);
        assert!(second_result.is_empty());

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn creates_one_batch_research_intake_job() {
        let db_path = temp_database_path("batch-intake-one");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let result = create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(vec![batch_intake_file(
                "batch-docx-1",
                "chapter.docx",
                "DOCX",
            )]),
        )
        .expect("create batch intake job");

        assert!(result.saved);
        assert!(result.blockers.is_empty());
        assert_eq!(result.jobs.len(), 1);
        assert_eq!(result.jobs[0].file_name, "chapter.docx");
        assert_eq!(result.jobs[0].file_type, "DOCX");
        assert_eq!(result.jobs[0].queue_status, "queued");
        assert_eq!(result.jobs[0].parser_status, "not_started");
        assert_eq!(result.jobs[0].metadata_extraction_status, "not_started");
        assert_eq!(result.jobs[0].external_match_status, "not_started");
        assert_eq!(result.jobs[0].review_status, "pending");
        assert_eq!(result.jobs[0].duplicate_status, "not_checked");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn creates_multiple_batch_research_intake_jobs_and_lists_newest_first() {
        let db_path = temp_database_path("batch-intake-multiple");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(vec![
                batch_intake_file("batch-docx-old", "old.docx", "DOCX"),
                CreateBatchResearchIntakeJobFile {
                    selected_at: Some("unix-ms:9999999999999".to_string()),
                    ..batch_intake_file("batch-pdf-new", "new.pdf", "PDF")
                },
            ]),
        )
        .expect("create batch intake jobs");

        let jobs = list_batch_research_intake_jobs_from_connection(&connection).expect("list jobs");

        assert_eq!(jobs.len(), 2);
        assert_eq!(jobs[0].intake_job_id, "batch-pdf-new");
        assert_eq!(jobs[1].intake_job_id, "batch-docx-old");

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn batch_research_intake_blocks_unsupported_file_type() {
        let db_path = temp_database_path("batch-intake-unsupported");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let result = create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(vec![batch_intake_file("batch-md", "notes.md", "MD")]),
        )
        .expect("blocked unsupported type");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("PDF and DOCX only")));
        assert_eq!(count_rows(&connection, "batch_research_intake_jobs"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn batch_research_intake_empty_input_is_safe() {
        let db_path = temp_database_path("batch-intake-empty");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let result = create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(Vec::new()),
        )
        .expect("empty input handled");

        assert!(!result.saved);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("At least one PDF or DOCX file")));
        assert_eq!(count_rows(&connection, "batch_research_intake_jobs"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn batch_research_intake_does_not_create_source_documents_or_source_cards() {
        let db_path = temp_database_path("batch-intake-no-source-side-effects");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        let result = create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(vec![
                batch_intake_file("batch-docx-1", "chapter.docx", "DOCX"),
                batch_intake_file("batch-pdf-1", "article.pdf", "PDF"),
            ]),
        )
        .expect("create queue records");

        assert!(result.saved);
        assert_eq!(count_rows(&connection, "batch_research_intake_jobs"), 2);
        assert_eq!(count_rows(&connection, "source_documents"), 0);
        assert_eq!(count_rows(&connection, "source_cards"), 0);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn mock_external_metadata_review_queue_persists_matches_and_corrections() {
        let db_path = temp_database_path("mock-metadata-review-queue");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(vec![
                batch_intake_file(
                    "batch-docx-service",
                    "qa-service-quality-chapter.docx",
                    "DOCX",
                ),
                batch_intake_file("batch-pdf-service", "qa-service-quality-article.pdf", "PDF"),
            ]),
        )
        .expect("create queue records");

        let result = create_mock_external_metadata_review_queue_for_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
        )
        .expect("persist mock review queue");
        let corrections = list_suggested_metadata_corrections_from_connection(
            &connection,
            SuggestedMetadataCorrectionListRequest {
                confidence_band: None,
                intake_job_id: None,
                review_status: None,
            },
        )
        .expect("list corrections");

        assert!(result.saved);
        assert_eq!(result.match_result_count, 2);
        assert!(result.correction_count >= 10);
        assert_eq!(
            count_rows(&connection, "external_metadata_match_results"),
            2
        );
        assert_eq!(
            count_rows(&connection, "suggested_metadata_corrections"),
            corrections.len() as i64
        );
        assert_eq!(
            count_rows(&connection, "metadata_correction_audit_events"),
            corrections.len() as i64
        );
        let audit_events = list_metadata_correction_audit_events_from_connection(
            &connection,
            MetadataCorrectionAuditEventListRequest {
                correction_id: None,
                intake_job_id: None,
            },
        )
        .expect("list audit events");
        assert!(audit_events
            .iter()
            .all(|event| event.event_type == "correction_created"));
        assert!(audit_events
            .iter()
            .all(|event| event.applied_value.is_none()));
        assert!(corrections
            .iter()
            .any(|correction| correction.field_name == "title"
                && correction.current_value.as_deref() == Some("qa service quality chapter")));
        assert!(corrections
            .iter()
            .any(|correction| correction.field_name == "doi"
                && correction.suggested_value == "10.0000/mock-service-quality-article"));

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn mock_external_metadata_review_queue_generation_is_idempotent() {
        let db_path = temp_database_path("mock-metadata-review-idempotent");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(vec![batch_intake_file(
                "batch-docx-service",
                "qa-service-quality-chapter.docx",
                "DOCX",
            )]),
        )
        .expect("create queue records");
        create_mock_external_metadata_review_queue_for_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
        )
        .expect("first generate");
        let first_count = count_rows(&connection, "suggested_metadata_corrections");
        create_mock_external_metadata_review_queue_for_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
        )
        .expect("second generate");

        assert_eq!(
            count_rows(&connection, "external_metadata_match_results"),
            1
        );
        assert_eq!(
            count_rows(&connection, "suggested_metadata_corrections"),
            first_count
        );
        assert!(count_rows(&connection, "metadata_correction_audit_events") >= first_count);

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn suggested_correction_routing_covers_high_medium_and_low_confidence() {
        let db_path = temp_database_path("mock-metadata-review-routing");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");

        create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(vec![
                batch_intake_file(
                    "batch-docx-service",
                    "qa-service-quality-chapter.docx",
                    "DOCX",
                ),
                batch_intake_file("batch-pdf-service", "qa-service-quality-article.pdf", "PDF"),
                batch_intake_file("batch-docx-ambiguous", "ambiguous-local-notes.docx", "DOCX"),
            ]),
        )
        .expect("create queue records");
        create_mock_external_metadata_review_queue_for_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
        )
        .expect("generate corrections");

        let ready = list_suggested_metadata_corrections_from_connection(
            &connection,
            SuggestedMetadataCorrectionListRequest {
                confidence_band: None,
                intake_job_id: None,
                review_status: Some("ready_for_batch_approval".to_string()),
            },
        )
        .expect("list ready corrections");
        let medium = list_suggested_metadata_corrections_from_connection(
            &connection,
            SuggestedMetadataCorrectionListRequest {
                confidence_band: Some("medium".to_string()),
                intake_job_id: None,
                review_status: Some("needs_human_review".to_string()),
            },
        )
        .expect("list medium corrections");
        let low = list_suggested_metadata_corrections_from_connection(
            &connection,
            SuggestedMetadataCorrectionListRequest {
                confidence_band: Some("low".to_string()),
                intake_job_id: None,
                review_status: Some("low_confidence".to_string()),
            },
        )
        .expect("list low corrections");

        assert!(!ready.is_empty());
        assert!(!medium.is_empty());
        assert!(!low.is_empty());

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn suggested_correction_review_decisions_update_only_review_state() {
        let db_path = temp_database_path("mock-metadata-review-decisions");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        let before =
            read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
                .expect("read source card before review");

        create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(vec![batch_intake_file(
                "batch-docx-service",
                "qa-service-quality-chapter.docx",
                "DOCX",
            )]),
        )
        .expect("create queue records");
        create_mock_external_metadata_review_queue_for_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
        )
        .expect("generate corrections");
        let corrections = list_suggested_metadata_corrections_from_connection(
            &connection,
            SuggestedMetadataCorrectionListRequest {
                confidence_band: None,
                intake_job_id: None,
                review_status: None,
            },
        )
        .expect("list corrections");

        let title_correction = corrections
            .iter()
            .find(|correction| correction.field_name == "title")
            .expect("title correction");
        let approved = update_suggested_metadata_correction_review_state_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSuggestedMetadataCorrectionReviewStateRequest {
                correction_id: title_correction.correction_id.clone(),
                reviewer_edited_value: None,
                reviewer_note: Some("Approved for later apply boundary.".to_string()),
                review_decision: "approved_suggested_value".to_string(),
            },
        )
        .expect("approve correction");
        assert!(approved.saved);
        assert_eq!(approved.audit_event_count, 2);
        assert_eq!(
            approved.latest_audit_event.as_ref().unwrap().event_type,
            "correction_approved"
        );
        assert!(approved
            .latest_audit_event
            .as_ref()
            .unwrap()
            .applied_value
            .is_none());
        assert_eq!(
            approved.correction.as_ref().unwrap().review_status,
            "approved"
        );
        assert_eq!(
            approved.correction.as_ref().unwrap().review_decision,
            "approved_suggested_value"
        );

        let authors_correction = corrections
            .iter()
            .find(|correction| correction.field_name == "authors")
            .expect("authors correction");
        let rejected = update_suggested_metadata_correction_review_state_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSuggestedMetadataCorrectionReviewStateRequest {
                correction_id: authors_correction.correction_id.clone(),
                reviewer_edited_value: None,
                reviewer_note: Some("Reject mock authors.".to_string()),
                review_decision: "rejected_suggested_value".to_string(),
            },
        )
        .expect("reject correction");
        assert!(rejected.saved);
        assert_eq!(
            rejected.latest_audit_event.as_ref().unwrap().event_type,
            "correction_rejected"
        );
        assert_eq!(
            rejected.correction.as_ref().unwrap().review_status,
            "rejected"
        );

        let year_correction = corrections
            .iter()
            .find(|correction| correction.field_name == "year")
            .expect("year correction");
        let edited = update_suggested_metadata_correction_review_state_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSuggestedMetadataCorrectionReviewStateRequest {
                correction_id: year_correction.correction_id.clone(),
                reviewer_edited_value: Some("1989".to_string()),
                reviewer_note: Some("Reviewer edited year before future apply.".to_string()),
                review_decision: "edited_before_approval".to_string(),
            },
        )
        .expect("edit correction");
        assert!(edited.saved);
        assert_eq!(
            edited.latest_audit_event.as_ref().unwrap().event_type,
            "correction_edited_before_approval"
        );
        assert_eq!(
            edited
                .latest_audit_event
                .as_ref()
                .unwrap()
                .reviewer_edited_value,
            Some("1989".to_string())
        );
        let edited_correction = edited.correction.as_ref().unwrap();
        assert_eq!(edited_correction.review_status, "edited");
        assert_eq!(edited_correction.review_decision, "edited_before_approval");
        assert_eq!(
            edited_correction.reviewer_edited_value,
            Some("1989".to_string())
        );
        assert_eq!(edited_correction.suggested_value, "1988");

        let source_type_correction = corrections
            .iter()
            .find(|correction| correction.field_name == "sourceType")
            .expect("source type correction");
        let deferred = update_suggested_metadata_correction_review_state_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSuggestedMetadataCorrectionReviewStateRequest {
                correction_id: source_type_correction.correction_id.clone(),
                reviewer_edited_value: None,
                reviewer_note: Some("Need more evidence.".to_string()),
                review_decision: "deferred_needs_more_evidence".to_string(),
            },
        )
        .expect("defer correction");
        assert!(deferred.saved);
        assert_eq!(
            deferred.latest_audit_event.as_ref().unwrap().event_type,
            "correction_deferred"
        );
        assert_eq!(
            deferred.correction.as_ref().unwrap().review_status,
            "deferred_needs_more_evidence"
        );

        let review_audit_events = list_metadata_correction_audit_events_from_connection(
            &connection,
            MetadataCorrectionAuditEventListRequest {
                correction_id: None,
                intake_job_id: Some("batch-docx-service".to_string()),
            },
        )
        .expect("list review audit events");
        assert!(review_audit_events
            .iter()
            .any(|event| event.event_type == "correction_approved"));
        assert!(review_audit_events
            .iter()
            .any(|event| event.event_type == "correction_rejected"));
        assert!(review_audit_events
            .iter()
            .any(|event| event.event_type == "correction_edited_before_approval"));
        assert!(review_audit_events
            .iter()
            .any(|event| event.event_type == "correction_deferred"));
        assert!(review_audit_events
            .iter()
            .all(|event| event.applied_value.is_none()));

        let after = read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
            .expect("read source card after review");
        assert_eq!(before.source_card.title, after.source_card.title);
        assert_eq!(before.source_card.authors, after.source_card.authors);
        assert_eq!(before.source_card.year, after.source_card.year);
        assert_eq!(
            before.source_card.citation_text,
            after.source_card.citation_text
        );
        assert_eq!(
            count_rows(&connection, "source_card_bibliographic_metadata"),
            0
        );
        assert_eq!(
            count_rows(&connection, "source_card_apa_reference_reviews"),
            0
        );

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn metadata_correction_apply_dry_run_blocks_unreviewed_and_unsupported_targets() {
        let db_path = temp_database_path("metadata-correction-dry-run-blocks");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        seed_mock_metadata_corrections(&mut connection, db_path.clone());
        let corrections = list_suggested_metadata_corrections_from_connection(
            &connection,
            SuggestedMetadataCorrectionListRequest {
                confidence_band: None,
                intake_job_id: None,
                review_status: None,
            },
        )
        .expect("list corrections");
        let title_correction = corrections
            .iter()
            .find(|correction| correction.field_name == "title")
            .expect("title correction");

        let pending = run_metadata_correction_apply_dry_run_to_connection(
            &connection,
            RunMetadataCorrectionApplyDryRunRequest {
                correction_id: title_correction.correction_id.clone(),
                write_audit_event: Some(false),
            },
        )
        .expect("pending dry-run");
        assert_eq!(pending.dry_run_status, "missing_source_card");
        assert!(pending
            .blockers
            .iter()
            .any(|blocker| blocker.contains("approved or edited")));
        assert!(pending
            .blockers
            .iter()
            .any(|blocker| blocker.contains("SourceCard linkage")));

        connection
            .execute(
                "UPDATE suggested_metadata_corrections
                SET source_card_id = ?2, current_value = ?3, target_metadata_table = ?4, field_name = ?5
                WHERE id = ?1",
                params![
                    title_correction.correction_id,
                    "candidate-source-card-qa",
                    "qa-service-quality-chapter",
                    "source_cards",
                    "citationText"
                ],
            )
            .expect("retarget correction");
        update_suggested_metadata_correction_review_state_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSuggestedMetadataCorrectionReviewStateRequest {
                correction_id: title_correction.correction_id.clone(),
                reviewer_edited_value: None,
                reviewer_note: Some("Approved for dry-run target validation.".to_string()),
                review_decision: "approved_suggested_value".to_string(),
            },
        )
        .expect("approve retargeted correction");
        let unsupported = run_metadata_correction_apply_dry_run_to_connection(
            &connection,
            RunMetadataCorrectionApplyDryRunRequest {
                correction_id: title_correction.correction_id.clone(),
                write_audit_event: Some(false),
            },
        )
        .expect("unsupported target dry-run");
        assert_eq!(unsupported.dry_run_status, "unsupported_target");
        assert!(unsupported
            .blockers
            .iter()
            .any(|blocker| blocker.contains("citationText")));

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn metadata_correction_apply_dry_run_passes_approved_and_edited_without_mutation() {
        let db_path = temp_database_path("metadata-correction-dry-run-pass");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        let before =
            read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
                .expect("read source card before");
        seed_mock_metadata_corrections(&mut connection, db_path.clone());
        let corrections = list_suggested_metadata_corrections_from_connection(
            &connection,
            SuggestedMetadataCorrectionListRequest {
                confidence_band: None,
                intake_job_id: None,
                review_status: None,
            },
        )
        .expect("list corrections");
        let title_correction = corrections
            .iter()
            .find(|correction| correction.field_name == "title")
            .expect("title correction");
        let authors_correction = corrections
            .iter()
            .find(|correction| correction.field_name == "authors")
            .expect("authors correction");
        link_correction_to_source_card_for_dry_run(
            &connection,
            &title_correction.correction_id,
            "title",
            Some("qa-service-quality-chapter"),
        );
        link_correction_to_source_card_for_dry_run(
            &connection,
            &authors_correction.correction_id,
            "authors",
            None,
        );

        update_suggested_metadata_correction_review_state_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSuggestedMetadataCorrectionReviewStateRequest {
                correction_id: title_correction.correction_id.clone(),
                reviewer_edited_value: None,
                reviewer_note: Some("Approved for dry-run only.".to_string()),
                review_decision: "approved_suggested_value".to_string(),
            },
        )
        .expect("approve title");
        let approved = run_metadata_correction_apply_dry_run_to_connection(
            &connection,
            RunMetadataCorrectionApplyDryRunRequest {
                correction_id: title_correction.correction_id.clone(),
                write_audit_event: Some(true),
            },
        )
        .expect("approved dry-run");
        assert_eq!(approved.dry_run_status, "ready_to_apply_later");
        assert_eq!(approved.target_metadata_table, "source_cards");
        assert_eq!(approved.target_field_name, "title");
        assert_eq!(
            approved.current_stored_value,
            Some("qa-service-quality-chapter".to_string())
        );
        assert_eq!(
            approved.audit_event.as_ref().unwrap().event_type,
            "apply_preflight_passed"
        );
        assert!(approved
            .audit_event
            .as_ref()
            .unwrap()
            .applied_value
            .is_none());

        update_suggested_metadata_correction_review_state_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSuggestedMetadataCorrectionReviewStateRequest {
                correction_id: authors_correction.correction_id.clone(),
                reviewer_edited_value: Some("Reviewer Edited Author".to_string()),
                reviewer_note: Some("Edited for dry-run only.".to_string()),
                review_decision: "edited_before_approval".to_string(),
            },
        )
        .expect("edit authors");
        let edited = run_metadata_correction_apply_dry_run_to_connection(
            &connection,
            RunMetadataCorrectionApplyDryRunRequest {
                correction_id: authors_correction.correction_id.clone(),
                write_audit_event: Some(false),
            },
        )
        .expect("edited dry-run");
        assert_eq!(edited.dry_run_status, "ready_to_apply_later");
        assert_eq!(
            edited.intended_apply_value,
            Some("Reviewer Edited Author".to_string())
        );

        let after = read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
            .expect("read source card after");
        assert_eq!(before.source_card.title, after.source_card.title);
        assert_eq!(before.source_card.authors, after.source_card.authors);
        assert_eq!(
            before.source_card.citation_text,
            after.source_card.citation_text
        );
        assert_eq!(
            count_rows(&connection, "source_card_bibliographic_metadata"),
            0
        );
        assert_eq!(
            count_rows(&connection, "source_card_apa_reference_reviews"),
            0
        );

        fs::remove_file(db_path).ok();
    }

    #[test]
    fn metadata_correction_apply_dry_run_blocks_rejected_deferred_stale_and_low_confidence() {
        let db_path = temp_database_path("metadata-correction-dry-run-more-blocks");
        let mut connection = Connection::open(&db_path).expect("open temp sqlite database");
        apply_migrations(&connection).expect("apply migrations");
        seed_source_document_and_card(&mut connection, db_path.clone());
        seed_mock_metadata_corrections(&mut connection, db_path.clone());
        create_batch_research_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
            batch_intake_request(vec![batch_intake_file(
                "batch-docx-ambiguous",
                "ambiguous-local-notes.docx",
                "DOCX",
            )]),
        )
        .expect("create low confidence queue record");
        create_mock_external_metadata_review_queue_for_intake_jobs_to_connection(
            &mut connection,
            db_path.clone(),
        )
        .expect("generate low confidence corrections");
        let corrections = list_suggested_metadata_corrections_from_connection(
            &connection,
            SuggestedMetadataCorrectionListRequest {
                confidence_band: None,
                intake_job_id: None,
                review_status: None,
            },
        )
        .expect("list corrections");
        let title_correction = corrections
            .iter()
            .find(|correction| correction.field_name == "title")
            .expect("title correction");
        let source_type_correction = corrections
            .iter()
            .find(|correction| correction.field_name == "sourceType")
            .expect("sourceType correction");
        let low_correction = corrections
            .iter()
            .find(|correction| correction.confidence_band == "low")
            .expect("low confidence correction");

        link_correction_to_source_card_for_dry_run(
            &connection,
            &title_correction.correction_id,
            "title",
            Some("qa-service-quality-chapter"),
        );
        update_suggested_metadata_correction_review_state_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSuggestedMetadataCorrectionReviewStateRequest {
                correction_id: title_correction.correction_id.clone(),
                reviewer_edited_value: None,
                reviewer_note: Some("Reject for dry-run test.".to_string()),
                review_decision: "rejected_suggested_value".to_string(),
            },
        )
        .expect("reject title");
        let rejected = run_metadata_correction_apply_dry_run_to_connection(
            &connection,
            RunMetadataCorrectionApplyDryRunRequest {
                correction_id: title_correction.correction_id.clone(),
                write_audit_event: Some(false),
            },
        )
        .expect("rejected dry-run");
        assert_eq!(rejected.dry_run_status, "blocked");

        link_correction_to_source_card_for_dry_run(
            &connection,
            &source_type_correction.correction_id,
            "sourceType",
            Some("DOCX"),
        );
        update_suggested_metadata_correction_review_state_to_connection(
            &mut connection,
            db_path.clone(),
            UpdateSuggestedMetadataCorrectionReviewStateRequest {
                correction_id: source_type_correction.correction_id.clone(),
                reviewer_edited_value: None,
                reviewer_note: Some("Defer for dry-run test.".to_string()),
                review_decision: "deferred_needs_more_evidence".to_string(),
            },
        )
        .expect("defer sourceType");
        let deferred = run_metadata_correction_apply_dry_run_to_connection(
            &connection,
            RunMetadataCorrectionApplyDryRunRequest {
                correction_id: source_type_correction.correction_id.clone(),
                write_audit_event: Some(false),
            },
        )
        .expect("deferred dry-run");
        assert_eq!(deferred.dry_run_status, "blocked");

        connection
            .execute(
                "UPDATE suggested_metadata_corrections
                SET source_card_id = ?2, current_value = ?3, review_status = 'approved', review_decision = 'approved_suggested_value'
                WHERE id = ?1",
                params![title_correction.correction_id, "candidate-source-card-qa", "stale old title"],
            )
            .expect("make stale correction");
        let stale = run_metadata_correction_apply_dry_run_to_connection(
            &connection,
            RunMetadataCorrectionApplyDryRunRequest {
                correction_id: title_correction.correction_id.clone(),
                write_audit_event: Some(false),
            },
        )
        .expect("stale dry-run");
        assert_eq!(stale.dry_run_status, "stale_current_value");

        connection
            .execute(
                "UPDATE suggested_metadata_corrections
                SET source_card_id = ?2, current_value = ?3, review_status = 'approved', review_decision = 'approved_suggested_value', reviewer_note = NULL
                WHERE id = ?1",
                params![low_correction.correction_id, "candidate-source-card-qa", low_correction.current_value],
            )
            .expect("prepare low confidence correction");
        let low = run_metadata_correction_apply_dry_run_to_connection(
            &connection,
            RunMetadataCorrectionApplyDryRunRequest {
                correction_id: low_correction.correction_id.clone(),
                write_audit_event: Some(true),
            },
        )
        .expect("low confidence dry-run");
        assert_eq!(low.dry_run_status, "low_confidence_requires_note");
        assert_eq!(
            low.audit_event.as_ref().unwrap().event_type,
            "apply_preflight_blocked"
        );
        assert!(low.audit_event.as_ref().unwrap().applied_value.is_none());

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
                citation_text: "Parasuraman, Zeithaml, and Berry (1988). SERVQUAL. Human verified."
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
        assert_eq!(detail.source_card.title, "SERVQUAL measurement foundation");
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

        assert_eq!(
            detail.source_card.source_card_id,
            "candidate-source-card-qa"
        );
        assert!(metadata.is_none());
        assert_eq!(
            count_rows(&connection, "source_card_bibliographic_metadata"),
            0
        );

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
        assert_eq!(
            count_rows(&connection, "source_card_bibliographic_metadata"),
            1
        );
        assert_eq!(metadata.source_card_id, "candidate-source-card-qa");
        assert_eq!(metadata.publisher, Some("Journal of Marketing".to_string()));
        assert_eq!(
            metadata.journal,
            Some("Journal of Retail Service".to_string())
        );
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
        assert_eq!(
            count_rows(&connection, "source_card_bibliographic_metadata"),
            1
        );
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
        assert_eq!(
            count_rows(&connection, "source_card_bibliographic_metadata"),
            0
        );

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
        let after = read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
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
        assert_eq!(
            count_rows(&connection, "source_card_bibliographic_metadata"),
            0
        );

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
        request.candidate_blockers =
            vec!["Missing required structured metadata field: URL.".to_string()];

        let result = save_source_card_apa_reference_review_to_connection(
            &mut connection,
            db_path.clone(),
            request,
        )
        .expect("save needs correction APA review");
        let review = result.review.expect("review read-back");

        assert!(result.saved);
        assert_eq!(review.verification_status, "needs_correction");
        assert_eq!(
            count_rows(&connection, "source_card_apa_reference_reviews"),
            1
        );
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
        assert_eq!(
            count_rows(&connection, "source_card_apa_reference_reviews"),
            0
        );

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
        assert_eq!(
            count_rows(&connection, "source_card_apa_reference_reviews"),
            0
        );

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
        assert_eq!(
            count_rows(&connection, "source_card_apa_reference_reviews"),
            0
        );

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
        let after = read_saved_source_card_from_connection(&connection, "candidate-source-card-qa")
            .expect("read source card after APA review");

        assert_eq!(
            before.source_card.citation_text,
            after.source_card.citation_text
        );
        assert_eq!(before.source_card.title, after.source_card.title);
        assert_eq!(
            before.source_card.metadata_status,
            after.source_card.metadata_status
        );
        assert_eq!(
            count_rows(&connection, "source_card_apa_reference_reviews"),
            1
        );
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

    fn batch_intake_request(
        files: Vec<CreateBatchResearchIntakeJobFile>,
    ) -> CreateBatchResearchIntakeJobsRequest {
        CreateBatchResearchIntakeJobsRequest { files }
    }

    fn batch_intake_file(
        intake_job_id: &str,
        file_name: &str,
        file_type: &str,
    ) -> CreateBatchResearchIntakeJobFile {
        CreateBatchResearchIntakeJobFile {
            intake_job_id: intake_job_id.to_string(),
            file_name: file_name.to_string(),
            file_path: Some(format!("/tmp/{file_name}")),
            file_type: file_type.to_string(),
            mime_type: Some(match file_type {
                "PDF" => "application/pdf".to_string(),
                "DOCX" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    .to_string(),
                _ => "application/octet-stream".to_string(),
            }),
            file_size: Some(4096),
            selected_at: Some("unix-ms:1000".to_string()),
            warnings: Vec::new(),
        }
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

    fn seed_mock_metadata_corrections(connection: &mut Connection, db_path: PathBuf) {
        create_batch_research_intake_jobs_to_connection(
            connection,
            db_path.clone(),
            batch_intake_request(vec![batch_intake_file(
                "batch-docx-service",
                "qa-service-quality-chapter.docx",
                "DOCX",
            )]),
        )
        .expect("create queue records");
        create_mock_external_metadata_review_queue_for_intake_jobs_to_connection(
            connection, db_path,
        )
        .expect("generate corrections");
    }

    fn link_correction_to_source_card_for_dry_run(
        connection: &Connection,
        correction_id: &str,
        field_name: &str,
        current_value: Option<&str>,
    ) {
        connection
            .execute(
                "UPDATE suggested_metadata_corrections
                SET source_card_id = ?2, target_metadata_table = ?3, field_name = ?4, current_value = ?5
                WHERE id = ?1",
                params![
                    correction_id,
                    "candidate-source-card-qa",
                    "source_cards",
                    field_name,
                    current_value
                ],
            )
            .expect("link correction to SourceCard for dry-run");
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
