import { Download, MessageSquareText, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { sourceDocuments } from "../../data/mock/sourceDocuments";
import { guardCitations } from "../../lib/agents/CitationGuard";
import { validateChapterStructure } from "../../lib/agents/StructureValidator";
import { runWriterAgent } from "../../lib/agents/WriterAgent";
import type { WriterAgentResult } from "../../lib/agents/types";
import { MockProviderAdapter } from "../../lib/providers/MockProviderAdapter";
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
  const retrievedSources = sourceDocuments.filter((source) =>
    selectedSection.sourceDocumentIds.includes(source.id)
  );
  const structureValidation = validateChapterStructure(selectedDraft.sections);
  const baselineCitationGuard = guardCitations(selectedSection.draftText, retrievedSources);
  const [agentResult, setAgentResult] = useState<WriterAgentResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const visibleCitationGuard = agentResult?.citationFlags ?? baselineCitationGuard;
  const visibleStructureValidation =
    agentResult?.structureValidation ?? structureValidation;
  const visibleCoReview =
    agentResult?.mockCoReviewStatus ?? selectedDraft.geminiCoReviewSummary;
  const visibleDraft = agentResult?.draftOutput ?? selectedSection.draftText;

  useEffect(() => {
    setAgentResult(null);
  }, [selectedDraft.id, selectedSection.id]);

  async function handleGenerateMockDraft() {
    setIsGenerating(true);
    try {
      const provider = new MockProviderAdapter();
      const result = await runWriterAgent(
        {
          chapterTopic: selectedDraft.topic,
          selectedSection,
          allSections: selectedDraft.sections,
          retrievedSources,
          styleConfig: {
            name: selectedDraft.styleProfileId,
            tone: "Formal, precise, source-aware",
            language: "Formal Thai with English technical terms in parentheses",
            citationStyle: "APA 7 mock guard"
          }
        },
        provider
      );
      setAgentResult(result);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[260px_minmax(0,1fr)] gap-3">
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

      <div className="min-h-0 overflow-y-auto pr-1">
      <section className="pixel-panel p-4">
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
          <div className="grid justify-items-end gap-2">
            <span className="mock-badge">
              {agentResult?.providerName ?? "Mock draft"}
            </span>
            <button
              className="flex items-center gap-2 border-2 border-studio-teal bg-studio-teal/10 px-3 py-2 text-xs font-black uppercase text-studio-teal hover:border-studio-gold hover:text-studio-gold"
              disabled={isGenerating}
              onClick={handleGenerateMockDraft}
              type="button"
            >
              <Sparkles size={16} />
              {isGenerating ? "Generating..." : "Generate Mock Draft"}
            </button>
          </div>
        </div>

        <article className="mt-4">
          <p className="text-xs font-black uppercase text-studio-blue">
            {selectedSection.order}. {selectedSection.title}
          </p>
          <h4 className="mt-2 text-xl font-black text-white">{selectedSection.purpose}</h4>
          <p className="mt-4 text-base leading-8 text-slate-100">
            {visibleDraft}
          </p>

          {agentResult ? (
            <div className="mt-5 border-2 border-studio-line bg-studio-ink/70 p-3">
              <p className="text-xs font-black uppercase text-studio-gold">
                Prompt Preview
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                {agentResult.promptPreview}
              </p>
            </div>
          ) : null}

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

      <aside className="mt-3 grid gap-3 xl:grid-cols-2">
        <section className="pixel-panel shrink-0 p-4">
          <p className="panel-label">Mock Provider</p>
          <div className="mt-3 border-2 border-studio-teal bg-studio-teal/10 p-3 text-sm font-bold leading-6 text-studio-teal">
            Mock Provider — no API call
          </div>
        </section>

        <section className="pixel-panel shrink-0 p-4">
          <p className="panel-label">Structure Validation</p>
          <div className="mt-3 border-2 border-studio-line bg-studio-ink/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-black text-white">
                {visibleStructureValidation.passed ? "Passed" : "Needs sections"}
              </p>
              <span className="status-pill">
                {visibleStructureValidation.passed ? "Valid" : "Invalid"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Ordered sections: {visibleStructureValidation.orderedSections.length}/7
            </p>
            {visibleStructureValidation.missingSections.length > 0 ? (
              <p className="mt-2 text-sm leading-6 text-studio-gold">
                Missing: {visibleStructureValidation.missingSections.join(", ")}
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-studio-teal">
                All required Sprint 2B sections are present.
              </p>
            )}
            {visibleStructureValidation.extraSections.length > 0 ? (
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Extra: {visibleStructureValidation.extraSections.join(", ")}
              </p>
            ) : null}
          </div>
        </section>

        <section className="pixel-panel shrink-0 p-4">
          <p className="panel-label">Citation Guard</p>
          <div className="mt-3 grid gap-2">
            {visibleCitationGuard.status === "no_citations_detected" ? (
              <div className="border-2 border-studio-line bg-studio-ink/70 p-3 text-sm leading-6 text-slate-300">
                No citations detected in the current draft text.
              </div>
            ) : (
              visibleCitationGuard.flags.map((flag) => (
                <article
                  className="border-l-4 border-studio-gold bg-studio-ink/70 p-3"
                  key={`${flag.citation}-${flag.classification}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-white">{flag.citation}</p>
                    <span className="status-pill">{flag.classification}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{flag.note}</p>
                </article>
              ))
            )}
          </div>
        </section>

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
              {visibleCoReview}
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
