import type { SavedSourceDocumentRecord } from "../persistence/LocalVaultDatabase";

export type SourceDocumentMetadataReadinessStatus =
  | "ready_for_metadata_review"
  | "needs_bibliographic_metadata"
  | "blocked_insufficient_root_data";

export interface SourceDocumentMetadataReadinessPreview {
  blockers: string[];
  passedChecks: string[];
  status: SourceDocumentMetadataReadinessStatus;
  statusLabel: string;
  warnings: string[];
}

export function evaluateSourceDocumentMetadataReadiness(
  detail: SavedSourceDocumentRecord
): SourceDocumentMetadataReadinessPreview {
  const passedChecks: string[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (detail.sourceDocumentId.trim()) {
    passedChecks.push("Saved root record exists");
    passedChecks.push("Read-back verified by SourceDocument root read");
  } else {
    blockers.push("Missing SourceDocument id");
  }

  if (detail.title.trim()) {
    passedChecks.push("Title present");
  } else {
    blockers.push("Missing title");
  }

  if (detail.fileName.trim()) {
    passedChecks.push("File name present");
  } else {
    blockers.push("Missing file name");
  }

  if (detail.fileType.trim()) {
    passedChecks.push("Source type/file type present");
  } else {
    blockers.push("Missing source type/file type");
  }

  if (detail.createdFromCandidateId.trim()) {
    passedChecks.push("Candidate id / intake provenance present");
  } else {
    warnings.push("Candidate id / intake provenance not available");
  }

  passedChecks.push("SourceCard not created yet");

  if (detail.citationReadiness === "missing_metadata") {
    warnings.push("Needs bibliographic metadata review");
  } else if (detail.citationReadiness.trim()) {
    warnings.push(
      `Citation readiness is ${detail.citationReadiness}; verify before SourceCard metadata review`
    );
  } else {
    warnings.push("Citation metadata not verified");
  }

  warnings.push("APA-final not verified");
  warnings.push(
    "Authors, year, DOI, journal, publisher, citation text, and APA reference are not inferred"
  );
  warnings.push("SourceCard creation remains deferred");

  if (blockers.length > 0) {
    return {
      blockers,
      passedChecks,
      status: "blocked_insufficient_root_data",
      statusLabel: "Blocked: essential SourceDocument fields missing",
      warnings
    };
  }

  if (warnings.some((warning) => warning.includes("Needs bibliographic metadata"))) {
    return {
      blockers,
      passedChecks,
      status: "needs_bibliographic_metadata",
      statusLabel: "Needs bibliographic metadata review",
      warnings
    };
  }

  return {
    blockers,
    passedChecks,
    status: "ready_for_metadata_review",
    statusLabel: "Ready for metadata review",
    warnings
  };
}
