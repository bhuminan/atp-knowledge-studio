import type { ParsedDocxDraftArtifactSaveCandidate } from "./ParsedDocxDraftArtifactSaveCandidateMapper";

export interface ParsedDocxDraftArtifactSaveValidation {
  blockers: string[];
  canSave: boolean;
  explicitSaveOnly: true;
  linkedKnowledgeCardCount: number;
  mockNotFinal: boolean;
  sectionCount: number;
  traceReferenceCount: number;
  validationWarnings: string[];
}

export function validateParsedDocxDraftArtifactSave(
  candidate: ParsedDocxDraftArtifactSaveCandidate | null
): ParsedDocxDraftArtifactSaveValidation {
  const blockers: string[] = [];
  const validationWarnings: string[] = [
    "Explicit save only — DraftArtifact is not auto-saved and prose is not final.",
    "Saved parsed-DOCX DraftArtifact remains mock/not-final.",
    "No DOCX export or final manuscript readiness is implied."
  ];

  if (!candidate) {
    blockers.push("Parsed DOCX DraftArtifact save candidate is required.");

    return {
      blockers,
      canSave: false,
      explicitSaveOnly: true,
      linkedKnowledgeCardCount: 0,
      mockNotFinal: false,
      sectionCount: 0,
      traceReferenceCount: 0,
      validationWarnings
    };
  }

  blockers.push(...candidate.blockers);

  if (!candidate.sourceCardId?.trim()) {
    blockers.push("Saved parsed-DOCX SourceCard link is required.");
  }

  if (candidate.linkedKnowledgeCardIds.length === 0) {
    blockers.push("Saved parsed-DOCX KnowledgeCard links are required.");
  }

  if (candidate.sections.length === 0) {
    blockers.push("Parsed DOCX DraftArtifact section candidates are required.");
  }

  if (
    candidate.sections.some(
      (section) =>
        section.linkedEvidenceIds.length === 0 &&
        section.linkedQuoteIds.length === 0 &&
        section.linkedCaseIds.length === 0 &&
        section.mockParagraph.trim().length === 0
    )
  ) {
    blockers.push("Every parsed-DOCX draft section must link to evidence or trace text.");
  }

  if (!candidate.draftArtifact.mockOnly || !candidate.draftArtifact.notFinalDraft) {
    blockers.push("Parsed DOCX DraftArtifact save candidate must remain mock/not-final.");
  }

  if (candidate.draftArtifact.validationStatus === "ready") {
    blockers.push(
      "Parsed DOCX DraftArtifact save candidate must not imply final/export readiness."
    );
  }

  const traceReferenceCount = candidate.sections.filter((section) =>
    /Trace refs: (?!none)/.test(section.mockParagraph)
  ).length;

  if (traceReferenceCount === 0) {
    blockers.push("Parsed DOCX DraftArtifact save requires trace references.");
  }

  return {
    blockers: Array.from(new Set(blockers)),
    canSave: blockers.length === 0,
    explicitSaveOnly: true,
    linkedKnowledgeCardCount: candidate.linkedKnowledgeCardIds.length,
    mockNotFinal:
      candidate.draftArtifact.mockOnly && candidate.draftArtifact.notFinalDraft,
    sectionCount: candidate.sections.length,
    traceReferenceCount,
    validationWarnings
  };
}
