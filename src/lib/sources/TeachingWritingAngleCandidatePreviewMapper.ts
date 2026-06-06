import type {
  SaveContentChunkCandidate,
  SavedContentChunkRecord,
  SavedSourceSectionRecord
} from "../persistence/LocalVaultDatabase";
import type {
  EvidenceCaseQuoteCandidatePreview
} from "./EvidenceCaseQuoteCandidatePreviewMapper";
import type {
  KnowledgeUnitCandidatePreview
} from "./KnowledgeUnitCandidatePreviewMapper";
import type {
  SourceSectionContentChunkSaveCandidateMapping
} from "./SourceSectionContentChunkSaveCandidateMapper";

export type TeachingWritingAngleCandidatePreviewStatus =
  | "available"
  | "limited"
  | "unavailable";

export type TeachingWritingAngleCandidateConfidence =
  | "high"
  | "medium"
  | "low"
  | "none";

export type TeachingWritingLanguageProfile =
  | "thai"
  | "english"
  | "mixed"
  | "unknown";

export type TeachingWritingTrustState = "green" | "orange" | "red";

export type TeachingUseType =
  | "classroom_example"
  | "discussion_prompt"
  | "lecture_explanation"
  | "student_activity"
  | "unknown";

export type WritingAngleType =
  | "chapter_angle"
  | "article_angle"
  | "managerial_implication"
  | "research_gap"
  | "plain_language_angle"
  | "unknown";

export interface TeachingWritingAngleCandidatePreviewInput {
  evidenceCaseQuotePreview?: EvidenceCaseQuoteCandidatePreview | null;
  knowledgeUnitPreview?: KnowledgeUnitCandidatePreview | null;
  savedContentChunks?: SavedContentChunkRecord[] | null;
  savedSourceSections?: SavedSourceSectionRecord[] | null;
  sectionChunkSaveCandidate?: SourceSectionContentChunkSaveCandidateMapping | null;
  sourceDocumentId?: string | null;
}

export interface TeachingUnitCandidatePreview {
  blockers: string[];
  confidence: Exclude<TeachingWritingAngleCandidateConfidence, "none">;
  contentChunkId?: string;
  id: string;
  languageProfile: TeachingWritingLanguageProfile;
  previewTeachingNote: string;
  sourceDocumentId?: string;
  sourceSectionId?: string;
  sourceTraceLabel: string;
  teachingUse: TeachingUseType;
  title: string;
  trustState: TeachingWritingTrustState;
  warnings: string[];
}

export interface WritingAngleCandidatePreview {
  angleType: WritingAngleType;
  blockers: string[];
  confidence: Exclude<TeachingWritingAngleCandidateConfidence, "none">;
  contentChunkId?: string;
  id: string;
  languageProfile: TeachingWritingLanguageProfile;
  previewAngle: string;
  sourceDocumentId?: string;
  sourceSectionId?: string;
  sourceTraceLabel: string;
  title: string;
  trustState: TeachingWritingTrustState;
  warnings: string[];
}

export interface TeachingWritingAngleCandidatePreview {
  blockers: string[];
  candidateConfidence: TeachingWritingAngleCandidateConfidence;
  contentChunkCount: number;
  estimatedTeachingUnitCount: number;
  estimatedWritingAngleCount: number;
  languageProfile: TeachingWritingLanguageProfile;
  positiveSignals: string[];
  previewNotice: string;
  recommendedNextAction: string;
  sourceDocumentId?: string;
  status: TeachingWritingAngleCandidatePreviewStatus;
  teachingCandidates: TeachingUnitCandidatePreview[];
  warnings: string[];
  writingAngleCandidates: WritingAngleCandidatePreview[];
}

export const teachingWritingAngleCandidatePreviewNotice =
  "Teaching and writing-angle previews only — no TeachingUnit, WritingAngle, citation, APA, SourceCard, or Writer records are created.";

export function createTeachingWritingAngleCandidatePreview(
  input: TeachingWritingAngleCandidatePreviewInput
): TeachingWritingAngleCandidatePreview {
  const sourceDocumentId =
    input.sourceDocumentId?.trim() ||
    input.evidenceCaseQuotePreview?.sourceDocumentId ||
    input.knowledgeUnitPreview?.sourceDocumentId ||
    input.sectionChunkSaveCandidate?.sourceDocumentId ||
    input.savedContentChunks?.[0]?.sourceDocumentId ||
    input.savedSourceSections?.[0]?.sourceDocumentId ||
    undefined;
  const sectionIndex = createSectionIndex(input);
  const chunks = createChunkInputs(input, sectionIndex);
  const inheritedBlockers = uniqueList([
    ...(input.knowledgeUnitPreview?.blockers ?? []),
    ...(input.evidenceCaseQuotePreview?.blockers ?? []),
    ...(input.sectionChunkSaveCandidate?.blockers ?? [])
  ]);
  const inheritedWarnings = uniqueList([
    ...(input.knowledgeUnitPreview?.warnings ?? []),
    ...(input.evidenceCaseQuotePreview?.warnings ?? []),
    ...(input.sectionChunkSaveCandidate?.warnings ?? [])
  ]);

  if (
    chunks.length === 0 ||
    input.knowledgeUnitPreview?.status === "unavailable" ||
    input.evidenceCaseQuotePreview?.status === "unavailable" ||
    inheritedBlockers.some(isHardBlocker)
  ) {
    return createEmptyPreview({
      blockers:
        chunks.length === 0
          ? ["Text-backed ContentChunks are required before teaching/writing-angle candidate preview."]
          : inheritedBlockers,
      chunkCount: chunks.length,
      sourceDocumentId,
      status: "unavailable",
      warnings: uniqueList([
        ...inheritedWarnings,
        chunks.length === 0 ? "PDF metadata-only or no ContentChunks available." : ""
      ])
    });
  }

  const supportSignals = createSupportSignals(input.evidenceCaseQuotePreview);
  const teachingCandidates = chunks.flatMap((chunk, index) =>
    createTeachingCandidate(chunk, index, sourceDocumentId, supportSignals)
  );
  const writingAngleCandidates = chunks.flatMap((chunk, index) =>
    createWritingAngleCandidate(chunk, index, sourceDocumentId, supportSignals)
  );
  const allCandidates = [...teachingCandidates, ...writingAngleCandidates];
  const usableCandidates = allCandidates.filter(
    (candidate) => candidate.trustState !== "red"
  );
  const blockers = uniqueList([
    ...inheritedBlockers,
    ...allCandidates.flatMap((candidate) => candidate.blockers)
  ]);
  const warnings = uniqueList([
    ...inheritedWarnings,
    ...allCandidates.flatMap((candidate) => candidate.warnings),
    allCandidates.length === 0
      ? "No deterministic teaching or writing-angle cues were found."
      : ""
  ]);
  const status: TeachingWritingAngleCandidatePreviewStatus =
    usableCandidates.length === 0
      ? "unavailable"
      : blockers.length > 0 || warnings.length > 0
        ? "limited"
        : "available";

  return {
    blockers,
    candidateConfidence: createOverallConfidence(allCandidates, status),
    contentChunkCount: chunks.length,
    estimatedTeachingUnitCount: teachingCandidates.filter((candidate) => candidate.trustState !== "red").length,
    estimatedWritingAngleCount: writingAngleCandidates.filter((candidate) => candidate.trustState !== "red").length,
    languageProfile: createLanguageProfile(chunks),
    positiveSignals: createPositiveSignals({
      allCandidates,
      sourceDocumentId,
      status,
      teachingCandidates,
      writingAngleCandidates
    }),
    previewNotice: teachingWritingAngleCandidatePreviewNotice,
    recommendedNextAction: createRecommendedNextAction(status, allCandidates.length),
    sourceDocumentId,
    status,
    teachingCandidates,
    warnings,
    writingAngleCandidates
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

interface SupportSignals {
  caseChunkIds: Set<string>;
  evidenceChunkIds: Set<string>;
}

function createSectionIndex(
  input: TeachingWritingAngleCandidatePreviewInput
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
  input: TeachingWritingAngleCandidatePreviewInput,
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

function createSupportSignals(
  preview?: EvidenceCaseQuoteCandidatePreview | null
): SupportSignals {
  return {
    caseChunkIds: new Set(
      (preview?.caseCandidates ?? [])
        .map((candidate) => candidate.contentChunkId)
        .filter((id): id is string => Boolean(id))
    ),
    evidenceChunkIds: new Set(
      (preview?.evidenceCandidates ?? [])
        .map((candidate) => candidate.contentChunkId)
        .filter((id): id is string => Boolean(id))
    )
  };
}

function createTeachingCandidate(
  chunk: NormalizedChunkInput,
  index: number,
  sourceDocumentId: string | undefined,
  supportSignals: SupportSignals
): TeachingUnitCandidatePreview[] {
  const text = normalizedText(chunk);
  const supportedByCase = Boolean(chunk.contentChunkId && supportSignals.caseChunkIds.has(chunk.contentChunkId));

  if (!hasTeachingCue(text) && !supportedByCase) {
    return [];
  }

  const common = createCommonCandidateState(chunk);
  return [
    {
      ...common,
      id: createCandidateId("teaching-candidate", sourceDocumentId ?? chunk.sourceDocumentId, chunk, index),
      previewTeachingNote: safeTruncate(chunk.previewText ?? "", 180),
      sourceDocumentId: sourceDocumentId ?? chunk.sourceDocumentId,
      teachingUse: detectTeachingUse(text, supportedByCase),
      title: chunk.title?.trim() || chunk.sectionTitle?.trim() || "Teaching candidate"
    }
  ];
}

function createWritingAngleCandidate(
  chunk: NormalizedChunkInput,
  index: number,
  sourceDocumentId: string | undefined,
  supportSignals: SupportSignals
): WritingAngleCandidatePreview[] {
  const text = normalizedText(chunk);
  const supportedByEvidence = Boolean(chunk.contentChunkId && supportSignals.evidenceChunkIds.has(chunk.contentChunkId));
  const supportedByCase = Boolean(chunk.contentChunkId && supportSignals.caseChunkIds.has(chunk.contentChunkId));

  if (!hasWritingAngleCue(text) && !supportedByEvidence && !supportedByCase) {
    return [];
  }

  const common = createCommonCandidateState(chunk);
  return [
    {
      ...common,
      angleType: detectWritingAngleType(text, supportedByEvidence),
      id: createCandidateId("writing-angle-candidate", sourceDocumentId ?? chunk.sourceDocumentId, chunk, index),
      previewAngle: safeTruncate(chunk.previewText ?? "", 180),
      sourceDocumentId: sourceDocumentId ?? chunk.sourceDocumentId,
      title: chunk.title?.trim() || chunk.sectionTitle?.trim() || "Writing angle candidate"
    }
  ];
}

function createCommonCandidateState(chunk: NormalizedChunkInput): {
  blockers: string[];
  confidence: Exclude<TeachingWritingAngleCandidateConfidence, "none">;
  contentChunkId?: string;
  languageProfile: TeachingWritingLanguageProfile;
  sourceSectionId?: string;
  sourceTraceLabel: string;
  trustState: TeachingWritingTrustState;
  warnings: string[];
} {
  const traceLabel = chunk.traceLabel?.trim() ?? "";
  const blockers = uniqueList([
    ...chunk.blockers,
    traceLabel ? "" : "source_trace_label_missing",
    normalizeTrustState(chunk.trustState) === "red" ? "content_chunk_blocked_or_red" : ""
  ]);
  const warnings = uniqueList([
    ...chunk.warnings,
    chunk.previewText?.trim() ? "" : "No preview text available for deterministic teaching/writing-angle preview."
  ]);
  const trustState = createCandidateTrustState({
    blockers,
    chunkTrust: chunk.trustState,
    traceLabel,
    warnings
  });

  return {
    blockers,
    confidence: createCandidateConfidence({
      chunkConfidence: chunk.confidence,
      hasPreviewText: Boolean(chunk.previewText?.trim()),
      traceLabel,
      trustState
    }),
    contentChunkId: chunk.contentChunkId,
    languageProfile: normalizeLanguageProfile(chunk.languageProfile),
    sourceSectionId: chunk.sourceSectionId,
    sourceTraceLabel: traceLabel || "missing trace",
    trustState,
    warnings
  };
}

function hasTeachingCue(value: string): boolean {
  return /example|teaching|classroom|discussion|activity|explain|lecture|students|ตัวอย่าง|อธิบาย|ห้องเรียน|อภิปราย|กิจกรรม|นักศึกษา|การสอน/.test(value);
}

function hasWritingAngleCue(value: string): boolean {
  return /implication|managerial|strategy|trend|challenge|opportunity|gap|future|chapter|article|นัยยะ|ผู้จัดการ|กลยุทธ์|แนวโน้ม|ความท้าทาย|โอกาส|ช่องว่าง|อนาคต|บทความ|บทที่/.test(value);
}

function detectTeachingUse(value: string, supportedByCase: boolean): TeachingUseType {
  if (/activity|กิจกรรม/.test(value)) {
    return "student_activity";
  }

  if (/discussion|อภิปราย/.test(value)) {
    return "discussion_prompt";
  }

  if (/explain|lecture|teaching|อธิบาย|การสอน/.test(value)) {
    return "lecture_explanation";
  }

  if (/example|classroom|students|ตัวอย่าง|ห้องเรียน|นักศึกษา/.test(value) || supportedByCase) {
    return "classroom_example";
  }

  return "unknown";
}

function detectWritingAngleType(value: string, supportedByEvidence: boolean): WritingAngleType {
  if (/managerial|manager|ผู้จัดการ|นัยยะ/.test(value)) {
    return "managerial_implication";
  }

  if (/gap|future|ช่องว่าง|อนาคต/.test(value) || supportedByEvidence) {
    return "research_gap";
  }

  if (/chapter|บทที่/.test(value)) {
    return "chapter_angle";
  }

  if (/article|บทความ/.test(value)) {
    return "article_angle";
  }

  if (/plain|simple|ทั่วไป/.test(value)) {
    return "plain_language_angle";
  }

  return "unknown";
}

function createOverallConfidence(
  candidates: Array<{ confidence: Exclude<TeachingWritingAngleCandidateConfidence, "none"> }>,
  status: TeachingWritingAngleCandidatePreviewStatus
): TeachingWritingAngleCandidateConfidence {
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
): TeachingWritingLanguageProfile {
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
  allCandidates: Array<{ sourceTraceLabel: string }>;
  sourceDocumentId?: string;
  status: TeachingWritingAngleCandidatePreviewStatus;
  teachingCandidates: TeachingUnitCandidatePreview[];
  writingAngleCandidates: WritingAngleCandidatePreview[];
}): string[] {
  return uniqueList([
    input.sourceDocumentId ? "source_document_trace_available" : "",
    input.teachingCandidates.length > 0 ? "teaching_candidate_cues_available" : "",
    input.writingAngleCandidates.length > 0 ? "writing_angle_candidate_cues_available" : "",
    input.allCandidates.some((candidate) => candidate.sourceTraceLabel !== "missing trace")
      ? "source_trace_labels_available"
      : "",
    input.status === "available" ? "deterministic_teaching_writing_preview_available" : ""
  ]);
}

function createRecommendedNextAction(
  status: TeachingWritingAngleCandidatePreviewStatus,
  candidateCount: number
): string {
  if (status === "unavailable") {
    return candidateCount > 0
      ? "Resolve source trace and blocked chunk issues before reviewing teaching or writing-angle candidates."
      : "Prepare text-backed chunks with deterministic teaching or writing-angle cues before previewing these candidates.";
  }

  if (status === "limited") {
    return "Review trace labels, teaching cues, and writing-angle cues before any future TeachingUnit/WritingAngle schema work.";
  }

  return "Review teaching and writing-angle candidates; this remains preview-only and cannot create downstream records.";
}

function createEmptyPreview(input: {
  blockers: string[];
  chunkCount: number;
  sourceDocumentId?: string;
  status: TeachingWritingAngleCandidatePreviewStatus;
  warnings: string[];
}): TeachingWritingAngleCandidatePreview {
  return {
    blockers: uniqueList(input.blockers),
    candidateConfidence: "none",
    contentChunkCount: input.chunkCount,
    estimatedTeachingUnitCount: 0,
    estimatedWritingAngleCount: 0,
    languageProfile: "unknown",
    positiveSignals: input.sourceDocumentId ? ["source_document_trace_available"] : [],
    previewNotice: teachingWritingAngleCandidatePreviewNotice,
    recommendedNextAction: createRecommendedNextAction(input.status, 0),
    sourceDocumentId: input.sourceDocumentId,
    status: input.status,
    teachingCandidates: [],
    warnings: uniqueList(input.warnings),
    writingAngleCandidates: []
  };
}

function createCandidateTrustState(input: {
  blockers: string[];
  chunkTrust?: string | null;
  traceLabel: string;
  warnings: string[];
}): TeachingWritingTrustState {
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
  traceLabel: string;
  trustState: TeachingWritingTrustState;
}): Exclude<TeachingWritingAngleCandidateConfidence, "none"> {
  if (input.trustState === "red" || !input.traceLabel) {
    return "low";
  }

  if (input.chunkConfidence === "high" && input.hasPreviewText) {
    return "high";
  }

  if (input.hasPreviewText) {
    return "medium";
  }

  return "low";
}

function normalizeLanguageProfile(
  value?: string | null
): TeachingWritingLanguageProfile {
  if (value === "thai" || value === "english" || value === "mixed") {
    return value;
  }
  return "unknown";
}

function normalizeTrustState(value?: string | null): TeachingWritingTrustState {
  if (value === "green" || value === "red") {
    return value;
  }
  return "orange";
}

function normalizedText(chunk: NormalizedChunkInput): string {
  return `${chunk.title ?? ""} ${chunk.sectionTitle ?? ""} ${chunk.previewText ?? ""}`.toLowerCase();
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
  prefix: string,
  sourceDocumentId: string | undefined,
  chunk: NormalizedChunkInput,
  index: number
): string {
  return [
    prefix,
    slugify(sourceDocumentId ?? "unsaved-source"),
    index + 1,
    slugify(chunk.contentChunkId ?? chunk.traceLabel ?? chunk.title ?? "chunk"),
    simpleHash(`${prefix}:${sourceDocumentId ?? "missing"}:${chunk.contentChunkId ?? ""}:${chunk.traceLabel ?? ""}:${index}`)
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
