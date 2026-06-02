# DOCX Export Package Contract 4D-0

## Purpose

Sprint 4D-0 adds a preview-only DOCX export package contract for saved mock/not-final DraftArtifacts. The contract prepares ATP for a future export implementation without generating any DOCX file.

## Input Boundary

The export package preview is derived from:

- saved DraftArtifact detail
- saved mock draft sections
- linked saved KnowledgeCards
- Saved DraftArtifact Citation & Evidence Review Gate output

It does not read files, call AI, write exports, or mutate the local vault.

## Contract Output

The preview contract includes:

- export package ID
- DraftArtifact ID
- title
- export status
- export risk level
- sections for export
- citation placeholders
- evidence trace summary
- unresolved warnings
- blockers
- export readiness checklist
- recommended next action

## Rules

The mapper must:

- block the package if the saved DraftArtifact review gate is blocked
- mark the package as `needs_review` when citation placeholders remain
- mark the package as `needs_review` when DOCX page numbers are untrusted
- preserve warnings about placeholder citations
- avoid treating placeholder citations as final APA citations
- avoid generating final manuscript text
- avoid generating DOCX files

## What Is Not Implemented

This sprint does not add:

- DOCX file generation
- file picker or save dialog
- export path selection
- final manuscript save
- Obsidian or Markdown export
- PDF parsing
- AI/API generation
- Rust commands
- database migrations

## Why This Contract Comes First

The contract makes export readiness inspectable before real export code exists. That keeps DOCX export work gated by citation readiness, evidence coverage, trace completeness, and unresolved warnings instead of treating saved mock sections as final prose.

## Known Limitations

- Citation placeholders are counted, not parsed.
- APA 7 correctness is not validated.
- DOCX page numbers remain untrusted.
- Evidence trace readiness is derived from saved section references and linked KnowledgeCards.
- Export section structure is preview-only.

## Recommended Next Sprint

Sprint 4D-1 should decide the DOCX export engine boundary and output artifact policy. It should still avoid final manuscript auto-save until citation review and export artifact handling are explicit.
