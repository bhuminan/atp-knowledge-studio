import { useMemo, useRef, useState } from "react";
import {
  createSourceDocumentIntakeSaveCandidatePreview,
  type SourceDocumentIntakeSaveCandidate,
  type SourceDocumentIntakeSaveCandidateBlocker,
  type SourceDocumentIntakeSaveCandidateReadiness,
  type SourceDocumentIntakeSaveCandidateWarning
} from "../../../lib/sources/SourceDocumentIntakeSaveCandidateMapper";
import {
  saveIntakeSourceDocumentCandidates,
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
  missing_file_name: "Missing file name",
  missing_title: "Missing title",
  unsupported_file_type: "Unsupported file type"
};

const sourceDocumentCandidateWarningLabels: Record<
  SourceDocumentIntakeSaveCandidateWarning,
  string
> = {
  apa_final_not_implied: "APA-final readiness is not implied",
  citation_metadata_not_final: "Citation metadata is not final",
  metadata_incomplete: "Metadata needs review",
  parser_disabled: "Parser remains disabled",
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
        setSaveResult(
          createQaIntakeSourceDocumentSaveResult(
            preview,
            saveCandidates,
            qaRepeatSave ? "already_exists" : "saved"
          )
        );
        return;
      }

      const result = await saveIntakeSourceDocumentCandidates({
        candidates: saveCandidates.map(mapSourceDocumentIntakeSaveCandidateToSavePayload),
        intendedDestination: "Source Library Intake",
        packageId: preview.packageId,
        source: preview.source
      });
      setSaveResult(result);
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
          <SourceDocumentIntakeSaveResultPanel result={saveResult} />
        ) : null}
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
  result
}: {
  result: SaveIntakeSourceDocumentCandidatesResult;
}) {
  const verifiedCount = result.candidateResults.filter(
    (candidateResult) => candidateResult.readBackVerified
  ).length;
  const showSuccess =
    result.saved &&
    result.candidateResults.length > 0 &&
    result.candidateResults.every((candidateResult) => candidateResult.readBackVerified);

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

      <div className="mt-3 grid grid-cols-3 gap-2">
        <SummaryStat label="Candidates" value={result.candidateResults.length} />
        <SummaryStat label="Read back" value={verifiedCount} />
        <SummaryStat label="SourceCards" value={result.sourceCardCreated ? 1 : 0} />
      </div>

      <p
        className="mt-3 text-xs font-bold leading-5 text-slate-300"
        data-testid="source-document-explicit-save-audit-status"
      >
        auditEventsWritten: {result.auditEventsWritten ? "true" : "false"} ·{" "}
        {result.auditLimitation}
      </p>

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
            <p className="mt-2 font-bold leading-5 text-slate-300">
              SourceDocument ID: {candidateResult.sourceDocumentId ?? "None"}
            </p>
            <p className="mt-1 font-bold leading-5 text-slate-300">
              Audit events:{" "}
              {candidateResult.auditEventIds.length > 0
                ? candidateResult.auditEventIds.join(", ")
                : "None"}
            </p>
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
    </section>
  );
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

function isSourceLibraryQaModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("qa") === "source-library";
}
