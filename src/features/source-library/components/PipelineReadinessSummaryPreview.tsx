import type {
  PipelineReadinessStatus,
  PipelineReadinessSummaryPreview as PipelineReadinessSummaryPreviewModel
} from "../../../lib/sources/PipelineReadinessMapper";
import { SummaryStat } from "./SourceLibraryPrimitives";

interface PipelineReadinessSummaryPreviewProps {
  summary: PipelineReadinessSummaryPreviewModel;
}

const statusLabels: Record<PipelineReadinessStatus, string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

export function PipelineReadinessSummaryPreview({
  summary
}: PipelineReadinessSummaryPreviewProps) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="pipeline-readiness-summary-preview"
    >
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              Pipeline Readiness Summary Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="pipeline-readiness-preview-only-notice"
            >
              Preview only — no workflow state is saved.
            </p>
          </div>
          <span className="status-pill">{statusLabels[summary.overallStatus]}</span>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="pipeline-readiness-overall-status"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Overall readiness
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-white">
            {statusLabels[summary.overallStatus]}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Readiness ID: {summary.pipelineReadinessId}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryStat label="Stages" value={summary.stageStatuses.length} />
          <SummaryStat label="Warnings" value={summary.warnings.length} />
          <SummaryStat label="Blockers" value={summary.blockers.length} />
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="pipeline-readiness-stage-statuses"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Stage-by-stage status
          </p>
          <div className="mt-2 grid gap-2">
            {summary.stageStatuses.map((stage) => (
              <article
                className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
                key={stage.stageId}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-white">{stage.label}</p>
                  <span className="status-pill">{statusLabels[stage.status]}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-300">{stage.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <NoticeBlock
          dataTestId="pipeline-readiness-blockers"
          emptyText="No blockers are present in the preview-only pipeline summary."
          label="Blockers"
          tone="rose"
          values={summary.blockers}
        />
        <NoticeBlock
          dataTestId="pipeline-readiness-warnings"
          emptyText="No warnings are present in the preview-only pipeline summary."
          label="Warnings"
          tone="gold"
          values={summary.warnings}
        />

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="pipeline-readiness-next-action"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Next recommended action
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-white">
            {summary.nextRecommendedAction}
          </p>
        </div>
      </div>
    </div>
  );
}

function NoticeBlock({
  dataTestId,
  emptyText,
  label,
  tone,
  values
}: {
  dataTestId: string;
  emptyText: string;
  label: string;
  tone: "gold" | "rose";
  values: string[];
}) {
  const borderClass = tone === "rose" ? "border-studio-rose" : "border-studio-gold";

  return (
    <div className="mt-4 border-t border-studio-line/70 pt-3" data-testid={dataTestId}>
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
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
