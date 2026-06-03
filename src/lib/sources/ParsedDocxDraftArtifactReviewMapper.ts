import type {
  SavedDraftArtifactDetail,
  SavedKnowledgeCardListItem,
  SavedSourceCardDetail,
  SavedSourceCardTagRecord,
  SavedSourceDocumentDetail
} from "../persistence/LocalVaultDatabase";
import {
  reviewSavedDraftArtifactForCitationAndEvidence,
  type SavedDraftArtifactReviewGate
} from "./SavedDraftArtifactReviewMapper";

export type ParsedDocxDraftArtifactReviewStatus =
  | "ready"
  | "needs_review"
  | "blocked";

export interface ParsedDocxDraftArtifactSectionReviewSummary {
  citationPlaceholderCount: number;
  evidenceReferenceCount: number;
  linkedKnowledgeCardCount: number;
  sectionId: string;
  sectionTitle: string;
  status: ParsedDocxDraftArtifactReviewStatus;
  traceReferenceCount: number;
}

export interface ParsedDocxDraftArtifactKnowledgeCardCoverage {
  approvedMarketingTagCount: number;
  linkedDraftKnowledgeCardCount: number;
  savedKnowledgeCardCount: number;
  traceReadyKnowledgeCardCount: number;
}

export interface ParsedDocxDraftArtifactReviewGate {
  blockers: string[];
  citationReadinessScore: number;
  evidenceCoverageScore: number;
  knowledgeCardCoverage: ParsedDocxDraftArtifactKnowledgeCardCoverage;
  recommendedNextAction: string;
  reviewStatus: ParsedDocxDraftArtifactReviewStatus;
  savedDraftArtifactId: string | null;
  sectionReviewSummary: ParsedDocxDraftArtifactSectionReviewSummary[];
  traceCompletenessScore: number;
  unresolvedWarnings: string[];
}

export interface ParsedDocxDraftArtifactReviewMapperInput {
  approvedMarketingTags: SavedSourceCardTagRecord[];
  parserSource: string;
  savedDraftArtifact: SavedDraftArtifactDetail | null;
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  savedSourceCard: SavedSourceCardDetail | null;
  savedSourceDocument: SavedSourceDocumentDetail | null;
}

export function reviewParsedDocxDraftArtifactForCitationAndEvidence({
  approvedMarketingTags,
  parserSource,
  savedDraftArtifact,
  savedKnowledgeCards,
  savedSourceCard,
  savedSourceDocument
}: ParsedDocxDraftArtifactReviewMapperInput): ParsedDocxDraftArtifactReviewGate {
  const blockers: string[] = [];
  const unresolvedWarnings: string[] = [
    "DOCX page numbers remain untrusted; chunk references must be reviewed manually.",
    "Citation placeholders are not final APA citations.",
    "Mock/not-final DraftArtifact cannot be treated as a final manuscript."
  ];

  if (!savedDraftArtifact) {
    return {
      blockers: ["Saved parsed-DOCX DraftArtifact is missing."],
      citationReadinessScore: 0,
      evidenceCoverageScore: 0,
      knowledgeCardCoverage: {
        approvedMarketingTagCount: approvedMarketingTags.length,
        linkedDraftKnowledgeCardCount: 0,
        savedKnowledgeCardCount: savedKnowledgeCards.length,
        traceReadyKnowledgeCardCount: countTraceReadyKnowledgeCards(savedKnowledgeCards)
      },
      recommendedNextAction:
        "Save the parsed-DOCX DraftArtifact explicitly before running this review gate.",
      reviewStatus: "blocked",
      savedDraftArtifactId: null,
      sectionReviewSummary: [],
      traceCompletenessScore: 0,
      unresolvedWarnings
    };
  }

  const baseReview = reviewSavedDraftArtifactForCitationAndEvidence(savedDraftArtifact);

  if (savedDraftArtifact.knowledgeCards.length === 0) {
    blockers.push("Saved parsed-DOCX DraftArtifact has no linked saved KnowledgeCards.");
  }

  if (savedKnowledgeCards.length === 0) {
    blockers.push("No saved parsed-DOCX KnowledgeCards are available for review.");
  }

  if (!savedDraftArtifact.draftArtifact.mockOnly || !savedDraftArtifact.draftArtifact.notFinal) {
    blockers.push("Parsed-DOCX DraftArtifact must remain mock_only and not_final.");
  }

  if (savedSourceDocument?.sourceDocument.fileType !== "DOCX") {
    blockers.push("Saved SourceDocument linkage must be DOCX.");
  }

  if (savedSourceCard?.sourceCard.sourceType !== "DOCX") {
    blockers.push("Saved SourceCard linkage must be DOCX.");
  }

  if (parserSource !== "real_docx_parser_mvp") {
    unresolvedWarnings.push(
      "Parsed DOCX parser provenance should remain real_docx_parser_mvp."
    );
  }

  if (approvedMarketingTags.length === 0) {
    unresolvedWarnings.push("No approved parsed-DOCX MarketingTags are linked for review context.");
  }

  if (baseReview.traceCompletenessScore < 80) {
    unresolvedWarnings.push("Trace completeness is weak for one or more draft sections.");
  }

  if (baseReview.citationReadinessScore < 80) {
    unresolvedWarnings.push("Citation placeholder coverage is weak and needs human review.");
  }

  const combinedBlockers = dedupe([...baseReview.blockers, ...blockers]);
  const combinedWarnings = dedupe([
    ...unresolvedWarnings,
    ...baseReview.citationWarnings,
    ...baseReview.traceWarnings,
    ...baseReview.evidenceWarnings,
    ...baseReview.missingKnowledgeCardLinks
  ]);
  const reviewStatus = getParsedDocxReviewStatus({
    baseReview,
    blockers: combinedBlockers
  });

  return {
    blockers: combinedBlockers,
    citationReadinessScore: baseReview.citationReadinessScore,
    evidenceCoverageScore: baseReview.evidenceCoverageScore,
    knowledgeCardCoverage: {
      approvedMarketingTagCount: approvedMarketingTags.length,
      linkedDraftKnowledgeCardCount: savedDraftArtifact.knowledgeCards.length,
      savedKnowledgeCardCount: savedKnowledgeCards.length,
      traceReadyKnowledgeCardCount: countTraceReadyKnowledgeCards(savedKnowledgeCards)
    },
    recommendedNextAction: createRecommendedNextAction(reviewStatus),
    reviewStatus,
    savedDraftArtifactId: savedDraftArtifact.draftArtifact.draftArtifactId,
    sectionReviewSummary: baseReview.sectionReviews.map((section) => ({
      citationPlaceholderCount: section.citationPlaceholderCount,
      evidenceReferenceCount: section.evidenceReferenceCount,
      linkedKnowledgeCardCount: section.linkedKnowledgeCardCount,
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitle,
      status: section.status,
      traceReferenceCount: section.traceReferenceCount
    })),
    traceCompletenessScore: baseReview.traceCompletenessScore,
    unresolvedWarnings: combinedWarnings
  };
}

function getParsedDocxReviewStatus({
  baseReview,
  blockers
}: {
  baseReview: SavedDraftArtifactReviewGate;
  blockers: string[];
}): ParsedDocxDraftArtifactReviewStatus {
  if (blockers.length > 0 || baseReview.overallStatus === "blocked") {
    return "blocked";
  }

  if (
    baseReview.citationReadinessScore < 80 ||
    baseReview.evidenceCoverageScore < 80 ||
    baseReview.traceCompletenessScore < 80
  ) {
    return "needs_review";
  }

  return "ready";
}

function countTraceReadyKnowledgeCards(cards: SavedKnowledgeCardListItem[]): number {
  return cards.filter((card) => card.traceCount > 0).length;
}

function createRecommendedNextAction(
  status: ParsedDocxDraftArtifactReviewStatus
): string {
  if (status === "blocked") {
    return "Resolve saved DraftArtifact and linked KnowledgeCard blockers before export planning.";
  }

  return "Manually review citations, evidence support, and DOCX chunk traces before any future DOCX export sprint.";
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
