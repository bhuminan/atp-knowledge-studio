import type { SourceDocument } from "../../types/domain";

export type DraftInputKnowledgeCardType =
  | "concept"
  | "evidence"
  | "quote"
  | "case"
  | "writing_angle";

export interface DraftInputKnowledgeCard {
  candidateId: string;
  cardType: DraftInputKnowledgeCardType;
  citationNeedsReview: boolean;
  detail: string;
  status: "ready" | "needs_review" | "blocked";
  title: string;
  traceReference: string;
  traceReady: boolean;
}

export interface DraftInputSourceCard {
  citationText: string;
  fileReference: string;
  id: string;
  metadataStatus: "ready" | "needs_metadata" | "blocked";
  sourceType: string;
  title: string;
}

export interface DraftInputPackageSection {
  inputCount: number;
  sectionId:
    | "phenomenon_real_world_problem"
    | "concept_theory"
    | "research_evidence"
    | "business_managerial_implication"
    | "teaching_textbook_angle";
  title: string;
  use: string;
}

export interface DraftInputPackagePreview {
  blockers: string[];
  caseInputs: DraftInputKnowledgeCard[];
  citationReadiness: "ready" | "needs_review" | "blocked";
  conceptInputs: DraftInputKnowledgeCard[];
  evidenceInputs: DraftInputKnowledgeCard[];
  packageId: string;
  quoteInputs: DraftInputKnowledgeCard[];
  sourceSummary: {
    sourceCardId: string;
    sourceDocumentTitle: string;
    sourceType: string;
  };
  suggestedDraftSections: DraftInputPackageSection[];
  traceReadiness: "ready" | "needs_review" | "blocked";
  warnings: string[];
  writingAngleInputs: DraftInputKnowledgeCard[];
}

export interface DraftInputPackageMappingInput {
  approvedKnowledgeCards: DraftInputKnowledgeCard[];
  citationNeedsReviewCount: number;
  sourceCardCandidate: DraftInputSourceCard;
  sourceDocumentCandidate: Partial<SourceDocument>;
  warningCount: number;
}

export function mapDraftInputPackagePreview({
  approvedKnowledgeCards,
  citationNeedsReviewCount,
  sourceCardCandidate,
  sourceDocumentCandidate,
  warningCount
}: DraftInputPackageMappingInput): DraftInputPackagePreview {
  const conceptInputs = byType(approvedKnowledgeCards, "concept");
  const evidenceInputs = byType(approvedKnowledgeCards, "evidence");
  const quoteInputs = byType(approvedKnowledgeCards, "quote");
  const caseInputs = byType(approvedKnowledgeCards, "case");
  const writingAngleInputs = byType(approvedKnowledgeCards, "writing_angle");
  const traceReadyCount = approvedKnowledgeCards.filter((card) => card.traceReady).length;
  const traceReadiness =
    approvedKnowledgeCards.length === 0
      ? "blocked"
      : traceReadyCount === approvedKnowledgeCards.length
        ? "ready"
        : "needs_review";
  const citationReadiness =
    sourceCardCandidate.metadataStatus === "blocked"
      ? "blocked"
      : sourceCardCandidate.metadataStatus === "ready" && citationNeedsReviewCount === 0
        ? "ready"
        : "needs_review";
  const blockers = createDraftInputBlockers({
    approvedKnowledgeCards,
    sourceCardCandidate,
    traceReadiness
  });
  const warnings = createDraftInputWarnings({
    citationNeedsReviewCount,
    sourceCardCandidate,
    traceReadiness,
    warningCount
  });

  return {
    blockers,
    caseInputs,
    citationReadiness,
    conceptInputs,
    evidenceInputs,
    packageId: `draft-input-${sourceCardCandidate.id}`,
    quoteInputs,
    sourceSummary: {
      sourceCardId: sourceCardCandidate.id,
      sourceDocumentTitle:
        sourceDocumentCandidate.metadata?.title ??
        sourceDocumentCandidate.title ??
        "SourceDocument title review required",
      sourceType: sourceCardCandidate.sourceType
    },
    suggestedDraftSections: createSuggestedDraftSections({
      caseInputs,
      conceptInputs,
      evidenceInputs,
      quoteInputs,
      writingAngleInputs
    }),
    traceReadiness,
    warnings,
    writingAngleInputs
  };
}

function byType(
  approvedKnowledgeCards: DraftInputKnowledgeCard[],
  cardType: DraftInputKnowledgeCardType
): DraftInputKnowledgeCard[] {
  return approvedKnowledgeCards.filter((card) => card.cardType === cardType);
}

function createSuggestedDraftSections({
  caseInputs,
  conceptInputs,
  evidenceInputs,
  quoteInputs,
  writingAngleInputs
}: {
  caseInputs: DraftInputKnowledgeCard[];
  conceptInputs: DraftInputKnowledgeCard[];
  evidenceInputs: DraftInputKnowledgeCard[];
  quoteInputs: DraftInputKnowledgeCard[];
  writingAngleInputs: DraftInputKnowledgeCard[];
}): DraftInputPackageSection[] {
  return [
    {
      inputCount: caseInputs.length,
      sectionId: "phenomenon_real_world_problem",
      title: "Phenomenon / Real-world problem",
      use: "Frame the observable service or business problem before theory."
    },
    {
      inputCount: conceptInputs.length + quoteInputs.length,
      sectionId: "concept_theory",
      title: "Concept / Theory",
      use: "Use concept and quote cards to define the academic construct."
    },
    {
      inputCount: evidenceInputs.length,
      sectionId: "research_evidence",
      title: "Research Evidence",
      use: "Use evidence cards as traceable research support, not final citations."
    },
    {
      inputCount: caseInputs.length + evidenceInputs.length,
      sectionId: "business_managerial_implication",
      title: "Business / Managerial Implication",
      use: "Connect reviewed cases and evidence to managerial relevance."
    },
    {
      inputCount: writingAngleInputs.length,
      sectionId: "teaching_textbook_angle",
      title: "Teaching or Textbook Angle",
      use: "Prepare teaching framing without generating final prose."
    }
  ];
}

function createDraftInputBlockers({
  approvedKnowledgeCards,
  sourceCardCandidate,
  traceReadiness
}: {
  approvedKnowledgeCards: DraftInputKnowledgeCard[];
  sourceCardCandidate: DraftInputSourceCard;
  traceReadiness: DraftInputPackagePreview["traceReadiness"];
}): string[] {
  const blockers: string[] = [];

  if (approvedKnowledgeCards.length === 0) {
    blockers.push("At least one approved Knowledge Card is required.");
  }

  if (sourceCardCandidate.metadataStatus === "blocked") {
    blockers.push("SourceCard candidate metadata is blocked.");
  }

  if (traceReadiness === "blocked") {
    blockers.push("No trace-ready approved Knowledge Cards are available.");
  }

  return blockers;
}

function createDraftInputWarnings({
  citationNeedsReviewCount,
  sourceCardCandidate,
  traceReadiness,
  warningCount
}: {
  citationNeedsReviewCount: number;
  sourceCardCandidate: DraftInputSourceCard;
  traceReadiness: DraftInputPackagePreview["traceReadiness"];
  warningCount: number;
}): string[] {
  const warnings = [
    "Preview only — no draft is generated.",
    "DOCX page numbers are not trusted; use chunk references such as docx:pN."
  ];

  if (sourceCardCandidate.metadataStatus !== "ready") {
    warnings.push("SourceCard metadata still needs human review before citation use.");
  }

  if (citationNeedsReviewCount > 0) {
    warnings.push(`${citationNeedsReviewCount} candidate(s) still need citation review.`);
  }

  if (traceReadiness !== "ready") {
    warnings.push("Some approved cards have weak or missing trace references.");
  }

  if (warningCount > 0) {
    warnings.push(`${warningCount} upstream warning(s) should be reviewed.`);
  }

  return Array.from(new Set(warnings));
}
