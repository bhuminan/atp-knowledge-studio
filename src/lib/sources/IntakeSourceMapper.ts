import type {
  IntakeMappingReadiness,
  IntakeSourceMappingResult,
  IntakeSourceRecord,
  IntakeWarning,
  SourceCard,
  SourceDocument,
  SourceDocumentType
} from "../../types/domain";

const incompatibleSourceDocumentTypes: IntakeSourceRecord["intakeSourceType"][] = [
  "image",
  "screenshot",
  "scanned_page",
  "pasted_text",
  "web_clip",
  "youtube"
];

export function evaluateIntakeMappingReadiness(
  intake: IntakeSourceRecord
): IntakeSourceMappingResult {
  const warnings = [...(intake.extractionResult?.warnings ?? [])];
  const notes = createBaseNotes(intake);
  const extractionBlocked = isExtractionBlocked(intake);
  const reviewBlocked = intake.reviewStatus === "needs_text_review" || intake.reviewStatus === "rejected";
  const needsReview =
    intake.extractionStatus === "needs_review" ||
    intake.reviewStatus === "needs_metadata" ||
    intake.reviewStatus === "new" ||
    !intake.approvedForVault;
  const canCreateSourceDocument =
    Boolean(intake.approvedForVault) && !extractionBlocked && intake.reviewStatus !== "rejected";
  const canCreateSourceCardCandidate =
    Boolean(intake.citationUseAllowed) &&
    !intake.citationMetadataRequired &&
    !extractionBlocked &&
    intake.reviewStatus !== "rejected";
  const sourceDocumentCandidate = canCreateSourceDocument
    ? intakeSourceToSourceDocumentCandidate(intake)
    : undefined;
  const sourceCardCandidate = canCreateSourceCardCandidate
    ? intakeSourceToSourceCardCandidate(intake)
    : undefined;

  if (extractionBlocked) {
    notes.push("Mapping blocked until extraction has completed or been reviewed.");
  }

  if (reviewBlocked) {
    notes.push("Review status blocks downstream candidate creation.");
  }

  if (needsReview && !reviewBlocked && !extractionBlocked) {
    notes.push("Mapping needs human review before creating downstream records.");
  }

  if (intake.citationMetadataRequired && !intake.citationUseAllowed) {
    notes.push("Citation metadata is required; SourceCard candidate cannot be citation-ready.");
  }

  if (incompatibleSourceDocumentTypes.includes(intake.intakeSourceType)) {
    notes.push(
      `Current SourceDocumentType cannot directly represent ${intake.intakeSourceType}.`
    );
  }

  return {
    intakeSourceId: intake.id,
    readiness: getReadiness({
      canCreateSourceCardCandidate,
      canCreateSourceDocument,
      extractionBlocked,
      needsReview,
      reviewBlocked
    }),
    canCreateSourceDocument,
    canCreateSourceCardCandidate,
    sourceDocumentCandidate,
    sourceCardCandidate,
    warnings,
    notes
  };
}

export function intakeSourceToSourceDocumentCandidate(
  intake: IntakeSourceRecord
): Partial<SourceDocument> {
  const sourceDocumentType = mapIntakeSourceTypeToSourceDocumentType(intake);

  return {
    id: `candidate-document-${intake.id}`,
    projectId: "project-product-service",
    title: intake.title,
    fileName: intake.originalFilename ?? `${intake.id}.mock`,
    fileType: sourceDocumentType,
    metadata: {
      title: intake.title,
      author: "Metadata required",
      year: "Metadata required",
      doiOrUrl: intake.sourceLabel ?? "Metadata required",
      publisher: "Metadata required",
      completeness: intake.citationMetadataRequired ? "missing" : "partial"
    },
    citationReadiness: intake.citationUseAllowed ? "needs_review" : "missing_metadata",
    chapterRelevance: "medium",
    indexedAt: intake.updatedAt,
    parserStatus: "mock_needs_review",
    summaryPreview:
      intake.extractionResult?.summary ??
      "Mock intake candidate preview. Extraction summary is not available.",
    linkedChapterSections: []
  };
}

export function intakeSourceToSourceCardCandidate(
  intake: IntakeSourceRecord
): Partial<SourceCard> {
  const sourceType = mapIntakeSourceTypeToSourceDocumentType(intake);
  const confidenceLevel = intake.extractionResult?.confidenceLevel;

  return {
    sourceId: `candidate-card-${intake.id}`,
    title: intake.title,
    authors: ["Metadata required"],
    year: "Metadata required",
    sourceType,
    publisherOrJournal: intake.sourceLabel ?? "Metadata required",
    citationText: `${intake.title}. [DRAFT - intake candidate, verification required]`,
    apa7Status: intake.citationUseAllowed ? "needs_review" : "needs_metadata",
    reliabilityLevel:
      confidenceLevel !== undefined && confidenceLevel >= 80 ? "medium" : "unknown",
    notes: [
      "Preview-only SourceCard candidate. No SourceCard is created.",
      `intakeSourceType: ${intake.intakeSourceType}`,
      `extractionStatus: ${intake.extractionStatus}`,
      `citationMetadataRequired: ${intake.citationMetadataRequired}`,
      `confidenceLevel: ${confidenceLevel ?? "pending"}`,
      "mockOnly: true"
    ].join("\n")
  };
}

export function intakeSourcesToMappingResults(
  intakes: IntakeSourceRecord[]
): IntakeSourceMappingResult[] {
  return intakes.map(evaluateIntakeMappingReadiness);
}

function createBaseNotes(intake: IntakeSourceRecord): string[] {
  return [
    "Preview only; no SourceDocument or SourceCard is created.",
    "No OCR, provider call, parser, storage, database, or file IO has run.",
    `intakeSourceType: ${intake.intakeSourceType}`,
    `extractionStatus: ${intake.extractionStatus}`,
    `reviewStatus: ${intake.reviewStatus ?? "new"}`
  ];
}

function isExtractionBlocked(intake: IntakeSourceRecord): boolean {
  return (
    intake.extractionStatus === "queued" ||
    intake.extractionStatus === "extracting" ||
    intake.extractionStatus === "failed" ||
    intake.extractionStatus === "not_started"
  );
}

function getReadiness({
  canCreateSourceCardCandidate,
  canCreateSourceDocument,
  extractionBlocked,
  needsReview,
  reviewBlocked
}: {
  canCreateSourceCardCandidate: boolean;
  canCreateSourceDocument: boolean;
  extractionBlocked: boolean;
  needsReview: boolean;
  reviewBlocked: boolean;
}): IntakeMappingReadiness {
  if (canCreateSourceCardCandidate) {
    return "ready_for_source_card_candidate";
  }

  if (canCreateSourceDocument) {
    return "ready_for_source_document";
  }

  if (extractionBlocked || reviewBlocked) {
    return "blocked";
  }

  if (needsReview) {
    return "needs_review";
  }

  return "needs_review";
}

function mapIntakeSourceTypeToSourceDocumentType(
  intake: IntakeSourceRecord
): SourceDocumentType | undefined {
  if (intake.intakeSourceType === "pdf") {
    return "PDF";
  }

  if (intake.intakeSourceType === "docx") {
    return "DOCX";
  }

  if (intake.intakeSourceType === "markdown") {
    return "MD";
  }

  return undefined;
}
