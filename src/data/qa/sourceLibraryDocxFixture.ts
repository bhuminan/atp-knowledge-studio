import type { DocumentExtractionResponse } from "../../lib/sources/LocalDocumentExtraction";
import type { LocalDocumentFileIntakeJob } from "../../lib/sources/LocalDocumentFilePicker";

export const qaDocxLocalFile: LocalDocumentFileIntakeJob = {
  createdAt: "2026-06-02T12:00:00.000Z",
  fileName: "qa-service-quality-chapter.docx",
  fileSize: 42816,
  fileType: "DOCX",
  id: "qa-docx-file-intake-job",
  localPath: "qa-fixtures/qa-service-quality-chapter.docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  status: "not_started"
};

export const qaDocxExtractionResponse: DocumentExtractionResponse = {
  fileIntakeJob: qaDocxLocalFile,
  extraction: {
    confidenceScore: 86,
    cleanedText:
      "Service Quality is a managerial framework for understanding how customers evaluate service performance against expectations. คุณภาพการบริการเป็นแนวคิดสำคัญในการบริหารการตลาดบริการ เพราะช่วยอธิบายช่องว่างระหว่างสิ่งที่ลูกค้าคาดหวังกับสิ่งที่ได้รับจริง. A small evidence table links reliability, responsiveness, assurance, empathy, and tangibles to review notes. Case example: a Bangkok service counter reduced complaint escalation by redesigning queue communication and staff recovery scripts.",
    documentId: "qa-docx-file-intake-job",
    extractionStatus: "extracted",
    extractionWarnings: [
      {
        code: "missing_metadata",
        field: "source_metadata",
        message:
          "Author, year, and publisher metadata are not verified for citation use.",
        severity: "warning",
        warningId: "qa-warning-missing-metadata"
      }
    ],
    rawText:
      "Heading: Service Quality\nService Quality is a managerial framework for understanding how customers evaluate service performance against expectations.\nคุณภาพการบริการเป็นแนวคิดสำคัญในการบริหารการตลาดบริการ เพราะช่วยอธิบายช่องว่างระหว่างสิ่งที่ลูกค้าคาดหวังกับสิ่งที่ได้รับจริง.\nTable: reliability | responsiveness | assurance | empathy | tangibles\nCase example: a Bangkok service counter reduced complaint escalation by redesigning queue communication and staff recovery scripts."
  },
  parserWarnings: [
    {
      code: "tables_flattened",
      field: "word/document.xml",
      message:
        "A DOCX table was flattened into plain text for preview. Review structure before evidence use.",
      severity: "info",
      warningId: "qa-warning-table-flattened"
    }
  ],
  segments: [
    {
      content:
        "Service Quality is a managerial framework for understanding how customers evaluate service performance against expectations.",
      documentId: "qa-docx-file-intake-job",
      pageEnd: 0,
      pageStart: 0,
      segmentId: "qa-segment-introduction",
      segmentType: "introduction",
      tags: ["service quality", "expectations"],
      title: "Service Quality Overview"
    },
    {
      content:
        "คุณภาพการบริการเป็นแนวคิดสำคัญในการบริหารการตลาดบริการ เพราะช่วยอธิบายช่องว่างระหว่างสิ่งที่ลูกค้าคาดหวังกับสิ่งที่ได้รับจริง.",
      documentId: "qa-docx-file-intake-job",
      pageEnd: 0,
      pageStart: 0,
      segmentId: "qa-segment-theory-thai",
      segmentType: "theory",
      tags: ["service marketing", "thai textbook prose"],
      title: "Thai Textbook Explanation"
    },
    {
      content:
        "A small evidence table links reliability, responsiveness, assurance, empathy, and tangibles to review notes.",
      documentId: "qa-docx-file-intake-job",
      pageEnd: 0,
      pageStart: 0,
      segmentId: "qa-segment-table",
      segmentType: "evidence",
      tags: ["table", "dimensions"],
      title: "Flattened Table Evidence"
    },
    {
      content:
        "Case example: a Bangkok service counter reduced complaint escalation by redesigning queue communication and staff recovery scripts.",
      documentId: "qa-docx-file-intake-job",
      pageEnd: 0,
      pageStart: 0,
      segmentId: "qa-segment-case",
      segmentType: "case",
      tags: ["case example", "service recovery"],
      title: "Bangkok Service Counter Case"
    }
  ],
  traces: [
    {
      chunkReference: "docx:p1",
      pageNumber: 0,
      sectionTitle: "Service Quality Overview",
      segmentId: "qa-segment-introduction",
      sourceDocumentId: "qa-docx-file-intake-job"
    },
    {
      chunkReference: "docx:p2",
      pageNumber: 0,
      sectionTitle: "Thai Textbook Explanation",
      segmentId: "qa-segment-theory-thai",
      sourceDocumentId: "qa-docx-file-intake-job"
    },
    {
      chunkReference: "docx:tbl1",
      pageNumber: 0,
      sectionTitle: "Flattened Table Evidence",
      segmentId: "qa-segment-table",
      sourceDocumentId: "qa-docx-file-intake-job"
    },
    {
      chunkReference: "docx:p3",
      pageNumber: 0,
      sectionTitle: "Bangkok Service Counter Case",
      segmentId: "qa-segment-case",
      sourceDocumentId: "qa-docx-file-intake-job"
    }
  ]
};
