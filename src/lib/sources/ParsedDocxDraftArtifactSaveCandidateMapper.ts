import type {
  DraftArtifactSaveCandidate,
  DraftSectionSaveCandidate
} from "../../types/domain";
import type {
  SavedKnowledgeCardListItem,
  SavedSourceCardDetail,
  SavedSourceCardTagRecord,
  SavedSourceDocumentDetail
} from "../persistence/LocalVaultDatabase";
import type { ParsedDocxDraftArtifactCandidatePreview } from "./ParsedDocxDraftArtifactCandidateMapper";

export interface ParsedDocxDraftArtifactSaveCandidate {
  blockers: string[];
  draftArtifact: DraftArtifactSaveCandidate;
  linkedKnowledgeCardIds: string[];
  sections: DraftSectionSaveCandidate[];
  sourceCardId: string | null;
  traceSummary: string;
  warnings: string[];
}

export interface ParsedDocxDraftArtifactSaveCandidateInput {
  approvedMarketingTags: SavedSourceCardTagRecord[];
  preview: ParsedDocxDraftArtifactCandidatePreview;
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
  savedSourceCard: SavedSourceCardDetail | null;
  savedSourceDocument: SavedSourceDocumentDetail | null;
}

export function mapParsedDocxToDraftArtifactSaveCandidate({
  approvedMarketingTags,
  preview,
  savedKnowledgeCards,
  savedSourceCard,
  savedSourceDocument
}: ParsedDocxDraftArtifactSaveCandidateInput): ParsedDocxDraftArtifactSaveCandidate {
  const linkedKnowledgeCardIds = Array.from(
    new Set(preview.sectionCandidates.flatMap((section) => section.linkedKnowledgeCardIds))
  );
  const sourceCardId = preview.sourceCardId ?? savedSourceCard?.sourceCard.sourceCardId ?? null;
  const approvedTagLabels = approvedMarketingTags
    .filter((tag) => tag.reviewStatus === "approved")
    .map((tag) => tag.label);
  const sections = preview.sectionCandidates.map(
    (section): DraftSectionSaveCandidate => ({
      approvedTags: approvedTagLabels,
      citationPlaceholders: section.linkedKnowledgeCardIds.map(
        (knowledgeCardId) => `citation-placeholder:${knowledgeCardId}`
      ),
      linkedCaseIds: filterLinkedIdsByType({
        cardType: "case",
        ids: section.linkedKnowledgeCardIds,
        savedKnowledgeCards
      }),
      linkedEvidenceIds: filterLinkedIdsByType({
        cardType: "evidence",
        ids: section.linkedKnowledgeCardIds,
        savedKnowledgeCards
      }),
      linkedQuoteIds: filterLinkedIdsByType({
        cardType: "quote",
        ids: section.linkedKnowledgeCardIds,
        savedKnowledgeCards
      }),
      mockParagraph: `${section.sectionTitle} skeleton only. ${section.skeletonNote} No polished prose generated. Trace refs: ${section.traceReferences.join(", ") || "none"}.`,
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitle,
      warnings: [
        "Parsed DOCX DraftArtifact section is mock/not-final.",
        "Citation placeholders are not APA-ready.",
        "DOCX page numbers remain untrusted."
      ]
    })
  );
  const draftArtifact: DraftArtifactSaveCandidate = {
    artifactType: "mock_draft_section_preview",
    candidateId: preview.draftArtifactCandidateId,
    createdFrom: "draft_section_mock_preview",
    derivedFrom: {
      draftInputPackageId: `parsed-docx-draft-input-${sourceCardId ?? "unlinked"}`,
      draftQualityReviewId: "parsed-docx-draft-quality-review-not-run",
      sourceToDraftPreviewId: `parsed-docx-source-to-draft-preview-${preview.sourceDocumentId ?? savedSourceDocument?.sourceDocument.sourceDocumentId ?? "unlinked"}`
    },
    mockOnly: true,
    notFinalDraft: true,
    notPersisted: true,
    review: {
      reviewedAt: "preview-only-not-persisted",
      reviewer: "local_mock_user",
      reviewStatus: "needs_review"
    },
    sectionCount: sections.length,
    title: `Parsed DOCX DraftArtifact skeleton — ${savedSourceCard?.sourceCard.title ?? "needs review"}`,
    validationStatus: "needs_review"
  };

  return {
    blockers: [...preview.blockers],
    draftArtifact,
    linkedKnowledgeCardIds,
    sections,
    sourceCardId,
    traceSummary: preview.evidenceTraceSummary,
    warnings: [
      ...preview.warnings,
      "Explicit save only — DraftArtifact is not auto-saved and prose is not final.",
      "Saved DraftArtifact remains mock/not-final and is not export-ready."
    ]
  };
}

function filterLinkedIdsByType({
  cardType,
  ids,
  savedKnowledgeCards
}: {
  cardType: SavedKnowledgeCardListItem["cardType"];
  ids: string[];
  savedKnowledgeCards: SavedKnowledgeCardListItem[];
}): string[] {
  const matchingIds = new Set(
    savedKnowledgeCards
      .filter((card) => card.cardType === cardType)
      .map((card) => card.knowledgeCardId)
  );

  return ids.filter((id) => matchingIds.has(id));
}
