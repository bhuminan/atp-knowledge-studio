import { useState } from "react";
import {
  saveSourceDocumentCandidate,
  type SaveSourceDocumentResult
} from "../../../lib/persistence/LocalVaultDatabase";
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

  async function handleSaveSourceDocument() {
    setIsSavingSourceDocument(true);
    setSourceDocumentSaveError(null);

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

function isSourceLibraryQaModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("qa") === "source-library";
}
