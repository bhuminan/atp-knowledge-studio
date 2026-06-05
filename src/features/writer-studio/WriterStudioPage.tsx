import { Download, MessageSquareText, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { sourceDocuments } from "../../data/mock/sourceDocuments";
import { createMockTextbookChapterDraft } from "../../data/mock/textbookChapterDrafts";
import {
  guardCitations,
  guardTextbookChapterCitations
} from "../../lib/agents/CitationGuard";
import {
  validateChapterStructure,
  validateTextbookChapterStructure
} from "../../lib/agents/StructureValidator";
import { runWriterAgent } from "../../lib/agents/WriterAgent";
import type { WriterAgentResult } from "../../lib/agents/types";
import { MockProviderAdapter } from "../../lib/providers/MockProviderAdapter";
import type {
  ChapterDraft,
  ChapterSection,
  CitationStatus,
  TextbookChapterDraft
} from "../../types/domain";

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
  const textbookChapter = useMemo(() => createMockTextbookChapterDraft(), []);
  const textbookStructureValidation = useMemo(
    () => validateTextbookChapterStructure(textbookChapter),
    [textbookChapter]
  );
  const textbookCitationGuard = useMemo(
    () => guardTextbookChapterCitations(textbookChapter),
    [textbookChapter]
  );

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
    <div className="writer-page grid h-full min-h-0 grid-cols-[260px_minmax(0,1fr)] gap-3">
      <section className="win-panel writer-left-panel flex min-h-0 flex-col overflow-hidden p-4">
        <div>
          <p className="writer-panel-heading">Writer Studio</p>
          <h2 className="mt-1 text-xl font-black text-black">Chapter Builder</h2>
        </div>

        <label className="writer-field-label mt-4">
          Chapter topic
          <select
            className="win-input mt-2 w-full"
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
          <p className="writer-panel-heading mb-2">
            7-section structure
          </p>
          <div className="grid gap-2">
            {selectedDraft.sections.map((section) => (
              <button
                className={`writer-section-link text-left ${
                  selectedSection.id === section.id ? "writer-section-link-active" : ""
                }`}
                key={section.id}
                onClick={() => setSelectedSectionId(section.id)}
                type="button"
              >
                <span className="writer-section-order">
                  Section {section.order}
                </span>
                <span className="writer-section-title">{section.title}</span>
                <span className="writer-section-description">{section.purpose}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="min-h-0 overflow-y-auto pr-1">
      <section className="win-inset writer-draft-preview p-4">
        <div className="flex items-start justify-between gap-4 border-b border-[#888] pb-3">
          <div>
            <p className="writer-panel-heading">Draft Preview</p>
            <h3 className="mt-1 text-2xl font-black text-black">
              {selectedDraft.topic}
            </h3>
            <p className="mt-1 text-sm font-bold leading-6 text-[#555]">
              {selectedDraft.audience}
            </p>
          </div>
          <div className="grid justify-items-end gap-2">
            <span className="mock-badge">
              {agentResult?.providerName ?? "Mock draft"}
            </span>
            <button
              className="win-btn win-btn-primary flex items-center gap-2"
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
          <p className="writer-section-order">
            {selectedSection.order}. {selectedSection.title}
          </p>
          <h4 className="mt-2 text-xl font-black text-black">{selectedSection.purpose}</h4>
          <p className="mt-4 text-base leading-8 text-black">
            {visibleDraft}
          </p>

          {agentResult ? (
            <div className="win-inset mt-5 p-3">
              <p className="writer-panel-heading">
                Prompt Preview
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-black">
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

      <TextbookChapterContractPreview
        chapter={textbookChapter}
        citationGuard={textbookCitationGuard}
        structureValidation={textbookStructureValidation}
      />

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

function TextbookChapterContractPreview({
  chapter,
  citationGuard,
  structureValidation
}: {
  chapter: TextbookChapterDraft;
  citationGuard: ReturnType<typeof guardTextbookChapterCitations>;
  structureValidation: ReturnType<typeof validateTextbookChapterStructure>;
}) {
  return (
    <section className="pixel-panel mt-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-studio-line pb-3">
        <div>
          <p className="panel-label">Evidence-Grounded Textbook Chapter</p>
          <h3 className="mt-1 text-xl font-black text-white">
            Textbook Chapter Contract Preview
          </h3>
        </div>
        <span className="mock-badge">Mock contract v0.2</span>
      </div>

      <div className="mt-3 border-2 border-studio-gold bg-studio-gold/10 p-3 text-sm font-bold leading-6 text-studio-gold">
        Mock textbook chapter preview — no real API call, no verified citations, no
        Obsidian/DOCX export yet.
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="border-2 border-studio-line bg-studio-ink/70 p-3">
          <p className="panel-label">Chapter Meta</p>
          <dl className="mt-2 grid gap-2 text-sm leading-6">
            <MetaRow label="Title" value={chapter.chapterMeta.chapterTitle} />
            <MetaRow label="Concept" value={chapter.chapterMeta.conceptKeyword} />
            <MetaRow label="Course" value={chapter.chapterMeta.targetCourse} />
            <MetaRow label="Language" value={chapter.chapterMeta.language} />
            <MetaRow label="Style" value={chapter.chapterMeta.styleMode} />
            <MetaRow label="Mock status" value={chapter.chapterMeta.mockStatus} />
            <MetaRow label="Provider" value={chapter.chapterMeta.createdByProvider} />
          </dl>
        </div>

        <div className="border-2 border-studio-line bg-studio-ink/70 p-3 xl:col-span-2">
          <p className="panel-label">Front Matter</p>
          <p className="mt-2 text-sm leading-6 text-slate-100">
            {chapter.frontMatter.overview}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {chapter.frontMatter.openingVignette}
          </p>
          <p className="mt-2 text-sm leading-6 text-studio-gold">
            {chapter.frontMatter.whyItMatters}
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {chapter.frontMatter.learningObjectives.map((objective) => (
              <div
                className="border-l-4 border-studio-teal bg-studio-panel/60 p-2 text-sm leading-6 text-slate-200"
                key={objective}
              >
                {objective}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="panel-label">Locked Core Sections</p>
        <div className="mt-2 grid gap-2 xl:grid-cols-2">
          {chapter.coreSections.map((section) => (
            <article
              className="border-2 border-studio-line bg-studio-ink/70 p-3"
              key={section.sectionId}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase text-studio-blue">
                    {section.order}. {section.sectionId}
                  </p>
                  <h4 className="mt-1 font-black text-white">{section.title}</h4>
                </div>
                <span className="status-pill">{section.citationStatus}</span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
                {section.bodyThai}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black uppercase text-slate-300">
                <span>Evidence: {section.linkedEvidenceIds.length}</span>
                <span>Citations: {section.citationMarkers.length}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-4">
        <SummaryPanel title="Structure Validation">
          <StatCell label="Passed" value={structureValidation.passed ? "yes" : "no"} />
          <StatCell label="Readiness" value={structureValidation.readinessStatus} />
          <StatCell label="Missing layers" value={structureValidation.missingLayers.length} />
          <StatCell
            label="Missing sections"
            value={structureValidation.missingCoreSections.length}
          />
          <StatCell
            label="Duplicate sections"
            value={structureValidation.duplicateCoreSections.length}
          />
          <StatCell
            label="Reordered sections"
            value={structureValidation.reorderedCoreSections.length}
          />
          <StatCell label="Warnings" value={structureValidation.warnings.length} />
        </SummaryPanel>

        <SummaryPanel title="Citation Guard">
          <StatCell label="Status" value={citationGuard.status} />
          <StatCell label="Sources" value={citationGuard.checkedSourceCount} />
          <StatCell label="Evidence" value={citationGuard.checkedEvidenceCount} />
          <StatCell label="Citations" value={citationGuard.checkedCitationCount} />
          <StatCell label="Fabricated risk" value={citationGuard.fabricatedRiskCount} />
          <StatCell label="Mock citations" value={citationGuard.mockCitationCount} />
          <StatCell label="Unsupported" value={citationGuard.unsupportedCitationCount} />
          <StatCell label="Metadata gaps" value={citationGuard.incompleteMetadataCount} />
          <StatCell label="Coverage" value={citationGuard.evidenceCoverageStatus} />
        </SummaryPanel>

        <SummaryPanel title="Evidence Layer">
          <StatCell label="Source cards" value={chapter.evidenceLayer.sourceCards.length} />
          <StatCell label="Evidence items" value={chapter.evidenceLayer.evidenceItems.length} />
          <StatCell
            label="Citation markers"
            value={chapter.evidenceLayer.citationMarkers.length}
          />
          <StatCell label="Coverage score" value={chapter.evidenceLayer.evidenceCoverageScore} />
          <StatCell label="Verification" value={chapter.evidenceLayer.verificationStatus} />
        </SummaryPanel>

        <SummaryPanel title="Teaching Layer">
          <StatCell label="Key terms" value={chapter.learningApparatus.keyTerms.length} />
          <StatCell
            label="Discussion"
            value={chapter.learningApparatus.discussionQuestions.length}
          />
          <StatCell label="Thai cases" value={chapter.casesAndExamples.thaiCases.length} />
          <StatCell label="Global cases" value={chapter.casesAndExamples.globalCases.length} />
          <StatCell label="Mini examples" value={chapter.casesAndExamples.miniExamples.length} />
          <StatCell label="Exhibits" value={chapter.exhibits.length} />
        </SummaryPanel>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="border-2 border-studio-line bg-studio-ink/70 p-3">
          <p className="panel-label">Learning Apparatus Preview</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {chapter.learningApparatus.chapterSummary}
          </p>
          <p className="mt-2 text-xs font-black uppercase text-studio-blue">
            Key terms: {chapter.learningApparatus.keyTerms.join(", ")}
          </p>
        </div>

        <div className="border-2 border-studio-line bg-studio-ink/70 p-3">
          <p className="panel-label">Cases & Exhibits Preview</p>
          <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-200">
            <p>{chapter.casesAndExamples.thaiCases[0]}</p>
            <p>{chapter.casesAndExamples.globalCases[0]}</p>
            <p className="text-studio-gold">
              Exhibit placeholders: {chapter.exhibits.map((exhibit) => exhibit.title).join("; ")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
      <dt className="text-xs font-black uppercase text-slate-400">{label}</dt>
      <dd className="font-bold text-slate-100">{value}</dd>
    </div>
  );
}

function SummaryPanel({
  children,
  title
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="border-2 border-studio-line bg-studio-ink/70 p-3">
      <p className="panel-label">{title}</p>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-studio-line/70 pb-1 text-sm leading-6">
      <span className="text-slate-400">{label}</span>
      <span className="font-black text-white">{value}</span>
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
      className={`writer-mini-section ${selected ? "writer-mini-section-active" : ""}`}
    >
      <p className="writer-section-order">
        {section.order}. {section.title}
      </p>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-black">
        {section.draftText}
      </p>
    </div>
  );
}
