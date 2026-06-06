import type { DocumentSegment } from "../../types/domain";
import type { SourceDocumentIntakeSaveCandidate } from "./SourceDocumentIntakeSaveCandidateMapper";

export type SourceDocumentStructurePreviewStatus =
  | "available"
  | "limited"
  | "unavailable";

export type SourceDocumentStructureConfidence = "high" | "medium" | "low" | "none";

export type SourceDocumentLanguageProfile =
  | "thai"
  | "english"
  | "mixed"
  | "unknown";

export interface SourceSectionCandidatePreview {
  confidence: Exclude<SourceDocumentStructureConfidence, "none">;
  endOffset?: number;
  id: string;
  level: number;
  order: number;
  previewText?: string;
  startOffset?: number;
  title: string;
  traceLabel: string;
  warnings: string[];
}

export interface SourceDocumentStructurePreviewInput {
  blockers?: string[];
  duplicateStatus?: "not_checked" | "not_duplicate" | "duplicate_candidate_detected";
  fileName?: string;
  fileType?: string | null;
  rawText?: string | null;
  cleanedText?: string | null;
  segments?: Array<Pick<DocumentSegment, "content" | "segmentId" | "title">>;
  warnings?: string[];
}

export interface SourceDocumentStructurePreview {
  blockers: string[];
  detectedLanguageProfile: SourceDocumentLanguageProfile;
  positiveSignals: string[];
  recommendedNextAction: string;
  sectionCount: number;
  sourceSectionCandidates: SourceSectionCandidatePreview[];
  status: SourceDocumentStructurePreviewStatus;
  structureConfidence: SourceDocumentStructureConfidence;
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

export function createSourceDocumentStructurePreview(
  input: SourceDocumentStructurePreviewInput
): SourceDocumentStructurePreview {
  const blockers = uniqueList(input.blockers ?? []);
  const warnings = uniqueList(input.warnings ?? []);
  const fileType = (input.fileType ?? "").trim().toUpperCase();

  if (
    blockers.some((blocker) => hardBlockers.has(blocker)) ||
    input.duplicateStatus === "duplicate_candidate_detected"
  ) {
    const blockedSignals = [
      ...blockers,
      input.duplicateStatus === "duplicate_candidate_detected"
        ? "duplicate_candidate_detected"
        : ""
    ].filter(Boolean);

    return unavailablePreview({
      blockers: uniqueList(blockedSignals),
      fileType,
      recommendedNextAction:
        "Resolve blockers before any SourceSection candidate preview can be trusted.",
      warnings
    });
  }

  if (fileType !== "DOCX" && fileType !== "PDF") {
    return unavailablePreview({
      blockers: uniqueList([...blockers, "unsupported_file_type"]),
      fileType,
      recommendedNextAction:
        "Use a supported DOCX or PDF file before structure preview can continue.",
      warnings
    });
  }

  if (fileType === "PDF") {
    return {
      blockers: [],
      detectedLanguageProfile: "unknown",
      positiveSignals: ["supported_file_type"],
      recommendedNextAction:
        "PDF structure preview waits for future PDF text extraction; no SourceSection records are created.",
      sectionCount: 0,
      sourceSectionCandidates: [],
      status: "unavailable",
      structureConfidence: "none",
      warnings: uniqueList([
        ...warnings,
        "pdf_text_extraction_not_available_yet",
        "pdf_structure_preview_unavailable"
      ])
    };
  }

  const text = getUsableText(input);
  const languageProfile = detectLanguageProfile(text);

  if (!text.trim() && !input.segments?.length) {
    return {
      blockers: [],
      detectedLanguageProfile: languageProfile,
      positiveSignals: ["supported_file_type"],
      recommendedNextAction:
        "Run or provide a DOCX text preview before detecting SourceSection candidates.",
      sectionCount: 0,
      sourceSectionCandidates: [],
      status: "unavailable",
      structureConfidence: "none",
      warnings: uniqueList([
        ...warnings,
        "text_preview_required_for_structure_detection"
      ])
    };
  }

  const candidates = uniqueCandidates([
    ...detectHeadingsFromText(text, input.fileName),
    ...detectCandidatesFromSegments(input.segments ?? [], input.fileName)
  ]);
  const structureConfidence = getStructureConfidence(candidates, text);
  const status: SourceDocumentStructurePreviewStatus =
    candidates.length > 0 ? "available" : "limited";
  const structureWarnings =
    candidates.length > 0
      ? []
      : ["structure_detection_weak_no_reliable_headings_found"];

  return {
    blockers: [],
    detectedLanguageProfile: languageProfile,
    positiveSignals: uniqueList([
      "supported_file_type",
      text.trim() ? "text_preview_available" : "",
      candidates.length > 0 ? "section_candidates_detected" : ""
    ].filter(Boolean)),
    recommendedNextAction:
      candidates.length > 0
        ? "Review SourceSection candidates before any future Deep Intake schema work."
        : "Review text manually; headings are too weak for reliable SourceSection candidates.",
    sectionCount: candidates.length,
    sourceSectionCandidates: candidates,
    status,
    structureConfidence,
    warnings: uniqueList([...warnings, ...structureWarnings])
  };
}

export function createSourceDocumentStructurePreviewFromCandidate(
  candidate: SourceDocumentIntakeSaveCandidate,
  options: Omit<SourceDocumentStructurePreviewInput, "blockers" | "duplicateStatus" | "fileName" | "fileType" | "warnings"> = {}
): SourceDocumentStructurePreview {
  return createSourceDocumentStructurePreview({
    ...options,
    blockers: candidate.blockers,
    duplicateStatus: candidate.duplicateStatus,
    fileName: candidate.sourceFileName,
    fileType: candidate.sourceType,
    warnings: candidate.warnings
  });
}

function detectHeadingsFromText(
  text: string,
  fileName = "source"
): SourceSectionCandidatePreview[] {
  const lines = text
    .split(/\r?\n/)
    .map((line, index) => ({
      line: line.trim(),
      offset: getLineStartOffset(text, index)
    }))
    .filter(({ line }) => line.length > 0);

  return lines.flatMap(({ line, offset }, index) => {
    const heading = classifyHeadingLine(line);
    if (!heading) {
      return [];
    }

    return [
      {
        confidence: heading.confidence,
        id: createCandidateId(fileName, index, line),
        level: heading.level,
        order: index + 1,
        previewText: getNextPreviewText(lines, index),
        startOffset: offset,
        endOffset: offset + line.length,
        title: heading.title,
        traceLabel: `text:${index + 1}`,
        warnings: heading.warnings
      }
    ];
  });
}

function detectCandidatesFromSegments(
  segments: Array<Pick<DocumentSegment, "content" | "segmentId" | "title">>,
  fileName = "source"
): SourceSectionCandidatePreview[] {
  return segments.flatMap((segment, index) => {
    const title = segment.title.trim();
    if (!isSafeTitleLikeLine(title)) {
      return [];
    }

    return [
      {
        confidence: "medium",
        id: createCandidateId(fileName, index, title),
        level: 1,
        order: index + 1,
        previewText: createPreviewText(segment.content),
        title,
        traceLabel: segment.segmentId || `segment:${index + 1}`,
        warnings: ["segment_title_candidate_requires_review"]
      }
    ];
  });
}

function classifyHeadingLine(
  line: string
): Pick<SourceSectionCandidatePreview, "confidence" | "level" | "title" | "warnings"> | null {
  const normalized = line.replace(/^Heading:\s*/i, "").trim();

  if (/^chapter\s+\d+(\b|[:.\-\s])/i.test(normalized)) {
    return { confidence: "high", level: 1, title: normalized, warnings: [] };
  }

  if (/^บทที่\s*\d+(\b|[:.\-\s])/u.test(normalized)) {
    return { confidence: "high", level: 1, title: normalized, warnings: [] };
  }

  const numberedHeading = normalized.match(/^(\d+(?:\.\d+)*)(?:\.|\s+)\s*(.+)$/u);
  if (numberedHeading && numberedHeading[2]?.trim()) {
    const level = Math.min(numberedHeading[1].split(".").length, 4);
    return {
      confidence: level > 1 ? "medium" : "high",
      level,
      title: normalized,
      warnings: []
    };
  }

  if (line.startsWith("Heading:") && isSafeTitleLikeLine(normalized)) {
    return {
      confidence: "medium",
      level: 1,
      title: normalized,
      warnings: ["title_like_heading_requires_review"]
    };
  }

  return null;
}

function isSafeTitleLikeLine(line: string): boolean {
  if (line.length < 4 || line.length > 80) {
    return false;
  }

  if (/[.!?。！？]$/.test(line)) {
    return false;
  }

  const words = line.split(/\s+/).filter(Boolean);
  if (words.length > 10) {
    return false;
  }

  return /[A-Za-zก-๙]/u.test(line);
}

function getStructureConfidence(
  candidates: SourceSectionCandidatePreview[],
  text: string
): SourceDocumentStructureConfidence {
  if (candidates.length === 0) {
    return text.trim() ? "low" : "none";
  }

  const highCount = candidates.filter((candidate) => candidate.confidence === "high")
    .length;

  if ((candidates.length >= 2 && highCount >= 2) || (candidates.length >= 3 && highCount >= 1)) {
    return "high";
  }

  if (highCount > 0 || candidates.length >= 2) {
    return "medium";
  }

  return "low";
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

function unavailablePreview({
  blockers,
  fileType,
  recommendedNextAction,
  warnings
}: {
  blockers: string[];
  fileType: string;
  recommendedNextAction: string;
  warnings: string[];
}): SourceDocumentStructurePreview {
  return {
    blockers,
    detectedLanguageProfile: "unknown",
    positiveSignals: fileType === "PDF" || fileType === "DOCX" ? ["supported_file_type"] : [],
    recommendedNextAction,
    sectionCount: 0,
    sourceSectionCandidates: [],
    status: "unavailable",
    structureConfidence: "none",
    warnings
  };
}

function getUsableText(input: SourceDocumentStructurePreviewInput): string {
  return [input.rawText, input.cleanedText].filter(Boolean).join("\n").trim();
}

function getLineStartOffset(text: string, targetLineIndex: number): number {
  if (targetLineIndex <= 0) {
    return 0;
  }

  return text.split(/\r?\n/).slice(0, targetLineIndex).join("\n").length + 1;
}

function getNextPreviewText(
  lines: Array<{ line: string; offset: number }>,
  currentIndex: number
): string | undefined {
  const nextLine = lines[currentIndex + 1]?.line;
  return nextLine && !classifyHeadingLine(nextLine)
    ? createPreviewText(nextLine)
    : undefined;
}

function createPreviewText(text: string): string | undefined {
  const preview = text.trim().replace(/\s+/g, " ");
  if (!preview) {
    return undefined;
  }

  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
}

function createCandidateId(fileName: string, index: number, title: string): string {
  return `section-preview-${slugify(fileName)}-${index + 1}-${slugify(title).slice(0, 32)}`;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "untitled";
}

function uniqueCandidates(
  candidates: SourceSectionCandidatePreview[]
): SourceSectionCandidatePreview[] {
  const seenTitles = new Set<string>();
  const unique: SourceSectionCandidatePreview[] = [];

  candidates.forEach((candidate) => {
    const key = candidate.title.toLowerCase();
    if (seenTitles.has(key)) {
      return;
    }

    seenTitles.add(key);
    unique.push({ ...candidate, order: unique.length + 1 });
  });

  return unique;
}

function uniqueList<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
}
