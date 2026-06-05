import {
  createSourceDocumentIntakeSaveCandidatePreview,
  type SourceDocumentIntakeSaveCandidate,
  type SourceDocumentIntakeSaveCandidateBlocker,
  type SourceDocumentIntakeSaveCandidateReadiness,
  type SourceDocumentIntakeSaveCandidateWarning
} from "../../../lib/sources/SourceDocumentIntakeSaveCandidateMapper";
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

function buildIncomingPackagePreflightPreview(checks: IncomingPackagePreflightCheck[]) {
  return {
    blockedCount: checks.filter((check) => check.status === "blocked").length,
    needsReviewCount: checks.filter((check) => check.status === "needs_review").length,
    passedCount: checks.filter((check) => check.status === "passed").length
  };
}
