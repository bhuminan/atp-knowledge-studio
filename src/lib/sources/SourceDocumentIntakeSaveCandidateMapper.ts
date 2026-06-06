export type SourceDocumentIntakeFileType = "PDF" | "DOCX" | string;

export type SourceDocumentIntakeSaveCandidateReadiness =
  | "ready"
  | "needs_review"
  | "blocked";

export type SourceDocumentIntakeMetadataCompleteness =
  | "complete"
  | "incomplete"
  | "missing";

export type SourceDocumentIntakeReviewStatus =
  | "approved_for_source_document_preview"
  | "needs_review"
  | "blocked";

export type SourceDocumentIntakeSaveCandidateBlocker =
  | "missing_file_name"
  | "missing_file_path"
  | "missing_title"
  | "empty_file"
  | "file_extension_mismatch"
  | "unsupported_file_type"
  | "candidate_blocked"
  | "duplicate_candidate_detected";

export type SourceDocumentIntakeSaveCandidateWarning =
  | "metadata_incomplete"
  | "source_card_deferred"
  | "citation_metadata_not_final"
  | "apa_final_not_implied"
  | "parser_disabled"
  | "pdf_text_extraction_not_available_yet"
  | "docx_supported_for_current_text_preview";

export interface SourceDocumentIntakePackageCandidateInput {
  candidateId: string;
  duplicateStatus?: "not_checked" | "not_duplicate" | "duplicate_candidate_detected";
  fileName: string;
  fileSize?: number | null;
  fileSizeLabel?: string;
  fileType: SourceDocumentIntakeFileType;
  localPathReference?: string | null;
  metadataCompleteness: SourceDocumentIntakeMetadataCompleteness;
  reviewStatus: SourceDocumentIntakeReviewStatus;
  title?: string;
}

export interface SourceDocumentIntakePackageInput {
  candidates: SourceDocumentIntakePackageCandidateInput[];
  packageId: string;
  source: "INPUT Room";
}

export interface SourceDocumentIntakeSaveCandidateSafetyFlags {
  aiProcessed: false;
  classified: false;
  parsed: false;
  persisted: false;
  previewOnly: true;
  sourceCardCreated: false;
  sourceDocumentCreated: false;
}

export interface SourceDocumentIntakeSaveCandidate {
  blockers: SourceDocumentIntakeSaveCandidateBlocker[];
  candidateId: string;
  candidateSourceDocumentTitle: string;
  duplicateStatus: "not_checked" | "not_duplicate" | "duplicate_candidate_detected";
  fileSizeLabel?: string;
  intakeStatus: string;
  readinessStatus: SourceDocumentIntakeSaveCandidateReadiness;
  safetyFlags: SourceDocumentIntakeSaveCandidateSafetyFlags;
  sourceCardDeferred: true;
  sourceFileName: string;
  sourceType: SourceDocumentIntakeFileType;
  warnings: SourceDocumentIntakeSaveCandidateWarning[];
}

export interface SourceDocumentIntakeSaveCandidateSummary {
  blockedCount: number;
  needsReviewCount: number;
  readyCount: number;
  totalCount: number;
}

export interface SourceDocumentIntakeSaveCandidateValidation {
  blockers: SourceDocumentIntakeSaveCandidateBlocker[];
  warnings: SourceDocumentIntakeSaveCandidateWarning[];
}

export interface SourceDocumentIntakeSaveCandidatePreview {
  candidates: SourceDocumentIntakeSaveCandidate[];
  packageId: string;
  safetyFlags: SourceDocumentIntakeSaveCandidateSafetyFlags;
  source: "INPUT Room";
  summary: SourceDocumentIntakeSaveCandidateSummary;
  validation: SourceDocumentIntakeSaveCandidateValidation;
}

const supportedSourceDocumentFileTypes = new Set(["PDF", "DOCX"]);

const previewOnlySafetyFlags: SourceDocumentIntakeSaveCandidateSafetyFlags = {
  aiProcessed: false,
  classified: false,
  parsed: false,
  persisted: false,
  previewOnly: true,
  sourceCardCreated: false,
  sourceDocumentCreated: false
};

export function createSourceDocumentIntakeSaveCandidatePreview(
  incomingPackage: SourceDocumentIntakePackageInput
): SourceDocumentIntakeSaveCandidatePreview {
  const candidates = incomingPackage.candidates.map(mapIncomingCandidate);

  return {
    candidates,
    packageId: incomingPackage.packageId,
    safetyFlags: previewOnlySafetyFlags,
    source: incomingPackage.source,
    summary: summarizeCandidates(candidates),
    validation: {
      blockers: uniqueList(candidates.flatMap((candidate) => candidate.blockers)),
      warnings: uniqueList(candidates.flatMap((candidate) => candidate.warnings))
    }
  };
}

function mapIncomingCandidate(
  candidate: SourceDocumentIntakePackageCandidateInput
): SourceDocumentIntakeSaveCandidate {
  const normalizedFileType = candidate.fileType.trim().toUpperCase();
  const fileName = candidate.fileName.trim();
  const title = candidate.title?.trim() ?? "";
  const blockers = createCandidateBlockers({
    duplicateStatus: candidate.duplicateStatus ?? "not_checked",
    fileName,
    fileType: normalizedFileType,
    fileSize: candidate.fileSize,
    localPathReference: candidate.localPathReference,
    reviewStatus: candidate.reviewStatus,
    title
  });
  const warnings = createCandidateWarnings({
    fileType: normalizedFileType,
    metadataCompleteness: candidate.metadataCompleteness
  });
  const readinessStatus = getReadinessStatus({ blockers, warnings });

  return {
    blockers,
    candidateId: candidate.candidateId,
    candidateSourceDocumentTitle: title || "Title review required",
    duplicateStatus: candidate.duplicateStatus ?? "not_checked",
    fileSizeLabel: candidate.fileSizeLabel,
    intakeStatus:
      readinessStatus === "blocked"
        ? "blocked from SourceDocument preview"
        : readinessStatus === "needs_review"
          ? "needs review before future SourceDocument save"
          : "ready for future SourceDocument preview",
    readinessStatus,
    safetyFlags: previewOnlySafetyFlags,
    sourceCardDeferred: true,
    sourceFileName: fileName || "Missing file name",
    sourceType: normalizedFileType || "UNKNOWN",
    warnings
  };
}

function createCandidateBlockers({
  duplicateStatus,
  fileName,
  fileType,
  fileSize,
  localPathReference,
  reviewStatus,
  title
}: {
  duplicateStatus: "not_checked" | "not_duplicate" | "duplicate_candidate_detected";
  fileName: string;
  fileType: string;
  fileSize?: number | null;
  localPathReference?: string | null;
  reviewStatus: SourceDocumentIntakeReviewStatus;
  title: string;
}): SourceDocumentIntakeSaveCandidateBlocker[] {
  const blockers: SourceDocumentIntakeSaveCandidateBlocker[] = [];

  if (!fileName) {
    blockers.push("missing_file_name");
  }

  if (!title) {
    blockers.push("missing_title");
  }

  if (!supportedSourceDocumentFileTypes.has(fileType)) {
    blockers.push("unsupported_file_type");
  }

  const extension = getFileExtension(fileName);
  if (!extension) {
    blockers.push("unsupported_file_type");
  } else if (extension !== "pdf" && extension !== "docx") {
    blockers.push("unsupported_file_type");
  } else if (fileType && extension.toUpperCase() !== fileType) {
    blockers.push("file_extension_mismatch");
  }

  if (fileSize === 0) {
    blockers.push("empty_file");
  }

  if (localPathReference !== undefined && !localPathReference?.trim()) {
    blockers.push("missing_file_path");
  }

  if (reviewStatus === "blocked") {
    blockers.push("candidate_blocked");
  }

  if (duplicateStatus === "duplicate_candidate_detected") {
    blockers.push("duplicate_candidate_detected");
  }

  return blockers;
}

function createCandidateWarnings({
  fileType,
  metadataCompleteness
}: {
  fileType: string;
  metadataCompleteness: SourceDocumentIntakeMetadataCompleteness;
}): SourceDocumentIntakeSaveCandidateWarning[] {
  const warnings: SourceDocumentIntakeSaveCandidateWarning[] = [
    "source_card_deferred",
    "citation_metadata_not_final",
    "apa_final_not_implied",
    "parser_disabled"
  ];

  if (metadataCompleteness !== "complete") {
    warnings.unshift("metadata_incomplete");
  }

  if (fileType === "PDF") {
    warnings.push("pdf_text_extraction_not_available_yet");
  }

  if (fileType === "DOCX") {
    warnings.push("docx_supported_for_current_text_preview");
  }

  return warnings;
}

function getReadinessStatus({
  blockers,
  warnings
}: {
  blockers: SourceDocumentIntakeSaveCandidateBlocker[];
  warnings: SourceDocumentIntakeSaveCandidateWarning[];
}): SourceDocumentIntakeSaveCandidateReadiness {
  if (blockers.length > 0) {
    return "blocked";
  }

  if (warnings.includes("metadata_incomplete")) {
    return "needs_review";
  }

  return "ready";
}

function summarizeCandidates(
  candidates: SourceDocumentIntakeSaveCandidate[]
): SourceDocumentIntakeSaveCandidateSummary {
  return {
    blockedCount: candidates.filter((candidate) => candidate.readinessStatus === "blocked")
      .length,
    needsReviewCount: candidates.filter(
      (candidate) => candidate.readinessStatus === "needs_review"
    ).length,
    readyCount: candidates.filter((candidate) => candidate.readinessStatus === "ready")
      .length,
    totalCount: candidates.length
  };
}

function uniqueList<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}
