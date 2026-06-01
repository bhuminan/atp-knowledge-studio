import { FileText, UploadCloud } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  sourceDocumentToSourceCard,
  sourceDocumentsToSourceCards
} from "../../lib/sources/SourceCardMapper";
import { mockIntakeSources } from "../../data/mock/intakeSources";
import {
  summarizeSourceValidation,
  validateSourceCards
} from "../../lib/sources/SourceValidation";
import type {
  ExtractionStatus,
  IntakeSourceRecord,
  SourceCard,
  SourceDocument
} from "../../types/domain";
import type {
  SourceValidationResult,
  SourceValidationSummary
} from "../../lib/sources/SourceValidation";

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

const intakeStatusLabels: Record<ExtractionStatus, string> = {
  not_started: "Not started",
  queued: "Queued",
  extracting: "Extracting",
  extracted: "Extracted",
  needs_review: "Needs review",
  failed: "Failed"
};

const intakePreviewStatuses: ExtractionStatus[] = [
  "extracted",
  "needs_review",
  "queued",
  "failed"
];

type ManualSourceFormState = Pick<
  SourceCard,
  | "title"
  | "year"
  | "sourceType"
  | "publisherOrJournal"
  | "citationText"
  | "apa7Status"
  | "reliabilityLevel"
  | "notes"
> & {
  authorsInput: string;
};

interface IntakePreviewSummary {
  totalRecords: number;
  statusCounts: Record<ExtractionStatus, number>;
  citationMetadataRequiredCount: number;
  warningCount: number;
}

const manualSourceDefaults: ManualSourceFormState = {
  title: "",
  authorsInput: "",
  year: "",
  sourceType: "PDF",
  publisherOrJournal: "",
  citationText: "[DRAFT - manual source, verification required]",
  apa7Status: "needs_review",
  reliabilityLevel: "unknown",
  notes:
    "Local manual source card. No persistence, no file parsing, no verified citation."
};

export function SourceLibraryPage({ sourceDocuments }: SourceLibraryPageProps) {
  const [selectedSourceId, setSelectedSourceId] = useState(sourceDocuments[0]?.id);
  const initialSourceCards = useMemo(
    () => sourceDocumentsToSourceCards(sourceDocuments),
    [sourceDocuments]
  );
  const [sourceCards, setSourceCards] = useState<SourceCard[]>(initialSourceCards);
  const [selectedSourceCardId, setSelectedSourceCardId] = useState(
    initialSourceCards[0]?.sourceId
  );
  const [selectedIntakeId, setSelectedIntakeId] = useState(mockIntakeSources[0]?.id);

  const selectedSource = useMemo(
    () =>
      sourceDocuments.find((source) => source.id === selectedSourceId) ??
      sourceDocuments[0],
    [selectedSourceId, sourceDocuments]
  );
  const selectedSourceCard =
    sourceCards.find((sourceCard) => sourceCard.sourceId === selectedSourceCardId) ??
    sourceCards[0];
  const selectedSourceForCard =
    sourceDocuments.find((source) => source.id === selectedSourceCard.sourceId) ??
    selectedSource;
  const sourceValidationResults = useMemo(
    () => validateSourceCards(sourceCards),
    [sourceCards]
  );
  const sourceValidationSummary = useMemo(
    () => summarizeSourceValidation(sourceValidationResults),
    [sourceValidationResults]
  );
  const selectedSourceValidation =
    sourceValidationResults.find(
      (result) => result.sourceId === selectedSourceCard.sourceId
    ) ?? sourceValidationResults[0];
  const selectedIntake =
    mockIntakeSources.find((intakeSource) => intakeSource.id === selectedIntakeId) ??
    mockIntakeSources[0];
  const intakeSummary = useMemo(
    () => createIntakePreviewSummary(mockIntakeSources),
    []
  );

  function updateSourceCard(sourceId: string, patch: Partial<SourceCard>) {
    setSourceCards((currentSourceCards) =>
      currentSourceCards.map((sourceCard) =>
        sourceCard.sourceId === sourceId ? { ...sourceCard, ...patch } : sourceCard
      )
    );
  }

  function resetSourceCard(sourceDocument: SourceDocument) {
    const mappedSourceCard = sourceDocumentToSourceCard(sourceDocument);
    setSourceCards((currentSourceCards) =>
      currentSourceCards.map((sourceCard) =>
        sourceCard.sourceId === mappedSourceCard.sourceId ? mappedSourceCard : sourceCard
      )
    );
  }

  function addManualSourceCard(sourceCard: SourceCard) {
    setSourceCards((currentSourceCards) => [...currentSourceCards, sourceCard]);
    setSelectedSourceCardId(sourceCard.sourceId);
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[320px_minmax(0,1fr)_340px] gap-3">
      <section className="pixel-panel flex min-h-0 flex-col overflow-y-auto p-4">
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

        <SourceCardReadinessSummary summary={sourceValidationSummary} />

        <IntakePreviewPanel
          intakeSources={mockIntakeSources}
          onSelectIntake={setSelectedIntakeId}
          selectedIntakeId={selectedIntake.id}
          summary={intakeSummary}
        />

        <ManualSourceCardForm onAddSourceCard={addManualSourceCard} />
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
                onClick={() => {
                  setSelectedSourceId(source.id);
                  setSelectedSourceCardId(source.id);
                }}
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

      <SourceDetailPanel
        onPatchSourceCard={updateSourceCard}
        onResetSourceCard={resetSourceCard}
        source={selectedSourceForCard}
        sourceCard={selectedSourceCard}
        selectedIntake={selectedIntake}
        validation={selectedSourceValidation}
      />
    </div>
  );
}

function SourceDetailPanel({
  onPatchSourceCard,
  onResetSourceCard,
  source,
  sourceCard,
  selectedIntake,
  validation
}: {
  onPatchSourceCard: (sourceId: string, patch: Partial<SourceCard>) => void;
  onResetSourceCard: (sourceDocument: SourceDocument) => void;
  source: SourceDocument;
  sourceCard: SourceCard;
  selectedIntake: IntakeSourceRecord;
  validation: SourceValidationResult;
}) {
  const hasMappedSourceDocument = source.id === sourceCard.sourceId;

  return (
    <aside className="pixel-panel min-h-0 overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="panel-label">Source Detail</p>
          <h3 className="mt-1 text-xl font-black leading-7 text-white">
            {sourceCard.title}
          </h3>
        </div>
        <span className="status-pill">{sourceCard.sourceType}</span>
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
          {hasMappedSourceDocument ? (
            source.linkedChapterSections.map((sectionId) => (
              <span className="status-pill" key={sectionId}>
                {sectionId.split("-").join(" ")}
              </span>
            ))
          ) : (
            <span className="status-pill">manual local card</span>
          )}
        </div>
      </div>

      <div className="mt-5 border-2 border-studio-gold bg-studio-gold/10 p-3 text-sm leading-6 text-slate-200">
        <p className="font-black uppercase text-studio-gold">Mock Boundary</p>
        <p className="mt-2">
          This panel previews metadata only. Real extraction, OCR, DOI lookup, and
          citation validation are intentionally disabled.
        </p>
      </div>

      <SelectedIntakeDetail intakeSource={selectedIntake} />

      <div className="mt-5 border-2 border-studio-teal bg-studio-teal/10 p-3 text-sm leading-6 text-slate-200">
        <p className="font-black uppercase text-studio-teal">Source Card Preview</p>
        <p className="mt-2 text-xs font-black uppercase text-studio-gold">
          Local mock source cards only — no persistence, no file parsing, no verified
          citation.
        </p>
        <dl className="mt-4 grid gap-3">
          <Detail label="Source card ID" value={sourceCard.sourceId} />
          <Detail label="Title" value={sourceCard.title} />
          <Detail label="Authors" value={sourceCard.authors.join(", ")} />
          <Detail label="Year" value={sourceCard.year} />
          <Detail label="Source type" value={sourceCard.sourceType} />
          <Detail label="APA7 status" value={sourceCard.apa7Status} />
          <Detail label="Reliability" value={sourceCard.reliabilityLevel} />
          <Detail label="Citation text" value={sourceCard.citationText} />
          <Detail label="Validation status" value={validation.status} />
          <Detail label="Readiness score" value={`${validation.readinessScore}/100`} />
          <Detail label="Evidence suitability" value={validation.evidenceSuitability} />
          <Detail label="Warning count" value={`${validation.warnings.length}`} />
        </dl>
        <div className="mt-4 border-t border-studio-line/70 pt-3">
          <p className="text-xs font-black uppercase text-slate-400">Notes preview</p>
          <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-300">
            {sourceCard.notes}
          </p>
        </div>
      </div>

      <SourceCardEditor
        onPatchSourceCard={onPatchSourceCard}
        onResetSourceCard={
          hasMappedSourceDocument ? () => onResetSourceCard(source) : undefined
        }
        sourceCard={sourceCard}
        validation={validation}
      />
    </aside>
  );
}

function IntakePreviewPanel({
  intakeSources,
  onSelectIntake,
  selectedIntakeId,
  summary
}: {
  intakeSources: IntakeSourceRecord[];
  onSelectIntake: (intakeSourceId: string) => void;
  selectedIntakeId: string;
  summary: IntakePreviewSummary;
}) {
  return (
    <div className="mt-4 border-t-2 border-studio-line pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-blue">
            Image-to-Knowledge Intake Preview
          </p>
          <p className="mt-1 text-xs font-black uppercase text-studio-gold">
            Local mock intake only
          </p>
        </div>
        <span className="mock-badge">{summary.totalRecords} records</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Mock image, screenshot, scan, pasted text, and PDF intake records. No OCR,
        upload, parsing, or storage is running.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm leading-6">
        {intakePreviewStatuses.map((status) => (
          <SummaryStat
            key={status}
            label={intakeStatusLabels[status]}
            value={summary.statusCounts[status]}
          />
        ))}
        <SummaryStat
          label="Citation metadata"
          value={summary.citationMetadataRequiredCount}
        />
        <SummaryStat label="Warnings" value={summary.warningCount} />
      </div>

      <div className="mt-3 grid gap-2">
        {intakeSources.map((intakeSource) => {
          const warningCount = intakeSource.extractionResult?.warnings.length ?? 0;
          const confidenceLevel = intakeSource.extractionResult?.confidenceLevel;
          const isSelected = intakeSource.id === selectedIntakeId;

          return (
            <button
              className={`mini-card text-left ${
                isSelected ? "border-studio-gold bg-studio-gold/10" : ""
              }`}
              key={intakeSource.id}
              onClick={() => onSelectIntake(intakeSource.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-black leading-5 text-white">{intakeSource.title}</p>
                  <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                    {intakeSource.intakeSourceType.replace("_", " ")} ·{" "}
                    {intakeStatusLabels[intakeSource.extractionStatus]}
                  </p>
                </div>
                {confidenceLevel !== undefined ? (
                  <span className="shrink-0 text-xs font-black text-studio-teal">
                    {confidenceLevel}%
                  </span>
                ) : (
                  <span className="status-pill">pending</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="status-pill">{warningCount} warnings</span>
                {intakeSource.citationMetadataRequired ? (
                  <span className="status-pill">metadata required</span>
                ) : (
                  <span className="status-pill">teaching note</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectedIntakeDetail({
  intakeSource
}: {
  intakeSource: IntakeSourceRecord;
}) {
  const extractionResult = intakeSource.extractionResult;
  const warningCount = extractionResult?.warnings.length ?? 0;
  const requiresReview =
    warningCount > 0 ||
    (extractionResult?.confidenceLevel !== undefined &&
      extractionResult.confidenceLevel < 70);

  return (
    <div className="mt-5 border-2 border-studio-blue bg-studio-blue/10 p-3 text-sm leading-6 text-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-blue">
            Image-to-Knowledge Intake Preview
          </p>
          <h4 className="mt-1 font-black leading-6 text-white">{intakeSource.title}</h4>
        </div>
        <span className="status-pill">
          {intakeSource.intakeSourceType.replace("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-xs font-black uppercase text-studio-gold">
        Mock/local preview — no OCR, upload, parser, storage, or verified citation.
      </p>

      <dl className="mt-4 grid gap-3">
        <Detail
          label="Extraction status"
          value={intakeStatusLabels[intakeSource.extractionStatus]}
        />
        <Detail
          label="Source label"
          value={
            intakeSource.sourceLabel ??
            intakeSource.originalFilename ??
            "Local mock intake record"
          }
        />
        <Detail
          label="Summary"
          value={extractionResult?.summary ?? "Extraction summary pending"}
        />
        <Detail
          label="Evidence value"
          value={extractionResult?.evidenceValue.replace("_", " ") ?? "unknown"}
        />
        <Detail
          label="Confidence"
          value={
            extractionResult ? `${extractionResult.confidenceLevel}% mock confidence` : "Pending"
          }
        />
        <Detail
          label="Citation metadata"
          value={
            intakeSource.citationMetadataRequired
              ? "Metadata required before citation use."
              : "Not required for teaching-note use."
          }
        />
        <Detail
          label="Linked source card"
          value={intakeSource.linkedSourceCardId ?? "No linked Source Card yet"}
        />
      </dl>

      <IntakeTagList
        label="Key concepts"
        values={extractionResult?.keyConcepts ?? []}
      />
      <IntakeTagList label="Key claims" values={extractionResult?.keyClaims ?? []} />

      {intakeSource.citationMetadataRequired ? (
        <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 font-black text-studio-gold">
          Metadata required before citation use.
        </p>
      ) : null}
      {requiresReview ? (
        <p className="mt-2 border-l-4 border-studio-rose bg-studio-rose/10 p-2 font-black text-studio-rose">
          Review required before Evidence Vault approval.
        </p>
      ) : null}

      <div className="mt-3 grid gap-2">
        {extractionResult?.warnings.length ? (
          extractionResult.warnings.map((warning) => (
            <article
              className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
              key={warning.id}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black uppercase text-studio-gold">
                  {warning.severity}
                </span>
                <span className="text-xs font-black uppercase text-studio-blue">
                  {warning.field ?? "intake"}
                </span>
              </div>
              <p className="mt-1 text-slate-300">{warning.message}</p>
            </article>
          ))
        ) : (
          <p className="text-sm leading-6 text-studio-teal">
            No mock intake warnings yet.
          </p>
        )}
      </div>

      <p className="mt-3 border-t border-studio-line/70 pt-3 text-sm leading-6 text-slate-300">
        {intakeSource.notes ?? "Mock intake note pending."}
      </p>
    </div>
  );
}

function IntakeTagList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <span className="status-pill" key={value}>
              {value}
            </span>
          ))
        ) : (
          <span className="status-pill">pending</span>
        )}
      </div>
    </div>
  );
}

function SourceCardEditor({
  onPatchSourceCard,
  onResetSourceCard,
  sourceCard,
  validation
}: {
  onPatchSourceCard: (sourceId: string, patch: Partial<SourceCard>) => void;
  onResetSourceCard?: () => void;
  sourceCard: SourceCard;
  validation: SourceValidationResult;
}) {
  return (
    <div className="mt-5 border-2 border-studio-line bg-studio-ink/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="panel-label">Source Card Editor</p>
          <h4 className="mt-1 font-black text-white">Local Mock Only</h4>
        </div>
        <span className="status-pill">{validation.status}</span>
      </div>
      <p className="mt-2 text-xs font-black uppercase text-studio-gold">
        Edits are local mock state only — no persistence, no file parsing, no verified
        citation.
      </p>

      <div className="mt-4 grid gap-3">
        <EditorField
          label="Title"
          onChange={(value) => onPatchSourceCard(sourceCard.sourceId, { title: value })}
          value={sourceCard.title}
        />
        <EditorField
          label="Authors"
          onChange={(value) =>
            onPatchSourceCard(sourceCard.sourceId, {
              authors: splitAuthorsInput(value)
            })
          }
          value={sourceCard.authors.join(", ")}
        />
        <EditorField
          label="Year"
          onChange={(value) => onPatchSourceCard(sourceCard.sourceId, { year: value })}
          value={sourceCard.year}
        />
        <EditorField
          label="Publisher / Journal"
          onChange={(value) =>
            onPatchSourceCard(sourceCard.sourceId, { publisherOrJournal: value })
          }
          value={sourceCard.publisherOrJournal}
        />
        <EditorSelect
          label="Source type"
          onChange={(value) =>
            onPatchSourceCard(sourceCard.sourceId, {
              sourceType: value as SourceCard["sourceType"]
            })
          }
          options={["PDF", "DOCX", "MD"]}
          value={sourceCard.sourceType}
        />
        <EditorSelect
          label="APA7 status"
          onChange={(value) =>
            onPatchSourceCard(sourceCard.sourceId, {
              apa7Status: value as SourceCard["apa7Status"]
            })
          }
          options={["ready", "needs_metadata", "needs_review", "mock"]}
          value={sourceCard.apa7Status}
        />
        <EditorSelect
          label="Reliability"
          onChange={(value) =>
            onPatchSourceCard(sourceCard.sourceId, {
              reliabilityLevel: value as SourceCard["reliabilityLevel"]
            })
          }
          options={["high", "medium", "low", "unknown"]}
          value={sourceCard.reliabilityLevel}
        />
        <EditorTextarea
          label="Citation text"
          onChange={(value) =>
            onPatchSourceCard(sourceCard.sourceId, { citationText: value })
          }
          value={sourceCard.citationText}
        />
        <EditorTextarea
          label="Notes"
          onChange={(value) => onPatchSourceCard(sourceCard.sourceId, { notes: value })}
          value={sourceCard.notes}
        />
      </div>

      <div className="mt-4 border-t border-studio-line/70 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-slate-400">
              Live validation
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {validation.readinessScore}/100 · {validation.evidenceSuitability}
            </p>
          </div>
          {onResetSourceCard ? (
            <button
              className="border-2 border-studio-gold bg-studio-gold/10 px-3 py-2 text-xs font-black uppercase text-studio-gold"
              onClick={onResetSourceCard}
              type="button"
            >
              Reset mapped card
            </button>
          ) : (
            <span className="status-pill">manual card</span>
          )}
        </div>
        <div className="mt-3 grid gap-2">
          {validation.warnings.length > 0 ? (
            validation.warnings.map((warning) => (
              <article
                className="border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6"
                key={warning.warningId}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black uppercase text-studio-gold">
                    {warning.severity}
                  </span>
                  <span className="text-xs font-black uppercase text-studio-blue">
                    {warning.field}
                  </span>
                </div>
                <p className="mt-1 font-black text-white">{warning.code}</p>
                <p className="mt-1 text-slate-300">{warning.message}</p>
              </article>
            ))
          ) : (
            <p className="text-sm leading-6 text-studio-teal">
              No local source card warnings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceCardReadinessSummary({
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

function ManualSourceCardForm({
  onAddSourceCard
}: {
  onAddSourceCard: (sourceCard: SourceCard) => void;
}) {
  const [formState, setFormState] =
    useState<ManualSourceFormState>(manualSourceDefaults);

  function updateFormField<Key extends keyof ManualSourceFormState>(
    field: Key,
    value: ManualSourceFormState[Key]
  ) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sourceId = `manual-source-${Date.now()}`;
    const title = formState.title.trim() || "Untitled manual source card";
    const authors = splitAuthorsInput(formState.authorsInput);
    const manualSourceCard: SourceCard = {
      sourceId,
      title,
      authors,
      year: formState.year.trim(),
      sourceType: formState.sourceType,
      publisherOrJournal: formState.publisherOrJournal.trim(),
      citationText:
        formState.citationText.trim() ||
        "[DRAFT - manual source, verification required]",
      apa7Status: formState.apa7Status,
      reliabilityLevel: formState.reliabilityLevel,
      notes:
        formState.notes.trim() ||
        "Local manual source card. No persistence, no file parsing, no verified citation."
    };

    onAddSourceCard(manualSourceCard);
    setFormState(manualSourceDefaults);
  }

  return (
    <form
      className="mt-4 border-t-2 border-studio-line pt-4"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-blue">
            Add Manual Source Card
          </p>
          <p className="mt-1 text-xs font-black uppercase text-studio-gold">
            Local mock only
          </p>
        </div>
        <span className="mock-badge">No persistence</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Creates a local SourceCard only. It is not indexed, parsed, stored, or
        citation-verified.
      </p>

      <div className="mt-4 grid gap-3">
        <EditorField
          label="Title"
          onChange={(value) => updateFormField("title", value)}
          value={formState.title}
        />
        <EditorField
          label="Authors"
          onChange={(value) => updateFormField("authorsInput", value)}
          value={formState.authorsInput}
        />
        <EditorField
          label="Year"
          onChange={(value) => updateFormField("year", value)}
          value={formState.year}
        />
        <EditorSelect
          label="Source type"
          onChange={(value) =>
            updateFormField("sourceType", value as SourceCard["sourceType"])
          }
          options={["PDF", "DOCX", "MD"]}
          value={formState.sourceType}
        />
        <EditorField
          label="Publisher / Journal"
          onChange={(value) => updateFormField("publisherOrJournal", value)}
          value={formState.publisherOrJournal}
        />
        <EditorTextarea
          label="Citation text"
          onChange={(value) => updateFormField("citationText", value)}
          value={formState.citationText}
        />
        <EditorSelect
          label="APA7 status"
          onChange={(value) =>
            updateFormField("apa7Status", value as SourceCard["apa7Status"])
          }
          options={["needs_review", "needs_metadata", "mock", "ready"]}
          value={formState.apa7Status}
        />
        <EditorSelect
          label="Reliability"
          onChange={(value) =>
            updateFormField(
              "reliabilityLevel",
              value as SourceCard["reliabilityLevel"]
            )
          }
          options={["unknown", "low", "medium", "high"]}
          value={formState.reliabilityLevel}
        />
        <EditorTextarea
          label="Notes"
          onChange={(value) => updateFormField("notes", value)}
          value={formState.notes}
        />
      </div>

      <button
        className="mt-4 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel"
        type="submit"
      >
        Add local source card
      </button>
    </form>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-2 border-studio-line bg-studio-ink/70 p-2">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
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

function EditorField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-xs font-black uppercase text-slate-400">
      {label}
      <input
        className="mt-1 w-full border-2 border-studio-line bg-studio-ink px-3 py-2 text-sm font-bold normal-case text-white"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function EditorSelect({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="text-xs font-black uppercase text-slate-400">
      {label}
      <select
        className="mt-1 w-full border-2 border-studio-line bg-studio-ink px-3 py-2 text-sm font-bold normal-case text-white"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditorTextarea({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-xs font-black uppercase text-slate-400">
      {label}
      <textarea
        className="mt-1 min-h-24 w-full resize-y border-2 border-studio-line bg-studio-ink px-3 py-2 text-sm font-bold leading-6 normal-case text-white"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function splitAuthorsInput(value: string): string[] {
  return value
    .split(",")
    .map((author) => author.trim())
    .filter(Boolean);
}

function createIntakePreviewSummary(
  intakeSources: IntakeSourceRecord[]
): IntakePreviewSummary {
  const statusCounts = intakeSources.reduce<Record<ExtractionStatus, number>>(
    (counts, intakeSource) => ({
      ...counts,
      [intakeSource.extractionStatus]: counts[intakeSource.extractionStatus] + 1
    }),
    {
      not_started: 0,
      queued: 0,
      extracting: 0,
      extracted: 0,
      needs_review: 0,
      failed: 0
    }
  );

  return {
    totalRecords: intakeSources.length,
    statusCounts,
    citationMetadataRequiredCount: intakeSources.filter(
      (intakeSource) => intakeSource.citationMetadataRequired
    ).length,
    warningCount: intakeSources.reduce(
      (count, intakeSource) =>
        count + (intakeSource.extractionResult?.warnings.length ?? 0),
      0
    )
  };
}
