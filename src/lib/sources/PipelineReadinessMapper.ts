import type { DocumentTextExtraction, SourceDocument } from "../../types/domain";
import type {
  DraftInputPackagePreview,
  DraftInputSourceCard
} from "./DraftInputPackageMapper";
import type { DraftQualityReviewPreview } from "./DraftQualityReviewMapper";
import type { DraftSectionMockPreview } from "./DraftSectionMockComposer";
import type { SourceToDraftMockPreview } from "./SourceToDraftMockMapper";

export type PipelineReadinessStatus = "ready" | "needs_review" | "blocked";

export interface PipelineReadinessSummaryPreview {
  blockers: string[];
  nextRecommendedAction: string;
  overallStatus: PipelineReadinessStatus;
  pipelineReadinessId: string;
  stageStatuses: PipelineStageStatus[];
  warnings: string[];
}

export interface PipelineStageStatus {
  detail: string;
  label: string;
  stageId:
    | "extraction"
    | "sourceDocument"
    | "sourceCard"
    | "taxonomyTags"
    | "knowledgeCards"
    | "vaultPreview"
    | "draftInput"
    | "draftPlan"
    | "draftSectionMock"
    | "qualityReview";
  status: PipelineReadinessStatus;
}

export interface PipelineKnowledgeCardReviewSummary {
  approvedCount: number;
  futureVaultReadiness: "ready_for_future_vault_save" | "needs_review" | "blocked";
  needsReviewCount: number;
  rejectedCount: number;
  totalCandidates: number;
}

export interface PipelineReadinessInput {
  approvedMarketingTags: string[];
  draftInputPackage: DraftInputPackagePreview;
  draftQualityReview: DraftQualityReviewPreview;
  draftSectionMockPreview: DraftSectionMockPreview;
  extraction: DocumentTextExtraction;
  knowledgeCardReviewSummary: PipelineKnowledgeCardReviewSummary;
  sourceCardCandidate: DraftInputSourceCard;
  sourceDocumentCandidate: Partial<SourceDocument>;
  sourceToDraftPreview: SourceToDraftMockPreview;
}

export function mapPipelineReadinessSummaryPreview({
  approvedMarketingTags,
  draftInputPackage,
  draftQualityReview,
  draftSectionMockPreview,
  extraction,
  knowledgeCardReviewSummary,
  sourceCardCandidate,
  sourceDocumentCandidate,
  sourceToDraftPreview
}: PipelineReadinessInput): PipelineReadinessSummaryPreview {
  const stageStatuses: PipelineStageStatus[] = [
    createExtractionStage(extraction),
    createSourceDocumentStage(sourceDocumentCandidate),
    createSourceCardStage(sourceCardCandidate),
    createTaxonomyTagStage(approvedMarketingTags),
    createKnowledgeCardStage(knowledgeCardReviewSummary),
    createVaultPreviewStage(knowledgeCardReviewSummary),
    createDraftInputStage(draftInputPackage),
    createDraftPlanStage(sourceToDraftPreview),
    createDraftSectionMockStage(draftSectionMockPreview),
    createQualityReviewStage(draftQualityReview)
  ];
  const blockers = collectPipelineBlockers({
    draftInputPackage,
    draftQualityReview,
    draftSectionMockPreview,
    sourceToDraftPreview,
    stageStatuses
  });
  const warnings = collectPipelineWarnings({
    draftInputPackage,
    draftQualityReview,
    draftSectionMockPreview,
    knowledgeCardReviewSummary,
    sourceToDraftPreview,
    stageStatuses
  });
  const overallStatus = getPipelineOverallStatus({ blockers, stageStatuses, warnings });

  return {
    blockers,
    nextRecommendedAction: getNextRecommendedAction({
      blockers,
      overallStatus,
      stageStatuses,
      warnings
    }),
    overallStatus,
    pipelineReadinessId: `pipeline-readiness-${draftQualityReview.reviewId}`,
    stageStatuses,
    warnings
  };
}

function createExtractionStage(
  extraction: DocumentTextExtraction
): PipelineStageStatus {
  const hasCleanedText = extraction.cleanedText.trim().length > 0;
  const status =
    extraction.extractionStatus === "failed"
      ? "blocked"
      : hasCleanedText
        ? "ready"
        : "needs_review";

  return {
    detail: hasCleanedText
      ? `Cleaned text length: ${extraction.cleanedText.length}.`
      : "Cleaned text is missing or empty.",
    label: "Text extraction",
    stageId: "extraction",
    status
  };
}

function createSourceDocumentStage(
  sourceDocumentCandidate: Partial<SourceDocument>
): PipelineStageStatus {
  const hasTitle = Boolean(
    sourceDocumentCandidate.metadata?.title ?? sourceDocumentCandidate.title
  );
  const hasFileType = Boolean(sourceDocumentCandidate.fileType);

  return {
    detail: hasTitle && hasFileType
      ? "SourceDocument candidate has title and source type for review."
      : "SourceDocument candidate still needs title or source type review.",
    label: "SourceDocument candidate",
    stageId: "sourceDocument",
    status: hasTitle && hasFileType ? "ready" : "needs_review"
  };
}

function createSourceCardStage(
  sourceCardCandidate: DraftInputSourceCard
): PipelineStageStatus {
  const status =
    sourceCardCandidate.metadataStatus === "blocked"
      ? "blocked"
      : sourceCardCandidate.metadataStatus === "ready"
        ? "ready"
        : "needs_review";

  return {
    detail: `SourceCard metadata status: ${sourceCardCandidate.metadataStatus}.`,
    label: "SourceCard candidate",
    stageId: "sourceCard",
    status
  };
}

function createTaxonomyTagStage(approvedMarketingTags: string[]): PipelineStageStatus {
  return {
    detail:
      approvedMarketingTags.length > 0
        ? `${approvedMarketingTags.length} approved marketing tag(s) are applied in preview.`
        : "No approved marketing tags are available.",
    label: "Taxonomy tags",
    stageId: "taxonomyTags",
    status: approvedMarketingTags.length > 0 ? "ready" : "needs_review"
  };
}

function createKnowledgeCardStage(
  summary: PipelineKnowledgeCardReviewSummary
): PipelineStageStatus {
  const status =
    summary.futureVaultReadiness === "blocked"
      ? "blocked"
      : summary.futureVaultReadiness === "ready_for_future_vault_save"
        ? "ready"
        : "needs_review";

  return {
    detail: `${summary.approvedCount} approved of ${summary.totalCandidates} preview Knowledge Card candidate(s).`,
    label: "Knowledge Card review",
    stageId: "knowledgeCards",
    status
  };
}

function createVaultPreviewStage(
  summary: PipelineKnowledgeCardReviewSummary
): PipelineStageStatus {
  return {
    detail:
      summary.futureVaultReadiness === "ready_for_future_vault_save"
        ? "Mock Knowledge Vault save preview is available; nothing is persisted."
        : "Mock vault preview is blocked until reviewed Knowledge Cards are ready.",
    label: "Mock vault preview",
    stageId: "vaultPreview",
    status:
      summary.futureVaultReadiness === "ready_for_future_vault_save"
        ? "ready"
        : "needs_review"
  };
}

function createDraftInputStage(
  draftInputPackage: DraftInputPackagePreview
): PipelineStageStatus {
  return {
    detail: `${draftInputPackage.conceptInputs.length + draftInputPackage.evidenceInputs.length + draftInputPackage.quoteInputs.length + draftInputPackage.caseInputs.length + draftInputPackage.writingAngleInputs.length} approved card input(s) are included.`,
    label: "Draft input package",
    stageId: "draftInput",
    status: draftInputPackage.blockers.length > 0 ? "blocked" : "ready"
  };
}

function createDraftPlanStage(
  sourceToDraftPreview: SourceToDraftMockPreview
): PipelineStageStatus {
  return {
    detail: `${sourceToDraftPreview.sectionPlans.length} source-to-draft section plan(s) are previewed.`,
    label: "Source-to-draft plan",
    stageId: "draftPlan",
    status: sourceToDraftPreview.blockers.length > 0 ? "blocked" : "ready"
  };
}

function createDraftSectionMockStage(
  draftSectionMockPreview: DraftSectionMockPreview
): PipelineStageStatus {
  return {
    detail: `${draftSectionMockPreview.sections.length} mock draft section(s) are previewed.`,
    label: "Draft section mock",
    stageId: "draftSectionMock",
    status: draftSectionMockPreview.blockers.length > 0 ? "blocked" : "ready"
  };
}

function createQualityReviewStage(
  draftQualityReview: DraftQualityReviewPreview
): PipelineStageStatus {
  return {
    detail: `Draft quality review status: ${draftQualityReview.overallReadiness}.`,
    label: "Draft quality review",
    stageId: "qualityReview",
    status: draftQualityReview.overallReadiness
  };
}

function collectPipelineBlockers({
  draftInputPackage,
  draftQualityReview,
  draftSectionMockPreview,
  sourceToDraftPreview,
  stageStatuses
}: {
  draftInputPackage: DraftInputPackagePreview;
  draftQualityReview: DraftQualityReviewPreview;
  draftSectionMockPreview: DraftSectionMockPreview;
  sourceToDraftPreview: SourceToDraftMockPreview;
  stageStatuses: PipelineStageStatus[];
}): string[] {
  const blockedStages = stageStatuses
    .filter((stage) => stage.status === "blocked")
    .map((stage) => `${stage.label}: ${stage.detail}`);

  return Array.from(
    new Set([
      ...blockedStages,
      ...draftInputPackage.blockers,
      ...sourceToDraftPreview.blockers,
      ...draftSectionMockPreview.blockers,
      ...draftQualityReview.blockers
    ])
  );
}

function collectPipelineWarnings({
  draftInputPackage,
  draftQualityReview,
  draftSectionMockPreview,
  knowledgeCardReviewSummary,
  sourceToDraftPreview,
  stageStatuses
}: {
  draftInputPackage: DraftInputPackagePreview;
  draftQualityReview: DraftQualityReviewPreview;
  draftSectionMockPreview: DraftSectionMockPreview;
  knowledgeCardReviewSummary: PipelineKnowledgeCardReviewSummary;
  sourceToDraftPreview: SourceToDraftMockPreview;
  stageStatuses: PipelineStageStatus[];
}): string[] {
  const needsReviewStages = stageStatuses
    .filter((stage) => stage.status === "needs_review")
    .map((stage) => `${stage.label}: ${stage.detail}`);

  return Array.from(
    new Set([
      "Preview only — no workflow state is saved.",
      "Future real save, AI draft generation, citation review, and DOCX export remain disabled.",
      `${knowledgeCardReviewSummary.needsReviewCount} Knowledge Card candidate(s) remain needs-review; ${knowledgeCardReviewSummary.rejectedCount} rejected candidate(s) are excluded.`,
      ...needsReviewStages,
      ...draftInputPackage.warnings,
      ...sourceToDraftPreview.warnings,
      ...draftSectionMockPreview.warnings,
      ...draftQualityReview.warnings
    ])
  );
}

function getPipelineOverallStatus({
  blockers,
  stageStatuses,
  warnings
}: {
  blockers: string[];
  stageStatuses: PipelineStageStatus[];
  warnings: string[];
}): PipelineReadinessStatus {
  if (blockers.length > 0 || stageStatuses.some((stage) => stage.status === "blocked")) {
    return "blocked";
  }

  if (warnings.length > 0 || stageStatuses.some((stage) => stage.status === "needs_review")) {
    return "needs_review";
  }

  return "ready";
}

function getNextRecommendedAction({
  blockers,
  overallStatus,
  stageStatuses,
  warnings
}: {
  blockers: string[];
  overallStatus: PipelineReadinessStatus;
  stageStatuses: PipelineStageStatus[];
  warnings: string[];
}): string {
  const firstBlockedStage = stageStatuses.find((stage) => stage.status === "blocked");
  const firstReviewStage = stageStatuses.find((stage) => stage.status === "needs_review");

  if (overallStatus === "blocked") {
    return firstBlockedStage
      ? `Resolve blocker in ${firstBlockedStage.label}: ${firstBlockedStage.detail}`
      : `Resolve blocker: ${blockers[0] ?? "review blocked pipeline stages."}`;
  }

  if (overallStatus === "needs_review") {
    return firstReviewStage
      ? `Review ${firstReviewStage.label}: ${firstReviewStage.detail}`
      : `Review warning: ${warnings[0] ?? "complete human academic review."}`;
  }

  return "Ready for future human-controlled save, citation review, AI draft generation, and DOCX export planning.";
}
