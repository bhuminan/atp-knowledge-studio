# DOCX Export MVP 4D-1

## Implementation Choice

Sprint 4D-1 implements the first real DOCX export boundary as a Rust-side Tauri command:

- `export_docx_from_draft_artifact_package`

The command writes a minimal `.docx` package to a controlled app export directory. It receives the preview-only DOCX export package contract from the Source Library UI.

## Dependency Decision

No new dependency is added. ATP already uses the Rust `zip` crate for DOCX intake, and a `.docx` file is a ZIP package containing WordprocessingML parts. The MVP writer uses the existing `zip` dependency to write:

- `[Content_Types].xml`
- `_rels/.rels`
- `word/document.xml`
- `word/_rels/document.xml.rels`

This avoids introducing a styling-heavy DOCX generation stack before ATP has finalized citation and export policies.

## Export Boundary

The export command may generate an MVP DOCX file from:

- saved mock/not-final DraftArtifact content
- DOCX Export Package Preview sections
- citation placeholder notes
- evidence trace summary
- export metadata

It does not save a final manuscript, does not update SQLite, and does not create Obsidian/Markdown exports.

## Generated DOCX Contents

The generated MVP DOCX includes:

- document title
- status notice: “Draft export only — not final manuscript, citation placeholders require review.”
- draft sections with headings and body text
- citation placeholder notes
- evidence trace appendix
- export metadata including DraftArtifact ID, linked KnowledgeCard count, and timestamp
- unresolved warnings when present

## File Location

The command writes to:

`<app_data_dir>/exports/docx/`

File names include a timestamp so exports are not silently overwritten.

## Limitations

- The DOCX is intentionally minimal.
- Styling is basic WordprocessingML only.
- Citation placeholders are not final APA citations.
- DOCX page numbers remain untrusted.
- No citation manager integration exists.
- No final manuscript approval is implied.
- No save dialog is used yet.

## Why It Is Not Final Manuscript Export

The export is created from mock/not-final DraftArtifact sections. It is an inspection artifact for QA and academic workflow validation, not publication-ready manuscript output.

## Recommended Next Sprint

Sprint 4D-2 should validate the generated DOCX visually and structurally, then decide whether to add an export artifact registry, save-dialog support, or a richer DOCX styling layer. APA finalization and citation manager integration should remain separate.
