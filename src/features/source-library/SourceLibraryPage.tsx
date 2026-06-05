import { FileText, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { KnowledgeCardCandidatePreview } from "./components/KnowledgeCardCandidatePreview";
import {
  createReviewedTags,
  getApprovedTagLabels,
  MarketingTagSuggestionPreview
} from "./components/MarketingTagSuggestionPreview";
import { ManualSourceCardForm } from "./components/ManualSourceCardForm";
import { RealParserReadinessPanel } from "./components/RealParserReadinessPanel";
import { SourceLibraryIncomingPackagePreview } from "./components/SourceLibraryIncomingPackagePreview";
import {
  createSourceCardCandidatePreview,
  SourceCardCandidatePreview
} from "./components/SourceCardCandidatePreview";
import { SourceCardReadinessSummary } from "./components/SourceCardReadinessSummary";
import {
  documentExtractionToSourceDocumentCandidate,
  summarizeDocumentExtractionReadiness
} from "../../lib/sources/DocumentExtractionMapper";
import { evaluateIntakeMappingReadiness } from "../../lib/sources/IntakeSourceMapper";
import {
  mapExternalMetadataMatch,
  type ExternalMetadataMatchResult
} from "../../lib/sources/ExternalMetadataMatchMapper";
import {
  mapProviderCandidateComparisons,
  type ProviderCandidateComparisonRow
} from "../../lib/sources/ProviderCandidateComparisonMapper";
import {
  mapProviderEvidenceDetails,
  type ProviderEvidenceDetail
} from "../../lib/sources/ProviderEvidenceDetailMapper";
import {
  getCrossrefFixtureCandidates
} from "../../lib/sources/CrossrefFixtureProvider";
import type {
  CrossrefFixtureCandidateResult
} from "../../lib/sources/CrossrefProviderTypes";
import { getMockExternalMetadataMatchCandidates } from "../../lib/sources/ExternalMetadataMockProvider";
import {
  createKnowledgeVaultSaveReadiness,
  type KnowledgeVaultSaveReadiness
} from "../../lib/sources/KnowledgeVaultSaveReadinessMapper";
import {
  createKnowledgeVaultSaveCandidateMapping,
  type KnowledgeVaultCandidateLocalReviewState,
  type KnowledgeVaultSaveCandidateMapping
} from "../../lib/sources/KnowledgeVaultSaveCandidateMapper";
import { mapParsedDocxToSourceDocumentCandidate } from "../../lib/sources/ParsedDocumentToSourceDocumentCandidateMapper";
import {
  createParsedDocxClassificationPreview,
  type ParsedDocxClassificationPreview
} from "../../lib/sources/ParsedDocxClassificationPreviewMapper";
import {
  createParsedDocxKnowledgeVaultCandidatePreview,
  type ParsedDocxKnowledgeVaultCandidatePreview
} from "../../lib/sources/ParsedDocxKnowledgeVaultCandidateMapper";
import {
  createParsedDocxKnowledgeVaultReviewBasket,
  type ParsedDocxKnowledgeVaultReviewBasketPreview
} from "../../lib/sources/ParsedDocxKnowledgeVaultReviewBasketMapper";
import {
  createParsedDocxTextbookRequestSeedPreview,
  type ParsedDocxTextbookRequestSeedPreview
} from "../../lib/sources/ParsedDocxTextbookRequestSeedMapper";
import { mapRealParserReadiness } from "../../lib/sources/ParserReadinessMapper";
import {
  suggestMarketingTags,
  type MarketingTagReviewStatus
} from "../../lib/sources/MarketingTagSuggestionMapper";
import {
  parseLocalDocxFile,
  type DocumentExtractionResponse
} from "../../lib/sources/LocalDocumentExtraction";
import {
  inspectLocalDocumentFilePath,
  selectLocalDocumentFile,
  selectLocalDocumentFiles,
  type LocalDocumentFileIntakeJob
} from "../../lib/sources/LocalDocumentFilePicker";
import {
  createBatchResearchIntakeJobs,
  createCrossrefFixtureMetadataReviewQueueForIntakeJobs,
  createMockExternalMetadataReviewQueueForIntakeJobs,
  applyMetadataCorrectionToStructuredBibliographicMetadata,
  listBatchResearchIntakeJobs,
  listMetadataCorrectionAuditEvents,
  listSavedSourceDocuments,
  listSuggestedMetadataCorrections,
  runMetadataCorrectionApplyDryRun,
  updateSuggestedMetadataCorrectionReviewState,
  type CreateBatchResearchIntakeJobFile,
  type CreateBatchResearchIntakeJobsResult,
  type CreateMockExternalMetadataReviewQueueResult,
  type SavedBatchResearchIntakeJob,
  type SavedSourceDocumentListItem,
  type SavedMetadataCorrectionAuditEvent,
  type SavedSuggestedMetadataCorrection,
  type MetadataCorrectionApplyDryRunResult,
  type ApplyMetadataCorrectionToStructuredBibliographicMetadataResult,
  type SuggestedMetadataCorrectionReviewDecision
} from "../../lib/persistence/LocalVaultDatabase";
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
import type { LibraryMode } from "../../app/App";

interface SourceLibraryPageProps {
  libraryMode: LibraryMode;
  sourceDocuments: SourceDocument[];
  onLibraryModeChange: (mode: LibraryMode) => void;
  onOpenInspector: () => void;
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
type KnowledgeCardCandidateReviewStatus = SourceDocumentCandidateReviewStatus;
type SourceLibraryWorkflowStage =
  | "input"
  | "classify"
  | "tag_vault"
  | "textbook_request"
  | "draft_review"
  | "docx_export";

interface SourceLibraryWorkflowShellState {
  currentStage: SourceLibraryWorkflowStage;
  nextAction: string;
  selectedSourceLabel: string;
  statusLabel: string;
}

type GuidedActionStatus = "current" | "available" | "done" | "blocked" | "gated" | "planned";

type GuidedActionTarget =
  | "path"
  | "classification"
  | "vault_preview"
  | "review_basket"
  | "vault_save_readiness"
  | "vault_save_mapping"
  | "textbook_seed"
  | "metadata"
  | "parser"
  | "candidate"
  | "records"
  | "context"
  | "secondary";

interface GuidedActionPathItem {
  action: string;
  affordanceLabel?: string;
  detail: string;
  status: GuidedActionStatus;
  target: GuidedActionTarget;
}

type HumanAttentionTone = "action" | "review" | "risk" | "ready";

interface HumanAttentionItem {
  detail: string;
  label: string;
  tone: HumanAttentionTone;
}

interface RealSourceContextState {
  draftArtifactStatus: string;
  knowledgeCardStatus: string;
  metadataReviewState: string;
  sourceCardStatus: string;
  sourceDocumentStatus: string;
}

interface MutableElementRef {
  current: HTMLElement | null;
}

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

export function SourceLibraryPage({
  libraryMode,
  onLibraryModeChange,
  onOpenInspector,
  sourceDocuments
}: SourceLibraryPageProps) {
  return (
    <SourceLibraryFrontstage
      libraryMode={libraryMode}
      sourceDocuments={sourceDocuments}
      onLibraryModeChange={onLibraryModeChange}
      onOpenInspector={onOpenInspector}
    />
  );

  const isQaMode = isSourceLibraryQaModeEnabled();
  const workflowPanelRef = useRef<HTMLDivElement | null>(null);
  const metadataPreviewRef = useRef<HTMLDivElement | null>(null);
  const parserPreviewRef = useRef<HTMLDivElement | null>(null);
  const candidatePreviewRef = useRef<HTMLDivElement | null>(null);
  const contextInspectorRef = useRef<HTMLElement | null>(null);
  const recordsDrawerRef = useRef<HTMLDetailsElement | null>(null);
  const secondaryWorkbenchRef = useRef<HTMLDetailsElement | null>(null);
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
  const [knowledgeCardReviewStatuses, setKnowledgeCardReviewStatuses] = useState<
    Record<string, KnowledgeCardCandidateReviewStatus>
  >({});
  const [marketingTagReviewStatuses, setMarketingTagReviewStatuses] = useState<
    Record<string, MarketingTagReviewStatus>
  >({});
  const [isExtractingDocumentText, setIsExtractingDocumentText] = useState(false);
  const [isSelectingLocalFile, setIsSelectingLocalFile] = useState(false);
  const [localFilePathInput, setLocalFilePathInput] = useState("");
  const [isInspectingLocalPath, setIsInspectingLocalPath] = useState(false);
  const [batchIntakeJobs, setBatchIntakeJobs] = useState<SavedBatchResearchIntakeJob[]>([]);
  const [batchIntakeResult, setBatchIntakeResult] =
    useState<CreateBatchResearchIntakeJobsResult | null>(null);
  const [batchIntakeError, setBatchIntakeError] = useState<string | null>(null);
  const [isCreatingBatchIntake, setIsCreatingBatchIntake] = useState(false);
  const [suggestedCorrections, setSuggestedCorrections] = useState<
    SavedSuggestedMetadataCorrection[]
  >([]);
  const [metadataCorrectionAuditEvents, setMetadataCorrectionAuditEvents] = useState<
    SavedMetadataCorrectionAuditEvent[]
  >([]);
  const [metadataCorrectionDryRunResult, setMetadataCorrectionDryRunResult] =
    useState<MetadataCorrectionApplyDryRunResult | null>(null);
  const [metadataCorrectionDryRunError, setMetadataCorrectionDryRunError] =
    useState<string | null>(null);
  const [metadataCorrectionApplyResult, setMetadataCorrectionApplyResult] =
    useState<ApplyMetadataCorrectionToStructuredBibliographicMetadataResult | null>(
      null
    );
  const [metadataCorrectionApplyError, setMetadataCorrectionApplyError] =
    useState<string | null>(null);
  const [isRunningMetadataCorrectionDryRunId, setIsRunningMetadataCorrectionDryRunId] =
    useState<string | null>(null);
  const [isApplyingMetadataCorrectionId, setIsApplyingMetadataCorrectionId] =
    useState<string | null>(null);
  const [suggestedCorrectionResult, setSuggestedCorrectionResult] =
    useState<CreateMockExternalMetadataReviewQueueResult | null>(null);
  const [suggestedCorrectionError, setSuggestedCorrectionError] = useState<string | null>(
    null
  );
  const [isCreatingSuggestedCorrections, setIsCreatingSuggestedCorrections] =
    useState(false);
  const [isCreatingCrossrefFixtureCorrections, setIsCreatingCrossrefFixtureCorrections] =
    useState(false);
  const [isUpdatingSuggestedCorrectionId, setIsUpdatingSuggestedCorrectionId] =
    useState<string | null>(null);
  const [suggestedCorrectionEditedValues, setSuggestedCorrectionEditedValues] =
    useState<Record<string, string>>({});
  const [suggestedCorrectionNotes, setSuggestedCorrectionNotes] = useState<
    Record<string, string>
  >({});
  const [selectedIntakeId, setSelectedIntakeId] = useState(mockIntakeSources[0]?.id);
  const [selectedExtractionMappingId, setSelectedExtractionMappingId] = useState(
    mockDocumentExtractionMappingResults[0]?.fileIntakeJobId
  );
  const [isSecondaryWorkbenchOpen, setIsSecondaryWorkbenchOpen] = useState(false);
  const [isRecordsDrawerOpen, setIsRecordsDrawerOpen] = useState(false);

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
  const parserReadiness = useMemo(() => mapRealParserReadiness(), []);
  const externalMetadataMatchResults = useMemo(
    () =>
      batchIntakeJobs.map((job) =>
        mapExternalMetadataMatch(job, getMockExternalMetadataMatchCandidates(job))
      ),
    [batchIntakeJobs]
  );
  const crossrefFixtureCandidateResults = useMemo(
    () =>
      batchIntakeJobs.flatMap((job) =>
        getCrossrefFixtureCandidates(job).map((candidate) => ({
          candidate,
          fileName: job.fileName,
          intakeJobId: job.intakeJobId
        }))
      ),
    [batchIntakeJobs]
  );
  const providerCandidateComparisons = useMemo(
    () => mapProviderCandidateComparisons(suggestedCorrections),
    [suggestedCorrections]
  );
  const providerEvidenceDetails = useMemo(
    () => mapProviderEvidenceDetails(suggestedCorrections),
    [suggestedCorrections]
  );

  useEffect(() => {
    let isMounted = true;

    listBatchResearchIntakeJobs()
      .then((jobs) => {
        if (isMounted) {
          setBatchIntakeJobs(jobs);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBatchIntakeJobs([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    listSuggestedMetadataCorrections()
      .then((result) => {
        if (isMounted) {
          setSuggestedCorrections(result.corrections);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSuggestedCorrections([]);
        }
      });
    listMetadataCorrectionAuditEvents()
      .then((result) => {
        if (isMounted) {
          setMetadataCorrectionAuditEvents(result.events);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMetadataCorrectionAuditEvents([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
        setKnowledgeCardReviewStatuses({});
        setMarketingTagReviewStatuses({});
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
        setKnowledgeCardReviewStatuses({});
        setMarketingTagReviewStatuses({});
        return;
      }

      const selectedFile = await inspectLocalDocumentFilePath(localFilePathInput);
      setSelectedLocalFile(selectedFile);
      setDocumentExtractionResult(null);
      setDocumentExtractionError(null);
      setCandidateReviewStatus("needs_review");
      setKnowledgeCardReviewStatuses({});
      setMarketingTagReviewStatuses({});
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

  async function handleCreateBatchResearchIntakeJobs() {
    setIsCreatingBatchIntake(true);
    setBatchIntakeError(null);

    try {
      const selectedFiles = isQaMode
        ? createQaBatchResearchIntakeFiles()
        : await selectLocalDocumentFiles();

      if (selectedFiles.length === 0) {
        setBatchIntakeResult(null);
        setBatchIntakeError("No PDF/DOCX files were selected for the intake queue.");
        return;
      }

      const result = await createBatchResearchIntakeJobs({
        files: selectedFiles.map(localFileToBatchIntakeFile)
      });

      setBatchIntakeResult(result);
      setBatchIntakeJobs(result.jobs);
      const correctionList = await listSuggestedMetadataCorrections();
      setSuggestedCorrections(correctionList.corrections);
      const auditList = await listMetadataCorrectionAuditEvents();
      setMetadataCorrectionAuditEvents(auditList.events);
    } catch (error) {
      setBatchIntakeError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to create batch intake queue records."
      );
    } finally {
      setIsCreatingBatchIntake(false);
    }
  }

  async function handleCreateSuggestedMetadataReviewQueue() {
    setIsCreatingSuggestedCorrections(true);
    setSuggestedCorrectionError(null);
    setMetadataCorrectionApplyResult(null);
    setMetadataCorrectionApplyError(null);

    try {
      const result = await createMockExternalMetadataReviewQueueForIntakeJobs();
      setSuggestedCorrectionResult(result);
      const correctionList = await listSuggestedMetadataCorrections();
      setSuggestedCorrections(correctionList.corrections);
      const auditList = await listMetadataCorrectionAuditEvents();
      setMetadataCorrectionAuditEvents(auditList.events);
    } catch (error) {
      setSuggestedCorrectionError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to generate suggested correction review queue."
      );
    } finally {
      setIsCreatingSuggestedCorrections(false);
    }
  }

  async function handleCreateCrossrefFixtureReviewQueue() {
    setIsCreatingCrossrefFixtureCorrections(true);
    setSuggestedCorrectionError(null);
    setMetadataCorrectionApplyResult(null);
    setMetadataCorrectionApplyError(null);

    try {
      const result = await createCrossrefFixtureMetadataReviewQueueForIntakeJobs();
      setSuggestedCorrectionResult(result);
      const correctionList = await listSuggestedMetadataCorrections();
      setSuggestedCorrections(correctionList.corrections);
      const auditList = await listMetadataCorrectionAuditEvents();
      setMetadataCorrectionAuditEvents(auditList.events);
    } catch (error) {
      setSuggestedCorrectionError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to generate Crossref fixture review queue."
      );
    } finally {
      setIsCreatingCrossrefFixtureCorrections(false);
    }
  }

  async function handleSuggestedCorrectionReviewDecision(
    correction: SavedSuggestedMetadataCorrection,
    reviewDecision: SuggestedMetadataCorrectionReviewDecision
  ) {
    setIsUpdatingSuggestedCorrectionId(correction.correctionId);
    setSuggestedCorrectionError(null);
    setMetadataCorrectionApplyResult(null);
    setMetadataCorrectionApplyError(null);

    try {
      const result = await updateSuggestedMetadataCorrectionReviewState({
        correctionId: correction.correctionId,
        reviewerEditedValue:
          reviewDecision === "edited_before_approval"
            ? suggestedCorrectionEditedValues[correction.correctionId] ?? ""
            : null,
        reviewerNote: suggestedCorrectionNotes[correction.correctionId] ?? null,
        reviewDecision
      });

      if (!result.saved && result.blockers.length > 0) {
        setSuggestedCorrectionError(result.blockers.join(" "));
      }

      const correctionList = await listSuggestedMetadataCorrections();
      setSuggestedCorrections(correctionList.corrections);
      const auditList = await listMetadataCorrectionAuditEvents();
      setMetadataCorrectionAuditEvents(auditList.events);
    } catch (error) {
      setSuggestedCorrectionError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to update suggested correction review state."
      );
    } finally {
      setIsUpdatingSuggestedCorrectionId(null);
    }
  }

  async function handleRunMetadataCorrectionApplyDryRun(
    correction: SavedSuggestedMetadataCorrection
  ) {
    setIsRunningMetadataCorrectionDryRunId(correction.correctionId);
    setMetadataCorrectionDryRunError(null);
    setMetadataCorrectionApplyResult(null);
    setMetadataCorrectionApplyError(null);

    try {
      const result = await runMetadataCorrectionApplyDryRun({
        correctionId: correction.correctionId,
        writeAuditEvent: true
      });
      setMetadataCorrectionDryRunResult(result);
      const auditList = await listMetadataCorrectionAuditEvents();
      setMetadataCorrectionAuditEvents(auditList.events);
    } catch (error) {
      setMetadataCorrectionDryRunError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to run metadata correction apply dry-run."
      );
    } finally {
      setIsRunningMetadataCorrectionDryRunId(null);
    }
  }

  async function handleApplyMetadataCorrectionToStructuredMetadata(
    dryRun: MetadataCorrectionApplyDryRunResult
  ) {
    setIsApplyingMetadataCorrectionId(dryRun.correctionId);
    setMetadataCorrectionApplyError(null);

    try {
      const result =
        await applyMetadataCorrectionToStructuredBibliographicMetadata({
          correctionId: dryRun.correctionId,
          reviewerConfirmedApply: true
        });
      setMetadataCorrectionApplyResult(result);
      const correctionList = await listSuggestedMetadataCorrections();
      setSuggestedCorrections(correctionList.corrections);
      const auditList = await listMetadataCorrectionAuditEvents();
      setMetadataCorrectionAuditEvents(auditList.events);
      if (result.applyStatus === "blocked" && result.blockers.length > 0) {
        setMetadataCorrectionApplyError(result.blockers.join(" "));
      }
    } catch (error) {
      setMetadataCorrectionApplyError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to apply structured metadata correction."
      );
    } finally {
      setIsApplyingMetadataCorrectionId(null);
    }
  }

  async function handleExtractDocumentText() {
    if (!selectedLocalFile) {
      return;
    }

    if (selectedLocalFile.fileType !== "DOCX") {
      setDocumentExtractionResult(null);
      setDocumentExtractionError("PDF extraction is not implemented yet.");
      setKnowledgeCardReviewStatuses({});
      setMarketingTagReviewStatuses({});
      return;
    }

    setIsExtractingDocumentText(true);
    setDocumentExtractionError(null);

    try {
      if (isQaMode && selectedLocalFile.id === qaDocxLocalFile.id) {
        setDocumentExtractionResult(qaDocxExtractionResponse);
        setCandidateReviewStatus("needs_review");
        setKnowledgeCardReviewStatuses({});
        setMarketingTagReviewStatuses({});
        return;
      }

      const extractionResponse = await parseLocalDocxFile({
        fileIntakeJobId: selectedLocalFile.id,
        fileType: selectedLocalFile.fileType,
        localPath: selectedLocalFile.localPath
      });
      setDocumentExtractionResult(extractionResponse);
      setCandidateReviewStatus("needs_review");
      setKnowledgeCardReviewStatuses({});
      setMarketingTagReviewStatuses({});
    } catch (error) {
      setDocumentExtractionResult(null);
      setKnowledgeCardReviewStatuses({});
      setMarketingTagReviewStatuses({});
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

  function revealGuidedActionTarget(target: GuidedActionTarget) {
    const revealElement = (element: HTMLElement | null) => {
      element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      element?.focus?.({ preventScroll: true });
    };

    if (target === "metadata" || target === "parser") {
      revealElement(metadataPreviewRef.current);
      return;
    }

    if (target === "classification") {
      revealElement(workflowPanelRef.current);
      return;
    }

    if (target === "vault_preview") {
      revealElement(workflowPanelRef.current);
      return;
    }

    if (target === "review_basket") {
      revealElement(workflowPanelRef.current);
      return;
    }

    if (target === "vault_save_readiness") {
      revealElement(workflowPanelRef.current);
      return;
    }

    if (target === "vault_save_mapping") {
      revealElement(workflowPanelRef.current);
      return;
    }

    if (target === "textbook_seed") {
      revealElement(workflowPanelRef.current);
      return;
    }

    if (target === "candidate") {
      revealElement(candidatePreviewRef.current ?? parserPreviewRef.current);
      return;
    }

    if (target === "records") {
      setIsRecordsDrawerOpen(true);
      requestAnimationFrame(() => revealElement(recordsDrawerRef.current));
      return;
    }

    if (target === "secondary") {
      setIsSecondaryWorkbenchOpen(true);
      requestAnimationFrame(() => revealElement(secondaryWorkbenchRef.current));
      return;
    }

    if (target === "context") {
      revealElement(contextInspectorRef.current);
    }
  }

  const workflowShellState = createSourceLibraryWorkflowShellState({
    candidateReviewStatus,
    documentExtractionResult,
    selectedLocalFile
  });

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-2 overflow-hidden"
      data-testid="source-library-page"
    >
      <SourceLibraryWorkflowBar state={workflowShellState} />

      <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)_300px] gap-2 overflow-hidden">
      <section className="pixel-panel flex min-h-0 flex-col overflow-hidden p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="panel-label">Library</p>
            <h2 className="mt-1 text-xl font-black text-white">Source Intake Desk</h2>
          </div>
          <span className="status-pill">Real DOCX path</span>
        </div>

        <div
          className="mt-3 border-2 border-studio-teal bg-studio-teal/10 p-3 shadow-pixel"
          data-testid="source-library-left-intake-start"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center border-2 border-studio-teal bg-studio-ink text-studio-teal shadow-pixel">
              <FileText size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-studio-teal">
                Current start action
              </p>
              <h3 className="mt-1 text-base font-black text-white">
                Paste local DOCX path
              </h3>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-300">
                This is the active Sprint 0 path: preview file metadata, parse DOCX,
                review extracted segments, then use explicit save controls.
              </p>
            </div>
          </div>

          <ol className="mt-3 grid gap-1.5 text-xs font-black uppercase text-slate-200">
            {[
              "Step 1: Paste DOCX path",
              "Step 2: Preview metadata",
              "Step 3: Parse DOCX",
              "Step 4: Save SourceDocument"
            ].map((step, index) => (
              <li
                className={`border-2 px-2 py-1.5 ${
                  index === 0
                    ? "border-studio-gold bg-studio-gold/15 text-studio-gold"
                    : "border-studio-line bg-studio-ink/70"
                }`}
                key={step}
              >
                {step}
              </li>
            ))}
          </ol>

          <div className="mt-3 grid gap-1.5 text-[11px] font-bold uppercase leading-5 text-slate-300">
            <p>
              PDF is metadata-only/queued; no PDF text parsing here.
            </p>
            <p>
              .doc is unsupported. Convert to .docx or PDF first.
            </p>
          </div>
        </div>

        <StudioWorkflowNavigation currentStage={workflowShellState.currentStage} />

        <SourceLibraryIncomingPackagePreview />

        <button
          className="mt-3 flex w-full items-center justify-center gap-2 border-2 border-studio-line bg-studio-ink/60 px-3 py-2 text-xs font-black uppercase text-slate-500 shadow-pixel disabled:opacity-60"
          disabled
          onClick={handleSelectLocalDocumentFile}
          type="button"
        >
          <UploadCloud size={16} />
          Drag/drop and file picker disabled
        </button>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Native browsing stays secondary while the usable path is local DOCX path
          entry.
        </p>

        <div
          className="mt-3 border-2 border-studio-line bg-studio-ink/70 p-3"
          ref={metadataPreviewRef}
          tabIndex={-1}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-studio-blue">
                Current usable path: Paste Local File Path
              </p>
              <p className="mt-1 text-xs font-black uppercase text-studio-gold">
                DOCX can parse locally. PDF remains queue/metadata only.
              </p>
            </div>
            <span className="status-pill">Input stage</span>
          </div>
          <label className="mt-3 block text-xs font-black uppercase text-slate-400">
            Local file path
            <input
              className="mt-1 w-full border-2 border-studio-line bg-studio-panel px-3 py-2 text-sm font-bold normal-case text-white"
              data-testid="local-path-input"
              onChange={(event) => setLocalFilePathInput(event.target.value)}
              placeholder="/Users/bhuminan/Documents/source.docx"
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

        <details
          className="mt-auto min-h-0 border border-studio-line bg-studio-ink/45 p-2 text-xs"
          data-testid="source-library-secondary-debug-area"
          onToggle={(event) => setIsSecondaryWorkbenchOpen(event.currentTarget.open)}
          open={isSecondaryWorkbenchOpen}
          ref={secondaryWorkbenchRef}
        >
          <summary className="cursor-pointer font-black uppercase text-slate-400">
            Secondary workbench: collapsed support tools
          </summary>
          <p
            className="mt-2 font-bold uppercase leading-5 text-slate-400"
            data-testid="source-library-secondary-workbench-boundary"
          >
            Mock/demo, provider evidence, queue, audit, and debug previews stay
            reachable here. They are secondary to the parsed-DOCX action path.
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {["mock", "preview-only", "fixture-only", "no-network", "evidence-only"].map(
              (label) => (
                <span className="mock-badge" key={label}>
                  {label}
                </span>
              )
            )}
          </div>

          <div className="mt-3 max-h-[calc(100vh-500px)] overflow-y-auto pr-1">
            <BatchResearchIntakeQueuePanel
              error={batchIntakeError}
              isCreating={isCreatingBatchIntake}
              jobs={batchIntakeJobs}
              onCreateQueueJobs={handleCreateBatchResearchIntakeJobs}
              result={batchIntakeResult}
            />

            <ExternalMetadataMatchPreviewPanel results={externalMetadataMatchResults} />

            <CrossrefFixtureCandidatePreviewPanel results={crossrefFixtureCandidateResults} />

            <SuggestedCorrectionsReviewQueuePanel
              applyError={metadataCorrectionApplyError}
              applyResult={metadataCorrectionApplyResult}
              auditEvents={metadataCorrectionAuditEvents}
              dryRunError={metadataCorrectionDryRunError}
              dryRunResult={metadataCorrectionDryRunResult}
              editedValues={suggestedCorrectionEditedValues}
              error={suggestedCorrectionError}
              isCreating={isCreatingSuggestedCorrections}
              isCreatingCrossrefFixture={isCreatingCrossrefFixtureCorrections}
              isApplyingCorrectionId={isApplyingMetadataCorrectionId}
              isRunningDryRunId={isRunningMetadataCorrectionDryRunId}
              isUpdatingCorrectionId={isUpdatingSuggestedCorrectionId}
              notes={suggestedCorrectionNotes}
              onApplyStructuredMetadata={
                handleApplyMetadataCorrectionToStructuredMetadata
              }
              onCreateReviewQueue={handleCreateSuggestedMetadataReviewQueue}
              onCreateCrossrefFixtureReviewQueue={handleCreateCrossrefFixtureReviewQueue}
              onEditedValueChange={(correctionId, value) =>
                setSuggestedCorrectionEditedValues((currentValues) => ({
                  ...currentValues,
                  [correctionId]: value
                }))
              }
              onNoteChange={(correctionId, value) =>
                setSuggestedCorrectionNotes((currentNotes) => ({
                  ...currentNotes,
                  [correctionId]: value
                }))
              }
              onReviewDecision={handleSuggestedCorrectionReviewDecision}
              onRunDryRun={handleRunMetadataCorrectionApplyDryRun}
              result={suggestedCorrectionResult}
              providerCandidateComparisons={providerCandidateComparisons}
              providerEvidenceDetails={providerEvidenceDetails}
              suggestedCorrections={suggestedCorrections}
            />

          <div className="mt-4 border-t-2 border-studio-line pt-4">
            <p className="text-sm font-black uppercase text-studio-blue">
              Intake Rules
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              <li>DOCX is the active parse path; PDF is metadata-only/queued.</li>
              <li>Legacy .doc files must be converted to .docx or PDF.</li>
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

          <RealParserReadinessPanel readiness={parserReadiness} />

            <ManualSourceCardForm onAddSourceCard={addManualSourceCard} />
          </div>
        </details>
      </section>

      <section className="pixel-panel flex min-h-0 flex-col overflow-hidden p-3">
        <div ref={workflowPanelRef} tabIndex={-1}>
          <ActiveSourceWorkflowPanel
            candidateReviewStatus={candidateReviewStatus}
            extractionResult={documentExtractionResult}
            onRevealActionTarget={revealGuidedActionTarget}
            selectedFile={selectedLocalFile}
            state={workflowShellState}
          />
        </div>

        <div ref={parserPreviewRef} tabIndex={-1}>
          <LocalDocumentExtractionPreview extractionResult={documentExtractionResult} />
        </div>
        <div ref={candidatePreviewRef} tabIndex={-1}>
          <SourceDocumentCandidatePreview
            extractionResult={documentExtractionResult}
            knowledgeCardReviewStatuses={knowledgeCardReviewStatuses}
            marketingTagReviewStatuses={marketingTagReviewStatuses}
            onReviewStatusChange={setCandidateReviewStatus}
            onKnowledgeCardReviewStatusChange={(candidateId, status) =>
              setKnowledgeCardReviewStatuses((currentStatuses) => ({
                ...currentStatuses,
                [candidateId]: status
              }))
            }
            onMarketingTagReviewStatusChange={(termId, status) =>
              setMarketingTagReviewStatuses((currentStatuses) => ({
                ...currentStatuses,
                [termId]: status
              }))
            }
            reviewStatus={candidateReviewStatus}
          />
        </div>

        <details
          className="min-h-0 overflow-hidden border border-studio-line bg-studio-ink/45 p-2"
          data-testid="source-library-context-records"
          onToggle={(event) => setIsRecordsDrawerOpen(event.currentTarget.open)}
          open={isRecordsDrawerOpen}
          ref={recordsDrawerRef}
        >
          <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs font-black uppercase text-slate-400">
            <span>Secondary saved/mock source records</span>
            <span className="mock-badge">{sourceDocuments.length} mock records</span>
          </summary>

          <p className="mt-2 text-xs font-bold uppercase leading-5 text-slate-400">
            Sample records remain available for comparison, but the parsed-DOCX action
            path above is the primary workflow.
          </p>

          <div className="mt-3 max-h-52 overflow-y-auto pr-1">
            <div className="grid gap-3">
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
          </div>
        </details>
      </section>

      <SourceDetailPanel
        hasRealParsedDocxSource={Boolean(documentExtractionResult)}
        realContextState={createRealSourceContextState({
          candidateReviewStatus,
          documentExtractionResult
        })}
        onPatchSourceCard={updateSourceCard}
        onResetSourceCard={resetSourceCard}
        rootRef={contextInspectorRef}
        source={selectedSourceForCard}
        sourceCard={selectedSourceCard}
        selectedIntake={selectedIntake}
        validation={selectedSourceValidation}
      />
      </div>
    </div>
  );
}

function SourceLibraryFrontstage({
  libraryMode,
  onLibraryModeChange,
  onOpenInspector
}: SourceLibraryPageProps) {
  const [savedSources, setSavedSources] = useState<SavedSourceDocumentListItem[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "fallback">(
    "loading"
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [localFilePathInput, setLocalFilePathInput] = useState("");
  const [previewFile, setPreviewFile] = useState<LocalDocumentFileIntakeJob | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listSavedSourceDocuments()
      .then((sources) => {
        if (!isMounted) {
          return;
        }
        setSavedSources(sources);
        setLoadStatus("ready");
        setSelectedSourceId((currentId) => currentId ?? sources[0]?.sourceDocumentId ?? null);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setSavedSources([]);
        setLoadStatus("fallback");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSource =
    savedSources.find((source) => source.sourceDocumentId === selectedSourceId) ??
    savedSources[0] ??
    null;
  const reviewCount = savedSources.filter((source) =>
    `${source.metadataStatus} ${source.reviewStatus}`.toLowerCase().includes("review")
  ).length;
  const previewStatus =
    previewFile?.fileType === "PDF" || previewFile?.fileType === "DOCX"
      ? "SUPPORTED"
      : previewFile
        ? "BLOCKED"
        : null;

  async function handlePreviewLocalPath() {
    setIsPreviewing(true);
    setPreviewError(null);
    setPreviewFile(null);

    try {
      const file = await inspectLocalDocumentFilePath(localFilePathInput);
      setPreviewFile(file);
    } catch (error) {
      setPreviewError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to preview this file path."
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  return (
    <section className="source-library-frontstage" data-testid="source-library-page">
      {libraryMode === "saved" ? (
        <div
          className="source-library-saved-grid"
          data-testid="source-library-saved-sources-workspace"
        >
          <aside className="win-panel source-list-panel">
            <div className="source-list-header">
              <span className="text-label">{savedSources.length} SAVED</span>
              <span className="text-meta">
                {loadStatus === "fallback" ? "unavailable" : `${reviewCount} review`}
              </span>
            </div>
            <div className="source-list-inner" data-testid="source-list">
              {savedSources.length === 0 ? (
                <div className="source-list-empty">
                  <p className="text-body">No sources saved yet.</p>
                  <button
                    className="win-btn"
                    onClick={() => onLibraryModeChange("add")}
                    type="button"
                  >
                    Add your first source →
                  </button>
                </div>
              ) : (
                savedSources.map((source) => {
                  const isSelected = source.sourceDocumentId === selectedSource?.sourceDocumentId;
                  return (
                    <button
                      className={`source-list-row ${isSelected ? "source-list-row-active" : ""}`}
                      data-testid="saved-source-row"
                      key={source.sourceDocumentId}
                      onClick={() => setSelectedSourceId(source.sourceDocumentId)}
                      type="button"
                    >
                      <span className={`trust-dot trust-dot-${sourceTone(source)}`} />
                      <span className="source-list-name text-source-name">{source.title}</span>
                      <span className="source-list-type text-meta">{source.fileType}</span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section
            className="win-panel source-detail-panel"
            data-testid="source-library-selected-source-review"
          >
            {selectedSource ? (
              <>
                <p className="text-label">Selected Source</p>
                <h1 className="text-detail-title">{selectedSource.title}</h1>
                <p className="text-meta">
                  READ-BACK VERIFIED · SOURCECARD NOT CREATED · CITATION NOT VERIFIED
                </p>
                <div className="source-detail-summary">
                  <span className={`trust-badge trust-badge-${sourceTone(selectedSource)}`}>
                    {sourceTrustLabel(selectedSource)}
                  </span>
                  <span className="text-meta">{selectedSource.fileName}</span>
                  <span className="text-meta">{selectedSource.fileType}</span>
                </div>
                <button className="win-btn win-btn-primary" type="button">
                  {sourcePrimaryAction(selectedSource)}
                </button>
                <button className="win-btn" onClick={onOpenInspector} type="button">
                  View audit details →
                </button>
              </>
            ) : (
              <p className="text-body">Select a source from the list.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="source-library-add-grid" data-testid="source-library-add-workspace">
          <section className="win-panel add-source-main">
            <div className="win-inset source-drop-zone" data-testid="source-add-drop-zone">
              <div className="source-drop-icon" aria-hidden="true">
                📂
              </div>
              <h1 className="text-detail-title">Drop PDF or DOCX files here</h1>
              <p className="text-body">or paste a local file path below</p>
              <input
                className="win-input source-path-input"
                data-testid="local-path-input"
                onChange={(event) => setLocalFilePathInput(event.target.value)}
                placeholder="/Users/apple/Documents/source.docx"
                value={localFilePathInput}
              />
              <button
                className="win-btn win-btn-primary"
                disabled={isPreviewing || localFilePathInput.trim().length === 0}
                onClick={handlePreviewLocalPath}
                type="button"
              >
                {isPreviewing ? "Previewing..." : "Preview & queue"}
              </button>
              {previewError ? <p className="text-small source-error">{previewError}</p> : null}
              {previewFile ? (
                <div className="win-inset queue-preview" data-testid="source-queue-preview">
                  <span className={`trust-badge trust-badge-${previewStatus === "SUPPORTED" ? "green" : "red"}`}>
                    {previewStatus}
                  </span>
                  <span className="text-body">{previewFile.fileName}</span>
                  <span className="text-meta">{previewFile.fileType ?? "Unsupported"}</span>
                </div>
              ) : null}
            </div>

            <section className="win-panel next-steps-panel" data-testid="what-happens-next">
              <p className="text-label">What happens next</p>
              <ol className="text-body next-steps-list">
                <li>Preview file details - no parser runs, no AI</li>
                <li>Confirm save - SourceDocument only, human approval required</li>
                <li>Receipt shown · SourceCard deferred · Citation review is separate</li>
              </ol>
            </section>

            {previewStatus === "SUPPORTED" ? (
              <button className="win-btn win-btn-primary source-save-button" type="button">
                Save to Library
              </button>
            ) : null}
          </section>

          <aside className="win-panel supported-formats" data-testid="supported-formats">
            <p className="text-label">Supported formats</p>
            <ul className="text-body">
              <li>PDF</li>
              <li>DOCX</li>
              <li>Markdown</li>
            </ul>
          </aside>
        </div>
      )}
    </section>
  );
}

function sourceTone(source: SavedSourceDocumentListItem): "green" | "orange" | "red" {
  const combined = `${source.metadataStatus} ${source.parserStatus} ${source.reviewStatus}`.toLowerCase();

  if (combined.includes("failed") || combined.includes("blocked")) {
    return "red";
  }

  if (combined.includes("needs_review") || combined.includes("review")) {
    return "orange";
  }

  return "green";
}

function sourceTrustLabel(source: SavedSourceDocumentListItem): string {
  const tone = sourceTone(source);
  if (tone === "red") {
    return "Blocked";
  }
  if (tone === "orange") {
    return "Needs review";
  }
  return "Saved";
}

function sourcePrimaryAction(source: SavedSourceDocumentListItem): string {
  const tone = sourceTone(source);
  if (tone === "red") {
    return "Inspect blockers →";
  }
  if (tone === "orange") {
    return "Review metadata →";
  }
  return "View details";
}

const workflowStages: Array<{
  key: SourceLibraryWorkflowStage;
  label: string;
  room: string;
}> = [
  { key: "input", label: "Input", room: "Intake Desk" },
  { key: "classify", label: "Classify", room: "Classifier Room" },
  { key: "tag_vault", label: "Tag Vault", room: "Knowledge Vault" },
  { key: "textbook_request", label: "Textbook Request", room: "Writing Studio" },
  { key: "draft_review", label: "Draft/Review", room: "Citation Guard" },
  { key: "docx_export", label: "DOCX Export", room: "Export Station" }
];

function SourceLibraryWorkflowBar({
  state
}: {
  state: SourceLibraryWorkflowShellState;
}) {
  return (
    <section
      className="pixel-panel shrink-0 p-2"
      data-testid="source-library-workflow-bar"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="panel-label">ATP Production Flow</p>
          <h2 className="mt-1 text-base font-black text-white">
            Input - Classify - Tag Vault - Textbook Request - Draft/Review - DOCX Export
          </h2>
        </div>
        <div className="min-w-56 border-2 border-studio-gold bg-studio-gold/10 p-1.5">
          <p className="text-xs font-black uppercase text-studio-gold">Next action</p>
          <p
            className="mt-1 text-sm font-black leading-5 text-white"
            data-testid="source-library-next-action"
          >
            {state.nextAction}
          </p>
        </div>
      </div>

      <div
        className="mt-2 grid gap-1.5 text-xs font-black uppercase md:grid-cols-6"
        data-testid="source-library-main-flow"
      >
        {workflowStages.map((stage) => {
          const isCurrent = state.currentStage === stage.key;
          const stageState = getWorkflowStageState(stage.key, state.currentStage);

          return (
            <div
              className={`border-2 p-1.5 ${
                isCurrent
                  ? "border-studio-gold bg-studio-gold/20 text-studio-gold"
                  : "border-studio-line bg-studio-ink/70 text-slate-300"
              }`}
              data-testid={`source-library-stage-${stage.key}`}
              key={stage.key}
            >
              <p className="text-white">{stage.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{stage.room}</p>
              <p className="mt-0.5 text-[11px] text-studio-blue">{stageState}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StudioWorkflowNavigation({
  currentStage
}: {
  currentStage: SourceLibraryWorkflowStage;
}) {
  return (
    <nav
      className="mt-3 border-2 border-studio-line bg-studio-panel/70 p-2"
      data-testid="source-library-studio-navigation"
    >
      <p className="text-xs font-black uppercase text-studio-blue">
        8-bit Studio Navigation
      </p>
      <div className="mt-2 grid gap-1.5">
        {workflowStages.map((stage) => {
          const isCurrent = currentStage === stage.key;

          return (
            <div
              className={`flex items-center gap-2 border px-2 py-1.5 text-xs font-black uppercase ${
                isCurrent
                  ? "border-studio-gold bg-studio-gold/15 text-studio-gold"
                  : "border-studio-line bg-studio-ink/60 text-slate-300"
              }`}
              key={stage.key}
            >
              <span className="h-3 w-3 shrink-0 border border-studio-line bg-studio-teal shadow-pixel" />
              <span>{stage.room}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function ActiveSourceWorkflowPanel({
  candidateReviewStatus,
  extractionResult,
  onRevealActionTarget,
  selectedFile,
  state
}: {
  candidateReviewStatus: SourceDocumentCandidateReviewStatus;
  extractionResult: DocumentExtractionResponse | null;
  onRevealActionTarget: (target: GuidedActionTarget) => void;
  selectedFile: LocalDocumentFileIntakeJob | null;
  state: SourceLibraryWorkflowShellState;
}) {
  const [vaultCandidateReviewStates, setVaultCandidateReviewStates] = useState<
    Record<string, KnowledgeVaultCandidateLocalReviewState>
  >({});
  const hasParsedDocx = Boolean(extractionResult);
  const classificationPreview = createParsedDocxClassificationPreview({
    extractionResponse: extractionResult,
    selectedLocalFile: selectedFile
  });
  const vaultCandidatePreview = createParsedDocxKnowledgeVaultCandidatePreview({
    classificationPreview,
    hasParsedDocx
  });
  const reviewBasketPreview = createParsedDocxKnowledgeVaultReviewBasket({
    candidatePreview: vaultCandidatePreview
  });
  const textbookRequestSeedPreview = createParsedDocxTextbookRequestSeedPreview({
    classificationPreview,
    reviewBasket: reviewBasketPreview
  });
  const vaultSaveReadiness = createKnowledgeVaultSaveReadiness({
    candidatePreview: vaultCandidatePreview,
    hasParsedDocx,
    hasSavedSourceCard: false,
    hasSavedSourceDocument: false,
    reviewBasket: reviewBasketPreview,
    textbookSeed: textbookRequestSeedPreview
  });
  const saveCandidateMappingPreview = createKnowledgeVaultSaveCandidateMapping({
    candidatePreview: vaultCandidatePreview,
    hasSavedSourceCard: false,
    hasSavedSourceDocument: false,
    reviewStates: vaultCandidateReviewStates,
    saveReadiness: vaultSaveReadiness
  });

  useEffect(() => {
    setVaultCandidateReviewStates({});
  }, [extractionResult, selectedFile?.id]);

  function updateVaultCandidateReviewState(
    candidateId: string,
    reviewState: KnowledgeVaultCandidateLocalReviewState
  ) {
    setVaultCandidateReviewStates((current) => ({
      ...current,
      [candidateId]: reviewState
    }));
  }

  const guidedActionPath = createGuidedActionPathItems({
    candidateReviewStatus,
    classificationPreview,
    extractionResult,
    reviewBasketPreview,
    selectedFile,
    saveCandidateMappingPreview,
    textbookRequestSeedPreview,
    vaultSaveReadiness,
    vaultCandidatePreview
  });
  const currentAction =
    guidedActionPath.find((item) => item.status === "current") ??
    guidedActionPath.find((item) => item.status === "available") ??
    guidedActionPath[0];
  const attentionItems = createHumanAttentionItems({
    classificationPreview,
    currentAction,
    extractionResult,
    reviewBasketPreview,
    selectedFile,
    saveCandidateMappingPreview,
    textbookRequestSeedPreview,
    vaultSaveReadiness,
    vaultCandidatePreview
  });
  const guardrails = [
    "Explicit save required",
    "DOCX pages untrusted",
    "Use chunk references",
    "APA preview internal-use only",
    "No APA-final verification",
    "citationText not overwritten",
    "Classification preview only",
    "Vault candidates not saved",
    "Review basket not saved",
    "Textbook seed is not a draft",
    "No auto-save",
    "Human review required",
    "No AI used",
    "No citation finality",
    "DraftArtifact mock/not-final",
    "Export gated",
    "External metadata evidence is not truth"
  ];

  return (
    <section
      className="mb-3 shrink-0 border-2 border-studio-teal bg-studio-teal/10 p-3"
      data-testid="source-library-active-work-area"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="panel-label">Center Active Work Area</p>
          <h3 className="mt-1 text-lg font-black text-white">
            Input / Parsed-DOCX Workflow
          </h3>
        </div>
        <span className="status-pill">{state.statusLabel}</span>
      </div>

      <div
        className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black uppercase"
        data-testid="source-library-guided-action-path"
      >
        {guidedActionPath.map((item, index) => (
          <span
            className={`border px-1.5 py-1 ${getGuidedActionClassName(item.status)}`}
            key={item.action}
          >
            {index + 1}. {item.action}: {item.status}
          </span>
        ))}
      </div>

      <HumanAttentionSummary
        items={attentionItems}
        onRevealActionTarget={onRevealActionTarget}
        primaryAction={currentAction}
        saveCandidateMapping={saveCandidateMappingPreview}
        saveReadiness={vaultSaveReadiness}
      />

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <details
            className="border border-studio-line bg-studio-ink/50 p-2"
            data-testid="source-library-guided-action-path-detail"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs font-black uppercase text-studio-teal">
              <span>View full guided action path</span>
              <span className="mock-badge">{guidedActionPath.length} steps</span>
            </summary>
            <ol className="mt-2 grid gap-1.5 text-xs font-bold leading-5 text-slate-200 xl:grid-cols-2">
              {guidedActionPath.map((item, index) => (
                <li
                  className={`border-l-4 px-2 py-1.5 ${getGuidedActionClassName(item.status)}`}
                  key={item.action}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-black uppercase">
                      {index + 1}. {item.action}
                    </span>
                    <span className="shrink-0 text-[10px] font-black uppercase">
                      {item.status}
                    </span>
                  </div>
                  <span className="mt-0.5 block text-[11px] normal-case text-slate-300">
                    {item.detail}
                  </span>
                  {isGuidedActionAffordanceVisible(item.status) && item.affordanceLabel ? (
                    <button
                      className={`mt-1.5 border px-2 py-1 text-[10px] font-black uppercase shadow-pixel ${
                        item.status === "current"
                          ? "border-studio-gold bg-studio-gold/20 text-studio-gold"
                          : "border-studio-teal bg-studio-teal/15 text-studio-teal"
                      }`}
                      data-testid="source-library-guided-action-affordance"
                      onClick={() => onRevealActionTarget(item.target)}
                      type="button"
                    >
                      {item.affordanceLabel}
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
          </details>

          <p className="mt-2 text-xs font-black uppercase text-studio-gold">
            Current available action: {currentAction.action}
          </p>
          {currentAction.affordanceLabel ? (
            <button
              className="mt-2 border-2 border-studio-gold bg-studio-gold/15 px-3 py-2 text-xs font-black uppercase text-studio-gold shadow-pixel"
              data-testid="source-library-current-action-control"
              onClick={() => onRevealActionTarget(currentAction.target)}
              type="button"
            >
              {currentAction.affordanceLabel}
            </button>
          ) : null}
          <ol
            className="sr-only"
            data-testid="source-library-docx-workflow-path"
          >
            {guidedActionPath.map((item, index) => (
              <li key={item.action}>
                {index + 1}. {item.action} - {item.status}. {item.detail}
              </li>
            ))}
          </ol>
        </div>

        <div className="border-2 border-studio-line bg-studio-ink/70 p-2">
          <p className="text-xs font-black uppercase text-studio-gold">
            Current state
          </p>
          <dl className="mt-2 grid gap-1.5 text-xs">
            <Detail label="Active source" value={state.selectedSourceLabel} />
            <Detail label="Current stage" value={state.currentStage.replace(/_/g, " ")} />
            <Detail label="DOCX parsed" value={hasParsedDocx ? "yes" : "no"} />
            <Detail label="Candidate review" value={candidateReviewLabels[candidateReviewStatus]} />
            <Detail
              label="Selected file"
              value={selectedFile?.fileName ?? "No local source selected yet"}
            />
          </dl>
        </div>
      </div>

      <ClassificationTagPreviewPanel preview={classificationPreview} />
      <KnowledgeVaultCandidatePreviewPanel
        onReviewStateChange={updateVaultCandidateReviewState}
        preview={vaultCandidatePreview}
        reviewStates={vaultCandidateReviewStates}
      />
      <KnowledgeVaultReviewBasketPanel preview={reviewBasketPreview} />
      <SaveCandidateMappingPreviewPanel preview={saveCandidateMappingPreview} />
      <TextbookRequestSeedPreviewPanel preview={textbookRequestSeedPreview} />

      <div className="mt-3 flex flex-wrap gap-1.5" data-testid="source-library-guardrail-chips">
        {guardrails.map((guardrail) => (
          <span
            className="border border-studio-gold bg-studio-gold/10 px-2 py-1 text-[11px] font-black uppercase leading-4 text-studio-gold"
            key={guardrail}
          >
            {guardrail}
          </span>
        ))}
      </div>
    </section>
  );
}

function HumanAttentionSummary({
  items,
  onRevealActionTarget,
  primaryAction,
  saveCandidateMapping,
  saveReadiness
}: {
  items: HumanAttentionItem[];
  onRevealActionTarget: (target: GuidedActionTarget) => void;
  primaryAction: GuidedActionPathItem;
  saveCandidateMapping: KnowledgeVaultSaveCandidateMapping;
  saveReadiness: KnowledgeVaultSaveReadiness;
}) {
  return (
    <section
      className="mt-3 border-2 border-studio-gold bg-studio-gold/10 p-3"
      data-testid="source-library-attention-summary"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-gold">
            Needs Your Attention
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-300">
            Only the current decision points are shown here. Detailed previews stay
            available below.
          </p>
        </div>
        <button
          className="border-2 border-studio-gold bg-studio-gold/15 px-3 py-2 text-xs font-black uppercase text-studio-gold shadow-pixel"
          data-testid="source-library-attention-primary-action"
          onClick={() => onRevealActionTarget(primaryAction.target)}
          type="button"
        >
          {primaryAction.affordanceLabel ?? primaryAction.action}
        </button>
      </div>

      <div
        className="mt-3 grid gap-2 md:grid-cols-2"
        data-testid="source-library-attention-items"
      >
        {items.map((item) => (
          <article
            className={`border-l-4 bg-studio-ink/70 p-2 text-xs ${getAttentionToneClassName(item.tone)}`}
            key={item.label}
          >
            <p className="font-black uppercase text-white">{item.label}</p>
            <p className="mt-1 font-bold leading-5 text-slate-300">{item.detail}</p>
          </article>
        ))}
      </div>

      <div
        className="mt-3 border border-studio-line bg-studio-ink/70 p-2"
        data-testid="knowledge-vault-save-readiness"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-studio-teal">
              Knowledge Vault Save Readiness
            </p>
            <p
              className="mt-1 text-sm font-black uppercase text-white"
              data-testid="knowledge-vault-save-readiness-status"
            >
              {saveReadiness.status.replace(/_/g, " ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" data-testid="knowledge-vault-save-readiness-labels">
            {["Preview only", "Not saved", "Human review required"].map((label) => (
              <span
                className="border border-studio-gold bg-studio-gold/10 px-2 py-1 text-[10px] font-black uppercase text-studio-gold"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div
          className="mt-2 grid gap-2 text-xs md:grid-cols-4"
          data-testid="knowledge-vault-save-readiness-summary"
        >
          <Detail
            label="Reviewable"
            value={`${saveReadiness.readinessSummary.reviewableCandidates}`}
          />
          <Detail
            label="High priority"
            value={`${saveReadiness.readinessSummary.highPriorityReviewItems}`}
          />
          <Detail label="Blockers" value={`${saveReadiness.blockers.length}`} />
          <Detail
            label="Next"
            value={saveReadiness.nextAction}
          />
        </div>

        <p
          className="mt-2 text-xs font-bold leading-5 text-slate-300"
          data-testid="knowledge-vault-save-readiness-targets"
        >
          Future explicit save path:{" "}
          {saveReadiness.possibleFutureSaveTargets.length > 0
            ? saveReadiness.possibleFutureSaveTargets
                .map((target) => target.replace(/_/g, " "))
                .join(", ")
            : "gated until candidates exist"}
        </p>

        <details
          className="mt-2 border border-studio-line bg-studio-ink/40 p-2"
          data-testid="knowledge-vault-save-readiness-details"
        >
          <summary className="cursor-pointer text-[11px] font-black uppercase text-slate-400">
            View save readiness blockers and warnings
          </summary>
          <div className="mt-2 grid gap-2 text-[11px] font-black uppercase leading-4 text-slate-400 md:grid-cols-2">
            <div>
              <p className="text-studio-gold">Blockers</p>
              <ul className="mt-1 grid gap-1">
                {saveReadiness.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-studio-gold">Warnings</p>
              <ul className="mt-1 grid gap-1">
                {saveReadiness.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>

      <div
        className="mt-2 border border-studio-line bg-studio-ink/70 p-2"
        data-testid="knowledge-vault-save-candidate-mapping-preview"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-studio-teal">
              Save Candidate Mapping Preview
            </p>
            <p
              className="mt-1 text-sm font-black uppercase text-white"
              data-testid="knowledge-vault-save-candidate-mapping-status"
            >
              {saveCandidateMapping.status.replace(/_/g, " ")}
            </p>
          </div>
          <div
            className="flex flex-wrap gap-1.5"
            data-testid="knowledge-vault-save-candidate-mapping-labels"
          >
            {[
              "Preview only",
              "Not saved",
              "Local review only",
              "Future explicit save boundary required"
            ].map((label) => (
              <span
                className="border border-studio-gold bg-studio-gold/10 px-2 py-1 text-[10px] font-black uppercase text-studio-gold"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div
          className="mt-2 grid gap-2 text-xs md:grid-cols-4"
          data-testid="knowledge-vault-save-candidate-mapping-summary"
        >
          <Detail
            label="MarketingTags"
            value={`${saveCandidateMapping.marketingTagCandidates.length}`}
          />
          <Detail
            label="KnowledgeCards"
            value={`${saveCandidateMapping.knowledgeCardCandidates.length}`}
          />
          <Detail label="Blockers" value={`${saveCandidateMapping.blockers.length}`} />
          <Detail label="Next" value={saveCandidateMapping.nextAction} />
        </div>
      </div>
    </section>
  );
}

function ClassificationTagPreviewPanel({
  preview
}: {
  preview: ParsedDocxClassificationPreview;
}) {
  const previewReady = preview.status === "preview_ready";
  const tagsToShow = preview.suggestedMarketingTags.slice(0, 5);
  const textbookSectionsToShow = preview.suggestedTextbookSections.slice(0, 3);

  return (
    <section
      className="mt-3 border-2 border-studio-blue bg-studio-blue/10 p-3"
      data-testid="classification-tag-preview"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-blue">
            Classification & Tag Preview
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="classification-preview-only-notice"
          >
            Preview only - suggested tags are not saved records.
          </p>
        </div>
        <span className="status-pill">{preview.status.replace(/_/g, " ")}</span>
      </div>

      <div
        className="mt-2 flex flex-wrap gap-1.5"
        data-testid="classification-preview-guardrails"
      >
        {[
          "Preview only",
          "No AI used",
          "No automatic save",
          "Human review required",
          "No citationText overwrite"
        ].map((label) => (
          <span
            className="border border-studio-gold bg-studio-gold/10 px-2 py-1 text-[10px] font-black uppercase text-studio-gold"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>

      {!previewReady ? (
        <div
          className="mt-3 border border-studio-line bg-studio-ink/70 p-2 text-xs font-bold leading-5 text-slate-300"
          data-testid="classification-preview-empty-state"
        >
          <p className="font-black uppercase text-white">
            Parse a DOCX file first to preview classification and tags.
          </p>
          {preview.blockers.map((blocker) => (
            <p className="mt-1 text-studio-gold" key={blocker}>
              {blocker}
            </p>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-2" data-testid="classification-preview-ready-state">
          <div className="grid gap-2 text-xs md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="border border-studio-line bg-studio-ink/70 p-2">
              <p className="text-xs font-black uppercase text-slate-400">
                Suggested source type
              </p>
              <p
                className="mt-1 text-sm font-black uppercase text-white"
                data-testid="classification-suggested-source-type"
              >
                {preview.suggestedSourceType.replace(/_/g, " ")}
              </p>
            </div>

            <div
              className="border border-studio-line bg-studio-ink/70 p-2"
              data-testid="classification-human-review-focus"
            >
              <p className="text-xs font-black uppercase text-slate-400">
                Human review focus
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tagsToShow.slice(0, 3).map((tag) => (
                  <span
                    className="border border-studio-teal bg-studio-teal/10 px-2 py-1 text-[11px] font-black uppercase text-studio-teal"
                    key={`${tag.category}-${tag.label}`}
                    title={tag.reason}
                  >
                    {tag.label} - {tag.confidence}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <details className="border border-studio-line bg-studio-ink/50 p-2">
            <summary className="cursor-pointer text-xs font-black uppercase text-studio-blue">
              View classification details
            </summary>
            <div className="mt-2 grid gap-2">
              <p className="text-xs font-bold leading-5 text-slate-300">
                {preview.suggestedSourceTypeReason}
              </p>
            <div data-testid="classification-source-signals">
              <p className="text-xs font-black uppercase text-slate-400">
                Source signals
              </p>
              <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
                {preview.sourceSignals.slice(0, 4).map((signal) => (
                  <article
                    className="border-l-4 border-studio-blue bg-studio-panel/70 p-2 text-xs"
                    key={`${signal.source}-${signal.label}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black uppercase text-white">
                        {signal.label}
                      </span>
                      <span className="mock-badge">{signal.strength}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 font-bold text-slate-300">
                      {signal.value}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div data-testid="classification-suggested-tags">
              <p className="text-xs font-black uppercase text-slate-400">
                Suggested marketing tags
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tagsToShow.map((tag) => (
                  <span
                    className="border border-studio-teal bg-studio-teal/10 px-2 py-1 text-[11px] font-black uppercase text-studio-teal"
                    key={`${tag.category}-${tag.label}`}
                    title={tag.reason}
                  >
                    {tag.label} - {tag.confidence}
                  </span>
                ))}
              </div>
            </div>

            <div data-testid="classification-textbook-relevance">
              <p className="text-xs font-black uppercase text-slate-400">
                Suggested textbook relevance
              </p>
              <div className="mt-1 grid gap-1.5">
                {textbookSectionsToShow.map((section) => (
                  <article
                    className="border-l-4 border-studio-gold bg-studio-panel/70 p-2 text-xs"
                    key={section.section}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-white">{section.section}</span>
                      <span className="mock-badge">{section.confidence}</span>
                    </div>
                    <p className="mt-1 font-bold text-slate-300">{section.reason}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
          </details>
        </div>
      )}

      <details
        className="mt-3 border border-studio-line bg-studio-ink/40 p-2"
        data-testid="classification-preview-warnings"
      >
        <summary className="cursor-pointer text-[11px] font-black uppercase text-slate-400">
          View classifier guardrail notes
        </summary>
        <ul className="mt-2 grid gap-1 text-[11px] font-black uppercase leading-4 text-slate-400 sm:grid-cols-2">
          {preview.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

const vaultCandidateReviewStateOptions: {
  label: string;
  value: KnowledgeVaultCandidateLocalReviewState;
}[] = [
  { label: "Not reviewed", value: "not_reviewed" },
  { label: "Selected for review", value: "selected_for_review" },
  {
    label: "Approved for future save",
    value: "approved_for_future_save"
  },
  { label: "Rejected", value: "rejected" },
  { label: "Needs more evidence", value: "needs_more_evidence" }
];

function KnowledgeVaultCandidatePreviewPanel({
  onReviewStateChange,
  reviewStates,
  preview
}: {
  onReviewStateChange: (
    candidateId: string,
    reviewState: KnowledgeVaultCandidateLocalReviewState
  ) => void;
  preview: ParsedDocxKnowledgeVaultCandidatePreview;
  reviewStates: Record<string, KnowledgeVaultCandidateLocalReviewState>;
}) {
  const candidateReady = preview.status === "candidate_ready";
  const candidatesToShow = preview.candidateRecords.slice(0, 5);

  return (
    <section
      className="mt-3 border-2 border-studio-teal bg-studio-teal/10 p-3"
      data-testid="knowledge-vault-candidate-preview"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-teal">
            Knowledge Vault Candidate Preview
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="knowledge-vault-preview-only-notice"
          >
            Preview only - candidate tag records are not saved.
          </p>
        </div>
        <span className="status-pill">{preview.status.replace(/_/g, " ")}</span>
      </div>

      <div
        className="mt-2 flex flex-wrap gap-1.5"
        data-testid="knowledge-vault-preview-guardrails"
      >
        {[
          "Preview only",
          "Not saved",
          "Human review required",
          "No AI used",
          "No citation finality"
        ].map((label) => (
          <span
            className="border border-studio-gold bg-studio-gold/10 px-2 py-1 text-[10px] font-black uppercase text-studio-gold"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>

      {!candidateReady ? (
        <div
          className="mt-3 border border-studio-line bg-studio-ink/70 p-2 text-xs font-bold leading-5 text-slate-300"
          data-testid="knowledge-vault-preview-empty-state"
        >
          <p className="font-black uppercase text-white">
            Run classification preview before creating Knowledge Vault candidates.
          </p>
          {preview.blockers.map((blocker) => (
            <p className="mt-1 text-studio-gold" key={blocker}>
              {blocker}
            </p>
          ))}
        </div>
      ) : (
        <div
          className="mt-3 grid gap-2"
          data-testid="knowledge-vault-preview-ready-state"
        >
          <div
            className="grid gap-2 text-xs md:grid-cols-4"
            data-testid="knowledge-vault-source-coverage"
          >
            <Detail
              label="Parsed DOCX"
              value={preview.sourceCoverage.hasParsedDocx ? "yes" : "no"}
            />
            <Detail
              label="Classification"
              value={preview.sourceCoverage.hasClassificationPreview ? "preview ready" : "gated"}
            />
            <Detail
              label="Suggested tags"
              value={preview.sourceCoverage.hasSuggestedTags ? "available" : "missing"}
            />
            <Detail
              label="Textbook relevance"
              value={preview.sourceCoverage.hasTextbookRelevance ? "available" : "missing"}
            />
          </div>

          <div className="border border-studio-line bg-studio-ink/70 p-2 text-xs">
            <p className="font-black uppercase text-white">
              {preview.candidateRecords.length} preview candidates need human review.
            </p>
            <p className="mt-1 font-bold leading-5 text-slate-300">
              Top signal: {preview.candidateRecords[0]?.tagLabel ?? "No strong tag signal"}.
              Candidate records are not saved.
            </p>
          </div>

          <details
            className="border border-studio-line bg-studio-ink/50 p-2"
            data-testid="knowledge-vault-candidate-records"
          >
            <summary className="cursor-pointer text-xs font-black uppercase text-studio-teal">
              Expand candidate records
            </summary>
            <div className="mt-2 grid gap-2">
              {candidatesToShow.map((candidate) => (
                <article
                  className="border-l-4 border-studio-teal bg-studio-panel/70 p-2 text-xs"
                  key={candidate.candidateId}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-black uppercase text-white">
                        {candidate.tagLabel}
                      </p>
                      <p className="mt-1 font-bold uppercase text-studio-blue">
                        {candidate.tagGroup}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="mock-badge">{candidate.confidence}</span>
                      <span className="mock-badge">{candidate.persistenceStatus}</span>
                      <span className="mock-badge">review required</span>
                    </div>
                  </div>
                  <p className="mt-2 font-bold leading-5 text-slate-300">
                    {candidate.reason}
                  </p>
                  <p className="mt-1 font-bold leading-5 text-slate-400">
                    {candidate.sourceRelationship}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {candidate.suggestedVaultUse.map((use) => (
                      <span
                        className="border border-studio-blue bg-studio-blue/10 px-2 py-1 text-[10px] font-black uppercase text-studio-blue"
                        key={`${candidate.candidateId}-${use}`}
                      >
                        {use.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                  <div
                    className="mt-2 border border-studio-line bg-studio-ink/60 p-2"
                    data-testid="vault-candidate-local-review-controls"
                  >
                    <label
                      className="block text-[11px] font-black uppercase text-studio-gold"
                      htmlFor={`vault-candidate-review-${candidate.candidateId}`}
                    >
                      Local review state
                    </label>
                    <select
                      className="mt-1 w-full border border-studio-line bg-studio-ink px-2 py-1 text-xs font-bold text-white"
                      data-testid="vault-candidate-review-state-select"
                      id={`vault-candidate-review-${candidate.candidateId}`}
                      onChange={(event) =>
                        onReviewStateChange(
                          candidate.candidateId,
                          event.target.value as KnowledgeVaultCandidateLocalReviewState
                        )
                      }
                      value={reviewStates[candidate.candidateId] ?? "not_reviewed"}
                    >
                      {vaultCandidateReviewStateOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-slate-400">
                      Local review only. Approved for future save means future
                      save candidate, not saved, verified, or final.
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </details>
        </div>
      )}

      <details
        className="mt-3 border border-studio-line bg-studio-ink/40 p-2"
        data-testid="knowledge-vault-preview-warnings"
      >
        <summary className="cursor-pointer text-[11px] font-black uppercase text-slate-400">
          View candidate guardrail notes
        </summary>
        <ul className="mt-2 grid gap-1 text-[11px] font-black uppercase leading-4 text-slate-400 sm:grid-cols-2">
          {preview.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function KnowledgeVaultReviewBasketPanel({
  preview
}: {
  preview: ParsedDocxKnowledgeVaultReviewBasketPreview;
}) {
  const basketReady = preview.status === "review_basket_ready";
  const itemsToShow = preview.selectedOrRecommendedCandidates.slice(0, 5);

  return (
    <section
      className="mt-3 border-2 border-studio-gold bg-studio-gold/10 p-3"
      data-testid="knowledge-vault-review-basket"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-gold">
            Knowledge Vault Review Basket
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="review-basket-preview-only-notice"
          >
            Preview only - basket is not saved and no vault write occurs.
          </p>
        </div>
        <span className="status-pill">{preview.status.replace(/_/g, " ")}</span>
      </div>

      <div
        className="mt-2 flex flex-wrap gap-1.5"
        data-testid="review-basket-guardrails"
      >
        {[
          "Preview only",
          "Not saved",
          "Human review required",
          "No automatic vault write",
          "No citation finality"
        ].map((label) => (
          <span
            className="border border-studio-gold bg-studio-gold/10 px-2 py-1 text-[10px] font-black uppercase text-studio-gold"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>

      {!basketReady ? (
        <div
          className="mt-3 border border-studio-line bg-studio-ink/70 p-2 text-xs font-bold leading-5 text-slate-300"
          data-testid="review-basket-empty-state"
        >
          <p className="font-black uppercase text-white">
            Knowledge Vault candidates are required before the review basket.
          </p>
          {preview.blockers.map((blocker) => (
            <p className="mt-1 text-studio-gold" key={blocker}>
              {blocker}
            </p>
          ))}
        </div>
      ) : (
        <div
          className="mt-3 grid gap-2"
          data-testid="review-basket-ready-state"
        >
          <div
            className="grid gap-2 text-xs md:grid-cols-5"
            data-testid="review-basket-summary"
          >
            <Detail label="Total candidates" value={`${preview.basketSummary.totalCandidates}`} />
            <Detail label="For review" value={`${preview.basketSummary.recommendedForReview}`} />
            <Detail label="Concept" value={`${preview.basketSummary.conceptRecords}`} />
            <Detail label="Evidence" value={`${preview.basketSummary.evidenceRecords}`} />
            <Detail label="Textbook input" value={`${preview.basketSummary.textbookSectionInputs}`} />
          </div>

          <div className="border border-studio-line bg-studio-ink/70 p-2 text-xs">
            <p className="font-black uppercase text-white">
              {preview.basketSummary.recommendedForReview} items are recommended for
              human review.
            </p>
            <p className="mt-1 font-bold leading-5 text-slate-300">
              Start with {itemsToShow[0]?.tagLabel ?? "the highest-priority item"};
              the basket remains preview-only and unsaved.
            </p>
          </div>

          <details
            className="border border-studio-line bg-studio-ink/50 p-2"
            data-testid="review-basket-items"
          >
            <summary className="cursor-pointer text-xs font-black uppercase text-studio-gold">
              Expand review items
            </summary>
            <div className="mt-2 grid gap-2">
              {itemsToShow.map((item) => (
                <article
                  className="border-l-4 border-studio-gold bg-studio-panel/70 p-2 text-xs"
                  key={item.candidateId}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-black uppercase text-white">{item.tagLabel}</p>
                      <p className="mt-1 font-bold text-slate-300">{item.reason}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="mock-badge">{item.reviewPriority} priority</span>
                      <span className="mock-badge">{item.confidence}</span>
                      <span className="mock-badge">{item.persistenceStatus}</span>
                      <span className="mock-badge">review required</span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.suggestedVaultUse.map((use) => (
                      <span
                        className="border border-studio-blue bg-studio-blue/10 px-2 py-1 text-[10px] font-black uppercase text-studio-blue"
                        key={`${item.candidateId}-${use}`}
                      >
                        {use.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </details>
        </div>
      )}

      <details
        className="mt-3 border border-studio-line bg-studio-ink/40 p-2"
        data-testid="review-basket-warnings"
      >
        <summary className="cursor-pointer text-[11px] font-black uppercase text-slate-400">
          View basket guardrail notes
        </summary>
        <ul className="mt-2 grid gap-1 text-[11px] font-black uppercase leading-4 text-slate-400 sm:grid-cols-2">
          {preview.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function SaveCandidateMappingPreviewPanel({
  preview
}: {
  preview: KnowledgeVaultSaveCandidateMapping;
}) {
  const mappingReady =
    preview.marketingTagCandidates.length > 0 ||
    preview.knowledgeCardCandidates.length > 0;
  const marketingTagsToShow = preview.marketingTagCandidates.slice(0, 4);
  const knowledgeCardsToShow = preview.knowledgeCardCandidates.slice(0, 4);

  return (
    <section
      className="mt-3 border-2 border-studio-line bg-studio-ink/60 p-3"
      data-testid="save-candidate-mapping-preview"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-teal">
            Save Candidate Mapping Preview
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="save-mapping-preview-only-notice"
          >
            Preview only - local review only - future explicit save boundary required.
          </p>
        </div>
        <span className="status-pill">{preview.status.replace(/_/g, " ")}</span>
      </div>

      <div
        className="mt-2 flex flex-wrap gap-1.5"
        data-testid="save-mapping-preview-guardrails"
      >
        {[
          "Preview only",
          "Not saved",
          "Local review only",
          "Human review required",
          "No automatic write",
          "No citation finality"
        ].map((label) => (
          <span
            className="border border-studio-gold bg-studio-gold/10 px-2 py-1 text-[10px] font-black uppercase text-studio-gold"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>

      <div
        className="mt-3 grid gap-2 text-xs md:grid-cols-4"
        data-testid="save-mapping-preview-summary"
      >
        <Detail label="MarketingTags" value={`${preview.marketingTagCandidates.length}`} />
        <Detail label="KnowledgeCards" value={`${preview.knowledgeCardCandidates.length}`} />
        <Detail label="Blockers" value={`${preview.blockers.length}`} />
        <Detail label="Next" value={preview.nextAction} />
      </div>

      {!mappingReady ? (
        <div
          className="mt-3 border border-studio-line bg-studio-ink/70 p-2 text-xs font-bold leading-5 text-slate-300"
          data-testid="save-mapping-empty-state"
        >
          <p className="font-black uppercase text-white">
            Review candidates locally before previewing MarketingTag or KnowledgeCard save candidates.
          </p>
          {preview.blockers.slice(0, 4).map((blocker) => (
            <p className="mt-1 text-studio-gold" key={blocker}>
              {blocker}
            </p>
          ))}
        </div>
      ) : (
        <details
          className="mt-3 border border-studio-line bg-studio-ink/50 p-2"
          data-testid="save-mapping-preview-details"
        >
          <summary className="cursor-pointer text-xs font-black uppercase text-studio-teal">
            Expand future save candidates
          </summary>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            <div className="border border-studio-line bg-studio-panel/70 p-2 text-xs">
              <p className="font-black uppercase text-studio-gold">
                MarketingTag save candidates
              </p>
              <div className="mt-2 grid gap-2">
                {marketingTagsToShow.map((candidate) => (
                  <article
                    className="border-l-4 border-studio-teal bg-studio-ink/70 p-2"
                    key={candidate.candidateId}
                  >
                    <p className="font-black uppercase text-white">
                      {candidate.tagLabel}
                    </p>
                    <p className="mt-1 font-bold text-slate-300">
                      {candidate.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="mock-badge">{candidate.tagGroup}</span>
                      <span className="mock-badge">{candidate.reviewState}</span>
                      <span className="mock-badge">{candidate.persistenceStatus}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="border border-studio-line bg-studio-panel/70 p-2 text-xs">
              <p className="font-black uppercase text-studio-gold">
                KnowledgeCard save candidates
              </p>
              <div className="mt-2 grid gap-2">
                {knowledgeCardsToShow.map((candidate) => (
                  <article
                    className="border-l-4 border-studio-blue bg-studio-ink/70 p-2"
                    key={candidate.candidateId}
                  >
                    <p className="font-black uppercase text-white">
                      {candidate.conceptLabel}
                    </p>
                    <p className="mt-1 font-bold text-slate-300">
                      {candidate.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="mock-badge">{candidate.cardType}</span>
                      <span className="mock-badge">{candidate.evidenceReadiness}</span>
                      <span className="mock-badge">{candidate.persistenceStatus}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </details>
      )}

      <details
        className="mt-3 border border-studio-line bg-studio-ink/40 p-2"
        data-testid="save-mapping-preview-warnings"
      >
        <summary className="cursor-pointer text-[11px] font-black uppercase text-slate-400">
          View mapping blockers and guardrails
        </summary>
        <div className="mt-2 grid gap-2 text-[11px] font-black uppercase leading-4 text-slate-400 sm:grid-cols-2">
          <div>
            <p className="text-studio-gold">Blockers</p>
            <ul className="mt-1 grid gap-1">
              {preview.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-studio-gold">Warnings</p>
            <ul className="mt-1 grid gap-1">
              {preview.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}

function TextbookRequestSeedPreviewPanel({
  preview
}: {
  preview: ParsedDocxTextbookRequestSeedPreview;
}) {
  const seedReady = preview.status === "seed_ready";
  const topicsToShow = preview.suggestedTextbookTopics.slice(0, 3);

  return (
    <section
      className="mt-3 border-2 border-studio-blue bg-studio-blue/10 p-3"
      data-testid="textbook-request-seed-preview"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-blue">
            Textbook Request Seed Preview
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="textbook-seed-preview-only-notice"
          >
            Preview only - not a generated textbook, not a DraftArtifact.
          </p>
        </div>
        <span className="status-pill">{preview.status.replace(/_/g, " ")}</span>
      </div>

      <div
        className="mt-2 flex flex-wrap gap-1.5"
        data-testid="textbook-seed-guardrails"
      >
        {[
          "Preview only",
          "Not a draft",
          "No AI used",
          "No DraftArtifact",
          "Human review required",
          "No citation finality"
        ].map((label) => (
          <span
            className="border border-studio-gold bg-studio-gold/10 px-2 py-1 text-[10px] font-black uppercase text-studio-gold"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>

      {!seedReady ? (
        <div
          className="mt-3 border border-studio-line bg-studio-ink/70 p-2 text-xs font-bold leading-5 text-slate-300"
          data-testid="textbook-seed-empty-state"
        >
          <p className="font-black uppercase text-white">
            Review basket is required before textbook request seed preview.
          </p>
          {preview.blockers.map((blocker) => (
            <p className="mt-1 text-studio-gold" key={blocker}>
              {blocker}
            </p>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-2" data-testid="textbook-seed-ready-state">
          <div className="grid gap-2 text-xs md:grid-cols-3" data-testid="textbook-seed-summary">
            <Detail label="Request title" value={preview.requestSeed.suggestedRequestTitle} />
            <Detail label="Audience" value={preview.requestSeed.suggestedAudience} />
            <Detail label="Readiness" value={preview.requestSeed.readiness} />
          </div>

          <div className="border border-studio-line bg-studio-ink/70 p-2 text-xs">
            <p className="font-black uppercase text-white">
              Seed direction: {topicsToShow[0]?.topicLabel ?? "Needs topic review"}
            </p>
            <p className="mt-1 font-bold leading-5 text-slate-300">
              This is a request seed only; no textbook prose or DraftArtifact is
              created.
            </p>
          </div>

          <details
            className="border border-studio-line bg-studio-ink/50 p-2"
            data-testid="textbook-seed-topics"
          >
            <summary className="cursor-pointer text-xs font-black uppercase text-studio-blue">
              Expand textbook topic directions
            </summary>
            <div className="mt-2 grid gap-2">
              {topicsToShow.map((topic) => (
                <article
                  className="border-l-4 border-studio-blue bg-studio-panel/70 p-2 text-xs"
                  key={topic.topicLabel}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-black uppercase text-white">{topic.topicLabel}</p>
                      <p className="mt-1 font-bold text-slate-300">
                        {topic.possibleChapterUse}
                      </p>
                    </div>
                    <span className="mock-badge">{topic.evidenceReadiness}</span>
                  </div>
                  <p className="mt-2 font-bold leading-5 text-slate-400">{topic.reason}</p>
                  <p className="mt-1 font-bold leading-5 text-studio-teal">
                    Tags: {topic.supportingTags.join(", ")}
                  </p>
                </article>
              ))}
            </div>
          </details>

          <details
            className="border border-studio-line bg-studio-ink/70 p-2 text-xs font-bold leading-5 text-slate-300"
            data-testid="textbook-seed-missing-evidence"
            open
          >
            <summary className="cursor-pointer font-black uppercase text-studio-gold">
              Missing evidence warnings
            </summary>
            <ul className="mt-1 grid gap-1">
              {preview.missingEvidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        </div>
      )}

      <details
        className="mt-3 border border-studio-line bg-studio-ink/40 p-2"
        data-testid="textbook-seed-warnings"
      >
        <summary className="cursor-pointer text-[11px] font-black uppercase text-slate-400">
          View seed guardrail notes
        </summary>
        <ul className="mt-2 grid gap-1 text-[11px] font-black uppercase leading-4 text-slate-400 sm:grid-cols-2">
          {preview.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function createSourceLibraryWorkflowShellState({
  candidateReviewStatus,
  documentExtractionResult,
  selectedLocalFile
}: {
  candidateReviewStatus: SourceDocumentCandidateReviewStatus;
  documentExtractionResult: DocumentExtractionResponse | null;
  selectedLocalFile: LocalDocumentFileIntakeJob | null;
}): SourceLibraryWorkflowShellState {
  if (!selectedLocalFile) {
    return {
      currentStage: "input",
      nextAction: "Paste a local DOCX path to start.",
      selectedSourceLabel: "No local source selected yet",
      statusLabel: "Waiting for input"
    };
  }

  if (selectedLocalFile.fileType !== "DOCX") {
    return {
      currentStage: "input",
      nextAction: "PDF is metadata-only/queued; paste a DOCX path for parsing.",
      selectedSourceLabel: selectedLocalFile.fileName,
      statusLabel: "PDF gated"
    };
  }

  if (!documentExtractionResult) {
    return {
      currentStage: "input",
      nextAction: "Run DOCX parsing, then review extracted segments.",
      selectedSourceLabel: selectedLocalFile.fileName,
      statusLabel: "DOCX selected"
    };
  }

  if (candidateReviewStatus !== "approved") {
    return {
      currentStage: "classify",
      nextAction: "Save SourceDocument explicitly.",
      selectedSourceLabel: selectedLocalFile.fileName,
      statusLabel: "Parsed candidate unsaved"
    };
  }

  return {
    currentStage: "tag_vault",
    nextAction: "Save SourceDocument explicitly before later record steps.",
    selectedSourceLabel: selectedLocalFile.fileName,
    statusLabel: "Ready for explicit saves"
  };
}

function createHumanAttentionItems({
  classificationPreview,
  currentAction,
  extractionResult,
  reviewBasketPreview,
  selectedFile,
  saveCandidateMappingPreview,
  textbookRequestSeedPreview,
  vaultSaveReadiness,
  vaultCandidatePreview
}: {
  classificationPreview: ParsedDocxClassificationPreview;
  currentAction: GuidedActionPathItem;
  extractionResult: DocumentExtractionResponse | null;
  reviewBasketPreview: ParsedDocxKnowledgeVaultReviewBasketPreview;
  selectedFile: LocalDocumentFileIntakeJob | null;
  saveCandidateMappingPreview: KnowledgeVaultSaveCandidateMapping;
  textbookRequestSeedPreview: ParsedDocxTextbookRequestSeedPreview;
  vaultSaveReadiness: KnowledgeVaultSaveReadiness;
  vaultCandidatePreview: ParsedDocxKnowledgeVaultCandidatePreview;
}): HumanAttentionItem[] {
  if (!selectedFile) {
    return [
      {
        detail: "Paste a local DOCX path in the left intake desk to begin.",
        label: "Start with input",
        tone: "action"
      },
      {
        detail: "Preview details are gated until there is parsed DOCX text.",
        label: "Preview layers are waiting",
        tone: "ready"
      },
      {
        detail: "Preview-only, not-saved, no-AI, and export-gated warnings remain active.",
        label: "Safety state",
        tone: "risk"
      }
    ];
  }

  if (selectedFile.fileType !== "DOCX") {
    return [
      {
        detail: "PDF is metadata-only/queued here. Use a DOCX path for parsing.",
        label: "Parsing blocked",
        tone: "risk"
      },
      {
        detail: "The current usable path remains local DOCX path entry.",
        label: "Next usable action",
        tone: "action"
      }
    ];
  }

  if (!extractionResult) {
    return [
      {
        detail: "Run the existing DOCX parser button after metadata preview.",
        label: "Parse DOCX",
        tone: "action"
      },
      {
        detail: "Classification, vault candidates, basket, and seed are gated until parsing returns text.",
        label: "Gated previews",
        tone: "ready"
      }
    ];
  }

  const missingEvidence = textbookRequestSeedPreview.missingEvidence.slice(0, 2);

  return [
    {
      detail: currentAction.detail,
      label: currentAction.action,
      tone: "action"
    },
    {
      detail:
        classificationPreview.status === "preview_ready"
          ? `${classificationPreview.suggestedMarketingTags.length} tag suggestions need human classification review.`
          : "Classification preview is gated until parsed text is available.",
      label: "Review classification",
      tone: "review"
    },
    {
      detail:
        vaultCandidatePreview.status === "candidate_ready"
          ? `${vaultCandidatePreview.candidateRecords.length} vault candidates are preview-only and not saved.`
          : "Knowledge Vault candidates are waiting for classification signals.",
      label: "Review vault candidates",
      tone: "review"
    },
    {
      detail:
        reviewBasketPreview.status === "review_basket_ready"
          ? `${reviewBasketPreview.basketSummary.recommendedForReview} basket items are recommended for review.`
          : "Review basket is gated until candidate records exist.",
      label: "Check review basket",
      tone: "review"
    },
    {
      detail: `Save readiness: ${vaultSaveReadiness.nextAction}; ${vaultSaveReadiness.blockers.length} blocker(s).`,
      label: "Check vault save readiness",
      tone: vaultSaveReadiness.status === "blocked" ? "risk" : "ready"
    },
    {
      detail: `Save mapping: ${saveCandidateMappingPreview.nextAction}; ${saveCandidateMappingPreview.blockers.length} blocker(s).`,
      label: "Preview save mapping",
      tone:
        saveCandidateMappingPreview.status === "needs_saved_source_links" ||
        saveCandidateMappingPreview.status === "blocked"
          ? "risk"
          : "review"
    },
    {
      detail:
        textbookRequestSeedPreview.status === "seed_ready"
          ? missingEvidence.length > 0
            ? `Check missing evidence: ${missingEvidence.join(", ")}.`
            : "Textbook request seed is ready for human review."
          : "Textbook request seed remains gated.",
      label: "Check missing evidence",
      tone: "risk"
    }
  ];
}

function createGuidedActionPathItems({
  candidateReviewStatus,
  classificationPreview,
  extractionResult,
  reviewBasketPreview,
  selectedFile,
  saveCandidateMappingPreview,
  textbookRequestSeedPreview,
  vaultSaveReadiness,
  vaultCandidatePreview
}: {
  candidateReviewStatus: SourceDocumentCandidateReviewStatus;
  classificationPreview: ParsedDocxClassificationPreview;
  extractionResult: DocumentExtractionResponse | null;
  reviewBasketPreview: ParsedDocxKnowledgeVaultReviewBasketPreview;
  selectedFile: LocalDocumentFileIntakeJob | null;
  saveCandidateMappingPreview: KnowledgeVaultSaveCandidateMapping;
  textbookRequestSeedPreview: ParsedDocxTextbookRequestSeedPreview;
  vaultSaveReadiness: KnowledgeVaultSaveReadiness;
  vaultCandidatePreview: ParsedDocxKnowledgeVaultCandidatePreview;
}): GuidedActionPathItem[] {
  const hasMetadataPreview = Boolean(selectedFile);
  const isDocx = selectedFile?.fileType === "DOCX";
  const hasParsedDocx = Boolean(extractionResult);
  const candidateApproved = candidateReviewStatus === "approved";
  const canReviewCandidate = hasParsedDocx;
  const canReviewClassification =
    classificationPreview.status === "preview_ready" || classificationPreview.status === "available";
  const canReviewVaultCandidates =
    vaultCandidatePreview.status === "candidate_ready";
  const canReviewBasket =
    reviewBasketPreview.status === "review_basket_ready";
  const canCheckVaultSaveReadiness =
    vaultSaveReadiness.status !== "not_started" &&
    vaultSaveReadiness.status !== "needs_candidates";
  const canPreviewSaveMapping =
    saveCandidateMappingPreview.status !== "not_started" &&
    saveCandidateMappingPreview.status !== "blocked";
  const canPreviewTextbookSeed =
    textbookRequestSeedPreview.status === "seed_ready";
  const canUsePersistencePanel = hasParsedDocx && candidateApproved;
  const pdfSelected = selectedFile?.fileType === "PDF";

  return [
    {
      action: "Paste DOCX path",
      affordanceLabel: "Paste path on left",
      detail: hasMetadataPreview
        ? "Local file metadata is previewed from the pasted path."
        : "Use the left intake field as the current start action.",
      status: hasMetadataPreview ? "done" : "current",
      target: "metadata"
    },
    {
      action: "Preview file metadata",
      affordanceLabel: hasMetadataPreview ? "Open metadata preview" : undefined,
      detail: hasMetadataPreview
        ? `${selectedFile?.fileName ?? "Selected file"} is loaded for review.`
        : "Blocked until a local path is inspected.",
      status: hasMetadataPreview ? "done" : "blocked",
      target: "metadata"
    },
    {
      action: "Parse DOCX",
      affordanceLabel: isDocx && !hasParsedDocx ? "Open metadata preview" : undefined,
      detail: hasParsedDocx
        ? "DOCX extraction result is available for review."
        : pdfSelected
          ? "PDF is metadata-only/queued; use DOCX for parsing."
          : isDocx
            ? "Use the existing Parse DOCX MVP button in the metadata preview."
            : "Blocked until a DOCX metadata preview exists.",
      status: hasParsedDocx ? "done" : isDocx ? "current" : pdfSelected ? "gated" : "blocked",
      target: "parser"
    },
    {
      action: "Review segments/candidate",
      affordanceLabel: canReviewCandidate ? "Open parsed DOCX preview" : undefined,
      detail: canReviewCandidate
        ? "Review extracted segments, candidate metadata, traces, and warnings."
        : "Blocked until DOCX parsing returns extracted segments.",
      status: canReviewCandidate ? (candidateApproved ? "done" : "current") : "blocked",
      target: "candidate"
    },
    {
      action: "Preview Classification & Tags",
      affordanceLabel: canReviewClassification ? "Review classification preview" : undefined,
      detail: hasParsedDocx
        ? "Preview-only source type, marketing tags, and textbook relevance are ready for human review."
        : "Gated until DOCX parsing returns extracted text or segments.",
      status: hasParsedDocx ? "available" : "gated",
      target: "classification"
    },
    {
      action: "Preview Knowledge Vault Candidates",
      affordanceLabel: canReviewVaultCandidates ? "Review vault candidates" : undefined,
      detail: canReviewVaultCandidates
        ? "Preview-only tag record candidates are ready for human review; nothing is saved."
        : "Gated until parsed-DOCX classification preview has usable tag signals.",
      status: canReviewVaultCandidates ? "available" : "gated",
      target: "vault_preview"
    },
    {
      action: "Review Knowledge Vault Basket",
      affordanceLabel: canReviewBasket ? "Review basket preview" : undefined,
      detail: canReviewBasket
        ? "Recommended review basket is ready; no candidate is saved or auto-approved."
        : "Gated until Knowledge Vault candidate preview has reviewable items.",
      status: canReviewBasket ? "available" : "gated",
      target: "review_basket"
    },
    {
      action: "Review Vault Candidates",
      affordanceLabel: canReviewVaultCandidates ? "Open local review controls" : undefined,
      detail: canReviewVaultCandidates
        ? "Mark candidates locally as selected, approved for future save, rejected, or needing more evidence."
        : "Gated until Knowledge Vault candidate preview has reviewable items.",
      status:
        saveCandidateMappingPreview.status === "needs_review"
          ? "current"
          : canReviewVaultCandidates
            ? "available"
            : "gated",
      target: "vault_preview"
    },
    {
      action: "Check Vault Save Readiness",
      affordanceLabel: canCheckVaultSaveReadiness ? "Review save readiness" : undefined,
      detail: canCheckVaultSaveReadiness
        ? `Readiness says ${vaultSaveReadiness.nextAction}; ${vaultSaveReadiness.blockers.length} blocker(s) remain.`
        : "Gated until Knowledge Vault candidate preview has reviewable items.",
      status: canCheckVaultSaveReadiness ? "available" : "gated",
      target: "vault_save_readiness"
    },
    {
      action: "Preview Save Mapping",
      affordanceLabel: canPreviewSaveMapping ? "Review save mapping preview" : undefined,
      detail: canPreviewSaveMapping
        ? `Mapping says ${saveCandidateMappingPreview.nextAction}; ${saveCandidateMappingPreview.blockers.length} blocker(s) remain.`
        : "Gated until local candidate review creates future save candidates.",
      status:
        saveCandidateMappingPreview.status === "needs_saved_source_links"
          ? "blocked"
          : canPreviewSaveMapping
            ? "available"
            : "gated",
      target: "vault_save_mapping"
    },
    {
      action: "Preview Textbook Request Seed",
      affordanceLabel: canPreviewTextbookSeed ? "Review textbook seed" : undefined,
      detail: canPreviewTextbookSeed
        ? "Preview-only textbook request seed is ready for human review; no prose is generated."
        : "Gated until the review basket is ready.",
      status: canPreviewTextbookSeed ? "available" : "gated",
      target: "textbook_seed"
    },
    {
      action: "Save SourceDocument",
      affordanceLabel: hasParsedDocx ? "Open save SourceDocument section" : undefined,
      detail: hasParsedDocx
        ? "Use explicit persistence controls below; no SourceDocument is auto-saved."
        : "Blocked until a parsed DOCX candidate exists.",
      status: hasParsedDocx ? "available" : "blocked",
      target: "candidate"
    },
    {
      action: "Save SourceCard",
      affordanceLabel: canUsePersistencePanel ? "Open SourceCard save section" : undefined,
      detail: canUsePersistencePanel
        ? "Available after SourceDocument verification in the existing persistence panel."
        : "Gated by parsed candidate approval and saved SourceDocument verification.",
      status: canUsePersistencePanel ? "available" : "gated",
      target: "candidate"
    },
    {
      action: "Review metadata",
      affordanceLabel: canUsePersistencePanel ? "Open metadata review" : undefined,
      detail: canUsePersistencePanel
        ? "Structured metadata and APA internal-use candidate remain review surfaces."
        : "Gated until SourceCard context exists; APA internal-use candidate only, no APA-final verification.",
      status: canUsePersistencePanel ? "available" : "gated",
      target: "candidate"
    },
    {
      action: "Save tags/KnowledgeCards",
      affordanceLabel: canUsePersistencePanel ? "Open KnowledgeCard section" : undefined,
      detail: canUsePersistencePanel
        ? "Use existing explicit save controls after approved tag/card review."
        : "Gated until saved SourceCard and approved local review states exist.",
      status: canUsePersistencePanel ? "available" : "gated",
      target: "candidate"
    },
    {
      action: "Save DraftArtifact mock/not-final",
      affordanceLabel: canUsePersistencePanel ? "Open DraftArtifact section" : undefined,
      detail: canUsePersistencePanel
        ? "Existing draft save remains mock/not-final and requires saved prerequisites."
        : "Planned/gated until saved SourceCard and KnowledgeCards exist.",
      status: canUsePersistencePanel ? "available" : "planned",
      target: "candidate"
    },
    {
      action: "Review export readiness",
      affordanceLabel: canUsePersistencePanel ? "Open export readiness" : undefined,
      detail: "DOCX output remains gated; review package readiness before export.",
      status: canUsePersistencePanel ? "available" : "planned",
      target: "candidate"
    }
  ];
}

function isGuidedActionAffordanceVisible(status: GuidedActionStatus): boolean {
  return status === "current" || status === "available" || status === "done";
}

function getGuidedActionClassName(status: GuidedActionStatus): string {
  switch (status) {
    case "current":
      return "border-studio-gold bg-studio-gold/15 text-studio-gold";
    case "available":
      return "border-studio-teal bg-studio-teal/10 text-studio-teal";
    case "done":
      return "border-studio-blue bg-studio-blue/10 text-studio-blue";
    case "gated":
      return "border-studio-line bg-studio-ink/70 text-slate-400";
    case "planned":
      return "border-studio-line bg-studio-panel/60 text-slate-500";
    case "blocked":
    default:
      return "border-studio-rose bg-studio-rose/10 text-studio-rose";
  }
}

function getAttentionToneClassName(tone: HumanAttentionTone): string {
  switch (tone) {
    case "action":
      return "border-studio-gold";
    case "review":
      return "border-studio-teal";
    case "risk":
      return "border-studio-rose";
    case "ready":
    default:
      return "border-studio-blue";
  }
}

function createRealSourceContextState({
  candidateReviewStatus,
  documentExtractionResult
}: {
  candidateReviewStatus: SourceDocumentCandidateReviewStatus;
  documentExtractionResult: DocumentExtractionResponse | null;
}): RealSourceContextState {
  const hasParsedDocx = Boolean(documentExtractionResult);
  const candidateApproved = candidateReviewStatus === "approved";

  return {
    draftArtifactStatus: candidateApproved
      ? "Mock/not-final preview available after saved prerequisites"
      : "Gated until source records and KnowledgeCards are saved",
    knowledgeCardStatus: candidateApproved
      ? "Preview reviewed locally; explicit save still required"
      : "Gated until candidate review is approved",
    metadataReviewState: hasParsedDocx
      ? "Internal-use metadata review only; no APA-final verification"
      : "Waiting for parsed DOCX candidate",
    sourceCardStatus: candidateApproved
      ? "Ready for explicit SourceCard save after SourceDocument verification"
      : "Not saved in main workflow state",
    sourceDocumentStatus: hasParsedDocx
      ? "Parsed candidate exists; explicit save required"
      : "Not saved"
  };
}

function getWorkflowStageState(
  stage: SourceLibraryWorkflowStage,
  currentStage: SourceLibraryWorkflowStage
): string {
  if (stage === currentStage) {
    return "current";
  }

  if (["textbook_request", "draft_review", "docx_export"].includes(stage)) {
    return "gated";
  }

  return "available";
}

function BatchResearchIntakeQueuePanel({
  error,
  isCreating,
  jobs,
  onCreateQueueJobs,
  result
}: {
  error: string | null;
  isCreating: boolean;
  jobs: SavedBatchResearchIntakeJob[];
  onCreateQueueJobs: () => void;
  result: CreateBatchResearchIntakeJobsResult | null;
}) {
  return (
    <div
      className="mt-4 border-2 border-studio-teal bg-studio-teal/10 p-3 text-sm leading-6 text-slate-200"
      data-testid="batch-intake-queue-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-teal">
            Multi-file Intake Queue MVP
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="batch-intake-queue-only-notice"
          >
            Queue only — files are not parsed in this sprint.
          </p>
        </div>
        <span className="status-pill">PDF / DOCX</span>
      </div>

      <ul
        className="mt-3 space-y-1 border-l-4 border-studio-gold bg-studio-gold/10 p-3 text-xs font-bold uppercase leading-5 text-studio-gold"
        data-testid="batch-intake-boundary-notices"
      >
        <li>No external metadata lookup is performed.</li>
        <li>No SourceDocument or SourceCard is created automatically.</li>
        <li>No metadata is overwritten.</li>
      </ul>

      <button
        className="mt-3 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:opacity-60"
        data-testid="batch-intake-select-files-button"
        disabled={isCreating}
        onClick={onCreateQueueJobs}
        type="button"
      >
        {isCreating ? "Creating queue records..." : "Select PDF/DOCX files"}
      </button>

      {result ? (
        <div
          className="mt-3 grid grid-cols-2 gap-2"
          data-testid="batch-intake-create-result"
        >
          <SummaryStat label="Created jobs" value={result.jobs.length} />
          <SummaryStat label="Saved" value={result.saved ? "Yes" : "No"} />
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 border-l-4 border-red-400 bg-red-500/10 p-2 font-black text-red-200">
          {error}
        </p>
      ) : null}

      {result?.blockers.length ? (
        <ListBlock
          dataTestId="batch-intake-blockers"
          emptyText="No batch intake blockers."
          items={result.blockers}
          title="Blockers"
        />
      ) : null}

      {result?.warnings.length ? (
        <ListBlock
          dataTestId="batch-intake-warnings"
          emptyText="No batch intake warnings."
          items={result.warnings}
          title="Warnings"
        />
      ) : null}

      <div className="mt-4" data-testid="batch-intake-queue-list">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-studio-blue">
            Queue Records
          </p>
          <span className="status-pill" data-testid="batch-intake-created-count">
            {jobs.length} jobs
          </span>
        </div>

        {jobs.length > 0 ? (
          <div className="grid gap-2">
            {jobs.map((job) => {
              const warnings = parseJsonStringArray(job.warningsJson);
              const blockers = parseJsonStringArray(job.blockersJson);

              return (
                <div
                  className="border border-studio-line bg-studio-panel/80 p-2"
                  data-testid="batch-intake-queue-item"
                  key={job.intakeJobId}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-black text-white">{job.fileName}</p>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {job.fileType} · {formatFileSize(job.fileSize ?? 0)}
                      </p>
                    </div>
                    <span className="status-pill">{job.queueStatus}</span>
                  </div>
                  <dl className="mt-2 grid gap-1 text-xs">
                    <Detail label="Parser" value={job.parserStatus} />
                    <Detail
                      label="Metadata extraction"
                      value={job.metadataExtractionStatus}
                    />
                    <Detail label="External match" value={job.externalMatchStatus} />
                    <Detail label="Review" value={job.reviewStatus} />
                    <Detail label="Duplicate" value={job.duplicateStatus} />
                  </dl>
                  {warnings.length > 0 ? (
                    <p className="mt-2 text-xs font-bold text-studio-gold">
                      Warnings: {warnings.join("; ")}
                    </p>
                  ) : null}
                  {blockers.length > 0 ? (
                    <p className="mt-2 text-xs font-bold text-red-200">
                      Blockers: {blockers.join("; ")}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-300">
            No batch intake queue records yet. Select PDF/DOCX files to create
            metadata-only queue records.
          </p>
        )}
      </div>
    </div>
  );
}

function ExternalMetadataMatchPreviewPanel({
  results
}: {
  results: ExternalMetadataMatchResult[];
}) {
  return (
    <div
      className="mt-4 border-2 border-studio-gold bg-studio-gold/10 p-3 text-sm leading-6 text-slate-200"
      data-testid="external-metadata-match-preview-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-gold">
            External Metadata Match Preview - Mock
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="external-metadata-match-mock-notice"
          >
            Mock provider only - no Crossref/OpenAlex/DOI/ISBN lookup is performed.
          </p>
        </div>
        <span className="status-pill">Preview only</span>
      </div>

      <ul
        className="mt-3 space-y-1 border-l-4 border-studio-blue bg-studio-blue/10 p-3 text-xs font-bold uppercase leading-5 text-studio-blue"
        data-testid="external-metadata-match-boundary-notices"
      >
        <li>External metadata is evidence, not truth.</li>
        <li>No metadata is overwritten.</li>
        <li>No SourceDocument or SourceCard is created automatically.</li>
        <li>Human approval will be required in a future sprint.</li>
      </ul>

      {results.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {results.map((result) => {
            const firstCandidate = result.providerCandidates[0] ?? null;
            const visibleCorrections = result.suggestedCorrections.slice(0, 5);

            return (
              <div
                className="border border-studio-line bg-studio-panel/80 p-2"
                data-testid="external-metadata-match-result"
                key={result.intakeJobId}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{result.fileName}</p>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      {result.matchStatus.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span
                    className="status-pill"
                    data-testid="external-metadata-match-confidence"
                  >
                    {result.confidenceBand} · {result.confidenceScore}
                  </span>
                </div>

                {firstCandidate ? (
                  <dl
                    className="mt-2 grid gap-1 text-xs"
                    data-testid="external-metadata-provider-candidates"
                  >
                    <Detail label="Provider" value={firstCandidate.provider.providerName} />
                    <Detail label="Provider mode" value="mock only" />
                    <Detail label="Matched title" value={firstCandidate.matchedTitle} />
                    <Detail
                      label="Suggested type"
                      value={firstCandidate.matchedSourceType}
                    />
                    <Detail
                      label="Raw provider ref"
                      value={firstCandidate.rawProviderRef}
                    />
                  </dl>
                ) : (
                  <p
                    className="mt-2 text-xs font-bold text-slate-300"
                    data-testid="external-metadata-provider-candidates"
                  >
                    No mock provider candidate for this queue record.
                  </p>
                )}

                <div
                  className="mt-3"
                  data-testid="external-metadata-suggested-corrections"
                >
                  <p className="text-xs font-black uppercase text-studio-blue">
                    Suggested Corrections
                  </p>
                  {visibleCorrections.length > 0 ? (
                    <ul className="mt-1 space-y-1 text-xs font-bold leading-5 text-slate-300">
                      {visibleCorrections.map((correction) => (
                        <li key={`${result.intakeJobId}-${correction.fieldName}`}>
                          {correction.fieldName}: {correction.suggestedValue} (
                          {correction.actionState})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">
                      No suggested corrections from this mock result.
                    </p>
                  )}
                </div>

                <p
                  className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-xs font-black uppercase leading-5 text-studio-gold"
                  data-testid="external-metadata-next-action"
                >
                  {result.nextAction}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-slate-300">
          No batch intake queue records are available for mock external metadata
          matching yet.
        </p>
      )}
    </div>
  );
}

function CrossrefFixtureCandidatePreviewPanel({
  results
}: {
  results: Array<{
    candidate: CrossrefFixtureCandidateResult;
    fileName: string;
    intakeJobId: string;
  }>;
}) {
  return (
    <div
      className="mt-4 border-2 border-studio-blue bg-studio-blue/10 p-3 text-sm leading-6 text-slate-200"
      data-testid="crossref-fixture-preview-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-blue">
            Crossref Read-Only Fixture Candidate Preview
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="crossref-fixture-boundary-badges"
          >
            Fixture only · no network · no API key · candidate only
          </p>
        </div>
        <span className="status-pill">Read-only</span>
      </div>

      <ul
        className="mt-3 space-y-1 border-l-4 border-studio-gold bg-studio-gold/10 p-3 text-xs font-bold uppercase leading-5 text-studio-gold"
        data-testid="crossref-fixture-boundary-notices"
      >
        <li>Crossref-shaped fixture data is evidence, not truth.</li>
        <li>No SourceCard or structured metadata is mutated.</li>
        <li>SourceCard citationText is not overwritten.</li>
        <li>APA-final verification is not set.</li>
        <li>No apply command is triggered.</li>
      </ul>

      {results.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {results.map(({ candidate, fileName, intakeJobId }) => {
            const normalized = candidate.normalizedCandidate;

            return (
              <div
                className="border border-studio-line bg-studio-panel/80 p-2"
                data-testid="crossref-fixture-candidate"
                key={`${intakeJobId}-${candidate.providerRecordRef}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{fileName}</p>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      {candidate.provider.providerName}
                    </p>
                  </div>
                  <span
                    className="status-pill"
                    data-testid="crossref-fixture-confidence"
                  >
                    {candidate.confidenceBand} · {candidate.confidenceScore}
                  </span>
                </div>

                <dl
                  className="mt-2 grid gap-1 text-xs"
                  data-testid="crossref-fixture-normalized-fields"
                >
                  <Detail label="Matched title" value={normalized.matchedTitle} />
                  <Detail label="Authors" value={normalized.matchedAuthors.join("; ")} />
                  <Detail label="Year" value={normalized.matchedYear ?? "Missing"} />
                  <Detail
                    label="Container"
                    value={
                      normalized.matchedJournal ??
                      normalized.matchedContainerTitle ??
                      "Missing"
                    }
                  />
                  <Detail label="Publisher" value={normalized.matchedPublisher ?? "Missing"} />
                  <Detail label="DOI" value={normalized.matchedDoi ?? "Missing"} />
                  <Detail label="URL" value={normalized.matchedUrl ?? "Missing"} />
                  <Detail label="Raw provider ref" value={normalized.rawProviderRef} />
                </dl>

                <div
                  className="mt-3 grid gap-2 text-xs"
                  data-testid="crossref-fixture-evidence-summary"
                >
                  <ListBlock
                    dataTestId="crossref-fixture-confidence-evidence"
                    emptyText="No confidence evidence."
                    items={candidate.confidenceEvidence}
                    title="Confidence evidence"
                  />
                  <ListBlock
                    dataTestId="crossref-fixture-raw-normalized-summary"
                    emptyText="No raw-vs-normalized summary."
                    items={candidate.rawVsNormalizedSummary}
                    title="Raw-vs-normalized summary"
                  />
                  <ListBlock
                    dataTestId="crossref-fixture-warnings"
                    emptyText="No warnings."
                    items={candidate.warnings}
                    title="Warnings"
                  />
                  <ListBlock
                    dataTestId="crossref-fixture-blockers"
                    emptyText="No blockers."
                    items={candidate.blockers}
                    title="Blockers"
                  />
                </div>

                <p
                  className="mt-3 border-l-4 border-studio-blue bg-studio-blue/10 p-2 text-xs font-black uppercase leading-5 text-studio-blue"
                  data-testid="crossref-fixture-raw-snapshot-notice"
                >
                  Raw fixture snapshot preserved · no overwrite allowed
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-slate-300">
          No Crossref fixture candidate yet. Create batch queue records to preview
          read-only fixture evidence.
        </p>
      )}
    </div>
  );
}

function SuggestedCorrectionsReviewQueuePanel({
  applyError,
  applyResult,
  auditEvents,
  dryRunError,
  dryRunResult,
  editedValues,
  error,
  isCreating,
  isCreatingCrossrefFixture,
  isApplyingCorrectionId,
  isRunningDryRunId,
  isUpdatingCorrectionId,
  notes,
  onApplyStructuredMetadata,
  onCreateCrossrefFixtureReviewQueue,
  onCreateReviewQueue,
  onEditedValueChange,
  onNoteChange,
  onReviewDecision,
  onRunDryRun,
  providerCandidateComparisons,
  providerEvidenceDetails,
  result,
  suggestedCorrections
}: {
  applyError: string | null;
  applyResult: ApplyMetadataCorrectionToStructuredBibliographicMetadataResult | null;
  auditEvents: SavedMetadataCorrectionAuditEvent[];
  dryRunError: string | null;
  dryRunResult: MetadataCorrectionApplyDryRunResult | null;
  editedValues: Record<string, string>;
  error: string | null;
  isCreating: boolean;
  isCreatingCrossrefFixture: boolean;
  isApplyingCorrectionId: string | null;
  isRunningDryRunId: string | null;
  isUpdatingCorrectionId: string | null;
  notes: Record<string, string>;
  onApplyStructuredMetadata: (dryRun: MetadataCorrectionApplyDryRunResult) => void;
  onCreateCrossrefFixtureReviewQueue: () => void;
  onCreateReviewQueue: () => void;
  onEditedValueChange: (correctionId: string, value: string) => void;
  onNoteChange: (correctionId: string, value: string) => void;
  onReviewDecision: (
    correction: SavedSuggestedMetadataCorrection,
    reviewDecision: SuggestedMetadataCorrectionReviewDecision
  ) => void;
  onRunDryRun: (correction: SavedSuggestedMetadataCorrection) => void;
  providerCandidateComparisons: ProviderCandidateComparisonRow[];
  providerEvidenceDetails: ProviderEvidenceDetail[];
  result: CreateMockExternalMetadataReviewQueueResult | null;
  suggestedCorrections: SavedSuggestedMetadataCorrection[];
}) {
  const summary = summarizeSuggestedCorrections(suggestedCorrections);
  const visibleCorrections = suggestedCorrections.slice(0, 6);
  const visibleAuditEvents = auditEvents.slice(0, 6);
  const canApplyStructuredMetadata =
    dryRunResult?.dryRunStatus === "ready_to_apply_later" &&
    dryRunResult.targetMetadataTable === "source_card_bibliographic_metadata" &&
    isAllowedStructuredMetadataApplyField(dryRunResult.targetFieldName);
  const isCompactSourceCardDryRun =
    dryRunResult?.targetMetadataTable === "source_cards" &&
    ["title", "authors", "year", "sourceType"].includes(dryRunResult.targetFieldName);
  const isStaleDryRun =
    dryRunResult?.dryRunStatus === "stale_current_value" ||
    dryRunResult?.blockers.some((blocker) =>
      blocker.includes("Current stored metadata differs")
    );
  const isAlreadyVerifiedDryRun = dryRunResult?.blockers.some((blocker) =>
    blocker.includes("already been applied")
  );

  return (
    <div
      className="mt-4 border-2 border-studio-blue bg-studio-blue/10 p-3 text-sm leading-6 text-slate-200"
      data-testid="suggested-corrections-review-queue-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-blue">
            Suggested Corrections Review Queue MVP
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="suggested-corrections-no-overwrite-notice"
          >
            No metadata is overwritten without explicit apply step.
          </p>
        </div>
        <span className="status-pill">Mock + Crossref fixture</span>
      </div>

      <ul
        className="mt-3 space-y-1 border-l-4 border-studio-gold bg-studio-gold/10 p-3 text-xs font-bold uppercase leading-5 text-studio-gold"
        data-testid="suggested-corrections-boundary-notices"
      >
        <li>External metadata is evidence, not truth.</li>
        <li>This sprint does not apply corrections to SourceCards.</li>
        <li>This sprint does not update structured bibliographic metadata.</li>
        <li>SourceCard citationText is not overwritten.</li>
        <li>Approval here means review decision only, not verified metadata application.</li>
        <li>Review queue only - not applied.</li>
      </ul>

      <button
        className="mt-3 w-full border-2 border-studio-blue bg-studio-blue/15 px-3 py-3 text-xs font-black uppercase text-studio-blue shadow-pixel disabled:opacity-60"
        data-testid="suggested-corrections-generate-button"
        disabled={isCreating || isCreatingCrossrefFixture}
        onClick={onCreateReviewQueue}
        type="button"
      >
        {isCreating
          ? "Generating persisted mock review queue..."
          : "Generate persisted mock review queue"}
      </button>

      <button
        className="mt-2 w-full border-2 border-studio-gold bg-studio-gold/15 px-3 py-3 text-xs font-black uppercase text-studio-gold shadow-pixel disabled:opacity-60"
        data-testid="crossref-fixture-review-queue-generate-button"
        disabled={isCreating || isCreatingCrossrefFixture}
        onClick={onCreateCrossrefFixtureReviewQueue}
        type="button"
      >
        {isCreatingCrossrefFixture
          ? "Generating Crossref fixture review queue..."
          : "Generate Crossref fixture review queue"}
      </button>

      {result ? (
        <div
          className="mt-3 grid grid-cols-3 gap-2"
          data-testid="suggested-corrections-create-result"
        >
          <SummaryStat label="Saved" value={result.saved ? "Yes" : "No"} />
          <SummaryStat label="Matches" value={result.matchResultCount} />
          <SummaryStat label="Corrections" value={result.correctionCount} />
        </div>
      ) : null}

      {error ? (
        <p
          className="mt-3 border-l-4 border-red-400 bg-red-500/10 p-2 font-black text-red-200"
          data-testid="suggested-corrections-error"
        >
          {error}
        </p>
      ) : null}

      <div
        className="mt-3 grid grid-cols-2 gap-2"
        data-testid="suggested-corrections-summary"
      >
        <SummaryStat label="Total" value={suggestedCorrections.length} />
        <SummaryStat label="Pending" value={summary.pending} />
        <SummaryStat label="Batch ready" value={summary.ready_for_batch_approval} />
        <SummaryStat label="Needs review" value={summary.needs_human_review} />
        <SummaryStat label="Low confidence" value={summary.low_confidence} />
        <SummaryStat label="Approved" value={summary.approved} />
        <SummaryStat label="Rejected" value={summary.rejected} />
        <SummaryStat label="Edited" value={summary.edited} />
        <SummaryStat label="Deferred" value={summary.deferred_needs_more_evidence} />
      </div>

      <ProviderCandidateComparisonPreviewPanel
        comparisons={providerCandidateComparisons}
      />

      <ProviderEvidenceDetailInspector details={providerEvidenceDetails} />

      <div
        className="mt-4 border border-studio-gold bg-studio-gold/10 p-3"
        data-testid="metadata-correction-audit-trail"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-studio-gold">
              Metadata Correction Audit Trail
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Append-only review history for suggested corrections.
            </p>
          </div>
          <span className="status-pill" data-testid="metadata-correction-audit-count">
            {auditEvents.length} events
          </span>
        </div>

        <ul
          className="mt-3 space-y-1 text-xs font-bold leading-5 text-studio-gold"
          data-testid="metadata-correction-audit-notices"
        >
          <li>Audit trail only - no metadata has been applied.</li>
          <li>Review approval is not verified metadata.</li>
          <li>SourceCard metadata is not changed in this sprint.</li>
          <li>Structured bibliographic metadata is not changed in this sprint.</li>
          <li>SourceCard citationText is not overwritten.</li>
          <li>APA-final verification is not set.</li>
        </ul>

        <div className="mt-3 grid gap-2">
          {visibleAuditEvents.length > 0 ? (
            visibleAuditEvents.map((event) => (
              <div
                className="border border-studio-line bg-studio-panel/80 p-2 text-xs"
                data-testid="metadata-correction-audit-event"
                key={event.auditEventId}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black uppercase text-white">{event.eventType}</p>
                  <span className="status-pill">{event.confidenceBand ?? "none"}</span>
                </div>
                <p className="mt-1 font-bold text-slate-300">{event.eventSummary}</p>
                <dl className="mt-2 grid gap-1">
                  <Detail label="Field" value={event.targetFieldName ?? "Unknown"} />
                  <Detail
                    label="Original ATP value"
                    value={event.originalAtpValue ?? "Missing"}
                  />
                  <Detail
                    label="Suggested value"
                    value={event.externalSuggestedValue ?? "Missing"}
                  />
                  <Detail
                    label="Reviewer edited value"
                    value={event.reviewerEditedValue ?? "None"}
                  />
                  <Detail label="Provider" value={event.providerName ?? "Unknown"} />
                  <Detail
                    label="Provider source"
                    value={providerSourceLabel(event.providerName ?? "")}
                  />
                  <Detail label="Created" value={event.createdAt} />
                </dl>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-300">
              No audit events yet. Generate the review queue or record a review decision.
            </p>
          )}
        </div>
      </div>

      <div
        className="mt-4 border border-studio-teal bg-studio-teal/10 p-3"
        data-testid="metadata-correction-dry-run-panel"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-studio-teal">
              Metadata Correction Apply Dry-Run
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Preflight only for a future explicit apply command.
            </p>
          </div>
          <span className="status-pill">
            {dryRunResult?.dryRunStatus ?? "not_run"}
          </span>
        </div>

        <ul
          className="mt-3 space-y-1 text-xs font-bold leading-5 text-studio-teal"
          data-testid="metadata-correction-dry-run-notices"
        >
          <li>Dry-run only - no metadata has been applied.</li>
          <li>Approval is not verified metadata.</li>
          <li>SourceCard metadata is not changed.</li>
          <li>Structured bibliographic metadata is not changed.</li>
          <li>SourceCard citationText is not overwritten.</li>
          <li>APA-final verification is not set.</li>
          <li>A future explicit apply command is still required.</li>
        </ul>

        {dryRunError ? (
          <p
            className="mt-3 border-l-4 border-red-400 bg-red-500/10 p-2 text-xs font-black text-red-200"
            data-testid="metadata-correction-dry-run-error"
          >
            {dryRunError}
          </p>
        ) : null}

        {dryRunResult ? (
          <div className="mt-3 grid gap-3" data-testid="metadata-correction-dry-run-result">
            <div className="grid grid-cols-2 gap-2">
              <SummaryStat label="Status" value={dryRunResult.dryRunStatus} />
              <SummaryStat label="Stale check" value={dryRunResult.staleCheckStatus} />
              <SummaryStat label="Target table" value={dryRunResult.targetMetadataTable} />
              <SummaryStat label="Target field" value={dryRunResult.targetFieldName} />
            </div>
            <dl className="grid gap-1 text-xs">
              <Detail
                label="Current stored value"
                value={dryRunResult.currentStoredValue ?? "Unavailable"}
              />
              <Detail
                label="Original correction value"
                value={dryRunResult.originalCorrectionValue ?? "Missing"}
              />
              <Detail label="Suggested value" value={dryRunResult.suggestedValue} />
              <Detail
                label="Reviewer edited value"
                value={dryRunResult.reviewerEditedValue ?? "None"}
              />
              <Detail
                label="Intended future apply value"
                value={dryRunResult.intendedApplyValue ?? "Blocked"}
              />
              <Detail label="Next action" value={dryRunResult.nextAction} />
              <Detail
                label="Audit event"
                value={
                  dryRunResult.auditEventWritten
                    ? dryRunResult.auditEventPreview
                    : "Preview only; audit event not written."
                }
              />
            </dl>
            <ListBlock
              dataTestId="metadata-correction-dry-run-blockers"
              emptyText="No dry-run blockers."
              items={dryRunResult.blockers}
              title="Blockers"
            />
            <ListBlock
              dataTestId="metadata-correction-dry-run-warnings"
              emptyText="No dry-run warnings."
              items={dryRunResult.warnings}
              title="Warnings"
            />
            <ListBlock
              dataTestId="metadata-correction-dry-run-policy"
              emptyText="No policy notices."
              items={dryRunResult.noOverwritePolicy}
              title="No-overwrite policy"
            />
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-300">
            No apply dry-run has been run yet. Use a correction row action below.
          </p>
        )}
      </div>

      <div
        className="mt-4 border border-studio-blue bg-studio-blue/10 p-3"
        data-testid="metadata-correction-structured-apply-panel"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-studio-blue">
              Structured Metadata Apply Boundary MVP
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Explicit apply for reviewed structured bibliographic fields only.
            </p>
          </div>
          <span className="status-pill">
            {applyResult?.applyStatus ?? (canApplyStructuredMetadata ? "ready" : "blocked")}
          </span>
        </div>

        <ul
          className="mt-3 space-y-1 text-xs font-bold leading-5 text-studio-blue"
          data-testid="metadata-correction-structured-apply-notices"
        >
          <li>Applies only to structured bibliographic metadata.</li>
          <li>SourceCard title/authors/year/sourceType are not changed.</li>
          <li>SourceCard citationText is not overwritten.</li>
          <li>APA-final verification is not set.</li>
          <li>DOCX export and DraftArtifacts are not changed.</li>
          <li>Real provider/API data is not used.</li>
          <li>No undo yet - audit trail only.</li>
          <li>Reversal/undo is planned, not implemented.</li>
        </ul>

        {isCompactSourceCardDryRun ? (
          <p
            className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-xs font-black text-studio-gold"
            data-testid="metadata-correction-structured-apply-blocked-message"
          >
            Compact SourceCard fields are blocked in 4I-6C.
          </p>
        ) : null}

        {applyError ? (
          <p
            className="mt-3 border-l-4 border-red-400 bg-red-500/10 p-2 text-xs font-black text-red-200"
            data-testid="metadata-correction-structured-apply-error"
          >
            {applyError}
          </p>
        ) : null}

        {isStaleDryRun ? (
          <p
            className="mt-3 border-l-4 border-red-400 bg-red-500/10 p-2 text-xs font-black text-red-200"
            data-testid="metadata-correction-stale-warning"
          >
            Stale conflict: current stored metadata differs from the correction
            original ATP value. Rerun review before apply.
          </p>
        ) : null}

        {isAlreadyVerifiedDryRun ? (
          <p
            className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-xs font-black text-studio-gold"
            data-testid="metadata-correction-already-verified-warning"
          >
            Already verified / already applied. Create a reversal or new
            correction before another apply.
          </p>
        ) : null}

        {dryRunResult ? (
          <div
            className="mt-3 grid grid-cols-2 gap-2"
            data-testid="metadata-correction-structured-apply-target"
          >
            <SummaryStat label="Correction ID" value={dryRunResult.correctionId} />
            <SummaryStat label="Dry-run status" value={dryRunResult.dryRunStatus} />
            <SummaryStat label="Target table" value={dryRunResult.targetMetadataTable} />
            <SummaryStat label="Target field" value={dryRunResult.targetFieldName} />
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-300">
            Run an apply dry-run on a reviewed correction before structured apply.
          </p>
        )}

        <button
          className="mt-3 w-full border border-studio-blue bg-studio-blue/10 px-2 py-2 text-xs font-black uppercase text-studio-blue disabled:opacity-60"
          data-testid="metadata-correction-structured-apply-button"
          disabled={
            !dryRunResult ||
            !canApplyStructuredMetadata ||
            isApplyingCorrectionId === dryRunResult.correctionId
          }
          onClick={() =>
            dryRunResult ? onApplyStructuredMetadata(dryRunResult) : undefined
          }
          type="button"
        >
          {dryRunResult && isApplyingCorrectionId === dryRunResult.correctionId
            ? "Applying structured metadata..."
            : "Apply to Structured Metadata"}
        </button>

        {applyResult ? (
          <div
            className="mt-3 grid gap-3 border border-studio-line bg-studio-panel/80 p-3 text-xs"
            data-testid="metadata-correction-structured-apply-result"
          >
            <div className="grid grid-cols-2 gap-2">
              <SummaryStat label="Apply status" value={applyResult.applyStatus} />
              <SummaryStat label="Correction ID" value={applyResult.correctionId} />
              <SummaryStat
                label="Read-back verified"
                value={applyResult.readBackVerified ? "yes" : "no"}
              />
              <SummaryStat label="Audit events" value={applyResult.auditEventCount} />
              <SummaryStat label="Target field" value={applyResult.targetFieldName} />
            </div>
            <dl className="grid gap-1">
              <Detail
                label="SourceCard ID"
                value={applyResult.sourceCardId ?? "Missing"}
              />
              <Detail
                label="Applied value"
                value={applyResult.appliedValue ?? "Not applied"}
              />
              <Detail
                label="Read-back value"
                value={applyResult.readBackValue ?? "Unavailable"}
              />
              <Detail label="Next action" value={applyResult.nextAction} />
              <Detail
                label="Correction verified state"
                value={applyResult.readBackVerified ? "verified" : "not verified"}
              />
            </dl>
            <ListBlock
              dataTestId="metadata-correction-structured-apply-blockers"
              emptyText="No apply blockers."
              items={applyResult.blockers}
              title="Blockers"
            />
            <ListBlock
              dataTestId="metadata-correction-structured-apply-warnings"
              emptyText="No apply warnings."
              items={applyResult.warnings}
              title="Warnings"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3" data-testid="suggested-corrections-list">
        {visibleCorrections.length > 0 ? (
          visibleCorrections.map((correction) => {
            const warnings = parseJsonStringArray(correction.warningFlagsJson);
            const isUpdating = isUpdatingCorrectionId === correction.correctionId;

            return (
              <div
                className="border border-studio-line bg-studio-panel/80 p-2"
                data-testid="suggested-correction-item"
                key={correction.correctionId}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black uppercase text-white">
                      {correction.fieldName}
                    </p>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      {correction.providerName}
                    </p>
                    <p
                      className="mt-1 text-xs font-black uppercase text-studio-gold"
                      data-testid="suggested-correction-provider-source"
                    >
                      {providerSourceLabel(correction.providerName)} -{" "}
                      {correction.providerRecordRef}
                    </p>
                  </div>
                  <span className="status-pill">
                    {correction.confidenceBand} · {correction.confidenceScore}
                  </span>
                </div>

                <dl className="mt-2 grid gap-1 text-xs">
                  <Detail
                    label="Current ATP value"
                    value={correction.currentValue ?? "Missing"}
                  />
                  <Detail label="Suggested value" value={correction.suggestedValue} />
                  <Detail label="Reason" value={correction.reason} />
                  <Detail label="Provider record ref" value={correction.providerRecordRef} />
                  <Detail label="Review status" value={correction.reviewStatus} />
                  <Detail label="Review decision" value={correction.reviewDecision} />
                </dl>

                {warnings.length > 0 ? (
                  <p className="mt-2 text-xs font-bold text-studio-gold">
                    Warnings: {warnings.slice(0, 2).join("; ")}
                  </p>
                ) : null}

                <button
                  className="mt-3 w-full border border-studio-blue bg-studio-blue/10 px-2 py-2 text-xs font-black uppercase text-studio-blue disabled:opacity-60"
                  data-testid="metadata-correction-dry-run-button"
                  disabled={isRunningDryRunId === correction.correctionId}
                  onClick={() => onRunDryRun(correction)}
                  type="button"
                >
                  {isRunningDryRunId === correction.correctionId
                    ? "Running apply dry-run..."
                    : "Run Apply Dry-Run"}
                </button>

                <div className="mt-3 grid gap-2">
                  <input
                    className="w-full border border-studio-line bg-studio-ink px-2 py-2 text-xs font-bold text-white"
                    data-testid="suggested-correction-edited-value-input"
                    onChange={(event) =>
                      onEditedValueChange(correction.correctionId, event.target.value)
                    }
                    placeholder="Edited value for edit-before-approval"
                    value={editedValues[correction.correctionId] ?? ""}
                  />
                  <input
                    className="w-full border border-studio-line bg-studio-ink px-2 py-2 text-xs font-bold text-white"
                    data-testid="suggested-correction-note-input"
                    onChange={(event) =>
                      onNoteChange(correction.correctionId, event.target.value)
                    }
                    placeholder="Reviewer note"
                    value={notes[correction.correctionId] ?? ""}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    className="border border-studio-teal bg-studio-teal/10 px-2 py-2 text-xs font-black uppercase text-studio-teal disabled:opacity-60"
                    data-testid="suggested-correction-approve-button"
                    disabled={isUpdating}
                    onClick={() =>
                      onReviewDecision(correction, "approved_suggested_value")
                    }
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="border border-red-300 bg-red-500/10 px-2 py-2 text-xs font-black uppercase text-red-200 disabled:opacity-60"
                    data-testid="suggested-correction-reject-button"
                    disabled={isUpdating}
                    onClick={() =>
                      onReviewDecision(correction, "rejected_suggested_value")
                    }
                    type="button"
                  >
                    Reject
                  </button>
                  <button
                    className="border border-studio-gold bg-studio-gold/10 px-2 py-2 text-xs font-black uppercase text-studio-gold disabled:opacity-60"
                    data-testid="suggested-correction-edit-button"
                    disabled={isUpdating}
                    onClick={() =>
                      onReviewDecision(correction, "edited_before_approval")
                    }
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="border border-slate-400 bg-slate-500/10 px-2 py-2 text-xs font-black uppercase text-slate-200 disabled:opacity-60"
                    data-testid="suggested-correction-defer-button"
                    disabled={isUpdating}
                    onClick={() =>
                      onReviewDecision(correction, "deferred_needs_more_evidence")
                    }
                    type="button"
                  >
                    Defer
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-slate-300">
            No persisted suggested corrections yet. Generate the mock review queue after
            creating batch intake records.
          </p>
        )}
      </div>
    </div>
  );
}

function ProviderCandidateComparisonPreviewPanel({
  comparisons
}: {
  comparisons: ProviderCandidateComparisonRow[];
}) {
  const visibleComparisons = comparisons;
  const stateSummary = summarizeProviderComparisons(comparisons);

  return (
    <div
      className="mt-4 border border-studio-blue bg-studio-blue/10 p-3"
      data-testid="provider-candidate-comparison-preview-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-studio-blue">
            Provider Candidate Comparison Preview
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="provider-candidate-comparison-provider-pair"
          >
            Mock Provider vs Crossref Fixture
          </p>
        </div>
        <span className="status-pill">Preview only</span>
      </div>

      <ul
        className="mt-3 space-y-1 border-l-4 border-studio-gold bg-studio-gold/10 p-3 text-xs font-bold uppercase leading-5 text-studio-gold"
        data-testid="provider-candidate-comparison-notices"
      >
        <li>Preview only.</li>
        <li>Provider agreement is not verification.</li>
        <li>Provider conflict requires human review.</li>
        <li>No metadata is applied.</li>
        <li>SourceCard citationText is never overwritten.</li>
        <li>No live network/API call.</li>
      </ul>

      <div
        className="mt-3 grid grid-cols-2 gap-2"
        data-testid="provider-candidate-comparison-summary"
      >
        <SummaryStat label="Rows" value={comparisons.length} />
        <SummaryStat label="Consensus" value={stateSummary.provider_consensus} />
        <SummaryStat label="Conflict" value={stateSummary.provider_conflict} />
        <SummaryStat label="Mock only" value={stateSummary.provider_only_mock} />
        <SummaryStat
          label="Fixture only"
          value={stateSummary.provider_only_crossref_fixture}
        />
        <SummaryStat
          label="Missing"
          value={stateSummary.missing_comparable_candidate}
        />
      </div>

      <div className="mt-3 grid gap-2" data-testid="provider-candidate-comparison-list">
        {visibleComparisons.length > 0 ? (
          visibleComparisons.map((comparison) => (
            <div
              className="border border-studio-line bg-studio-panel/80 p-2 text-xs"
              data-testid="provider-candidate-comparison-row"
              key={comparison.comparisonKey}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-black uppercase text-white">
                    {comparison.fieldName}
                  </p>
                  <p className="font-bold uppercase text-slate-400">
                    {comparison.targetMetadataTable}
                  </p>
                </div>
                <span
                  className="status-pill"
                  data-testid="provider-candidate-comparison-state"
                >
                  {comparison.state}
                </span>
              </div>

              <dl className="mt-2 grid gap-1">
                <Detail label="Intake job" value={comparison.intakeJobId} />
                <Detail
                  label="Mock value"
                  value={comparison.mockCandidate?.displayValue ?? "Missing"}
                />
                <Detail
                  label="Mock normalized"
                  value={comparison.mockCandidate?.normalizedValue ?? "Missing"}
                />
                <Detail
                  label="Mock confidence"
                  value={
                    comparison.mockCandidate
                      ? `${comparison.mockCandidate.confidenceBand} / ${comparison.mockCandidate.confidenceScore}`
                      : "Missing"
                  }
                />
                <Detail
                  label="Mock provider"
                  value={
                    comparison.mockCandidate
                      ? `${comparison.mockCandidate.providerName} (${comparison.mockCandidate.providerType})`
                      : "Missing"
                  }
                />
                <Detail
                  label="Crossref Fixture value"
                  value={
                    comparison.crossrefFixtureCandidate?.displayValue ?? "Missing"
                  }
                />
                <Detail
                  label="Crossref Fixture normalized"
                  value={
                    comparison.crossrefFixtureCandidate?.normalizedValue ?? "Missing"
                  }
                />
                <Detail
                  label="Crossref Fixture confidence"
                  value={
                    comparison.crossrefFixtureCandidate
                      ? `${comparison.crossrefFixtureCandidate.confidenceBand} / ${comparison.crossrefFixtureCandidate.confidenceScore}`
                      : "Missing"
                  }
                />
                <Detail
                  label="Crossref Fixture provider"
                  value={
                    comparison.crossrefFixtureCandidate
                      ? `${comparison.crossrefFixtureCandidate.providerName} (${comparison.crossrefFixtureCandidate.providerType})`
                      : "Missing"
                  }
                />
                <Detail label="Reason" value={comparison.reason} />
                <Detail label="Warnings" value={comparison.warningFlags.join("; ")} />
              </dl>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-300">
            No comparable provider rows yet. Generate the mock review queue and the
            Crossref fixture review queue to preview field-level comparison.
          </p>
        )}
      </div>
    </div>
  );
}

function ProviderEvidenceDetailInspector({
  details
}: {
  details: ProviderEvidenceDetail[];
}) {
  const visibleDetails = details;
  const providerSummary = summarizeProviderEvidenceDetails(details);

  return (
    <div
      className="mt-4 border border-studio-teal bg-studio-teal/10 p-3"
      data-testid="provider-evidence-detail-inspector"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-studio-teal">
            Provider Evidence Detail Inspector
          </p>
          <p className="mt-1 text-xs font-bold text-slate-300">
            Expand rows to inspect raw/display evidence, normalized comparison
            values, confidence evidence, and boundary flags.
          </p>
        </div>
        <span className="status-pill">Derived preview</span>
      </div>

      <ul
        className="mt-3 space-y-1 border-l-4 border-studio-gold bg-studio-gold/10 p-3 text-xs font-bold uppercase leading-5 text-studio-gold"
        data-testid="provider-evidence-detail-notices"
      >
        <li>Provider evidence is not metadata truth.</li>
        <li>Provider agreement is not verification.</li>
        <li>Human review remains required.</li>
        <li>No metadata is applied from this panel.</li>
        <li>SourceCard citationText is never overwritten.</li>
        <li>APA-final verification is not supported here.</li>
        <li>No live network/API call is used.</li>
      </ul>

      <div
        className="mt-3 border border-studio-line bg-studio-panel/80 p-3 text-xs leading-5 text-slate-200"
        data-testid="provider-evidence-raw-normalized-explanation"
      >
        <p>
          Raw value = provider evidence snapshot/display value. Normalized value =
          ATP comparison candidate. Neither is verified truth.
        </p>
      </div>

      <div
        className="mt-3 grid grid-cols-2 gap-2"
        data-testid="provider-evidence-detail-summary"
      >
        <SummaryStat label="Evidence rows" value={details.length} />
        <SummaryStat label="Mock Provider" value={providerSummary.mock_provider} />
        <SummaryStat
          label="Crossref Fixture"
          value={providerSummary.crossref_fixture}
        />
        <SummaryStat label="Other" value={providerSummary.other_provider} />
      </div>

      <div className="mt-3 grid gap-2" data-testid="provider-evidence-detail-list">
        {visibleDetails.length > 0 ? (
          visibleDetails.map((detail) => (
            <details
              className="border border-studio-line bg-studio-panel/80 p-2 text-xs"
              data-testid="provider-evidence-detail-row"
              key={detail.correctionId}
              open
            >
              <summary className="cursor-pointer font-black uppercase text-white">
                {detail.providerName} - {detail.targetField}
              </summary>

              <dl className="mt-2 grid gap-1">
                <Detail label="Provider source" value={detail.providerSource} />
                <Detail label="Provider type" value={detail.providerType} />
                <Detail label="Provider record ref" value={detail.providerRecordRef} />
                <Detail label="Target table" value={detail.targetTable} />
                <Detail label="Target field" value={detail.targetField} />
                <Detail
                  label="Current ATP value"
                  value={detail.currentAtpValue ?? "Missing"}
                />
                <Detail label="Raw/display value" value={detail.rawDisplayValue} />
                <Detail label="Normalized value" value={detail.normalizedValue} />
                <Detail
                  label="Confidence"
                  value={`${detail.confidenceBand} / ${detail.confidenceScore}`}
                />
                <Detail
                  label="Confidence evidence"
                  value={detail.confidenceEvidence.join("; ")}
                />
                <Detail
                  label="Mismatch reasons"
                  value={detail.mismatchReasons.join("; ") || "None"}
                />
                <Detail
                  label="Warning flags"
                  value={detail.warningFlags.join("; ") || "No warning flags."}
                />
                <Detail
                  label="Blocker flags"
                  value={detail.blockerFlags.join("; ") || "No blocker flags."}
                />
                <Detail
                  label="Fixture only"
                  value={detail.fixtureOnly ? "yes" : "no"}
                />
                <Detail label="No network" value={detail.noNetwork ? "yes" : "no"} />
                <Detail
                  label="No auto overwrite"
                  value={detail.noAutoOverwrite ? "yes" : "no"}
                />
              </dl>

              <div
                className="mt-2 border border-studio-line bg-studio-ink/70 p-2 font-mono text-[11px] leading-5 text-slate-300"
                data-testid="provider-evidence-raw-json-preview"
              >
                {detail.rawJsonPreview ?? detail.rawJsonUnavailableReason}
              </div>
            </details>
          ))
        ) : (
          <p className="text-xs text-slate-300">
            No provider evidence details yet. Generate provider review queue rows to
            inspect evidence.
          </p>
        )}
      </div>
    </div>
  );
}

function summarizeSuggestedCorrections(
  corrections: SavedSuggestedMetadataCorrection[]
): Record<string, number> {
  const summary: Record<string, number> = {
    approved: 0,
    deferred_needs_more_evidence: 0,
    edited: 0,
    low_confidence: 0,
    needs_human_review: 0,
    pending: 0,
    ready_for_batch_approval: 0,
    rejected: 0
  };

  for (const correction of corrections) {
    summary[correction.reviewStatus] = (summary[correction.reviewStatus] ?? 0) + 1;
  }

  return summary;
}

function summarizeProviderComparisons(
  comparisons: ProviderCandidateComparisonRow[]
): Record<ProviderCandidateComparisonRow["state"], number> {
  const summary: Record<ProviderCandidateComparisonRow["state"], number> = {
    missing_comparable_candidate: 0,
    provider_conflict: 0,
    provider_consensus: 0,
    provider_only_crossref_fixture: 0,
    provider_only_mock: 0
  };

  for (const comparison of comparisons) {
    summary[comparison.state] += 1;
  }

  return summary;
}

function summarizeProviderEvidenceDetails(
  details: ProviderEvidenceDetail[]
): Record<ProviderEvidenceDetail["providerSource"], number> {
  const summary: Record<ProviderEvidenceDetail["providerSource"], number> = {
    crossref_fixture: 0,
    mock_provider: 0,
    other_provider: 0
  };

  for (const detail of details) {
    summary[detail.providerSource] += 1;
  }

  return summary;
}

function isAllowedStructuredMetadataApplyField(fieldName: string): boolean {
  return [
    "publisher",
    "journal",
    "containerTitle",
    "edition",
    "volume",
    "issue",
    "pageRange",
    "doi",
    "url",
    "accessDate"
  ].includes(fieldName);
}

function localFileToBatchIntakeFile(
  file: LocalDocumentFileIntakeJob
): CreateBatchResearchIntakeJobFile {
  return {
    fileName: file.fileName,
    filePath: file.localPath,
    fileSize: file.fileSize,
    fileType: file.fileType ?? "UNKNOWN",
    intakeJobId: `batch-intake-${file.id}`,
    mimeType: file.mimeType,
    selectedAt: file.createdAt,
    warnings: file.warning ? [file.warning] : []
  };
}

function createQaBatchResearchIntakeFiles(): LocalDocumentFileIntakeJob[] {
  return [
    {
      ...qaDocxLocalFile,
      id: "qa-batch-docx-file",
      createdAt: "unix-ms:4100000000000"
    },
    {
      id: "qa-batch-pdf-file",
      fileName: "qa-service-quality-article.pdf",
      fileType: "PDF",
      mimeType: "application/pdf",
      fileSize: 98304,
      createdAt: "unix-ms:4100000001000",
      status: "not_started",
      warning: "PDF parser is not implemented; queue record only.",
      localPath: "qa-fixtures/qa-service-quality-article.pdf"
    }
  ];
}

function parseJsonStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function providerSourceLabel(providerName: string): string {
  const normalizedProviderName = providerName.toLowerCase();

  if (normalizedProviderName.includes("crossref read-only fixture")) {
    return "Crossref Fixture";
  }

  if (normalizedProviderName.includes("mock")) {
    return "Mock Provider";
  }

  return "External Provider";
}

function ListBlock({
  dataTestId,
  emptyText,
  items,
  title
}: {
  dataTestId: string;
  emptyText: string;
  items: string[];
  title: string;
}) {
  return (
    <div className="mt-3" data-testid={dataTestId}>
      <p className="text-xs font-black uppercase text-studio-blue">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 space-y-1 text-xs font-bold leading-5 text-slate-300">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-slate-400">{emptyText}</p>
      )}
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
            {isExtracting ? "Parsing DOCX MVP..." : "Parse DOCX MVP"}
          </button>
          <p className="mt-2 text-xs font-black uppercase leading-5 text-studio-gold">
            DOCX parser MVP — page numbers are not trusted. No SourceDocument is auto-saved.
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
      data-parser-panel="docx-parser-mvp"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-teal">
            DOCX Parser MVP Result
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="docx-parser-mvp-notice"
          >
            DOCX parser MVP — page numbers are not trusted. Review only; no SourceDocument, SourceCard, or Knowledge Card has been created.
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
  knowledgeCardReviewStatuses,
  marketingTagReviewStatuses,
  onKnowledgeCardReviewStatusChange,
  onMarketingTagReviewStatusChange,
  onReviewStatusChange,
  reviewStatus
}: {
  extractionResult: DocumentExtractionResponse | null;
  knowledgeCardReviewStatuses: Record<string, KnowledgeCardCandidateReviewStatus>;
  marketingTagReviewStatuses: Record<string, MarketingTagReviewStatus>;
  onKnowledgeCardReviewStatusChange: (
    candidateId: string,
    status: KnowledgeCardCandidateReviewStatus
  ) => void;
  onMarketingTagReviewStatusChange: (
    termId: string,
    status: MarketingTagReviewStatus
  ) => void;
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
    parserProvenance,
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
  const sourceCardForTagSuggestion = createSourceCardCandidatePreview({
    candidate,
    extraction,
    isBlocked: false,
    segments
  });
  const marketingTagSuggestions = suggestMarketingTags({
    cleanedText: extraction.cleanedText,
    sourceCardCandidate: sourceCardForTagSuggestion,
    sourceDocumentCandidate: candidate
  });
  const reviewedMarketingTags = createReviewedTags(
    marketingTagSuggestions,
    marketingTagReviewStatuses
  );
  const approvedMarketingTags = getApprovedTagLabels(reviewedMarketingTags);

  return (
    <div
      className="mt-4 border-2 border-studio-gold bg-studio-gold/10 p-3 text-sm leading-6 text-slate-200"
      data-testid="source-document-candidate-preview"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase text-studio-gold">
            {parserProvenance?.parserSource === "real_docx_parser_mvp"
              ? "Real DOCX SourceDocument Candidate"
              : "SourceDocument Candidate Preview"}
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-rose"
            data-testid="source-document-candidate-only-notice"
          >
            Candidate only — not saved to Knowledge Vault.
          </p>
        </div>
        <span className="status-pill">{candidateReviewLabels[reviewStatus]}</span>
      </div>

      <dl className="mt-4 grid gap-2">
        <Detail label="Proposed title" value={candidate.title ?? "Review required"} />
        <Detail label="Source type" value={candidate.fileType ?? "DOCX"} />
        <Detail
          label="Parser source"
          value={parserProvenance?.parserSource ?? "mock extraction preview"}
        />
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
        {parserProvenance ? (
          <dl
            className="mt-3 grid gap-2"
            data-testid="real-docx-candidate-provenance"
          >
            <Detail label="Parser source" value={parserProvenance.parserSource} />
            <Detail label="Trace policy" value={parserProvenance.tracePolicy} />
            <Detail
              label="Page-number policy"
              value={parserProvenance.pageNumberPolicy}
            />
            <Detail label="Local path policy" value={parserProvenance.localPathPolicy} />
          </dl>
        ) : null}
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
      <MarketingTagSuggestionPreview
        onReviewStatusChange={onMarketingTagReviewStatusChange}
        reviewStatuses={marketingTagReviewStatuses}
        tagSuggestions={marketingTagSuggestions}
      />
      <SourceCardCandidatePreview
        approvedMarketingTags={approvedMarketingTags}
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
      <KnowledgeCardCandidatePreview
        approvedMarketingTags={approvedMarketingTags}
        candidate={candidate}
        extraction={extraction}
        isReviewApproved={reviewStatus === "approved"}
        isValidationReady={
          validationSummary.status === "ready_for_future_vault_save"
        }
        parserWarnings={parserWarnings}
        readinessWarnings={readiness.warnings}
        reviewStatuses={knowledgeCardReviewStatuses}
        onReviewStatusChange={onKnowledgeCardReviewStatusChange}
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
        Candidate only — not saved until explicitly approved. No SourceDocument, SourceCard, or Knowledge Card has been created.
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

  const parsedCandidatePreview =
    extractionResult.fileIntakeJob.fileType === "DOCX"
      ? mapParsedDocxToSourceDocumentCandidate({ extractionResponse: extractionResult })
      : null;
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
    candidate:
      parsedCandidatePreview?.candidate ??
      documentExtractionToSourceDocumentCandidate(mappingInput),
    extraction: extractionResult.extraction,
    parserProvenance: parsedCandidatePreview?.parserProvenance,
    parserWarningCount: extractionResult.parserWarnings.length,
    parserWarnings: parsedCandidatePreview?.warnings ?? extractionResult.parserWarnings,
    readiness:
      parsedCandidatePreview?.readiness ??
      summarizeDocumentExtractionReadiness(mappingInput),
    segments: parsedCandidatePreview?.extractionSegments ?? extractionResult.segments,
    traces: parsedCandidatePreview?.evidenceTraces ?? extractionResult.traces
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
  hasRealParsedDocxSource,
  onPatchSourceCard,
  onResetSourceCard,
  realContextState,
  rootRef,
  source,
  sourceCard,
  selectedIntake,
  validation
}: {
  hasRealParsedDocxSource: boolean;
  onPatchSourceCard: (sourceId: string, patch: Partial<SourceCard>) => void;
  onResetSourceCard: (sourceDocument: SourceDocument) => void;
  realContextState: RealSourceContextState;
  rootRef: MutableElementRef;
  source: SourceDocument;
  sourceCard: SourceCard;
  selectedIntake: IntakeSourceRecord;
  validation: SourceValidationResult;
}) {
  const hasMappedSourceDocument = source.id === sourceCard.sourceId;

  return (
    <aside
      className="pixel-panel flex min-h-0 flex-col overflow-hidden p-3"
      data-testid="source-library-context-inspector"
      ref={(node) => {
        rootRef.current = node;
      }}
      tabIndex={-1}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="panel-label">Context Inspector</p>
          <h3 className="mt-1 line-clamp-2 text-base font-black leading-6 text-white">
            {hasRealParsedDocxSource ? sourceCard.title : "No real source selected yet"}
          </h3>
        </div>
        <span className={hasRealParsedDocxSource ? "status-pill" : "mock-badge"}>
          {hasRealParsedDocxSource ? sourceCard.sourceType : "mock secondary"}
        </span>
      </div>

      {hasRealParsedDocxSource ? (
        <div
          className="mt-3 border-2 border-studio-teal bg-studio-teal/10 p-2"
          data-testid="source-library-real-source-context"
        >
          <p className="text-xs font-black uppercase text-studio-teal">
            Real parsed-DOCX context
          </p>
          <dl className="mt-2 grid gap-1.5 text-xs">
            <Detail label="SourceDocument" value={realContextState.sourceDocumentStatus} />
            <Detail label="SourceCard" value={realContextState.sourceCardStatus} />
            <Detail label="Metadata review" value={realContextState.metadataReviewState} />
            <Detail label="KnowledgeCards" value={realContextState.knowledgeCardStatus} />
            <Detail label="DraftArtifact" value={realContextState.draftArtifactStatus} />
          </dl>
        </div>
      ) : (
        <div
          className="mt-3 border-2 border-studio-gold bg-studio-gold/10 p-2 text-xs font-bold leading-5 text-studio-gold"
          data-testid="source-library-real-mock-separation"
        >
          <p className="font-black uppercase">No real source selected yet</p>
          <p className="mt-1 text-slate-200">
            Paste a DOCX path and run parsing to create the active real workflow
            context. Mock source detail remains reachable below as secondary sample data.
          </p>
        </div>
      )}

      <div className="mt-3 border-2 border-studio-line bg-studio-ink/70 p-2">
        <p className="text-xs font-black uppercase text-studio-gold">
          Linked Chapter Sections
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
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

      <div className="mt-3 border-2 border-studio-gold bg-studio-gold/10 p-2 text-xs leading-5 text-slate-200">
        <p className="font-black uppercase text-studio-gold">Mock Boundary</p>
        <p className="mt-1">
          Mock source detail is secondary/sample. Real extraction, OCR, DOI lookup,
          and citation validation are intentionally disabled.
        </p>
      </div>

      <div
        className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1"
        data-testid="source-library-context-inspector-scroll"
      >
      <details className="border-2 border-studio-blue bg-studio-blue/10 p-2">
        <summary className="cursor-pointer text-xs font-black uppercase text-studio-blue">
          Selected intake context
        </summary>
        <SelectedIntakeDetail intakeSource={selectedIntake} />
      </details>

      <details className="mt-3 border-2 border-studio-teal bg-studio-teal/10 p-2">
        <summary className="cursor-pointer text-xs font-black uppercase text-studio-teal">
          Mock source card preview and editor
        </summary>
      <div className="mt-3 text-sm leading-6 text-slate-200">
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
      </details>
      </div>
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
