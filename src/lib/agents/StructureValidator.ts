import {
  LOCKED_CORE_SECTIONS,
  type ChapterSection,
  type TextbookChapterDraft
} from "../../types/domain";
import type {
  StructureValidationResult,
  TextbookStructureValidationResult
} from "./types";

export const requiredChapterSections = [
  "What is it",
  "Key Components",
  "Real-world Impact",
  "Business Relevance",
  "Research Evidence",
  "Success Factors",
  "Manager Takeaway"
];

export function validateChapterStructure(
  sections: ChapterSection[]
): StructureValidationResult {
  const sectionTitles = sections.map((section) => section.title);
  const normalizedTitles = new Set(sectionTitles.map(normalize));

  const missingSections = requiredChapterSections.filter(
    (title) => !normalizedTitles.has(normalize(title))
  );
  const requiredTitleSet = new Set(requiredChapterSections.map(normalize));
  const extraSections = sectionTitles.filter(
    (title) => !requiredTitleSet.has(normalize(title))
  );

  return {
    passed: missingSections.length === 0,
    missingSections,
    extraSections,
    orderedSections: requiredChapterSections.filter((title) =>
      normalizedTitles.has(normalize(title))
    )
  };
}

export function validateTextbookChapterStructure(
  chapter: TextbookChapterDraft
): TextbookStructureValidationResult {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const checkedLayers: string[] = [];
  const missingLayers: string[] = [];
  const requiredLayers = [
    "chapterMeta",
    "frontMatter",
    "coreSections",
    "evidenceLayer",
    "learningApparatus",
    "casesAndExamples",
    "exhibits",
    "teachingOutputs",
    "validationState"
  ] as const;

  requiredLayers.forEach((layer) => {
    if (chapter[layer]) {
      checkedLayers.push(layer);
    } else {
      missingLayers.push(layer);
      criticalIssues.push(`Missing top-level layer: ${layer}`);
    }
  });

  validateChapterMeta(chapter, criticalIssues);
  validateFrontMatter(chapter, criticalIssues);

  const {
    checkedCoreSections,
    missingCoreSections,
    extraCoreSections,
    duplicateCoreSections,
    reorderedCoreSections
  } = validateCoreSections(chapter, criticalIssues);

  validateEvidenceLayer(chapter, criticalIssues, warnings);
  validateEvidenceCoverage(chapter, warnings);

  const passed = criticalIssues.length === 0;
  const status = passed
    ? warnings.length > 0
      ? "needs_review"
      : "passed"
    : "failed";
  const readinessStatus = passed
    ? warnings.length > 0 || chapter.chapterMeta.mockStatus === "mock"
      ? "mock_ready"
      : "ready"
    : "incomplete";

  return {
    passed,
    criticalIssues,
    warnings,
    checkedLayers,
    checkedCoreSections,
    missingLayers,
    missingCoreSections,
    extraCoreSections,
    duplicateCoreSections,
    reorderedCoreSections,
    readinessStatus,
    status
  };
}

function validateChapterMeta(
  chapter: TextbookChapterDraft,
  criticalIssues: string[]
) {
  if (!chapter.chapterMeta) {
    return;
  }

  const requiredMetaFields = [
    "chapterId",
    "chapterTitle",
    "conceptKeyword",
    "language",
    "styleMode",
    "createdByProvider",
    "mockStatus"
  ] as const;

  requiredMetaFields.forEach((field) => {
    if (!hasText(chapter.chapterMeta[field])) {
      criticalIssues.push(`Missing chapterMeta.${field}`);
    }
  });
}

function validateFrontMatter(
  chapter: TextbookChapterDraft,
  criticalIssues: string[]
) {
  if (!chapter.frontMatter) {
    return;
  }

  const requiredFrontMatterFields = [
    "overview",
    "openingVignette",
    "whyItMatters"
  ] as const;

  requiredFrontMatterFields.forEach((field) => {
    if (!hasText(chapter.frontMatter[field])) {
      criticalIssues.push(`Missing frontMatter.${field}`);
    }
  });

  if (chapter.frontMatter.learningObjectives.length < 3) {
    criticalIssues.push("frontMatter.learningObjectives must include at least 3 items");
  }

  if (chapter.frontMatter.keyQuestions.length < 1) {
    criticalIssues.push("frontMatter.keyQuestions must include at least 1 item");
  }
}

function validateCoreSections(
  chapter: TextbookChapterDraft,
  criticalIssues: string[]
) {
  const checkedCoreSections: string[] = [];
  const missingCoreSections: string[] = [];
  const extraCoreSections: string[] = [];
  const duplicateCoreSections: string[] = [];
  const reorderedCoreSections: string[] = [];
  const sectionCounts = new Map<string, number>();

  if (!Array.isArray(chapter.coreSections)) {
    criticalIssues.push("coreSections must be an array");
    return {
      checkedCoreSections,
      missingCoreSections: LOCKED_CORE_SECTIONS.map((section) => section.sectionId),
      extraCoreSections,
      duplicateCoreSections,
      reorderedCoreSections
    };
  }

  if (chapter.coreSections.length !== LOCKED_CORE_SECTIONS.length) {
    criticalIssues.push("coreSections must contain exactly 7 locked sections");
  }

  chapter.coreSections.forEach((section) => {
    sectionCounts.set(section.sectionId, (sectionCounts.get(section.sectionId) ?? 0) + 1);
  });

  const lockedSectionIds = new Set(
    LOCKED_CORE_SECTIONS.map((section) => section.sectionId)
  );

  LOCKED_CORE_SECTIONS.forEach((definition, index) => {
    const section = chapter.coreSections[index];
    const matchingSection = chapter.coreSections.find(
      (candidate) => candidate.sectionId === definition.sectionId
    );

    if (!matchingSection) {
      missingCoreSections.push(definition.sectionId);
      criticalIssues.push(`Missing core section: ${definition.sectionId}`);
      return;
    }

    checkedCoreSections.push(definition.sectionId);

    if (!section || section.sectionId !== definition.sectionId) {
      reorderedCoreSections.push(definition.sectionId);
      criticalIssues.push(`Core section is out of order: ${definition.sectionId}`);
    }

    validateCoreSectionFields(matchingSection, definition.title, criticalIssues);
  });

  chapter.coreSections.forEach((section) => {
    if (!lockedSectionIds.has(section.sectionId)) {
      extraCoreSections.push(section.sectionId);
      criticalIssues.push(`Unexpected core section: ${section.sectionId}`);
    }
  });

  sectionCounts.forEach((count, sectionId) => {
    if (count > 1) {
      duplicateCoreSections.push(sectionId);
      criticalIssues.push(`Duplicate core section: ${sectionId}`);
    }
  });

  return {
    checkedCoreSections,
    missingCoreSections,
    extraCoreSections,
    duplicateCoreSections,
    reorderedCoreSections
  };
}

function validateCoreSectionFields(
  section: TextbookChapterDraft["coreSections"][number],
  lockedTitle: string,
  criticalIssues: string[]
) {
  if (!hasText(section.title)) {
    criticalIssues.push(`Missing title for section: ${section.sectionId}`);
  }

  if (section.title !== lockedTitle) {
    criticalIssues.push(`Section title does not match locked contract: ${section.sectionId}`);
  }

  if (!hasText(section.bodyThai)) {
    criticalIssues.push(`Missing bodyThai for section: ${section.sectionId}`);
  }

  if (!Array.isArray(section.linkedEvidenceIds)) {
    criticalIssues.push(`linkedEvidenceIds must be an array: ${section.sectionId}`);
  }

  if (!Array.isArray(section.citationMarkers)) {
    criticalIssues.push(`citationMarkers must be an array: ${section.sectionId}`);
  }

  if (!hasText(section.citationStatus)) {
    criticalIssues.push(`Missing citationStatus for section: ${section.sectionId}`);
  }
}

function validateEvidenceLayer(
  chapter: TextbookChapterDraft,
  criticalIssues: string[],
  warnings: string[]
) {
  if (!chapter.evidenceLayer) {
    return;
  }

  if (!Array.isArray(chapter.evidenceLayer.sourceCards)) {
    criticalIssues.push("evidenceLayer.sourceCards must be an array");
  }

  if (!Array.isArray(chapter.evidenceLayer.evidenceItems)) {
    criticalIssues.push("evidenceLayer.evidenceItems must be an array");
  }

  if (!Array.isArray(chapter.evidenceLayer.citationMarkers)) {
    criticalIssues.push("evidenceLayer.citationMarkers must be an array");
  }

  if (!chapter.evidenceLayer.citationGuardResult) {
    criticalIssues.push("Missing evidenceLayer.citationGuardResult");
  }

  if (typeof chapter.evidenceLayer.evidenceCoverageScore !== "number") {
    criticalIssues.push("Missing evidenceLayer.evidenceCoverageScore");
  }

  if (!hasText(chapter.evidenceLayer.verificationStatus)) {
    criticalIssues.push("Missing evidenceLayer.verificationStatus");
  }

  if (chapter.evidenceLayer.verificationStatus === "mock") {
    warnings.push("Evidence layer is mock and requires source verification before export");
  }
}

function validateEvidenceCoverage(
  chapter: TextbookChapterDraft,
  warnings: string[]
) {
  if (!chapter.evidenceLayer || !Array.isArray(chapter.coreSections)) {
    return;
  }

  if (chapter.evidenceLayer.sourceCards.length === 0) {
    warnings.push("Evidence layer has no source cards");
  }

  if (chapter.evidenceLayer.evidenceItems.length === 0) {
    warnings.push("Evidence layer has no evidence items");
  }

  if (chapter.evidenceLayer.citationMarkers.length === 0) {
    warnings.push("Evidence layer has no citation markers");
  }

  chapter.coreSections.forEach((section) => {
    if (section.linkedEvidenceIds.length === 0) {
      warnings.push(`Core section has no linked evidence: ${section.sectionId}`);
    }
  });
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
