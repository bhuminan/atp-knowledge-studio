import type {
  SavedDraftArtifactDetail,
  SavedKnowledgeCardListItem,
  SavedSourceCardTagRecord
} from "../persistence/LocalVaultDatabase";
import type { ParsedDocxExportPackagePreview } from "../sources/ParsedDocxExportPackageMapper";

export type AiEnhancementReadinessStatus = "ready" | "needs_review" | "blocked";

export interface AiEnhancementInputBoundary {
  allowedInputSource: string;
  draftArtifactId: string | null;
  exportPackageStatus: ParsedDocxExportPackagePreview["exportPackageStatus"] | "missing";
  parserSource: string;
  sourceType: "DOCX";
}

export interface AiEvidenceBoundarySummary {
  approvedMarketingTagCount: number;
  citationPlaceholderCount: number;
  docxPageNumbersTrusted: boolean;
  savedKnowledgeCardCount: number;
  traceReadyKnowledgeCardCount: number;
}

export interface AiIntegrationPreflightReadiness {
  blockers: string[];
  evidenceBoundary: AiEvidenceBoundarySummary;
  futureAllowedRole: string;
  futureForbiddenRole: string;
  humanReviewRequired: boolean;
  inputBoundary: AiEnhancementInputBoundary;
  noProviderCallNotice: string;
  readinessStatus: AiEnhancementReadinessStatus;
  recommendedNextAction: string;
  warnings: string[];
}

export interface AiIntegrationPreflightInput {
  approvedMarketingTags: SavedSourceCardTagRecord[];
  exportPackagePreview: ParsedDocxExportPackagePreview | null;
  parserSource: string;
  savedDraftArtifact: SavedDraftArtifactDetail | null;
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
}

export function evaluateAiIntegrationPreflight({
  approvedMarketingTags,
  exportPackagePreview,
  parserSource,
  savedDraftArtifact,
  savedKnowledgeCards
}: AiIntegrationPreflightInput): AiIntegrationPreflightReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [
    "Preflight only — no AI provider is called.",
    "No prose is generated.",
    "No citation metadata is fabricated.",
    "Human review remains mandatory.",
    "DOCX page numbers remain untrusted; future AI input must use chunk refs such as docx:pN."
  ];
  const citationPlaceholderCount = exportPackagePreview?.citationPlaceholderCount ?? 0;
  const traceReadyKnowledgeCardCount = savedKnowledgeCards.filter(
    (card) => card.traceCount > 0
  ).length;

  if (!savedDraftArtifact) {
    blockers.push("Saved parsed-DOCX DraftArtifact is required before any future AI enhancement.");
  }

  if (!exportPackagePreview) {
    blockers.push("Parsed-DOCX export package preview is required before AI preflight.");
  }

  if (exportPackagePreview?.exportPackageStatus === "blocked") {
    blockers.push("Parsed-DOCX export package is blocked and cannot feed future AI enhancement.");
  }

  if (parserSource !== "real_docx_parser_mvp") {
    blockers.push("Future AI input must preserve real_docx_parser_mvp provenance.");
  }

  if (savedKnowledgeCards.length === 0) {
    blockers.push("Saved traceable KnowledgeCards are required before future AI enhancement.");
  }

  if (savedKnowledgeCards.length > 0 && traceReadyKnowledgeCardCount === 0) {
    blockers.push("At least one saved KnowledgeCard must have a trace reference.");
  }

  if (citationPlaceholderCount > 0) {
    warnings.push(
      `${citationPlaceholderCount} citation placeholder(s) remain; AI must not convert them into APA citations.`
    );
  }

  if (approvedMarketingTags.length === 0) {
    warnings.push("Approved MarketingTags are missing; future AI context would be weak.");
  }

  const readinessStatus: AiEnhancementReadinessStatus =
    blockers.length > 0
      ? "blocked"
      : warnings.length > 0
        ? "needs_review"
        : "ready";

  return {
    blockers: dedupe(blockers),
    evidenceBoundary: {
      approvedMarketingTagCount: approvedMarketingTags.length,
      citationPlaceholderCount,
      docxPageNumbersTrusted: false,
      savedKnowledgeCardCount: savedKnowledgeCards.length,
      traceReadyKnowledgeCardCount
    },
    futureAllowedRole:
      "Future AI may help reorganize or lightly enhance draft-only text from saved, reviewed, traceable inputs.",
    futureForbiddenRole:
      "Future AI must not become a source of truth, invent citations, create untraceable claims, or finalize manuscripts.",
    humanReviewRequired: true,
    inputBoundary: {
      allowedInputSource: "saved reviewed parsed-DOCX objects only",
      draftArtifactId: savedDraftArtifact?.draftArtifact.draftArtifactId ?? null,
      exportPackageStatus: exportPackagePreview?.exportPackageStatus ?? "missing",
      parserSource,
      sourceType: "DOCX"
    },
    noProviderCallNotice: "Preflight only — no AI provider is called.",
    readinessStatus,
    recommendedNextAction: createRecommendedNextAction(readinessStatus),
    warnings: dedupe(warnings)
  };
}

function createRecommendedNextAction(status: AiEnhancementReadinessStatus): string {
  if (status === "blocked") {
    return "Resolve export package and traceability blockers before designing provider requests.";
  }

  return "Draft provider-agnostic request/response contracts with mock provider tests before any real API key or provider call.";
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
