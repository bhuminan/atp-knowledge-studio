import { useState } from "react";
import {
  listSavedSourceCards,
  listSavedSourceDocuments,
  readSavedSourceCard,
  readSavedSourceDocument,
  saveSourceCardCandidate,
  saveSourceDocumentCandidate,
  type SavedSourceCardDetail,
  type SavedSourceCardListItem,
  type SavedSourceDocumentDetail,
  type SavedSourceDocumentListItem,
  type SaveSourceCardResult,
  type SaveSourceDocumentResult
} from "../../../lib/persistence/LocalVaultDatabase";
import {
  evaluateSourceCardPersistenceReadiness,
  type SourceCardPersistenceReadiness
} from "../../../lib/persistence/SourceCardPersistenceReadinessMapper";
import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionTrace,
  PersistenceSaveCandidateBundle,
  SaveCandidateValidationStatus
} from "../../../types/domain";
import { createPersistenceDryRunPreview } from "../../../lib/persistence/PersistenceDryRunService";
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

export function PersistenceSaveCandidatePreview({
  bundle,
  extraction,
  segments,
  traces
}: PersistenceSaveCandidatePreviewProps) {
  const dryRunPreview = createPersistenceDryRunPreview(bundle);
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

  async function handleSaveSourceDocument() {
    setIsSavingSourceDocument(true);
    setSourceDocumentSaveError(null);
    setSourceCardSaveError(null);
    setSourceCardSaveResult(null);
    setSavedSourceCards([]);
    setSavedSourceCardDetail(null);

    try {
      if (isSourceLibraryQaModeEnabled()) {
        setSourceDocumentSaveResult(
          createQaSourceDocumentSaveResult({
            bundle,
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

      if (isSourceLibraryQaModeEnabled()) {
        const qaResult = createQaSourceCardSaveResult({
          bundle,
          linkedSourceDocumentId: readiness.linkedSourceDocumentId
        });
        setSourceCardSaveResult(qaResult);
        setSavedSourceCards(
          createQaSavedSourceCardList({
            bundle,
            result: qaResult,
            savedSourceDocumentDetail
          })
        );
        setSavedSourceCardDetail(
          createQaSavedSourceCardDetail({
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
        sourceCard: bundle.sourceCardCandidate,
        sourceCardId: bundle.sourceCardCandidate.derivedFrom.sourceCardCandidateId,
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

  const sourceCardReadiness = evaluateSourceCardPersistenceReadiness({
    savedSourceDocumentDetail,
    savedSourceDocuments,
    sourceCardCandidate: bundle.sourceCardCandidate,
    sourceDocumentSaveResult
  });

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
          isSaving={isSavingSourceDocument}
          onSave={handleSaveSourceDocument}
          result={sourceDocumentSaveResult}
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
            readiness={sourceCardReadiness}
            result={sourceCardSaveResult}
          />
        ) : null}
      </div>
    </div>
  );
}

function SourceDocumentSaveAction({
  error,
  isSaving,
  onSave,
  result
}: {
  error: string | null;
  isSaving: boolean;
  onSave: () => void;
  result: SaveSourceDocumentResult | null;
}) {
  return (
    <div className="mt-4 border-t border-studio-line/70 pt-3">
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              SourceDocument Local Vault Save
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="source-document-save-limited-scope-notice"
            >
              Only SourceDocument extraction data is saved. SourceCard, KnowledgeCards,
              tags, and drafts are not saved.
            </p>
          </div>
          <span className="status-pill">SourceDocument only</span>
        </div>

        <button
          className="mt-4 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
          data-testid="save-source-document-button"
          disabled={isSaving}
          onClick={onSave}
          type="button"
        >
          {isSaving ? "Saving SourceDocument..." : "Save SourceDocument to Local Vault"}
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
  readiness,
  result
}: {
  detail: SavedSourceCardDetail | null;
  error: string | null;
  isSaving: boolean;
  items: SavedSourceCardListItem[];
  onSave: () => void;
  readiness: SourceCardPersistenceReadiness;
  result: SaveSourceCardResult | null;
}) {
  const isBlocked = readiness.blockers.length > 0 || !readiness.linkedSourceDocumentId;

  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3">
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              SourceCard Local Vault Save
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="source-card-save-limited-scope-notice"
            >
              Only SourceCard metadata is saved. Tags, KnowledgeCards, and drafts are
              not saved yet.
            </p>
          </div>
          <span className="status-pill">SourceCard only</span>
        </div>

        <button
          className="mt-4 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
          data-testid="save-source-card-button"
          disabled={isSaving || isBlocked}
          onClick={onSave}
          type="button"
        >
          {isSaving ? "Saving SourceCard..." : "Save SourceCard to Local Vault"}
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

        {result ? <SourceCardSaveResultPanel result={result} /> : null}
        {result?.saved ? (
          <SavedSourceCardVerificationPanel detail={detail} items={items} />
        ) : null}
      </div>
    </section>
  );
}

function SourceCardSaveResultPanel({ result }: { result: SaveSourceCardResult }) {
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
  items
}: {
  detail: SavedSourceCardDetail | null;
  items: SavedSourceCardListItem[];
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3">
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
  bundle,
  linkedSourceDocumentId
}: {
  bundle: PersistenceSaveCandidateBundle;
  linkedSourceDocumentId: string;
}): SaveSourceCardResult {
  return {
    blockers: [],
    dbPath: "qa-mode://local-vault/atp-knowledge-vault.sqlite",
    saved: true,
    sourceCardId: bundle.sourceCardCandidate.derivedFrom.sourceCardCandidateId,
    sourceDocumentId: linkedSourceDocumentId,
    warnings: [
      "QA mode simulates the UI result; Rust tests cover the SQLite SourceCard write path."
    ]
  };
}

function createQaSavedSourceCardList({
  bundle,
  result,
  savedSourceDocumentDetail
}: {
  bundle: PersistenceSaveCandidateBundle;
  result: SaveSourceCardResult;
  savedSourceDocumentDetail: SavedSourceDocumentDetail | null;
}): SavedSourceCardListItem[] {
  return [
    {
      citationReadiness: bundle.sourceCardCandidate.citationReadiness,
      createdAt: "qa-mode",
      metadataStatus: bundle.sourceCardCandidate.metadataStatus,
      sourceCardId: result.sourceCardId,
      sourceDocumentId: result.sourceDocumentId,
      sourceDocumentTitle:
        savedSourceDocumentDetail?.sourceDocument.title ??
        bundle.sourceDocumentCandidate.title,
      sourceType: bundle.sourceCardCandidate.sourceType,
      title: bundle.sourceCardCandidate.title,
      updatedAt: "qa-mode"
    }
  ];
}

function createQaSavedSourceCardDetail({
  bundle,
  result,
  savedSourceDocumentDetail
}: {
  bundle: PersistenceSaveCandidateBundle;
  result: SaveSourceCardResult;
  savedSourceDocumentDetail: SavedSourceDocumentDetail | null;
}): SavedSourceCardDetail {
  return {
    sourceCard: {
      authors: null,
      citationReadiness: bundle.sourceCardCandidate.citationReadiness,
      citationText: bundle.sourceCardCandidate.citationText,
      createdAt: "qa-mode",
      fileReference: bundle.sourceCardCandidate.fileReference,
      metadataStatus: bundle.sourceCardCandidate.metadataStatus,
      reviewStatus: bundle.sourceCardCandidate.review.reviewStatus,
      sourceCardId: result.sourceCardId,
      sourceDocumentId: result.sourceDocumentId,
      sourceType: bundle.sourceCardCandidate.sourceType,
      title: bundle.sourceCardCandidate.title,
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

function normalizeQaPageNumber(value: number): number | null {
  return value > 0 ? value : null;
}

function isSourceLibraryQaModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("qa") === "source-library";
}
