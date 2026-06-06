import type {
  SaveContentChunkCandidate,
  SaveSourceSectionCandidate,
  SaveSourceSectionContentChunkCandidatesRequest
} from "../persistence/LocalVaultDatabase";
import type {
  DeepIntakeCandidatePackagePreview
} from "./DeepIntakeCandidatePackagePreviewMapper";
import type {
  SourceDocumentChunkCandidatePreview,
  SourceDocumentChunkingPreview
} from "./SourceDocumentChunkingPreviewMapper";
import type {
  SourceDocumentLanguageProfile,
  SourceDocumentStructurePreview,
  SourceSectionCandidatePreview
} from "./SourceDocumentStructurePreviewMapper";

export type SourceSectionContentChunkSaveCandidateStatus =
  | "ready"
  | "blocked";

export interface SourceSectionContentChunkSaveCandidateMappingInput {
  chunkingPreview: SourceDocumentChunkingPreview;
  deepIntakePackage: DeepIntakeCandidatePackagePreview;
  extractionRunId?: string | null;
  sourceDocumentId?: string | null;
  structurePreview: SourceDocumentStructurePreview;
}

export interface SourceSectionContentChunkSaveCandidateMapping {
  blockers: string[];
  chunkCount: number;
  chunks: SaveContentChunkCandidate[];
  recommendedNextAction: string;
  sectionCount: number;
  sections: SaveSourceSectionCandidate[];
  sourceDocumentId: string | null;
  status: SourceSectionContentChunkSaveCandidateStatus;
  trustSummary: {
    chunkingTrust: string;
    sourceDocumentTrust: string;
    structureTrust: string;
    writerInputTrust: string;
  };
  warnings: string[];
}

export function createSourceSectionContentChunkSaveCandidateMapping(
  input: SourceSectionContentChunkSaveCandidateMappingInput
): SourceSectionContentChunkSaveCandidateMapping {
  const sourceDocumentId = input.sourceDocumentId?.trim() || null;
  const blockers = uniqueList([
    ...input.structurePreview.blockers,
    ...input.chunkingPreview.blockers,
    ...input.deepIntakePackage.blockers
  ]);
  const warnings = uniqueList([
    ...input.structurePreview.warnings,
    ...input.chunkingPreview.warnings,
    ...input.deepIntakePackage.warnings
  ]);

  if (!sourceDocumentId) {
    return blockedMapping(input, null, blockers, warnings, [
      "sourceDocumentId is required before SourceSection/ContentChunk save."
    ]);
  }

  if (input.deepIntakePackage.status === "blocked") {
    return blockedMapping(input, sourceDocumentId, blockers, warnings, [
      "Deep Intake candidate package is blocked."
    ]);
  }

  if (
    input.chunkingPreview.chunkingMode === "metadata_only" ||
    input.chunkingPreview.status === "unavailable"
  ) {
    return blockedMapping(input, sourceDocumentId, blockers, warnings, [
      "Valid text-backed SourceSection and ContentChunk candidates are required before save."
    ]);
  }

  const sectionIdByPreviewId = new Map<string, string>();
  const sections = input.structurePreview.sourceSectionCandidates.map((section) => {
    const id = createSourceSectionId(sourceDocumentId, section);
    sectionIdByPreviewId.set(section.id, id);
    return mapSectionCandidate({
      extractionRunId: input.extractionRunId,
      languageProfile: input.structurePreview.detectedLanguageProfile,
      section,
      sourceDocumentId,
      trustState: input.deepIntakePackage.trustProfile.structureTrust,
      warnings
    });
  });

  const chunks = input.chunkingPreview.chunkCandidates.flatMap((chunk) => {
    const sourceSectionId = chunk.sourceSectionId
      ? sectionIdByPreviewId.get(chunk.sourceSectionId)
      : null;

    if (!sourceSectionId) {
      return [];
    }

    return [
      mapChunkCandidate({
        chunk,
        extractionRunId: input.extractionRunId,
        languageProfile: input.chunkingPreview.languageProfile,
        sourceDocumentId,
        sourceSectionId,
        trustState: input.deepIntakePackage.trustProfile.chunkingTrust,
        warnings
      })
    ];
  });

  if (sections.length === 0 || chunks.length === 0) {
    return blockedMapping(input, sourceDocumentId, blockers, warnings, [
      "At least one valid SourceSection and ContentChunk candidate is required before save."
    ]);
  }

  return {
    blockers,
    chunkCount: chunks.length,
    chunks,
    recommendedNextAction:
      "Review the candidate package, then click Save SourceSection + ContentChunk if this SourceDocument boundary is correct.",
    sectionCount: sections.length,
    sections,
    sourceDocumentId,
    status: blockers.length > 0 ? "blocked" : "ready",
    trustSummary: input.deepIntakePackage.trustProfile,
    warnings
  };
}

export function createSourceSectionContentChunkSaveRequest(
  mapping: SourceSectionContentChunkSaveCandidateMapping,
  options: {
    explicitUserApproval: true;
    extractionRunId?: string | null;
    reviewerConfirmed: true;
  }
): SaveSourceSectionContentChunkCandidatesRequest {
  if (!mapping.sourceDocumentId) {
    throw new Error("sourceDocumentId is required before save.");
  }

  return {
    chunks: mapping.chunks,
    explicitUserApproval: options.explicitUserApproval,
    extractionRunId: options.extractionRunId ?? null,
    reviewerConfirmed: options.reviewerConfirmed,
    sections: mapping.sections,
    sourceDocumentId: mapping.sourceDocumentId
  };
}

function mapSectionCandidate(input: {
  extractionRunId?: string | null;
  languageProfile: SourceDocumentLanguageProfile;
  section: SourceSectionCandidatePreview;
  sourceDocumentId: string;
  trustState: string;
  warnings: string[];
}): SaveSourceSectionCandidate {
  const sectionWarnings = uniqueList([...input.section.warnings, ...input.warnings]);

  return {
    blockerJson: "[]",
    characterEnd: input.section.endOffset ?? null,
    characterStart: input.section.startOffset ?? null,
    extractionMethod: "preview",
    extractionRunId: input.extractionRunId ?? null,
    headingLevel: input.section.level,
    id: createSourceSectionId(input.sourceDocumentId, input.section),
    languageProfile: normalizeLanguageProfile(input.languageProfile),
    pageNumber: null,
    pageNumberTrusted: 0,
    paragraphEndIndex: null,
    paragraphStartIndex: null,
    parentSectionId: null,
    reviewStatus: "needs_review",
    sectionOrder: input.section.order,
    sourceLocationType: "docx_text_preview",
    title: input.section.title,
    traceLabel: input.section.traceLabel,
    trustState: normalizeTrustState(input.trustState),
    warningJson: JSON.stringify(sectionWarnings)
  };
}

function mapChunkCandidate(input: {
  chunk: SourceDocumentChunkCandidatePreview;
  extractionRunId?: string | null;
  languageProfile: SourceDocumentLanguageProfile;
  sourceDocumentId: string;
  sourceSectionId: string;
  trustState: string;
  warnings: string[];
}): SaveContentChunkCandidate {
  const chunkWarnings = uniqueList([...input.chunk.warnings, ...input.warnings]);
  const previewText = input.chunk.previewText ?? null;

  return {
    blockerJson: "[]",
    characterEnd: null,
    characterStart: null,
    chunkOrder: input.chunk.order,
    chunkType: input.chunk.chunkType,
    chunkingConfidence: input.chunk.confidence,
    extractionMethod: "preview",
    extractionRunId: input.extractionRunId ?? null,
    id: createContentChunkId(input.sourceDocumentId, input.chunk),
    languageProfile: normalizeLanguageProfile(input.languageProfile),
    pageNumber: null,
    pageNumberTrusted: 0,
    paragraphEndIndex: null,
    paragraphStartIndex: null,
    previewText,
    readinessScore: null,
    reviewStatus: "needs_review",
    sourceLocationType: "docx_text_preview",
    sourceSectionId: input.sourceSectionId,
    textLength: previewText?.length ?? 0,
    title: input.chunk.title,
    traceLabel: input.chunk.traceLabel,
    trustState: normalizeTrustState(input.trustState),
    warningJson: JSON.stringify(chunkWarnings)
  };
}

function blockedMapping(
  input: SourceSectionContentChunkSaveCandidateMappingInput,
  sourceDocumentId: string | null,
  blockers: string[],
  warnings: string[],
  extraBlockers: string[]
): SourceSectionContentChunkSaveCandidateMapping {
  return {
    blockers: uniqueList([...blockers, ...extraBlockers]),
    chunkCount: 0,
    chunks: [],
    recommendedNextAction:
      "Resolve blockers before manually saving SourceSection and ContentChunk records.",
    sectionCount: 0,
    sections: [],
    sourceDocumentId,
    status: "blocked",
    trustSummary: input.deepIntakePackage.trustProfile,
    warnings
  };
}

function createSourceSectionId(
  sourceDocumentId: string,
  section: SourceSectionCandidatePreview
): string {
  return stableId("source-section", sourceDocumentId, section.order, section.traceLabel);
}

function createContentChunkId(
  sourceDocumentId: string,
  chunk: SourceDocumentChunkCandidatePreview
): string {
  return stableId("content-chunk", sourceDocumentId, chunk.order, chunk.traceLabel);
}

function stableId(
  prefix: string,
  sourceDocumentId: string,
  order: number,
  traceLabel: string
): string {
  return [
    prefix,
    slugify(sourceDocumentId),
    order,
    slugify(traceLabel),
    simpleHash(`${sourceDocumentId}:${order}:${traceLabel}`)
  ].join("-");
}

function normalizeLanguageProfile(value: string): "thai" | "english" | "mixed" | "unknown" {
  if (value === "thai" || value === "english" || value === "mixed") {
    return value;
  }
  return "unknown";
}

function normalizeTrustState(value: string): "green" | "orange" | "red" {
  if (value === "green" || value === "red") {
    return value;
  }
  return "orange";
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
