import type {
  SavedKnowledgeCardDetail,
  SavedKnowledgeCardListItem,
  SavedSourceCardDetail,
  SavedSourceCardTagRecord,
  SavedSourceDocumentDetail
} from "../persistence/LocalVaultDatabase";
import type { KnowledgeCardSaveCandidateType } from "../../types/domain";
import type { ParsedDocxDraftInputPackageReadiness } from "./ParsedDocxDraftInputPackageMapper";

export type ParsedDocxDraftArtifactCandidateStatus =
  | "ready"
  | "needs_review"
  | "blocked";

export interface ParsedDocxDraftArtifactSectionCandidate {
  citationPlaceholderCount: number;
  linkedKnowledgeCardIds: string[];
  sectionId: string;
  sectionTitle: string;
  sectionType: string;
  skeletonNote: string;
  traceReferences: string[];
}

export interface ParsedDocxDraftArtifactCandidatePreview {
  blockers: string[];
  citationPlaceholderSummary: string;
  draftArtifactCandidateId: string;
  draftArtifactCandidateStatus: ParsedDocxDraftArtifactCandidateStatus;
  evidenceTraceSummary: string;
  knowledgeCardCoverage: string;
  recommendedNextAction: string;
  sectionCandidates: ParsedDocxDraftArtifactSectionCandidate[];
  sourceCardId: string | null;
  sourceDocumentId: string | null;
  warnings: string[];
}

export interface ParsedDocxDraftArtifactCandidateInput {
  approvedMarketingTags: SavedSourceCardTagRecord[];
  readiness: ParsedDocxDraftInputPackageReadiness;
  savedKnowledgeCardDetail: SavedKnowledgeCardDetail | null;
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  savedSourceCard: SavedSourceCardDetail | null;
  savedSourceDocument: SavedSourceDocumentDetail | null;
}

export function mapParsedDocxToDraftArtifactCandidatePreview({
  approvedMarketingTags,
  readiness,
  savedKnowledgeCardDetail,
  savedKnowledgeCards,
  savedSourceCard,
  savedSourceDocument
}: ParsedDocxDraftArtifactCandidateInput): ParsedDocxDraftArtifactCandidatePreview {
  const blockers = [...readiness.blockers];
  const warnings = [
    ...readiness.warnings,
    "Preview only — DraftArtifact is not saved and prose is not final.",
    "Section candidates are skeletons only; no polished academic prose is generated.",
    "Citation placeholders remain placeholders and are not APA-ready.",
    "DOCX page numbers remain untrusted; trace refs use chunk references."
  ];
  const sourceDocumentId =
    readiness.sourceDocumentId ??
    savedSourceDocument?.sourceDocument.sourceDocumentId ??
    null;
  const sourceCardId =
    readiness.sourceCardId ?? savedSourceCard?.sourceCard.sourceCardId ?? null;
  const traceRefs = savedKnowledgeCardDetail?.traces.map(
    (trace) => trace.chunkReference
  ) ?? [];
  const sectionCandidates = createSectionCandidates({
    approvedMarketingTags,
    savedKnowledgeCards,
    traceRefs
  });

  if (sectionCandidates.length === 0) {
    blockers.push("At least one trace-linked section skeleton is required.");
  }

  if (
    sectionCandidates.some(
      (section) =>
        section.linkedKnowledgeCardIds.length === 0 &&
        section.traceReferences.length === 0
    )
  ) {
    blockers.push("Every section skeleton must link to a KnowledgeCard or trace.");
  }

  const draftArtifactCandidateStatus: ParsedDocxDraftArtifactCandidateStatus =
    blockers.length > 0
      ? "blocked"
      : readiness.draftInputPackageStatus === "ready"
        ? "ready"
        : "needs_review";

  return {
    blockers,
    citationPlaceholderSummary: createCitationPlaceholderSummary(savedKnowledgeCards),
    draftArtifactCandidateId: `parsed-docx-draft-artifact-candidate-${sourceCardId ?? "unlinked"}`,
    draftArtifactCandidateStatus,
    evidenceTraceSummary: createEvidenceTraceSummary({
      sectionCandidates,
      traceRefs
    }),
    knowledgeCardCoverage: createKnowledgeCardCoverage({
      savedKnowledgeCards,
      sectionCandidates
    }),
    recommendedNextAction: createRecommendedNextAction(draftArtifactCandidateStatus),
    sectionCandidates,
    sourceCardId,
    sourceDocumentId,
    warnings
  };
}

function createSectionCandidates({
  approvedMarketingTags,
  savedKnowledgeCards,
  traceRefs
}: {
  approvedMarketingTags: SavedSourceCardTagRecord[];
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  traceRefs: string[];
}): ParsedDocxDraftArtifactSectionCandidate[] {
  const tagLabels = approvedMarketingTags
    .filter((tag) => tag.reviewStatus === "approved")
    .map((tag) => tag.label);
  const groups: Array<{
    cardTypes: KnowledgeCardSaveCandidateType[];
    sectionId: string;
    sectionTitle: string;
    sectionType: string;
  }> = [
    {
      cardTypes: ["concept"],
      sectionId: "parsed-docx-section-concept-overview",
      sectionTitle: "Concept overview",
      sectionType: "concept_overview"
    },
    {
      cardTypes: ["evidence", "quote"],
      sectionId: "parsed-docx-section-evidence-findings",
      sectionTitle: "Evidence and findings",
      sectionType: "evidence_and_findings"
    },
    {
      cardTypes: ["case"],
      sectionId: "parsed-docx-section-case-application",
      sectionTitle: "Case/application notes",
      sectionType: "case_application_notes"
    },
    {
      cardTypes: ["writing_angle"],
      sectionId: "parsed-docx-section-teaching-managerial",
      sectionTitle: "Teaching or managerial implications",
      sectionType: "teaching_or_managerial_implications"
    },
    {
      cardTypes: ["concept", "evidence", "case", "writing_angle"],
      sectionId: "parsed-docx-section-writing-angles",
      sectionTitle: "Writing angles",
      sectionType: "writing_angles"
    }
  ];

  return groups
    .map((group, index) => {
      const linkedCards = savedKnowledgeCards.filter((card) =>
        group.cardTypes.includes(card.cardType)
      );
      const linkedTraceRefs = traceRefs.slice(0, Math.max(1, linkedCards.length));

      return {
        citationPlaceholderCount: linkedCards.length,
        linkedKnowledgeCardIds: linkedCards.map((card) => card.knowledgeCardId),
        sectionId: group.sectionId,
        sectionTitle: group.sectionTitle,
        sectionType: group.sectionType,
        skeletonNote: createSkeletonNote({
          cardCount: linkedCards.length,
          sectionTitle: group.sectionTitle,
          tagLabels
        }),
        traceReferences: linkedTraceRefs
      };
    })
    .filter(
      (section) =>
        section.linkedKnowledgeCardIds.length > 0 || section.traceReferences.length > 0
    );
}

function createSkeletonNote({
  cardCount,
  sectionTitle,
  tagLabels
}: {
  cardCount: number;
  sectionTitle: string;
  tagLabels: string[];
}): string {
  const tagSummary = tagLabels.length > 0 ? tagLabels.slice(0, 3).join(", ") : "reviewed tags";

  return `${sectionTitle} skeleton only; organize ${cardCount} saved KnowledgeCard(s) with ${tagSummary}.`;
}

function createEvidenceTraceSummary({
  sectionCandidates,
  traceRefs
}: {
  sectionCandidates: ParsedDocxDraftArtifactSectionCandidate[];
  traceRefs: string[];
}): string {
  const linkedTraceCount = new Set(
    sectionCandidates.flatMap((section) => section.traceReferences)
  ).size;

  return `${linkedTraceCount}/${Math.max(traceRefs.length, linkedTraceCount)} chunk trace refs linked; DOCX page numbers untrusted.`;
}

function createCitationPlaceholderSummary(
  savedKnowledgeCards: SavedKnowledgeCardListItem[]
): string {
  const needsReviewCount = savedKnowledgeCards.filter(
    (card) => card.citationReadiness !== "ready"
  ).length;

  return `${needsReviewCount} citation placeholder group(s) need review; no APA citation is final.`;
}

function createKnowledgeCardCoverage({
  savedKnowledgeCards,
  sectionCandidates
}: {
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  sectionCandidates: ParsedDocxDraftArtifactSectionCandidate[];
}): string {
  const linkedIds = new Set(
    sectionCandidates.flatMap((section) => section.linkedKnowledgeCardIds)
  );

  return `${linkedIds.size}/${savedKnowledgeCards.length} saved KnowledgeCards linked to section skeletons.`;
}

function createRecommendedNextAction(
  status: ParsedDocxDraftArtifactCandidateStatus
): string {
  if (status === "blocked") {
    return "Resolve missing parsed-DOCX draft input prerequisites before candidate review.";
  }

  return "Review section skeleton coverage before any future explicit DraftArtifact save sprint.";
}
