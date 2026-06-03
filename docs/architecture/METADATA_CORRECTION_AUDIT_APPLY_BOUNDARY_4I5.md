# Metadata Correction Audit Trail + Explicit Apply Boundary Plan 4I-5

## Purpose

Sprint 4I-5 defines the audit trail and explicit apply boundary for reviewed metadata corrections.

This sprint is documentation and planning only. It does not implement real apply, dry-run apply, migrations, Rust commands, TypeScript mappers, UI, provider calls, AI/API, PDF/OCR, SourceCard mutation, structured bibliographic metadata mutation, APA finalization, DOCX export changes, DraftArtifact changes, KnowledgeCard changes, dependency changes, or Source Library redesign.

ATP's next safe boundary is:

```text
approved metadata correction
-> audit trail
-> explicit apply command
-> metadata read-back
-> verified correction state
```

Core rule:

Approval is not application. A reviewer decision may make a correction eligible for apply, but it must never mutate metadata by itself.

## A. Current State After 4I-4

Sprint 4I-4 added:

- persisted external metadata match summaries in `external_metadata_match_results`
- persisted field-level suggested corrections in `suggested_metadata_corrections`
- item-level review decisions:
  - approve suggested value
  - reject suggested value
  - edit before approval
  - defer / needs more evidence
- Source Library review queue panel for persisted corrections
- Rust and Playwright QA proving review-state updates do not mutate SourceCards or structured metadata

Current hard boundaries:

- no metadata apply exists
- no automatic overwrite exists
- approval updates only `suggested_metadata_corrections.review_status` and `review_decision`
- `source_cards.citation_text` is not overwritten
- `source_card_bibliographic_metadata` is not updated by corrections
- APA-final verification remains impossible

## B. Problem

ATP now has durable reviewed correction decisions, but it still lacks the safe final boundary:

- durable audit event model
- explicit apply command
- field-level target mapping
- read-back verification
- stale correction detection
- reversal or rollback policy

Without these pieces, applying a correction would be too risky. A correction could overwrite a human edit, write to the wrong metadata table, blur compact SourceCard fields with structured bibliographic fields, imply APA-final readiness, or leave no audit trail for later review.

## C. Proposed Audit Event Contract

Future contract name:

`MetadataCorrectionAuditEvent`

Recommended fields:

```ts
type MetadataCorrectionAuditEventType =
  | "match_result_persisted"
  | "correction_created"
  | "correction_routed"
  | "correction_approved"
  | "correction_rejected"
  | "correction_edited_before_approval"
  | "correction_deferred"
  | "apply_preflight_passed"
  | "apply_preflight_blocked"
  | "correction_applied"
  | "metadata_read_back_verified"
  | "correction_apply_failed"
  | "correction_marked_verified";

interface MetadataCorrectionAuditEvent {
  id: string;
  correctionId: string;
  intakeJobId: string;
  sourceCardId: string | null;
  eventType: MetadataCorrectionAuditEventType;
  eventSummary: string;
  targetMetadataTable: "source_cards" | "source_card_bibliographic_metadata";
  targetFieldName: string;
  originalAtpValue: string | null;
  externalSuggestedValue: string;
  reviewerEditedValue: string | null;
  appliedValue: string | null;
  providerName: string;
  providerRecordRef: string;
  confidenceScore: number;
  confidenceBand: "high" | "medium" | "low" | "none";
  sourceMetadataSnapshotJson: string;
  warningFlagsJson: string;
  reviewerNote: string | null;
  createdAt: string;
}
```

Recommended event types:

- `match_result_persisted`
- `correction_created`
- `correction_routed`
- `correction_approved`
- `correction_rejected`
- `correction_edited_before_approval`
- `correction_deferred`
- `apply_preflight_passed`
- `apply_preflight_blocked`
- `correction_applied`
- `metadata_read_back_verified`
- `correction_apply_failed`
- `correction_marked_verified`

Audit contract rules:

- Audit rows are append-only.
- Provider evidence and human decision must remain distinct.
- `originalAtpValue` must reflect the ATP value when the correction was created.
- `sourceMetadataSnapshotJson` must capture the target SourceCard and structured metadata state at event time.
- `appliedValue` remains null until a future apply boundary writes metadata.
- Every apply attempt should produce either a blocked, applied, failed, or read-back event.

## D. Explicit Apply Boundary

Future apply flow:

```text
approved or edited correction
-> validate correction state
-> validate SourceCard exists when source_card_id is required
-> validate field target
-> validate original current value has not changed unexpectedly
-> write audit preflight event
-> call existing explicit metadata update command
-> read back changed metadata
-> write audit read-back event
-> mark correction verified only if read-back matches expected value
```

There must be no direct path:

```text
provider result -> SourceCard update
suggested correction -> metadata overwrite
approval click -> automatic apply without explicit apply step
```

Apply command shape, future:

```ts
interface ApplyMetadataCorrectionRequest {
  correctionId: string;
  acceptStaleCurrentValue: boolean;
  reviewerNote?: string | null;
}
```

Possible response:

```ts
interface ApplyMetadataCorrectionResult {
  applied: boolean;
  verified: boolean;
  blockers: string[];
  warnings: string[];
  correctionId: string;
  sourceCardId: string;
  targetMetadataTable: string;
  targetFieldName: string;
  appliedValue: string | null;
  readBackValue: string | null;
  auditEventIds: string[];
}
```

Apply must be field-level. Batch apply may call the field-level apply boundary repeatedly, but batch orchestration must not bypass validation.

## E. Field-To-Target Mapping Policy

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
- `isbn` if supported or planned by schema
- `url`
- `accessDate`

Current schema note:

- `source_card_bibliographic_metadata` currently supports DOI and URL, but not ISBN.
- If ISBN apply is needed, add a separate planned migration or leave ISBN corrections review-only until schema support exists.

Never update through correction apply:

- SourceCard `citationText`
- APA final verification
- APA verified reference text
- APA reference review artifacts
- DraftArtifact content
- DOCX export output
- KnowledgeCard content
- parser traces or evidence traces
- provider records or raw match evidence

Mapping rules:

- `target_metadata_table` from `suggested_metadata_corrections` is advisory but must be revalidated during apply.
- Unknown fields must block.
- Any attempt to map to `citationText` must block.
- Any field that would imply APA-final readiness must block.

## F. Apply Validation Policy

Block apply when:

- correction is not approved or edited-before-approval
- correction has no `source_card_id`
- SourceCard no longer exists
- target field is unknown
- target table is unsupported
- confidence is low and no explicit reviewer note exists
- provider conflict remains unresolved
- duplicate suspicion remains unresolved
- current ATP value has changed since correction creation and stale review has not been accepted
- target would overwrite `citationText`
- target would imply APA-final verification
- structured metadata apply would require a schema field that does not exist
- reviewer-edited value is empty for an edited correction

Eligible values:

- `approved_suggested_value` applies `suggested_value`
- `edited_before_approval` applies `reviewer_edited_value`

Rejected/deferred/pending rules:

- `rejected_suggested_value` is never apply-eligible.
- `deferred_needs_more_evidence` is never apply-eligible.
- `not_decided` is never apply-eligible.

Low-confidence rule:

Low-confidence corrections may be apply-eligible only when:

- reviewer explicitly edited or approved the correction
- reviewer note is present
- stale and duplicate checks pass
- target field validation passes

## G. Stale Correction Policy

A correction is stale when the current ATP value no longer equals `suggested_metadata_corrections.current_value`.

If current metadata has changed since correction creation:

- do not silently apply
- write `apply_preflight_blocked`
- mark correction as stale or needs review in future status model
- require reviewer reconfirmation
- preserve original correction snapshot

Recommended future status extension:

- `stale_needs_reconfirmation`

Reconfirmation options:

- accept stale current value and apply anyway
- update correction current-value snapshot
- edit suggested value
- reject stale correction
- defer for more evidence

Staleness must compare the actual target table and field, not only the compact SourceCard row.

## H. Read-Back Verification Policy

After apply:

- read back target table
- compare applied value with expected value
- write `metadata_read_back_verified` when values match
- write `correction_apply_failed` when update failed or read-back mismatched
- mark correction verified only if read-back matches

Verification by target:

- Compact fields read back from `source_cards`.
- Structured fields read back from `source_card_bibliographic_metadata`.

Do not mark verified when:

- update command returned saved false
- read-back failed
- read-back value differs from expected value
- APA-final field was requested
- citationText was touched

Correction verified state should be separate from review approved state. Approved means human decision. Verified means metadata was applied and read back successfully.

## I. UI Plan

Future Source Library UI should show:

- approved corrections ready to apply
- apply preflight summary
- skipped/blocked corrections
- target table and target field
- original value, suggested value, reviewer-edited value
- current live ATP value
- stale status
- warning count
- audit event preview
- explicit `Apply Approved Correction` button
- no APA-final notice
- no citationText overwrite notice

Suggested UX flow:

```text
Suggested Corrections Review Queue
-> filter: approved / edited
-> open correction detail
-> show preflight check
-> show target mapping
-> show audit event preview
-> explicit apply
-> read-back verification summary
```

Batch apply should remain disabled until the field-level apply boundary and audit trail are reliable.

Required UI notices:

- `External metadata is evidence, not truth.`
- `Apply is explicit and audited.`
- `Approval does not apply metadata.`
- `SourceCard citationText is never overwritten by correction apply.`
- `APA-final verification is not supported by this workflow.`

## J. QA Strategy

Future tests should cover:

Rust/persistence:

- audit event creation
- apply preflight passes for approved correction
- apply preflight passes for edited correction with reviewer-edited value
- apply preflight blocks pending correction
- apply preflight blocks rejected correction
- apply preflight blocks deferred correction
- stale current value blocks apply
- stale current value can only proceed with explicit stale acceptance
- low confidence without reviewer note blocks apply
- provider conflict blocks apply
- duplicate suspicion blocks apply
- citationText overwrite is blocked
- APA-final is blocked
- structured metadata apply uses structured metadata command
- compact metadata apply uses compact SourceCard metadata command
- read-back verification passes correctly
- read-back verification failure prevents verified state
- verified state is set only after read-back
- rejected correction remains auditable
- no provider result can mutate metadata directly

TypeScript:

- field-to-target mapper accepts only allowed fields
- field-to-target mapper rejects citationText
- apply preflight summary reports blockers and warnings
- stale comparison uses current target table value
- edited correction uses reviewer edited value
- approved correction uses suggested value

Playwright:

- approved corrections ready-to-apply panel appears
- apply preflight summary is visible
- blocked corrections show reasons
- stale correction warning is visible
- explicit apply button is not shown for rejected/deferred/pending corrections
- no APA-final notice is visible
- no citationText overwrite notice is visible
- read-back verification result is visible after future apply

Regression:

- existing Source Library QA remains stable
- existing APA review gate remains internal-use only
- existing DOCX export behavior remains unchanged
- existing DraftArtifact and KnowledgeCard flows remain unchanged

## K. Recommended Next Sprint

Recommended next sprint:

Sprint 4I-6 - Metadata Correction Audit Trail Persistence MVP

Scope:

- Add `metadata_correction_audit_events` table.
- Write audit events for match result persistence, correction creation, routing, and review decisions.
- Do not apply metadata yet.
- Do not mutate SourceCards or structured bibliographic metadata.

Alternative next sprint:

Sprint 4I-6 - Explicit Apply Dry-Run Preview MVP

Scope:

- Add a pure preflight/dry-run mapper.
- Show target table, field, expected value, stale status, and blockers.
- Do not apply metadata yet.

Recommendation:

Do audit trail persistence first. ATP should have durable audit events before implementing even a narrow explicit apply command.

## Hard Scope Boundary

4I-5 does not implement:

- real Crossref
- real OpenAlex
- DOI lookup
- ISBN lookup
- web search
- AI/API
- PDF parser
- OCR
- automatic metadata overwrite
- metadata apply
- SourceCard mutation from corrections
- structured bibliographic metadata mutation from corrections
- citationText overwrite
- APA finalizer
- APA-final verification
- DOCX export changes
- DraftArtifact changes
- KnowledgeCard changes
- dependency changes
- Source Library redesign
- new sprint beyond 4I-5
