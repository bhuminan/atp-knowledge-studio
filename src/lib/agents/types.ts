import type { ChapterSection, SourceDocument } from "../../types/domain";

export type CitationGuardClassification =
  | "VERIFIED"
  | "UNVERIFIED"
  | "FABRICATED-RISK";

export interface CitationGuardFlag {
  citation: string;
  author: string;
  year: string;
  classification: CitationGuardClassification;
  matchedSourceId?: string;
  note: string;
}

export interface CitationGuardResult {
  detectedCount: number;
  status: "no_citations_detected" | "has_flags";
  flags: CitationGuardFlag[];
}

export interface StructureValidationResult {
  passed: boolean;
  missingSections: string[];
  extraSections: string[];
  orderedSections: string[];
}

export interface TextbookStructureValidationResult {
  passed: boolean;
  criticalIssues: string[];
  warnings: string[];
  checkedLayers: string[];
  checkedCoreSections: string[];
  missingLayers: string[];
  missingCoreSections: string[];
  extraCoreSections: string[];
  duplicateCoreSections: string[];
  reorderedCoreSections: string[];
  readinessStatus: "ready" | "mock_ready" | "incomplete";
  status: "passed" | "failed" | "needs_review";
}

export interface WriterAgentStyleConfig {
  name: string;
  tone: string;
  language: string;
  citationStyle: string;
}

export interface WriterAgentInput {
  chapterTopic: string;
  selectedSection: ChapterSection;
  allSections: ChapterSection[];
  retrievedSources: SourceDocument[];
  styleConfig: WriterAgentStyleConfig;
}

export interface WriterAgentResult {
  providerName: string;
  promptPreview: string;
  draftOutput: string;
  citationFlags: CitationGuardResult;
  structureValidation: StructureValidationResult;
  mockCoReviewStatus: string;
  retrievedSourceTitles: string[];
}
