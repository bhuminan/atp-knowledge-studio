import type {
  SavedDraftArtifactDetail,
  SavedDraftArtifactKnowledgeCardRecord,
  SavedDraftSectionRecord
} from "../persistence/LocalVaultDatabase";

export type SavedDraftArtifactReviewStatus = "ready" | "needs_review" | "blocked";
export type SavedDraftArtifactExportRiskLevel = "low" | "medium" | "high";

export interface SavedDraftArtifactSectionReview {
  blockers: string[];
  citationPlaceholderCount: number;
  evidenceReferenceCount: number;
  hasCitationPlaceholders: boolean;
  hasContent: boolean;
  hasEvidenceSupport: boolean;
  hasLinkedKnowledgeCards: boolean;
  hasWarnings: boolean;
  linkedCaseCount: number;
  linkedEvidenceCount: number;
  linkedKnowledgeCardCount: number;
  linkedQuoteCount: number;
  sectionId: string;
  sectionTitle: string;
  status: SavedDraftArtifactReviewStatus;
  traceReferenceCount: number;
  warnings: string[];
}

export interface SavedDraftArtifactReviewGate {
  blockers: string[];
  citationReadinessScore: number;
  citationWarnings: string[];
  evidenceCoverageScore: number;
  evidenceWarnings: string[];
  exportRiskLevel: SavedDraftArtifactExportRiskLevel;
  linkedKnowledgeCardCount: number;
  missingKnowledgeCardLinks: string[];
  overallStatus: SavedDraftArtifactReviewStatus;
  recommendations: string[];
  sectionReviews: SavedDraftArtifactSectionReview[];
  traceCompletenessScore: number;
  traceWarnings: string[];
}

export function reviewSavedDraftArtifactForCitationAndEvidence(
  detail: SavedDraftArtifactDetail
): SavedDraftArtifactReviewGate {
  const blockers: string[] = [];
  const citationWarnings: string[] = [];
  const traceWarnings: string[] = [];
  const evidenceWarnings: string[] = [];
  const recommendations: string[] = [
    "Review citation placeholders manually before any DOCX export work.",
    "Keep DOCX chunk references such as docx:pN visible until page numbers are verified.",
    "Confirm each section has enough saved KnowledgeCard support before treating it as export-ready."
  ];

  if (!detail.draftArtifact.mockOnly || !detail.draftArtifact.notFinal) {
    blockers.push("Saved DraftArtifact must remain mock_only and not_final before export planning.");
  }

  if (detail.sections.length === 0) {
    blockers.push("Saved DraftArtifact has no persisted draft sections.");
  }

  if (detail.knowledgeCards.length === 0) {
    blockers.push("Saved DraftArtifact has no linked saved KnowledgeCards.");
  }

  if (detail.draftArtifact.citationReadiness !== "ready") {
    citationWarnings.push(
      `Saved DraftArtifact citation readiness is ${detail.draftArtifact.citationReadiness}.`
    );
  }

  if (detail.draftArtifact.traceReadiness !== "ready") {
    traceWarnings.push(
      `Saved DraftArtifact trace readiness is ${detail.draftArtifact.traceReadiness}.`
    );
  }

  traceWarnings.push(
    "DOCX page numbers remain untrusted; chunk references such as docx:pN must be reviewed."
  );
  citationWarnings.push(
    "Citation placeholders are not real APA citations and must not be exported as final citations."
  );

  const sectionReviews = detail.sections.map((section) =>
    reviewSavedDraftSection(section, detail.knowledgeCards)
  );

  sectionReviews.forEach((review) => {
    review.blockers.forEach((blocker) => blockers.push(blocker));
    review.citationPlaceholderCount === 0 &&
      citationWarnings.push(`${review.sectionTitle} has no citation placeholders.`);
    !review.hasEvidenceSupport &&
      evidenceWarnings.push(`${review.sectionTitle} has weak evidence support.`);
    review.traceReferenceCount === 0 &&
      traceWarnings.push(`${review.sectionTitle} has no trace-like references.`);
    review.warnings.forEach((warning) => {
      if (!evidenceWarnings.includes(warning)) {
        evidenceWarnings.push(warning);
      }
    });
  });

  const missingKnowledgeCardLinks =
    detail.knowledgeCards.length === 0
      ? ["No saved KnowledgeCard links are available for this DraftArtifact."]
      : [];

  const citationReadySections = sectionReviews.filter(
    (review) => review.hasCitationPlaceholders
  ).length;
  const evidenceReadySections = sectionReviews.filter(
    (review) => review.hasEvidenceSupport
  ).length;
  const traceReadySections = sectionReviews.filter(
    (review) => review.traceReferenceCount > 0
  ).length;
  const sectionCount = Math.max(sectionReviews.length, 1);

  const citationReadinessScore = Math.round((citationReadySections / sectionCount) * 100);
  const evidenceCoverageScore = Math.round((evidenceReadySections / sectionCount) * 100);
  const traceCompletenessScore = Math.round((traceReadySections / sectionCount) * 100);
  const exportRiskLevel = getExportRiskLevel({
    blockers,
    citationReadinessScore,
    evidenceCoverageScore,
    traceCompletenessScore,
    warnings: [
      ...citationWarnings,
      ...traceWarnings,
      ...evidenceWarnings,
      ...missingKnowledgeCardLinks
    ]
  });
  const overallStatus =
    blockers.length > 0 || exportRiskLevel === "high"
      ? "blocked"
      : exportRiskLevel === "low" &&
          citationReadinessScore >= 80 &&
          evidenceCoverageScore >= 80 &&
          traceCompletenessScore >= 80
        ? "ready"
        : "needs_review";

  if (overallStatus !== "ready") {
    recommendations.push(
      "Resolve blockers and section-level evidence/citation warnings before export planning."
    );
  }

  return {
    blockers,
    citationReadinessScore,
    citationWarnings: dedupe(citationWarnings),
    evidenceCoverageScore,
    evidenceWarnings: dedupe(evidenceWarnings),
    exportRiskLevel,
    linkedKnowledgeCardCount: detail.knowledgeCards.length,
    missingKnowledgeCardLinks,
    overallStatus,
    recommendations: dedupe(recommendations),
    sectionReviews,
    traceCompletenessScore,
    traceWarnings: dedupe(traceWarnings)
  };
}

function reviewSavedDraftSection(
  section: SavedDraftSectionRecord,
  knowledgeCards: SavedDraftArtifactKnowledgeCardRecord[]
): SavedDraftArtifactSectionReview {
  const warnings = parseJsonArray(section.warningsJson);
  const citationPlaceholders = parseJsonArray(section.citationPlaceholdersJson);
  const linkedEvidence = parseJsonArray(section.linkedEvidenceIdsJson);
  const linkedQuotes = parseJsonArray(section.linkedQuoteIdsJson);
  const linkedCases = parseJsonArray(section.linkedCaseIdsJson);
  const evidenceReferenceCount =
    linkedEvidence.length + linkedQuotes.length + linkedCases.length;
  const blockers: string[] = [];

  if (!section.sectionId.trim()) {
    blockers.push("Saved draft section is missing a section ID.");
  }

  if (!section.sectionTitle.trim()) {
    blockers.push("Saved draft section is missing a section title.");
  }

  if (!section.mockParagraph.trim()) {
    blockers.push(`${section.sectionTitle || "Untitled section"} has no mock content.`);
  }

  if (knowledgeCards.length === 0) {
    blockers.push(`${section.sectionTitle || "Untitled section"} has no linked KnowledgeCards.`);
  }

  return {
    blockers,
    citationPlaceholderCount: citationPlaceholders.length,
    evidenceReferenceCount,
    hasCitationPlaceholders: citationPlaceholders.length > 0,
    hasContent: section.mockParagraph.trim().length > 0,
    hasEvidenceSupport: evidenceReferenceCount > 0 && knowledgeCards.length > 0,
    hasLinkedKnowledgeCards: knowledgeCards.length > 0,
    hasWarnings: warnings.length > 0,
    linkedCaseCount: linkedCases.length,
    linkedEvidenceCount: linkedEvidence.length,
    linkedKnowledgeCardCount: knowledgeCards.length,
    linkedQuoteCount: linkedQuotes.length,
    sectionId: section.sectionId,
    sectionTitle: section.sectionTitle,
    status:
      blockers.length > 0
        ? "blocked"
        : evidenceReferenceCount > 0 && citationPlaceholders.length > 0
          ? "ready"
          : "needs_review",
    traceReferenceCount: evidenceReferenceCount,
    warnings
  };
}

function getExportRiskLevel({
  blockers,
  citationReadinessScore,
  evidenceCoverageScore,
  traceCompletenessScore,
  warnings
}: {
  blockers: string[];
  citationReadinessScore: number;
  evidenceCoverageScore: number;
  traceCompletenessScore: number;
  warnings: string[];
}): SavedDraftArtifactExportRiskLevel {
  if (
    blockers.length > 0 ||
    citationReadinessScore < 40 ||
    evidenceCoverageScore < 40 ||
    traceCompletenessScore < 40
  ) {
    return "high";
  }

  if (
    warnings.length > 0 ||
    citationReadinessScore < 80 ||
    evidenceCoverageScore < 80 ||
    traceCompletenessScore < 80
  ) {
    return "medium";
  }

  return "low";
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
