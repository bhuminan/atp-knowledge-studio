import type {
  DraftQualityReadiness,
  DraftQualityReviewPreview as DraftQualityReviewPreviewModel
} from "../../../lib/sources/DraftQualityReviewMapper";
import { SummaryStat } from "./SourceLibraryPrimitives";

interface DraftQualityReviewPreviewProps {
  review: DraftQualityReviewPreviewModel;
}

const readinessLabels: Record<DraftQualityReadiness, string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

export function DraftQualityReviewPreview({
  review
}: DraftQualityReviewPreviewProps) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="draft-quality-review-preview"
    >
      <div className="border-2 border-studio-blue bg-studio-blue/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-blue">
              Draft Quality & Citation Risk Review
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="draft-quality-preview-only-notice"
            >
              Preview only — no draft is validated or saved.
            </p>
          </div>
          <span className="status-pill">
            {readinessLabels[review.overallReadiness]}
          </span>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="draft-quality-overall-readiness"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Overall readiness
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-white">
            {readinessLabels[review.overallReadiness]}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Review ID: {review.reviewId}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryStat label="Sections" value={review.sectionReviews.length} />
          <SummaryStat label="Warnings" value={review.warnings.length} />
          <SummaryStat label="Blockers" value={review.blockers.length} />
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="draft-quality-section-reviews"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Section-by-section quality review
          </p>
          <div className="mt-2 grid gap-2">
            {review.sectionReviews.map((section) => (
              <article
                className="border-l-4 border-studio-blue bg-studio-panel/60 p-3"
                key={section.sectionId}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-white">{section.sectionTitle}</p>
                  <span className="status-pill">
                    {readinessLabels[section.readiness]}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black uppercase text-slate-300">
                  <p>Concept: {formatBoolean(section.hasLinkedConcept)}</p>
                  <p>
                    Evidence/quote: {formatBoolean(section.hasLinkedEvidenceOrQuote)}
                  </p>
                  <p>Case: {formatBoolean(section.hasLinkedCase)}</p>
                  <p>Tags: {section.approvedTagCount}</p>
                  <p>Trace: {formatBoolean(section.hasTraceReference)}</p>
                  <p>Citation: {readinessLabels[section.citationStatus]}</p>
                </div>
                <p className="mt-3 text-xs font-black uppercase text-studio-gold">
                  {section.mockOnlyWarning}
                </p>
                <NoticeList tone="rose" values={section.blockers} />
                <NoticeList tone="gold" values={section.warnings} />
              </article>
            ))}
          </div>
        </div>

        <SummaryBlock
          dataTestId="draft-quality-evidence-coverage"
          label="Evidence coverage"
          status={review.evidenceCoverageSummary.status}
          value={review.evidenceCoverageSummary.detail}
        />
        <SummaryBlock
          dataTestId="draft-quality-citation-risk"
          label="Citation risk"
          status={review.citationRiskSummary.status}
          value={review.citationRiskSummary.detail}
        />
        <SummaryBlock
          dataTestId="draft-quality-traceability"
          label="Traceability"
          status={review.traceabilitySummary.status}
          value={review.traceabilitySummary.detail}
        />
        <SummaryBlock
          dataTestId="draft-quality-managerial-usefulness"
          label="Managerial usefulness"
          status={review.managerialUsefulnessSummary.status}
          value={review.managerialUsefulnessSummary.detail}
        />
        <SummaryBlock
          dataTestId="draft-quality-teaching-usefulness"
          label="Teaching usefulness"
          status={review.teachingUsefulnessSummary.status}
          value={review.teachingUsefulnessSummary.detail}
        />

        <div className="mt-4 border-t border-studio-line/70 pt-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Warning / blocker summary
          </p>
          <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-300">
            {review.blockers.length > 0 ? (
              review.blockers.map((blocker) => (
                <p
                  className="border-l-4 border-studio-rose bg-studio-panel/60 p-2"
                  key={blocker}
                >
                  {blocker}
                </p>
              ))
            ) : (
              <p className="border-l-4 border-studio-teal bg-studio-panel/60 p-2">
                No blocking issues in the preview-only draft quality review.
              </p>
            )}
            {review.warnings.map((warning) => (
              <p
                className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
                key={warning}
              >
                {warning}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBlock({
  dataTestId,
  label,
  status,
  value
}: {
  dataTestId: string;
  label: string;
  status: DraftQualityReadiness;
  value: string;
}) {
  return (
    <div className="mt-4 border-t border-studio-line/70 pt-3" data-testid={dataTestId}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">{label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{value}</p>
        </div>
        <span className="status-pill">{readinessLabels[status]}</span>
      </div>
    </div>
  );
}

function NoticeList({
  tone,
  values
}: {
  tone: "gold" | "rose";
  values: string[];
}) {
  if (values.length === 0) {
    return null;
  }

  const borderClass = tone === "rose" ? "border-studio-rose" : "border-studio-gold";

  return (
    <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-300">
      {values.map((value) => (
        <p className={`border-l-4 ${borderClass} bg-studio-panel/60 p-2`} key={value}>
          {value}
        </p>
      ))}
    </div>
  );
}

function formatBoolean(value: boolean): string {
  return value ? "yes" : "review";
}
