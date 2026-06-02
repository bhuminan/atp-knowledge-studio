import type { SourceCardSaveCandidate } from "../../types/domain";
import type {
  SavedSourceDocumentDetail,
  SavedSourceDocumentListItem,
  SaveSourceDocumentResult
} from "./LocalVaultDatabase";

export type SourceCardPersistenceReadinessStatus =
  | "ready_for_future_source_card_save"
  | "needs_metadata_review"
  | "blocked";

export interface SourceCardPersistenceReadiness {
  blockers: string[];
  canSaveLater: boolean;
  citationReadiness: SourceCardSaveCandidate["citationReadiness"];
  linkedSourceDocumentId: string | null;
  metadataReadiness: SourceCardSaveCandidate["metadataStatus"];
  sourceCardCandidateId: string;
  sourceCardPersistenceReadiness: SourceCardPersistenceReadinessStatus;
  warnings: string[];
}

export interface SourceCardPersistenceReadinessInput {
  savedSourceDocumentDetail: SavedSourceDocumentDetail | null;
  savedSourceDocuments: SavedSourceDocumentListItem[];
  sourceCardCandidate: SourceCardSaveCandidate;
  sourceDocumentSaveResult: SaveSourceDocumentResult | null;
}

export function evaluateSourceCardPersistenceReadiness({
  savedSourceDocumentDetail,
  savedSourceDocuments,
  sourceCardCandidate,
  sourceDocumentSaveResult
}: SourceCardPersistenceReadinessInput): SourceCardPersistenceReadiness {
  const linkedSourceDocumentId = sourceDocumentSaveResult?.saved
    ? sourceDocumentSaveResult.sourceDocumentId
    : null;
  const matchingSavedListItem = linkedSourceDocumentId
    ? savedSourceDocuments.find(
        (savedDocument) => savedDocument.sourceDocumentId === linkedSourceDocumentId
      )
    : undefined;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!linkedSourceDocumentId) {
    blockers.push(
      "SourceCard persistence requires a saved SourceDocument root before any future SourceCard save."
    );
  }

  if (!matchingSavedListItem || !savedSourceDocumentDetail) {
    blockers.push(
      "Saved SourceDocument must be listed and readable before SourceCard persistence can proceed."
    );
  }

  if (savedSourceDocumentDetail?.sourceDocument.sourceDocumentId !== linkedSourceDocumentId) {
    blockers.push(
      "Readable SourceDocument detail does not match the SourceCard candidate's linked SourceDocument."
    );
  }

  if (sourceCardCandidate.validationStatus === "blocked") {
    blockers.push("Blocked SourceCard candidate cannot become a future saved SourceCard.");
  }

  if (sourceCardCandidate.metadataStatus === "blocked") {
    blockers.push("SourceCard metadata is blocked.");
  } else if (sourceCardCandidate.metadataStatus === "needs_metadata") {
    warnings.push(
      "SourceCard citation metadata is incomplete and must be reviewed before real save."
    );
  }

  if (sourceCardCandidate.citationReadiness === "blocked") {
    blockers.push("SourceCard citation readiness is blocked.");
  } else if (sourceCardCandidate.citationReadiness === "needs_review") {
    warnings.push(
      "SourceCard citation text is preview-only and still needs citation review."
    );
  }

  if (
    savedSourceDocumentDetail?.sourceDocument.fileType === "DOCX" &&
    savedSourceDocumentDetail.traces.some((trace) => !trace.pageNumberTrusted)
  ) {
    warnings.push(
      "Linked DOCX SourceDocument uses chunk references; page numbers are not trusted."
    );
  }

  const canSaveLater =
    blockers.length === 0 &&
    sourceCardCandidate.metadataStatus === "ready" &&
    sourceCardCandidate.citationReadiness === "ready";
  const sourceCardPersistenceReadiness =
    blockers.length > 0
      ? "blocked"
      : canSaveLater
        ? "ready_for_future_source_card_save"
        : "needs_metadata_review";

  return {
    blockers,
    canSaveLater,
    citationReadiness: sourceCardCandidate.citationReadiness,
    linkedSourceDocumentId,
    metadataReadiness: sourceCardCandidate.metadataStatus,
    sourceCardCandidateId: sourceCardCandidate.candidateId,
    sourceCardPersistenceReadiness,
    warnings
  };
}
