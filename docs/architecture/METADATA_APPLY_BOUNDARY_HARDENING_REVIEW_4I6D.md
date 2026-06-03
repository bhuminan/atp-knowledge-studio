# Metadata Apply Boundary Hardening Review 4I-6D

## Purpose

Sprint 4I-6D reviews the structured metadata apply boundary introduced in 4I-6C. This is an inspection and hardening plan only. It does not expand apply scope, does not introduce compact SourceCard apply, and does not start real metadata provider integration.

## Current 4I-6C Apply Flow

The current apply flow is:

1. A suggested metadata correction is created from the mock external metadata match queue.
2. A reviewer approves the suggested value or edits before approval.
3. `run_metadata_correction_apply_dry_run` validates the correction, target, SourceCard linkage, stale value state, warning flags, confidence rules, and intended apply value.
4. `apply_metadata_correction_to_structured_bibliographic_metadata` reruns the dry-run internally with `writeAuditEvent: false`.
5. Apply is blocked unless the internal dry-run returns `ready_to_apply_later`.
6. The command starts a SQLite transaction.
7. The command writes `correction_apply_started`.
8. The command upserts one allowed field in `source_card_bibliographic_metadata`.
9. The command reads the structured metadata row back inside the same transaction.
10. If the read-back value matches the intended value, the command writes `correction_applied` and `metadata_read_back_verified`.
11. The command marks the suggested correction `verified`.
12. The transaction commits.

If dry-run blockers exist, the command returns `applyStatus: blocked` and does not write apply audit events.

## Allowed Fields

4I-6C allows only these `source_card_bibliographic_metadata` fields:

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

The intended value is either `suggestedValue` for `approved_suggested_value` or `reviewerEditedValue` for `edited_before_approval`.

## Blocked Fields and Outputs

The boundary blocks:

- Compact `source_cards` fields: `title`, `authors`, `year`, `sourceType`
- `source_cards.citationText`
- `verifiedReferenceText`
- `apaFinalVerified`
- `isbn`, because the current structured metadata schema does not store it
- Unknown target fields
- DraftArtifact, KnowledgeCard, MarketingTag, and DOCX export outputs
- Real provider/API writes

The implementation preserves the rule that metadata correction apply does not imply APA-final readiness.

## Audit Event Sequence

Successful apply currently writes:

1. `correction_apply_started`
2. `correction_applied`
3. `metadata_read_back_verified`

Blocked dry-runs may write:

- `apply_preflight_blocked`
- `apply_preflight_passed`

Read-back failure can write:

- `correction_apply_failed`

The audit rows include correction ID, intake job ID, SourceCard ID, target table, target field, original ATP value, external suggested value, reviewer-edited value, applied value for apply/read-back events, provider metadata, warning flags, reviewer note, and a JSON snapshot.

## Read-Back Verification Behavior

Read-back verification compares the stored structured metadata field with the intended apply value after the upsert. A successful match returns:

- `applyStatus: applied_and_verified`
- `readBackVerified: true`
- `appliedValue`
- `readBackValue`
- audit event IDs

The suggested correction status becomes `verified` only after read-back success.

## Transaction Boundary

The production Rust command performs apply, read-back, audit inserts, and correction status update within one SQLite transaction. If an error occurs before commit, the transaction is not committed.

This is a strong boundary for single-field structured metadata apply. The current design avoids partial commit of an apply without matching audit events in ordinary command failure cases.

## Failure Modes

Known blocked or handled failure modes:

- Missing correction ID returns an error.
- Unreviewed, rejected, or deferred corrections are blocked by dry-run.
- Missing SourceCard linkage is blocked.
- Missing linked SourceCard is blocked.
- Unsupported target table or field is blocked.
- Empty intended value is blocked.
- Low-confidence correction without reviewer note is blocked.
- Warning flags requiring human review are blocked.
- Stale current stored value is blocked.
- Read-back mismatch returns `read_back_failed` and does not mark the correction `verified`.

Remaining failure modes that need hardening:

- There is no user-facing reversal workflow after a successful apply.
- There is no explicit conflict resolution UI when a correction becomes stale.
- The audit event snapshot says `noApplyBoundary: true` even for apply events; this is semantically stale and should be corrected in a future hardening sprint.
- Browser fallback simulates SourceCard linkage and read-back; it is useful for QA but does not prove desktop SQLite read-back UX end to end.
- The UI shows a single last dry-run/apply result, which can become ambiguous when many correction rows are visible.

## Stale-Value Risk

The dry-run compares the current stored value with the correction's original ATP value. This prevents applying a correction over a changed field.

Residual risk remains because stale handling has no reviewer acceptance flow. When a value is stale, the only safe path is to regenerate or manually revise the correction. A future sprint should add an explicit stale conflict review panel before any broader apply boundary.

## Partial-Success Risk

For the production SQLite command, partial-success risk is low for a single structured field because audit, field upsert, read-back, and verification status live in one transaction.

Residual risk exists at the user workflow layer:

- The UI may show an old dry-run result after list refreshes if the reviewer changes a different correction.
- The command reruns dry-run internally, which protects the backend, but the UI could still make the user's mental model confusing.
- There is no batch operation yet, so no multi-row partial-success behavior has been designed.

## Rollback and Reversal Gap

There is no rollback or reversal command for a successful metadata apply. SQLite transaction rollback handles command failure before commit, but it does not provide human-level undo after commit.

Before compact SourceCard apply or real provider integration, the system should add:

- Explicit before/after audit display.
- A reversal candidate preview.
- A command to restore the previous structured value through the same audit/read-back discipline.
- A visible reason/note requirement for reversal.

## UI Ambiguity Risk

The Source Library apply panel is intentionally compact, but it currently depends on the last dry-run result. This creates ambiguity when the correction list is dense.

Recommended hardening:

- Show the active correction ID and field in the apply panel header.
- Add row-level apply status after success.
- Add a structured metadata read-back summary near the correction queue.
- Add a filter for `verified` corrections.
- Keep compact field blocked messaging visible when the last dry-run target is `source_cards`.

## QA Coverage Gaps

Current Rust tests cover:

- Unconfirmed apply blocked.
- Pending correction blocked.
- Compact SourceCard target blocked.
- APA-final target blocked.
- Successful structured apply.
- Existing compact SourceCard fields preserved.
- Existing non-target structured fields preserved.
- `citationText` preserved.
- APA-final flag remains false.
- Edited value is applied.
- Stale value blocked.
- Missing linked SourceCard blocked.
- Apply/read-back audit events written.
- Correction marked `verified` after read-back success.

Current Playwright QA covers:

- Structured apply panel visibility.
- No-overwrite notices.
- Compact field blocked notice.
- Eligible structured field dry-run.
- Explicit apply button.
- `applied_and_verified` result.
- Read-back verified result.
- Apply/read-back audit event visibility.
- `verified` correction state visibility.

Recommended QA additions:

- Desktop integration test for a real SQLite-backed apply from UI state, if the test harness can run Tauri commands.
- Regression test that apply cannot run twice without stale conflict after the first apply changes the stored field.
- Regression test that failed read-back leaves the correction non-verified.
- Regression test that audit snapshot semantics distinguish preflight-only from real apply.
- UI test for multiple correction rows to ensure the active correction ID is clear.

## Recommended Hardening Items

Priority 1:

- Correct apply audit snapshot semantics so apply events do not say `noApplyBoundary: true`.
- Add a row-level active correction/apply result summary.
- Add a `verified` review-status filter or summary count.
- Add regression coverage for duplicate apply after successful mutation.

Priority 2:

- Add reversal/undo design and command for structured metadata fields.
- Add stale conflict review UX.
- Add before/after structured metadata read-back panel.
- Add explicit reviewer note requirement for apply, not only low-confidence corrections.

Priority 3:

- Add batch apply design only after reversal and conflict UX are stable.
- Consider structured metadata schema expansion, including ISBN, only after the current apply lifecycle is hardened.

## Compact SourceCard Apply Recommendation

Compact SourceCard apply is not safe yet.

Reasons:

- `title`, `authors`, `year`, and `sourceType` are citation-critical fields.
- There is no reversal command.
- There is no stale conflict acceptance workflow.
- There is no row-level before/after UI for compact fields.
- `citationText` overwrite is correctly blocked and should remain blocked.
- APA-final verification remains separate and human-controlled.

Recommendation: keep compact SourceCard apply blocked until rollback/reversal, stale conflict UX, and audit/read-back semantics are stronger.

## Real Provider Recommendation

Real provider implementation should not begin as a write-capable path yet.

It is reasonable to plan or prototype read-only provider ingestion, but provider results must remain candidate evidence until:

- Apply audit snapshots are corrected.
- Reversal/undo exists.
- Stale conflict review exists.
- UI makes active correction and target field unambiguous.
- Batch apply is explicitly designed or deferred.

Recommendation: continue conservative hardening before real provider writes. If real provider work begins, it should be read-only candidate intake with no automatic apply.

## Decision

Do not expand apply scope in the next sprint. The current single-field structured apply is a useful MVP, but the integrity surface is not mature enough for compact SourceCard apply or real provider-backed mutation.

The next sprint should harden audit semantics, UI clarity, duplicate/stale regression coverage, and reversal planning before any broader metadata apply behavior is introduced.
