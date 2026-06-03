import type { SavedSuggestedMetadataCorrection } from "../persistence/LocalVaultDatabase";

export interface ProviderEvidenceDetail {
  blockerFlags: string[];
  confidenceBand: string;
  confidenceEvidence: string[];
  confidenceScore: number;
  correctionId: string;
  currentAtpValue: string | null;
  fixtureOnly: boolean;
  mismatchReasons: string[];
  noAutoOverwrite: boolean;
  noNetwork: boolean;
  normalizedValue: string;
  providerName: string;
  providerRecordRef: string;
  providerSource: "mock_provider" | "crossref_fixture" | "other_provider";
  providerType: string;
  rawDisplayValue: string;
  rawJsonPreview: string | null;
  rawJsonUnavailableReason: string | null;
  targetField: string;
  targetTable: string;
  warningFlags: string[];
}

export function mapProviderEvidenceDetails(
  corrections: SavedSuggestedMetadataCorrection[]
): ProviderEvidenceDetail[] {
  return corrections
    .map(mapCorrectionToEvidenceDetail)
    .sort((left, right) =>
      [
        left.providerSource.localeCompare(right.providerSource),
        left.targetTable.localeCompare(right.targetTable),
        left.targetField.localeCompare(right.targetField),
        left.providerRecordRef.localeCompare(right.providerRecordRef)
      ].find((result) => result !== 0) ?? 0
    );
}

function mapCorrectionToEvidenceDetail(
  correction: SavedSuggestedMetadataCorrection
): ProviderEvidenceDetail {
  const providerSource = classifyProviderSource(correction);
  const warningFlags = parseJsonStringArray(correction.warningFlagsJson);
  const mismatchReasons = parseJsonStringArray(correction.mismatchReasonsJson);

  return {
    blockerFlags: [],
    confidenceBand: correction.confidenceBand,
    confidenceEvidence: createConfidenceEvidence(correction, mismatchReasons),
    confidenceScore: correction.confidenceScore,
    correctionId: correction.correctionId,
    currentAtpValue: correction.currentValue,
    fixtureOnly: providerSource === "crossref_fixture" || providerSource === "mock_provider",
    mismatchReasons,
    noAutoOverwrite: true,
    noNetwork: isNoNetworkEvidence(providerSource, warningFlags),
    normalizedValue: normalizeEvidenceValue(correction.fieldName, correction.suggestedValue),
    providerName: correction.providerName,
    providerRecordRef: correction.providerRecordRef,
    providerSource,
    providerType: inferProviderType(correction, providerSource),
    rawDisplayValue: correction.suggestedValue,
    rawJsonPreview: null,
    rawJsonUnavailableReason:
      "Raw provider JSON is not exposed by the current suggested corrections UI data shape; no new persistence was added.",
    targetField: correction.fieldName,
    targetTable: correction.targetMetadataTable,
    warningFlags
  };
}

function createConfidenceEvidence(
  correction: SavedSuggestedMetadataCorrection,
  mismatchReasons: string[]
): string[] {
  return [
    `Provider confidence ${correction.confidenceBand} / ${correction.confidenceScore}.`,
    correction.reason,
    ...mismatchReasons
  ].filter((item) => item.trim().length > 0);
}

function classifyProviderSource(
  correction: SavedSuggestedMetadataCorrection
): ProviderEvidenceDetail["providerSource"] {
  const evidence = `${correction.providerName} ${correction.providerRecordRef}`.toLowerCase();

  if (
    evidence.includes("crossref read-only fixture") ||
    evidence.includes("crossref:fixture")
  ) {
    return "crossref_fixture";
  }

  if (evidence.includes("mock") || evidence.includes("mock:")) {
    return "mock_provider";
  }

  return "other_provider";
}

function inferProviderType(
  correction: SavedSuggestedMetadataCorrection,
  providerSource: ProviderEvidenceDetail["providerSource"]
): string {
  if (providerSource === "crossref_fixture") {
    return "crossref_fixture_read_only";
  }

  if (correction.providerRecordRef.startsWith("mock:openalex")) {
    return "openalex_mock";
  }

  if (correction.providerRecordRef.startsWith("mock:manual")) {
    return "manual_fixture_mock";
  }

  if (providerSource === "mock_provider") {
    return "crossref_mock";
  }

  return "unknown_provider_type";
}

function isNoNetworkEvidence(
  providerSource: ProviderEvidenceDetail["providerSource"],
  warningFlags: string[]
): boolean {
  if (providerSource === "mock_provider" || providerSource === "crossref_fixture") {
    return true;
  }

  return warningFlags.some((warning) =>
    warning.toLowerCase().includes("no network")
  );
}

function parseJsonStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return [];
  }

  return [];
}

function normalizeEvidenceValue(fieldName: string, value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (fieldName === "doi") {
    return trimmed
      .toLowerCase()
      .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
      .replace(/^doi:\s*/, "")
      .trim();
  }

  if (fieldName === "authors") {
    return trimmed
      .split(";")
      .map((author) => normalizeGenericValue(author))
      .filter(Boolean)
      .sort()
      .join("; ");
  }

  if (fieldName === "year") {
    return trimmed.match(/\d{4}/)?.[0] ?? normalizeGenericValue(trimmed);
  }

  return normalizeGenericValue(trimmed);
}

function normalizeGenericValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
