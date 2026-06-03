import type {
  SavedSourceCardBibliographicMetadata,
  SavedSourceCardRecord
} from "../persistence/LocalVaultDatabase";
import type {
  StructuredBibliographicMetadataReadiness,
  StructuredBibliographicSourceType,
  StructuredMetadataFieldState
} from "./StructuredBibliographicMetadataReadinessMapper";

export type ApaReferenceCandidateStatus =
  | "blocked"
  | "needs_metadata"
  | "candidate_preview_ready"
  | "needs_human_review";

export type ApaReferenceGeneratedBy = "deterministic_local_formatter";

export type ApaFinalVerificationStatus = "not_reviewed";

export interface ApaReferencePart {
  key:
    | "authors"
    | "year"
    | "title"
    | "containerTitle"
    | "journal"
    | "volume"
    | "issue"
    | "pageRange"
    | "publisher"
    | "doi"
    | "url"
    | "accessDate"
    | "sourceTypeLabel";
  label: string;
  present: boolean;
  required: boolean;
  source: "compact_source_card" | "structured_metadata" | "system_classification";
  value: string | null;
}

export interface ApaReferenceCandidatePreview {
  apaStyleVersion: "APA 7";
  blockers: string[];
  candidateReferenceText: string | null;
  candidateStatus: ApaReferenceCandidateStatus;
  finalVerificationStatus: ApaFinalVerificationStatus;
  generatedBy: ApaReferenceGeneratedBy;
  humanReviewRequired: true;
  missingFields: StructuredMetadataFieldState[];
  notFinal: true;
  notes: string[];
  referenceParts: ApaReferencePart[];
  sourceCardId: string;
  sourceType: StructuredBibliographicSourceType;
  warnings: string[];
}

export interface ApaReferenceCandidatePreviewInput {
  compactSourceCard: Pick<
    SavedSourceCardRecord,
    "authors" | "citationReadiness" | "sourceCardId" | "sourceType" | "title" | "year"
  >;
  metadata: SavedSourceCardBibliographicMetadata | null;
  readiness: StructuredBibliographicMetadataReadiness;
}

export function createApaReferenceCandidatePreview({
  compactSourceCard,
  metadata,
  readiness
}: ApaReferenceCandidatePreviewInput): ApaReferenceCandidatePreview {
  const referenceParts = createReferenceParts({
    compactSourceCard,
    metadata,
    readiness
  });
  const blockers = [...readiness.blockers];
  const warnings = [
    ...readiness.warnings,
    ...createSourceTypeWarnings(readiness.sourceType)
  ];
  const candidateStatus = getCandidateStatus({ blockers, readiness });
  const candidateReferenceText =
    candidateStatus === "candidate_preview_ready"
      ? createCandidateText({
          compactSourceCard,
          metadata,
          sourceType: readiness.sourceType
        })
      : null;

  return {
    apaStyleVersion: "APA 7",
    blockers,
    candidateReferenceText,
    candidateStatus,
    finalVerificationStatus: "not_reviewed",
    generatedBy: "deterministic_local_formatter",
    humanReviewRequired: true,
    missingFields: readiness.missingFields,
    notFinal: true,
    notes: [
      "APA candidate preview only - not APA-final.",
      "No DOI lookup, citation web search, AI generation, automatic extraction, or APA finalization is performed.",
      "Candidate text uses only available human-entered or human-verified metadata.",
      "Do not use as final academic reference without human verification."
    ],
    referenceParts,
    sourceCardId: compactSourceCard.sourceCardId,
    sourceType: readiness.sourceType,
    warnings
  };
}

function getCandidateStatus({
  blockers,
  readiness
}: {
  blockers: string[];
  readiness: StructuredBibliographicMetadataReadiness;
}): ApaReferenceCandidateStatus {
  if (readiness.sourceType === "unknown_pending_review") {
    return "needs_human_review";
  }

  if (readiness.overallStatus === "needs_human_review") {
    return "needs_human_review";
  }

  if (
    readiness.overallStatus === "not_started" ||
    readiness.overallStatus === "needs_metadata" ||
    readiness.overallStatus === "incomplete"
  ) {
    return "needs_metadata";
  }

  if (blockers.length > 0) {
    return "blocked";
  }

  return "candidate_preview_ready";
}

function createReferenceParts({
  compactSourceCard,
  metadata,
  readiness
}: {
  compactSourceCard: ApaReferenceCandidatePreviewInput["compactSourceCard"];
  metadata: SavedSourceCardBibliographicMetadata | null;
  readiness: StructuredBibliographicMetadataReadiness;
}): ApaReferencePart[] {
  const required = new Set(readiness.requiredFields.map((field) => field.field));

  return [
    createPart("authors", "Authors", compactSourceCard.authors, "compact_source_card", required),
    createPart("year", "Year", compactSourceCard.year, "compact_source_card", required),
    createPart("title", "Title", compactSourceCard.title, "compact_source_card", required),
    createPart(
      "containerTitle",
      "Container title",
      metadata?.containerTitle,
      "structured_metadata",
      required
    ),
    createPart("journal", "Journal", metadata?.journal, "structured_metadata", required),
    createPart("volume", "Volume", metadata?.volume, "structured_metadata", required),
    createPart("issue", "Issue", metadata?.issue, "structured_metadata", required),
    createPart(
      "pageRange",
      "Page range",
      metadata?.pageRange,
      "structured_metadata",
      required
    ),
    createPart("publisher", "Publisher", metadata?.publisher, "structured_metadata", required),
    createPart("doi", "DOI", metadata?.doi, "structured_metadata", required),
    createPart("url", "URL", metadata?.url, "structured_metadata", required),
    createPart(
      "accessDate",
      "Access date",
      metadata?.accessDate,
      "structured_metadata",
      required
    ),
    createPart(
      "sourceTypeLabel",
      "Source type",
      readiness.sourceType,
      "system_classification",
      required
    )
  ];
}

function createPart(
  key: ApaReferencePart["key"],
  label: string,
  value: string | null | undefined,
  source: ApaReferencePart["source"],
  required: Set<string>
): ApaReferencePart {
  const normalized = normalizeText(value);

  return {
    key,
    label,
    present: Boolean(normalized),
    required: required.has(key),
    source,
    value: normalized
  };
}

function createCandidateText({
  compactSourceCard,
  metadata,
  sourceType
}: {
  compactSourceCard: ApaReferenceCandidatePreviewInput["compactSourceCard"];
  metadata: SavedSourceCardBibliographicMetadata | null;
  sourceType: StructuredBibliographicSourceType;
}): string | null {
  const authors = normalizeText(compactSourceCard.authors);
  const year = normalizeText(compactSourceCard.year);
  const title = normalizeText(compactSourceCard.title);
  const journal = normalizeText(metadata?.journal);
  const volume = normalizeText(metadata?.volume);
  const issue = normalizeText(metadata?.issue);
  const pageRange = normalizeText(metadata?.pageRange);
  const publisher = normalizeText(metadata?.publisher);
  const containerTitle = normalizeText(metadata?.containerTitle);
  const doi = normalizeText(metadata?.doi);
  const url = normalizeText(metadata?.url);
  const accessDate = normalizeText(metadata?.accessDate);

  if (!title) {
    return null;
  }

  if (sourceType === "academic_journal_article") {
    return compactReferenceText([
      formatAuthorsYear(authors, year),
      title,
      compactReferenceText([
        journal,
        formatVolumeIssue(volume, issue),
        pageRange
      ], ", "),
      doi ?? url
    ]);
  }

  if (sourceType === "book") {
    return compactReferenceText([
      formatAuthorsYear(authors, year),
      title,
      publisher,
      doi ?? url
    ]);
  }

  if (sourceType === "book_chapter") {
    return compactReferenceText([
      formatAuthorsYear(authors, year),
      title,
      containerTitle ? `In ${containerTitle}` : null,
      publisher,
      pageRange ? `pp. ${pageRange}` : null,
      doi ?? url
    ]);
  }

  if (sourceType === "report_white_paper") {
    return compactReferenceText([
      formatAuthorsYear(authors, year),
      title,
      publisher,
      doi ?? url
    ]);
  }

  if (sourceType === "website_web_article") {
    return compactReferenceText([
      formatAuthorsYear(authors, year),
      title,
      url,
      accessDate ? `Access date: ${accessDate}` : null
    ]);
  }

  if (sourceType === "docx_manuscript_source_note") {
    return compactReferenceText([
      formatAuthorsYear(authors, year),
      title,
      "[DOCX manuscript/source note - internal candidate only]"
    ]);
  }

  if (sourceType === "teaching_note") {
    return compactReferenceText([
      formatAuthorsYear(authors, year),
      title,
      publisher,
      "[Teaching note candidate - verify citability]"
    ]);
  }

  return null;
}

function createSourceTypeWarnings(sourceType: StructuredBibliographicSourceType): string[] {
  if (sourceType === "book_chapter") {
    return ["Book chapter editors are not structured yet; no editor names are fabricated."];
  }

  if (sourceType === "docx_manuscript_source_note") {
    return [
      "DOCX manuscript/source note preview is non-publication style and not a published-source APA reference."
    ];
  }

  if (sourceType === "teaching_note") {
    return ["Teaching note preview requires human review before external citation use."];
  }

  return [];
}

function formatAuthorsYear(authors: string | null, year: string | null): string | null {
  if (authors && year) {
    return `${authors} (${year})`;
  }

  return authors ?? (year ? `(${year})` : null);
}

function formatVolumeIssue(volume: string | null, issue: string | null): string | null {
  if (volume && issue) {
    return `${volume}(${issue})`;
  }

  return volume ?? (issue ? `(${issue})` : null);
}

function compactReferenceText(parts: Array<string | null>, separator = ". "): string | null {
  const text = parts
    .map((part) => normalizeText(part))
    .filter((part): part is string => Boolean(part))
    .join(separator)
    .replace(/\s+/g, " ")
    .trim();

  return text ? ensureTerminalPunctuation(text) : null;
}

function ensureTerminalPunctuation(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
