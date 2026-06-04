import type {
  KnowledgeVaultSaveReadiness
} from "./KnowledgeVaultSaveReadinessMapper";
import type {
  ParsedDocxKnowledgeVaultCandidatePreview,
  ParsedDocxKnowledgeVaultCandidateRecord,
  ParsedDocxKnowledgeVaultUse
} from "./ParsedDocxKnowledgeVaultCandidateMapper";

export type KnowledgeVaultCandidateLocalReviewState =
  | "not_reviewed"
  | "selected_for_review"
  | "approved_for_future_save"
  | "rejected"
  | "needs_more_evidence";

export type KnowledgeVaultSaveCandidateMappingStatus =
  | "not_started"
  | "needs_review"
  | "needs_saved_source_links"
  | "mapping_ready"
  | "blocked";

export type KnowledgeVaultSaveCandidateNextAction =
  | "review candidates"
  | "approve candidates for future save"
  | "save SourceDocument first"
  | "save SourceCard first"
  | "future explicit save command required";

export interface KnowledgeVaultMarketingTagSaveCandidate {
  candidateId: string;
  confidence: ParsedDocxKnowledgeVaultCandidateRecord["confidence"];
  persistenceStatus: "preview_only";
  reason: string;
  reviewState: KnowledgeVaultCandidateLocalReviewState;
  sourceCandidateId: string;
  tagGroup: string;
  tagLabel: string;
}

export interface KnowledgeVaultKnowledgeCardSaveCandidate {
  candidateId: string;
  cardType: "concept" | "evidence" | "teaching_case" | "textbook_section_input";
  conceptLabel: string;
  evidenceReadiness: "strong" | "partial" | "weak";
  linkedTagLabels: string[];
  persistenceStatus: "preview_only";
  reason: string;
  reviewState: KnowledgeVaultCandidateLocalReviewState;
  sourceCandidateId: string;
}

export interface KnowledgeVaultSaveCandidateMapping {
  blockers: string[];
  knowledgeCardCandidates: KnowledgeVaultKnowledgeCardSaveCandidate[];
  marketingTagCandidates: KnowledgeVaultMarketingTagSaveCandidate[];
  nextAction: KnowledgeVaultSaveCandidateNextAction;
  status: KnowledgeVaultSaveCandidateMappingStatus;
  warnings: string[];
}

export function createKnowledgeVaultSaveCandidateMapping({
  candidatePreview,
  hasSavedSourceCard,
  hasSavedSourceDocument,
  reviewStates,
  saveReadiness
}: {
  candidatePreview?: ParsedDocxKnowledgeVaultCandidatePreview | null;
  hasSavedSourceCard: boolean;
  hasSavedSourceDocument: boolean;
  reviewStates: Record<string, KnowledgeVaultCandidateLocalReviewState>;
  saveReadiness?: KnowledgeVaultSaveReadiness | null;
}): KnowledgeVaultSaveCandidateMapping {
  const candidates =
    candidatePreview?.status === "candidate_ready"
      ? candidatePreview.candidateRecords
      : [];
  const reviewedCandidates = candidates.filter((candidate) =>
    isReviewedState(getReviewState({ candidate, reviewStates }))
  );
  const approvedCandidates = candidates.filter(
    (candidate) =>
      getReviewState({ candidate, reviewStates }) === "approved_for_future_save"
  );
  const marketingTagCandidates = approvedCandidates.map(mapMarketingTagCandidate);
  const knowledgeCardCandidates = approvedCandidates.flatMap(mapKnowledgeCardCandidates);
  const blockers = createBlockers({
    approvedCandidates,
    candidatePreview,
    candidates,
    hasSavedSourceCard,
    hasSavedSourceDocument,
    reviewedCandidates,
    reviewStates
  });

  if (!candidatePreview || candidatePreview.status === "not_started") {
    return {
      blockers,
      knowledgeCardCandidates,
      marketingTagCandidates,
      nextAction: "review candidates",
      status: "not_started",
      warnings: createWarnings()
    };
  }

  if (candidatePreview.status !== "candidate_ready" || candidates.length === 0) {
    return {
      blockers,
      knowledgeCardCandidates,
      marketingTagCandidates,
      nextAction: "review candidates",
      status: "blocked",
      warnings: createWarnings()
    };
  }

  if (reviewedCandidates.length === 0) {
    return {
      blockers,
      knowledgeCardCandidates,
      marketingTagCandidates,
      nextAction: "review candidates",
      status: "needs_review",
      warnings: createWarnings()
    };
  }

  if (approvedCandidates.length === 0) {
    return {
      blockers,
      knowledgeCardCandidates,
      marketingTagCandidates,
      nextAction: "approve candidates for future save",
      status: "needs_review",
      warnings: createWarnings()
    };
  }

  if (!hasSavedSourceDocument) {
    return {
      blockers,
      knowledgeCardCandidates,
      marketingTagCandidates,
      nextAction: "save SourceDocument first",
      status: "needs_saved_source_links",
      warnings: createWarnings()
    };
  }

  if (!hasSavedSourceCard) {
    return {
      blockers,
      knowledgeCardCandidates,
      marketingTagCandidates,
      nextAction: "save SourceCard first",
      status: "needs_saved_source_links",
      warnings: createWarnings()
    };
  }

  return {
    blockers,
    knowledgeCardCandidates,
    marketingTagCandidates,
    nextAction:
      saveReadiness?.status === "ready_for_future_explicit_save"
        ? "future explicit save command required"
        : "approve candidates for future save",
    status: "mapping_ready",
    warnings: createWarnings()
  };
}

function getReviewState({
  candidate,
  reviewStates
}: {
  candidate: ParsedDocxKnowledgeVaultCandidateRecord;
  reviewStates: Record<string, KnowledgeVaultCandidateLocalReviewState>;
}): KnowledgeVaultCandidateLocalReviewState {
  return reviewStates[candidate.candidateId] ?? "not_reviewed";
}

function isReviewedState(state: KnowledgeVaultCandidateLocalReviewState): boolean {
  return state !== "not_reviewed";
}

function mapMarketingTagCandidate(
  candidate: ParsedDocxKnowledgeVaultCandidateRecord
): KnowledgeVaultMarketingTagSaveCandidate {
  return {
    candidateId: `marketing-tag-save-candidate-${candidate.candidateId}`,
    confidence: candidate.confidence,
    persistenceStatus: "preview_only",
    reason:
      "Reviewed locally as a future MarketingTag save candidate; no save command is called.",
    reviewState: "approved_for_future_save",
    sourceCandidateId: candidate.candidateId,
    tagGroup: candidate.tagGroup,
    tagLabel: candidate.tagLabel
  };
}

function mapKnowledgeCardCandidates(
  candidate: ParsedDocxKnowledgeVaultCandidateRecord
): KnowledgeVaultKnowledgeCardSaveCandidate[] {
  return candidate.suggestedVaultUse.map((use) => ({
    candidateId: `knowledge-card-save-candidate-${candidate.candidateId}-${use}`,
    cardType: mapVaultUseToCardType(use),
    conceptLabel: candidate.tagLabel,
    evidenceReadiness: mapEvidenceReadiness(candidate),
    linkedTagLabels: [candidate.tagLabel],
    persistenceStatus: "preview_only",
    reason: createKnowledgeCardReason({ candidate, use }),
    reviewState: "approved_for_future_save",
    sourceCandidateId: candidate.candidateId
  }));
}

function mapVaultUseToCardType(
  use: ParsedDocxKnowledgeVaultUse
): KnowledgeVaultKnowledgeCardSaveCandidate["cardType"] {
  if (use === "teaching_case_record") {
    return "teaching_case";
  }

  if (use === "evidence_record") {
    return "evidence";
  }

  if (use === "textbook_section_input") {
    return "textbook_section_input";
  }

  return "concept";
}

function mapEvidenceReadiness(
  candidate: ParsedDocxKnowledgeVaultCandidateRecord
): KnowledgeVaultKnowledgeCardSaveCandidate["evidenceReadiness"] {
  if (candidate.confidence === "high" && candidate.linkedSignals.length >= 3) {
    return "strong";
  }

  if (candidate.confidence === "low") {
    return "weak";
  }

  return "partial";
}

function createKnowledgeCardReason({
  candidate,
  use
}: {
  candidate: ParsedDocxKnowledgeVaultCandidateRecord;
  use: ParsedDocxKnowledgeVaultUse;
}): string {
  return `Future KnowledgeCard mapping preview for ${use.replace(
    /_/g,
    " "
  )}; requires saved source links and explicit human save. Confidence: ${
    candidate.confidence
  }.`;
}

function createBlockers({
  approvedCandidates,
  candidatePreview,
  candidates,
  hasSavedSourceCard,
  hasSavedSourceDocument,
  reviewedCandidates,
  reviewStates
}: {
  approvedCandidates: ParsedDocxKnowledgeVaultCandidateRecord[];
  candidatePreview?: ParsedDocxKnowledgeVaultCandidatePreview | null;
  candidates: ParsedDocxKnowledgeVaultCandidateRecord[];
  hasSavedSourceCard: boolean;
  hasSavedSourceDocument: boolean;
  reviewedCandidates: ParsedDocxKnowledgeVaultCandidateRecord[];
  reviewStates: Record<string, KnowledgeVaultCandidateLocalReviewState>;
}): string[] {
  const blockers: string[] = [];

  if (!candidatePreview || candidatePreview.status === "not_started") {
    blockers.push("no Knowledge Vault candidates");
  }

  if (candidatePreview && candidatePreview.status !== "candidate_ready") {
    blockers.push("no reviewed candidates");
  }

  if (candidates.length > 0 && reviewedCandidates.length === 0) {
    blockers.push("no reviewed candidates");
  }

  if (reviewedCandidates.length > 0 && approvedCandidates.length === 0) {
    blockers.push("no approved future-save candidates");
  }

  if (!hasSavedSourceDocument) {
    blockers.push("missing saved SourceDocument");
  }

  if (!hasSavedSourceCard) {
    blockers.push("missing saved SourceCard");
  }

  if (candidates.some((candidate) => candidate.confidence === "low")) {
    blockers.push("insufficient evidence");
  }

  if (
    Object.values(reviewStates).some((state) => state === "needs_more_evidence")
  ) {
    blockers.push("needs more evidence");
  }

  if (Object.values(reviewStates).some((state) => state === "rejected")) {
    blockers.push("rejected candidate");
  }

  return Array.from(new Set(blockers));
}

function createWarnings(): string[] {
  return [
    "Preview only - save candidates are not saved.",
    "Not saved - this mapper does not call MarketingTag or KnowledgeCard persistence.",
    "Local review only - review state is frontend-only and non-persistent.",
    "Human review required before any explicit future save.",
    "No automatic write is performed.",
    "No citation finality is implied."
  ];
}
