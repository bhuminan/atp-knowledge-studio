import type { SourceCard } from "../../types/domain";

export type SourceValidationSeverity = "critical" | "high" | "medium" | "low";

export type SourceValidationStatus =
  | "ready"
  | "needs_review"
  | "incomplete"
  | "mock_only";

export type SourceEvidenceSuitability = "suitable" | "needs_review" | "unsuitable";

export interface SourceValidationWarning {
  warningId: string;
  severity: SourceValidationSeverity;
  code: string;
  message: string;
  sourceId: string;
  field: string;
}

export interface SourceValidationResult {
  status: SourceValidationStatus;
  sourceId: string;
  readinessScore: number;
  warnings: SourceValidationWarning[];
  missingRequiredFields: string[];
  metadataCompleteness: "complete" | "partial" | "missing";
  apa7Readiness: "ready" | "needs_review" | "incomplete" | "mock";
  reliabilityReadiness: "ready" | "usable_with_review" | "weak";
  citationTextStatus: "ready" | "draft" | "missing";
  evidenceSuitability: SourceEvidenceSuitability;
}

export interface SourceValidationSummary {
  totalSources: number;
  readyCount: number;
  needsReviewCount: number;
  incompleteCount: number;
  mockOnlyCount: number;
  criticalWarningCount: number;
  highWarningCount: number;
  mediumWarningCount: number;
  lowWarningCount: number;
  averageReadinessScore: number;
}

const placeholderPattern =
  /metadata required|author pending|year pending|publisher or journal metadata required/i;
const draftCitationPattern =
  /draft|mock|metadata required|unverified|verification required/i;
const mockNotesPattern =
  /mock|local|draft|unverified|verification required/i;

export function validateSourceCard(sourceCard: SourceCard): SourceValidationResult {
  const warnings: SourceValidationWarning[] = [];
  const missingRequiredFields: string[] = [];

  requireTextField(sourceCard, "sourceId", warnings, missingRequiredFields, "critical");
  requireTextField(sourceCard, "title", warnings, missingRequiredFields, "high");
  requireTextField(sourceCard, "year", warnings, missingRequiredFields, "high");
  requireTextField(sourceCard, "sourceType", warnings, missingRequiredFields, "high");

  const hasUsableAuthors =
    Array.isArray(sourceCard.authors) &&
    sourceCard.authors.some((author) => hasText(author) && !placeholderPattern.test(author));

  if (!hasUsableAuthors) {
    missingRequiredFields.push("authors");
    warnings.push(
      createSourceWarning(
        sourceCard,
        "high",
        "SOURCE_AUTHORS_REQUIRED",
        "Source authors are missing or still placeholder text.",
        "authors"
      )
    );
  }

  if (!hasText(sourceCard.publisherOrJournal)) {
    warnings.push(
      createSourceWarning(
        sourceCard,
        "medium",
        "SOURCE_PUBLISHER_REQUIRED",
        "Publisher or journal metadata is missing.",
        "publisherOrJournal"
      )
    );
  }

  if (!hasText(sourceCard.citationText)) {
    missingRequiredFields.push("citationText");
    warnings.push(
      createSourceWarning(
        sourceCard,
        "high",
        "SOURCE_CITATION_TEXT_REQUIRED",
        "Citation text is missing.",
        "citationText"
      )
    );
  } else if (draftCitationPattern.test(sourceCard.citationText)) {
    warnings.push(
      createSourceWarning(
        sourceCard,
        "medium",
        "SOURCE_CITATION_TEXT_DRAFT",
        "Citation text is marked draft, mock, unverified, or metadata-required.",
        "citationText"
      )
    );
  }

  if (sourceCard.apa7Status !== "ready") {
    warnings.push(
      createSourceWarning(
        sourceCard,
        sourceCard.apa7Status === "needs_metadata" ? "high" : "medium",
        "SOURCE_APA7_NOT_READY",
        "APA 7 status is not ready.",
        "apa7Status"
      )
    );
  }

  if (sourceCard.reliabilityLevel === "unknown" || sourceCard.reliabilityLevel === "low") {
    warnings.push(
      createSourceWarning(
        sourceCard,
        sourceCard.reliabilityLevel === "low" ? "high" : "medium",
        "SOURCE_RELIABILITY_WEAK",
        "Source reliability is low or unknown.",
        "reliabilityLevel"
      )
    );
  } else if (sourceCard.reliabilityLevel === "medium") {
    warnings.push(
      createSourceWarning(
        sourceCard,
        "low",
        "SOURCE_RELIABILITY_MEDIUM",
        "Medium reliability is usable for drafting but still needs review.",
        "reliabilityLevel"
      )
    );
  }

  if (mockNotesPattern.test(sourceCard.notes)) {
    warnings.push(
      createSourceWarning(
        sourceCard,
        "medium",
        "SOURCE_NOTES_MARK_MOCK_OR_DRAFT",
        "Source notes indicate mock, local, draft, unverified, or verification-required status.",
        "notes"
      )
    );
  }

  const metadataCompleteness = getMetadataCompleteness(sourceCard, missingRequiredFields);
  const apa7Readiness = getApa7Readiness(sourceCard);
  const reliabilityReadiness = getReliabilityReadiness(sourceCard);
  const citationTextStatus = getCitationTextStatus(sourceCard);
  const appearsMockOnly = isMockOnlySource(sourceCard);
  const evidenceSuitability = getEvidenceSuitability(
    sourceCard,
    missingRequiredFields,
    appearsMockOnly
  );
  const readinessScore = calculateReadinessScore(
    warnings,
    missingRequiredFields,
    appearsMockOnly
  );

  return {
    status: getValidationStatus(
      readinessScore,
      missingRequiredFields,
      appearsMockOnly,
      evidenceSuitability
    ),
    sourceId: sourceCard.sourceId,
    readinessScore,
    warnings,
    missingRequiredFields,
    metadataCompleteness,
    apa7Readiness,
    reliabilityReadiness,
    citationTextStatus,
    evidenceSuitability
  };
}

export function validateSourceCards(
  sourceCards: SourceCard[]
): SourceValidationResult[] {
  return sourceCards.map(validateSourceCard);
}

export function summarizeSourceValidation(
  results: SourceValidationResult[]
): SourceValidationSummary {
  const totalReadinessScore = results.reduce(
    (sum, result) => sum + result.readinessScore,
    0
  );

  return {
    totalSources: results.length,
    readyCount: results.filter((result) => result.status === "ready").length,
    needsReviewCount: results.filter((result) => result.status === "needs_review").length,
    incompleteCount: results.filter((result) => result.status === "incomplete").length,
    mockOnlyCount: results.filter((result) => result.status === "mock_only").length,
    criticalWarningCount: countWarnings(results, "critical"),
    highWarningCount: countWarnings(results, "high"),
    mediumWarningCount: countWarnings(results, "medium"),
    lowWarningCount: countWarnings(results, "low"),
    averageReadinessScore:
      results.length === 0 ? 0 : Math.round(totalReadinessScore / results.length)
  };
}

function requireTextField(
  sourceCard: SourceCard,
  field: keyof Pick<SourceCard, "sourceId" | "title" | "year" | "sourceType">,
  warnings: SourceValidationWarning[],
  missingRequiredFields: string[],
  severity: SourceValidationSeverity
) {
  if (hasText(sourceCard[field]) && !placeholderPattern.test(sourceCard[field])) {
    return;
  }

  missingRequiredFields.push(field);
  warnings.push(
    createSourceWarning(
      sourceCard,
      severity,
      `SOURCE_${field.toUpperCase()}_REQUIRED`,
      `Source ${field} is missing or still placeholder text.`,
      field
    )
  );
}

function calculateReadinessScore(
  warnings: SourceValidationWarning[],
  missingRequiredFields: string[],
  appearsMockOnly: boolean
): number {
  const warningPenalty = warnings.reduce((total, warning) => {
    if (warning.severity === "critical") {
      return total + 30;
    }
    if (warning.severity === "high") {
      return total + 20;
    }
    if (warning.severity === "medium") {
      return total + 10;
    }
    return total + 5;
  }, 0);
  const missingFieldPenalty = missingRequiredFields.length * 10;
  const mockPenalty = appearsMockOnly ? 20 : 0;

  return clampScore(100 - warningPenalty - missingFieldPenalty - mockPenalty);
}

function getValidationStatus(
  readinessScore: number,
  missingRequiredFields: string[],
  appearsMockOnly: boolean,
  evidenceSuitability: SourceEvidenceSuitability
): SourceValidationStatus {
  if (appearsMockOnly) {
    return "mock_only";
  }

  if (missingRequiredFields.length > 0 || readinessScore < 45) {
    return "incomplete";
  }

  if (evidenceSuitability !== "suitable" || readinessScore < 90) {
    return "needs_review";
  }

  return "ready";
}

function getEvidenceSuitability(
  sourceCard: SourceCard,
  missingRequiredFields: string[],
  appearsMockOnly: boolean
): SourceEvidenceSuitability {
  if (
    missingRequiredFields.length > 0 ||
    sourceCard.reliabilityLevel === "low" ||
    sourceCard.reliabilityLevel === "unknown" ||
    appearsMockOnly
  ) {
    return "unsuitable";
  }

  if (sourceCard.apa7Status !== "ready" || sourceCard.reliabilityLevel === "medium") {
    return "needs_review";
  }

  return "suitable";
}

function getMetadataCompleteness(
  sourceCard: SourceCard,
  missingRequiredFields: string[]
): SourceValidationResult["metadataCompleteness"] {
  if (missingRequiredFields.length === 0 && hasText(sourceCard.publisherOrJournal)) {
    return "complete";
  }

  if (
    hasText(sourceCard.title) ||
    sourceCard.authors.length > 0 ||
    hasText(sourceCard.year)
  ) {
    return "partial";
  }

  return "missing";
}

function getApa7Readiness(sourceCard: SourceCard): SourceValidationResult["apa7Readiness"] {
  if (sourceCard.apa7Status === "ready") {
    return "ready";
  }

  if (sourceCard.apa7Status === "mock") {
    return "mock";
  }

  if (sourceCard.apa7Status === "needs_metadata") {
    return "incomplete";
  }

  return "needs_review";
}

function getReliabilityReadiness(
  sourceCard: SourceCard
): SourceValidationResult["reliabilityReadiness"] {
  if (sourceCard.reliabilityLevel === "high") {
    return "ready";
  }

  if (sourceCard.reliabilityLevel === "medium") {
    return "usable_with_review";
  }

  return "weak";
}

function getCitationTextStatus(
  sourceCard: SourceCard
): SourceValidationResult["citationTextStatus"] {
  if (!hasText(sourceCard.citationText)) {
    return "missing";
  }

  return draftCitationPattern.test(sourceCard.citationText) ? "draft" : "ready";
}

function isMockOnlySource(sourceCard: SourceCard): boolean {
  return (
    sourceCard.apa7Status === "mock" ||
    draftCitationPattern.test(sourceCard.citationText) ||
    mockNotesPattern.test(sourceCard.notes)
  );
}

function createSourceWarning(
  sourceCard: SourceCard,
  severity: SourceValidationSeverity,
  code: string,
  message: string,
  field: string
): SourceValidationWarning {
  return {
    warningId: `${sourceCard.sourceId || "missing-source"}-${code.toLowerCase()}-${field}`,
    severity,
    code,
    message,
    sourceId: sourceCard.sourceId,
    field
  };
}

function countWarnings(
  results: SourceValidationResult[],
  severity: SourceValidationSeverity
): number {
  return results.reduce(
    (count, result) =>
      count + result.warnings.filter((warning) => warning.severity === severity).length,
    0
  );
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}
