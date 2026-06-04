import type {
  ParsedDocxKnowledgeVaultCandidatePreview,
  ParsedDocxKnowledgeVaultCandidateRecord,
  ParsedDocxKnowledgeVaultUse
} from "./ParsedDocxKnowledgeVaultCandidateMapper";

export type ParsedDocxKnowledgeVaultReviewBasketStatus =
  | "not_started"
  | "needs_candidates"
  | "review_basket_ready"
  | "blocked";

export type ParsedDocxKnowledgeVaultReviewPriority = "high" | "medium" | "low";

export interface ParsedDocxKnowledgeVaultReviewBasketItem {
  candidateId: string;
  confidence: ParsedDocxKnowledgeVaultCandidateRecord["confidence"];
  persistenceStatus: "preview_only";
  reason: string;
  reviewPriority: ParsedDocxKnowledgeVaultReviewPriority;
  reviewRequired: true;
  suggestedVaultUse: ParsedDocxKnowledgeVaultUse[];
  tagLabel: string;
}

export interface ParsedDocxKnowledgeVaultReviewBasketSummary {
  conceptRecords: number;
  evidenceRecords: number;
  recommendedForReview: number;
  teachingCaseRecords: number;
  textbookSectionInputs: number;
  totalCandidates: number;
}

export interface ParsedDocxKnowledgeVaultReviewBasketPreview {
  basketSummary: ParsedDocxKnowledgeVaultReviewBasketSummary;
  blockers: string[];
  selectedOrRecommendedCandidates: ParsedDocxKnowledgeVaultReviewBasketItem[];
  status: ParsedDocxKnowledgeVaultReviewBasketStatus;
  warnings: string[];
}

const maxBasketItems = 6;

export function createParsedDocxKnowledgeVaultReviewBasket({
  candidatePreview
}: {
  candidatePreview?: ParsedDocxKnowledgeVaultCandidatePreview | null;
}): ParsedDocxKnowledgeVaultReviewBasketPreview {
  if (!candidatePreview || candidatePreview.status === "not_started") {
    return createBlockedBasket({
      blockers: ["No classification preview is available for a Knowledge Vault review basket."],
      status: "not_started",
      totalCandidates: 0
    });
  }

  if (candidatePreview.status !== "candidate_ready") {
    return createBlockedBasket({
      blockers: [
        candidatePreview.blockers[0] ??
          "Knowledge Vault candidates are required before a review basket can be previewed."
      ],
      status: "needs_candidates",
      totalCandidates: candidatePreview.candidateRecords.length
    });
  }

  const reviewableCandidates = candidatePreview.candidateRecords;

  if (reviewableCandidates.length === 0) {
    return createBlockedBasket({
      blockers: ["Insufficient reviewable candidates for a Knowledge Vault basket."],
      status: "blocked",
      totalCandidates: 0
    });
  }

  const selectedOrRecommendedCandidates = reviewableCandidates
    .map(mapCandidateToBasketItem)
    .sort(
      (left, right) =>
        priorityRank(right.reviewPriority) - priorityRank(left.reviewPriority)
    )
    .slice(0, maxBasketItems);

  return {
    basketSummary: createBasketSummary({
      candidates: reviewableCandidates,
      selectedOrRecommendedCandidates
    }),
    blockers: [],
    selectedOrRecommendedCandidates,
    status: "review_basket_ready",
    warnings: createWarnings({ selectedOrRecommendedCandidates })
  };
}

function mapCandidateToBasketItem(
  candidate: ParsedDocxKnowledgeVaultCandidateRecord
): ParsedDocxKnowledgeVaultReviewBasketItem {
  const reviewPriority = getReviewPriority(candidate);

  return {
    candidateId: candidate.candidateId,
    confidence: candidate.confidence,
    persistenceStatus: "preview_only",
    reason: createReason({ candidate, reviewPriority }),
    reviewPriority,
    reviewRequired: true,
    suggestedVaultUse: candidate.suggestedVaultUse,
    tagLabel: candidate.tagLabel
  };
}

function getReviewPriority(
  candidate: ParsedDocxKnowledgeVaultCandidateRecord
): ParsedDocxKnowledgeVaultReviewPriority {
  if (
    candidate.confidence === "high" &&
    candidate.suggestedVaultUse.includes("textbook_section_input")
  ) {
    return "high";
  }

  if (
    candidate.confidence === "medium" ||
    candidate.suggestedVaultUse.includes("concept_record") ||
    candidate.suggestedVaultUse.includes("textbook_section_input")
  ) {
    return "medium";
  }

  return "low";
}

function createReason({
  candidate,
  reviewPriority
}: {
  candidate: ParsedDocxKnowledgeVaultCandidateRecord;
  reviewPriority: ParsedDocxKnowledgeVaultReviewPriority;
}): string {
  if (reviewPriority === "high") {
    return "Recommended for early human review because it has strong concept and textbook-section signals.";
  }

  if (reviewPriority === "medium") {
    return "Recommended as a review basket item, but still requires human judgment before any vault use.";
  }

  return "Lower priority; keep visible for human tag review without promoting it.";
}

function createBasketSummary({
  candidates,
  selectedOrRecommendedCandidates
}: {
  candidates: ParsedDocxKnowledgeVaultCandidateRecord[];
  selectedOrRecommendedCandidates: ParsedDocxKnowledgeVaultReviewBasketItem[];
}): ParsedDocxKnowledgeVaultReviewBasketSummary {
  return {
    conceptRecords: countUse(candidates, "concept_record"),
    evidenceRecords: countUse(candidates, "evidence_record"),
    recommendedForReview: selectedOrRecommendedCandidates.length,
    teachingCaseRecords: countUse(candidates, "teaching_case_record"),
    textbookSectionInputs: countUse(candidates, "textbook_section_input"),
    totalCandidates: candidates.length
  };
}

function createBlockedBasket({
  blockers,
  status,
  totalCandidates
}: {
  blockers: string[];
  status: ParsedDocxKnowledgeVaultReviewBasketStatus;
  totalCandidates: number;
}): ParsedDocxKnowledgeVaultReviewBasketPreview {
  return {
    basketSummary: {
      conceptRecords: 0,
      evidenceRecords: 0,
      recommendedForReview: 0,
      teachingCaseRecords: 0,
      textbookSectionInputs: 0,
      totalCandidates
    },
    blockers,
    selectedOrRecommendedCandidates: [],
    status,
    warnings: createWarnings({ selectedOrRecommendedCandidates: [] })
  };
}

function createWarnings({
  selectedOrRecommendedCandidates
}: {
  selectedOrRecommendedCandidates: ParsedDocxKnowledgeVaultReviewBasketItem[];
}): string[] {
  const warnings = [
    "Preview only - review basket is not saved.",
    "Human review is required before Knowledge Vault use.",
    "No automatic Knowledge Vault write is performed.",
    "No citation finality is implied."
  ];

  if (selectedOrRecommendedCandidates.length === 0) {
    warnings.push("No review basket items are available until candidates exist.");
  }

  if (selectedOrRecommendedCandidates.some((item) => item.reviewPriority === "low")) {
    warnings.push("Low-priority items remain needs-review only.");
  }

  return warnings;
}

function countUse(
  candidates: ParsedDocxKnowledgeVaultCandidateRecord[],
  use: ParsedDocxKnowledgeVaultUse
): number {
  return candidates.filter((candidate) => candidate.suggestedVaultUse.includes(use))
    .length;
}

function priorityRank(priority: ParsedDocxKnowledgeVaultReviewPriority): number {
  if (priority === "high") {
    return 3;
  }

  if (priority === "medium") {
    return 2;
  }

  return 1;
}
