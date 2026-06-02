import type { MockDocumentExtractionMappingResult } from "../../../data/mock/documentExtractionMappingResults";
import { SummaryStat } from "./SourceLibraryPrimitives";

interface DocumentExtractionMappingPreviewProps {
  onSelectResult: (resultId: string) => void;
  results: MockDocumentExtractionMappingResult[];
  selectedResult: MockDocumentExtractionMappingResult;
}

export function DocumentExtractionMappingPreview({
  onSelectResult,
  results,
  selectedResult
}: DocumentExtractionMappingPreviewProps) {
  const summary = createDocumentExtractionMappingSummary(results);
  const candidate = selectedResult.sourceDocumentCandidate;
  const readinessSummary = selectedResult.readinessSummary;
  const conciseWarnings = readinessSummary.warnings.slice(0, 4);

  return (
    <div className="mt-4 border-2 border-studio-line bg-studio-ink/70 p-3 text-sm leading-6 text-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-blue">
            Document Extraction Mapping Preview
          </p>
          <p className="mt-1 text-xs font-black uppercase text-studio-gold">
            Preview only — no SourceDocument is created
          </p>
        </div>
        <span className="status-pill">{results.length} mock records</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SummaryStat label="Ready" value={summary.readyCount} />
        <SummaryStat label="Review-gated" value={summary.reviewGatedCount} />
        <SummaryStat label="Blocked" value={summary.blockedCount} />
        <SummaryStat label="Warnings" value={summary.warningCount} />
        <SummaryStat label="Trace warnings" value={summary.traceWarningCount} />
        <SummaryStat label="Total results" value={summary.totalCount} />
      </div>

      <div className="mt-3 grid gap-2">
        {results.map((result) => {
          const isSelected = result.fileIntakeJobId === selectedResult.fileIntakeJobId;

          return (
            <button
              className={`border-2 bg-studio-panel/70 p-2 text-left ${
                isSelected
                  ? "border-studio-gold bg-studio-gold/10"
                  : "border-studio-line"
              }`}
              key={result.fileIntakeJobId}
              onClick={() => onSelectResult(result.fileIntakeJobId)}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-black text-white">{result.fileName}</p>
                  <p className="mt-1 text-xs font-black uppercase text-slate-400">
                    {result.sourceDocumentCandidate.fileType ?? "document"} ·{" "}
                    {result.readiness.replace(/_/g, " ")}
                  </p>
                </div>
                <span className="status-pill">
                  {result.readinessSummary.warningCount} warnings
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-studio-line/70 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-slate-400">
              Selected extraction result
            </p>
            <h4 className="mt-1 font-black leading-6 text-white">
              {selectedResult.fileName}
            </h4>
          </div>
          <span className="status-pill">{selectedResult.readiness.replace(/_/g, " ")}</span>
        </div>

        <dl className="mt-3 grid gap-2">
          <PreviewDetail label="Document type" value={candidate.fileType ?? "Unknown"} />
          <PreviewDetail
            label="Extraction status"
            value={readinessSummary.extractionStatus}
          />
          <PreviewDetail label="Readiness" value={selectedResult.readiness} />
          <PreviewDetail
            label="Candidate title"
            value={candidate.title ?? "Review-required candidate"}
          />
          <PreviewDetail
            label="Candidate source type"
            value={candidate.fileType ?? "Review required"}
          />
          <PreviewDetail
            label="Segments"
            value={`${readinessSummary.segmentCount}`}
          />
          <PreviewDetail label="Traces" value={`${readinessSummary.traceCount}`} />
        </dl>

        <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 font-black text-studio-gold">
          Preview only — no SourceDocument is created.
        </p>

        <div className="mt-3">
          <p className="text-xs font-black uppercase text-slate-400">Warnings</p>
          <div className="mt-2 grid gap-2">
            {conciseWarnings.length > 0 ? (
              conciseWarnings.map((warning) => (
                <article
                  className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
                  key={warning.warningId}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black uppercase text-studio-gold">
                      {warning.severity}
                    </span>
                    <span className="text-xs font-black uppercase text-studio-blue">
                      {warning.field ?? "extraction"}
                    </span>
                  </div>
                  <p className="mt-1 font-black text-white">{warning.code}</p>
                  <p className="mt-1 text-slate-300">{warning.message}</p>
                </article>
              ))
            ) : (
              <p className="text-studio-teal">No mock extraction warnings.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
      <dt className="text-xs font-black uppercase text-slate-400">{label}</dt>
      <dd className="break-words font-bold text-slate-100">{value}</dd>
    </div>
  );
}

function createDocumentExtractionMappingSummary(
  results: MockDocumentExtractionMappingResult[]
) {
  return results.reduce(
    (summary, result) => ({
      totalCount: summary.totalCount + 1,
      readyCount:
        summary.readyCount +
        (result.readiness === "ready_for_source_document_candidate" ? 1 : 0),
      reviewGatedCount:
        summary.reviewGatedCount + (result.readiness === "needs_review" ? 1 : 0),
      blockedCount:
        summary.blockedCount + (result.readiness === "blocked" ? 1 : 0),
      warningCount: summary.warningCount + result.readinessSummary.warningCount,
      traceWarningCount:
        summary.traceWarningCount + result.readinessSummary.traceWarningCount
    }),
    {
      blockedCount: 0,
      readyCount: 0,
      reviewGatedCount: 0,
      totalCount: 0,
      traceWarningCount: 0,
      warningCount: 0
    }
  );
}
