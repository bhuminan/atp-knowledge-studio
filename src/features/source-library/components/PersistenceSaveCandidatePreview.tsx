import { useState } from "react";
import {
  listSavedDraftArtifacts,
  listSavedDraftArtifactsForSourceCard,
  listSavedKnowledgeCards,
  listSavedMarketingTags,
  listSavedSourceCards,
  listSavedSourceDocuments,
  listSavedKnowledgeCardsForSourceCard,
  listSavedTagsForSourceCard,
  readSavedDraftArtifact,
  readSavedKnowledgeCard,
  readSavedSourceCard,
  readSavedSourceDocument,
  saveDraftArtifactCandidate,
  saveKnowledgeCardsForSourceCard,
  saveMarketingTagsForSourceCard,
  saveSourceCardCandidate,
  saveSourceDocumentCandidate,
  type SaveDraftArtifactResult,
  type SaveKnowledgeCardCandidateRequest,
  type SavedDraftArtifactDetail,
  type SavedDraftArtifactListItem,
  type SavedKnowledgeCardDetail,
  type SavedKnowledgeCardListItem,
  type SavedMarketingTagRecord,
  type SavedSourceCardDetail,
  type SavedSourceCardListItem,
  type SavedSourceCardTagRecord,
  type SavedSourceDocumentDetail,
  type SavedSourceDocumentListItem,
  type SaveMarketingTagCandidateRequest,
  type SaveMarketingTagsResult,
  type SaveKnowledgeCardsResult,
  type SaveSourceCardResult,
  type SaveSourceDocumentResult
} from "../../../lib/persistence/LocalVaultDatabase";
import {
  evaluateSourceCardPersistenceReadiness,
  type SourceCardPersistenceReadiness
} from "../../../lib/persistence/SourceCardPersistenceReadinessMapper";
import {
  evaluateDraftArtifactPersistenceReadiness,
  type DraftArtifactPersistenceReadiness
} from "../../../lib/persistence/DraftArtifactPersistenceReadinessMapper";
import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionTrace,
  KnowledgeCardSaveCandidate,
  MarketingTagSaveCandidate,
  PersistenceSaveCandidateBundle,
  SaveCandidateValidationStatus,
  SourceCardSaveCandidate
} from "../../../types/domain";
import { marketingTaxonomySeed } from "../../../data/taxonomy/marketingTaxonomySeed";
import { createPersistenceDryRunPreview } from "../../../lib/persistence/PersistenceDryRunService";
import {
  reviewSavedDraftArtifactForCitationAndEvidence,
  type SavedDraftArtifactReviewGate
} from "../../../lib/sources/SavedDraftArtifactReviewMapper";
import {
  createDraftArtifactDocxExportPackagePreview,
  type DocxExportPackagePreview
} from "../../../lib/sources/DraftArtifactExportPackageMapper";
import {
  mapSavedParsedDocxSourceDocumentToSourceCardCandidate,
  type ParsedDocxSourceCardCandidatePreview
} from "../../../lib/sources/ParsedDocxSourceCardCandidateMapper";
import {
  mapParsedDocxToMarketingTagCandidates,
  type ParsedDocxMarketingTagCandidate,
  type ParsedDocxMarketingTagCandidatePreview
} from "../../../lib/sources/ParsedDocxMarketingTagCandidateMapper";
import {
  mapParsedDocxToKnowledgeCardCandidates,
  type ParsedDocxKnowledgeCardCandidatePreview
} from "../../../lib/sources/ParsedDocxKnowledgeCardCandidateMapper";
import {
  validateParsedDocxKnowledgeCardSave,
  type ParsedDocxKnowledgeCardSaveValidation
} from "../../../lib/sources/ParsedDocxKnowledgeCardSaveValidator";
import {
  mapParsedDocxToDraftInputPackageReadiness,
  type ParsedDocxDraftInputPackageReadiness
} from "../../../lib/sources/ParsedDocxDraftInputPackageMapper";
import {
  mapParsedDocxToDraftArtifactCandidatePreview,
  type ParsedDocxDraftArtifactCandidatePreview
} from "../../../lib/sources/ParsedDocxDraftArtifactCandidateMapper";
import {
  mapParsedDocxToDraftArtifactSaveCandidate,
  type ParsedDocxDraftArtifactSaveCandidate
} from "../../../lib/sources/ParsedDocxDraftArtifactSaveCandidateMapper";
import {
  validateParsedDocxDraftArtifactSave,
  type ParsedDocxDraftArtifactSaveValidation
} from "../../../lib/sources/ParsedDocxDraftArtifactSaveValidator";
import {
  reviewParsedDocxDraftArtifactForCitationAndEvidence,
  type ParsedDocxDraftArtifactReviewGate
} from "../../../lib/sources/ParsedDocxDraftArtifactReviewMapper";
import {
  createParsedDocxExportPackagePreview,
  type ParsedDocxExportPackagePreview
} from "../../../lib/sources/ParsedDocxExportPackageMapper";
import {
  exportDocxFromDraftArtifactPackage,
  type ExportDocxResult
} from "../../../lib/sources/DocxExportService";
import { PersistenceDryRunPreview } from "./PersistenceDryRunPreview";
import { SummaryStat } from "./SourceLibraryPrimitives";

interface PersistenceSaveCandidatePreviewProps {
  bundle: PersistenceSaveCandidateBundle;
  extraction: DocumentTextExtraction;
  segments: DocumentSegment[];
  traces: ExtractionTrace[];
}

const statusLabels: Record<SaveCandidateValidationStatus, string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

type MarketingTagReviewDecision = "approved" | "needs_review" | "rejected";
type KnowledgeCardReviewDecision = "approved" | "needs_review" | "rejected";

export function PersistenceSaveCandidatePreview({
  bundle,
  extraction,
  segments,
  traces
}: PersistenceSaveCandidatePreviewProps) {
  const dryRunPreview = createPersistenceDryRunPreview(bundle);
  const isParsedDocxSourceDocumentCandidate =
    bundle.sourceDocumentCandidate.fileType === "DOCX";
  const parserSource = isParsedDocxSourceDocumentCandidate
    ? "real_docx_parser_mvp"
    : "mock_extraction_preview";
  const sourceDocumentSaveWarningCount =
    bundle.warnings.filter((warning) => warning.objectType === "source_document").length +
    bundle.sourceDocumentCandidate.traceReferences.filter(
      (trace) => !trace.pageNumberTrusted
    ).length;
  const [isSavingSourceDocument, setIsSavingSourceDocument] = useState(false);
  const [sourceDocumentSaveError, setSourceDocumentSaveError] = useState<string | null>(
    null
  );
  const [sourceDocumentSaveResult, setSourceDocumentSaveResult] =
    useState<SaveSourceDocumentResult | null>(null);
  const [isRefreshingSavedSourceDocuments, setIsRefreshingSavedSourceDocuments] =
    useState(false);
  const [savedSourceDocumentReadError, setSavedSourceDocumentReadError] = useState<
    string | null
  >(null);
  const [savedSourceDocuments, setSavedSourceDocuments] = useState<
    SavedSourceDocumentListItem[]
  >([]);
  const [savedSourceDocumentDetail, setSavedSourceDocumentDetail] =
    useState<SavedSourceDocumentDetail | null>(null);
  const [isSavingSourceCard, setIsSavingSourceCard] = useState(false);
  const [sourceCardSaveError, setSourceCardSaveError] = useState<string | null>(null);
  const [sourceCardSaveResult, setSourceCardSaveResult] =
    useState<SaveSourceCardResult | null>(null);
  const [savedSourceCards, setSavedSourceCards] = useState<SavedSourceCardListItem[]>(
    []
  );
  const [savedSourceCardDetail, setSavedSourceCardDetail] =
    useState<SavedSourceCardDetail | null>(null);
  const [isSavingMarketingTags, setIsSavingMarketingTags] = useState(false);
  const [marketingTagsSaveError, setMarketingTagsSaveError] = useState<string | null>(
    null
  );
  const [marketingTagsSaveResult, setMarketingTagsSaveResult] =
    useState<SaveMarketingTagsResult | null>(null);
  const [savedMarketingTags, setSavedMarketingTags] = useState<
    SavedMarketingTagRecord[]
  >([]);
  const [savedSourceCardTags, setSavedSourceCardTags] = useState<
    SavedSourceCardTagRecord[]
  >([]);
  const [parsedDocxMarketingTagReviewStatuses, setParsedDocxMarketingTagReviewStatuses] =
    useState<Record<string, MarketingTagReviewDecision>>({});
  const [parsedDocxKnowledgeCardReviewStatuses, setParsedDocxKnowledgeCardReviewStatuses] =
    useState<Record<string, KnowledgeCardReviewDecision>>({});
  const [isSavingKnowledgeCards, setIsSavingKnowledgeCards] = useState(false);
  const [knowledgeCardsSaveError, setKnowledgeCardsSaveError] = useState<string | null>(
    null
  );
  const [knowledgeCardsSaveResult, setKnowledgeCardsSaveResult] =
    useState<SaveKnowledgeCardsResult | null>(null);
  const [savedKnowledgeCards, setSavedKnowledgeCards] = useState<
    SavedKnowledgeCardListItem[]
  >([]);
  const [savedKnowledgeCardDetail, setSavedKnowledgeCardDetail] =
    useState<SavedKnowledgeCardDetail | null>(null);
  const [isSavingDraftArtifact, setIsSavingDraftArtifact] = useState(false);
  const [draftArtifactSaveError, setDraftArtifactSaveError] = useState<string | null>(
    null
  );
  const [draftArtifactSaveResult, setDraftArtifactSaveResult] =
    useState<SaveDraftArtifactResult | null>(null);
  const [savedDraftArtifacts, setSavedDraftArtifacts] = useState<
    SavedDraftArtifactListItem[]
  >([]);
  const [savedDraftArtifactDetail, setSavedDraftArtifactDetail] =
    useState<SavedDraftArtifactDetail | null>(null);

  async function handleSaveSourceDocument() {
    setIsSavingSourceDocument(true);
    setSourceDocumentSaveError(null);
    setSourceCardSaveError(null);
    setSourceCardSaveResult(null);
    setSavedSourceCards([]);
    setSavedSourceCardDetail(null);
    setMarketingTagsSaveError(null);
    setMarketingTagsSaveResult(null);
    setSavedMarketingTags([]);
    setSavedSourceCardTags([]);
    setParsedDocxMarketingTagReviewStatuses({});
    setParsedDocxKnowledgeCardReviewStatuses({});
    setKnowledgeCardsSaveError(null);
    setKnowledgeCardsSaveResult(null);
    setSavedKnowledgeCards([]);
    setSavedKnowledgeCardDetail(null);
    setDraftArtifactSaveError(null);
    setDraftArtifactSaveResult(null);
    setSavedDraftArtifacts([]);
    setSavedDraftArtifactDetail(null);

    try {
      if (isParsedDocxSourceDocumentCandidate && segments.length === 0) {
        setSourceDocumentSaveResult(null);
        setSourceDocumentSaveError(
          "Parsed DOCX SourceDocument save requires at least one extraction segment."
        );
        return;
      }

      if (isParsedDocxSourceDocumentCandidate && traces.length === 0) {
        setSourceDocumentSaveResult(null);
        setSourceDocumentSaveError(
          "Parsed DOCX SourceDocument save requires at least one evidence trace."
        );
        return;
      }

      if (isSourceLibraryQaModeEnabled()) {
        const qaResult = createQaSourceDocumentSaveResult({
          bundle,
          segments,
          traces
        });
        setSourceDocumentSaveResult(qaResult);
        setSavedSourceDocuments(
          createQaSavedSourceDocumentList({
            bundle,
            extraction,
            result: qaResult
          })
        );
        setSavedSourceDocumentDetail(
          createQaSavedSourceDocumentDetail({
            bundle,
            extraction,
            result: qaResult,
            segments,
            traces
          })
        );
        return;
      }

      const result = await saveSourceDocumentCandidate({
        extraction,
        extractionRunId: createExtractionRunId(extraction.documentId),
        segments,
        sourceDocument: bundle.sourceDocumentCandidate,
        sourceDocumentId:
          bundle.sourceDocumentCandidate.derivedFrom.sourceDocumentCandidateId,
        traces
      });

      setSourceDocumentSaveResult(result);
      if (result.saved) {
        const savedDocuments = await listSavedSourceDocuments();
        setSavedSourceDocuments(savedDocuments);

        const targetDocument =
          savedDocuments.find(
            (savedDocument) =>
              savedDocument.sourceDocumentId === result.sourceDocumentId
          ) ?? savedDocuments[0];

        setSavedSourceDocumentDetail(
          targetDocument
            ? await readSavedSourceDocument(targetDocument.sourceDocumentId)
            : null
        );
      } else {
        setSavedSourceDocuments([]);
        setSavedSourceDocumentDetail(null);
      }
    } catch (error) {
      setSourceDocumentSaveResult(null);
      setSourceDocumentSaveError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to save SourceDocument to local vault."
      );
    } finally {
      setIsSavingSourceDocument(false);
    }
  }

  async function handleSaveSourceCard(readiness: SourceCardPersistenceReadiness) {
    setIsSavingSourceCard(true);
    setSourceCardSaveError(null);
    setMarketingTagsSaveError(null);
    setMarketingTagsSaveResult(null);
    setSavedMarketingTags([]);
    setSavedSourceCardTags([]);
    setParsedDocxMarketingTagReviewStatuses({});
    setParsedDocxKnowledgeCardReviewStatuses({});
    setKnowledgeCardsSaveError(null);
    setKnowledgeCardsSaveResult(null);
    setSavedKnowledgeCards([]);
    setSavedKnowledgeCardDetail(null);
    setDraftArtifactSaveError(null);
    setDraftArtifactSaveResult(null);
    setSavedDraftArtifacts([]);
    setSavedDraftArtifactDetail(null);

    try {
      if (readiness.blockers.length > 0 || !readiness.linkedSourceDocumentId) {
        setSourceCardSaveResult(null);
        setSavedSourceCards([]);
        setSavedSourceCardDetail(null);
        setSourceCardSaveError(
          "SourceCard save requires saved/readable SourceDocument verification first."
        );
        return;
      }

      if (!activeSourceCardCandidate.title.trim()) {
        setSourceCardSaveResult(null);
        setSavedSourceCards([]);
        setSavedSourceCardDetail(null);
        setSourceCardSaveError("Parsed DOCX SourceCard save requires a reviewed title.");
        return;
      }

      if (parsedDocxSourceCardCandidatePreview?.readiness.validation.blockers.length) {
        setSourceCardSaveResult(null);
        setSavedSourceCards([]);
        setSavedSourceCardDetail(null);
        setSourceCardSaveError(
          parsedDocxSourceCardCandidatePreview.readiness.validation.blockers[0]
        );
        return;
      }

      if (isSourceLibraryQaModeEnabled()) {
        const qaResult = createQaSourceCardSaveResult({
          activeSourceCardCandidate,
          bundle,
          linkedSourceDocumentId: readiness.linkedSourceDocumentId
        });
        setSourceCardSaveResult(qaResult);
        setSavedSourceCards(
          createQaSavedSourceCardList({
            activeSourceCardCandidate,
            bundle,
            result: qaResult,
            savedSourceDocumentDetail
          })
        );
        setSavedSourceCardDetail(
          createQaSavedSourceCardDetail({
            activeSourceCardCandidate,
            bundle,
            result: qaResult,
            savedSourceDocumentDetail
          })
        );
        return;
      }

      const result = await saveSourceCardCandidate({
        authors: null,
        linkedSourceDocumentId: readiness.linkedSourceDocumentId,
        sourceCard: activeSourceCardCandidate,
        sourceCardId: activeSourceCardCandidate.derivedFrom.sourceCardCandidateId,
        year: null
      });
      setSourceCardSaveResult(result);

      if (result.saved) {
        const savedCards = await listSavedSourceCards();
        setSavedSourceCards(savedCards);
        const savedDetail = await readSavedSourceCard(result.sourceCardId);
        setSavedSourceCardDetail(savedDetail);
      } else {
        setSavedSourceCards([]);
        setSavedSourceCardDetail(null);
      }
    } catch (error) {
      setSourceCardSaveResult(null);
      setSavedSourceCards([]);
      setSavedSourceCardDetail(null);
      setSourceCardSaveError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to save SourceCard metadata to local vault."
      );
    } finally {
      setIsSavingSourceCard(false);
    }
  }

  async function handleSaveMarketingTags() {
    setIsSavingMarketingTags(true);
    setMarketingTagsSaveError(null);
    setKnowledgeCardsSaveError(null);
    setKnowledgeCardsSaveResult(null);
    setSavedKnowledgeCards([]);
    setSavedKnowledgeCardDetail(null);
    setParsedDocxKnowledgeCardReviewStatuses({});
    setDraftArtifactSaveError(null);
    setDraftArtifactSaveResult(null);
    setSavedDraftArtifacts([]);
    setSavedDraftArtifactDetail(null);

    try {
      if (!sourceCardSaveResult?.saved || !sourceCardSaveResult.sourceCardId) {
        setMarketingTagsSaveResult(null);
        setSavedMarketingTags([]);
        setSavedSourceCardTags([]);
        setMarketingTagsSaveError(
          "MarketingTag save requires a saved SourceCard root first."
        );
        return;
      }

      if (parsedDocxMarketingTagCandidatePreview?.readiness.blockers.length) {
        setMarketingTagsSaveResult(null);
        setSavedMarketingTags([]);
        setSavedSourceCardTags([]);
        setMarketingTagsSaveError(
          parsedDocxMarketingTagCandidatePreview.readiness.blockers[0]
        );
        return;
      }

      const tags = createMarketingTagSaveRequestItems(activeMarketingTagCandidates);

      if (tags.length === 0) {
        setMarketingTagsSaveResult(null);
        setSavedMarketingTags([]);
        setSavedSourceCardTags([]);
        setMarketingTagsSaveError(
          "MarketingTag save requires at least one user-approved tag candidate."
        );
        return;
      }

      if (isSourceLibraryQaModeEnabled()) {
        const qaResult = createQaMarketingTagsSaveResult({
          sourceCardId: sourceCardSaveResult.sourceCardId,
          tags
        });
        setMarketingTagsSaveResult(qaResult);
        setSavedMarketingTags(createQaSavedMarketingTags(tags));
        setSavedSourceCardTags(
          createQaSavedSourceCardTags({
            sourceCardId: sourceCardSaveResult.sourceCardId,
            tags
          })
        );
        return;
      }

      const result = await saveMarketingTagsForSourceCard({
        sourceCardId: sourceCardSaveResult.sourceCardId,
        tags
      });
      setMarketingTagsSaveResult(result);

      if (result.saved) {
        const savedTags = await listSavedMarketingTags();
        const linkedTags = await listSavedTagsForSourceCard(result.sourceCardId);
        setSavedMarketingTags(savedTags);
        setSavedSourceCardTags(linkedTags);
      } else {
        setSavedMarketingTags([]);
        setSavedSourceCardTags([]);
      }
    } catch (error) {
      setMarketingTagsSaveResult(null);
      setSavedMarketingTags([]);
      setSavedSourceCardTags([]);
      setMarketingTagsSaveError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to save approved MarketingTags to local vault."
      );
    } finally {
      setIsSavingMarketingTags(false);
    }
  }

  async function handleSaveKnowledgeCards() {
    setIsSavingKnowledgeCards(true);
    setKnowledgeCardsSaveError(null);
    setDraftArtifactSaveError(null);
    setDraftArtifactSaveResult(null);
    setSavedDraftArtifacts([]);
    setSavedDraftArtifactDetail(null);

    try {
      if (!sourceCardSaveResult?.saved || !sourceCardSaveResult.sourceCardId) {
        setKnowledgeCardsSaveResult(null);
        setSavedKnowledgeCards([]);
        setSavedKnowledgeCardDetail(null);
        setKnowledgeCardsSaveError(
          "KnowledgeCard save requires a saved SourceCard root first."
        );
        return;
      }

      if (
        parsedDocxKnowledgeCardCandidatePreview &&
        savedSourceCardTags.filter((tag) => tag.reviewStatus === "approved").length === 0
      ) {
        setKnowledgeCardsSaveResult(null);
        setSavedKnowledgeCards([]);
        setSavedKnowledgeCardDetail(null);
        setKnowledgeCardsSaveError(
          "Parsed DOCX KnowledgeCard save requires approved parsed-DOCX MarketingTags."
        );
        return;
      }

      if (parsedDocxKnowledgeCardCandidatePreview?.readiness.blockers.length) {
        setKnowledgeCardsSaveResult(null);
        setSavedKnowledgeCards([]);
        setSavedKnowledgeCardDetail(null);
        setKnowledgeCardsSaveError(
          parsedDocxKnowledgeCardCandidatePreview.readiness.blockers[0]
        );
        return;
      }

      if (parsedDocxKnowledgeCardSaveValidation?.blockers.length) {
        setKnowledgeCardsSaveResult(null);
        setSavedKnowledgeCards([]);
        setSavedKnowledgeCardDetail(null);
        setKnowledgeCardsSaveError(
          parsedDocxKnowledgeCardSaveValidation.blockers[0]
        );
        return;
      }

      const cards = createKnowledgeCardSaveRequestItems({
        candidates: activeKnowledgeCardCandidates,
        tagIds: savedSourceCardTags.map((tag) => tag.tagId)
      });

      if (cards.length === 0) {
        setKnowledgeCardsSaveResult(null);
        setSavedKnowledgeCards([]);
        setSavedKnowledgeCardDetail(null);
        setKnowledgeCardsSaveError(
          "KnowledgeCard save requires at least one approved traceable candidate."
        );
        return;
      }

      if (isSourceLibraryQaModeEnabled()) {
        const qaResult = createQaKnowledgeCardsSaveResult({
          cards,
          sourceCardId: sourceCardSaveResult.sourceCardId
        });
        setKnowledgeCardsSaveResult(qaResult);
        const qaCards = createQaSavedKnowledgeCards({
          cards,
          sourceCardId: sourceCardSaveResult.sourceCardId
        });
        setSavedKnowledgeCards(qaCards);
        setSavedKnowledgeCardDetail(
          createQaSavedKnowledgeCardDetail({
            card: cards[0],
            linkedTags: savedSourceCardTags,
            sourceCardDetail: savedSourceCardDetail,
            sourceCardId: sourceCardSaveResult.sourceCardId
          })
        );
        return;
      }

      const result = await saveKnowledgeCardsForSourceCard({
        cards,
        sourceCardId: sourceCardSaveResult.sourceCardId
      });
      setKnowledgeCardsSaveResult(result);

      if (result.saved) {
        const savedCards =
          (await listSavedKnowledgeCardsForSourceCard(result.sourceCardId)).length > 0
            ? await listSavedKnowledgeCardsForSourceCard(result.sourceCardId)
            : await listSavedKnowledgeCards();
        setSavedKnowledgeCards(savedCards);
        const targetCard = savedCards[0];
        setSavedKnowledgeCardDetail(
          targetCard ? await readSavedKnowledgeCard(targetCard.knowledgeCardId) : null
        );
      } else {
        setSavedKnowledgeCards([]);
        setSavedKnowledgeCardDetail(null);
      }
    } catch (error) {
      setKnowledgeCardsSaveResult(null);
      setSavedKnowledgeCards([]);
      setSavedKnowledgeCardDetail(null);
      setKnowledgeCardsSaveError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to save approved KnowledgeCards to local vault."
      );
    } finally {
      setIsSavingKnowledgeCards(false);
    }
  }

  async function handleSaveDraftArtifact(
    readiness: DraftArtifactPersistenceReadiness
  ) {
    setIsSavingDraftArtifact(true);
    setDraftArtifactSaveError(null);

    try {
      if (
        readiness.blockers.length > 0 ||
        !readiness.linkedSourceCardId ||
        readiness.linkedKnowledgeCardIds.length === 0
      ) {
        setDraftArtifactSaveResult(null);
        setSavedDraftArtifacts([]);
        setSavedDraftArtifactDetail(null);
        setDraftArtifactSaveError(
          "DraftArtifact save requires saved SourceCard and saved KnowledgeCards first."
        );
        return;
      }

      if (isSourceLibraryQaModeEnabled()) {
        const qaResult = createQaDraftArtifactSaveResult({
          bundle,
          linkedKnowledgeCardIds: readiness.linkedKnowledgeCardIds,
          sourceCardId: readiness.linkedSourceCardId
        });
        setDraftArtifactSaveResult(qaResult);
        setSavedDraftArtifacts(
          createQaSavedDraftArtifacts({
            bundle,
            result: qaResult
          })
        );
        setSavedDraftArtifactDetail(
          createQaSavedDraftArtifactDetail({
            bundle,
            knowledgeCards: savedKnowledgeCards,
            result: qaResult,
            sourceCardDetail: savedSourceCardDetail
          })
        );
        return;
      }

      const result = await saveDraftArtifactCandidate({
        draftArtifact: bundle.draftArtifactCandidate,
        linkedKnowledgeCardIds: readiness.linkedKnowledgeCardIds,
        sections: bundle.draftSectionCandidates,
        sourceCardId: readiness.linkedSourceCardId
      });
      setDraftArtifactSaveResult(result);

      if (result.saved) {
        const sourceCardArtifacts = await listSavedDraftArtifactsForSourceCard(
          result.sourceCardId
        );
        const artifacts =
          sourceCardArtifacts.length > 0
            ? sourceCardArtifacts
            : await listSavedDraftArtifacts();
        setSavedDraftArtifacts(artifacts);
        const targetArtifact =
          artifacts.find(
            (artifact) => artifact.draftArtifactId === result.draftArtifactId
          ) ?? artifacts[0];
        setSavedDraftArtifactDetail(
          targetArtifact
            ? await readSavedDraftArtifact(targetArtifact.draftArtifactId)
            : null
        );
      } else {
        setSavedDraftArtifacts([]);
        setSavedDraftArtifactDetail(null);
      }
    } catch (error) {
      setDraftArtifactSaveResult(null);
      setSavedDraftArtifacts([]);
      setSavedDraftArtifactDetail(null);
      setDraftArtifactSaveError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to save mock DraftArtifact to local vault."
      );
    } finally {
      setIsSavingDraftArtifact(false);
    }
  }

  async function handleSaveParsedDocxDraftArtifact({
    candidate,
    validation
  }: {
    candidate: ParsedDocxDraftArtifactSaveCandidate | null;
    validation: ParsedDocxDraftArtifactSaveValidation;
  }) {
    setIsSavingDraftArtifact(true);
    setDraftArtifactSaveError(null);

    try {
      if (!candidate || !validation.canSave || validation.blockers.length > 0) {
        setDraftArtifactSaveResult(null);
        setSavedDraftArtifacts([]);
        setSavedDraftArtifactDetail(null);
        setDraftArtifactSaveError(
          validation.blockers[0] ??
            "Parsed DOCX DraftArtifact save candidate is not ready."
        );
        return;
      }

      if (!candidate.sourceCardId) {
        setDraftArtifactSaveResult(null);
        setSavedDraftArtifacts([]);
        setSavedDraftArtifactDetail(null);
        setDraftArtifactSaveError(
          "Parsed DOCX DraftArtifact save requires a saved SourceCard."
        );
        return;
      }

      if (isSourceLibraryQaModeEnabled()) {
        const qaResult = createQaParsedDocxDraftArtifactSaveResult({
          candidate,
          sourceCardId: candidate.sourceCardId
        });
        setDraftArtifactSaveResult(qaResult);
        setSavedDraftArtifacts(
          createQaParsedDocxSavedDraftArtifacts({
            candidate,
            result: qaResult
          })
        );
        setSavedDraftArtifactDetail(
          createQaParsedDocxSavedDraftArtifactDetail({
            candidate,
            knowledgeCards: savedKnowledgeCards,
            result: qaResult,
            sourceCardDetail: savedSourceCardDetail
          })
        );
        return;
      }

      const result = await saveDraftArtifactCandidate({
        draftArtifact: candidate.draftArtifact,
        linkedKnowledgeCardIds: candidate.linkedKnowledgeCardIds,
        sections: candidate.sections,
        sourceCardId: candidate.sourceCardId
      });
      setDraftArtifactSaveResult(result);

      if (result.saved) {
        const sourceCardArtifacts = await listSavedDraftArtifactsForSourceCard(
          result.sourceCardId
        );
        const artifacts =
          sourceCardArtifacts.length > 0
            ? sourceCardArtifacts
            : await listSavedDraftArtifacts();
        setSavedDraftArtifacts(artifacts);
        const targetArtifact =
          artifacts.find(
            (artifact) => artifact.draftArtifactId === result.draftArtifactId
          ) ?? artifacts[0];
        setSavedDraftArtifactDetail(
          targetArtifact
            ? await readSavedDraftArtifact(targetArtifact.draftArtifactId)
            : null
        );
      } else {
        setSavedDraftArtifacts([]);
        setSavedDraftArtifactDetail(null);
      }
    } catch (error) {
      setDraftArtifactSaveResult(null);
      setSavedDraftArtifacts([]);
      setSavedDraftArtifactDetail(null);
      setDraftArtifactSaveError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to save parsed DOCX DraftArtifact to local vault."
      );
    } finally {
      setIsSavingDraftArtifact(false);
    }
  }

  async function handleRefreshSavedSourceDocuments() {
    setIsRefreshingSavedSourceDocuments(true);
    setSavedSourceDocumentReadError(null);

    try {
      if (isSourceLibraryQaModeEnabled() && sourceDocumentSaveResult) {
        const qaList = createQaSavedSourceDocumentList({
          bundle,
          extraction,
          result: sourceDocumentSaveResult
        });
        const qaDetail = createQaSavedSourceDocumentDetail({
          bundle,
          extraction,
          result: sourceDocumentSaveResult,
          segments,
          traces
        });

        setSavedSourceDocuments(qaList);
        setSavedSourceDocumentDetail(qaDetail);
        return;
      }

      const savedDocuments = await listSavedSourceDocuments();
      setSavedSourceDocuments(savedDocuments);

      const targetDocument =
        savedDocuments.find(
          (savedDocument) =>
            savedDocument.sourceDocumentId ===
            sourceDocumentSaveResult?.sourceDocumentId
        ) ?? savedDocuments[0];

      if (targetDocument) {
        const detail = await readSavedSourceDocument(targetDocument.sourceDocumentId);
        setSavedSourceDocumentDetail(detail);
      } else {
        setSavedSourceDocumentDetail(null);
      }
    } catch (error) {
      setSavedSourceDocuments([]);
      setSavedSourceDocumentDetail(null);
      setSavedSourceDocumentReadError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to read saved SourceDocuments from local vault."
      );
    } finally {
      setIsRefreshingSavedSourceDocuments(false);
    }
  }

  const parsedDocxSourceCardCandidatePreview =
    isParsedDocxSourceDocumentCandidate && savedSourceDocumentDetail
      ? mapSavedParsedDocxSourceDocumentToSourceCardCandidate({
          savedSourceDocument: savedSourceDocumentDetail,
          segments,
          traces
        })
      : null;
  const activeSourceCardCandidate =
    parsedDocxSourceCardCandidatePreview?.candidate ?? bundle.sourceCardCandidate;
  const sourceCardReadiness = evaluateSourceCardPersistenceReadiness({
    savedSourceDocumentDetail,
    savedSourceDocuments,
    sourceCardCandidate: activeSourceCardCandidate,
    sourceDocumentSaveResult
  });
  const parsedDocxMarketingTagCandidatePreview =
    isParsedDocxSourceDocumentCandidate && savedSourceCardDetail
      ? mapParsedDocxToMarketingTagCandidates({
          extraction,
          savedSourceCard: savedSourceCardDetail,
          savedSourceDocument: savedSourceDocumentDetail,
          segments,
          traces
        })
      : null;
  const activeMarketingTagCandidates = parsedDocxMarketingTagCandidatePreview
    ? createReviewedParsedMarketingTagCandidates({
        preview: parsedDocxMarketingTagCandidatePreview,
        reviewStatuses: parsedDocxMarketingTagReviewStatuses
      })
    : bundle.marketingTagCandidates;
  const parsedDocxKnowledgeCardCandidatePreview =
    isParsedDocxSourceDocumentCandidate &&
    savedSourceDocumentDetail &&
    savedSourceCardDetail &&
    marketingTagsSaveResult?.saved
      ? mapParsedDocxToKnowledgeCardCandidates({
          approvedMarketingTagCandidates: activeMarketingTagCandidates,
          savedMarketingTagLinks: savedSourceCardTags,
          savedSourceCard: savedSourceCardDetail,
          savedSourceDocument: savedSourceDocumentDetail,
          segments,
          traces
        })
      : null;
  const activeKnowledgeCardCandidates = parsedDocxKnowledgeCardCandidatePreview
    ? createReviewedParsedKnowledgeCardCandidates({
        preview: parsedDocxKnowledgeCardCandidatePreview,
        reviewStatuses: parsedDocxKnowledgeCardReviewStatuses
      })
    : bundle.knowledgeCardCandidates;
  const parsedDocxKnowledgeCardSaveValidation =
    parsedDocxKnowledgeCardCandidatePreview
      ? validateParsedDocxKnowledgeCardSave({
          approvedMarketingTagCount:
            parsedDocxKnowledgeCardCandidatePreview.readiness.approvedMarketingTagCount,
          candidates: parsedDocxKnowledgeCardCandidatePreview.candidates,
          linkedSavedSourceCardId:
            parsedDocxKnowledgeCardCandidatePreview.readiness.linkedSavedSourceCardId,
          linkedSavedSourceDocumentId:
            parsedDocxKnowledgeCardCandidatePreview.readiness
              .linkedSavedSourceDocumentId,
          parserSource,
          sourceType: savedSourceCardDetail?.sourceCard.sourceType ?? "DOCX"
        })
      : null;
  const draftArtifactReadiness = evaluateDraftArtifactPersistenceReadiness({
    draftArtifactCandidate: bundle.draftArtifactCandidate,
    knowledgeCardsSaveResult,
    savedKnowledgeCardDetail,
    savedKnowledgeCards,
    savedSourceCardDetail,
    savedSourceDocumentDetail,
    sourceCardSaveResult,
    sourceDocumentSaveResult
  });
  const parsedDocxDraftInputReadiness =
    isParsedDocxSourceDocumentCandidate && knowledgeCardsSaveResult?.saved
      ? mapParsedDocxToDraftInputPackageReadiness({
          approvedMarketingTags: savedSourceCardTags,
          savedKnowledgeCardDetail,
          savedKnowledgeCards,
          savedSourceCard: savedSourceCardDetail,
          savedSourceDocument: savedSourceDocumentDetail
        })
      : null;
  const parsedDocxDraftArtifactCandidatePreview =
    parsedDocxDraftInputReadiness
      ? mapParsedDocxToDraftArtifactCandidatePreview({
          approvedMarketingTags: savedSourceCardTags,
          readiness: parsedDocxDraftInputReadiness,
          savedKnowledgeCardDetail,
          savedKnowledgeCards,
          savedSourceCard: savedSourceCardDetail,
          savedSourceDocument: savedSourceDocumentDetail
        })
      : null;
  const parsedDocxDraftArtifactSaveCandidate =
    parsedDocxDraftArtifactCandidatePreview
      ? mapParsedDocxToDraftArtifactSaveCandidate({
          approvedMarketingTags: savedSourceCardTags,
          preview: parsedDocxDraftArtifactCandidatePreview,
          savedKnowledgeCards,
          savedSourceCard: savedSourceCardDetail,
          savedSourceDocument: savedSourceDocumentDetail
        })
      : null;
  const parsedDocxDraftArtifactSaveValidation =
    validateParsedDocxDraftArtifactSave(parsedDocxDraftArtifactSaveCandidate);
  const parsedDocxDraftArtifactReviewGate =
    parsedDocxDraftArtifactSaveCandidate && draftArtifactSaveResult?.saved
      ? reviewParsedDocxDraftArtifactForCitationAndEvidence({
          approvedMarketingTags: savedSourceCardTags,
          parserSource,
          savedDraftArtifact: savedDraftArtifactDetail,
          savedKnowledgeCards,
          savedSourceCard: savedSourceCardDetail,
          savedSourceDocument: savedSourceDocumentDetail
        })
      : null;
  const parsedDocxExportPackagePreview =
    parsedDocxDraftArtifactReviewGate && draftArtifactSaveResult?.saved
      ? createParsedDocxExportPackagePreview({
          parserSource,
          reviewGate: parsedDocxDraftArtifactReviewGate,
          savedDraftArtifact: savedDraftArtifactDetail,
          savedKnowledgeCards
        })
      : null;

  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="persistence-save-candidate-preview"
    >
      <div className="border-2 border-studio-gold bg-studio-gold/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-gold">
              Persistence Save Candidate Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="save-candidate-preview-only-notice"
            >
              Preview only — no data is persisted.
            </p>
          </div>
          <span className="status-pill">{statusLabels[bundle.validationStatus]}</span>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="save-candidate-bundle-summary"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Bundle summary
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <SummaryStat label="Tags" value={bundle.marketingTagCandidates.length} />
            <SummaryStat
              label="Knowledge Cards"
              value={bundle.knowledgeCardCandidates.length}
            />
            <SummaryStat label="Warnings" value={bundle.warnings.length} />
            <SummaryStat label="Blockers" value={bundle.blockers.length} />
            <SummaryStat label="Persisted" value={bundle.notPersisted ? "No" : "Yes"} />
            <SummaryStat label="Status" value={statusLabels[bundle.validationStatus]} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Bundle ID: {bundle.bundleId}
          </p>
        </div>

        <section
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="save-candidate-source-document"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            SourceDocument save candidate
          </p>
          <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
            <p>Candidate ID: {bundle.sourceDocumentCandidate.candidateId}</p>
            <p>Title: {bundle.sourceDocumentCandidate.title}</p>
            <p>File: {bundle.sourceDocumentCandidate.fileName}</p>
            <p>Type: {bundle.sourceDocumentCandidate.fileType}</p>
            <p>Validation: {statusLabels[bundle.sourceDocumentCandidate.validationStatus]}</p>
            <p>
              Trace refs: {bundle.sourceDocumentCandidate.traceReferences.length}
              {" · "}
              page numbers trusted:{" "}
              {bundle.sourceDocumentCandidate.traceReferences.some(
                (trace) => trace.pageNumberTrusted
              )
                ? "some"
                : "no"}
            </p>
          </div>
        </section>

        <section
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="save-candidate-source-card"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            SourceCard save candidate
          </p>
          <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
            <p>Candidate ID: {bundle.sourceCardCandidate.candidateId}</p>
            <p>Title: {bundle.sourceCardCandidate.title}</p>
            <p>Metadata: {bundle.sourceCardCandidate.metadataStatus}</p>
            <p>Citation readiness: {bundle.sourceCardCandidate.citationReadiness}</p>
            <p>Validation: {statusLabels[bundle.sourceCardCandidate.validationStatus]}</p>
          </div>
        </section>

        <CandidateList
          dataTestId="save-candidate-marketing-tags"
          emptyText="No approved marketing tags are save candidates yet."
          items={bundle.marketingTagCandidates.map((tag) => ({
            detail: tag.validationStatus,
            id: tag.candidateId,
            title: tag.label
          }))}
          title="Approved tag save candidates"
        />

        <CandidateList
          dataTestId="save-candidate-knowledge-cards"
          emptyText="No Knowledge Card save candidates are available."
          items={bundle.knowledgeCardCandidates.map((card) => ({
            detail: `${card.cardType} · ${card.citationReadiness} · ${
              card.traceReference?.chunkReference ?? "trace review required"
            }`,
            id: card.candidateId,
            title: card.title
          }))}
          title="Knowledge Card save candidates"
        />

        <section
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="save-candidate-draft-artifact"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Draft artifact candidate
          </p>
          <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
            <p>Candidate ID: {bundle.draftArtifactCandidate.candidateId}</p>
            <p>Title: {bundle.draftArtifactCandidate.title}</p>
            <p>Sections: {bundle.draftArtifactCandidate.sectionCount}</p>
            <p>Artifact type: {bundle.draftArtifactCandidate.artifactType}</p>
            <p>
              Status: mock_only / not final /{" "}
              {statusLabels[bundle.draftArtifactCandidate.validationStatus]}
            </p>
          </div>
        </section>

        <NoticeList
          dataTestId="save-candidate-blockers"
          emptyText="No blockers are present in the save-candidate preview."
          tone="rose"
          values={bundle.blockers.map((blocker) => blocker.message)}
        />
        <NoticeList
          dataTestId="save-candidate-warnings"
          emptyText="No warnings are present in the save-candidate preview."
          tone="gold"
          values={bundle.warnings.map((warning) => warning.message)}
        />
        <PersistenceDryRunPreview dryRun={dryRunPreview} />
        <SourceDocumentSaveAction
          error={sourceDocumentSaveError}
          isParsedDocxCandidate={isParsedDocxSourceDocumentCandidate}
          isSaving={isSavingSourceDocument}
          onSave={handleSaveSourceDocument}
          parserSource={parserSource}
          result={sourceDocumentSaveResult}
          segmentCount={segments.length}
          sourceDocumentCandidateStatus={bundle.sourceDocumentCandidate.validationStatus}
          traceCount={traces.length}
          warningCount={sourceDocumentSaveWarningCount}
        />
        {sourceDocumentSaveResult?.saved ? (
          <SavedSourceDocumentVerificationPanel
            detail={savedSourceDocumentDetail}
            error={savedSourceDocumentReadError}
            isRefreshing={isRefreshingSavedSourceDocuments}
            items={savedSourceDocuments}
            onRefresh={handleRefreshSavedSourceDocuments}
          />
        ) : null}
        {sourceDocumentSaveResult?.saved ? (
          <ParsedDocxSourceCardCandidatePanel
            preview={parsedDocxSourceCardCandidatePreview}
          />
        ) : null}
        {sourceDocumentSaveResult?.saved ? (
          <SourceCardPersistenceReadinessPreview
            readiness={sourceCardReadiness}
          />
        ) : null}
        {sourceDocumentSaveResult?.saved ? (
          <SourceCardSaveAction
            detail={savedSourceCardDetail}
            error={sourceCardSaveError}
            isSaving={isSavingSourceCard}
            items={savedSourceCards}
            onSave={() => handleSaveSourceCard(sourceCardReadiness)}
            parsedDocxPreview={parsedDocxSourceCardCandidatePreview}
            readiness={sourceCardReadiness}
            result={sourceCardSaveResult}
          />
        ) : null}
        {sourceCardSaveResult?.saved ? (
          <ParsedDocxMarketingTagCandidatePanel
            onReviewStatusChange={(candidateId, reviewStatus) =>
              setParsedDocxMarketingTagReviewStatuses((currentStatuses) => ({
                ...currentStatuses,
                [candidateId]: reviewStatus
              }))
            }
            preview={parsedDocxMarketingTagCandidatePreview}
            reviewStatuses={parsedDocxMarketingTagReviewStatuses}
          />
        ) : null}
        {sourceCardSaveResult?.saved ? (
          <MarketingTagSaveAction
            error={marketingTagsSaveError}
            isSaving={isSavingMarketingTags}
            linkedTags={savedSourceCardTags}
            onSave={handleSaveMarketingTags}
            parsedDocxPreview={parsedDocxMarketingTagCandidatePreview}
            result={marketingTagsSaveResult}
            savedTags={savedMarketingTags}
            tagCount={activeMarketingTagCandidates.length}
          />
        ) : null}
        {marketingTagsSaveResult?.saved ? (
          <ParsedDocxKnowledgeCardCandidatePanel
            onReviewStatusChange={(candidateId, reviewStatus) =>
              setParsedDocxKnowledgeCardReviewStatuses((currentStatuses) => ({
                ...currentStatuses,
                [candidateId]: reviewStatus
              }))
            }
            preview={parsedDocxKnowledgeCardCandidatePreview}
            reviewStatuses={parsedDocxKnowledgeCardReviewStatuses}
          />
        ) : null}
        {marketingTagsSaveResult?.saved ? (
          <KnowledgeCardSaveAction
            detail={savedKnowledgeCardDetail}
            error={knowledgeCardsSaveError}
            isSaving={isSavingKnowledgeCards}
            items={savedKnowledgeCards}
            onSave={handleSaveKnowledgeCards}
            result={knowledgeCardsSaveResult}
            tagLinkCount={savedSourceCardTags.length}
            validation={parsedDocxKnowledgeCardSaveValidation}
            knowledgeCardCount={activeKnowledgeCardCandidates.length}
            parsedDocxPreview={parsedDocxKnowledgeCardCandidatePreview}
          />
        ) : null}
        {knowledgeCardsSaveResult?.saved ? (
          parsedDocxDraftInputReadiness ? (
            <>
              <ParsedDocxDraftInputPackageReadinessPanel
                readiness={parsedDocxDraftInputReadiness}
              />
              {parsedDocxDraftArtifactCandidatePreview ? (
                <>
                  <ParsedDocxDraftArtifactCandidatePreviewPanel
                    preview={parsedDocxDraftArtifactCandidatePreview}
                  />
                  <ParsedDocxDraftArtifactSaveAction
                    candidate={parsedDocxDraftArtifactSaveCandidate}
                    detail={savedDraftArtifactDetail}
                    error={draftArtifactSaveError}
                    isSaving={isSavingDraftArtifact}
                    items={savedDraftArtifacts}
                    onSave={() =>
                      handleSaveParsedDocxDraftArtifact({
                        candidate: parsedDocxDraftArtifactSaveCandidate,
                        validation: parsedDocxDraftArtifactSaveValidation
                      })
                    }
                    result={draftArtifactSaveResult}
                    exportPackagePreview={parsedDocxExportPackagePreview}
                    reviewGate={parsedDocxDraftArtifactReviewGate}
                    validation={parsedDocxDraftArtifactSaveValidation}
                  />
                </>
              ) : null}
            </>
          ) : (
            <DraftArtifactPersistenceReadinessPreview
              readiness={draftArtifactReadiness}
            />
          )
        ) : null}
        {knowledgeCardsSaveResult?.saved && !parsedDocxDraftInputReadiness ? (
          <DraftArtifactSaveAction
            detail={savedDraftArtifactDetail}
            error={draftArtifactSaveError}
            isSaving={isSavingDraftArtifact}
            items={savedDraftArtifacts}
            onSave={() => handleSaveDraftArtifact(draftArtifactReadiness)}
            readiness={draftArtifactReadiness}
            result={draftArtifactSaveResult}
            sectionCandidateCount={bundle.draftSectionCandidates.length}
          />
        ) : null}
      </div>
    </div>
  );
}

function SourceDocumentSaveAction({
  error,
  isParsedDocxCandidate,
  isSaving,
  onSave,
  parserSource,
  result,
  segmentCount,
  sourceDocumentCandidateStatus,
  traceCount,
  warningCount
}: {
  error: string | null;
  isParsedDocxCandidate: boolean;
  isSaving: boolean;
  onSave: () => void;
  parserSource: string;
  result: SaveSourceDocumentResult | null;
  segmentCount: number;
  sourceDocumentCandidateStatus: SaveCandidateValidationStatus;
  traceCount: number;
  warningCount: number;
}) {
  return (
    <div className="mt-4 border-t border-studio-line/70 pt-3">
      <div
        className="border-2 border-studio-teal bg-studio-teal/10 p-3"
        data-testid="parsed-docx-source-document-save-action"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              {isParsedDocxCandidate
                ? "Save Parsed DOCX SourceDocument"
                : "SourceDocument Local Vault Save"}
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="source-document-save-limited-scope-notice"
            >
              {isParsedDocxCandidate
                ? "Explicit save only — parsed DOCX is not auto-saved. Only SourceDocument extraction data is saved."
                : "Only SourceDocument extraction data is saved. SourceCard, KnowledgeCards, tags, and drafts are not saved."}
            </p>
          </div>
          <span className="status-pill">SourceDocument only</span>
        </div>

        <dl className="mt-4 grid gap-2" data-testid="parsed-docx-save-readiness">
          <SaveReadinessDetail
            label="Candidate status"
            value={statusLabels[sourceDocumentCandidateStatus]}
          />
          <SaveReadinessDetail label="Parser source" value={parserSource} />
          <SaveReadinessDetail label="Segments" value={`${segmentCount}`} />
          <SaveReadinessDetail label="Evidence traces" value={`${traceCount}`} />
          <SaveReadinessDetail label="Warning count" value={`${warningCount}`} />
          <SaveReadinessDetail
            label="Page-number policy"
            value={
              isParsedDocxCandidate
                ? "DOCX page numbers are not trusted; chunk references are saved."
                : "Trace policy follows current extraction preview."
            }
          />
        </dl>

        <button
          className="mt-4 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
          data-testid="save-source-document-button"
          disabled={isSaving}
          onClick={onSave}
          type="button"
        >
          {isSaving
            ? "Saving SourceDocument..."
            : isParsedDocxCandidate
              ? "Save Parsed DOCX SourceDocument"
              : "Save SourceDocument to Local Vault"}
        </button>

        {error ? (
          <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-sm font-black leading-6 text-studio-rose">
            {error}
          </p>
        ) : null}

        {result ? <SourceDocumentSaveResultPanel result={result} /> : null}
      </div>
    </div>
  );
}

function SaveReadinessDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-2">
      <dt className="text-xs font-black uppercase text-slate-400">{label}</dt>
      <dd className="break-words font-bold text-slate-100">{value}</dd>
    </div>
  );
}

function SourceDocumentSaveResultPanel({
  result
}: {
  result: SaveSourceDocumentResult;
}) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="source-document-save-result"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            SourceDocument save result
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {result.saved ? "Saved SourceDocument extraction data" : "Save blocked"}
          </p>
        </div>
        <span className="status-pill">{result.saved ? "persisted: true" : "blocked"}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SummaryStat label="Segments" value={result.segmentCount} />
        <SummaryStat label="Traces" value={result.traceCount} />
      </div>
      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p data-testid="source-document-save-source-id">
          SourceDocument ID: {result.sourceDocumentId}
        </p>
        <p data-testid="source-document-save-extraction-run-id">
          Extraction run ID: {result.extractionRunId}
        </p>
        <p data-testid="source-document-save-segment-count">
          Segment count: {result.segmentCount}
        </p>
        <p data-testid="source-document-save-trace-count">
          Trace count: {result.traceCount}
        </p>
        <p>Database path: {result.dbPath}</p>
      </div>

      {result.blockers.length > 0 ? (
        <NoticeList
          dataTestId="source-document-save-blockers"
          emptyText="No SourceDocument save blockers."
          tone="rose"
          values={result.blockers}
        />
      ) : null}
      {result.warnings.length > 0 ? (
        <NoticeList
          dataTestId="source-document-save-warnings"
          emptyText="No SourceDocument save warnings."
          tone="gold"
          values={result.warnings}
        />
      ) : null}
    </div>
  );
}

function SavedSourceDocumentVerificationPanel({
  detail,
  error,
  isRefreshing,
  items,
  onRefresh
}: {
  detail: SavedSourceDocumentDetail | null;
  error: string | null;
  isRefreshing: boolean;
  items: SavedSourceDocumentListItem[];
  onRefresh: () => void;
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3">
      <div className="border-2 border-studio-blue bg-studio-blue/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-blue">
              Saved SourceDocument Verification
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="saved-source-document-limited-scope-notice"
            >
              Only SourceDocument extraction data is currently readable from the local
              vault. SourceCard, KnowledgeCards, tags, and drafts are not saved yet.
            </p>
          </div>
          <span className="status-pill">Read boundary</span>
        </div>

        <button
          className="mt-4 w-full border-2 border-studio-blue bg-studio-blue/15 px-3 py-3 text-xs font-black uppercase text-studio-blue shadow-pixel disabled:opacity-60"
          data-testid="saved-source-document-list-refresh"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
        >
          {isRefreshing ? "Reading saved SourceDocuments..." : "Refresh Saved SourceDocuments"}
        </button>

        {error ? (
          <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-sm font-black leading-6 text-studio-rose">
            {error}
          </p>
        ) : null}

        <div
          className="mt-4 grid gap-2"
          data-testid="saved-source-document-list"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Saved SourceDocuments
          </p>
          {items.length > 0 ? (
            items.map((item) => (
              <article
                className="border-l-4 border-studio-blue bg-studio-panel/60 p-2"
                data-testid="saved-source-document-row"
                key={item.sourceDocumentId}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-white">{item.title}</p>
                    <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                      {item.sourceDocumentId}
                    </p>
                  </div>
                  <span className="status-pill">{item.fileType}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {item.fileName} · metadata {item.metadataStatus} · extraction{" "}
                  {item.extractionStatus}
                </p>
                <p className="text-sm leading-6 text-slate-300">
                  Segments: {item.segmentCount} · Traces: {item.traceCount}
                </p>
              </article>
            ))
          ) : (
            <p className="border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6 text-slate-300">
              No saved SourceDocuments have been read yet.
            </p>
          )}
        </div>

        {detail ? <SavedSourceDocumentDetailPanel detail={detail} /> : null}
      </div>
    </section>
  );
}

function SavedSourceDocumentDetailPanel({
  detail
}: {
  detail: SavedSourceDocumentDetail;
}) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="saved-source-document-detail"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            Latest saved detail
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {detail.sourceDocument.title}
          </p>
        </div>
        <span className="status-pill">{detail.extractionRun.extractionStatus}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SummaryStat label="Segments" value={detail.segments.length} />
        <SummaryStat label="Traces" value={detail.traces.length} />
        <SummaryStat
          label="Cleaned text"
          value={detail.extractionRun.cleanedTextLength}
        />
        <SummaryStat label="Warnings" value={detail.extractionRun.warningCount} />
      </div>

      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p>SourceDocument ID: {detail.sourceDocument.sourceDocumentId}</p>
        <p>File: {detail.sourceDocument.fileName}</p>
        <p>Metadata: {detail.sourceDocument.metadataStatus}</p>
        <p>Citation readiness: {detail.sourceDocument.citationReadiness}</p>
        <p>Extraction run: {detail.extractionRun.extractionRunId}</p>
      </div>

      <div
        className="mt-4 grid gap-2"
        data-testid="saved-source-document-detail-segments"
      >
        <p className="text-xs font-black uppercase text-slate-400">
          Saved extraction segments
        </p>
        {detail.segments.slice(0, 4).map((segment) => (
          <article
            className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
            key={segment.segmentId}
          >
            <p className="font-black text-white">{segment.title}</p>
            <p className="mt-1 text-xs font-black uppercase text-studio-blue">
              {segment.segmentType} · {segment.segmentId}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {segment.content.slice(0, 140)}
              {segment.content.length > 140 ? "..." : ""}
            </p>
          </article>
        ))}
      </div>

      <div
        className="mt-4 grid gap-2"
        data-testid="saved-source-document-detail-traces"
      >
        <p className="text-xs font-black uppercase text-slate-400">
          Saved evidence traces
        </p>
        {detail.traces.slice(0, 6).map((trace) => (
          <article
            className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
            key={trace.traceId}
          >
            <p className="font-black text-white">{trace.chunkReference}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Section: {trace.sectionTitle ?? "Unknown"} · page:{" "}
              {trace.pageNumber ?? "untrusted / not stored"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ParsedDocxSourceCardCandidatePanel({
  preview
}: {
  preview: ParsedDocxSourceCardCandidatePreview | null;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-source-card-candidate-panel"
    >
      <div className="border-2 border-studio-blue bg-studio-blue/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-blue">
              Parsed DOCX SourceCard Candidate
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="parsed-docx-source-card-candidate-only-notice"
            >
              Candidate only — SourceCard is not auto-saved.
            </p>
          </div>
          <span className="status-pill">
            {preview ? statusLabels[preview.candidate.validationStatus] : "Blocked"}
          </span>
        </div>

        {preview ? (
          <>
            <div
              className="mt-3 grid gap-1 text-sm leading-6 text-slate-300"
              data-testid="parsed-docx-source-card-candidate-summary"
            >
              <p>
                Linked saved SourceDocument ID:{" "}
                {preview.readiness.linkedSavedSourceDocumentId}
              </p>
              <p>Candidate title: {preview.candidate.title}</p>
              <p>Source type: {preview.readiness.sourceType}</p>
              <p>Parser source: {preview.readiness.parserSource}</p>
              <p>Metadata status: {preview.readiness.metadataStatus}</p>
              <p>
                Missing metadata fields:{" "}
                {preview.readiness.missingMetadataFields.join(", ")}
              </p>
              <p>Citation readiness warning: {preview.readiness.citationReadinessWarning}</p>
              <p>Page-number warning: {preview.readiness.pageNumberWarning}</p>
            </div>

            <NoticeList
              dataTestId="parsed-docx-source-card-blockers"
              emptyText="No parsed DOCX SourceCard candidate blockers."
              tone="rose"
              values={preview.readiness.blockers}
            />
            <NoticeList
              dataTestId="parsed-docx-source-card-warnings"
              emptyText="No parsed DOCX SourceCard candidate warnings."
              tone="gold"
              values={preview.readiness.warnings}
            />
          </>
        ) : (
          <p
            className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold"
            data-testid="parsed-docx-source-card-preview-blocker"
          >
            Preview-only blocker: save and read a parsed DOCX SourceDocument before
            creating a parsed-DOCX SourceCard candidate.
          </p>
        )}
      </div>
    </section>
  );
}

function SourceCardPersistenceReadinessPreview({
  readiness
}: {
  readiness: SourceCardPersistenceReadiness;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="source-card-persistence-readiness-preview"
    >
      <div className="border-2 border-studio-gold bg-studio-gold/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-gold">
              SourceCard Persistence Readiness
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="source-card-persistence-preview-only-notice"
            >
              Preview only — SourceCard is not saved yet.
            </p>
          </div>
          <span className="status-pill" data-testid="source-card-persistence-status">
            {formatSourceCardReadinessStatus(
              readiness.sourceCardPersistenceReadiness
            )}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <SummaryStat label="Metadata" value={readiness.metadataReadiness} />
          <SummaryStat label="Citation" value={readiness.citationReadiness} />
          <SummaryStat label="Future save" value={readiness.canSaveLater ? "Yes" : "No"} />
          <SummaryStat label="Blockers" value={readiness.blockers.length} />
        </div>

        <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
          <p>SourceCard candidate ID: {readiness.sourceCardCandidateId}</p>
          <p data-testid="source-card-linked-source-document-id">
            Linked saved SourceDocument ID:{" "}
            {readiness.linkedSourceDocumentId ?? "not linked yet"}
          </p>
        </div>

        <NoticeList
          dataTestId="source-card-persistence-blockers"
          emptyText="No SourceCard persistence blockers after saved SourceDocument verification."
          tone="rose"
          values={readiness.blockers}
        />
        <NoticeList
          dataTestId="source-card-persistence-warnings"
          emptyText="No SourceCard persistence warnings."
          tone="gold"
          values={readiness.warnings}
        />
      </div>
    </section>
  );
}

function SourceCardSaveAction({
  detail,
  error,
  isSaving,
  items,
  onSave,
  parsedDocxPreview,
  readiness,
  result
}: {
  detail: SavedSourceCardDetail | null;
  error: string | null;
  isSaving: boolean;
  items: SavedSourceCardListItem[];
  onSave: () => void;
  parsedDocxPreview: ParsedDocxSourceCardCandidatePreview | null;
  readiness: SourceCardPersistenceReadiness;
  result: SaveSourceCardResult | null;
}) {
  const isBlocked = readiness.blockers.length > 0 || !readiness.linkedSourceDocumentId;
  const isParsedDocxCandidate = Boolean(parsedDocxPreview);

  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid={
        isParsedDocxCandidate
          ? "parsed-docx-source-card-save-action"
          : "source-card-save-action"
      }
    >
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              {isParsedDocxCandidate
                ? "Save Parsed DOCX SourceCard"
                : "SourceCard Local Vault Save"}
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="source-card-save-limited-scope-notice"
            >
              {isParsedDocxCandidate
                ? "Explicit save only — parsed DOCX SourceCard is not auto-saved. Only SourceCard metadata is saved."
                : "Only SourceCard metadata is saved. Tags, KnowledgeCards, and drafts are not saved yet."}
            </p>
          </div>
          <span className="status-pill">SourceCard only</span>
        </div>

        {isParsedDocxCandidate ? (
          <div
            className="mt-3 grid gap-1 text-sm leading-6 text-slate-300"
            data-testid="parsed-docx-source-card-save-readiness"
          >
            <p>
              Linked saved SourceDocument ID:{" "}
              {parsedDocxPreview?.readiness.linkedSavedSourceDocumentId}
            </p>
            <p>SourceCard candidate ID: {parsedDocxPreview?.candidate.candidateId}</p>
            <p>SourceCard title: {parsedDocxPreview?.candidate.title}</p>
            <p>Source type: {parsedDocxPreview?.candidate.sourceType}</p>
            <p>Parser source: {parsedDocxPreview?.readiness.parserSource}</p>
            <p>Metadata status: {parsedDocxPreview?.readiness.metadataStatus}</p>
            <p>
              Missing metadata:{" "}
              {parsedDocxPreview?.readiness.missingMetadataFields.join(", ")}
            </p>
            <p>
              No fabricated citation:{" "}
              {parsedDocxPreview?.readiness.validation.noFabricatedCitation
                ? "yes"
                : "no"}
            </p>
            <p>{parsedDocxPreview?.readiness.citationReadinessWarning}</p>
            <p>{parsedDocxPreview?.readiness.pageNumberWarning}</p>
          </div>
        ) : null}

        <button
          className="mt-4 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
          data-testid="save-source-card-button"
          disabled={isSaving || isBlocked}
          onClick={onSave}
          type="button"
        >
          {isSaving
            ? "Saving SourceCard..."
            : isParsedDocxCandidate
              ? "Save Parsed DOCX SourceCard"
              : "Save SourceCard to Local Vault"}
        </button>

        {isBlocked ? (
          <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold">
            Save is available only after the linked SourceDocument is saved and readable.
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-sm font-black leading-6 text-studio-rose">
            {error}
          </p>
        ) : null}

        {result ? (
          <SourceCardSaveResultPanel
            parsedDocxPreview={parsedDocxPreview}
            result={result}
          />
        ) : null}
        {result?.saved ? (
          <SavedSourceCardVerificationPanel
            detail={detail}
            items={items}
            parsedDocxPreview={parsedDocxPreview}
          />
        ) : null}
      </div>
    </section>
  );
}

function SourceCardSaveResultPanel({
  parsedDocxPreview,
  result
}: {
  parsedDocxPreview: ParsedDocxSourceCardCandidatePreview | null;
  result: SaveSourceCardResult;
}) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="source-card-save-result"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            SourceCard save result
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {result.saved ? "Saved SourceCard metadata" : "SourceCard save blocked"}
          </p>
        </div>
        <span className="status-pill">{result.saved ? "persisted: true" : "blocked"}</span>
      </div>

      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p data-testid="source-card-save-source-card-id">
          SourceCard ID: {result.sourceCardId}
        </p>
        <p data-testid="source-card-save-linked-source-document-id">
          Linked SourceDocument ID: {result.sourceDocumentId}
        </p>
        <p>Database path: {result.dbPath}</p>
      </div>

      {parsedDocxPreview ? (
        <div
          className="mt-3 grid gap-1 border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6 text-slate-300"
          data-testid="parsed-docx-source-card-save-verification"
        >
          <p>Saved SourceCard status: {result.saved ? "saved" : "blocked"}</p>
          <p>Candidate ID: {parsedDocxPreview.candidate.candidateId}</p>
          <p>Candidate title: {parsedDocxPreview.candidate.title}</p>
          <p>Metadata status: {parsedDocxPreview.candidate.metadataStatus}</p>
          <p>
            Missing metadata:{" "}
            {parsedDocxPreview.readiness.missingMetadataFields.join(", ")}
          </p>
          <p>Parser source: {parsedDocxPreview.readiness.parserSource}</p>
          <p>{parsedDocxPreview.readiness.pageNumberWarning}</p>
          <p>Citation metadata still needs human review before APA use.</p>
        </div>
      ) : null}

      {result.blockers.length > 0 ? (
        <NoticeList
          dataTestId="source-card-save-blockers"
          emptyText="No SourceCard save blockers."
          tone="rose"
          values={result.blockers}
        />
      ) : null}
      {result.warnings.length > 0 ? (
        <NoticeList
          dataTestId="source-card-save-warnings"
          emptyText="No SourceCard save warnings."
          tone="gold"
          values={result.warnings}
        />
      ) : null}
    </div>
  );
}

function SavedSourceCardVerificationPanel({
  detail,
  items,
  parsedDocxPreview
}: {
  detail: SavedSourceCardDetail | null;
  items: SavedSourceCardListItem[];
  parsedDocxPreview: ParsedDocxSourceCardCandidatePreview | null;
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3">
      {parsedDocxPreview ? (
        <div
          className="mb-4 border-2 border-studio-blue bg-studio-blue/10 p-3"
          data-testid="parsed-docx-source-card-read-list-verification"
        >
          <p className="font-black uppercase text-studio-blue">
            Parsed DOCX SourceCard Read/List Verification
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SummaryStat label="List rows" value={items.length} />
            <SummaryStat label="Read detail" value={detail ? "Yes" : "No"} />
            <SummaryStat
              label="Metadata"
              value={detail?.sourceCard.metadataStatus ?? "not read"}
            />
            <SummaryStat
              label="Citation"
              value={detail?.sourceCard.citationReadiness ?? "not read"}
            />
          </div>
          <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
            <p>Saved SourceCard ID: {detail?.sourceCard.sourceCardId ?? "not read"}</p>
            <p>
              Linked SourceDocument ID:{" "}
              {detail?.sourceCard.sourceDocumentId ??
                parsedDocxPreview.readiness.linkedSavedSourceDocumentId}
            </p>
            <p>Parser source: {parsedDocxPreview.readiness.parserSource}</p>
            <p>
              Missing metadata:{" "}
              {parsedDocxPreview.readiness.missingMetadataFields.join(", ")}
            </p>
            <p>Citation metadata still needs human review before APA use.</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2" data-testid="saved-source-card-list">
        <p className="text-xs font-black uppercase text-slate-400">
          Saved SourceCards
        </p>
        {items.length > 0 ? (
          items.map((item) => (
            <article
              className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
              data-testid="saved-source-card-row"
              key={item.sourceCardId}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{item.title}</p>
                  <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                    {item.sourceCardId}
                  </p>
                </div>
                <span className="status-pill">{item.sourceType}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Linked SourceDocument: {item.sourceDocumentId}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                Metadata: {item.metadataStatus} · Citation: {item.citationReadiness}
              </p>
            </article>
          ))
        ) : (
          <p className="border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6 text-slate-300">
            No saved SourceCards have been read yet.
          </p>
        )}
      </div>

      {detail ? (
        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="saved-source-card-detail"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Saved SourceCard detail
          </p>
          <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
            <p>SourceCard ID: {detail.sourceCard.sourceCardId}</p>
            <p>Title: {detail.sourceCard.title}</p>
            <p>Authors: {detail.sourceCard.authors ?? "metadata required"}</p>
            <p>Year: {detail.sourceCard.year ?? "metadata required"}</p>
            <p>Source type: {detail.sourceCard.sourceType}</p>
            <p>Citation readiness: {detail.sourceCard.citationReadiness}</p>
            <p>Linked SourceDocument: {detail.sourceDocument.sourceDocumentId}</p>
            <p>SourceDocument title: {detail.sourceDocument.title}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ParsedDocxMarketingTagCandidatePanel({
  onReviewStatusChange,
  preview,
  reviewStatuses
}: {
  onReviewStatusChange: (
    candidateId: string,
    reviewStatus: MarketingTagReviewDecision
  ) => void;
  preview: ParsedDocxMarketingTagCandidatePreview | null;
  reviewStatuses: Record<string, MarketingTagReviewDecision>;
}) {
  const reviewedCandidates = preview
    ? createReviewedParsedMarketingTagCandidates({ preview, reviewStatuses })
    : [];
  const approvedCount = reviewedCandidates.filter(
    (candidate) => candidate.review.reviewStatus === "approved"
  ).length;

  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-marketing-tag-candidates-panel"
    >
      <div className="border-2 border-studio-gold bg-studio-gold/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-gold">
              Parsed DOCX MarketingTag Candidates
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="parsed-docx-marketing-tag-candidate-only-notice"
            >
              Candidates only — MarketingTags are not auto-saved.
            </p>
          </div>
          <span className="status-pill">
            {preview ? statusLabels[preview.readiness.validationStatus] : "Blocked"}
          </span>
        </div>

        {preview ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <SummaryStat label="Candidates" value={preview.readiness.candidateCount} />
              <SummaryStat label="Core matches" value={preview.readiness.coreMatchCount} />
              <SummaryStat
                label="Extended matches"
                value={preview.readiness.extendedMatchCount}
              />
              <SummaryStat label="Approved" value={approvedCount} />
              <SummaryStat label="Blockers" value={preview.readiness.blockers.length} />
              <SummaryStat label="Parser" value={preview.readiness.parserSource} />
            </div>

            <div
              className="mt-3 grid gap-1 text-sm leading-6 text-slate-300"
              data-testid="parsed-docx-marketing-tag-provenance"
            >
              <p>Linked saved SourceCard ID: {preview.readiness.linkedSavedSourceCardId}</p>
              <p>
                Linked saved SourceDocument ID:{" "}
                {preview.readiness.linkedSavedSourceDocumentId ?? "not available"}
              </p>
              <p>Provenance: {preview.readiness.provenanceSummary}</p>
              <p>{preview.readiness.pageNumberWarning}</p>
              <p>Save boundary: user-approved candidates only.</p>
            </div>

            <div
              className="mt-4 grid gap-2"
              data-testid="parsed-docx-marketing-tag-candidate-list"
            >
              {preview.candidates.map((candidate) => {
                const decision =
                  reviewStatuses[candidate.candidate.candidateId] ?? "needs_review";

                return (
                  <article
                    className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
                    key={candidate.candidate.candidateId}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-white">{candidate.candidate.label}</p>
                        <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                          {candidate.tier} · {candidate.category} · {candidate.matchSource}
                        </p>
                      </div>
                      <span className="status-pill">
                        {formatMarketingTagReviewDecision(decision)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <ParsedMarketingTagReviewButton
                        isActive={decision === "approved"}
                        label="Approve"
                        onClick={() =>
                          onReviewStatusChange(
                            candidate.candidate.candidateId,
                            "approved"
                          )
                        }
                        testId="approve-parsed-docx-marketing-tag-button"
                        tone="teal"
                      />
                      <ParsedMarketingTagReviewButton
                        isActive={decision === "needs_review"}
                        label="Needs Review"
                        onClick={() =>
                          onReviewStatusChange(
                            candidate.candidate.candidateId,
                            "needs_review"
                          )
                        }
                        tone="gold"
                      />
                      <ParsedMarketingTagReviewButton
                        isActive={decision === "rejected"}
                        label="Reject"
                        onClick={() =>
                          onReviewStatusChange(
                            candidate.candidate.candidateId,
                            "rejected"
                          )
                        }
                        tone="rose"
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <NoticeList
              dataTestId="parsed-docx-marketing-tag-blockers"
              emptyText="No parsed DOCX MarketingTag candidate blockers."
              tone="rose"
              values={preview.readiness.blockers}
            />
            <NoticeList
              dataTestId="parsed-docx-marketing-tag-warnings"
              emptyText="No parsed DOCX MarketingTag candidate warnings."
              tone="gold"
              values={preview.readiness.warnings}
            />
          </>
        ) : (
          <p
            className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold"
            data-testid="parsed-docx-marketing-tag-preview-blocker"
          >
            Preview-only blocker: save and read a parsed DOCX SourceCard before
            creating parsed-DOCX MarketingTag candidates.
          </p>
        )}
      </div>
    </section>
  );
}

function ParsedMarketingTagReviewButton({
  isActive,
  label,
  onClick,
  testId,
  tone
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
  testId?: string;
  tone: "gold" | "rose" | "teal";
}) {
  const toneClass =
    tone === "teal"
      ? "border-studio-teal text-studio-teal"
      : tone === "rose"
        ? "border-studio-rose text-studio-rose"
        : "border-studio-gold text-studio-gold";

  return (
    <button
      className={`border-2 px-2 py-2 text-[10px] font-black uppercase ${
        isActive ? "bg-white/15" : "bg-studio-panel/70"
      } ${toneClass}`}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function MarketingTagSaveAction({
  error,
  isSaving,
  linkedTags,
  onSave,
  parsedDocxPreview,
  result,
  savedTags,
  tagCount
}: {
  error: string | null;
  isSaving: boolean;
  linkedTags: SavedSourceCardTagRecord[];
  onSave: () => void;
  parsedDocxPreview: ParsedDocxMarketingTagCandidatePreview | null;
  result: SaveMarketingTagsResult | null;
  savedTags: SavedMarketingTagRecord[];
  tagCount: number;
}) {
  const isParsedDocxCandidate = Boolean(parsedDocxPreview);

  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid={
        isParsedDocxCandidate
          ? "parsed-docx-marketing-tag-save-action"
          : "marketing-tag-save-action"
      }
    >
      <div className="border-2 border-studio-blue bg-studio-blue/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-blue">
              {isParsedDocxCandidate
                ? "Save Approved Parsed DOCX MarketingTags"
                : "MarketingTag Local Vault Save"}
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="marketing-tags-save-limited-scope-notice"
            >
              {isParsedDocxCandidate
                ? "Explicit save only — parsed DOCX MarketingTags are not auto-saved. Only approved marketing tags are saved and linked to the saved SourceCard."
                : "Only approved marketing tags are saved and linked to the saved SourceCard. KnowledgeCards, drafts, and Obsidian exports are not saved yet."}
            </p>
          </div>
          <span className="status-pill">Tags only</span>
        </div>

        <button
          className="mt-4 w-full border-2 border-studio-blue bg-studio-blue/15 px-3 py-3 text-xs font-black uppercase text-studio-blue shadow-pixel disabled:opacity-60"
          data-testid="save-marketing-tags-button"
          disabled={isSaving || tagCount === 0}
          onClick={onSave}
          type="button"
        >
          {isSaving
            ? "Saving MarketingTags..."
            : isParsedDocxCandidate
              ? "Save Approved Parsed DOCX MarketingTags"
              : "Save Approved Tags to Local Vault"}
        </button>

        {tagCount === 0 ? (
          <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold">
            MarketingTag save is available only when user-approved tag candidates exist.
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-sm font-black leading-6 text-studio-rose">
            {error}
          </p>
        ) : null}

        {result ? <MarketingTagSaveResultPanel result={result} /> : null}
        {result?.saved ? (
          <SavedMarketingTagsVerificationPanel
            linkedTags={linkedTags}
            savedTags={savedTags}
          />
        ) : null}
      </div>
    </section>
  );
}

function MarketingTagSaveResultPanel({
  result
}: {
  result: SaveMarketingTagsResult;
}) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="marketing-tags-save-result"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            MarketingTag save result
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {result.saved
              ? "Saved approved MarketingTags and SourceCard links"
              : "MarketingTag save blocked"}
          </p>
        </div>
        <span className="status-pill">{result.saved ? "persisted: true" : "blocked"}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SummaryStat label="Tags" value={result.tagCount} />
        <SummaryStat label="Links" value={result.linkedTagCount} />
      </div>
      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p>SourceCard ID: {result.sourceCardId}</p>
        <p data-testid="marketing-tags-save-count">
          Saved MarketingTags: {result.tagCount}
        </p>
        <p data-testid="marketing-tags-linked-count">
          SourceCard tag links: {result.linkedTagCount}
        </p>
        <p>Database path: {result.dbPath}</p>
      </div>

      {result.blockers.length > 0 ? (
        <NoticeList
          dataTestId="marketing-tags-save-blockers"
          emptyText="No MarketingTag save blockers."
          tone="rose"
          values={result.blockers}
        />
      ) : null}
      {result.warnings.length > 0 ? (
        <NoticeList
          dataTestId="marketing-tags-save-warnings"
          emptyText="No MarketingTag save warnings."
          tone="gold"
          values={result.warnings}
        />
      ) : null}
    </div>
  );
}

function SavedMarketingTagsVerificationPanel({
  linkedTags,
  savedTags
}: {
  linkedTags: SavedSourceCardTagRecord[];
  savedTags: SavedMarketingTagRecord[];
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3">
      <div className="grid gap-2" data-testid="saved-marketing-tags-list">
        <p className="text-xs font-black uppercase text-slate-400">
          Saved MarketingTags
        </p>
        {savedTags.length > 0 ? (
          savedTags.map((tag) => (
            <article
              className="border-l-4 border-studio-blue bg-studio-panel/60 p-2"
              data-testid="saved-marketing-tag-row"
              key={tag.tagId}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{tag.label}</p>
                  <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                    {tag.tagId}
                  </p>
                </div>
                <span className="status-pill">{tag.tier}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {tag.category} · review {tag.reviewStatus}
              </p>
            </article>
          ))
        ) : (
          <p className="border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6 text-slate-300">
            No saved MarketingTags have been read yet.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2" data-testid="saved-source-card-tags-list">
        <p className="text-xs font-black uppercase text-slate-400">
          Saved SourceCard tag links
        </p>
        {linkedTags.length > 0 ? (
          linkedTags.map((tag) => (
            <article
              className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
              data-testid="saved-source-card-tag-row"
              key={`${tag.sourceCardId}-${tag.tagId}`}
            >
              <p className="font-black text-white">{tag.label}</p>
              <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                {tag.sourceCardId} → {tag.tagId}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {tag.category} · {tag.tier} · review {tag.reviewStatus}
              </p>
            </article>
          ))
        ) : (
          <p className="border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6 text-slate-300">
            No SourceCard tag links have been read yet.
          </p>
        )}
      </div>
    </section>
  );
}

function ParsedDocxKnowledgeCardCandidatePanel({
  onReviewStatusChange,
  preview,
  reviewStatuses
}: {
  onReviewStatusChange: (
    candidateId: string,
    reviewStatus: KnowledgeCardReviewDecision
  ) => void;
  preview: ParsedDocxKnowledgeCardCandidatePreview | null;
  reviewStatuses: Record<string, KnowledgeCardReviewDecision>;
}) {
  const reviewedCandidates = preview
    ? createReviewedParsedKnowledgeCardCandidates({ preview, reviewStatuses })
    : [];

  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-knowledge-card-candidates-panel"
    >
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              Parsed DOCX KnowledgeCard Candidates
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="parsed-docx-knowledge-card-candidate-only-notice"
            >
              Candidates only — KnowledgeCards are not auto-saved.
            </p>
          </div>
          <span className="status-pill">
            {preview ? statusLabels[preview.readiness.validationStatus] : "Blocked"}
          </span>
        </div>

        {preview ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <SummaryStat label="Candidates" value={preview.readiness.candidateCount} />
              <SummaryStat
                label="Approved tags"
                value={preview.readiness.approvedMarketingTagCount}
              />
              <SummaryStat label="Trace ready" value={preview.readiness.traceReadyCount} />
              <SummaryStat label="Concept" value={preview.readiness.conceptCount} />
              <SummaryStat label="Evidence" value={preview.readiness.evidenceCount} />
              <SummaryStat label="Quote" value={preview.readiness.quoteCount} />
              <SummaryStat label="Case" value={preview.readiness.caseCount} />
              <SummaryStat
                label="Writing angle"
                value={preview.readiness.writingAngleCount}
              />
              <SummaryStat label="Approved cards" value={reviewedCandidates.length} />
            </div>

            <div
              className="mt-3 grid gap-1 text-sm leading-6 text-slate-300"
              data-testid="parsed-docx-knowledge-card-provenance"
            >
              <p>
                Linked saved SourceDocument ID:{" "}
                {preview.readiness.linkedSavedSourceDocumentId}
              </p>
              <p>Linked saved SourceCard ID: {preview.readiness.linkedSavedSourceCardId}</p>
              <p>{preview.readiness.pageNumberWarning}</p>
              <p>Trace requirement: every candidate must have a chunk reference.</p>
            </div>

            <div
              className="mt-4 grid gap-2"
              data-testid="parsed-docx-knowledge-card-candidate-list"
            >
              {preview.candidates.map((candidate) => {
                const decision =
                  reviewStatuses[candidate.candidateId] ?? "needs_review";

                return (
                  <article
                    className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
                    key={candidate.candidateId}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-white">{candidate.title}</p>
                        <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                          {candidate.cardType} ·{" "}
                          {candidate.traceReference?.chunkReference ?? "trace required"}
                        </p>
                      </div>
                      <span className="status-pill">
                        {formatKnowledgeCardReviewDecision(decision)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {candidate.contentPreview}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <ParsedKnowledgeCardReviewButton
                        isActive={decision === "approved"}
                        label="Approve"
                        onClick={() =>
                          onReviewStatusChange(candidate.candidateId, "approved")
                        }
                        testId="approve-parsed-docx-knowledge-card-button"
                        tone="teal"
                      />
                      <ParsedKnowledgeCardReviewButton
                        isActive={decision === "needs_review"}
                        label="Needs Review"
                        onClick={() =>
                          onReviewStatusChange(candidate.candidateId, "needs_review")
                        }
                        tone="gold"
                      />
                      <ParsedKnowledgeCardReviewButton
                        isActive={decision === "rejected"}
                        label="Reject"
                        onClick={() =>
                          onReviewStatusChange(candidate.candidateId, "rejected")
                        }
                        tone="rose"
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <NoticeList
              dataTestId="parsed-docx-knowledge-card-blockers"
              emptyText="No parsed DOCX KnowledgeCard candidate blockers."
              tone="rose"
              values={preview.readiness.blockers}
            />
            <NoticeList
              dataTestId="parsed-docx-knowledge-card-warnings"
              emptyText="No parsed DOCX KnowledgeCard candidate warnings."
              tone="gold"
              values={preview.readiness.warnings}
            />
          </>
        ) : (
          <p
            className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold"
            data-testid="parsed-docx-knowledge-card-preview-blocker"
          >
            Preview-only blocker: save parsed-DOCX MarketingTags before creating
            parsed-DOCX KnowledgeCard candidates.
          </p>
        )}
      </div>
    </section>
  );
}

function ParsedKnowledgeCardReviewButton({
  isActive,
  label,
  onClick,
  testId,
  tone
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
  testId?: string;
  tone: "gold" | "rose" | "teal";
}) {
  const toneClass =
    tone === "teal"
      ? "border-studio-teal text-studio-teal"
      : tone === "rose"
        ? "border-studio-rose text-studio-rose"
        : "border-studio-gold text-studio-gold";

  return (
    <button
      className={`border-2 px-2 py-2 text-[10px] font-black uppercase ${
        isActive ? "bg-white/15" : "bg-studio-panel/70"
      } ${toneClass}`}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function KnowledgeCardSaveAction({
  detail,
  error,
  isSaving,
  items,
  knowledgeCardCount,
  onSave,
  parsedDocxPreview,
  result,
  tagLinkCount,
  validation
}: {
  detail: SavedKnowledgeCardDetail | null;
  error: string | null;
  isSaving: boolean;
  items: SavedKnowledgeCardListItem[];
  knowledgeCardCount: number;
  onSave: () => void;
  parsedDocxPreview: ParsedDocxKnowledgeCardCandidatePreview | null;
  result: SaveKnowledgeCardsResult | null;
  tagLinkCount: number;
  validation: ParsedDocxKnowledgeCardSaveValidation | null;
}) {
  const isParsedDocxCandidate = Boolean(parsedDocxPreview);
  const hasValidationBlockers = Boolean(validation?.blockers.length);

  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid={
        isParsedDocxCandidate
          ? "parsed-docx-knowledge-card-save-action"
          : "knowledge-card-save-action"
      }
    >
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              {isParsedDocxCandidate
                ? "Save Approved Parsed DOCX KnowledgeCards"
                : "KnowledgeCard Local Vault Save"}
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="knowledge-cards-save-limited-scope-notice"
            >
              {isParsedDocxCandidate
                ? "Explicit save only — parsed DOCX KnowledgeCards are not auto-saved. Only approved KnowledgeCards are saved."
                : "Only approved KnowledgeCards are saved. Drafts and Obsidian exports are not saved yet."}
            </p>
          </div>
          <span className="status-pill">KnowledgeCards only</span>
        </div>

        {validation ? (
          <ParsedDocxKnowledgeCardSaveValidationPanel
            preview={parsedDocxPreview}
            validation={validation}
          />
        ) : null}

        <button
          className="mt-4 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
          data-testid="save-knowledge-cards-button"
          disabled={isSaving || knowledgeCardCount === 0 || hasValidationBlockers}
          onClick={onSave}
          type="button"
        >
          {isSaving
            ? "Saving KnowledgeCards..."
            : isParsedDocxCandidate
              ? "Save Approved Parsed DOCX KnowledgeCards"
              : "Save Approved KnowledgeCards to Local Vault"}
        </button>

        {tagLinkCount === 0 ? (
          <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold">
            KnowledgeCards can still be saved, but no saved MarketingTag links are
            available yet.
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-sm font-black leading-6 text-studio-rose">
            {error}
          </p>
        ) : null}

        {result ? (
          <KnowledgeCardSaveResultPanel
            parsedDocxPreview={parsedDocxPreview}
            result={result}
            validation={validation}
          />
        ) : null}
        {result?.saved ? (
          <SavedKnowledgeCardsVerificationPanel
            detail={detail}
            isParsedDocxCandidate={isParsedDocxCandidate}
            items={items}
            validation={validation}
          />
        ) : null}
      </div>
    </section>
  );
}

function ParsedDocxKnowledgeCardSaveValidationPanel({
  preview,
  validation
}: {
  preview: ParsedDocxKnowledgeCardCandidatePreview | null;
  validation: ParsedDocxKnowledgeCardSaveValidation;
}) {
  return (
    <div
      className="mt-4 border-l-4 border-studio-teal bg-studio-panel/60 p-3"
      data-testid="parsed-docx-knowledge-card-save-validation"
    >
      <p className="text-xs font-black uppercase text-studio-teal">
        Parsed DOCX KnowledgeCard Save Verification
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <SummaryStat
          label="Approved tags"
          value={preview?.readiness.approvedMarketingTagCount ?? 0}
        />
        <SummaryStat
          label="Candidates"
          value={validation.candidateSummaries.length}
        />
        <SummaryStat label="Trace refs" value={validation.traceReferenceCount} />
      </div>
      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p>
          Linked saved SourceDocument ID:{" "}
          {preview?.readiness.linkedSavedSourceDocumentId ?? "not linked"}
        </p>
        <p>
          Linked saved SourceCard ID:{" "}
          {preview?.readiness.linkedSavedSourceCardId ?? "not linked"}
        </p>
        <p>Parser source: {validation.parserSource}</p>
        <p>Candidate status required: needs_review before save.</p>
        <p>
          DOCX page-number warning:{" "}
          {validation.allPageNumbersUntrusted
            ? "DOCX page numbers are untrusted."
            : "Page-number trust violation detected."}
        </p>
        <p>
          No-fabricated-citation warning:{" "}
          {validation.noFinalCitationReadiness
            ? "No final citation/readiness is implied."
            : "Citation readiness violation detected."}
        </p>
        <p>Explicit-save-only notice: KnowledgeCards are not auto-saved.</p>
      </div>
      <div
        className="mt-3 grid gap-1 text-xs leading-5 text-slate-400"
        data-testid="parsed-docx-knowledge-card-save-candidate-summary"
      >
        {validation.candidateSummaries.map((candidate) => (
          <p key={candidate.candidateId}>
            {candidate.candidateId} · {candidate.cardType} ·{" "}
            {candidate.chunkReference ?? "trace required"} ·{" "}
            {candidate.validationStatus}
          </p>
        ))}
      </div>
      <NoticeList
        dataTestId="parsed-docx-knowledge-card-save-validation-blockers"
        emptyText="No parsed DOCX KnowledgeCard save validation blockers."
        tone="rose"
        values={validation.blockers}
      />
      <NoticeList
        dataTestId="parsed-docx-knowledge-card-save-validation-warnings"
        emptyText="No parsed DOCX KnowledgeCard save validation warnings."
        tone="gold"
        values={validation.validationWarnings}
      />
    </div>
  );
}

function KnowledgeCardSaveResultPanel({
  parsedDocxPreview,
  result,
  validation
}: {
  parsedDocxPreview: ParsedDocxKnowledgeCardCandidatePreview | null;
  result: SaveKnowledgeCardsResult;
  validation: ParsedDocxKnowledgeCardSaveValidation | null;
}) {
  const isParsedDocxCandidate = Boolean(parsedDocxPreview);

  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="knowledge-cards-save-result"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            KnowledgeCard save result
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {result.saved
              ? "Saved approved KnowledgeCards"
              : "KnowledgeCard save blocked"}
          </p>
        </div>
        <span className="status-pill">{result.saved ? "persisted: true" : "blocked"}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <SummaryStat label="Cards" value={result.knowledgeCardCount} />
        <SummaryStat label="Traces" value={result.traceRefCount} />
        <SummaryStat label="Tag links" value={result.linkedTagCount} />
      </div>
      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p>SourceCard ID: {result.sourceCardId}</p>
        <p data-testid="knowledge-cards-save-count">
          Saved KnowledgeCards: {result.knowledgeCardCount}
        </p>
        <p>Trace refs: {result.traceRefCount}</p>
        <p>Linked tags: {result.linkedTagCount}</p>
        <p>Database path: {result.dbPath}</p>
        {isParsedDocxCandidate ? (
          <>
            <p data-testid="parsed-docx-knowledge-card-save-verification">
              Saved KnowledgeCard count: {result.knowledgeCardCount} · linked
              SourceCard ID: {result.sourceCardId} · trace count:{" "}
              {result.traceRefCount}
            </p>
            <p>
              Saved KnowledgeCard IDs/types:{" "}
              {validation?.candidateSummaries
                .slice(0, result.knowledgeCardCount)
                .map((candidate) => `${candidate.candidateId}/${candidate.cardType}`)
                .join(", ") || "read/list verification pending"}
            </p>
            <p>
              Human academic review warning: saved parsed-DOCX KnowledgeCards still
              need academic review before DraftArtifact use.
            </p>
          </>
        ) : null}
      </div>

      {result.blockers.length > 0 ? (
        <NoticeList
          dataTestId="knowledge-cards-save-blockers"
          emptyText="No KnowledgeCard save blockers."
          tone="rose"
          values={result.blockers}
        />
      ) : null}
      {result.warnings.length > 0 ? (
        <NoticeList
          dataTestId="knowledge-cards-save-warnings"
          emptyText="No KnowledgeCard save warnings."
          tone="gold"
          values={result.warnings}
        />
      ) : null}
    </div>
  );
}

function SavedKnowledgeCardsVerificationPanel({
  detail,
  isParsedDocxCandidate,
  items,
  validation
}: {
  detail: SavedKnowledgeCardDetail | null;
  isParsedDocxCandidate: boolean;
  items: SavedKnowledgeCardListItem[];
  validation: ParsedDocxKnowledgeCardSaveValidation | null;
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3">
      {isParsedDocxCandidate ? (
        <div
          className="mb-4 border-l-4 border-studio-blue bg-studio-panel/60 p-3"
          data-testid="parsed-docx-knowledge-card-read-list-verification"
        >
          <p className="text-xs font-black uppercase text-studio-blue">
            Parsed DOCX KnowledgeCard Read/List Verification
          </p>
          <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
            <p>Read/list result: {items.length > 0 ? "available" : "pending"}</p>
            <p>Saved KnowledgeCard count: {items.length}</p>
            <p>
              Saved KnowledgeCard IDs/types:{" "}
              {items
                .map((item) => `${item.knowledgeCardId}/${item.cardType}`)
                .join(", ") || "none"}
            </p>
            <p>Linked SourceCard ID: {detail?.sourceCard.sourceCardId ?? "pending"}</p>
            <p>
              Trace count:{" "}
              {detail?.traces.length ?? validation?.traceReferenceCount ?? 0}
            </p>
            <p>
              Human academic review warning: cards still need human academic review.
            </p>
          </div>
        </div>
      ) : null}
      <div className="grid gap-2" data-testid="saved-knowledge-cards-list">
        <p className="text-xs font-black uppercase text-slate-400">
          Saved KnowledgeCards
        </p>
        {items.length > 0 ? (
          items.map((item) => (
            <article
              className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
              data-testid="saved-knowledge-card-row"
              key={item.knowledgeCardId}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{item.title}</p>
                  <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                    {item.knowledgeCardId}
                  </p>
                </div>
                <span className="status-pill">{item.cardType}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                SourceCard: {item.sourceCardId} · citation {item.citationReadiness}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                Traces: {item.traceCount} · Tags: {item.tagCount}
              </p>
            </article>
          ))
        ) : (
          <p className="border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6 text-slate-300">
            No saved KnowledgeCards have been read yet.
          </p>
        )}
      </div>

      {detail ? (
        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="saved-knowledge-card-detail"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Saved KnowledgeCard detail
          </p>
          <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
            <p>KnowledgeCard ID: {detail.knowledgeCard.knowledgeCardId}</p>
            <p>Title: {detail.knowledgeCard.title}</p>
            <p>Type: {detail.knowledgeCard.cardType}</p>
            <p>Citation readiness: {detail.knowledgeCard.citationReadiness}</p>
            <p>Trace readiness: {detail.knowledgeCard.traceReadiness}</p>
            <p>Linked SourceCard: {detail.sourceCard.sourceCardId}</p>
            <p>
              Trace refs:{" "}
              {detail.traces.map((trace) => trace.chunkReference).join(", ")}
            </p>
            <p>Tag links: {detail.tags.map((tag) => tag.label).join(", ") || "none"}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ParsedDocxDraftInputPackageReadinessPanel({
  readiness
}: {
  readiness: ParsedDocxDraftInputPackageReadiness;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-draft-input-readiness-panel"
    >
      <div className="border-2 border-studio-blue bg-studio-blue/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-blue">
              Parsed DOCX Draft Input Package Readiness
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="parsed-docx-draft-input-preview-only-notice"
            >
              Readiness preview only — no DraftArtifact is generated or saved.
            </p>
          </div>
          <span
            className="status-pill"
            data-testid="parsed-docx-draft-input-status"
          >
            {readiness.draftInputPackageStatus}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SummaryStat label="Approved tags" value={readiness.approvedTagCount} />
          <SummaryStat
            label="KnowledgeCards"
            value={readiness.savedKnowledgeCardCount}
          />
          <SummaryStat
            label="Trace ready"
            value={readiness.traceReadyKnowledgeCardCount}
          />
          <SummaryStat label="Concept" value={readiness.knowledgeCardTypeCounts.concept} />
          <SummaryStat
            label="Evidence"
            value={readiness.knowledgeCardTypeCounts.evidence}
          />
          <SummaryStat label="Quote" value={readiness.knowledgeCardTypeCounts.quote} />
          <SummaryStat label="Case" value={readiness.knowledgeCardTypeCounts.case} />
          <SummaryStat
            label="Writing angle"
            value={readiness.knowledgeCardTypeCounts.writing_angle}
          />
          <SummaryStat label="Save" value="No" />
        </div>

        <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
          <p data-testid="parsed-docx-draft-input-source-document-id">
            Linked saved SourceDocument ID: {readiness.sourceDocumentId ?? "not linked"}
          </p>
          <p data-testid="parsed-docx-draft-input-source-card-id">
            Linked saved SourceCard ID: {readiness.sourceCardId ?? "not linked"}
          </p>
          <p data-testid="parsed-docx-draft-input-type-counts">
            KnowledgeCard type counts: concept{" "}
            {readiness.knowledgeCardTypeCounts.concept}, evidence{" "}
            {readiness.knowledgeCardTypeCounts.evidence}, quote{" "}
            {readiness.knowledgeCardTypeCounts.quote}, case{" "}
            {readiness.knowledgeCardTypeCounts.case}, writing_angle{" "}
            {readiness.knowledgeCardTypeCounts.writing_angle}
          </p>
          <p data-testid="parsed-docx-draft-input-evidence-coverage">
            Evidence coverage: {readiness.evidenceCoverageSummary}
          </p>
          <p data-testid="parsed-docx-draft-input-citation-readiness">
            Citation readiness: {readiness.citationReadinessSummary}
          </p>
          <p data-testid="parsed-docx-draft-input-next-action">
            Recommended next action: {readiness.recommendedNextAction}
          </p>
        </div>

        <NoticeList
          dataTestId="parsed-docx-draft-input-blockers"
          emptyText="No parsed DOCX draft input readiness blockers."
          tone="rose"
          values={readiness.blockers}
        />
        <NoticeList
          dataTestId="parsed-docx-draft-input-warnings"
          emptyText="No parsed DOCX draft input readiness warnings."
          tone="gold"
          values={readiness.warnings}
        />
      </div>
    </section>
  );
}

function ParsedDocxDraftArtifactCandidatePreviewPanel({
  preview
}: {
  preview: ParsedDocxDraftArtifactCandidatePreview;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-draft-artifact-candidate-preview"
    >
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              Parsed DOCX DraftArtifact Candidate Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="parsed-docx-draft-artifact-preview-only-notice"
            >
              Preview only — DraftArtifact is not saved and prose is not final.
            </p>
          </div>
          <span
            className="status-pill"
            data-testid="parsed-docx-draft-artifact-candidate-status"
          >
            {preview.draftArtifactCandidateStatus}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SummaryStat
            label="Sections"
            value={preview.sectionCandidates.length}
          />
          <SummaryStat
            label="KnowledgeCards"
            value={
              new Set(
                preview.sectionCandidates.flatMap(
                  (section) => section.linkedKnowledgeCardIds
                )
              ).size
            }
          />
          <SummaryStat
            label="Trace refs"
            value={
              new Set(
                preview.sectionCandidates.flatMap((section) => section.traceReferences)
              ).size
            }
          />
        </div>

        <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
          <p>Candidate ID: {preview.draftArtifactCandidateId}</p>
          <p>Linked saved SourceDocument ID: {preview.sourceDocumentId ?? "not linked"}</p>
          <p>Linked saved SourceCard ID: {preview.sourceCardId ?? "not linked"}</p>
          <p data-testid="parsed-docx-draft-artifact-coverage">
            KnowledgeCard coverage: {preview.knowledgeCardCoverage}
          </p>
          <p data-testid="parsed-docx-draft-artifact-trace-summary">
            Trace coverage: {preview.evidenceTraceSummary}
          </p>
          <p data-testid="parsed-docx-draft-artifact-citation-summary">
            Citation placeholders: {preview.citationPlaceholderSummary}
          </p>
          <p>Recommended next action: {preview.recommendedNextAction}</p>
        </div>

        <div
          className="mt-4 grid gap-2"
          data-testid="parsed-docx-draft-artifact-section-candidates"
        >
          {preview.sectionCandidates.map((section) => (
            <article
              className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
              key={section.sectionId}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{section.sectionTitle}</p>
                  <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                    {section.sectionType} · {section.sectionId}
                  </p>
                </div>
                <span className="status-pill">skeleton only</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {section.skeletonNote}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Linked KnowledgeCards:{" "}
                {section.linkedKnowledgeCardIds.join(", ") || "none"}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                Trace refs: {section.traceReferences.join(", ") || "none"} ·
                citation placeholders {section.citationPlaceholderCount}
              </p>
            </article>
          ))}
        </div>

        <NoticeList
          dataTestId="parsed-docx-draft-artifact-blockers"
          emptyText="No parsed DOCX DraftArtifact candidate blockers."
          tone="rose"
          values={preview.blockers}
        />
        <NoticeList
          dataTestId="parsed-docx-draft-artifact-warnings"
          emptyText="No parsed DOCX DraftArtifact candidate warnings."
          tone="gold"
          values={preview.warnings}
        />
      </div>
    </section>
  );
}

function ParsedDocxDraftArtifactSaveAction({
  candidate,
  detail,
  error,
  exportPackagePreview,
  isSaving,
  items,
  onSave,
  result,
  reviewGate,
  validation
}: {
  candidate: ParsedDocxDraftArtifactSaveCandidate | null;
  detail: SavedDraftArtifactDetail | null;
  error: string | null;
  exportPackagePreview: ParsedDocxExportPackagePreview | null;
  isSaving: boolean;
  items: SavedDraftArtifactListItem[];
  onSave: () => void;
  result: SaveDraftArtifactResult | null;
  reviewGate: ParsedDocxDraftArtifactReviewGate | null;
  validation: ParsedDocxDraftArtifactSaveValidation;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-draft-artifact-save-action"
    >
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              Save Parsed DOCX DraftArtifact
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="parsed-docx-draft-artifact-save-limited-scope-notice"
            >
              Explicit save only — DraftArtifact is not auto-saved and prose is not
              final.
            </p>
          </div>
          <span className="status-pill">mock/not-final</span>
        </div>

        <div
          className="mt-3 grid gap-1 text-sm leading-6 text-slate-300"
          data-testid="parsed-docx-draft-artifact-save-readiness"
        >
          <p>Candidate status: {candidate?.draftArtifact.validationStatus ?? "blocked"}</p>
          <p>Section count: {validation.sectionCount}</p>
          <p>Linked KnowledgeCard count: {validation.linkedKnowledgeCardCount}</p>
          <p>Trace coverage: {validation.traceReferenceCount} section trace groups</p>
          <p>Mock/not-final: {validation.mockNotFinal ? "yes" : "no"}</p>
        </div>

        <button
          className="mt-4 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
          data-testid="save-parsed-docx-draft-artifact-button"
          disabled={isSaving || !validation.canSave}
          onClick={onSave}
          type="button"
        >
          {isSaving
            ? "Saving parsed DOCX DraftArtifact..."
            : "Save Parsed DOCX DraftArtifact"}
        </button>

        {error ? (
          <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-sm font-black leading-6 text-studio-rose">
            {error}
          </p>
        ) : null}

        <NoticeList
          dataTestId="parsed-docx-draft-artifact-save-blockers"
          emptyText="No parsed DOCX DraftArtifact save blockers."
          tone="rose"
          values={validation.blockers}
        />
        <NoticeList
          dataTestId="parsed-docx-draft-artifact-save-warnings"
          emptyText="No parsed DOCX DraftArtifact save warnings."
          tone="gold"
          values={[...validation.validationWarnings, ...(candidate?.warnings ?? [])]}
        />

        {result ? (
          <ParsedDocxDraftArtifactSaveResultPanel result={result} />
        ) : null}
        {result?.saved ? (
          <ParsedDocxSavedDraftArtifactVerificationPanel
            detail={detail}
            exportPackagePreview={exportPackagePreview}
            items={items}
            reviewGate={reviewGate}
          />
        ) : null}
      </div>
    </section>
  );
}

function ParsedDocxDraftArtifactSaveResultPanel({
  result
}: {
  result: SaveDraftArtifactResult;
}) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-draft-artifact-save-result"
    >
      <p className="text-xs font-black uppercase text-slate-400">
        Parsed DOCX DraftArtifact save result
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <SummaryStat label="Sections" value={result.sectionCount} />
        <SummaryStat
          label="KnowledgeCards"
          value={result.linkedKnowledgeCardCount}
        />
        <SummaryStat label="Status" value={result.saved ? "Saved" : "Blocked"} />
      </div>
      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p>Saved DraftArtifact ID: {result.draftArtifactId}</p>
        <p>Saved status: {result.saved ? "saved mock/not-final" : "blocked"}</p>
        <p>Saved draft sections: {result.sectionCount}</p>
        <p>Linked KnowledgeCards: {result.linkedKnowledgeCardCount}</p>
        <p>SourceCard ID: {result.sourceCardId}</p>
      </div>
      <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold">
        Saved as mock/not-final DraftArtifact. Academic prose and citations still
        require review.
      </p>
    </div>
  );
}

function ParsedDocxSavedDraftArtifactVerificationPanel({
  detail,
  exportPackagePreview,
  items,
  reviewGate
}: {
  detail: SavedDraftArtifactDetail | null;
  exportPackagePreview: ParsedDocxExportPackagePreview | null;
  items: SavedDraftArtifactListItem[];
  reviewGate: ParsedDocxDraftArtifactReviewGate | null;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-draft-artifact-read-list-verification"
    >
      <p className="text-xs font-black uppercase text-studio-blue">
        Parsed DOCX DraftArtifact Read/List Verification
      </p>
      <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
        <p>Read/list result: {items.length > 0 ? "available" : "pending"}</p>
        <p>
          Saved DraftArtifact IDs:{" "}
          {items.map((item) => item.draftArtifactId).join(", ") || "none"}
        </p>
        <p>Saved section count: {detail?.sections.length ?? 0}</p>
        <p>Linked KnowledgeCard count: {detail?.knowledgeCards.length ?? 0}</p>
        <p>
          Saved status:{" "}
          {detail
            ? `${detail.draftArtifact.artifactStatus}; mock/not-final ${detail.draftArtifact.mockOnly ? "yes" : "no"}/${detail.draftArtifact.notFinal ? "yes" : "no"}`
            : "pending"}
        </p>
        <p>
          Saved section titles:{" "}
          {detail?.sections.map((section) => section.sectionTitle).join(", ") ??
            "pending"}
        </p>
      </div>
      <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold">
        Saved as mock/not-final DraftArtifact. Academic prose and citations still
        require review. DOCX export is not triggered automatically.
      </p>
      {reviewGate ? (
        <ParsedDocxDraftArtifactReviewGatePanel review={reviewGate} />
      ) : null}
      {exportPackagePreview ? (
        <ParsedDocxExportPackagePreviewPanel preview={exportPackagePreview} />
      ) : null}
    </section>
  );
}

function ParsedDocxDraftArtifactReviewGatePanel({
  review
}: {
  review: ParsedDocxDraftArtifactReviewGate;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-draft-artifact-review-gate"
    >
      <div className="border-2 border-studio-gold bg-studio-gold/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-gold">
              Parsed DOCX DraftArtifact Citation & Evidence Review
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="parsed-docx-draft-artifact-review-gate-notice"
            >
              Review gate only — no DOCX export or final manuscript is generated.
            </p>
          </div>
          <span
            className="status-pill"
            data-testid="parsed-docx-draft-artifact-review-status"
          >
            {formatParsedDocxDraftArtifactReviewStatus(review.reviewStatus)}
          </span>
        </div>

        <div
          className="mt-3 grid gap-1 text-sm leading-6 text-slate-300"
          data-testid="parsed-docx-draft-artifact-review-summary"
        >
          <p>Saved DraftArtifact ID: {review.savedDraftArtifactId ?? "pending"}</p>
          <p>
            Linked KnowledgeCard coverage:{" "}
            {review.knowledgeCardCoverage.linkedDraftKnowledgeCardCount}/
            {review.knowledgeCardCoverage.savedKnowledgeCardCount}
          </p>
          <p>
            Approved MarketingTags:{" "}
            {review.knowledgeCardCoverage.approvedMarketingTagCount}
          </p>
          <p>
            Trace-ready KnowledgeCards:{" "}
            {review.knowledgeCardCoverage.traceReadyKnowledgeCardCount}
          </p>
          <p>Recommended next action: {review.recommendedNextAction}</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SummaryStat
            label="Evidence"
            value={`${review.evidenceCoverageScore}%`}
          />
          <SummaryStat
            label="Citation"
            value={`${review.citationReadinessScore}%`}
          />
          <SummaryStat label="Trace" value={`${review.traceCompletenessScore}%`} />
          <SummaryStat
            label="Sections"
            value={review.sectionReviewSummary.length}
          />
          <SummaryStat label="Warnings" value={review.unresolvedWarnings.length} />
          <SummaryStat label="Blockers" value={review.blockers.length} />
        </div>

        <div
          className="mt-4 grid gap-2"
          data-testid="parsed-docx-draft-artifact-section-review-summary"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Section review summary
          </p>
          {review.sectionReviewSummary.map((section) => (
            <article
              className="border-l-4 border-studio-blue bg-studio-panel/60 p-2"
              key={section.sectionId}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{section.sectionTitle}</p>
                  <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                    {section.sectionId}
                  </p>
                </div>
                <span className="status-pill">
                  {formatParsedDocxDraftArtifactReviewStatus(section.status)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Evidence refs: {section.evidenceReferenceCount} · citation
                placeholders: {section.citationPlaceholderCount} · trace refs:{" "}
                {section.traceReferenceCount}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                Linked KnowledgeCards: {section.linkedKnowledgeCardCount}
              </p>
            </article>
          ))}
        </div>

        <NoticeList
          dataTestId="parsed-docx-draft-artifact-review-blockers"
          emptyText="No parsed DOCX DraftArtifact review blockers."
          tone="rose"
          values={review.blockers}
        />
        <NoticeList
          dataTestId="parsed-docx-draft-artifact-review-warnings"
          emptyText="No parsed DOCX DraftArtifact review warnings."
          tone="gold"
          values={review.unresolvedWarnings}
        />
      </div>
    </section>
  );
}

function ParsedDocxExportPackagePreviewPanel({
  preview
}: {
  preview: ParsedDocxExportPackagePreview;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="parsed-docx-export-package-preview"
    >
      <div className="border-2 border-studio-blue bg-studio-blue/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-blue">
              Parsed DOCX Export Package Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="parsed-docx-export-package-preview-only-notice"
            >
              Preview only — no DOCX file is generated from parsed-DOCX path.
            </p>
          </div>
          <span
            className="status-pill"
            data-testid="parsed-docx-export-package-status"
          >
            {formatParsedDocxExportPackageStatus(preview.exportPackageStatus)}
          </span>
        </div>

        <div
          className="mt-3 grid gap-1 text-sm leading-6 text-slate-300"
          data-testid="parsed-docx-export-package-summary"
        >
          <p>Risk level: {preview.exportRiskLevel}</p>
          <p>DraftArtifact ID: {preview.draftArtifactId ?? "pending"}</p>
          <p>SourceCard ID: {preview.sourceCardId ?? "pending"}</p>
          <p>Section count: {preview.sectionCount}</p>
          <p>Citation placeholder count: {preview.citationPlaceholderCount}</p>
          <p>Trace summary: {preview.evidenceTraceSummary}</p>
          <p>Recommended next action: {preview.recommendedNextAction}</p>
        </div>

        <div
          className="mt-4 grid gap-2"
          data-testid="parsed-docx-export-package-checklist"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Export package checklist
          </p>
          {preview.checklist.map((item) => (
            <article
              className="border-l-4 border-studio-blue bg-studio-panel/60 p-2"
              key={item.label}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-black text-white">{item.label}</p>
                <span className="status-pill">
                  {item.passed ? "Ready" : "Needs review"}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.note}</p>
            </article>
          ))}
        </div>

        <NoticeList
          dataTestId="parsed-docx-export-package-blockers"
          emptyText="No parsed DOCX export package blockers."
          tone="rose"
          values={preview.blockers}
        />
        <NoticeList
          dataTestId="parsed-docx-export-package-warnings"
          emptyText="No parsed DOCX export package warnings."
          tone="gold"
          values={preview.unresolvedWarnings}
        />
      </div>
    </section>
  );
}

function DraftArtifactPersistenceReadinessPreview({
  readiness
}: {
  readiness: DraftArtifactPersistenceReadiness;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="draft-artifact-persistence-readiness-preview"
    >
      <div className="border-2 border-studio-gold bg-studio-gold/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-gold">
              DraftArtifact Persistence Readiness
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="draft-artifact-persistence-preview-only-notice"
            >
              Preview only — DraftArtifact is not saved yet.
            </p>
          </div>
          <span
            className="status-pill"
            data-testid="draft-artifact-persistence-status"
          >
            {formatDraftArtifactReadinessStatus(
              readiness.draftArtifactPersistenceReadiness
            )}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SummaryStat label="Sections" value={readiness.sectionCount} />
          <SummaryStat
            label="KnowledgeCards"
            value={readiness.linkedKnowledgeCardIds.length}
          />
          <SummaryStat label="Future save" value={readiness.canSaveLater ? "Yes" : "No"} />
          <SummaryStat label="Citation" value={readiness.citationReadiness} />
          <SummaryStat label="Trace" value={readiness.traceReadiness} />
          <SummaryStat label="Mock only" value={readiness.mockOnly ? "Yes" : "No"} />
        </div>

        <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
          <p>DraftArtifact candidate ID: {readiness.draftArtifactCandidateId}</p>
          <p data-testid="draft-artifact-linked-source-card-id">
            Linked SourceCard ID: {readiness.linkedSourceCardId ?? "not linked yet"}
          </p>
          <p data-testid="draft-artifact-linked-knowledge-card-count">
            Linked saved KnowledgeCards: {readiness.linkedKnowledgeCardIds.length}
          </p>
          <p>
            Linked KnowledgeCard IDs:{" "}
            {readiness.linkedKnowledgeCardIds.join(", ") || "none"}
          </p>
        </div>

        <NoticeList
          dataTestId="draft-artifact-persistence-blockers"
          emptyText="No DraftArtifact persistence blockers after saved KnowledgeCard verification."
          tone="rose"
          values={readiness.blockers}
        />
        <NoticeList
          dataTestId="draft-artifact-persistence-warnings"
          emptyText="No DraftArtifact persistence warnings."
          tone="gold"
          values={readiness.warnings}
        />
      </div>
    </section>
  );
}

function DraftArtifactSaveAction({
  detail,
  error,
  isSaving,
  items,
  onSave,
  readiness,
  result,
  sectionCandidateCount
}: {
  detail: SavedDraftArtifactDetail | null;
  error: string | null;
  isSaving: boolean;
  items: SavedDraftArtifactListItem[];
  onSave: () => void;
  readiness: DraftArtifactPersistenceReadiness;
  result: SaveDraftArtifactResult | null;
  sectionCandidateCount: number;
}) {
  const isBlocked =
    readiness.blockers.length > 0 ||
    !readiness.linkedSourceCardId ||
    readiness.linkedKnowledgeCardIds.length === 0 ||
    sectionCandidateCount === 0;

  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3">
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              DraftArtifact Local Vault Save
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="draft-artifact-save-limited-scope-notice"
            >
              Only mock/not-final DraftArtifact metadata, draft sections, and saved
              KnowledgeCard links are saved. No DOCX export, Obsidian export, or final
              manuscript is created.
            </p>
          </div>
          <span className="status-pill">DraftArtifact only</span>
        </div>

        <button
          className="mt-4 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
          data-testid="save-draft-artifact-button"
          disabled={isSaving || isBlocked}
          onClick={onSave}
          type="button"
        >
          {isSaving
            ? "Saving mock DraftArtifact..."
            : "Save Mock DraftArtifact to Local Vault"}
        </button>

        {isBlocked ? (
          <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold">
            DraftArtifact save is available only after SourceCard and KnowledgeCards
            are saved and readable.
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-sm font-black leading-6 text-studio-rose">
            {error}
          </p>
        ) : null}

        {result ? <DraftArtifactSaveResultPanel result={result} /> : null}
        {result?.saved ? (
          <SavedDraftArtifactsVerificationPanel detail={detail} items={items} />
        ) : null}
      </div>
    </section>
  );
}

function DraftArtifactSaveResultPanel({
  result
}: {
  result: SaveDraftArtifactResult;
}) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="draft-artifact-save-result"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            DraftArtifact save result
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {result.saved
              ? "Saved mock/not-final DraftArtifact"
              : "DraftArtifact save blocked"}
          </p>
        </div>
        <span className="status-pill">{result.saved ? "persisted: true" : "blocked"}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <SummaryStat label="Sections" value={result.sectionCount} />
        <SummaryStat
          label="KnowledgeCards"
          value={result.linkedKnowledgeCardCount}
        />
        <SummaryStat label="Warnings" value={result.warnings.length} />
      </div>
      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p data-testid="draft-artifact-save-id">
          DraftArtifact ID: {result.draftArtifactId}
        </p>
        <p>SourceCard ID: {result.sourceCardId}</p>
        <p data-testid="draft-artifact-save-section-count">
          Saved draft sections: {result.sectionCount}
        </p>
        <p data-testid="draft-artifact-save-linked-knowledge-card-count">
          Linked KnowledgeCards: {result.linkedKnowledgeCardCount}
        </p>
        <p>Database path: {result.dbPath}</p>
      </div>

      {result.blockers.length > 0 ? (
        <NoticeList
          dataTestId="draft-artifact-save-blockers"
          emptyText="No DraftArtifact save blockers."
          tone="rose"
          values={result.blockers}
        />
      ) : null}
      {result.warnings.length > 0 ? (
        <NoticeList
          dataTestId="draft-artifact-save-warnings"
          emptyText="No DraftArtifact save warnings."
          tone="gold"
          values={result.warnings}
        />
      ) : null}
    </div>
  );
}

function SavedDraftArtifactsVerificationPanel({
  detail,
  items
}: {
  detail: SavedDraftArtifactDetail | null;
  items: SavedDraftArtifactListItem[];
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3">
      <div className="grid gap-2" data-testid="saved-draft-artifact-list">
        <p className="text-xs font-black uppercase text-slate-400">
          Saved DraftArtifacts
        </p>
        {items.length > 0 ? (
          items.map((item) => (
            <article
              className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
              data-testid="saved-draft-artifact-row"
              key={item.draftArtifactId}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{item.title}</p>
                  <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                    {item.draftArtifactId}
                  </p>
                </div>
                <span className="status-pill">{item.artifactStatus}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                SourceCard: {item.sourceCardId} · type {item.draftType}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                Sections: {item.sectionCount} · KnowledgeCards:{" "}
                {item.linkedKnowledgeCardCount} · mock_only:{" "}
                {item.mockOnly ? "yes" : "no"} · not_final:{" "}
                {item.notFinal ? "yes" : "no"}
              </p>
            </article>
          ))
        ) : (
          <p className="border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6 text-slate-300">
            No saved DraftArtifacts have been read yet.
          </p>
        )}
      </div>

      {detail ? <SavedDraftArtifactDetailPanel detail={detail} /> : null}
    </section>
  );
}

function SavedDraftArtifactDetailPanel({
  detail
}: {
  detail: SavedDraftArtifactDetail;
}) {
  const reviewGate = reviewSavedDraftArtifactForCitationAndEvidence(detail);
  const exportPackagePreview = createDraftArtifactDocxExportPackagePreview({
    detail,
    review: reviewGate
  });

  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="saved-draft-artifact-detail"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            Saved DraftArtifact detail
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {detail.draftArtifact.title}
          </p>
        </div>
        <span className="status-pill">{detail.draftArtifact.artifactStatus}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <SummaryStat label="Sections" value={detail.sections.length} />
        <SummaryStat label="KnowledgeCards" value={detail.knowledgeCards.length} />
        <SummaryStat
          label="Mock only"
          value={detail.draftArtifact.mockOnly ? "Yes" : "No"}
        />
        <SummaryStat
          label="Not final"
          value={detail.draftArtifact.notFinal ? "Yes" : "No"}
        />
        <SummaryStat label="Citation" value={detail.draftArtifact.citationReadiness} />
        <SummaryStat label="Trace" value={detail.draftArtifact.traceReadiness} />
      </div>

      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p>DraftArtifact ID: {detail.draftArtifact.draftArtifactId}</p>
        <p>Linked SourceCard: {detail.sourceCard.sourceCardId}</p>
        <p>SourceCard title: {detail.sourceCard.title}</p>
        <p>
          Linked KnowledgeCards:{" "}
          {detail.knowledgeCards.map((card) => card.knowledgeCardId).join(", ")}
        </p>
      </div>

      <div className="mt-4 grid gap-2" data-testid="saved-draft-artifact-sections">
        <p className="text-xs font-black uppercase text-slate-400">
          Saved mock draft sections
        </p>
        {detail.sections.slice(0, 5).map((section) => (
          <article
            className="border-l-4 border-studio-blue bg-studio-panel/60 p-2"
            key={section.sectionId}
          >
            <p className="font-black text-white">{section.sectionTitle}</p>
            <p className="mt-1 text-xs font-black uppercase text-studio-blue">
              {section.sectionId}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {section.mockParagraph}
            </p>
          </article>
        ))}
      </div>

      <SavedDraftArtifactReviewGatePanel review={reviewGate} detail={detail} />
      <DocxExportPackagePreviewPanel preview={exportPackagePreview} />

      <p
        className="mt-4 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-xs font-black uppercase leading-5 text-studio-gold"
        data-testid="saved-draft-artifact-limited-scope-notice"
      >
        DraftArtifact save is limited to mock/not-final section previews. No final
        manuscript, DOCX export, Obsidian export, SourceCard, tag, or KnowledgeCard is
        created by this action.
      </p>
    </div>
  );
}

function SavedDraftArtifactReviewGatePanel({
  detail,
  review
}: {
  detail: SavedDraftArtifactDetail;
  review: SavedDraftArtifactReviewGate;
}) {
  const warnings = [
    ...review.citationWarnings,
    ...review.traceWarnings,
    ...review.evidenceWarnings,
    ...review.missingKnowledgeCardLinks
  ];

  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="saved-draft-artifact-review-gate"
    >
      <div className="border-2 border-studio-gold bg-studio-gold/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-gold">
              Saved DraftArtifact Citation & Evidence Review
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="saved-draft-artifact-review-limited-scope-notice"
            >
              Review gate only — this is not DOCX export, final manuscript approval,
              or real APA citation validation.
            </p>
          </div>
          <span
            className="status-pill"
            data-testid="saved-draft-artifact-review-overall-status"
          >
            {formatSavedDraftArtifactReviewStatus(review.overallStatus)}
          </span>
        </div>

        <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
          <p>DraftArtifact: {detail.draftArtifact.title}</p>
          <p>DraftArtifact ID: {detail.draftArtifact.draftArtifactId}</p>
          <p>
            Linked KnowledgeCards: {review.linkedKnowledgeCardCount} · export risk:{" "}
            <span data-testid="saved-draft-artifact-export-risk">
              {review.exportRiskLevel}
            </span>
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SummaryStat
            label="Citation"
            value={`${review.citationReadinessScore}%`}
          />
          <SummaryStat
            label="Evidence"
            value={`${review.evidenceCoverageScore}%`}
          />
          <SummaryStat label="Trace" value={`${review.traceCompletenessScore}%`} />
          <SummaryStat label="Sections" value={review.sectionReviews.length} />
          <SummaryStat label="Blockers" value={review.blockers.length} />
          <SummaryStat label="Warnings" value={warnings.length} />
        </div>

        <div
          className="mt-4 grid gap-2"
          data-testid="saved-draft-artifact-section-reviews"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Section review summary
          </p>
          {review.sectionReviews.map((section) => (
            <article
              className="border-l-4 border-studio-blue bg-studio-panel/60 p-2"
              key={section.sectionId}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{section.sectionTitle}</p>
                  <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                    {section.sectionId}
                  </p>
                </div>
                <span className="status-pill">
                  {formatSavedDraftArtifactReviewStatus(section.status)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Evidence refs: {section.evidenceReferenceCount} · citation
                placeholders: {section.citationPlaceholderCount} · trace refs:{" "}
                {section.traceReferenceCount}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                Linked KnowledgeCards available: {section.linkedKnowledgeCardCount}
              </p>
            </article>
          ))}
        </div>

        <NoticeList
          dataTestId="saved-draft-artifact-review-blockers"
          emptyText="No blocking issues were found for this saved mock DraftArtifact."
          tone="rose"
          values={review.blockers}
        />
        <NoticeList
          dataTestId="saved-draft-artifact-review-warnings"
          emptyText="No citation, evidence, or trace warnings were found."
          tone="gold"
          values={warnings}
        />
        <NoticeList
          dataTestId="saved-draft-artifact-review-recommendations"
          emptyText="No further recommendations."
          tone="gold"
          values={review.recommendations}
        />
      </div>
    </section>
  );
}

function DocxExportPackagePreviewPanel({
  preview
}: {
  preview: DocxExportPackagePreview;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportDocxResult | null>(null);
  const isBlocked = preview.exportStatus === "blocked";

  async function handleExportDocx() {
    setIsExporting(true);
    setExportError(null);

    try {
      if (isSourceLibraryQaModeEnabled()) {
        setExportResult(createQaDocxExportResult(preview));
        return;
      }

      const result = await exportDocxFromDraftArtifactPackage(preview);
      setExportResult(result);
    } catch (error) {
      setExportResult(null);
      setExportError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to export DOCX MVP file."
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="docx-export-package-preview"
    >
      <div className="border-2 border-studio-blue bg-studio-blue/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-blue">
              DOCX Export Package Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="docx-export-package-limited-scope-notice"
            >
              Preview only — no DOCX file is generated yet.
            </p>
          </div>
          <span className="status-pill" data-testid="docx-export-package-status">
            {formatDocxExportPackageStatus(preview.exportStatus)}
          </span>
        </div>

        <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
          <p>Package ID: {preview.exportPackageId}</p>
          <p>DraftArtifact ID: {preview.draftArtifactId}</p>
          <p>Title: {preview.title}</p>
          <p data-testid="docx-export-package-risk">
            Export risk: {preview.exportRiskLevel}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SummaryStat label="Sections" value={preview.sectionsForExport.length} />
          <SummaryStat
            label="Placeholders"
            value={preview.citationPlaceholders.length}
          />
          <SummaryStat
            label="Trace"
            value={`${preview.evidenceTraceSummary.traceCompletenessScore}%`}
          />
          <SummaryStat
            label="Evidence sections"
            value={preview.evidenceTraceSummary.sectionsWithEvidence}
          />
          <SummaryStat label="Warnings" value={preview.unresolvedWarnings.length} />
          <SummaryStat label="Blockers" value={preview.blockers.length} />
        </div>

        <div
          className="mt-4 grid gap-2"
          data-testid="docx-export-package-sections"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Sections for export contract
          </p>
          {preview.sectionsForExport.slice(0, 5).map((section) => (
            <article
              className="border-l-4 border-studio-blue bg-studio-panel/60 p-2"
              key={section.sectionId}
            >
              <p className="font-black text-white">{section.sectionTitle}</p>
              <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                {section.sectionId}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Evidence refs: {section.evidenceReferenceCount} · citation
                placeholders: {section.citationPlaceholderCount}
              </p>
            </article>
          ))}
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="docx-export-evidence-trace-summary"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Evidence trace summary
          </p>
          <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
            <p>
              Linked KnowledgeCards:{" "}
              {preview.evidenceTraceSummary.linkedKnowledgeCardCount}
            </p>
            <p>
              Trace-like section references:{" "}
              {preview.evidenceTraceSummary.sectionsWithTraceLikeReferences}
            </p>
            <p>
              DOCX page numbers trusted:{" "}
              {preview.evidenceTraceSummary.usesUntrustedDocxPageNumbers
                ? "no"
                : "yes"}
            </p>
          </div>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="docx-export-readiness-checklist"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Export readiness checklist
          </p>
          <div className="mt-2 grid gap-2">
            {preview.exportReadinessChecklist.map((item) => (
              <article
                className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
                key={item.label}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-black text-white">{item.label}</p>
                  <span className="status-pill">
                    {item.passed ? "Passed" : "Needs review"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-300">{item.note}</p>
              </article>
            ))}
          </div>
        </div>

        <NoticeList
          dataTestId="docx-export-package-blockers"
          emptyText="No blockers are present in the export package contract."
          tone="rose"
          values={preview.blockers}
        />
        <NoticeList
          dataTestId="docx-export-package-warnings"
          emptyText="No unresolved warnings are present in the export package contract."
          tone="gold"
          values={preview.unresolvedWarnings}
        />
        <div
          className="mt-4 border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6 text-slate-300"
          data-testid="docx-export-package-next-action"
        >
          {preview.recommendedNextAction}
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="docx-export-mvp-action"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Export DOCX MVP
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="docx-export-mvp-limited-scope-notice"
          >
            MVP export only — not final manuscript approval, not APA-final, and not
            publication-ready.
          </p>
          <button
            className="mt-3 w-full border-2 border-studio-blue bg-studio-blue/15 px-3 py-3 text-xs font-black uppercase text-studio-blue shadow-pixel disabled:opacity-60"
            data-testid="export-docx-mvp-button"
            disabled={isExporting || isBlocked}
            onClick={handleExportDocx}
            type="button"
          >
            {isExporting ? "Exporting DOCX MVP..." : "Export DOCX MVP"}
          </button>

          {isBlocked ? (
            <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-sm font-black leading-6 text-studio-rose">
              DOCX MVP export is blocked until review-gate blockers are resolved.
            </p>
          ) : null}

          {preview.exportStatus === "needs_review" ? (
            <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-sm font-black leading-6 text-studio-gold">
              This package needs review. The MVP export may be created for inspection,
              but citation placeholders and traces remain unresolved.
            </p>
          ) : null}

          {exportError ? (
            <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-sm font-black leading-6 text-studio-rose">
              {exportError}
            </p>
          ) : null}

          {exportResult ? <DocxExportMvpResultPanel result={exportResult} /> : null}
        </div>
      </div>
    </section>
  );
}

function DocxExportMvpResultPanel({ result }: { result: ExportDocxResult }) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="docx-export-mvp-result"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            DOCX MVP export result
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {result.exported ? "DOCX MVP file generated" : "DOCX MVP export blocked"}
          </p>
        </div>
        <span className="status-pill">
          {result.exported ? "exported: true" : "blocked"}
        </span>
      </div>
      <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
        <p>Package ID: {result.packageId}</p>
        <p data-testid="docx-export-mvp-package-status">
          Export status: {result.exportStatus}
        </p>
        <p data-testid="docx-export-mvp-warning-count">
          Warning count: {result.warnings.length}
        </p>
        <p data-testid="docx-export-mvp-exported-at">
          Export timestamp: {result.exportedAt || "not exported"}
        </p>
        <p data-testid="docx-export-mvp-file-path">
          Exported file path: {result.filePath || "not exported"}
        </p>
        <p data-testid="docx-export-mvp-file-name">
          File name: {result.fileName || "not exported"}
        </p>
        <p data-testid="docx-export-mvp-file-size">
          File size: {result.fileSizeBytes > 0 ? `${result.fileSizeBytes} bytes` : "not exported"}
        </p>
      </div>

      <div
        className="mt-3 border border-studio-line/70 bg-slate-950/40 p-3"
        data-testid="docx-export-verification-summary"
      >
        <p
          className="text-xs font-black uppercase text-studio-gold"
          data-testid="docx-export-manual-verification-notice"
        >
          Verify this DOCX manually before academic use.
        </p>
        <label
          className="mt-3 block text-xs font-black uppercase text-slate-400"
          htmlFor="docx-export-copyable-file-path"
        >
          Copyable exported path
        </label>
        <input
          className="mt-2 w-full border-2 border-studio-line bg-slate-950/70 px-3 py-2 text-xs text-slate-200"
          data-testid="docx-export-copyable-file-path"
          id="docx-export-copyable-file-path"
          readOnly
          value={result.filePath || "not exported"}
        />
      </div>

      <NoticeList
        dataTestId="docx-export-mvp-blockers"
        emptyText="No DOCX MVP export blockers."
        tone="rose"
        values={result.blockers}
      />
      <NoticeList
        dataTestId="docx-export-mvp-warnings"
        emptyText="No DOCX MVP export warnings."
        tone="gold"
        values={result.warnings}
      />
    </div>
  );
}

function formatSourceCardReadinessStatus(
  status: SourceCardPersistenceReadiness["sourceCardPersistenceReadiness"]
): string {
  if (status === "ready_for_future_source_card_save") {
    return "Ready for future SourceCard save";
  }

  if (status === "needs_metadata_review") {
    return "Needs metadata review";
  }

  return "Blocked";
}

function formatDraftArtifactReadinessStatus(
  status: DraftArtifactPersistenceReadiness["draftArtifactPersistenceReadiness"]
): string {
  if (status === "ready_for_future_draft_artifact_save") {
    return "Ready for future DraftArtifact save";
  }

  if (status === "needs_review") {
    return "Needs review";
  }

  return "Blocked";
}

function formatDocxExportPackageStatus(status: DocxExportPackagePreview["exportStatus"]) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "needs_review") {
    return "Needs review";
  }

  return "Blocked";
}

function formatSavedDraftArtifactReviewStatus(
  status: SavedDraftArtifactReviewGate["overallStatus"]
): string {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "needs_review") {
    return "Needs review";
  }

  return "Blocked";
}

function formatParsedDocxDraftArtifactReviewStatus(
  status: ParsedDocxDraftArtifactReviewGate["reviewStatus"]
): string {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "needs_review") {
    return "Needs review";
  }

  return "Blocked";
}

function formatParsedDocxExportPackageStatus(
  status: ParsedDocxExportPackagePreview["exportPackageStatus"]
): string {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "needs_review") {
    return "Needs review";
  }

  return "Blocked";
}

function CandidateList({
  dataTestId,
  emptyText,
  items,
  title
}: {
  dataTestId: string;
  emptyText: string;
  items: Array<{ detail: string; id: string; title: string }>;
  title: string;
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3" data-testid={dataTestId}>
      <p className="text-xs font-black uppercase text-slate-400">{title}</p>
      <div className="mt-2 grid gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <article
              className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
              key={item.id}
            >
              <p className="font-black text-white">{item.title}</p>
              <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                {item.id}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
            </article>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-400">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

function NoticeList({
  dataTestId,
  emptyText,
  tone,
  values
}: {
  dataTestId: string;
  emptyText: string;
  tone: "gold" | "rose";
  values: string[];
}) {
  const borderClass = tone === "rose" ? "border-studio-rose" : "border-studio-gold";

  return (
    <div className="mt-4 border-t border-studio-line/70 pt-3" data-testid={dataTestId}>
      <p className="text-xs font-black uppercase text-slate-400">
        {tone === "rose" ? "Blockers" : "Warnings"}
      </p>
      <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-300">
        {values.length > 0 ? (
          values.map((value) => (
            <p className={`border-l-4 ${borderClass} bg-studio-panel/60 p-2`} key={value}>
              {value}
            </p>
          ))
        ) : (
          <p className="border-l-4 border-studio-teal bg-studio-panel/60 p-2">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function createExtractionRunId(documentId: string): string {
  return `extraction-run-${documentId}`;
}

function createQaSourceDocumentSaveResult({
  bundle,
  segments,
  traces
}: {
  bundle: PersistenceSaveCandidateBundle;
  segments: DocumentSegment[];
  traces: ExtractionTrace[];
}): SaveSourceDocumentResult {
  return {
    blockers: [],
    dbPath: "qa-mode://local-vault/atp-knowledge-vault.sqlite",
    extractionRunId: createExtractionRunId(
      bundle.sourceDocumentCandidate.derivedFrom.extractionDocumentId
    ),
    saved: true,
    segmentCount: segments.length,
    sourceDocumentId:
      bundle.sourceDocumentCandidate.derivedFrom.sourceDocumentCandidateId,
    traceCount: traces.length,
    warnings: [
      "QA mode simulates the UI result; Rust tests cover the SQLite write path."
    ]
  };
}

function createQaSavedSourceDocumentList({
  bundle,
  extraction,
  result
}: {
  bundle: PersistenceSaveCandidateBundle;
  extraction: DocumentTextExtraction;
  result: SaveSourceDocumentResult;
}): SavedSourceDocumentListItem[] {
  return [
    {
      createdAt: "qa-mode",
      extractionStatus: extraction.extractionStatus,
      fileName: bundle.sourceDocumentCandidate.fileName,
      fileType: bundle.sourceDocumentCandidate.fileType,
      metadataStatus: bundle.sourceDocumentCandidate.sourceMetadata.completeness,
      segmentCount: result.segmentCount,
      sourceDocumentId: result.sourceDocumentId,
      title: bundle.sourceDocumentCandidate.title,
      traceCount: result.traceCount,
      updatedAt: "qa-mode"
    }
  ];
}

function createQaSavedSourceDocumentDetail({
  bundle,
  extraction,
  result,
  segments,
  traces
}: {
  bundle: PersistenceSaveCandidateBundle;
  extraction: DocumentTextExtraction;
  result: SaveSourceDocumentResult;
  segments: DocumentSegment[];
  traces: ExtractionTrace[];
}): SavedSourceDocumentDetail {
  return {
    extractionRun: {
      cleanedTextLength: extraction.cleanedText.length,
      confidenceScore: extraction.confidenceScore,
      createdAt: "qa-mode",
      extractionRunId: result.extractionRunId,
      extractionStatus: extraction.extractionStatus,
      rawTextLength: extraction.rawText.length,
      warningCount: extraction.extractionWarnings.length
    },
    segments: segments.map((segment, index) => ({
      content: segment.content,
      pageEnd: normalizeQaPageNumber(segment.pageEnd),
      pageNumbersTrusted: false,
      pageStart: normalizeQaPageNumber(segment.pageStart),
      segmentId: segment.segmentId,
      segmentType: segment.segmentType,
      sortOrder: index + 1,
      title: segment.title
    })),
    sourceDocument: {
      citationReadiness: "missing_metadata",
      createdAt: "qa-mode",
      fileName: bundle.sourceDocumentCandidate.fileName,
      fileType: bundle.sourceDocumentCandidate.fileType,
      metadataStatus: bundle.sourceDocumentCandidate.sourceMetadata.completeness,
      parserStatus: bundle.sourceDocumentCandidate.parserStatus,
      reviewStatus: bundle.sourceDocumentCandidate.review.reviewStatus,
      sourceDocumentId: result.sourceDocumentId,
      title: bundle.sourceDocumentCandidate.title,
      updatedAt: "qa-mode"
    },
    traces: traces.map((trace) => ({
      chunkReference: trace.chunkReference,
      pageNumber: normalizeQaPageNumber(trace.pageNumber),
      pageNumberTrusted: false,
      sectionTitle: trace.sectionTitle,
      segmentId: trace.segmentId,
      traceId: `${result.sourceDocumentId}::trace::${trace.segmentId}::${trace.chunkReference}`
    }))
  };
}

function createQaSourceCardSaveResult({
  activeSourceCardCandidate,
  bundle,
  linkedSourceDocumentId
}: {
  activeSourceCardCandidate: SourceCardSaveCandidate;
  bundle: PersistenceSaveCandidateBundle;
  linkedSourceDocumentId: string;
}): SaveSourceCardResult {
  return {
    blockers: [],
    dbPath: "qa-mode://local-vault/atp-knowledge-vault.sqlite",
    saved: true,
    sourceCardId: activeSourceCardCandidate.derivedFrom.sourceCardCandidateId,
    sourceDocumentId: linkedSourceDocumentId,
    warnings: [
      "QA mode simulates the UI result; Rust tests cover the SQLite SourceCard write path."
    ]
  };
}

function createQaSavedSourceCardList({
  activeSourceCardCandidate,
  bundle,
  result,
  savedSourceDocumentDetail
}: {
  activeSourceCardCandidate: SourceCardSaveCandidate;
  bundle: PersistenceSaveCandidateBundle;
  result: SaveSourceCardResult;
  savedSourceDocumentDetail: SavedSourceDocumentDetail | null;
}): SavedSourceCardListItem[] {
  return [
    {
      citationReadiness: activeSourceCardCandidate.citationReadiness,
      createdAt: "qa-mode",
      metadataStatus: activeSourceCardCandidate.metadataStatus,
      sourceCardId: result.sourceCardId,
      sourceDocumentId: result.sourceDocumentId,
      sourceDocumentTitle:
        savedSourceDocumentDetail?.sourceDocument.title ??
        bundle.sourceDocumentCandidate.title,
      sourceType: activeSourceCardCandidate.sourceType,
      title: activeSourceCardCandidate.title,
      updatedAt: "qa-mode"
    }
  ];
}

function createQaSavedSourceCardDetail({
  activeSourceCardCandidate,
  bundle,
  result,
  savedSourceDocumentDetail
}: {
  activeSourceCardCandidate: SourceCardSaveCandidate;
  bundle: PersistenceSaveCandidateBundle;
  result: SaveSourceCardResult;
  savedSourceDocumentDetail: SavedSourceDocumentDetail | null;
}): SavedSourceCardDetail {
  return {
    sourceCard: {
      authors: null,
      citationReadiness: activeSourceCardCandidate.citationReadiness,
      citationText: activeSourceCardCandidate.citationText,
      createdAt: "qa-mode",
      fileReference: activeSourceCardCandidate.fileReference,
      metadataStatus: activeSourceCardCandidate.metadataStatus,
      reviewStatus: activeSourceCardCandidate.review.reviewStatus,
      sourceCardId: result.sourceCardId,
      sourceDocumentId: result.sourceDocumentId,
      sourceType: activeSourceCardCandidate.sourceType,
      title: activeSourceCardCandidate.title,
      updatedAt: "qa-mode",
      year: null
    },
    sourceDocument: {
      fileName:
        savedSourceDocumentDetail?.sourceDocument.fileName ??
        bundle.sourceDocumentCandidate.fileName,
      fileType:
        savedSourceDocumentDetail?.sourceDocument.fileType ??
        bundle.sourceDocumentCandidate.fileType,
      sourceDocumentId: result.sourceDocumentId,
      title:
        savedSourceDocumentDetail?.sourceDocument.title ??
        bundle.sourceDocumentCandidate.title
    }
  };
}

function createMarketingTagSaveRequestItems(
  candidates: MarketingTagSaveCandidate[]
): SaveMarketingTagCandidateRequest[] {
  return candidates.map((candidate) => {
    const taxonomyTerm = marketingTaxonomySeed.find(
      (term) =>
        term.canonicalLabel.toLocaleLowerCase() ===
        candidate.label.toLocaleLowerCase()
    );

    return {
      category: taxonomyTerm?.category ?? "Emerging Marketing Topics",
      label: candidate.label,
      reviewStatus: normalizeMarketingTagReviewStatus(
        candidate.review.reviewStatus
      ),
      tagId: taxonomyTerm?.id ?? candidate.candidateId,
      tier: taxonomyTerm?.tier ?? "suggested"
    };
  });
}

function createReviewedParsedMarketingTagCandidates({
  preview,
  reviewStatuses
}: {
  preview: ParsedDocxMarketingTagCandidatePreview;
  reviewStatuses: Record<string, MarketingTagReviewDecision>;
}): MarketingTagSaveCandidate[] {
  return preview.candidates
    .map((candidate) => {
      const reviewStatus =
        reviewStatuses[candidate.candidate.candidateId] ?? "needs_review";

      return {
        ...candidate.candidate,
        review: {
          ...candidate.candidate.review,
          reviewStatus
        },
        validationStatus:
          reviewStatus === "approved"
            ? ("ready" as const)
            : ("needs_review" as const)
      };
    })
    .filter((candidate) => candidate.review.reviewStatus === "approved");
}

function createReviewedParsedKnowledgeCardCandidates({
  preview,
  reviewStatuses
}: {
  preview: ParsedDocxKnowledgeCardCandidatePreview;
  reviewStatuses: Record<string, KnowledgeCardReviewDecision>;
}): KnowledgeCardSaveCandidate[] {
  return preview.candidates
    .map((candidate) => {
      const reviewStatus = reviewStatuses[candidate.candidateId] ?? "needs_review";

      return {
        ...candidate,
        review: {
          ...candidate.review,
          reviewStatus
        },
        validationStatus:
          reviewStatus === "approved"
            ? ("ready" as const)
            : ("needs_review" as const)
      };
    })
    .filter((candidate) => candidate.review.reviewStatus === "approved");
}

function formatMarketingTagReviewDecision(
  decision: MarketingTagReviewDecision
): string {
  if (decision === "approved") {
    return "Approved";
  }

  if (decision === "rejected") {
    return "Rejected";
  }

  return "Needs review";
}

function formatKnowledgeCardReviewDecision(
  decision: KnowledgeCardReviewDecision
): string {
  if (decision === "approved") {
    return "Approved";
  }

  if (decision === "rejected") {
    return "Rejected";
  }

  return "Needs review";
}

function normalizeMarketingTagReviewStatus(
  reviewStatus: string
): SaveMarketingTagCandidateRequest["reviewStatus"] {
  if (reviewStatus === "approved" || reviewStatus === "rejected") {
    return reviewStatus;
  }

  return "needs_review";
}

function createQaMarketingTagsSaveResult({
  sourceCardId,
  tags
}: {
  sourceCardId: string;
  tags: SaveMarketingTagCandidateRequest[];
}): SaveMarketingTagsResult {
  const approvedTags = tags.filter((tag) => tag.reviewStatus === "approved");
  const excludedCount = tags.length - approvedTags.length;

  return {
    blockers: [],
    dbPath: "qa-mode://local-vault/atp-knowledge-vault.sqlite",
    linkedTagCount: approvedTags.length,
    saved: true,
    sourceCardId,
    tagCount: approvedTags.length,
    warnings:
      excludedCount > 0
        ? [
            `${excludedCount} marketing tag candidate(s) were excluded because they are not approved.`,
            "QA mode simulates the UI result; Rust tests cover the SQLite MarketingTag write path."
          ]
        : [
            "QA mode simulates the UI result; Rust tests cover the SQLite MarketingTag write path."
          ]
  };
}

function createQaSavedMarketingTags(
  tags: SaveMarketingTagCandidateRequest[]
): SavedMarketingTagRecord[] {
  return tags
    .filter((tag) => tag.reviewStatus === "approved")
    .map((tag) => ({
      category: tag.category,
      createdAt: "qa-mode",
      label: tag.label,
      reviewStatus: tag.reviewStatus,
      tagId: tag.tagId,
      tier: tag.tier,
      updatedAt: "qa-mode"
    }));
}

function createQaSavedSourceCardTags({
  sourceCardId,
  tags
}: {
  sourceCardId: string;
  tags: SaveMarketingTagCandidateRequest[];
}): SavedSourceCardTagRecord[] {
  return tags
    .filter((tag) => tag.reviewStatus === "approved")
    .map((tag) => ({
      category: tag.category,
      label: tag.label,
      reviewStatus: tag.reviewStatus,
      sourceCardId,
      tagId: tag.tagId,
      tier: tag.tier
    }));
}

function createKnowledgeCardSaveRequestItems({
  candidates,
  tagIds
}: {
  candidates: KnowledgeCardSaveCandidate[];
  tagIds: string[];
}): SaveKnowledgeCardCandidateRequest[] {
  return candidates.map((candidate) => ({
    cardType: candidate.cardType,
    citationReadiness: candidate.citationReadiness,
    contentPreview: candidate.contentPreview,
    knowledgeCardId: candidate.candidateId,
    reviewStatus: normalizeKnowledgeCardReviewStatus(
      candidate.review.reviewStatus
    ),
    tagIds,
    title: candidate.title,
    traceReference: candidate.traceReference
      ? {
          chunkReference: candidate.traceReference.chunkReference,
          pageNumber: candidate.traceReference.pageNumber ?? 0,
          pageNumberTrusted: candidate.traceReference.pageNumberTrusted,
          sectionTitle: candidate.traceReference.segmentId ?? ""
        }
      : null,
    validationStatus: candidate.validationStatus
  }));
}

function normalizeKnowledgeCardReviewStatus(
  reviewStatus: string
): SaveKnowledgeCardCandidateRequest["reviewStatus"] {
  if (reviewStatus === "approved" || reviewStatus === "rejected") {
    return reviewStatus;
  }

  return "needs_review";
}

function createQaKnowledgeCardsSaveResult({
  cards,
  sourceCardId
}: {
  cards: SaveKnowledgeCardCandidateRequest[];
  sourceCardId: string;
}): SaveKnowledgeCardsResult {
  const approvedCards = cards.filter((card) => card.reviewStatus === "approved");
  const linkedTagCount = approvedCards.reduce(
    (count, card) => count + card.tagIds.length,
    0
  );
  const traceRefCount = approvedCards.filter((card) => card.traceReference).length;
  const excludedCount = cards.length - approvedCards.length;

  return {
    blockers: [],
    dbPath: "qa-mode://local-vault/atp-knowledge-vault.sqlite",
    knowledgeCardCount: approvedCards.length,
    linkedTagCount,
    saved: true,
    sourceCardId,
    traceRefCount,
    warnings:
      excludedCount > 0
        ? [
            `${excludedCount} KnowledgeCard candidate(s) were excluded because they are not approved.`,
            "QA mode simulates the UI result; Rust tests cover the SQLite KnowledgeCard write path."
          ]
        : [
            "QA mode simulates the UI result; Rust tests cover the SQLite KnowledgeCard write path."
          ]
  };
}

function createQaSavedKnowledgeCards({
  cards,
  sourceCardId
}: {
  cards: SaveKnowledgeCardCandidateRequest[];
  sourceCardId: string;
}): SavedKnowledgeCardListItem[] {
  return cards
    .filter((card) => card.reviewStatus === "approved")
    .map((card) => ({
      cardType: card.cardType,
      citationReadiness: card.citationReadiness,
      createdAt: "qa-mode",
      knowledgeCardId: card.knowledgeCardId,
      sourceCardId,
      tagCount: card.tagIds.length,
      title: card.title,
      traceCount: card.traceReference ? 1 : 0,
      updatedAt: "qa-mode"
    }));
}

function createQaSavedKnowledgeCardDetail({
  card,
  linkedTags,
  sourceCardDetail,
  sourceCardId
}: {
  card: SaveKnowledgeCardCandidateRequest | undefined;
  linkedTags: SavedSourceCardTagRecord[];
  sourceCardDetail: SavedSourceCardDetail | null;
  sourceCardId: string;
}): SavedKnowledgeCardDetail | null {
  if (!card) {
    return null;
  }

  return {
    knowledgeCard: {
      cardType: card.cardType,
      citationReadiness: card.citationReadiness,
      contentPreview: card.contentPreview,
      createdAt: "qa-mode",
      knowledgeCardId: card.knowledgeCardId,
      reviewStatus: card.reviewStatus,
      sourceCardId,
      title: card.title,
      traceReadiness: card.traceReference ? "ready" : "needs_review",
      updatedAt: "qa-mode",
      validationStatus: card.validationStatus
    },
    sourceCard: {
      sourceCardId,
      sourceDocumentId:
        sourceCardDetail?.sourceCard.sourceDocumentId ??
        "candidate-document-qa-docx-file-intake-job",
      sourceType: sourceCardDetail?.sourceCard.sourceType ?? "DOCX",
      title: sourceCardDetail?.sourceCard.title ?? "qa-service-quality-chapter"
    },
    tags: linkedTags.map((tag) => ({
      category: tag.category,
      label: tag.label,
      reviewStatus: tag.reviewStatus,
      tagId: tag.tagId,
      tier: tag.tier
    })),
    traces: card.traceReference
      ? [
          {
            chunkReference: card.traceReference.chunkReference,
            pageNumber:
              card.traceReference.pageNumberTrusted &&
              card.traceReference.pageNumber > 0
                ? card.traceReference.pageNumber
                : null,
            pageNumberTrusted: card.traceReference.pageNumberTrusted,
            sectionTitle: card.traceReference.sectionTitle,
            traceId: `${card.knowledgeCardId}::trace::${card.traceReference.chunkReference}`
          }
        ]
      : []
  };
}

function createQaDraftArtifactSaveResult({
  bundle,
  linkedKnowledgeCardIds,
  sourceCardId
}: {
  bundle: PersistenceSaveCandidateBundle;
  linkedKnowledgeCardIds: string[];
  sourceCardId: string;
}): SaveDraftArtifactResult {
  return {
    blockers: [],
    dbPath: "qa-mode://local-vault/atp-knowledge-vault.sqlite",
    draftArtifactId: bundle.draftArtifactCandidate.candidateId,
    linkedKnowledgeCardCount: linkedKnowledgeCardIds.length,
    saved: true,
    sectionCount: bundle.draftSectionCandidates.length,
    sourceCardId,
    warnings: [
      "QA mode simulates the UI result; Rust tests cover the SQLite DraftArtifact write path.",
      "DraftArtifact is saved as mock_only / not_final; no DOCX or Obsidian export is created."
    ]
  };
}

function createQaParsedDocxDraftArtifactSaveResult({
  candidate,
  sourceCardId
}: {
  candidate: ParsedDocxDraftArtifactSaveCandidate;
  sourceCardId: string;
}): SaveDraftArtifactResult {
  return {
    blockers: [],
    dbPath: "qa-mode://local-vault/atp-knowledge-vault.sqlite",
    draftArtifactId: candidate.draftArtifact.candidateId,
    linkedKnowledgeCardCount: candidate.linkedKnowledgeCardIds.length,
    saved: true,
    sectionCount: candidate.sections.length,
    sourceCardId,
    warnings: [
      "QA mode simulates the UI result; Rust tests cover the SQLite DraftArtifact write path.",
      "Parsed DOCX DraftArtifact is saved as mock_only / not_final; no DOCX export or final manuscript is created."
    ]
  };
}

function createQaSavedDraftArtifacts({
  bundle,
  result
}: {
  bundle: PersistenceSaveCandidateBundle;
  result: SaveDraftArtifactResult;
}): SavedDraftArtifactListItem[] {
  return [
    {
      artifactStatus: "mock_only",
      createdAt: "qa-mode",
      draftArtifactId: result.draftArtifactId,
      draftType: bundle.draftArtifactCandidate.artifactType,
      linkedKnowledgeCardCount: result.linkedKnowledgeCardCount,
      mockOnly: true,
      notFinal: true,
      sectionCount: result.sectionCount,
      sourceCardId: result.sourceCardId,
      title: bundle.draftArtifactCandidate.title,
      updatedAt: "qa-mode"
    }
  ];
}

function createQaParsedDocxSavedDraftArtifacts({
  candidate,
  result
}: {
  candidate: ParsedDocxDraftArtifactSaveCandidate;
  result: SaveDraftArtifactResult;
}): SavedDraftArtifactListItem[] {
  return [
    {
      artifactStatus: "mock_only",
      createdAt: "qa-mode",
      draftArtifactId: result.draftArtifactId,
      draftType: candidate.draftArtifact.artifactType,
      linkedKnowledgeCardCount: result.linkedKnowledgeCardCount,
      mockOnly: true,
      notFinal: true,
      sectionCount: result.sectionCount,
      sourceCardId: result.sourceCardId,
      title: candidate.draftArtifact.title,
      updatedAt: "qa-mode"
    }
  ];
}

function createQaSavedDraftArtifactDetail({
  bundle,
  knowledgeCards,
  result,
  sourceCardDetail
}: {
  bundle: PersistenceSaveCandidateBundle;
  knowledgeCards: SavedKnowledgeCardListItem[];
  result: SaveDraftArtifactResult;
  sourceCardDetail: SavedSourceCardDetail | null;
}): SavedDraftArtifactDetail {
  return {
    draftArtifact: {
      artifactStatus: "mock_only",
      citationReadiness: "needs_review",
      createdAt: "qa-mode",
      draftArtifactId: result.draftArtifactId,
      draftType: bundle.draftArtifactCandidate.artifactType,
      mockOnly: true,
      notFinal: true,
      sourceCardId: result.sourceCardId,
      title: bundle.draftArtifactCandidate.title,
      traceReadiness: "needs_review",
      updatedAt: "qa-mode"
    },
    knowledgeCards: knowledgeCards.map((card) => ({
      cardType: card.cardType,
      knowledgeCardId: card.knowledgeCardId,
      title: card.title
    })),
    sections: bundle.draftSectionCandidates.map((section, index) => ({
      approvedTagsJson: JSON.stringify(section.approvedTags),
      citationPlaceholdersJson: JSON.stringify(section.citationPlaceholders),
      linkedCaseIdsJson: JSON.stringify(section.linkedCaseIds),
      linkedEvidenceIdsJson: JSON.stringify(section.linkedEvidenceIds),
      linkedQuoteIdsJson: JSON.stringify(section.linkedQuoteIds),
      mockParagraph: section.mockParagraph,
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitle,
      sortOrder: index + 1,
      warningsJson: JSON.stringify(section.warnings)
    })),
    sourceCard: {
      sourceCardId: result.sourceCardId,
      sourceDocumentId:
        sourceCardDetail?.sourceCard.sourceDocumentId ??
        bundle.sourceDocumentCandidate.candidateId,
      sourceType: sourceCardDetail?.sourceCard.sourceType ?? "DOCX",
      title: sourceCardDetail?.sourceCard.title ?? bundle.sourceCardCandidate.title
    }
  };
}

function createQaParsedDocxSavedDraftArtifactDetail({
  candidate,
  knowledgeCards,
  result,
  sourceCardDetail
}: {
  candidate: ParsedDocxDraftArtifactSaveCandidate;
  knowledgeCards: SavedKnowledgeCardListItem[];
  result: SaveDraftArtifactResult;
  sourceCardDetail: SavedSourceCardDetail | null;
}): SavedDraftArtifactDetail {
  return {
    draftArtifact: {
      artifactStatus: "mock_only",
      citationReadiness: "needs_review",
      createdAt: "qa-mode",
      draftArtifactId: result.draftArtifactId,
      draftType: candidate.draftArtifact.artifactType,
      mockOnly: true,
      notFinal: true,
      sourceCardId: result.sourceCardId,
      title: candidate.draftArtifact.title,
      traceReadiness: "needs_review",
      updatedAt: "qa-mode"
    },
    knowledgeCards: knowledgeCards.map((card) => ({
      cardType: card.cardType,
      knowledgeCardId: card.knowledgeCardId,
      title: card.title
    })),
    sections: candidate.sections.map((section, index) => ({
      approvedTagsJson: JSON.stringify(section.approvedTags),
      citationPlaceholdersJson: JSON.stringify(section.citationPlaceholders),
      linkedCaseIdsJson: JSON.stringify(section.linkedCaseIds),
      linkedEvidenceIdsJson: JSON.stringify(section.linkedEvidenceIds),
      linkedQuoteIdsJson: JSON.stringify(section.linkedQuoteIds),
      mockParagraph: section.mockParagraph,
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitle,
      sortOrder: index + 1,
      warningsJson: JSON.stringify(section.warnings)
    })),
    sourceCard: {
      sourceCardId: result.sourceCardId,
      sourceDocumentId:
        sourceCardDetail?.sourceCard.sourceDocumentId ??
        "candidate-document-qa-docx-file-intake-job",
      sourceType: sourceCardDetail?.sourceCard.sourceType ?? "DOCX",
      title: sourceCardDetail?.sourceCard.title ?? "qa-service-quality-chapter"
    }
  };
}

function createQaDocxExportResult(
  preview: DocxExportPackagePreview
): ExportDocxResult {
  return {
    blockers: preview.blockers,
    exportStatus: preview.exportStatus,
    exported: preview.exportStatus !== "blocked",
    exportedAt: preview.exportStatus !== "blocked" ? "qa-mode:exported" : "",
    fileName: `${preview.exportPackageId}.docx`,
    filePath: `qa-mode://exports/docx/${preview.exportPackageId}.docx`,
    fileSizeBytes: preview.exportStatus !== "blocked" ? 4096 : 0,
    packageId: preview.exportPackageId,
    warnings: [
      ...preview.unresolvedWarnings,
      "QA mode simulates the UI result; Rust tests cover the DOCX package writer."
    ]
  };
}

function normalizeQaPageNumber(value: number): number | null {
  return value > 0 ? value : null;
}

function isSourceLibraryQaModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("qa") === "source-library";
}
