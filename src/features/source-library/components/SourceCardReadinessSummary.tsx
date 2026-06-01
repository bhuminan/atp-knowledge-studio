import type { SourceValidationSummary } from "../../../lib/sources/SourceValidation";
import { SummaryStat } from "./SourceLibraryPrimitives";

export function SourceCardReadinessSummary({
  summary
}: {
  summary: SourceValidationSummary;
}) {
  return (
    <div className="mt-4 border-t-2 border-studio-line pt-4">
      <p className="text-sm font-black uppercase text-studio-blue">
        Source Card Readiness
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm leading-6">
        <SummaryStat label="Total" value={summary.totalSources} />
        <SummaryStat label="Ready" value={summary.readyCount} />
        <SummaryStat label="Needs review" value={summary.needsReviewCount} />
        <SummaryStat label="Incomplete" value={summary.incompleteCount} />
        <SummaryStat label="Mock only" value={summary.mockOnlyCount} />
        <SummaryStat label="Avg score" value={`${summary.averageReadinessScore}/100`} />
      </div>
    </div>
  );
}
