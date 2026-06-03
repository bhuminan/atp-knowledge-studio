import type { SavedBatchResearchIntakeJob } from "../persistence/LocalVaultDatabase";

export type ExternalMetadataProviderType =
  | "crossref_mock"
  | "crossref_fixture_read_only"
  | "openalex_mock"
  | "doi_mock"
  | "isbn_mock"
  | "manual_fixture_mock";

export type ExternalMetadataSourceType =
  | "academic_journal_article"
  | "book"
  | "book_chapter"
  | "report_white_paper"
  | "docx_manuscript_source_note"
  | "unknown_pending_review";

export type ExternalMetadataConfidenceBand = "high" | "medium" | "low" | "none";

export type ExternalMetadataMatchStatus =
  | "high_confidence_match"
  | "medium_confidence_match"
  | "low_confidence_match"
  | "no_match";

export interface ExternalMetadataProvider {
  providerId: string;
  providerName: string;
  providerType: ExternalMetadataProviderType;
  isMock: boolean;
  supportsSourceTypes: ExternalMetadataSourceType[];
  notes: string;
}

export interface ExternalMetadataMatchCandidate {
  matchedAuthors: string[];
  matchedContainerTitle?: string | null;
  matchedDoi?: string | null;
  matchedIsbn?: string | null;
  matchedIssue?: string | null;
  matchedJournal?: string | null;
  matchedPageRange?: string | null;
  matchedPublisher?: string | null;
  matchedSourceType: ExternalMetadataSourceType;
  matchedTitle: string;
  matchedUrl?: string | null;
  matchedVolume?: string | null;
  matchedYear?: string | null;
  provider: ExternalMetadataProvider;
  providerConfidence: number;
  rawProviderRef: string;
  warnings: string[];
}

export interface ExternalMetadataSuggestedCorrection {
  actionState: "pending";
  confidence: number;
  currentValue: string | null;
  fieldName: string;
  providerName: string;
  reason: string;
  suggestedValue: string;
}

export interface ExternalMetadataMatchResult {
  autoOverwriteAllowed: false;
  blockers: string[];
  confidenceBand: ExternalMetadataConfidenceBand;
  confidenceScore: number;
  fileName: string;
  intakeJobId: string;
  matchReasons: string[];
  matchStatus: ExternalMetadataMatchStatus;
  mismatchReasons: string[];
  nextAction: string;
  providerCandidates: ExternalMetadataMatchCandidate[];
  suggestedCorrections: ExternalMetadataSuggestedCorrection[];
  warnings: string[];
}

export function mapExternalMetadataMatch(
  job: SavedBatchResearchIntakeJob,
  providerCandidates: ExternalMetadataMatchCandidate[]
): ExternalMetadataMatchResult {
  const sortedCandidates = [...providerCandidates].sort(
    (left, right) => right.providerConfidence - left.providerConfidence
  );
  const bestCandidate = sortedCandidates[0] ?? null;

  if (!bestCandidate) {
    return {
      autoOverwriteAllowed: false,
      blockers: [],
      confidenceBand: "none",
      confidenceScore: 0,
      fileName: job.fileName,
      intakeJobId: job.intakeJobId,
      matchReasons: [],
      matchStatus: "no_match",
      mismatchReasons: ["No mock provider candidate matched this queue record."],
      nextAction:
        "Keep this intake item in human metadata review or wait for future provider support.",
      providerCandidates: [],
      suggestedCorrections: [],
      warnings: createBoundaryWarnings([
        "No external metadata match is available from the mock provider fixture."
      ])
    };
  }

  const confidenceScore = scoreCandidate(job, bestCandidate);
  const confidenceBand = toConfidenceBand(confidenceScore);
  const suggestedCorrections = createSuggestedCorrections(job, bestCandidate);
  const titleSimilarity = titleTokenOverlap(
    deriveLocalTitle(job.fileName),
    bestCandidate.matchedTitle
  );
  const sourceTypeCompatible = isSourceTypeCompatible(job, bestCandidate);

  return {
    autoOverwriteAllowed: false,
    blockers: [],
    confidenceBand,
    confidenceScore,
    fileName: job.fileName,
    intakeJobId: job.intakeJobId,
    matchReasons: [
      `Mock provider confidence: ${bestCandidate.providerConfidence}/100.`,
      `Title token overlap: ${Math.round(titleSimilarity * 100)}%.`,
      sourceTypeCompatible
        ? "File type and suggested source type are compatible."
        : "File type and suggested source type need human confirmation."
    ],
    matchStatus: toMatchStatus(confidenceBand),
    mismatchReasons: sourceTypeCompatible
      ? []
      : [
          `Queue file type ${job.fileType} does not directly confirm ${bestCandidate.matchedSourceType}.`
        ],
    nextAction: createNextAction(confidenceBand),
    providerCandidates: sortedCandidates,
    suggestedCorrections,
    warnings: createBoundaryWarnings(bestCandidate.warnings)
  };
}

function createBoundaryWarnings(candidateWarnings: string[]): string[] {
  return [
    "Mock provider only - no Crossref, OpenAlex, DOI, ISBN, web, or AI lookup was performed.",
    "External metadata is evidence, not truth.",
    "No metadata is overwritten automatically.",
    "No SourceDocument or SourceCard is created automatically.",
    "Human approval is required before any future metadata mutation.",
    ...candidateWarnings
  ];
}

function createNextAction(confidenceBand: ExternalMetadataConfidenceBand): string {
  switch (confidenceBand) {
    case "high":
      return "Review high-confidence mock suggestions before any future batch approval.";
    case "medium":
      return "Open item-level review before approval; do not overwrite automatically.";
    case "low":
      return "Treat as weak evidence and keep the item in human metadata review.";
    case "none":
      return "Add metadata manually or wait for future provider support.";
  }
}

function toMatchStatus(
  confidenceBand: ExternalMetadataConfidenceBand
): ExternalMetadataMatchStatus {
  switch (confidenceBand) {
    case "high":
      return "high_confidence_match";
    case "medium":
      return "medium_confidence_match";
    case "low":
      return "low_confidence_match";
    case "none":
      return "no_match";
  }
}

function toConfidenceBand(score: number): ExternalMetadataConfidenceBand {
  if (score >= 80) {
    return "high";
  }
  if (score >= 55) {
    return "medium";
  }
  if (score >= 25) {
    return "low";
  }
  return "none";
}

function scoreCandidate(
  job: SavedBatchResearchIntakeJob,
  candidate: ExternalMetadataMatchCandidate
): number {
  const titleOverlap = titleTokenOverlap(deriveLocalTitle(job.fileName), candidate.matchedTitle);
  const compatibilityAdjustment = isSourceTypeCompatible(job, candidate) ? 4 : -8;
  const titleAdjustment = titleOverlap >= 0.55 ? 4 : titleOverlap >= 0.25 ? 0 : -12;
  return clampScore(candidate.providerConfidence + compatibilityAdjustment + titleAdjustment);
}

function titleTokenOverlap(left: string, right: string): number {
  const leftTokens = toTitleTokens(left);
  const rightTokens = toTitleTokens(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0;
  }

  const rightSet = new Set(rightTokens);
  const matched = leftTokens.filter((token) => rightSet.has(token)).length;
  return matched / Math.max(leftTokens.length, rightTokens.length);
}

function toTitleTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 2 && token !== "the" && token !== "and");
}

function deriveLocalTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function isSourceTypeCompatible(
  job: SavedBatchResearchIntakeJob,
  candidate: ExternalMetadataMatchCandidate
): boolean {
  const fileType = job.fileType.toUpperCase();

  if (fileType === "DOCX") {
    return [
      "book_chapter",
      "docx_manuscript_source_note",
      "report_white_paper",
      "unknown_pending_review"
    ].includes(candidate.matchedSourceType);
  }

  if (fileType === "PDF") {
    return [
      "academic_journal_article",
      "book",
      "book_chapter",
      "report_white_paper",
      "unknown_pending_review"
    ].includes(candidate.matchedSourceType);
  }

  return candidate.matchedSourceType === "unknown_pending_review";
}

function createSuggestedCorrections(
  job: SavedBatchResearchIntakeJob,
  candidate: ExternalMetadataMatchCandidate
): ExternalMetadataSuggestedCorrection[] {
  const localTitle = deriveLocalTitle(job.fileName);
  const corrections: ExternalMetadataSuggestedCorrection[] = [];

  pushCorrection(corrections, {
    confidence: candidate.providerConfidence,
    currentValue: localTitle || null,
    fieldName: "title",
    providerName: candidate.provider.providerName,
    reason: "Provider title differs from the local file-name-derived title.",
    suggestedValue: candidate.matchedTitle
  });
  pushCorrection(corrections, {
    confidence: candidate.providerConfidence,
    currentValue: job.sourceTypeGuess || null,
    fieldName: "sourceType",
    providerName: candidate.provider.providerName,
    reason: "Provider suggests a bibliographic source type.",
    suggestedValue: candidate.matchedSourceType
  });
  pushOptionalCorrection(corrections, candidate, "authors", candidate.matchedAuthors.join("; "));
  pushOptionalCorrection(corrections, candidate, "year", candidate.matchedYear);
  pushOptionalCorrection(corrections, candidate, "journal", candidate.matchedJournal);
  pushOptionalCorrection(corrections, candidate, "publisher", candidate.matchedPublisher);
  pushOptionalCorrection(corrections, candidate, "containerTitle", candidate.matchedContainerTitle);
  pushOptionalCorrection(corrections, candidate, "volume", candidate.matchedVolume);
  pushOptionalCorrection(corrections, candidate, "issue", candidate.matchedIssue);
  pushOptionalCorrection(corrections, candidate, "pageRange", candidate.matchedPageRange);
  pushOptionalCorrection(corrections, candidate, "doi", candidate.matchedDoi);
  pushOptionalCorrection(corrections, candidate, "isbn", candidate.matchedIsbn);
  pushOptionalCorrection(corrections, candidate, "url", candidate.matchedUrl);

  return corrections;
}

function pushOptionalCorrection(
  corrections: ExternalMetadataSuggestedCorrection[],
  candidate: ExternalMetadataMatchCandidate,
  fieldName: string,
  suggestedValue?: string | null
) {
  if (!suggestedValue) {
    return;
  }

  pushCorrection(corrections, {
    confidence: candidate.providerConfidence,
    currentValue: null,
    fieldName,
    providerName: candidate.provider.providerName,
    reason: "Provider fixture has a candidate value; local batch queue has no approved value yet.",
    suggestedValue
  });
}

function pushCorrection(
  corrections: ExternalMetadataSuggestedCorrection[],
  correction: Omit<ExternalMetadataSuggestedCorrection, "actionState">
) {
  if (normalizeValue(correction.currentValue) === normalizeValue(correction.suggestedValue)) {
    return;
  }

  corrections.push({
    ...correction,
    actionState: "pending"
  });
}

function normalizeValue(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
