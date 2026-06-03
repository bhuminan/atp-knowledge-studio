# Parsed DOCX DraftArtifact Save 4F-2

Sprint 4F-2 connects the parsed-DOCX DraftArtifact candidate preview to the existing DraftArtifact persistence boundary through explicit user action only.

## Purpose

The sprint allows a reviewed parsed-DOCX DraftArtifact skeleton to be saved as a local mock/not-final DraftArtifact. It prepares a durable review artifact, but it does not create polished academic prose, final manuscript content, AI text, DOCX export output, or Obsidian export output.

## Adapter And Save Boundary

`ParsedDocxDraftArtifactSaveCandidateMapper` converts the parsed-DOCX DraftArtifact candidate preview into the existing persistence request shape:

- `DraftArtifactSaveCandidate`
- `DraftSectionSaveCandidate[]`
- linked KnowledgeCard IDs
- SourceCard ID
- warnings/blockers
- trace summary

The save still uses the existing DraftArtifact persistence command:

- `save_draft_artifact_candidate`

Read/list verification continues through existing commands:

- `list_saved_draft_artifacts_for_source_card`
- `list_saved_draft_artifacts`
- `read_saved_draft_artifact`

No database migration was added.

## Validation Rules

`ParsedDocxDraftArtifactSaveValidator` blocks save when:

- saved SourceCard linkage is missing
- saved KnowledgeCard links are missing
- section candidates are empty
- section candidates lack evidence/trace text
- candidate is not mock/not-final
- candidate implies final/export readiness
- trace references are missing

The validator is pure TypeScript and performs no persistence.

## Mock And Not-Final Policy

Saved parsed-DOCX DraftArtifacts remain:

- `mockOnly: true`
- `notFinalDraft: true`
- `validationStatus: needs_review`
- citation readiness: needs review
- trace readiness: needs review

The saved sections contain skeleton notes only. They are not final manuscript sections.

## No AI And No Polished Prose

The sprint does not call AI/API providers and does not generate polished academic prose. Section text is deterministic skeleton text derived from section labels, saved KnowledgeCard links, approved tags, and trace references.

## Citation And Page-Number Limitations

Citation placeholders remain placeholders. No APA citation is fabricated or marked final.

DOCX page numbers remain untrusted. Trace anchoring uses chunk references only.

## No Auto-Export Rule

Saving a parsed-DOCX DraftArtifact does not trigger DOCX export, Obsidian export, final manuscript save, or downstream bundle persistence.

## Next Recommended Sprint

The next sprint should harden parsed-DOCX DraftArtifact review/read verification without introducing AI writing or export. It should keep final manuscript generation, DOCX export changes, PDF/OCR, database migrations, and provider integrations out of scope unless explicitly authorized.
