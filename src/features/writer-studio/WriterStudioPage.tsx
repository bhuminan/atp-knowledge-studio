import { Download, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChapterDraft, ChapterSection, CitationStatus } from "../../types/domain";

interface WriterStudioPageProps {
  chapterDrafts: ChapterDraft[];
}

const citationLabels: Record<CitationStatus["status"], string> = {
  ready: "Ready",
  needs_source: "Needs source",
  metadata_gap: "Metadata gap",
  case_unverified: "Case unverified"
};

export function WriterStudioPage({ chapterDrafts }: WriterStudioPageProps) {
  const [selectedDraftId, setSelectedDraftId] = useState(chapterDrafts[0]?.id);
  const fallbackSectionId = chapterDrafts[0]?.sections[0]?.id ?? "";
  const selectedDraft = useMemo(
    () => chapterDrafts.find((draft) => draft.id === selectedDraftId) ?? chapterDrafts[0],
    [chapterDrafts, selectedDraftId]
  );
  const [selectedSectionId, setSelectedSectionId] = useState(fallbackSectionId);

  const selectedSection =
    selectedDraft.sections.find((section) => section.id === selectedSectionId) ??
    selectedDraft.sections[0];

  const sectionCitationStatuses = selectedDraft.citationStatuses.filter((status) =>
    selectedSection.citationStatusIds.includes(status.id)
  );

  return (
    <div className="grid h-full min-h-0 grid-cols-[280px_minmax(0,1fr)_330px] gap-3">
      <section className="pixel-panel flex min-h-0 flex-col overflow-hidden p-4">
        <div>
          <p className="panel-label">Writer Studio</p>
          <h2 className="mt-1 text-xl font-black text-white">Chapter Builder</h2>
        </div>

        <label className="mt-4 text-xs font-black uppercase text-slate-400">
          Chapter topic
          <select
            className="mt-2 w-full border-2 border-studio-line bg-studio-ink px-3 py-2 text-sm font-bold text-white"
            onChange={(event) => {
              setSelectedDraftId(event.target.value);
              const nextDraft = chapterDrafts.find(
                (draft) => draft.id === event.target.value
              );
              setSelectedSectionId(nextDraft?.sections[0]?.id ?? "");
            }}
            value={selectedDraft.id}
          >
            {chapterDrafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.topic}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <p className="mb-2 text-xs font-black uppercase text-studio-gold">
            7-section structure
          </p>
          <div className="grid gap-2">
            {selectedDraft.sections.map((section) => (
              <button
                className={`mini-card text-left ${
                  selectedSection.id === section.id
                    ? "border-studio-gold bg-studio-gold/10"
                    : ""
                }`}
                key={section.id}
                onClick={() => setSelectedSectionId(section.id)}
                type="button"
              >
                <span className="text-xs font-black uppercase text-studio-blue">
                  Section {section.order}
                </span>
                <span className="font-black text-white">{section.title}</span>
                <span className="text-sm leading-6 text-slate-300">{section.purpose}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pixel-panel min-h-0 overflow-hidden p-4">
        <div className="flex items-start justify-between gap-4 border-b-2 border-studio-line pb-3">
          <div>
            <p className="panel-label">Draft Preview</p>
            <h3 className="mt-1 text-2xl font-black text-white">
              {selectedDraft.topic}
            </h3>
            <p className="mt-1 text-sm font-bold leading-6 text-studio-gold">
              {selectedDraft.audience}
            </p>
          </div>
          <span className="mock-badge">Mock draft</span>
        </div>

        <article className="mt-4 max-h-[calc(100%-94px)] overflow-y-auto pr-2">
          <p className="text-xs font-black uppercase text-studio-blue">
            {selectedSection.order}. {selectedSection.title}
          </p>
          <h4 className="mt-2 text-xl font-black text-white">{selectedSection.purpose}</h4>
          <p className="mt-4 text-base leading-8 text-slate-100">
            {selectedSection.draftText}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {selectedDraft.sections.map((section) => (
              <MiniSectionPreview
                key={section.id}
                section={section}
                selected={section.id === selectedSection.id}
              />
            ))}
          </div>
        </article>
      </section>

      <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
        <section className="pixel-panel shrink-0 p-4">
          <p className="panel-label">Citation Status</p>
          <div className="mt-3 grid gap-2">
            {(sectionCitationStatuses.length > 0
              ? sectionCitationStatuses
              : selectedDraft.citationStatuses
            ).map((status) => (
              <article
                className="border-l-4 border-studio-gold bg-studio-ink/70 p-3"
                key={status.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-white">{status.label}</p>
                  <span className="status-pill">{citationLabels[status.status]}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{status.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pixel-panel shrink-0 p-4">
          <p className="panel-label">Gemini Co-review</p>
          <div className="mt-3 border-2 border-studio-line bg-studio-ink/70 p-3">
            <MessageSquareText className="text-studio-teal" size={22} />
            <p className="mt-2 text-sm leading-6 text-slate-100">
              {selectedDraft.geminiCoReviewSummary}
            </p>
            <span className="mock-badge mt-3">No Gemini call</span>
          </div>
        </section>

        <section className="pixel-panel shrink-0 p-4">
          <p className="panel-label">Iteration Request</p>
          <textarea
            className="mt-3 h-24 w-full resize-none border-2 border-studio-line bg-studio-ink p-3 text-sm leading-6 text-slate-200"
            disabled
            placeholder="Mock only: request a focused revision delta..."
            readOnly
            value={selectedDraft.iterationRequests[0]?.requestText ?? ""}
          />
          <button
            className="mt-3 w-full border-2 border-studio-teal bg-studio-teal/10 px-4 py-2 text-sm font-black uppercase text-studio-teal opacity-80"
            disabled
            type="button"
          >
            Queue mock iteration
          </button>
        </section>

        <section className="pixel-panel shrink-0 p-4">
          <p className="panel-label">Export</p>
          <button
            className="mt-3 flex w-full items-center justify-center gap-2 border-2 border-studio-gold bg-studio-gold/10 px-4 py-3 text-sm font-black uppercase text-studio-gold opacity-80"
            disabled
            type="button"
          >
            <Download size={18} />
            Export DOCX placeholder
          </button>
        </section>
      </aside>
    </div>
  );
}

function MiniSectionPreview({
  section,
  selected
}: {
  section: ChapterSection;
  selected: boolean;
}) {
  return (
    <div
      className={`border-2 p-3 ${
        selected
          ? "border-studio-gold bg-studio-gold/10"
          : "border-studio-line bg-studio-ink/50"
      }`}
    >
      <p className="text-xs font-black uppercase text-studio-blue">
        {section.order}. {section.title}
      </p>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
        {section.draftText}
      </p>
    </div>
  );
}
