import type {
  SavedDraftArtifactDetail,
  SavedKnowledgeCardListItem
} from "../persistence/LocalVaultDatabase";
import type { SavedDraftArtifactExportRiskLevel } from "./SavedDraftArtifactReviewMapper";
import type { ParsedDocxDraftArtifactReviewGate } from "./ParsedDocxDraftArtifactReviewMapper";

export type ParsedDocxExportPackageStatus = "ready" | "needs_review" | "blocked";

export interface ParsedDocxExportChecklistItem {
  label: string;
  note: string;
  passed: boolean;
}

export interface ParsedDocxExportPackagePreview {
  blockers: string[];
  checklist: ParsedDocxExportChecklistItem[];
  citationPlaceholderCount: number;
  draftArtifactId: string | null;
  evidenceTraceSummary: string;
  exportPackageStatus: ParsedDocxExportPackageStatus;
  exportRiskLevel: SavedDraftArtifactExportRiskLevel;
  recommendedNextAction: string;
  sectionCount: number;
  sourceCardId: string | null;
  unresolvedWarnings: string[];
}

export interface ParsedDocxExportPackageMapperInput {
  parserSource: string;
  reviewGate: ParsedDocxDraftArtifactReviewGate | null;
  savedDraftArtifact: SavedDraftArtifactDetail | null;
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
}

export function createParsedDocxExportPackagePreview({
  parserSource,
  reviewGate,
  savedDraftArtifact,
  savedKnowledgeCards
}: ParsedDocxExportPackageMapperInput): ParsedDocxExportPackagePreview {
  const blockers: string[] = [];
  const unresolvedWarnings: string[] = [
    "Preview only — no DOCX file is generated from parsed-DOCX path.",
    "Citation placeholders are not final APA citations.",
    "DOCX page numbers remain untrusted."
  ];

  if (!savedDraftArtifact) {
    blockers.push("Saved parsed-DOCX DraftArtifact is required for export package preview.");
  }

  if (!reviewGate) {
    blockers.push("Parsed-DOCX DraftArtifact review gate must run before export preview.");
  }

  if (reviewGate?.reviewStatus === "blocked") {
    blockers.push("Parsed-DOCX review gate is blocked.");
  }

  if (parserSource !== "real_docx_parser_mvp") {
    blockers.push("Parsed-DOCX export preview requires real_docx_parser_mvp provenance.");
  }

  const sectionCount = savedDraftArtifact?.sections.length ?? 0;
  const citationPlaceholderCount =
    savedDraftArtifact?.sections.reduce(
      (total, section) =>
        total + parseJsonArray(section.citationPlaceholdersJson).length,
      0
    ) ?? 0;
  const traceLikeSectionCount =
    savedDraftArtifact?.sections.filter((section) => {
      const evidenceRefs =
        parseJsonArray(section.linkedCaseIdsJson).length +
        parseJsonArray(section.linkedEvidenceIdsJson).length +
        parseJsonArray(section.linkedQuoteIdsJson).length;

      return evidenceRefs > 0;
    }).length ?? 0;

  if (citationPlaceholderCount > 0) {
    unresolvedWarnings.push(
      `${citationPlaceholderCount} citation placeholder(s) remain and need human review.`
    );
  }

  if (reviewGate?.traceCompletenessScore !== undefined && reviewGate.traceCompletenessScore < 80) {
    unresolvedWarnings.push("Trace completeness is weak for future export planning.");
  }

  if (savedKnowledgeCards.some((card) => card.citationReadiness !== "ready")) {
    unresolvedWarnings.push(
      "Saved KnowledgeCards still include citation readiness states that need review."
    );
  }

  const exportPackageStatus = getExportPackageStatus({
    blockers,
    citationPlaceholderCount,
    pageNumbersTrusted: false,
    reviewStatus: reviewGate?.reviewStatus ?? "blocked"
  });
  const exportRiskLevel = getExportRiskLevel({
    blockers,
    exportPackageStatus,
    reviewGate,
    unresolvedWarnings
  });

  return {
    blockers: dedupe([...(reviewGate?.blockers ?? []), ...blockers]),
    checklist: createChecklist({
      citationPlaceholderCount,
      parserSource,
      reviewGate,
      savedDraftArtifact,
      sectionCount
    }),
    citationPlaceholderCount,
    draftArtifactId: savedDraftArtifact?.draftArtifact.draftArtifactId ?? null,
    evidenceTraceSummary: `${traceLikeSectionCount}/${Math.max(sectionCount, 1)} section(s) have evidence or trace-like references; DOCX page numbers remain untrusted.`,
    exportPackageStatus,
    exportRiskLevel,
    recommendedNextAction: createRecommendedNextAction(exportPackageStatus),
    sectionCount,
    sourceCardId: savedDraftArtifact?.sourceCard.sourceCardId ?? null,
    unresolvedWarnings: dedupe([
      ...unresolvedWarnings,
      ...(reviewGate?.unresolvedWarnings ?? [])
    ])
  };
}

function getExportPackageStatus({
  blockers,
  citationPlaceholderCount,
  pageNumbersTrusted,
  reviewStatus
}: {
  blockers: string[];
  citationPlaceholderCount: number;
  pageNumbersTrusted: boolean;
  reviewStatus: ParsedDocxDraftArtifactReviewGate["reviewStatus"];
}): ParsedDocxExportPackageStatus {
  if (blockers.length > 0 || reviewStatus === "blocked") {
    return "blocked";
  }

  if (citationPlaceholderCount > 0 || !pageNumbersTrusted || reviewStatus === "needs_review") {
    return "needs_review";
  }

  return "ready";
}

function getExportRiskLevel({
  blockers,
  exportPackageStatus,
  reviewGate,
  unresolvedWarnings
}: {
  blockers: string[];
  exportPackageStatus: ParsedDocxExportPackageStatus;
  reviewGate: ParsedDocxDraftArtifactReviewGate | null;
  unresolvedWarnings: string[];
}): SavedDraftArtifactExportRiskLevel {
  if (blockers.length > 0 || exportPackageStatus === "blocked") {
    return "high";
  }

  if (
    unresolvedWarnings.length > 0 ||
    (reviewGate?.citationReadinessScore ?? 0) < 80 ||
    (reviewGate?.evidenceCoverageScore ?? 0) < 80 ||
    (reviewGate?.traceCompletenessScore ?? 0) < 80
  ) {
    return "medium";
  }

  return "low";
}

function createChecklist({
  citationPlaceholderCount,
  parserSource,
  reviewGate,
  savedDraftArtifact,
  sectionCount
}: {
  citationPlaceholderCount: number;
  parserSource: string;
  reviewGate: ParsedDocxDraftArtifactReviewGate | null;
  savedDraftArtifact: SavedDraftArtifactDetail | null;
  sectionCount: number;
}): ParsedDocxExportChecklistItem[] {
  return [
    {
      label: "Parsed-DOCX review gate complete",
      note: reviewGate
        ? `Review gate status is ${reviewGate.reviewStatus}.`
        : "Review gate has not produced a result.",
      passed: Boolean(reviewGate) && reviewGate?.reviewStatus !== "blocked"
    },
    {
      label: "Saved mock DraftArtifact exists",
      note: savedDraftArtifact?.draftArtifact.mockOnly
        ? "Saved artifact remains mock_only."
        : "Saved mock DraftArtifact is missing or not marked mock_only.",
      passed: Boolean(savedDraftArtifact?.draftArtifact.mockOnly)
    },
    {
      label: "Not final manuscript",
      note: savedDraftArtifact?.draftArtifact.notFinal
        ? "Saved artifact remains not_final."
        : "Saved artifact cannot be treated as final.",
      passed: Boolean(savedDraftArtifact?.draftArtifact.notFinal)
    },
    {
      label: "Sections available",
      note: `${sectionCount} section(s) available for preview packaging.`,
      passed: sectionCount > 0
    },
    {
      label: "Citation placeholders resolved",
      note:
        citationPlaceholderCount > 0
          ? `${citationPlaceholderCount} placeholder(s) remain; none are APA-final.`
          : "No placeholders found; citation planning still needs review.",
      passed: citationPlaceholderCount === 0
    },
    {
      label: "DOCX page numbers verified",
      note: "DOCX page numbers remain untrusted in the parsed-DOCX path.",
      passed: false
    },
    {
      label: "Parser provenance preserved",
      note: `Parser source: ${parserSource}.`,
      passed: parserSource === "real_docx_parser_mvp"
    }
  ];
}

function createRecommendedNextAction(status: ParsedDocxExportPackageStatus): string {
  if (status === "blocked") {
    return "Resolve parsed-DOCX review gate blockers before export package planning.";
  }

  return "Review citation placeholders and untrusted DOCX page-number limits before any future real export sprint.";
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
