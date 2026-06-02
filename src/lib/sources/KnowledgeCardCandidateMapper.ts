import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionTrace,
  ExtractionWarning,
  SourceDocument
} from "../../types/domain";

export type KnowledgeCardCandidateStatus = "ready" | "needs_review" | "blocked";

export interface SourceCardCandidateForKnowledgeMapping {
  citationText: string;
  fileReference: string;
  id: string;
  keywords: string[];
  metadataStatus: "ready" | "needs_metadata" | "blocked";
  title: string;
}

export interface ConceptCardCandidate {
  candidateId: string;
  conceptName: string;
  definitionPreview: string;
  sourceCardCandidateId: string;
  status: KnowledgeCardCandidateStatus;
  traceReference: string;
}

export interface EvidenceCardCandidate {
  candidateId: string;
  claimPreview: string;
  evidenceText: string;
  sourceCardCandidateId: string;
  status: KnowledgeCardCandidateStatus;
  traceReference: string;
}

export interface QuoteCardCandidate {
  candidateId: string;
  quoteText: string;
  sourceCardCandidateId: string;
  status: KnowledgeCardCandidateStatus;
  traceReference: string;
}

export interface CaseCardCandidate {
  candidateId: string;
  caseTitle: string;
  caseSummary: string;
  sourceCardCandidateId: string;
  status: KnowledgeCardCandidateStatus;
  traceReference: string;
}

export interface WritingAngleCardCandidate {
  angleTitle: string;
  candidateId: string;
  sourceCardCandidateId: string;
  status: KnowledgeCardCandidateStatus;
  teachingUse: string;
  traceReference: string;
}

export interface KnowledgeCardCandidateReadinessSummary {
  blockerCount: number;
  candidateCount: number;
  previewStatus: KnowledgeCardCandidateStatus;
  traceReadyCount: number;
  warningCount: number;
}

export interface KnowledgeCardCandidateMappingResult {
  caseCardCandidates: CaseCardCandidate[];
  conceptCardCandidates: ConceptCardCandidate[];
  evidenceCardCandidates: EvidenceCardCandidate[];
  quoteCardCandidates: QuoteCardCandidate[];
  readinessSummary: KnowledgeCardCandidateReadinessSummary;
  warnings: string[];
  writingAngleCardCandidates: WritingAngleCardCandidate[];
}

export interface KnowledgeCardCandidateMappingInput {
  extraction: DocumentTextExtraction;
  parserWarnings: ExtractionWarning[];
  readinessWarnings: ExtractionWarning[];
  segments: DocumentSegment[];
  sourceCardCandidate: SourceCardCandidateForKnowledgeMapping;
  sourceDocumentCandidate: Partial<SourceDocument>;
  traces: ExtractionTrace[];
}

export function mapKnowledgeCardCandidates({
  extraction,
  parserWarnings,
  readinessWarnings,
  segments,
  sourceCardCandidate,
  sourceDocumentCandidate,
  traces
}: KnowledgeCardCandidateMappingInput): KnowledgeCardCandidateMappingResult {
  const traceBySegmentId = new Map(traces.map((trace) => [trace.segmentId, trace]));
  const firstSegment = segments[0];
  const evidenceSegment = findSegment(segments, "evidence") ?? firstSegment;
  const quoteSegment = findSegment(segments, "theory") ?? firstSegment;
  const caseSegment = findSegment(segments, "case") ?? firstSegment;
  const conceptName = inferConceptName(sourceDocumentCandidate, sourceCardCandidate);
  const warnings = createKnowledgeCardWarnings({
    extraction,
    parserWarnings,
    readinessWarnings,
    segments,
    sourceCardCandidate,
    traces
  });
  const sharedStatus: KnowledgeCardCandidateStatus =
    warnings.some((warning) => warning.includes("blocked")) || !firstSegment
      ? "blocked"
      : warnings.length > 0
        ? "needs_review"
        : "ready";
  const conceptCardCandidates = firstSegment
    ? [
        {
          candidateId: `${sourceCardCandidate.id}-concept-1`,
          conceptName,
          definitionPreview: trimPreview(firstSegment.content, 180),
          sourceCardCandidateId: sourceCardCandidate.id,
          status: sharedStatus,
          traceReference: getTraceReference(traceBySegmentId, firstSegment)
        }
      ]
    : [];
  const evidenceCardCandidates = evidenceSegment
    ? [
        {
          candidateId: `${sourceCardCandidate.id}-evidence-1`,
          claimPreview: `Evidence for ${conceptName}`,
          evidenceText: trimPreview(evidenceSegment.content, 220),
          sourceCardCandidateId: sourceCardCandidate.id,
          status: sharedStatus,
          traceReference: getTraceReference(traceBySegmentId, evidenceSegment)
        }
      ]
    : [];
  const quoteCardCandidates = quoteSegment
    ? [
        {
          candidateId: `${sourceCardCandidate.id}-quote-1`,
          quoteText: trimPreview(quoteSegment.content, 220),
          sourceCardCandidateId: sourceCardCandidate.id,
          status: sharedStatus,
          traceReference: getTraceReference(traceBySegmentId, quoteSegment)
        }
      ]
    : [];
  const caseCardCandidates = caseSegment
    ? [
        {
          candidateId: `${sourceCardCandidate.id}-case-1`,
          caseSummary: trimPreview(caseSegment.content, 220),
          caseTitle: caseSegment.title,
          sourceCardCandidateId: sourceCardCandidate.id,
          status: sharedStatus,
          traceReference: getTraceReference(traceBySegmentId, caseSegment)
        }
      ]
    : [];
  const writingAngleCardCandidates = firstSegment
    ? [
        {
          angleTitle: `${conceptName} for textbook explanation`,
          candidateId: `${sourceCardCandidate.id}-angle-1`,
          sourceCardCandidateId: sourceCardCandidate.id,
          status: sharedStatus,
          teachingUse:
            "Use this angle to explain the concept, then connect it to evidence and case discussion.",
          traceReference: getTraceReference(traceBySegmentId, firstSegment)
        }
      ]
    : [];
  const candidateCount =
    conceptCardCandidates.length +
    evidenceCardCandidates.length +
    quoteCardCandidates.length +
    caseCardCandidates.length +
    writingAngleCardCandidates.length;
  const traceReadyCount = traces.filter((trace) => trace.chunkReference).length;
  const blockerCount = warnings.filter((warning) => warning.includes("blocked")).length;

  return {
    caseCardCandidates,
    conceptCardCandidates,
    evidenceCardCandidates,
    quoteCardCandidates,
    readinessSummary: {
      blockerCount,
      candidateCount,
      previewStatus: blockerCount > 0 ? "blocked" : warnings.length > 0 ? "needs_review" : "ready",
      traceReadyCount,
      warningCount: warnings.length
    },
    warnings,
    writingAngleCardCandidates
  };
}

function createKnowledgeCardWarnings({
  extraction,
  parserWarnings,
  readinessWarnings,
  segments,
  sourceCardCandidate,
  traces
}: {
  extraction: DocumentTextExtraction;
  parserWarnings: ExtractionWarning[];
  readinessWarnings: ExtractionWarning[];
  segments: DocumentSegment[];
  sourceCardCandidate: SourceCardCandidateForKnowledgeMapping;
  traces: ExtractionTrace[];
}): string[] {
  const warnings = [
    ...parserWarnings.map((warning) => warning.message),
    ...readinessWarnings.map((warning) => warning.message)
  ];

  if (sourceCardCandidate.metadataStatus !== "ready") {
    warnings.push("Source metadata is incomplete; citation readiness needs review.");
  }

  if (segments.length === 0) {
    warnings.push("blocked: No extraction segments are available for card generation.");
  }

  if (traces.length === 0) {
    warnings.push("blocked: No extraction traces are available.");
  }

  if (traces.some((trace) => trace.pageNumber === 0)) {
    warnings.push(
      "DOCX page numbers are not trusted; use chunk references such as docx:pN."
    );
  }

  if (!extraction.cleanedText.trim()) {
    warnings.push("blocked: Cleaned extraction text is missing.");
  }

  return Array.from(new Set(warnings));
}

function findSegment(
  segments: DocumentSegment[],
  segmentType: DocumentSegment["segmentType"]
): DocumentSegment | undefined {
  return segments.find((segment) => segment.segmentType === segmentType);
}

function getTraceReference(
  traceBySegmentId: Map<string, ExtractionTrace>,
  segment: DocumentSegment
): string {
  return traceBySegmentId.get(segment.segmentId)?.chunkReference ?? "trace review required";
}

function inferConceptName(
  sourceDocumentCandidate: Partial<SourceDocument>,
  sourceCardCandidate: SourceCardCandidateForKnowledgeMapping
): string {
  const tagConcept = sourceCardCandidate.keywords.find(Boolean);

  return (
    tagConcept ??
    sourceDocumentCandidate.metadata?.title ??
    sourceDocumentCandidate.title ??
    "Concept review required"
  );
}

function trimPreview(text: string, maxLength: number): string {
  const normalizedText = text.trim().replace(/\s+/g, " ");

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength)}...`;
}
