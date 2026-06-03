import type {
  AiEnhancementFutureTaskType,
  AiEnhancementRequestPackagePreview
} from "./AiEnhancementRequestPackageMapper";

export type MockAiResponseStatus =
  | "ready_for_review"
  | "needs_review"
  | "blocked";

export type MockAiResponseRiskLevel = "low" | "medium" | "high";
export type MockAiClaimSupportStatus =
  | "supported"
  | "weak_support"
  | "unsupported";

export type MockAiForbiddenOutputCheck =
  | "fabricated_citation"
  | "fabricated_page_number"
  | "fabricated_author_year"
  | "invented_quote"
  | "invented_case"
  | "unsupported_claim"
  | "final_manuscript_claim"
  | "auto_save_attempt"
  | "human_review_bypass";

export interface MockAiResponseMeta {
  createdAt: string;
  outputMode: "mock_response_boundary";
  providerMode: "mock_preview_only";
  requestPackageId: string;
  responseId: string;
  status: MockAiResponseStatus;
}

export interface MockAiSimulatedResponseBoundary {
  evidenceRefsUsed: string[];
  knowledgeCardIdsUsed: string[];
  reviewStatus: "needs_review" | "blocked";
  riskLevel: MockAiResponseRiskLevel;
  sectionId: string;
  simulatedOutputLabel: string;
  taskType: AiEnhancementFutureTaskType;
}

export interface MockAiValidationSummary {
  citationRiskCount: number;
  fabricationRiskCount: number;
  finalManuscriptRiskCount: number;
  missingTraceCount: number;
  supportedOutputCount: number;
  totalMockOutputs: number;
  unsupportedOutputCount: number;
}

export interface MockAiClaimValidation {
  blocker: string | null;
  claimId: string;
  knowledgeCardIds: string[];
  sectionId: string;
  supportStatus: MockAiClaimSupportStatus;
  traceRefs: string[];
  warning: string | null;
}

export interface MockAiCitationValidation {
  citationPlaceholdersRemainPlaceholders: boolean;
  docxPageNumbersRemainUntrusted: boolean;
  noFabricatedApaCitation: boolean;
  noFabricatedAuthorYear: boolean;
  noFabricatedPageNumber: boolean;
}

export interface MockAiReviewGate {
  outputCanBeSaved: false;
  outputCanReplaceDraft: false;
  requiresAcademicReview: true;
  requiresCitationReview: true;
  requiresHumanReview: true;
  requiresTraceReview: true;
}

export interface MockAiResponsePackagePreview {
  blockers: string[];
  citationValidation: MockAiCitationValidation;
  claimValidation: MockAiClaimValidation[];
  forbiddenOutputChecks: MockAiForbiddenOutputCheck[];
  responseMeta: MockAiResponseMeta;
  reviewGate: MockAiReviewGate;
  simulatedResponseBoundary: MockAiSimulatedResponseBoundary[];
  validationSummary: MockAiValidationSummary;
  warnings: string[];
}

export interface MockAiResponsePackageMapperInput {
  requestPackage: AiEnhancementRequestPackagePreview | null;
}

export function createMockAiResponsePackagePreview({
  requestPackage
}: MockAiResponsePackageMapperInput): MockAiResponsePackagePreview {
  const blockers = [...(requestPackage?.blockers ?? [])];
  const warnings = [
    "Mock preview only — no AI provider is called.",
    "This is not AI-generated prose.",
    "Mock output cannot replace DraftArtifact content.",
    "No citation metadata is fabricated.",
    "Human academic review remains mandatory.",
    "Citation placeholders remain placeholders.",
    "DOCX page numbers remain untrusted."
  ];

  if (!requestPackage) {
    blockers.push("AI Enhancement Request Package is required before mock response preview.");
  }

  if (requestPackage?.packageMeta.status === "blocked") {
    blockers.push("Blocked AI Enhancement Request Package cannot produce a reviewable mock response.");
  }

  const simulatedResponseBoundary = createSimulatedResponseBoundary(requestPackage);
  const claimValidation = createClaimValidation({
    requestPackage,
    simulatedResponseBoundary
  });
  const missingTraceCount = claimValidation.filter(
    (claim) => claim.traceRefs.length === 0
  ).length;
  const unsupportedOutputCount = claimValidation.filter(
    (claim) => claim.supportStatus === "unsupported"
  ).length;
  const citationRiskCount = requestPackage?.draftBoundary.citationPlaceholderCount ?? 0;
  const fabricationRiskCount = 0;
  const finalManuscriptRiskCount = 0;

  if (citationRiskCount > 0) {
    warnings.push(
      `${citationRiskCount} citation placeholder(s) remain; mock response must not convert them into APA citations.`
    );
  }

  if (missingTraceCount > 0) {
    warnings.push(
      `${missingTraceCount} mock output(s) have incomplete trace coverage.`
    );
  }

  if (unsupportedOutputCount > 0) {
    blockers.push(
      `${unsupportedOutputCount} mock output(s) are unsupported and cannot affect DraftArtifacts.`
    );
  }

  const status = getResponseStatus({
    blockers,
    requestStatus: requestPackage?.packageMeta.status,
    warningCount: warnings.length
  });

  return {
    blockers: dedupe(blockers),
    citationValidation: {
      citationPlaceholdersRemainPlaceholders: true,
      docxPageNumbersRemainUntrusted: true,
      noFabricatedApaCitation: true,
      noFabricatedAuthorYear: true,
      noFabricatedPageNumber: true
    },
    claimValidation,
    forbiddenOutputChecks: [
      "fabricated_citation",
      "fabricated_page_number",
      "fabricated_author_year",
      "invented_quote",
      "invented_case",
      "unsupported_claim",
      "final_manuscript_claim",
      "auto_save_attempt",
      "human_review_bypass"
    ],
    responseMeta: {
      createdAt: requestPackage?.packageMeta.createdAt ?? "preview-only",
      outputMode: "mock_response_boundary",
      providerMode: "mock_preview_only",
      requestPackageId: requestPackage?.packageMeta.packageId ?? "missing-request-package",
      responseId: createResponseId(requestPackage),
      status
    },
    reviewGate: {
      outputCanBeSaved: false,
      outputCanReplaceDraft: false,
      requiresAcademicReview: true,
      requiresCitationReview: true,
      requiresHumanReview: true,
      requiresTraceReview: true
    },
    simulatedResponseBoundary,
    validationSummary: {
      citationRiskCount,
      fabricationRiskCount,
      finalManuscriptRiskCount,
      missingTraceCount,
      supportedOutputCount: claimValidation.filter(
        (claim) => claim.supportStatus === "supported"
      ).length,
      totalMockOutputs: simulatedResponseBoundary.length,
      unsupportedOutputCount
    },
    warnings: dedupe([...(requestPackage?.warnings ?? []), ...warnings])
  };
}

function createSimulatedResponseBoundary(
  requestPackage: AiEnhancementRequestPackagePreview | null
): MockAiSimulatedResponseBoundary[] {
  if (!requestPackage) {
    return [];
  }

  const taskTypes = requestPackage.aiInstructionBoundary.allowedFutureTaskTypes;
  const knowledgeCardIds = requestPackage.evidenceBoundary.knowledgeCardIdsByType.flatMap(
    (group) => group.knowledgeCardIds
  );
  const traceRefs = requestPackage.evidenceBoundary.traceRefs;

  return requestPackage.draftBoundary.sectionReadiness.map((section, index) => {
    const evidenceRefsUsed = traceRefs.slice(0, Math.min(traceRefs.length, 3));
    const knowledgeCardIdsUsed = knowledgeCardIds.slice(
      0,
      Math.min(knowledgeCardIds.length, 3)
    );
    const riskLevel = getRiskLevel({
      citationPlaceholderCount: requestPackage.draftBoundary.citationPlaceholderCount,
      sectionReady: section.readiness === "ready",
      traceReady: evidenceRefsUsed.length > 0
    });

    return {
      evidenceRefsUsed,
      knowledgeCardIdsUsed,
      reviewStatus: riskLevel === "high" ? "blocked" : "needs_review",
      riskLevel,
      sectionId: section.sectionId,
      simulatedOutputLabel: `Mock validation placeholder for ${section.title}`,
      taskType: taskTypes[index % taskTypes.length]
    };
  });
}

function createClaimValidation({
  requestPackage,
  simulatedResponseBoundary
}: {
  requestPackage: AiEnhancementRequestPackagePreview | null;
  simulatedResponseBoundary: MockAiSimulatedResponseBoundary[];
}): MockAiClaimValidation[] {
  return simulatedResponseBoundary.map((boundary, index) => {
    const supportStatus = getSupportStatus(boundary);
    const missingTrace = boundary.evidenceRefsUsed.length === 0;
    const blocker =
      supportStatus === "unsupported"
        ? "Mock output lacks traceable support and cannot affect DraftArtifacts."
        : null;
    const warning =
      supportStatus === "weak_support"
        ? "Mock output has weak support and requires trace review."
        : requestPackage?.draftBoundary.citationPlaceholderCount
          ? "Citation placeholders remain placeholders and require citation review."
          : null;

    return {
      blocker,
      claimId: `mock-claim-${index + 1}-${boundary.sectionId}`,
      knowledgeCardIds: boundary.knowledgeCardIdsUsed,
      sectionId: boundary.sectionId,
      supportStatus: missingTrace ? "unsupported" : supportStatus,
      traceRefs: boundary.evidenceRefsUsed,
      warning
    };
  });
}

function getRiskLevel({
  citationPlaceholderCount,
  sectionReady,
  traceReady
}: {
  citationPlaceholderCount: number;
  sectionReady: boolean;
  traceReady: boolean;
}): MockAiResponseRiskLevel {
  if (!traceReady) {
    return "high";
  }

  if (!sectionReady || citationPlaceholderCount > 0) {
    return "medium";
  }

  return "low";
}

function getSupportStatus(
  boundary: MockAiSimulatedResponseBoundary
): MockAiClaimSupportStatus {
  if (boundary.evidenceRefsUsed.length === 0 || boundary.knowledgeCardIdsUsed.length === 0) {
    return "unsupported";
  }

  if (boundary.riskLevel === "medium") {
    return "weak_support";
  }

  return "supported";
}

function getResponseStatus({
  blockers,
  requestStatus,
  warningCount
}: {
  blockers: string[];
  requestStatus: AiEnhancementRequestPackagePreview["packageMeta"]["status"] | undefined;
  warningCount: number;
}): MockAiResponseStatus {
  if (blockers.length > 0 || requestStatus === "blocked") {
    return "blocked";
  }

  if (warningCount > 0 || requestStatus === "needs_review") {
    return "needs_review";
  }

  return "ready_for_review";
}

function createResponseId(
  requestPackage: AiEnhancementRequestPackagePreview | null
): string {
  const packageId = requestPackage?.packageMeta.packageId ?? "missing-request-package";
  return `mock-ai-response-${packageId}`;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
