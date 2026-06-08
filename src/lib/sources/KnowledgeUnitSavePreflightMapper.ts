import type {
  KnowledgeUnitCandidatePreview,
  KnowledgeUnitCandidatePreviewCandidate,
  KnowledgeUnitCandidateLanguageProfile,
  KnowledgeUnitCandidateTrustState,
  KnowledgeUnitCandidateUnitType
} from "./KnowledgeUnitCandidatePreviewMapper";

export type KnowledgeUnitSavePreflightStatus =
  | "ready"
  | "needs_review"
  | "blocked";

export type KnowledgeUnitSavePreflightReviewStatus =
  | "approved"
  | "needs_review"
  | "blocked";

export interface KnowledgeUnitSavePreflightInput {
  approvedCandidateIds?: string[];
  apaFinalVerified?: boolean;
  citationReady?: boolean;
  explicitUserApproval?: boolean;
  knowledgeUnitPreview?: KnowledgeUnitCandidatePreview | null;
  rejectedCandidateIds?: string[];
  savedSourceDocumentId?: string | null;
}

export interface KnowledgeUnitSavePreflightCandidateRow {
  blockers: string[];
  body: string;
  contentChunkId?: string;
  id: string;
  language: KnowledgeUnitCandidateLanguageProfile;
  reviewStatus: KnowledgeUnitSavePreflightReviewStatus;
  sourceDocumentId?: string;
  sourceSectionId?: string;
  sourceTraceJson: string;
  status: KnowledgeUnitSavePreflightStatus;
  title: string;
  trustStatus: KnowledgeUnitCandidateTrustState;
  unitType: KnowledgeUnitCandidateUnitType;
  warnings: string[];
}

export interface KnowledgeUnitSavePreflightPreview {
  apaFinalBlocked: boolean;
  blockedCount: number;
  blockers: string[];
  candidateRows: KnowledgeUnitSavePreflightCandidateRow[];
  citationReadyBlocked: boolean;
  explicitApprovalRequired: boolean;
  needsReviewCount: number;
  previewNotice: string;
  readyCount: number;
  recommendedNextAction: string;
  savedSourceDocumentLinked: boolean;
  sourceDocumentId?: string;
  status: KnowledgeUnitSavePreflightStatus;
  topBlockers: string[];
  totalCandidateCount: number;
  warnings: string[];
}

export const knowledgeUnitSavePreflightPreviewNotice =
  "Preview only — KnowledgeUnits are not saved from this panel.";

export function createKnowledgeUnitSavePreflightPreview(
  input: KnowledgeUnitSavePreflightInput
): KnowledgeUnitSavePreflightPreview {
  const preview = input.knowledgeUnitPreview ?? null;
  const savedSourceDocumentId = input.savedSourceDocumentId?.trim() || undefined;
  const sourceDocumentId = savedSourceDocumentId || preview?.sourceDocumentId || undefined;
  const savedSourceDocumentLinked = Boolean(savedSourceDocumentId);
  const citationReadyBlocked = input.citationReady === true;
  const apaFinalBlocked = input.apaFinalVerified === true;
  const approvedCandidateIds = new Set(input.approvedCandidateIds ?? []);
  const rejectedCandidateIds = new Set(input.rejectedCandidateIds ?? []);
  const hasExplicitApproval =
    input.explicitUserApproval === true || approvedCandidateIds.size > 0;
  const rootBlockers = createRootBlockers({
    apaFinalBlocked,
    citationReadyBlocked,
    preview,
    savedSourceDocumentLinked
  });
  const rows = (preview?.candidates ?? []).map((candidate) =>
    createCandidateRow({
      apaFinalBlocked,
      candidate,
      citationReadyBlocked,
      explicitUserApproval:
        input.explicitUserApproval === true || approvedCandidateIds.has(candidate.id),
      previewLanguage: preview?.languageProfile ?? "unknown",
      rejectedByUser: rejectedCandidateIds.has(candidate.id),
      savedSourceDocumentLinked,
      sourceDocumentId
    })
  );
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const needsReviewCount = rows.filter((row) => row.status === "needs_review").length;
  const status = createOverallStatus({
    blockedCount,
    readyCount,
    rowCount: rows.length,
    rootBlockers
  });
  const warnings = uniqueList([
    ...(preview?.warnings ?? []),
    ...rows.flatMap((row) => row.warnings)
  ]);
  const blockers = uniqueList([
    ...rootBlockers,
    ...(preview?.blockers ?? []),
    ...rows.flatMap((row) => row.blockers)
  ]);

  return {
    apaFinalBlocked,
    blockedCount,
    blockers,
    candidateRows: rows,
    citationReadyBlocked,
    explicitApprovalRequired: true,
    needsReviewCount,
    previewNotice: knowledgeUnitSavePreflightPreviewNotice,
    readyCount,
    recommendedNextAction: createRecommendedNextAction(status, {
      explicitUserApproval: hasExplicitApproval,
      rowCount: rows.length,
      savedSourceDocumentLinked
    }),
    savedSourceDocumentLinked,
    sourceDocumentId,
    status,
    topBlockers: blockers.slice(0, 4),
    totalCandidateCount: rows.length,
    warnings
  };
}

function createCandidateRow({
  apaFinalBlocked,
  candidate,
  citationReadyBlocked,
  explicitUserApproval,
  previewLanguage,
  rejectedByUser,
  savedSourceDocumentLinked,
  sourceDocumentId
}: {
  apaFinalBlocked: boolean;
  candidate: KnowledgeUnitCandidatePreviewCandidate;
  citationReadyBlocked: boolean;
  explicitUserApproval: boolean;
  previewLanguage: KnowledgeUnitCandidateLanguageProfile;
  rejectedByUser: boolean;
  savedSourceDocumentLinked: boolean;
  sourceDocumentId?: string;
}): KnowledgeUnitSavePreflightCandidateRow {
  const body = candidate.previewSummary.trim();
  const title = candidate.title.trim();
  const language = candidate.languageProfile || previewLanguage || "unknown";
  const sourceTraceJson = createSourceTraceJson(candidate, sourceDocumentId);
  const blockers = uniqueList([
    ...candidate.blockers,
    !savedSourceDocumentLinked ? "saved_source_document_required" : "",
    !candidate.id.trim() ? "knowledge_unit_candidate_id_required" : "",
    !title ? "knowledge_unit_title_required" : "",
    !body ? "knowledge_unit_body_required" : "",
    !candidate.sourceTraceLabel.trim() ? "knowledge_unit_source_trace_required" : "",
    rejectedByUser ? "knowledge_unit_candidate_rejected_by_user" : "",
    candidate.trustState === "red" ? "red_trust_candidate_blocked" : "",
    citationReadyBlocked ? "citation_ready_claims_rejected" : "",
    apaFinalBlocked ? "apa_final_claims_rejected" : ""
  ]);
  const warnings = uniqueList([
    ...candidate.warnings,
    !explicitUserApproval ? "explicit_human_approval_required_before_save" : "",
    language === "unknown" ? "language_unknown_review_required" : "",
    candidate.trustState === "orange" ? "orange_trust_candidate_needs_review" : ""
  ]);
  const status: KnowledgeUnitSavePreflightStatus =
    blockers.length > 0
      ? "blocked"
      : explicitUserApproval
        ? "ready"
        : warnings.length > 0
          ? "needs_review"
          : "ready";
  const reviewStatus: KnowledgeUnitSavePreflightReviewStatus =
    status === "blocked" ? "blocked" : status === "ready" ? "approved" : "needs_review";

  return {
    blockers,
    body,
    contentChunkId: candidate.contentChunkId,
    id: candidate.id,
    language,
    reviewStatus,
    sourceDocumentId,
    sourceSectionId: candidate.sourceSectionId,
    sourceTraceJson,
    status,
    title,
    trustStatus: candidate.trustState,
    unitType: candidate.unitType,
    warnings
  };
}

function createRootBlockers({
  apaFinalBlocked,
  citationReadyBlocked,
  preview,
  savedSourceDocumentLinked
}: {
  apaFinalBlocked: boolean;
  citationReadyBlocked: boolean;
  preview: KnowledgeUnitCandidatePreview | null;
  savedSourceDocumentLinked: boolean;
}): string[] {
  return uniqueList([
    !preview ? "knowledge_unit_candidate_preview_required" : "",
    preview && preview.candidates.length === 0 ? "knowledge_unit_candidates_required" : "",
    !savedSourceDocumentLinked ? "saved_source_document_required" : "",
    citationReadyBlocked ? "citation_ready_claims_rejected" : "",
    apaFinalBlocked ? "apa_final_claims_rejected" : ""
  ]);
}

function createOverallStatus({
  blockedCount,
  readyCount,
  rootBlockers,
  rowCount
}: {
  blockedCount: number;
  readyCount: number;
  rootBlockers: string[];
  rowCount: number;
}): KnowledgeUnitSavePreflightStatus {
  if (rowCount === 0 || rootBlockers.length > 0 || blockedCount === rowCount) {
    return "blocked";
  }

  if (readyCount > 0) {
    return "ready";
  }

  return "needs_review";
}

function createRecommendedNextAction(
  status: KnowledgeUnitSavePreflightStatus,
  context: {
    explicitUserApproval: boolean;
    rowCount: number;
    savedSourceDocumentLinked: boolean;
  }
): string {
  if (!context.savedSourceDocumentLinked) {
    return "Save the SourceDocument first, then rerun KnowledgeUnit save preflight.";
  }

  if (context.rowCount === 0) {
    return "Create traceable KnowledgeUnit candidates from ContentChunks before save preflight.";
  }

  if (status === "blocked") {
    return "Resolve candidate blockers before any future KnowledgeUnit save can be enabled.";
  }

  if (!context.explicitUserApproval) {
    return "Review candidate rows and require explicit human approval in a future save gate.";
  }

  return "Candidates pass preflight, but this panel remains preview-only until a later save UI sprint.";
}

function createSourceTraceJson(
  candidate: KnowledgeUnitCandidatePreviewCandidate,
  sourceDocumentId?: string
): string {
  if (!candidate.sourceTraceLabel.trim()) {
    return "";
  }

  return JSON.stringify({
    contentChunkId: candidate.contentChunkId ?? null,
    sourceDocumentId: sourceDocumentId ?? candidate.sourceDocumentId ?? null,
    sourceSectionId: candidate.sourceSectionId ?? null,
    traceLabel: candidate.sourceTraceLabel,
    traceSource: "knowledge_unit_candidate_preview"
  });
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
