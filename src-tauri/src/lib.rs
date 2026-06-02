use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalDocumentFileIntakeJob {
    id: String,
    file_name: String,
    file_type: Option<String>,
    mime_type: String,
    file_size: u64,
    created_at: String,
    status: String,
    warning: Option<String>,
    local_path: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DocumentExtractionRequest {
    file_intake_job_id: String,
    local_path: String,
    file_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DocumentExtractionResponse {
    file_intake_job: LocalDocumentFileIntakeJob,
    extraction: DocumentTextExtraction,
    segments: Vec<DocumentSegment>,
    traces: Vec<ExtractionTrace>,
    parser_warnings: Vec<ExtractionWarning>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DocumentTextExtraction {
    document_id: String,
    raw_text: String,
    cleaned_text: String,
    extraction_status: String,
    extraction_warnings: Vec<ExtractionWarning>,
    confidence_score: u8,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DocumentSegment {
    segment_id: String,
    document_id: String,
    title: String,
    content: String,
    page_start: u32,
    page_end: u32,
    tags: Vec<String>,
    segment_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ExtractionTrace {
    source_document_id: String,
    page_number: u32,
    section_title: String,
    segment_id: String,
    chunk_reference: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ExtractionWarning {
    warning_id: String,
    code: String,
    severity: String,
    message: String,
    field: Option<String>,
}

#[tauri::command]
fn select_local_document_file(
    app: tauri::AppHandle,
) -> Result<Option<LocalDocumentFileIntakeJob>, String> {
    let selected_file = app
        .dialog()
        .file()
        .add_filter("Academic documents", &["pdf", "docx"])
        .blocking_pick_file();

    let Some(selected_file) = selected_file else {
        return Ok(None);
    };

    let file_path = selected_file
        .into_path()
        .map_err(|error| format!("Unable to resolve selected file path: {error}"))?;

    create_local_document_file_intake_job(&file_path).map(Some)
}

#[tauri::command]
fn inspect_local_document_file_path(path: String) -> Result<LocalDocumentFileIntakeJob, String> {
    let normalized_path = normalize_local_file_path_input(&path)?;

    let file_path = Path::new(&normalized_path);
    let extension = get_supported_extension(file_path)?;
    let metadata = fs::metadata(file_path)
        .map_err(|error| format!("Unable to read selected file metadata: {error}"))?;

    if !metadata.is_file() {
        return Err("Selected path is not a file.".to_string());
    }

    create_local_document_file_intake_job_with_metadata(file_path, metadata, extension)
}

#[tauri::command]
fn extract_document_text_from_path(
    request: DocumentExtractionRequest,
) -> Result<DocumentExtractionResponse, String> {
    if request.file_intake_job_id.trim().is_empty() {
        return Err("fileIntakeJobId is required for document extraction.".to_string());
    }

    if request.local_path.trim().is_empty() {
        return Err("localPath is required for document extraction.".to_string());
    }

    match request.file_type.as_str() {
        "PDF" | "DOCX" => {}
        _ => {
            return Err(
                "Unsupported file type for document extraction. Only PDF and DOCX are allowed."
                    .to_string(),
            );
        }
    }

    Err("Document text extraction is not implemented yet.".to_string())
}

fn normalize_local_file_path_input(path: &str) -> Result<String, String> {
    let trimmed_path = path.trim();

    if trimmed_path.is_empty() {
        return Err("Local file path is required.".to_string());
    }

    let unquoted_path = trimmed_path
        .strip_prefix('"')
        .and_then(|value| value.strip_suffix('"'))
        .or_else(|| {
            trimmed_path
                .strip_prefix('\'')
                .and_then(|value| value.strip_suffix('\''))
        })
        .unwrap_or(trimmed_path)
        .trim();

    if unquoted_path.is_empty() {
        return Err("Local file path is required.".to_string());
    }

    Ok(unquoted_path.to_string())
}

fn create_local_document_file_intake_job(
    file_path: &Path,
) -> Result<LocalDocumentFileIntakeJob, String> {
    let metadata = fs::metadata(file_path)
        .map_err(|error| format!("Unable to read selected file metadata: {error}"))?;
    let extension = get_supported_extension(file_path)?;

    create_local_document_file_intake_job_with_metadata(file_path, metadata, extension)
}

fn create_local_document_file_intake_job_with_metadata(
    file_path: &Path,
    metadata: fs::Metadata,
    extension: String,
) -> Result<LocalDocumentFileIntakeJob, String> {
    let file_name = file_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("selected-document")
        .to_string();
    let (file_type, mime_type) = match extension.as_str() {
        "pdf" => (Some("PDF".to_string()), "application/pdf".to_string()),
        "docx" => (
            Some("DOCX".to_string()),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document".to_string(),
        ),
        _ => unreachable!("unsupported extension should be rejected before metadata creation"),
    };

    Ok(LocalDocumentFileIntakeJob {
        id: create_file_intake_id(&file_name),
        file_name,
        file_type,
        mime_type,
        file_size: metadata.len(),
        created_at: create_unix_millis_timestamp()?,
        status: "not_started".to_string(),
        warning: None,
        local_path: file_path.to_string_lossy().to_string(),
    })
}

fn get_supported_extension(file_path: &Path) -> Result<String, String> {
    let extension = file_path
        .extension()
        .ok_or_else(|| "Selected file path is missing an extension. Only .pdf and .docx are allowed.".to_string())?
        .to_string_lossy()
        .to_ascii_lowercase();

    match extension.as_str() {
        "pdf" | "docx" => Ok(extension),
        _ => Err("Unsupported extension. Only .pdf and .docx are allowed.".to_string()),
    }
}

fn create_file_intake_id(file_name: &str) -> String {
    let normalized_name = file_name
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() {
                character.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect::<String>()
        .split('-')
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("-");

    format!(
        "local-file-intake-{}-{}",
        normalized_name,
        unix_millis_now()
    )
}

fn create_unix_millis_timestamp() -> Result<String, String> {
    Ok(format!("unix-ms:{}", unix_millis_now()))
}

fn unix_millis_now() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            extract_document_text_from_path,
            inspect_local_document_file_path,
            select_local_document_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running ATP Knowledge Studio");
}
