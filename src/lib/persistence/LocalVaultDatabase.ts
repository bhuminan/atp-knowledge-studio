import { invoke } from "@tauri-apps/api/core";
import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionTrace,
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
