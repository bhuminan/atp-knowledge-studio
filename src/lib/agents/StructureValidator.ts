import type { ChapterSection } from "../../types/domain";
import type { StructureValidationResult } from "./types";

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

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
