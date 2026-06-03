import { invoke } from "@tauri-apps/api/core";
import type {
  DocumentSegment,
  DocumentTextExtraction,
  DraftArtifactSaveCandidate,
  DraftSectionSaveCandidate,
  ExtractionTrace,
  KnowledgeCardSaveCandidateType,
  SourceCardSaveCandidate,
  SourceDocumentSaveCandidate
} from "../../types/domain";

export interface VaultDatabaseInitializationStatus {
  appliedMigrations: string[];
  dbPath: string;
  initialized: boolean;
  persisted: false;
  schemaVersion: number;
}

export async function initializeVaultDatabase(): Promise<VaultDatabaseInitializationStatus> {
  return invoke<VaultDatabaseInitializationStatus>("initialize_vault_database");
}

export interface SaveSourceDocumentRequest {
  extraction: DocumentTextExtraction;
  extractionRunId: string;
  segments: DocumentSegment[];
  sourceDocument: SourceDocumentSaveCandidate;
  sourceDocumentId: string;
  traces: ExtractionTrace[];
}

export interface SaveSourceDocumentResult {
  blockers: string[];
  dbPath: string;
  extractionRunId: string;
  saved: boolean;
  segmentCount: number;
  sourceDocumentId: string;
  traceCount: number;
  warnings: string[];
}

export async function saveSourceDocumentCandidate(
  request: SaveSourceDocumentRequest
): Promise<SaveSourceDocumentResult> {
  return invoke<SaveSourceDocumentResult>("save_source_document_candidate", {
    request
  });
}

export interface SavedSourceDocumentListItem {
  sourceDocumentId: string;
  title: string;
  fileName: string;
  fileType: string;
  metadataStatus: string;
  extractionStatus: string;
  createdAt: string;
  updatedAt: string;
  segmentCount: number;
  traceCount: number;
}

export interface SavedSourceDocumentDetail {
  extractionRun: SavedExtractionRunRecord;
  segments: SavedExtractionSegmentRecord[];
  sourceDocument: SavedSourceDocumentRecord;
  traces: SavedEvidenceTraceRecord[];
}

export interface SavedSourceDocumentRecord {
  sourceDocumentId: string;
  title: string;
  fileName: string;
  fileType: string;
  metadataStatus: string;
  citationReadiness: string;
  parserStatus: string;
  reviewStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedExtractionRunRecord {
  extractionRunId: string;
  extractionStatus: string;
  confidenceScore: number | null;
  rawTextLength: number;
  cleanedTextLength: number;
  warningCount: number;
  createdAt: string;
}

export interface SavedExtractionSegmentRecord {
  segmentId: string;
  title: string;
  segmentType: string;
  content: string;
  pageStart: number | null;
  pageEnd: number | null;
  pageNumbersTrusted: boolean;
  sortOrder: number;
}

export interface SavedEvidenceTraceRecord {
  traceId: string;
  segmentId: string | null;
  chunkReference: string;
  pageNumber: number | null;
  pageNumberTrusted: boolean;
  sectionTitle: string | null;
}

export async function listSavedSourceDocuments(): Promise<
  SavedSourceDocumentListItem[]
> {
  return invoke<SavedSourceDocumentListItem[]>("list_saved_source_documents");
}

export async function readSavedSourceDocument(
  sourceDocumentId: string
): Promise<SavedSourceDocumentDetail> {
  return invoke<SavedSourceDocumentDetail>("read_saved_source_document", {
    request: { sourceDocumentId }
  });
}

export interface SaveSourceCardRequest {
  authors?: string | null;
  linkedSourceDocumentId: string;
  sourceCard: SourceCardSaveCandidate;
  sourceCardId: string;
  year?: string | null;
}

export interface SaveSourceCardResult {
  blockers: string[];
  dbPath: string;
  saved: boolean;
  sourceCardId: string;
  sourceDocumentId: string;
  warnings: string[];
}

export async function saveSourceCardCandidate(
  request: SaveSourceCardRequest
): Promise<SaveSourceCardResult> {
  return invoke<SaveSourceCardResult>("save_source_card_candidate", {
    request
  });
}

export interface SavedSourceCardListItem {
  sourceCardId: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  title: string;
  sourceType: string;
  metadataStatus: string;
  citationReadiness: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSourceCardDetail {
  sourceCard: SavedSourceCardRecord;
  sourceDocument: SavedSourceDocumentCompactReference;
}

export interface SavedSourceCardRecord {
  sourceCardId: string;
  sourceDocumentId: string;
  title: string;
  authors: string | null;
  year: string | null;
  sourceType: string;
  citationText: string;
  metadataStatus: string;
  citationReadiness: string;
  fileReference: string;
  reviewStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSourceDocumentCompactReference {
  sourceDocumentId: string;
  title: string;
  fileName: string;
  fileType: string;
}

export async function listSavedSourceCards(): Promise<SavedSourceCardListItem[]> {
  return invoke<SavedSourceCardListItem[]>("list_saved_source_cards");
}

export async function readSavedSourceCard(
  sourceCardId: string
): Promise<SavedSourceCardDetail> {
  return invoke<SavedSourceCardDetail>("read_saved_source_card", {
    request: { sourceCardId }
  });
}

export interface UpdateSourceCardMetadataRequest {
  authors?: string | null;
  citationReadiness: "ready" | "needs_review" | "blocked";
  citationText: string;
  metadataStatus: "ready" | "needs_metadata" | "blocked";
  sourceCardId: string;
  title: string;
  year?: string | null;
}

export interface UpdateSourceCardMetadataResult {
  blockers: string[];
  dbPath: string;
  saved: boolean;
  sourceCardId: string;
  warnings: string[];
}

export async function updateSourceCardMetadata(
  request: UpdateSourceCardMetadataRequest
): Promise<UpdateSourceCardMetadataResult> {
  return invoke<UpdateSourceCardMetadataResult>("update_source_card_metadata", {
    request
  });
}

export type MarketingTagPersistenceTier = "core" | "extended" | "suggested";
export type MarketingTagPersistenceReviewStatus =
  | "approved"
  | "needs_review"
  | "rejected";

export interface SaveMarketingTagCandidateRequest {
  category: string;
  label: string;
  reviewStatus: MarketingTagPersistenceReviewStatus;
  tagId: string;
  tier: MarketingTagPersistenceTier;
}

export interface SaveMarketingTagsForSourceCardRequest {
  sourceCardId: string;
  tags: SaveMarketingTagCandidateRequest[];
}

export interface SaveMarketingTagsResult {
  blockers: string[];
  dbPath: string;
  linkedTagCount: number;
  saved: boolean;
  sourceCardId: string;
  tagCount: number;
  warnings: string[];
}

export interface SavedMarketingTagRecord {
  category: string;
  createdAt: string;
  label: string;
  reviewStatus: MarketingTagPersistenceReviewStatus;
  tagId: string;
  tier: MarketingTagPersistenceTier;
  updatedAt: string;
}

export interface SavedSourceCardTagRecord {
  category: string;
  label: string;
  reviewStatus: MarketingTagPersistenceReviewStatus;
  sourceCardId: string;
  tagId: string;
  tier: MarketingTagPersistenceTier;
}

export async function saveMarketingTagsForSourceCard(
  request: SaveMarketingTagsForSourceCardRequest
): Promise<SaveMarketingTagsResult> {
  return invoke<SaveMarketingTagsResult>("save_marketing_tags_for_source_card", {
    request
  });
}

export async function listSavedMarketingTags(): Promise<SavedMarketingTagRecord[]> {
  return invoke<SavedMarketingTagRecord[]>("list_saved_marketing_tags");
}

export async function listSavedTagsForSourceCard(
  sourceCardId: string
): Promise<SavedSourceCardTagRecord[]> {
  return invoke<SavedSourceCardTagRecord[]>("list_saved_tags_for_source_card", {
    request: { sourceCardId }
  });
}

export type KnowledgeCardPersistenceReviewStatus =
  | "approved"
  | "needs_review"
  | "rejected";

export interface SaveKnowledgeCardTraceReferenceRequest {
  chunkReference: string;
  pageNumber: number;
  pageNumberTrusted: boolean;
  sectionTitle: string;
}

export interface SaveKnowledgeCardCandidateRequest {
  cardType: KnowledgeCardSaveCandidateType;
  citationReadiness: "ready" | "needs_review" | "blocked";
  contentPreview: string;
  knowledgeCardId: string;
  reviewStatus: KnowledgeCardPersistenceReviewStatus;
  tagIds: string[];
  title: string;
  traceReference: SaveKnowledgeCardTraceReferenceRequest | null;
  validationStatus: "ready" | "needs_review" | "blocked";
}

export interface SaveKnowledgeCardsForSourceCardRequest {
  cards: SaveKnowledgeCardCandidateRequest[];
  sourceCardId: string;
}

export interface SaveKnowledgeCardsResult {
  blockers: string[];
  dbPath: string;
  knowledgeCardCount: number;
  linkedTagCount: number;
  saved: boolean;
  sourceCardId: string;
  traceRefCount: number;
  warnings: string[];
}

export interface SavedKnowledgeCardListItem {
  cardType: KnowledgeCardSaveCandidateType;
  citationReadiness: string;
  createdAt: string;
  knowledgeCardId: string;
  sourceCardId: string;
  tagCount: number;
  title: string;
  traceCount: number;
  updatedAt: string;
}

export interface SavedKnowledgeCardRecord {
  cardType: KnowledgeCardSaveCandidateType;
  citationReadiness: string;
  contentPreview: string;
  createdAt: string;
  knowledgeCardId: string;
  reviewStatus: string;
  sourceCardId: string;
  title: string;
  traceReadiness: string;
  updatedAt: string;
  validationStatus: string;
}

export interface SavedSourceCardCompactReference {
  sourceCardId: string;
  sourceDocumentId: string;
  sourceType: string;
  title: string;
}

export interface SavedKnowledgeCardTagRecord {
  category: string;
  label: string;
  reviewStatus: string;
  tagId: string;
  tier: string;
}

export interface SavedKnowledgeCardTraceRecord {
  chunkReference: string;
  pageNumber: number | null;
  pageNumberTrusted: boolean;
  sectionTitle: string | null;
  traceId: string;
}

export interface SavedKnowledgeCardDetail {
  knowledgeCard: SavedKnowledgeCardRecord;
  sourceCard: SavedSourceCardCompactReference;
  tags: SavedKnowledgeCardTagRecord[];
  traces: SavedKnowledgeCardTraceRecord[];
}

export async function saveKnowledgeCardsForSourceCard(
  request: SaveKnowledgeCardsForSourceCardRequest
): Promise<SaveKnowledgeCardsResult> {
  return invoke<SaveKnowledgeCardsResult>("save_knowledge_cards_for_source_card", {
    request
  });
}

export async function listSavedKnowledgeCards(): Promise<
  SavedKnowledgeCardListItem[]
> {
  return invoke<SavedKnowledgeCardListItem[]>("list_saved_knowledge_cards");
}

export async function listSavedKnowledgeCardsForSourceCard(
  sourceCardId: string
): Promise<SavedKnowledgeCardListItem[]> {
  return invoke<SavedKnowledgeCardListItem[]>(
    "list_saved_knowledge_cards_for_source_card",
    {
      request: { sourceCardId }
    }
  );
}

export async function readSavedKnowledgeCard(
  knowledgeCardId: string
): Promise<SavedKnowledgeCardDetail> {
  return invoke<SavedKnowledgeCardDetail>("read_saved_knowledge_card", {
    request: { knowledgeCardId }
  });
}

export interface SaveDraftArtifactRequest {
  draftArtifact: DraftArtifactSaveCandidate;
  linkedKnowledgeCardIds: string[];
  sections: DraftSectionSaveCandidate[];
  sourceCardId: string;
}

export interface SaveDraftArtifactResult {
  blockers: string[];
  dbPath: string;
  draftArtifactId: string;
  linkedKnowledgeCardCount: number;
  saved: boolean;
  sectionCount: number;
  sourceCardId: string;
  warnings: string[];
}

export interface SavedDraftArtifactListItem {
  artifactStatus: string;
  createdAt: string;
  draftArtifactId: string;
  draftType: string;
  linkedKnowledgeCardCount: number;
  mockOnly: boolean;
  notFinal: boolean;
  sectionCount: number;
  sourceCardId: string;
  title: string;
  updatedAt: string;
}

export interface SavedDraftArtifactRecord {
  artifactStatus: string;
  citationReadiness: string;
  createdAt: string;
  draftArtifactId: string;
  draftType: string;
  mockOnly: boolean;
  notFinal: boolean;
  sourceCardId: string;
  title: string;
  traceReadiness: string;
  updatedAt: string;
}

export interface SavedDraftSectionRecord {
  approvedTagsJson: string;
  citationPlaceholdersJson: string;
  linkedCaseIdsJson: string;
  linkedEvidenceIdsJson: string;
  linkedQuoteIdsJson: string;
  mockParagraph: string;
  sectionId: string;
  sectionTitle: string;
  sortOrder: number;
  warningsJson: string;
}

export interface SavedDraftArtifactKnowledgeCardRecord {
  cardType: KnowledgeCardSaveCandidateType;
  knowledgeCardId: string;
  title: string;
}

export interface SavedDraftArtifactDetail {
  draftArtifact: SavedDraftArtifactRecord;
  knowledgeCards: SavedDraftArtifactKnowledgeCardRecord[];
  sections: SavedDraftSectionRecord[];
  sourceCard: SavedSourceCardCompactReference;
}

export async function saveDraftArtifactCandidate(
  request: SaveDraftArtifactRequest
): Promise<SaveDraftArtifactResult> {
  return invoke<SaveDraftArtifactResult>("save_draft_artifact_candidate", {
    request
  });
}

export async function listSavedDraftArtifacts(): Promise<
  SavedDraftArtifactListItem[]
> {
  return invoke<SavedDraftArtifactListItem[]>("list_saved_draft_artifacts");
}

export async function listSavedDraftArtifactsForSourceCard(
  sourceCardId: string
): Promise<SavedDraftArtifactListItem[]> {
  return invoke<SavedDraftArtifactListItem[]>(
    "list_saved_draft_artifacts_for_source_card",
    {
      request: { sourceCardId }
    }
  );
}

export async function readSavedDraftArtifact(
  draftArtifactId: string
): Promise<SavedDraftArtifactDetail> {
  return invoke<SavedDraftArtifactDetail>("read_saved_draft_artifact", {
    request: { draftArtifactId }
  });
}
