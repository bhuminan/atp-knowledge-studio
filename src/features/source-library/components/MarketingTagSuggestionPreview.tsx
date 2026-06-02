import type { MarketingTagSuggestionResult } from "../../../lib/sources/MarketingTagSuggestionMapper";
import { SummaryStat } from "./SourceLibraryPrimitives";

interface MarketingTagSuggestionPreviewProps {
  tagSuggestions: MarketingTagSuggestionResult;
}

export function MarketingTagSuggestionPreview({
  tagSuggestions
}: MarketingTagSuggestionPreviewProps) {
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

        <TagGroup
          dataTestId="matched-core-tags"
          emptyLabel="No approved core taxonomy terms matched yet."
          title="Matched core approved tags"
          tags={tagSuggestions.matchedCoreTags}
        />
        <TagGroup
          dataTestId="matched-extended-tags"
          emptyLabel="No extended candidate taxonomy terms matched yet."
          title="Matched extended candidate tags"
          tags={tagSuggestions.matchedExtendedTags}
        />
        <TagGroup
          dataTestId="suggested-marketing-tags"
          emptyLabel="No free suggested tags were generated."
          title="Suggested marketing tags"
          tags={tagSuggestions.suggestedTags}
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
  tags,
  title
}: {
  dataTestId: string;
  emptyLabel: string;
  tags: MarketingTagSuggestionResult["matchedCoreTags"];
  title: string;
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3" data-testid={dataTestId}>
      <p className="text-xs font-black uppercase text-slate-400">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <span
              className="border border-studio-line bg-studio-panel px-2 py-1 text-xs font-black uppercase text-slate-200"
              key={tag.termId}
            >
              {tag.label} · {tag.reviewStatus}
            </span>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-400">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}
