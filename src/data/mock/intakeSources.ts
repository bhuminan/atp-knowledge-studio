import type { IntakeSourceRecord } from "../../types/domain";

export const mockIntakeSources: IntakeSourceRecord[] = [
  {
    id: "intake-photo-book-page-service-quality",
    title: "Photographed book page - service quality gap",
    intakeSourceType: "image",
    originalFilename: "photo-book-page-service-quality.jpg",
    sourceLabel: "Photographed book page",
    extractionStatus: "needs_review",
    extractionResult: {
      extractedText:
        "Mock OCR text: service quality depends on expected service and perceived service.",
      cleanedText:
        "Service quality can be explained through the gap between expected service and perceived service.",
      summary:
        "A short textbook-style explanation of expectation and perception gaps.",
      keyConcepts: ["service quality", "expectation gap", "perceived service"],
      keyClaims: [
        "Service quality assessment compares expected service with perceived delivery."
      ],
      evidenceValue: "textbook_explanation",
      confidenceLevel: 58,
      warnings: [
        {
          id: "warn-photo-page-low-ocr-confidence",
          severity: "warning",
          message: "Low-confidence mock OCR because the source is a photographed page.",
          field: "extractedText"
        },
        {
          id: "warn-photo-page-citation-metadata",
          severity: "critical",
          message: "Book title, author, page number, and year are required before citation use.",
          field: "citationMetadataRequired"
        }
      ]
    },
    citationMetadataRequired: true,
    createdAt: "2026-06-02T09:00:00+07:00",
    updatedAt: "2026-06-02T09:05:00+07:00",
    notes:
      "Mock-only image intake. Do not treat OCR text or citation details as verified."
  },
  {
    id: "intake-screenshot-report-service-process",
    title: "Screenshot - service process report excerpt",
    intakeSourceType: "screenshot",
    originalFilename: "screenshot-service-process.png",
    sourceLabel: "Report screenshot",
    extractionStatus: "extracted",
    extractionResult: {
      extractedText:
        "Mock extracted text: service process visibility improves customer trust.",
      cleanedText:
        "Service process visibility may improve customer trust when touchpoints are clearly communicated.",
      summary:
        "A screenshot excerpt that may support a service process transparency claim.",
      keyConcepts: ["service process", "touchpoints", "customer trust"],
      keyClaims: [
        "Visible service processes can support customer trust during service delivery."
      ],
      evidenceValue: "research_finding",
      confidenceLevel: 74,
      warnings: [
        {
          id: "warn-screenshot-source-context",
          severity: "warning",
          message: "Screenshot needs original report URL or document metadata.",
          field: "sourceLabel"
        }
      ]
    },
    citationMetadataRequired: true,
    linkedSourceCardId: "manual-source-screenshot-service-process",
    createdAt: "2026-06-02T09:08:00+07:00",
    updatedAt: "2026-06-02T09:12:00+07:00",
    notes:
      "Mock screenshot intake linked to a draft local Source Card; verification required."
  },
  {
    id: "intake-scanned-page-service-encounter",
    title: "Scanned textbook page - service encounter",
    intakeSourceType: "scanned_page",
    originalFilename: "scan-service-encounter-page-42.tif",
    sourceLabel: "Scanned textbook page",
    extractionStatus: "needs_review",
    extractionResult: {
      extractedText:
        "Mock OCR text: service encounter includes people, process, and physical evidence.",
      cleanedText:
        "A service encounter can involve employees, service processes, and physical evidence.",
      summary:
        "A scanned page that may explain service encounter components for textbook prose.",
      keyConcepts: ["service encounter", "people", "process", "physical evidence"],
      keyClaims: [
        "Service encounters combine human interaction, processes, and evidence cues."
      ],
      evidenceValue: "framework",
      confidenceLevel: 62,
      warnings: [
        {
          id: "warn-scanned-page-ocr-review",
          severity: "warning",
          message: "Scanned page OCR needs human review before use.",
          field: "cleanedText"
        },
        {
          id: "warn-scanned-page-page-number",
          severity: "critical",
          message: "Page number and publication metadata are required for APA 7 citation.",
          field: "citationMetadataRequired"
        }
      ]
    },
    citationMetadataRequired: true,
    linkedSourceDocumentId: "doc-service-encounter-chapter",
    createdAt: "2026-06-02T09:15:00+07:00",
    updatedAt: "2026-06-02T09:18:00+07:00",
    notes:
      "Mock scanned-page intake. Linked document is only a local mock reference."
  },
  {
    id: "intake-pasted-note-service-recovery",
    title: "Pasted note - service recovery classroom idea",
    intakeSourceType: "pasted_text",
    sourceLabel: "Professor pasted note",
    extractionStatus: "extracted",
    extractionResult: {
      extractedText:
        "Service recovery example: explain apology, compensation, and follow-up.",
      cleanedText:
        "A service recovery teaching note can compare apology, compensation, and follow-up actions.",
      summary:
        "A local teaching note for explaining service recovery actions in class.",
      keyConcepts: ["service recovery", "apology", "compensation", "follow-up"],
      keyClaims: [
        "Service recovery can be taught through apology, compensation, and follow-up examples."
      ],
      evidenceValue: "teaching_note",
      confidenceLevel: 82,
      warnings: [
        {
          id: "warn-pasted-note-not-evidence",
          severity: "info",
          message: "Pasted teaching note is useful for instruction but not citation evidence.",
          field: "evidenceValue"
        }
      ]
    },
    citationMetadataRequired: false,
    createdAt: "2026-06-02T09:20:00+07:00",
    updatedAt: "2026-06-02T09:22:00+07:00",
    notes:
      "Local pasted text mock. Suitable as teaching support, not verified research evidence."
  },
  {
    id: "intake-pdf-service-quality-queued",
    title: "PDF intake - service quality article queued",
    intakeSourceType: "pdf",
    originalFilename: "service-quality-article-queued.pdf",
    sourceLabel: "Academic PDF",
    extractionStatus: "queued",
    citationMetadataRequired: true,
    linkedSourceDocumentId: "doc-service-quality-journal",
    createdAt: "2026-06-02T09:25:00+07:00",
    updatedAt: "2026-06-02T09:25:00+07:00",
    notes:
      "Mock queued PDF intake only. No parser, OCR, upload, or storage has run."
  },
  {
    id: "intake-diagram-table-service-blueprint",
    title: "Diagram/table image - service blueprint metrics",
    intakeSourceType: "image",
    originalFilename: "service-blueprint-table.png",
    sourceLabel: "Diagram and table image",
    extractionStatus: "needs_review",
    extractionResult: {
      extractedText:
        "Mock vision text: waiting time, touchpoint, failure point, recovery owner.",
      cleanedText:
        "A service blueprint table may organize waiting time, touchpoints, failure points, and recovery owners.",
      summary:
        "A diagram/table image that could become a framework box or classroom exhibit.",
      keyConcepts: ["service blueprint", "touchpoint", "failure point", "KPI"],
      keyClaims: [
        "Service blueprint tables can connect touchpoints, failure points, and recovery responsibility."
      ],
      evidenceValue: "table",
      confidenceLevel: 54,
      warnings: [
        {
          id: "warn-diagram-table-structure",
          severity: "warning",
          message: "Table structure needs manual review before converting to evidence.",
          field: "cleanedText"
        },
        {
          id: "warn-diagram-table-citation",
          severity: "warning",
          message: "Original diagram source metadata is missing.",
          field: "citationMetadataRequired"
        }
      ]
    },
    citationMetadataRequired: true,
    createdAt: "2026-06-02T09:30:00+07:00",
    updatedAt: "2026-06-02T09:34:00+07:00",
    notes:
      "Mock diagram/table intake. Human review required before evidence or visual reuse."
  }
];
