import type {
  DocumentTextExtraction,
  DraftArtifactSaveCandidate,
  ExtractionTrace,
  KnowledgeCardSaveCandidate,
  MarketingTagSaveCandidate,
  PersistenceSaveCandidateBundle,
  SaveCandidateBlocker,
  SaveCandidateReviewSnapshot,
  SaveCandidateTraceReference,
  SaveCandidateValidationStatus,
  SaveCandidateWarning,
  SourceCardSaveCandidate,
  SourceDocument,
  SourceDocumentSaveCandidate
} from "../../types/domain";
import type {
  DraftInputKnowledgeCard,
  DraftInputPackagePreview,
  DraftInputSourceCard
} from "./DraftInputPackageMapper";
import type { DraftQualityReviewPreview } from "./DraftQualityReviewMapper";
import type { DraftSectionMockPreview } from "./DraftSectionMockComposer";
import type { PipelineReadinessSummaryPreview } from "./PipelineReadinessMapper";
import type { SourceToDraftMockPreview } from "./SourceToDraftMockMapper";

export interface PersistenceSaveCandidateMappingInput {
  approvedKnowledgeCards: DraftInputKnowledgeCard[];
  approvedMarketingTags: string[];
  draftInputPackage: DraftInputPackagePreview;
  draftQualityReview: DraftQualityReviewPreview;
  draftSectionMockPreview: DraftSectionMockPreview;
  extraction: DocumentTextExtraction;
  pipelineReadinessSummary: PipelineReadinessSummaryPreview;
  sourceCardCandidate: DraftInputSourceCard;
  sourceDocumentCandidate: Partial<SourceDocument>;
  sourceDocumentReviewStatus?: SaveCandidateReviewSnapshot["reviewStatus"];
  sourceToDraftPreview: SourceToDraftMockPreview;
  traces: ExtractionTrace[];
}

const localReviewSnapshot: SaveCandidateReviewSnapshot = {
  reviewedAt: "preview-only-not-persisted",
  reviewer: "local_mock_user",
  reviewStatus: "mock_preview"
};

export function mapPersistenceSaveCandidateBundle({
  approvedKnowledgeCards,
  approvedMarketingTags,
  draftInputPackage,
  draftQualityReview,
  draftSectionMockPreview,
  extraction,
  pipelineReadinessSummary,
  sourceCardCandidate,
  sourceDocumentCandidate,
  sourceDocumentReviewStatus = "mock_preview",
  sourceToDraftPreview,
  traces
}: PersistenceSaveCandidateMappingInput): PersistenceSaveCandidateBundle {
  const sourceDocumentSaveCandidate = createSourceDocumentSaveCandidate({
    extraction,
    sourceDocumentCandidate,
    sourceDocumentReviewStatus,
    traces
  });
  const sourceCardSaveCandidate = createSourceCardSaveCandidate({
    sourceCardCandidate,
    sourceDocumentSaveCandidate
  });
  const marketingTagCandidates = approvedMarketingTags.map((tag) =>
    createMarketingTagSaveCandidate(tag, sourceCardSaveCandidate)
  );
  const knowledgeCardCandidates = approvedKnowledgeCards.map((card) =>
    createKnowledgeCardSaveCandidate({
      card,
      sourceCardSaveCandidate,
      traces
    })
  );
  const draftArtifactCandidate = createDraftArtifactSaveCandidate({
    draftInputPackage,
    draftQualityReview,
    draftSectionMockPreview,
    sourceToDraftPreview
  });
  const blockers = createBundleBlockers({
    draftArtifactCandidate,
    knowledgeCardCandidates,
    pipelineReadinessSummary,
    sourceCardSaveCandidate,
    sourceDocumentSaveCandidate
  });
  const warnings = createBundleWarnings({
    draftArtifactCandidate,
    draftQualityReview,
    knowledgeCardCandidates,
    marketingTagCandidates,
    pipelineReadinessSummary,
    sourceCardSaveCandidate,
    sourceDocumentSaveCandidate
  });

  return {
    blockers,
    bundleId: `save-candidate-bundle-${pipelineReadinessSummary.pipelineReadinessId}`,
    createdFrom: "source_library_pipeline_preview",
    draftArtifactCandidate,
    knowledgeCardCandidates,
    marketingTagCandidates,
    notPersisted: true,
    pipelineReadinessId: pipelineReadinessSummary.pipelineReadinessId,
    sourceCardCandidate: sourceCardSaveCandidate,
    sourceDocumentCandidate: sourceDocumentSaveCandidate,
    validationStatus: getBundleValidationStatus({
      blockers,
      candidates: [
        sourceDocumentSaveCandidate,
        sourceCardSaveCandidate,
        draftArtifactCandidate,
        ...marketingTagCandidates,
        ...knowledgeCardCandidates
      ],
      warnings
    }),
    warnings
  };
}

function createSourceDocumentSaveCandidate({
  extraction,
  sourceDocumentCandidate,
  sourceDocumentReviewStatus,
  traces
}: {
  extraction: DocumentTextExtraction;
  sourceDocumentCandidate: Partial<SourceDocument>;
  sourceDocumentReviewStatus: SaveCandidateReviewSnapshot["reviewStatus"];
  traces: ExtractionTrace[];
}): SourceDocumentSaveCandidate {
  const sourceDocumentCandidateId =
    sourceDocumentCandidate.id ?? `candidate-document-${extraction.documentId}`;
  const metadata = sourceDocumentCandidate.metadata ?? {
    completeness: "missing",
    title: sourceDocumentCandidate.title ?? "Title metadata required"
  };
  const traceReferences = traces.map(traceToSaveReference);
  const hasTraceReferences = traceReferences.length > 0;
  const validationStatus: SaveCandidateValidationStatus =
    extraction.extractionStatus === "failed"
      ? "blocked"
      : metadata.completeness === "complete" && hasTraceReferences
        ? "ready"
        : "needs_review";

  return {
    candidateId: `save-candidate-${sourceDocumentCandidateId}`,
    createdFrom: "document_extraction_preview",
    derivedFrom: {
      extractionDocumentId: extraction.documentId,
      fileIntakeJobId: extraction.documentId,
      sourceDocumentCandidateId
    },
    fileName: sourceDocumentCandidate.fileName ?? extraction.documentId,
    fileType: sourceDocumentCandidate.fileType ?? "DOCX",
    localPathPolicy: "local_path_reference_only",
    notPersisted: true,
    parserStatus: sourceDocumentCandidate.parserStatus ?? "mock_needs_review",
    provenanceNote:
      "Preview candidate derived from local DOCX extraction; no file copy or persisted source record exists.",
    review: {
      ...localReviewSnapshot,
      reviewStatus: sourceDocumentReviewStatus
    },
    sourceMetadata: metadata,
    title: sourceDocumentCandidate.title ?? metadata.title,
    traceReferences,
    validationStatus
  };
}

function createSourceCardSaveCandidate({
  sourceCardCandidate,
  sourceDocumentSaveCandidate
}: {
  sourceCardCandidate: DraftInputSourceCard;
  sourceDocumentSaveCandidate: SourceDocumentSaveCandidate;
}): SourceCardSaveCandidate {
  const citationReadiness =
    sourceCardCandidate.metadataStatus === "blocked"
      ? "blocked"
      : sourceCardCandidate.metadataStatus === "ready"
        ? "ready"
        : "needs_review";

  return {
    candidateId: `save-candidate-${sourceCardCandidate.id}`,
    citationReadiness,
    citationText: sourceCardCandidate.citationText,
    createdFrom: "source_card_candidate_preview",
    derivedFrom: {
      sourceCardCandidateId: sourceCardCandidate.id,
      sourceDocumentSaveCandidateId: sourceDocumentSaveCandidate.candidateId
    },
    fileReference: sourceCardCandidate.fileReference,
    metadataStatus: sourceCardCandidate.metadataStatus,
    notPersisted: true,
    review: localReviewSnapshot,
    sourceType: sourceCardCandidate.sourceType,
    title: sourceCardCandidate.title,
    validationStatus:
      sourceCardCandidate.metadataStatus === "blocked"
        ? "blocked"
        : sourceCardCandidate.metadataStatus === "ready"
          ? "ready"
          : "needs_review"
  };
}

function createMarketingTagSaveCandidate(
  label: string,
  sourceCardSaveCandidate: SourceCardSaveCandidate
): MarketingTagSaveCandidate {
  return {
    candidateId: `save-candidate-tag-${slugify(label)}`,
    createdFrom: "marketing_tag_review_preview",
    derivedFrom: {
      label,
      sourceCardSaveCandidateId: sourceCardSaveCandidate.candidateId
    },
    label,
    notPersisted: true,
    review: {
      ...localReviewSnapshot,
      reviewStatus: "approved"
    },
    validationStatus: "ready"
  };
}

function createKnowledgeCardSaveCandidate({
  card,
  sourceCardSaveCandidate,
  traces
}: {
  card: DraftInputKnowledgeCard;
  sourceCardSaveCandidate: SourceCardSaveCandidate;
  traces: ExtractionTrace[];
}): KnowledgeCardSaveCandidate {
  const traceReference = findTraceReference(card.traceReference, traces);
  const citationReadiness =
    card.status === "blocked"
      ? "blocked"
      : card.citationNeedsReview || !traceReference
        ? "needs_review"
        : "ready";

  return {
    candidateId: `save-candidate-${card.candidateId}`,
    cardType: card.cardType,
    citationReadiness,
    contentPreview: card.detail,
    createdFrom: "knowledge_card_candidate_review_preview",
    derivedFrom: {
      knowledgeCardCandidateId: card.candidateId,
      sourceCardSaveCandidateId: sourceCardSaveCandidate.candidateId
    },
    notPersisted: true,
    review: {
      ...localReviewSnapshot,
      reviewStatus: "approved"
    },
    title: card.title,
    traceReference,
    validationStatus:
      card.status === "blocked" ? "blocked" : citationReadiness === "ready" ? "ready" : "needs_review"
  };
}

function createDraftArtifactSaveCandidate({
  draftInputPackage,
  draftQualityReview,
  draftSectionMockPreview,
  sourceToDraftPreview
}: {
  draftInputPackage: DraftInputPackagePreview;
  draftQualityReview: DraftQualityReviewPreview;
  draftSectionMockPreview: DraftSectionMockPreview;
  sourceToDraftPreview: SourceToDraftMockPreview;
}): DraftArtifactSaveCandidate {
  return {
    artifactType: "mock_draft_section_preview",
    candidateId: `save-candidate-${draftSectionMockPreview.draftId}`,
    createdFrom: "draft_section_mock_preview",
    derivedFrom: {
      draftInputPackageId: draftInputPackage.packageId,
      draftQualityReviewId: draftQualityReview.reviewId,
      sourceToDraftPreviewId: sourceToDraftPreview.draftPreviewId
    },
    mockOnly: true,
    notFinalDraft: true,
    notPersisted: true,
    review: localReviewSnapshot,
    sectionCount: draftSectionMockPreview.sections.length,
    title: draftSectionMockPreview.draftTitle,
    validationStatus: "needs_review"
  };
}

function createBundleBlockers({
  knowledgeCardCandidates,
  pipelineReadinessSummary,
  sourceCardSaveCandidate,
  sourceDocumentSaveCandidate
}: {
  draftArtifactCandidate: DraftArtifactSaveCandidate;
  knowledgeCardCandidates: KnowledgeCardSaveCandidate[];
  pipelineReadinessSummary: PersistenceSaveCandidateMappingInput["pipelineReadinessSummary"];
  sourceCardSaveCandidate: SourceCardSaveCandidate;
  sourceDocumentSaveCandidate: SourceDocumentSaveCandidate;
}): SaveCandidateBlocker[] {
  const blockers: SaveCandidateBlocker[] = [];

  if (pipelineReadinessSummary.overallStatus === "blocked") {
    blockers.push(
      createBlocker(
        "save-blocker-pipeline",
        "bundle",
        "Pipeline readiness is blocked; save candidates must remain preview-only."
      )
    );
  }

  if (sourceDocumentSaveCandidate.traceReferences.length === 0) {
    blockers.push(
      createBlocker(
        "save-blocker-source-document-traces",
        "source_document",
        "SourceDocument save candidate has no trace references.",
        "traceReferences"
      )
    );
  }

  if (sourceCardSaveCandidate.metadataStatus === "blocked") {
    blockers.push(
      createBlocker(
        "save-blocker-source-card-metadata",
        "source_card",
        "SourceCard metadata is blocked.",
        "metadataStatus"
      )
    );
  }

  if (knowledgeCardCandidates.length === 0) {
    blockers.push(
      createBlocker(
        "save-blocker-knowledge-cards",
        "knowledge_card",
        "No approved Knowledge Card save candidates are available."
      )
    );
  }

  knowledgeCardCandidates
    .filter((candidate) => candidate.validationStatus === "blocked")
    .forEach((candidate) => {
      blockers.push(
        createBlocker(
          `save-blocker-${candidate.candidateId}`,
          "knowledge_card",
          `${candidate.title} is blocked and cannot be included as save-ready.`,
          "validationStatus"
        )
      );
    });

  return blockers;
}

function createBundleWarnings({
  draftArtifactCandidate,
  draftQualityReview,
  knowledgeCardCandidates,
  marketingTagCandidates,
  pipelineReadinessSummary,
  sourceCardSaveCandidate,
  sourceDocumentSaveCandidate
}: {
  draftArtifactCandidate: DraftArtifactSaveCandidate;
  draftQualityReview: DraftQualityReviewPreview;
  knowledgeCardCandidates: KnowledgeCardSaveCandidate[];
  marketingTagCandidates: MarketingTagSaveCandidate[];
  pipelineReadinessSummary: PersistenceSaveCandidateMappingInput["pipelineReadinessSummary"];
  sourceCardSaveCandidate: SourceCardSaveCandidate;
  sourceDocumentSaveCandidate: SourceDocumentSaveCandidate;
}): SaveCandidateWarning[] {
  const warnings: SaveCandidateWarning[] = [
    createWarning(
      "save-warning-preview-only",
      "bundle",
      "Preview only — no data is persisted."
    ),
    createWarning(
      "save-warning-no-storage-boundary",
      "bundle",
      "Future storage boundary is not selected yet."
    )
  ];

  if (sourceDocumentSaveCandidate.sourceMetadata.completeness !== "complete") {
    warnings.push(
      createWarning(
        "save-warning-source-document-metadata",
        "source_document",
        "SourceDocument metadata is incomplete and needs human review before durable persistence.",
        "sourceMetadata"
      )
    );
  }

  if (sourceDocumentSaveCandidate.traceReferences.some((trace) => !trace.pageNumberTrusted)) {
    warnings.push(
      createWarning(
        "save-warning-docx-page-numbers",
        "source_document",
        "DOCX page numbers are not trusted; use chunk references such as docx:pN.",
        "traceReferences"
      )
    );
  }

  if (sourceCardSaveCandidate.metadataStatus !== "ready") {
    warnings.push(
      createWarning(
        "save-warning-source-card-citation",
        "source_card",
        "SourceCard citation metadata is incomplete and cannot be treated as citation-ready.",
        "metadataStatus"
      )
    );
  }

  if (marketingTagCandidates.length === 0) {
    warnings.push(
      createWarning(
        "save-warning-no-tags",
        "marketing_tag",
        "No approved marketing tag save candidates are available."
      )
    );
  }

  knowledgeCardCandidates
    .filter((candidate) => candidate.validationStatus !== "ready")
    .forEach((candidate) => {
      warnings.push(
        createWarning(
          `save-warning-${candidate.candidateId}`,
          "knowledge_card",
          `${candidate.title} requires citation or trace review before durable persistence.`,
          "validationStatus"
        )
      );
    });

  warnings.push(
    createWarning(
      "save-warning-mock-draft-artifact",
      "draft_artifact",
      "Draft artifact candidate is mock_only and not a final draft.",
      "mockOnly"
    )
  );

  if (draftQualityReview.overallReadiness !== "ready") {
    warnings.push(
      createWarning(
        "save-warning-draft-quality",
        "draft_artifact",
        `Draft quality review is ${draftQualityReview.overallReadiness}.`,
        "overallReadiness"
      )
    );
  }

  if (pipelineReadinessSummary.overallStatus !== "ready") {
    warnings.push(
      createWarning(
        "save-warning-pipeline-readiness",
        "bundle",
        `Pipeline readiness is ${pipelineReadinessSummary.overallStatus}.`,
        "overallStatus"
      )
    );
  }

  if (draftArtifactCandidate.validationStatus !== "ready") {
    warnings.push(
      createWarning(
        "save-warning-draft-artifact-status",
        "draft_artifact",
        "Mock draft artifact is not save-ready as a final draft.",
        "validationStatus"
      )
    );
  }

  return dedupeWarnings(warnings);
}

function getBundleValidationStatus({
  blockers,
  candidates,
  warnings
}: {
  blockers: SaveCandidateBlocker[];
  candidates: Array<{ validationStatus: SaveCandidateValidationStatus }>;
  warnings: SaveCandidateWarning[];
}): SaveCandidateValidationStatus {
  if (blockers.length > 0 || candidates.some((candidate) => candidate.validationStatus === "blocked")) {
    return "blocked";
  }

  if (warnings.length > 0 || candidates.some((candidate) => candidate.validationStatus === "needs_review")) {
    return "needs_review";
  }

  return "ready";
}

function traceToSaveReference(trace: ExtractionTrace): SaveCandidateTraceReference {
  return {
    chunkReference: trace.chunkReference,
    pageNumber: trace.pageNumber > 0 ? trace.pageNumber : null,
    pageNumberTrusted: trace.pageNumber > 0,
    segmentId: trace.segmentId,
    sourceDocumentId: trace.sourceDocumentId
  };
}

function findTraceReference(
  chunkReference: string,
  traces: ExtractionTrace[]
): SaveCandidateTraceReference | null {
  const matchingTrace = traces.find((trace) => trace.chunkReference === chunkReference);

  if (matchingTrace) {
    return traceToSaveReference(matchingTrace);
  }

  if (chunkReference.startsWith("docx:")) {
    return {
      chunkReference,
      pageNumber: null,
      pageNumberTrusted: false,
      sourceDocumentId: "source-document-preview"
    };
  }

  return null;
}

function createBlocker(
  blockerId: string,
  objectType: SaveCandidateBlocker["objectType"],
  message: string,
  field?: string
): SaveCandidateBlocker {
  return {
    blockerId,
    field,
    message,
    objectType
  };
}

function createWarning(
  warningId: string,
  objectType: SaveCandidateWarning["objectType"],
  message: string,
  field?: string
): SaveCandidateWarning {
  return {
    field,
    message,
    objectType,
    warningId
  };
}

function dedupeWarnings(warnings: SaveCandidateWarning[]): SaveCandidateWarning[] {
  const seenWarningIds = new Set<string>();

  return warnings.filter((warning) => {
    if (seenWarningIds.has(warning.warningId)) {
      return false;
    }

    seenWarningIds.add(warning.warningId);
    return true;
  });
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
