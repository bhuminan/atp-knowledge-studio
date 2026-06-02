import type {
  PersistenceSaveCandidateBundle,
  SaveCandidateBlocker,
  SaveCandidateValidationStatus,
  SaveCandidateWarning
} from "../../types/domain";
import { MockPersistenceRepository } from "./MockPersistenceRepository";
import type {
  PersistenceAdapterStatus,
  SaveBundleDryRunResult,
  SimulatedSavedCounts
} from "./PersistenceAdapter";

export interface PersistenceDryRunPreviewResult {
  adapterStatus: PersistenceAdapterStatus;
  blockers: SaveCandidateBlocker[];
  dryRunStatus: SaveCandidateValidationStatus;
  nextRecommendedAction: string;
  persisted: false;
  simulatedSavedCounts: SimulatedSavedCounts;
  warnings: SaveCandidateWarning[];
}

export function createPersistenceDryRunPreview(
  bundle: PersistenceSaveCandidateBundle
): PersistenceDryRunPreviewResult {
  return normalizeDryRunResult(
    new MockPersistenceRepository().dryRunSaveBundle({
      bundle,
      mode: "dry_run",
      requestedBy: "local_mock_user"
    })
  );
}

function normalizeDryRunResult(
  result: SaveBundleDryRunResult
): PersistenceDryRunPreviewResult {
  return {
    adapterStatus: result.adapterStatus,
    blockers: result.blockers,
    dryRunStatus: result.dryRunStatus,
    nextRecommendedAction: result.nextRecommendedAction,
    persisted: false,
    simulatedSavedCounts: result.simulatedSavedCounts,
    warnings: result.warnings
  };
}
