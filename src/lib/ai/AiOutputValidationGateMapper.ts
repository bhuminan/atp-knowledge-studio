import type {
  AiEnhancementRequestPackagePreview
} from "./AiEnhancementRequestPackageMapper";
import type { AiIntegrationPreflightReadiness } from "./AiIntegrationPreflightMapper";
import type {
  MockAiForbiddenOutputCheck,
  MockAiResponsePackagePreview
} from "./MockAiResponsePackageMapper";

export type AiOutputValidationGateStatus =
  | "blocked"
  | "rejected"
  | "needs_review"
  | "review_ready";

export type AiEvidenceCoverageStatus =
  | "sufficient"
  | "partial"
  | "insufficient";

export type AiCitationValidationStatus =
  | "blocked"
  | "needs_review"
  | "placeholder_only";

export interface AiOutputValidationGateMeta {
  createdAt: string;
  gateId: string;
  outputMode: "validation_gate_preview";
  providerMode: "none_or_mock_preview_only";
  status: AiOutputValidationGateStatus;
}

export interface AiOutputValidationDecision {
  canBeSaved: false;
  canExport: false;
  canProceedToHumanReview: boolean;
  canReplaceDraftArtifact: false;
  nextRecommendedAction: string;
  reason: string;
}

export interface AiOutputEvidenceValidation {
  evidenceCoverageStatus: AiEvidenceCoverageStatus;
  knowledgeCardCoverage: string;
  missingTraceCount: number;
  supportedClaimCount: number;
  totalTraceRefs: number;
  unsupportedClaimCount: number;
  weakSupportClaimCount: number;
}

export interface AiOutputCitationValidation {
  citationPlaceholderCount: number;
  citationStatus: AiCitationValidationStatus;
  docxPageNumberTrusted: false;
  fabricatedAuthorYearDetected: boolean;
  fabricatedCitationDetected: boolean;
  fabricatedPageNumberDetected: boolean;
}

export interface AiOutputFabricationValidationCheck {
  check: MockAiForbiddenOutputCheck;
  detected: boolean;
  note: string;
}

export interface AiOutputReviewRequirements {
  requiresAcademicReview: true;
  requiresCitationReview: true;
  requiresHumanReview: true;
  requiresManualExportVerification: true;
  requiresTraceReview: true;
}

export interface AiOutputValidationGatePreview {
  blockers: string[];
  citationValidation: AiOutputCitationValidation;
  evidenceValidation: AiOutputEvidenceValidation;
  fabricationValidation: AiOutputFabricationValidationCheck[];
  gateMeta: AiOutputValidationGateMeta;
  reviewRequirements: AiOutputReviewRequirements;
  validationDecision: AiOutputValidationDecision;
  warnings: string[];
}

export interface AiOutputValidationGateMapperInput {
  mockResponsePackage: MockAiResponsePackagePreview | null;
  preflight: AiIntegrationPreflightReadiness | null;
  requestPackage: AiEnhancementRequestPackagePreview | null;
}

export function createAiOutputValidationGatePreview({
  mockResponsePackage,
  preflight,
  requestPackage
}: AiOutputValidationGateMapperInput): AiOutputValidationGatePreview {
  const blockers = [
    ...(preflight?.blockers ?? []),
    ...(requestPackage?.blockers ?? []),
    ...(mockResponsePackage?.blockers ?? [])
  ];
  const warnings = [
    ...(preflight?.warnings ?? []),
    ...(requestPackage?.warnings ?? []),
    ...(mockResponsePackage?.warnings ?? []),
    "Validation preview only — no AI provider is called.",
    "No AI output is saved.",
    "AI output cannot replace DraftArtifact content.",
    "No citation metadata is fabricated.",
    "Human academic review remains mandatory.",
    "DOCX page numbers remain untrusted."
  ];

  if (!preflight) {
    blockers.push("AI/API integration preflight is required before output validation.");
  }

  if (!requestPackage) {
    blockers.push("AI Enhancement Request Package is required before output validation.");
  }

  if (!mockResponsePackage) {
    blockers.push("Mock AI Response Package is required before output validation.");
  }

  if (requestPackage?.packageMeta.status === "blocked") {
    blockers.push("Blocked request package cannot pass AI output validation.");
  }

  if (mockResponsePackage?.responseMeta.status === "blocked") {
    blockers.push("Blocked mock response package cannot pass AI output validation.");
  }

  const unsupportedClaimCount =
    mockResponsePackage?.validationSummary.unsupportedOutputCount ?? 0;
  const missingTraceCount =
    mockResponsePackage?.validationSummary.missingTraceCount ?? 0;
  const weakSupportClaimCount =
    mockResponsePackage?.claimValidation.filter(
      (claim) => claim.supportStatus === "weak_support"
    ).length ?? 0;
  const supportedClaimCount =
    mockResponsePackage?.validationSummary.supportedOutputCount ?? 0;
  const totalTraceRefs =
    requestPackage?.evidenceBoundary.traceRefs.length ??
    mockResponsePackage?.claimValidation.reduce(
      (total, claim) => total + claim.traceRefs.length,
      0
    ) ??
    0;
  const citationPlaceholderCount =
    requestPackage?.draftBoundary.citationPlaceholderCount ??
    mockResponsePackage?.validationSummary.citationRiskCount ??
    0;

  if (unsupportedClaimCount > 0) {
    blockers.push("Unsupported claims exceed zero and must be rejected before review.");
  }

  if (missingTraceCount > 0) {
    blockers.push("Missing traces exceed zero and must be resolved before review.");
  }

  const fabricatedCitationDetected =
    mockResponsePackage
      ? !mockResponsePackage.citationValidation.noFabricatedApaCitation
      : false;
  const fabricatedAuthorYearDetected =
    mockResponsePackage
      ? !mockResponsePackage.citationValidation.noFabricatedAuthorYear
      : false;
  const fabricatedPageNumberDetected =
    mockResponsePackage
      ? !mockResponsePackage.citationValidation.noFabricatedPageNumber
      : false;

  if (fabricatedCitationDetected) {
    blockers.push("Fabricated citation detected.");
  }

  if (fabricatedAuthorYearDetected) {
    blockers.push("Fabricated author/year detected.");
  }

  if (fabricatedPageNumberDetected) {
    blockers.push("Fabricated page number detected.");
  }

  if (mockResponsePackage?.reviewGate.outputCanReplaceDraft) {
    blockers.push("AI output attempted to replace DraftArtifact content.");
  }

  if (mockResponsePackage?.reviewGate.outputCanBeSaved) {
    blockers.push("AI output attempted auto-save.");
  }

  if (citationPlaceholderCount > 0) {
    warnings.push("Citation placeholders exist and remain non-final.");
  }

  if (weakSupportClaimCount > 0) {
    warnings.push("Weak support exists and requires trace review.");
  }

  const evidenceCoverageStatus = getEvidenceCoverageStatus({
    missingTraceCount,
    supportedClaimCount,
    totalTraceRefs,
    unsupportedClaimCount,
    weakSupportClaimCount
  });

  if (evidenceCoverageStatus === "partial") {
    warnings.push("Evidence coverage is partial.");
  }

  if (evidenceCoverageStatus === "insufficient") {
    blockers.push("Evidence coverage is insufficient.");
  }

  warnings.push("Human review remains required.");

  const status = getGateStatus({
    blockers: dedupe(blockers),
    fabricatedAuthorYearDetected,
    fabricatedCitationDetected,
    fabricatedPageNumberDetected,
    missingTraceCount,
    unsupportedClaimCount,
    warningCount: dedupe(warnings).length
  });

  return {
    blockers: dedupe(blockers),
    citationValidation: {
      citationPlaceholderCount,
      citationStatus: getCitationStatus({
        citationPlaceholderCount,
        fabricatedAuthorYearDetected,
        fabricatedCitationDetected,
        fabricatedPageNumberDetected
      }),
      docxPageNumberTrusted: false,
      fabricatedAuthorYearDetected,
      fabricatedCitationDetected,
      fabricatedPageNumberDetected
    },
    evidenceValidation: {
      evidenceCoverageStatus,
      knowledgeCardCoverage: createKnowledgeCardCoverage(requestPackage),
      missingTraceCount,
      supportedClaimCount,
      totalTraceRefs,
      unsupportedClaimCount,
      weakSupportClaimCount
    },
    fabricationValidation: createFabricationValidation({
      fabricatedAuthorYearDetected,
      fabricatedCitationDetected,
      fabricatedPageNumberDetected,
      mockResponsePackage,
      unsupportedClaimCount
    }),
    gateMeta: {
      createdAt:
        mockResponsePackage?.responseMeta.createdAt ??
        requestPackage?.packageMeta.createdAt ??
        "preview-only",
      gateId: createGateId(requestPackage, mockResponsePackage),
      outputMode: "validation_gate_preview",
      providerMode: "none_or_mock_preview_only",
      status
    },
    reviewRequirements: {
      requiresAcademicReview: true,
      requiresCitationReview: true,
      requiresHumanReview: true,
      requiresManualExportVerification: true,
      requiresTraceReview: true
    },
    validationDecision: {
      canBeSaved: false,
      canExport: false,
      canProceedToHumanReview: status === "needs_review" || status === "review_ready",
      canReplaceDraftArtifact: false,
      nextRecommendedAction: createNextRecommendedAction(status),
      reason: createDecisionReason(status)
    },
    warnings: dedupe(warnings)
  };
}

function getEvidenceCoverageStatus({
  missingTraceCount,
  supportedClaimCount,
  totalTraceRefs,
  unsupportedClaimCount,
  weakSupportClaimCount
}: {
  missingTraceCount: number;
  supportedClaimCount: number;
  totalTraceRefs: number;
  unsupportedClaimCount: number;
  weakSupportClaimCount: number;
}): AiEvidenceCoverageStatus {
  if (unsupportedClaimCount > 0 || missingTraceCount > 0 || totalTraceRefs === 0) {
    return "insufficient";
  }

  if (weakSupportClaimCount > 0 || supportedClaimCount === 0) {
    return "partial";
  }

  return "sufficient";
}

function getCitationStatus({
  citationPlaceholderCount,
  fabricatedAuthorYearDetected,
  fabricatedCitationDetected,
  fabricatedPageNumberDetected
}: {
  citationPlaceholderCount: number;
  fabricatedAuthorYearDetected: boolean;
  fabricatedCitationDetected: boolean;
  fabricatedPageNumberDetected: boolean;
}): AiCitationValidationStatus {
  if (
    fabricatedAuthorYearDetected ||
    fabricatedCitationDetected ||
    fabricatedPageNumberDetected
  ) {
    return "blocked";
  }

  if (citationPlaceholderCount > 0) {
    return "needs_review";
  }

  return "placeholder_only";
}

function getGateStatus({
  blockers,
  fabricatedAuthorYearDetected,
  fabricatedCitationDetected,
  fabricatedPageNumberDetected,
  missingTraceCount,
  unsupportedClaimCount,
  warningCount
}: {
  blockers: string[];
  fabricatedAuthorYearDetected: boolean;
  fabricatedCitationDetected: boolean;
  fabricatedPageNumberDetected: boolean;
  missingTraceCount: number;
  unsupportedClaimCount: number;
  warningCount: number;
}): AiOutputValidationGateStatus {
  if (
    fabricatedAuthorYearDetected ||
    fabricatedCitationDetected ||
    fabricatedPageNumberDetected ||
    unsupportedClaimCount > 0
  ) {
    return "rejected";
  }

  if (blockers.length > 0 || missingTraceCount > 0) {
    return "blocked";
  }

  if (warningCount > 0) {
    return "needs_review";
  }

  return "review_ready";
}

function createKnowledgeCardCoverage(
  requestPackage: AiEnhancementRequestPackagePreview | null
): string {
  if (!requestPackage) {
    return "0 KnowledgeCards available; request package missing.";
  }

  const totalKnowledgeCards = requestPackage.evidenceBoundary.knowledgeCardIdsByType.reduce(
    (total, group) => total + group.knowledgeCardIds.length,
    0
  );
  const typeCount = requestPackage.evidenceBoundary.knowledgeCardIdsByType.length;

  return `${totalKnowledgeCards} KnowledgeCard(s) across ${typeCount} type group(s).`;
}

function createFabricationValidation({
  fabricatedAuthorYearDetected,
  fabricatedCitationDetected,
  fabricatedPageNumberDetected,
  mockResponsePackage,
  unsupportedClaimCount
}: {
  fabricatedAuthorYearDetected: boolean;
  fabricatedCitationDetected: boolean;
  fabricatedPageNumberDetected: boolean;
  mockResponsePackage: MockAiResponsePackagePreview | null;
  unsupportedClaimCount: number;
}): AiOutputFabricationValidationCheck[] {
  const checks: MockAiForbiddenOutputCheck[] = [
    "fabricated_citation",
    "fabricated_page_number",
    "fabricated_author_year",
    "invented_quote",
    "invented_case",
    "unsupported_claim",
    "final_manuscript_claim",
    "auto_save_attempt",
    "human_review_bypass"
  ];

  return checks.map((check) => ({
    check,
    detected: getFabricationCheckDetected({
      check,
      fabricatedAuthorYearDetected,
      fabricatedCitationDetected,
      fabricatedPageNumberDetected,
      mockResponsePackage,
      unsupportedClaimCount
    }),
    note: createFabricationCheckNote(check)
  }));
}

function getFabricationCheckDetected({
  check,
  fabricatedAuthorYearDetected,
  fabricatedCitationDetected,
  fabricatedPageNumberDetected,
  mockResponsePackage,
  unsupportedClaimCount
}: {
  check: MockAiForbiddenOutputCheck;
  fabricatedAuthorYearDetected: boolean;
  fabricatedCitationDetected: boolean;
  fabricatedPageNumberDetected: boolean;
  mockResponsePackage: MockAiResponsePackagePreview | null;
  unsupportedClaimCount: number;
}): boolean {
  if (check === "fabricated_citation") {
    return fabricatedCitationDetected;
  }

  if (check === "fabricated_author_year") {
    return fabricatedAuthorYearDetected;
  }

  if (check === "fabricated_page_number") {
    return fabricatedPageNumberDetected;
  }

  if (check === "unsupported_claim") {
    return unsupportedClaimCount > 0;
  }

  if (check === "final_manuscript_claim") {
    return (mockResponsePackage?.validationSummary.finalManuscriptRiskCount ?? 0) > 0;
  }

  if (check === "auto_save_attempt") {
    return mockResponsePackage?.reviewGate.outputCanBeSaved ?? false;
  }

  if (check === "human_review_bypass") {
    return mockResponsePackage ? !mockResponsePackage.reviewGate.requiresHumanReview : false;
  }

  return false;
}

function createFabricationCheckNote(check: MockAiForbiddenOutputCheck): string {
  if (check === "unsupported_claim") {
    return "Unsupported claims are rejected before human review.";
  }

  if (check === "auto_save_attempt") {
    return "AI output cannot be auto-saved.";
  }

  if (check === "human_review_bypass") {
    return "Human academic review is mandatory.";
  }

  return "Forbidden output check is enforced at validation preview.";
}

function createDecisionReason(status: AiOutputValidationGateStatus): string {
  if (status === "rejected") {
    return "Validation found forbidden or unsupported output conditions.";
  }

  if (status === "blocked") {
    return "Validation is blocked by missing prerequisites or trace coverage.";
  }

  if (status === "needs_review") {
    return "Validation can proceed only to human review with warnings.";
  }

  return "Validation is ready for human review; output still cannot save or replace drafts.";
}

function createNextRecommendedAction(status: AiOutputValidationGateStatus): string {
  if (status === "rejected") {
    return "Reject the mock output boundary and resolve unsupported or fabricated conditions.";
  }

  if (status === "blocked") {
    return "Resolve validation blockers before designing provider response handling.";
  }

  return "Keep output in review-only state and define mock-provider response DTO tests before any real provider adapter.";
}

function createGateId(
  requestPackage: AiEnhancementRequestPackagePreview | null,
  mockResponsePackage: MockAiResponsePackagePreview | null
): string {
  const requestId = requestPackage?.packageMeta.packageId ?? "missing-request";
  const responseId = mockResponsePackage?.responseMeta.responseId ?? "missing-response";

  return `ai-output-validation-gate-${requestId}-${responseId}`;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
