# Parsed DOCX SourceCard Save Verification 4E-5

## Scope

Sprint 4E-5 hardens the explicit save/read/list verification path for SourceCards derived from saved parsed-DOCX SourceDocuments. It does not add downstream generation.

## Explicit Save Verification Boundary

The SourceCard save path remains user-triggered only. A parsed-DOCX SourceCard candidate appears after the parsed-DOCX SourceDocument has been explicitly saved and read back.

Before save, Source Library now shows:

- Linked saved SourceDocument ID.
- SourceCard candidate ID and title.
- `metadataStatus`.
- Missing author, year, and citation fields.
- `parserSource: real_docx_parser_mvp`.
- DOCX page-number warning.
- Explicit-save-only notice.

After save, Source Library shows:

- Saved SourceCard ID.
- Saved SourceCard status.
- Linked SourceDocument ID.
- Read/list verification summary.
- Warning that citation metadata still needs human review.

## Validation Rules

The pure helper is `src/lib/sources/ParsedDocxSourceCardSaveValidator.ts`.

It validates:

- A saved SourceDocument link exists.
- The title is non-empty.
- `sourceType` remains `DOCX`.
- `parserSource` remains `real_docx_parser_mvp`.
- Citation text does not imply a generated APA citation.
- Incomplete bibliographic metadata remains `needs_metadata` and `needs_review`.

## No-Fabrication Rule

The parsed-DOCX SourceCard save path does not fabricate author, year, publisher, DOI/URL, or APA citation data. The stored citation text remains an explicit metadata-required notice until a human metadata review flow exists.

## No Downstream Generation Rule

Saving the parsed-DOCX SourceCard does not automatically trigger:

- MarketingTag generation or save.
- KnowledgeCard generation or save.
- DraftArtifact generation or save.
- DOCX export.
- Obsidian or Markdown export.

Those workflows remain separate explicit actions.

## Remaining Limitations

The UI verifies that SourceCard save/read/list works, but bibliographic metadata remains incomplete. Page numbers remain untrusted for DOCX evidence. The flow is not citation-ready.

## Next Recommended Sprint

Sprint 4E-6 should add an explicit human metadata review/edit panel for parsed-DOCX SourceCards before any citation readiness upgrade.
