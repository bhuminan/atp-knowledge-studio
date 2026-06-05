import type { SavedSourceDocumentRecord } from "../persistence/LocalVaultDatabase";

export type SourceCardMetadataReviewGateStatus =
  | "ready_for_source_card_creation_review"
  | "needs_bibliographic_metadata_review"
  | "blocked";

export type SourceCardMetadataReviewGateChecklistStatus =
  | "passed"
  | "needs_review"
  | "warning"
  | "blocked"
  | "future_required";

export interface SourceCardMetadataReviewGateChecklistItem {
  detail: string;
  label: string;
  status: SourceCardMetadataReviewGateChecklistStatus;
}

export interface SourceCardMetadataReviewGatePreview {
  blockers: string[];
  checklist: SourceCardMetadataReviewGateChecklistItem[];
  deferredNotices: string[];
  futureAffordanceLabel: string;
  status: SourceCardMetadataReviewGateStatus;
  statusLabel: string;
  warnings: string[];
}

export interface SourceCardMetadataReviewEvidence {
  apaCandidateNotFinal?: boolean;
  apaFinalVerified?: boolean;
  authorsReviewed?: boolean;
  citationReadinessImplied?: boolean;
  citationTextReviewed?: boolean;
  containerReviewedIfApplicable?: boolean;
  doiOrUrlReviewedIfApplicable?: boolean;
  explicitFutureApprovalReady?: boolean;
  sourceCardAlreadyCreated?: boolean;
  yearReviewed?: boolean;
}

export function evaluateSourceCardMetadataReviewGate(
  detail: SavedSourceDocumentRecord,
  reviewEvidence: SourceCardMetadataReviewEvidence = {}
): SourceCardMetadataReviewGatePreview {
  const checklist: SourceCardMetadataReviewGateChecklistItem[] = [
    createChecklistItem(
      "SourceDocument root exists",
      "Saved SourceDocument root can be read from the local vault.",
      detail.sourceDocumentId.trim() ? "passed" : "blocked"
    ),
    createChecklistItem(
      "Read-back verified",
      "Selected detail is shown only after the saved SourceDocument root is read back.",
      detail.sourceDocumentId.trim() ? "passed" : "blocked"
    ),
    createChecklistItem(
      "Title present",
      "SourceCard review needs a stable source title.",
      detail.title.trim() ? "passed" : "blocked"
    ),
    createChecklistItem(
      "File name/source type present",
      "Source identity needs file name and source type before SourceCard review.",
      detail.fileName.trim() && detail.fileType.trim() ? "passed" : "blocked"
    ),
    createChecklistItem(
      "Intake provenance present or warning",
      detail.createdFromCandidateId.trim()
        ? "Candidate id / intake provenance is available."
        : "Missing provenance is a warning, not a blocker, while root identity remains reliable.",
      detail.createdFromCandidateId.trim() ? "passed" : "warning"
    ),
    createChecklistItem(
      "Authors reviewed",
      reviewEvidence.authorsReviewed
        ? "Authors were explicitly reviewed in metadata review evidence."
        : "Authors are not stored on the SourceDocument root and must be reviewed later.",
      reviewEvidence.authorsReviewed ? "passed" : "needs_review"
    ),
    createChecklistItem(
      "Year reviewed",
      reviewEvidence.yearReviewed
        ? "Year/date was explicitly reviewed in metadata review evidence."
        : "Year/date is not stored on the SourceDocument root and must be reviewed later.",
      reviewEvidence.yearReviewed ? "passed" : "needs_review"
    ),
    createChecklistItem(
      "DOI/URL reviewed if applicable",
      reviewEvidence.doiOrUrlReviewedIfApplicable
        ? "DOI/URL applicability was explicitly reviewed."
        : "DOI/URL is not inferred from title, file name, provider hints, or parser output.",
      reviewEvidence.doiOrUrlReviewedIfApplicable ? "passed" : "needs_review"
    ),
    createChecklistItem(
      "Journal/publisher/container reviewed if applicable",
      reviewEvidence.containerReviewedIfApplicable
        ? "Journal/publisher/container applicability was explicitly reviewed."
        : "Structured bibliographic container metadata remains future human review.",
      reviewEvidence.containerReviewedIfApplicable ? "passed" : "needs_review"
    ),
    createChecklistItem(
      "Citation text reviewed",
      reviewEvidence.citationReadinessImplied
        ? "Citation readiness cannot be implied by the preview."
        : reviewEvidence.citationTextReviewed
          ? "Citation text was explicitly reviewed in metadata review evidence."
          : "Citation text is not generated or marked ready by this preview.",
      reviewEvidence.citationReadinessImplied
        ? "blocked"
        : reviewEvidence.citationTextReviewed
          ? "passed"
          : "needs_review"
    ),
    createChecklistItem(
      "APA candidate not final",
      reviewEvidence.apaFinalVerified
        ? "APA-final verification cannot be produced by this preview."
        : reviewEvidence.apaCandidateNotFinal === false
          ? "APA candidate finality must be explicitly kept non-final."
          : "APA-final verification is not set or implied.",
      reviewEvidence.apaFinalVerified || reviewEvidence.apaCandidateNotFinal === false
        ? "blocked"
        : "passed"
    ),
    createChecklistItem(
      "Explicit future approval required",
      reviewEvidence.explicitFutureApprovalReady
        ? "Future approval requirement is represented in review evidence."
        : "A future sprint must require explicit approval before SourceCard creation.",
      reviewEvidence.explicitFutureApprovalReady ? "passed" : "future_required"
    ),
    createChecklistItem(
      "SourceCard not created yet",
      reviewEvidence.sourceCardAlreadyCreated
        ? "This intake review path must not create duplicate SourceCards."
        : "This preview does not create SourceCard or downstream records.",
      reviewEvidence.sourceCardAlreadyCreated ? "blocked" : "passed"
    )
  ];

  const blockers = checklist
    .filter((item) => item.status === "blocked")
    .map((item) => item.label);
  const warnings = [
    ...checklist
      .filter((item) => item.status === "warning")
      .map((item) => item.label),
    ...createSemanticWarnings(checklist, reviewEvidence)
  ];
  const hasMetadataReviewNeeds = checklist.some(
    (item) => item.status === "needs_review" || item.status === "future_required"
  );
  const status = getGateStatus({ blockers, hasMetadataReviewNeeds });

  return {
    blockers,
    checklist,
    deferredNotices: [
      "Preview only -- no SourceCard is created.",
      "Bibliographic metadata must be reviewed before SourceCard creation.",
      "Citation and APA readiness are not verified.",
      "Future action disabled until metadata review is complete.",
      "No final citation or APA-final state is created.",
      "No SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, citation, APA, extraction, provider, AI, export, or Writer records are created."
    ],
    futureAffordanceLabel: "Future: Create SourceCard after metadata review",
    status,
    statusLabel: sourceCardMetadataReviewGateStatusLabels[status],
    warnings
  };
}

function createSemanticWarnings(
  checklist: SourceCardMetadataReviewGateChecklistItem[],
  reviewEvidence: SourceCardMetadataReviewEvidence
): string[] {
  const warnings: string[] = [];
  const hasBibliographicNeeds = checklist.some(
    (item) =>
      item.status === "needs_review" &&
      [
        "Authors reviewed",
        "Year reviewed",
        "DOI/URL reviewed if applicable",
        "Journal/publisher/container reviewed if applicable",
        "Citation text reviewed"
      ].includes(item.label)
  );

  if (hasBibliographicNeeds) {
    warnings.push(
      "Missing bibliographic metadata requires review; metadata is not fabricated."
    );
  }

  if (!reviewEvidence.apaFinalVerified && !reviewEvidence.citationReadinessImplied) {
    warnings.push("Citation/APA finality is not implied.");
  }

  warnings.push("SourceCard remains deferred.");

  return warnings;
}

export const sourceCardMetadataReviewGateStatusLabels: Record<
  SourceCardMetadataReviewGateStatus,
  string
> = {
  blocked: "Blocked",
  needs_bibliographic_metadata_review: "Needs bibliographic metadata review",
  ready_for_source_card_creation_review:
    "Ready for SourceCard creation review"
};

function createChecklistItem(
  label: string,
  detail: string,
  status: SourceCardMetadataReviewGateChecklistStatus
): SourceCardMetadataReviewGateChecklistItem {
  return {
    detail,
    label,
    status
  };
}

function getGateStatus({
  blockers,
  hasMetadataReviewNeeds
}: {
  blockers: string[];
  hasMetadataReviewNeeds: boolean;
}): SourceCardMetadataReviewGateStatus {
  if (blockers.length > 0) {
    return "blocked";
  }

  if (hasMetadataReviewNeeds) {
    return "needs_bibliographic_metadata_review";
  }

  return "ready_for_source_card_creation_review";
}
