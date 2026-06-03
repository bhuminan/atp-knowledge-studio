# Metadata Correction Audit Trail Persistence 4I-6A

Sprint 4I-6A adds durable audit trail persistence for the suggested metadata correction review queue. The audit trail records lifecycle and review decision events, but it does not apply corrections to SourceCards or structured bibliographic metadata.

## Purpose

- Preserve an append-only history for suggested metadata correction creation and review decisions.
- Make human review decisions traceable before any future apply boundary exists.
- Keep the workflow explicit-review-only and non-mutating.

## SQLite Table

`metadata_correction_audit_events` stores one row per audit event.

Key fields:

- `correction_id`
- `intake_job_id`
- `source_card_id`
- `event_type`
- `event_summary`
- `target_metadata_table`
- `target_field_name`
- `original_atp_value`
- `external_suggested_value`
- `reviewer_edited_value`
- `applied_value`
- `provider_name`
- `provider_record_ref`
- `confidence_score`
- `confidence_band`
- `source_metadata_snapshot_json`
- `warning_flags_json`
- `reviewer_note`
- `created_at`

`applied_value` remains null in 4I-6A because no metadata apply workflow exists yet.

## Event Types

Supported events:

- `correction_created`
- `correction_approved`
- `correction_rejected`
- `correction_edited_before_approval`
- `correction_deferred`
- `correction_routed`
- `match_result_persisted`

Queue generation records `correction_created` events. Review decisions record the matching review event in the same transaction as the review state update.

## Commands

- `create_metadata_correction_audit_event`
- `list_metadata_correction_audit_events`

The existing `update_suggested_metadata_correction_review_state` result now also returns the latest audit event and audit event count when a review decision is saved.

## Transaction Behavior

Review state update and audit event insertion are committed together. If the audit insert fails, the review state update is not committed.

## UI Behavior

The Source Library suggested corrections panel now shows a compact metadata correction audit trail:

- total audit event count
- recent event type and summary
- target field
- original ATP value
- external suggested value
- reviewer edited value
- provider
- created timestamp

The panel also repeats no-apply boundary notices so approval is not mistaken for metadata mutation.

## No-Apply Boundary

4I-6A does not:

- apply corrections to SourceCards
- change structured bibliographic metadata
- overwrite `citationText`
- set APA-final verification
- generate APA-final references
- call external metadata APIs

Review approval remains a recorded review decision only.

## QA

Playwright Source Library QA covers:

- audit trail panel visibility
- audit-only/no-apply notices
- `correction_created` event visibility after queue generation
- approve/reject/edit/defer event visibility after review decisions
- existing Source Library flow stability

Rust tests cover migration, append-only event creation/listing, transaction-backed review events, and no SourceCard/bibliographic/APA mutation.

## Remaining Limitations

- No explicit apply preview exists yet.
- Audit events currently snapshot correction fields, not a full before/after SourceCard diff.
- Mock provider data remains local and deterministic.
- Real external provider integration remains out of scope.

## Next Recommended Sprint

4I-6B: explicit metadata correction apply dry-run preview. This should show the exact proposed mutations and blockers without writing SourceCard or structured metadata fields.
