use quick_xml::events::{BytesStart, Event};
use quick_xml::Reader;
use quick_xml::XmlVersion;
use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::io::Read;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri_plugin_dialog::DialogExt;
use zip::ZipArchive;

mod docx_export;
mod vault_db;

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

#[derive(Debug, Serialize)]
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExtractionTrace {
    source_document_id: String,
    page_number: u32,
    section_title: String,
    segment_id: String,
    chunk_reference: String,
}

#[derive(Clone, Debug, Serialize)]
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
    parse_docx_extraction_request(request)
}

#[tauri::command]
fn parse_local_docx_file(
    request: DocumentExtractionRequest,
) -> Result<DocumentExtractionResponse, String> {
    parse_docx_extraction_request(request)
}

fn parse_docx_extraction_request(
    request: DocumentExtractionRequest,
) -> Result<DocumentExtractionResponse, String> {
    let file_intake_job_id = request.file_intake_job_id.trim();

    if file_intake_job_id.is_empty() {
        return Err("fileIntakeJobId is required for DOCX parser MVP.".to_string());
    }

    let normalized_path = normalize_local_file_path_input(&request.local_path)
        .map_err(|_| "localPath is required for DOCX parser MVP.".to_string())?;

    match request.file_type.as_str() {
        "DOCX" => {}
        "PDF" => return Err("PDF parser is deferred; DOCX parser MVP only.".to_string()),
        _ => {
            return Err(
                "Unsupported file type for DOCX parser MVP. Only DOCX is supported.".to_string(),
            );
        }
    }

    let file_path = Path::new(&normalized_path);
    let extension = get_supported_extension(file_path)?;

    if extension != "docx" {
        return Err("Only .docx files are supported by the DOCX parser MVP.".to_string());
    }

    let metadata = fs::metadata(file_path)
        .map_err(|error| format!("Unable to read selected file metadata: {error}"))?;

    if !metadata.is_file() {
        return Err("Selected path is not a file.".to_string());
    }

    let file_intake_job =
        create_local_document_file_intake_job_with_metadata(file_path, metadata, extension)?;
    let extraction_result = extract_docx_plain_text(file_path, file_intake_job_id)?;
    let extraction_warnings = extraction_result.parser_warnings.clone();

    Ok(DocumentExtractionResponse {
        file_intake_job,
        extraction: DocumentTextExtraction {
            document_id: file_intake_job_id.to_string(),
            raw_text: extraction_result.raw_text,
            cleaned_text: extraction_result.cleaned_text,
            extraction_status: "extracted".to_string(),
            extraction_warnings,
            confidence_score: extraction_result.confidence_score,
        },
        segments: extraction_result.segments,
        traces: extraction_result.traces,
        parser_warnings: extraction_result.parser_warnings,
    })
}

#[derive(Debug)]
struct DocxExtractionResult {
    raw_text: String,
    cleaned_text: String,
    segments: Vec<DocumentSegment>,
    traces: Vec<ExtractionTrace>,
    parser_warnings: Vec<ExtractionWarning>,
    confidence_score: u8,
}

struct ParsedParagraph {
    index: usize,
    text: String,
    style: Option<String>,
    is_heading: bool,
    is_table: bool,
}

fn extract_docx_plain_text(
    file_path: &Path,
    document_id: &str,
) -> Result<DocxExtractionResult, String> {
    let file =
        File::open(file_path).map_err(|error| format!("Unable to open DOCX package: {error}"))?;
    let mut archive =
        ZipArchive::new(file).map_err(|error| format!("Unable to read DOCX package: {error}"))?;
    let mut document_xml = String::new();

    archive
        .by_name("word/document.xml")
        .map_err(|error| format!("DOCX package is missing word/document.xml: {error}"))?
        .read_to_string(&mut document_xml)
        .map_err(|error| format!("Unable to read word/document.xml: {error}"))?;

    parse_wordprocessingml_document(&document_xml, document_id)
}

fn parse_wordprocessingml_document(
    document_xml: &str,
    document_id: &str,
) -> Result<DocxExtractionResult, String> {
    let mut reader = Reader::from_str(document_xml);
    reader.config_mut().trim_text(false);

    let mut paragraph_depth = 0usize;
    let mut table_depth = 0usize;
    let mut current_paragraph = String::new();
    let mut current_style: Option<String> = None;
    let mut current_is_table = false;
    let mut paragraphs: Vec<ParsedParagraph> = Vec::new();
    let mut warnings: Vec<ExtractionWarning> = Vec::new();
    let mut has_table = false;
    let mut has_image_reference = false;
    let mut has_footnote_reference = false;
    let mut has_comment_reference = false;
    let mut partial_extraction = false;

    loop {
        match reader.read_event() {
            Ok(Event::Start(element)) => match local_xml_name(element.name().as_ref()) {
                b"tbl" => {
                    table_depth += 1;
                    has_table = true;
                }
                b"p" => {
                    paragraph_depth += 1;
                    if paragraph_depth == 1 {
                        current_paragraph.clear();
                        current_style = None;
                        current_is_table = table_depth > 0;
                    }
                }
                b"pStyle" => {
                    if paragraph_depth > 0 {
                        current_style = read_word_style_value(&element);
                    }
                }
                b"tab" => {
                    if paragraph_depth > 0 {
                        current_paragraph.push('\t');
                    }
                }
                b"br" | b"cr" => {
                    if paragraph_depth > 0 {
                        current_paragraph.push('\n');
                    }
                }
                b"drawing" | b"pict" => has_image_reference = true,
                b"footnoteReference" | b"endnoteReference" => has_footnote_reference = true,
                b"commentReference" => has_comment_reference = true,
                _ => {}
            },
            Ok(Event::Empty(element)) => match local_xml_name(element.name().as_ref()) {
                b"pStyle" => {
                    if paragraph_depth > 0 {
                        current_style = read_word_style_value(&element);
                    }
                }
                b"tab" => {
                    if paragraph_depth > 0 {
                        current_paragraph.push('\t');
                    }
                }
                b"br" | b"cr" => {
                    if paragraph_depth > 0 {
                        current_paragraph.push('\n');
                    }
                }
                b"drawing" | b"pict" => has_image_reference = true,
                b"footnoteReference" | b"endnoteReference" => has_footnote_reference = true,
                b"commentReference" => has_comment_reference = true,
                _ => {}
            },
            Ok(Event::Text(text)) => {
                if paragraph_depth > 0 {
                    match text.xml_content(XmlVersion::Explicit1_0) {
                        Ok(value) => current_paragraph.push_str(value.as_ref()),
                        Err(_) => partial_extraction = true,
                    }
                }
            }
            Ok(Event::GeneralRef(reference)) => {
                if paragraph_depth > 0 {
                    match resolve_xml_reference(&reference) {
                        Some(value) => current_paragraph.push_str(&value),
                        None => partial_extraction = true,
                    }
                }
            }
            Ok(Event::End(element)) => match local_xml_name(element.name().as_ref()) {
                b"p" => {
                    if paragraph_depth == 1 {
                        let cleaned = normalize_whitespace(&current_paragraph);
                        if !cleaned.is_empty() {
                            let style = current_style.clone();
                            paragraphs.push(ParsedParagraph {
                                index: paragraphs.len() + 1,
                                is_heading: is_heading_style(style.as_deref()),
                                is_table: current_is_table,
                                style,
                                text: cleaned,
                            });
                        }
                        current_paragraph.clear();
                        current_style = None;
                        current_is_table = false;
                    }

                    paragraph_depth = paragraph_depth.saturating_sub(1);
                }
                b"tbl" => {
                    table_depth = table_depth.saturating_sub(1);
                }
                _ => {}
            },
            Ok(Event::Eof) => break,
            Err(error) => {
                partial_extraction = true;
                warnings.push(create_parser_warning(
                    "docx-warning-xml-parse",
                    "partial_extraction",
                    "warning",
                    format!("Some DOCX XML content could not be parsed cleanly: {error}"),
                    Some("word/document.xml"),
                ));
                break;
            }
            _ => {}
        }
    }

    if paragraphs.is_empty() {
        return Err("No extractable paragraph text was found in word/document.xml.".to_string());
    }

    let has_headings = paragraphs.iter().any(|paragraph| paragraph.is_heading);

    if !has_headings {
        warnings.push(create_parser_warning(
            "docx-warning-missing-headings",
            "missing_headings",
            "warning",
            "No Word heading styles were detected; segment boundaries use paragraph chunks only.",
            Some("headings"),
        ));
        warnings.push(create_parser_warning(
            "docx-warning-low-structure-confidence",
            "low_structure_confidence",
            "warning",
            "DOCX structure confidence is low because heading-aware segmentation is unavailable.",
            Some("structure"),
        ));
    }

    if has_table {
        warnings.push(create_parser_warning(
            "docx-warning-tables-flattened",
            "tables_flattened",
            "info",
            "DOCX tables were flattened into paragraph text; cell structure is not modeled yet.",
            Some("tables"),
        ));
    }

    if has_image_reference {
        warnings.push(create_parser_warning(
            "docx-warning-images-skipped",
            "images_skipped",
            "warning",
            "DOCX images or drawings were detected but skipped in this text-only spike.",
            Some("images"),
        ));
    }

    if has_footnote_reference {
        warnings.push(create_parser_warning(
            "docx-warning-footnotes-skipped",
            "footnotes_skipped",
            "warning",
            "DOCX footnotes or endnotes were referenced but not extracted in this spike.",
            Some("footnotes"),
        ));
    }

    if has_comment_reference {
        warnings.push(create_parser_warning(
            "docx-warning-comments-skipped",
            "comments_skipped",
            "warning",
            "DOCX comments were referenced but not extracted in this spike.",
            Some("comments"),
        ));
    }

    if partial_extraction {
        warnings.push(create_parser_warning(
            "docx-warning-partial-extraction",
            "partial_extraction",
            "warning",
            "Some DOCX XML text could not be decoded and was skipped.",
            Some("text"),
        ));
    }

    let raw_text = paragraphs
        .iter()
        .map(|paragraph| paragraph.text.as_str())
        .collect::<Vec<_>>()
        .join("\n");
    let cleaned_text = normalize_document_text(&raw_text);
    let traces = create_paragraph_traces(document_id, &paragraphs);
    let segments = create_paragraph_segments(document_id, &paragraphs);
    let confidence_score = if has_headings { 82 } else { 72 };

    Ok(DocxExtractionResult {
        raw_text,
        cleaned_text,
        segments,
        traces,
        parser_warnings: warnings,
        confidence_score,
    })
}

fn create_paragraph_segments(
    document_id: &str,
    paragraphs: &[ParsedParagraph],
) -> Vec<DocumentSegment> {
    paragraphs
        .iter()
        .map(|paragraph| DocumentSegment {
            segment_id: format!("{}-segment-p{}", document_id, paragraph.index),
            document_id: document_id.to_string(),
            title: create_segment_title(paragraph),
            content: paragraph.text.clone(),
            page_start: 0,
            page_end: 0,
            tags: create_segment_tags(paragraph),
            segment_type: if paragraph.is_heading {
                "introduction".to_string()
            } else if paragraph.is_table {
                "evidence".to_string()
            } else {
                "unknown".to_string()
            },
        })
        .collect()
}

fn create_paragraph_traces(
    document_id: &str,
    paragraphs: &[ParsedParagraph],
) -> Vec<ExtractionTrace> {
    paragraphs
        .iter()
        .map(|paragraph| ExtractionTrace {
            source_document_id: document_id.to_string(),
            page_number: 0,
            section_title: create_segment_title(paragraph),
            segment_id: format!("{}-segment-p{}", document_id, paragraph.index),
            chunk_reference: format!("docx:p{}", paragraph.index),
        })
        .collect()
}

fn create_segment_title(paragraph: &ParsedParagraph) -> String {
    if paragraph.is_heading {
        return paragraph.text.clone();
    }

    if paragraph.is_table {
        return format!("Flattened table paragraph {}", paragraph.index);
    }

    format!("Paragraph {}", paragraph.index)
}

fn create_segment_tags(paragraph: &ParsedParagraph) -> Vec<String> {
    let mut tags = vec!["docx".to_string(), "paragraph".to_string()];

    if paragraph.is_heading {
        tags.push("heading".to_string());
    }

    if paragraph.is_table {
        tags.push("flattened-table".to_string());
    }

    if let Some(style) = &paragraph.style {
        tags.push(format!("style-{}", style.to_ascii_lowercase()));
    }

    tags
}

fn read_word_style_value(element: &BytesStart<'_>) -> Option<String> {
    element
        .attributes()
        .flatten()
        .find(|attribute| local_xml_name(attribute.key.as_ref()) == b"val")
        .and_then(|attribute| {
            String::from_utf8(attribute.value.as_ref().to_vec())
                .ok()
                .map(|value| value.trim().to_string())
        })
        .filter(|value| !value.is_empty())
}

fn is_heading_style(style: Option<&str>) -> bool {
    style
        .map(|value| value.to_ascii_lowercase().starts_with("heading"))
        .unwrap_or(false)
}

fn local_xml_name(name: &[u8]) -> &[u8] {
    name.rsplit(|byte| *byte == b':').next().unwrap_or(name)
}

fn resolve_xml_reference(reference: &quick_xml::events::BytesRef<'_>) -> Option<String> {
    if let Ok(Some(character)) = reference.resolve_char_ref() {
        return Some(character.to_string());
    }

    let value = reference.decode().ok()?;
    match value.as_ref() {
        "amp" => Some("&".to_string()),
        "lt" => Some("<".to_string()),
        "gt" => Some(">".to_string()),
        "quot" => Some("\"".to_string()),
        "apos" => Some("'".to_string()),
        _ => None,
    }
}

fn normalize_document_text(value: &str) -> String {
    value
        .lines()
        .map(normalize_whitespace)
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

fn normalize_whitespace(value: &str) -> String {
    value.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn create_parser_warning(
    warning_id: &str,
    code: &str,
    severity: &str,
    message: impl Into<String>,
    field: Option<&str>,
) -> ExtractionWarning {
    ExtractionWarning {
        warning_id: warning_id.to_string(),
        code: code.to_string(),
        severity: severity.to_string(),
        message: message.into(),
        field: field.map(|value| value.to_string()),
    }
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
        .ok_or_else(|| {
            "Selected file path is missing an extension. Only .pdf and .docx are allowed."
                .to_string()
        })?
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use zip::write::SimpleFileOptions;
    use zip::{CompressionMethod, ZipWriter};

    #[test]
    fn valid_minimal_docx_parses_successfully() {
        let file_path = write_test_docx(
            "valid-minimal",
            minimal_document_xml(&[
                styled_paragraph("Heading1", "Service Quality"),
                paragraph("First body paragraph."),
            ]),
        );

        let result = extract_docx_plain_text(&file_path, "docx-test").expect("DOCX should parse");

        assert_eq!(
            result.cleaned_text,
            "Service Quality\nFirst body paragraph."
        );
        assert_eq!(result.segments.len(), 2);
        assert_eq!(result.traces.len(), 2);
        assert_eq!(result.confidence_score, 82);

        cleanup_test_file(&file_path);
    }

    #[test]
    fn docx_parser_preserves_paragraph_order() {
        let file_path = write_test_docx(
            "paragraph-order",
            minimal_document_xml(&[
                paragraph("Alpha paragraph."),
                paragraph("Beta paragraph."),
                paragraph("Gamma paragraph."),
            ]),
        );

        let result =
            extract_docx_plain_text(&file_path, "ordered-docx").expect("DOCX should parse");

        assert_eq!(
            result.raw_text,
            "Alpha paragraph.\nBeta paragraph.\nGamma paragraph."
        );
        assert_eq!(result.segments[0].title, "Paragraph 1");
        assert_eq!(result.segments[1].title, "Paragraph 2");
        assert_eq!(result.segments[2].title, "Paragraph 3");

        cleanup_test_file(&file_path);
    }

    #[test]
    fn docx_parser_decodes_xml_entities_and_special_characters() {
        let file_path = write_test_docx(
            "entities",
            minimal_document_xml(&[paragraph("AT&amp;T &lt; service &gt; \"quality\"")]),
        );

        let result = extract_docx_plain_text(&file_path, "entity-docx").expect("DOCX should parse");

        assert_eq!(result.cleaned_text, "AT&T < service > \"quality\"");

        cleanup_test_file(&file_path);
    }

    #[test]
    fn corrupt_docx_package_returns_error() {
        let file_path = write_test_bytes("corrupt-package.docx", b"not a zip package");

        let error = extract_docx_plain_text(&file_path, "corrupt-docx")
            .expect_err("corrupt DOCX should fail");

        assert!(error.contains("Unable to read DOCX package"));

        cleanup_test_file(&file_path);
    }

    #[test]
    fn missing_document_xml_returns_error() {
        let file_path = write_test_zip_without_document_xml("missing-document-xml");

        let error = extract_docx_plain_text(&file_path, "missing-document")
            .expect_err("DOCX without document.xml should fail");

        assert!(error.contains("DOCX package is missing word/document.xml"));

        cleanup_test_file(&file_path);
    }

    #[test]
    fn docx_parser_does_not_fabricate_page_numbers() {
        let file_path = write_test_docx(
            "untrusted-pages",
            minimal_document_xml(&[paragraph("Evidence paragraph.")]),
        );

        let result = extract_docx_plain_text(&file_path, "page-policy").expect("DOCX should parse");

        assert_eq!(result.segments[0].page_start, 0);
        assert_eq!(result.segments[0].page_end, 0);
        assert_eq!(result.traces[0].page_number, 0);
        assert_eq!(result.traces[0].chunk_reference, "docx:p1");

        cleanup_test_file(&file_path);
    }

    #[test]
    fn docx_parser_warns_for_unsupported_content() {
        let file_path = write_test_docx(
            "unsupported-content",
            format!(
                r#"<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {}
    <w:tbl>{}</w:tbl>
    <w:p><w:r><w:drawing/></w:r><w:r><w:t>Image paragraph.</w:t></w:r></w:p>
    <w:p><w:r><w:footnoteReference w:id="1"/></w:r><w:r><w:t>Footnote paragraph.</w:t></w:r></w:p>
    <w:p><w:r><w:commentReference w:id="1"/></w:r><w:r><w:t>Comment paragraph.</w:t></w:r></w:p>
  </w:body>
</w:document>"#,
                paragraph("Plain paragraph."),
                paragraph("Flattened table paragraph.")
            ),
        );

        let result = extract_docx_plain_text(&file_path, "unsupported-docx")
            .expect("DOCX should parse with warnings");
        let warning_codes = result
            .parser_warnings
            .iter()
            .map(|warning| warning.code.as_str())
            .collect::<Vec<_>>();

        assert!(warning_codes.contains(&"tables_flattened"));
        assert!(warning_codes.contains(&"images_skipped"));
        assert!(warning_codes.contains(&"footnotes_skipped"));
        assert!(warning_codes.contains(&"comments_skipped"));

        cleanup_test_file(&file_path);
    }

    fn write_test_docx(name: &str, document_xml: String) -> std::path::PathBuf {
        let file_path = test_file_path(&format!("{name}.docx"));
        let file = File::create(&file_path).expect("test DOCX file should be created");
        let mut writer = ZipWriter::new(file);
        let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);

        writer
            .start_file("word/document.xml", options)
            .expect("document.xml should start");
        writer
            .write_all(document_xml.as_bytes())
            .expect("document.xml should be written");
        writer.finish().expect("test DOCX should finish");

        file_path
    }

    fn write_test_zip_without_document_xml(name: &str) -> std::path::PathBuf {
        let file_path = test_file_path(&format!("{name}.docx"));
        let file = File::create(&file_path).expect("test ZIP file should be created");
        let mut writer = ZipWriter::new(file);
        let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);

        writer
            .start_file("word/other.xml", options)
            .expect("other XML should start");
        writer
            .write_all(b"<xml />")
            .expect("other XML should be written");
        writer.finish().expect("test ZIP should finish");

        file_path
    }

    fn write_test_bytes(name: &str, bytes: &[u8]) -> std::path::PathBuf {
        let file_path = test_file_path(name);
        fs::write(&file_path, bytes).expect("test bytes should be written");
        file_path
    }

    fn test_file_path(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("atp-docx-parser-mvp-{}-{name}", unix_millis_now()))
    }

    fn cleanup_test_file(file_path: &Path) {
        let _ = fs::remove_file(file_path);
    }

    fn minimal_document_xml(paragraphs: &[String]) -> String {
        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {}
  </w:body>
</w:document>"#,
            paragraphs.join("\n")
        )
    }

    fn paragraph(text: &str) -> String {
        format!("<w:p><w:r><w:t>{text}</w:t></w:r></w:p>")
    }

    fn styled_paragraph(style: &str, text: &str) -> String {
        format!(
            r#"<w:p><w:pPr><w:pStyle w:val="{style}"/></w:pPr><w:r><w:t>{text}</w:t></w:r></w:p>"#
        )
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            docx_export::export_docx_from_draft_artifact_package,
            extract_document_text_from_path,
            parse_local_docx_file,
            vault_db::initialize_vault_database,
            vault_db::list_saved_draft_artifacts,
            vault_db::list_saved_draft_artifacts_for_source_card,
            vault_db::list_saved_knowledge_cards,
            vault_db::list_saved_knowledge_cards_for_source_card,
            vault_db::list_saved_marketing_tags,
            vault_db::list_saved_source_cards,
            vault_db::list_saved_source_documents,
            vault_db::list_saved_tags_for_source_card,
            vault_db::read_saved_draft_artifact,
            vault_db::read_saved_knowledge_card,
            vault_db::read_saved_source_card,
            vault_db::read_saved_source_document,
            vault_db::save_draft_artifact_candidate,
            vault_db::save_knowledge_cards_for_source_card,
            vault_db::save_marketing_tags_for_source_card,
            vault_db::save_source_card_candidate,
            vault_db::save_source_document_candidate,
            vault_db::update_source_card_metadata,
            inspect_local_document_file_path,
            select_local_document_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running ATP Knowledge Studio");
}
