import { FileText, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import type { SourceDocument } from "../../types/domain";

interface SourceLibraryPageProps {
  sourceDocuments: SourceDocument[];
}

const readinessLabels: Record<SourceDocument["citationReadiness"], string> = {
  ready: "Citation ready",
  needs_review: "Needs review",
  missing_metadata: "Missing metadata"
};

const relevanceLabels: Record<SourceDocument["chapterRelevance"], string> = {
  high: "High relevance",
  medium: "Medium relevance",
  low: "Low relevance"
};

export function SourceLibraryPage({ sourceDocuments }: SourceLibraryPageProps) {
  const [selectedSourceId, setSelectedSourceId] = useState(sourceDocuments[0]?.id);

  const selectedSource = useMemo(
    () =>
      sourceDocuments.find((source) => source.id === selectedSourceId) ??
      sourceDocuments[0],
    [selectedSourceId, sourceDocuments]
  );

  return (
    <div className="grid h-full min-h-0 grid-cols-[320px_minmax(0,1fr)_340px] gap-3">
      <section className="pixel-panel flex min-h-0 flex-col overflow-hidden p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="panel-label">Source Library</p>
            <h2 className="mt-1 text-xl font-black text-white">Mock Intake Desk</h2>
          </div>
          <span className="mock-badge">Demo only</span>
        </div>

        <div className="mt-4 grid min-h-44 place-items-center border-4 border-dashed border-studio-line bg-studio-ink/70 p-4 text-center shadow-pixel">
          <div>
            <UploadCloud className="mx-auto text-studio-gold" size={34} />
            <p className="mt-3 text-base font-black text-white">
              Drop source files here
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Mock UI only. No files are read, uploaded, parsed, or stored in Sprint 2A.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {["PDF", "DOCX", "MD"].map((fileType) => (
                <span className="status-pill" key={fileType}>
                  {fileType}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          className="mt-4 border-2 border-studio-gold bg-studio-gold/10 px-4 py-3 text-sm font-black uppercase text-studio-gold opacity-80"
          disabled
          type="button"
        >
          Mock parse queue disabled
        </button>

        <div className="mt-4 border-t-2 border-studio-line pt-4">
          <p className="text-sm font-black uppercase text-studio-blue">
            Intake Rules
          </p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
            <li>PDF, DOCX, and MD labels are visible for planning only.</li>
            <li>Citation readiness is based on local mock metadata.</li>
            <li>Future parsing must preserve source provenance and audit trails.</li>
          </ul>
        </div>
      </section>

      <section className="pixel-panel min-h-0 overflow-hidden p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="panel-label">Indexed Sources</p>
            <h3 className="mt-1 text-xl font-black text-white">
              Product & Service Marketing
            </h3>
          </div>
          <span className="mock-badge">{sourceDocuments.length} mock records</span>
        </div>

        <div className="grid max-h-full gap-3 overflow-y-auto pr-1">
          {sourceDocuments.map((source) => {
            const isSelected = selectedSource.id === source.id;

            return (
              <button
                className={`mini-card text-left ${
                  isSelected ? "border-studio-gold bg-studio-gold/10" : ""
                }`}
                key={source.id}
                onClick={() => setSelectedSourceId(source.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center border-2 border-studio-line bg-studio-ink text-studio-blue">
                      <FileText size={21} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black leading-6 text-white">{source.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {source.summaryPreview}
                      </p>
                    </div>
                  </div>
                  <span className="status-pill">{source.fileType}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold uppercase">
                  <span className="text-studio-teal">
                    {readinessLabels[source.citationReadiness]}
                  </span>
                  <span className="text-studio-gold">
                    {relevanceLabels[source.chapterRelevance]}
                  </span>
                  <span className="text-slate-400">
                    {source.parserStatus.replace("mock_", "mock ")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <SourceDetailPanel source={selectedSource} />
    </div>
  );
}

function SourceDetailPanel({ source }: { source: SourceDocument }) {
  return (
    <aside className="pixel-panel min-h-0 overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="panel-label">Source Detail</p>
          <h3 className="mt-1 text-xl font-black leading-7 text-white">
            {source.title}
          </h3>
        </div>
        <span className="status-pill">{source.fileType}</span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <Detail label="Title" value={source.metadata.title} />
        <Detail label="Author" value={source.metadata.author ?? "Missing"} />
        <Detail label="Year" value={source.metadata.year ?? "Missing"} />
        <Detail label="DOI / URL" value={source.metadata.doiOrUrl ?? "Missing"} />
        <Detail
          label="Citation readiness"
          value={readinessLabels[source.citationReadiness]}
        />
        <Detail
          label="Chapter relevance"
          value={relevanceLabels[source.chapterRelevance]}
        />
      </dl>

      <div className="mt-5 border-2 border-studio-line bg-studio-ink/70 p-3">
        <p className="text-xs font-black uppercase text-studio-gold">
          Linked Chapter Sections
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {source.linkedChapterSections.map((sectionId) => (
            <span className="status-pill" key={sectionId}>
              {sectionId.split("-").join(" ")}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 border-2 border-studio-gold bg-studio-gold/10 p-3 text-sm leading-6 text-slate-200">
        <p className="font-black uppercase text-studio-gold">Mock Boundary</p>
        <p className="mt-2">
          This panel previews metadata only. Real extraction, OCR, DOI lookup, and
          citation validation are intentionally disabled.
        </p>
      </div>
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 leading-6 text-slate-100">{value}</dd>
    </div>
  );
}
