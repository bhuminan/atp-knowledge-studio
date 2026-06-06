import { useMemo, useRef, useState } from "react";
import {
  createSourceDocumentIntakeSaveCandidatePreview,
  type SourceDocumentIntakeSaveCandidate,
  type SourceDocumentIntakeSaveCandidateBlocker,
  type SourceDocumentIntakeSaveCandidateReadiness,
  type SourceDocumentIntakeSaveCandidateWarning
} from "../../../lib/sources/SourceDocumentIntakeSaveCandidateMapper";
import {
  evaluateSourceDocumentMetadataReadiness,
  type SourceDocumentMetadataReadinessStatus
} from "../../../lib/sources/SourceDocumentMetadataReadinessMapper";
import {
  evaluateSourceCardMetadataReviewGate,
  type SourceCardMetadataReviewGateChecklistStatus,
  type SourceCardMetadataReviewGateStatus
} from "../../../lib/sources/SourceCardMetadataReviewGateMapper";
import {
  createSourceCardMetadataCompletionPreview,
  type SourceCardMetadataCompletionFieldStatus
} from "../../../lib/sources/SourceCardMetadataCompletionPreviewMapper";
import {
  getSourceCardMetadataReview,
  listIntakeSourceDocumentAuditEvents,
  listSavedSourceDocuments,
  listSourceCardMetadataReviewAuditEvents,
  listSourceCardMetadataReviewsForSourceDocument,
  readSavedSourceDocumentRoot,
  saveIntakeSourceDocumentCandidates,
  type SavedIntakeSourceDocumentAuditEvent,
  type SavedSourceCardMetadataReviewAuditEvent,
  type SavedSourceCardMetadataReviewRecord,
  type SavedSourceDocumentListItem,
  type SavedSourceDocumentRecord,
  type SaveIntakeSourceDocumentCandidatesResult
} from "../../../lib/persistence/LocalVaultDatabase";
import { SummaryStat } from "./SourceLibraryPrimitives";

type IncomingPackagePreviewStatus = "ready" | "needs_metadata" | "blocked";
type IncomingPackagePreflightStatus = "passed" | "needs_review" | "blocked";

interface IncomingPackagePreviewCategory {
  count: number;
  label: string;
  status: IncomingPackagePreviewStatus;
}

interface IncomingPackagePreflightCheck {
  label: string;
  status: IncomingPackagePreflightStatus;
}

const incomingPackagePreviewMock = {
  id: "demo-input-package-preview",
  source: "INPUT Room",
  destination: "Source Library Intake",
  categories: [
    {
      count: 2,
      label: "Ready for future intake review",
      status: "ready"
    },
    {
      count: 1,
      label: "Needs metadata review",
      status: "needs_metadata"
    },
    {
      count: 1,
      label: "Blocked / unsupported",
      status: "blocked"
    }
  ] satisfies IncomingPackagePreviewCategory[],
  workflowSteps: [
    "INPUT Room prepares reviewed package",
    "Source Library receives candidate package",
    "User reviews metadata/readiness",
    "Future approval creates real records"
  ],
  safetyFlags: [
    "No files received",
    "No SourceDocument created",
    "No SourceCard created",
    "No metadata persisted",
    "No parser, AI, API, or network call"
  ]
};

const incomingPackagePreflightMock = {
  statusLabel: "Needs review before future intake",
  checks: [
    {
      label: "Package reviewed by user",
      status: "needs_review"
    },
    {
      label: "Unsupported files removed or blocked",
      status: "blocked"
    },
    {
      label: "Metadata review required for each candidate",
      status: "needs_review"
    },
    {
      label: "Explicit approval required before SourceDocument creation",
      status: "blocked"
    },
    {
      label: "Explicit approval required before SourceCard creation",
      status: "blocked"
    },
    {
      label: "Audit event required before future persistence",
      status: "needs_review"
    },
    {
      label: "Parser, AI, and classification remain disabled",
      status: "passed"
    }
  ] satisfies IncomingPackagePreflightCheck[],
  boundaryCopy: [
    "No package has been received from INPUT Room.",
    "This is a preflight preview only.",
    "No SourceDocument or SourceCard will be created in this sprint.",
    "Future persistence requires explicit user approval and audit trail.",
    "Real parser, classification, and AI remain disabled."
  ]
};

const sourceDocumentIntakeSaveCandidatePreviewMock =
  createSourceDocumentIntakeSaveCandidatePreview({
    candidates: [
      {
        candidateId: "incoming-source-document-candidate-001",
        fileName: "servicescape-theory-review.pdf",
        fileSizeLabel: "1.8 MB",
        fileType: "PDF",
        metadataCompleteness: "complete",
        reviewStatus: "approved_for_source_document_preview",
        title: "Servicescape theory review"
      },
      {
        candidateId: "incoming-source-document-candidate-002",
        fileName: "brand-equity-methods.docx",
        fileSizeLabel: "842 KB",
        fileType: "DOCX",
        metadataCompleteness: "incomplete",
        reviewStatus: "approved_for_source_document_preview",
        title: "Brand equity methods notes"
      },
      {
        candidateId: "incoming-source-document-candidate-003",
        fileName: "field-photo.png",
        fileSizeLabel: "320 KB",
        fileType: "PNG",
        metadataCompleteness: "missing",
        reviewStatus: "blocked",
        title: "Field photo"
      }
    ],
    packageId: incomingPackagePreviewMock.id,
    source: "INPUT Room"
  });

const categoryToneClasses: Record<IncomingPackagePreviewStatus, string> = {
  blocked: "border-studio-rose bg-studio-rose/10 text-studio-rose",
  needs_metadata: "border-studio-gold bg-studio-gold/10 text-studio-gold",
  ready: "border-studio-teal bg-studio-teal/10 text-studio-teal"
};

const preflightToneClasses: Record<IncomingPackagePreflightStatus, string> = {
  blocked: "border-studio-rose bg-studio-rose/10 text-studio-rose",
  needs_review: "border-studio-gold bg-studio-gold/10 text-studio-gold",
  passed: "border-studio-teal bg-studio-teal/10 text-studio-teal"
};

const preflightStatusLabels: Record<IncomingPackagePreflightStatus, string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  passed: "Passed"
};

const sourceDocumentCandidateToneClasses: Record<
  SourceDocumentIntakeSaveCandidateReadiness,
  string
> = {
  blocked: "border-studio-rose bg-studio-rose/10 text-studio-rose",
  needs_review: "border-studio-gold bg-studio-gold/10 text-studio-gold",
  ready: "border-studio-teal bg-studio-teal/10 text-studio-teal"
};

const sourceDocumentCandidateBlockerLabels: Record<
  SourceDocumentIntakeSaveCandidateBlocker,
  string
> = {
  candidate_blocked: "Candidate is blocked",
  duplicate_candidate_detected: "Duplicate candidate detected",
  empty_file: "File is empty",
  file_extension_mismatch: "File extension does not match file type",
  missing_file_name: "Missing file name",
  missing_file_path: "Missing file path",
  missing_title: "Missing title",
  unsupported_file_type: "Unsupported file type"
};

const sourceDocumentCandidateWarningLabels: Record<
  SourceDocumentIntakeSaveCandidateWarning,
  string
> = {
  apa_final_not_implied: "APA-final readiness is not implied",
  citation_metadata_not_final: "Citation metadata is not final",
  docx_supported_for_current_text_preview: "DOCX is supported for current text preview",
  metadata_incomplete: "Metadata needs review",
  parser_disabled: "Parser remains disabled",
  pdf_text_extraction_not_available_yet: "PDF text extraction is not available yet",
  source_card_deferred: "SourceCard remains deferred"
};

export function SourceLibraryIncomingPackagePreview() {
  const preflightSummary = buildIncomingPackagePreflightPreview(
    incomingPackagePreflightMock.checks
  );

  return (
    <section
      className="mt-3 border-2 border-studio-blue bg-studio-blue/10 p-3 shadow-pixel"
      data-testid="source-library-incoming-package-preview"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-blue">
            Incoming package preview
          </p>
          <p className="mt-1 text-xs font-black uppercase text-studio-gold">
            Demo receiving desk only
          </p>
        </div>
        <span className="mock-badge">No package received</span>
      </div>

      <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
        Preview only -- no INPUT package has been received or saved.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {incomingPackagePreviewMock.categories.map((category) => (
          <SummaryStat
            key={category.status}
            label={category.label}
            value={category.count}
          />
        ))}
      </div>

      <div className="mt-3 grid gap-1.5 text-xs font-black uppercase leading-5">
        {incomingPackagePreviewMock.categories.map((category) => (
          <span
            className={`border-2 px-2 py-1.5 ${categoryToneClasses[category.status]}`}
            key={category.status}
          >
            {category.label}: {category.count}
          </span>
        ))}
      </div>

      <div className="mt-3 border-t-2 border-studio-line pt-3">
        <p className="text-xs font-black uppercase text-slate-400">
          Future review path
        </p>
        <ol className="mt-2 grid gap-1.5 text-xs font-bold leading-5 text-slate-300">
          {incomingPackagePreviewMock.workflowSteps.map((step) => (
            <li className="border border-studio-line bg-studio-ink/50 px-2 py-1" key={step}>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {incomingPackagePreviewMock.safetyFlags.map((flag) => (
          <span className="status-pill" key={flag}>
            {flag}
          </span>
        ))}
      </div>

      <p className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 px-2 py-1.5 text-xs font-black leading-5 text-slate-200">
        Only explicit future approval may create SourceDocument or SourceCard records.
      </p>

      <SourceDocumentIntakeSaveCandidatePreviewPanel
        preview={sourceDocumentIntakeSaveCandidatePreviewMock}
      />

      <div
        className="mt-3 border-t-2 border-studio-line pt-3"
        data-testid="source-library-incoming-package-preflight"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-studio-blue">
              Future intake approval gate
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {incomingPackagePreflightMock.statusLabel}
            </p>
          </div>
          <span className="mock-badge">Preflight only</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SummaryStat label="Checklist passed" value={preflightSummary.passedCount} />
          <SummaryStat
            label="Needs review"
            value={preflightSummary.needsReviewCount}
          />
          <SummaryStat label="Blocked" value={preflightSummary.blockedCount} />
        </div>

        <div className="mt-3 grid gap-1.5 text-xs font-black uppercase leading-5">
          {incomingPackagePreflightMock.checks.map((check) => (
            <span
              className={`border-2 px-2 py-1.5 ${preflightToneClasses[check.status]}`}
              key={check.label}
            >
              {preflightStatusLabels[check.status]} -- {check.label}
            </span>
          ))}
        </div>

        <div className="mt-3 grid gap-1 text-xs font-bold leading-5 text-slate-300">
          {incomingPackagePreflightMock.boundaryCopy.map((copy) => (
            <p key={copy}>{copy}</p>
          ))}
        </div>

        <button
          className="mt-3 w-full border-2 border-studio-line bg-studio-ink/60 px-3 py-2 text-xs font-black uppercase text-slate-500 shadow-pixel disabled:cursor-not-allowed disabled:opacity-60"
          disabled
          type="button"
        >
          Future: Approve intake package
        </button>
      </div>
    </section>
  );
}

function SourceDocumentIntakeSaveCandidatePreviewPanel({
  preview
}: {
  preview: typeof sourceDocumentIntakeSaveCandidatePreviewMock;
}) {
  const { safetyFlags, summary } = preview;
  const [explicitApprovalChecked, setExplicitApprovalChecked] = useState(false);
  const [safetyAcknowledgementChecked, setSafetyAcknowledgementChecked] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveResult, setSaveResult] =
    useState<SaveIntakeSourceDocumentCandidatesResult | null>(null);
  const [savedSourceDocuments, setSavedSourceDocuments] = useState<
    SavedSourceDocumentListItem[]
  >([]);
  const [selectedSavedSourceDocument, setSelectedSavedSourceDocument] =
    useState<SavedSourceDocumentRecord | null>(null);
  const [selectedIntakeAuditEvents, setSelectedIntakeAuditEvents] = useState<
    SavedIntakeSourceDocumentAuditEvent[]
  >([]);
  const [selectedMetadataReviewRecords, setSelectedMetadataReviewRecords] =
    useState<SavedSourceCardMetadataReviewRecord[]>([]);
  const [
    selectedMetadataReviewAuditEvents,
    setSelectedMetadataReviewAuditEvents
  ] = useState<SavedSourceCardMetadataReviewAuditEvent[]>([]);
  const [
    selectedMetadataReviewRecordDetail,
    setSelectedMetadataReviewRecordDetail
  ] = useState<SavedSourceCardMetadataReviewRecord | null>(null);
  const [savedSourceDocumentReadError, setSavedSourceDocumentReadError] =
    useState<string | null>(null);
  const [intakeAuditTraceError, setIntakeAuditTraceError] = useState<string | null>(
    null
  );
  const [metadataReviewStatusError, setMetadataReviewStatusError] = useState<
    string | null
  >(null);
  const [staleSavedSourceDocumentNotice, setStaleSavedSourceDocumentNotice] =
    useState<string | null>(null);
  const [isRefreshingSavedSourceDocuments, setIsRefreshingSavedSourceDocuments] =
    useState(false);
  const [isReadingSavedSourceDocument, setIsReadingSavedSourceDocument] =
    useState(false);
  const [isReadingIntakeAuditTrace, setIsReadingIntakeAuditTrace] = useState(false);
  const [isReadingMetadataReviewStatus, setIsReadingMetadataReviewStatus] =
    useState(false);
  const saveInFlightRef = useRef(false);
  const saveCandidates = useMemo(
    () => preview.candidates.filter(isReadySourceDocumentSaveCandidate),
    [preview.candidates]
  );
  const excludedCandidateCount = preview.candidates.length - saveCandidates.length;
  const saveEnabled =
    saveCandidates.length > 0 &&
    explicitApprovalChecked &&
    safetyAcknowledgementChecked &&
    !isSaving;

  async function handleSaveSourceDocuments() {
    if (!saveEnabled || saveInFlightRef.current) {
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    const qaRepeatSave = Boolean(
      saveResult?.candidateResults.some((candidateResult) =>
        ["saved", "already_exists"].includes(candidateResult.status)
      )
    );
    setSaveResult(null);

    try {
      if (isSourceLibraryQaModeEnabled()) {
        const qaResult = createQaIntakeSourceDocumentSaveResult(
          preview,
          saveCandidates,
          qaRepeatSave ? "already_exists" : "saved"
        );
        setSaveResult(qaResult);
        hydrateQaSavedSourceDocuments(qaResult);
        return;
      }

      const result = await saveIntakeSourceDocumentCandidates({
        candidates: saveCandidates.map(mapSourceDocumentIntakeSaveCandidateToSavePayload),
        intendedDestination: "Source Library Intake",
        packageId: preview.packageId,
        source: preview.source
      });
      setSaveResult(result);
      if (result.saved) {
        await refreshSavedSourceDocuments(result);
      }
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save SourceDocument intake candidates."
      );
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  function hydrateQaSavedSourceDocuments(
    result: SaveIntakeSourceDocumentCandidatesResult
  ) {
    const qaSavedDocuments = createQaSavedSourceDocumentRootList(result);
    setSavedSourceDocuments(qaSavedDocuments);
    setSelectedSavedSourceDocument(createQaSavedSourceDocumentRoot(result));
    setSelectedIntakeAuditEvents(createQaIntakeAuditEvents(result));
    setSelectedMetadataReviewRecords([]);
    setSelectedMetadataReviewAuditEvents([]);
    setSelectedMetadataReviewRecordDetail(null);
    setSavedSourceDocumentReadError(null);
    setIntakeAuditTraceError(null);
    setMetadataReviewStatusError(null);
    setStaleSavedSourceDocumentNotice(null);
  }

  async function refreshSavedSourceDocuments(
    preferredResult: SaveIntakeSourceDocumentCandidatesResult | null = saveResult
  ) {
    setIsRefreshingSavedSourceDocuments(true);
    setSavedSourceDocumentReadError(null);
    setIntakeAuditTraceError(null);
    setMetadataReviewStatusError(null);
    setStaleSavedSourceDocumentNotice(null);
    const hadSelectedSourceDocument = Boolean(selectedSavedSourceDocument);

    try {
      if (isSourceLibraryQaModeEnabled()) {
        if (preferredResult?.saved) {
          hydrateQaSavedSourceDocuments(preferredResult);
        } else {
          setSavedSourceDocuments([]);
          setSelectedSavedSourceDocument(null);
          setSelectedIntakeAuditEvents([]);
          setSelectedMetadataReviewRecords([]);
          setSelectedMetadataReviewAuditEvents([]);
          setSelectedMetadataReviewRecordDetail(null);
          setStaleSavedSourceDocumentNotice(
            hadSelectedSourceDocument
              ? "Previously selected SourceDocument is no longer listed after refresh. Metadata review status was cleared and no records were modified."
              : null
          );
        }
        return;
      }

      const savedDocuments = await listSavedSourceDocuments();
      setSavedSourceDocuments(savedDocuments);

      const preferredSourceDocumentId =
        preferredResult?.candidateResults.find(
          (candidateResult) => candidateResult.sourceDocumentId
        )?.sourceDocumentId ?? selectedSavedSourceDocument?.sourceDocumentId;
      const targetDocument =
        savedDocuments.find(
          (savedDocument) =>
            savedDocument.sourceDocumentId === preferredSourceDocumentId
        ) ?? savedDocuments[0];

      if (targetDocument) {
        setStaleSavedSourceDocumentNotice(null);
        await selectSavedSourceDocument(targetDocument.sourceDocumentId);
      } else {
        setSelectedSavedSourceDocument(null);
        setSelectedIntakeAuditEvents([]);
        setSelectedMetadataReviewRecords([]);
        setSelectedMetadataReviewAuditEvents([]);
        setSelectedMetadataReviewRecordDetail(null);
        setStaleSavedSourceDocumentNotice(
          hadSelectedSourceDocument
            ? "Previously selected SourceDocument is no longer listed after refresh. Metadata review status was cleared and no records were modified."
            : null
        );
      }
    } catch (error) {
      setSavedSourceDocuments([]);
      setSelectedSavedSourceDocument(null);
      setSelectedIntakeAuditEvents([]);
      setSelectedMetadataReviewRecords([]);
      setSelectedMetadataReviewAuditEvents([]);
      setSelectedMetadataReviewRecordDetail(null);
      setStaleSavedSourceDocumentNotice(null);
      setSavedSourceDocumentReadError(formatSavedSourceDocumentReadError(error));
    } finally {
      setIsRefreshingSavedSourceDocuments(false);
    }
  }

  async function selectSavedSourceDocument(sourceDocumentId: string) {
    setSavedSourceDocumentReadError(null);
    setIntakeAuditTraceError(null);
    setMetadataReviewStatusError(null);
    setStaleSavedSourceDocumentNotice(null);
    setSelectedIntakeAuditEvents([]);
    setSelectedMetadataReviewRecords([]);
    setSelectedMetadataReviewAuditEvents([]);
    setSelectedMetadataReviewRecordDetail(null);
    setIsReadingSavedSourceDocument(true);

    try {
      if (isSourceLibraryQaModeEnabled() && saveResult?.saved) {
        const qaDetail = createQaSavedSourceDocumentRoot(saveResult);
        setSelectedSavedSourceDocument(qaDetail);
        setSelectedIntakeAuditEvents(createQaIntakeAuditEvents(saveResult));
        setSelectedMetadataReviewRecords([]);
        setSelectedMetadataReviewAuditEvents([]);
        setSelectedMetadataReviewRecordDetail(null);
        return;
      }

      const detail = await readSavedSourceDocumentRoot(sourceDocumentId);
      setSelectedSavedSourceDocument(detail);
      setIsReadingSavedSourceDocument(false);
      await refreshIntakeAuditTrace(detail);
      await refreshSourceCardMetadataReviewStatus(detail);
    } catch (error) {
      setSelectedSavedSourceDocument(null);
      setSelectedIntakeAuditEvents([]);
      setSelectedMetadataReviewRecords([]);
      setSelectedMetadataReviewAuditEvents([]);
      setSelectedMetadataReviewRecordDetail(null);
      setSavedSourceDocumentReadError(formatSavedSourceDocumentReadError(error));
    } finally {
      setIsReadingSavedSourceDocument(false);
    }
  }

  async function refreshIntakeAuditTrace(detail: SavedSourceDocumentRecord) {
    if (!detail.createdFromCandidateId) {
      setSelectedIntakeAuditEvents([]);
      return;
    }

    setIsReadingIntakeAuditTrace(true);
    try {
      const auditResult = await listIntakeSourceDocumentAuditEvents({
        candidateId: detail.createdFromCandidateId
      });
      setSelectedIntakeAuditEvents(
        auditResult.events.filter(
          (event) =>
            !event.sourceDocumentId ||
            event.sourceDocumentId === detail.sourceDocumentId
        )
      );
    } catch (error) {
      setSelectedIntakeAuditEvents([]);
      setIntakeAuditTraceError(formatSavedSourceDocumentReadError(error));
    } finally {
      setIsReadingIntakeAuditTrace(false);
    }
  }

  async function refreshSourceCardMetadataReviewStatus(
    detail: SavedSourceDocumentRecord
  ) {
    setMetadataReviewStatusError(null);

    if (isSourceLibraryQaModeEnabled()) {
      setSelectedMetadataReviewRecords([]);
      setSelectedMetadataReviewAuditEvents([]);
      setSelectedMetadataReviewRecordDetail(null);
      return;
    }

    setIsReadingMetadataReviewStatus(true);
    try {
      const reviewRecords =
        await listSourceCardMetadataReviewsForSourceDocument(detail.sourceDocumentId);
      setSelectedMetadataReviewRecords(reviewRecords);

      const firstReviewRecord = reviewRecords[0];
      if (firstReviewRecord) {
        const reviewRecordDetail =
          await getSourceCardMetadataReview(firstReviewRecord.metadataReviewId);
        setSelectedMetadataReviewRecordDetail(
          reviewRecordDetail ?? firstReviewRecord
        );
        const auditEvents = await listSourceCardMetadataReviewAuditEvents({
          metadataReviewId: firstReviewRecord.metadataReviewId,
          sourceDocumentId: detail.sourceDocumentId
        });
        setSelectedMetadataReviewAuditEvents(auditEvents);
      } else {
        setSelectedMetadataReviewRecordDetail(null);
        setSelectedMetadataReviewAuditEvents([]);
      }
    } catch (error) {
      setSelectedMetadataReviewRecords([]);
      setSelectedMetadataReviewAuditEvents([]);
      setSelectedMetadataReviewRecordDetail(null);
      setMetadataReviewStatusError(
        `Unable to read metadata review records. No records were modified. ${formatSavedSourceDocumentReadError(error)}`
      );
    } finally {
      setIsReadingMetadataReviewStatus(false);
    }
  }

  return (
    <section
      className="mt-3 border-t-2 border-studio-line pt-3"
      data-testid="source-document-intake-save-candidate-preview"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-studio-blue">
            SourceDocument Save Candidate Preview
          </p>
          <p className="mt-1 text-sm font-black text-white">
            Preview only -- no SourceDocument is created.
          </p>
        </div>
        <span className="mock-badge">SourceCard deferred</span>
      </div>

      <p className="mt-2 text-xs font-bold leading-5 text-slate-300">
        SourceCard remains deferred until metadata review. Citation metadata is not
        invented and APA-final readiness is not implied.
      </p>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <SummaryStat label="Candidates" value={summary.totalCount} />
        <SummaryStat label="Ready" value={summary.readyCount} />
        <SummaryStat label="Needs review" value={summary.needsReviewCount} />
        <SummaryStat label="Blocked" value={summary.blockedCount} />
      </div>

      <div
        className="mt-3 flex flex-wrap gap-1.5"
        data-testid="source-document-intake-safety-flags"
      >
        {[
          `Preview only: ${safetyFlags.previewOnly ? "true" : "false"}`,
          `Persisted: ${safetyFlags.persisted ? "true" : "false"}`,
          `SourceDocument created: ${safetyFlags.sourceDocumentCreated ? "true" : "false"}`,
          `SourceCard created: ${safetyFlags.sourceCardCreated ? "true" : "false"}`,
          `Parsed: ${safetyFlags.parsed ? "true" : "false"}`,
          `Classified: ${safetyFlags.classified ? "true" : "false"}`,
          `AI processed: ${safetyFlags.aiProcessed ? "true" : "false"}`
        ].map((flag) => (
          <span className="status-pill" key={flag}>
            {flag}
          </span>
        ))}
      </div>

      <div className="mt-3 grid gap-2">
        {preview.candidates.map((candidate) => (
          <SourceDocumentIntakeSaveCandidateCard
            candidate={candidate}
            key={candidate.candidateId}
          />
        ))}
      </div>

      <section
        className="mt-3 border-2 border-studio-teal bg-studio-teal/10 p-3"
        data-testid="source-document-explicit-save-gate"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-studio-teal">
              Explicit SourceDocument Save Gate
            </p>
            <p className="mt-1 text-sm font-black text-white">
              SourceDocument-only save. SourceCard remains deferred.
            </p>
          </div>
          <span className="status-pill">Audit required</span>
        </div>

        <div
          className="mt-3 grid gap-1.5 text-xs font-black uppercase leading-5 text-slate-200"
          data-testid="source-document-save-gate-boundaries"
        >
          {[
            "Only SourceDocument root records are created.",
            "SourceCard remains deferred.",
            "No parsing, classification, AI, API, provider, citation, APA, or export work runs.",
            "Audit event and read-back verification are required."
          ].map((copy) => (
            <span className="border border-studio-line bg-studio-ink/60 px-2 py-1" key={copy}>
              {copy}
            </span>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SummaryStat label="Ready to send" value={saveCandidates.length} />
          <SummaryStat label="Excluded" value={excludedCandidateCount} />
          <SummaryStat label="SourceCards" value="0" />
        </div>

        <p
          className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 px-2 py-1.5 text-xs font-black leading-5 text-slate-200"
          data-testid="source-document-save-payload-rules"
        >
          Payload includes ready PDF/DOCX candidates only. Blocked, unsupported, and
          incomplete candidates are excluded.
        </p>

        <div className="mt-3 grid gap-2 text-xs font-bold leading-5 text-slate-200">
          <label className="flex items-start gap-2 border border-studio-line bg-studio-ink/60 p-2">
            <input
              checked={explicitApprovalChecked}
              className="mt-1"
              data-testid="source-document-explicit-approval-checkbox"
              onChange={(event) => setExplicitApprovalChecked(event.target.checked)}
              type="checkbox"
            />
            <span>I approve creating SourceDocument records only.</span>
          </label>
          <label className="flex items-start gap-2 border border-studio-line bg-studio-ink/60 p-2">
            <input
              checked={safetyAcknowledgementChecked}
              className="mt-1"
              data-testid="source-document-safety-acknowledgement-checkbox"
              onChange={(event) =>
                setSafetyAcknowledgementChecked(event.target.checked)
              }
              type="checkbox"
            />
            <span>
              I understand SourceCard, parsing, classification, AI, and citation work
              remain disabled.
            </span>
          </label>
        </div>

        <button
          className="mt-3 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel disabled:cursor-not-allowed disabled:border-studio-line disabled:bg-studio-ink/60 disabled:text-slate-500 disabled:opacity-70"
          data-testid="source-document-explicit-save-button"
          disabled={!saveEnabled}
          onClick={handleSaveSourceDocuments}
          type="button"
        >
          {isSaving
            ? "Saving SourceDocument records..."
            : "Save SourceDocument Records Only"}
        </button>

        {saveError ? (
          <p
            className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-xs font-black leading-5 text-studio-rose"
            data-testid="source-document-explicit-save-error"
          >
            {saveError}
          </p>
        ) : null}

        {saveResult ? (
          <SourceDocumentIntakeSaveResultPanel
            onClear={() => setSaveResult(null)}
            result={saveResult}
          />
        ) : null}

        <SavedSourceDocumentRootReadPanel
          auditError={intakeAuditTraceError}
          auditEvents={selectedIntakeAuditEvents}
          detail={selectedSavedSourceDocument}
          error={savedSourceDocumentReadError}
          isReadingAudit={isReadingIntakeAuditTrace}
          isReadingDetail={isReadingSavedSourceDocument}
          isReadingMetadataReviewStatus={isReadingMetadataReviewStatus}
          isRefreshing={isRefreshingSavedSourceDocuments}
          items={savedSourceDocuments}
          metadataReviewAuditEvents={selectedMetadataReviewAuditEvents}
          metadataReviewRecordDetail={selectedMetadataReviewRecordDetail}
          metadataReviewRecords={selectedMetadataReviewRecords}
          metadataReviewStatusError={metadataReviewStatusError}
          onRefresh={() => void refreshSavedSourceDocuments()}
          onSelect={(sourceDocumentId) => void selectSavedSourceDocument(sourceDocumentId)}
          staleNotice={staleSavedSourceDocumentNotice}
        />
      </section>
    </section>
  );
}

function SourceDocumentIntakeSaveCandidateCard({
  candidate
}: {
  candidate: SourceDocumentIntakeSaveCandidate;
}) {
  return (
    <article className="border border-studio-line bg-studio-ink/55 p-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-black text-white">
            {candidate.candidateSourceDocumentTitle}
          </p>
          <p className="mt-1 font-bold uppercase leading-5 text-slate-400">
            {candidate.sourceFileName} · {candidate.sourceType}
            {candidate.fileSizeLabel ? ` · ${candidate.fileSizeLabel}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 border-2 px-2 py-1 font-black uppercase ${
            sourceDocumentCandidateToneClasses[candidate.readinessStatus]
          }`}
        >
          {candidate.readinessStatus.replace("_", " ")}
        </span>
      </div>

      <p className="mt-2 font-bold leading-5 text-slate-300">{candidate.intakeStatus}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {candidate.blockers.map((blocker) => (
          <span
            className="border border-studio-rose bg-studio-rose/10 px-2 py-1 text-[10px] font-black uppercase text-studio-rose"
            key={`${candidate.candidateId}-${blocker}`}
          >
            {sourceDocumentCandidateBlockerLabels[blocker]}
          </span>
        ))}
        {candidate.warnings.map((warning) => (
          <span
            className="border border-studio-gold bg-studio-gold/10 px-2 py-1 text-[10px] font-black uppercase text-studio-gold"
            key={`${candidate.candidateId}-${warning}`}
          >
            {sourceDocumentCandidateWarningLabels[warning]}
          </span>
        ))}
      </div>
    </article>
  );
}

function SourceDocumentIntakeSaveResultPanel({
  onClear,
  result
}: {
  onClear: () => void;
  result: SaveIntakeSourceDocumentCandidatesResult;
}) {
  const summary = summarizeSourceDocumentSaveResult(result);
  const showSuccess =
    result.saved &&
    result.candidateResults.length > 0 &&
    result.candidateResults.every((candidateResult) => candidateResult.readBackVerified);
  const auditNeedsReview = !result.auditEventsWritten || result.warnings.length > 0;

  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="source-document-explicit-save-result"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            SourceDocument save result
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {showSuccess
              ? "Read-back verified"
              : result.saved
                ? "Saved with review warnings"
                : "Save blocked or needs review"}
          </p>
        </div>
        <span className={result.auditEventsWritten ? "status-pill" : "mock-badge"}>
          Audit events: {result.auditEventsWritten ? "written" : "review"}
        </span>
      </div>

      <div
        className="mt-3 grid grid-cols-3 gap-2"
        data-testid="source-document-save-verification-summary"
      >
        <SummaryStat label="Submitted" value={summary.totalSubmitted} />
        <SummaryStat label="Saved" value={summary.savedCount} />
        <SummaryStat label="Already exists" value={summary.alreadyExistsCount} />
        <SummaryStat label="Rejected" value={summary.rejectedCount} />
        <SummaryStat label="Failed read-back" value={summary.failedReadBackCount} />
        <SummaryStat label="Read back" value={summary.readBackVerifiedCount} />
        <SummaryStat
          label="Audit events"
          value={result.auditEventsWritten ? "Written" : "Review"}
        />
        <SummaryStat label="SourceCard created" value={result.sourceCardCreated ? 1 : 0} />
      </div>

      <p
        className="mt-3 text-xs font-bold leading-5 text-slate-300"
        data-testid="source-document-explicit-save-audit-status"
      >
        auditEventsWritten: {result.auditEventsWritten ? "true" : "false"} ·{" "}
        {result.auditLimitation}
      </p>

      {auditNeedsReview ? (
        <p
          className="mt-2 border-l-4 border-studio-gold bg-studio-gold/10 px-2 py-1.5 text-xs font-black leading-5 text-studio-gold"
          data-testid="source-document-save-audit-warning"
        >
          Audit trace needs review before downstream work.
        </p>
      ) : null}

      {showSuccess ? (
        <p
          className="mt-2 border-l-4 border-studio-teal bg-studio-teal/10 px-2 py-1.5 text-xs font-black leading-5 text-studio-teal"
          data-testid="source-document-explicit-save-success"
        >
          Success: all returned SourceDocument candidates passed read-back verification.
        </p>
      ) : null}

      <div className="mt-3 grid gap-2" data-testid="source-document-explicit-save-results">
        {result.candidateResults.map((candidateResult) => (
          <article
            className="border border-studio-line bg-studio-ink/60 p-2 text-xs"
            data-testid="source-document-explicit-save-result-card"
            key={candidateResult.candidateId}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="break-words font-black text-white">
                  {candidateResult.fileName}
                </p>
                <p className="mt-1 font-bold uppercase text-slate-400">
                  {candidateResult.fileType} · {candidateResult.status}
                </p>
              </div>
              <span
                className={
                  candidateResult.readBackVerified ? "status-pill" : "mock-badge"
                }
              >
                Read-back: {candidateResult.readBackVerified ? "verified" : "review"}
              </span>
            </div>
            <dl className="mt-2 grid gap-1 font-bold leading-5 text-slate-300">
              <SourceDocumentResultDetail
                label="SourceDocument ID"
                value={candidateResult.sourceDocumentId ?? "None"}
              />
              <SourceDocumentResultDetail
                label="Title"
                value={
                  candidateResult.sourceDocument?.title ??
                  candidateResult.fileName
                }
              />
              <SourceDocumentResultDetail
                label="File name"
                value={candidateResult.fileName}
              />
              <SourceDocumentResultDetail
                label="Source type"
                value={candidateResult.sourceDocument?.fileType ?? candidateResult.fileType}
              />
              <SourceDocumentResultDetail
                label="Result status"
                value={candidateResult.status}
              />
              <SourceDocumentResultDetail
                label="Read-back"
                value={candidateResult.readBackVerified ? "verified" : "needs review"}
              />
              <SourceDocumentResultDetail
                label="Audit event ids"
                value={
                  candidateResult.auditEventIds.length > 0
                    ? candidateResult.auditEventIds.join(", ")
                    : "None"
                }
              />
            </dl>
            {candidateResult.blockers.length > 0 ? (
              <p className="mt-1 font-black leading-5 text-studio-rose">
                Blockers: {candidateResult.blockers.join("; ")}
              </p>
            ) : null}
            {candidateResult.warnings.length > 0 ? (
              <p className="mt-1 font-black leading-5 text-studio-gold">
                Warnings: {candidateResult.warnings.join("; ")}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {result.warnings.length > 0 ? (
        <p className="mt-3 text-xs font-bold leading-5 text-studio-gold">
          Package warnings: {result.warnings.join("; ")}
        </p>
      ) : null}

      <button
        className="mt-3 border border-studio-line bg-studio-ink/70 px-2 py-1.5 text-xs font-black uppercase text-slate-300 shadow-pixel"
        data-testid="source-document-clear-save-result"
        onClick={onClear}
        type="button"
      >
        Clear local result
      </button>
    </section>
  );
}

function SavedSourceDocumentRootReadPanel({
  auditError,
  auditEvents,
  detail,
  error,
  isReadingAudit,
  isReadingDetail,
  isReadingMetadataReviewStatus,
  isRefreshing,
  items,
  metadataReviewAuditEvents,
  metadataReviewRecordDetail,
  metadataReviewRecords,
  metadataReviewStatusError,
  onRefresh,
  onSelect,
  staleNotice
}: {
  auditError: string | null;
  auditEvents: SavedIntakeSourceDocumentAuditEvent[];
  detail: SavedSourceDocumentRecord | null;
  error: string | null;
  isReadingAudit: boolean;
  isReadingDetail: boolean;
  isReadingMetadataReviewStatus: boolean;
  isRefreshing: boolean;
  items: SavedSourceDocumentListItem[];
  metadataReviewAuditEvents: SavedSourceCardMetadataReviewAuditEvent[];
  metadataReviewRecordDetail: SavedSourceCardMetadataReviewRecord | null;
  metadataReviewRecords: SavedSourceCardMetadataReviewRecord[];
  metadataReviewStatusError: string | null;
  onRefresh: () => void;
  onSelect: (sourceDocumentId: string) => void;
  staleNotice: string | null;
}) {
  return (
    <section
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="saved-intake-source-document-read-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            Saved SourceDocuments
          </p>
          <p className="mt-1 text-sm font-black text-white">
            Read-only local vault records
          </p>
        </div>
        <span className="status-pill">Read only</span>
      </div>

      <p
        className="mt-2 border-l-4 border-studio-blue bg-studio-blue/10 px-2 py-1.5 text-xs font-black leading-5 text-slate-200"
        data-testid="saved-intake-source-document-read-boundary"
      >
        Read-only SourceDocument root record. SourceCard is not created by this
        intake path.
      </p>

      <button
        className="mt-3 w-full border-2 border-studio-blue bg-studio-blue/15 px-3 py-2 text-xs font-black uppercase text-studio-blue shadow-pixel disabled:cursor-not-allowed disabled:border-studio-line disabled:bg-studio-ink/60 disabled:text-slate-500 disabled:opacity-70"
        data-testid="saved-intake-source-document-refresh"
        disabled={isRefreshing}
        onClick={onRefresh}
        type="button"
      >
        {isRefreshing ? "Reading saved SourceDocuments..." : "Refresh Saved SourceDocuments"}
      </button>

      {error ? (
        <p
          className="mt-3 border-l-4 border-studio-rose bg-studio-rose/10 p-2 text-xs font-black leading-5 text-studio-rose"
          data-testid="saved-intake-source-document-read-error"
        >
          {error}
        </p>
      ) : null}

      {staleNotice ? (
        <p
          className="mt-3 border-l-4 border-studio-gold bg-studio-gold/10 p-2 text-xs font-black leading-5 text-studio-gold"
          data-testid="saved-intake-source-document-stale-selection"
        >
          {staleNotice}
        </p>
      ) : null}

      <div
        className="mt-3 grid gap-2"
        data-testid="saved-intake-source-document-list"
      >
        {items.length > 0 ? (
          items.map((item) => (
            <button
              className="border border-studio-line bg-studio-ink/60 p-2 text-left text-xs shadow-pixel transition hover:border-studio-blue"
              data-testid="saved-intake-source-document-row"
              key={item.sourceDocumentId}
              onClick={() => onSelect(item.sourceDocumentId)}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words font-black text-white">{item.title}</p>
                  <p className="mt-1 break-words font-bold uppercase text-studio-blue">
                    {item.sourceDocumentId}
                  </p>
                </div>
                <span className="status-pill">{item.fileType || "Unknown"}</span>
              </div>
              <div className="mt-2 grid gap-1 font-bold leading-5 text-slate-300">
                <p>File: {item.fileName || "Not available"}</p>
                <p>Created: {item.createdAt || "Not available"}</p>
                <p>
                  Candidate: {item.createdFromCandidateId || "Not available"}
                </p>
              </div>
            </button>
          ))
        ) : (
          <p
            className="border-l-4 border-studio-gold bg-studio-ink/60 p-2 text-xs font-bold leading-5 text-slate-300"
            data-testid="saved-intake-source-document-empty"
          >
            No saved SourceDocuments listed yet. Refresh reads the local vault only.
          </p>
        )}
      </div>

      {isReadingDetail ? (
        <p
          className="mt-3 border-l-4 border-studio-blue bg-studio-blue/10 p-2 text-xs font-black leading-5 text-studio-blue"
          data-testid="saved-intake-source-document-detail-loading"
        >
          Reading selected SourceDocument root record. No records are modified.
        </p>
      ) : detail ? (
        <SavedSourceDocumentRootDetail
          auditError={auditError}
          auditEvents={auditEvents}
          detail={detail}
          isReadingAudit={isReadingAudit}
          isReadingMetadataReviewStatus={isReadingMetadataReviewStatus}
          metadataReviewAuditEvents={metadataReviewAuditEvents}
          metadataReviewRecordDetail={metadataReviewRecordDetail}
          metadataReviewRecords={metadataReviewRecords}
          metadataReviewStatusError={metadataReviewStatusError}
        />
      ) : (
        <SavedSourceDocumentAuditTrace
          error={auditError}
          events={[]}
          isReading={isReadingAudit}
        />
      )}
    </section>
  );
}

function SavedSourceDocumentRootDetail({
  auditError,
  auditEvents,
  detail,
  isReadingAudit,
  isReadingMetadataReviewStatus,
  metadataReviewAuditEvents,
  metadataReviewRecordDetail,
  metadataReviewRecords,
  metadataReviewStatusError
}: {
  auditError: string | null;
  auditEvents: SavedIntakeSourceDocumentAuditEvent[];
  detail: SavedSourceDocumentRecord;
  isReadingAudit: boolean;
  isReadingMetadataReviewStatus: boolean;
  metadataReviewAuditEvents: SavedSourceCardMetadataReviewAuditEvent[];
  metadataReviewRecordDetail: SavedSourceCardMetadataReviewRecord | null;
  metadataReviewRecords: SavedSourceCardMetadataReviewRecord[];
  metadataReviewStatusError: string | null;
}) {
  return (
    <section
      className="mt-3 border border-studio-line bg-studio-panel/50 p-2 text-xs"
      data-testid="saved-intake-source-document-detail"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black uppercase text-slate-400">
            Selected SourceDocument
          </p>
          <p className="mt-1 font-black text-white">{detail.title}</p>
        </div>
        <span className="status-pill">Read only</span>
      </div>
      <p
        className="mt-2 border-l-4 border-studio-teal bg-studio-teal/10 px-2 py-1.5 font-black leading-5 text-studio-teal"
        data-testid="saved-intake-source-document-detail-boundary"
      >
        Read-only SourceDocument root record. SourceCard is not created by this
        intake path.
      </p>
      <dl className="mt-2 grid gap-1 font-bold leading-5 text-slate-300">
        <SourceDocumentResultDetail
          label="SourceDocument ID"
          value={detail.sourceDocumentId}
        />
        <SourceDocumentResultDetail label="Title" value={detail.title} />
        <SourceDocumentResultDetail label="File type" value={detail.fileType} />
        <SourceDocumentResultDetail label="File name" value={detail.fileName} />
        <SourceDocumentResultDetail
          label="Intake source"
          value={
            detail.createdFromCandidateId
              ? "INPUT Room / Source Library Intake"
              : "Not available"
          }
        />
        <SourceDocumentResultDetail
          label="Review status"
          value={detail.reviewStatus || "Not available"}
        />
        <SourceDocumentResultDetail
          label="Path policy"
          value={detail.localPathPolicy}
        />
        <SourceDocumentResultDetail
          label="Path reference"
          value={detail.localPathReference ?? "Not available"}
        />
        <SourceDocumentResultDetail
          label="Candidate ID"
          value={detail.createdFromCandidateId || "Not available"}
        />
        <SourceDocumentResultDetail
          label="Created"
          value={detail.createdAt || "Not available"}
        />
        <SourceDocumentResultDetail
          label="Updated"
          value={detail.updatedAt || "Not available"}
        />
      </dl>
      <SavedSourceDocumentMetadataReadinessPreview detail={detail} />
      <SourceCardMetadataReviewGatePreview detail={detail} />
      <SourceCardMetadataReviewBackendStatusPanel
        auditEvents={metadataReviewAuditEvents}
        error={metadataReviewStatusError}
        isReading={isReadingMetadataReviewStatus}
        selectedRecord={metadataReviewRecordDetail}
        records={metadataReviewRecords}
      />
      <SourceCardMetadataEditingShell detail={detail} />
      <SourceCardMetadataCompletionPreview detail={detail} />
      <SavedSourceDocumentAuditTrace
        error={auditError}
        events={auditEvents}
        isReading={isReadingAudit}
      />
    </section>
  );
}

const sourceDocumentMetadataReadinessToneClasses: Record<
  SourceDocumentMetadataReadinessStatus,
  string
> = {
  blocked_insufficient_root_data:
    "border-studio-rose bg-studio-rose/10 text-studio-rose",
  needs_bibliographic_metadata:
    "border-studio-gold bg-studio-gold/10 text-studio-gold",
  ready_for_metadata_review:
    "border-studio-teal bg-studio-teal/10 text-studio-teal"
};

function SavedSourceDocumentMetadataReadinessPreview({
  detail
}: {
  detail: SavedSourceDocumentRecord;
}) {
  const readiness = evaluateSourceDocumentMetadataReadiness(detail);

  return (
    <section
      className="mt-3 border-t border-studio-line/70 pt-3"
      data-testid="saved-intake-source-document-metadata-readiness"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black uppercase text-slate-400">
            Metadata readiness preview
          </p>
          <p className="mt-1 font-bold leading-5 text-slate-300">
            Uses saved SourceDocument root fields only. No citation metadata is
            inferred.
          </p>
        </div>
        <span
          className={`shrink-0 border-2 px-2 py-1 font-black uppercase ${
            sourceDocumentMetadataReadinessToneClasses[readiness.status]
          }`}
          data-testid="saved-intake-source-document-metadata-readiness-status"
        >
          {readiness.statusLabel}
        </span>
      </div>

      <p
        className="mt-2 border-l-4 border-studio-blue bg-studio-blue/10 p-2 font-black leading-5 text-slate-200"
        data-testid="saved-intake-source-document-metadata-readiness-boundary"
      >
        Preview only — no SourceCard is created.
      </p>

      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <SourceDocumentReadinessList
          items={readiness.passedChecks}
          testId="saved-intake-source-document-metadata-readiness-passed"
          title="Passed checks"
          tone="teal"
        />
        <SourceDocumentReadinessList
          items={readiness.warnings}
          testId="saved-intake-source-document-metadata-readiness-warnings"
          title="Warnings"
          tone="gold"
        />
        <SourceDocumentReadinessList
          items={readiness.blockers}
          testId="saved-intake-source-document-metadata-readiness-blockers"
          title="Blockers"
          tone="rose"
        />
      </div>

      <p
        className="mt-2 border-l-4 border-studio-gold bg-studio-gold/10 p-2 font-black leading-5 text-studio-gold"
        data-testid="saved-intake-source-document-metadata-readiness-next-step"
      >
        Future sprint: open SourceCard metadata review gate after bibliographic
        fields are reviewed.
      </p>
    </section>
  );
}

function SourceDocumentReadinessList({
  items,
  testId,
  title,
  tone
}: {
  items: string[];
  testId: string;
  title: string;
  tone: "gold" | "rose" | "teal";
}) {
  const toneClasses = {
    gold: "border-studio-gold text-studio-gold",
    rose: "border-studio-rose text-studio-rose",
    teal: "border-studio-teal text-studio-teal"
  }[tone];

  return (
    <div
      className={`border bg-studio-ink/55 p-2 ${toneClasses}`}
      data-testid={testId}
    >
      <p className="font-black uppercase">{title}</p>
      <ul className="mt-2 grid gap-1 font-bold leading-5 text-slate-300">
        {(items.length > 0 ? items : ["None"]).map((item) => (
          <li className="break-words" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const sourceCardMetadataReviewGateToneClasses: Record<
  SourceCardMetadataReviewGateStatus,
  string
> = {
  blocked: "border-studio-rose bg-studio-rose/10 text-studio-rose",
  needs_bibliographic_metadata_review:
    "border-studio-gold bg-studio-gold/10 text-studio-gold",
  ready_for_source_card_creation_review:
    "border-studio-teal bg-studio-teal/10 text-studio-teal"
};

const sourceCardGateChecklistToneClasses: Record<
  SourceCardMetadataReviewGateChecklistStatus,
  string
> = {
  blocked: "border-studio-rose text-studio-rose",
  future_required: "border-studio-blue text-studio-blue",
  needs_review: "border-studio-gold text-studio-gold",
  passed: "border-studio-teal text-studio-teal",
  warning: "border-studio-gold text-studio-gold"
};

const sourceCardGateChecklistStatusLabels: Record<
  SourceCardMetadataReviewGateChecklistStatus,
  string
> = {
  blocked: "Blocked",
  future_required: "Future required",
  needs_review: "Needs review",
  passed: "Passed",
  warning: "Warning"
};

function SourceCardMetadataReviewGatePreview({
  detail
}: {
  detail: SavedSourceDocumentRecord;
}) {
  const gate = evaluateSourceCardMetadataReviewGate(detail);

  return (
    <section
      className="mt-3 border-t border-studio-line/70 pt-3"
      data-testid="source-card-metadata-review-gate-preview"
    >
      <div className="grid gap-2">
        <div>
          <p className="font-black uppercase text-slate-400">
            SourceCard Metadata Review Gate Preview
          </p>
          <p className="mt-1 font-bold leading-5 text-slate-300">
            Preview only — no SourceCard is created.
          </p>
        </div>
        <span
          className={`w-full border-2 px-2 py-1 font-black uppercase ${
            sourceCardMetadataReviewGateToneClasses[gate.status]
          }`}
          data-testid="source-card-metadata-review-gate-status"
        >
          {gate.statusLabel}
        </span>
      </div>

      <div
        className="mt-2 grid gap-1.5"
        data-testid="source-card-metadata-review-gate-checklist"
      >
        {gate.checklist.map((item) => (
          <div
            className={`border bg-studio-ink/55 p-2 text-[11px] ${
              sourceCardGateChecklistToneClasses[item.status]
            }`}
            data-testid="source-card-metadata-review-gate-check"
            key={item.label}
          >
            <p className="break-words font-black uppercase">{item.label}</p>
            <span className="mt-1 inline-block text-[10px] font-black uppercase">
              {sourceCardGateChecklistStatusLabels[item.status]}
            </span>
            <p className="mt-1 break-words font-bold leading-5 text-slate-300">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-2 grid gap-2">
        <SourceDocumentReadinessList
          items={gate.warnings}
          testId="source-card-metadata-review-gate-warnings"
          title="Warnings"
          tone="gold"
        />
        <SourceDocumentReadinessList
          items={gate.blockers}
          testId="source-card-metadata-review-gate-blockers"
          title="Blockers"
          tone="rose"
        />
      </div>

      <div
        className="mt-2 border-l-4 border-studio-blue bg-studio-blue/10 p-2 font-black leading-5 text-slate-200"
        data-testid="source-card-metadata-review-gate-boundary"
      >
        {gate.deferredNotices.map((notice) => (
          <p key={notice}>{notice}</p>
        ))}
      </div>

      <button
        className="mt-2 w-full cursor-not-allowed whitespace-normal break-words border-2 border-studio-line bg-studio-ink/60 px-3 py-2 text-xs font-black uppercase leading-5 text-slate-500 opacity-75 shadow-pixel"
        data-testid="source-card-metadata-review-gate-future-action"
        disabled
        type="button"
      >
        {gate.futureAffordanceLabel}
      </button>
    </section>
  );
}

function SourceCardMetadataReviewBackendStatusPanel({
  auditEvents,
  error,
  isReading,
  selectedRecord,
  records
}: {
  auditEvents: SavedSourceCardMetadataReviewAuditEvent[];
  error: string | null;
  isReading: boolean;
  selectedRecord: SavedSourceCardMetadataReviewRecord | null;
  records: SavedSourceCardMetadataReviewRecord[];
}) {
  const statusItems = [
    "Metadata review schema: available",
    "Metadata review commands: available",
    "TypeScript bridge: available",
    "UI editing: not enabled",
    "UI metadata save: not enabled",
    "SourceCard creation: not enabled",
    "Citation-ready: not verified",
    "APA-final: not verified"
  ];

  return (
    <section
      className="mt-3 border-t border-studio-line/70 pt-3"
      data-testid="source-card-metadata-review-backend-status-panel"
    >
      <div className="grid gap-2">
        <div>
          <p className="font-black uppercase text-slate-400">
            SourceCard Metadata Review Backend Status
          </p>
          <div
            className="mt-1 grid gap-1 font-bold leading-5 text-slate-300"
            data-testid="source-card-metadata-review-backend-status-boundary"
          >
            <p>Read-only status — metadata editing is not enabled.</p>
            <p>No SourceCard is created.</p>
            <p>Citation and APA readiness are not verified.</p>
          </div>
        </div>
        <span className="w-full border-2 border-studio-blue bg-studio-blue/10 px-2 py-1 font-black uppercase text-studio-blue">
          Review records: {records.length}
        </span>
      </div>

      <div
        className="mt-2 grid gap-1.5 md:grid-cols-2"
        data-testid="source-card-metadata-review-backend-status-capabilities"
      >
        {statusItems.map((item) => {
          const disabledStatus =
            item.includes("not enabled") || item.includes("not verified");
          return (
            <span
              className={`border bg-studio-ink/55 p-2 text-[11px] font-black uppercase ${
                disabledStatus
                  ? "border-studio-gold text-studio-gold"
                  : "border-studio-teal text-studio-teal"
              }`}
              key={item}
            >
              {item}
            </span>
          );
        })}
      </div>

      {isReading ? (
        <p
          className="mt-2 border-l-4 border-studio-blue bg-studio-blue/10 p-2 font-black leading-5 text-studio-blue"
          data-testid="source-card-metadata-review-backend-status-loading"
        >
          Reading metadata review records… No records are modified.
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-2 border-l-4 border-studio-rose bg-studio-rose/10 p-2 font-black leading-5 text-studio-rose"
          data-testid="source-card-metadata-review-backend-status-error"
        >
          {error}
        </p>
      ) : null}

      <SourceCardMetadataReviewRecordInspector
        auditEvents={auditEvents}
        records={records}
        selectedRecord={selectedRecord}
      />
    </section>
  );
}

function SourceCardMetadataReviewRecordInspector({
  auditEvents,
  records,
  selectedRecord
}: {
  auditEvents: SavedSourceCardMetadataReviewAuditEvent[];
  records: SavedSourceCardMetadataReviewRecord[];
  selectedRecord: SavedSourceCardMetadataReviewRecord | null;
}) {
  return (
    <section
      className="mt-2 border border-studio-line bg-studio-ink/55 p-2"
      data-testid="source-card-metadata-review-record-inspector"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black uppercase text-slate-400">
            SourceCard Metadata Review Record Inspector
          </p>
          <div
            className="mt-1 grid gap-1 font-bold leading-5 text-slate-300"
            data-testid="source-card-metadata-review-record-inspector-boundary"
          >
            <p>Read-only inspector — metadata editing is not enabled.</p>
            <p>No metadata is saved from this panel.</p>
            <p>No SourceCard is created.</p>
            <p>Citation and APA readiness are not verified.</p>
          </div>
        </div>
        <span className="status-pill">Read only</span>
      </div>

      <div
        className="mt-2 border border-studio-line bg-studio-panel/50 p-2"
        data-testid="source-card-metadata-review-backend-status-records"
      >
        <p className="font-black uppercase text-studio-blue">
          Metadata review records: {records.length}
        </p>
        {records.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {records.map((record) => (
              <article
                className="border border-studio-line bg-studio-ink/55 p-2"
                data-testid="source-card-metadata-review-backend-status-record"
                key={record.metadataReviewId}
              >
                <dl className="grid gap-1 font-bold leading-5 text-slate-300">
                  <SourceDocumentResultDetail
                    label="metadataReviewId"
                    value={record.metadataReviewId}
                  />
                  <SourceDocumentResultDetail
                    label="reviewStatus"
                    value={record.reviewStatus}
                  />
                  <SourceDocumentResultDetail
                    label="sourceType"
                    value={record.sourceType}
                  />
                  <SourceDocumentResultDetail
                    label="reviewedTitle"
                    value={record.reviewedTitle}
                  />
                  <SourceDocumentResultDetail
                    label="readBackStatus"
                    value={record.readBackStatus ?? "Not available"}
                  />
                  <SourceDocumentResultDetail
                    label="createdAt"
                    value={record.createdAt}
                  />
                  <SourceDocumentResultDetail
                    label="updatedAt"
                    value={record.updatedAt}
                  />
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-2 border-l-4 border-studio-gold bg-studio-gold/10 p-2 font-bold leading-5 text-studio-gold">
            <p>No metadata review records saved for this SourceDocument yet.</p>
            <p>
              This is expected because metadata editing and metadata save are not
              enabled.
            </p>
          </div>
        )}
      </div>

      {selectedRecord ? (
        <div
          className="mt-2 border border-studio-line bg-studio-panel/50 p-2"
          data-testid="source-card-metadata-review-record-inspector-detail"
        >
          <p className="font-black uppercase text-studio-teal">
            Selected metadata review record
          </p>
          <dl className="mt-2 grid gap-1 font-bold leading-5 text-slate-300">
            <SourceDocumentResultDetail
              label="metadataReviewId"
              value={selectedRecord.metadataReviewId}
            />
            <SourceDocumentResultDetail
              label="sourceDocumentId"
              value={selectedRecord.sourceDocumentId}
            />
            <SourceDocumentResultDetail
              label="created_from_candidate_id"
              value={selectedRecord.createdFromCandidateId ?? "Not available"}
            />
            <SourceDocumentResultDetail
              label="reviewStatus"
              value={selectedRecord.reviewStatus}
            />
            <SourceDocumentResultDetail
              label="reviewedTitle"
              value={selectedRecord.reviewedTitle}
            />
            <SourceDocumentResultDetail
              label="reviewedAuthors"
              value={formatMetadataReviewJsonValue(
                selectedRecord.reviewedAuthorsJson
              )}
            />
            <SourceDocumentResultDetail
              label="reviewedYear"
              value={selectedRecord.reviewedYear ?? "Not available"}
            />
            <SourceDocumentResultDetail
              label="reviewedDoi"
              value={selectedRecord.reviewedDoi ?? "Not available"}
            />
            <SourceDocumentResultDetail
              label="reviewedUrl"
              value={selectedRecord.reviewedUrl ?? "Not available"}
            />
            <SourceDocumentResultDetail
              label="reviewedContainer"
              value={selectedRecord.reviewedContainer ?? "Not available"}
            />
            <SourceDocumentResultDetail
              label="reviewedPublisher"
              value={selectedRecord.reviewedPublisher ?? "Not available"}
            />
            <SourceDocumentResultDetail
              label="reviewedPages"
              value={selectedRecord.reviewedPages ?? "Not available"}
            />
            <SourceDocumentResultDetail
              label="citationReady"
              value={formatMetadataReviewStoredBoolean(
                selectedRecord.citationReady,
                "UI does not verify citation readiness."
              )}
            />
            <SourceDocumentResultDetail
              label="apaFinalVerified"
              value={formatMetadataReviewStoredBoolean(
                selectedRecord.apaFinalVerified,
                "UI does not verify APA finality."
              )}
            />
            <SourceDocumentResultDetail
              label="safetyFlags"
              value={formatMetadataReviewJsonValue(selectedRecord.safetyFlagsJson)}
            />
            <SourceDocumentResultDetail
              label="blockers"
              value={formatMetadataReviewJsonValue(selectedRecord.blockersJson)}
            />
            <SourceDocumentResultDetail
              label="warnings"
              value={formatMetadataReviewJsonValue(selectedRecord.warningsJson)}
            />
            <SourceDocumentResultDetail
              label="readBackStatus"
              value={selectedRecord.readBackStatus ?? "Not available"}
            />
            <SourceDocumentResultDetail
              label="createdAt"
              value={selectedRecord.createdAt}
            />
            <SourceDocumentResultDetail
              label="updatedAt"
              value={selectedRecord.updatedAt}
            />
          </dl>
        </div>
      ) : null}

      <div
        className="mt-2 border border-studio-line bg-studio-panel/50 p-2"
        data-testid="source-card-metadata-review-backend-status-audit"
      >
        <p className="font-black uppercase text-slate-400">
          Metadata review audit events: {auditEvents.length}
        </p>
        {auditEvents.length > 0 ? (
          <div className="mt-2 grid gap-1 font-bold leading-5 text-slate-300">
            {auditEvents.slice(0, 4).map((event) => (
              <p
                className="break-words"
                data-testid="source-card-metadata-review-backend-status-audit-event"
                key={event.auditEventId}
              >
                {event.auditEventId} · {event.eventType} · {event.resultStatus}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-2 font-bold leading-5 text-slate-300">
            No metadata review audit events found.
          </p>
        )}
      </div>
    </section>
  );
}

function formatMetadataReviewStoredBoolean(value: boolean, note: string) {
  return `Stored value: ${value ? "true" : "false"}. ${note}`;
}

function formatMetadataReviewJsonValue(value: string | null) {
  if (!value) {
    return "Not available";
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.length > 0 ? parsed.join("; ") : "None";
    }

    if (parsed && typeof parsed === "object") {
      return JSON.stringify(parsed);
    }

    return String(parsed);
  } catch {
    return value;
  }
}

interface SourceCardMetadataEditingShellField {
  label: string;
  note: string;
  value: string;
}

interface SourceCardMetadataEditingShellGroup {
  fields: SourceCardMetadataEditingShellField[];
  title: string;
}

function SourceCardMetadataEditingShell({
  detail
}: {
  detail: SavedSourceDocumentRecord;
}) {
  const shellGroups: SourceCardMetadataEditingShellGroup[] = [
    {
      title: "Root identity",
      fields: [
        {
          label: "SourceDocument title",
          note: "Read from saved SourceDocument root.",
          value: detail.title
        },
        {
          label: "File name",
          note: "Read-only intake file identity.",
          value: detail.fileName || "Not available"
        },
        {
          label: "Source type / file type",
          note: "Future source-type confirmation remains disabled.",
          value: detail.fileType || "Not available"
        },
        {
          label: "Intake provenance / candidate id",
          note: "Provenance stays read-only in this shell.",
          value: detail.createdFromCandidateId || "Not available"
        }
      ]
    },
    {
      title: "Bibliographic metadata",
      fields: [
        {
          label: "Authors",
          note: "No author metadata is inferred.",
          value: "Needs review"
        },
        {
          label: "Year",
          note: "No publication year is inferred.",
          value: "Needs review"
        },
        {
          label: "Source type confirmation",
          note: "Human confirmation is required before SourceCard creation.",
          value: "Not enabled"
        }
      ]
    },
    {
      title: "Source-type-specific metadata",
      fields: [
        {
          label: "DOI",
          note: "No DOI is inferred from saved SourceDocument root data.",
          value: "Needs review"
        },
        {
          label: "URL",
          note: "No URL is inferred from saved SourceDocument root data.",
          value: "Needs review"
        },
        {
          label: "Journal / container",
          note: "Container metadata requires human review.",
          value: "Needs review"
        },
        {
          label: "Publisher",
          note: "Publisher metadata requires human review.",
          value: "Needs review"
        },
        {
          label: "Volume / issue / pages",
          note: "Page and issue metadata require human review.",
          value: "Needs review"
        }
      ]
    },
    {
      title: "Citation / APA candidate area",
      fields: [
        {
          label: "Citation text candidate",
          note: "No citation text candidate is generated in this shell.",
          value: "Not verified"
        },
        {
          label: "APA reference candidate",
          note: "No APA reference candidate is generated in this shell.",
          value: "Not verified"
        },
        {
          label: "Citation-ready",
          note: "Citation readiness remains outside this disabled shell.",
          value: "Not verified"
        },
        {
          label: "APA-final",
          note: "APA-final verification remains a separate future boundary.",
          value: "Not verified"
        }
      ]
    },
    {
      title: "Future approval",
      fields: [
        {
          label: "Human metadata review required",
          note: "Future metadata save must require explicit human approval.",
          value: "Required"
        },
        {
          label: "SourceCard creation remains separate",
          note: "SourceCard creation requires its own future approval gate.",
          value: "Deferred"
        }
      ]
    }
  ];

  return (
    <section
      className="mt-3 border-t border-studio-line/70 pt-3"
      data-testid="source-card-metadata-editing-shell"
    >
      <div className="grid gap-2">
        <div>
          <p className="font-black uppercase text-slate-400">
            SourceCard Metadata Editing Shell
          </p>
          <div
            className="mt-1 grid gap-1 font-bold leading-5 text-slate-300"
            data-testid="source-card-metadata-editing-shell-boundary"
          >
            <p>Disabled preview — metadata editing is not enabled.</p>
            <p>No metadata is saved from this shell.</p>
            <p>No SourceCard is created.</p>
            <p>Citation and APA readiness remain unverified.</p>
            <p>Future editing requires explicit human review and backend save gate.</p>
          </div>
        </div>
        <span className="w-full border-2 border-studio-gold bg-studio-gold/10 px-2 py-1 font-black uppercase text-studio-gold">
          Disabled shell only
        </span>
      </div>

      <div
        className="mt-2 grid gap-2"
        data-testid="source-card-metadata-editing-shell-groups"
      >
        {shellGroups.map((group) => (
          <article
            className="border border-studio-line bg-studio-ink/55 p-2"
            data-testid="source-card-metadata-editing-shell-group"
            key={group.title}
          >
            <p className="font-black uppercase text-studio-blue">{group.title}</p>
            <dl className="mt-2 grid gap-1.5">
              {group.fields.map((field) => (
                <div
                  className="border border-studio-line bg-studio-panel/50 p-2 text-[11px]"
                  data-testid="source-card-metadata-editing-shell-field"
                  key={`${group.title}-${field.label}`}
                >
                  <dt className="break-words font-black uppercase text-slate-400">
                    {field.label}
                  </dt>
                  <dd className="mt-1 break-words font-black text-slate-200">
                    {field.value}
                  </dd>
                  <dd className="mt-1 break-words font-bold leading-5 text-slate-300">
                    {field.note}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div
        className="mt-2 flex flex-wrap gap-1.5"
        data-testid="source-card-metadata-editing-shell-future-affordances"
      >
        {[
          "Future: Edit metadata",
          "Future: Save reviewed metadata",
          "Future: Create SourceCard after review"
        ].map((label) => (
          <span
            className="border border-studio-line bg-studio-ink/60 px-2 py-1 text-[10px] font-black uppercase text-slate-500"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

const sourceCardMetadataCompletionToneClasses: Record<
  SourceCardMetadataCompletionFieldStatus,
  string
> = {
  available: "border-studio-teal text-studio-teal",
  blocked: "border-studio-rose text-studio-rose",
  needs_review: "border-studio-gold text-studio-gold",
  not_applicable: "border-slate-600 text-slate-400"
};

const sourceCardMetadataCompletionStatusLabels: Record<
  SourceCardMetadataCompletionFieldStatus,
  string
> = {
  available: "Available",
  blocked: "Blocked",
  needs_review: "Needs review",
  not_applicable: "Not applicable"
};

function SourceCardMetadataCompletionPreview({
  detail
}: {
  detail: SavedSourceDocumentRecord;
}) {
  const completionPreview = createSourceCardMetadataCompletionPreview(detail);

  return (
    <section
      className="mt-3 border-t border-studio-line/70 pt-3"
      data-testid="source-card-metadata-completion-preview"
    >
      <div className="grid gap-2">
        <div>
          <p className="font-black uppercase text-slate-400">
            SourceCard Metadata Completion Preview
          </p>
          <p className="mt-1 font-bold leading-5 text-slate-300">
            Preview only — metadata is not saved. No SourceCard is created.
          </p>
        </div>
        <span
          className="w-full border-2 border-studio-gold bg-studio-gold/10 px-2 py-1 font-black uppercase text-studio-gold"
          data-testid="source-card-metadata-completion-status"
        >
          Needs metadata review
        </span>
      </div>

      <div
        className="mt-2 grid gap-2"
        data-testid="source-card-metadata-completion-field-groups"
      >
        {completionPreview.fieldGroups.map((group) => (
          <article
            className="border border-studio-line bg-studio-ink/55 p-2"
            data-testid="source-card-metadata-completion-group"
            key={group.title}
          >
            <p className="font-black uppercase text-studio-blue">{group.title}</p>
            <dl className="mt-2 grid gap-1.5">
              {group.fields.map((field) => (
                <div
                  className={`border p-2 text-[11px] ${
                    sourceCardMetadataCompletionToneClasses[field.status]
                  }`}
                  data-testid="source-card-metadata-completion-field"
                  key={`${group.title}-${field.label}`}
                >
                  <dt className="break-words font-black uppercase">{field.label}</dt>
                  <dd className="mt-1 break-words font-black text-slate-200">
                    {field.value}
                  </dd>
                  <dd className="mt-1 text-[10px] font-black uppercase">
                    {sourceCardMetadataCompletionStatusLabels[field.status]}
                  </dd>
                  <dd className="mt-1 break-words font-bold leading-5 text-slate-300">
                    {field.note}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <SourceDocumentReadinessList
        items={completionPreview.warnings}
        testId="source-card-metadata-completion-warnings"
        title="Safety notes"
        tone="gold"
      />

      <div
        className="mt-2 border-l-4 border-studio-blue bg-studio-blue/10 p-2 font-black leading-5 text-slate-200"
        data-testid="source-card-metadata-completion-safety-flags"
      >
        <p>metadataSaved: {String(completionPreview.safetyFlags.metadataSaved)}</p>
        <p>persisted: {String(completionPreview.safetyFlags.persisted)}</p>
        <p>sourceCardCreated: {String(completionPreview.safetyFlags.sourceCardCreated)}</p>
        <p>citationReady: {String(completionPreview.safetyFlags.citationReady)}</p>
        <p>
          citationMetadataInferred:{" "}
          {String(completionPreview.safetyFlags.citationMetadataInferred)}
        </p>
        <p>apaFinalVerified: {String(completionPreview.safetyFlags.apaFinalVerified)}</p>
      </div>

      <div
        className="mt-2 grid gap-2"
        data-testid="source-card-metadata-completion-future-actions"
      >
        {completionPreview.futureActions.map((action) => (
          <button
            className="w-full cursor-not-allowed whitespace-normal break-words border-2 border-studio-line bg-studio-ink/60 px-3 py-2 text-xs font-black uppercase leading-5 text-slate-500 opacity-75 shadow-pixel"
            data-testid="source-card-metadata-completion-future-action"
            disabled={action.disabled}
            key={action.label}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function SavedSourceDocumentAuditTrace({
  error,
  events,
  isReading
}: {
  error: string | null;
  events: SavedIntakeSourceDocumentAuditEvent[];
  isReading: boolean;
}) {
  return (
    <section
      className="mt-3 border-t border-studio-line/70 pt-3"
      data-testid="saved-intake-source-document-audit-trace"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black uppercase text-slate-400">Intake audit trace</p>
          <p className="mt-1 font-bold leading-5 text-slate-300">
            Compact read-only trace for this SourceDocument candidate.
          </p>
        </div>
        <span className="status-pill">Read only</span>
      </div>

      {error ? (
        <p
          className="mt-2 border-l-4 border-studio-rose bg-studio-rose/10 p-2 font-black leading-5 text-studio-rose"
          data-testid="saved-intake-source-document-audit-error"
        >
          {error}
        </p>
      ) : null}

      {isReading ? (
        <p
          className="mt-2 border-l-4 border-studio-blue bg-studio-blue/10 p-2 font-black leading-5 text-studio-blue"
          data-testid="saved-intake-source-document-audit-loading"
        >
          Reading intake audit trace. No records are modified.
        </p>
      ) : events.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {events.map((event) => (
            <article
              className="border border-studio-line bg-studio-ink/60 p-2"
              data-testid="saved-intake-source-document-audit-event"
              key={event.auditEventId}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words font-black text-white">
                    {event.eventType}
                  </p>
                  <p className="mt-1 break-words font-bold uppercase text-studio-blue">
                    {event.auditEventId}
                  </p>
                </div>
                <span className="status-pill">{event.resultStatus}</span>
              </div>
              <dl className="mt-2 grid gap-1 font-bold leading-5 text-slate-300">
                <SourceDocumentResultDetail
                  label="Candidate ID"
                  value={event.candidateId}
                />
                <SourceDocumentResultDetail
                  label="Package ID"
                  value={event.packageId}
                />
                <SourceDocumentResultDetail
                  label="SourceDocument ID"
                  value={event.sourceDocumentId ?? "Not available"}
                />
                <SourceDocumentResultDetail
                  label="Read-back"
                  value={event.readBackStatus ?? "Not available"}
                />
                <SourceDocumentResultDetail
                  label="Created"
                  value={event.createdAt || "Not available"}
                />
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p
          className="mt-2 border-l-4 border-studio-gold bg-studio-gold/10 p-2 font-black leading-5 text-studio-gold"
          data-testid="saved-intake-source-document-audit-empty"
        >
          No intake audit events found for this record.
        </p>
      )}
    </section>
  );
}

function SourceDocumentResultDetail({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[128px_minmax(0,1fr)] gap-2">
      <dt className="text-[10px] font-black uppercase text-slate-500">{label}</dt>
      <dd className="break-words text-slate-200">{value}</dd>
    </div>
  );
}

function summarizeSourceDocumentSaveResult(
  result: SaveIntakeSourceDocumentCandidatesResult
) {
  return {
    alreadyExistsCount: result.candidateResults.filter(
      (candidateResult) => candidateResult.status === "already_exists"
    ).length,
    failedReadBackCount: result.candidateResults.filter(
      (candidateResult) => candidateResult.status === "failed_read_back"
    ).length,
    readBackVerifiedCount: result.candidateResults.filter(
      (candidateResult) => candidateResult.readBackVerified
    ).length,
    rejectedCount: result.candidateResults.filter(
      (candidateResult) => candidateResult.status === "rejected"
    ).length,
    savedCount: result.candidateResults.filter(
      (candidateResult) => candidateResult.status === "saved"
    ).length,
    totalSubmitted: result.candidateResults.length
  };
}

function buildIncomingPackagePreflightPreview(checks: IncomingPackagePreflightCheck[]) {
  return {
    blockedCount: checks.filter((check) => check.status === "blocked").length,
    needsReviewCount: checks.filter((check) => check.status === "needs_review").length,
    passedCount: checks.filter((check) => check.status === "passed").length
  };
}

function isReadySourceDocumentSaveCandidate(
  candidate: SourceDocumentIntakeSaveCandidate
): boolean {
  return (
    candidate.readinessStatus === "ready" &&
    candidate.blockers.length === 0 &&
    ["PDF", "DOCX"].includes(candidate.sourceType) &&
    candidate.sourceFileName.trim().length > 0 &&
    candidate.candidateSourceDocumentTitle.trim().length > 0
  );
}

function mapSourceDocumentIntakeSaveCandidateToSavePayload(
  candidate: SourceDocumentIntakeSaveCandidate
) {
  return {
    candidateId: candidate.candidateId,
    explicitApproval: true,
    fileName: candidate.sourceFileName,
    fileSize: parseFileSizeLabel(candidate.fileSizeLabel),
    fileType: candidate.sourceType,
    localPathPolicy: "local_path_reference_only",
    localPathReference: null,
    readinessStatus: "ready",
    reviewStatus: "approved_for_source_document_save",
    safetyFlags: {
      aiProcessed: false,
      classified: false,
      parsed: false,
      persisted: false,
      sourceCardCreated: false,
      sourceDocumentCreated: false
    },
    sourceDocumentId: null,
    sourceType: "academic_source",
    title: candidate.candidateSourceDocumentTitle
  };
}

function parseFileSizeLabel(fileSizeLabel?: string): number | null {
  if (!fileSizeLabel) {
    return null;
  }

  const [rawValue, rawUnit] = fileSizeLabel.trim().split(/\s+/);
  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    return null;
  }

  const unit = rawUnit?.toLowerCase();
  if (unit === "mb") {
    return Math.round(value * 1024 * 1024);
  }
  if (unit === "kb") {
    return Math.round(value * 1024);
  }

  return Math.round(value);
}

function createQaIntakeSourceDocumentSaveResult(
  preview: typeof sourceDocumentIntakeSaveCandidatePreviewMock,
  candidates: SourceDocumentIntakeSaveCandidate[],
  resultStatus: "saved" | "already_exists"
): SaveIntakeSourceDocumentCandidatesResult {
  return {
    auditEventIds: candidates.map(
      (candidate) => `qa-audit-${candidate.candidateId}`
    ),
    auditEventsWritten: candidates.length > 0,
    auditLimitation:
      candidates.length > 0
        ? "QA mode simulates audit-visible SourceDocument-only save; Rust tests cover SQLite audit writes."
        : "No ready SourceDocument candidates were submitted.",
    blockers: [],
    candidateResults: candidates.map((candidate) => ({
      auditEventIds: [`qa-audit-${candidate.candidateId}`],
      blockers: [],
      candidateId: candidate.candidateId,
      fileName: candidate.sourceFileName,
      fileType: candidate.sourceType,
      readBackVerified: true,
      sourceDocument: {
        citationReadiness: "missing_metadata",
        createdFromCandidateId: candidate.candidateId,
        fileName: candidate.sourceFileName,
        fileSize: parseFileSizeLabel(candidate.fileSizeLabel),
        fileType: candidate.sourceType,
        localPathPolicy: "local_path_reference_only",
        localPathReference: null,
        metadataStatus: "intake_ready",
        parserStatus: "not_started",
        reviewStatus: "approved_for_source_document_save",
        sourceDocumentId: `intake-source-document-${candidate.candidateId}`,
        title: candidate.candidateSourceDocumentTitle
      },
      sourceDocumentId: `intake-source-document-${candidate.candidateId}`,
      status: resultStatus,
      warnings: [
        "QA mode simulates the UI result; backend audit writes are covered by Rust tests."
      ]
    })),
    dbPath: "qa-mode://local-vault/atp-knowledge-vault.sqlite",
    packageId: preview.packageId,
    saved: candidates.length > 0,
    sourceCardCreated: false,
    warnings: [
      "SourceDocument-only QA result. SourceCard, parser, classifier, AI, citation, APA, and export remain disabled."
    ]
  };
}

function createQaSavedSourceDocumentRootList(
  result: SaveIntakeSourceDocumentCandidatesResult
): SavedSourceDocumentListItem[] {
  return result.candidateResults
    .filter((candidateResult) => candidateResult.sourceDocument)
    .map((candidateResult) => {
      const sourceDocument = candidateResult.sourceDocument;

      return {
        citationReadiness: sourceDocument?.citationReadiness ?? "missing_metadata",
        createdAt: "qa-mode",
        createdFromCandidateId:
          sourceDocument?.createdFromCandidateId ?? candidateResult.candidateId,
        extractionStatus: "missing",
        fileName: sourceDocument?.fileName ?? candidateResult.fileName,
        fileType: sourceDocument?.fileType ?? candidateResult.fileType,
        localPathPolicy: sourceDocument?.localPathPolicy ?? "local_path_reference_only",
        localPathReference: sourceDocument?.localPathReference ?? null,
        metadataStatus: sourceDocument?.metadataStatus ?? "intake_ready",
        parserStatus: sourceDocument?.parserStatus ?? "not_started",
        reviewStatus:
          sourceDocument?.reviewStatus ?? "approved_for_source_document_save",
        segmentCount: 0,
        sourceDocumentId:
          sourceDocument?.sourceDocumentId ??
          candidateResult.sourceDocumentId ??
          `intake-source-document-${candidateResult.candidateId}`,
        title: sourceDocument?.title ?? candidateResult.fileName,
        traceCount: 0,
        updatedAt: "qa-mode"
      };
    });
}

function createQaSavedSourceDocumentRoot(
  result: SaveIntakeSourceDocumentCandidatesResult
): SavedSourceDocumentRecord | null {
  const item = createQaSavedSourceDocumentRootList(result)[0];

  if (!item) {
    return null;
  }

  return {
    citationReadiness: item.citationReadiness,
    createdAt: item.createdAt,
    createdFromCandidateId: item.createdFromCandidateId,
    fileName: item.fileName,
    fileType: item.fileType,
    localPathPolicy: item.localPathPolicy,
    localPathReference: item.localPathReference,
    metadataStatus: item.metadataStatus,
    parserStatus: item.parserStatus,
    reviewStatus: item.reviewStatus,
    sourceDocumentId: item.sourceDocumentId,
    title: item.title,
    updatedAt: item.updatedAt
  };
}

function createQaIntakeAuditEvents(
  result: SaveIntakeSourceDocumentCandidatesResult
): SavedIntakeSourceDocumentAuditEvent[] {
  return result.candidateResults
    .filter((candidateResult) => candidateResult.sourceDocumentId)
    .map((candidateResult) => ({
      auditEventId:
        candidateResult.auditEventIds[0] ??
        `qa-audit-${candidateResult.candidateId}`,
      blockersJson: JSON.stringify(candidateResult.blockers),
      candidateId: candidateResult.candidateId,
      commandName: "save_intake_source_document_candidates",
      createdAt: "qa-mode",
      eventType:
        candidateResult.status === "already_exists"
          ? "intake_source_document_save_already_exists"
          : "intake_source_document_save_succeeded",
      message: "QA mode read-only audit trace for SourceDocument intake save.",
      packageId: result.packageId,
      readBackStatus: candidateResult.readBackVerified ? "verified" : "failed",
      resultStatus: candidateResult.status,
      safetyFlagsJson: JSON.stringify({
        aiProcessed: false,
        classified: false,
        parsed: false,
        persisted: false,
        sourceCardCreated: false,
        sourceDocumentCreated: false
      }),
      sourceDocumentId: candidateResult.sourceDocumentId,
      warningsJson: JSON.stringify(candidateResult.warnings)
    }));
}

function formatSavedSourceDocumentReadError(error: unknown): string {
  return typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : "Unable to read saved SourceDocuments from local vault.";
}

function isSourceLibraryQaModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("qa") === "source-library";
}
