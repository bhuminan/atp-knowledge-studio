use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipWriter};

const EXPORT_DIR_NAME: &str = "exports/docx";

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportDocxFromDraftArtifactPackageRequest {
    package: DocxExportPackagePayload,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocxExportPackagePayload {
    blockers: Vec<String>,
    citation_placeholders: Vec<String>,
    draft_artifact_id: String,
    evidence_trace_summary: DocxEvidenceTraceSummaryPayload,
    export_package_id: String,
    export_risk_level: String,
    export_status: String,
    recommended_next_action: String,
    sections_for_export: Vec<DocxExportSectionPayload>,
    title: String,
    unresolved_warnings: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocxEvidenceTraceSummaryPayload {
    linked_knowledge_card_count: usize,
    section_count: usize,
    sections_with_evidence: usize,
    sections_with_trace_like_references: usize,
    trace_completeness_score: u32,
    uses_untrusted_docx_page_numbers: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocxExportSectionPayload {
    citation_placeholder_count: usize,
    evidence_reference_count: usize,
    has_content: bool,
    linked_case_ids: Vec<String>,
    linked_evidence_ids: Vec<String>,
    linked_quote_ids: Vec<String>,
    mock_paragraph: String,
    section_id: String,
    section_title: String,
    warnings: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportDocxResult {
    blockers: Vec<String>,
    export_status: String,
    exported: bool,
    file_name: String,
    file_path: String,
    package_id: String,
    warnings: Vec<String>,
}

#[tauri::command]
pub fn export_docx_from_draft_artifact_package(
    app: tauri::AppHandle,
    request: ExportDocxFromDraftArtifactPackageRequest,
) -> Result<ExportDocxResult, String> {
    let export_dir = resolve_docx_export_dir(&app)?;
    export_docx_package_to_directory(&export_dir, request.package)
}

fn resolve_docx_export_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Unable to resolve app data directory: {error}"))?;
    Ok(app_data_dir.join(EXPORT_DIR_NAME))
}

fn export_docx_package_to_directory(
    export_dir: &Path,
    package: DocxExportPackagePayload,
) -> Result<ExportDocxResult, String> {
    let validation = validate_export_package(&package);

    if !validation.blockers.is_empty() {
        return Ok(ExportDocxResult {
            blockers: validation.blockers,
            export_status: package.export_status,
            exported: false,
            file_name: String::new(),
            file_path: String::new(),
            package_id: package.export_package_id,
            warnings: validation.warnings,
        });
    }

    fs::create_dir_all(export_dir)
        .map_err(|error| format!("Unable to create DOCX export directory: {error}"))?;

    let file_name = create_export_file_name(&package);
    let file_path = export_dir.join(&file_name);
    let file = File::create(&file_path)
        .map_err(|error| format!("Unable to create DOCX export file: {error}"))?;
    write_docx_package(file, &package)
        .map_err(|error| format!("Unable to write DOCX export package: {error}"))?;

    Ok(ExportDocxResult {
        blockers: Vec::new(),
        export_status: package.export_status,
        exported: true,
        file_name,
        file_path: file_path.to_string_lossy().to_string(),
        package_id: package.export_package_id,
        warnings: validation.warnings,
    })
}

struct ExportPackageValidation {
    blockers: Vec<String>,
    warnings: Vec<String>,
}

fn validate_export_package(package: &DocxExportPackagePayload) -> ExportPackageValidation {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();

    if package.export_status == "blocked" {
        blockers.push("DOCX export package is blocked by the review gate.".to_string());
    }

    if !package.blockers.is_empty() {
        blockers.extend(package.blockers.clone());
    }

    if package.title.trim().is_empty() {
        blockers.push("DOCX export package title is required.".to_string());
    }

    if package.sections_for_export.is_empty() {
        blockers.push("At least one section is required for DOCX export MVP.".to_string());
    }

    if package.export_status == "needs_review" {
        warnings.push(
            "DOCX export package needs review; export is MVP-only and not publication-ready."
                .to_string(),
        );
    }

    if !package.citation_placeholders.is_empty() {
        warnings.push(
            "Citation placeholders require review and are not final APA citations.".to_string(),
        );
    }

    if package
        .evidence_trace_summary
        .uses_untrusted_docx_page_numbers
    {
        warnings.push(
            "DOCX page numbers remain untrusted; evidence appendix uses section/chunk context."
                .to_string(),
        );
    }

    warnings.extend(package.unresolved_warnings.clone());

    ExportPackageValidation { blockers, warnings }
}

fn write_docx_package(
    file: File,
    package: &DocxExportPackagePayload,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut writer = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);

    writer.start_file("[Content_Types].xml", options)?;
    writer.write_all(content_types_xml().as_bytes())?;

    writer.start_file("_rels/.rels", options)?;
    writer.write_all(root_relationships_xml().as_bytes())?;

    writer.start_file("word/document.xml", options)?;
    writer.write_all(document_xml(package).as_bytes())?;

    writer.start_file("word/_rels/document.xml.rels", options)?;
    writer.write_all(document_relationships_xml().as_bytes())?;

    writer.finish()?;
    Ok(())
}

fn content_types_xml() -> &'static str {
    r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"#
}

fn root_relationships_xml() -> &'static str {
    r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"#
}

fn document_relationships_xml() -> &'static str {
    r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>"#
}

fn document_xml(package: &DocxExportPackagePayload) -> String {
    let mut body = String::new();

    body.push_str(&paragraph(&package.title, "Title"));
    body.push_str(&paragraph(
        "Draft export only — not final manuscript, citation placeholders require review.",
        "Subtitle",
    ));
    body.push_str(&paragraph(
        &format!(
            "Export package: {} | DraftArtifact: {} | Status: {} | Risk: {}",
            package.export_package_id,
            package.draft_artifact_id,
            package.export_status,
            package.export_risk_level
        ),
        "Normal",
    ));

    body.push_str(&paragraph("Draft Sections", "Heading1"));
    for section in &package.sections_for_export {
        body.push_str(&paragraph(&section.section_title, "Heading2"));
        body.push_str(&paragraph(&section.mock_paragraph, "Normal"));
        body.push_str(&paragraph(
            &format!(
                "Section ID: {} | Has content: {} | Evidence reference count: {} | Evidence refs: {} | Quote refs: {} | Case refs: {} | Citation placeholders: {}",
                section.section_id,
                section.has_content,
                section.evidence_reference_count,
                join_or_none(&section.linked_evidence_ids),
                join_or_none(&section.linked_quote_ids),
                join_or_none(&section.linked_case_ids),
                section.citation_placeholder_count
            ),
            "Normal",
        ));
        if !section.warnings.is_empty() {
            body.push_str(&paragraph(
                &format!("Section warnings: {}", section.warnings.join("; ")),
                "Normal",
            ));
        }
    }

    body.push_str(&paragraph("Citation Placeholder Notes", "Heading1"));
    if package.citation_placeholders.is_empty() {
        body.push_str(&paragraph(
            "No citation placeholders were included.",
            "Normal",
        ));
    } else {
        for placeholder in &package.citation_placeholders {
            body.push_str(&paragraph(&format!("Placeholder: {placeholder}"), "Normal"));
        }
    }

    body.push_str(&paragraph("Evidence Trace Appendix", "Heading1"));
    body.push_str(&paragraph(
        &format!(
            "Linked KnowledgeCards: {} | Sections: {} | Sections with evidence: {} | Trace-like references: {} | Trace completeness: {}% | DOCX page numbers trusted: no",
            package.evidence_trace_summary.linked_knowledge_card_count,
            package.evidence_trace_summary.section_count,
            package.evidence_trace_summary.sections_with_evidence,
            package.evidence_trace_summary.sections_with_trace_like_references,
            package.evidence_trace_summary.trace_completeness_score
        ),
        "Normal",
    ));

    body.push_str(&paragraph("Export Metadata", "Heading1"));
    body.push_str(&paragraph(
        &format!(
            "draftArtifactId: {} | linkedKnowledgeCardCount: {} | exportTimestamp: {}",
            package.draft_artifact_id,
            package.evidence_trace_summary.linked_knowledge_card_count,
            unix_millis_now()
        ),
        "Normal",
    ));
    body.push_str(&paragraph(
        &format!(
            "Recommended next action: {}",
            package.recommended_next_action
        ),
        "Normal",
    ));

    if !package.unresolved_warnings.is_empty() {
        body.push_str(&paragraph("Warnings", "Heading1"));
        for warning in &package.unresolved_warnings {
            body.push_str(&paragraph(warning, "Normal"));
        }
    }

    format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {}
    <w:sectPr/>
  </w:body>
</w:document>"#,
        body
    )
}

fn paragraph(text: &str, style: &str) -> String {
    let escaped_text = escape_xml(text);
    let style_xml = match style {
        "Title" => r#"<w:pPr><w:pStyle w:val="Title"/></w:pPr>"#,
        "Subtitle" => r#"<w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>"#,
        "Heading1" => r#"<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>"#,
        "Heading2" => r#"<w:pPr><w:pStyle w:val="Heading2"/></w:pPr>"#,
        _ => "",
    };

    format!("<w:p>{style_xml}<w:r><w:t>{escaped_text}</w:t></w:r></w:p>")
}

fn create_export_file_name(package: &DocxExportPackagePayload) -> String {
    let title_slug = package
        .title
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
    let safe_slug = if title_slug.is_empty() {
        "atp-draft-export".to_string()
    } else {
        title_slug
    };

    format!("{}-{}.docx", safe_slug, unix_millis_now())
}

fn join_or_none(values: &[String]) -> String {
    if values.is_empty() {
        "none".to_string()
    } else {
        values.join(", ")
    }
}

fn escape_xml(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
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
    use zip::ZipArchive;

    #[test]
    fn export_docx_succeeds_for_needs_review_package() {
        let export_dir = temp_export_dir("docx-export-success");
        let result = export_docx_package_to_directory(&export_dir, valid_export_package())
            .expect("export should succeed");

        assert!(result.exported);
        assert_eq!(result.export_status, "needs_review");
        assert!(result.file_name.ends_with(".docx"));
        assert!(Path::new(&result.file_path).exists());
        assert!(result
            .warnings
            .iter()
            .any(|warning| warning.contains("Citation placeholders require review")));

        let file = File::open(result.file_path).expect("open exported docx");
        let mut archive = ZipArchive::new(file).expect("read exported docx zip");
        assert!(archive.by_name("word/document.xml").is_ok());
    }

    #[test]
    fn export_docx_is_blocked_for_blocked_package() {
        let export_dir = temp_export_dir("docx-export-blocked");
        let mut package = valid_export_package();
        package.export_status = "blocked".to_string();
        package
            .blockers
            .push("Review gate blocked export.".to_string());

        let result =
            export_docx_package_to_directory(&export_dir, package).expect("blocked result");

        assert!(!result.exported);
        assert_eq!(result.export_status, "blocked");
        assert!(result.file_path.is_empty());
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("blocked")));
    }

    #[test]
    fn export_docx_requires_sections() {
        let export_dir = temp_export_dir("docx-export-no-sections");
        let mut package = valid_export_package();
        package.sections_for_export = Vec::new();

        let result =
            export_docx_package_to_directory(&export_dir, package).expect("blocked result");

        assert!(!result.exported);
        assert!(result
            .blockers
            .iter()
            .any(|blocker| blocker.contains("At least one section")));
    }

    fn valid_export_package() -> DocxExportPackagePayload {
        DocxExportPackagePayload {
            blockers: Vec::new(),
            citation_placeholders: vec!["[Citation placeholder: service quality]".to_string()],
            draft_artifact_id: "draft-artifact-test".to_string(),
            evidence_trace_summary: DocxEvidenceTraceSummaryPayload {
                linked_knowledge_card_count: 2,
                section_count: 1,
                sections_with_evidence: 1,
                sections_with_trace_like_references: 1,
                trace_completeness_score: 75,
                uses_untrusted_docx_page_numbers: true,
            },
            export_package_id: "docx-export-package-test".to_string(),
            export_risk_level: "medium".to_string(),
            export_status: "needs_review".to_string(),
            recommended_next_action: "Review citation placeholders.".to_string(),
            sections_for_export: vec![DocxExportSectionPayload {
                citation_placeholder_count: 1,
                evidence_reference_count: 1,
                has_content: true,
                linked_case_ids: Vec::new(),
                linked_evidence_ids: vec!["evidence-1".to_string()],
                linked_quote_ids: Vec::new(),
                mock_paragraph: "Mock deterministic paragraph for export.".to_string(),
                section_id: "section-1".to_string(),
                section_title: "Phenomenon".to_string(),
                warnings: Vec::new(),
            }],
            title: "ATP Draft Export Test".to_string(),
            unresolved_warnings: vec!["DOCX page numbers are untrusted.".to_string()],
        }
    }

    fn temp_export_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("atp-{name}-{}", unix_millis_now()));
        fs::create_dir_all(&dir).expect("create temp export dir");
        dir
    }
}
