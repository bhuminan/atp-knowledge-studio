import {
  marketingTaxonomySeed,
  type MarketingTaxonomyTerm
} from "../../data/taxonomy/marketingTaxonomySeed";
import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionTrace,
  MarketingTagSaveCandidate,
  SaveCandidateValidationStatus
} from "../../types/domain";
import type {
  SavedSourceCardDetail,
  SavedSourceDocumentDetail
} from "../persistence/LocalVaultDatabase";

export type ParsedDocxMarketingTagParserSource = "real_docx_parser_mvp";

export interface ParsedDocxMarketingTagCandidate {
  candidate: MarketingTagSaveCandidate;
  category: MarketingTaxonomyTerm["category"];
  matchSource: "canonical" | "alias";
  parserSource: ParsedDocxMarketingTagParserSource;
  sourceDocumentId: string | null;
  sourceCardId: string;
  termId: string;
  tier: MarketingTaxonomyTerm["tier"];
}

export interface ParsedDocxMarketingTagCandidateReadiness {
  blockers: string[];
  candidateCount: number;
  coreMatchCount: number;
  extendedMatchCount: number;
  linkedSavedSourceCardId: string;
  linkedSavedSourceDocumentId: string | null;
  pageNumberWarning: string;
  parserSource: ParsedDocxMarketingTagParserSource;
  provenanceSummary: string;
  sourceType: "DOCX";
  validationStatus: SaveCandidateValidationStatus;
  warnings: string[];
}

export interface ParsedDocxMarketingTagCandidatePreview {
  candidates: ParsedDocxMarketingTagCandidate[];
  readiness: ParsedDocxMarketingTagCandidateReadiness;
}

export function mapParsedDocxToMarketingTagCandidates({
  extraction,
  savedSourceCard,
  savedSourceDocument,
  segments,
  traces
}: {
  extraction?: DocumentTextExtraction | null;
  savedSourceCard: SavedSourceCardDetail;
  savedSourceDocument?: SavedSourceDocumentDetail | null;
  segments?: DocumentSegment[];
  traces?: ExtractionTrace[];
}): ParsedDocxMarketingTagCandidatePreview {
  const sourceCardId = savedSourceCard.sourceCard.sourceCardId;
  const sourceDocumentId =
    savedSourceDocument?.sourceDocument.sourceDocumentId ??
    savedSourceCard.sourceDocument.sourceDocumentId ??
    null;
  const searchableText = createSearchableText({
    extraction,
    savedSourceCard,
    savedSourceDocument,
    segments
  });
  const candidates = marketingTaxonomySeed
    .map((term) =>
      matchTermToParsedDocxSource({
        normalizedText: normalizeText(searchableText),
        sourceCardId,
        sourceDocumentId,
        term
      })
    )
    .filter((candidate): candidate is ParsedDocxMarketingTagCandidate =>
      Boolean(candidate)
    );
  const blockers: string[] = [];

  if (!sourceCardId.trim()) {
    blockers.push("Saved parsed-DOCX SourceCard link is required.");
  }

  if (candidates.length === 0) {
    blockers.push("No controlled marketing taxonomy terms matched the parsed DOCX text.");
  }

  const validationStatus: SaveCandidateValidationStatus =
    blockers.length > 0 ? "blocked" : "needs_review";

  return {
    candidates,
    readiness: {
      blockers,
      candidateCount: candidates.length,
      coreMatchCount: candidates.filter((candidate) => candidate.tier === "core").length,
      extendedMatchCount: candidates.filter((candidate) => candidate.tier === "extended")
        .length,
      linkedSavedSourceCardId: sourceCardId,
      linkedSavedSourceDocumentId: sourceDocumentId,
      pageNumberWarning:
        "DOCX page numbers remain untrusted; MarketingTag provenance uses saved SourceDocument and chunk references only.",
      parserSource: "real_docx_parser_mvp",
      provenanceSummary: createProvenanceSummary({
        sourceCardId,
        sourceDocumentId,
        traceCount: traces?.length ?? savedSourceDocument?.traces.length ?? 0
      }),
      sourceType: "DOCX",
      validationStatus,
      warnings: createWarnings(candidates)
    }
  };
}

function matchTermToParsedDocxSource({
  normalizedText,
  sourceCardId,
  sourceDocumentId,
  term
}: {
  normalizedText: string;
  sourceCardId: string;
  sourceDocumentId: string | null;
  term: MarketingTaxonomyTerm;
}): ParsedDocxMarketingTagCandidate | null {
  const canonicalLabel = normalizeText(term.canonicalLabel);

  if (normalizedText.includes(canonicalLabel)) {
    return createCandidate({ matchSource: "canonical", sourceCardId, sourceDocumentId, term });
  }

  const matchingAlias = term.aliases.find((alias) =>
    normalizedText.includes(normalizeText(alias))
  );

  if (matchingAlias) {
    return createCandidate({ matchSource: "alias", sourceCardId, sourceDocumentId, term });
  }

  return null;
}

function createCandidate({
  matchSource,
  sourceCardId,
  sourceDocumentId,
  term
}: {
  matchSource: ParsedDocxMarketingTagCandidate["matchSource"];
  sourceCardId: string;
  sourceDocumentId: string | null;
  term: MarketingTaxonomyTerm;
}): ParsedDocxMarketingTagCandidate {
  return {
    candidate: {
      candidateId: `parsed-docx-marketing-tag-${term.id}`,
      createdFrom: "marketing_tag_review_preview",
      derivedFrom: {
        label: term.canonicalLabel,
        sourceCardSaveCandidateId: sourceCardId
      },
      label: term.canonicalLabel,
      notPersisted: true,
      review: {
        reviewedAt: "preview-only-not-persisted",
        reviewer: "local_mock_user",
        reviewStatus: "needs_review"
      },
      validationStatus: "needs_review"
    },
    category: term.category,
    matchSource,
    parserSource: "real_docx_parser_mvp",
    sourceCardId,
    sourceDocumentId,
    termId: term.id,
    tier: term.tier
  };
}

function createSearchableText({
  extraction,
  savedSourceCard,
  savedSourceDocument,
  segments
}: {
  extraction?: DocumentTextExtraction | null;
  savedSourceCard: SavedSourceCardDetail;
  savedSourceDocument?: SavedSourceDocumentDetail | null;
  segments?: DocumentSegment[];
}): string {
  return [
    savedSourceCard.sourceCard.title,
    savedSourceCard.sourceCard.citationText,
    savedSourceCard.sourceDocument.title,
    savedSourceDocument?.sourceDocument.title,
    savedSourceDocument?.sourceDocument.fileName,
    extraction?.cleanedText,
    extraction?.rawText,
    ...(segments ?? savedSourceDocument?.segments ?? []).flatMap((segment) => [
      segment.title,
      segment.content,
      "tags" in segment ? segment.tags.join(" ") : ""
    ])
  ]
    .filter(Boolean)
    .join(" ");
}

function createProvenanceSummary({
  sourceCardId,
  sourceDocumentId,
  traceCount
}: {
  sourceCardId: string;
  sourceDocumentId: string | null;
  traceCount: number;
}): string {
  return [
    `savedSourceCard:${sourceCardId}`,
    sourceDocumentId ? `savedSourceDocument:${sourceDocumentId}` : "savedSourceDocument:unavailable",
    `traceCount:${traceCount}`,
    "taxonomy:controlled_seed_only"
  ].join(" · ");
}

function createWarnings(candidates: ParsedDocxMarketingTagCandidate[]): string[] {
  const warnings = [
    "Candidates only — MarketingTags are not auto-saved.",
    "Controlled taxonomy only; no new taxonomy terms were invented.",
    "All parsed-DOCX MarketingTag candidates remain needs_review until user approval.",
    "MarketingTag candidates do not imply final academic citation readiness."
  ];

  if (candidates.some((candidate) => candidate.tier === "extended")) {
    warnings.push("Extended taxonomy matches require human review before save.");
  }

  return warnings;
}

function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
