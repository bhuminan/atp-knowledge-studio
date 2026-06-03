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
  localPath: string;
}

export async function selectLocalDocumentFile(): Promise<LocalDocumentFileIntakeJob | null> {
  return invoke<LocalDocumentFileIntakeJob | null>("select_local_document_file");
}

export async function selectLocalDocumentFiles(): Promise<LocalDocumentFileIntakeJob[]> {
  return invoke<LocalDocumentFileIntakeJob[]>("select_local_document_files");
}

export async function inspectLocalDocumentFilePath(
  path: string
): Promise<LocalDocumentFileIntakeJob> {
  return invoke<LocalDocumentFileIntakeJob>("inspect_local_document_file_path", {
    path
  });
}
