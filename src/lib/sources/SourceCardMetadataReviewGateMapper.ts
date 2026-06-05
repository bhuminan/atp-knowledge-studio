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

export function evaluateSourceCardMetadataReviewGate(
  detail: SavedSourceDocumentRecord
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
      "Authors are not stored on the SourceDocument root and must be reviewed later.",
      "needs_review"
    ),
    createChecklistItem(
      "Year reviewed",
      "Year/date is not stored on the SourceDocument root and must be reviewed later.",
      "needs_review"
    ),
    createChecklistItem(
      "DOI/URL reviewed if applicable",
      "DOI/URL is not inferred from title, file name, provider hints, or parser output.",
      "needs_review"
    ),
    createChecklistItem(
      "Journal/publisher/container reviewed if applicable",
      "Structured bibliographic container metadata remains future human review.",
      "needs_review"
    ),
    createChecklistItem(
      "Citation text reviewed",
      "Citation text is not generated or marked ready by this preview.",
      "needs_review"
    ),
    createChecklistItem(
      "APA candidate not final",
      "APA-final verification is not set or implied.",
      "passed"
    ),
    createChecklistItem(
      "Explicit future approval required",
      "A future sprint must require explicit approval before SourceCard creation.",
      "future_required"
    ),
    createChecklistItem(
      "SourceCard not created yet",
      "This preview does not create SourceCard or downstream records.",
      "passed"
    )
  ];

  const blockers = checklist
    .filter((item) => item.status === "blocked")
    .map((item) => item.label);
  const warnings = [
    ...checklist
      .filter((item) => item.status === "warning")
      .map((item) => item.label),
    "Missing bibliographic metadata requires review; metadata is not fabricated.",
    "Citation/APA finality is not implied.",
    "SourceCard remains deferred."
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
      "No final citation or APA-final state is created.",
      "No SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, citation, APA, extraction, provider, AI, export, or Writer records are created."
    ],
    futureAffordanceLabel: "Future: Create SourceCard after metadata review",
    status,
    statusLabel: sourceCardMetadataReviewGateStatusLabels[status],
    warnings
  };
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
