import { invoke } from "@tauri-apps/api/core";
import type { DocxExportPackagePreview } from "./DraftArtifactExportPackageMapper";

export interface ExportDocxResult {
  blockers: string[];
  exportStatus: string;
  exported: boolean;
  fileName: string;
  filePath: string;
  packageId: string;
  warnings: string[];
}

export async function exportDocxFromDraftArtifactPackage(
  packagePreview: DocxExportPackagePreview
): Promise<ExportDocxResult> {
  return invoke<ExportDocxResult>("export_docx_from_draft_artifact_package", {
    request: { package: packagePreview }
  });
}
