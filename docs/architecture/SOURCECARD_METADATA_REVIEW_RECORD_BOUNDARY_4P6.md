# SourceCard Metadata Review Record Boundary 4P-6

## Purpose

Sprint 4P-6 designs the future persistence boundary for saving human-reviewed SourceCard metadata before SourceCard creation.

This sprint is documentation and architecture only. It does not add schema, migrations, backend commands, TypeScript app code, editable UI, metadata save behavior, SourceCard creation, parser/classification/AI/provider behavior, citation/APA finalization, dependencies, tests, or lockfile changes.

## Current State Summary

The current app has a SourceDocument-only save/read path with read-back visibility and intake audit events. SourceCard Metadata Review Gate Preview and SourceCard Metadata Completion Preview are read-only. They show that bibliographic metadata still requires human review and that SourceCard creation remains deferred.

Existing persistence boundaries are intentionally separate:

- `source_documents` stores the SourceDocument root and intake identity.
- `intake_source_document_audit_events` records SourceDocument intake save outcomes and read-back status.
- `source_cards` stores actual SourceCard rows linked to SourceDocuments.
- `source_card_bibliographic_metadata` stores structured bibliographic metadata only for an existing SourceCard.
- `source_card_apa_reference_reviews` stores APA review artifacts only for an existing SourceCard.

This leaves an intentional gap for a future pre-creation metadata review record. The future record should be SourceDocument-rooted, should not create a SourceCard, and should not reuse existing SourceCard update or structured metadata upsert commands before a SourceCard exists.

## Files Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCECARD_METADATA_EDITING_BOUNDARY_DESIGN_4P5.md`
- `docs/architecture/SOURCECARD_METADATA_COMPLETION_PREVIEW_HARDENING_4P4.md`
- `docs/architecture/SOURCECARD_METADATA_COMPLETION_PREVIEW_4P3.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_HARDENING_4P2.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_DESIGN_4P0.md`
- `docs/architecture/STRUCTURED_BIBLIOGRAPHIC_METADATA_CONTRACT_4H2.md`
- `docs/architecture/STRUCTURED_BIBLIOGRAPHIC_METADATA_PERSISTENCE_4H3.md`
- `docs/architecture/STRUCTURED_METADATA_READINESS_VALIDATOR_4H4.md`
- `docs/architecture/APA_REFERENCE_CANDIDATE_CONTRACT_4H5.md`
- `docs/architecture/APA_REFERENCE_CANDIDATE_PREVIEW_4H6.md`
- `docs/architecture/HUMAN_APA_VERIFICATION_GATE_4H7.md`
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
- `src-tauri/migrations/013_add_intake_source_document_audit_events.sql`

## Proposed Metadata Review Record Boundary

The future boundary should introduce a narrow SourceDocument-rooted review record, not a SourceCard row.

Suggested table concepts:

- `sourcecard_metadata_reviews`
- `sourcecard_metadata_review_fields`

Suggested TypeScript/Rust DTO concepts:

- `SourceCardMetadataReviewRecord`
- `SourceCardMetadataReviewFieldSnapshot`
- `SaveSourceCardMetadataReviewRequest`
- `SaveSourceCardMetadataReviewResult`
- `ReadSourceCardMetadataReviewRequest`
- `ReadSourceCardMetadataReviewResult`

Boundary rules:

- A metadata review record links to a saved SourceDocument.
- Saving a metadata review record does not create a SourceCard.
- Saving a metadata review record does not create structured SourceCard bibliographic metadata.
- Saving a metadata review record does not create APA review artifacts.
- SourceCard creation remains locked until the review record is saved, read back, and verified.
- A later SourceCard creation command must be separate and must require explicit user approval.

## Proposed Data Model

Recommended table:

`sourcecard_metadata_reviews`

Recommended fields:

- `metadata_review_id TEXT PRIMARY KEY`
- `source_document_id TEXT NOT NULL`
- `created_from_candidate_id TEXT`
- `provenance_id TEXT`
- `review_status TEXT NOT NULL`
- `source_type TEXT NOT NULL`
- `reviewed_title TEXT NOT NULL`
- `reviewed_authors TEXT`
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
- `citation_ready INTEGER NOT NULL DEFAULT 0`
- `apa_final_verified INTEGER NOT NULL DEFAULT 0`
- `human_review_required INTEGER NOT NULL DEFAULT 1`
- `human_verified_fields_json TEXT NOT NULL DEFAULT '{}'`
- `field_statuses_json TEXT NOT NULL DEFAULT '{}'`
- `blockers_json TEXT NOT NULL DEFAULT '[]'`
- `warnings_json TEXT NOT NULL DEFAULT '[]'`
- `safety_flags_json TEXT NOT NULL DEFAULT '{}'`
- `read_back_status TEXT NOT NULL DEFAULT 'not_verified'`
- `read_back_verified_at TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Recommended foreign key:

- `source_document_id REFERENCES source_documents(id) ON DELETE CASCADE`

Recommended indexes:

- `idx_sourcecard_metadata_reviews_source_document_id`
- `idx_sourcecard_metadata_reviews_created_from_candidate_id`
- `idx_sourcecard_metadata_reviews_review_status`
- `idx_sourcecard_metadata_reviews_updated_at`

Optional second table:

`sourcecard_metadata_review_fields`

Recommended field snapshot columns:

- `metadata_review_field_id TEXT PRIMARY KEY`
- `metadata_review_id TEXT NOT NULL`
- `field_name TEXT NOT NULL`
- `field_label TEXT NOT NULL`
- `field_value TEXT`
- `field_status TEXT NOT NULL`
- `previous_value TEXT`
- `source_mode TEXT NOT NULL`
- `human_verified INTEGER NOT NULL DEFAULT 0`
- `reviewer_note TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

The first implementation may store field snapshots in JSON if that is safer for the MVP. A normalized field table becomes useful when field-level audit, stale-field detection, or field-specific review history is needed.

## Validation Rules

Future metadata review save must validate:

- `metadata_review_id` is present and stable.
- `source_document_id` links to an existing saved SourceDocument.
- SourceDocument root can be read back before save is reported.
- SourceDocument root identity is present: id, title, file name, and file type.
- SourceDocument read-back status is verified or the save result remains `saved_not_verified`.
- Human approval is required before `review_status` can become `human_verified`.
- `source_type` must be selected or confirmed by a human.
- Title must be reviewed or explicitly carried forward from SourceDocument root as reviewed title.
- Authors/year/source-type requirements depend on selected source type.
- DOI, URL, publisher, journal/container, volume, issue, and pages must remain blank, needs-review, or human-entered; they must not be guessed.
- Citation text candidate may be stored as a candidate only.
- APA reference candidate may be stored as a candidate only.
- `citation_ready` defaults to false and cannot become true without explicit human citation verification.
- `apa_final_verified` defaults to false and cannot be set by this metadata review record.
- Provider/AI/parser suggestions, if future, cannot overwrite reviewed fields directly.
- Safety flags must show no SourceCard, KnowledgeCard, MarketingTag, DraftArtifact, citation, APA, extraction run, segment, evidence trace, provider, or AI record was created.
- Metadata review save does not mutate `source_cards`.
- Metadata review save does not mutate `source_card_bibliographic_metadata`.
- Metadata review save does not mutate SourceDocument root fields.

Source-type validation should follow the structured metadata readiness direction:

- Journal article: require reviewed title, authors, year, and journal before verified review.
- Book: require reviewed title, authors or editors, year, and publisher before verified review.
- Book chapter: require reviewed chapter title, authors, year, container, and publisher before verified review.
- Report/white paper: require reviewed title, author/organization, year, and publisher/institution before verified review.
- Website/web article: require reviewed title and URL, with author/date warnings when absent.
- DOCX manuscript/source note: require reviewed title and warn that DOCX parser page numbers are not publication page ranges.
- Teaching note: require reviewed title and warn that external citability needs academic review.
- Unknown source type: block verified review until source type is resolved.

## Audit / Read-Back Requirements

Future implementation must:

- write the metadata review record in a transaction
- read the saved review record back before reporting success
- compare saved values with the request snapshot
- append metadata review audit events
- return audit event ids in the save result
- show audit event ids in the UI
- mark the result `saved_not_verified` if read-back fails or mismatches
- keep SourceCard creation locked until review is verified

Suggested audit table:

`sourcecard_metadata_review_audit_events`

Suggested audit events:

- `sourcecard_metadata_review_started`
- `sourcecard_metadata_review_saved`
- `sourcecard_metadata_review_verified`
- `sourcecard_metadata_review_rejected`
- `sourcecard_metadata_review_reset`
- `sourcecard_creation_gate_unlocked`
- `sourcecard_creation_gate_blocked`

Recommended audit payload:

- `audit_event_id`
- `metadata_review_id`
- `source_document_id`
- `created_from_candidate_id`
- `event_type`
- `command_name`
- `result_status`
- `field_name`
- `previous_value` when safe
- `new_value` when safe
- `review_status`
- `human_confirmation_flag`
- `blockers_json`
- `warnings_json`
- `safety_flags_json`
- `read_back_status`
- `message`
- `created_at`

The read-back result should include:

- saved metadata review record
- normalized field status snapshot
- warnings and blockers snapshot
- safety flags
- audit event ids
- read-back verification status
- SourceCard creation eligibility state

Read-back verification should not imply SourceCard creation. It only proves that the metadata review record was persisted and retrieved.

## Future UI Implications

Future UI should:

- show editable fields only inside an explicit metadata review mode
- keep current preview surfaces read-only until that mode is implemented
- distinguish `edited_not_saved`, `saved_not_verified`, and `human_verified`
- show unsaved changes before allowing source selection changes
- require an explicit "Save metadata review" action
- require explicit human verification before review passes
- show read-back verification after save
- show audit event ids or a compact audit receipt
- keep SourceCard creation disabled until metadata review passes
- show citation/APA not final unless separately verified
- never auto-create a SourceCard after metadata save
- display provider/AI/parser suggestions only as suggestions with provenance
- require a user action before any suggestion becomes a reviewed value

The UI should use separate controls and copy for:

- save metadata review
- verify saved review
- unlock SourceCard creation gate
- create SourceCard in a later flow

This separation prevents a user from mistaking metadata save for SourceCard creation or citation finalization.

## Backend / Persistence Recommendation

Recommended future backend path:

1. Add a dedicated migration for `sourcecard_metadata_reviews`.
2. Optionally add `sourcecard_metadata_review_fields` if field-level history is needed immediately.
3. Add a dedicated audit table or extend a safe audit boundary with SourceCard metadata review event types.
4. Add `save_sourcecard_metadata_review`.
5. Add `read_sourcecard_metadata_review`.
6. Add read-back verification in the save command before returning success.
7. Return `source_card_created: false` or equivalent safety flag.
8. Keep `create_sourcecard_from_verified_metadata_review` as a separate future command.

Conservative MVP rules:

- no parser/classification/AI/provider lookup
- no DOI lookup or network verification
- no CitationGuard or APA finalization
- no SourceCard mutation
- no structured SourceCard bibliographic metadata mutation
- no downstream record creation
- no automatic gate unlock unless read-back verification passes

Do not reuse:

- `save_source_card_candidate`, because it writes `source_cards`.
- `update_source_card_metadata`, because it requires an existing SourceCard and mutates compact SourceCard fields.
- `upsert_source_card_bibliographic_metadata`, because it requires an existing SourceCard and stores SourceCard-rooted structured metadata.
- APA review commands, because they require an existing SourceCard and handle citation review artifacts, not pre-creation bibliographic review.

## Non-Goals

This sprint does not implement:

- schema/migration
- metadata save command
- editable UI
- metadata save
- SourceCard creation
- citation finalization
- APA finalization
- provider/AI lookup
- parser/classification
- KnowledgeCard creation
- MarketingTag creation
- DraftArtifact creation
- citation record creation
- APA record creation
- extraction run, segment, or evidence trace creation
- Writer/DOCX output
- CitationGuard changes
- APA verification changes
- evidence review changes
- package/Cargo/dependency/lockfile changes
- unrelated Source Library, INPUT Room, Writer, Dashboard, or visual refactors

## Risks

- Reusing SourceCard save or update commands could create or mutate SourceCards before metadata review is safely verified.
- Reusing SourceCard bibliographic metadata could require a SourceCard too early and collapse the pre-creation boundary.
- Treating read-back verification as citation readiness would overstate trust.
- Letting `citation_ready` or `apa_final_verified` become true in this record would bypass stricter citation/APA review gates.
- Storing provider/AI suggestions without provenance could make candidates look reviewed.
- Combining metadata save and SourceCard creation in one command would hide the approval boundary.
- Field-level JSON snapshots may be enough for MVP but could limit future audit search unless a normalized field table is added later.

## Recommended Next Sprint

Recommended next sprint:

**Sprint 4P-7 - SourceCard Metadata Review Record DTO Contract**

Recommended scope:

- keep runtime behavior unchanged
- define request/result DTOs for metadata review record save/read
- define field snapshot schema and status enums
- define validation result shape
- define audit event payload shape
- define read-back verification receipt shape
- keep metadata editing, metadata save command, schema migration, and SourceCard creation deferred until the DTO contract is reviewed
