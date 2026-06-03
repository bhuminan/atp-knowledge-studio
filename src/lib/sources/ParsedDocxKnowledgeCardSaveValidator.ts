import type { KnowledgeCardSaveCandidate } from "../../types/domain";

export type ParsedDocxKnowledgeCardSaveParserSource = "real_docx_parser_mvp";

export interface ParsedDocxKnowledgeCardSaveValidationInput {
  approvedMarketingTagCount: number;
  candidates: KnowledgeCardSaveCandidate[];
  linkedSavedSourceCardId: string | null;
  linkedSavedSourceDocumentId: string | null;
  parserSource: ParsedDocxKnowledgeCardSaveParserSource | string;
  sourceType: "DOCX" | string;
}

export interface ParsedDocxKnowledgeCardSaveCandidateSummary {
  candidateId: string;
  cardType: KnowledgeCardSaveCandidate["cardType"];
  chunkReference: string | null;
  citationReadiness: KnowledgeCardSaveCandidate["citationReadiness"];
  validationStatus: KnowledgeCardSaveCandidate["validationStatus"];
}

export interface ParsedDocxKnowledgeCardSaveValidation {
  allPageNumbersUntrusted: boolean;
  blockers: string[];
  candidateSummaries: ParsedDocxKnowledgeCardSaveCandidateSummary[];
  explicitSaveOnly: true;
  noFinalCitationReadiness: boolean;
  parserSource: ParsedDocxKnowledgeCardSaveParserSource | string;
  traceReferenceCount: number;
  validationWarnings: string[];
}

export function validateParsedDocxKnowledgeCardSave({
  approvedMarketingTagCount,
  candidates,
  linkedSavedSourceCardId,
  linkedSavedSourceDocumentId,
  parserSource,
  sourceType
}: ParsedDocxKnowledgeCardSaveValidationInput): ParsedDocxKnowledgeCardSaveValidation {
  const blockers: string[] = [];
  const validationWarnings: string[] = [];

  if (!linkedSavedSourceDocumentId?.trim()) {
    blockers.push("Saved parsed-DOCX SourceDocument link is required.");
  }

  if (!linkedSavedSourceCardId?.trim()) {
    blockers.push("Saved parsed-DOCX SourceCard link is required.");
  }

  if (approvedMarketingTagCount === 0) {
    blockers.push("Approved parsed-DOCX MarketingTags are required.");
  }

  if (sourceType !== "DOCX") {
    blockers.push("Parsed DOCX KnowledgeCard sourceType must remain DOCX.");
  }

  if (parserSource !== "real_docx_parser_mvp") {
    blockers.push(
      "Parsed DOCX KnowledgeCard parserSource must be real_docx_parser_mvp."
    );
  }

  if (candidates.length === 0) {
    blockers.push("At least one parsed-DOCX KnowledgeCard candidate is required.");
  }

  const candidateSummaries = candidates.map((candidate) => ({
    candidateId: candidate.candidateId,
    cardType: candidate.cardType,
    chunkReference: candidate.traceReference?.chunkReference ?? null,
    citationReadiness: candidate.citationReadiness,
    validationStatus: candidate.validationStatus
  }));
  const traceReferenceCount = candidateSummaries.filter(
    (candidate) => candidate.chunkReference
  ).length;
  const allPageNumbersUntrusted = candidates.every(
    (candidate) => candidate.traceReference?.pageNumberTrusted === false
  );
  const noFinalCitationReadiness = candidates.every(
    (candidate) =>
      candidate.citationReadiness === "needs_review" &&
      candidate.validationStatus === "needs_review"
  );

  if (traceReferenceCount !== candidates.length) {
    blockers.push(
      "Every parsed-DOCX KnowledgeCard candidate requires a trace/chunk reference."
    );
  }

  if (!allPageNumbersUntrusted) {
    blockers.push("DOCX page numbers must not be treated as trusted.");
  }

  if (!noFinalCitationReadiness) {
    blockers.push(
      "Parsed DOCX KnowledgeCards must remain needs_review and must not imply final citation readiness."
    );
  }

  if (
    linkedSavedSourceCardId &&
    candidates.some(
      (candidate) =>
        candidate.derivedFrom.sourceCardSaveCandidateId !== linkedSavedSourceCardId
    )
  ) {
    blockers.push("KnowledgeCard candidates must link to the saved SourceCard ID.");
  }

  validationWarnings.push(
    "Explicit save only; parsed DOCX KnowledgeCards are not auto-saved."
  );
  validationWarnings.push(
    "Human academic review is still required after save."
  );
  validationWarnings.push(
    "No fabricated concepts, findings, quotes, cases, or citations are implied."
  );

  return {
    allPageNumbersUntrusted,
    blockers,
    candidateSummaries,
    explicitSaveOnly: true,
    noFinalCitationReadiness,
    parserSource,
    traceReferenceCount,
    validationWarnings
  };
}
