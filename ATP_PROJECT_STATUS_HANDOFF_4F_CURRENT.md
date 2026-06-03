# ATP Project Status Handoff 4F Current

## Latest Origin/Main

Latest verified `origin/main` after Sprint 4F-6 push:

- `4deb9b9 test: harden parsed docx export mvp`

## Completed Real DOCX Pipeline

Sprint 4F completes the parsed-DOCX flow from real DOCX parser MVP through explicit SourceDocument, SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, export package preview, and DOCX MVP export verification.

The full pipeline remains explicit-review-only. No parser output, candidate, draft artifact, or export is auto-saved or auto-exported.

## Real DOCX Parser MVP Status

The real DOCX parser MVP is exposed through:

- `parse_local_docx_file`

It returns the existing `DocumentExtractionResponse` boundary:

- `fileIntakeJob`
- `extraction`
- `segments`
- `traces`
- `parserWarnings`

The parser preserves paragraph order and stable DOCX chunk references such as `docx:pN`. DOCX page numbers remain untrusted.

## Parsed DOCX SourceDocument Status

Current status:

- Real parser output maps to a SourceDocument candidate.
- Explicit SourceDocument save works.
- Saved SourceDocument read/list verification works.
- Extraction segments and evidence traces persist.
- DOCX page numbers remain null/untrusted.

## Parsed DOCX SourceCard Status

Current status:

- Parsed DOCX SourceCard candidate preview exists.
- Explicit SourceCard save works.
- SourceCard read/list verification works.
- Bibliographic metadata remains incomplete unless supplied by a future human metadata workflow.
- Author, year, citation text, and APA readiness are not fabricated.

## Parsed DOCX MarketingTag Status

Current status:

- Parsed DOCX MarketingTag candidates are generated from controlled taxonomy matches only.
- Candidates require user approval.
- Approved MarketingTags can be explicitly saved and linked to the saved SourceCard.
- No AI/API tag generation is implemented.

## Parsed DOCX KnowledgeCard Status

Current status:

- Parsed DOCX KnowledgeCard candidates are generated from saved SourceDocument, saved SourceCard, parsed segments/traces, and approved MarketingTags.
- Concept, Evidence, Quote, Case, and WritingAngle candidates remain trace-gated.
- Approved candidates can be explicitly saved.
- KnowledgeCard save/read/list verification is hardened.

## Parsed DOCX DraftArtifact Status

Current status:

- Draft Input Package Readiness exists for saved parsed-DOCX prerequisites.
- DraftArtifact Candidate Preview exists as deterministic section skeletons.
- Parsed DOCX DraftArtifact can be explicitly saved as mock/not-final.
- Saved parsed DOCX DraftArtifact read/list verification works.
- DraftArtifact citation/evidence/trace review gate exists.
- DraftArtifact remains draft-only and not final manuscript.

## Parsed DOCX DOCX Export MVP Status

Current status:

- Parsed DOCX Export Package Preview exists after the DraftArtifact review gate.
- Explicit DOCX MVP export action is integrated through the existing DOCX export command/service.
- Blocked packages keep export disabled or blocked.
- Needs-review export is allowed only as MVP inspection output when existing MVP behavior allows it.
- Export result metadata verification is hardened.
- Manual verification warning is visible.

The exported DOCX is not APA-final, not polished prose, and not publication-ready.

## Current QA Baseline

Current required QA baseline:

- `npm run build`
- `npm run qa:source-library`
- `cd src-tauri && cargo test`

The Source Library QA covers parser preview, candidate previews, explicit save notices, save/read/list verification, DraftArtifact review gate, export package preview, export blocked/disabled behavior, export metadata verification, and manual verification warnings.

## What Remains Mock Or Not Final

Still mock or not final:

- Parsed DOCX DraftArtifact sections are skeleton/mock output.
- Parsed DOCX DOCX export is MVP inspection output only.
- Citation placeholders are not APA citations.
- DOCX page numbers are untrusted.
- Manual academic verification remains mandatory.
- Source Library verification panels are still dense and operational rather than polished workspace UX.

## What Remains Not Implemented

Not implemented:

- PDF parser.
- OCR.
- AI/API extraction, synthesis, tagging, or writing.
- APA citation finalizer.
- Citation manager integration.
- Human metadata editor.
- Final manuscript persistence.
- Obsidian/Markdown export from parsed DOCX.
- Progressive Source Library workspace redesign.

## Known UX Backlog

Known UX backlog:

- Source Library is dense and should become a progressive staged workspace.
- Review gates need collapsible summaries and stronger scan hierarchy.
- Metadata review needs a dedicated editor.
- Parser warnings need a compact triage surface.
- Export verification needs a user-facing checklist/resolution workflow.
- Candidate approvals need batch review controls.

## Technical Debt Summary

Key technical debt:

- DOCX page numbers remain untrusted.
- DOCX parser MVP does not fully support tables, images, footnotes, comments, headers, footers, citations, or bibliography parts.
- Exported DOCX is MVP-only and not APA-final.
- Rust/TypeScript DTO drift risk remains across parser, persistence, and export boundaries.
- Source Library workflow is increasingly dense.
- Manual review state is distributed across local component state.

## Next Recommended Sprint

Recommended next step:

- Documentation Checkpoint 4F is complete after this commit.
- Next feature sprint should be a manual parsed-DOCX export verification checklist/resolution workflow, still before AI/API integration.

Do not start 4G, AI/API, PDF parsing, or final manuscript work until this handoff is pushed.
