import type {
  SavedKnowledgeCardDetail,
  SavedKnowledgeCardListItem,
  SavedSourceCardDetail,
  SavedSourceCardTagRecord,
  SavedSourceDocumentDetail
} from "../persistence/LocalVaultDatabase";
import type { KnowledgeCardSaveCandidateType } from "../../types/domain";

export type ParsedDocxDraftInputPackageStatus =
  | "ready"
  | "needs_review"
  | "blocked";

export interface ParsedDocxDraftInputKnowledgeCardTypeCounts {
  case: number;
  concept: number;
  evidence: number;
  quote: number;
  writing_angle: number;
}

export interface ParsedDocxDraftInputPackageReadiness {
  approvedTagCount: number;
  blockers: string[];
  citationReadinessSummary: string;
  draftInputPackageStatus: ParsedDocxDraftInputPackageStatus;
  evidenceCoverageSummary: string;
  knowledgeCardTypeCounts: ParsedDocxDraftInputKnowledgeCardTypeCounts;
  recommendedNextAction: string;
  savedKnowledgeCardCount: number;
  sourceCardId: string | null;
  sourceDocumentId: string | null;
  traceReadyKnowledgeCardCount: number;
  warnings: string[];
}

export interface ParsedDocxDraftInputPackageReadinessInput {
  approvedMarketingTags: SavedSourceCardTagRecord[];
  savedKnowledgeCardDetail: SavedKnowledgeCardDetail | null;
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  savedSourceCard: SavedSourceCardDetail | null;
  savedSourceDocument: SavedSourceDocumentDetail | null;
}

export function mapParsedDocxToDraftInputPackageReadiness({
  approvedMarketingTags,
  savedKnowledgeCardDetail,
  savedKnowledgeCards,
  savedSourceCard,
  savedSourceDocument
}: ParsedDocxDraftInputPackageReadinessInput): ParsedDocxDraftInputPackageReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const approvedTags = approvedMarketingTags.filter(
    (tag) => tag.reviewStatus === "approved"
  );
  const sourceDocumentId =
    savedSourceDocument?.sourceDocument.sourceDocumentId ?? null;
  const sourceCardId = savedSourceCard?.sourceCard.sourceCardId ?? null;
  const traceReadyKnowledgeCardCount = savedKnowledgeCards.filter(
    (card) => card.traceCount > 0
  ).length;
  const knowledgeCardTypeCounts = countKnowledgeCardTypes(savedKnowledgeCards);

  if (!sourceDocumentId) {
    blockers.push("Saved parsed-DOCX SourceDocument is required.");
  }

  if (!sourceCardId) {
    blockers.push("Saved parsed-DOCX SourceCard is required.");
  }

  if (savedKnowledgeCards.length === 0) {
    blockers.push("Saved parsed-DOCX KnowledgeCards are required.");
  }

  if (approvedTags.length === 0) {
    warnings.push("Approved parsed-DOCX MarketingTags are missing.");
  }

  if (
    savedKnowledgeCards.length > 0 &&
    traceReadyKnowledgeCardCount < savedKnowledgeCards.length
  ) {
    warnings.push("Some saved KnowledgeCards lack trace references.");
  }

  if (savedKnowledgeCardDetail?.traces.some((trace) => trace.pageNumberTrusted)) {
    warnings.push("DOCX page numbers must remain untrusted for draft input.");
  } else {
    warnings.push("DOCX page numbers remain untrusted; use chunk refs only.");
  }

  if (savedKnowledgeCards.some((card) => card.citationReadiness === "ready")) {
    warnings.push("Citation readiness must be reviewed; do not treat placeholders as APA.");
  } else {
    warnings.push("Citation placeholders are not final APA citations.");
  }

  warnings.push("Readiness preview only; no DraftArtifact is generated or saved.");

  const draftInputPackageStatus: ParsedDocxDraftInputPackageStatus =
    blockers.length > 0
      ? "blocked"
      : warnings.some((warning) => /missing|lack|review|placeholder|untrusted/i.test(warning))
        ? "needs_review"
        : "ready";

  return {
    approvedTagCount: approvedTags.length,
    blockers,
    citationReadinessSummary: createCitationReadinessSummary(savedKnowledgeCards),
    draftInputPackageStatus,
    evidenceCoverageSummary: createEvidenceCoverageSummary({
      savedKnowledgeCards,
      traceReadyKnowledgeCardCount,
      typeCounts: knowledgeCardTypeCounts
    }),
    knowledgeCardTypeCounts,
    recommendedNextAction: createRecommendedNextAction({
      blockers,
      status: draftInputPackageStatus,
      warnings
    }),
    savedKnowledgeCardCount: savedKnowledgeCards.length,
    sourceCardId,
    sourceDocumentId,
    traceReadyKnowledgeCardCount,
    warnings
  };
}

function countKnowledgeCardTypes(
  cards: SavedKnowledgeCardListItem[]
): ParsedDocxDraftInputKnowledgeCardTypeCounts {
  return {
    case: countByType(cards, "case"),
    concept: countByType(cards, "concept"),
    evidence: countByType(cards, "evidence"),
    quote: countByType(cards, "quote"),
    writing_angle: countByType(cards, "writing_angle")
  };
}

function countByType(
  cards: SavedKnowledgeCardListItem[],
  cardType: KnowledgeCardSaveCandidateType
): number {
  return cards.filter((card) => card.cardType === cardType).length;
}

function createEvidenceCoverageSummary({
  savedKnowledgeCards,
  traceReadyKnowledgeCardCount,
  typeCounts
}: {
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  traceReadyKnowledgeCardCount: number;
  typeCounts: ParsedDocxDraftInputKnowledgeCardTypeCounts;
}): string {
  if (savedKnowledgeCards.length === 0) {
    return "Blocked: no saved KnowledgeCards are available for draft input.";
  }

  return [
    `${traceReadyKnowledgeCardCount}/${savedKnowledgeCards.length} saved KnowledgeCards have trace refs`,
    `concept ${typeCounts.concept}`,
    `evidence ${typeCounts.evidence}`,
    `quote ${typeCounts.quote}`,
    `case ${typeCounts.case}`,
    `writing_angle ${typeCounts.writing_angle}`
  ].join("; ");
}

function createCitationReadinessSummary(
  cards: SavedKnowledgeCardListItem[]
): string {
  if (cards.length === 0) {
    return "Blocked: no saved KnowledgeCards are available for citation review.";
  }

  const readyCount = cards.filter((card) => card.citationReadiness === "ready").length;
  const needsReviewCount = cards.filter(
    (card) => card.citationReadiness === "needs_review"
  ).length;
  const blockedCount = cards.filter(
    (card) => card.citationReadiness === "blocked"
  ).length;

  return `ready ${readyCount}; needs_review ${needsReviewCount}; blocked ${blockedCount}; APA citations are not final.`;
}

function createRecommendedNextAction({
  blockers,
  status,
  warnings
}: {
  blockers: string[];
  status: ParsedDocxDraftInputPackageStatus;
  warnings: string[];
}): string {
  if (status === "blocked") {
    return blockers[0] ?? "Complete saved parsed-DOCX prerequisites first.";
  }

  if (warnings.length > 0) {
    return "Review traces, approved tags, and citation metadata before any future DraftArtifact sprint.";
  }

  return "Ready for a future explicit DraftArtifact readiness hardening sprint.";
}
