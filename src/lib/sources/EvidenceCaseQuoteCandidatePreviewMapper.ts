import type {
  SaveContentChunkCandidate,
  SavedContentChunkRecord,
  SavedSourceSectionRecord
} from "../persistence/LocalVaultDatabase";
import type {
  KnowledgeUnitCandidatePreview
} from "./KnowledgeUnitCandidatePreviewMapper";
import type {
  SourceSectionContentChunkSaveCandidateMapping
} from "./SourceSectionContentChunkSaveCandidateMapper";

export type EvidenceCaseQuoteCandidatePreviewStatus =
  | "available"
  | "limited"
  | "unavailable";

export type EvidenceCaseQuoteCandidateConfidence =
  | "high"
  | "medium"
  | "low"
  | "none";

export type EvidenceCaseQuoteLanguageProfile =
  | "thai"
  | "english"
  | "mixed"
  | "unknown";

export type EvidenceCaseQuoteTrustState = "green" | "orange" | "red";

export type EvidenceCandidateType =
  | "research_finding"
  | "statistic"
  | "argument"
  | "general_evidence"
  | "unknown";

export type CaseCandidateType =
  | "company_case"
  | "industry_case"
  | "customer_case"
  | "teaching_example"
  | "unknown";

export type QuoteCandidateType =
  | "definition_quote"
  | "notable_phrase"
  | "direct_quote_candidate"
  | "unknown";

export interface EvidenceCaseQuoteCandidatePreviewInput {
  knowledgeUnitPreview?: KnowledgeUnitCandidatePreview | null;
  savedContentChunks?: SavedContentChunkRecord[] | null;
  savedSourceSections?: SavedSourceSectionRecord[] | null;
  sectionChunkSaveCandidate?: SourceSectionContentChunkSaveCandidateMapping | null;
  sourceDocumentId?: string | null;
}

export interface EvidenceUnitCandidatePreview {
  blockers: string[];
  confidence: Exclude<EvidenceCaseQuoteCandidateConfidence, "none">;
  contentChunkId?: string;
  evidenceType: EvidenceCandidateType;
  id: string;
  languageProfile: EvidenceCaseQuoteLanguageProfile;
  previewClaim: string;
  sourceDocumentId?: string;
  sourceSectionId?: string;
  sourceTraceLabel: string;
  title: string;
  trustState: EvidenceCaseQuoteTrustState;
  warnings: string[];
}

export interface CaseUnitCandidatePreview {
  blockers: string[];
  caseType: CaseCandidateType;
  confidence: Exclude<EvidenceCaseQuoteCandidateConfidence, "none">;
  contentChunkId?: string;
  id: string;
  languageProfile: EvidenceCaseQuoteLanguageProfile;
  previewCase: string;
  sourceDocumentId?: string;
  sourceSectionId?: string;
  sourceTraceLabel: string;
  title: string;
  trustState: EvidenceCaseQuoteTrustState;
  warnings: string[];
}

export interface QuoteUnitCandidatePreview {
  blockers: string[];
  confidence: Exclude<EvidenceCaseQuoteCandidateConfidence, "none">;
  contentChunkId?: string;
  id: string;
  languageProfile: EvidenceCaseQuoteLanguageProfile;
  previewQuote: string;
  quoteType: QuoteCandidateType;
  sourceDocumentId?: string;
  sourceSectionId?: string;
  sourceTraceLabel: string;
  trustState: EvidenceCaseQuoteTrustState;
  warnings: string[];
}

export interface EvidenceCaseQuoteCandidatePreview {
  blockers: string[];
  candidateConfidence: EvidenceCaseQuoteCandidateConfidence;
  caseCandidates: CaseUnitCandidatePreview[];
  contentChunkCount: number;
  estimatedCaseCount: number;
  estimatedEvidenceCount: number;
  estimatedQuoteCount: number;
  evidenceCandidates: EvidenceUnitCandidatePreview[];
  languageProfile: EvidenceCaseQuoteLanguageProfile;
  positiveSignals: string[];
  previewNotice: string;
  quoteCandidates: QuoteUnitCandidatePreview[];
  recommendedNextAction: string;
  sourceDocumentId?: string;
  status: EvidenceCaseQuoteCandidatePreviewStatus;
  warnings: string[];
}

export const evidenceCaseQuoteCandidatePreviewNotice =
  "Evidence, case, and quote previews only — no EvidenceUnit, CaseUnit, QuoteUnit, citation, APA, SourceCard, or Writer records are created.";

export function createEvidenceCaseQuoteCandidatePreview(
  input: EvidenceCaseQuoteCandidatePreviewInput
): EvidenceCaseQuoteCandidatePreview {
  const sourceDocumentId =
    input.sourceDocumentId?.trim() ||
    input.knowledgeUnitPreview?.sourceDocumentId ||
    input.sectionChunkSaveCandidate?.sourceDocumentId ||
    input.savedContentChunks?.[0]?.sourceDocumentId ||
    input.savedSourceSections?.[0]?.sourceDocumentId ||
    undefined;
  const sectionIndex = createSectionIndex(input);
  const chunks = createChunkInputs(input, sectionIndex);
  const inheritedBlockers = uniqueList([
    ...(input.knowledgeUnitPreview?.blockers ?? []),
    ...(input.sectionChunkSaveCandidate?.blockers ?? [])
  ]);
  const inheritedWarnings = uniqueList([
    ...(input.knowledgeUnitPreview?.warnings ?? []),
    ...(input.sectionChunkSaveCandidate?.warnings ?? [])
  ]);

  if (
    chunks.length === 0 ||
    input.knowledgeUnitPreview?.status === "unavailable" ||
    inheritedBlockers.some(isHardBlocker)
  ) {
    return createEmptyPreview({
      blockers:
        chunks.length === 0
          ? ["Text-backed ContentChunks are required before evidence/case/quote candidate preview."]
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

  const evidenceCandidates = chunks.flatMap((chunk, index) =>
    createEvidenceCandidate(chunk, index, sourceDocumentId)
  );
  const caseCandidates = chunks.flatMap((chunk, index) =>
    createCaseCandidate(chunk, index, sourceDocumentId)
  );
  const quoteCandidates = chunks.flatMap((chunk, index) =>
    createQuoteCandidate(chunk, index, sourceDocumentId)
  );
  const allCandidates = [
    ...evidenceCandidates,
    ...caseCandidates,
    ...quoteCandidates
  ];
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
      ? "No deterministic evidence, case, or quote cues were found."
      : ""
  ]);
  const status: EvidenceCaseQuoteCandidatePreviewStatus =
    usableCandidates.length === 0
      ? "unavailable"
      : blockers.length > 0 || warnings.length > 0
        ? "limited"
        : "available";

  return {
    blockers,
    candidateConfidence: createOverallConfidence(allCandidates, status),
    caseCandidates,
    contentChunkCount: chunks.length,
    estimatedCaseCount: caseCandidates.filter((candidate) => candidate.trustState !== "red").length,
    estimatedEvidenceCount: evidenceCandidates.filter((candidate) => candidate.trustState !== "red").length,
    estimatedQuoteCount: quoteCandidates.filter((candidate) => candidate.trustState !== "red").length,
    evidenceCandidates,
    languageProfile: createLanguageProfile(chunks),
    positiveSignals: createPositiveSignals({
      allCandidates,
      evidenceCandidates,
      caseCandidates,
      quoteCandidates,
      sourceDocumentId,
      status
    }),
    previewNotice: evidenceCaseQuoteCandidatePreviewNotice,
    quoteCandidates,
    recommendedNextAction: createRecommendedNextAction(status, allCandidates.length),
    sourceDocumentId,
    status,
    warnings
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
  input: EvidenceCaseQuoteCandidatePreviewInput
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
  input: EvidenceCaseQuoteCandidatePreviewInput,
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

function createEvidenceCandidate(
  chunk: NormalizedChunkInput,
  index: number,
  sourceDocumentId?: string
): EvidenceUnitCandidatePreview[] {
  const text = normalizedText(chunk);
  if (!hasEvidenceCue(text)) {
    return [];
  }

  const common = createCommonCandidateState(chunk);
  return [
    {
      ...common,
      evidenceType: detectEvidenceType(text),
      id: createCandidateId("evidence-candidate", sourceDocumentId ?? chunk.sourceDocumentId, chunk, index),
      previewClaim: safeTruncate(chunk.previewText ?? "", 180),
      sourceDocumentId: sourceDocumentId ?? chunk.sourceDocumentId,
      title: chunk.title?.trim() || chunk.sectionTitle?.trim() || "Evidence candidate"
    }
  ];
}

function createCaseCandidate(
  chunk: NormalizedChunkInput,
  index: number,
  sourceDocumentId?: string
): CaseUnitCandidatePreview[] {
  const text = normalizedText(chunk);
  if (!hasCaseCue(text)) {
    return [];
  }

  const common = createCommonCandidateState(chunk);
  return [
    {
      ...common,
      caseType: detectCaseType(text),
      id: createCandidateId("case-candidate", sourceDocumentId ?? chunk.sourceDocumentId, chunk, index),
      previewCase: safeTruncate(chunk.previewText ?? "", 180),
      sourceDocumentId: sourceDocumentId ?? chunk.sourceDocumentId,
      title: chunk.title?.trim() || chunk.sectionTitle?.trim() || "Case candidate"
    }
  ];
}

function createQuoteCandidate(
  chunk: NormalizedChunkInput,
  index: number,
  sourceDocumentId?: string
): QuoteUnitCandidatePreview[] {
  const text = normalizedText(chunk);
  const quote = extractQuotePreview(chunk.previewText ?? "");
  const hasDefinitionCue = /definition|meaning|คือ|ความหมาย/.test(text);

  if (!quote && !hasDefinitionCue) {
    return [];
  }

  const common = createCommonCandidateState(chunk);
  return [
    {
      ...common,
      id: createCandidateId("quote-candidate", sourceDocumentId ?? chunk.sourceDocumentId, chunk, index),
      previewQuote: quote || safeTruncate(chunk.previewText ?? "", 120),
      quoteType: quote
        ? "direct_quote_candidate"
        : hasDefinitionCue
          ? "definition_quote"
          : "unknown",
      sourceDocumentId: sourceDocumentId ?? chunk.sourceDocumentId
    }
  ];
}

function createCommonCandidateState(chunk: NormalizedChunkInput): {
  blockers: string[];
  confidence: Exclude<EvidenceCaseQuoteCandidateConfidence, "none">;
  contentChunkId?: string;
  languageProfile: EvidenceCaseQuoteLanguageProfile;
  sourceSectionId?: string;
  sourceTraceLabel: string;
  trustState: EvidenceCaseQuoteTrustState;
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
    chunk.previewText?.trim() ? "" : "No preview text available for deterministic candidate preview."
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

function hasEvidenceCue(value: string): boolean {
  return /%|percent|increase|decrease|growth|sample|n\s*=|study|finding|evidence|research|ผลการศึกษา|งานวิจัย|พบว่า|เพิ่มขึ้น|ลดลง/.test(value);
}

function hasCaseCue(value: string): boolean {
  return /case|company|brand|example|starbucks|apple|amazon|toyota|กรณีศึกษา|ตัวอย่าง|บริษัท|แบรนด์|ลูกค้า/.test(value);
}

function detectEvidenceType(value: string): EvidenceCandidateType {
  if (/%|percent|increase|decrease|growth|sample|n\s*=|เพิ่มขึ้น|ลดลง/.test(value)) {
    return "statistic";
  }

  if (/study|finding|research|ผลการศึกษา|งานวิจัย|พบว่า/.test(value)) {
    return "research_finding";
  }

  if (/argument|argues|claim/.test(value)) {
    return "argument";
  }

  return "general_evidence";
}

function detectCaseType(value: string): CaseCandidateType {
  if (/starbucks|apple|amazon|toyota|company|brand|บริษัท|แบรนด์/.test(value)) {
    return "company_case";
  }

  if (/industry|market|sector|อุตสาหกรรม|ตลาด/.test(value)) {
    return "industry_case";
  }

  if (/customer|ลูกค้า/.test(value)) {
    return "customer_case";
  }

  if (/example|case|กรณีศึกษา|ตัวอย่าง/.test(value)) {
    return "teaching_example";
  }

  return "unknown";
}

function extractQuotePreview(value: string): string | null {
  const match = value.match(/["“”'‘’]([^"“”'‘’]{8,140})["“”'‘’]/);
  return match ? safeTruncate(match[1], 120) : null;
}

function createOverallConfidence(
  candidates: Array<{ confidence: Exclude<EvidenceCaseQuoteCandidateConfidence, "none"> }>,
  status: EvidenceCaseQuoteCandidatePreviewStatus
): EvidenceCaseQuoteCandidateConfidence {
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
): EvidenceCaseQuoteLanguageProfile {
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
  caseCandidates: CaseUnitCandidatePreview[];
  evidenceCandidates: EvidenceUnitCandidatePreview[];
  quoteCandidates: QuoteUnitCandidatePreview[];
  sourceDocumentId?: string;
  status: EvidenceCaseQuoteCandidatePreviewStatus;
}): string[] {
  return uniqueList([
    input.sourceDocumentId ? "source_document_trace_available" : "",
    input.evidenceCandidates.length > 0 ? "evidence_candidate_cues_available" : "",
    input.caseCandidates.length > 0 ? "case_candidate_cues_available" : "",
    input.quoteCandidates.length > 0 ? "quote_candidate_cues_available" : "",
    input.allCandidates.some((candidate) => candidate.sourceTraceLabel !== "missing trace")
      ? "source_trace_labels_available"
      : "",
    input.status === "available" ? "deterministic_evidence_case_quote_preview_available" : ""
  ]);
}

function createRecommendedNextAction(
  status: EvidenceCaseQuoteCandidatePreviewStatus,
  candidateCount: number
): string {
  if (status === "unavailable") {
    return candidateCount > 0
      ? "Resolve source trace and blocked chunk issues before reviewing evidence, case, or quote candidates."
      : "Prepare text-backed chunks with deterministic evidence, case, or quote cues before previewing these unit candidates.";
  }

  if (status === "limited") {
    return "Review trace labels, candidate cues, and quote excerpts before any future EvidenceUnit/CaseUnit/QuoteUnit schema work.";
  }

  return "Review evidence, case, and quote candidates; this remains preview-only and cannot create downstream records.";
}

function createEmptyPreview(input: {
  blockers: string[];
  chunkCount: number;
  sourceDocumentId?: string;
  status: EvidenceCaseQuoteCandidatePreviewStatus;
  warnings: string[];
}): EvidenceCaseQuoteCandidatePreview {
  return {
    blockers: uniqueList(input.blockers),
    candidateConfidence: "none",
    caseCandidates: [],
    contentChunkCount: input.chunkCount,
    estimatedCaseCount: 0,
    estimatedEvidenceCount: 0,
    estimatedQuoteCount: 0,
    evidenceCandidates: [],
    languageProfile: "unknown",
    positiveSignals: input.sourceDocumentId ? ["source_document_trace_available"] : [],
    previewNotice: evidenceCaseQuoteCandidatePreviewNotice,
    quoteCandidates: [],
    recommendedNextAction: createRecommendedNextAction(input.status, 0),
    sourceDocumentId: input.sourceDocumentId,
    status: input.status,
    warnings: uniqueList(input.warnings)
  };
}

function createCandidateTrustState(input: {
  blockers: string[];
  chunkTrust?: string | null;
  traceLabel: string;
  warnings: string[];
}): EvidenceCaseQuoteTrustState {
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
  trustState: EvidenceCaseQuoteTrustState;
}): Exclude<EvidenceCaseQuoteCandidateConfidence, "none"> {
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
): EvidenceCaseQuoteLanguageProfile {
  if (value === "thai" || value === "english" || value === "mixed") {
    return value;
  }
  return "unknown";
}

function normalizeTrustState(value?: string | null): EvidenceCaseQuoteTrustState {
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
