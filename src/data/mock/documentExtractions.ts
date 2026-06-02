import {
  documentExtractionToSourceDocumentCandidate,
  summarizeDocumentExtractionReadiness,
  type DocumentExtractionMappingInput
} from "../../lib/sources/DocumentExtractionMapper";
import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionTrace,
  FileIntakeJob
} from "../../types/domain";

export interface MockDocumentExtractionRecord extends DocumentExtractionMappingInput {
  scenarioLabel: string;
}

export const mockFileIntakeJobs: FileIntakeJob[] = [
  {
    id: "file-intake-service-quality-pdf",
    fileName: "service-quality-expectations-article.pdf",
    fileType: "PDF",
    mimeType: "application/pdf",
    fileSize: 1843200,
    createdAt: "2026-06-02T10:10:00+07:00",
    status: "extracted"
  },
  {
    id: "file-intake-service-encounter-docx",
    fileName: "service-encounter-chapter-draft.docx",
    fileType: "DOCX",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 642000,
    createdAt: "2026-06-02T10:20:00+07:00",
    status: "needs_review"
  }
];

export const mockDocumentTextExtractions: DocumentTextExtraction[] = [
  {
    documentId: "file-intake-service-quality-pdf",
    rawText:
      "Service quality is shaped by expected service, perceived performance, and recovery after failure. Empirical studies often connect customer satisfaction with reliability, responsiveness, and assurance in service encounters.",
    cleanedText:
      "Service quality can be interpreted as the customer's evaluation of expected service compared with perceived service performance. For academic writing, the document is useful for framing reliability, responsiveness, assurance, and service recovery as evidence-backed dimensions of service delivery.",
    extractionStatus: "extracted",
    extractionWarnings: [
      {
        warningId: "warning-pdf-metadata-incomplete",
        code: "missing_metadata",
        severity: "warning",
        message:
          "Bibliographic metadata remains incomplete; author list, publication year, and journal details require human review.",
        field: "metadata"
      }
    ],
    confidenceScore: 86
  },
  {
    documentId: "file-intake-service-encounter-docx",
    rawText:
      "Draft chapter material describes service encounter management, blueprint touchpoints, staff-customer interaction, and managerial implications for recovery design.",
    cleanedText:
      "The DOCX manuscript draft explains service encounters through touchpoints, frontline interaction, service blueprint logic, and managerial implications for recovery design. Some paragraphs are incomplete and need editor review before conversion into reusable evidence.",
    extractionStatus: "needs_review",
    extractionWarnings: [
      {
        warningId: "warning-docx-low-confidence-case-segment",
        code: "low_confidence",
        severity: "warning",
        message:
          "The case segment has low extraction confidence because the manuscript contains incomplete headings and draft placeholders.",
        field: "segment-service-encounter-case"
      },
      {
        warningId: "warning-docx-metadata-incomplete",
        code: "missing_metadata",
        severity: "critical",
        message:
          "Manuscript metadata is incomplete; author, version, and source status must be confirmed before citation or vault use.",
        field: "metadata"
      }
    ],
    confidenceScore: 68
  }
];

export const mockDocumentSegments: DocumentSegment[] = [
  {
    segmentId: "segment-service-quality-introduction",
    documentId: "file-intake-service-quality-pdf",
    title: "Service quality as expectation-performance comparison",
    content:
      "The introduction frames service quality as an evaluative comparison between expected service and perceived delivery.",
    pageStart: 1,
    pageEnd: 2,
    tags: ["service quality", "expectations", "perceived service"],
    segmentType: "introduction"
  },
  {
    segmentId: "segment-service-quality-theory",
    documentId: "file-intake-service-quality-pdf",
    title: "Reliability and responsiveness as service dimensions",
    content:
      "The theory section organizes reliability, responsiveness, assurance, and recovery as dimensions for evaluating service delivery.",
    pageStart: 3,
    pageEnd: 5,
    tags: ["reliability", "responsiveness", "assurance"],
    segmentType: "theory"
  },
  {
    segmentId: "segment-service-quality-evidence",
    documentId: "file-intake-service-quality-pdf",
    title: "Satisfaction and service performance evidence",
    content:
      "The evidence segment links service performance consistency and recovery quality to customer satisfaction outcomes.",
    pageStart: 6,
    pageEnd: 8,
    tags: ["customer satisfaction", "service recovery", "evidence"],
    segmentType: "evidence"
  },
  {
    segmentId: "segment-service-quality-implication",
    documentId: "file-intake-service-quality-pdf",
    title: "Managerial implications for service recovery",
    content:
      "The implication segment suggests that managers should monitor failure points and recovery speed across the service process.",
    pageStart: 9,
    pageEnd: 10,
    tags: ["managerial implication", "recovery speed", "failure point"],
    segmentType: "implication"
  },
  {
    segmentId: "segment-service-encounter-introduction",
    documentId: "file-intake-service-encounter-docx",
    title: "Service encounter chapter overview",
    content:
      "The introduction explains that service encounters combine customer expectations, employee behavior, process design, and physical cues.",
    pageStart: 1,
    pageEnd: 2,
    tags: ["service encounter", "frontline interaction"],
    segmentType: "introduction"
  },
  {
    segmentId: "segment-service-encounter-theory",
    documentId: "file-intake-service-encounter-docx",
    title: "Blueprint logic and encounter theory",
    content:
      "The theory segment connects touchpoints, line of visibility, backstage support, and recovery ownership.",
    pageStart: 3,
    pageEnd: 4,
    tags: ["service blueprint", "touchpoints", "visibility"],
    segmentType: "theory"
  },
  {
    segmentId: "segment-service-encounter-evidence",
    documentId: "file-intake-service-encounter-docx",
    title: "Evidence placeholders for encounter design",
    content:
      "The evidence segment contains draft placeholders and requires verified sources before it can be used as evidence.",
    pageStart: 5,
    pageEnd: 5,
    tags: ["evidence placeholder", "needs source"],
    segmentType: "evidence"
  },
  {
    segmentId: "segment-service-encounter-case",
    documentId: "file-intake-service-encounter-docx",
    title: "Draft case example for service recovery",
    content:
      "The case segment describes a classroom example about apology, compensation, and follow-up, but the organization and source are not verified.",
    pageStart: 6,
    pageEnd: 7,
    tags: ["case example", "service recovery", "needs verification"],
    segmentType: "case"
  },
  {
    segmentId: "segment-service-encounter-implication",
    documentId: "file-intake-service-encounter-docx",
    title: "Managerial implications for encounter design",
    content:
      "The implication segment recommends assigning recovery ownership and measuring waiting time across service touchpoints.",
    pageStart: 8,
    pageEnd: 9,
    tags: ["managerial implication", "waiting time", "ownership"],
    segmentType: "implication"
  }
];

export const mockExtractionTraces: ExtractionTrace[] = [
  {
    sourceDocumentId: "file-intake-service-quality-pdf",
    pageNumber: 1,
    sectionTitle: "Service quality as expectation-performance comparison",
    segmentId: "segment-service-quality-introduction",
    chunkReference: "pdf:p1:c1"
  },
  {
    sourceDocumentId: "file-intake-service-quality-pdf",
    pageNumber: 3,
    sectionTitle: "Reliability and responsiveness as service dimensions",
    segmentId: "segment-service-quality-theory",
    chunkReference: "pdf:p3:c1"
  },
  {
    sourceDocumentId: "file-intake-service-quality-pdf",
    pageNumber: 6,
    sectionTitle: "Satisfaction and service performance evidence",
    segmentId: "segment-service-quality-evidence",
    chunkReference: "pdf:p6:c2"
  },
  {
    sourceDocumentId: "file-intake-service-encounter-docx",
    pageNumber: 1,
    sectionTitle: "Service encounter chapter overview",
    segmentId: "segment-service-encounter-introduction",
    chunkReference: "docx:heading-1:p1"
  },
  {
    sourceDocumentId: "file-intake-service-encounter-docx",
    pageNumber: 3,
    sectionTitle: "Blueprint logic and encounter theory",
    segmentId: "segment-service-encounter-theory",
    chunkReference: "docx:heading-2:p3"
  },
  {
    sourceDocumentId: "file-intake-service-encounter-docx",
    pageNumber: 5,
    sectionTitle: "Evidence placeholders for encounter design",
    segmentId: "segment-service-encounter-evidence",
    chunkReference: "docx:heading-3:p5"
  },
  {
    sourceDocumentId: "file-intake-service-encounter-docx",
    pageNumber: 6,
    sectionTitle: "Draft case example for service recovery",
    segmentId: "segment-service-encounter-case",
    chunkReference: "docx:heading-4:p6"
  },
  {
    sourceDocumentId: "file-intake-service-encounter-docx",
    pageNumber: 8,
    sectionTitle: "Managerial implications for encounter design",
    segmentId: "segment-service-encounter-implication",
    chunkReference: "docx:heading-5:p8"
  }
];

export const mockDocumentExtractionRecords: MockDocumentExtractionRecord[] = [
  {
    scenarioLabel:
      "PDF academic article with incomplete metadata and one missing segment trace",
    fileIntakeJob: mockFileIntakeJobs[0],
    extraction: mockDocumentTextExtractions[0],
    segments: mockDocumentSegments.filter(
      (segment) => segment.documentId === "file-intake-service-quality-pdf"
    ),
    traces: mockExtractionTraces.filter(
      (trace) => trace.sourceDocumentId === "file-intake-service-quality-pdf"
    )
  },
  {
    scenarioLabel:
      "DOCX manuscript chapter with low-confidence case segment and incomplete metadata",
    fileIntakeJob: mockFileIntakeJobs[1],
    extraction: mockDocumentTextExtractions[1],
    segments: mockDocumentSegments.filter(
      (segment) => segment.documentId === "file-intake-service-encounter-docx"
    ),
    traces: mockExtractionTraces.filter(
      (trace) => trace.sourceDocumentId === "file-intake-service-encounter-docx"
    )
  }
];

export const mockDocumentExtractionReadinessSummaries =
  mockDocumentExtractionRecords.map((record) =>
    summarizeDocumentExtractionReadiness(record)
  );

export const mockSourceDocumentCandidates = mockDocumentExtractionRecords.map(
  (record) => documentExtractionToSourceDocumentCandidate(record)
);
