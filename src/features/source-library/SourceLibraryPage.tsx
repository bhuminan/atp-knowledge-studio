import { FileText, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import {
  sourceDocumentToSourceCard,
  sourceDocumentsToSourceCards
} from "../../lib/sources/SourceCardMapper";
import {
  Detail,
  EditorField,
  EditorSelect,
  EditorTextarea,
  SummaryStat
} from "./components/SourceLibraryPrimitives";
import { DocumentExtractionMappingPreview } from "./components/DocumentExtractionMappingPreview";
import { IntakeMappingPreview } from "./components/IntakeMappingPreview";
import {
  IntakePreviewPanel,
  type IntakePreviewSummary
} from "./components/IntakePreviewPanel";
import { ManualSourceCardForm } from "./components/ManualSourceCardForm";
import { SourceCardCandidatePreview } from "./components/SourceCardCandidatePreview";
import { SourceCardReadinessSummary } from "./components/SourceCardReadinessSummary";
import {
  documentExtractionToSourceDocumentCandidate,
  summarizeDocumentExtractionReadiness
} from "../../lib/sources/DocumentExtractionMapper";
import { evaluateIntakeMappingReadiness } from "../../lib/sources/IntakeSourceMapper";
import {
  extractDocumentTextFromPath,
  type DocumentExtractionResponse
} from "../../lib/sources/LocalDocumentExtraction";
import {
  inspectLocalDocumentFilePath,
  selectLocalDocumentFile,
  type LocalDocumentFileIntakeJob
} from "../../lib/sources/LocalDocumentFilePicker";
import { mockDocumentExtractionMappingResults } from "../../data/mock/documentExtractionMappingResults";
import { mockIntakeSources } from "../../data/mock/intakeSources";
import {
  qaDocxExtractionResponse,
  qaDocxLocalFile
} from "../../data/qa/sourceLibraryDocxFixture";
import {
  summarizeSourceValidation,
  validateSourceCards
} from "../../lib/sources/SourceValidation";
import type {
  ExtractionStatus,
  FileIntakeJob,
  IntakeReviewStatus,
  IntakeSourceRecord,
  SourceCard,
  SourceDocument
} from "../../types/domain";
import type { SourceValidationResult } from "../../lib/sources/SourceValidation";

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

const intakeReviewStatusLabels: Record<IntakeReviewStatus, string> = {
  new: "New",
  needs_text_review: "Needs text review",
  needs_metadata: "Needs metadata",
  ready_for_source_card: "Ready for Source Card",
  approved: "Approved",
  rejected: "Rejected"
};

const intakeActionLabels: Record<NonNullable<IntakeSourceRecord["recommendedActions"]>[number], string> = {
  review_text: "Review text",
  add_metadata: "Add metadata",
  create_source_card: "Create Source Card",
  approve_for_vault: "Approve for Vault",
  reject: "Reject",
  reprocess: "Reprocess"
};

type SourceDocumentCandidateReviewStatus = "approved" | "needs_review" | "rejected";
type SourceDocumentCandidateValidationStatus =
  | "ready_for_future_vault_save"
  | "needs_metadata_review"
  | "blocked";

const candidateReviewLabels: Record<SourceDocumentCandidateReviewStatus, string> = {
  approved: "Approved for later vault save",
  needs_review: "Needs metadata/review",
  rejected: "Rejected"
};

const candidateValidationLabels: Record<SourceDocumentCandidateValidationStatus, string> = {
  blocked: "Blocked",
  needs_metadata_review: "Needs metadata/review",
  ready_for_future_vault_save: "Ready for future vault save"
};

export function SourceLibraryPage({ sourceDocuments }: SourceLibraryPageProps) {
  const isQaMode = isSourceLibraryQaModeEnabled();
  const [selectedSourceId, setSelectedSourceId] = useState(sourceDocuments[0]?.id);
  const initialSourceCards = useMemo(
    () => sourceDocumentsToSourceCards(sourceDocuments),
    [sourceDocuments]
  );
  const [sourceCards, setSourceCards] = useState<SourceCard[]>(initialSourceCards);
  const [selectedSourceCardId, setSelectedSourceCardId] = useState(
    initialSourceCards[0]?.sourceId
  );
  const [selectedLocalFile, setSelectedLocalFile] =
    useState<LocalDocumentFileIntakeJob | null>(null);
  const [localFilePickerError, setLocalFilePickerError] = useState<string | null>(null);
  const [documentExtractionResult, setDocumentExtractionResult] =
    useState<DocumentExtractionResponse | null>(null);
  const [documentExtractionError, setDocumentExtractionError] = useState<string | null>(null);
  const [candidateReviewStatus, setCandidateReviewStatus] =
    useState<SourceDocumentCandidateReviewStatus>("needs_review");
  const [isExtractingDocumentText, setIsExtractingDocumentText] = useState(false);
  const [isSelectingLocalFile, setIsSelectingLocalFile] = useState(false);
  const [localFilePathInput, setLocalFilePathInput] = useState("");
  const [isInspectingLocalPath, setIsInspectingLocalPath] = useState(false);
  const [selectedIntakeId, setSelectedIntakeId] = useState(mockIntakeSources[0]?.id);
  const [selectedExtractionMappingId, setSelectedExtractionMappingId] = useState(
    mockDocumentExtractionMappingResults[0]?.fileIntakeJobId
  );

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
  const selectedExtractionMapping =
    mockDocumentExtractionMappingResults.find(
      (result) => result.fileIntakeJobId === selectedExtractionMappingId
    ) ?? mockDocumentExtractionMappingResults[0];
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

  async function handleSelectLocalDocumentFile() {
    setIsSelectingLocalFile(true);
    setLocalFilePickerError(null);

    try {
      const selectedFile = await selectLocalDocumentFile();

      if (selectedFile) {
        setSelectedLocalFile(selectedFile);
        setDocumentExtractionResult(null);
        setDocumentExtractionError(null);
        setCandidateReviewStatus("needs_review");
      }
    } catch (error) {
      setLocalFilePickerError(
        error instanceof Error ? error.message : "Unable to select local document file."
      );
    } finally {
      setIsSelectingLocalFile(false);
    }
  }

  async function handleInspectLocalDocumentFilePath() {
    setIsInspectingLocalPath(true);
    setLocalFilePickerError(null);

    try {
      if (isQaMode && localFilePathInput.trim() === qaDocxLocalFile.localPath) {
        setSelectedLocalFile(qaDocxLocalFile);
        setDocumentExtractionResult(null);
        setDocumentExtractionError(null);
        setCandidateReviewStatus("needs_review");
        return;
      }

      const selectedFile = await inspectLocalDocumentFilePath(localFilePathInput);
      setSelectedLocalFile(selectedFile);
      setDocumentExtractionResult(null);
      setDocumentExtractionError(null);
      setCandidateReviewStatus("needs_review");
    } catch (error) {
      setLocalFilePickerError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to inspect local document file path."
      );
    } finally {
      setIsInspectingLocalPath(false);
    }
  }

  async function handleExtractDocumentText() {
    if (!selectedLocalFile) {
      return;
    }

    if (selectedLocalFile.fileType !== "DOCX") {
      setDocumentExtractionResult(null);
      setDocumentExtractionError("PDF extraction is not implemented yet.");
      return;
    }

    setIsExtractingDocumentText(true);
    setDocumentExtractionError(null);

    try {
      if (isQaMode && selectedLocalFile.id === qaDocxLocalFile.id) {
        setDocumentExtractionResult(qaDocxExtractionResponse);
        setCandidateReviewStatus("needs_review");
        return;
      }

      const extractionResponse = await extractDocumentTextFromPath({
        fileIntakeJobId: selectedLocalFile.id,
        fileType: selectedLocalFile.fileType,
        localPath: selectedLocalFile.localPath
      });
      setDocumentExtractionResult(extractionResponse);
      setCandidateReviewStatus("needs_review");
    } catch (error) {
      setDocumentExtractionResult(null);
      setDocumentExtractionError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to extract DOCX text."
      );
    } finally {
      setIsExtractingDocumentText(false);
    }
  }

  return (
    <div
      className="grid h-full min-h-0 grid-cols-[320px_minmax(0,1fr)_340px] gap-3"
      data-testid="source-library-page"
    >
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
          className="mt-4 w-full border-2 border-studio-gold bg-studio-gold/10 px-4 py-3 text-sm font-black uppercase text-studio-gold shadow-pixel transition hover:bg-studio-gold/20 disabled:opacity-60"
          disabled
          onClick={handleSelectLocalDocumentFile}
          type="button"
        >
          Select PDF/DOCX
        </button>
        <p className="mt-2 text-xs font-black uppercase leading-5 text-studio-gold">
          Native file browsing is temporarily disabled in dev mode because the macOS/Tauri dialog
          may freeze. Use Paste Local File Path below.
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-300">
          Supports .pdf and .docx only. Legacy .doc files are not supported yet—please convert them to
          .docx or PDF.
        </p>

        <div className="mt-4 border-2 border-studio-line bg-studio-ink/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-studio-blue">
                Fallback: Paste Local File Path
              </p>
              <p className="mt-1 text-xs font-black uppercase text-studio-gold">
                Metadata only — no text extraction yet.
              </p>
            </div>
            <span className="mock-badge">No parser</span>
          </div>
          <label className="mt-3 block text-xs font-black uppercase text-slate-400">
            Local file path
            <input
              className="mt-1 w-full border-2 border-studio-line bg-studio-panel px-3 py-2 text-sm font-bold normal-case text-white"
              data-testid="local-path-input"
              onChange={(event) => setLocalFilePathInput(event.target.value)}
              placeholder="/Users/apple/Documents/source.pdf"
              value={localFilePathInput}
            />
          </label>
          <button
            className="mt-3 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
            disabled={isInspectingLocalPath}
            onClick={handleInspectLocalDocumentFilePath}
            type="button"
          >
            {isInspectingLocalPath
              ? "Previewing metadata..."
              : "Preview Metadata from Path"}
          </button>
        </div>

        <LocalDocumentFilePreview
          extractionError={documentExtractionError}
          error={localFilePickerError}
          isExtracting={isExtractingDocumentText}
          onExtractDocumentText={handleExtractDocumentText}
          selectedFile={selectedLocalFile}
        />

        <LocalDocumentExtractionPreview extractionResult={documentExtractionResult} />
        <SourceDocumentCandidatePreview
          extractionResult={documentExtractionResult}
          onReviewStatusChange={setCandidateReviewStatus}
          reviewStatus={candidateReviewStatus}
        />

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

        <DocumentExtractionMappingPreview
          onSelectResult={setSelectedExtractionMappingId}
          results={mockDocumentExtractionMappingResults}
          selectedResult={selectedExtractionMapping}
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

function LocalDocumentFilePreview({
  extractionError,
  error,
  isExtracting,
  onExtractDocumentText,
  selectedFile
}: {
  extractionError: string | null;
  error: string | null;
  isExtracting: boolean;
  onExtractDocumentText: () => void;
  selectedFile: LocalDocumentFileIntakeJob | null;
}) {
  const canExtractDocx = selectedFile?.fileType === "DOCX";

  return (
    <div className="mt-4 border-2 border-studio-blue bg-studio-blue/10 p-3 text-sm leading-6 text-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-blue">
            Local File Metadata Preview
          </p>
          <p className="mt-1 text-xs font-black uppercase text-studio-gold">
            Metadata only — no text extraction yet.
          </p>
        </div>
        <span className="status-pill">PDF / DOCX</span>
      </div>

      {selectedFile ? (
        <dl className="mt-3 grid gap-2">
          <Detail label="File name" value={selectedFile.fileName} />
          <Detail label="File type" value={selectedFile.fileType ?? "Unsupported"} />
          <Detail label="MIME type" value={selectedFile.mimeType} />
          <Detail label="File size" value={formatFileSize(selectedFile.fileSize)} />
          <Detail label="Created at" value={selectedFile.createdAt} />
          <Detail label="Status" value={selectedFile.status} />
          <Detail label="Intake ID" value={selectedFile.id} />
          <Detail label="Local path" value={selectedFile.localPath} />
        </dl>
      ) : (
        <p className="mt-3 text-slate-300">
          Select a local PDF or DOCX to preview file metadata only. No parser,
          extraction, persistence, SourceDocument creation, or citation readiness runs.
        </p>
      )}

      {selectedFile ? (
        <div className="mt-4 border-t border-studio-line/70 pt-3">
          <button
            className="w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
            data-testid="extraction-run-button"
            disabled={!canExtractDocx || isExtracting}
            onClick={onExtractDocumentText}
            type="button"
          >
            {isExtracting ? "Extracting DOCX text..." : "Extract DOCX Text"}
          </button>
          <p className="mt-2 text-xs font-black uppercase leading-5 text-studio-gold">
            Review only — no SourceDocument, SourceCard, or Knowledge Card has been created.
          </p>
          {!canExtractDocx ? (
            <p className="mt-2 border-l-4 border-studio-gold bg-studio-gold/10 p-2 font-black text-studio-gold">
              PDF extraction is not implemented yet.
            </p>
          ) : null}
        </div>
      ) : null}

      {selectedFile?.warning ? (
        <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 font-black text-studio-rose">
          {selectedFile.warning}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 font-black text-studio-rose">
          {error}
        </p>
      ) : null}

      {extractionError ? (
        <p className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 font-black text-studio-rose">
          {extractionError}
        </p>
      ) : null}
    </div>
  );
}

function LocalDocumentExtractionPreview({
  extractionResult
}: {
  extractionResult: DocumentExtractionResponse | null;
}) {
  if (!extractionResult) {
    return null;
  }

  const { extraction, parserWarnings, segments, traces } = extractionResult;
  const segmentPreviews = segments.slice(0, 5);

  return (
    <div
      className="mt-4 border-2 border-studio-teal bg-studio-teal/10 p-3 text-sm leading-6 text-slate-200"
      data-testid="extraction-preview-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-teal">
            DOCX Text Extraction Preview
          </p>
          <p className="mt-1 text-xs font-black uppercase text-studio-gold">
            Review only — no SourceDocument, SourceCard, or Knowledge Card has been created.
          </p>
        </div>
        <span className="status-pill">{extraction.extractionStatus}</span>
      </div>

      <dl className="mt-4 grid gap-2">
        <Detail label="Raw text length" value={`${extraction.rawText.length} characters`} />
        <Detail
          label="Cleaned text length"
          value={`${extraction.cleanedText.length} characters`}
        />
        <Detail label="Segments" value={`${segments.length}`} />
        <Detail label="Traces" value={`${traces.length}`} />
        <Detail label="Parser warnings" value={`${parserWarnings.length}`} />
      </dl>

      <div className="mt-4 border-t border-studio-line/70 pt-3">
        <p className="text-xs font-black uppercase text-slate-400">
          Cleaned text preview
        </p>
        <p className="mt-2 line-clamp-5 whitespace-pre-line text-sm leading-6 text-slate-200">
          {extraction.cleanedText || "No cleaned text returned."}
        </p>
      </div>

      <div className="mt-4 border-t border-studio-line/70 pt-3">
        <p className="text-xs font-black uppercase text-slate-400">
          First extracted segments
        </p>
        <div className="mt-2 grid gap-2">
          {segmentPreviews.map((segment) => {
            const trace = traces.find(
              (candidateTrace) => candidateTrace.segmentId === segment.segmentId
            );

            return (
              <article
                className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
                key={segment.segmentId}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-white">{segment.title}</p>
                  <span className="status-pill">
                    {trace?.chunkReference ?? "trace pending"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-3 text-slate-300">{segment.content}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-4 border-t border-studio-line/70 pt-3">
        <p className="text-xs font-black uppercase text-slate-400">Parser warnings</p>
        <div className="mt-2 grid gap-2">
          {parserWarnings.length > 0 ? (
            parserWarnings.map((warning) => (
              <article
                className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
                key={warning.warningId}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black uppercase text-studio-gold">
                    {warning.severity}
                  </span>
                  <span className="text-xs font-black uppercase text-studio-blue">
                    {warning.field ?? "docx"}
                  </span>
                </div>
                <p className="mt-1 font-black text-white">{warning.code}</p>
                <p className="mt-1 text-slate-300">{warning.message}</p>
              </article>
            ))
          ) : (
            <p className="text-studio-teal">No parser warnings returned.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceDocumentCandidatePreview({
  extractionResult,
  onReviewStatusChange,
  reviewStatus
}: {
  extractionResult: DocumentExtractionResponse | null;
  onReviewStatusChange: (status: SourceDocumentCandidateReviewStatus) => void;
  reviewStatus: SourceDocumentCandidateReviewStatus;
}) {
  const candidatePreview = createSourceDocumentCandidatePreview(extractionResult);

  if (!candidatePreview) {
    return null;
  }

  const {
    candidate,
    extraction,
    parserWarningCount,
    parserWarnings,
    readiness,
    segments,
    traces
  } = candidatePreview;
  const validationSummary = validateSourceDocumentCandidate({
    candidate,
    extraction,
    parserWarningCount,
    reviewStatus,
    segments,
    traces
  });

  return (
    <div
      className="mt-4 border-2 border-studio-gold bg-studio-gold/10 p-3 text-sm leading-6 text-slate-200"
      data-testid="source-document-candidate-preview"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-gold">
            SourceDocument Candidate Preview
          </p>
          <p className="mt-1 text-xs font-black uppercase text-studio-rose">
            Candidate only — not saved to Knowledge Vault.
          </p>
        </div>
        <span className="status-pill">{candidateReviewLabels[reviewStatus]}</span>
      </div>

      <dl className="mt-4 grid gap-2">
        <Detail label="Proposed title" value={candidate.title ?? "Review required"} />
        <Detail label="Source type" value={candidate.fileType ?? "DOCX"} />
        <Detail
          label="Parser / extraction status"
          value={`${candidate.parserStatus ?? "mock_needs_review"} / ${readiness.extractionStatus}`}
        />
        <Detail
          label="Text length"
          value={`${extraction.cleanedText.length} cleaned characters`}
        />
        <Detail label="Segments" value={`${segments.length}`} />
        <Detail label="Traces" value={`${traces.length}`} />
        <Detail label="Warnings" value={`${readiness.warningCount}`} />
        <Detail
          label="Candidate readiness"
          value={readiness.readiness.replace(/_/g, " ")}
        />
      </dl>

      <div className="mt-4 border-t border-studio-line/70 pt-3">
        <p className="text-xs font-black uppercase text-slate-400">Provenance note</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Local DOCX extraction preview from {candidate.fileName}. Trace references are
          chunk-level DOCX markers, not trusted page numbers. Human review is required
          before Knowledge Vault use.
        </p>
      </div>

      <div className="mt-4 border-t border-studio-line/70 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-slate-400">
              Human review state
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {candidateReviewLabels[reviewStatus]}
            </p>
          </div>
          <span className="mock-badge">Mock state</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            className={`border-2 px-2 py-2 text-xs font-black uppercase shadow-pixel ${
              reviewStatus === "approved"
                ? "border-studio-teal bg-studio-teal/25 text-studio-teal"
                : "border-studio-line bg-studio-panel text-slate-300"
            }`}
            data-testid="review-state-approved"
            onClick={() => onReviewStatusChange("approved")}
            type="button"
          >
            Approve Candidate
          </button>
          <button
            className={`border-2 px-2 py-2 text-xs font-black uppercase shadow-pixel ${
              reviewStatus === "needs_review"
                ? "border-studio-gold bg-studio-gold/25 text-studio-gold"
                : "border-studio-line bg-studio-panel text-slate-300"
            }`}
            onClick={() => onReviewStatusChange("needs_review")}
            type="button"
          >
            Needs Review
          </button>
          <button
            className={`border-2 px-2 py-2 text-xs font-black uppercase shadow-pixel ${
              reviewStatus === "rejected"
                ? "border-studio-rose bg-studio-rose/25 text-studio-rose"
                : "border-studio-line bg-studio-panel text-slate-300"
            }`}
            onClick={() => onReviewStatusChange("rejected")}
            type="button"
          >
            Reject Candidate
          </button>
        </div>
        <p className="mt-3 text-xs font-black uppercase leading-5 text-studio-gold">
          Mock review state only — candidate is not saved to Knowledge Vault.
        </p>
      </div>

      <CandidateValidationSummary validationSummary={validationSummary} />
      <SourceCardCandidatePreview
        candidate={candidate}
        extraction={extraction}
        isReviewApproved={reviewStatus === "approved"}
        isValidationReady={
          validationSummary.status === "ready_for_future_vault_save"
        }
        parserWarnings={parserWarnings}
        readinessWarnings={readiness.warnings}
        reviewStatusLabel={candidateReviewLabels[reviewStatus]}
        segments={segments}
        traces={traces}
      />
      <MockVaultSavePreview
        candidate={candidate}
        extractionStatus={readiness.extractionStatus}
        reviewStatus={reviewStatus}
        validationSummary={validationSummary}
        warningCount={readiness.warningCount}
        segmentCount={segments.length}
        traceCount={traces.length}
      />

      {readiness.warnings.length > 0 ? (
        <div className="mt-4 border-t border-studio-line/70 pt-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Review warnings
          </p>
          <div className="mt-2 grid gap-2">
            {readiness.warnings.slice(0, 4).map((warning) => (
              <article
                className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
                key={warning.warningId}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black uppercase text-studio-gold">
                    {warning.severity}
                  </span>
                  <span className="text-xs font-black uppercase text-studio-blue">
                    {warning.field ?? "candidate"}
                  </span>
                </div>
                <p className="mt-1 font-black text-white">{warning.code}</p>
                <p className="mt-1 text-slate-300">{warning.message}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-4 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-xs font-black uppercase leading-5 text-studio-rose">
        Review only — no SourceDocument, SourceCard, or Knowledge Card has been created.
      </p>
    </div>
  );
}

function MockVaultSavePreview({
  candidate,
  extractionStatus,
  reviewStatus,
  segmentCount,
  traceCount,
  validationSummary,
  warningCount
}: {
  candidate: Partial<SourceDocument>;
  extractionStatus: ExtractionStatus;
  reviewStatus: SourceDocumentCandidateReviewStatus;
  segmentCount: number;
  traceCount: number;
  validationSummary: SourceDocumentCandidateValidationSummary;
  warningCount: number;
}) {
  const canPreviewVaultSave =
    reviewStatus === "approved" &&
    validationSummary.status === "ready_for_future_vault_save";

  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="mock-vault-save-preview"
    >
      {canPreviewVaultSave ? (
        <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black uppercase text-studio-teal">
                Mock Vault Save Preview
              </p>
              <p className="mt-1 text-xs font-black uppercase text-studio-gold">
                Mock only — nothing has been saved to Knowledge Vault.
              </p>
            </div>
            <span className="status-pill">Pending real persistence</span>
          </div>
          <dl className="mt-4 grid gap-2">
            <Detail label="Source document title" value={candidate.title ?? "Review required"} />
            <Detail label="Source type" value={candidate.fileType ?? "DOCX"} />
            <Detail label="Extraction status" value={extractionStatus} />
            <Detail label="Segments" value={`${segmentCount}`} />
            <Detail label="Traces" value={`${traceCount}`} />
            <Detail label="Warnings" value={`${warningCount}`} />
            <Detail label="Review status" value={candidateReviewLabels[reviewStatus]} />
            <Detail label="Proposed vault status" value="Pending real persistence" />
          </dl>
        </div>
      ) : (
        <div className="border-2 border-studio-line bg-studio-panel/60 p-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Mock Vault Save Preview
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-studio-gold">
            Vault save preview is available only after approval.
          </p>
          <p className="mt-2 text-xs font-black uppercase leading-5 text-slate-400">
            Mock only — nothing has been saved to Knowledge Vault.
          </p>
        </div>
      )}
    </div>
  );
}

function CandidateValidationSummary({
  validationSummary
}: {
  validationSummary: SourceDocumentCandidateValidationSummary;
}) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="candidate-validation-summary"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            Candidate Validation Summary
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {candidateValidationLabels[validationSummary.status]}
          </p>
        </div>
        <span className="status-pill">
          {candidateValidationLabels[validationSummary.status]}
        </span>
      </div>
      <p className="mt-2 text-xs font-black uppercase leading-5 text-studio-gold">
        Validation only — no data is saved.
      </p>
      <div className="mt-3 grid gap-2">
        {validationSummary.checks.map((check) => (
          <div
            className="flex items-start justify-between gap-3 border border-studio-line bg-studio-panel/60 px-2 py-2"
            key={check.label}
          >
            <div>
              <p className="text-xs font-black uppercase text-white">{check.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{check.detail}</p>
            </div>
            <span
              className={`shrink-0 text-xs font-black uppercase ${
                check.passed ? "text-studio-teal" : "text-studio-rose"
              }`}
            >
              {check.passed ? "Pass" : "Check"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function createSourceDocumentCandidatePreview(
  extractionResult: DocumentExtractionResponse | null
) {
  if (!extractionResult || !isSupportedFileIntakeType(extractionResult.fileIntakeJob.fileType)) {
    return null;
  }

  const fileIntakeJob: FileIntakeJob = {
    createdAt: extractionResult.fileIntakeJob.createdAt,
    fileName: extractionResult.fileIntakeJob.fileName,
    fileSize: extractionResult.fileIntakeJob.fileSize,
    fileType: extractionResult.fileIntakeJob.fileType,
    id: extractionResult.fileIntakeJob.id,
    mimeType: extractionResult.fileIntakeJob.mimeType,
    status: extractionResult.extraction.extractionStatus
  };
  const mappingInput = {
    extraction: extractionResult.extraction,
    fileIntakeJob,
    segments: extractionResult.segments,
    traces: extractionResult.traces
  };

  return {
    candidate: documentExtractionToSourceDocumentCandidate(mappingInput),
    extraction: extractionResult.extraction,
    parserWarningCount: extractionResult.parserWarnings.length,
    parserWarnings: extractionResult.parserWarnings,
    readiness: summarizeDocumentExtractionReadiness(mappingInput),
    segments: extractionResult.segments,
    traces: extractionResult.traces
  };
}

function isSupportedFileIntakeType(
  fileType: LocalDocumentFileIntakeJob["fileType"]
): fileType is FileIntakeJob["fileType"] {
  return fileType === "PDF" || fileType === "DOCX";
}

function isSourceLibraryQaModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("qa") === "source-library";
}

interface SourceDocumentCandidateValidationCheck {
  detail: string;
  label: string;
  passed: boolean;
}

interface SourceDocumentCandidateValidationSummary {
  checks: SourceDocumentCandidateValidationCheck[];
  status: SourceDocumentCandidateValidationStatus;
}

function validateSourceDocumentCandidate({
  candidate,
  extraction,
  parserWarningCount,
  reviewStatus,
  segments,
  traces
}: {
  candidate: Partial<SourceDocument>;
  extraction: DocumentExtractionResponse["extraction"];
  parserWarningCount: number;
  reviewStatus: SourceDocumentCandidateReviewStatus;
  segments: DocumentExtractionResponse["segments"];
  traces: DocumentExtractionResponse["traces"];
}): SourceDocumentCandidateValidationSummary {
  const checks: SourceDocumentCandidateValidationCheck[] = [
    {
      detail: candidate.title
        ? `Proposed title: ${candidate.title}`
        : "Candidate title is missing.",
      label: "Has title",
      passed: Boolean(candidate.title)
    },
    {
      detail: candidate.fileType
        ? `Source type: ${candidate.fileType}`
        : "Source type is missing.",
      label: "Has source type",
      passed: Boolean(candidate.fileType)
    },
    {
      detail: extraction.cleanedText
        ? `${extraction.cleanedText.length} cleaned characters extracted.`
        : "Cleaned text is missing.",
      label: "Has extracted cleaned text",
      passed: extraction.cleanedText.trim().length > 0
    },
    {
      detail: `${segments.length} segment${segments.length === 1 ? "" : "s"} extracted.`,
      label: "Has at least one segment",
      passed: segments.length > 0
    },
    {
      detail: `${traces.length} trace reference${traces.length === 1 ? "" : "s"} available.`,
      label: "Has at least one trace",
      passed: traces.length > 0
    },
    {
      detail:
        parserWarningCount > 0
          ? `${parserWarningCount} parser warning${parserWarningCount === 1 ? "" : "s"} displayed.`
          : "No parser warnings returned.",
      label: "Parser warnings are displayed",
      passed: true
    },
    {
      detail: candidateReviewLabels[reviewStatus],
      label: "Review state is selected",
      passed: Boolean(reviewStatus)
    }
  ];
  const hasTraces = traces.length > 0;
  const status: SourceDocumentCandidateValidationStatus =
    reviewStatus === "rejected" || (reviewStatus === "approved" && !hasTraces)
      ? "blocked"
      : reviewStatus === "approved" && hasTraces
        ? "ready_for_future_vault_save"
        : "needs_metadata_review";

  return {
    checks,
    status
  };
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

function SelectedIntakeDetail({
  intakeSource
}: {
  intakeSource: IntakeSourceRecord;
}) {
  const extractionResult = intakeSource.extractionResult;
  const mappingPreview = evaluateIntakeMappingReadiness(intakeSource);
  const warningCount = extractionResult?.warnings.length ?? 0;
  const reviewStatus = intakeSource.reviewStatus ?? "new";
  const recommendedActions = intakeSource.recommendedActions ?? [];
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
          label="Review status"
          value={intakeReviewStatusLabels[reviewStatus]}
        />
        <Detail
          label="Vault approval"
          value={intakeSource.approvedForVault ? "Mock approved" : "Mock approval pending"}
        />
        <Detail
          label="Citation use"
          value={intakeSource.citationUseAllowed ? "Citation use allowed" : "Citation use blocked"}
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
      <IntakeTagList
        label="Recommended actions"
        values={recommendedActions.map((action) => intakeActionLabels[action])}
      />

      <IntakeMappingPreview mappingPreview={mappingPreview} />

      {intakeSource.citationMetadataRequired ? (
        <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 font-black text-studio-gold">
          Metadata required before citation use.
        </p>
      ) : null}
      <p
        className={`mt-2 border-l-4 p-2 font-black ${
          intakeSource.citationUseAllowed
            ? "border-studio-teal bg-studio-teal/10 text-studio-teal"
            : "border-studio-rose bg-studio-rose/10 text-studio-rose"
        }`}
      >
        {intakeSource.citationUseAllowed ? "Citation use allowed" : "Citation use blocked"}
      </p>
      <p className="mt-2 border-l-4 border-studio-line bg-studio-panel/60 p-2 font-black text-slate-200">
        Approval is mock-only and not persisted.
      </p>
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
        {intakeSource.reviewerNote ?? intakeSource.notes ?? "Mock intake note pending."}
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
    <div
      className="mt-5 border-2 border-studio-line bg-studio-ink/70 p-3"
      data-testid="source-card-editor"
    >
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

function splitAuthorsInput(value: string): string[] {
  return value
    .split(",")
    .map((author) => author.trim())
    .filter(Boolean);
}

function formatFileSize(fileSize: number): string {
  if (fileSize < 1024) {
    return `${fileSize} bytes`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
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
  const reviewStatusCounts = intakeSources.reduce<Record<IntakeReviewStatus, number>>(
    (counts, intakeSource) => {
      const reviewStatus = intakeSource.reviewStatus ?? "new";

      return {
        ...counts,
        [reviewStatus]: counts[reviewStatus] + 1
      };
    },
    {
      new: 0,
      needs_text_review: 0,
      needs_metadata: 0,
      ready_for_source_card: 0,
      approved: 0,
      rejected: 0
    }
  );

  return {
    totalRecords: intakeSources.length,
    statusCounts,
    reviewStatusCounts,
    citationMetadataRequiredCount: intakeSources.filter(
      (intakeSource) => intakeSource.citationMetadataRequired
    ).length,
    citationUseAllowedCount: intakeSources.filter(
      (intakeSource) => intakeSource.citationUseAllowed
    ).length,
    warningCount: intakeSources.reduce(
      (count, intakeSource) =>
        count + (intakeSource.extractionResult?.warnings.length ?? 0),
      0
    )
  };
}
