# Parsed DOCX Draft Input Package Readiness 4F-0

Sprint 4F-0 adds a preview-only readiness layer for using parsed-DOCX source data as future draft input. It does not generate or save a DraftArtifact.

## Purpose

The readiness layer checks whether the parsed-DOCX intake pipeline has enough reviewed local vault data to become a future Draft Input Package:

- saved parsed-DOCX SourceDocument
- saved parsed-DOCX SourceCard
- approved parsed-DOCX MarketingTags
- saved/reviewed parsed-DOCX KnowledgeCards

The output is a compact status summary for Source Library. It is not prose generation, not draft persistence, and not final manuscript preparation.

## Input Dependencies

The pure mapper `ParsedDocxDraftInputPackageMapper` receives:

- `SavedSourceDocumentDetail`
- `SavedSourceCardDetail`
- approved `SavedSourceCardTagRecord` items
- saved `SavedKnowledgeCardListItem` records
- optional `SavedKnowledgeCardDetail` for trace inspection

The mapper reads only in-memory TypeScript data already returned from existing save/read/list commands. It does not invoke Tauri commands and does not write to SQLite.

## Readiness Rules

The mapper returns:

- `draftInputPackageStatus`
- linked SourceDocument ID
- linked SourceCard ID
- approved MarketingTag count
- saved KnowledgeCard count
- KnowledgeCard type counts
- trace-ready KnowledgeCard count
- evidence coverage summary
- citation readiness summary
- blockers
- warnings
- recommended next action

Blocking rules:

- block if no saved SourceDocument exists
- block if no saved SourceCard exists
- block if no saved KnowledgeCards exist

Needs-review rules:

- needs review if approved MarketingTags are missing
- needs review if KnowledgeCards lack trace references
- needs review while DOCX page numbers remain untrusted
- needs review while citation placeholders are unresolved

## No DraftArtifact Generation Rule

4F-0 does not create draft prose, draft sections, DraftArtifacts, final manuscripts, DOCX exports, Obsidian notes, or bundle saves from parsed DOCX. The Source Library shows:

> Readiness preview only — no DraftArtifact is generated or saved.

The existing mock DraftArtifact flow is not extended into the parsed-DOCX path.

## No AI And No Fabrication

The readiness layer does not call AI/API providers. It does not fabricate academic prose, concepts, findings, quotes, cases, citations, or APA metadata. It only summarizes saved and reviewed local vault data.

## Citation And Page-Number Limitations

DOCX page numbers remain untrusted. Draft input readiness uses trace/chunk counts and chunk references as evidence anchors.

Citation placeholders are not final APA citations. Human review remains mandatory before any future drafting workflow.

## Next Recommended Sprint

The next sprint should harden parsed-DOCX DraftArtifact readiness without generating or saving a DraftArtifact. It should preserve explicit user review gates and continue to defer AI/API, PDF/OCR, DOCX export changes, database migrations, and final manuscript persistence.
