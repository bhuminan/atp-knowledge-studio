import type {
  DocumentSegment,
  ExtractionTrace,
  SaveCandidateValidationStatus,
  SourceCardSaveCandidate
} from "../../types/domain";
import type { SavedSourceDocumentDetail } from "../persistence/LocalVaultDatabase";
import {
  validateParsedDocxSourceCardSave,
  type ParsedDocxSourceCardSaveValidation
} from "./ParsedDocxSourceCardSaveValidator";

export type ParsedDocxSourceCardParserSource = "real_docx_parser_mvp";

export interface ParsedDocxSourceCardReadinessSummary {
  blockers: string[];
  citationReadinessWarning: string;
  linkedSavedSourceDocumentId: string;
  metadataStatus: SourceCardSaveCandidate["metadataStatus"];
  missingMetadataFields: string[];
  pageNumberWarning: string;
  parserSource: ParsedDocxSourceCardParserSource;
  sourceType: "DOCX";
  validation: ParsedDocxSourceCardSaveValidation;
  validationStatus: SaveCandidateValidationStatus;
  warnings: string[];
}

export interface ParsedDocxSourceCardCandidatePreview {
  candidate: SourceCardSaveCandidate;
  readiness: ParsedDocxSourceCardReadinessSummary;
}

export function mapSavedParsedDocxSourceDocumentToSourceCardCandidate({
  savedSourceDocument,
  segments,
  traces
}: {
  savedSourceDocument: SavedSourceDocumentDetail;
  segments?: DocumentSegment[];
  traces?: ExtractionTrace[];
}): ParsedDocxSourceCardCandidatePreview {
  const sourceDocumentId = savedSourceDocument.sourceDocument.sourceDocumentId;
  const title = createCandidateTitle(savedSourceDocument);
  const missingMetadataFields = ["authors", "year", "citationText"];
  const warnings = createWarnings({
    segmentCount: segments?.length ?? savedSourceDocument.segments.length,
    traceCount: traces?.length ?? savedSourceDocument.traces.length
  });
  const blockers = title.trim() ? [] : ["Parsed DOCX SourceCard title is empty."];
  const validationStatus: SaveCandidateValidationStatus =
    blockers.length > 0 ? "blocked" : "needs_review";
  const citationText =
    "Citation metadata required; APA 7 citation has not been generated.";
  const candidate: SourceCardSaveCandidate = {
    candidateId: `save-candidate-candidate-source-card-${sourceDocumentId}`,
    citationReadiness: "needs_review",
    citationText,
    createdFrom: "source_card_candidate_preview",
    derivedFrom: {
      sourceCardCandidateId: `candidate-source-card-${sourceDocumentId}`,
      sourceDocumentSaveCandidateId: sourceDocumentId
    },
    fileReference: savedSourceDocument.sourceDocument.fileName,
    metadataStatus: "needs_metadata",
    notPersisted: true,
    review: {
      reviewedAt: "preview-only-not-persisted",
      reviewer: "local_mock_user",
      reviewStatus: "needs_review"
    },
    sourceType: "DOCX",
    title,
    validationStatus
  };
  const validation = validateParsedDocxSourceCardSave({
    candidate,
    linkedSavedSourceDocumentId: sourceDocumentId,
    parserSource: "real_docx_parser_mvp"
  });

  return {
    candidate,
    readiness: {
      blockers: [...blockers, ...validation.blockers],
      citationReadinessWarning:
        "Citation is not final; author, year, and APA citation text require human review.",
      linkedSavedSourceDocumentId: sourceDocumentId,
      metadataStatus: "needs_metadata",
      missingMetadataFields,
      pageNumberWarning:
        "DOCX page numbers remain untrusted; use chunk references from the saved SourceDocument.",
      parserSource: "real_docx_parser_mvp",
      sourceType: "DOCX",
      validation,
      validationStatus,
      warnings: [...warnings, ...validation.validationWarnings]
    }
  };
}

function createCandidateTitle(savedSourceDocument: SavedSourceDocumentDetail): string {
  return (
    savedSourceDocument.sourceDocument.title ||
    savedSourceDocument.sourceDocument.fileName.replace(/\.docx$/i, "") ||
    "DOCX metadata review required"
  ).trim();
}

function createWarnings({
  segmentCount,
  traceCount
}: {
  segmentCount: number;
  traceCount: number;
}): string[] {
  const warnings = [
    "SourceCard candidate is derived from an explicitly saved parsed-DOCX SourceDocument.",
    "Bibliographic metadata is incomplete and must not be treated as citation-ready.",
    "DOCX page numbers are not trusted; evidence remains chunk-reference based."
  ];

  if (segmentCount === 0) {
    warnings.push("Saved parsed-DOCX SourceDocument has no extraction segments.");
  }

  if (traceCount === 0) {
    warnings.push("Saved parsed-DOCX SourceDocument has no evidence traces.");
  }

  return warnings;
}
