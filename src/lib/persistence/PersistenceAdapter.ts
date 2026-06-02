import type {
  PersistenceSaveCandidateBundle,
  SaveCandidateBlocker,
  SaveCandidateValidationStatus,
  SaveCandidateWarning
} from "../../types/domain";

export type PersistenceAdapterStatus = "mock_dry_run_only" | "ready" | "unavailable";

export interface PersistenceAdapterError {
  code:
    | "dry_run_only"
    | "invalid_bundle"
    | "blocked_bundle"
    | "adapter_unavailable"
    | "unknown";
  message: string;
  field?: string;
}

export interface SimulatedSavedCounts {
  draftArtifacts: number;
  knowledgeCards: number;
  marketingTags: number;
  sourceCards: number;
  sourceDocuments: number;
}

export interface SaveBundleRequest {
  bundle: PersistenceSaveCandidateBundle;
  mode: "dry_run";
  requestedBy: "local_mock_user";
}

export interface SaveBundleDryRunResult {
  adapterStatus: PersistenceAdapterStatus;
  blockers: SaveCandidateBlocker[];
  dryRunStatus: SaveCandidateValidationStatus;
  errors: PersistenceAdapterError[];
  nextRecommendedAction: string;
  persisted: false;
  simulatedSavedCounts: SimulatedSavedCounts;
  warnings: SaveCandidateWarning[];
}

export interface SaveBundleResult extends SaveBundleDryRunResult {
  persisted: false;
}

export interface PersistenceAdapter {
  getStatus(): PersistenceAdapterStatus;
  dryRunSaveBundle(request: SaveBundleRequest): SaveBundleDryRunResult;
  saveBundle(request: SaveBundleRequest): SaveBundleResult;
}
