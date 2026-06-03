import type {
  SavedDraftArtifactDetail,
  SavedKnowledgeCardListItem,
  SavedSourceCardDetail,
  SavedSourceCardTagRecord,
  SavedSourceDocumentDetail
} from "../persistence/LocalVaultDatabase";
import type { ParsedDocxExportPackagePreview } from "../sources/ParsedDocxExportPackageMapper";
import type {
  AiEnhancementReadinessStatus,
  AiIntegrationPreflightReadiness
} from "./AiIntegrationPreflightMapper";

export type AiEnhancementRequestPackageStatus =
  AiEnhancementReadinessStatus;

export type AiEnhancementProviderMode = "none_preview_only";
export type AiEnhancementSourceMode = "parsed_docx";

export type AiEnhancementFutureTaskType =
  | "enhance_section_clarity"
  | "improve_flow"
  | "suggest_managerial_implications"
  | "identify_evidence_gaps"
  | "suggest_teaching_angle";

export type AiEnhancementForbiddenOperation =
  | "fabricate_citation"
  | "fabricate_page_number"
  | "fabricate_author_year"
  | "invent_quote"
  | "invent_case"
  | "remove_human_review"
  | "produce_final_manuscript"
  | "save_output_automatically";

export interface AiEnhancementRequestPackageMeta {
  createdAt: string;
  packageId: string;
  providerMode: AiEnhancementProviderMode;
  sourceMode: AiEnhancementSourceMode;
  status: AiEnhancementRequestPackageStatus;
}

export interface AiEnhancementSourceBoundary {
  draftArtifactId: string | null;
  parserSource: string;
  provenanceWarnings: string[];
  sourceCardId: string | null;
  sourceDocumentId: string | null;
  sourceType: "DOCX";
}

export interface AiKnowledgeCardIdsByType {
  cardType: string;
  knowledgeCardIds: string[];
}

export interface AiApprovedMarketingTagReference {
  label: string;
  tagId: string;
}

export interface AiEnhancementEvidenceBoundary {
  approvedMarketingTags: AiApprovedMarketingTagReference[];
  evidenceCoverageSummary: string;
  knowledgeCardIdsByType: AiKnowledgeCardIdsByType[];
  missingTraceBlockers: string[];
  traceRefs: string[];
}

export interface AiDraftSectionBoundary {
  humanReviewRequired: boolean;
  readiness: "ready" | "needs_review" | "blocked";
  sectionId: string;
  title: string;
}

export interface AiEnhancementDraftBoundary {
  citationPlaceholderCount: number;
  currentDraftNotFinalWarning: string;
  sectionCount: number;
  sectionReadiness: AiDraftSectionBoundary[];
  sectionsRequiringHumanReview: string[];
}

export interface AiEnhancementInstructionBoundary {
  allowedFutureTaskTypes: AiEnhancementFutureTaskType[];
  promptExecutionAllowed: false;
  requestPackageOnly: true;
}

export interface AiEnhancementReviewGate {
  requiresCitationReview: true;
  requiresHumanReview: true;
  requiresManualExportVerification: true;
  requiresTraceReview: true;
}

export interface AiEnhancementRequestPackagePreview {
  aiInstructionBoundary: AiEnhancementInstructionBoundary;
  blockers: string[];
  draftBoundary: AiEnhancementDraftBoundary;
  evidenceBoundary: AiEnhancementEvidenceBoundary;
  forbiddenOperations: AiEnhancementForbiddenOperation[];
  packageMeta: AiEnhancementRequestPackageMeta;
  reviewGate: AiEnhancementReviewGate;
  sourceBoundary: AiEnhancementSourceBoundary;
  warnings: string[];
}

export interface AiEnhancementRequestPackageMapperInput {
  approvedMarketingTags: SavedSourceCardTagRecord[];
  exportPackagePreview: ParsedDocxExportPackagePreview | null;
  preflight: AiIntegrationPreflightReadiness | null;
  savedDraftArtifact: SavedDraftArtifactDetail | null;
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  savedSourceCard: SavedSourceCardDetail | null;
  savedSourceDocument: SavedSourceDocumentDetail | null;
}

export function createAiEnhancementRequestPackagePreview({
  approvedMarketingTags,
  exportPackagePreview,
  preflight,
  savedDraftArtifact,
  savedKnowledgeCards,
  savedSourceCard,
  savedSourceDocument
}: AiEnhancementRequestPackageMapperInput): AiEnhancementRequestPackagePreview {
  const blockers = [...(preflight?.blockers ?? [])];
  const warnings = [
    "Preview only — no AI provider is called.",
    "This is a request package, not AI output.",
    "No prose is generated in this sprint.",
    "No citation metadata is fabricated.",
    "Human review remains mandatory.",
    "DOCX page numbers remain untrusted; request package trace refs must use chunk references."
  ];

  if (!preflight) {
    blockers.push("AI/API integration preflight is required before request package preview.");
  }

  if (!savedSourceDocument) {
    blockers.push("Saved parsed-DOCX SourceDocument is required for request packaging.");
  }

  if (!savedSourceCard) {
    blockers.push("Saved parsed-DOCX SourceCard is required for request packaging.");
  }

  if (!savedDraftArtifact) {
    blockers.push("Saved parsed-DOCX DraftArtifact is required for request packaging.");
  }

  if (!exportPackagePreview) {
    blockers.push("Parsed-DOCX export package preview is required for request packaging.");
  }

  if (exportPackagePreview?.exportPackageStatus === "blocked") {
    blockers.push("Blocked export package cannot become an AI enhancement request package.");
  }

  const parserSource = preflight?.inputBoundary.parserSource ?? "missing";
  if (parserSource !== "real_docx_parser_mvp") {
    blockers.push("Request package requires real_docx_parser_mvp provenance.");
  }

  const traceRefs = createTraceRefs({
    savedSourceDocument,
    savedKnowledgeCards
  });
  if (savedKnowledgeCards.length > 0 && traceRefs.length === 0) {
    blockers.push("At least one trace reference is required before future AI input.");
  }

  const citationPlaceholderCount =
    exportPackagePreview?.citationPlaceholderCount ??
    countCitationPlaceholders(savedDraftArtifact);
  if (citationPlaceholderCount > 0) {
    warnings.push(
      `${citationPlaceholderCount} citation placeholder(s) remain; they must not be treated as final APA citations.`
    );
  }

  if (approvedMarketingTags.length === 0) {
    warnings.push("No approved MarketingTags are available for future AI context.");
  }

  const status = getPackageStatus({
    blockers,
    exportPackageStatus: exportPackagePreview?.exportPackageStatus,
    preflightStatus: preflight?.readinessStatus,
    warningCount: warnings.length
  });

  return {
    aiInstructionBoundary: {
      allowedFutureTaskTypes: [
        "enhance_section_clarity",
        "improve_flow",
        "suggest_managerial_implications",
        "identify_evidence_gaps",
        "suggest_teaching_angle"
      ],
      promptExecutionAllowed: false,
      requestPackageOnly: true
    },
    blockers: dedupe(blockers),
    draftBoundary: {
      citationPlaceholderCount,
      currentDraftNotFinalWarning:
        "Current DraftArtifact is mock/not-final and cannot be treated as final prose.",
      sectionCount: savedDraftArtifact?.sections.length ?? 0,
      sectionReadiness: createSectionReadiness(savedDraftArtifact),
      sectionsRequiringHumanReview:
        savedDraftArtifact?.sections.map((section) => section.sectionTitle) ?? []
    },
    evidenceBoundary: {
      approvedMarketingTags: approvedMarketingTags.map((tag) => ({
        label: tag.label,
        tagId: tag.tagId
      })),
      evidenceCoverageSummary: createEvidenceCoverageSummary({
        savedKnowledgeCards,
        traceRefs
      }),
      knowledgeCardIdsByType: groupKnowledgeCardsByType(savedKnowledgeCards),
      missingTraceBlockers: savedKnowledgeCards
        .filter((card) => card.traceCount === 0)
        .map((card) => `${card.knowledgeCardId} has no trace reference.`),
      traceRefs
    },
    forbiddenOperations: [
      "fabricate_citation",
      "fabricate_page_number",
      "fabricate_author_year",
      "invent_quote",
      "invent_case",
      "remove_human_review",
      "produce_final_manuscript",
      "save_output_automatically"
    ],
    packageMeta: {
      createdAt:
        savedDraftArtifact?.draftArtifact.updatedAt ??
        savedDraftArtifact?.draftArtifact.createdAt ??
        "preview-only",
      packageId: createPackageId(savedDraftArtifact),
      providerMode: "none_preview_only",
      sourceMode: "parsed_docx",
      status
    },
    reviewGate: {
      requiresCitationReview: true,
      requiresHumanReview: true,
      requiresManualExportVerification: true,
      requiresTraceReview: true
    },
    sourceBoundary: {
      draftArtifactId: savedDraftArtifact?.draftArtifact.draftArtifactId ?? null,
      parserSource,
      provenanceWarnings: [
        "Source mode is parsed_docx only.",
        "Parser provenance must remain real_docx_parser_mvp.",
        "DOCX page numbers remain untrusted.",
        "Citation placeholders are not APA-final."
      ],
      sourceCardId:
        savedSourceCard?.sourceCard.sourceCardId ??
        savedDraftArtifact?.sourceCard.sourceCardId ??
        null,
      sourceDocumentId:
        savedSourceDocument?.sourceDocument.sourceDocumentId ??
        savedSourceCard?.sourceDocument.sourceDocumentId ??
        savedDraftArtifact?.sourceCard.sourceDocumentId ??
        null,
      sourceType: "DOCX"
    },
    warnings: dedupe([...(preflight?.warnings ?? []), ...warnings])
  };
}

function getPackageStatus({
  blockers,
  exportPackageStatus,
  preflightStatus,
  warningCount
}: {
  blockers: string[];
  exportPackageStatus: ParsedDocxExportPackagePreview["exportPackageStatus"] | undefined;
  preflightStatus: AiIntegrationPreflightReadiness["readinessStatus"] | undefined;
  warningCount: number;
}): AiEnhancementRequestPackageStatus {
  if (
    blockers.length > 0 ||
    exportPackageStatus === "blocked" ||
    preflightStatus === "blocked"
  ) {
    return "blocked";
  }

  if (
    warningCount > 0 ||
    exportPackageStatus === "needs_review" ||
    preflightStatus === "needs_review"
  ) {
    return "needs_review";
  }

  return "ready";
}

function createPackageId(savedDraftArtifact: SavedDraftArtifactDetail | null): string {
  const draftArtifactId =
    savedDraftArtifact?.draftArtifact.draftArtifactId ?? "missing-draft-artifact";

  return `ai-request-package-${draftArtifactId}`;
}

function createSectionReadiness(
  savedDraftArtifact: SavedDraftArtifactDetail | null
): AiDraftSectionBoundary[] {
  return (
    savedDraftArtifact?.sections.map((section) => {
      const citationPlaceholderCount = parseJsonArray(
        section.citationPlaceholdersJson
      ).length;
      const linkedReferenceCount =
        parseJsonArray(section.linkedCaseIdsJson).length +
        parseJsonArray(section.linkedEvidenceIdsJson).length +
        parseJsonArray(section.linkedQuoteIdsJson).length;

      return {
        humanReviewRequired: true,
        readiness:
          citationPlaceholderCount > 0 || linkedReferenceCount === 0
            ? "needs_review"
            : "ready",
        sectionId: section.sectionId,
        title: section.sectionTitle
      };
    }) ?? []
  );
}

function createEvidenceCoverageSummary({
  savedKnowledgeCards,
  traceRefs
}: {
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  traceRefs: string[];
}): string {
  const traceReadyCount = savedKnowledgeCards.filter(
    (card) => card.traceCount > 0
  ).length;

  return `${traceReadyCount}/${Math.max(savedKnowledgeCards.length, 1)} KnowledgeCard(s) are trace-ready; ${traceRefs.length} unique chunk reference(s) are available.`;
}

function groupKnowledgeCardsByType(
  savedKnowledgeCards: SavedKnowledgeCardListItem[]
): AiKnowledgeCardIdsByType[] {
  const grouped = new Map<string, string[]>();

  savedKnowledgeCards.forEach((card) => {
    const current = grouped.get(card.cardType) ?? [];
    grouped.set(card.cardType, [...current, card.knowledgeCardId]);
  });

  return Array.from(grouped.entries()).map(([cardType, knowledgeCardIds]) => ({
    cardType,
    knowledgeCardIds
  }));
}

function createTraceRefs({
  savedKnowledgeCards,
  savedSourceDocument
}: {
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  savedSourceDocument: SavedSourceDocumentDetail | null;
}): string[] {
  const sourceDocumentTraceRefs =
    savedSourceDocument?.traces.map((trace) => trace.chunkReference) ?? [];
  const syntheticSavedCardTraceRefs = savedKnowledgeCards
    .filter((card) => card.traceCount > 0)
    .map((card) => `knowledge-card-trace:${card.knowledgeCardId}`);

  return dedupe([...sourceDocumentTraceRefs, ...syntheticSavedCardTraceRefs]);
}

function countCitationPlaceholders(
  savedDraftArtifact: SavedDraftArtifactDetail | null
): number {
  return (
    savedDraftArtifact?.sections.reduce(
      (total, section) =>
        total + parseJsonArray(section.citationPlaceholdersJson).length,
      0
    ) ?? 0
  );
}

function parseJsonArray(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
