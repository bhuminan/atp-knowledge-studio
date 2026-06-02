import type {
  MarketingTagReviewStatus,
  MarketingTagSuggestion,
  MarketingTagSuggestionResult
} from "../../../lib/sources/MarketingTagSuggestionMapper";
import { SummaryStat } from "./SourceLibraryPrimitives";

interface MarketingTagSuggestionPreviewProps {
  onReviewStatusChange: (termId: string, status: MarketingTagReviewStatus) => void;
  reviewStatuses: Record<string, MarketingTagReviewStatus>;
  tagSuggestions: MarketingTagSuggestionResult;
}

export function MarketingTagSuggestionPreview({
  onReviewStatusChange,
  reviewStatuses,
  tagSuggestions
}: MarketingTagSuggestionPreviewProps) {
  const reviewedTags = createReviewedTags(tagSuggestions, reviewStatuses);
  const reviewSummary = summarizeTagReviews(reviewedTags);

  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="marketing-tag-suggestion-preview"
    >
      <div className="border-2 border-studio-gold bg-studio-gold/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-gold">
              Marketing Tag Suggestion Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="tag-suggestion-preview-only-notice"
            >
              Preview only — no tags are saved.
            </p>
          </div>
          <span className="status-pill">Controlled taxonomy</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryStat label="Core matches" value={tagSuggestions.matchedCoreTags.length} />
          <SummaryStat
            label="Extended matches"
            value={tagSuggestions.matchedExtendedTags.length}
          />
          <SummaryStat label="Suggested" value={tagSuggestions.suggestedTags.length} />
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="marketing-tag-review-summary"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Tag Review Summary
          </p>
          <p
            className="mt-1 text-xs font-black uppercase text-studio-gold"
            data-testid="tag-review-preview-only-notice"
          >
            Approved tags are applied in preview only.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <SummaryStat label="Total" value={reviewSummary.totalCount} />
            <div data-testid="approved-marketing-tags-count">
              <SummaryStat label="Approved" value={reviewSummary.approvedCount} />
            </div>
            <div data-testid="needs-review-marketing-tags-count">
              <SummaryStat label="Needs review" value={reviewSummary.needsReviewCount} />
            </div>
            <div data-testid="rejected-marketing-tags-count">
              <SummaryStat label="Rejected" value={reviewSummary.rejectedCount} />
            </div>
            <SummaryStat label="Core approved" value={reviewSummary.coreApprovedCount} />
            <SummaryStat
              label="Extended approved"
              value={reviewSummary.extendedApprovedCount}
            />
            <SummaryStat
              label="Suggested approved"
              value={reviewSummary.suggestedApprovedCount}
            />
          </div>
        </div>

        <TagGroup
          dataTestId="matched-core-tags"
          emptyLabel="No approved core taxonomy terms matched yet."
          onReviewStatusChange={onReviewStatusChange}
          title="Matched core approved tags"
          tags={reviewedTags.filter((tag) => tag.tier === "core")}
        />
        <TagGroup
          dataTestId="matched-extended-tags"
          emptyLabel="No extended candidate taxonomy terms matched yet."
          onReviewStatusChange={onReviewStatusChange}
          title="Matched extended candidate tags"
          tags={reviewedTags.filter((tag) => tag.tier === "extended")}
        />
        <TagGroup
          dataTestId="suggested-marketing-tags"
          emptyLabel="No free suggested tags were generated."
          onReviewStatusChange={onReviewStatusChange}
          title="Suggested marketing tags"
          tags={reviewedTags.filter((tag) => tag.tier === "suggested")}
        />

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="unmatched-keywords"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Unmatched keywords
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {tagSuggestions.unmatchedKeywords.length > 0
              ? tagSuggestions.unmatchedKeywords.slice(0, 8).join(", ")
              : "All visible SourceCard keywords were covered by controlled taxonomy or suggestions."}
          </p>
        </div>

        <div className="mt-4 border-t border-studio-line/70 pt-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Review warning
          </p>
          <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-300">
            {tagSuggestions.warnings.map((warning) => (
              <p className="border-l-4 border-studio-gold bg-studio-panel/60 p-2" key={warning}>
                {warning}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TagGroup({
  dataTestId,
  emptyLabel,
  onReviewStatusChange,
  tags,
  title
}: {
  dataTestId: string;
  emptyLabel: string;
  onReviewStatusChange: (termId: string, status: MarketingTagReviewStatus) => void;
  tags: ReviewedMarketingTag[];
  title: string;
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3" data-testid={dataTestId}>
      <p className="text-xs font-black uppercase text-slate-400">{title}</p>
      <div className="mt-2 grid gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <article
              className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
              key={tag.termId}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{tag.label}</p>
                  <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                    {tag.tier} · {tag.category} · {tag.reviewStatus}
                  </p>
                </div>
                <span className="status-pill">{reviewStatusLabels[tag.reviewDecision]}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <TagReviewButton
                  isActive={tag.reviewDecision === "approved"}
                  label="Approve"
                  onClick={() => onReviewStatusChange(tag.termId, "approved")}
                  testId={getTagReviewTestId(tag, "approve")}
                  tone="teal"
                />
                <TagReviewButton
                  isActive={tag.reviewDecision === "needs_review"}
                  label="Needs Review"
                  onClick={() => onReviewStatusChange(tag.termId, "needs_review")}
                  tone="gold"
                />
                <TagReviewButton
                  isActive={tag.reviewDecision === "rejected"}
                  label="Reject"
                  onClick={() => onReviewStatusChange(tag.termId, "rejected")}
                  testId={getTagReviewTestId(tag, "reject")}
                  tone="rose"
                />
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-400">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}

export interface ReviewedMarketingTag extends MarketingTagSuggestion {
  reviewDecision: MarketingTagReviewStatus;
}

interface MarketingTagReviewSummary {
  approvedCount: number;
  coreApprovedCount: number;
  extendedApprovedCount: number;
  needsReviewCount: number;
  rejectedCount: number;
  suggestedApprovedCount: number;
  totalCount: number;
}

const reviewStatusLabels: Record<MarketingTagReviewStatus, string> = {
  approved: "Approved",
  needs_review: "Needs review",
  rejected: "Rejected"
};

export function createReviewedTags(
  tagSuggestions: MarketingTagSuggestionResult,
  reviewStatuses: Record<string, MarketingTagReviewStatus>
): ReviewedMarketingTag[] {
  return [
    ...tagSuggestions.matchedCoreTags,
    ...tagSuggestions.matchedExtendedTags,
    ...tagSuggestions.suggestedTags
  ].map((tag) => ({
    ...tag,
    reviewDecision: reviewStatuses[tag.termId] ?? getDefaultReviewStatus(tag)
  }));
}

export function getApprovedTagLabels(reviewedTags: ReviewedMarketingTag[]): string[] {
  return reviewedTags
    .filter((tag) => tag.reviewDecision === "approved")
    .map((tag) => tag.label);
}

function summarizeTagReviews(reviewedTags: ReviewedMarketingTag[]): MarketingTagReviewSummary {
  const approvedTags = reviewedTags.filter((tag) => tag.reviewDecision === "approved");

  return {
    approvedCount: approvedTags.length,
    coreApprovedCount: approvedTags.filter((tag) => tag.tier === "core").length,
    extendedApprovedCount: approvedTags.filter((tag) => tag.tier === "extended").length,
    needsReviewCount: reviewedTags.filter((tag) => tag.reviewDecision === "needs_review")
      .length,
    rejectedCount: reviewedTags.filter((tag) => tag.reviewDecision === "rejected").length,
    suggestedApprovedCount: approvedTags.filter((tag) => tag.tier === "suggested").length,
    totalCount: reviewedTags.length
  };
}

function getDefaultReviewStatus(tag: MarketingTagSuggestion): MarketingTagReviewStatus {
  return tag.tier === "core" ? "approved" : "needs_review";
}

function TagReviewButton({
  isActive,
  label,
  onClick,
  testId,
  tone
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
  testId?: string;
  tone: "teal" | "gold" | "rose";
}) {
  const activeClasses: Record<typeof tone, string> = {
    gold: "border-studio-gold bg-studio-gold/25 text-studio-gold",
    rose: "border-studio-rose bg-studio-rose/25 text-studio-rose",
    teal: "border-studio-teal bg-studio-teal/25 text-studio-teal"
  };

  return (
    <button
      className={`border-2 px-2 py-2 text-xs font-black uppercase shadow-pixel ${
        isActive ? activeClasses[tone] : "border-studio-line bg-studio-panel text-slate-300"
      }`}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function getTagReviewTestId(
  tag: ReviewedMarketingTag,
  action: "approve" | "reject"
): string | undefined {
  if (action === "approve" && tag.tier === "extended") {
    return "approve-extended-marketing-tag-button";
  }

  if (action === "approve" && tag.tier === "suggested") {
    return "approve-suggested-marketing-tag-button";
  }

  if (action === "reject" && tag.tier === "core") {
    return "reject-core-marketing-tag-button";
  }

  return undefined;
}
