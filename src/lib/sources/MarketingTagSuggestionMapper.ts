import {
  marketingTaxonomySeed,
  type MarketingTaxonomyTerm
} from "../../data/taxonomy/marketingTaxonomySeed";
import type { DraftInputKnowledgeCard } from "./DraftInputPackageMapper";
import type { SourceDocument } from "../../types/domain";

interface MarketingTagSourceCardCandidate {
  abstract: string;
  keywords: string[];
  title: string;
}

export interface MarketingTagSuggestionInput {
  cleanedText: string;
  knowledgeCardCandidates?: DraftInputKnowledgeCard[];
  sourceCardCandidate?: MarketingTagSourceCardCandidate;
  sourceDocumentCandidate: Partial<SourceDocument>;
}

export interface MarketingTagSuggestionResult {
  matchedCoreTags: MarketingTagSuggestion[];
  matchedExtendedTags: MarketingTagSuggestion[];
  suggestedTags: MarketingTagSuggestion[];
  unmatchedKeywords: string[];
  warnings: string[];
}

export interface MarketingTagSuggestion {
  category: MarketingTaxonomyTerm["category"] | "Suggested";
  label: string;
  matchSource: "canonical" | "alias" | "keyword";
  reviewStatus: "approved_seed" | "candidate_seed" | "suggested_only";
  termId: string;
  tier: MarketingTaxonomyTerm["tier"] | "suggested";
}

const maxMatchedTagsPerTier = 12;
const maxSuggestedTags = 8;

export function suggestMarketingTags({
  cleanedText,
  knowledgeCardCandidates = [],
  sourceCardCandidate,
  sourceDocumentCandidate
}: MarketingTagSuggestionInput): MarketingTagSuggestionResult {
  const normalizedText = normalizeText(
    [
      cleanedText,
      sourceDocumentCandidate.title,
      sourceDocumentCandidate.metadata?.title,
      sourceCardCandidate?.title,
      sourceCardCandidate?.abstract,
      sourceCardCandidate?.keywords.join(" "),
      ...knowledgeCardCandidates.flatMap((candidate) => [candidate.title, candidate.detail])
    ]
      .filter(Boolean)
      .join(" ")
  );
  const matchedTerms = marketingTaxonomySeed
    .map((term) => matchTaxonomyTerm(term, normalizedText))
    .filter((match): match is MarketingTagSuggestion => Boolean(match));
  const dedupedMatches = dedupeSuggestions(matchedTerms);
  const matchedCoreTags = dedupedMatches
    .filter((match) => match.tier === "core")
    .slice(0, maxMatchedTagsPerTier);
  const matchedExtendedTags = dedupedMatches
    .filter((match) => match.tier === "extended")
    .slice(0, maxMatchedTagsPerTier);
  const sourceKeywords = sourceCardCandidate?.keywords ?? [];
  const unmatchedKeywords = sourceKeywords.filter(
    (keyword) =>
      !dedupedMatches.some(
        (match) => normalizeText(match.label) === normalizeText(keyword)
      )
  );
  const suggestedTags = unmatchedKeywords
    .slice(0, maxSuggestedTags)
    .map((keyword, index): MarketingTagSuggestion => ({
      category: "Suggested",
      label: keyword,
      matchSource: "keyword",
      reviewStatus: "suggested_only",
      termId: `suggested-marketing-tag-${index + 1}`,
      tier: "suggested"
    }));
  const warnings = createTagSuggestionWarnings({
    matchedCoreTags,
    matchedExtendedTags,
    suggestedTags,
    unmatchedKeywords
  });

  return {
    matchedCoreTags,
    matchedExtendedTags,
    suggestedTags,
    unmatchedKeywords,
    warnings
  };
}

function matchTaxonomyTerm(
  term: MarketingTaxonomyTerm,
  normalizedText: string
): MarketingTagSuggestion | null {
  const canonicalLabel = normalizeText(term.canonicalLabel);

  if (normalizedText.includes(canonicalLabel)) {
    return createSuggestion(term, "canonical");
  }

  const matchingAlias = term.aliases.find((alias) =>
    normalizedText.includes(normalizeText(alias))
  );

  if (matchingAlias) {
    return createSuggestion(term, "alias");
  }

  return null;
}

function createSuggestion(
  term: MarketingTaxonomyTerm,
  matchSource: MarketingTagSuggestion["matchSource"]
): MarketingTagSuggestion {
  return {
    category: term.category,
    label: term.canonicalLabel,
    matchSource,
    reviewStatus: term.reviewStatus,
    termId: term.id,
    tier: term.tier
  };
}

function dedupeSuggestions(
  suggestions: MarketingTagSuggestion[]
): MarketingTagSuggestion[] {
  const seenTermIds = new Set<string>();

  return suggestions.filter((suggestion) => {
    if (seenTermIds.has(suggestion.termId)) {
      return false;
    }

    seenTermIds.add(suggestion.termId);
    return true;
  });
}

function createTagSuggestionWarnings({
  matchedCoreTags,
  matchedExtendedTags,
  suggestedTags,
  unmatchedKeywords
}: {
  matchedCoreTags: MarketingTagSuggestion[];
  matchedExtendedTags: MarketingTagSuggestion[];
  suggestedTags: MarketingTagSuggestion[];
  unmatchedKeywords: string[];
}): string[] {
  const warnings = [
    "Preview only — no tags are saved.",
    "Extended taxonomy matches need human review before default use."
  ];

  if (matchedCoreTags.length === 0) {
    warnings.push("No approved core taxonomy terms were matched.");
  }

  if (matchedExtendedTags.length === 0) {
    warnings.push("No extended candidate taxonomy terms were matched.");
  }

  if (suggestedTags.length > 0) {
    warnings.push("Suggested tags are free-tag candidates and remain review-only.");
  }

  if (unmatchedKeywords.length > suggestedTags.length) {
    warnings.push("Some SourceCard keywords were not shown to keep the preview concise.");
  }

  return warnings;
}

function normalizeText(text: string): string {
  return text.toLocaleLowerCase().replace(/[^a-z0-9ก-๙]+/g, " ").replace(/\s+/g, " ").trim();
}
