# Intake SourceDocument Save Audit Boundary 4N-3

Sprint 4N-3 inspects the audit boundary needed before `save_intake_source_document_candidates` is wired into an active UI approval flow. This sprint is documentation and inspection only. It does not change runtime behavior, commands, schema, migrations, UI, parser, classifier, AI/API/provider, citation, APA, export, or SourceCard/downstream save behavior.

## Inspected Files

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/REAL_INTAKE_PERSISTENCE_BOUNDARY_4M3.md`
- `docs/architecture/SOURCE_DOCUMENT_SAVE_COMMAND_BOUNDARY_4N1.md`
- `docs/architecture/SOURCE_DOCUMENT_ONLY_INTAKE_SAVE_MVP_4N2.md`
- `docs/architecture/SUGGESTED_CORRECTIONS_REVIEW_QUEUE_PLAN_4I3.md`
- `src-tauri/src/lib.rs`
- `src-tauri/src/vault_db.rs`
- `src-tauri/migrations/009_add_suggested_metadata_corrections.sql`
- `src-tauri/migrations/010_add_metadata_correction_audit_events.sql`
- `src-tauri/migrations/011_expand_metadata_correction_audit_preflight_events.sql`
- `src-tauri/migrations/012_add_metadata_correction_structured_apply_events.sql`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `tests/e2e/source-library.spec.ts`

## Current Audit Capabilities

ATP currently has an append-only audit table for metadata correction work:

`metadata_correction_audit_events`

The table supports:

- correction creation
- correction review decisions
- apply dry-run preflight events
- structured metadata apply started/applied events
- structured metadata read-back verification
- structured metadata apply failure

The Rust helper path is centered on `insert_metadata_correction_audit_event_from_correction` and `insert_metadata_correction_audit_event_from_correction_with_applied_value`. The helpers require a `SavedSuggestedMetadataCorrection`, then copy correction-specific fields into the audit row.

The frontend browser fallback mirrors the same pattern through `appendMetadataCorrectionAuditEventBrowserFallback`.

Existing tests verify that:

- review decisions create correction audit events
- dry-run can write `apply_preflight_passed` and `apply_preflight_blocked`
- structured metadata apply writes started/applied/read-back-verified events
- read-back failure writes `correction_apply_failed`
- audit events do not mutate SourceCard metadata by themselves

## Why 4N-2 Returned `auditEventsWritten: false`

The 4N-2 SourceDocument-only intake save command creates SourceDocument roots directly from approved INPUT Room candidates. It is not a metadata correction flow.

The existing audit table is not safe to reuse because:

- `correction_id` is required and foreign keys to `suggested_metadata_corrections`.
- `intake_job_id` is required and foreign keys to `batch_research_intake_jobs`.
- `event_type` is CHECK-constrained to metadata correction event names.
- event payload fields are correction/provider oriented: target metadata table, target field, original ATP value, external suggested value, provider record, confidence score, and reviewer edited value.
- read-back verification event semantics currently mean structured metadata read-back, not SourceDocument root read-back.
- rejected SourceDocument intake candidates may not have suggested corrections or batch intake job rows.
- idempotent `already_exists` outcomes do not map cleanly to correction apply semantics.

Reusing this table would require fake correction ids, fake target metadata fields, or broadening CHECK constraints in a way that blurs audit meaning. That would create schema drift and make audit history harder to trust.

## Can 4N-2 Safely Write Audit Events Now?

No. There is no suitable existing audit table or helper for intake SourceDocument save events.

Current capability assessment:

- Suitable existing audit table: no
- Suitable existing event type pattern: no
- Safe target entity id pattern: no
- Rejected attempt representation: no
- `already_exists` representation: no
- failed SourceDocument read-back representation: no
- way to avoid schema drift: no, not with existing audit table

The safest current behavior is to keep `auditEventsWritten: false`, return the audit limitation, and block active UI save wiring until an intake-specific audit table exists.

## Proposed Future Audit Table

Add a narrow append-only table in a future migration:

`intake_source_document_audit_events`

Recommended fields:

- `id`
- `created_at`
- `command_name`
- `package_id`
- `candidate_id`
- `source_document_id`
- `event_type`
- `result_status`
- `event_summary`
- `blockers_json`
- `warnings_json`
- `safety_flags_json`
- `read_back_verified`
- `read_back_snapshot_json`
- `source`
- `intended_destination`
- `local_path_policy`
- `file_name`
- `file_type`

Recommended indexes:

- `package_id`
- `candidate_id`
- `source_document_id`
- `event_type`
- `created_at`

The table should not foreign key to `source_documents` for rejected attempts, because rejected attempts may not have a saved SourceDocument id. If a foreign key is desired later, use nullable `source_document_id` with careful handling for rejected rows.

## Proposed Event Types

Supported event types for the future intake audit table:

- `intake_source_document_save_requested`
- `intake_source_document_save_rejected`
- `intake_source_document_save_succeeded`
- `intake_source_document_save_already_exists`
- `intake_source_document_save_failed_read_back`

Optional future event:

- `intake_source_document_save_package_blocked`

## Event Behavior

`intake_source_document_save_requested`

- Write when a future UI or command boundary receives an explicit save request.
- Include full package id, candidate id, safety flags, and approval state.
- Does not mean a row was created.

`intake_source_document_save_rejected`

- Write for unsupported type, missing title/file name, missing explicit approval, non-ready review state, unsupported local path policy, or unsafe safety flags.
- Include blockers and warnings.
- `source_document_id` may be null.
- `read_back_verified` must be false.

`intake_source_document_save_succeeded`

- Write only after SourceDocument root insert and read-back verification pass.
- Include saved SourceDocument id and compact read-back snapshot.
- Confirm parser status remains `not_started`, citation readiness remains `missing_metadata`, and SourceCard is not created.

`intake_source_document_save_already_exists`

- Write when idempotency finds an existing SourceDocument for the same intake candidate and read-back verification passes.
- Include the existing SourceDocument id and read-back snapshot.
- Does not create a duplicate row.

`intake_source_document_save_failed_read_back`

- Write when insert happens but read-back verification fails.
- Include blockers or mismatch summary.
- Mark `read_back_verified` false.
- Future UI must show retry/manual inspection rather than success.

## Future Command Result Changes

After the audit table exists, `save_intake_source_document_candidates` should return:

- `auditEventsWritten: true` when events are inserted
- package-level `auditEventIds`
- per-candidate `auditEventIds`
- unchanged `sourceCardCreated: false`
- unchanged per-candidate read-back status

The command should still report `saved` only for `saved` or `already_exists` candidates with read-back verification.

## UI Implications

Do not wire an active SourceDocument intake save button until audit exists.

Future UI should show:

- explicit approval language
- SourceDocument-only scope
- SourceCard deferred notice
- audit event receipt
- per-candidate saved/rejected/already-exists/failed-read-back status
- no parser/classifier/AI/provider/citation/APA/export activity

Preview-only panels may continue to show that the backend command exists but is not UI-wired.

## Schema And Migration Recommendation

Recommendation: add a narrow new audit table/migration in a future sprint.

Do not reuse `metadata_correction_audit_events`. It is correctly specialized for metadata correction/apply audit history and should stay that way.

Do not add the migration in 4N-3. This sprint closes the design gap and keeps runtime behavior unchanged.

## Risks

- Reusing metadata correction audit rows would make SourceDocument save history look like metadata correction history.
- Rejected candidates need audit rows even when no SourceDocument exists, which conflicts with strict saved-record foreign-key assumptions.
- Adding audit too late would make UI approval untraceable.
- Adding audit too broadly could create a generic event table without useful review semantics.
- Auditing `already_exists` incorrectly could look like duplicate creation.
- Failed read-back events must be visible; otherwise the command could appear successful while verification failed.

## Recommended Next Sprint

Sprint 4N-4 should add the `intake_source_document_audit_events` migration and minimal Rust insert/list helpers for `save_intake_source_document_candidates`.

Keep the save command unwired from active UI until:

- audit events are written for requested, rejected, succeeded, already-exists, and failed-read-back outcomes
- Rust tests verify audit rows for all candidate result statuses
- UI receipt design shows audit ids and read-back status clearly
