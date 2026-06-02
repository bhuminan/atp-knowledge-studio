# ATP Sprint 4C-3F: SourceCard Persistence Readiness

## Decision Summary

Sprint 4C-3F adds a preview-only readiness boundary for future SourceCard persistence. The goal is to prove that a SourceCard save candidate must depend on a real saved SourceDocument root before ATP adds a SourceCard table or write command.

No SourceCard records are saved in this sprint.

## Why SourceCard Save Depends On Saved SourceDocument

SourceCards are citation and metadata records attached to source material. In ATP, they must not exist as persisted records without a durable SourceDocument root because:

- SourceDocument preserves file provenance.
- Extraction runs preserve parser status and text-length evidence.
- Extraction segments preserve section-level context.
- Evidence traces preserve chunk references such as `docx:pN`.
- SourceCard citation metadata must be reviewable against a saved source root.

Persisting SourceCards before the SourceDocument root would create citation records without enough provenance to audit later.

## Future Table Relationship

The future SourceCard table should require a foreign key to `source_documents.id`.

Recommended relationship:

- `source_cards.source_document_id -> source_documents.id`

The first SourceCard persistence migration should not add MarketingTag, KnowledgeCard, or DraftArtifact tables yet.

## What Is Validated Now

The preview-only readiness mapper validates:

- SourceCard candidate ID exists in the current persistence bundle.
- SourceDocument save result exists and reports a saved SourceDocument ID.
- Saved SourceDocument list includes the linked SourceDocument ID.
- Saved SourceDocument detail is readable and matches the linked ID.
- SourceCard metadata status is not blocked.
- SourceCard citation readiness is not blocked.
- Incomplete metadata is surfaced as a warning.
- Citation review gaps are surfaced as warnings.
- DOCX traces remain chunk-reference based and page numbers remain untrusted.

## What Is Not Saved Yet

Sprint 4C-3F does not save or read persisted records for:

- SourceCard
- MarketingTag
- SourceCard tag links
- KnowledgeCard
- DraftArtifact
- full bundle
- Obsidian or Markdown export

The UI notice remains explicit:

> Preview only — SourceCard is not saved yet.

## Recommended Sprint 4C-3G

Add SourceCard table migration and a real SourceCard-only save command.

Recommended scope:

- Add `source_cards` table.
- Require `source_document_id` foreign key.
- Save SourceCard metadata only.
- Preserve citation metadata readiness separately from citation text.
- Reject SourceCard save when the SourceDocument root is missing.
- Keep MarketingTag, KnowledgeCard, DraftArtifact, full bundle save, AI/API calls, Obsidian export, DOCX export, and PDF parsing out of scope.

Recommended tests:

- SourceCard save succeeds only with an existing SourceDocument root.
- SourceCard save fails with unknown SourceDocument ID.
- SourceCard save does not create tags, KnowledgeCards, or drafts.
- Citation metadata gaps are stored as readiness states, not treated as complete citations.
