# Real DOCX Intake Pipeline Status 4E

## Flow Diagram

```text
DOCX file
→ parse_local_docx_file
→ DocumentExtractionResponse
→ SourceDocument candidate
→ explicit SourceDocument save
→ SourceCard candidate
→ explicit SourceCard save
→ MarketingTag candidates
→ user approval
→ approved MarketingTag save
→ KnowledgeCard candidates
→ user approval
→ approved KnowledgeCard save
→ later DraftArtifact flow
```

## Review Gates

The 4E pipeline is review-gated at each durable boundary:

- SourceDocument candidate review before SourceDocument save.
- SourceCard candidate review before SourceCard save.
- MarketingTag candidate approval before MarketingTag save.
- KnowledgeCard candidate approval before KnowledgeCard save.

Candidates remain preview-only until an explicit user action runs an existing save command.

## Save Boundaries

The pipeline reuses existing persistence commands:

- `save_source_document_candidate`
- `save_source_card_candidate`
- `save_marketing_tags_for_source_card`
- `save_knowledge_cards_for_source_card`

No auto-save is allowed. Each boundary saves only the object type named by the action. Downstream records are not generated or saved automatically.

## Parser Provenance Policy

Parsed DOCX candidates identify parser provenance as:

- `parserSource: real_docx_parser_mvp`
- `sourceType: DOCX`
- local path reference only
- chunk references only

The parser output remains behind the existing `DocumentExtractionResponse` contract.

## Untrusted DOCX Page-Number Policy

DOCX page numbers remain untrusted. Parser traces use chunk references such as `docx:pN`. Persistence maps unavailable DOCX page values to null/untrusted page-number fields.

No candidate may promote DOCX page numbers to citation-ready evidence.

## No-Fabrication Policy

The 4E pipeline does not fabricate:

- authors
- years
- publisher/journal metadata
- DOI/URL metadata
- APA citations
- page numbers
- concepts, findings, quotes, or cases without traceable evidence

KnowledgeCard candidates are deterministic and must have chunk references.

## QA Status

Required QA commands pass for the 4E checkpoint:

- `npm run build`
- `npm run qa:source-library`
- `cd src-tauri && cargo test`

The Source Library QA covers the DOCX parser path, candidate previews, explicit save notices, and save/read/list verification surfaces.

## What Is Complete

Complete for the 4E checkpoint:

- Real DOCX parser MVP.
- `DocumentExtractionResponse` mapping.
- Parsed DOCX SourceDocument candidate and explicit save.
- Parsed DOCX SourceCard candidate and explicit save verification.
- Parsed DOCX MarketingTag candidates, review, save, and link verification.
- Parsed DOCX KnowledgeCard candidates, review, and save.

## What Remains Pending

Pending:

- KnowledgeCard save/read/list verification hardening for parsed-DOCX-specific UI.
- Human metadata review/edit panel.
- Citation-ready APA validation.
- PDF parser.
- OCR.
- AI/API extraction.
- DraftArtifact flow for parsed-DOCX outputs.
- Obsidian/Markdown export.

## Next Recommended Sprint

Recommended next sprint:

- 4E-8: harden parsed-DOCX KnowledgeCard save/read/list verification and keep DraftArtifact generation behind explicit review.
