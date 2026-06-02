# Saved DraftArtifact Review Gate 4C-3L

## Purpose

Sprint 4C-3L adds a review-only gate for saved mock/not-final DraftArtifacts. The gate checks whether a saved DraftArtifact has enough citation, evidence, trace, and section coverage to be considered for future export planning.

This gate exists before DOCX export because ATP must not convert weak mock draft previews into exportable academic text without human review.

## What Is Checked

The review gate evaluates:

- saved DraftArtifact status and mock/not-final flags
- saved draft section content
- linked saved KnowledgeCard count
- citation placeholder presence
- evidence, quote, and case references in each section
- trace-like references through saved section link metadata
- section-level warnings
- citation readiness and trace readiness fields
- export risk level

## What Is Not Checked

This sprint does not validate:

- real APA 7 citation correctness
- final manuscript quality
- DOCX export formatting
- Obsidian or Markdown export readiness
- AI-generated draft quality
- PDF extraction quality
- real page numbers for DOCX content

Citation placeholders are not treated as real citations.

## Boundary Rules

The review output is read-only and derived from already saved local-vault records. It does not write to SQLite, does not create new records, and does not modify DraftArtifacts.

DOCX page numbers remain untrusted. Chunk references such as `docx:pN` remain the primary trace anchor until a later parser/export layer can verify page positions.

## Why This Comes Before DOCX Export

DOCX export should only begin after ATP can identify:

- sections without evidence support
- missing citation placeholders
- weak trace coverage
- unresolved mock-only warnings
- high export risk

Without this gate, a future export command could accidentally imply that mock preview prose is a final academic manuscript.

## Known Limitations

- Section evidence coverage is inferred from saved section link metadata.
- Saved KnowledgeCard links are counted at the DraftArtifact level, not yet per section.
- Citation placeholders are detected but not parsed.
- APA citation metadata is not verified.
- DOCX page references are not trusted.

## Recommended Next Sprint

Sprint 4C-3M should decide whether to add a persisted review snapshot table or keep review gates computed dynamically. DOCX export should remain out of scope until review snapshots, citation policy, and export artifact boundaries are explicit.
