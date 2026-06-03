import type { SavedDraftArtifactDetail } from "../persistence/LocalVaultDatabase";
import type {
  DocxExportPackagePreview,
  DocxExportSectionPreview
} from "./DraftArtifactExportPackageMapper";
import {
  exportDocxFromDraftArtifactPackage,
  type ExportDocxResult
} from "./DocxExportService";
import type { ParsedDocxExportPackagePreview } from "./ParsedDocxExportPackageMapper";

export interface ParsedDocxExportMvpRequest {
  preview: ParsedDocxExportPackagePreview;
  savedDraftArtifact: SavedDraftArtifactDetail | null;
}

export function createParsedDocxGenericExportPackage({
  preview,
  savedDraftArtifact
}: ParsedDocxExportMvpRequest): DocxExportPackagePreview {
  const sectionsForExport =
    savedDraftArtifact?.sections.map(
      (section): DocxExportSectionPreview => {
        const linkedCaseIds = parseJsonArray(section.linkedCaseIdsJson);
        const linkedEvidenceIds = parseJsonArray(section.linkedEvidenceIdsJson);
        const linkedQuoteIds = parseJsonArray(section.linkedQuoteIdsJson);
        const citationPlaceholders = parseJsonArray(section.citationPlaceholdersJson);

        return {
          citationPlaceholderCount: citationPlaceholders.length,
          evidenceReferenceCount:
            linkedCaseIds.length + linkedEvidenceIds.length + linkedQuoteIds.length,
          hasContent: section.mockParagraph.trim().length > 0,
          linkedCaseIds,
          linkedEvidenceIds,
          linkedQuoteIds,
          mockParagraph: section.mockParagraph,
          mockParagraphPreview: section.mockParagraph.slice(0, 220),
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          warnings: parseJsonArray(section.warningsJson)
        };
      }
    ) ?? [];
  const citationPlaceholders =
    savedDraftArtifact?.sections.flatMap((section) =>
      parseJsonArray(section.citationPlaceholdersJson)
    ) ?? [];
  const sectionsWithEvidence = sectionsForExport.filter(
    (section) => section.evidenceReferenceCount > 0
  ).length;

  return {
    blockers: preview.blockers,
    citationPlaceholders,
    draftArtifactId: preview.draftArtifactId ?? "parsed-docx-draft-artifact-missing",
    evidenceTraceSummary: {
      linkedKnowledgeCardCount: savedDraftArtifact?.knowledgeCards.length ?? 0,
      sectionCount: preview.sectionCount,
      sectionsWithEvidence,
      sectionsWithTraceLikeReferences: sectionsWithEvidence,
      traceCompletenessScore: preview.exportPackageStatus === "blocked" ? 0 : 50,
      usesUntrustedDocxPageNumbers: true
    },
    exportPackageId: `parsed-docx-export-package-${preview.draftArtifactId ?? "missing"}`,
    exportReadinessChecklist: preview.checklist.map((item) => ({
      label: item.label,
      note: item.note,
      passed: item.passed
    })),
    exportRiskLevel: preview.exportRiskLevel,
    exportStatus: preview.exportPackageStatus,
    recommendedNextAction: preview.recommendedNextAction,
    sectionsForExport,
    title:
      savedDraftArtifact?.draftArtifact.title ??
      "Parsed DOCX DraftArtifact MVP export preview",
    unresolvedWarnings: [
      ...preview.unresolvedWarnings,
      "MVP export only — not final manuscript, not APA-final.",
      "Parsed DOCX output remains draft-only and mock/not-final."
    ]
  };
}

export async function exportParsedDocxDraftArtifactMvp(
  request: ParsedDocxExportMvpRequest
): Promise<ExportDocxResult> {
  const packagePreview = createParsedDocxGenericExportPackage(request);

  if (request.preview.exportPackageStatus === "blocked") {
    return {
      blockers: request.preview.blockers,
      exportStatus: "blocked",
      exported: false,
      exportedAt: "",
      fileName: "",
      filePath: "",
      fileSizeBytes: 0,
      packageId: packagePreview.exportPackageId,
      warnings: [
        ...request.preview.unresolvedWarnings,
        "Parsed DOCX MVP export is blocked until package blockers are resolved."
      ]
    };
  }

  return exportDocxFromDraftArtifactPackage(packagePreview);
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
