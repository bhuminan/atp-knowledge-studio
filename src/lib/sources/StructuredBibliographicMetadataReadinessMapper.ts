import type {
  SavedSourceCardBibliographicMetadata,
  SavedSourceCardRecord
} from "../persistence/LocalVaultDatabase";

export type StructuredBibliographicMetadataReadinessStatus =
  | "not_started"
  | "needs_metadata"
  | "incomplete"
  | "structured_complete"
  | "apa_candidate_possible"
  | "needs_human_review";

export type StructuredBibliographicSourceType =
  | "academic_journal_article"
  | "book"
  | "book_chapter"
  | "report_white_paper"
  | "website_web_article"
  | "docx_manuscript_source_note"
  | "teaching_note"
  | "unknown_pending_review";

export interface StructuredMetadataFieldState {
  field: string;
  label: string;
}

export interface StructuredBibliographicMetadataReadiness {
  apaFinalVerified: false;
  apaReadinessInterpretation: string;
  blockers: string[];
  missingFields: StructuredMetadataFieldState[];
  nextAction: string;
  notApaFinalNotice: string;
  overallStatus: StructuredBibliographicMetadataReadinessStatus;
  presentFields: StructuredMetadataFieldState[];
  requiredFields: StructuredMetadataFieldState[];
  sourceType: StructuredBibliographicSourceType;
  warnings: string[];
}

export interface StructuredBibliographicMetadataReadinessInput {
  compactSourceCard?: Pick<
    SavedSourceCardRecord,
    "authors" | "citationReadiness" | "citationText" | "sourceType" | "title" | "year"
  > | null;
  metadata: SavedSourceCardBibliographicMetadata | null;
  sourceType?: string | null;
}

interface SourceTypeRule {
  sourceType: StructuredBibliographicSourceType;
  required: StructuredMetadataFieldState[];
  warnings: (input: NormalizedStructuredMetadataInput) => string[];
}

interface NormalizedStructuredMetadataInput {
  compactSourceCard: StructuredBibliographicMetadataReadinessInput["compactSourceCard"];
  metadata: SavedSourceCardBibliographicMetadata | null;
  sourceType: StructuredBibliographicSourceType;
}

const fieldLabels: Record<string, string> = {
  accessDate: "access date",
  authors: "authors",
  containerTitle: "container title",
  doi: "DOI",
  journal: "journal",
  pageRange: "page range",
  publisher: "publisher",
  title: "title",
  url: "URL",
  year: "year"
};

const baseRequiredFields: StructuredMetadataFieldState[] = [
  createFieldState("title"),
  createFieldState("authors"),
  createFieldState("year")
];

const sourceTypeRules: Record<StructuredBibliographicSourceType, SourceTypeRule> = {
  academic_journal_article: {
    sourceType: "academic_journal_article",
    required: [...baseRequiredFields, createFieldState("journal")],
    warnings: (input) => [
      ...warnWhenMissingAny(input, ["volume", "issue"], "Volume or issue is missing for journal article review."),
      ...warnWhenMissing(input, "pageRange", "Page range is missing for journal article review."),
      ...warnWhenMissingAny(input, ["doi", "url"], "DOI or URL is missing; no lookup is performed.")
    ]
  },
  book: {
    sourceType: "book",
    required: [...baseRequiredFields, createFieldState("publisher")],
    warnings: (input) => [
      ...warnWhenMissing(input, "edition", "Edition is not entered; confirm whether this is a first edition.")
    ]
  },
  book_chapter: {
    sourceType: "book_chapter",
    required: [
      ...baseRequiredFields,
      createFieldState("containerTitle"),
      createFieldState("publisher")
    ],
    warnings: (input) => [
      ...warnWhenMissing(input, "pageRange", "Book chapter page range is missing."),
      ...warnWhenMissing(input, "edition", "Edition/volume information is not entered; confirm if applicable.")
    ]
  },
  report_white_paper: {
    sourceType: "report_white_paper",
    required: [...baseRequiredFields, createFieldState("publisher")],
    warnings: (input) => [
      ...warnWhenMissingAny(input, ["doi", "url"], "Report DOI or URL is missing; no lookup is performed.")
    ]
  },
  website_web_article: {
    sourceType: "website_web_article",
    required: [createFieldState("title"), createFieldState("url")],
    warnings: (input) => [
      ...warnWhenMissing(input, "authors", "Author or organization is missing for web source review."),
      ...warnWhenMissing(input, "year", "Publication date/year is missing for web source review."),
      ...warnWhenMissing(input, "accessDate", "Access date is missing; confirm whether retrieval date is required.")
    ]
  },
  docx_manuscript_source_note: {
    sourceType: "docx_manuscript_source_note",
    required: [createFieldState("title")],
    warnings: (input) => [
      ...warnWhenMissing(input, "authors", "Author or organization is missing for DOCX source note review."),
      ...warnWhenMissing(input, "year", "Year/date is missing for DOCX source note review."),
      "DOCX manuscript/source note metadata is not APA-ready by default.",
      "DOCX page numbers remain untrusted and must not become APA page ranges."
    ]
  },
  teaching_note: {
    sourceType: "teaching_note",
    required: [createFieldState("title")],
    warnings: (input) => [
      ...warnWhenMissing(input, "authors", "Author or institution is missing for teaching note review."),
      ...warnWhenMissing(input, "year", "Year/date is missing for teaching note review."),
      ...warnWhenMissing(input, "publisher", "Institution/publisher context is missing for teaching note review."),
      "Teaching notes may not be externally citable without human academic review."
    ]
  },
  unknown_pending_review: {
    sourceType: "unknown_pending_review",
    required: [createFieldState("title")],
    warnings: () => ["Unknown source type requires human review before APA candidate preview."]
  }
};

export function evaluateStructuredBibliographicMetadataReadiness({
  compactSourceCard = null,
  metadata,
  sourceType
}: StructuredBibliographicMetadataReadinessInput): StructuredBibliographicMetadataReadiness {
  const normalizedSourceType = normalizeStructuredSourceType(
    sourceType ?? compactSourceCard?.sourceType ?? null
  );
  const input: NormalizedStructuredMetadataInput = {
    compactSourceCard,
    metadata,
    sourceType: normalizedSourceType
  };
  const rule = sourceTypeRules[normalizedSourceType];
  const requiredFields = rule.required;
  const presentFields = requiredFields.filter((field) => hasFieldValue(input, field.field));
  const missingFields = requiredFields.filter((field) => !hasFieldValue(input, field.field));
  const blockers = createBlockers({ missingFields, metadata, sourceType: normalizedSourceType });
  const warnings = [
    ...rule.warnings(input),
    ...createGeneralWarnings({ compactSourceCard, metadata })
  ];
  const overallStatus = getOverallStatus({
    blockers,
    metadata,
    missingFields,
    sourceType: normalizedSourceType,
    warnings
  });

  return {
    apaFinalVerified: false,
    apaReadinessInterpretation: createApaReadinessInterpretation({
      metadata,
      overallStatus
    }),
    blockers,
    missingFields,
    nextAction: createNextAction({ missingFields, overallStatus }),
    notApaFinalNotice: "This is readiness validation only - no APA citation is generated. APA-final verification remains future human academic review.",
    overallStatus,
    presentFields,
    requiredFields,
    sourceType: normalizedSourceType,
    warnings
  };
}

export function normalizeStructuredSourceType(
  sourceType: string | null
): StructuredBibliographicSourceType {
  const normalized = (sourceType ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (/book_chapter|chapter/.test(normalized)) {
    return "book_chapter";
  }

  if (/book/.test(normalized)) {
    return "book";
  }

  if (/report|white_paper|whitepaper/.test(normalized)) {
    return "report_white_paper";
  }

  if (/web|website|url|online/.test(normalized)) {
    return "website_web_article";
  }

  if (/teaching|course/.test(normalized)) {
    return "teaching_note";
  }

  if (/docx|manuscript|source_note|note/.test(normalized)) {
    return "docx_manuscript_source_note";
  }

  if (/journal|article/.test(normalized)) {
    return "academic_journal_article";
  }

  return "unknown_pending_review";
}

function createFieldState(field: string): StructuredMetadataFieldState {
  return {
    field,
    label: fieldLabels[field] ?? field
  };
}

function hasFieldValue(
  input: NormalizedStructuredMetadataInput,
  field: string
): boolean {
  if (field === "title") {
    return hasText(input.compactSourceCard?.title);
  }

  if (field === "authors") {
    return hasText(input.compactSourceCard?.authors);
  }

  if (field === "year") {
    return hasText(input.compactSourceCard?.year);
  }

  return hasText(input.metadata?.[field as keyof SavedSourceCardBibliographicMetadata]);
}

function createBlockers({
  missingFields,
  metadata,
  sourceType
}: {
  missingFields: StructuredMetadataFieldState[];
  metadata: SavedSourceCardBibliographicMetadata | null;
  sourceType: StructuredBibliographicSourceType;
}): string[] {
  const blockers: string[] = [];

  if (!metadata) {
    blockers.push("Structured bibliographic metadata has not been saved yet.");
  }

  missingFields.forEach((field) => {
    blockers.push(`Missing required structured metadata field: ${field.label}.`);
  });

  if (sourceType === "unknown_pending_review") {
    blockers.push("Source type is unknown or pending review.");
  }

  if (metadata?.apaReadiness === "final_verified" || metadata?.apaFinalVerified) {
    blockers.push("APA final verification cannot be produced automatically.");
  }

  return blockers;
}

function createGeneralWarnings({
  compactSourceCard,
  metadata
}: {
  compactSourceCard: StructuredBibliographicMetadataReadinessInput["compactSourceCard"];
  metadata: SavedSourceCardBibliographicMetadata | null;
}): string[] {
  const warnings = [
    "This validator does not generate APA citations.",
    "APA-final verification remains future human academic review."
  ];

  if (compactSourceCard?.citationReadiness === "ready") {
    warnings.push(
      "4H-1 citationReadiness ready means basic metadata confirmed, not APA-final."
    );
  }

  if (metadata?.apaReadiness === "candidate_ready") {
    warnings.push("APA candidate readiness is only a future-preview readiness state.");
  }

  return warnings;
}

function getOverallStatus({
  blockers,
  metadata,
  missingFields,
  sourceType,
  warnings
}: {
  blockers: string[];
  metadata: SavedSourceCardBibliographicMetadata | null;
  missingFields: StructuredMetadataFieldState[];
  sourceType: StructuredBibliographicSourceType;
  warnings: string[];
}): StructuredBibliographicMetadataReadinessStatus {
  if (!metadata) {
    return "not_started";
  }

  if (sourceType === "unknown_pending_review") {
    return "needs_human_review";
  }

  if (missingFields.length > 0 || blockers.length > 0) {
    return missingFields.length > 0 ? "needs_metadata" : "needs_human_review";
  }

  if (metadata.structuredMetadataStatus !== "complete") {
    return "incomplete";
  }

  if (metadata.apaReadiness === "candidate_ready") {
    return "apa_candidate_possible";
  }

  if (warnings.length > 0) {
    return "structured_complete";
  }

  return "structured_complete";
}

function createApaReadinessInterpretation({
  metadata,
  overallStatus
}: {
  metadata: SavedSourceCardBibliographicMetadata | null;
  overallStatus: StructuredBibliographicMetadataReadinessStatus;
}): string {
  if (!metadata) {
    return "No APA reference candidate can be attempted until structured metadata is saved.";
  }

  if (overallStatus === "apa_candidate_possible") {
    return "A future APA reference candidate preview may be possible, but no APA citation is generated and nothing is APA-final.";
  }

  if (overallStatus === "structured_complete") {
    return "Structured metadata appears complete enough for review, but APA reference candidate preview is not yet enabled.";
  }

  return "Structured metadata is not ready for APA reference candidate preview.";
}

function createNextAction({
  missingFields,
  overallStatus
}: {
  missingFields: StructuredMetadataFieldState[];
  overallStatus: StructuredBibliographicMetadataReadinessStatus;
}): string {
  if (missingFields.length > 0) {
    return `Complete missing fields: ${missingFields.map((field) => field.label).join(", ")}.`;
  }

  if (overallStatus === "apa_candidate_possible") {
    return "Proceed only to a future APA reference candidate preview contract; do not mark APA-final.";
  }

  if (overallStatus === "structured_complete") {
    return "Review structured metadata and decide whether a future APA candidate preview is appropriate.";
  }

  if (overallStatus === "not_started") {
    return "Save human-entered structured bibliographic metadata first.";
  }

  return "Resolve warnings and complete human review before APA candidate preview.";
}

function warnWhenMissing(
  input: NormalizedStructuredMetadataInput,
  field: string,
  warning: string
): string[] {
  return hasFieldValue(input, field) ? [] : [warning];
}

function warnWhenMissingAny(
  input: NormalizedStructuredMetadataInput,
  fields: string[],
  warning: string
): string[] {
  return fields.some((field) => hasFieldValue(input, field)) ? [] : [warning];
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
