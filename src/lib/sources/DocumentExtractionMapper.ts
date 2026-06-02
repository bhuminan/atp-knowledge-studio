import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionStatus,
  ExtractionTrace,
  ExtractionWarning,
  FileIntakeJob,
  SourceDocument
} from "../../types/domain";

export type DocumentExtractionReadiness =
  | "blocked"
  | "needs_review"
  | "ready_for_source_document_candidate";

export interface DocumentExtractionMappingInput {
  fileIntakeJob: FileIntakeJob;
  extraction: DocumentTextExtraction;
  segments?: DocumentSegment[];
  traces?: ExtractionTrace[];
  projectId?: string;
  indexedAt?: string;
}

export interface DocumentExtractionReadinessSummary {
  readiness: DocumentExtractionReadiness;
  canCreateSourceDocumentCandidate: boolean;
  confidenceScore: number;
  extractionStatus: ExtractionStatus;
  warningCount: number;
  traceWarningCount: number;
  segmentCount: number;
  traceCount: number;
  notes: string[];
  warnings: ExtractionWarning[];
}

const lowConfidenceThreshold = 70;

export function documentExtractionToSourceDocumentCandidate({
  extraction,
  fileIntakeJob,
  indexedAt,
  projectId = "project-product-service",
  segments = [],
  traces = []
}: DocumentExtractionMappingInput): Partial<SourceDocument> {
  const readinessSummary = summarizeDocumentExtractionReadiness({
    extraction,
    fileIntakeJob,
    segments,
    traces
  });

  return {
    id: `candidate-document-${fileIntakeJob.id}`,
    projectId,
    title: createCandidateTitle(fileIntakeJob),
    fileName: fileIntakeJob.fileName,
    fileType: fileIntakeJob.fileType,
    metadata: {
      title: createCandidateTitle(fileIntakeJob),
      author: "Metadata required",
      year: "Metadata required",
      doiOrUrl: "Metadata required",
      publisher: "Metadata required",
      completeness: "missing"
    },
    citationReadiness: "missing_metadata",
    chapterRelevance: "medium",
    indexedAt: indexedAt ?? fileIntakeJob.createdAt,
    parserStatus: "mock_needs_review",
    summaryPreview: createSummaryPreview({
      extraction,
      readinessSummary,
      segments,
      traces
    }),
    linkedChapterSections: []
  };
}

export function summarizeDocumentExtractionReadiness({
  extraction,
  fileIntakeJob,
  segments = [],
  traces = []
}: Omit<DocumentExtractionMappingInput, "indexedAt" | "projectId">): DocumentExtractionReadinessSummary {
  const traceWarnings = getExtractionTraceWarnings(segments, traces);
  const warnings = [
    ...extraction.extractionWarnings,
    ...traceWarnings,
    ...getReadinessWarnings(fileIntakeJob, extraction)
  ];
  const extractionBlocked = isExtractionBlocked(extraction.extractionStatus);
  const confidenceBlocked = extraction.confidenceScore < lowConfidenceThreshold;
  const hasUsableText = hasText(extraction.cleanedText) || hasText(extraction.rawText);
  const canCreateSourceDocumentCandidate =
    !extractionBlocked && hasUsableText && !confidenceBlocked;

  return {
    readiness: getReadiness({
      canCreateSourceDocumentCandidate,
      confidenceBlocked,
      extractionBlocked,
      hasWarnings: warnings.length > 0
    }),
    canCreateSourceDocumentCandidate,
    confidenceScore: extraction.confidenceScore,
    extractionStatus: extraction.extractionStatus,
    warningCount: warnings.length,
    traceWarningCount: traceWarnings.length,
    segmentCount: segments.length,
    traceCount: traces.length,
    notes: createReadinessNotes({
      canCreateSourceDocumentCandidate,
      confidenceBlocked,
      extraction,
      extractionBlocked,
      fileIntakeJob,
      hasUsableText,
      segments,
      traces
    }),
    warnings
  };
}

export function getExtractionTraceWarnings(
  segments: DocumentSegment[],
  traces: ExtractionTrace[]
): ExtractionWarning[] {
  const warnings: ExtractionWarning[] = [];
  const tracedSegmentIds = new Set(traces.map((trace) => trace.segmentId));
  const traceReferences = new Set(
    traces.map(
      (trace) =>
        `${trace.sourceDocumentId}:${trace.pageNumber}:${trace.segmentId}:${trace.chunkReference}`
    )
  );

  if (segments.length === 0) {
    warnings.push(
      createExtractionWarning(
        "trace-warning-no-segments",
        "missing_metadata",
        "warning",
        "No document segments are available for section-level traceability.",
        "segments"
      )
    );
  }

  if (traces.length === 0) {
    warnings.push(
      createExtractionWarning(
        "trace-warning-no-traces",
        "missing_metadata",
        "critical",
        "No page or chunk traces are available; evidence use must be blocked until traceability is restored.",
        "traces"
      )
    );
  }

  segments.forEach((segment) => {
    if (!tracedSegmentIds.has(segment.segmentId)) {
      warnings.push(
        createExtractionWarning(
          `trace-warning-untraced-${segment.segmentId}`,
          "missing_metadata",
          "warning",
          `Segment "${segment.title}" has no extraction trace.`,
          "segmentId"
        )
      );
    }

    if (segment.pageStart <= 0 || segment.pageEnd <= 0 || segment.pageEnd < segment.pageStart) {
      warnings.push(
        createExtractionWarning(
          `trace-warning-pages-${segment.segmentId}`,
          "corrupted_content",
          "warning",
          `Segment "${segment.title}" has invalid page range metadata.`,
          "pageStart"
        )
      );
    }
  });

  traces.forEach((trace, index) => {
    if (!hasText(trace.chunkReference)) {
      warnings.push(
        createExtractionWarning(
          `trace-warning-empty-chunk-${index}`,
          "missing_metadata",
          "warning",
          "Extraction trace is missing a chunk reference.",
          "chunkReference"
        )
      );
    }

    if (trace.pageNumber <= 0) {
      warnings.push(
        createExtractionWarning(
          `trace-warning-page-${index}`,
          "corrupted_content",
          "warning",
          "Extraction trace has an invalid page number.",
          "pageNumber"
        )
      );
    }
  });

  if (traceReferences.size < traces.length) {
    warnings.push(
      createExtractionWarning(
        "trace-warning-duplicate-traces",
        "corrupted_content",
        "warning",
        "Duplicate extraction traces were detected.",
        "traces"
      )
    );
  }

  return warnings;
}

function getReadinessWarnings(
  fileIntakeJob: FileIntakeJob,
  extraction: DocumentTextExtraction
): ExtractionWarning[] {
  const warnings: ExtractionWarning[] = [];

  if (isExtractionBlocked(extraction.extractionStatus)) {
    warnings.push(
      createExtractionWarning(
        `readiness-warning-status-${fileIntakeJob.id}`,
        "unknown",
        "critical",
        `Extraction status is "${extraction.extractionStatus}", so SourceDocument candidate creation should remain blocked.`,
        "extractionStatus"
      )
    );
  }

  if (extraction.confidenceScore < lowConfidenceThreshold) {
    warnings.push(
      createExtractionWarning(
        `readiness-warning-confidence-${fileIntakeJob.id}`,
        "low_confidence",
        "critical",
        `Extraction confidence ${extraction.confidenceScore}% is below the ${lowConfidenceThreshold}% review threshold.`,
        "confidenceScore"
      )
    );
  }

  if (!hasText(extraction.cleanedText) && !hasText(extraction.rawText)) {
    warnings.push(
      createExtractionWarning(
        `readiness-warning-empty-text-${fileIntakeJob.id}`,
        "corrupted_content",
        "critical",
        "Extraction has no usable raw or cleaned text.",
        "cleanedText"
      )
    );
  }

  return warnings;
}

function createReadinessNotes({
  canCreateSourceDocumentCandidate,
  confidenceBlocked,
  extraction,
  extractionBlocked,
  fileIntakeJob,
  hasUsableText,
  segments,
  traces
}: {
  canCreateSourceDocumentCandidate: boolean;
  confidenceBlocked: boolean;
  extraction: DocumentTextExtraction;
  extractionBlocked: boolean;
  fileIntakeJob: FileIntakeJob;
  hasUsableText: boolean;
  segments: DocumentSegment[];
  traces: ExtractionTrace[];
}): string[] {
  return [
    "Pure mapping preview only; no file IO, parser, Tauri command, storage, or SourceDocument write has run.",
    "Candidate must remain review-required and must never be treated as citation-ready automatically.",
    `fileIntakeJobId: ${fileIntakeJob.id}`,
    `fileName: ${fileIntakeJob.fileName}`,
    `fileType: ${fileIntakeJob.fileType}`,
    `mimeType: ${fileIntakeJob.mimeType}`,
    `fileSize: ${fileIntakeJob.fileSize}`,
    `extractionStatus: ${extraction.extractionStatus}`,
    `confidenceScore: ${extraction.confidenceScore}`,
    `segments: ${segments.length}`,
    `traces: ${traces.length}`,
    `hasUsableText: ${hasUsableText}`,
    `extractionBlocked: ${extractionBlocked}`,
    `confidenceBlocked: ${confidenceBlocked}`,
    `canCreateSourceDocumentCandidate: ${canCreateSourceDocumentCandidate}`
  ];
}

function createSummaryPreview({
  extraction,
  readinessSummary,
  segments,
  traces
}: {
  extraction: DocumentTextExtraction;
  readinessSummary: DocumentExtractionReadinessSummary;
  segments: DocumentSegment[];
  traces: ExtractionTrace[];
}): string {
  const sourceText = extraction.cleanedText || extraction.rawText;
  const textPreview = sourceText.trim().slice(0, 220);
  const preview = textPreview || "No extracted text preview is available.";

  return [
    preview,
    `[MAPPING PREVIEW - review required] readiness=${readinessSummary.readiness}; confidence=${readinessSummary.confidenceScore}; segments=${segments.length}; traces=${traces.length}; warnings=${readinessSummary.warningCount}.`
  ].join(" ");
}

function createCandidateTitle(fileIntakeJob: FileIntakeJob): string {
  return fileIntakeJob.fileName.replace(/\.[^.]+$/, "") || fileIntakeJob.fileName;
}

function getReadiness({
  canCreateSourceDocumentCandidate,
  confidenceBlocked,
  extractionBlocked,
  hasWarnings
}: {
  canCreateSourceDocumentCandidate: boolean;
  confidenceBlocked: boolean;
  extractionBlocked: boolean;
  hasWarnings: boolean;
}): DocumentExtractionReadiness {
  if (extractionBlocked || confidenceBlocked) {
    return "blocked";
  }

  if (canCreateSourceDocumentCandidate && !hasWarnings) {
    return "ready_for_source_document_candidate";
  }

  return "needs_review";
}

function isExtractionBlocked(extractionStatus: ExtractionStatus): boolean {
  return (
    extractionStatus === "queued" ||
    extractionStatus === "extracting" ||
    extractionStatus === "failed" ||
    extractionStatus === "not_started"
  );
}

function createExtractionWarning(
  warningId: string,
  code: ExtractionWarning["code"],
  severity: ExtractionWarning["severity"],
  message: string,
  field?: string
): ExtractionWarning {
  return {
    warningId,
    code,
    severity,
    message,
    field
  };
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}
