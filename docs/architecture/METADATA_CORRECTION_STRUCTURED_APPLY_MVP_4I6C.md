# Metadata Correction Structured Apply MVP 4I-6C

## Purpose

Sprint 4I-6C adds the first explicit apply boundary for human-reviewed metadata corrections. The boundary applies one reviewed correction to `source_card_bibliographic_metadata`, verifies the stored value by reading it back, and records audit events for the apply lifecycle.

This is intentionally narrow. It does not apply compact `source_cards` fields and does not make any citation or APA-final claims.

## Allowed Apply Scope

The MVP can apply reviewed corrections only to these structured bibliographic metadata fields:

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

The command uses the reviewed suggested value or the reviewer-edited value, depending on the correction review decision. It requires `reviewerConfirmedApply: true`.

## Blocked Fields and Outputs

The apply boundary blocks:

- Compact `source_cards` fields: `title`, `authors`, `year`, `sourceType`
- `source_cards.citationText`
- APA verified reference text
- APA-final verification state
- DraftArtifact, KnowledgeCard, MarketingTag, and DOCX export outputs
- Unknown fields and fields not present in the current structured metadata schema

ISBN remains blocked because it is not in the current `source_card_bibliographic_metadata` storage contract.

## Dry-Run Dependency

The apply command reruns the existing metadata correction apply dry-run internally with no audit write. Apply proceeds only when the dry-run status is `ready_to_apply_later`.

The dry-run still validates:

- Correction approval/edit state
- SourceCard linkage
- Supported target table and field
- Stale current value behavior
- Reviewer note requirements for low-confidence corrections

## Audit Events

4I-6C adds audit event types:

- `correction_apply_started`
- `correction_applied`
- `metadata_read_back_verified`
- `correction_apply_failed`

On success, the command writes `correction_apply_started`, applies the structured field, reads it back, writes `correction_applied`, writes `metadata_read_back_verified`, and marks the suggested correction `verified`.

If read-back does not match the intended apply value, the command writes `correction_apply_failed` and does not mark the correction verified.

## Read-Back Verification

Read-back verification compares the stored structured metadata field with the intended apply value after the transaction writes the update. The result is returned to the UI with:

- applied value
- read-back value
- read-back verification flag
- audit event count and IDs
- blockers and warnings

## No-Overwrite Policy

The command does not call compact SourceCard update paths and does not overwrite `citationText`. It does not set APA-final verification and does not mutate DraftArtifact, KnowledgeCard, MarketingTag, or DOCX export data.

The Source Library UI repeats these notices around the explicit apply button so the action remains clearly bounded.

## Limitations

- Real external metadata providers are still not used.
- Corrections are still based on persisted mock provider fixtures.
- Compact SourceCard metadata apply remains future work.
- APA-final verification remains human academic review work.
- Batch apply is not implemented.
- Audit events are append-only, but conflict resolution UX remains basic.

## Next Recommended Sprint

Sprint 4I-6D should harden apply verification and audit review UX before expanding the apply boundary. Recommended work:

- Add review filters for `verified` corrections.
- Add structured metadata read-back summary near the correction queue.
- Keep compact SourceCard field apply blocked until a separate explicit plan exists.
