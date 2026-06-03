# ATP Project Status Handoff 4E Current

## Latest Origin/Main

Latest verified `origin/main` after Sprint 4E-7 push:

- `a1aae8d feat: map parsed docx to knowledge card candidates`

## Completed Real DOCX Intake Pipeline Status

Sprint 4E completed the first real DOCX intake pipeline from local DOCX parse through explicit, review-gated persistence for SourceDocument, SourceCard, MarketingTags, and KnowledgeCards.

The pipeline remains explicit-review-only. Parsing, mapping, and candidate creation never auto-save downstream records.

## Real DOCX Parser MVP Status

The real DOCX parser MVP is available through the Tauri command:

- `parse_local_docx_file`

It returns the existing `DocumentExtractionResponse` boundary:

- `fileIntakeJob`
- `extraction`
- `segments`
- `traces`
- `parserWarnings`

The parser preserves paragraph order and emits stable DOCX chunk references such as `docx:pN`. It does not fabricate page numbers.

## Parsed DOCX SourceDocument Status

Parsed DOCX output maps to a SourceDocument candidate and can be explicitly saved through the existing SourceDocument persistence boundary.

Current status:

- SourceDocument candidate preview exists.
- Explicit SourceDocument save works.
- Saved SourceDocument list/read verification works.
- Extraction segments and evidence traces are persisted.
- DOCX page numbers remain untrusted/null in persistence.

## Parsed DOCX SourceCard Status

Parsed DOCX SourceCards are created from explicitly saved parsed-DOCX SourceDocuments.

Current status:

- SourceCard candidate preview exists.
- Explicit SourceCard save works.
- SourceCard read/list verification is hardened.
- Bibliographic metadata remains incomplete.
- Author, year, publisher, DOI/URL, and APA citation are not fabricated.

## Parsed DOCX MarketingTag Status

Parsed DOCX MarketingTag candidates are generated from saved parsed-DOCX SourceCard/SourceDocument signals using the controlled taxonomy seed only.

Current status:

- MarketingTag candidate panel exists.
- Core and extended taxonomy matches are separated.
- All candidates start as `needs_review`.
- User approval is required before save.
- Approved MarketingTags can be explicitly saved and linked to the saved SourceCard.
- No AI/API tag generation is implemented.

## Parsed DOCX KnowledgeCard Status

Parsed DOCX KnowledgeCard candidates are generated from saved SourceDocument, saved SourceCard, parsed segments/traces, and approved parsed-DOCX MarketingTags.

Current status:

- KnowledgeCard candidate panel exists.
- Concept, Evidence, Quote, Case, and WritingAngle candidates are generated only when traceable evidence exists.
- Every candidate requires a DOCX chunk reference.
- User approval is required before save.
- Approved KnowledgeCards can be explicitly saved through the existing KnowledgeCard boundary.
- DraftArtifact generation is not automatically triggered.

## Current SQLite Persistence Layers

SQLite persistence currently supports:

- SourceDocument save/read/list.
- SourceCard save/read/list.
- MarketingTag save and SourceCard-tag link read/list.
- KnowledgeCard save/read/list.
- DraftArtifact save/read/list for existing mock downstream flow.

No new database migration was added during 4E.

## Current QA Baseline

Current required QA baseline:

- `npm run build`
- `npm run qa:source-library`
- `cd src-tauri && cargo test`

The Source Library QA covers the end-to-end review-gated DOCX candidate flow and existing save/read/list verification points.

## What Remains Mock

Still mock or preview-oriented:

- Source Library broader workflow composition after KnowledgeCards.
- DraftArtifact generation content.
- DOCX export package inputs from mock draft artifacts.
- Manual metadata/citation completion.
- AI-assisted extraction, classification, synthesis, and writing.
- Final manuscript persistence.

## What Remains Not Implemented

Not implemented:

- PDF parser.
- OCR.
- AI/API integrations.
- Full DOCX table/image/footnote/comment modeling.
- Human metadata editor for parsed DOCX SourceCards.
- Citation-ready APA validation.
- Obsidian/Markdown export.
- Final manuscript persistence.
- Automatic end-to-end pipeline execution.

## Known UX Backlog

Known UX backlog:

- Source Library is dense and needs progressive workspace redesign.
- Review gates should eventually be split into clearer staged workspaces.
- Metadata review needs a dedicated editor.
- Parser warnings need a more compact triage surface.
- Candidate approval controls should support batch review.
- Saved record verification panels need better collapsible summaries.

## Technical Debt Summary

Key technical debt:

- DOCX page numbers remain untrusted.
- DOCX parser MVP does not fully support tables, images, footnotes, comments, headers, footers, or bibliography parts.
- Rust/TypeScript DTO drift risk exists across parser and persistence boundaries.
- Source Library workflow is increasingly dense.
- Manual review states are distributed across multiple local component states.

## Next Recommended Sprint

Recommended next sprint:

- 4E-8: harden parsed-DOCX KnowledgeCard save/read/list verification and keep DraftArtifact generation gated behind explicit user action.

Do not begin PDF parsing or AI/API extraction until the DOCX review/persistence boundary is stable.
