import type {
  SaveKnowledgeCardsResult,
  SaveSourceCardResult,
  SaveSourceDocumentResult,
  SavedKnowledgeCardDetail,
  SavedKnowledgeCardListItem,
  SavedSourceCardDetail,
  SavedSourceDocumentDetail
} from "./LocalVaultDatabase";
import type { DraftArtifactSaveCandidate } from "../../types/domain";

export type DraftArtifactPersistenceReadinessStatus =
  | "ready_for_future_draft_artifact_save"
  | "needs_review"
  | "blocked";

export interface DraftArtifactPersistenceReadiness {
  blockers: string[];
  canSaveLater: boolean;
  citationReadiness: "ready" | "needs_review" | "blocked";
  draftArtifactCandidateId: string;
  draftArtifactPersistenceReadiness: DraftArtifactPersistenceReadinessStatus;
  linkedKnowledgeCardIds: string[];
  linkedSourceCardId: string | null;
  mockOnly: boolean;
  sectionCount: number;
  traceReadiness: "ready" | "needs_review" | "blocked";
  warnings: string[];
}

export interface DraftArtifactPersistenceReadinessInput {
  draftArtifactCandidate: DraftArtifactSaveCandidate;
  knowledgeCardsSaveResult: SaveKnowledgeCardsResult | null;
  savedKnowledgeCardDetail: SavedKnowledgeCardDetail | null;
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  savedSourceCardDetail: SavedSourceCardDetail | null;
  sourceCardSaveResult: SaveSourceCardResult | null;
  sourceDocumentSaveResult: SaveSourceDocumentResult | null;
  savedSourceDocumentDetail: SavedSourceDocumentDetail | null;
}

export function evaluateDraftArtifactPersistenceReadiness({
  draftArtifactCandidate,
  knowledgeCardsSaveResult,
  savedKnowledgeCardDetail,
  savedKnowledgeCards,
  savedSourceCardDetail,
  sourceCardSaveResult,
  sourceDocumentSaveResult,
  savedSourceDocumentDetail
}: DraftArtifactPersistenceReadinessInput): DraftArtifactPersistenceReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const linkedSourceCardId =
    sourceCardSaveResult?.saved && sourceCardSaveResult.sourceCardId
      ? sourceCardSaveResult.sourceCardId
      : savedSourceCardDetail?.sourceCard.sourceCardId ?? null;
  const linkedKnowledgeCardIds = savedKnowledgeCards.map(
    (card) => card.knowledgeCardId
  );

  if (!sourceDocumentSaveResult?.saved || !savedSourceDocumentDetail) {
    blockers.push("DraftArtifact persistence requires saved/readable SourceDocument data.");
  }

  if (!linkedSourceCardId || !sourceCardSaveResult?.saved || !savedSourceCardDetail) {
    blockers.push("DraftArtifact persistence requires a saved/readable SourceCard root.");
  }

  if (!knowledgeCardsSaveResult?.saved || linkedKnowledgeCardIds.length === 0) {
    blockers.push(
      "DraftArtifact persistence requires saved/readable KnowledgeCards first."
    );
  }

  if (draftArtifactCandidate.mockOnly || draftArtifactCandidate.notFinalDraft) {
    warnings.push(
      "DraftArtifact candidate is mock_only / not final and must be reviewed before any future save."
    );
  }

  if (draftArtifactCandidate.validationStatus !== "ready") {
    warnings.push(
      `DraftArtifact candidate validation is ${draftArtifactCandidate.validationStatus}.`
    );
  }

  const citationReadiness = deriveCitationReadiness(savedKnowledgeCards);
  const traceReadiness = deriveTraceReadiness(savedKnowledgeCards, savedKnowledgeCardDetail);

  if (citationReadiness !== "ready") {
    warnings.push("Citation readiness still needs review before draft persistence.");
  }

  if (traceReadiness !== "ready") {
    warnings.push("Trace readiness still needs review before draft persistence.");
  }

  const canSaveLater =
    blockers.length === 0 &&
    warnings.length === 0 &&
    citationReadiness === "ready" &&
    traceReadiness === "ready";

  return {
    blockers,
    canSaveLater,
    citationReadiness,
    draftArtifactCandidateId: draftArtifactCandidate.candidateId,
    draftArtifactPersistenceReadiness:
      blockers.length > 0
        ? "blocked"
        : canSaveLater
          ? "ready_for_future_draft_artifact_save"
          : "needs_review",
    linkedKnowledgeCardIds,
    linkedSourceCardId,
    mockOnly: draftArtifactCandidate.mockOnly,
    sectionCount: draftArtifactCandidate.sectionCount,
    traceReadiness,
    warnings
  };
}

function deriveCitationReadiness(
  savedKnowledgeCards: SavedKnowledgeCardListItem[]
): DraftArtifactPersistenceReadiness["citationReadiness"] {
  if (savedKnowledgeCards.length === 0) {
    return "blocked";
  }

  return savedKnowledgeCards.some((card) => card.citationReadiness === "blocked")
    ? "blocked"
    : savedKnowledgeCards.some((card) => card.citationReadiness === "needs_review")
      ? "needs_review"
      : "ready";
}

function deriveTraceReadiness(
  savedKnowledgeCards: SavedKnowledgeCardListItem[],
  savedKnowledgeCardDetail: SavedKnowledgeCardDetail | null
): DraftArtifactPersistenceReadiness["traceReadiness"] {
  if (savedKnowledgeCards.length === 0) {
    return "blocked";
  }

  if (savedKnowledgeCards.some((card) => card.traceCount === 0)) {
    return "needs_review";
  }

  if (savedKnowledgeCardDetail?.traces.some((trace) => !trace.pageNumberTrusted)) {
    return "needs_review";
  }

  return "ready";
}
