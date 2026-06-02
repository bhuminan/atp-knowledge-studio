import type { PersistenceDryRunPreviewResult } from "../../../lib/persistence/PersistenceDryRunService";
import type { SaveCandidateValidationStatus } from "../../../types/domain";
import { SummaryStat } from "./SourceLibraryPrimitives";

interface PersistenceDryRunPreviewProps {
  dryRun: PersistenceDryRunPreviewResult;
}

const statusLabels: Record<SaveCandidateValidationStatus, string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

export function PersistenceDryRunPreview({ dryRun }: PersistenceDryRunPreviewProps) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="persistence-dry-run-preview"
    >
      <div className="border-2 border-studio-blue bg-studio-blue/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-blue">
              Persistence Dry Run Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="persistence-dry-run-preview-only-notice"
            >
              Dry run only — no files, database records, or vault entries are created.
            </p>
          </div>
          <span className="status-pill">{statusLabels[dryRun.dryRunStatus]}</span>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="persistence-dry-run-status"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Dry-run status
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-white">
            {statusLabels[dryRun.dryRunStatus]}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Adapter: {dryRun.adapterStatus}; persisted: {dryRun.persisted ? "yes" : "no"}
          </p>
        </div>

        <div
          className="mt-4 grid grid-cols-3 gap-2"
          data-testid="persistence-dry-run-simulated-counts"
        >
          <SummaryStat
            label="SourceDocs"
            value={dryRun.simulatedSavedCounts.sourceDocuments}
          />
          <SummaryStat
            label="SourceCards"
            value={dryRun.simulatedSavedCounts.sourceCards}
          />
          <SummaryStat
            label="Tags"
            value={dryRun.simulatedSavedCounts.marketingTags}
          />
          <SummaryStat
            label="Knowledge"
            value={dryRun.simulatedSavedCounts.knowledgeCards}
          />
          <SummaryStat
            label="Drafts"
            value={dryRun.simulatedSavedCounts.draftArtifacts}
          />
          <SummaryStat label="Persisted" value={dryRun.persisted ? "Yes" : "No"} />
        </div>

        <NoticeList
          dataTestId="persistence-dry-run-blockers"
          emptyText="No dry-run blockers were returned by the mock repository."
          tone="rose"
          values={dryRun.blockers.map((blocker) => blocker.message)}
        />
        <NoticeList
          dataTestId="persistence-dry-run-warnings"
          emptyText="No dry-run warnings were returned by the mock repository."
          tone="gold"
          values={dryRun.warnings.map((warning) => warning.message)}
        />

        <div className="mt-4 border-t border-studio-line/70 pt-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Next recommended action
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-white">
            {dryRun.nextRecommendedAction}
          </p>
        </div>
      </div>
    </div>
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
        {tone === "rose" ? "Dry-run blockers" : "Dry-run warnings"}
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
