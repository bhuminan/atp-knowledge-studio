import type { SavedSuggestedMetadataCorrection } from "../persistence/LocalVaultDatabase";

export type ProviderCandidateComparisonState =
  | "provider_consensus"
  | "provider_conflict"
  | "provider_only_mock"
  | "provider_only_crossref_fixture"
  | "missing_comparable_candidate";

export interface ProviderComparisonCandidateValue {
  confidenceBand: string;
  confidenceScore: number;
  displayValue: string;
  normalizedValue: string;
  providerId: string;
  providerName: string;
  providerRecordRef: string;
  providerType: string;
}

export interface ProviderCandidateComparisonRow {
  comparisonKey: string;
  fieldName: string;
  intakeJobId: string;
  mockCandidate: ProviderComparisonCandidateValue | null;
  crossrefFixtureCandidate: ProviderComparisonCandidateValue | null;
  reason: string;
  state: ProviderCandidateComparisonState;
  targetMetadataTable: string;
  warningFlags: string[];
}

type ComparableProviderKind = "mock" | "crossref_fixture";

interface ProviderClassifiedCorrection {
  correction: SavedSuggestedMetadataCorrection;
  kind: ComparableProviderKind;
}

export function mapProviderCandidateComparisons(
  corrections: SavedSuggestedMetadataCorrection[]
): ProviderCandidateComparisonRow[] {
  if (corrections.length === 0) {
    return [];
  }

  const grouped = new Map<string, ProviderClassifiedCorrection[]>();

  for (const correction of corrections) {
    const kind = classifyComparableProvider(correction);
    if (!kind) {
      continue;
    }

    const key = createComparisonKey(correction);
    grouped.set(key, [...(grouped.get(key) ?? []), { correction, kind }]);
  }

  return [...grouped.entries()]
    .map(([comparisonKey, items]) => mapComparisonGroup(comparisonKey, items))
    .sort((left, right) =>
      [
        left.intakeJobId.localeCompare(right.intakeJobId),
        left.targetMetadataTable.localeCompare(right.targetMetadataTable),
        left.fieldName.localeCompare(right.fieldName)
      ].find((result) => result !== 0) ?? 0
    );
}

function mapComparisonGroup(
  comparisonKey: string,
  items: ProviderClassifiedCorrection[]
): ProviderCandidateComparisonRow {
  const first = items[0].correction;
  const mockCorrection = selectStrongestCorrection(items, "mock");
  const crossrefFixtureCorrection = selectStrongestCorrection(
    items,
    "crossref_fixture"
  );
  const mockCandidate = mockCorrection
    ? toCandidateValue(mockCorrection, "mock")
    : null;
  const crossrefFixtureCandidate = crossrefFixtureCorrection
    ? toCandidateValue(crossrefFixtureCorrection, "crossref_fixture")
    : null;
  const state = compareState(mockCandidate, crossrefFixtureCandidate);

  return {
    comparisonKey,
    fieldName: first.fieldName,
    intakeJobId: first.intakeJobId,
    mockCandidate,
    crossrefFixtureCandidate,
    reason: createReason(first.fieldName, mockCandidate, crossrefFixtureCandidate, state),
    state,
    targetMetadataTable: first.targetMetadataTable,
    warningFlags: createWarningFlags(state)
  };
}

function selectStrongestCorrection(
  items: ProviderClassifiedCorrection[],
  kind: ComparableProviderKind
): SavedSuggestedMetadataCorrection | null {
  return (
    items
      .filter((item) => item.kind === kind)
      .map((item) => item.correction)
      .sort((left, right) => right.confidenceScore - left.confidenceScore)[0] ?? null
  );
}

function toCandidateValue(
  correction: SavedSuggestedMetadataCorrection,
  kind: ComparableProviderKind
): ProviderComparisonCandidateValue {
  return {
    confidenceBand: correction.confidenceBand,
    confidenceScore: correction.confidenceScore,
    displayValue: correction.suggestedValue,
    normalizedValue: normalizeComparableValue(correction.fieldName, correction.suggestedValue),
    providerId: inferProviderId(correction, kind),
    providerName: correction.providerName,
    providerRecordRef: correction.providerRecordRef,
    providerType: inferProviderType(correction, kind)
  };
}

function compareState(
  mockCandidate: ProviderComparisonCandidateValue | null,
  crossrefFixtureCandidate: ProviderComparisonCandidateValue | null
): ProviderCandidateComparisonState {
  if (mockCandidate && crossrefFixtureCandidate) {
    if (
      mockCandidate.normalizedValue &&
      crossrefFixtureCandidate.normalizedValue &&
      mockCandidate.normalizedValue === crossrefFixtureCandidate.normalizedValue
    ) {
      return "provider_consensus";
    }

    if (mockCandidate.normalizedValue || crossrefFixtureCandidate.normalizedValue) {
      return "provider_conflict";
    }
  }

  if (mockCandidate) {
    return "provider_only_mock";
  }

  if (crossrefFixtureCandidate) {
    return "provider_only_crossref_fixture";
  }

  return "missing_comparable_candidate";
}

function createReason(
  fieldName: string,
  mockCandidate: ProviderComparisonCandidateValue | null,
  crossrefFixtureCandidate: ProviderComparisonCandidateValue | null,
  state: ProviderCandidateComparisonState
): string {
  if (state === "provider_consensus" && mockCandidate && crossrefFixtureCandidate) {
    return `${fieldLabel(fieldName)} has the same normalized ${fieldLabel(
      fieldName
    )} from both providers; provider agreement is still not verification.${confidenceReason(
      mockCandidate,
      crossrefFixtureCandidate
    )}`;
  }

  if (state === "provider_conflict" && mockCandidate && crossrefFixtureCandidate) {
    return `${fieldLabel(fieldName)} differs after normalization; provider conflict requires human review.${confidenceReason(
      mockCandidate,
      crossrefFixtureCandidate
    )}`;
  }

  if (state === "provider_only_mock") {
    return `Only the mock provider has a non-empty ${fieldLabel(
      fieldName
    )} suggestion; Crossref fixture is missing this field.`;
  }

  if (state === "provider_only_crossref_fixture") {
    return `Only the Crossref fixture has a non-empty ${fieldLabel(
      fieldName
    )} suggestion; fixture-only evidence needs human review.`;
  }

  return `Not enough comparable provider data exists for ${fieldLabel(fieldName)}.`;
}

function confidenceReason(
  mockCandidate: ProviderComparisonCandidateValue,
  crossrefFixtureCandidate: ProviderComparisonCandidateValue
): string {
  if (mockCandidate.confidenceScore === crossrefFixtureCandidate.confidenceScore) {
    return " Provider confidence scores match.";
  }

  return ` Provider confidence differs (${mockCandidate.confidenceScore} vs ${crossrefFixtureCandidate.confidenceScore}).`;
}

function createWarningFlags(state: ProviderCandidateComparisonState): string[] {
  const flags = ["no_auto_overwrite", "needs_human_review"];

  if (state === "provider_conflict") {
    return ["provider_conflict", ...flags];
  }

  if (state === "provider_only_crossref_fixture") {
    return ["fixture_only", ...flags];
  }

  if (state === "missing_comparable_candidate") {
    return ["missing_comparable_candidate", ...flags];
  }

  return flags;
}

function createComparisonKey(correction: SavedSuggestedMetadataCorrection): string {
  return [
    correction.intakeJobId,
    correction.targetMetadataTable,
    correction.fieldName
  ].join("::");
}

function classifyComparableProvider(
  correction: SavedSuggestedMetadataCorrection
): ComparableProviderKind | null {
  const providerEvidence = `${correction.providerName} ${correction.providerRecordRef}`.toLowerCase();

  if (
    providerEvidence.includes("crossref read-only fixture") ||
    providerEvidence.includes("crossref:fixture")
  ) {
    return "crossref_fixture";
  }

  if (
    providerEvidence.includes("mock") ||
    providerEvidence.includes("mock:") ||
    providerEvidence.includes("fixture")
  ) {
    return "mock";
  }

  return null;
}

function inferProviderId(
  correction: SavedSuggestedMetadataCorrection,
  kind: ComparableProviderKind
): string {
  if (kind === "crossref_fixture") {
    return "crossref-read-only-fixture";
  }

  if (correction.providerRecordRef.startsWith("mock:openalex")) {
    return "mock-openalex-local-fixture";
  }

  if (correction.providerRecordRef.startsWith("mock:manual")) {
    return "mock-manual-metadata-fixture";
  }

  return "mock-crossref-local-fixture";
}

function inferProviderType(
  correction: SavedSuggestedMetadataCorrection,
  kind: ComparableProviderKind
): string {
  if (kind === "crossref_fixture") {
    return "crossref_fixture_read_only";
  }

  if (correction.providerRecordRef.startsWith("mock:openalex")) {
    return "openalex_mock";
  }

  if (correction.providerRecordRef.startsWith("mock:manual")) {
    return "manual_fixture_mock";
  }

  return "crossref_mock";
}

function normalizeComparableValue(fieldName: string, value: string): string {
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

function fieldLabel(fieldName: string): string {
  if (fieldName === "doi") {
    return "DOI";
  }

  return fieldName;
}
