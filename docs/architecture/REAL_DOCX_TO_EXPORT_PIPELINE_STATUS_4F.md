# Real DOCX To Export Pipeline Status 4F

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
→ Draft Input Package Readiness
→ DraftArtifact Candidate Preview
→ explicit DraftArtifact save
→ DraftArtifact Review Gate
→ Export Package Preview
→ explicit DOCX MVP export
→ manual verification
```

## Current Status

The 4F checkpoint completes the real DOCX-to-DOCX MVP loop for inspection output. The loop is not final manuscript production. Every durable step remains explicit-review-only, and every generated downstream object remains review-gated.

## Review Gates

- SourceDocument candidate review before explicit SourceDocument save.
- SourceCard candidate review before explicit SourceCard save.
- MarketingTag approval before approved tag save.
- KnowledgeCard approval before approved KnowledgeCard save.
- Draft Input Package readiness before DraftArtifact candidate preview.
- DraftArtifact candidate preview before explicit DraftArtifact save.
- DraftArtifact citation/evidence/trace review before export package preview.
- Export package preview before explicit DOCX MVP export.
- Manual verification after DOCX MVP export.

## Save And Export Boundaries

The pipeline reuses existing commands and services:

- `parse_local_docx_file`
- `save_source_document_candidate`
- `save_source_card_candidate`
- `save_marketing_tags_for_source_card`
- `save_knowledge_cards_for_source_card`
- `save_draft_artifact_candidate`
- existing DOCX MVP export command/service

No auto-save, auto-export, AI generation, final manuscript save, or APA finalization is triggered by the parsed-DOCX path.

## Parser Provenance Policy

Parsed DOCX provenance remains:

- `parserSource: real_docx_parser_mvp`
- `sourceType: DOCX`
- chunk references such as `docx:pN`
- `DocumentExtractionResponse` as the parser boundary

Downstream mappers preserve parser provenance and do not call parser internals directly.

## DOCX Page-Number Policy

DOCX page numbers remain untrusted. Evidence uses chunk references and trace records. Persistence stores DOCX page values as null/untrusted where unavailable. Export previews and MVP export warnings must keep this limitation visible.

## Citation And Fabrication Policy

The parsed-DOCX pipeline does not fabricate:

- authors
- years
- APA citations
- page numbers
- findings
- quotes
- cases
- final academic prose

Citation placeholders remain placeholders until human academic review and citation validation occur.

## DOCX MVP Export Status

Parsed-DOCX DOCX MVP export is available only from the parsed-DOCX export package preview and only as explicit user action. Blocked packages keep export disabled. Needs-review packages may use existing MVP behavior only for inspection output.

The exported file is:

- MVP-only
- draft-only
- not APA-final
- not publication-ready
- subject to manual verification before academic use

## QA Status

Current 4F QA baseline:

- `npm run build`
- `npm run qa:source-library`
- `cd src-tauri && cargo test`

Source Library QA covers the parsed DOCX flow from parser preview through SourceDocument, SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, export package preview, blocked export behavior, and manual verification warnings.

## Remaining Limitations

- PDF parser remains not implemented.
- OCR remains not implemented.
- AI/API remains not implemented.
- DOCX parser MVP does not fully model tables, images, footnotes, comments, headers, footers, citations, or bibliography parts.
- DOCX MVP export is not a final manuscript workflow.
- APA citation validation is not implemented.
- Source Library remains dense and needs later progressive workspace redesign.

## Next Recommended Step

Run no new feature sprint until this checkpoint is pushed. The next recommended feature sprint after handoff is a manual export verification checklist/resolution workflow, still before any AI/API integration.
