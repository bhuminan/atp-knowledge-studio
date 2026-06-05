# SourceCard Metadata Review Record Preflight 4P-7

## Purpose

Sprint 4P-7 preflights the future migration and command boundary for the SourceCard metadata review record MVP.

This sprint is documentation and inspection only. It does not implement schema, commands, UI editing, metadata save, SourceCard creation, tests, package changes, dependency changes, parser/classification/AI/provider behavior, citation/APA finalization, or runtime behavior.

## Current State Summary

ATP Knowledge Studio currently preserves the SourceDocument-only intake boundary. A saved SourceDocument can be read back, audited, and inspected. SourceCard Metadata Review Gate Preview and SourceCard Metadata Completion Preview are read-only and continue to show that bibliographic metadata requires human review before SourceCard creation.

Current persistence boundaries:

- `source_documents` stores SourceDocument roots.
- `extraction_runs`, `extraction_segments`, and `evidence_traces` store parser/extraction records linked to SourceDocuments.
- `source_cards` stores actual SourceCard rows linked to SourceDocuments.
- `source_card_bibliographic_metadata` stores structured bibliographic metadata linked to existing SourceCards.
- `source_card_apa_reference_reviews` stores APA review artifacts linked to existing SourceCards.
- `intake_source_document_audit_events` stores SourceDocument intake save/read-back audit events.
- metadata correction audit tables store provider/correction review events, not pre-SourceCard metadata review records.

There is not yet a SourceDocument-rooted metadata review record that can save human-reviewed SourceCard metadata before SourceCard creation.

## Files Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_RECORD_BOUNDARY_4P6.md`
- `docs/architecture/SOURCECARD_METADATA_EDITING_BOUNDARY_DESIGN_4P5.md`
- `docs/architecture/SOURCECARD_METADATA_COMPLETION_PREVIEW_HARDENING_4P4.md`
- `docs/architecture/SOURCECARD_METADATA_COMPLETION_PREVIEW_4P3.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_HARDENING_4P2.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_DESIGN_4P0.md`
- `docs/architecture/STRUCTURED_BIBLIOGRAPHIC_METADATA_CONTRACT_4H2.md`
- `docs/architecture/STRUCTURED_BIBLIOGRAPHIC_METADATA_PERSISTENCE_4H3.md`
- `docs/architecture/APA_REFERENCE_CANDIDATE_CONTRACT_4H5.md`
- `docs/architecture/HUMAN_APA_VERIFICATION_GATE_MVP_4H8A.md`
- `src/lib/sources/SourceCardMetadataCompletionPreviewMapper.ts`
- `src/lib/sources/SourceCardMetadataReviewGateMapper.ts`
- `src/lib/persistence/SourceCardPersistenceReadinessMapper.ts`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `src/types/domain.ts`
- `src-tauri/src/vault_db.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/migrations/001_init_source_document_root.sql`
- `src-tauri/migrations/002_add_source_cards.sql`
- `src-tauri/migrations/006_add_source_card_bibliographic_metadata.sql`
- `src-tauri/migrations/007_add_source_card_apa_reference_reviews.sql`
- `src-tauri/migrations/010_add_metadata_correction_audit_events.sql`
- `src-tauri/migrations/013_add_intake_source_document_audit_events.sql`

## Migration Feasibility Assessment

The future migration is feasible because the current schema already has stable SourceDocument primary keys, SourceCard foreign-key patterns, SourceCard-rooted metadata tables, and audit event table patterns with JSON snapshots.

Options reviewed:

1. One review table only.
   - Lowest implementation cost.
   - Stores reviewed field snapshots in JSON.
   - Weak audit trail unless audit is embedded or added later.

2. Review table plus field-snapshot table.
   - Strong field-level query and history support.
   - More schema and command surface before the MVP has proven field-history needs.

3. Review table plus audit event table.
   - Smallest safe MVP because the save boundary needs read-back and audit receipts.
   - Keeps field snapshots in JSON while preserving event history.
   - Matches existing intake SourceDocument audit and metadata correction audit patterns.

4. Staged across multiple sprints.
   - Best path for safety.
   - First sprint adds review table and audit table.
   - Later sprint can add normalized field snapshots if JSON snapshots become insufficient.

Recommendation:

Use a staged MVP. The first future migration should add `sourcecard_metadata_reviews` plus `sourcecard_metadata_review_audit_events`. Defer `sourcecard_metadata_review_fields` until a later sprint unless the first implementation clearly needs field-level history, search, or stale-field invalidation.

## Proposed MVP Schema

Future migration id:

`014_add_sourcecard_metadata_reviews`

### Table: `sourcecard_metadata_reviews`

Recommended fields:

- `id TEXT PRIMARY KEY`
- `source_document_id TEXT NOT NULL`
- `created_from_candidate_id TEXT`
- `review_status TEXT NOT NULL CHECK (review_status IN ('draft', 'needs_review', 'human_verified', 'saved_not_verified', 'blocked'))`
- `source_type TEXT NOT NULL`
- `reviewed_title TEXT NOT NULL`
- `reviewed_authors_json TEXT NOT NULL DEFAULT '[]'`
- `reviewed_year TEXT`
- `reviewed_doi TEXT`
- `reviewed_url TEXT`
- `reviewed_container TEXT`
- `reviewed_publisher TEXT`
- `reviewed_volume TEXT`
- `reviewed_issue TEXT`
- `reviewed_pages TEXT`
- `reviewed_notes TEXT`
- `citation_text_candidate TEXT`
- `apa_reference_candidate TEXT`
- `citation_ready INTEGER NOT NULL DEFAULT 0 CHECK (citation_ready IN (0, 1))`
- `apa_final_verified INTEGER NOT NULL DEFAULT 0 CHECK (apa_final_verified = 0)`
- `human_review_required INTEGER NOT NULL DEFAULT 1 CHECK (human_review_required = 1)`
- `human_verified_fields_json TEXT NOT NULL DEFAULT '{}'`
- `field_statuses_json TEXT NOT NULL DEFAULT '{}'`
- `blockers_json TEXT NOT NULL DEFAULT '[]'`
- `warnings_json TEXT NOT NULL DEFAULT '[]'`
- `safety_flags_json TEXT NOT NULL DEFAULT '{}'`
- `read_back_status TEXT NOT NULL DEFAULT 'not_verified' CHECK (read_back_status IN ('not_verified', 'verified', 'failed'))`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Foreign key:

- `FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE`

Indexes:

- `idx_sourcecard_metadata_reviews_source_document_id`
- `idx_sourcecard_metadata_reviews_created_from_candidate_id`
- `idx_sourcecard_metadata_reviews_review_status`
- `idx_sourcecard_metadata_reviews_updated_at`

Recommended uniqueness rule:

- Start with `id` as the idempotency key.
- Allow multiple review records per SourceDocument only if the UI later exposes review history.
- For MVP simplicity, use deterministic ids such as `sourcecard-metadata-review-{source_document_id}` or enforce one active review per SourceDocument with a unique index on `source_document_id`.

Preferred MVP choice:

- One active review per SourceDocument.
- `ON CONFLICT(id) DO UPDATE` may update the same review row.
- Audit records preserve save/reject/read-back history.

### Table: `sourcecard_metadata_review_audit_events`

Recommended fields:

- `id TEXT PRIMARY KEY`
- `metadata_review_id TEXT`
- `source_document_id TEXT NOT NULL`
- `created_from_candidate_id TEXT`
- `event_type TEXT NOT NULL CHECK (event_type IN ('sourcecard_metadata_review_save_requested', 'sourcecard_metadata_review_save_rejected', 'sourcecard_metadata_review_saved', 'sourcecard_metadata_review_already_exists', 'sourcecard_metadata_review_failed_read_back', 'sourcecard_metadata_review_verified'))`
- `command_name TEXT NOT NULL`
- `result_status TEXT NOT NULL CHECK (result_status IN ('requested', 'rejected', 'saved', 'already_exists', 'failed_read_back', 'verified'))`
- `changed_fields_json TEXT NOT NULL DEFAULT '[]'`
- `review_status TEXT NOT NULL`
- `blockers_json TEXT NOT NULL DEFAULT '[]'`
- `warnings_json TEXT NOT NULL DEFAULT '[]'`
- `safety_flags_json TEXT NOT NULL DEFAULT '{}'`
- `read_back_status TEXT CHECK (read_back_status IS NULL OR read_back_status IN ('verified', 'failed', 'not_applicable'))`
- `message TEXT`
- `created_at TEXT NOT NULL`

Foreign keys:

- `FOREIGN KEY (metadata_review_id) REFERENCES sourcecard_metadata_reviews(id) ON DELETE SET NULL`
- `FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE`

Indexes:

- `idx_sourcecard_metadata_review_audit_events_review_id`
- `idx_sourcecard_metadata_review_audit_events_source_document_id`
- `idx_sourcecard_metadata_review_audit_events_event_type`
- `idx_sourcecard_metadata_review_audit_events_created_at`

### Deferred Optional Table: `sourcecard_metadata_review_fields`

Defer this table from the first MVP unless field-level history is required immediately.

If added later, proposed fields:

- `id TEXT PRIMARY KEY`
- `metadata_review_id TEXT NOT NULL`
- `field_name TEXT NOT NULL`
- `field_value TEXT`
- `field_status TEXT NOT NULL`
- `source_mode TEXT NOT NULL`
- `human_verified INTEGER NOT NULL DEFAULT 0`
- `reviewer_note TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

## Command Boundary Preflight

Future commands:

- `save_sourcecard_metadata_review`
- `get_sourcecard_metadata_review`
- `list_sourcecard_metadata_reviews_for_source_document`
- `list_sourcecard_metadata_review_audit_events`

Future TypeScript bridge DTOs:

- `SaveSourceCardMetadataReviewRequest`
- `SaveSourceCardMetadataReviewResult`
- `SavedSourceCardMetadataReviewRecord`
- `SourceCardMetadataReviewAuditEvent`
- `SourceCardMetadataReviewListItem`

Command rules:

- Must not create SourceCard records.
- Must not create SourceCard bibliographic metadata rows.
- Must not create APA reference review rows.
- Must not create MarketingTag, KnowledgeCard, DraftArtifact, citation, APA, extraction run, segment, evidence trace, provider, or AI records.
- Must not call parser/classification/AI/provider workflows.
- Must require explicit human approval before `human_verified`.
- Must perform read-back verification before reporting successful verification.
- Must return `saved_not_verified` or `failed_read_back` if saved data cannot be read back or does not match.
- Must return audit event ids for saved, rejected, already-exists, failed-read-back, and verified outcomes.

The save command should write only `sourcecard_metadata_reviews` and `sourcecard_metadata_review_audit_events`.

## Validation Preflight

Future save command should validate:

- `source_document_id` exists.
- SourceDocument root is readable.
- SourceDocument root identity is present: id, title, file name, and file type.
- Source type is supported or explicitly marked blocked.
- Reviewed title is present.
- Human approval flag is present before verified status.
- Source-type-aware metadata requirements are evaluated.
- Missing authors/year/source type keep the review in `needs_review` or `blocked`, depending on source type.
- DOI/URL/provider metadata is accepted only when human-entered or human-confirmed.
- `citation_ready` cannot be true unless a future human citation verification artifact exists.
- `apa_final_verified` cannot be true in the MVP.
- SourceCard creation flag must be false.
- Downstream creation flags must be false.
- Safety flags must be conservative and include no downstream mutation.

Recommended safety flags:

```json
{
  "sourceCardCreated": false,
  "metadataSaved": true,
  "metadataReviewOnly": true,
  "citationReady": false,
  "apaFinalVerified": false,
  "citationMetadataInferred": false,
  "parserCalled": false,
  "classificationCalled": false,
  "providerCalled": false,
  "aiCalled": false,
  "downstreamRecordsCreated": false
}
```

`metadataSaved: true` should mean only that the metadata review record was saved. It must not mean SourceCard metadata or APA metadata was saved.

## Audit Preflight

Future audit events:

- `sourcecard_metadata_review_save_requested`
- `sourcecard_metadata_review_save_rejected`
- `sourcecard_metadata_review_saved`
- `sourcecard_metadata_review_already_exists`
- `sourcecard_metadata_review_failed_read_back`
- `sourcecard_metadata_review_verified`

Required audit payload:

- event id
- source_document_id
- metadata_review_id
- field snapshot or changed field names
- review status
- blockers_json
- warnings_json
- safety_flags_json
- read-back verification status
- timestamp
- command name
- result status
- message

Audit behavior:

- A rejected save should still write an audit event when enough SourceDocument/candidate context exists.
- A failed read-back should write both the attempted save event and the failed-read-back event.
- A repeated save should write `already_exists` or `saved` according to the chosen idempotency rule.
- Audit events should never mutate SourceDocument, SourceCard, bibliographic metadata, APA review, or downstream records.

## Test Preflight

Future implementation tests should cover:

- migration creates `sourcecard_metadata_reviews`.
- migration creates `sourcecard_metadata_review_audit_events`.
- migration is idempotent and increments schema version once.
- save rejected if SourceDocument is missing.
- save rejected if SourceDocument root cannot be read back.
- save rejected if reviewed title is missing.
- save rejected without explicit human approval for `human_verified`.
- save rejected or downgraded if source-type requirements are incomplete.
- save rejected if `citation_ready` is true without human citation verification.
- save rejected if `apa_final_verified` is true.
- save rejected if SourceCard creation or downstream creation flags are true.
- save accepted for minimal reviewed metadata.
- read-back verification returns saved review id.
- read-back mismatch returns `saved_not_verified` or `failed_read_back`.
- repeat save is idempotent or versioned according to the explicit rule.
- audit events are written for saved, rejected, already-exists, failed-read-back, and verified outcomes.
- SourceCard rows remain at zero when only metadata review is saved.
- MarketingTag, KnowledgeCard, DraftArtifact, citation, APA, extraction run, segment, evidence trace, provider, and AI records are not created.
- existing SourceDocument list/read behavior still works.
- existing SourceCard list/read behavior still works.
- existing SourceCard bibliographic metadata and APA review commands still require saved SourceCards.

Playwright or UI tests should wait until editable review mode exists. The migration/command MVP should begin with Rust persistence tests and bridge-level TypeScript tests only.

## UI Implications

Future UI should:

- keep the current SourceCard Metadata Completion Preview read-only until the backend review record exists.
- add editable metadata review mode only after save/read/audit commands exist.
- show unsaved changes separately from saved review state.
- require explicit "Save reviewed metadata".
- require explicit human verification before review passes.
- show read-back verification and audit receipt after save.
- keep SourceCard creation disabled until metadata review is verified.
- show citation/APA not final.
- avoid auto-save on field blur, source change, panel close, or app navigation.
- never auto-create SourceCard after metadata save.

The UI should not present `citation_ready` or `apa_final_verified` as reachable states in the first metadata review MVP.

## Risks

- Adding a field table too early may overcomplicate the first MVP before field-history needs are proven.
- Omitting an audit table would make read-back and review decisions harder to explain.
- Reusing `source_cards` or `source_card_bibliographic_metadata` would require a SourceCard too early and break the pre-creation boundary.
- Treating `metadataSaved` as SourceCard metadata saved would confuse users and downstream code.
- Allowing `citation_ready` or `apa_final_verified` in the first MVP would bypass stricter citation and APA gates.
- Combining save and SourceCard creation in one command would hide the explicit approval boundary.
- Writing rejected audit events may need careful fallback behavior when the SourceDocument id itself is invalid.

## Recommended Next Sprint

Recommended next sprint:

**Sprint 4P-8 - SourceCard Metadata Review Record DTO Contract**

Recommended scope:

- define TypeScript and Rust DTO shapes for save/read/list/audit results
- define `review_status`, `read_back_status`, and safety flag enums
- define validation result shape and idempotency rule
- define exact audit event DTOs
- keep schema migration, commands, UI editing, metadata save behavior, and SourceCard creation deferred until the DTO contract is reviewed
