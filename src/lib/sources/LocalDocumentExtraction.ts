import { invoke } from "@tauri-apps/api/core";
import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionFailureCode,
  ExtractionTrace,
  ExtractionWarning,
  FileIntakeDocumentType
} from "../../types/domain";
import type { LocalDocumentFileIntakeJob } from "./LocalDocumentFilePicker";

export type ExtractableDocumentFileType = FileIntakeDocumentType;

export interface DocumentExtractionRequest {
  fileIntakeJobId: string;
  localPath: string;
  fileType: ExtractableDocumentFileType;
}

export interface DocumentExtractionResponse {
  fileIntakeJob: LocalDocumentFileIntakeJob;
  extraction: DocumentTextExtraction;
  segments: DocumentSegment[];
  traces: ExtractionTrace[];
  parserWarnings: ExtractionWarning[];
}

export interface DocumentExtractionError {
  code: ExtractionFailureCode;
  message: string;
  field?: keyof DocumentExtractionRequest;
}

export async function extractDocumentTextFromPath(
  request: DocumentExtractionRequest
): Promise<DocumentExtractionResponse> {
  return invoke<DocumentExtractionResponse>("extract_document_text_from_path", {
    request
  });
}
