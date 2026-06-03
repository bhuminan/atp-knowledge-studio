import type { ParserReadinessPreview } from "../../../lib/sources/ParserReadinessMapper";
import { SummaryStat } from "./SourceLibraryPrimitives";

interface RealParserReadinessPanelProps {
  readiness: ParserReadinessPreview;
}

export function RealParserReadinessPanel({
  readiness
}: RealParserReadinessPanelProps) {
  return (
    <div
      className="mt-4 border-2 border-studio-teal bg-studio-teal/10 p-3 text-sm leading-6 text-slate-200"
      data-testid="real-parser-readiness-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-teal">
            Real Parser Readiness
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="real-parser-preflight-notice"
          >
            Preflight only — no real parsing is performed.
          </p>
        </div>
        <span className="status-pill">
          {readiness.parserReadinessStatus.replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SummaryStat
          label="DOCX readiness"
          value={readiness.docxReadinessStatus.replace(/_/g, " ")}
        />
        <SummaryStat
          label="PDF readiness"
          value={readiness.pdfReadinessStatus.replace(/_/g, " ")}
        />
        <SummaryStat label="Storage" value="ready" />
        <SummaryStat label="Trace" value="review gated" />
      </div>

      <dl className="mt-3 grid gap-2" data-testid="real-parser-readiness-details">
        <ReadinessDetail label="Storage readiness" value={readiness.storageReadiness} />
        <ReadinessDetail
          label="Provenance/page trace readiness"
          value={readiness.provenanceReadiness}
        />
        <ReadinessDetail
          label="Extraction segment readiness"
          value={readiness.extractionSegmentReadiness}
        />
        <ReadinessDetail
          label="Evidence trace readiness"
          value={readiness.evidenceTraceReadiness}
        />
      </dl>

      <ReadinessList
        dataTestId="real-parser-blockers"
        emptyText="No parser preflight blockers."
        label="Blockers"
        values={readiness.blockers}
      />
      <ReadinessList
        dataTestId="real-parser-warnings"
        emptyText="No parser preflight warnings."
        label="Warnings"
        values={readiness.warnings}
      />

      <p
        className="mt-3 border-l-4 border-studio-blue bg-studio-blue/10 p-2 font-black text-studio-blue"
        data-testid="real-parser-next-action"
      >
        {readiness.recommendedNextAction}
      </p>
    </div>
  );
}

function ReadinessDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-2">
      <dt className="text-xs font-black uppercase text-slate-400">{label}</dt>
      <dd className="break-words font-bold text-slate-100">{value}</dd>
    </div>
  );
}

function ReadinessList({
  dataTestId,
  emptyText,
  label,
  values
}: {
  dataTestId: string;
  emptyText: string;
  label: string;
  values: string[];
}) {
  return (
    <div className="mt-3" data-testid={dataTestId}>
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      {values.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {values.slice(0, 4).map((value) => (
            <li
              className="border-l-4 border-studio-gold bg-studio-panel/60 p-2 font-bold text-slate-200"
              key={value}
            >
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-studio-teal">{emptyText}</p>
      )}
    </div>
  );
}
