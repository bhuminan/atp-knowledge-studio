import type {
  DraftInputKnowledgeCard,
  DraftInputPackagePreview
} from "./DraftInputPackageMapper";
import type {
  DraftSectionMockPreview,
  DraftSectionMockSection
} from "./DraftSectionMockComposer";
import type {
  SourceToDraftMockPreview,
  SourceToDraftSectionPlan
} from "./SourceToDraftMockMapper";

export type DraftQualityReadiness = "ready" | "needs_review" | "blocked";

export interface DraftQualityReviewPreview {
  blockers: string[];
  citationRiskSummary: DraftQualitySummary;
  evidenceCoverageSummary: DraftQualitySummary;
  managerialUsefulnessSummary: DraftQualitySummary;
  overallReadiness: DraftQualityReadiness;
  reviewId: string;
  sectionReviews: DraftQualitySectionReview[];
  teachingUsefulnessSummary: DraftQualitySummary;
  traceabilitySummary: DraftQualitySummary;
  warnings: string[];
}

export interface DraftQualitySectionReview {
  approvedTagCount: number;
  blockers: string[];
  citationStatus: DraftQualityReadiness;
  hasApprovedTags: boolean;
  hasLinkedCase: boolean;
  hasLinkedConcept: boolean;
  hasLinkedEvidenceOrQuote: boolean;
  hasTraceReference: boolean;
  mockOnlyWarning: string;
  readiness: DraftQualityReadiness;
  sectionId: DraftSectionMockSection["sectionId"];
  sectionTitle: string;
  warnings: string[];
}

export interface DraftQualitySummary {
  detail: string;
  status: DraftQualityReadiness;
}

export interface DraftQualityReviewInput {
  approvedKnowledgeCards: DraftInputKnowledgeCard[];
  approvedMarketingTags: string[];
  draftInputPackage: DraftInputPackagePreview;
  draftSectionMockPreview: DraftSectionMockPreview;
  sourceToDraftPreview: SourceToDraftMockPreview;
}

export function mapDraftQualityReviewPreview({
  approvedKnowledgeCards,
  approvedMarketingTags,
  draftInputPackage,
  draftSectionMockPreview,
  sourceToDraftPreview
}: DraftQualityReviewInput): DraftQualityReviewPreview {
  const sectionReviews = draftSectionMockPreview.sections.map((section) =>
    reviewDraftSection({
      approvedKnowledgeCards,
      approvedMarketingTags,
      section,
      sectionPlan: findSectionPlan(sourceToDraftPreview, section.sectionId)
    })
  );
  const evidenceCoverageSummary = summarizeEvidenceCoverage(sectionReviews);
  const citationRiskSummary = summarizeCitationRisk({
    draftInputPackage,
    sectionReviews
  });
  const traceabilitySummary = summarizeTraceability({
    draftInputPackage,
    sectionReviews
  });
  const managerialUsefulnessSummary = summarizeUsefulness({
    draftSectionMockPreview,
    sectionId: "managerial_implication"
  });
  const teachingUsefulnessSummary = summarizeUsefulness({
    draftSectionMockPreview,
    sectionId: "teaching_angle"
  });
  const blockers = collectBlockers({
    draftInputPackage,
    draftSectionMockPreview,
    sectionReviews,
    sourceToDraftPreview
  });
  const warnings = collectWarnings({
    citationRiskSummary,
    draftInputPackage,
    draftSectionMockPreview,
    sectionReviews,
    sourceToDraftPreview,
    traceabilitySummary
  });

  return {
    blockers,
    citationRiskSummary,
    evidenceCoverageSummary,
    managerialUsefulnessSummary,
    overallReadiness: getOverallReadiness({
      blockers,
      sectionReviews,
      warnings
    }),
    reviewId: `draft-quality-${draftSectionMockPreview.draftId}`,
    sectionReviews,
    teachingUsefulnessSummary,
    traceabilitySummary,
    warnings
  };
}

function reviewDraftSection({
  approvedKnowledgeCards,
  approvedMarketingTags,
  section,
  sectionPlan
}: {
  approvedKnowledgeCards: DraftInputKnowledgeCard[];
  approvedMarketingTags: string[];
  section: DraftSectionMockSection;
  sectionPlan: SourceToDraftSectionPlan | undefined;
}): DraftQualitySectionReview {
  const linkedCardIds = new Set([
    ...section.linkedCaseIds,
    ...section.linkedEvidenceIds,
    ...section.linkedQuoteIds
  ]);
  const linkedCards = approvedKnowledgeCards.filter((card) =>
    linkedCardIds.has(card.candidateId)
  );
  const hasLinkedConcept = (sectionPlan?.linkedConcepts.length ?? 0) > 0;
  const hasLinkedEvidenceOrQuote =
    section.linkedEvidenceIds.length + section.linkedQuoteIds.length > 0;
  const hasLinkedCase = section.linkedCaseIds.length > 0;
  const hasApprovedTags = approvedMarketingTags.length > 0;
  const hasTraceReference = linkedCards.some((card) => isDocxTrace(card.traceReference));
  const citationStatus = getSectionCitationStatus({
    hasTraceReference,
    linkedCards
  });
  const blockers = createSectionBlockers({
    hasLinkedConcept,
    hasLinkedEvidenceOrQuote,
    hasTraceReference,
    section
  });
  const warnings = createSectionWarnings({
    citationStatus,
    hasApprovedTags,
    hasLinkedCase,
    section,
    sectionPlan
  });

  return {
    approvedTagCount: approvedMarketingTags.length,
    blockers,
    citationStatus,
    hasApprovedTags,
    hasLinkedCase,
    hasLinkedConcept,
    hasLinkedEvidenceOrQuote,
    hasTraceReference,
    mockOnlyWarning: "Mock-only section review; no draft is validated or saved.",
    readiness: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "needs_review" : "ready",
    sectionId: section.sectionId,
    sectionTitle: section.sectionTitle,
    warnings
  };
}

function findSectionPlan(
  sourceToDraftPreview: SourceToDraftMockPreview,
  sectionId: DraftSectionMockSection["sectionId"]
): SourceToDraftSectionPlan | undefined {
  return sourceToDraftPreview.sectionPlans.find((section) => section.sectionId === sectionId);
}

function getSectionCitationStatus({
  hasTraceReference,
  linkedCards
}: {
  hasTraceReference: boolean;
  linkedCards: DraftInputKnowledgeCard[];
}): DraftQualityReadiness {
  if (linkedCards.length === 0) {
    return "blocked";
  }

  if (!hasTraceReference) {
    return "needs_review";
  }

  return linkedCards.some((card) => card.citationNeedsReview) ? "needs_review" : "ready";
}

function createSectionBlockers({
  hasLinkedConcept,
  hasLinkedEvidenceOrQuote,
  hasTraceReference,
  section
}: {
  hasLinkedConcept: boolean;
  hasLinkedEvidenceOrQuote: boolean;
  hasTraceReference: boolean;
  section: DraftSectionMockSection;
}): string[] {
  const blockers: string[] = [];

  if (section.sectionId === "concept_theory" && !hasLinkedConcept) {
    blockers.push("Concept / Theory needs at least one linked concept.");
  }

  if (section.sectionId === "research_evidence" && !hasLinkedEvidenceOrQuote) {
    blockers.push("Research Evidence needs linked evidence or quote cards.");
  }

  if (section.sectionId === "research_evidence" && !hasTraceReference) {
    blockers.push("Research Evidence needs traceable docx:pN chunk references.");
  }

  return blockers;
}

function createSectionWarnings({
  citationStatus,
  hasApprovedTags,
  hasLinkedCase,
  section,
  sectionPlan
}: {
  citationStatus: DraftQualityReadiness;
  hasApprovedTags: boolean;
  hasLinkedCase: boolean;
  section: DraftSectionMockSection;
  sectionPlan: SourceToDraftSectionPlan | undefined;
}): string[] {
  const warnings = [
    ...section.warnings,
    "DOCX page numbers are not trusted; continue using chunk references such as docx:pN."
  ];

  if (!hasApprovedTags) {
    warnings.push("No approved marketing tags are attached to this section.");
  }

  if (citationStatus !== "ready") {
    warnings.push("Citation status is review-gated; do not use as final citation text.");
  }

  if (
    (section.sectionId === "phenomenon" ||
      section.sectionId === "managerial_implication" ||
      section.sectionId === "teaching_angle") &&
    !hasLinkedCase
  ) {
    warnings.push("A reviewed case would strengthen this section before real drafting.");
  }

  if (sectionPlan?.missingEvidenceWarnings.length) {
    warnings.push(...sectionPlan.missingEvidenceWarnings);
  }

  return Array.from(new Set(warnings));
}

function summarizeEvidenceCoverage(
  sectionReviews: DraftQualitySectionReview[]
): DraftQualitySummary {
  const coveredSections = sectionReviews.filter(
    (section) => section.hasLinkedEvidenceOrQuote || section.hasLinkedCase
  ).length;
  const evidenceSection = sectionReviews.find(
    (section) => section.sectionId === "research_evidence"
  );
  const status =
    evidenceSection?.hasLinkedEvidenceOrQuote && coveredSections >= 3
      ? "ready"
      : evidenceSection?.hasLinkedEvidenceOrQuote
        ? "needs_review"
        : "blocked";

  return {
    detail: `${coveredSections} of ${sectionReviews.length} sections have evidence, quote, or case support.`,
    status
  };
}

function summarizeCitationRisk({
  draftInputPackage,
  sectionReviews
}: {
  draftInputPackage: DraftInputPackagePreview;
  sectionReviews: DraftQualitySectionReview[];
}): DraftQualitySummary {
  const citationReviewSections = sectionReviews.filter(
    (section) => section.citationStatus !== "ready"
  ).length;
  const status =
    draftInputPackage.citationReadiness === "blocked"
      ? "blocked"
      : citationReviewSections > 0 || draftInputPackage.citationReadiness === "needs_review"
        ? "needs_review"
        : "ready";

  return {
    detail: `${citationReviewSections} section(s) still need citation review; no final citation text is generated.`,
    status
  };
}

function summarizeTraceability({
  draftInputPackage,
  sectionReviews
}: {
  draftInputPackage: DraftInputPackagePreview;
  sectionReviews: DraftQualitySectionReview[];
}): DraftQualitySummary {
  const traceReadySections = sectionReviews.filter(
    (section) => section.hasTraceReference
  ).length;
  const status =
    draftInputPackage.traceReadiness === "blocked"
      ? "blocked"
      : draftInputPackage.traceReadiness === "ready" && traceReadySections > 0
        ? "ready"
        : "needs_review";

  return {
    detail: `${traceReadySections} section(s) have docx:pN trace references; page numbers are not claimed.`,
    status
  };
}

function summarizeUsefulness({
  draftSectionMockPreview,
  sectionId
}: {
  draftSectionMockPreview: DraftSectionMockPreview;
  sectionId: DraftSectionMockSection["sectionId"];
}): DraftQualitySummary {
  const section = draftSectionMockPreview.sections.find(
    (draftSection) => draftSection.sectionId === sectionId
  );

  if (!section) {
    return {
      detail: "Section is missing from the mock draft preview.",
      status: "blocked"
    };
  }

  const hasSupport =
    section.linkedCaseIds.length + section.linkedEvidenceIds.length + section.linkedQuoteIds.length >
    0;

  return {
    detail: hasSupport
      ? `${section.sectionTitle} has reviewed inputs for future academic usefulness review.`
      : `${section.sectionTitle} needs more reviewed inputs before usefulness review.`,
    status: hasSupport ? "ready" : "needs_review"
  };
}

function collectBlockers({
  draftInputPackage,
  draftSectionMockPreview,
  sectionReviews,
  sourceToDraftPreview
}: {
  draftInputPackage: DraftInputPackagePreview;
  draftSectionMockPreview: DraftSectionMockPreview;
  sectionReviews: DraftQualitySectionReview[];
  sourceToDraftPreview: SourceToDraftMockPreview;
}): string[] {
  return Array.from(
    new Set([
      ...draftInputPackage.blockers,
      ...sourceToDraftPreview.blockers,
      ...draftSectionMockPreview.blockers,
      ...sectionReviews.flatMap((section) => section.blockers)
    ])
  );
}

function collectWarnings({
  citationRiskSummary,
  draftInputPackage,
  draftSectionMockPreview,
  sectionReviews,
  sourceToDraftPreview,
  traceabilitySummary
}: {
  citationRiskSummary: DraftQualitySummary;
  draftInputPackage: DraftInputPackagePreview;
  draftSectionMockPreview: DraftSectionMockPreview;
  sectionReviews: DraftQualitySectionReview[];
  sourceToDraftPreview: SourceToDraftMockPreview;
  traceabilitySummary: DraftQualitySummary;
}): string[] {
  const warnings = [
    "Preview only — no draft is validated or saved.",
    "Draft paragraphs are mock/deterministic and require human academic review.",
    "Do not fabricate citations or page numbers from DOCX extraction traces.",
    ...draftInputPackage.warnings,
    ...sourceToDraftPreview.warnings,
    ...draftSectionMockPreview.warnings,
    ...sectionReviews.flatMap((section) => section.warnings)
  ];

  if (citationRiskSummary.status !== "ready") {
    warnings.push(citationRiskSummary.detail);
  }

  if (traceabilitySummary.status !== "ready") {
    warnings.push(traceabilitySummary.detail);
  }

  return Array.from(new Set(warnings));
}

function getOverallReadiness({
  blockers,
  sectionReviews,
  warnings
}: {
  blockers: string[];
  sectionReviews: DraftQualitySectionReview[];
  warnings: string[];
}): DraftQualityReadiness {
  if (blockers.length > 0 || sectionReviews.some((section) => section.readiness === "blocked")) {
    return "blocked";
  }

  if (warnings.length > 0 || sectionReviews.some((section) => section.readiness === "needs_review")) {
    return "needs_review";
  }

  return "ready";
}

function isDocxTrace(traceReference: string): boolean {
  return traceReference.startsWith("docx:");
}
