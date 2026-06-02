import {
  documentExtractionToSourceDocumentCandidate,
  getExtractionTraceWarnings,
  summarizeDocumentExtractionReadiness,
  type DocumentExtractionReadiness,
  type DocumentExtractionReadinessSummary
} from "../../lib/sources/DocumentExtractionMapper";
import type { ExtractionWarning, SourceDocument } from "../../types/domain";
import { mockDocumentExtractionRecords } from "./documentExtractions";

export interface MockDocumentExtractionMappingResult {
  fileIntakeJobId: string;
  fileName: string;
  scenarioLabel: string;
  readiness: DocumentExtractionReadiness;
  sourceDocumentCandidate: Partial<SourceDocument>;
  readinessSummary: DocumentExtractionReadinessSummary;
  traceWarnings: ExtractionWarning[];
  previewOnly: true;
  safetyNotes: string[];
}

export interface MockDocumentExtractionReadinessSummaryItem {
  fileIntakeJobId: string;
  fileName: string;
  scenarioLabel: string;
  readiness: DocumentExtractionReadiness;
  canCreateSourceDocumentCandidate: boolean;
  candidateId?: string;
  confidenceScore: number;
  extractionStatus: string;
  segmentCount: number;
  traceCount: number;
  warningCount: number;
  traceWarningCount: number;
  previewOnly: true;
}

export const mockDocumentExtractionMappingResults: MockDocumentExtractionMappingResult[] =
  mockDocumentExtractionRecords.map((record) => {
    const sourceDocumentCandidate =
      documentExtractionToSourceDocumentCandidate(record);
    const readinessSummary = summarizeDocumentExtractionReadiness(record);
    const traceWarnings = getExtractionTraceWarnings(
      record.segments ?? [],
      record.traces ?? []
    );

    return {
      fileIntakeJobId: record.fileIntakeJob.id,
      fileName: record.fileIntakeJob.fileName,
      scenarioLabel: record.scenarioLabel,
      readiness: readinessSummary.readiness,
      sourceDocumentCandidate,
      readinessSummary,
      traceWarnings,
      previewOnly: true,
      safetyNotes: [
        "Smoke-test mapping result only; no SourceDocument record is created.",
        "No parser, file IO, Tauri command, persistence, or AI provider call has run.",
        "Candidate remains review-required and must not be treated as citation-ready."
      ]
    };
  });

export const mockDocumentExtractionReadinessSummary: MockDocumentExtractionReadinessSummaryItem[] =
  mockDocumentExtractionMappingResults.map((result) => ({
    fileIntakeJobId: result.fileIntakeJobId,
    fileName: result.fileName,
    scenarioLabel: result.scenarioLabel,
    readiness: result.readiness,
    canCreateSourceDocumentCandidate:
      result.readinessSummary.canCreateSourceDocumentCandidate,
    candidateId: result.sourceDocumentCandidate.id,
    confidenceScore: result.readinessSummary.confidenceScore,
    extractionStatus: result.readinessSummary.extractionStatus,
    segmentCount: result.readinessSummary.segmentCount,
    traceCount: result.readinessSummary.traceCount,
    warningCount: result.readinessSummary.warningCount,
    traceWarningCount: result.readinessSummary.traceWarningCount,
    previewOnly: true
  }));
