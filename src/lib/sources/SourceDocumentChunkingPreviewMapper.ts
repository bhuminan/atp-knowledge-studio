import type {
  SourceDocumentIntakeReadinessPreview
} from "./SourceDocumentIntakeReadinessMapper";
import type {
  SourceDocumentLanguageProfile,
  SourceDocumentStructureConfidence,
  SourceDocumentStructurePreview,
  SourceSectionCandidatePreview
} from "./SourceDocumentStructurePreviewMapper";

export type SourceDocumentChunkingPreviewStatus =
  | "available"
  | "limited"
  | "unavailable";

export type SourceDocumentChunkingConfidence = "high" | "medium" | "low" | "none";

export type SourceDocumentChunkingMode =
  | "section_based"
  | "paragraph_based"
  | "metadata_only"
  | "blocked";

export type SourceDocumentChunkType =
  | "section"
  | "paragraph_group"
  | "metadata_stub";

export interface SourceDocumentEstimatedRecordCounts {
  caseUnits: number;
  evidenceUnits: number;
  knowledgeUnits: number;
  quoteUnits: number;
  teachingUnits: number;
  writingAngles: number;
}

export interface SourceDocumentChunkCandidatePreview {
  chunkType: SourceDocumentChunkType;
  confidence: Exclude<SourceDocumentChunkingConfidence, "none">;
  estimatedRecords: SourceDocumentEstimatedRecordCounts;
  id: string;
  order: number;
  previewText?: string;
  sourceSectionId?: string;
  title: string;
  traceLabel: string;
  warnings: string[];
}

export interface SourceDocumentChunkingPreviewInput {
  cleanedText?: string | null;
  fileName?: string;
  fileType?: string | null;
  rawText?: string | null;
  readinessPreview?: SourceDocumentIntakeReadinessPreview | null;
  structurePreview?: SourceDocumentStructurePreview | null;
  warnings?: string[];
}

export interface SourceDocumentChunkingPreview {
  blockers: string[];
  chunkCandidates: SourceDocumentChunkCandidatePreview[];
  chunkingConfidence: SourceDocumentChunkingConfidence;
  chunkingMode: SourceDocumentChunkingMode;
  estimatedChunkCount: number;
  estimatedKnowledgeRecordRange: {
    max: number;
    min: number;
  };
  languageProfile: SourceDocumentLanguageProfile;
  positiveSignals: string[];
  recommendedNextAction: string;
  status: SourceDocumentChunkingPreviewStatus;
  warnings: string[];
}

const hardBlockers = new Set([
  "candidate_blocked",
  "duplicate_candidate_detected",
  "empty_file",
  "file_extension_mismatch",
  "missing_file_name",
  "missing_file_path",
  "unsupported_file_type",
  "unreadable_file"
]);

export function createSourceDocumentChunkingPreview(
  input: SourceDocumentChunkingPreviewInput
): SourceDocumentChunkingPreview {
  const readiness = input.readinessPreview ?? null;
  const structure = input.structurePreview ?? null;
  const fileType = (input.fileType ?? "").trim().toUpperCase();
  const blockers = uniqueList([
    ...(readiness?.blockers ?? []),
    ...(structure?.blockers ?? [])
  ]);
  const warnings = uniqueList([
    ...(input.warnings ?? []),
    ...(readiness?.warnings ?? []),
    ...(structure?.warnings ?? [])
  ]);
  const languageProfile = structure?.detectedLanguageProfile ?? detectLanguageProfile(getUsableText(input));

  if (
    readiness?.status === "blocked" ||
    blockers.some((blocker) => hardBlockers.has(blocker))
  ) {
    return {
      blockers,
      chunkCandidates: [],
      chunkingConfidence: "none",
      chunkingMode: "blocked",
      estimatedChunkCount: 0,
      estimatedKnowledgeRecordRange: { min: 0, max: 0 },
      languageProfile,
      positiveSignals: [],
      recommendedNextAction:
        "Resolve blockers before any chunking strategy preview can be trusted.",
      status: "unavailable",
      warnings
    };
  }

  if (fileType === "PDF" || warnings.includes("pdf_text_extraction_not_available_yet")) {
    const metadataStub = createMetadataStubCandidate(input.fileName, warnings);

    return {
      blockers: [],
      chunkCandidates: metadataStub ? [metadataStub] : [],
      chunkingConfidence: "low",
      chunkingMode: "metadata_only",
      estimatedChunkCount: metadataStub ? 1 : 0,
      estimatedKnowledgeRecordRange: { min: 0, max: metadataStub ? 1 : 0 },
      languageProfile,
      positiveSignals: ["supported_file_type", "metadata_stub_available"],
      recommendedNextAction:
        "Wait for future PDF text extraction before reliable chunking or Deep Intake.",
      status: "limited",
      warnings: uniqueList([
        ...warnings,
        "pdf_text_extraction_not_available_yet",
        "metadata_only_chunking_range_0_1"
      ])
    };
  }

  if (fileType !== "DOCX") {
    return {
      blockers: uniqueList([...blockers, "unsupported_file_type"]),
      chunkCandidates: [],
      chunkingConfidence: "none",
      chunkingMode: "blocked",
      estimatedChunkCount: 0,
      estimatedKnowledgeRecordRange: { min: 0, max: 0 },
      languageProfile,
      positiveSignals: [],
      recommendedNextAction:
        "Use a supported DOCX or PDF before chunking strategy preview can continue.",
      status: "unavailable",
      warnings
    };
  }

  if (
    structure?.status === "available" &&
    structure.sourceSectionCandidates.length > 0
  ) {
    const chunkCandidates = structure.sourceSectionCandidates.map((candidate) =>
      createSectionChunkCandidate(candidate, languageProfile)
    );

    return {
      blockers: [],
      chunkCandidates,
      chunkingConfidence: structureConfidenceToChunkingConfidence(
        structure.structureConfidence
      ),
      chunkingMode: "section_based",
      estimatedChunkCount: chunkCandidates.length,
      estimatedKnowledgeRecordRange: estimateRecordRange(chunkCandidates),
      languageProfile,
      positiveSignals: uniqueList([
        "text_preview_available",
        "source_section_candidates_available",
        "section_based_chunking_candidate"
      ]),
      recommendedNextAction:
        "Review section-based chunks before any future Deep Intake schema or record creation work.",
      status: "available",
      warnings
    };
  }

  const paragraphChunks = createParagraphChunkCandidates(input, languageProfile);
  if (paragraphChunks.length > 0) {
    return {
      blockers: [],
      chunkCandidates: paragraphChunks,
      chunkingConfidence: "low",
      chunkingMode: "paragraph_based",
      estimatedChunkCount: paragraphChunks.length,
      estimatedKnowledgeRecordRange: estimateRecordRange(paragraphChunks),
      languageProfile,
      positiveSignals: ["text_preview_available", "paragraph_group_chunks_available"],
      recommendedNextAction:
        "Review paragraph-group chunks manually; headings are too weak for reliable section-based chunking.",
      status: "limited",
      warnings: uniqueList([
        ...warnings,
        "paragraph_based_chunking_requires_human_review"
      ])
    };
  }

  return {
    blockers: [],
    chunkCandidates: [],
    chunkingConfidence: "none",
    chunkingMode: "blocked",
    estimatedChunkCount: 0,
    estimatedKnowledgeRecordRange: { min: 0, max: 0 },
    languageProfile,
    positiveSignals: fileType === "DOCX" ? ["supported_file_type"] : [],
    recommendedNextAction:
      "Run or provide a DOCX text preview before chunking strategy can be estimated.",
    status: "unavailable",
    warnings: uniqueList([...warnings, "text_preview_required_for_chunking"])
  };
}

function createSectionChunkCandidate(
  section: SourceSectionCandidatePreview,
  languageProfile: SourceDocumentLanguageProfile
): SourceDocumentChunkCandidatePreview {
  return {
    chunkType: "section",
    confidence: section.confidence,
    estimatedRecords: estimateRecordsForText(
      [section.title, section.previewText].filter(Boolean).join(" "),
      languageProfile,
      section.confidence
    ),
    id: `chunk-preview-${section.id}`,
    order: section.order,
    previewText: section.previewText,
    sourceSectionId: section.id,
    title: section.title,
    traceLabel: section.traceLabel,
    warnings: section.warnings
  };
}

function createParagraphChunkCandidates(
  input: SourceDocumentChunkingPreviewInput,
  languageProfile: SourceDocumentLanguageProfile
): SourceDocumentChunkCandidatePreview[] {
  const paragraphs = getUsableText(input)
    .split(/\n{2,}|\r?\n/)
    .map((paragraph) => paragraph.trim().replace(/\s+/g, " "))
    .filter((paragraph) => paragraph.length >= 40)
    .slice(0, 4);

  return paragraphs.map((paragraph, index) => ({
    chunkType: "paragraph_group",
    confidence: "low",
    estimatedRecords: estimateRecordsForText(paragraph, languageProfile, "low"),
    id: `chunk-preview-${slugify(input.fileName ?? "source")}-paragraph-${index + 1}`,
    order: index + 1,
    previewText: createPreviewText(paragraph),
    title: `Paragraph group ${index + 1}`,
    traceLabel: `paragraph:${index + 1}`,
    warnings: ["paragraph_group_requires_review"]
  }));
}

function createMetadataStubCandidate(
  fileName = "Metadata-only source",
  warnings: string[]
): SourceDocumentChunkCandidatePreview | null {
  if (!fileName.trim()) {
    return null;
  }

  return {
    chunkType: "metadata_stub",
    confidence: "low",
    estimatedRecords: {
      caseUnits: 0,
      evidenceUnits: 0,
      knowledgeUnits: 0,
      quoteUnits: 0,
      teachingUnits: 0,
      writingAngles: 1
    },
    id: `chunk-preview-${slugify(fileName)}-metadata`,
    order: 1,
    title: fileName,
    traceLabel: "metadata:file",
    warnings: uniqueList([...warnings, "metadata_stub_not_deep_intake_ready"])
  };
}

function estimateRecordsForText(
  text: string,
  languageProfile: SourceDocumentLanguageProfile,
  confidence: Exclude<SourceDocumentChunkingConfidence, "none">
): SourceDocumentEstimatedRecordCounts {
  const lowerText = text.toLowerCase();
  const includesCaseSignal =
    /\b(case|example|framework|model)\b/i.test(text) ||
    /กรณี|ตัวอย่าง|แบบจำลอง/u.test(text);
  const includesTeachingSignal =
    languageProfile === "thai" ||
    languageProfile === "mixed" ||
    /teaching|classroom|lesson|สอน|ชั้นเรียน/u.test(lowerText);

  const confidenceBoost = confidence === "high" ? 1 : 0;

  return {
    caseUnits: includesCaseSignal ? 1 : 0,
    evidenceUnits: confidence === "low" ? 0 : 1,
    knowledgeUnits: confidence === "low" ? 1 : 2 + confidenceBoost,
    quoteUnits: 0,
    teachingUnits: includesTeachingSignal ? 1 : 0,
    writingAngles: 1
  };
}

function estimateRecordRange(
  chunks: SourceDocumentChunkCandidatePreview[]
): SourceDocumentChunkingPreview["estimatedKnowledgeRecordRange"] {
  if (chunks.length === 0) {
    return { min: 0, max: 0 };
  }

  const totals = chunks.map((chunk) => sumEstimatedRecords(chunk.estimatedRecords));
  const min = Math.max(0, Math.min(...totals));
  const max = totals.reduce((sum, total) => sum + total, 0);

  return { min, max };
}

function sumEstimatedRecords(records: SourceDocumentEstimatedRecordCounts): number {
  return (
    records.caseUnits +
    records.evidenceUnits +
    records.knowledgeUnits +
    records.quoteUnits +
    records.teachingUnits +
    records.writingAngles
  );
}

function structureConfidenceToChunkingConfidence(
  confidence: SourceDocumentStructureConfidence
): SourceDocumentChunkingConfidence {
  if (confidence === "none") {
    return "none";
  }

  return confidence;
}

function getUsableText(input: SourceDocumentChunkingPreviewInput): string {
  return [input.rawText, input.cleanedText].filter(Boolean).join("\n").trim();
}

function detectLanguageProfile(text: string): SourceDocumentLanguageProfile {
  const thaiChars = (text.match(/[\u0E00-\u0E7F]/g) ?? []).length;
  const englishChars = (text.match(/[A-Za-z]/g) ?? []).length;

  if (thaiChars === 0 && englishChars === 0) {
    return "unknown";
  }

  if (thaiChars > 0 && englishChars > 0) {
    return "mixed";
  }

  return thaiChars > 0 ? "thai" : "english";
}

function createPreviewText(text: string): string | undefined {
  const preview = text.trim().replace(/\s+/g, " ");
  if (!preview) {
    return undefined;
  }

  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "untitled";
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
