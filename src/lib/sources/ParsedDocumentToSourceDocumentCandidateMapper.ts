import type {
  DocumentSegment,
  ExtractionTrace,
  ExtractionWarning,
  FileIntakeJob,
  SourceDocument
} from "../../types/domain";
import type { DocumentExtractionResponse } from "./LocalDocumentExtraction";
import type { LocalDocumentFileIntakeJob } from "./LocalDocumentFilePicker";
import {
  summarizeDocumentExtractionReadiness,
  type DocumentExtractionReadinessSummary
} from "./DocumentExtractionMapper";

export type ParsedDocumentParserSource = "real_docx_parser_mvp";

export interface ParsedDocumentParserProvenance {
  localPathPolicy: "local_path_reference_only";
  pageNumberPolicy: "docx_page_numbers_untrusted";
  parserSource: ParsedDocumentParserSource;
  sourceType: "DOCX";
  tracePolicy: "chunk_references_only";
}

export interface ParsedDocumentSourceDocumentCandidatePreview {
  candidate: Partial<SourceDocument>;
  evidenceTraces: ExtractionTrace[];
  extractionSegments: DocumentSegment[];
  parserProvenance: ParsedDocumentParserProvenance;
  readiness: DocumentExtractionReadinessSummary;
  warnings: ExtractionWarning[];
}

export function mapParsedDocxToSourceDocumentCandidate({
  extractionResponse,
  selectedLocalFile
}: {
  extractionResponse: DocumentExtractionResponse;
  selectedLocalFile?: LocalDocumentFileIntakeJob | null;
}): ParsedDocumentSourceDocumentCandidatePreview {
  const fileIntakeJob = createFileIntakeJob(extractionResponse, selectedLocalFile);
  const readiness = summarizeDocumentExtractionReadiness({
    extraction: extractionResponse.extraction,
    fileIntakeJob,
    segments: extractionResponse.segments,
    traces: extractionResponse.traces
  });
  const title = createCandidateTitle(fileIntakeJob.fileName);
  const warnings = createWarnings(extractionResponse, readiness);

  return {
    candidate: {
      id: `candidate-document-${fileIntakeJob.id}`,
      projectId: "project-product-service",
      title,
      fileName: fileIntakeJob.fileName,
      fileType: "DOCX",
      metadata: {
        completeness: "missing",
        title
      },
      citationReadiness: "missing_metadata",
      chapterRelevance: "medium",
      indexedAt: fileIntakeJob.createdAt,
      parserStatus: "mock_needs_review",
      summaryPreview: createSummaryPreview(extractionResponse),
      linkedChapterSections: []
    },
    evidenceTraces: extractionResponse.traces,
    extractionSegments: extractionResponse.segments,
    parserProvenance: {
      localPathPolicy: "local_path_reference_only",
      pageNumberPolicy: "docx_page_numbers_untrusted",
      parserSource: "real_docx_parser_mvp",
      sourceType: "DOCX",
      tracePolicy: "chunk_references_only"
    },
    readiness,
    warnings
  };
}

function createFileIntakeJob(
  extractionResponse: DocumentExtractionResponse,
  selectedLocalFile?: LocalDocumentFileIntakeJob | null
): FileIntakeJob {
  const file = selectedLocalFile ?? extractionResponse.fileIntakeJob;

  return {
    createdAt: file.createdAt,
    fileName: file.fileName,
    fileSize: file.fileSize,
    fileType: "DOCX",
    id: file.id,
    mimeType: file.mimeType,
    status: extractionResponse.extraction.extractionStatus
  };
}

function createCandidateTitle(fileName: string): string {
  return fileName
    .replace(/\.(docx)$/i, "")
    .split(/[-_]/g)
    .filter(Boolean)
    .join(" ")
    .trim() || "DOCX metadata review required";
}

function createSummaryPreview(extractionResponse: DocumentExtractionResponse): string {
  const text =
    extractionResponse.extraction.cleanedText || extractionResponse.extraction.rawText;
  const summary = text.trim().replace(/\s+/g, " ").slice(0, 180);

  return summary
    ? `${summary}${text.length > summary.length ? "..." : ""}`
    : "Parsed DOCX text is empty or unavailable.";
}

function createWarnings(
  extractionResponse: DocumentExtractionResponse,
  readiness: DocumentExtractionReadinessSummary
): ExtractionWarning[] {
  const pageNumberWarning: ExtractionWarning = {
    warningId: `parsed-docx-page-policy-${extractionResponse.extraction.documentId}`,
    code: "missing_metadata",
    severity: "warning",
    message:
      "DOCX page numbers are not trusted; review evidence by chunk references such as docx:pN.",
    field: "pageNumber"
  };

  return dedupeWarnings([
    pageNumberWarning,
    ...extractionResponse.parserWarnings,
    ...readiness.warnings
  ]);
}

function dedupeWarnings(warnings: ExtractionWarning[]): ExtractionWarning[] {
  const seen = new Set<string>();

  return warnings.filter((warning) => {
    const key = `${warning.warningId}:${warning.code}:${warning.field ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
