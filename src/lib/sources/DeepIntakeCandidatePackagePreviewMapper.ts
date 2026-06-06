import type {
  SourceDocumentChunkingPreview,
  SourceDocumentEstimatedRecordCounts
} from "./SourceDocumentChunkingPreviewMapper";
import type {
  SourceDocumentIntakeReadinessPreview
} from "./SourceDocumentIntakeReadinessMapper";
import type {
  SourceDocumentStructurePreview
} from "./SourceDocumentStructurePreviewMapper";

export type DeepIntakeCandidatePackageStatus =
  | "ready"
  | "needs_review"
  | "blocked";

export type DeepIntakeCandidatePackageAutomationLevel =
  | "auto_candidate"
  | "review_required"
  | "blocked";

export type DeepIntakeCandidatePackageTrust = "green" | "orange" | "red";

export interface DeepIntakeSourceToKnowledgeBoundary {
  caseUnitCandidatesPossible: boolean;
  evidenceUnitCandidatesPossible: boolean;
  knowledgeUnitCandidatesPossible: boolean;
  quoteUnitCandidatesPossible: boolean;
  sourceDocumentReady: boolean;
  sourceSectionCandidatesReady: boolean;
  teachingUnitCandidatesPossible: boolean;
  writingAngleCandidatesPossible: boolean;
}

export interface DeepIntakeCandidateSummary {
  caseUnits: number;
  chunks: number;
  evidenceUnits: number;
  knowledgeUnits: number;
  quoteUnits: number;
  sourceSections: number;
  teachingUnits: number;
  writingAngles: number;
}

export interface DeepIntakeCandidatePackageTrustProfile {
  chunkingTrust: DeepIntakeCandidatePackageTrust;
  sourceDocumentTrust: DeepIntakeCandidatePackageTrust;
  structureTrust: DeepIntakeCandidatePackageTrust;
  writerInputTrust: DeepIntakeCandidatePackageTrust;
}

export interface DeepIntakeCandidatePackagePreviewInput {
  chunkingPreview: SourceDocumentChunkingPreview;
  fileType?: string | null;
  readinessPreview: SourceDocumentIntakeReadinessPreview;
  structurePreview: SourceDocumentStructurePreview;
}

export interface DeepIntakeCandidatePackagePreview {
  automationLevel: DeepIntakeCandidatePackageAutomationLevel;
  blockers: string[];
  candidateSummary: DeepIntakeCandidateSummary;
  deepIntakeReadinessScore: number;
  estimatedRecordRange: {
    max: number;
    min: number;
  };
  positiveSignals: string[];
  previewNotice: string;
  recommendedNextAction: string;
  sourceToKnowledgeBoundary: DeepIntakeSourceToKnowledgeBoundary;
  status: DeepIntakeCandidatePackageStatus;
  trustProfile: DeepIntakeCandidatePackageTrustProfile;
  warnings: string[];
}

export const deepIntakeCandidatePackagePreviewNotice =
  "Candidate package preview only — no SourceSection, KnowledgeUnit, or Deep Intake records are created.";

export function createDeepIntakeCandidatePackagePreview(
  input: DeepIntakeCandidatePackagePreviewInput
): DeepIntakeCandidatePackagePreview {
  const readiness = input.readinessPreview;
  const structure = input.structurePreview;
  const chunking = input.chunkingPreview;
  const fileType = (input.fileType ?? "").trim().toUpperCase();
  const blockers = uniqueList([
    ...readiness.blockers,
    ...structure.blockers,
    ...chunking.blockers
  ]);
  const warnings = uniqueList([
    ...readiness.warnings,
    ...structure.warnings,
    ...chunking.warnings
  ]);
  const candidateSummary = summarizeCandidates(structure, chunking);
  const trustProfile = createTrustProfile({ chunking, readiness, structure });

  if (
    readiness.status === "blocked" ||
    chunking.status === "unavailable" && chunking.chunkingMode === "blocked" && blockers.length > 0
  ) {
    return {
      automationLevel: "blocked",
      blockers,
      candidateSummary: emptyCandidateSummary(),
      deepIntakeReadinessScore: 0,
      estimatedRecordRange: { min: 0, max: 0 },
      positiveSignals: [],
      previewNotice: deepIntakeCandidatePackagePreviewNotice,
      recommendedNextAction:
        "Resolve blockers before any Deep Intake candidate package can be trusted.",
      sourceToKnowledgeBoundary: blockedBoundary(),
      status: "blocked",
      trustProfile: {
        ...trustProfile,
        writerInputTrust: "red"
      },
      warnings
    };
  }

  if (fileType === "PDF" || chunking.chunkingMode === "metadata_only") {
    return {
      automationLevel: "review_required",
      blockers: [],
      candidateSummary: {
        ...emptyCandidateSummary(),
        chunks: chunking.estimatedChunkCount,
        writingAngles: candidateSummary.writingAngles
      },
      deepIntakeReadinessScore: scorePackage({
        chunking,
        readiness,
        status: "needs_review",
        structure
      }),
      estimatedRecordRange: {
        min: 0,
        max: Math.min(1, chunking.estimatedKnowledgeRecordRange.max)
      },
      positiveSignals: uniqueList([
        ...readiness.positiveSignals,
        "source_document_metadata_preview_available"
      ]),
      previewNotice: deepIntakeCandidatePackagePreviewNotice,
      recommendedNextAction:
        "PDF extraction is required before Deep Intake can create reliable Source-to-Knowledge candidates.",
      sourceToKnowledgeBoundary: {
        ...blockedBoundary(),
        sourceDocumentReady: true,
        writingAngleCandidatesPossible: candidateSummary.writingAngles > 0
      },
      status: "needs_review",
      trustProfile: {
        ...trustProfile,
        structureTrust: "red",
        chunkingTrust: "orange",
        writerInputTrust: "red"
      },
      warnings: uniqueList([
        ...warnings,
        "pdf_extraction_required_before_deep_intake"
      ])
    };
  }

  if (isStrongDocxCandidate(readiness, structure, chunking)) {
    return {
      automationLevel: "auto_candidate",
      blockers: [],
      candidateSummary,
      deepIntakeReadinessScore: scorePackage({
        chunking,
        readiness,
        status: "ready",
        structure
      }),
      estimatedRecordRange: chunking.estimatedKnowledgeRecordRange,
      positiveSignals: uniqueList([
        ...readiness.positiveSignals,
        ...structure.positiveSignals,
        ...chunking.positiveSignals,
        "deep_intake_candidate_package_ready"
      ]),
      previewNotice: deepIntakeCandidatePackagePreviewNotice,
      recommendedNextAction:
        "Review the candidate package, then design the Source-to-Knowledge schema before any Deep Intake records are created.",
      sourceToKnowledgeBoundary: createBoundary(candidateSummary, {
        sourceDocumentReady: true,
        sourceSectionCandidatesReady: true
      }),
      status: "ready",
      trustProfile,
      warnings
    };
  }

  return {
    automationLevel: "review_required",
    blockers: [],
    candidateSummary,
    deepIntakeReadinessScore: scorePackage({
      chunking,
      readiness,
      status: "needs_review",
      structure
    }),
    estimatedRecordRange: chunking.estimatedKnowledgeRecordRange,
    positiveSignals: uniqueList([
      ...readiness.positiveSignals,
      ...structure.positiveSignals,
      ...chunking.positiveSignals
    ]),
    previewNotice: deepIntakeCandidatePackagePreviewNotice,
    recommendedNextAction:
      "Review weak structure or paragraph-based chunks before Deep Intake automation is considered.",
    sourceToKnowledgeBoundary: createBoundary(candidateSummary, {
      forceEvidencePossible:
        chunking.chunkingMode === "paragraph_based" && chunking.estimatedChunkCount > 0,
      sourceDocumentReady: true,
      sourceSectionCandidatesReady: structure.status === "available"
    }),
    status: "needs_review",
    trustProfile: {
      ...trustProfile,
      writerInputTrust: "orange"
    },
    warnings: uniqueList([
      ...warnings,
      "deep_intake_candidate_package_requires_review"
    ])
  };
}

function isStrongDocxCandidate(
  readiness: SourceDocumentIntakeReadinessPreview,
  structure: SourceDocumentStructurePreview,
  chunking: SourceDocumentChunkingPreview
): boolean {
  return (
    readiness.status === "ready" &&
    structure.status === "available" &&
    (structure.structureConfidence === "high" || structure.structureConfidence === "medium") &&
    chunking.status === "available" &&
    chunking.chunkingMode === "section_based" &&
    chunking.estimatedChunkCount > 0
  );
}

function summarizeCandidates(
  structure: SourceDocumentStructurePreview,
  chunking: SourceDocumentChunkingPreview
): DeepIntakeCandidateSummary {
  const records = chunking.chunkCandidates.reduce(
    (summary, candidate) => addRecordCounts(summary, candidate.estimatedRecords),
    emptyRecordCounts()
  );

  return {
    caseUnits: records.caseUnits,
    chunks: chunking.estimatedChunkCount,
    evidenceUnits:
      chunking.chunkingMode === "paragraph_based" && chunking.estimatedChunkCount > 0
        ? Math.max(1, records.evidenceUnits)
        : records.evidenceUnits,
    knowledgeUnits: records.knowledgeUnits,
    quoteUnits: records.quoteUnits,
    sourceSections: structure.sectionCount,
    teachingUnits: records.teachingUnits,
    writingAngles: records.writingAngles
  };
}

function addRecordCounts(
  current: SourceDocumentEstimatedRecordCounts,
  next: SourceDocumentEstimatedRecordCounts
): SourceDocumentEstimatedRecordCounts {
  return {
    caseUnits: current.caseUnits + next.caseUnits,
    evidenceUnits: current.evidenceUnits + next.evidenceUnits,
    knowledgeUnits: current.knowledgeUnits + next.knowledgeUnits,
    quoteUnits: current.quoteUnits + next.quoteUnits,
    teachingUnits: current.teachingUnits + next.teachingUnits,
    writingAngles: current.writingAngles + next.writingAngles
  };
}

function createBoundary(
  summary: DeepIntakeCandidateSummary,
  options: {
    forceEvidencePossible?: boolean;
    sourceDocumentReady: boolean;
    sourceSectionCandidatesReady: boolean;
  }
): DeepIntakeSourceToKnowledgeBoundary {
  return {
    caseUnitCandidatesPossible: summary.caseUnits > 0,
    evidenceUnitCandidatesPossible:
      summary.evidenceUnits > 0 || Boolean(options.forceEvidencePossible),
    knowledgeUnitCandidatesPossible: summary.knowledgeUnits > 0,
    quoteUnitCandidatesPossible: summary.quoteUnits > 0,
    sourceDocumentReady: options.sourceDocumentReady,
    sourceSectionCandidatesReady: options.sourceSectionCandidatesReady,
    teachingUnitCandidatesPossible: summary.teachingUnits > 0,
    writingAngleCandidatesPossible: summary.writingAngles > 0
  };
}

function createTrustProfile({
  chunking,
  readiness,
  structure
}: {
  chunking: SourceDocumentChunkingPreview;
  readiness: SourceDocumentIntakeReadinessPreview;
  structure: SourceDocumentStructurePreview;
}): DeepIntakeCandidatePackageTrustProfile {
  const sourceDocumentTrust = readinessTrust(readiness.status);
  const structureTrust = availabilityTrust(structure.status);
  const chunkingTrust = availabilityTrust(chunking.status);

  return {
    chunkingTrust,
    sourceDocumentTrust,
    structureTrust,
    writerInputTrust: combineTrust([
      sourceDocumentTrust,
      structureTrust,
      chunkingTrust
    ])
  };
}

function readinessTrust(
  status: SourceDocumentIntakeReadinessPreview["status"]
): DeepIntakeCandidatePackageTrust {
  if (status === "blocked") {
    return "red";
  }

  if (status === "needs_review") {
    return "orange";
  }

  return "green";
}

function availabilityTrust(
  status: SourceDocumentStructurePreview["status"] | SourceDocumentChunkingPreview["status"]
): DeepIntakeCandidatePackageTrust {
  if (status === "unavailable") {
    return "red";
  }

  if (status === "limited") {
    return "orange";
  }

  return "green";
}

function combineTrust(
  values: DeepIntakeCandidatePackageTrust[]
): DeepIntakeCandidatePackageTrust {
  if (values.includes("red")) {
    return "red";
  }

  if (values.includes("orange")) {
    return "orange";
  }

  return "green";
}

function scorePackage({
  chunking,
  readiness,
  status,
  structure
}: {
  chunking: SourceDocumentChunkingPreview;
  readiness: SourceDocumentIntakeReadinessPreview;
  status: DeepIntakeCandidatePackageStatus;
  structure: SourceDocumentStructurePreview;
}): number {
  if (status === "blocked") {
    return 0;
  }

  let score = readiness.score;

  if (structure.status === "unavailable") {
    score -= 30;
  } else if (structure.status === "limited") {
    score -= 18;
  }

  if (structure.structureConfidence === "low") {
    score -= 8;
  }

  if (chunking.status === "unavailable") {
    score -= 25;
  } else if (chunking.status === "limited") {
    score -= 15;
  }

  if (chunking.chunkingMode === "metadata_only") {
    score -= 18;
  }

  if (chunking.chunkingMode === "paragraph_based") {
    score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function emptyCandidateSummary(): DeepIntakeCandidateSummary {
  return {
    caseUnits: 0,
    chunks: 0,
    evidenceUnits: 0,
    knowledgeUnits: 0,
    quoteUnits: 0,
    sourceSections: 0,
    teachingUnits: 0,
    writingAngles: 0
  };
}

function emptyRecordCounts(): SourceDocumentEstimatedRecordCounts {
  return {
    caseUnits: 0,
    evidenceUnits: 0,
    knowledgeUnits: 0,
    quoteUnits: 0,
    teachingUnits: 0,
    writingAngles: 0
  };
}

function blockedBoundary(): DeepIntakeSourceToKnowledgeBoundary {
  return {
    caseUnitCandidatesPossible: false,
    evidenceUnitCandidatesPossible: false,
    knowledgeUnitCandidatesPossible: false,
    quoteUnitCandidatesPossible: false,
    sourceDocumentReady: false,
    sourceSectionCandidatesReady: false,
    teachingUnitCandidatesPossible: false,
    writingAngleCandidatesPossible: false
  };
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
