import type {
  DraftInputKnowledgeCard,
  DraftInputPackagePreview
} from "./DraftInputPackageMapper";
import type { SourceToDraftMockPreview } from "./SourceToDraftMockMapper";

export interface DraftSectionMockPreview {
  blockers: string[];
  citationReadiness: DraftInputPackagePreview["citationReadiness"];
  draftId: string;
  draftTitle: string;
  draftType: "textbook_chapter_mock";
  sections: DraftSectionMockSection[];
  traceReadiness: DraftInputPackagePreview["traceReadiness"];
  warnings: string[];
}

export interface DraftSectionMockSection {
  approvedTags: string[];
  citationPlaceholders: string[];
  linkedCaseIds: string[];
  linkedEvidenceIds: string[];
  linkedQuoteIds: string[];
  mockParagraph: string;
  sectionId: SourceToDraftMockPreview["sectionPlans"][number]["sectionId"];
  sectionTitle: string;
  warnings: string[];
}

export interface DraftSectionMockComposerInput {
  approvedKnowledgeCards: DraftInputKnowledgeCard[];
  approvedMarketingTags: string[];
  draftInputPackage: DraftInputPackagePreview;
  sourceToDraftPreview: SourceToDraftMockPreview;
}

export function composeDraftSectionMockPreview({
  approvedKnowledgeCards,
  approvedMarketingTags,
  draftInputPackage,
  sourceToDraftPreview
}: DraftSectionMockComposerInput): DraftSectionMockPreview {
  const sections = sourceToDraftPreview.sectionPlans.map((sectionPlan) => {
    const linkedCards = getLinkedCards(sectionPlan, approvedKnowledgeCards);

    return {
      approvedTags: approvedMarketingTags,
      citationPlaceholders: createCitationPlaceholders(linkedCards),
      linkedCaseIds: linkedCards
        .filter((card) => card.cardType === "case")
        .map((card) => card.candidateId),
      linkedEvidenceIds: linkedCards
        .filter((card) => card.cardType === "evidence")
        .map((card) => card.candidateId),
      linkedQuoteIds: linkedCards
        .filter((card) => card.cardType === "quote")
        .map((card) => card.candidateId),
      mockParagraph: createMockParagraph({
        approvedMarketingTags,
        linkedCards,
        sectionTitle: sectionPlan.sectionTitle
      }),
      sectionId: sectionPlan.sectionId,
      sectionTitle: sectionPlan.sectionTitle,
      warnings: createSectionWarnings({
        draftInputPackage,
        linkedCards,
        sectionWarnings: sectionPlan.missingEvidenceWarnings
      })
    };
  });

  return {
    blockers: sourceToDraftPreview.blockers,
    citationReadiness: sourceToDraftPreview.citationReadiness,
    draftId: `mock-draft-${sourceToDraftPreview.draftPreviewId}`,
    draftTitle: sourceToDraftPreview.draftTitle.replace(
      "Source-to-Draft Preview",
      "Mock Draft Section Preview"
    ),
    draftType: "textbook_chapter_mock",
    sections,
    traceReadiness: sourceToDraftPreview.traceReadiness,
    warnings: [
      "Mock preview only — no draft is generated or saved.",
      "Mock paragraphs are deterministic placeholders, not final academic prose.",
      ...sourceToDraftPreview.warnings
    ]
  };
}

function getLinkedCards(
  sectionPlan: SourceToDraftMockPreview["sectionPlans"][number],
  approvedKnowledgeCards: DraftInputKnowledgeCard[]
): DraftInputKnowledgeCard[] {
  const linkedTitles = new Set([
    ...sectionPlan.linkedCases,
    ...sectionPlan.linkedConcepts,
    ...sectionPlan.linkedEvidence,
    ...sectionPlan.linkedQuotes
  ]);

  return approvedKnowledgeCards.filter((card) => linkedTitles.has(card.title));
}

function createCitationPlaceholders(
  linkedCards: DraftInputKnowledgeCard[]
): string[] {
  return linkedCards.map((card) =>
    card.traceReady
      ? `[MOCK CITATION PLACEHOLDER — verify source metadata; trace ${card.traceReference}]`
      : "[MOCK CITATION PLACEHOLDER — trace review required]"
  );
}

function createMockParagraph({
  approvedMarketingTags,
  linkedCards,
  sectionTitle
}: {
  approvedMarketingTags: string[];
  linkedCards: DraftInputKnowledgeCard[];
  sectionTitle: string;
}): string {
  const linkedCardTitles = linkedCards.map((card) => card.title).slice(0, 3);
  const tagPreview = approvedMarketingTags.slice(0, 3);

  return [
    "[MOCK DETERMINISTIC DRAFT PREVIEW]",
    `${sectionTitle} can be drafted by connecting ${formatList(linkedCardTitles)} with the reviewed marketing tags ${formatList(tagPreview)}.`,
    "This paragraph is a short planning preview only; it does not create final prose, citations, or page-number claims."
  ].join(" ");
}

function createSectionWarnings({
  draftInputPackage,
  linkedCards,
  sectionWarnings
}: {
  draftInputPackage: DraftInputPackagePreview;
  linkedCards: DraftInputKnowledgeCard[];
  sectionWarnings: string[];
}): string[] {
  const warnings = [...sectionWarnings];

  if (draftInputPackage.citationReadiness !== "ready") {
    warnings.push("Citation readiness is still review-gated for this section.");
  }

  if (linkedCards.some((card) => !card.traceReady)) {
    warnings.push("Some linked cards need trace review.");
  }

  if (linkedCards.length === 0) {
    warnings.push("No approved cards are linked to this section yet.");
  }

  return Array.from(new Set(warnings));
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "reviewed input placeholders";
}
