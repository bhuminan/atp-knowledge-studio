# ATP Technical Specification V1

This markdown file is the editable project-doc equivalent for the tracked binary document `docs/ATP_TECHNICAL_SPECIFICATION_V1.docx`.

## Current Stack

- Tauri v2
- React
- TypeScript
- Tailwind CSS
- Rust commands for local parser and SQLite persistence
- Playwright for Source Library QA

## DOCX Parser Delta

The real DOCX parser MVP exists and is exposed through:

- `parse_local_docx_file`

The parser output maps to the existing `DocumentExtractionResponse` contract:

- `fileIntakeJob`
- `extraction`
- `segments`
- `traces`
- `parserWarnings`

DOCX parser output is consumed by pure TypeScript mappers for candidate creation.

## PDF Parser Status

PDF parser is not implemented. OCR is not implemented. PDF parsing remains deferred until DOCX parser and evidence-trace policies are stable.

## Parsed DOCX Candidate Pipeline

Parsed DOCX can now produce reviewed candidates and explicit saves for:

- SourceDocument
- SourceCard
- MarketingTags
- KnowledgeCards

Each layer remains explicit-review-only and must not auto-save.

## SourceDocument Persistence

Parsed DOCX SourceDocument candidates can be explicitly saved. Saved SourceDocument records can be listed and read back with extraction run, segment, and evidence trace details.

## SourceCard Persistence

Parsed DOCX SourceCard candidates can be explicitly saved after saved SourceDocument verification. SourceCard read/list verification exists. Bibliographic metadata remains incomplete unless supplied by a future human metadata workflow.

## MarketingTag Persistence

Parsed DOCX MarketingTag candidates are generated from controlled taxonomy matches only. User-approved MarketingTags can be explicitly saved and linked to the saved SourceCard.

## KnowledgeCard Persistence

Parsed DOCX KnowledgeCard candidates are generated deterministically from saved SourceDocument/SourceCard data, parsed segments/traces, and approved MarketingTags. Only approved candidates with chunk references can be saved.

## Page-Number Policy

DOCX page numbers remain untrusted. Evidence should use chunk references such as `docx:pN`. Persistence should store unavailable DOCX page numbers as null/untrusted.

## Human Review Policy

Human review remains mandatory for:

- SourceDocument candidate save.
- SourceCard candidate save.
- MarketingTag approval.
- KnowledgeCard approval.
- Citation metadata completion.

## AI/API Status

AI/API integrations are not implemented for the 4E checkpoint. No AI extraction, summarization, tagging, citation generation, or drafting occurs in the real DOCX intake pipeline.

## Not Implemented

Not implemented:

- PDF parser
- OCR
- citation-ready APA validation
- automatic metadata extraction
- final manuscript persistence
- Obsidian/Markdown export
- automatic DraftArtifact generation from parsed-DOCX KnowledgeCards
