import type { SourceItem, SourceSummary } from "../../types/domain";

export const sourceItems: SourceItem[] = [
  {
    id: "source-paper-a",
    projectId: "project-product-service",
    type: "pdf",
    title: "Service Quality Journal A.pdf",
    pathOrUrl: "/mock/sources/service-quality-journal-a.pdf",
    status: "inbox",
    metadata: {
      author: "Author pending",
      year: "2024",
      journal: "Journal metadata pending",
      sourceLabel: "Academic paper"
    },
    confidence: 78,
    createdAt: "2026-05-31T09:40:00+07:00"
  },
  {
    id: "source-book-chapter",
    projectId: "project-product-service",
    type: "docx",
    title: "Book Chapter 3 - Service Encounter.docx",
    pathOrUrl: "/mock/sources/book-chapter-3.docx",
    status: "analyzing",
    metadata: {
      sourceLabel: "Book chapter"
    },
    confidence: 81,
    createdAt: "2026-05-31T09:42:00+07:00"
  },
  {
    id: "source-screenshot",
    projectId: "project-product-service",
    type: "screenshot",
    title: "Screenshot_01_Service_Process.png",
    pathOrUrl: "/mock/sources/screenshot-01.png",
    status: "analyzing",
    metadata: {
      sourceLabel: "Lecture screenshot"
    },
    extractedText: "Mock OCR text about service process and touchpoints",
    confidence: 73,
    createdAt: "2026-05-31T09:48:00+07:00"
  },
  {
    id: "source-youtube-imc",
    projectId: "project-imc",
    type: "youtube",
    title: "IMC 2025 lecture",
    pathOrUrl: "https://example.com/mock-youtube-link",
    status: "analyzing",
    metadata: {
      sourceLabel: "YouTube link",
      accessedAt: "2026-05-31"
    },
    confidence: 66,
    createdAt: "2026-05-31T09:45:00+07:00"
  },
  {
    id: "source-web-clip",
    projectId: "project-marketing-articles",
    type: "web_clip",
    title: "Retail service recovery web clip",
    pathOrUrl: "https://example.com/mock-web-clip",
    status: "completed",
    metadata: {
      sourceLabel: "Selected text + URL",
      accessedAt: "2026-05-31"
    },
    confidence: 70,
    createdAt: "2026-05-31T08:55:00+07:00"
  }
];

export const sourceSummaries: SourceSummary[] = [
  {
    id: "summary-paper-a",
    sourceId: "source-paper-a",
    keyTakeaways: [
      "Service quality should be evaluated across expectation, delivery, and recovery moments.",
      "Customer perception often depends on consistency across touchpoints.",
      "Measurement quality requires clear linkage between construct and context."
    ],
    claims: [
      "Service quality affects customer loyalty through perceived value.",
      "Service recovery can reduce dissatisfaction when handled transparently."
    ],
    examples: ["Mock hotel service recovery example pending verification"],
    citationClues: ["Author/year metadata incomplete", "APA7 record not final"],
    citationGapWarnings: ["Case example is not verified and must not be used as final evidence"]
  }
];
