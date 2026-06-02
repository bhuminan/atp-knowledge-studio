# KnowledgeCard Save Boundary 4C-3I

## Decision Summary

Sprint 4C-3I adds real local SQLite persistence for approved KnowledgeCard candidates after SourceDocument, SourceCard, and MarketingTag persistence boundaries are already established.

This sprint saves reviewed KnowledgeCards only. It does not persist drafts, draft sections, full save bundles, AI-generated prose, Obsidian exports, or downstream workflow state.

## Saved Scope

The local Knowledge Vault may now persist:

- `knowledge_cards`
- `knowledge_card_traces`
- `knowledge_card_tags`

KnowledgeCards must link to an existing saved `source_cards.id`.

## Explicit Non-Scope

This sprint does not save:

- DraftArtifacts
- draft sections
- source-to-draft plans
- AI-generated drafts
- citation review decisions
- Obsidian/Markdown exports
- full persistence bundles

## Table Mapping

### knowledge_cards

Stores reusable reviewed knowledge assets.

Key fields:

- `id`
- `source_card_id`
- `card_type`
- `title`
- `content_preview`
- `citation_readiness`
- `trace_readiness`
- `review_status`
- `validation_status`
- `created_from_candidate_id`
- `created_at`
- `updated_at`

Supported card types:

- `concept`
- `evidence`
- `quote`
- `case`
- `writing_angle`

### knowledge_card_traces

Stores trace references for KnowledgeCards.

Key fields:

- `knowledge_card_id`
- `chunk_reference`
- `page_number`
- `page_number_trusted`
- `section_title`

DOCX page numbers remain untrusted unless a later parser can resolve them. Chunk references such as `docx:pN` remain first-class.

### knowledge_card_tags

Stores safe links from KnowledgeCards to already-saved MarketingTags.

Key fields:

- `knowledge_card_id`
- `marketing_tag_id`
- `review_status`

## Save Rules

- SourceCard must already exist.
- Only `approved` KnowledgeCard candidates are saved.
- Rejected and needs-review KnowledgeCard candidates are excluded.
- Linked MarketingTags must already exist if tag links are provided.
- Duplicate saves are idempotent.
- Trace refs are refreshed per KnowledgeCard on save.

## Read/List Boundary

Read/list commands cover:

- all saved KnowledgeCards
- saved KnowledgeCards for a SourceCard
- one saved KnowledgeCard with compact SourceCard reference, tags, and traces

No draft data is read.

## UI Behavior

Source Library shows a KnowledgeCard local vault save section after SourceCard and tag save verification. The UI states:

> Only approved KnowledgeCards are saved. Drafts and Obsidian exports are not saved yet.

## Recommended 4C-3J

Add DraftArtifact persistence readiness preview only. Do not create draft tables or save drafts until the SourceDocument, SourceCard, MarketingTag, and KnowledgeCard boundaries are fully stable.
