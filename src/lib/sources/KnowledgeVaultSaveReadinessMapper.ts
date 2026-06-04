import type {
  ParsedDocxKnowledgeVaultCandidatePreview,
  ParsedDocxKnowledgeVaultUse
} from "./ParsedDocxKnowledgeVaultCandidateMapper";
import type {
  ParsedDocxKnowledgeVaultReviewBasketPreview
} from "./ParsedDocxKnowledgeVaultReviewBasketMapper";
import type {
  ParsedDocxTextbookRequestSeedPreview
} from "./ParsedDocxTextbookRequestSeedMapper";

export type KnowledgeVaultSaveReadinessStatus =
  | "not_started"
  | "needs_candidates"
  | "needs_human_review"
  | "ready_for_future_explicit_save"
  | "blocked";

export type KnowledgeVaultFutureSaveTarget =
  | "marketing_tag"
  | "knowledge_card"
  | "source_card_linked_record"
  | "draft_input_package";

export type KnowledgeVaultSaveReadinessNextAction =
  | "review candidates"
  | "complete human review"
  | "save SourceDocument first"
  | "save SourceCard first"
  | "future explicit save boundary required";

export interface KnowledgeVaultSaveReadinessSummary {
  blockedCandidates: number;
  highPriorityReviewItems: number;
  reviewableCandidates: number;
  suggestedRecordTypes: KnowledgeVaultFutureSaveTarget[];
  totalCandidates: number;
}

export interface KnowledgeVaultSaveReadiness {
  blockers: string[];
  nextAction: KnowledgeVaultSaveReadinessNextAction;
  possibleFutureSaveTargets: KnowledgeVaultFutureSaveTarget[];
  readinessSummary: KnowledgeVaultSaveReadinessSummary;
  status: KnowledgeVaultSaveReadinessStatus;
  warnings: string[];
}

export function createKnowledgeVaultSaveReadiness({
  candidatePreview,
  hasParsedDocx,
  hasSavedSourceCard,
  hasSavedSourceDocument,
  reviewBasket,
  textbookSeed
}: {
  candidatePreview?: ParsedDocxKnowledgeVaultCandidatePreview | null;
  hasParsedDocx: boolean;
  hasSavedSourceCard: boolean;
  hasSavedSourceDocument: boolean;
  reviewBasket?: ParsedDocxKnowledgeVaultReviewBasketPreview | null;
  textbookSeed?: ParsedDocxTextbookRequestSeedPreview | null;
}): KnowledgeVaultSaveReadiness {
  const totalCandidates = candidatePreview?.candidateRecords.length ?? 0;
  const reviewableCandidates =
    reviewBasket?.selectedOrRecommendedCandidates.length ?? 0;
  const possibleFutureSaveTargets = createFutureSaveTargets({
    candidatePreview,
    reviewBasket,
    textbookSeed
  });
  const readinessSummary: KnowledgeVaultSaveReadinessSummary = {
    blockedCandidates: Math.max(totalCandidates - reviewableCandidates, 0),
    highPriorityReviewItems:
      reviewBasket?.selectedOrRecommendedCandidates.filter(
        (item) => item.reviewPriority === "high"
      ).length ?? 0,
    reviewableCandidates,
    suggestedRecordTypes: possibleFutureSaveTargets,
    totalCandidates
  };
  const blockers = createBlockers({
    candidatePreview,
    hasParsedDocx,
    hasSavedSourceCard,
    hasSavedSourceDocument,
    reviewBasket
  });

  if (!hasParsedDocx) {
    return {
      blockers,
      nextAction: "review candidates",
      possibleFutureSaveTargets,
      readinessSummary,
      status: "not_started",
      warnings: createWarnings()
    };
  }

  if (!candidatePreview || candidatePreview.status !== "candidate_ready") {
    return {
      blockers,
      nextAction: "review candidates",
      possibleFutureSaveTargets,
      readinessSummary,
      status: "needs_candidates",
      warnings: createWarnings()
    };
  }

  if (reviewableCandidates === 0) {
    return {
      blockers,
      nextAction: "review candidates",
      possibleFutureSaveTargets,
      readinessSummary,
      status: "blocked",
      warnings: createWarnings()
    };
  }

  if (!hasSavedSourceDocument) {
    return {
      blockers,
      nextAction: "save SourceDocument first",
      possibleFutureSaveTargets,
      readinessSummary,
      status: "needs_human_review",
      warnings: createWarnings()
    };
  }

  if (!hasSavedSourceCard) {
    return {
      blockers,
      nextAction: "save SourceCard first",
      possibleFutureSaveTargets,
      readinessSummary,
      status: "needs_human_review",
      warnings: createWarnings()
    };
  }

  return {
    blockers,
    nextAction:
      blockers.length > 0
        ? "complete human review"
        : "future explicit save boundary required",
    possibleFutureSaveTargets,
    readinessSummary,
    status:
      blockers.length > 0
        ? "needs_human_review"
        : "ready_for_future_explicit_save",
    warnings: createWarnings()
  };
}

function createFutureSaveTargets({
  candidatePreview,
  reviewBasket,
  textbookSeed
}: {
  candidatePreview?: ParsedDocxKnowledgeVaultCandidatePreview | null;
  reviewBasket?: ParsedDocxKnowledgeVaultReviewBasketPreview | null;
  textbookSeed?: ParsedDocxTextbookRequestSeedPreview | null;
}): KnowledgeVaultFutureSaveTarget[] {
  const targets = new Set<KnowledgeVaultFutureSaveTarget>();
  const uses: ParsedDocxKnowledgeVaultUse[] =
    candidatePreview?.candidateRecords.flatMap((candidate) => candidate.suggestedVaultUse) ??
    [];

  if (uses.length > 0) {
    targets.add("marketing_tag");
    targets.add("source_card_linked_record");
  }

  if (
    uses.some((use) =>
      ["concept_record", "evidence_record", "teaching_case_record"].includes(use)
    )
  ) {
    targets.add("knowledge_card");
  }

  if (
    uses.includes("textbook_section_input") ||
    (textbookSeed?.status === "seed_ready" &&
      (reviewBasket?.basketSummary.recommendedForReview ?? 0) > 0)
  ) {
    targets.add("draft_input_package");
  }

  return Array.from(targets);
}

function createBlockers({
  candidatePreview,
  hasParsedDocx,
  hasSavedSourceCard,
  hasSavedSourceDocument,
  reviewBasket
}: {
  candidatePreview?: ParsedDocxKnowledgeVaultCandidatePreview | null;
  hasParsedDocx: boolean;
  hasSavedSourceCard: boolean;
  hasSavedSourceDocument: boolean;
  reviewBasket?: ParsedDocxKnowledgeVaultReviewBasketPreview | null;
}): string[] {
  const blockers: string[] = [];

  if (!hasParsedDocx) {
    blockers.push("no parsed DOCX");
  }

  if (!candidatePreview || candidatePreview.status === "not_started") {
    blockers.push("no classification preview");
  }

  if (candidatePreview && candidatePreview.status !== "candidate_ready") {
    blockers.push("no Knowledge Vault candidates");
  }

  if ((reviewBasket?.selectedOrRecommendedCandidates.length ?? 0) === 0) {
    blockers.push("no human review");
  } else {
    blockers.push("human review required");
  }

  if (!hasSavedSourceDocument) {
    blockers.push("no saved SourceDocument");
  }

  if (!hasSavedSourceCard) {
    blockers.push("no saved SourceCard");
  }

  if (
    candidatePreview?.candidateRecords.some(
      (candidate) => candidate.confidence === "low"
    )
  ) {
    blockers.push("insufficient evidence");
  }

  return Array.from(new Set(blockers));
}

function createWarnings(): string[] {
  return [
    "Preview only - Knowledge Vault save readiness is not saved.",
    "Not saved - no automatic tag or KnowledgeCard persistence is performed.",
    "Human review required before any future explicit save.",
    "No automatic vault write is performed.",
    "No citation finality is implied.",
    "No APA-final verification is supported."
  ];
}
