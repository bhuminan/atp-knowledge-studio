import type {
  DeepIntakeCandidatePackageAutomationLevel,
  DeepIntakeCandidatePackagePreview,
  DeepIntakeCandidatePackageStatus,
  DeepIntakeCandidatePackageTrust
} from "./DeepIntakeCandidatePackagePreviewMapper";
import type {
  SourceDocumentChunkingPreview
} from "./SourceDocumentChunkingPreviewMapper";
import type {
  SourceDocumentIntakeReadinessPreview
} from "./SourceDocumentIntakeReadinessMapper";
import type {
  SourceDocumentStructurePreview
} from "./SourceDocumentStructurePreviewMapper";
import type {
  SourceSectionContentChunkSaveCandidateMapping
} from "./SourceSectionContentChunkSaveCandidateMapper";

export type DeepIntakeRunCandidateBundleStatus =
  | "ready"
  | "needs_review"
  | "blocked";

export type DeepIntakeRunCandidateBundleMode =
  | "no_ai_preview"
  | "save_sections_chunks_only";

export interface DeepIntakeRunCandidateBundleInput {
  alreadySavedHint?: boolean;
  chunkingPreview?: SourceDocumentChunkingPreview | null;
  deepIntakePackage?: DeepIntakeCandidatePackagePreview | null;
  intakeReadiness?: SourceDocumentIntakeReadinessPreview | null;
  sectionChunkSaveCandidate?: SourceSectionContentChunkSaveCandidateMapping | null;
  sourceDocumentId?: string | null;
  structurePreview?: SourceDocumentStructurePreview | null;
}

export interface DeepIntakeRunCandidateBundle {
  automationLevel: DeepIntakeCandidatePackageAutomationLevel;
  blockers: string[];
  estimatedRecordRange: {
    max: number;
    min: number;
  };
  futureUnitBoundary: {
    caseUnitsPlanned: boolean;
    evidenceUnitsPlanned: boolean;
    knowledgeUnitsPlanned: boolean;
    persistenceAllowedNow: false;
    quoteUnitsPlanned: boolean;
    teachingUnitsPlanned: boolean;
    writingAnglesPlanned: boolean;
  };
  positiveSignals: string[];
  previewInputs: {
    hasChunkingPreview: boolean;
    hasDeepIntakePackage: boolean;
    hasIntakeReadiness: boolean;
    hasSectionChunkSaveCandidate: boolean;
    hasStructurePreview: boolean;
  };
  previewNotice: string;
  readinessScore: number;
  recommendedNextAction: string;
  runId: string;
  runMode: DeepIntakeRunCandidateBundleMode;
  savePlan: {
    alreadySavedHint?: boolean;
    canSaveSourceSectionsAndChunks: boolean;
    chunkCandidateCount: number;
    requiresExplicitUserApproval: boolean;
    sectionCandidateCount: number;
  };
  sourceDocumentBoundary: {
    hasSavedSourceDocument: boolean;
    sourceDocumentId?: string;
    sourceTrust: DeepIntakeCandidatePackageTrust;
  };
  sourceDocumentId?: string;
  status: DeepIntakeRunCandidateBundleStatus;
  trustProfile: {
    chunkingTrust: DeepIntakeCandidatePackageTrust;
    sectionChunkSaveTrust: DeepIntakeCandidatePackageTrust;
    sourceDocumentTrust: DeepIntakeCandidatePackageTrust;
    structureTrust: DeepIntakeCandidatePackageTrust;
    writerInputTrust: DeepIntakeCandidatePackageTrust;
  };
  warnings: string[];
}

export const deepIntakeRunCandidateBundlePreviewNotice =
  "Run bundle preview only — no KnowledgeUnit, EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, WritingAngle, citation, APA, or Writer records are created.";

export function createDeepIntakeRunCandidateBundle(
  input: DeepIntakeRunCandidateBundleInput
): DeepIntakeRunCandidateBundle {
  const sourceDocumentId = input.sourceDocumentId?.trim() || undefined;
  const packagePreview = input.deepIntakePackage ?? null;
  const saveCandidate = input.sectionChunkSaveCandidate ?? null;
  const blockers = uniqueList([
    ...(input.intakeReadiness?.blockers ?? []),
    ...(input.structurePreview?.blockers ?? []),
    ...(input.chunkingPreview?.blockers ?? []),
    ...(packagePreview?.blockers ?? []),
    ...(saveCandidate?.blockers ?? [])
  ]);
  const warnings = uniqueList([
    ...(input.intakeReadiness?.warnings ?? []),
    ...(input.structurePreview?.warnings ?? []),
    ...(input.chunkingPreview?.warnings ?? []),
    ...(packagePreview?.warnings ?? []),
    ...(saveCandidate?.warnings ?? [])
  ]);
  const trustProfile = createTrustProfile(packagePreview, saveCandidate);
  const canSaveSourceSectionsAndChunks =
    Boolean(sourceDocumentId) &&
    saveCandidate?.status === "ready" &&
    (saveCandidate.sectionCount ?? 0) > 0 &&
    (saveCandidate.chunkCount ?? 0) > 0 &&
    packagePreview?.status !== "blocked" &&
    input.chunkingPreview?.chunkingMode !== "metadata_only" &&
    blockers.length === 0;
  const status = createBundleStatus({
    blockers,
    canSaveSourceSectionsAndChunks,
    hasSourceDocument: Boolean(sourceDocumentId),
    packageStatus: packagePreview?.status ?? "needs_review",
    warnings
  });
  const runMode: DeepIntakeRunCandidateBundleMode =
    canSaveSourceSectionsAndChunks ? "save_sections_chunks_only" : "no_ai_preview";
  const positiveSignals = uniqueList([
    ...(input.intakeReadiness?.positiveSignals ?? []),
    ...(input.structurePreview?.positiveSignals ?? []),
    ...(input.chunkingPreview?.positiveSignals ?? []),
    ...(packagePreview?.positiveSignals ?? []),
    sourceDocumentId ? "saved_source_document_available" : "",
    canSaveSourceSectionsAndChunks ? "source_section_content_chunk_save_plan_available" : ""
  ]);

  return {
    automationLevel:
      status === "blocked"
        ? "blocked"
        : packagePreview?.automationLevel ?? "review_required",
    blockers,
    estimatedRecordRange: packagePreview?.estimatedRecordRange ?? { min: 0, max: 0 },
    futureUnitBoundary: createFutureUnitBoundary(packagePreview),
    positiveSignals,
    previewInputs: {
      hasChunkingPreview: Boolean(input.chunkingPreview),
      hasDeepIntakePackage: Boolean(packagePreview),
      hasIntakeReadiness: Boolean(input.intakeReadiness),
      hasSectionChunkSaveCandidate: Boolean(saveCandidate),
      hasStructurePreview: Boolean(input.structurePreview)
    },
    previewNotice: deepIntakeRunCandidateBundlePreviewNotice,
    readinessScore: packagePreview?.deepIntakeReadinessScore ?? input.intakeReadiness?.score ?? 0,
    recommendedNextAction: createRecommendedNextAction({
      canSaveSourceSectionsAndChunks,
      chunkingPreview: input.chunkingPreview ?? null,
      hasSourceDocument: Boolean(sourceDocumentId),
      packageStatus: packagePreview?.status ?? "needs_review",
      saveCandidate,
      status
    }),
    runId: createRunId(sourceDocumentId, saveCandidate),
    runMode,
    savePlan: {
      alreadySavedHint: input.alreadySavedHint,
      canSaveSourceSectionsAndChunks,
      chunkCandidateCount: saveCandidate?.chunkCount ?? 0,
      requiresExplicitUserApproval: true,
      sectionCandidateCount: saveCandidate?.sectionCount ?? 0
    },
    sourceDocumentBoundary: {
      hasSavedSourceDocument: Boolean(sourceDocumentId),
      sourceDocumentId,
      sourceTrust: trustProfile.sourceDocumentTrust
    },
    sourceDocumentId,
    status,
    trustProfile,
    warnings
  };
}

function createBundleStatus(input: {
  blockers: string[];
  canSaveSourceSectionsAndChunks: boolean;
  hasSourceDocument: boolean;
  packageStatus: DeepIntakeCandidatePackageStatus;
  warnings: string[];
}): DeepIntakeRunCandidateBundleStatus {
  if (input.blockers.some(isHardBlocker) || input.packageStatus === "blocked") {
    return "blocked";
  }

  if (input.canSaveSourceSectionsAndChunks) {
    return "ready";
  }

  if (!input.hasSourceDocument || input.warnings.length > 0) {
    return "needs_review";
  }

  return input.packageStatus === "ready" ? "ready" : "needs_review";
}

function createTrustProfile(
  packagePreview: DeepIntakeCandidatePackagePreview | null,
  saveCandidate: SourceSectionContentChunkSaveCandidateMapping | null
): DeepIntakeRunCandidateBundle["trustProfile"] {
  const packageTrust = packagePreview?.trustProfile ?? {
    chunkingTrust: "red" as const,
    sourceDocumentTrust: "red" as const,
    structureTrust: "red" as const,
    writerInputTrust: "red" as const
  };

  return {
    ...packageTrust,
    sectionChunkSaveTrust:
      saveCandidate?.status === "ready"
        ? "green"
        : saveCandidate
          ? "red"
          : "orange"
  };
}

function createFutureUnitBoundary(
  packagePreview: DeepIntakeCandidatePackagePreview | null
): DeepIntakeRunCandidateBundle["futureUnitBoundary"] {
  const summary = packagePreview?.candidateSummary;

  return {
    caseUnitsPlanned: (summary?.caseUnits ?? 0) > 0,
    evidenceUnitsPlanned: (summary?.evidenceUnits ?? 0) > 0,
    knowledgeUnitsPlanned: (summary?.knowledgeUnits ?? 0) > 0,
    persistenceAllowedNow: false,
    quoteUnitsPlanned: (summary?.quoteUnits ?? 0) > 0,
    teachingUnitsPlanned: (summary?.teachingUnits ?? 0) > 0,
    writingAnglesPlanned: (summary?.writingAngles ?? 0) > 0
  };
}

function createRecommendedNextAction(input: {
  canSaveSourceSectionsAndChunks: boolean;
  chunkingPreview: SourceDocumentChunkingPreview | null;
  hasSourceDocument: boolean;
  packageStatus: DeepIntakeCandidatePackageStatus;
  saveCandidate: SourceSectionContentChunkSaveCandidateMapping | null;
  status: DeepIntakeRunCandidateBundleStatus;
}): string {
  if (input.status === "blocked") {
    return "Resolve blockers before preparing a Deep Intake run candidate bundle.";
  }

  if (!input.hasSourceDocument) {
    return "Save the SourceDocument first, then review this run bundle again.";
  }

  if (input.chunkingPreview?.chunkingMode === "metadata_only") {
    return "Wait for PDF text extraction before preparing a SourceSection/ContentChunk save run.";
  }

  if (!input.saveCandidate || input.saveCandidate.status !== "ready") {
    return "Review structure and chunk candidates before enabling the SourceSection/ContentChunk save plan.";
  }

  if (input.canSaveSourceSectionsAndChunks) {
    return "User may explicitly save SourceSection and ContentChunk records; future KnowledgeUnit persistence remains blocked.";
  }

  return input.packageStatus === "ready"
    ? "Review bundle warnings before manual SourceSection/ContentChunk save."
    : "Review the run bundle before any future automation is considered.";
}

function createRunId(
  sourceDocumentId: string | undefined,
  saveCandidate: SourceSectionContentChunkSaveCandidateMapping | null
): string {
  return [
    "deep-intake-run",
    slugify(sourceDocumentId ?? "unsaved-source-document"),
    saveCandidate?.sectionCount ?? 0,
    saveCandidate?.chunkCount ?? 0,
    simpleHash(
      [
        sourceDocumentId ?? "missing",
        saveCandidate?.sections.map((section) => section.id).join("|") ?? "",
        saveCandidate?.chunks.map((chunk) => chunk.id).join("|") ?? ""
      ].join(":")
    )
  ].join("-");
}

function isHardBlocker(blocker: string): boolean {
  return [
    "candidate_blocked",
    "duplicate_candidate_detected",
    "empty_file",
    "file_extension_mismatch",
    "missing_file_path",
    "sourceDocumentId is required before SourceSection/ContentChunk save.",
    "unsupported_file_type",
    "unreadable_file"
  ].includes(blocker);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "candidate";
}

function simpleHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function uniqueList(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}
