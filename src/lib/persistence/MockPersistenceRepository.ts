import type {
  PersistenceSaveCandidateBundle,
  SaveCandidateBlocker,
  SaveCandidateWarning
} from "../../types/domain";
import type {
  PersistenceAdapter,
  PersistenceAdapterError,
  PersistenceAdapterStatus,
  SaveBundleDryRunResult,
  SaveBundleRequest,
  SaveBundleResult,
  SimulatedSavedCounts
} from "./PersistenceAdapter";

export class MockPersistenceRepository implements PersistenceAdapter {
  getStatus(): PersistenceAdapterStatus {
    return "mock_dry_run_only";
  }

  dryRunSaveBundle(request: SaveBundleRequest): SaveBundleDryRunResult {
    const shapeErrors = validateBundleShape(request.bundle);
    const blockers = [...request.bundle.blockers, ...shapeErrors.blockers];
    const warnings = [
      ...request.bundle.warnings,
      ...shapeErrors.warnings,
      {
        message:
          "Mock repository dry run only — no files, database records, or vault entries are created.",
        objectType: "bundle",
        warningId: "mock-repository-dry-run-only"
      } satisfies SaveCandidateWarning
    ];
    const dryRunStatus =
      blockers.length > 0
        ? "blocked"
        : request.bundle.validationStatus === "ready" && shapeErrors.errors.length === 0
          ? "ready"
          : "needs_review";

    return {
      adapterStatus: this.getStatus(),
      blockers,
      dryRunStatus,
      errors: shapeErrors.errors,
      nextRecommendedAction: getNextRecommendedAction({
        blockers,
        dryRunStatus,
        errors: shapeErrors.errors,
        warnings
      }),
      persisted: false,
      simulatedSavedCounts: createSimulatedSavedCounts(request.bundle, blockers),
      warnings
    };
  }

  saveBundle(request: SaveBundleRequest): SaveBundleResult {
    return {
      ...this.dryRunSaveBundle(request),
      errors: [
        ...this.dryRunSaveBundle(request).errors,
        {
          code: "dry_run_only",
          message:
            "MockPersistenceRepository does not persist data. Use dry-run output only."
        }
      ],
      persisted: false
    };
  }
}

function validateBundleShape(bundle: PersistenceSaveCandidateBundle): {
  blockers: SaveCandidateBlocker[];
  errors: PersistenceAdapterError[];
  warnings: SaveCandidateWarning[];
} {
  const blockers: SaveCandidateBlocker[] = [];
  const errors: PersistenceAdapterError[] = [];
  const warnings: SaveCandidateWarning[] = [];

  if (!bundle.bundleId.trim()) {
    errors.push({
      code: "invalid_bundle",
      field: "bundleId",
      message: "Persistence save candidate bundle is missing a bundle ID."
    });
  }

  if (!bundle.notPersisted) {
    blockers.push({
      blockerId: "mock-repository-persisted-flag",
      message: "Save candidate bundle must be marked notPersisted.",
      objectType: "bundle",
      field: "notPersisted"
    });
  }

  if (!bundle.sourceDocumentCandidate.candidateId.trim()) {
    errors.push({
      code: "invalid_bundle",
      field: "sourceDocumentCandidate.candidateId",
      message: "SourceDocument save candidate is missing a candidate ID."
    });
  }

  if (!bundle.sourceCardCandidate.candidateId.trim()) {
    errors.push({
      code: "invalid_bundle",
      field: "sourceCardCandidate.candidateId",
      message: "SourceCard save candidate is missing a candidate ID."
    });
  }

  if (bundle.knowledgeCardCandidates.length === 0) {
    blockers.push({
      blockerId: "mock-repository-no-knowledge-cards",
      message: "No Knowledge Card save candidates are available for dry run.",
      objectType: "knowledge_card"
    });
  }

  if (bundle.draftArtifactCandidate.mockOnly) {
    warnings.push({
      field: "draftArtifactCandidate.mockOnly",
      message: "Draft artifact is mock_only and cannot be treated as a real saved draft.",
      objectType: "draft_artifact",
      warningId: "mock-repository-draft-artifact-mock-only"
    });
  }

  if (
    bundle.sourceDocumentCandidate.traceReferences.some(
      (trace) => !trace.pageNumberTrusted
    )
  ) {
    warnings.push({
      field: "traceReferences",
      message:
        "DOCX page numbers are not trusted; dry run relies on chunk references such as docx:pN.",
      objectType: "source_document",
      warningId: "mock-repository-docx-trace-warning"
    });
  }

  return {
    blockers,
    errors,
    warnings
  };
}

function createSimulatedSavedCounts(
  bundle: PersistenceSaveCandidateBundle,
  blockers: SaveCandidateBlocker[]
): SimulatedSavedCounts {
  if (blockers.length > 0) {
    return {
      draftArtifacts: 0,
      knowledgeCards: 0,
      marketingTags: 0,
      sourceCards: 0,
      sourceDocuments: 0
    };
  }

  return {
    draftArtifacts: bundle.draftArtifactCandidate.mockOnly ? 0 : 1,
    knowledgeCards: bundle.knowledgeCardCandidates.filter(
      (candidate) => candidate.validationStatus !== "blocked"
    ).length,
    marketingTags: bundle.marketingTagCandidates.length,
    sourceCards: bundle.sourceCardCandidate.validationStatus === "blocked" ? 0 : 1,
    sourceDocuments:
      bundle.sourceDocumentCandidate.validationStatus === "blocked" ? 0 : 1
  };
}

function getNextRecommendedAction({
  blockers,
  dryRunStatus,
  errors,
  warnings
}: {
  blockers: SaveCandidateBlocker[];
  dryRunStatus: SaveBundleDryRunResult["dryRunStatus"];
  errors: PersistenceAdapterError[];
  warnings: SaveCandidateWarning[];
}): string {
  if (errors.length > 0) {
    return `Fix adapter validation error: ${errors[0].message}`;
  }

  if (blockers.length > 0) {
    return `Resolve dry-run blocker: ${blockers[0].message}`;
  }

  if (dryRunStatus === "needs_review") {
    return `Review dry-run warning: ${warnings[0]?.message ?? "complete persistence readiness review."}`;
  }

  return "Dry run is ready; choose a real storage boundary in Sprint 4C-3 before enabling save.";
}
