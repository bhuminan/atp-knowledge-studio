# Parsed DOCX Export Package Preview 4F-4

## Purpose

Sprint 4F-4 adds a preview-only DOCX export package surface for the parsed-DOCX DraftArtifact path. The preview helps evaluate export readiness after the parsed-DOCX DraftArtifact review gate, but it does not generate a DOCX file and does not expose an export action.

## Input Dependencies

- Explicitly saved parsed-DOCX DraftArtifact detail.
- Parsed-DOCX DraftArtifact citation, evidence, and trace review result.
- Saved parsed-DOCX KnowledgeCards.
- Parser provenance metadata, expected to remain `real_docx_parser_mvp`.

## Review Gate Dependency

The export package preview depends on the parsed-DOCX review gate. If that gate is blocked, the export package preview is blocked. If the review gate reports weak citation, evidence, or trace coverage, the preview remains review-gated and not export-ready.

## Export Readiness Rules

- Block when the parsed-DOCX review gate is blocked.
- Block when a saved parsed-DOCX DraftArtifact is missing.
- Block when parser provenance is not `real_docx_parser_mvp`.
- Keep the package in `needs_review` when citation placeholders remain.
- Keep the package in `needs_review` while DOCX page numbers are untrusted.
- Preserve mock/not-final DraftArtifact boundaries.
- Do not treat the package as a final manuscript.

## No Real DOCX Export Rule

The parsed-DOCX path does not expose the real DOCX export action in this sprint. No DOCX command changes were made, no DOCX file is generated, and no export save boundary is triggered.

## Citation And Page-Number Limitations

- Citation placeholders are not APA-ready citations.
- DOCX page numbers remain untrusted.
- Chunk references remain the review anchor until verified page numbering exists.
- The preview does not fabricate citations, evidence, cases, findings, or final prose.

## Next Recommended Sprint

Add a parsed-DOCX DOCX export readiness approval gate or checklist resolution workflow before exposing any real DOCX export action. The next sprint should still keep final manuscript approval and real citation validation separate from export mechanics.
