import type {
  EvidenceCaseQuoteCandidatePreview
} from "./EvidenceCaseQuoteCandidatePreviewMapper";
import type {
  DeepIntakeRunCandidateBundle
} from "./DeepIntakeRunCandidateBundleMapper";
import type {
  KnowledgeUnitCandidatePreview
} from "./KnowledgeUnitCandidatePreviewMapper";
import type {
  SourceDocumentChunkingPreview
} from "./SourceDocumentChunkingPreviewMapper";
import type {
  SourceDocumentIntakeReadinessPreview
} from "./SourceDocumentIntakeReadinessMapper";
import type {
  SourceDocumentStructurePreview
} from "./SourceDocumentStructurePreviewMapper";
import type {
  SourceSectionContentChunkSaveCandidateMapping
} from "./SourceSectionContentChunkSaveCandidateMapper";
import type {
  TeachingWritingAngleCandidatePreview
} from "./TeachingWritingAngleCandidatePreviewMapper";

export type DeepIntakeCandidateFamilySummaryStatus =
  | "blocked"
  | "needs_review"
  | "ready_for_next_step";

export type DeepIntakeCandidateFamilySummaryFamilyName =
  | "SourceDocument"
  | "SourceSection"
  | "ContentChunk"
  | "KnowledgeUnit"
  | "EvidenceUnit"
  | "CaseUnit"
  | "QuoteUnit"
  | "TeachingUnit"
  | "WritingAngle";

export type DeepIntakeCandidateFamilyPersistenceState =
  | "saved"
  | "preview_only"
  | "blocked";

export type DeepIntakeCandidateFamilyTraceability =
  | "linked_to_saved_source_document"
  | "trace_references_available"
  | "missing_trace"
  | "blocked";

export type DeepIntakeCandidateFamilyTrustState = "green" | "orange" | "red";

export interface DeepIntakeCandidateFamilySummaryInput {
  chunkingPreview?: SourceDocumentChunkingPreview | null;
  evidenceCaseQuotePreview?: EvidenceCaseQuoteCandidatePreview | null;
  intakeReadiness?: SourceDocumentIntakeReadinessPreview | null;
  knowledgeUnitPreview?: KnowledgeUnitCandidatePreview | null;
  runBundle?: DeepIntakeRunCandidateBundle | null;
  sectionChunkSaveCandidate?: SourceSectionContentChunkSaveCandidateMapping | null;
  sourceDocumentId?: string | null;
  structurePreview?: SourceDocumentStructurePreview | null;
  teachingWritingAnglePreview?: TeachingWritingAngleCandidatePreview | null;
}

export interface DeepIntakeCandidateFamilySummaryRow {
  candidateCount: number;
  exists: boolean;
  familyName: DeepIntakeCandidateFamilySummaryFamilyName;
  persistenceState: DeepIntakeCandidateFamilyPersistenceState;
  reviewStatus: string;
  traceability: DeepIntakeCandidateFamilyTraceability;
  trustState: DeepIntakeCandidateFamilyTrustState;
}

export interface DeepIntakeCandidateFamilySummary {
  blockers: string[];
  familyRows: DeepIntakeCandidateFamilySummaryRow[];
  nextRecommendedAction: string;
  noAiBoundaryNotice: string;
  previewNotice: string;
  readyFamilyCount: number;
  savedSourceDocumentLinked: boolean;
  sourceDocumentId?: string;
  status: DeepIntakeCandidateFamilySummaryStatus;
  traceabilitySummary: {
    downstreamFamiliesWithTrace: number;
    pageNumbersTrusted: false;
    sourceSectionsAndChunksLinkedToSavedSourceDocument: boolean;
    warning: string;
  };
  warnings: string[];
}

export const deepIntakeCandidateFamilySummaryPreviewNotice =
  "Candidate family summary preview only — no KnowledgeUnit, EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, WritingAngle, citation, APA, SourceCard, or Writer records are created.";

export const deepIntakeCandidateFamilySummaryNoAiNotice =
  "Deterministic no-AI readiness gate — no provider calls, no academic truth inference, and no citation finalization.";

export function createDeepIntakeCandidateFamilySummary(
  input: DeepIntakeCandidateFamilySummaryInput
): DeepIntakeCandidateFamilySummary {
  const sourceDocumentId =
    input.sourceDocumentId?.trim() ||
    input.runBundle?.sourceDocumentId ||
    input.sectionChunkSaveCandidate?.sourceDocumentId ||
    input.knowledgeUnitPreview?.sourceDocumentId ||
    input.evidenceCaseQuotePreview?.sourceDocumentId ||
    input.teachingWritingAnglePreview?.sourceDocumentId ||
    undefined;
  const savedSourceDocumentLinked = Boolean(sourceDocumentId);
  const blockers = uniqueList([
    ...(input.intakeReadiness?.blockers ?? []),
    ...(input.structurePreview?.blockers ?? []),
    ...(input.chunkingPreview?.blockers ?? []),
    ...(input.runBundle?.blockers ?? []),
    ...(input.sectionChunkSaveCandidate?.blockers ?? []),
    ...(input.knowledgeUnitPreview?.blockers ?? []),
    ...(input.evidenceCaseQuotePreview?.blockers ?? []),
    ...(input.teachingWritingAnglePreview?.blockers ?? [])
  ]);
  const warnings = uniqueList([
    ...(input.intakeReadiness?.warnings ?? []),
    ...(input.structurePreview?.warnings ?? []),
    ...(input.chunkingPreview?.warnings ?? []),
    ...(input.runBundle?.warnings ?? []),
    ...(input.sectionChunkSaveCandidate?.warnings ?? []),
    ...(input.knowledgeUnitPreview?.warnings ?? []),
    ...(input.evidenceCaseQuotePreview?.warnings ?? []),
    ...(input.teachingWritingAnglePreview?.warnings ?? []),
    "Page numbers are not trusted yet.",
    "No citation readiness or APA-final claim is created."
  ]);
  const familyRows: DeepIntakeCandidateFamilySummaryRow[] = [
    createSourceDocumentRow(input, savedSourceDocumentLinked),
    createSourceSectionRow(input, savedSourceDocumentLinked),
    createContentChunkRow(input, savedSourceDocumentLinked),
    createKnowledgeUnitRow(input),
    createEvidenceUnitRow(input),
    createCaseUnitRow(input),
    createQuoteUnitRow(input),
    createTeachingUnitRow(input),
    createWritingAngleRow(input)
  ];
  const status = createGateStatus({
    blockers,
    familyRows,
    savedSourceDocumentLinked,
    warnings
  });

  return {
    blockers,
    familyRows,
    nextRecommendedAction: createNextAction(status, savedSourceDocumentLinked, familyRows),
    noAiBoundaryNotice: deepIntakeCandidateFamilySummaryNoAiNotice,
    previewNotice: deepIntakeCandidateFamilySummaryPreviewNotice,
    readyFamilyCount: familyRows.filter(
      (family) => family.exists && family.trustState !== "red"
    ).length,
    savedSourceDocumentLinked,
    sourceDocumentId,
    status,
    traceabilitySummary: {
      downstreamFamiliesWithTrace: familyRows.filter(
        (family) =>
          !["SourceDocument", "SourceSection", "ContentChunk"].includes(family.familyName) &&
          family.traceability === "trace_references_available"
      ).length,
      pageNumbersTrusted: false,
      sourceSectionsAndChunksLinkedToSavedSourceDocument:
        savedSourceDocumentLinked &&
        familyRows.some((family) => family.familyName === "SourceSection" && family.exists) &&
        familyRows.some((family) => family.familyName === "ContentChunk" && family.exists),
      warning:
        "Trace references are preview/read-back signals only; page numbers and citation readiness claims are not trusted in this gate."
    },
    warnings
  };
}

function createSourceDocumentRow(
  input: DeepIntakeCandidateFamilySummaryInput,
  savedSourceDocumentLinked: boolean
): DeepIntakeCandidateFamilySummaryRow {
  const blocked =
    input.intakeReadiness?.status === "blocked" ||
    input.runBundle?.status === "blocked";
  return {
    candidateCount: savedSourceDocumentLinked ? 1 : 0,
    exists: savedSourceDocumentLinked,
    familyName: "SourceDocument",
    persistenceState: savedSourceDocumentLinked ? "saved" : blocked ? "blocked" : "preview_only",
    reviewStatus: savedSourceDocumentLinked ? "saved_source_document_available" : "source_document_save_required",
    traceability: savedSourceDocumentLinked ? "linked_to_saved_source_document" : blocked ? "blocked" : "missing_trace",
    trustState: blocked ? "red" : savedSourceDocumentLinked ? "green" : "orange"
  };
}

function createSourceSectionRow(
  input: DeepIntakeCandidateFamilySummaryInput,
  savedSourceDocumentLinked: boolean
): DeepIntakeCandidateFamilySummaryRow {
  const count =
    input.sectionChunkSaveCandidate?.sectionCount ??
    input.structurePreview?.sourceSectionCandidates.length ??
    0;
  return createSectionChunkRow({
    count,
    familyName: "SourceSection",
    ready: input.sectionChunkSaveCandidate?.status === "ready",
    savedSourceDocumentLinked
  });
}

function createContentChunkRow(
  input: DeepIntakeCandidateFamilySummaryInput,
  savedSourceDocumentLinked: boolean
): DeepIntakeCandidateFamilySummaryRow {
  const count =
    input.sectionChunkSaveCandidate?.chunkCount ??
    input.chunkingPreview?.chunkCandidates.length ??
    0;
  return createSectionChunkRow({
    count,
    familyName: "ContentChunk",
    ready: input.sectionChunkSaveCandidate?.status === "ready",
    savedSourceDocumentLinked
  });
}

function createSectionChunkRow(input: {
  count: number;
  familyName: "SourceSection" | "ContentChunk";
  ready: boolean;
  savedSourceDocumentLinked: boolean;
}): DeepIntakeCandidateFamilySummaryRow {
  const exists = input.count > 0;
  const blocked = !exists;
  return {
    candidateCount: input.count,
    exists,
    familyName: input.familyName,
    persistenceState: blocked ? "blocked" : input.savedSourceDocumentLinked ? "saved" : "preview_only",
    reviewStatus: input.ready ? "save_candidate_ready" : exists ? "needs_review" : "blocked",
    traceability: blocked
      ? "blocked"
      : input.savedSourceDocumentLinked
        ? "linked_to_saved_source_document"
        : "trace_references_available",
    trustState: blocked ? "red" : input.ready && input.savedSourceDocumentLinked ? "green" : "orange"
  };
}

function createKnowledgeUnitRow(
  input: DeepIntakeCandidateFamilySummaryInput
): DeepIntakeCandidateFamilySummaryRow {
  const preview = input.knowledgeUnitPreview;
  return createPreviewOnlyRow({
    count: preview?.estimatedKnowledgeUnitCount ?? 0,
    familyName: "KnowledgeUnit",
    status: preview?.status
  });
}

function createEvidenceUnitRow(
  input: DeepIntakeCandidateFamilySummaryInput
): DeepIntakeCandidateFamilySummaryRow {
  const preview = input.evidenceCaseQuotePreview;
  return createPreviewOnlyRow({
    count: preview?.estimatedEvidenceCount ?? 0,
    familyName: "EvidenceUnit",
    status: preview?.status
  });
}

function createCaseUnitRow(
  input: DeepIntakeCandidateFamilySummaryInput
): DeepIntakeCandidateFamilySummaryRow {
  const preview = input.evidenceCaseQuotePreview;
  return createPreviewOnlyRow({
    count: preview?.estimatedCaseCount ?? 0,
    familyName: "CaseUnit",
    status: preview?.status
  });
}

function createQuoteUnitRow(
  input: DeepIntakeCandidateFamilySummaryInput
): DeepIntakeCandidateFamilySummaryRow {
  const preview = input.evidenceCaseQuotePreview;
  return createPreviewOnlyRow({
    count: preview?.estimatedQuoteCount ?? 0,
    familyName: "QuoteUnit",
    status: preview?.status
  });
}

function createTeachingUnitRow(
  input: DeepIntakeCandidateFamilySummaryInput
): DeepIntakeCandidateFamilySummaryRow {
  const preview = input.teachingWritingAnglePreview;
  return createPreviewOnlyRow({
    count: preview?.estimatedTeachingUnitCount ?? 0,
    familyName: "TeachingUnit",
    status: preview?.status
  });
}

function createWritingAngleRow(
  input: DeepIntakeCandidateFamilySummaryInput
): DeepIntakeCandidateFamilySummaryRow {
  const preview = input.teachingWritingAnglePreview;
  return createPreviewOnlyRow({
    count: preview?.estimatedWritingAngleCount ?? 0,
    familyName: "WritingAngle",
    status: preview?.status
  });
}

function createPreviewOnlyRow(input: {
  count: number;
  familyName: DeepIntakeCandidateFamilySummaryFamilyName;
  status?: "available" | "limited" | "unavailable" | null;
}): DeepIntakeCandidateFamilySummaryRow {
  const exists = input.count > 0;
  const blocked = input.status === "unavailable" || !exists;
  return {
    candidateCount: input.count,
    exists,
    familyName: input.familyName,
    persistenceState: blocked ? "blocked" : "preview_only",
    reviewStatus: input.status ?? "unavailable",
    traceability: blocked ? "blocked" : "trace_references_available",
    trustState: blocked ? "red" : input.status === "available" ? "green" : "orange"
  };
}

function createGateStatus(input: {
  blockers: string[];
  familyRows: DeepIntakeCandidateFamilySummaryRow[];
  savedSourceDocumentLinked: boolean;
  warnings: string[];
}): DeepIntakeCandidateFamilySummaryStatus {
  if (
    input.blockers.some(isHardBlocker) ||
    input.familyRows.some((family) => family.familyName === "SourceDocument" && family.trustState === "red") ||
    input.familyRows.some((family) => family.familyName === "SourceSection" && family.trustState === "red") ||
    input.familyRows.some((family) => family.familyName === "ContentChunk" && family.trustState === "red")
  ) {
    return "blocked";
  }

  if (!input.savedSourceDocumentLinked || input.warnings.length > 0) {
    return "needs_review";
  }

  return "ready_for_next_step";
}

function createNextAction(
  status: DeepIntakeCandidateFamilySummaryStatus,
  savedSourceDocumentLinked: boolean,
  familyRows: DeepIntakeCandidateFamilySummaryRow[]
): string {
  if (status === "blocked") {
    return "Resolve source, structure, chunk, or trace blockers before using this candidate family summary.";
  }

  if (!savedSourceDocumentLinked) {
    return "Save the SourceDocument first, then review candidate family readiness again.";
  }

  const sourceSectionsReady = familyRows.some(
    (family) => family.familyName === "SourceSection" && family.exists
  );
  const contentChunksReady = familyRows.some(
    (family) => family.familyName === "ContentChunk" && family.exists
  );

  if (!sourceSectionsReady || !contentChunksReady) {
    return "Prepare SourceSection and ContentChunk candidates before the next Deep Intake step.";
  }

  if (status === "needs_review") {
    return "Review warnings and traceability before approving any next Deep Intake step.";
  }

  return "Ready for the next preview/review gate; downstream unit persistence remains blocked.";
}

function isHardBlocker(blocker: string): boolean {
  return [
    "candidate_blocked",
    "content_chunk_blocked_or_red",
    "duplicate_candidate_detected",
    "empty_file",
    "file_extension_mismatch",
    "missing_file_path",
    "source_trace_label_missing",
    "unsupported_file_type",
    "unreadable_file"
  ].includes(blocker);
}

function uniqueList(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}
