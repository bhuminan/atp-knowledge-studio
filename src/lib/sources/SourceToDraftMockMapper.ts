import type {
  DraftInputKnowledgeCard,
  DraftInputPackagePreview,
  DraftInputSourceCard
} from "./DraftInputPackageMapper";

export interface SourceToDraftMockPreview {
  blockers: string[];
  citationReadiness: DraftInputPackagePreview["citationReadiness"];
  draftPreviewId: string;
  draftPurpose: string;
  draftTitle: string;
  draftType: "textbook_chapter_preview";
  evidenceMap: SourceToDraftEvidenceMapItem[];
  sectionPlans: SourceToDraftSectionPlan[];
  traceReadiness: DraftInputPackagePreview["traceReadiness"];
  warnings: string[];
}

export interface SourceToDraftEvidenceMapItem {
  evidenceType: DraftInputKnowledgeCard["cardType"];
  sourceCardId: string;
  title: string;
  traceReference: string;
}

export interface SourceToDraftSectionPlan {
  approvedTags: string[];
  intendedRole: string;
  linkedCases: string[];
  linkedConcepts: string[];
  linkedEvidence: string[];
  linkedQuotes: string[];
  missingEvidenceWarnings: string[];
  sectionId:
    | "phenomenon"
    | "concept_theory"
    | "research_evidence"
    | "managerial_implication"
    | "teaching_angle";
  sectionTitle: string;
}

export interface SourceToDraftMockMappingInput {
  approvedKnowledgeCards: DraftInputKnowledgeCard[];
  approvedMarketingTags: string[];
  draftInputPackage: DraftInputPackagePreview;
  sourceCardCandidate: DraftInputSourceCard;
}

export function mapSourceToDraftMockPreview({
  approvedKnowledgeCards,
  approvedMarketingTags,
  draftInputPackage,
  sourceCardCandidate
}: SourceToDraftMockMappingInput): SourceToDraftMockPreview {
  const conceptInputs = byType(approvedKnowledgeCards, "concept");
  const evidenceInputs = byType(approvedKnowledgeCards, "evidence");
  const quoteInputs = byType(approvedKnowledgeCards, "quote");
  const caseInputs = byType(approvedKnowledgeCards, "case");
  const writingAngleInputs = byType(approvedKnowledgeCards, "writing_angle");
  const sectionPlans = createSectionPlans({
    approvedMarketingTags,
    caseInputs,
    conceptInputs,
    evidenceInputs,
    quoteInputs,
    writingAngleInputs
  });
  const evidenceMap = approvedKnowledgeCards.map((card) => ({
    evidenceType: card.cardType,
    sourceCardId: sourceCardCandidate.id,
    title: card.title,
    traceReference: card.traceReference
  }));
  const blockers = createSourceToDraftBlockers({
    conceptInputs,
    draftInputPackage,
    evidenceInputs,
    quoteInputs,
    sourceCardCandidate
  });
  const warnings = createSourceToDraftWarnings({
    approvedMarketingTags,
    draftInputPackage,
    sourceCardCandidate
  });

  return {
    blockers,
    citationReadiness: draftInputPackage.citationReadiness,
    draftPreviewId: `source-to-draft-${draftInputPackage.packageId}`,
    draftPurpose:
      "Prepare a structured academic/textbook draft plan from reviewed evidence assets without generating prose.",
    draftTitle: `${draftInputPackage.sourceSummary.sourceDocumentTitle} — Source-to-Draft Preview`,
    draftType: "textbook_chapter_preview",
    evidenceMap,
    sectionPlans,
    traceReadiness: draftInputPackage.traceReadiness,
    warnings
  };
}

function byType(
  approvedKnowledgeCards: DraftInputKnowledgeCard[],
  cardType: DraftInputKnowledgeCard["cardType"]
): DraftInputKnowledgeCard[] {
  return approvedKnowledgeCards.filter((card) => card.cardType === cardType);
}

function createSectionPlans({
  approvedMarketingTags,
  caseInputs,
  conceptInputs,
  evidenceInputs,
  quoteInputs,
  writingAngleInputs
}: {
  approvedMarketingTags: string[];
  caseInputs: DraftInputKnowledgeCard[];
  conceptInputs: DraftInputKnowledgeCard[];
  evidenceInputs: DraftInputKnowledgeCard[];
  quoteInputs: DraftInputKnowledgeCard[];
  writingAngleInputs: DraftInputKnowledgeCard[];
}): SourceToDraftSectionPlan[] {
  return [
    {
      approvedTags: approvedMarketingTags,
      intendedRole: "Open with a concrete service or business problem that motivates the chapter.",
      linkedCases: caseInputs.map((card) => card.title),
      linkedConcepts: conceptInputs.map((card) => card.title),
      linkedEvidence: [],
      linkedQuotes: [],
      missingEvidenceWarnings:
        caseInputs.length > 0 ? [] : ["Add a reviewed case before full drafting."],
      sectionId: "phenomenon",
      sectionTitle: "Phenomenon / Real-world problem"
    },
    {
      approvedTags: approvedMarketingTags,
      intendedRole: "Define the core construct and establish the theoretical explanation.",
      linkedCases: [],
      linkedConcepts: conceptInputs.map((card) => card.title),
      linkedEvidence: [],
      linkedQuotes: quoteInputs.map((card) => card.title),
      missingEvidenceWarnings:
        conceptInputs.length > 0 ? [] : ["Add at least one approved ConceptCard."],
      sectionId: "concept_theory",
      sectionTitle: "Concept / Theory"
    },
    {
      approvedTags: approvedMarketingTags,
      intendedRole: "Connect traceable evidence to the concept without inventing citations.",
      linkedCases: [],
      linkedConcepts: conceptInputs.map((card) => card.title),
      linkedEvidence: evidenceInputs.map((card) => card.title),
      linkedQuotes: quoteInputs.map((card) => card.title),
      missingEvidenceWarnings:
        evidenceInputs.length + quoteInputs.length > 0
          ? []
          : ["Add approved EvidenceCard or QuoteCard before drafting evidence claims."],
      sectionId: "research_evidence",
      sectionTitle: "Research Evidence"
    },
    {
      approvedTags: approvedMarketingTags,
      intendedRole: "Translate reviewed evidence and cases into business implications.",
      linkedCases: caseInputs.map((card) => card.title),
      linkedConcepts: conceptInputs.map((card) => card.title),
      linkedEvidence: evidenceInputs.map((card) => card.title),
      linkedQuotes: [],
      missingEvidenceWarnings:
        evidenceInputs.length + caseInputs.length > 0
          ? []
          : ["Add approved evidence or case material for managerial implication."],
      sectionId: "managerial_implication",
      sectionTitle: "Business / Managerial Implication"
    },
    {
      approvedTags: approvedMarketingTags,
      intendedRole: "Prepare the textbook teaching angle, examples, and classroom framing.",
      linkedCases: caseInputs.map((card) => card.title),
      linkedConcepts: conceptInputs.map((card) => card.title),
      linkedEvidence: [],
      linkedQuotes: [],
      missingEvidenceWarnings:
        writingAngleInputs.length > 0
          ? []
          : ["Add approved WritingAngleCard before final teaching design."],
      sectionId: "teaching_angle",
      sectionTitle: "Teaching / Textbook Angle"
    }
  ];
}

function createSourceToDraftBlockers({
  conceptInputs,
  draftInputPackage,
  evidenceInputs,
  quoteInputs,
  sourceCardCandidate
}: {
  conceptInputs: DraftInputKnowledgeCard[];
  draftInputPackage: DraftInputPackagePreview;
  evidenceInputs: DraftInputKnowledgeCard[];
  quoteInputs: DraftInputKnowledgeCard[];
  sourceCardCandidate: DraftInputSourceCard;
}): string[] {
  const blockers: string[] = [];

  if (sourceCardCandidate.metadataStatus === "blocked") {
    blockers.push("SourceCard candidate is blocked.");
  }

  if (conceptInputs.length === 0) {
    blockers.push("At least one approved ConceptCard is required.");
  }

  if (evidenceInputs.length === 0 && quoteInputs.length === 0) {
    blockers.push("At least one approved EvidenceCard or QuoteCard is required.");
  }

  if (draftInputPackage.blockers.length > 0) {
    blockers.push(...draftInputPackage.blockers);
  }

  return Array.from(new Set(blockers));
}

function createSourceToDraftWarnings({
  approvedMarketingTags,
  draftInputPackage,
  sourceCardCandidate
}: {
  approvedMarketingTags: string[];
  draftInputPackage: DraftInputPackagePreview;
  sourceCardCandidate: DraftInputSourceCard;
}): string[] {
  const warnings = [
    "Preview only — no draft is generated.",
    "Do not invent citations or page numbers from DOCX traces.",
    "DOCX page numbers are not trusted; use chunk references such as docx:pN."
  ];

  if (sourceCardCandidate.metadataStatus !== "ready") {
    warnings.push("SourceCard metadata still needs citation review before prose drafting.");
  }

  if (approvedMarketingTags.length === 0) {
    warnings.push("No approved marketing tags are attached to this draft input preview.");
  }

  warnings.push(...draftInputPackage.warnings);

  return Array.from(new Set(warnings));
}
