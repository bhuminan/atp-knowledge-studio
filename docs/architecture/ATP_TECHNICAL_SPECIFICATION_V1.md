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
- DraftArtifact
- DOCX MVP export package

Each layer remains explicit-review-only and must not auto-save.

## Real DOCX-To-DOCX MVP Loop

The real DOCX-to-DOCX MVP loop now exists:

- local DOCX parse through `parse_local_docx_file`
- `DocumentExtractionResponse`
- SourceDocument candidate and explicit save
- SourceCard candidate and explicit save
- MarketingTag candidate review and approved save
- KnowledgeCard candidate review and approved save
- Draft Input Package Readiness
- DraftArtifact Candidate Preview
- explicit mock/not-final DraftArtifact save
- DraftArtifact citation/evidence/trace review gate
- parsed-DOCX Export Package Preview
- explicit parsed-DOCX DOCX MVP export
- manual verification warning and metadata summary

The loop remains review-gated and does not create a final manuscript.

## SourceDocument Persistence

Parsed DOCX SourceDocument candidates can be explicitly saved. Saved SourceDocument records can be listed and read back with extraction run, segment, and evidence trace details.

## SourceCard Persistence

Parsed DOCX SourceCard candidates can be explicitly saved after saved SourceDocument verification. SourceCard read/list verification exists. Bibliographic metadata remains incomplete unless supplied by a future human metadata workflow.

## MarketingTag Persistence

Parsed DOCX MarketingTag candidates are generated from controlled taxonomy matches only. User-approved MarketingTags can be explicitly saved and linked to the saved SourceCard.

## KnowledgeCard Persistence

Parsed DOCX KnowledgeCard candidates are generated deterministically from saved SourceDocument/SourceCard data, parsed segments/traces, and approved MarketingTags. Only approved candidates with chunk references can be saved.

## DraftArtifact Persistence And Review

Parsed DOCX DraftArtifact candidates are deterministic section skeletons derived from saved parsed-DOCX SourceDocument, SourceCard, approved MarketingTags, and saved KnowledgeCards. They can be explicitly saved as mock/not-final DraftArtifacts. Saved DraftArtifacts have a citation/evidence/trace review gate before export package preview.

## DOCX Export MVP

Parsed DOCX DOCX export is implemented as MVP inspection output using the existing DOCX export command/service through a TypeScript adapter. It is draft-only, mock/not-final, not APA-final, and not publication-ready. Exported output requires manual verification before academic use.

## Citation Foundation 4H

The 4H citation foundation now exists through the internal-use Human APA Verification Gate MVP.

Implemented citation layers:

- compact human SourceCard metadata completion
- structured bibliographic metadata persistence
- structured metadata readiness validation
- deterministic APA Reference Candidate Preview
- human APA review artifact persistence

The saved APA review artifact supports `needs_correction` and `verified_for_internal_use`. It does not support `apa_final_verified`.

APA review artifacts are stored separately from compact SourceCard `citationText`. Saving a review does not overwrite SourceCard citation text, structured metadata, SourceDocuments, KnowledgeCards, DraftArtifacts, exports, or AI/provider state.

## Semi-Auto Metadata Roadmap 4I

The next roadmap direction is semi-automatic batch intake and metadata matching. Planned capabilities include:

- Batch Research Intake Queue
- multi-file PDF/DOCX import
- external metadata cross-check
- Crossref / OpenAlex / DOI / ISBN matching
- confidence scoring
- suggested metadata corrections
- pending review queues
- batch approve / reject / edit
- human-verified audit trail

These capabilities are planned but not implemented. External metadata must be treated as review evidence, not automatic truth.

## Page-Number Policy

DOCX page numbers remain untrusted. Evidence should use chunk references such as `docx:pN`. Persistence should store unavailable DOCX page numbers as null/untrusted.

## Human Review Policy

Human review remains mandatory for:

- SourceDocument candidate save.
- SourceCard candidate save.
- MarketingTag approval.
- KnowledgeCard approval.
- Citation metadata completion.
- Human APA verification for internal-use reference artifacts.
- DraftArtifact candidate review and save.
- DraftArtifact citation/evidence/trace review.
- DOCX MVP export verification.

## AI/API Status

AI/API integrations are not implemented for the 4F checkpoint. No AI extraction, summarization, tagging, citation generation, prose generation, or drafting occurs in the real DOCX-to-DOCX MVP loop.

## Not Implemented

Not implemented:

- PDF parser
- OCR
- citation-ready APA validation
- automatic metadata extraction
- batch intake queue
- Crossref/OpenAlex/DOI/ISBN metadata matching
- confidence scoring and suggested correction workflow
- final manuscript persistence
- Obsidian/Markdown export
- PDF parser
- automatic final DraftArtifact generation from parsed-DOCX KnowledgeCards
- polished academic prose generation
