import type { SourceDocument } from "../../types/domain";

export const sourceDocuments: SourceDocument[] = [
  {
    id: "doc-service-quality-journal",
    projectId: "project-product-service",
    title: "Service Quality Journal A",
    fileName: "Service Quality Journal A.pdf",
    fileType: "PDF",
    metadata: {
      title: "Service Quality Journal A",
      author: "Author pending",
      year: "2024",
      doiOrUrl: "DOI pending",
      publisher: "Journal metadata pending",
      completeness: "partial"
    },
    citationReadiness: "needs_review",
    chapterRelevance: "high",
    indexedAt: "2026-06-01T08:30:00+07:00",
    parserStatus: "mock_indexed",
    summaryPreview:
      "Service quality is framed through expectations, delivery consistency, and recovery moments.",
    linkedChapterSections: ["what-is-it", "research-evidence", "success-factors"]
  },
  {
    id: "doc-service-encounter-chapter",
    projectId: "project-product-service",
    title: "Book Chapter 3 - Service Encounter",
    fileName: "Book Chapter 3 - Service Encounter.docx",
    fileType: "DOCX",
    metadata: {
      title: "Service Encounter",
      author: "Textbook author pending",
      year: "2023",
      doiOrUrl: "Internal textbook chapter",
      publisher: "ATP teaching material mock",
      completeness: "partial"
    },
    citationReadiness: "needs_review",
    chapterRelevance: "high",
    indexedAt: "2026-06-01T08:45:00+07:00",
    parserStatus: "mock_indexed",
    summaryPreview:
      "The chapter explains service encounters, touchpoints, and classroom-ready service process examples.",
    linkedChapterSections: ["key-components", "business-relevance", "manager-takeaway"]
  },
  {
    id: "doc-service-quality-notes",
    projectId: "project-product-service",
    title: "Service Quality Synthesis Notes",
    fileName: "Service Quality Synthesis.md",
    fileType: "MD",
    metadata: {
      title: "Service Quality Synthesis Notes",
      author: "ATP Knowledge Studio mock note",
      year: "2026",
      doiOrUrl: "Obsidian preview path only",
      publisher: "Mock vault preview",
      completeness: "complete"
    },
    citationReadiness: "ready",
    chapterRelevance: "medium",
    indexedAt: "2026-06-01T09:05:00+07:00",
    parserStatus: "mock_indexed",
    summaryPreview:
      "A mock synthesis note linking expectation gaps, service recovery, and perceived value.",
    linkedChapterSections: ["real-world-impact", "research-evidence"]
  }
];
