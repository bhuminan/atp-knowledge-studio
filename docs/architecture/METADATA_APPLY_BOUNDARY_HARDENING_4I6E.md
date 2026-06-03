# Metadata Apply Boundary Hardening 4I-6E

## Purpose

Sprint 4I-6E hardens the structured metadata correction apply boundary introduced in 4I-6C. The sprint keeps the apply surface narrow: approved corrections may still apply only to selected `source_card_bibliographic_metadata` fields through explicit user action.

## What Was Hardened

- Duplicate apply protection now treats already verified corrections as blocked during dry-run.
- Browser QA fallback mirrors the Rust dry-run behavior for verified corrections and stale structured metadata values.
- Apply audit snapshots now distinguish preflight events from apply-boundary events.
- Apply audit snapshots now mark whether a mutation was committed for applied/read-back-verified events.
- Source Library apply UI now shows the correction ID, target table, and target field before apply.
- Source Library apply UI now explains stale conflicts and already-verified/already-applied states.
- Source Library apply UI now states that undo is not implemented and that audit trail is the current reversal evidence.

## Tests Added

- Regression coverage blocks duplicate apply after a correction reaches `verified`.
- Regression coverage confirms duplicate apply does not create new apply audit events.
- Regression coverage verifies audit snapshots preserve original ATP value, suggested value, reviewer edit state, applied value, provider name, confidence score, and confidence band.
- Regression coverage checks that apply audit snapshots use `applyBoundary`, `mutationCommitted`, `noApplyBoundary`, and `preflightOnly` flags correctly.
- Regression coverage forces a read-back mismatch and confirms `correction_apply_failed` is auditable.
- Existing stale-value, compact SourceCard target, `citationText`, and APA-final target protections remain in place.
- Playwright coverage checks compact no-undo copy, target row clarity, duplicate dry-run blocking, and the already-verified warning.

## UI Clarifications

The Source Library structured apply panel now displays:

- Correction ID.
- Dry-run status.
- Target table.
- Target field.
- Stale conflict warning when dry-run detects current value drift.
- Already verified / already applied warning when a verified correction is dry-run again.
- "No undo yet - audit trail only."
- "Reversal/undo is planned, not implemented."

## Unresolved Risks

- Rollback/reversal is still not implemented.
- A failed read-back path is auditable, but automatic reversal is not available.
- The apply transaction still depends on read-back verification after mutation.
- Stale-value checks protect the specific target field, not every adjacent metadata field.
- The Source Library workflow remains dense and should later move toward a progressive review workspace.

## Compact SourceCard Apply

Compact SourceCard apply remains blocked. Title, authors, year, source type, and `citationText` mutation should not proceed until rollback/reversal, stale-value handling, read-back verification, and audit semantics are proven safe for compact records.

## Real Provider Readiness

Real provider implementation can proceed only in read-only preview mode. Provider-sourced correction application should not expand beyond the current explicit-review apply boundary until reversal/undo and broader conflict handling are implemented.

## Next Recommended Step

Proceed with a conservative read-only real metadata provider sprint, or implement reversal/undo planning before widening apply targets. Do not add compact SourceCard apply yet.
