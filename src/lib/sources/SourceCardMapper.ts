import {
  LOCKED_CORE_SECTIONS,
  type Apa7Status,
  type ChapterSectionId,
  type SourceCard,
  type SourceDocument,
  type SourceDocumentType,
  type SourceReliabilityLevel
} from "../../types/domain";

const legacySectionIdMap: Record<string, ChapterSectionId> = {
  "what-is-it": "what_is_it",
  "key-components": "key_components",
  "real-world-impact": "real_world_impact",
  "business-relevance": "business_relevance",
  "research-evidence": "research_evidence",
  "success-factors": "success_factors",
  "manager-takeaway": "manager_takeaway",
  what_is_it: "what_is_it",
  key_components: "key_components",
  real_world_impact: "real_world_impact",
  business_relevance: "business_relevance",
  research_evidence: "research_evidence",
  success_factors: "success_factors",
  manager_takeaway: "manager_takeaway"
};

export function sourceDocumentToSourceCard(
  sourceDocument: SourceDocument
): SourceCard {
  const title = sourceDocument.metadata.title || sourceDocument.title;
  const authors = sourceDocument.metadata.author
    ? splitAuthorList(sourceDocument.metadata.author)
    : ["Author metadata required"];
  const year = sourceDocument.metadata.year ?? "Year metadata required";
  const apa7Status = mapCitationReadinessToApa7Status(
    sourceDocument.citationReadiness
  );

  return {
    sourceId: sourceDocument.id,
    title,
    authors,
    year,
    sourceType: mapSourceDocumentTypeToSourceCardType(sourceDocument.fileType),
    publisherOrJournal:
      sourceDocument.metadata.publisher ?? "Publisher or journal metadata required",
    citationText: createDraftCitationText(sourceDocument, authors, year, title),
    apa7Status,
    reliabilityLevel: mapCitationReadinessToReliabilityLevel(
      sourceDocument.citationReadiness
    ),
    notes: [
      "Local mock SourceCard derived from SourceDocument. Verification required before use as evidence.",
      `fileName: ${sourceDocument.fileName}`,
      `projectId: ${sourceDocument.projectId}`,
      `parserStatus: ${sourceDocument.parserStatus}`,
      `indexedAt: ${sourceDocument.indexedAt}`,
      `chapterRelevance: ${sourceDocument.chapterRelevance}`,
      `metadataCompleteness: ${sourceDocument.metadata.completeness}`,
      sourceDocument.metadata.doiOrUrl
        ? `doiOrUrl: ${sourceDocument.metadata.doiOrUrl}`
        : "doiOrUrl: metadata required",
      `linkedChapterSections: ${normalizeLinkedChapterSectionIds(
        sourceDocument.linkedChapterSections
      ).join(", ") || "none"}`
    ].join("\n")
  };
}

export function sourceDocumentsToSourceCards(
  sourceDocuments: SourceDocument[]
): SourceCard[] {
  return sourceDocuments.map(sourceDocumentToSourceCard);
}

export function normalizeChapterSectionId(sectionId: string): ChapterSectionId | null {
  return legacySectionIdMap[sectionId.trim().toLowerCase()] ?? null;
}

export function normalizeLinkedChapterSectionIds(
  sectionIds: string[]
): ChapterSectionId[] {
  const normalizedIds = new Set<ChapterSectionId>();

  sectionIds.forEach((sectionId) => {
    const normalizedId = normalizeChapterSectionId(sectionId);
    if (normalizedId) {
      normalizedIds.add(normalizedId);
    }
  });

  return LOCKED_CORE_SECTIONS.map((section) => section.sectionId).filter((sectionId) =>
    normalizedIds.has(sectionId)
  );
}

function mapCitationReadinessToApa7Status(
  citationReadiness: SourceDocument["citationReadiness"]
): Apa7Status {
  if (citationReadiness === "ready") {
    return "ready";
  }

  if (citationReadiness === "missing_metadata") {
    return "needs_metadata";
  }

  return "needs_review";
}

function mapCitationReadinessToReliabilityLevel(
  citationReadiness: SourceDocument["citationReadiness"]
): SourceReliabilityLevel {
  return citationReadiness === "ready" ? "medium" : "unknown";
}

function mapSourceDocumentTypeToSourceCardType(
  fileType: SourceDocumentType
): SourceCard["sourceType"] {
  return fileType;
}

function createDraftCitationText(
  sourceDocument: SourceDocument,
  authors: string[],
  year: string,
  title: string
): string {
  const firstAuthor = authors[0] ?? "Author metadata required";
  const isMetadataIncomplete =
    !sourceDocument.metadata.author ||
    !sourceDocument.metadata.year ||
    sourceDocument.metadata.completeness !== "complete";
  const marker = isMetadataIncomplete
    ? "[DRAFT - metadata required]"
    : "[DRAFT - verification required]";

  return `${firstAuthor} (${year}). ${title}. ${marker}`;
}

function splitAuthorList(authorValue: string): string[] {
  return authorValue
    .split(/\s*(?:;|,|\band\b|&)\s*/i)
    .map((author) => author.trim())
    .filter(Boolean);
}
