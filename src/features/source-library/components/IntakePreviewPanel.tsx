import type {
  ExtractionStatus,
  IntakeReviewStatus,
  IntakeSourceRecord
} from "../../../types/domain";
import { SummaryStat } from "./SourceLibraryPrimitives";

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

const intakeReviewStatusLabels: Record<IntakeReviewStatus, string> = {
  new: "New",
  needs_text_review: "Needs text review",
  needs_metadata: "Needs metadata",
  ready_for_source_card: "Ready for Source Card",
  approved: "Approved",
  rejected: "Rejected"
};

export interface IntakePreviewSummary {
  totalRecords: number;
  statusCounts: Record<ExtractionStatus, number>;
  reviewStatusCounts: Record<IntakeReviewStatus, number>;
  citationMetadataRequiredCount: number;
  citationUseAllowedCount: number;
  warningCount: number;
}

export function IntakePreviewPanel({
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
        <SummaryStat
          label="Needs text review"
          value={summary.reviewStatusCounts.needs_text_review}
        />
        <SummaryStat
          label="Needs metadata"
          value={summary.reviewStatusCounts.needs_metadata}
        />
        <SummaryStat
          label="Ready for card"
          value={summary.reviewStatusCounts.ready_for_source_card}
        />
        <SummaryStat label="Approved" value={summary.reviewStatusCounts.approved} />
        <SummaryStat
          label="Citation allowed"
          value={summary.citationUseAllowedCount}
        />
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
          const reviewStatus = intakeSource.reviewStatus ?? "new";

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
                <span className="status-pill">
                  {intakeReviewStatusLabels[reviewStatus]}
                </span>
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
