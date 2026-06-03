export type ParserReadinessStatus =
  | "ready_for_docx_mvp"
  | "needs_contract_cleanup"
  | "blocked";

export type FileParserReadinessStatus =
  | "ready_for_docx_mvp"
  | "needs_review"
  | "blocked";

export interface ParserReadinessPreview {
  blockers: string[];
  dependencyDecisionNeeded: string[];
  docxReadinessStatus: FileParserReadinessStatus;
  evidenceTraceReadiness: string;
  extractionSegmentReadiness: string;
  missingContracts: string[];
  parserReadinessStatus: ParserReadinessStatus;
  pdfReadinessStatus: FileParserReadinessStatus;
  provenanceReadiness: string;
  recommendedNextAction: string;
  storageReadiness: string;
  supportedCandidateTypes: string[];
  warnings: string[];
}

export function mapRealParserReadiness(): ParserReadinessPreview {
  const missingContracts = [
    "Parser adapter interface is not isolated from the Tauri command boundary yet.",
    "Parser dependency policy has not been evaluated against DOCX/PDF security and maintenance risks.",
    "PDF page/layout provenance rules are not defined."
  ];
  const blockers = [
    "PDF parser MVP is blocked until page, layout, and OCR boundaries are designed.",
    "Real parser sprint must choose a DOCX dependency strategy before implementation."
  ];
  const warnings = [
    "Current DOCX extraction is a review-gated preview path; do not treat it as final parser capability.",
    "DOCX page numbers remain untrusted because paragraph references are chunk-based.",
    "No real PDF extraction exists."
  ];

  return {
    blockers,
    dependencyDecisionNeeded: [
      "Evaluate DOCX parser dependency for WordprocessingML coverage, security posture, bundle size, and Tauri compatibility.",
      "Defer PDF dependency selection until DOCX extraction contracts are proven."
    ],
    docxReadinessStatus: "ready_for_docx_mvp",
    evidenceTraceReadiness:
      "Ready for DOCX chunk references with untrusted page numbers; not ready for PDF page-level provenance.",
    extractionSegmentReadiness:
      "Ready for DOCX heading/paragraph segment previews with review gates.",
    missingContracts,
    parserReadinessStatus: "needs_contract_cleanup",
    pdfReadinessStatus: "blocked",
    provenanceReadiness:
      "Local file metadata and chunk references are available; parser adapter provenance still needs a stable contract.",
    recommendedNextAction:
      "Run a DOCX-first parser MVP sprint that isolates a parser adapter, preserves SourceDocument candidate mapping, and keeps PDF deferred.",
    storageReadiness:
      "SourceDocument, ExtractionRun, ExtractionSegment, and EvidenceTrace save/read paths are ready for reviewed parser output.",
    supportedCandidateTypes: ["DOCX SourceDocument candidate", "DOCX ExtractionSegment", "DOCX EvidenceTrace"],
    warnings
  };
}
