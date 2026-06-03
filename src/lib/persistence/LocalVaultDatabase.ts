import { invoke } from "@tauri-apps/api/core";
import { getCrossrefFixtureCandidates } from "../sources/CrossrefFixtureProvider";
import type {
  DocumentSegment,
  DocumentTextExtraction,
  DraftArtifactSaveCandidate,
  DraftSectionSaveCandidate,
  ExtractionTrace,
  KnowledgeCardSaveCandidateType,
  SourceCardSaveCandidate,
  SourceDocumentSaveCandidate
} from "../../types/domain";

export interface VaultDatabaseInitializationStatus {
  appliedMigrations: string[];
  dbPath: string;
  initialized: boolean;
  persisted: false;
  schemaVersion: number;
}

export async function initializeVaultDatabase(): Promise<VaultDatabaseInitializationStatus> {
  return invoke<VaultDatabaseInitializationStatus>("initialize_vault_database");
}

export interface CreateBatchResearchIntakeJobFile {
  fileName: string;
  filePath?: string | null;
  fileSize?: number | null;
  fileType: "PDF" | "DOCX" | string;
  intakeJobId: string;
  mimeType?: string | null;
  selectedAt?: string | null;
  warnings: string[];
}

export interface CreateBatchResearchIntakeJobsRequest {
  files: CreateBatchResearchIntakeJobFile[];
}

export interface SavedBatchResearchIntakeJob {
  blockersJson: string;
  createdAt: string;
  duplicateStatus: string;
  externalMatchStatus: string;
  fileName: string;
  filePath: string | null;
  fileSize: number | null;
  fileType: string;
  intakeJobId: string;
  metadataExtractionStatus: string;
  mimeType: string | null;
  parserStatus: string;
  queueStatus: string;
  reviewStatus: string;
  sourceTypeGuess: string;
  updatedAt: string;
  warningsJson: string;
}

export interface CreateBatchResearchIntakeJobsResult {
  blockers: string[];
  dbPath: string;
  jobs: SavedBatchResearchIntakeJob[];
  saved: boolean;
  warnings: string[];
}

export type SuggestedMetadataCorrectionReviewStatus =
  | "pending"
  | "ready_for_batch_approval"
  | "needs_human_review"
  | "low_confidence"
  | "missing_required_metadata"
  | "duplicate_suspected"
  | "provider_conflict"
  | "approved"
  | "rejected"
  | "edited"
  | "deferred_needs_more_evidence"
  | "verified";

export type SuggestedMetadataCorrectionReviewDecision =
  | "not_decided"
  | "approved_suggested_value"
  | "rejected_suggested_value"
  | "edited_before_approval"
  | "deferred_needs_more_evidence";

export interface CreateMockExternalMetadataReviewQueueResult {
  blockers: string[];
  correctionCount: number;
  dbPath: string;
  matchResultCount: number;
  saved: boolean;
  warnings: string[];
}

export interface SuggestedMetadataCorrectionListRequest {
  confidenceBand?: string | null;
  intakeJobId?: string | null;
  reviewStatus?: string | null;
}

export interface SavedSuggestedMetadataCorrection {
  confidenceBand: string;
  confidenceScore: number;
  correctionId: string;
  createdAt: string;
  currentValue: string | null;
  fieldName: string;
  intakeJobId: string;
  matchResultId: string;
  mismatchReasonsJson: string;
  providerName: string;
  providerRecordRef: string;
  reason: string;
  reviewDecision: SuggestedMetadataCorrectionReviewDecision | string;
  reviewerEditedValue: string | null;
  reviewerNote: string | null;
  reviewStatus: SuggestedMetadataCorrectionReviewStatus | string;
  sourceCardId: string | null;
  suggestedValue: string;
  targetMetadataTable: string;
  updatedAt: string;
  warningFlagsJson: string;
}

export interface SuggestedMetadataCorrectionListResult {
  corrections: SavedSuggestedMetadataCorrection[];
  dbPath: string;
}

export interface UpdateSuggestedMetadataCorrectionReviewStateRequest {
  correctionId: string;
  reviewerEditedValue?: string | null;
  reviewerNote?: string | null;
  reviewDecision: SuggestedMetadataCorrectionReviewDecision;
}

export interface UpdateSuggestedMetadataCorrectionReviewStateResult {
  auditEventCount?: number;
  blockers: string[];
  correction: SavedSuggestedMetadataCorrection | null;
  dbPath: string;
  latestAuditEvent?: SavedMetadataCorrectionAuditEvent | null;
  saved: boolean;
  warnings: string[];
}

export type MetadataCorrectionAuditEventType =
  | "correction_created"
  | "correction_approved"
  | "correction_rejected"
  | "correction_edited_before_approval"
  | "correction_deferred"
  | "correction_routed"
  | "match_result_persisted"
  | "apply_preflight_passed"
  | "apply_preflight_blocked"
  | "correction_apply_started"
  | "correction_applied"
  | "metadata_read_back_verified"
  | "correction_apply_failed";

export interface SavedMetadataCorrectionAuditEvent {
  appliedValue: string | null;
  auditEventId: string;
  confidenceBand: string | null;
  confidenceScore: number | null;
  correctionId: string;
  createdAt: string;
  eventSummary: string;
  eventType: MetadataCorrectionAuditEventType | string;
  externalSuggestedValue: string | null;
  intakeJobId: string;
  originalAtpValue: string | null;
  providerName: string | null;
  providerRecordRef: string | null;
  reviewerEditedValue: string | null;
  reviewerNote: string | null;
  sourceCardId: string | null;
  sourceMetadataSnapshotJson: string;
  targetFieldName: string | null;
  targetMetadataTable: string | null;
  warningFlagsJson: string;
}

export interface CreateMetadataCorrectionAuditEventRequest {
  correctionId: string;
  eventSummary?: string | null;
  eventType: MetadataCorrectionAuditEventType;
  reviewerNote?: string | null;
}

export interface CreateMetadataCorrectionAuditEventResult {
  blockers: string[];
  dbPath: string;
  event: SavedMetadataCorrectionAuditEvent | null;
  saved: boolean;
  warnings: string[];
}

export interface MetadataCorrectionAuditEventListRequest {
  correctionId?: string | null;
  intakeJobId?: string | null;
}

export interface MetadataCorrectionAuditEventListResult {
  dbPath: string;
  events: SavedMetadataCorrectionAuditEvent[];
}

export type MetadataCorrectionApplyDryRunStatus =
  | "ready_to_apply_later"
  | "blocked"
  | "needs_review"
  | "stale_current_value"
  | "unsupported_target"
  | "missing_source_card"
  | "low_confidence_requires_note";

export interface RunMetadataCorrectionApplyDryRunRequest {
  correctionId: string;
  writeAuditEvent?: boolean | null;
}

export interface MetadataCorrectionApplyDryRunResult {
  auditEvent: SavedMetadataCorrectionAuditEvent | null;
  auditEventPreview: string;
  auditEventWritten: boolean;
  blockers: string[];
  confidenceBand: string;
  confidenceScore: number;
  correctionId: string;
  currentStoredValue: string | null;
  dryRunStatus: MetadataCorrectionApplyDryRunStatus | string;
  intakeJobId: string;
  intendedApplyValue: string | null;
  nextAction: string;
  noOverwritePolicy: string[];
  originalCorrectionValue: string | null;
  reviewerEditedValue: string | null;
  sourceCardId: string | null;
  staleCheckStatus: string;
  suggestedValue: string;
  targetFieldName: string;
  targetMetadataTable: string;
  warnings: string[];
}

export interface ApplyMetadataCorrectionToStructuredBibliographicMetadataRequest {
  correctionId: string;
  reviewerConfirmedApply: boolean;
}

export interface ApplyMetadataCorrectionToStructuredBibliographicMetadataResult {
  appliedValue: string | null;
  applyStatus: "applied_and_verified" | "read_back_failed" | "blocked" | string;
  auditEventCount: number;
  auditEventIds: string[];
  blockers: string[];
  correctionId: string;
  intendedApplyValue: string | null;
  nextAction: string;
  readBackValue: string | null;
  readBackVerified: boolean;
  sourceCardId: string | null;
  targetFieldName: string;
  targetMetadataTable: string;
  warnings: string[];
}

export async function createBatchResearchIntakeJobs(
  request: CreateBatchResearchIntakeJobsRequest
): Promise<CreateBatchResearchIntakeJobsResult> {
  if (!canUseTauriInvoke()) {
    return createBatchResearchIntakeJobsBrowserFallback(request);
  }

  return invoke<CreateBatchResearchIntakeJobsResult>(
    "create_batch_research_intake_jobs",
    { request }
  );
}

export async function listBatchResearchIntakeJobs(): Promise<
  SavedBatchResearchIntakeJob[]
> {
  if (!canUseTauriInvoke()) {
    return [...batchResearchIntakeJobsBrowserFallback.values()].sort(
      sortBatchResearchIntakeJobsNewestFirst
    );
  }

  return invoke<SavedBatchResearchIntakeJob[]>("list_batch_research_intake_jobs");
}

export async function createMockExternalMetadataReviewQueueForIntakeJobs(): Promise<CreateMockExternalMetadataReviewQueueResult> {
  if (!canUseTauriInvoke()) {
    return createMockExternalMetadataReviewQueueBrowserFallback();
  }

  return invoke<CreateMockExternalMetadataReviewQueueResult>(
    "create_mock_external_metadata_review_queue_for_intake_jobs"
  );
}

export async function createCrossrefFixtureMetadataReviewQueueForIntakeJobs(): Promise<CreateMockExternalMetadataReviewQueueResult> {
  if (!canUseTauriInvoke()) {
    return createCrossrefFixtureMetadataReviewQueueBrowserFallback();
  }

  return invoke<CreateMockExternalMetadataReviewQueueResult>(
    "create_crossref_fixture_metadata_review_queue_for_intake_jobs"
  );
}

export async function listSuggestedMetadataCorrections(
  request: SuggestedMetadataCorrectionListRequest = {}
): Promise<SuggestedMetadataCorrectionListResult> {
  if (!canUseTauriInvoke()) {
    return listSuggestedMetadataCorrectionsBrowserFallback(request);
  }

  return invoke<SuggestedMetadataCorrectionListResult>(
    "list_suggested_metadata_corrections",
    { request }
  );
}

export async function updateSuggestedMetadataCorrectionReviewState(
  request: UpdateSuggestedMetadataCorrectionReviewStateRequest
): Promise<UpdateSuggestedMetadataCorrectionReviewStateResult> {
  if (!canUseTauriInvoke()) {
    return updateSuggestedMetadataCorrectionReviewStateBrowserFallback(request);
  }

  return invoke<UpdateSuggestedMetadataCorrectionReviewStateResult>(
    "update_suggested_metadata_correction_review_state",
    { request }
  );
}

export async function createMetadataCorrectionAuditEvent(
  request: CreateMetadataCorrectionAuditEventRequest
): Promise<CreateMetadataCorrectionAuditEventResult> {
  if (!canUseTauriInvoke()) {
    return createMetadataCorrectionAuditEventBrowserFallback(request);
  }

  return invoke<CreateMetadataCorrectionAuditEventResult>(
    "create_metadata_correction_audit_event",
    { request }
  );
}

export async function listMetadataCorrectionAuditEvents(
  request: MetadataCorrectionAuditEventListRequest = {}
): Promise<MetadataCorrectionAuditEventListResult> {
  if (!canUseTauriInvoke()) {
    return listMetadataCorrectionAuditEventsBrowserFallback(request);
  }

  return invoke<MetadataCorrectionAuditEventListResult>(
    "list_metadata_correction_audit_events",
    { request }
  );
}

export async function runMetadataCorrectionApplyDryRun(
  request: RunMetadataCorrectionApplyDryRunRequest
): Promise<MetadataCorrectionApplyDryRunResult> {
  if (!canUseTauriInvoke()) {
    return runMetadataCorrectionApplyDryRunBrowserFallback(request);
  }

  return invoke<MetadataCorrectionApplyDryRunResult>(
    "run_metadata_correction_apply_dry_run",
    { request }
  );
}

export async function applyMetadataCorrectionToStructuredBibliographicMetadata(
  request: ApplyMetadataCorrectionToStructuredBibliographicMetadataRequest
): Promise<ApplyMetadataCorrectionToStructuredBibliographicMetadataResult> {
  if (!canUseTauriInvoke()) {
    return applyMetadataCorrectionToStructuredBibliographicMetadataBrowserFallback(request);
  }

  return invoke<ApplyMetadataCorrectionToStructuredBibliographicMetadataResult>(
    "apply_metadata_correction_to_structured_bibliographic_metadata",
    { request }
  );
}

export interface SaveSourceDocumentRequest {
  extraction: DocumentTextExtraction;
  extractionRunId: string;
  segments: DocumentSegment[];
  sourceDocument: SourceDocumentSaveCandidate;
  sourceDocumentId: string;
  traces: ExtractionTrace[];
}

export interface SaveSourceDocumentResult {
  blockers: string[];
  dbPath: string;
  extractionRunId: string;
  saved: boolean;
  segmentCount: number;
  sourceDocumentId: string;
  traceCount: number;
  warnings: string[];
}

export async function saveSourceDocumentCandidate(
  request: SaveSourceDocumentRequest
): Promise<SaveSourceDocumentResult> {
  return invoke<SaveSourceDocumentResult>("save_source_document_candidate", {
    request
  });
}

export interface SavedSourceDocumentListItem {
  sourceDocumentId: string;
  title: string;
  fileName: string;
  fileType: string;
  metadataStatus: string;
  extractionStatus: string;
  createdAt: string;
  updatedAt: string;
  segmentCount: number;
  traceCount: number;
}

export interface SavedSourceDocumentDetail {
  extractionRun: SavedExtractionRunRecord;
  segments: SavedExtractionSegmentRecord[];
  sourceDocument: SavedSourceDocumentRecord;
  traces: SavedEvidenceTraceRecord[];
}

export interface SavedSourceDocumentRecord {
  sourceDocumentId: string;
  title: string;
  fileName: string;
  fileType: string;
  metadataStatus: string;
  citationReadiness: string;
  parserStatus: string;
  reviewStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedExtractionRunRecord {
  extractionRunId: string;
  extractionStatus: string;
  confidenceScore: number | null;
  rawTextLength: number;
  cleanedTextLength: number;
  warningCount: number;
  createdAt: string;
}

export interface SavedExtractionSegmentRecord {
  segmentId: string;
  title: string;
  segmentType: string;
  content: string;
  pageStart: number | null;
  pageEnd: number | null;
  pageNumbersTrusted: boolean;
  sortOrder: number;
}

export interface SavedEvidenceTraceRecord {
  traceId: string;
  segmentId: string | null;
  chunkReference: string;
  pageNumber: number | null;
  pageNumberTrusted: boolean;
  sectionTitle: string | null;
}

export async function listSavedSourceDocuments(): Promise<
  SavedSourceDocumentListItem[]
> {
  return invoke<SavedSourceDocumentListItem[]>("list_saved_source_documents");
}

export async function readSavedSourceDocument(
  sourceDocumentId: string
): Promise<SavedSourceDocumentDetail> {
  return invoke<SavedSourceDocumentDetail>("read_saved_source_document", {
    request: { sourceDocumentId }
  });
}

export interface SaveSourceCardRequest {
  authors?: string | null;
  linkedSourceDocumentId: string;
  sourceCard: SourceCardSaveCandidate;
  sourceCardId: string;
  year?: string | null;
}

export interface SaveSourceCardResult {
  blockers: string[];
  dbPath: string;
  saved: boolean;
  sourceCardId: string;
  sourceDocumentId: string;
  warnings: string[];
}

export async function saveSourceCardCandidate(
  request: SaveSourceCardRequest
): Promise<SaveSourceCardResult> {
  return invoke<SaveSourceCardResult>("save_source_card_candidate", {
    request
  });
}

export interface SavedSourceCardListItem {
  sourceCardId: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  title: string;
  sourceType: string;
  metadataStatus: string;
  citationReadiness: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSourceCardDetail {
  sourceCard: SavedSourceCardRecord;
  sourceDocument: SavedSourceDocumentCompactReference;
}

export interface SavedSourceCardRecord {
  sourceCardId: string;
  sourceDocumentId: string;
  title: string;
  authors: string | null;
  year: string | null;
  sourceType: string;
  citationText: string;
  metadataStatus: string;
  citationReadiness: string;
  fileReference: string;
  reviewStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSourceDocumentCompactReference {
  sourceDocumentId: string;
  title: string;
  fileName: string;
  fileType: string;
}

export async function listSavedSourceCards(): Promise<SavedSourceCardListItem[]> {
  return invoke<SavedSourceCardListItem[]>("list_saved_source_cards");
}

export async function readSavedSourceCard(
  sourceCardId: string
): Promise<SavedSourceCardDetail> {
  return invoke<SavedSourceCardDetail>("read_saved_source_card", {
    request: { sourceCardId }
  });
}

export interface UpdateSourceCardMetadataRequest {
  authors?: string | null;
  citationReadiness: "ready" | "needs_review" | "blocked";
  citationText: string;
  metadataStatus: "ready" | "needs_metadata" | "blocked";
  sourceCardId: string;
  title: string;
  year?: string | null;
}

export interface UpdateSourceCardMetadataResult {
  blockers: string[];
  dbPath: string;
  saved: boolean;
  sourceCardId: string;
  warnings: string[];
}

export async function updateSourceCardMetadata(
  request: UpdateSourceCardMetadataRequest
): Promise<UpdateSourceCardMetadataResult> {
  return invoke<UpdateSourceCardMetadataResult>("update_source_card_metadata", {
    request
  });
}

export type StructuredMetadataStatus =
  | "not_started"
  | "incomplete"
  | "complete"
  | "needs_review";

export type SourceCardApaReadiness =
  | "not_ready"
  | "candidate_ready"
  | "needs_review"
  | "final_verified";

export interface SourceCardBibliographicMetadataRequest {
  sourceCardId: string;
}

export interface UpsertSourceCardBibliographicMetadataRequest {
  accessDate?: string | null;
  apaReadiness: SourceCardApaReadiness;
  containerTitle?: string | null;
  doi?: string | null;
  edition?: string | null;
  humanVerifiedAt?: string | null;
  issue?: string | null;
  journal?: string | null;
  metadataSource: string;
  notes?: string | null;
  pageRange?: string | null;
  publisher?: string | null;
  sourceCardId: string;
  structuredMetadataStatus: StructuredMetadataStatus;
  url?: string | null;
  volume?: string | null;
}

export interface SavedSourceCardBibliographicMetadata {
  accessDate: string | null;
  apaFinalVerified: boolean;
  apaReadiness: SourceCardApaReadiness;
  apaReadinessNotice: string;
  containerTitle: string | null;
  createdAt: string;
  doi: string | null;
  edition: string | null;
  humanVerifiedAt: string | null;
  issue: string | null;
  journal: string | null;
  metadataSource: string;
  notes: string | null;
  pageRange: string | null;
  publisher: string | null;
  sourceCardId: string;
  structuredMetadataStatus: StructuredMetadataStatus;
  updatedAt: string;
  url: string | null;
  volume: string | null;
  warnings: string | null;
}

export interface UpsertSourceCardBibliographicMetadataResult {
  blockers: string[];
  dbPath: string;
  metadata: SavedSourceCardBibliographicMetadata | null;
  saved: boolean;
  sourceCardId: string;
  warnings: string[];
}

export async function upsertSourceCardBibliographicMetadata(
  request: UpsertSourceCardBibliographicMetadataRequest
): Promise<UpsertSourceCardBibliographicMetadataResult> {
  return invoke<UpsertSourceCardBibliographicMetadataResult>(
    "upsert_source_card_bibliographic_metadata",
    { request }
  );
}

export async function getSourceCardBibliographicMetadata(
  sourceCardId: string
): Promise<SavedSourceCardBibliographicMetadata | null> {
  return invoke<SavedSourceCardBibliographicMetadata | null>(
    "get_source_card_bibliographic_metadata",
    { request: { sourceCardId } satisfies SourceCardBibliographicMetadataRequest }
  );
}

export type SourceCardApaReferenceVerificationStatus =
  | "needs_correction"
  | "verified_for_internal_use";

export type SourceCardApaReferenceVerificationScope =
  | "internal_drafting"
  | "teaching_preparation";

export interface SaveApaReferenceChecklistItem {
  key: string;
  label: string;
  reviewerNote?: string | null;
  state: "confirmed" | "needs_correction" | "not_applicable";
}

export interface SourceCardApaReferenceReviewRequest {
  sourceCardId: string;
}

export interface SaveSourceCardApaReferenceReviewRequest {
  apaStyleVersion: "APA 7";
  blockersResolved: string[];
  candidateBlockers: string[];
  candidateReferenceText: string;
  checklist: SaveApaReferenceChecklistItem[];
  reviewId: string;
  reviewerNote?: string | null;
  sourceCardId: string;
  sourceMetadataSnapshotJson: string;
  verificationScope: SourceCardApaReferenceVerificationScope;
  verificationStatus: SourceCardApaReferenceVerificationStatus;
  verifiedReferenceText: string;
  warningsAccepted: string[];
}

export interface SavedSourceCardApaReferenceReview {
  apaStyleVersion: string;
  blockersResolvedJson: string;
  candidateReferenceText: string;
  checklistJson: string;
  createdAt: string;
  humanReviewedAt: string;
  reviewId: string;
  reviewerNote: string | null;
  sourceCardId: string;
  sourceMetadataSnapshotJson: string;
  updatedAt: string;
  verificationScope: string;
  verificationStatus: string;
  verifiedReferenceText: string;
  warningsAcceptedJson: string;
}

export interface SaveSourceCardApaReferenceReviewResult {
  blockers: string[];
  dbPath: string;
  review: SavedSourceCardApaReferenceReview | null;
  saved: boolean;
  sourceCardId: string;
  warnings: string[];
}

export async function saveSourceCardApaReferenceReview(
  request: SaveSourceCardApaReferenceReviewRequest
): Promise<SaveSourceCardApaReferenceReviewResult> {
  if (!canUseTauriInvoke()) {
    return saveSourceCardApaReferenceReviewBrowserFallback(request);
  }

  return invoke<SaveSourceCardApaReferenceReviewResult>(
    "save_source_card_apa_reference_review",
    { request }
  );
}

export async function getSourceCardApaReferenceReview(
  sourceCardId: string
): Promise<SavedSourceCardApaReferenceReview | null> {
  if (!canUseTauriInvoke()) {
    return sourceCardApaReferenceReviewBrowserFallback.get(sourceCardId) ?? null;
  }

  return invoke<SavedSourceCardApaReferenceReview | null>(
    "get_source_card_apa_reference_review",
    { request: { sourceCardId } satisfies SourceCardApaReferenceReviewRequest }
  );
}

const batchResearchIntakeJobsBrowserFallback = new Map<
  string,
  SavedBatchResearchIntakeJob
>();
const suggestedMetadataCorrectionsBrowserFallback = new Map<
  string,
  SavedSuggestedMetadataCorrection
>();
const metadataCorrectionAuditEventsBrowserFallback: SavedMetadataCorrectionAuditEvent[] = [];
const structuredBibliographicMetadataBrowserFallback = new Map<
  string,
  Record<string, string | null>
>();
const structuredMetadataApplySourceCardIdBrowserFallback =
  "candidate-source-card-candidate-document-qa-docx-file-intake-job";
const structuredMetadataApplyAllowedFields = [
  "publisher",
  "journal",
  "containerTitle",
  "edition",
  "volume",
  "issue",
  "pageRange",
  "doi",
  "url",
  "accessDate"
];

function createBatchResearchIntakeJobsBrowserFallback(
  request: CreateBatchResearchIntakeJobsRequest
): CreateBatchResearchIntakeJobsResult {
  const blockers = validateBatchResearchIntakeJobsBrowserFallback(request);
  const warnings = [
    "Queue only: files are not parsed in Sprint 4I-1.",
    "No external metadata lookup is performed.",
    "No SourceDocument or SourceCard is created automatically.",
    "No metadata is overwritten.",
    "Browser QA fallback only; desktop persistence uses the Tauri SQLite command."
  ];

  if (blockers.length > 0) {
    return {
      blockers,
      dbPath: "browser-qa-fallback",
      jobs: [],
      saved: false,
      warnings
    };
  }

  const timestamp = new Date().toISOString();

  for (const file of request.files) {
    const previous = batchResearchIntakeJobsBrowserFallback.get(file.intakeJobId);
    const createdAt = file.selectedAt?.trim() || previous?.createdAt || timestamp;
    const job: SavedBatchResearchIntakeJob = {
      blockersJson: "[]",
      createdAt,
      duplicateStatus: "not_checked",
      externalMatchStatus: "not_started",
      fileName: file.fileName,
      filePath: file.filePath ?? null,
      fileSize: file.fileSize ?? null,
      fileType: file.fileType,
      intakeJobId: file.intakeJobId,
      metadataExtractionStatus: "not_started",
      mimeType: file.mimeType ?? null,
      parserStatus: "not_started",
      queueStatus: "queued",
      reviewStatus: "pending",
      sourceTypeGuess: "unknown_pending_review",
      updatedAt: timestamp,
      warningsJson: JSON.stringify(file.warnings)
    };

    batchResearchIntakeJobsBrowserFallback.set(file.intakeJobId, job);
  }

  return {
    blockers: [],
    dbPath: "browser-qa-fallback",
    jobs: [...batchResearchIntakeJobsBrowserFallback.values()].sort(
      sortBatchResearchIntakeJobsNewestFirst
    ),
    saved: true,
    warnings
  };
}

function validateBatchResearchIntakeJobsBrowserFallback(
  request: CreateBatchResearchIntakeJobsRequest
): string[] {
  const blockers: string[] = [];

  if (request.files.length === 0) {
    blockers.push("At least one PDF or DOCX file is required for batch intake.");
  }

  for (const file of request.files) {
    if (!file.intakeJobId.trim()) {
      blockers.push("file.intakeJobId is required.");
    }

    if (!file.fileName.trim()) {
      blockers.push("file.fileName is required.");
    }

    if (file.fileType !== "PDF" && file.fileType !== "DOCX") {
      blockers.push(`Batch intake supports PDF and DOCX only: ${file.fileType}`);
    }
  }

  return blockers;
}

function sortBatchResearchIntakeJobsNewestFirst(
  left: SavedBatchResearchIntakeJob,
  right: SavedBatchResearchIntakeJob
): number {
  if (left.createdAt === right.createdAt) {
    return left.intakeJobId.localeCompare(right.intakeJobId);
  }

  return right.createdAt.localeCompare(left.createdAt);
}

function createMockExternalMetadataReviewQueueBrowserFallback(): CreateMockExternalMetadataReviewQueueResult {
  const jobs = [...batchResearchIntakeJobsBrowserFallback.values()];
  const warnings = [
    "Mock provider only: no real external metadata API was called.",
    "No SourceCard or structured bibliographic metadata is mutated.",
    "Approval in this sprint updates correction review state only.",
    "Browser QA fallback only; desktop persistence uses the Tauri SQLite command."
  ];

  if (jobs.length === 0) {
    return {
      blockers: [
        "No batch intake jobs are available for mock metadata review queue generation."
      ],
      correctionCount: 0,
      dbPath: "browser-qa-fallback",
      matchResultCount: 0,
      saved: false,
      warnings
    };
  }

  let matchResultCount = 0;
  let correctionCount = 0;
  const timestamp = new Date().toISOString();

  for (const job of jobs) {
    const candidate = createBrowserMockMetadataCandidate(job);
    matchResultCount += 1;

    if (!candidate) {
      continue;
    }

    for (const correction of createBrowserSuggestedCorrections(job, candidate)) {
      const previous = suggestedMetadataCorrectionsBrowserFallback.get(
        correction.correctionId
      );
      suggestedMetadataCorrectionsBrowserFallback.set(correction.correctionId, {
        ...correction,
        createdAt: previous?.createdAt ?? timestamp,
        reviewDecision: previous?.reviewDecision ?? correction.reviewDecision,
        reviewerEditedValue:
          previous?.reviewerEditedValue ?? correction.reviewerEditedValue,
        reviewerNote: previous?.reviewerNote ?? correction.reviewerNote,
        reviewStatus:
          previous?.reviewDecision && previous.reviewDecision !== "not_decided"
            ? previous.reviewStatus
            : correction.reviewStatus,
        updatedAt: timestamp
      });
      const persisted = suggestedMetadataCorrectionsBrowserFallback.get(
        correction.correctionId
      );
      if (persisted) {
        appendMetadataCorrectionAuditEventBrowserFallback(
          persisted,
          "correction_created",
          "Suggested metadata correction was created or refreshed for human review.",
          null,
          timestamp
        );
      }
      correctionCount += 1;
    }
  }

  return {
    blockers: [],
    correctionCount,
    dbPath: "browser-qa-fallback",
    matchResultCount,
    saved: true,
    warnings
  };
}

function createCrossrefFixtureMetadataReviewQueueBrowserFallback(): CreateMockExternalMetadataReviewQueueResult {
  const jobs = [...batchResearchIntakeJobsBrowserFallback.values()];
  const warnings = [
    "Crossref fixture only: no live Crossref API call was made.",
    "No network request and no API key were used.",
    "No SourceCard or structured bibliographic metadata is mutated.",
    "Review queue only - corrections remain pending until human review.",
    "Browser QA fallback only; desktop persistence uses the Tauri SQLite command."
  ];

  if (jobs.length === 0) {
    return {
      blockers: [
        "No batch intake jobs are available for Crossref fixture review queue generation."
      ],
      correctionCount: 0,
      dbPath: "browser-qa-fallback",
      matchResultCount: 0,
      saved: false,
      warnings
    };
  }

  let matchResultCount = 0;
  let correctionCount = 0;
  const timestamp = new Date().toISOString();

  for (const job of jobs) {
    const crossrefCandidate = getCrossrefFixtureCandidates(job)[0] ?? null;
    if (!crossrefCandidate) {
      continue;
    }

    const normalized = crossrefCandidate.normalizedCandidate;
    const candidate: BrowserMockMetadataCandidate = {
      confidenceBand: crossrefCandidate.confidenceBand,
      confidenceScore: crossrefCandidate.confidenceScore,
      matchedAuthors: normalized.matchedAuthors,
      matchedContainerTitle: normalized.matchedContainerTitle,
      matchedDoi: normalized.matchedDoi,
      matchedIssue: normalized.matchedIssue,
      matchedJournal: normalized.matchedJournal,
      matchedPageRange: normalized.matchedPageRange,
      matchedPublisher: normalized.matchedPublisher,
      matchedSourceType: normalized.matchedSourceType,
      matchedTitle: normalized.matchedTitle,
      matchedUrl: normalized.matchedUrl,
      matchedVolume: normalized.matchedVolume,
      matchedYear: normalized.matchedYear,
      providerName: normalized.provider.providerName,
      providerRecordRef: normalized.rawProviderRef
    };
    matchResultCount += 1;

    for (const correction of createBrowserSuggestedCorrections(job, candidate)) {
      const previous = suggestedMetadataCorrectionsBrowserFallback.get(
        correction.correctionId
      );
      suggestedMetadataCorrectionsBrowserFallback.set(correction.correctionId, {
        ...correction,
        createdAt: previous?.createdAt ?? timestamp,
        reviewDecision: previous?.reviewDecision ?? correction.reviewDecision,
        reviewerEditedValue:
          previous?.reviewerEditedValue ?? correction.reviewerEditedValue,
        reviewerNote: previous?.reviewerNote ?? correction.reviewerNote,
        reviewStatus:
          previous?.reviewDecision && previous.reviewDecision !== "not_decided"
            ? previous.reviewStatus
            : correction.reviewStatus,
        updatedAt: timestamp,
        warningFlagsJson: JSON.stringify([
          ...crossrefCandidate.warnings,
          "Review queue only - not applied."
        ])
      });
      const persisted = suggestedMetadataCorrectionsBrowserFallback.get(
        correction.correctionId
      );
      if (persisted) {
        appendMetadataCorrectionAuditEventBrowserFallback(
          persisted,
          "correction_created",
          "Crossref fixture suggested metadata correction was created or refreshed for human review.",
          null,
          timestamp
        );
      }
      correctionCount += 1;
    }
  }

  return {
    blockers: [],
    correctionCount,
    dbPath: "browser-qa-fallback",
    matchResultCount,
    saved: true,
    warnings
  };
}

function listSuggestedMetadataCorrectionsBrowserFallback(
  request: SuggestedMetadataCorrectionListRequest
): SuggestedMetadataCorrectionListResult {
  let corrections = [...suggestedMetadataCorrectionsBrowserFallback.values()].sort(
    (left, right) =>
      right.updatedAt.localeCompare(left.updatedAt) ||
      left.intakeJobId.localeCompare(right.intakeJobId) ||
      left.fieldName.localeCompare(right.fieldName)
  );

  if (request.reviewStatus?.trim()) {
    corrections = corrections.filter(
      (correction) => correction.reviewStatus === request.reviewStatus
    );
  }
  if (request.confidenceBand?.trim()) {
    corrections = corrections.filter(
      (correction) => correction.confidenceBand === request.confidenceBand
    );
  }
  if (request.intakeJobId?.trim()) {
    corrections = corrections.filter(
      (correction) => correction.intakeJobId === request.intakeJobId
    );
  }

  return {
    corrections,
    dbPath: "browser-qa-fallback"
  };
}

function updateSuggestedMetadataCorrectionReviewStateBrowserFallback(
  request: UpdateSuggestedMetadataCorrectionReviewStateRequest
): UpdateSuggestedMetadataCorrectionReviewStateResult {
  const previous = suggestedMetadataCorrectionsBrowserFallback.get(request.correctionId);
  const warnings = [
    "Review state update only: metadata is not applied to SourceCards.",
    "SourceCard citationText is not overwritten.",
    "Approval here means review decision only, not metadata application.",
    "Browser QA fallback only; desktop persistence uses the Tauri SQLite command."
  ];

  if (!previous) {
    return {
      blockers: [`Suggested metadata correction not found: ${request.correctionId}`],
      correction: null,
      dbPath: "browser-qa-fallback",
      saved: false,
      warnings
    };
  }

  const reviewStatus = reviewStatusForDecision(request.reviewDecision);
  if (!reviewStatus) {
    return {
      blockers: ["Review decision is unsupported."],
      correction: null,
      dbPath: "browser-qa-fallback",
      saved: false,
      warnings
    };
  }
  if (
    request.reviewDecision === "edited_before_approval" &&
    !request.reviewerEditedValue?.trim()
  ) {
    return {
      blockers: ["Reviewer edited value is required for edit-before-approval."],
      correction: null,
      dbPath: "browser-qa-fallback",
      saved: false,
      warnings
    };
  }

  const correction: SavedSuggestedMetadataCorrection = {
    ...previous,
    reviewDecision: request.reviewDecision,
    reviewerEditedValue: request.reviewerEditedValue?.trim() || null,
    reviewerNote: request.reviewerNote?.trim() || null,
    reviewStatus,
    updatedAt: new Date().toISOString()
  };
  if (
    correction.targetMetadataTable === "source_card_bibliographic_metadata" &&
    structuredMetadataApplyAllowedFields.includes(correction.fieldName) &&
    (request.reviewDecision === "approved_suggested_value" ||
      request.reviewDecision === "edited_before_approval")
  ) {
    correction.sourceCardId =
      previous.sourceCardId ?? structuredMetadataApplySourceCardIdBrowserFallback;
  }
  suggestedMetadataCorrectionsBrowserFallback.set(correction.correctionId, correction);
  const latestAuditEvent = appendMetadataCorrectionAuditEventBrowserFallback(
    correction,
    auditEventTypeForBrowserReviewDecision(request.reviewDecision),
    `Review decision updated from ${previous.reviewStatus}/${previous.reviewDecision} to ${correction.reviewStatus}/${correction.reviewDecision}.`,
    correction.reviewerNote,
    correction.updatedAt
  );
  const auditEventCount = metadataCorrectionAuditEventsBrowserFallback.filter(
    (event) => event.correctionId === correction.correctionId
  ).length;

  return {
    auditEventCount,
    blockers: [],
    correction,
    dbPath: "browser-qa-fallback",
    latestAuditEvent,
    saved: true,
    warnings
  };
}

function createMetadataCorrectionAuditEventBrowserFallback(
  request: CreateMetadataCorrectionAuditEventRequest
): CreateMetadataCorrectionAuditEventResult {
  const correction = suggestedMetadataCorrectionsBrowserFallback.get(request.correctionId);
  const warnings = metadataCorrectionAuditWarningsBrowserFallback();

  if (!correction) {
    return {
      blockers: [`Suggested metadata correction not found: ${request.correctionId}`],
      dbPath: "browser-qa-fallback",
      event: null,
      saved: false,
      warnings
    };
  }

  const event = appendMetadataCorrectionAuditEventBrowserFallback(
    correction,
    request.eventType,
    request.eventSummary?.trim() ||
      `Metadata correction audit event recorded: ${request.eventType}.`,
    request.reviewerNote?.trim() || null,
    new Date().toISOString()
  );

  return {
    blockers: [],
    dbPath: "browser-qa-fallback",
    event,
    saved: true,
    warnings
  };
}

function listMetadataCorrectionAuditEventsBrowserFallback(
  request: MetadataCorrectionAuditEventListRequest
): MetadataCorrectionAuditEventListResult {
  let events = [...metadataCorrectionAuditEventsBrowserFallback].sort(
    (left, right) =>
      right.createdAt.localeCompare(left.createdAt) ||
      left.auditEventId.localeCompare(right.auditEventId)
  );

  if (request.correctionId?.trim()) {
    events = events.filter((event) => event.correctionId === request.correctionId);
  }
  if (request.intakeJobId?.trim()) {
    events = events.filter((event) => event.intakeJobId === request.intakeJobId);
  }

  return {
    dbPath: "browser-qa-fallback",
    events
  };
}

function runMetadataCorrectionApplyDryRunBrowserFallback(
  request: RunMetadataCorrectionApplyDryRunRequest
): MetadataCorrectionApplyDryRunResult {
  const correction = suggestedMetadataCorrectionsBrowserFallback.get(
    request.correctionId
  );

  if (!correction) {
    throw new Error(`Suggested metadata correction not found: ${request.correctionId}`);
  }

  const blockers: string[] = [];
  const warnings = metadataCorrectionApplyDryRunWarningsBrowserFallback();
  const intendedApplyValue =
    correction.reviewDecision === "edited_before_approval"
      ? correction.reviewerEditedValue?.trim() || null
      : correction.suggestedValue.trim() || null;

  if (
    correction.reviewDecision !== "approved_suggested_value" &&
    correction.reviewDecision !== "edited_before_approval"
  ) {
    blockers.push(
      "Correction must be approved or edited-before-approval before dry-run apply."
    );
  }
  if (!intendedApplyValue) {
    blockers.push("Intended future apply value is empty.");
  }
  const targetBlocker = validateBrowserDryRunTarget(
    correction.targetMetadataTable,
    correction.fieldName
  );
  if (targetBlocker) {
    blockers.push(targetBlocker);
  }
  if (!correction.sourceCardId) {
    blockers.push("SourceCard linkage is required before apply dry-run.");
  }
  if (correction.reviewStatus === "verified") {
    blockers.push(
      "Verified correction has already been applied; create a reversal or new correction before another apply."
    );
  }
  if (correction.confidenceBand === "low" && !correction.reviewerNote) {
    blockers.push(
      "Low confidence correction requires reviewer note before dry-run can pass."
    );
  }

  let currentStoredValue: string | null = null;
  let staleCheckStatus = "not_checked_missing_source_card";
  if (correction.sourceCardId) {
    if (correction.targetMetadataTable === "source_card_bibliographic_metadata") {
      currentStoredValue =
        structuredBibliographicMetadataBrowserFallback.get(correction.sourceCardId)?.[
          correction.fieldName
        ] ?? null;
      staleCheckStatus =
        normalizeBrowserString(currentStoredValue) ===
        normalizeBrowserString(correction.currentValue)
          ? "matches_original"
          : "stale_current_value";
    } else {
      staleCheckStatus = "not_checked_browser_fallback";
    }
  }
  if (staleCheckStatus === "stale_current_value") {
    blockers.push(
      "Current stored metadata differs from the correction original ATP value."
    );
  }

  const dryRunStatus = deriveBrowserDryRunStatus(
    blockers,
    correction,
    staleCheckStatus
  );
  const auditEventType: MetadataCorrectionAuditEventType =
    blockers.length === 0 ? "apply_preflight_passed" : "apply_preflight_blocked";
  const auditEventPreview = `${auditEventType} for ${correction.correctionId}. No metadata will be applied.`;
  const shouldWriteAuditEvent = request.writeAuditEvent !== false;
  const auditEvent = shouldWriteAuditEvent
    ? appendMetadataCorrectionAuditEventBrowserFallback(
        correction,
        auditEventType,
        auditEventPreview,
        correction.reviewerNote,
        new Date().toISOString()
      )
    : null;

  return {
    auditEvent,
    auditEventPreview,
    auditEventWritten: Boolean(auditEvent),
    blockers,
    confidenceBand: correction.confidenceBand,
    confidenceScore: correction.confidenceScore,
    correctionId: correction.correctionId,
    currentStoredValue,
    dryRunStatus,
    intakeJobId: correction.intakeJobId,
    intendedApplyValue,
    nextAction: nextActionForBrowserDryRunStatus(dryRunStatus),
    noOverwritePolicy: metadataCorrectionApplyDryRunNoOverwritePolicyBrowserFallback(),
    originalCorrectionValue: correction.currentValue,
    reviewerEditedValue: correction.reviewerEditedValue,
    sourceCardId: correction.sourceCardId,
    staleCheckStatus,
    suggestedValue: correction.suggestedValue,
    targetFieldName: correction.fieldName,
    targetMetadataTable: correction.targetMetadataTable,
    warnings
  };
}

function applyMetadataCorrectionToStructuredBibliographicMetadataBrowserFallback(
  request: ApplyMetadataCorrectionToStructuredBibliographicMetadataRequest
): ApplyMetadataCorrectionToStructuredBibliographicMetadataResult {
  const dryRun = runMetadataCorrectionApplyDryRunBrowserFallback({
    correctionId: request.correctionId,
    writeAuditEvent: false
  });
  const correction = suggestedMetadataCorrectionsBrowserFallback.get(request.correctionId);
  const blockers = [...dryRun.blockers];
  const warnings = metadataCorrectionStructuredApplyWarningsBrowserFallback();

  if (!correction) {
    blockers.push(`Suggested metadata correction not found: ${request.correctionId}`);
  }
  if (!request.reviewerConfirmedApply) {
    blockers.push("reviewerConfirmedApply must be true for structured metadata apply.");
  }
  if (dryRun.dryRunStatus !== "ready_to_apply_later") {
    blockers.push(`Apply blocked because dry-run status is ${dryRun.dryRunStatus}.`);
  }
  if (dryRun.targetMetadataTable !== "source_card_bibliographic_metadata") {
    blockers.push("4I-6C applies structured bibliographic metadata only.");
  }
  if (!structuredMetadataApplyAllowedFields.includes(dryRun.targetFieldName)) {
    blockers.push(
      `Target field is blocked for 4I-6C structured apply: ${dryRun.targetFieldName}`
    );
  }
  if (!dryRun.intendedApplyValue) {
    blockers.push("Intended apply value is empty.");
  }

  if (blockers.length > 0 || !correction || !dryRun.sourceCardId) {
    return {
      appliedValue: null,
      applyStatus: "blocked",
      auditEventCount: 0,
      auditEventIds: [],
      blockers,
      correctionId: request.correctionId,
      intendedApplyValue: dryRun.intendedApplyValue,
      nextAction: "Resolve blockers and rerun dry-run before apply.",
      readBackValue: null,
      readBackVerified: false,
      sourceCardId: dryRun.sourceCardId,
      targetFieldName: dryRun.targetFieldName,
      targetMetadataTable: dryRun.targetMetadataTable,
      warnings
    };
  }

  const timestamp = new Date().toISOString();
  const startedEvent = appendMetadataCorrectionAuditEventBrowserFallback(
    correction,
    "correction_apply_started",
    "Structured bibliographic metadata correction apply started.",
    correction.reviewerNote,
    timestamp
  );
  const metadata = {
    ...(structuredBibliographicMetadataBrowserFallback.get(dryRun.sourceCardId) ?? {})
  };
  metadata[dryRun.targetFieldName] = dryRun.intendedApplyValue;
  structuredBibliographicMetadataBrowserFallback.set(dryRun.sourceCardId, metadata);
  const readBackValue = metadata[dryRun.targetFieldName] ?? null;
  const readBackVerified =
    normalizeBrowserString(readBackValue) ===
    normalizeBrowserString(dryRun.intendedApplyValue);
  const auditEventIds = [startedEvent.auditEventId];

  if (readBackVerified) {
    const appliedEvent = appendMetadataCorrectionAuditEventBrowserFallback(
      correction,
      "correction_applied",
      "Structured bibliographic metadata correction applied.",
      correction.reviewerNote,
      timestamp,
      dryRun.intendedApplyValue
    );
    const verifiedEvent = appendMetadataCorrectionAuditEventBrowserFallback(
      correction,
      "metadata_read_back_verified",
      "Structured bibliographic metadata read-back verified.",
      correction.reviewerNote,
      timestamp,
      dryRun.intendedApplyValue
    );
    auditEventIds.push(appliedEvent.auditEventId, verifiedEvent.auditEventId);
    suggestedMetadataCorrectionsBrowserFallback.set(correction.correctionId, {
      ...correction,
      reviewStatus: "verified",
      updatedAt: timestamp
    });
  } else {
    const failedEvent = appendMetadataCorrectionAuditEventBrowserFallback(
      correction,
      "correction_apply_failed",
      "Structured metadata correction apply failed read-back verification.",
      correction.reviewerNote,
      timestamp
    );
    auditEventIds.push(failedEvent.auditEventId);
  }

  return {
    appliedValue: readBackVerified ? dryRun.intendedApplyValue : null,
    applyStatus: readBackVerified ? "applied_and_verified" : "read_back_failed",
    auditEventCount: auditEventIds.length,
    auditEventIds,
    blockers: [],
    correctionId: correction.correctionId,
    intendedApplyValue: dryRun.intendedApplyValue,
    nextAction: readBackVerified
      ? "Structured metadata apply verified. Continue human citation review."
      : "Review failed read-back before retrying apply.",
    readBackValue,
    readBackVerified,
    sourceCardId: dryRun.sourceCardId,
    targetFieldName: dryRun.targetFieldName,
    targetMetadataTable: dryRun.targetMetadataTable,
    warnings
  };
}

function validateBrowserDryRunTarget(
  targetMetadataTable: string,
  fieldName: string
): string | null {
  if (
    targetMetadataTable === "source_cards" &&
    ["title", "authors", "year", "sourceType"].includes(fieldName)
  ) {
    return null;
  }
  if (targetMetadataTable === "source_cards" && fieldName === "citationText") {
    return "Unsupported target: SourceCard citationText cannot be changed by correction dry-run.";
  }
  if (
    targetMetadataTable === "source_card_bibliographic_metadata" &&
    [
      ...structuredMetadataApplyAllowedFields
    ].includes(fieldName)
  ) {
    return null;
  }
  if (targetMetadataTable === "source_card_bibliographic_metadata" && fieldName === "isbn") {
    return "Unsupported target: ISBN is not stored in the current structured metadata schema.";
  }
  return `Unsupported metadata correction target: ${targetMetadataTable}.${fieldName}`;
}

function deriveBrowserDryRunStatus(
  blockers: string[],
  correction: SavedSuggestedMetadataCorrection,
  staleCheckStatus: string
): MetadataCorrectionApplyDryRunStatus {
  if (blockers.some((blocker) => blocker.includes("SourceCard linkage"))) {
    return "missing_source_card";
  }
  if (blockers.some((blocker) => blocker.includes("Unsupported target"))) {
    return "unsupported_target";
  }
  if (correction.confidenceBand === "low" && !correction.reviewerNote) {
    return "low_confidence_requires_note";
  }
  if (blockers.some((blocker) => blocker.includes("already been applied"))) {
    return "blocked";
  }
  if (staleCheckStatus === "stale_current_value") {
    return "stale_current_value";
  }
  if (blockers.length > 0) {
    return "blocked";
  }
  return "ready_to_apply_later";
}

function nextActionForBrowserDryRunStatus(status: string): string {
  if (status === "ready_to_apply_later") {
    return "Dry-run passed. A future explicit apply command is still required.";
  }
  if (status === "missing_source_card") {
    return "Link the correction to a saved SourceCard before future apply.";
  }
  if (status === "unsupported_target") {
    return "Choose a supported metadata field before future apply.";
  }
  if (status === "low_confidence_requires_note") {
    return "Add reviewer note and evidence before future apply.";
  }
  return "Resolve blockers before future apply.";
}

function metadataCorrectionApplyDryRunWarningsBrowserFallback(): string[] {
  return [
    "Dry-run only: no metadata has been applied.",
    "Approval is not verified metadata.",
    "SourceCard metadata is not changed.",
    "Structured bibliographic metadata is not changed.",
    "SourceCard citationText is not overwritten.",
    "APA-final verification is not set.",
    "A future explicit apply command is still required."
  ];
}

function metadataCorrectionApplyDryRunNoOverwritePolicyBrowserFallback(): string[] {
  return [
    "No SourceCard update command is called.",
    "No structured bibliographic metadata upsert command is called.",
    "SourceCard citationText is blocked.",
    "APA-final verification is blocked.",
    "Dry-run may write apply_preflight audit events only."
  ];
}

function metadataCorrectionStructuredApplyWarningsBrowserFallback(): string[] {
  return [
    "Applies only to structured bibliographic metadata.",
    "SourceCard title/authors/year/sourceType are not changed.",
    "SourceCard citationText is not overwritten.",
    "APA-final verification is not set.",
    "DOCX export and DraftArtifacts are not changed.",
    "Real provider/API data is not used."
  ];
}

function appendMetadataCorrectionAuditEventBrowserFallback(
  correction: SavedSuggestedMetadataCorrection,
  eventType: MetadataCorrectionAuditEventType,
  eventSummary: string,
  reviewerNote: string | null,
  createdAt: string,
  appliedValue: string | null = null
): SavedMetadataCorrectionAuditEvent {
  const auditEventId = `metadata-audit-${slugifyBrowserId(correction.correctionId)}-${slugifyBrowserId(eventType)}-${metadataCorrectionAuditEventsBrowserFallback.length + 1}`;
  const isApplyEvent = [
    "correction_apply_started",
    "correction_applied",
    "metadata_read_back_verified",
    "correction_apply_failed"
  ].includes(eventType);
  const isPreflightEvent = [
    "apply_preflight_passed",
    "apply_preflight_blocked"
  ].includes(eventType);
  const event: SavedMetadataCorrectionAuditEvent = {
    appliedValue,
    auditEventId,
    confidenceBand: correction.confidenceBand,
    confidenceScore: correction.confidenceScore,
    correctionId: correction.correctionId,
    createdAt,
    eventSummary,
    eventType,
    externalSuggestedValue: correction.suggestedValue,
    intakeJobId: correction.intakeJobId,
    originalAtpValue: correction.currentValue,
    providerName: correction.providerName,
    providerRecordRef: correction.providerRecordRef,
    reviewerEditedValue: correction.reviewerEditedValue,
    reviewerNote,
    sourceCardId: correction.sourceCardId,
    sourceMetadataSnapshotJson: JSON.stringify({
      correctionId: correction.correctionId,
      applyBoundary: isApplyEvent,
      fieldName: correction.fieldName,
      intakeJobId: correction.intakeJobId,
      mutationCommitted:
        eventType === "correction_applied" ||
        eventType === "metadata_read_back_verified",
      noApplyBoundary: !isApplyEvent,
      preflightOnly: isPreflightEvent,
      reviewDecision: correction.reviewDecision,
      reviewStatus: correction.reviewStatus,
      sourceCardId: correction.sourceCardId,
      targetMetadataTable: correction.targetMetadataTable
    }),
    targetFieldName: correction.fieldName,
    targetMetadataTable: correction.targetMetadataTable,
    warningFlagsJson: correction.warningFlagsJson
  };

  metadataCorrectionAuditEventsBrowserFallback.push(event);
  return event;
}

function normalizeBrowserString(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function auditEventTypeForBrowserReviewDecision(
  reviewDecision: SuggestedMetadataCorrectionReviewDecision
): MetadataCorrectionAuditEventType {
  switch (reviewDecision) {
    case "approved_suggested_value":
      return "correction_approved";
    case "rejected_suggested_value":
      return "correction_rejected";
    case "edited_before_approval":
      return "correction_edited_before_approval";
    case "deferred_needs_more_evidence":
      return "correction_deferred";
    case "not_decided":
      return "correction_routed";
  }
}

function metadataCorrectionAuditWarningsBrowserFallback(): string[] {
  return [
    "Audit trail only: metadata corrections are not applied.",
    "SourceCard metadata is not changed by audit events.",
    "Structured bibliographic metadata is not changed by audit events.",
    "SourceCard citationText is not overwritten.",
    "APA-final verification is not set."
  ];
}

interface BrowserMockMetadataCandidate {
  confidenceBand: string;
  confidenceScore: number;
  matchedAuthors: string[];
  matchedContainerTitle?: string | null;
  matchedDoi?: string | null;
  matchedIsbn?: string | null;
  matchedIssue?: string | null;
  matchedJournal?: string | null;
  matchedPageRange?: string | null;
  matchedPublisher?: string | null;
  matchedSourceType: string;
  matchedTitle: string;
  matchedUrl?: string | null;
  matchedVolume?: string | null;
  matchedYear?: string | null;
  providerName: string;
  providerRecordRef: string;
}

function createBrowserMockMetadataCandidate(
  job: SavedBatchResearchIntakeJob
): BrowserMockMetadataCandidate | null {
  const fileName = job.fileName.toLowerCase();

  if (fileName.includes("service-quality-chapter")) {
    return {
      confidenceBand: "high",
      confidenceScore: 91,
      matchedAuthors: ["Parasuraman, A.", "Zeithaml, V. A.", "Berry, L. L."],
      matchedContainerTitle: "Services Marketing Teaching Compendium",
      matchedIsbn: "978-0-0000-0000-0",
      matchedPageRange: "41-58",
      matchedPublisher: "Mock Academic Press",
      matchedSourceType: "book_chapter",
      matchedTitle: "Service Quality Foundations for Customer Satisfaction",
      matchedYear: "1988",
      providerName: "Mock Crossref Fixture",
      providerRecordRef: "mock:crossref:service-quality-chapter"
    };
  }

  if (fileName.includes("article") || fileName.includes("report")) {
    return {
      confidenceBand: "medium",
      confidenceScore: 64,
      matchedAuthors: ["Cronin, J. J.", "Taylor, S. A."],
      matchedDoi: "10.0000/mock-service-quality-article",
      matchedIssue: "1",
      matchedJournal: "Journal of Service Quality Studies",
      matchedPageRange: "12-29",
      matchedSourceType: "academic_journal_article",
      matchedTitle: "Service Quality Article on Satisfaction and Performance",
      matchedUrl: "https://example.invalid/mock-service-quality-article",
      matchedVolume: "7",
      matchedYear: "1992",
      providerName: "Mock OpenAlex Fixture",
      providerRecordRef: "mock:openalex:service-quality-article"
    };
  }

  if (fileName.includes("ambiguous")) {
    return {
      confidenceBand: "low",
      confidenceScore: 28,
      matchedAuthors: [],
      matchedSourceType: "unknown_pending_review",
      matchedTitle: "Ambiguous Local Source Note",
      providerName: "Mock Manual Metadata Fixture",
      providerRecordRef: "mock:manual-fixture:ambiguous-source"
    };
  }

  return null;
}

function createBrowserSuggestedCorrections(
  job: SavedBatchResearchIntakeJob,
  candidate: BrowserMockMetadataCandidate
): SavedSuggestedMetadataCorrection[] {
  const base = {
    confidenceBand: candidate.confidenceBand,
    confidenceScore: candidate.confidenceScore,
    intakeJobId: job.intakeJobId,
    matchResultId: `external-match-${slugifyBrowserId(job.intakeJobId)}-${slugifyBrowserId(candidate.providerRecordRef)}`,
    mismatchReasonsJson: "[]",
    providerName: candidate.providerName,
    providerRecordRef: candidate.providerRecordRef,
    reviewDecision: "not_decided" as const,
    reviewerEditedValue: null,
    reviewerNote: null,
    warningFlagsJson: JSON.stringify([
      "Mock provider only - no real external metadata API was called.",
      "No metadata is overwritten automatically."
    ])
  };
  const corrections: Array<
    Omit<
      SavedSuggestedMetadataCorrection,
      "correctionId" | "createdAt" | "updatedAt"
    >
  > = [];
  const push = (
    fieldName: string,
    currentValue: string | null,
    suggestedValue: string | null | undefined,
    targetMetadataTable: string,
    reason: string
  ) => {
    if (!suggestedValue?.trim()) {
      return;
    }
    if ((currentValue ?? "").trim().toLowerCase() === suggestedValue.trim().toLowerCase()) {
      return;
    }
    corrections.push({
      ...base,
      currentValue,
      fieldName,
      reason,
      reviewStatus: routeBrowserCorrectionStatus(candidate.confidenceBand),
      sourceCardId: null,
      suggestedValue,
      targetMetadataTable
    });
  };

  push("title", deriveBrowserLocalTitle(job.fileName), candidate.matchedTitle, "source_cards", "Provider title differs from the local file-name-derived title.");
  push("sourceType", job.sourceTypeGuess, candidate.matchedSourceType, "source_cards", "Provider suggests a bibliographic source type.");
  push("authors", null, candidate.matchedAuthors.join("; "), "source_cards", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("year", null, candidate.matchedYear, "source_cards", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("journal", null, candidate.matchedJournal, "source_card_bibliographic_metadata", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("publisher", null, candidate.matchedPublisher, "source_card_bibliographic_metadata", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("containerTitle", null, candidate.matchedContainerTitle, "source_card_bibliographic_metadata", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("volume", null, candidate.matchedVolume, "source_card_bibliographic_metadata", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("issue", null, candidate.matchedIssue, "source_card_bibliographic_metadata", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("pageRange", null, candidate.matchedPageRange, "source_card_bibliographic_metadata", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("doi", null, candidate.matchedDoi, "source_card_bibliographic_metadata", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("isbn", null, candidate.matchedIsbn, "source_card_bibliographic_metadata", "Provider fixture has a candidate value; local batch queue has no approved value yet.");
  push("url", null, candidate.matchedUrl, "source_card_bibliographic_metadata", "Provider fixture has a candidate value; local batch queue has no approved value yet.");

  return corrections.map((correction) => ({
    ...correction,
    correctionId: `suggested-correction-${slugifyBrowserId(job.intakeJobId)}-${slugifyBrowserId(candidate.providerRecordRef)}-${slugifyBrowserId(correction.fieldName)}`,
    createdAt: "",
    updatedAt: ""
  }));
}

function reviewStatusForDecision(
  decision: SuggestedMetadataCorrectionReviewDecision
): SuggestedMetadataCorrectionReviewStatus | null {
  switch (decision) {
    case "approved_suggested_value":
      return "approved";
    case "rejected_suggested_value":
      return "rejected";
    case "edited_before_approval":
      return "edited";
    case "deferred_needs_more_evidence":
      return "deferred_needs_more_evidence";
    case "not_decided":
      return "pending";
  }
}

function routeBrowserCorrectionStatus(
  confidenceBand: string
): SuggestedMetadataCorrectionReviewStatus {
  if (confidenceBand === "high") {
    return "ready_for_batch_approval";
  }
  if (confidenceBand === "medium") {
    return "needs_human_review";
  }
  if (confidenceBand === "low") {
    return "low_confidence";
  }
  return "needs_human_review";
}

function deriveBrowserLocalTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function slugifyBrowserId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

const sourceCardApaReferenceReviewBrowserFallback = new Map<
  string,
  SavedSourceCardApaReferenceReview
>();

function canUseTauriInvoke(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean((window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
}

function saveSourceCardApaReferenceReviewBrowserFallback(
  request: SaveSourceCardApaReferenceReviewRequest
): SaveSourceCardApaReferenceReviewResult {
  const blockers = validateApaReferenceReviewBrowserFallback(request);
  const warnings = [
    "Browser QA fallback only; desktop persistence uses the Tauri SQLite command.",
    "Verified for internal use only; this is not publication-ready or APA-final.",
    "SourceCard citationText is not overwritten.",
    "No DOI lookup, web search, AI generation, or APA finalization is performed."
  ];

  if (blockers.length > 0) {
    return {
      blockers,
      dbPath: "browser-qa-fallback",
      review: null,
      saved: false,
      sourceCardId: request.sourceCardId,
      warnings
    };
  }

  const timestamp = new Date().toISOString();
  const previous = sourceCardApaReferenceReviewBrowserFallback.get(
    request.sourceCardId
  );
  const review: SavedSourceCardApaReferenceReview = {
    apaStyleVersion: request.apaStyleVersion,
    blockersResolvedJson: JSON.stringify(request.blockersResolved),
    candidateReferenceText: request.candidateReferenceText,
    checklistJson: JSON.stringify(request.checklist),
    createdAt: previous?.createdAt ?? timestamp,
    humanReviewedAt: timestamp,
    reviewId: request.reviewId,
    reviewerNote: request.reviewerNote ?? null,
    sourceCardId: request.sourceCardId,
    sourceMetadataSnapshotJson: request.sourceMetadataSnapshotJson,
    updatedAt: timestamp,
    verificationScope: request.verificationScope,
    verificationStatus: request.verificationStatus,
    verifiedReferenceText: request.verifiedReferenceText,
    warningsAcceptedJson: JSON.stringify(request.warningsAccepted)
  };

  sourceCardApaReferenceReviewBrowserFallback.set(request.sourceCardId, review);

  return {
    blockers: [],
    dbPath: "browser-qa-fallback",
    review,
    saved: true,
    sourceCardId: request.sourceCardId,
    warnings
  };
}

function validateApaReferenceReviewBrowserFallback(
  request: SaveSourceCardApaReferenceReviewRequest
): string[] {
  const blockers: string[] = [];

  if (!request.reviewId.trim()) {
    blockers.push("Review ID is required.");
  }

  if (!request.sourceCardId.trim()) {
    blockers.push("SourceCard ID is required.");
  }

  if (!request.candidateReferenceText.trim()) {
    blockers.push("Candidate APA reference text is required.");
  }

  if (!request.verifiedReferenceText.trim()) {
    blockers.push("Verified reference text is required.");
  }

  if (request.apaStyleVersion !== "APA 7") {
    blockers.push("Only APA 7 review scope is supported.");
  }

  if (
    request.verificationStatus !== "needs_correction" &&
    request.verificationStatus !== "verified_for_internal_use"
  ) {
    blockers.push("APA-final verification is not supported by this gate.");
  }

  if (
    request.verificationScope !== "internal_drafting" &&
    request.verificationScope !== "teaching_preparation"
  ) {
    blockers.push("Verification scope must remain internal-use only.");
  }

  if (
    request.verificationStatus === "verified_for_internal_use" &&
    request.candidateBlockers.length > 0
  ) {
    blockers.push("Candidate blockers must be resolved before internal-use verification.");
  }

  if (request.verificationStatus === "verified_for_internal_use") {
    if (request.checklist.length === 0) {
      blockers.push("Checklist confirmation is required for internal-use verification.");
    }

    if (request.checklist.some((item) => item.state === "needs_correction")) {
      blockers.push("Checklist items marked needs_correction block internal-use verification.");
    }

    if (request.warningsAccepted.length > 0 && !request.reviewerNote?.trim()) {
      blockers.push("A reviewer note is required when warnings are accepted.");
    }
  }

  return blockers;
}

export type MarketingTagPersistenceTier = "core" | "extended" | "suggested";
export type MarketingTagPersistenceReviewStatus =
  | "approved"
  | "needs_review"
  | "rejected";

export interface SaveMarketingTagCandidateRequest {
  category: string;
  label: string;
  reviewStatus: MarketingTagPersistenceReviewStatus;
  tagId: string;
  tier: MarketingTagPersistenceTier;
}

export interface SaveMarketingTagsForSourceCardRequest {
  sourceCardId: string;
  tags: SaveMarketingTagCandidateRequest[];
}

export interface SaveMarketingTagsResult {
  blockers: string[];
  dbPath: string;
  linkedTagCount: number;
  saved: boolean;
  sourceCardId: string;
  tagCount: number;
  warnings: string[];
}

export interface SavedMarketingTagRecord {
  category: string;
  createdAt: string;
  label: string;
  reviewStatus: MarketingTagPersistenceReviewStatus;
  tagId: string;
  tier: MarketingTagPersistenceTier;
  updatedAt: string;
}

export interface SavedSourceCardTagRecord {
  category: string;
  label: string;
  reviewStatus: MarketingTagPersistenceReviewStatus;
  sourceCardId: string;
  tagId: string;
  tier: MarketingTagPersistenceTier;
}

export async function saveMarketingTagsForSourceCard(
  request: SaveMarketingTagsForSourceCardRequest
): Promise<SaveMarketingTagsResult> {
  return invoke<SaveMarketingTagsResult>("save_marketing_tags_for_source_card", {
    request
  });
}

export async function listSavedMarketingTags(): Promise<SavedMarketingTagRecord[]> {
  return invoke<SavedMarketingTagRecord[]>("list_saved_marketing_tags");
}

export async function listSavedTagsForSourceCard(
  sourceCardId: string
): Promise<SavedSourceCardTagRecord[]> {
  return invoke<SavedSourceCardTagRecord[]>("list_saved_tags_for_source_card", {
    request: { sourceCardId }
  });
}

export type KnowledgeCardPersistenceReviewStatus =
  | "approved"
  | "needs_review"
  | "rejected";

export interface SaveKnowledgeCardTraceReferenceRequest {
  chunkReference: string;
  pageNumber: number;
  pageNumberTrusted: boolean;
  sectionTitle: string;
}

export interface SaveKnowledgeCardCandidateRequest {
  cardType: KnowledgeCardSaveCandidateType;
  citationReadiness: "ready" | "needs_review" | "blocked";
  contentPreview: string;
  knowledgeCardId: string;
  reviewStatus: KnowledgeCardPersistenceReviewStatus;
  tagIds: string[];
  title: string;
  traceReference: SaveKnowledgeCardTraceReferenceRequest | null;
  validationStatus: "ready" | "needs_review" | "blocked";
}

export interface SaveKnowledgeCardsForSourceCardRequest {
  cards: SaveKnowledgeCardCandidateRequest[];
  sourceCardId: string;
}

export interface SaveKnowledgeCardsResult {
  blockers: string[];
  dbPath: string;
  knowledgeCardCount: number;
  linkedTagCount: number;
  saved: boolean;
  sourceCardId: string;
  traceRefCount: number;
  warnings: string[];
}

export interface SavedKnowledgeCardListItem {
  cardType: KnowledgeCardSaveCandidateType;
  citationReadiness: string;
  createdAt: string;
  knowledgeCardId: string;
  sourceCardId: string;
  tagCount: number;
  title: string;
  traceCount: number;
  updatedAt: string;
}

export interface SavedKnowledgeCardRecord {
  cardType: KnowledgeCardSaveCandidateType;
  citationReadiness: string;
  contentPreview: string;
  createdAt: string;
  knowledgeCardId: string;
  reviewStatus: string;
  sourceCardId: string;
  title: string;
  traceReadiness: string;
  updatedAt: string;
  validationStatus: string;
}

export interface SavedSourceCardCompactReference {
  sourceCardId: string;
  sourceDocumentId: string;
  sourceType: string;
  title: string;
}

export interface SavedKnowledgeCardTagRecord {
  category: string;
  label: string;
  reviewStatus: string;
  tagId: string;
  tier: string;
}

export interface SavedKnowledgeCardTraceRecord {
  chunkReference: string;
  pageNumber: number | null;
  pageNumberTrusted: boolean;
  sectionTitle: string | null;
  traceId: string;
}

export interface SavedKnowledgeCardDetail {
  knowledgeCard: SavedKnowledgeCardRecord;
  sourceCard: SavedSourceCardCompactReference;
  tags: SavedKnowledgeCardTagRecord[];
  traces: SavedKnowledgeCardTraceRecord[];
}

export async function saveKnowledgeCardsForSourceCard(
  request: SaveKnowledgeCardsForSourceCardRequest
): Promise<SaveKnowledgeCardsResult> {
  return invoke<SaveKnowledgeCardsResult>("save_knowledge_cards_for_source_card", {
    request
  });
}

export async function listSavedKnowledgeCards(): Promise<
  SavedKnowledgeCardListItem[]
> {
  return invoke<SavedKnowledgeCardListItem[]>("list_saved_knowledge_cards");
}

export async function listSavedKnowledgeCardsForSourceCard(
  sourceCardId: string
): Promise<SavedKnowledgeCardListItem[]> {
  return invoke<SavedKnowledgeCardListItem[]>(
    "list_saved_knowledge_cards_for_source_card",
    {
      request: { sourceCardId }
    }
  );
}

export async function readSavedKnowledgeCard(
  knowledgeCardId: string
): Promise<SavedKnowledgeCardDetail> {
  return invoke<SavedKnowledgeCardDetail>("read_saved_knowledge_card", {
    request: { knowledgeCardId }
  });
}

export interface SaveDraftArtifactRequest {
  draftArtifact: DraftArtifactSaveCandidate;
  linkedKnowledgeCardIds: string[];
  sections: DraftSectionSaveCandidate[];
  sourceCardId: string;
}

export interface SaveDraftArtifactResult {
  blockers: string[];
  dbPath: string;
  draftArtifactId: string;
  linkedKnowledgeCardCount: number;
  saved: boolean;
  sectionCount: number;
  sourceCardId: string;
  warnings: string[];
}

export interface SavedDraftArtifactListItem {
  artifactStatus: string;
  createdAt: string;
  draftArtifactId: string;
  draftType: string;
  linkedKnowledgeCardCount: number;
  mockOnly: boolean;
  notFinal: boolean;
  sectionCount: number;
  sourceCardId: string;
  title: string;
  updatedAt: string;
}

export interface SavedDraftArtifactRecord {
  artifactStatus: string;
  citationReadiness: string;
  createdAt: string;
  draftArtifactId: string;
  draftType: string;
  mockOnly: boolean;
  notFinal: boolean;
  sourceCardId: string;
  title: string;
  traceReadiness: string;
  updatedAt: string;
}

export interface SavedDraftSectionRecord {
  approvedTagsJson: string;
  citationPlaceholdersJson: string;
  linkedCaseIdsJson: string;
  linkedEvidenceIdsJson: string;
  linkedQuoteIdsJson: string;
  mockParagraph: string;
  sectionId: string;
  sectionTitle: string;
  sortOrder: number;
  warningsJson: string;
}

export interface SavedDraftArtifactKnowledgeCardRecord {
  cardType: KnowledgeCardSaveCandidateType;
  knowledgeCardId: string;
  title: string;
}

export interface SavedDraftArtifactDetail {
  draftArtifact: SavedDraftArtifactRecord;
  knowledgeCards: SavedDraftArtifactKnowledgeCardRecord[];
  sections: SavedDraftSectionRecord[];
  sourceCard: SavedSourceCardCompactReference;
}

export async function saveDraftArtifactCandidate(
  request: SaveDraftArtifactRequest
): Promise<SaveDraftArtifactResult> {
  return invoke<SaveDraftArtifactResult>("save_draft_artifact_candidate", {
    request
  });
}

export async function listSavedDraftArtifacts(): Promise<
  SavedDraftArtifactListItem[]
> {
  return invoke<SavedDraftArtifactListItem[]>("list_saved_draft_artifacts");
}

export async function listSavedDraftArtifactsForSourceCard(
  sourceCardId: string
): Promise<SavedDraftArtifactListItem[]> {
  return invoke<SavedDraftArtifactListItem[]>(
    "list_saved_draft_artifacts_for_source_card",
    {
      request: { sourceCardId }
    }
  );
}

export async function readSavedDraftArtifact(
  draftArtifactId: string
): Promise<SavedDraftArtifactDetail> {
  return invoke<SavedDraftArtifactDetail>("read_saved_draft_artifact", {
    request: { draftArtifactId }
  });
}
