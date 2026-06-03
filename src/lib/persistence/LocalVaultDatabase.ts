import { invoke } from "@tauri-apps/api/core";
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
  | "deferred_needs_more_evidence";

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
  blockers: string[];
  correction: SavedSuggestedMetadataCorrection | null;
  dbPath: string;
  saved: boolean;
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
  suggestedMetadataCorrectionsBrowserFallback.set(correction.correctionId, correction);

  return {
    blockers: [],
    correction,
    dbPath: "browser-qa-fallback",
    saved: true,
    warnings
  };
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
