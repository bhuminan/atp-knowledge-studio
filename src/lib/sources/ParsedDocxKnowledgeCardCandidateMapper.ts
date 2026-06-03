import type {
  DocumentSegment,
  ExtractionTrace,
  KnowledgeCardSaveCandidate,
  MarketingTagSaveCandidate,
  SaveCandidateTraceReference,
  SaveCandidateValidationStatus
} from "../../types/domain";
import type {
  SavedSourceCardDetail,
  SavedSourceDocumentDetail,
  SavedSourceCardTagRecord
} from "../persistence/LocalVaultDatabase";

export interface ParsedDocxKnowledgeCardCandidateReadiness {
  approvedMarketingTagCount: number;
  blockers: string[];
  candidateCount: number;
  caseCount: number;
  conceptCount: number;
  evidenceCount: number;
  linkedSavedSourceCardId: string;
  linkedSavedSourceDocumentId: string;
  pageNumberWarning: string;
  quoteCount: number;
  traceReadyCount: number;
  validationStatus: SaveCandidateValidationStatus;
  warnings: string[];
  writingAngleCount: number;
}

export interface ParsedDocxKnowledgeCardCandidatePreview {
  candidates: KnowledgeCardSaveCandidate[];
  readiness: ParsedDocxKnowledgeCardCandidateReadiness;
}

type ParsedKnowledgeCardType = KnowledgeCardSaveCandidate["cardType"];

export function mapParsedDocxToKnowledgeCardCandidates({
  approvedMarketingTagCandidates,
  savedMarketingTagLinks,
  savedSourceCard,
  savedSourceDocument,
  segments,
  traces
}: {
  approvedMarketingTagCandidates?: MarketingTagSaveCandidate[];
  savedMarketingTagLinks?: SavedSourceCardTagRecord[];
  savedSourceCard: SavedSourceCardDetail;
  savedSourceDocument: SavedSourceDocumentDetail;
  segments?: DocumentSegment[];
  traces?: ExtractionTrace[];
}): ParsedDocxKnowledgeCardCandidatePreview {
  const sourceCardId = savedSourceCard.sourceCard.sourceCardId;
  const sourceDocumentId = savedSourceDocument.sourceDocument.sourceDocumentId;
  const sourceSegments = segments?.length ? segments : savedSourceDocument.segments;
  const sourceTraces = traces?.length ? traces : savedSourceDocument.traces;
  const traceBySegmentId = new Map(
    sourceTraces
      .filter((trace) => trace.segmentId)
      .map((trace) => [trace.segmentId as string, trace])
  );
  const approvedTags = createApprovedTagLabels({
    approvedMarketingTagCandidates,
    savedMarketingTagLinks
  });
  const candidates = [
    createConceptCandidate({
      approvedTags,
      segment: firstTraceableSegment(sourceSegments, traceBySegmentId),
      sourceCardId,
      sourceDocumentId,
      traceBySegmentId
    }),
    createEvidenceCandidate({
      segment:
        findTraceableSegment(sourceSegments, traceBySegmentId, "evidence") ??
        firstTraceableSegment(sourceSegments, traceBySegmentId),
      sourceCardId,
      sourceDocumentId,
      traceBySegmentId
    }),
    createQuoteCandidate({
      segment:
        findTraceableSegment(sourceSegments, traceBySegmentId, "theory") ??
        firstTraceableSegment(sourceSegments, traceBySegmentId),
      sourceCardId,
      sourceDocumentId,
      traceBySegmentId
    }),
    createCaseCandidate({
      segment: findCaseSignalSegment(sourceSegments, traceBySegmentId),
      sourceCardId,
      sourceDocumentId,
      traceBySegmentId
    }),
    createWritingAngleCandidate({
      approvedTags,
      segment: firstTraceableSegment(sourceSegments, traceBySegmentId),
      sourceCardId,
      sourceDocumentId,
      traceBySegmentId
    })
  ].filter((candidate): candidate is KnowledgeCardSaveCandidate => Boolean(candidate));
  const blockers = createBlockers({
    approvedTagCount: approvedTags.length,
    candidates,
    sourceCardId,
    sourceDocumentId
  });
  const warnings = createWarnings({
    candidates,
    sourceTraces
  });
  const validationStatus: SaveCandidateValidationStatus =
    blockers.length > 0 ? "blocked" : "needs_review";

  return {
    candidates,
    readiness: {
      approvedMarketingTagCount: approvedTags.length,
      blockers,
      candidateCount: candidates.length,
      caseCount: countByType(candidates, "case"),
      conceptCount: countByType(candidates, "concept"),
      evidenceCount: countByType(candidates, "evidence"),
      linkedSavedSourceCardId: sourceCardId,
      linkedSavedSourceDocumentId: sourceDocumentId,
      pageNumberWarning:
        "DOCX page numbers remain untrusted; KnowledgeCards use chunk references only.",
      quoteCount: countByType(candidates, "quote"),
      traceReadyCount: candidates.filter((candidate) => candidate.traceReference)
        .length,
      validationStatus,
      warnings,
      writingAngleCount: countByType(candidates, "writing_angle")
    }
  };
}

function createConceptCandidate({
  approvedTags,
  segment,
  sourceCardId,
  sourceDocumentId,
  traceBySegmentId
}: {
  approvedTags: string[];
  segment: SegmentLike | undefined;
  sourceCardId: string;
  sourceDocumentId: string;
  traceBySegmentId: Map<string, TraceLike>;
}): KnowledgeCardSaveCandidate | null {
  if (!segment) {
    return null;
  }

  const tagLabel = approvedTags[0] ?? "Parsed DOCX concept";

  return createCandidate({
    cardType: "concept",
    contentPreview: trimPreview(segment.content, 220),
    idSuffix: "concept-1",
    sourceCardId,
    sourceDocumentId,
    title: tagLabel,
    trace: traceBySegmentId.get(segment.segmentId)
  });
}

function createEvidenceCandidate({
  segment,
  sourceCardId,
  sourceDocumentId,
  traceBySegmentId
}: {
  segment: SegmentLike | undefined;
  sourceCardId: string;
  sourceDocumentId: string;
  traceBySegmentId: Map<string, TraceLike>;
}): KnowledgeCardSaveCandidate | null {
  if (!segment) {
    return null;
  }

  return createCandidate({
    cardType: "evidence",
    contentPreview: trimPreview(segment.content, 240),
    idSuffix: "evidence-1",
    sourceCardId,
    sourceDocumentId,
    title: `Evidence from ${segment.title}`,
    trace: traceBySegmentId.get(segment.segmentId)
  });
}

function createQuoteCandidate({
  segment,
  sourceCardId,
  sourceDocumentId,
  traceBySegmentId
}: {
  segment: SegmentLike | undefined;
  sourceCardId: string;
  sourceDocumentId: string;
  traceBySegmentId: Map<string, TraceLike>;
}): KnowledgeCardSaveCandidate | null {
  if (!segment || segment.content.trim().length < 24) {
    return null;
  }

  return createCandidate({
    cardType: "quote",
    contentPreview: trimPreview(segment.content, 180),
    idSuffix: "quote-1",
    sourceCardId,
    sourceDocumentId,
    title: `Traceable quote from ${segment.title}`,
    trace: traceBySegmentId.get(segment.segmentId)
  });
}

function createCaseCandidate({
  segment,
  sourceCardId,
  sourceDocumentId,
  traceBySegmentId
}: {
  segment: SegmentLike | undefined;
  sourceCardId: string;
  sourceDocumentId: string;
  traceBySegmentId: Map<string, TraceLike>;
}): KnowledgeCardSaveCandidate | null {
  if (!segment) {
    return null;
  }

  return createCandidate({
    cardType: "case",
    contentPreview: trimPreview(segment.content, 240),
    idSuffix: "case-1",
    sourceCardId,
    sourceDocumentId,
    title: segment.title,
    trace: traceBySegmentId.get(segment.segmentId)
  });
}

function createWritingAngleCandidate({
  approvedTags,
  segment,
  sourceCardId,
  sourceDocumentId,
  traceBySegmentId
}: {
  approvedTags: string[];
  segment: SegmentLike | undefined;
  sourceCardId: string;
  sourceDocumentId: string;
  traceBySegmentId: Map<string, TraceLike>;
}): KnowledgeCardSaveCandidate | null {
  if (!segment || approvedTags.length === 0) {
    return null;
  }

  return createCandidate({
    cardType: "writing_angle",
    contentPreview: `Use ${approvedTags.slice(0, 3).join(", ")} as a textbook framing angle supported by: ${trimPreview(segment.content, 180)}`,
    idSuffix: "writing-angle-1",
    sourceCardId,
    sourceDocumentId,
    title: `${approvedTags[0]} teaching angle`,
    trace: traceBySegmentId.get(segment.segmentId)
  });
}

function createCandidate({
  cardType,
  contentPreview,
  idSuffix,
  sourceCardId,
  sourceDocumentId,
  title,
  trace
}: {
  cardType: ParsedKnowledgeCardType;
  contentPreview: string;
  idSuffix: string;
  sourceCardId: string;
  sourceDocumentId: string;
  title: string;
  trace: TraceLike | undefined;
}): KnowledgeCardSaveCandidate | null {
  if (!trace?.chunkReference) {
    return null;
  }

  return {
    candidateId: `parsed-docx-knowledge-card-${sourceCardId}-${idSuffix}`,
    cardType,
    citationReadiness: "needs_review",
    contentPreview,
    createdFrom: "knowledge_card_candidate_review_preview",
    derivedFrom: {
      knowledgeCardCandidateId: `parsed-docx-${cardType}-${sourceCardId}-${idSuffix}`,
      sourceCardSaveCandidateId: sourceCardId
    },
    notPersisted: true,
    review: {
      reviewedAt: "preview-only-not-persisted",
      reviewer: "local_mock_user",
      reviewStatus: "needs_review"
    },
    title,
    traceReference: {
      chunkReference: trace.chunkReference,
      pageNumber: null,
      pageNumberTrusted: false,
      segmentId: trace.segmentId ?? undefined,
      sourceDocumentId
    },
    validationStatus: "needs_review"
  };
}

type SegmentLike = {
  content: string;
  segmentId: string;
  segmentType: string;
  title: string;
};

type TraceLike = {
  chunkReference: string;
  segmentId?: string | null;
};

function firstTraceableSegment(
  segments: SegmentLike[],
  traceBySegmentId: Map<string, TraceLike>
): SegmentLike | undefined {
  return segments.find((segment) => traceBySegmentId.has(segment.segmentId));
}

function findTraceableSegment(
  segments: SegmentLike[],
  traceBySegmentId: Map<string, TraceLike>,
  segmentType: string
): SegmentLike | undefined {
  return segments.find(
    (segment) =>
      segment.segmentType === segmentType && traceBySegmentId.has(segment.segmentId)
  );
}

function findCaseSignalSegment(
  segments: SegmentLike[],
  traceBySegmentId: Map<string, TraceLike>
): SegmentLike | undefined {
  return segments.find(
    (segment) =>
      traceBySegmentId.has(segment.segmentId) &&
      (segment.segmentType === "case" ||
        /case|organization|company|bangkok|brand|service counter/i.test(
          `${segment.title} ${segment.content}`
        ))
  );
}

function createApprovedTagLabels({
  approvedMarketingTagCandidates = [],
  savedMarketingTagLinks = []
}: {
  approvedMarketingTagCandidates?: MarketingTagSaveCandidate[];
  savedMarketingTagLinks?: SavedSourceCardTagRecord[];
}): string[] {
  return Array.from(
    new Set([
      ...approvedMarketingTagCandidates
        .filter((tag) => tag.review.reviewStatus === "approved")
        .map((tag) => tag.label),
      ...savedMarketingTagLinks
        .filter((tag) => tag.reviewStatus === "approved")
        .map((tag) => tag.label)
    ])
  );
}

function createBlockers({
  approvedTagCount,
  candidates,
  sourceCardId,
  sourceDocumentId
}: {
  approvedTagCount: number;
  candidates: KnowledgeCardSaveCandidate[];
  sourceCardId: string;
  sourceDocumentId: string;
}): string[] {
  const blockers: string[] = [];

  if (!sourceCardId.trim()) {
    blockers.push("Saved parsed-DOCX SourceCard link is required.");
  }

  if (!sourceDocumentId.trim()) {
    blockers.push("Saved parsed-DOCX SourceDocument link is required.");
  }

  if (approvedTagCount === 0) {
    blockers.push("At least one approved parsed-DOCX MarketingTag is required.");
  }

  if (candidates.length === 0) {
    blockers.push("No traceable parsed-DOCX KnowledgeCard candidates were created.");
  }

  if (candidates.some((candidate) => !candidate.traceReference?.chunkReference)) {
    blockers.push("Every parsed-DOCX KnowledgeCard candidate requires a chunk reference.");
  }

  return blockers;
}

function createWarnings({
  candidates,
  sourceTraces
}: {
  candidates: KnowledgeCardSaveCandidate[];
  sourceTraces: TraceLike[];
}): string[] {
  const warnings = [
    "Candidates only — KnowledgeCards are not auto-saved.",
    "DOCX page numbers are not trusted; chunk references are required.",
    "APA citation is not generated or implied.",
    "Weak or untraceable signals are omitted."
  ];

  if (candidates.length < 5) {
    warnings.push("Fewer than five candidate types were created because signals were limited.");
  }

  if (sourceTraces.length === 0) {
    warnings.push("No saved evidence traces were available.");
  }

  return warnings;
}

function countByType(
  candidates: KnowledgeCardSaveCandidate[],
  cardType: ParsedKnowledgeCardType
): number {
  return candidates.filter((candidate) => candidate.cardType === cardType).length;
}

function trimPreview(text: string, maxLength: number): string {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}
