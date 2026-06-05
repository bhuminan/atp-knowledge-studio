import { SummaryStat } from "./SourceLibraryPrimitives";

type IncomingPackagePreviewStatus = "ready" | "needs_metadata" | "blocked";

interface IncomingPackagePreviewCategory {
  count: number;
  label: string;
  status: IncomingPackagePreviewStatus;
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

const categoryToneClasses: Record<IncomingPackagePreviewStatus, string> = {
  blocked: "border-studio-rose bg-studio-rose/10 text-studio-rose",
  needs_metadata: "border-studio-gold bg-studio-gold/10 text-studio-gold",
  ready: "border-studio-teal bg-studio-teal/10 text-studio-teal"
};

export function SourceLibraryIncomingPackagePreview() {
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
    </section>
  );
}
