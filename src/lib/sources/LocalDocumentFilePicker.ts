import { invoke } from "@tauri-apps/api/core";

export interface LocalDocumentFileIntakeJob {
  id: string;
  fileName: string;
  fileType: "PDF" | "DOCX" | null;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  status: "not_started" | "failed";
  warning?: string | null;
}

export async function selectLocalDocumentFile(): Promise<LocalDocumentFileIntakeJob | null> {
  return invoke<LocalDocumentFileIntakeJob | null>("select_local_document_file");
}
