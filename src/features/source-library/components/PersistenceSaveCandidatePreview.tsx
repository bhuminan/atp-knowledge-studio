import type {
  PersistenceSaveCandidateBundle,
  SaveCandidateValidationStatus
} from "../../../types/domain";
import { SummaryStat } from "./SourceLibraryPrimitives";

interface PersistenceSaveCandidatePreviewProps {
  bundle: PersistenceSaveCandidateBundle;
}

const statusLabels: Record<SaveCandidateValidationStatus, string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

export function PersistenceSaveCandidatePreview({
  bundle
}: PersistenceSaveCandidatePreviewProps) {
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
      </div>
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
