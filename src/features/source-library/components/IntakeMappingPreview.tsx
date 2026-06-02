import type { IntakeSourceMappingResult } from "../../../types/domain";
import { SummaryStat } from "./SourceLibraryPrimitives";

export function IntakeMappingPreview({
  mappingPreview
}: {
  mappingPreview: IntakeSourceMappingResult;
}) {
  const sourceDocumentCandidate = mappingPreview.sourceDocumentCandidate;
  const sourceCardCandidate = mappingPreview.sourceCardCandidate;
  const conciseNotes = mappingPreview.notes.slice(0, 5);
  const conciseWarnings = mappingPreview.warnings.slice(0, 3);

  return (
    <div className="mt-4 border-2 border-studio-line bg-studio-ink/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-blue">Mapping Preview</p>
          <p className="mt-1 text-xs font-black uppercase text-studio-gold">
            Preview only — no SourceDocument or SourceCard is created.
          </p>
        </div>
        <span className="status-pill">{mappingPreview.readiness.replace(/_/g, " ")}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm leading-6">
        <SummaryStat
          label="Document candidate"
          value={mappingPreview.canCreateSourceDocument ? "yes" : "no"}
        />
        <SummaryStat
          label="Card candidate"
          value={mappingPreview.canCreateSourceCardCandidate ? "yes" : "no"}
        />
        <SummaryStat label="Warnings" value={mappingPreview.warnings.length} />
        <SummaryStat label="Notes" value={mappingPreview.notes.length} />
      </div>

      {sourceDocumentCandidate ? (
        <div className="mt-3 border-l-4 border-studio-blue bg-studio-blue/10 p-2">
          <p className="text-xs font-black uppercase text-studio-blue">
            SourceDocument candidate only
          </p>
          <p className="mt-1 font-black text-white">
            {sourceDocumentCandidate.title ?? "Untitled candidate"}
          </p>
          <p className="text-sm text-slate-300">
            Type: {sourceDocumentCandidate.fileType ?? "not compatible yet"}
          </p>
        </div>
      ) : null}

      {sourceCardCandidate ? (
        <div className="mt-3 border-l-4 border-studio-teal bg-studio-teal/10 p-2">
          <p className="text-xs font-black uppercase text-studio-teal">
            SourceCard candidate only
          </p>
          <p className="mt-1 font-black text-white">
            {sourceCardCandidate.title ?? "Untitled candidate"}
          </p>
          <p className="text-sm text-slate-300">
            Type: {sourceCardCandidate.sourceType ?? "not compatible yet"}
          </p>
        </div>
      ) : null}

      {!sourceDocumentCandidate && !sourceCardCandidate ? (
        <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 font-black text-studio-gold">
          No candidate generated yet — review requirements must be resolved first.
        </p>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-black uppercase text-slate-400">Mapping notes</p>
        <div className="mt-2 grid gap-1">
          {conciseNotes.map((note) => (
            <p className="text-sm leading-5 text-slate-300" key={note}>
              {note}
            </p>
          ))}
        </div>
      </div>

      {conciseWarnings.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Mapping warnings
          </p>
          <div className="mt-2 grid gap-2">
            {conciseWarnings.map((warning) => (
              <article
                className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
                key={warning.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black uppercase text-studio-gold">
                    {warning.severity}
                  </span>
                  <span className="text-xs font-black uppercase text-studio-blue">
                    {warning.field ?? "mapping"}
                  </span>
                </div>
                <p className="mt-1 text-slate-300">{warning.message}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
