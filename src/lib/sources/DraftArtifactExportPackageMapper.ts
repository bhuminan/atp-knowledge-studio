import type { SavedDraftArtifactDetail } from "../persistence/LocalVaultDatabase";
import type {
  SavedDraftArtifactExportRiskLevel,
  SavedDraftArtifactReviewGate,
  SavedDraftArtifactReviewStatus
} from "./SavedDraftArtifactReviewMapper";

export type DocxExportPackageStatus = "ready" | "needs_review" | "blocked";

export interface DocxExportSectionPreview {
  citationPlaceholderCount: number;
  evidenceReferenceCount: number;
  hasContent: boolean;
  linkedCaseIds: string[];
  linkedEvidenceIds: string[];
  linkedQuoteIds: string[];
  mockParagraph: string;
  mockParagraphPreview: string;
  sectionId: string;
  sectionTitle: string;
  warnings: string[];
}

export interface DocxExportReadinessChecklistItem {
  label: string;
  passed: boolean;
  note: string;
}

export interface DocxEvidenceTraceSummary {
  linkedKnowledgeCardCount: number;
  sectionCount: number;
  sectionsWithEvidence: number;
  sectionsWithTraceLikeReferences: number;
  traceCompletenessScore: number;
  usesUntrustedDocxPageNumbers: boolean;
}

export interface DocxExportPackagePreview {
  blockers: string[];
  citationPlaceholders: string[];
  draftArtifactId: string;
  evidenceTraceSummary: DocxEvidenceTraceSummary;
  exportPackageId: string;
  exportReadinessChecklist: DocxExportReadinessChecklistItem[];
  exportRiskLevel: SavedDraftArtifactExportRiskLevel;
  exportStatus: DocxExportPackageStatus;
  recommendedNextAction: string;
  sectionsForExport: DocxExportSectionPreview[];
  title: string;
  unresolvedWarnings: string[];
}

export function createDraftArtifactDocxExportPackagePreview({
  detail,
  review
}: {
  detail: SavedDraftArtifactDetail;
  review: SavedDraftArtifactReviewGate;
}): DocxExportPackagePreview {
  const sectionsForExport = detail.sections.map((section) => {
    const citationPlaceholders = parseJsonArray(section.citationPlaceholdersJson);
    const linkedCaseIds = parseJsonArray(section.linkedCaseIdsJson);
    const linkedEvidenceIds = parseJsonArray(section.linkedEvidenceIdsJson);
    const linkedQuoteIds = parseJsonArray(section.linkedQuoteIdsJson);
    const warnings = parseJsonArray(section.warningsJson);

    return {
      citationPlaceholderCount: citationPlaceholders.length,
      evidenceReferenceCount:
        linkedEvidenceIds.length + linkedQuoteIds.length + linkedCaseIds.length,
      hasContent: section.mockParagraph.trim().length > 0,
      linkedCaseIds,
      linkedEvidenceIds,
      linkedQuoteIds,
      mockParagraph: section.mockParagraph,
      mockParagraphPreview: section.mockParagraph.slice(0, 220),
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitle,
      warnings
    };
  });
  const citationPlaceholders = detail.sections.flatMap((section) =>
    parseJsonArray(section.citationPlaceholdersJson)
  );
  const sectionsWithEvidence = sectionsForExport.filter(
    (section) => section.evidenceReferenceCount > 0
  ).length;
  const usesUntrustedDocxPageNumbers = true;
  const blockers = [...review.blockers];
  const unresolvedWarnings = dedupe([
    ...review.citationWarnings,
    ...review.traceWarnings,
    ...review.evidenceWarnings,
    ...review.missingKnowledgeCardLinks,
    ...(citationPlaceholders.length > 0
      ? ["Citation placeholders remain and must not be treated as final APA citations."]
      : ["No citation placeholders were found; citation planning needs review."]),
    "DOCX page numbers are untrusted; this preview uses chunk/section trace context only."
  ]);
  const exportStatus = getExportStatus({
    blockers,
    citationPlaceholders,
    reviewStatus: review.overallStatus,
    usesUntrustedDocxPageNumbers
  });
  const exportReadinessChecklist = createChecklist({
    detail,
    exportStatus,
    review,
    sectionsForExport
  });

  return {
    blockers,
    citationPlaceholders: dedupe(citationPlaceholders),
    draftArtifactId: detail.draftArtifact.draftArtifactId,
    evidenceTraceSummary: {
      linkedKnowledgeCardCount: detail.knowledgeCards.length,
      sectionCount: detail.sections.length,
      sectionsWithEvidence,
      sectionsWithTraceLikeReferences: sectionsWithEvidence,
      traceCompletenessScore: review.traceCompletenessScore,
      usesUntrustedDocxPageNumbers
    },
    exportPackageId: `docx-export-package-${detail.draftArtifact.draftArtifactId}`,
    exportReadinessChecklist,
    exportRiskLevel: review.exportRiskLevel,
    exportStatus,
    recommendedNextAction: getRecommendedNextAction(exportStatus),
    sectionsForExport,
    title: detail.draftArtifact.title,
    unresolvedWarnings
  };
}

function getExportStatus({
  blockers,
  citationPlaceholders,
  reviewStatus,
  usesUntrustedDocxPageNumbers
}: {
  blockers: string[];
  citationPlaceholders: string[];
  reviewStatus: SavedDraftArtifactReviewStatus;
  usesUntrustedDocxPageNumbers: boolean;
}): DocxExportPackageStatus {
  if (reviewStatus === "blocked" || blockers.length > 0) {
    return "blocked";
  }

  if (citationPlaceholders.length > 0 || usesUntrustedDocxPageNumbers) {
    return "needs_review";
  }

  return reviewStatus;
}

function createChecklist({
  detail,
  exportStatus,
  review,
  sectionsForExport
}: {
  detail: SavedDraftArtifactDetail;
  exportStatus: DocxExportPackageStatus;
  review: SavedDraftArtifactReviewGate;
  sectionsForExport: DocxExportSectionPreview[];
}): DocxExportReadinessChecklistItem[] {
  return [
    {
      label: "Saved mock DraftArtifact exists",
      note: detail.draftArtifact.mockOnly
        ? "Saved artifact is explicitly mock_only."
        : "Saved artifact is not marked mock_only.",
      passed: detail.draftArtifact.mockOnly
    },
    {
      label: "Not final manuscript",
      note: detail.draftArtifact.notFinal
        ? "Saved artifact remains not_final."
        : "Saved artifact is missing the not_final boundary.",
      passed: detail.draftArtifact.notFinal
    },
    {
      label: "Sections available",
      note: `${sectionsForExport.length} section(s) prepared for export preview.`,
      passed: sectionsForExport.length > 0
    },
    {
      label: "Evidence support available",
      note: `${review.evidenceCoverageScore}% evidence coverage score.`,
      passed: review.evidenceCoverageScore > 0
    },
    {
      label: "Citation placeholders reviewed",
      note: "Placeholders are not final APA citations.",
      passed: exportStatus === "ready"
    },
    {
      label: "DOCX page numbers verified",
      note: "DOCX page numbers remain untrusted in the current parser path.",
      passed: false
    }
  ];
}

function getRecommendedNextAction(status: DocxExportPackageStatus): string {
  if (status === "blocked") {
    return "Resolve review-gate blockers before creating an export package.";
  }

  if (status === "needs_review") {
    return "Review citation placeholders and DOCX trace limits before implementing real export.";
  }

  return "Proceed to a controlled DOCX export implementation spike without auto-saving final manuscripts.";
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
