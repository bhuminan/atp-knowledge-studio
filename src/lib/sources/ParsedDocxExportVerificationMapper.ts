import type { ExportDocxResult } from "./DocxExportService";
import type { ParsedDocxExportPackagePreview } from "./ParsedDocxExportPackageMapper";

export interface ParsedDocxExportVerificationSummary {
  blockers: string[];
  citationPlaceholderWarningPresent: boolean;
  docxPageNumberWarningPresent: boolean;
  exportedFileMetadataReady: boolean;
  exportResultStatus: "not_run" | "exported" | "blocked";
  fileNameAvailable: boolean;
  filePathAvailable: boolean;
  fileSizeAvailable: boolean;
  manualVerificationWarning: string;
  packageStatus: ParsedDocxExportPackagePreview["exportPackageStatus"];
  timestampAvailable: boolean;
  warningCount: number;
  warnings: string[];
}

export function summarizeParsedDocxExportVerification({
  preview,
  result
}: {
  preview: ParsedDocxExportPackagePreview;
  result: ExportDocxResult | null;
}): ParsedDocxExportVerificationSummary {
  const warnings = [...preview.unresolvedWarnings, ...(result?.warnings ?? [])];
  const blockers = [...preview.blockers, ...(result?.blockers ?? [])];
  const fileNameAvailable = Boolean(result?.fileName);
  const filePathAvailable = Boolean(result?.filePath);
  const fileSizeAvailable = (result?.fileSizeBytes ?? 0) > 0;
  const timestampAvailable = Boolean(result?.exportedAt);

  return {
    blockers: dedupe(blockers),
    citationPlaceholderWarningPresent: warnings.some((warning) =>
      warning.toLowerCase().includes("citation placeholder")
    ),
    docxPageNumberWarningPresent: warnings.some((warning) =>
      warning.toLowerCase().includes("page number")
    ),
    exportedFileMetadataReady:
      Boolean(result?.exported) &&
      fileNameAvailable &&
      filePathAvailable &&
      fileSizeAvailable &&
      timestampAvailable,
    exportResultStatus: result?.exported
      ? "exported"
      : result
        ? "blocked"
        : "not_run",
    fileNameAvailable,
    filePathAvailable,
    fileSizeAvailable,
    manualVerificationWarning: "Verify this DOCX manually before academic use.",
    packageStatus: preview.exportPackageStatus,
    timestampAvailable,
    warningCount: warnings.length,
    warnings: dedupe(warnings)
  };
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
