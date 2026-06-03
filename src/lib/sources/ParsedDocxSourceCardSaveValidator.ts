import type { SourceCardSaveCandidate } from "../../types/domain";

export type ParsedDocxSourceCardSaveParserSource = "real_docx_parser_mvp";

export interface ParsedDocxSourceCardSaveValidationInput {
  candidate: SourceCardSaveCandidate;
  linkedSavedSourceDocumentId: string | null;
  parserSource: ParsedDocxSourceCardSaveParserSource | string;
}

export interface ParsedDocxSourceCardSaveValidation {
  blockers: string[];
  explicitSaveOnly: true;
  missingMetadataFields: string[];
  noFabricatedCitation: boolean;
  parserSource: ParsedDocxSourceCardSaveParserSource | string;
  validationWarnings: string[];
}

const metadataRequiredCitationText =
  "Citation metadata required; APA 7 citation has not been generated.";

export function validateParsedDocxSourceCardSave({
  candidate,
  linkedSavedSourceDocumentId,
  parserSource
}: ParsedDocxSourceCardSaveValidationInput): ParsedDocxSourceCardSaveValidation {
  const blockers: string[] = [];
  const validationWarnings: string[] = [];

  if (!linkedSavedSourceDocumentId?.trim()) {
    blockers.push("Saved parsed-DOCX SourceDocument link is required.");
  }

  if (!candidate.title.trim()) {
    blockers.push("Parsed DOCX SourceCard title is required before save.");
  }

  if (candidate.sourceType !== "DOCX") {
    blockers.push("Parsed DOCX SourceCard sourceType must remain DOCX.");
  }

  if (parserSource !== "real_docx_parser_mvp") {
    blockers.push("Parsed DOCX SourceCard parserSource must be real_docx_parser_mvp.");
  }

  if (candidate.metadataStatus !== "needs_metadata") {
    blockers.push(
      "Parsed DOCX SourceCard metadataStatus must remain needs_metadata while bibliographic metadata is incomplete."
    );
  }

  if (candidate.citationReadiness !== "needs_review") {
    blockers.push(
      "Parsed DOCX SourceCard citationReadiness must remain needs_review until citation metadata is explicitly reviewed."
    );
  }

  if (candidate.citationText !== metadataRequiredCitationText) {
    blockers.push("Parsed DOCX SourceCard must not imply a generated APA citation.");
  }

  if (candidate.validationStatus === "blocked") {
    blockers.push("Blocked parsed DOCX SourceCard candidate cannot be saved.");
  }

  validationWarnings.push(
    "Explicit save only; parsed DOCX SourceCard is not auto-saved."
  );
  validationWarnings.push(
    "Author, year, and citation text are unresolved and need human review."
  );
  validationWarnings.push(
    "APA citation is not final; no citation-ready status is implied."
  );

  return {
    blockers,
    explicitSaveOnly: true,
    missingMetadataFields: ["authors", "year", "citationText"],
    noFabricatedCitation: candidate.citationText === metadataRequiredCitationText,
    parserSource,
    validationWarnings
  };
}
