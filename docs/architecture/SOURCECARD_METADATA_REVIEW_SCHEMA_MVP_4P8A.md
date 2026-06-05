# SourceCard Metadata Review Schema MVP 4P-8A

## Purpose

Sprint 4P-8A adds only the SQLite schema foundation for future SourceCard metadata review records.

This sprint does not add metadata save commands, read/list commands, UI editing, metadata save behavior, SourceCard creation, parser/classification/AI/provider behavior, citation/APA finalization, dependencies, package changes, lockfile changes, or unrelated runtime changes.

## Tables Added

New migration:

`src-tauri/migrations/014_add_sourcecard_metadata_reviews.sql`

The migration adds:

- `sourcecard_metadata_reviews`
- `sourcecard_metadata_review_audit_events`

It does not add `sourcecard_metadata_review_fields`.

## Why Field-Level Table Was Deferred

Sprint 4P-7 recommended a staged MVP. The first safe schema step needs a review record plus audit events. Field-level history, search, stale-field invalidation, and normalized field review timelines are useful later, but they are not required before the save/read command contract exists.

Deferring `sourcecard_metadata_review_fields` keeps the first migration smaller and avoids creating field-level persistence before the product has an editable metadata review mode.

## Schema Summary

### `sourcecard_metadata_reviews`

Purpose:

- Store a future human metadata review record rooted in a saved SourceDocument.
- Preserve reviewed bibliographic metadata before SourceCard creation exists.
- Keep citation/APA readiness conservative by default.

Key fields:

- `id`
- `source_document_id`
- `created_from_candidate_id`
- `review_status`
- `source_type`
- `reviewed_title`
- `reviewed_authors_json`
- `reviewed_year`
- `reviewed_doi`
- `reviewed_url`
- `reviewed_container`
- `reviewed_publisher`
- `reviewed_volume`
- `reviewed_issue`
- `reviewed_pages`
- `reviewed_notes`
- `citation_text_candidate`
- `apa_reference_candidate`
- `citation_ready`
- `apa_final_verified`
- `human_review_required`
- `human_verified_fields_json`
- `blockers_json`
- `warnings_json`
- `safety_flags_json`
- `read_back_status`
- `created_at`
- `updated_at`

Safety defaults:

- `citation_ready` defaults to `0`.
- `apa_final_verified` defaults to `0` and is constrained to remain `0`.
- `human_review_required` defaults to `1` and is constrained to remain `1`.

### `sourcecard_metadata_review_audit_events`

Purpose:

- Store future audit events for metadata review save attempts, rejections, saved records, existing records, failed read-back, and verification.
- Preserve blocker, warning, safety flag, and read-back snapshots.

Key fields:

- `id`
- `created_at`
- `event_type`
- `command_name`
- `source_document_id`
- `metadata_review_id`
- `result_status`
- `blockers_json`
- `warnings_json`
- `safety_flags_json`
- `read_back_status`
- `message`

Supported event types:

- `sourcecard_metadata_review_save_requested`
- `sourcecard_metadata_review_save_rejected`
- `sourcecard_metadata_review_saved`
- `sourcecard_metadata_review_already_exists`
- `sourcecard_metadata_review_failed_read_back`
- `sourcecard_metadata_review_verified`

## Indexes

Indexes added for `sourcecard_metadata_reviews`:

- `idx_sourcecard_metadata_reviews_source_document_id`
- `idx_sourcecard_metadata_reviews_created_from_candidate_id`
- `idx_sourcecard_metadata_reviews_review_status`
- `idx_sourcecard_metadata_reviews_updated_at`

Indexes added for `sourcecard_metadata_review_audit_events`:

- `idx_sourcecard_metadata_review_audit_events_source_document_id`
- `idx_sourcecard_metadata_review_audit_events_metadata_review_id`
- `idx_sourcecard_metadata_review_audit_events_event_type`
- `idx_sourcecard_metadata_review_audit_events_created_at`

## Relation To SourceDocument

Both new tables are rooted in saved SourceDocuments:

- `sourcecard_metadata_reviews.source_document_id` references `source_documents(id)`.
- `sourcecard_metadata_review_audit_events.source_document_id` references `source_documents(id)`.

This preserves the SourceDocument-only intake boundary while creating a future place for reviewed metadata to live before SourceCard creation is allowed.

## Why SourceCard Remains Separate

The new review table is not `source_cards`. It is a pre-creation review record.

This sprint does not:

- modify `source_cards`
- insert SourceCard rows
- update SourceCard rows
- alter SourceCard save/read behavior
- create SourceCard bibliographic metadata
- create APA review artifacts

SourceCard creation remains a future explicit command after metadata review save/read/audit behavior is designed and verified.

## Why No Metadata Save Command Was Added

The migration only creates tables. There is no command yet to write metadata review records.

A future command sprint still needs:

- request/result DTOs
- validation rules
- explicit human approval handling
- read-back verification behavior
- audit event insertion
- idempotency or versioning rules
- UI copy for saved vs saved-not-verified states

Adding a command before those contracts are stable would make the new table look usable before the boundary is complete.

## Why No SourceCard Creation Was Added

Metadata review save and SourceCard creation must remain separate explicit steps. This migration only prepares a storage boundary for future metadata review records.

No SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, citation, APA, extraction run, segment, evidence trace, provider, AI, export, or Writer records are created by this sprint.

## Tests Added Or Strengthened

Rust migration tests now verify:

- migration chain includes `014_add_sourcecard_metadata_reviews`
- schema version advances to `14`
- `sourcecard_metadata_reviews` exists
- `sourcecard_metadata_review_audit_events` exists
- `sourcecard_metadata_review_fields` does not exist
- key SourceCard metadata review indexes exist
- both new tables are empty after migration
- SourceCard and downstream tables remain empty after migration
- migration idempotency still works

## Recommended Next Sprint

Recommended next sprint:

**Sprint 4P-8B - SourceCard Metadata Review DTO Contract**

Recommended scope:

- define TypeScript/Rust DTOs for the future save/read/list/audit commands
- define review status and read-back status enums
- define conservative safety flag shape
- define validation results and idempotency rules
- do not add UI editing or active metadata save until command validation and audit behavior are reviewed
