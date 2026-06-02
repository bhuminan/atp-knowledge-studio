# ATP Sprint 4C-3G: SourceCard Save Boundary

## Decision Summary

Sprint 4C-3G adds ATP's first real SourceCard persistence path. A SourceCard can now be saved only as metadata linked to an already saved SourceDocument root.

This is not a full Knowledge Vault save. It is a narrow SourceCard-only boundary.

## What Is Saved

The `save_source_card_candidate` command writes only:

- `source_cards`

The saved SourceCard row preserves:

- stable SourceCard ID
- linked `source_document_id`
- title
- optional authors
- optional year
- source type
- citation text
- metadata status
- citation readiness
- file reference
- review status
- candidate provenance
- created/updated timestamps

Authors and year remain nullable because the current preview contract may not have trusted citation metadata yet.

## What Is Not Saved

Sprint 4C-3G does not save:

- MarketingTag
- SourceCard tag links
- KnowledgeCard
- DraftArtifact
- full persistence bundle
- AI-generated draft
- Obsidian or Markdown export

No SourceCard tag join table is created in this sprint.

## SourceDocument Dependency

Every SourceCard save must link to an existing saved SourceDocument root:

- `source_cards.source_document_id -> source_documents.id`

The save command rejects a SourceCard candidate when the linked SourceDocument does not exist. This keeps citation metadata attached to real extraction provenance before downstream KnowledgeCards or draft artifacts are persisted.

## Table Mapping

`source_cards.id` stores the stable SourceCard candidate ID.

`source_cards.source_document_id` links back to `source_documents.id`.

`metadata_status` and `citation_readiness` are stored separately so ATP can distinguish incomplete bibliographic metadata from citation text review.

`authors` and `year` are nullable because missing metadata should be represented honestly rather than fabricated.

## Idempotency Behavior

Saving the same SourceCard ID again is idempotent:

- the existing row is updated
- no duplicate SourceCard row is created
- the linked SourceDocument root remains required

The save runs inside a SQLite transaction.

## Read/List Behavior

Sprint 4C-3G also adds SourceCard read/list verification:

- `list_saved_source_cards`
- `read_saved_source_card`

Read scope is limited to `source_cards` plus a compact linked SourceDocument reference. Tags, KnowledgeCards, and drafts are not read as saved artifacts.

## Recommended Sprint 4C-3H

Add MarketingTag table migration and tag-only save linked to SourceCard.

Recommended boundaries:

- add `marketing_tags`
- add `source_card_tags`
- require saved SourceCard ID before tag link save
- do not save KnowledgeCards or drafts yet
- do not add AI/API calls, Obsidian export, DOCX export, or PDF parser work
