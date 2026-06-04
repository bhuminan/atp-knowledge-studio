import type {
  ParsedDocxClassificationConfidence,
  ParsedDocxClassificationPreview,
  ParsedDocxSuggestedMarketingTag
} from "./ParsedDocxClassificationPreviewMapper";

export type ParsedDocxKnowledgeVaultCandidateStatus =
  | "not_started"
  | "needs_classification_preview"
  | "candidate_ready"
  | "blocked";

export type ParsedDocxKnowledgeVaultUse =
  | "concept_record"
  | "evidence_record"
  | "teaching_case_record"
  | "textbook_section_input";

export interface ParsedDocxKnowledgeVaultCandidateRecord {
  candidateId: string;
  confidence: ParsedDocxClassificationConfidence;
  linkedSignals: string[];
  persistenceStatus: "preview_only";
  reason: string;
  reviewRequired: true;
  sourceRelationship: string;
  suggestedVaultUse: ParsedDocxKnowledgeVaultUse[];
  tagGroup: string;
  tagLabel: string;
}

export interface ParsedDocxKnowledgeVaultSourceCoverage {
  hasClassificationPreview: boolean;
  hasParsedDocx: boolean;
  hasSuggestedTags: boolean;
  hasTextbookRelevance: boolean;
}

export interface ParsedDocxKnowledgeVaultCandidatePreview {
  blockers: string[];
  candidateRecords: ParsedDocxKnowledgeVaultCandidateRecord[];
  sourceCoverage: ParsedDocxKnowledgeVaultSourceCoverage;
  status: ParsedDocxKnowledgeVaultCandidateStatus;
  warnings: string[];
}

const maxCandidateRecords = 8;

export function createParsedDocxKnowledgeVaultCandidatePreview({
  classificationPreview,
  hasParsedDocx
}: {
  classificationPreview?: ParsedDocxClassificationPreview | null;
  hasParsedDocx: boolean;
}): ParsedDocxKnowledgeVaultCandidatePreview {
  const sourceCoverage = createSourceCoverage({ classificationPreview, hasParsedDocx });

  if (!hasParsedDocx) {
    return createBlockedPreview({
      blockers: ["No parsed DOCX is available for Knowledge Vault candidate preview."],
      sourceCoverage,
      status: "not_started"
    });
  }

  if (!classificationPreview || classificationPreview.status !== "preview_ready") {
    return createBlockedPreview({
      blockers: ["Run classification preview before creating Knowledge Vault candidates."],
      sourceCoverage,
      status: "needs_classification_preview"
    });
  }

  const usableTags = classificationPreview.suggestedMarketingTags.filter(
    (tag) => tag.label !== "Needs human classification"
  );

  if (usableTags.length === 0) {
    return createBlockedPreview({
      blockers: ["Insufficient tag signals. Needs human tag review."],
      sourceCoverage,
      status: "blocked"
    });
  }

  const candidateRecords = usableTags
    .slice(0, maxCandidateRecords)
    .map((tag, index) =>
      createCandidateRecord({
        classificationPreview,
        index,
        tag
      })
    );

  return {
    blockers: [],
    candidateRecords,
    sourceCoverage,
    status: "candidate_ready",
    warnings: createWarnings({ candidateRecords })
  };
}

function createCandidateRecord({
  classificationPreview,
  index,
  tag
}: {
  classificationPreview: ParsedDocxClassificationPreview;
  index: number;
  tag: ParsedDocxSuggestedMarketingTag;
}): ParsedDocxKnowledgeVaultCandidateRecord {
  const sourceType = classificationPreview.suggestedSourceType.replace(/_/g, " ");
  const textbookSections = classificationPreview.suggestedTextbookSections
    .filter((section) => section.section !== "Needs human textbook mapping")
    .map((section) => section.section);
  const suggestedVaultUse = inferVaultUse({ tag, textbookSections });

  return {
    candidateId: `parsed-docx-vault-candidate-${slugify(tag.label)}-${index + 1}`,
    confidence: tag.confidence,
    linkedSignals: createLinkedSignals({ classificationPreview, tag, textbookSections }),
    persistenceStatus: "preview_only",
    reason: createReason({ tag, suggestedVaultUse }),
    reviewRequired: true,
    sourceRelationship: `Parsed DOCX ${sourceType} classification preview; not linked to a saved Knowledge Vault record.`,
    suggestedVaultUse,
    tagGroup: tag.category,
    tagLabel: tag.label
  };
}

function inferVaultUse({
  tag,
  textbookSections
}: {
  tag: ParsedDocxSuggestedMarketingTag;
  textbookSections: string[];
}): ParsedDocxKnowledgeVaultUse[] {
  const normalizedLabel = normalizeText(tag.label);
  const normalizedCategory = normalizeText(tag.category);
  const uses = new Set<ParsedDocxKnowledgeVaultUse>();

  if (normalizedLabel.includes("case") || normalizedLabel.includes("company") || normalizedLabel.includes("example")) {
    uses.add("teaching_case_record");
  }

  if (
    normalizedLabel.includes("method") ||
    normalizedLabel.includes("research") ||
    normalizedLabel.includes("evidence") ||
    normalizedCategory.includes("research")
  ) {
    uses.add("evidence_record");
  }

  if (
    normalizedLabel.includes("customer experience") ||
    normalizedLabel.includes("satisfaction") ||
    normalizedLabel.includes("loyalty")
  ) {
    uses.add("concept_record");
  }

  if (normalizedLabel.includes("service quality")) {
    uses.add("concept_record");
    uses.add("textbook_section_input");
  }

  if (textbookSections.length > 0) {
    uses.add("textbook_section_input");
  }

  if (uses.size === 0) {
    uses.add(tag.confidence === "low" ? "evidence_record" : "concept_record");
  }

  return Array.from(uses);
}

function createLinkedSignals({
  classificationPreview,
  tag,
  textbookSections
}: {
  classificationPreview: ParsedDocxClassificationPreview;
  tag: ParsedDocxSuggestedMarketingTag;
  textbookSections: string[];
}): string[] {
  return [
    `tag:${tag.label}`,
    `confidence:${tag.confidence}`,
    `category:${tag.category}`,
    `sourceType:${classificationPreview.suggestedSourceType}`,
    ...textbookSections.slice(0, 2).map((section) => `textbook:${section}`),
    ...classificationPreview.sourceSignals.slice(0, 2).map((signal) => `${signal.source}:${signal.strength}`)
  ];
}

function createReason({
  tag,
  suggestedVaultUse
}: {
  tag: ParsedDocxSuggestedMarketingTag;
  suggestedVaultUse: ParsedDocxKnowledgeVaultUse[];
}): string {
  const confidenceNote =
    tag.confidence === "low"
      ? "Low-confidence signal; needs human tag review."
      : "Controlled classification signal can be reviewed as a vault candidate.";

  return `${confidenceNote} Suggested use: ${suggestedVaultUse.join(", ")}.`;
}

function createSourceCoverage({
  classificationPreview,
  hasParsedDocx
}: {
  classificationPreview?: ParsedDocxClassificationPreview | null;
  hasParsedDocx: boolean;
}): ParsedDocxKnowledgeVaultSourceCoverage {
  return {
    hasClassificationPreview: classificationPreview?.status === "preview_ready",
    hasParsedDocx,
    hasSuggestedTags: Boolean(classificationPreview?.suggestedMarketingTags.length),
    hasTextbookRelevance: Boolean(classificationPreview?.suggestedTextbookSections.length)
  };
}

function createBlockedPreview({
  blockers,
  sourceCoverage,
  status
}: {
  blockers: string[];
  sourceCoverage: ParsedDocxKnowledgeVaultSourceCoverage;
  status: ParsedDocxKnowledgeVaultCandidateStatus;
}): ParsedDocxKnowledgeVaultCandidatePreview {
  return {
    blockers,
    candidateRecords: [],
    sourceCoverage,
    status,
    warnings: createWarnings({ candidateRecords: [] })
  };
}

function createWarnings({
  candidateRecords
}: {
  candidateRecords: ParsedDocxKnowledgeVaultCandidateRecord[];
}): string[] {
  const warnings = [
    "Preview only - Knowledge Vault candidates are not saved.",
    "Human review is required before Knowledge Vault use.",
    "No AI, API, provider, citation finality, or automatic persistence is used.",
    "SourceCard citationText is not overwritten."
  ];

  if (candidateRecords.some((candidate) => candidate.confidence === "low")) {
    warnings.push("Low-confidence candidate records remain needs-review only.");
  }

  if (candidateRecords.length === 0) {
    warnings.push("No candidate records are available until classification tag signals exist.");
  }

  return warnings;
}

function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, "-") || "needs-review";
}

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
