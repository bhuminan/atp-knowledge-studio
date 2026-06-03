# Metadata Correction Apply Dry-Run Preview 4I-6B

Sprint 4I-6B adds an explicit apply dry-run preview for reviewed metadata corrections. The dry-run evaluates whether a correction could be safely applied later, but it does not mutate ATP metadata.

## Purpose

- Show the exact target table, field, and intended future value for a reviewed correction.
- Validate review state, SourceCard linkage, stale values, target support, confidence, and warning blockers.
- Preserve the rule that approval is not application.
- Record optional preflight audit events without recording any apply event.

## Dry-Run Contract

Command:

- `run_metadata_correction_apply_dry_run`

Input:

- `correctionId`
- `writeAuditEvent`

Output includes:

- `correctionId`
- `intakeJobId`
- `sourceCardId`
- `dryRunStatus`
- `targetMetadataTable`
- `targetFieldName`
- `currentStoredValue`
- `originalCorrectionValue`
- `suggestedValue`
- `reviewerEditedValue`
- `intendedApplyValue`
- `confidenceBand`
- `confidenceScore`
- `blockers`
- `warnings`
- `staleCheckStatus`
- `noOverwritePolicy`
- `nextAction`
- `auditEventPreview`
- optional audit event details

Status values:

- `ready_to_apply_later`
- `blocked`
- `needs_review`
- `stale_current_value`
- `unsupported_target`
- `missing_source_card`
- `low_confidence_requires_note`

## Field-To-Target Mapping

Allowed compact SourceCard targets:

- `title`
- `authors`
- `year`
- `sourceType`

Allowed structured bibliographic metadata targets:

- `publisher`
- `journal`
- `containerTitle`
- `edition`
- `volume`
- `issue`
- `pageRange`
- `doi`
- `url`
- `accessDate`

Blocked or unsupported targets:

- `citationText`
- APA verified reference text
- APA-final verification fields
- `isbn` until the structured metadata schema supports it
- DraftArtifact content
- KnowledgeCard content
- DOCX export output
- unknown fields

## Validation Policy

Dry-run blocks when:

- correction is pending, rejected, or deferred
- correction is not `approved_suggested_value` or `edited_before_approval`
- `source_card_id` is missing
- linked SourceCard is missing
- target table or field is unsupported
- target would overwrite `citationText`
- target would imply APA-final verification
- current stored value differs from correction `current_value`
- intended future value is empty
- confidence is low and reviewer note is missing
- warning flags indicate duplicate, provider conflict, blockers, or required review

Dry-run passes only when:

- correction is approved or edited-before-approval
- target mapping is supported
- SourceCard linkage exists
- linked SourceCard exists
- stale check passes
- intended value is non-empty
- no blocked target is involved

## Stale Correction Policy

`currentStoredValue` is read from the saved SourceCard or structured bibliographic metadata. It is compared with `originalCorrectionValue`.

If the stored value changed since the correction was generated, dry-run returns `stale_current_value`. A future apply sprint must require explicit stale acceptance or reviewer reapproval before mutation.

## Audit Preflight Events

When `writeAuditEvent` is enabled, dry-run writes one audit event:

- `apply_preflight_passed`
- `apply_preflight_blocked`

These events are preflight-only. They must not imply metadata was applied.

4I-6B does not create:

- `correction_applied`
- `metadata_read_back_verified`
- `correction_marked_verified`

`applied_value` remains null.

## UI Behavior

Source Library adds a compact dry-run panel inside the Suggested Corrections Review Queue area.

The panel shows:

- dry-run status
- target table and field
- current stored value
- original correction value
- suggested value
- reviewer edited value
- intended future apply value
- blockers and warnings
- stale check result
- no-overwrite policy
- audit preflight summary

Each visible suggested correction row has a `Run Apply Dry-Run` action.

## No-Apply Boundary

4I-6B does not:

- apply corrections to SourceCards
- mutate structured bibliographic metadata
- overwrite `citationText`
- set APA-final verification
- call the compact SourceCard metadata update command
- call the structured bibliographic metadata upsert command
- call real providers, APIs, parsers, exporters, or AI

## QA Results

Rust tests cover:

- pending correction blocked
- rejected correction blocked
- deferred correction blocked
- approved correction dry-run pass
- edited correction uses `reviewerEditedValue`
- unsupported target blocked
- `citationText` target blocked
- missing SourceCard linkage blocked
- stale current value detected
- low confidence without reviewer note blocked
- SourceCard, structured metadata, citationText, and APA-final state remain unchanged
- preflight audit events keep `applied_value` null

Playwright Source Library QA covers:

- dry-run panel visibility
- dry-run-only/no-apply notices
- blocked dry-run reason
- preflight audit event visibility
- edited intended value visibility
- existing Source Library flow stability

## Remaining Limitations

- No metadata apply implementation exists.
- No stale acceptance path exists.
- Browser QA fallback cannot read real saved SourceCard values.
- ISBN remains unsupported until schema support is explicitly added.
- Preflight audit events are not read-back verification.

## Recommended Next Sprint

4I-6C: Explicit Metadata Apply Boundary MVP, only after the dry-run preview is reviewed and approved.
