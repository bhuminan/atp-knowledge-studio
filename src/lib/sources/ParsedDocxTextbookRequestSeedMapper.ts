import type { ParsedDocxClassificationPreview } from "./ParsedDocxClassificationPreviewMapper";
import type {
  ParsedDocxKnowledgeVaultReviewBasketItem,
  ParsedDocxKnowledgeVaultReviewBasketPreview
} from "./ParsedDocxKnowledgeVaultReviewBasketMapper";

export type ParsedDocxTextbookRequestSeedStatus =
  | "not_started"
  | "needs_review_basket"
  | "seed_ready"
  | "blocked";

export type ParsedDocxTextbookEvidenceReadiness = "strong" | "partial" | "weak";

export type ParsedDocxTextbookSuggestedAudience =
  | "instructor"
  | "textbook_writer"
  | "student"
  | "unknown";

export type ParsedDocxTextbookSuggestedOutputType =
  | "chapter_outline"
  | "section_brief"
  | "literature_review_seed"
  | "unknown";

export type ParsedDocxTextbookRequestReadiness =
  | "ready_for_human_request_review"
  | "needs_more_sources"
  | "blocked";

export interface ParsedDocxTextbookTopicSeed {
  evidenceReadiness: ParsedDocxTextbookEvidenceReadiness;
  possibleChapterUse: string;
  reason: string;
  supportingCandidateIds: string[];
  supportingTags: string[];
  topicLabel: string;
}

export interface ParsedDocxTextbookRequestSeed {
  readiness: ParsedDocxTextbookRequestReadiness;
  suggestedAudience: ParsedDocxTextbookSuggestedAudience;
  suggestedOutputType: ParsedDocxTextbookSuggestedOutputType;
  suggestedRequestTitle: string;
}

export interface ParsedDocxTextbookRequestSeedPreview {
  blockers: string[];
  missingEvidence: string[];
  requestSeed: ParsedDocxTextbookRequestSeed;
  status: ParsedDocxTextbookRequestSeedStatus;
  suggestedTextbookTopics: ParsedDocxTextbookTopicSeed[];
  warnings: string[];
}

export function createParsedDocxTextbookRequestSeedPreview({
  classificationPreview,
  reviewBasket
}: {
  classificationPreview?: ParsedDocxClassificationPreview | null;
  reviewBasket?: ParsedDocxKnowledgeVaultReviewBasketPreview | null;
}): ParsedDocxTextbookRequestSeedPreview {
  if (!reviewBasket || reviewBasket.status === "not_started") {
    return createBlockedPreview({
      blockers: ["Knowledge Vault review basket is required before textbook request seed preview."],
      status: "not_started"
    });
  }

  if (reviewBasket.status !== "review_basket_ready") {
    return createBlockedPreview({
      blockers: [
        reviewBasket.blockers[0] ??
          "Review basket must be ready before textbook request seed preview."
      ],
      status: "needs_review_basket"
    });
  }

  const reviewItems = reviewBasket.selectedOrRecommendedCandidates;

  if (reviewItems.length === 0) {
    return createBlockedPreview({
      blockers: ["Insufficient reviewed/recommended Knowledge Vault candidates."],
      status: "blocked"
    });
  }

  const suggestedTextbookTopics = createTopicSeeds({
    classificationPreview,
    reviewItems
  });
  const missingEvidence = createMissingEvidence({
    classificationPreview,
    reviewItems,
    suggestedTextbookTopics
  });

  return {
    blockers: [],
    missingEvidence,
    requestSeed: {
      readiness:
        missingEvidence.length > 2
          ? "needs_more_sources"
          : "ready_for_human_request_review",
      suggestedAudience: "textbook_writer",
      suggestedOutputType: "section_brief",
      suggestedRequestTitle: createRequestTitle({ suggestedTextbookTopics })
    },
    status: "seed_ready",
    suggestedTextbookTopics,
    warnings: createWarnings()
  };
}

function createTopicSeeds({
  classificationPreview,
  reviewItems
}: {
  classificationPreview?: ParsedDocxClassificationPreview | null;
  reviewItems: ParsedDocxKnowledgeVaultReviewBasketItem[];
}): ParsedDocxTextbookTopicSeed[] {
  const sectionLabels =
    classificationPreview?.suggestedTextbookSections
      .filter((section) => section.section !== "Needs human textbook mapping")
      .map((section) => section.section) ?? [];
  const fallbackTopic =
    reviewItems[0]?.tagLabel ?? "Needs human textbook topic selection";
  const topics = sectionLabels.length > 0 ? sectionLabels : [fallbackTopic];

  return topics.slice(0, 4).map((topicLabel) => {
    const supportingItems = reviewItems.filter((item) =>
      item.suggestedVaultUse.includes("textbook_section_input")
    );
    const usableItems = supportingItems.length > 0 ? supportingItems : reviewItems;

    return {
      evidenceReadiness: getEvidenceReadiness(usableItems),
      possibleChapterUse: createPossibleChapterUse(topicLabel),
      reason:
        "Seeded from review basket candidates and classification textbook relevance; no prose is generated.",
      supportingCandidateIds: usableItems.map((item) => item.candidateId).slice(0, 4),
      supportingTags: usableItems.map((item) => item.tagLabel).slice(0, 4),
      topicLabel
    };
  });
}

function createMissingEvidence({
  classificationPreview,
  reviewItems,
  suggestedTextbookTopics
}: {
  classificationPreview?: ParsedDocxClassificationPreview | null;
  reviewItems: ParsedDocxKnowledgeVaultReviewBasketItem[];
  suggestedTextbookTopics: ParsedDocxTextbookTopicSeed[];
}): string[] {
  const missingEvidence: string[] = [
    "Missing empirical research triangulation.",
    "Missing citation metadata verification.",
    "Missing source diversity beyond the current parsed DOCX."
  ];
  const combinedTags = reviewItems.map((item) => item.tagLabel.toLocaleLowerCase()).join(" ");
  const combinedSignals =
    classificationPreview?.sourceSignals.map((signal) => signal.value.toLocaleLowerCase()).join(" ") ??
    "";

  if (!/case|bangkok|thai|ประเทศไทย|ไทย/.test(`${combinedTags} ${combinedSignals}`)) {
    missingEvidence.push("Missing Thai case or local teaching example.");
  }

  if (!/case|example|company|bangkok/.test(`${combinedTags} ${combinedSignals}`)) {
    missingEvidence.push("Missing local case.");
  }

  if (
    suggestedTextbookTopics.every((topic) => topic.evidenceReadiness !== "strong")
  ) {
    missingEvidence.push("Missing strong evidence coverage for a full textbook request.");
  }

  return missingEvidence;
}

function getEvidenceReadiness(
  reviewItems: ParsedDocxKnowledgeVaultReviewBasketItem[]
): ParsedDocxTextbookEvidenceReadiness {
  const hasEvidence = reviewItems.some((item) =>
    item.suggestedVaultUse.includes("evidence_record")
  );
  const hasConcept = reviewItems.some((item) =>
    item.suggestedVaultUse.includes("concept_record")
  );
  const hasTextbookInput = reviewItems.some((item) =>
    item.suggestedVaultUse.includes("textbook_section_input")
  );

  if (hasEvidence && hasConcept && hasTextbookInput) {
    return "strong";
  }

  if ((hasConcept && hasTextbookInput) || hasEvidence) {
    return "partial";
  }

  return "weak";
}

function createPossibleChapterUse(topicLabel: string): string {
  if (/service|experience/i.test(topicLabel)) {
    return "Section brief for service marketing or customer experience chapter.";
  }

  if (/research|insight/i.test(topicLabel)) {
    return "Literature review seed for marketing research support.";
  }

  return "Chapter outline seed for human textbook request review.";
}

function createRequestTitle({
  suggestedTextbookTopics
}: {
  suggestedTextbookTopics: ParsedDocxTextbookTopicSeed[];
}): string {
  const primaryTopic =
    suggestedTextbookTopics[0]?.topicLabel ?? "Parsed DOCX textbook request seed";

  return `${primaryTopic} - human-reviewed request seed`;
}

function createBlockedPreview({
  blockers,
  status
}: {
  blockers: string[];
  status: ParsedDocxTextbookRequestSeedStatus;
}): ParsedDocxTextbookRequestSeedPreview {
  return {
    blockers,
    missingEvidence: [],
    requestSeed: {
      readiness: "blocked",
      suggestedAudience: "unknown",
      suggestedOutputType: "unknown",
      suggestedRequestTitle: "Textbook request seed unavailable"
    },
    status,
    suggestedTextbookTopics: [],
    warnings: createWarnings()
  };
}

function createWarnings(): string[] {
  return [
    "Preview only - this is not a draft.",
    "No AI is used and no DraftArtifact is created.",
    "No citation finality is implied.",
    "Human review is required before any textbook request."
  ];
}
