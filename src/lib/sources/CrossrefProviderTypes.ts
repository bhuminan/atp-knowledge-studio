import type {
  ExternalMetadataConfidenceBand,
  ExternalMetadataMatchCandidate,
  ExternalMetadataProvider,
  ExternalMetadataSourceType
} from "./ExternalMetadataMatchMapper";

export type CrossrefFixtureProviderType = "crossref_fixture_read_only";

export interface CrossrefFixtureProvider extends ExternalMetadataProvider {
  autoOverwriteAllowed: false;
  isFixtureOnly: true;
  isLiveNetwork: false;
  noAutoOverwrite: true;
  providerType: CrossrefFixtureProviderType;
}

export interface CrossrefFixtureProviderRequest {
  authorsCandidate?: string[];
  containerCandidate?: string | null;
  doiCandidate?: string | null;
  titleCandidate?: string | null;
  yearCandidate?: string | null;
}

export interface CrossrefFixturePayload {
  message: {
    author?: Array<{
      family?: string;
      given?: string;
    }>;
    containerTitle?: string[];
    DOI?: string;
    issue?: string;
    page?: string;
    publishedPrint?: {
      dateParts: number[][];
    };
    publisher?: string;
    reference?: unknown[];
    resource?: {
      primary?: {
        URL?: string;
      };
    };
    subtype?: string;
    title?: string[];
    type?: string;
    URL?: string;
    volume?: string;
  };
  status: "ok";
}

export interface CrossrefNormalizedCandidate {
  confidenceBand: ExternalMetadataConfidenceBand;
  confidenceEvidence: string[];
  confidenceScore: number;
  normalizedCandidate: ExternalMetadataMatchCandidate;
  rawFixtureSnapshotJson: string;
  rawVsNormalizedSummary: string[];
}

export interface CrossrefFixtureCandidateResult extends CrossrefNormalizedCandidate {
  autoOverwriteAllowed: false;
  blockers: string[];
  isFixtureOnly: true;
  isLiveNetwork: false;
  noAutoOverwrite: true;
  provider: CrossrefFixtureProvider;
  providerRecordRef: string;
  sourceTypeCompatibility: "compatible" | "needs_review";
  warnings: string[];
}

export interface CrossrefFixtureRecord {
  fixtureId: string;
  matchTokens: string[];
  payload: CrossrefFixturePayload;
  sourceTypes: ExternalMetadataSourceType[];
}
