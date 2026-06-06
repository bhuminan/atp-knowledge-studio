import type {
  SourceDocumentIntakeSaveCandidate,
  SourceDocumentIntakeSaveCandidateBlocker,
  SourceDocumentIntakeSaveCandidateWarning
} from "./SourceDocumentIntakeSaveCandidateMapper";

export type SourceDocumentIntakeReadinessStatus =
  | "ready"
  | "needs_review"
  | "blocked";

export type SourceDocumentIntakeWriterReadiness =
  | "not_ready"
  | "limited"
  | "candidate";

export type SourceDocumentIntakeExtractionReadiness =
  | "none"
  | "metadata_only"
  | "text_preview_available";

export type SourceDocumentIntakeDuplicateRisk =
  | "none"
  | "possible_duplicate"
  | "duplicate_blocked";

export interface SourceDocumentIntakeReadinessInput {
  blockers?: string[];
  duplicateStatus?: "not_checked" | "not_duplicate" | "duplicate_candidate_detected";
  fileName?: string;
  fileSize?: number | null;
  fileType?: string | null;
  hasTextPreview?: boolean;
  metadataCompleteness?: "complete" | "incomplete" | "missing";
  readinessStatus?: "ready" | "needs_review" | "blocked";
  reviewRequired?: boolean;
  title?: string;
  warnings?: string[];
}

export interface SourceDocumentIntakeReadinessPreview {
  blockerCount: number;
  blockers: string[];
  duplicateRisk: SourceDocumentIntakeDuplicateRisk;
  extractionReadiness: SourceDocumentIntakeExtractionReadiness;
  positiveSignals: string[];
  recommendedNextAction: string;
  score: number;
  status: SourceDocumentIntakeReadinessStatus;
  warningCount: number;
  warnings: string[];
  writerReadiness: SourceDocumentIntakeWriterReadiness;
}

const hardFileBlockers = new Set([
  "missing_file_path",
  "missing_file_name",
  "unreadable_file",
  "empty_file"
]);

export function createSourceDocumentIntakeReadinessPreview(
  input: SourceDocumentIntakeReadinessInput
): SourceDocumentIntakeReadinessPreview {
  const blockers = uniqueList(input.blockers ?? []);
  const warnings = uniqueList(input.warnings ?? []);
  const fileType = (input.fileType ?? "").trim().toUpperCase();
  const duplicateRisk = getDuplicateRisk(input.duplicateStatus, blockers);
  const extractionReadiness = getExtractionReadiness({
    blockers,
    fileType,
    hasTextPreview: input.hasTextPreview,
    warnings
  });
  const writerReadiness = getWriterReadiness({
    blockers,
    duplicateRisk,
    extractionReadiness
  });
  const score = scoreReadiness({
    blockers,
    duplicateRisk,
    extractionReadiness,
    fileType,
    input,
    warnings
  });
  const status = getStatus({ blockers, score, writerReadiness });

  return {
    blockerCount: blockers.length,
    blockers,
    duplicateRisk,
    extractionReadiness,
    positiveSignals: getPositiveSignals({
      blockers,
      duplicateRisk,
      extractionReadiness,
      fileType,
      input,
      writerReadiness
    }),
    recommendedNextAction: getRecommendedNextAction({
      blockers,
      duplicateRisk,
      extractionReadiness,
      status,
      writerReadiness
    }),
    score,
    status,
    warningCount: warnings.length,
    warnings,
    writerReadiness
  };
}

export function createSourceDocumentIntakeReadinessPreviewFromCandidate(
  candidate: SourceDocumentIntakeSaveCandidate
): SourceDocumentIntakeReadinessPreview {
  return createSourceDocumentIntakeReadinessPreview({
    blockers: candidate.blockers,
    duplicateStatus: candidate.duplicateStatus,
    fileName: candidate.sourceFileName,
    fileType: candidate.sourceType,
    readinessStatus: candidate.readinessStatus,
    title: candidate.candidateSourceDocumentTitle,
    warnings: candidate.warnings
  });
}

function getDuplicateRisk(
  duplicateStatus:
    | SourceDocumentIntakeReadinessInput["duplicateStatus"]
    | undefined,
  blockers: string[]
): SourceDocumentIntakeDuplicateRisk {
  if (
    duplicateStatus === "duplicate_candidate_detected" ||
    blockers.includes("duplicate_candidate_detected")
  ) {
    return "duplicate_blocked";
  }

  if (duplicateStatus === "not_checked") {
    return "possible_duplicate";
  }

  return "none";
}

function getExtractionReadiness({
  blockers,
  fileType,
  hasTextPreview,
  warnings
}: {
  blockers: string[];
  fileType: string;
  hasTextPreview?: boolean;
  warnings: string[];
}): SourceDocumentIntakeExtractionReadiness {
  if (
    blockers.some((blocker) => hardFileBlockers.has(blocker)) ||
    blockers.includes("unsupported_file_type") ||
    blockers.includes("file_extension_mismatch")
  ) {
    return "none";
  }

  if (
    hasTextPreview ||
    fileType === "DOCX" ||
    warnings.includes("docx_supported_for_current_text_preview")
  ) {
    return "text_preview_available";
  }

  if (
    fileType === "PDF" ||
    warnings.includes("pdf_text_extraction_not_available_yet")
  ) {
    return "metadata_only";
  }

  return "none";
}

function getWriterReadiness({
  blockers,
  duplicateRisk,
  extractionReadiness
}: {
  blockers: string[];
  duplicateRisk: SourceDocumentIntakeDuplicateRisk;
  extractionReadiness: SourceDocumentIntakeExtractionReadiness;
}): SourceDocumentIntakeWriterReadiness {
  if (blockers.length > 0 || duplicateRisk === "duplicate_blocked") {
    return "not_ready";
  }

  if (extractionReadiness === "text_preview_available") {
    return "candidate";
  }

  if (extractionReadiness === "metadata_only") {
    return "limited";
  }

  return "not_ready";
}

function scoreReadiness({
  blockers,
  duplicateRisk,
  extractionReadiness,
  fileType,
  input,
  warnings
}: {
  blockers: string[];
  duplicateRisk: SourceDocumentIntakeDuplicateRisk;
  extractionReadiness: SourceDocumentIntakeExtractionReadiness;
  fileType: string;
  input: SourceDocumentIntakeReadinessInput;
  warnings: string[];
}): number {
  let score = 100;

  if (input.readinessStatus === "blocked" || blockers.length > 0) {
    score -= 45;
  }

  if (duplicateRisk === "duplicate_blocked") {
    score -= 50;
  } else if (duplicateRisk === "possible_duplicate") {
    score -= 8;
  }

  if (blockers.includes("unsupported_file_type")) {
    score -= 45;
  }

  if (blockers.includes("file_extension_mismatch")) {
    score -= 35;
  }

  if (blockers.some((blocker) => hardFileBlockers.has(blocker))) {
    score -= 40;
  }

  if (warnings.includes("pdf_text_extraction_not_available_yet")) {
    score -= 35;
  }

  if (extractionReadiness === "none") {
    score -= 20;
  } else if (extractionReadiness === "metadata_only") {
    score -= 15;
  }

  if (
    warnings.includes("metadata_incomplete") ||
    input.metadataCompleteness === "incomplete"
  ) {
    score -= 15;
  }

  if (input.metadataCompleteness === "missing") {
    score -= 25;
  }

  if (input.reviewRequired || input.readinessStatus === "needs_review") {
    score -= 10;
  }

  if (warnings.includes("parser_disabled")) {
    score -= fileType === "PDF" ? 5 : 3;
  }

  score -= Math.min(Math.max(warnings.length - 2, 0) * 3, 18);

  return clampScore(score);
}

function getStatus({
  blockers,
  score,
  writerReadiness
}: {
  blockers: string[];
  score: number;
  writerReadiness: SourceDocumentIntakeWriterReadiness;
}): SourceDocumentIntakeReadinessStatus {
  if (blockers.length > 0) {
    return "blocked";
  }

  if (writerReadiness !== "candidate" || score < 70) {
    return "needs_review";
  }

  return "ready";
}

function getPositiveSignals({
  blockers,
  duplicateRisk,
  extractionReadiness,
  fileType,
  input,
  writerReadiness
}: {
  blockers: string[];
  duplicateRisk: SourceDocumentIntakeDuplicateRisk;
  extractionReadiness: SourceDocumentIntakeExtractionReadiness;
  fileType: string;
  input: SourceDocumentIntakeReadinessInput;
  writerReadiness: SourceDocumentIntakeWriterReadiness;
}): string[] {
  const signals: string[] = [];

  if (blockers.length === 0) {
    signals.push("no_hard_blockers");
  }

  if (duplicateRisk === "none") {
    signals.push("duplicate_guard_clear");
  }

  if (fileType === "PDF" || fileType === "DOCX") {
    signals.push("supported_file_type");
  }

  if (input.fileSize && input.fileSize > 0) {
    signals.push("non_empty_file");
  }

  if (input.title?.trim()) {
    signals.push("title_available");
  }

  if (extractionReadiness === "text_preview_available") {
    signals.push("text_preview_available");
  }

  if (writerReadiness === "candidate") {
    signals.push("writer_candidate_material");
  }

  return signals;
}

function getRecommendedNextAction({
  blockers,
  duplicateRisk,
  extractionReadiness,
  status,
  writerReadiness
}: {
  blockers: string[];
  duplicateRisk: SourceDocumentIntakeDuplicateRisk;
  extractionReadiness: SourceDocumentIntakeExtractionReadiness;
  status: SourceDocumentIntakeReadinessStatus;
  writerReadiness: SourceDocumentIntakeWriterReadiness;
}): string {
  if (status === "blocked") {
    if (duplicateRisk === "duplicate_blocked") {
      return "Reject this duplicate candidate or review the existing SourceDocument.";
    }

    if (blockers.includes("unsupported_file_type")) {
      return "Use a supported PDF or DOCX file before intake can continue.";
    }

    return "Resolve blockers before SourceDocument intake-save is available.";
  }

  if (extractionReadiness === "metadata_only") {
    return "Save only after review; PDF Deep Intake text extraction is not available yet.";
  }

  if (writerReadiness === "candidate") {
    return "Candidate can proceed to SourceDocument intake-save preview; Deep Intake records remain deferred.";
  }

  return "Review metadata and extraction signals before intake-save.";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function uniqueList<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export type SourceDocumentIntakeReadinessKnownBlocker =
  SourceDocumentIntakeSaveCandidateBlocker;

export type SourceDocumentIntakeReadinessKnownWarning =
  SourceDocumentIntakeSaveCandidateWarning;
