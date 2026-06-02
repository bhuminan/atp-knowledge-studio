# MarketingTag Save Boundary 4C-3H

## Decision Summary

Sprint 4C-3H adds the first real MarketingTag persistence boundary for ATP's local Knowledge Vault. The implementation stores approved marketing tags and their links to an already saved SourceCard.

This sprint does not persist KnowledgeCards, DraftArtifacts, full save bundles, AI-generated drafts, Obsidian exports, or downstream workflow state.

## Saved Scope

The local SQLite vault may now persist:

- `marketing_tags`
- `source_card_tags`

The save command requires an existing saved `source_cards.id`. Tags are saved only when their review status is `approved`.

## Tables

### marketing_tags

Stores controlled or suggested marketing tag records.

Key fields:

- `id`
- `label`
- `tier`
- `category`
- `review_status`
- `created_at`
- `updated_at`

### source_card_tags

Stores the join between a saved SourceCard and saved MarketingTags.

Key fields:

- `source_card_id`
- `marketing_tag_id`
- `review_status`
- `created_at`
- `updated_at`

## Save Rules

- SourceCard must already exist in the local vault.
- At least one approved MarketingTag candidate is required.
- Rejected and needs-review tag candidates are excluded from persistence.
- Duplicate saves are idempotent through upsert behavior.
- SourceCard tag links are upserted by `(source_card_id, marketing_tag_id)`.

## Read/List Boundary

The sprint adds read/list behavior for:

- all saved MarketingTags
- saved MarketingTags linked to a specific SourceCard

The read/list commands do not require KnowledgeCard or draft tables.

## Explicit Non-Scope

This sprint does not save:

- KnowledgeCards
- DraftArtifacts
- Source-to-draft plans
- draft prose
- citation review decisions
- Obsidian/Markdown exports
- AI-generated content

## UI Behavior

Source Library now shows a MarketingTag local vault save section after SourceCard save succeeds. The UI clearly states:

> Only approved marketing tags are saved and linked to the saved SourceCard. KnowledgeCards, drafts, and Obsidian exports are not saved yet.

## Recommended 4C-3I

Add KnowledgeCard persistence readiness against saved SourceDocument, saved SourceCard, and saved MarketingTag links. Keep it preview/validation-only before adding any KnowledgeCard tables.
