# Parsed DOCX KnowledgeCard Save Verification 4E-8

Sprint 4E-8 hardens the explicit save/read/list verification path for KnowledgeCards created from the parsed-DOCX intake pipeline. It does not add DraftArtifact generation, AI/API calls, PDF/OCR parsing, database migrations, or DOCX export changes.

## Explicit Save Verification Boundary

Parsed-DOCX KnowledgeCards can be saved only after the upstream reviewed objects already exist:

- parsed DOCX SourceDocument has been explicitly saved and read back
- parsed DOCX SourceCard has been explicitly saved and read back
- parsed DOCX MarketingTags have been explicitly approved and saved
- parsed DOCX KnowledgeCard candidates have been reviewed by the user

The KnowledgeCard save action continues to call the existing KnowledgeCard save/read/list commands only:

- `save_knowledge_cards_for_source_card`
- `list_saved_knowledge_cards_for_source_card`
- `list_saved_knowledge_cards`
- `read_saved_knowledge_card`

No SourceDocument, SourceCard, MarketingTag, DraftArtifact, final manuscript, DOCX export, or Obsidian export is triggered automatically by the KnowledgeCard save action.

## Validation Rules

The `ParsedDocxKnowledgeCardSaveValidator` validates the parsed-DOCX save boundary before persistence is attempted.

Required conditions:

- saved SourceDocument linkage exists
- saved SourceCard linkage exists
- at least one approved parsed-DOCX MarketingTag exists
- candidate source type remains `DOCX`
- parser provenance remains `real_docx_parser_mvp`
- at least one KnowledgeCard candidate exists
- every candidate has a trace/chunk reference
- every candidate links to the saved SourceCard ID
- DOCX page numbers are not trusted
- candidate `citationReadiness` remains `needs_review`
- candidate `validationStatus` remains `needs_review`

The validator is pure TypeScript and does not write to SQLite.

## Trace Requirement

Parsed-DOCX KnowledgeCards must be traceable to chunk references such as `docx:pN` or equivalent parser-produced chunk refs. A candidate without a trace/chunk reference is blocked before save.

Saved verification shows:

- saved KnowledgeCard count
- saved KnowledgeCard IDs and types
- linked SourceCard ID
- trace count
- read/list verification summary

## No-Fabrication Rule

The parsed-DOCX KnowledgeCard path must not fabricate:

- concepts
- findings
- quotes
- cases
- citations
- APA readiness
- page numbers

Candidates may only summarize traceable parser output and must remain human-review-required before downstream use.

## DOCX Page-Number Policy

DOCX page numbers remain untrusted. KnowledgeCard trace references preserve chunk refs and mark page numbers as untrusted. The save verification UI explicitly warns that DOCX page numbers are not reliable evidence anchors.

## No DraftArtifact Auto-Generation

4E-8 does not generate DraftArtifacts from parsed-DOCX KnowledgeCards. Any later DraftArtifact flow must remain behind a separate explicit review/save boundary.

## Remaining Limitations

- DOCX parser MVP still has limited support for tables, images, footnotes, and comments.
- Bibliographic metadata remains incomplete unless a user supplies and reviews it.
- KnowledgeCard review state is still local UI state before save.
- Source Library remains dense and should be redesigned later as a progressive workspace.
- Rust and TypeScript DTOs still need drift monitoring across parser and persistence boundaries.

## Next Recommended Sprint

The next sprint should harden DraftArtifact readiness for parsed-DOCX KnowledgeCards without auto-generating final manuscript content. It should keep AI/API, PDF/OCR, DOCX export, and database migrations out of scope unless explicitly authorized.
