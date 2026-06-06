import type {
  SaveContentChunkCandidate,
  SavedContentChunkRecord,
  SavedSourceSectionRecord
} from "../persistence/LocalVaultDatabase";
import type {
  DeepIntakeRunCandidateBundle
} from "./DeepIntakeRunCandidateBundleMapper";
import type {
  SourceSectionContentChunkSaveCandidateMapping
} from "./SourceSectionContentChunkSaveCandidateMapper";

export type KnowledgeUnitCandidatePreviewStatus =
  | "available"
  | "limited"
  | "unavailable";

export type KnowledgeUnitCandidateConfidence =
  | "high"
  | "medium"
  | "low"
  | "none";

export type KnowledgeUnitCandidateLanguageProfile =
  | "thai"
  | "english"
  | "mixed"
  | "unknown";

export type KnowledgeUnitCandidateUnitType =
  | "concept"
  | "definition"
  | "framework"
  | "theme"
  | "unknown";

export type KnowledgeUnitCandidateTrustState = "green" | "orange" | "red";

export interface KnowledgeUnitCandidatePreviewInput {
  runBundle?: DeepIntakeRunCandidateBundle | null;
  savedContentChunks?: SavedContentChunkRecord[] | null;
  savedSourceSections?: SavedSourceSectionRecord[] | null;
  sectionChunkSaveCandidate?: SourceSectionContentChunkSaveCandidateMapping | null;
  sourceDocumentId?: string | null;
}

export interface KnowledgeUnitCandidatePreviewCandidate {
  blockers: string[];
  confidence: Exclude<KnowledgeUnitCandidateConfidence, "none">;
  contentChunkId?: string;
  id: string;
  languageProfile: KnowledgeUnitCandidateLanguageProfile;
  previewSummary: string;
  sourceDocumentId?: string;
  sourceSectionId?: string;
  sourceTraceLabel: string;
  title: string;
  trustState: KnowledgeUnitCandidateTrustState;
  unitType: KnowledgeUnitCandidateUnitType;
  warnings: string[];
}

export interface KnowledgeUnitCandidatePreview {
  blockers: string[];
  candidateConfidence: KnowledgeUnitCandidateConfidence;
  candidates: KnowledgeUnitCandidatePreviewCandidate[];
  contentChunkCount: number;
  estimatedKnowledgeUnitCount: number;
  languageProfile: KnowledgeUnitCandidateLanguageProfile;
  positiveSignals: string[];
  previewNotice: string;
  recommendedNextAction: string;
  sourceDocumentId?: string;
  sourceSectionCount: number;
  status: KnowledgeUnitCandidatePreviewStatus;
  warnings: string[];
}

export const knowledgeUnitCandidatePreviewNotice =
  "KnowledgeUnit preview only — no KnowledgeUnit, citation, APA, SourceCard, or Writer records are created.";

export function createKnowledgeUnitCandidatePreview(
  input: KnowledgeUnitCandidatePreviewInput
): KnowledgeUnitCandidatePreview {
  const sourceDocumentId =
    input.sourceDocumentId?.trim() ||
    input.runBundle?.sourceDocumentId ||
    input.sectionChunkSaveCandidate?.sourceDocumentId ||
    input.savedContentChunks?.[0]?.sourceDocumentId ||
    input.savedSourceSections?.[0]?.sourceDocumentId ||
    undefined;
  const sectionIndex = createSectionIndex(input);
  const chunkInputs = createChunkInputs(input, sectionIndex);
  const inheritedBlockers = uniqueList([
    ...(input.runBundle?.blockers ?? []),
    ...(input.sectionChunkSaveCandidate?.blockers ?? [])
  ]);
  const inheritedWarnings = uniqueList([
    ...(input.runBundle?.warnings ?? []),
    ...(input.sectionChunkSaveCandidate?.warnings ?? [])
  ]);
  const hardBlocked =
    input.runBundle?.status === "blocked" ||
    input.sectionChunkSaveCandidate?.status === "blocked" ||
    inheritedBlockers.some(isHardBlocker);

  if (hardBlocked) {
    return createEmptyPreview({
      blockers: uniqueList([...inheritedBlockers, "KnowledgeUnit candidates are blocked by current source/chunk blockers."]),
      input,
      sourceDocumentId,
      status: "unavailable",
      warnings: inheritedWarnings
    });
  }

  if (chunkInputs.length === 0) {
    const isMetadataOnly =
      input.runBundle?.runMode === "no_ai_preview" &&
      input.runBundle?.savePlan.chunkCandidateCount === 0;
    return createEmptyPreview({
      blockers: isMetadataOnly
        ? ["Text-backed ContentChunks are required before KnowledgeUnit candidate preview."]
        : [],
      input,
      sourceDocumentId,
      status: "unavailable",
      warnings: uniqueList([
        ...inheritedWarnings,
        isMetadataOnly ? "PDF metadata-only or no ContentChunks available." : "No ContentChunks available."
      ])
    });
  }

  const candidates = chunkInputs.map((chunk, index) =>
    createCandidateFromChunk({
      chunk,
      index,
      sourceDocumentId
    })
  );
  const candidateBlockers = uniqueList(candidates.flatMap((candidate) => candidate.blockers));
  const candidateWarnings = uniqueList(candidates.flatMap((candidate) => candidate.warnings));
  const usableCandidates = candidates.filter((candidate) => candidate.trustState !== "red");
  const status: KnowledgeUnitCandidatePreviewStatus =
    usableCandidates.length === 0
      ? "unavailable"
      : candidateBlockers.length > 0 || inheritedWarnings.length > 0 || candidateWarnings.length > 0
        ? "limited"
        : "available";
  const candidateConfidence = createOverallConfidence(candidates, status);

  return {
    blockers: uniqueList([...inheritedBlockers, ...candidateBlockers]),
    candidateConfidence,
    candidates,
    contentChunkCount: chunkInputs.length,
    estimatedKnowledgeUnitCount: usableCandidates.length,
    languageProfile: createLanguageProfile(chunkInputs),
    positiveSignals: createPositiveSignals({
      candidates,
      sourceDocumentId,
      status
    }),
    previewNotice: knowledgeUnitCandidatePreviewNotice,
    recommendedNextAction: createRecommendedNextAction(status, candidateBlockers),
    sourceDocumentId,
    sourceSectionCount: sectionIndex.size,
    status,
    warnings: uniqueList([...inheritedWarnings, ...candidateWarnings])
  };
}

interface NormalizedChunkInput {
  blockers: string[];
  confidence?: string | null;
  contentChunkId?: string;
  languageProfile?: string | null;
  previewText?: string | null;
  sourceDocumentId?: string;
  sourceSectionId?: string;
  sectionTitle?: string | null;
  title?: string | null;
  traceLabel?: string | null;
  trustState?: string | null;
  warnings: string[];
}

interface SectionIndexValue {
  languageProfile?: string | null;
  title?: string | null;
  traceLabel?: string | null;
}

function createSectionIndex(
  input: KnowledgeUnitCandidatePreviewInput
): Map<string, SectionIndexValue> {
  const index = new Map<string, SectionIndexValue>();

  for (const section of input.sectionChunkSaveCandidate?.sections ?? []) {
    index.set(section.id, {
      languageProfile: section.languageProfile,
      title: section.title,
      traceLabel: section.traceLabel
    });
  }

  for (const section of input.savedSourceSections ?? []) {
    index.set(section.id, {
      languageProfile: section.languageProfile,
      title: section.title,
      traceLabel: section.traceLabel
    });
  }

  return index;
}

function createChunkInputs(
  input: KnowledgeUnitCandidatePreviewInput,
  sectionIndex: Map<string, SectionIndexValue>
): NormalizedChunkInput[] {
  const savedChunks = input.savedContentChunks ?? [];

  if (savedChunks.length > 0) {
    return savedChunks.map((chunk) => normalizeSavedChunk(chunk, sectionIndex));
  }

  return (input.sectionChunkSaveCandidate?.chunks ?? []).map((chunk) =>
    normalizeSaveCandidateChunk(chunk, sectionIndex, input.sourceDocumentId ?? undefined)
  );
}

function normalizeSavedChunk(
  chunk: SavedContentChunkRecord,
  sectionIndex: Map<string, SectionIndexValue>
): NormalizedChunkInput {
  const section = sectionIndex.get(chunk.sourceSectionId);
  return {
    blockers: parseJsonList(chunk.blockerJson),
    confidence: chunk.chunkingConfidence,
    contentChunkId: chunk.id,
    languageProfile: chunk.languageProfile || section?.languageProfile,
    previewText: chunk.previewText,
    sourceDocumentId: chunk.sourceDocumentId,
    sourceSectionId: chunk.sourceSectionId,
    sectionTitle: section?.title,
    title: chunk.title,
    traceLabel: chunk.traceLabel || section?.traceLabel,
    trustState: chunk.trustState,
    warnings: parseJsonList(chunk.warningJson)
  };
}

function normalizeSaveCandidateChunk(
  chunk: SaveContentChunkCandidate,
  sectionIndex: Map<string, SectionIndexValue>,
  fallbackSourceDocumentId?: string
): NormalizedChunkInput {
  const section = sectionIndex.get(chunk.sourceSectionId);
  return {
    blockers: parseJsonList(chunk.blockerJson),
    confidence: chunk.chunkingConfidence,
    contentChunkId: chunk.id,
    languageProfile: chunk.languageProfile || section?.languageProfile,
    previewText: chunk.previewText,
    sourceDocumentId: fallbackSourceDocumentId,
    sourceSectionId: chunk.sourceSectionId,
    sectionTitle: section?.title,
    title: chunk.title,
    traceLabel: chunk.traceLabel || section?.traceLabel,
    trustState: chunk.trustState,
    warnings: parseJsonList(chunk.warningJson)
  };
}

function createCandidateFromChunk(input: {
  chunk: NormalizedChunkInput;
  index: number;
  sourceDocumentId?: string;
}): KnowledgeUnitCandidatePreviewCandidate {
  const text = input.chunk.previewText?.trim() ?? "";
  const titleSource =
    input.chunk.title?.trim() ||
    input.chunk.sectionTitle?.trim() ||
    safeTruncate(text, 64) ||
    "Untitled KnowledgeUnit candidate";
  const traceLabel = input.chunk.traceLabel?.trim() ?? "";
  const blockers = uniqueList([
    ...input.chunk.blockers,
    traceLabel ? "" : "source_trace_label_missing",
    normalizeTrustState(input.chunk.trustState) === "red" ? "content_chunk_blocked_or_red" : ""
  ]);
  const warnings = uniqueList([
    ...input.chunk.warnings,
    input.chunk.title?.trim() ? "" : "Chunk title missing; using section title or preview text.",
    text ? "" : "No preview text available for deterministic KnowledgeUnit preview."
  ]);
  const trustState = createCandidateTrustState({
    blockers,
    chunkTrust: input.chunk.trustState,
    traceLabel,
    warnings
  });
  const confidence = createCandidateConfidence({
    chunkConfidence: input.chunk.confidence,
    hasPreviewText: text.length > 0,
    hasTitle: Boolean(input.chunk.title?.trim() || input.chunk.sectionTitle?.trim()),
    traceLabel,
    trustState
  });

  return {
    blockers,
    confidence,
    contentChunkId: input.chunk.contentChunkId,
    id: createCandidateId(input.sourceDocumentId ?? input.chunk.sourceDocumentId, input.chunk, input.index),
    languageProfile: normalizeLanguageProfile(input.chunk.languageProfile),
    previewSummary: text ? safeTruncate(text, 160) : "No deterministic preview text available.",
    sourceDocumentId: input.sourceDocumentId ?? input.chunk.sourceDocumentId,
    sourceSectionId: input.chunk.sourceSectionId,
    sourceTraceLabel: traceLabel || "missing trace",
    title: titleSource,
    trustState,
    unitType: detectUnitType(`${titleSource} ${text}`),
    warnings
  };
}

function createOverallConfidence(
  candidates: KnowledgeUnitCandidatePreviewCandidate[],
  status: KnowledgeUnitCandidatePreviewStatus
): KnowledgeUnitCandidateConfidence {
  if (status === "unavailable" || candidates.length === 0) {
    return "none";
  }

  if (candidates.every((candidate) => candidate.confidence === "high")) {
    return "high";
  }

  if (candidates.some((candidate) => candidate.confidence === "medium")) {
    return "medium";
  }

  return "low";
}

function createLanguageProfile(
  chunks: NormalizedChunkInput[]
): KnowledgeUnitCandidateLanguageProfile {
  const values = new Set(
    chunks.map((chunk) => normalizeLanguageProfile(chunk.languageProfile))
      .filter((value) => value !== "unknown")
  );

  if (values.has("mixed") || (values.has("thai") && values.has("english"))) {
    return "mixed";
  }

  return [...values][0] ?? "unknown";
}

function createPositiveSignals(input: {
  candidates: KnowledgeUnitCandidatePreviewCandidate[];
  sourceDocumentId?: string;
  status: KnowledgeUnitCandidatePreviewStatus;
}): string[] {
  return uniqueList([
    input.sourceDocumentId ? "source_document_trace_available" : "",
    input.candidates.length > 0 ? "content_chunk_candidates_available" : "",
    input.candidates.some((candidate) => candidate.sourceTraceLabel !== "missing trace")
      ? "source_trace_labels_available"
      : "",
    input.status === "available" ? "deterministic_knowledge_unit_preview_available" : ""
  ]);
}

function createRecommendedNextAction(
  status: KnowledgeUnitCandidatePreviewStatus,
  blockers: string[]
): string {
  if (status === "unavailable") {
    return blockers.length > 0
      ? "Resolve source trace and chunk blockers before previewing KnowledgeUnit candidates."
      : "Save or prepare text-backed ContentChunks before previewing KnowledgeUnit candidates.";
  }

  if (status === "limited") {
    return "Review trace labels, chunk titles, and warning-heavy candidates before any future KnowledgeUnit schema work.";
  }

  return "Review candidate titles and trace labels; this remains preview-only and cannot create KnowledgeUnit records.";
}

function createEmptyPreview(input: {
  blockers: string[];
  input: KnowledgeUnitCandidatePreviewInput;
  sourceDocumentId?: string;
  status: KnowledgeUnitCandidatePreviewStatus;
  warnings: string[];
}): KnowledgeUnitCandidatePreview {
  return {
    blockers: uniqueList(input.blockers),
    candidateConfidence: "none",
    candidates: [],
    contentChunkCount:
      input.input.savedContentChunks?.length ??
      input.input.sectionChunkSaveCandidate?.chunkCount ??
      0,
    estimatedKnowledgeUnitCount: 0,
    languageProfile: "unknown",
    positiveSignals: input.sourceDocumentId ? ["source_document_trace_available"] : [],
    previewNotice: knowledgeUnitCandidatePreviewNotice,
    recommendedNextAction: createRecommendedNextAction(input.status, input.blockers),
    sourceDocumentId: input.sourceDocumentId,
    sourceSectionCount:
      input.input.savedSourceSections?.length ??
      input.input.sectionChunkSaveCandidate?.sectionCount ??
      0,
    status: input.status,
    warnings: uniqueList(input.warnings)
  };
}

function detectUnitType(value: string): KnowledgeUnitCandidateUnitType {
  const normalized = value.toLowerCase();

  if (/definition|meaning|คือ|ความหมาย/.test(normalized)) {
    return "definition";
  }

  if (/framework|model|โมเดล|กรอบแนวคิด/.test(normalized)) {
    return "framework";
  }

  if (/concept|แนวคิด/.test(normalized)) {
    return "concept";
  }

  if (normalized.trim().length > 0) {
    return "theme";
  }

  return "unknown";
}

function createCandidateTrustState(input: {
  blockers: string[];
  chunkTrust?: string | null;
  traceLabel: string;
  warnings: string[];
}): KnowledgeUnitCandidateTrustState {
  if (input.blockers.length > 0 || normalizeTrustState(input.chunkTrust) === "red") {
    return "red";
  }

  if (normalizeTrustState(input.chunkTrust) === "green" && input.traceLabel && input.warnings.length === 0) {
    return "green";
  }

  return "orange";
}

function createCandidateConfidence(input: {
  chunkConfidence?: string | null;
  hasPreviewText: boolean;
  hasTitle: boolean;
  traceLabel: string;
  trustState: KnowledgeUnitCandidateTrustState;
}): Exclude<KnowledgeUnitCandidateConfidence, "none"> {
  if (input.trustState === "red" || !input.traceLabel) {
    return "low";
  }

  if (input.chunkConfidence === "high" && input.hasTitle && input.hasPreviewText) {
    return "high";
  }

  if (input.hasTitle && input.hasPreviewText) {
    return "medium";
  }

  return "low";
}

function normalizeLanguageProfile(
  value?: string | null
): KnowledgeUnitCandidateLanguageProfile {
  if (value === "thai" || value === "english" || value === "mixed") {
    return value;
  }
  return "unknown";
}

function normalizeTrustState(value?: string | null): KnowledgeUnitCandidateTrustState {
  if (value === "green" || value === "red") {
    return value;
  }
  return "orange";
}

function parseJsonList(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [value];
  }
}

function isHardBlocker(blocker: string): boolean {
  return [
    "candidate_blocked",
    "content_chunk_blocked_or_red",
    "duplicate_candidate_detected",
    "empty_file",
    "file_extension_mismatch",
    "source_trace_label_missing",
    "unsupported_file_type",
    "unreadable_file"
  ].includes(blocker);
}

function createCandidateId(
  sourceDocumentId: string | undefined,
  chunk: NormalizedChunkInput,
  index: number
): string {
  return [
    "knowledge-unit-candidate",
    slugify(sourceDocumentId ?? "unsaved-source"),
    index + 1,
    slugify(chunk.contentChunkId ?? chunk.traceLabel ?? chunk.title ?? "chunk"),
    simpleHash(`${sourceDocumentId ?? "missing"}:${chunk.contentChunkId ?? ""}:${chunk.traceLabel ?? ""}:${index}`)
  ].join("-");
}

function safeTruncate(value: string, maxLength: number): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength - 1).trim()}...`
    : trimmed;
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
