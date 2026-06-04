import {
  marketingTaxonomySeed,
  type MarketingTaxonomyCategory
} from "../../data/taxonomy/marketingTaxonomySeed";
import type { DocumentExtractionResponse } from "./LocalDocumentExtraction";
import type { LocalDocumentFileIntakeJob } from "./LocalDocumentFilePicker";

export type ParsedDocxClassificationPreviewStatus =
  | "not_started"
  | "available"
  | "needs_parsed_docx"
  | "preview_ready";

export type ParsedDocxClassificationSourceType =
  | "article"
  | "book_chapter"
  | "report"
  | "teaching_note"
  | "unknown";

export type ParsedDocxClassificationConfidence = "high" | "medium" | "low";

export interface ParsedDocxClassificationSignal {
  label: string;
  source: "filename" | "title" | "segment_content" | "metadata";
  strength: ParsedDocxClassificationConfidence;
  value: string;
}

export interface ParsedDocxSuggestedMarketingTag {
  category: MarketingTaxonomyCategory | "Needs Review";
  confidence: ParsedDocxClassificationConfidence;
  label: string;
  reason: string;
}

export interface ParsedDocxSuggestedTextbookSection {
  confidence: ParsedDocxClassificationConfidence;
  reason: string;
  section: string;
}

export interface ParsedDocxClassificationPreview {
  blockers: string[];
  sourceSignals: ParsedDocxClassificationSignal[];
  status: ParsedDocxClassificationPreviewStatus;
  suggestedMarketingTags: ParsedDocxSuggestedMarketingTag[];
  suggestedSourceType: ParsedDocxClassificationSourceType;
  suggestedSourceTypeReason: string;
  suggestedTextbookSections: ParsedDocxSuggestedTextbookSection[];
  warnings: string[];
}

interface SourceTypeRule {
  label: ParsedDocxClassificationSourceType;
  keywords: string[];
  reason: string;
}

const maxSuggestedTags = 8;

const sourceTypeRules: SourceTypeRule[] = [
  {
    label: "article",
    keywords: ["abstract", "journal", "doi", "literature review", "methodology", "findings"],
    reason: "Academic article-like terms were found in the parsed DOCX text."
  },
  {
    label: "book_chapter",
    keywords: ["chapter", "learning objectives", "discussion questions", "textbook"],
    reason: "Chapter or textbook-learning terms were found in the parsed DOCX text."
  },
  {
    label: "report",
    keywords: ["report", "executive summary", "white paper", "industry analysis"],
    reason: "Report-like structure terms were found in the parsed DOCX text."
  },
  {
    label: "teaching_note",
    keywords: ["teaching note", "lesson plan", "class activity", "teaching case"],
    reason: "Teaching-support terms were found in the parsed DOCX text."
  }
];

const textbookSectionByCategory: Record<MarketingTaxonomyCategory, string> = {
  "Branding": "Brand strategy and brand equity",
  "Consumer Behavior": "Consumer behavior and decision journeys",
  "Core Marketing / Strategy": "Marketing strategy and positioning",
  "Customer Experience": "Customer experience management",
  "Digital Marketing": "Digital marketing and analytics",
  "Emerging Marketing Topics": "Emerging marketing topics",
  "Integrated Marketing Communication": "Marketing communication planning",
  "Marketing Research": "Marketing research and insight generation",
  "Product Management": "Product and service management",
  "Service Management": "Service quality and service experience"
};

export function createParsedDocxClassificationPreview({
  extractionResponse,
  selectedLocalFile
}: {
  extractionResponse?: DocumentExtractionResponse | null;
  selectedLocalFile?: LocalDocumentFileIntakeJob | null;
}): ParsedDocxClassificationPreview {
  if (!selectedLocalFile && !extractionResponse) {
    return createEmptyPreview({
      blockers: ["Paste a local DOCX path and run parsing before classification preview."],
      status: "not_started"
    });
  }

  if (!extractionResponse) {
    const isDocx = selectedLocalFile?.fileType === "DOCX";

    return createEmptyPreview({
      blockers: [
        isDocx
          ? "Run DOCX parsing before reviewing classification and tag suggestions."
          : "Classification preview needs parsed DOCX text. PDF remains metadata-only/queued."
      ],
      status: isDocx ? "available" : "needs_parsed_docx"
    });
  }

  const sourceSignals = createSourceSignals({
    extractionResponse,
    selectedLocalFile
  });
  const normalizedText = normalizeText(
    [
      extractionResponse.fileIntakeJob.fileName,
      selectedLocalFile?.fileName,
      extractionResponse.extraction.cleanedText,
      extractionResponse.extraction.rawText,
      ...extractionResponse.segments.flatMap((segment) => [
        segment.title,
        segment.content,
        segment.tags.join(" ")
      ])
    ].join(" ")
  );
  const suggestedMarketingTags = createSuggestedMarketingTags(normalizedText);
  const sourceType = inferSourceType(normalizedText);

  return {
    blockers: [],
    sourceSignals,
    status: "preview_ready",
    suggestedMarketingTags:
      suggestedMarketingTags.length > 0
        ? suggestedMarketingTags
        : [
            {
              category: "Needs Review",
              confidence: "low",
              label: "Needs human classification",
              reason: "No strong controlled marketing concept matched the parsed DOCX text."
            }
          ],
    suggestedSourceType: sourceType.sourceType,
    suggestedSourceTypeReason: sourceType.reason,
    suggestedTextbookSections: createTextbookSectionSuggestions(suggestedMarketingTags),
    warnings: createWarnings({
      hasSignals: sourceSignals.length > 0,
      suggestedMarketingTags
    })
  };
}

function createEmptyPreview({
  blockers,
  status
}: {
  blockers: string[];
  status: ParsedDocxClassificationPreviewStatus;
}): ParsedDocxClassificationPreview {
  return {
    blockers,
    sourceSignals: [],
    status,
    suggestedMarketingTags: [],
    suggestedSourceType: "unknown",
    suggestedSourceTypeReason: "Needs parsed DOCX text before source type can be suggested.",
    suggestedTextbookSections: [],
    warnings: [
      "Preview only - no tags are saved.",
      "Human review is required.",
      "No AI or external provider is used.",
      "No persistence is performed."
    ]
  };
}

function createSourceSignals({
  extractionResponse,
  selectedLocalFile
}: {
  extractionResponse: DocumentExtractionResponse;
  selectedLocalFile?: LocalDocumentFileIntakeJob | null;
}): ParsedDocxClassificationSignal[] {
  const fileName = selectedLocalFile?.fileName ?? extractionResponse.fileIntakeJob.fileName;
  const titleFromFile = createTitleFromFilename(fileName);
  const firstSegment = extractionResponse.segments.find((segment) =>
    hasText(segment.title) || hasText(segment.content)
  );
  const textLength = (
    extractionResponse.extraction.cleanedText || extractionResponse.extraction.rawText
  ).trim().length;

  return [
    hasText(fileName)
      ? {
          label: "Filename signal",
          source: "filename",
          strength: "medium",
          value: fileName
        }
      : null,
    hasText(titleFromFile)
      ? {
          label: "Title signal",
          source: "title",
          strength: "low",
          value: titleFromFile
        }
      : null,
    firstSegment
      ? {
          label: "Segment/content signal",
          source: "segment_content",
          strength: textLength > 1200 ? "high" : "medium",
          value: `${firstSegment.title}: ${firstSegment.content}`.slice(0, 180)
        }
      : null,
    {
      label: "Metadata signal",
      source: "metadata",
      strength: extractionResponse.extraction.confidenceScore >= 80 ? "medium" : "low",
      value: `Parser confidence ${extractionResponse.extraction.confidenceScore}; ${extractionResponse.segments.length} segment(s).`
    }
  ].filter((signal): signal is ParsedDocxClassificationSignal => Boolean(signal));
}

function createSuggestedMarketingTags(
  normalizedText: string
): ParsedDocxSuggestedMarketingTag[] {
  const suggestions: ParsedDocxSuggestedMarketingTag[] = [];

  marketingTaxonomySeed.forEach((term) => {
    const canonical = normalizeText(term.canonicalLabel);
    const canonicalMatched = normalizedText.includes(canonical);
    const aliasMatched = term.aliases.some((alias) =>
      normalizedText.includes(normalizeText(alias))
    );

    if (!canonicalMatched && !aliasMatched) {
      return;
    }

    suggestions.push({
        category: term.category,
        confidence: getTagConfidence({
          canonicalMatched,
          normalizedText,
          tier: term.tier
        }),
        label: term.canonicalLabel,
        reason: canonicalMatched
          ? "Matched a controlled taxonomy label in parsed DOCX text."
          : "Matched a controlled taxonomy alias in parsed DOCX text."
    });
  });

  return suggestions
    .sort((left, right) => confidenceRank(right.confidence) - confidenceRank(left.confidence))
    .slice(0, maxSuggestedTags);
}

function inferSourceType(normalizedText: string): {
  reason: string;
  sourceType: ParsedDocxClassificationSourceType;
} {
  const matchedRule = sourceTypeRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedText.includes(normalizeText(keyword)))
  );

  if (matchedRule) {
    return {
      reason: matchedRule.reason,
      sourceType: matchedRule.label
    };
  }

  return {
    reason: "No conservative source type rule matched. Human review should decide.",
    sourceType: "unknown"
  };
}

function createTextbookSectionSuggestions(
  suggestedMarketingTags: ParsedDocxSuggestedMarketingTag[]
): ParsedDocxSuggestedTextbookSection[] {
  const seenSections = new Set<string>();
  const suggestions = suggestedMarketingTags
    .filter((tag) => tag.category !== "Needs Review")
    .map((tag) => {
      const section = textbookSectionByCategory[tag.category as MarketingTaxonomyCategory];

      if (seenSections.has(section)) {
        return null;
      }

      seenSections.add(section);

      return {
        confidence: tag.confidence,
        reason: `Suggested because the preview matched ${tag.label}.`,
        section
      };
    })
    .filter((section): section is ParsedDocxSuggestedTextbookSection =>
      Boolean(section)
    )
    .slice(0, 4);

  return suggestions.length > 0
    ? suggestions
    : [
        {
          confidence: "low",
          reason: "No strong marketing concept was detected from parsed DOCX text.",
          section: "Needs human textbook mapping"
        }
      ];
}

function createWarnings({
  hasSignals,
  suggestedMarketingTags
}: {
  hasSignals: boolean;
  suggestedMarketingTags: ParsedDocxSuggestedMarketingTag[];
}): string[] {
  const warnings = [
    "Preview only - no tags are saved.",
    "Human review is required before Knowledge Vault tagging.",
    "No AI, API, or external metadata provider is used.",
    "No SourceDocument, SourceCard, MarketingTag, or KnowledgeCard is persisted."
  ];

  if (!hasSignals) {
    warnings.push("Insufficient text signals for reliable classification.");
  }

  if (suggestedMarketingTags.length === 0) {
    warnings.push("Needs human classification; no controlled taxonomy match was found.");
  }

  return warnings;
}

function getTagConfidence({
  canonicalMatched,
  normalizedText,
  tier
}: {
  canonicalMatched: boolean;
  normalizedText: string;
  tier: "core" | "extended";
}): ParsedDocxClassificationConfidence {
  if (canonicalMatched && tier === "core" && normalizedText.length > 1000) {
    return "high";
  }

  if (canonicalMatched || tier === "core") {
    return "medium";
  }

  return "low";
}

function confidenceRank(confidence: ParsedDocxClassificationConfidence): number {
  if (confidence === "high") {
    return 3;
  }

  if (confidence === "medium") {
    return 2;
  }

  return 1;
}

function createTitleFromFilename(fileName: string): string {
  return fileName
    .replace(/\.(docx)$/i, "")
    .split(/[-_]/g)
    .filter(Boolean)
    .join(" ")
    .trim();
}

function hasText(value?: string | null): value is string {
  return Boolean(value?.trim());
}

function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
