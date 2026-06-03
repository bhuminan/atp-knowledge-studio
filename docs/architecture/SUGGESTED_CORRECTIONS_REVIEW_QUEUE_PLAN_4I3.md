# Suggested Corrections Review Queue Persistence Plan 4I-3

## A. Purpose

Sprint 4I-3 defines the persistence and review architecture for suggested metadata corrections produced by external metadata matching.

This sprint is documentation and planning only. It does not implement code, migrations, Rust commands, TypeScript, UI, provider calls, PDF parsing, OCR, AI/API calls, SourceDocument mutation, SourceCard mutation, structured bibliographic metadata mutation, batch approval, APA finalization, DOCX export changes, dependency changes, or Source Library redesign.

ATP needs this plan before batch approval because external metadata match output is only evidence. A provider result may be incomplete, stale, incorrectly matched, or formatted differently from ATP's APA-oriented metadata contract. Suggested corrections need durable review state, field-level decisions, and audit evidence before any human-verified metadata update is allowed.

The target future workflow remains:

```text
Batch intake queue records
-> external metadata match results
-> suggested corrections
-> review queues
-> approve / reject / edit
-> audit trail
-> human-verified metadata update
```

Core product rule:

External metadata is evidence, not truth. It must never overwrite ATP metadata without explicit human approval.

## B. Current State

Completed foundation:

- 4I-1 creates durable `batch_research_intake_jobs` records for selected PDF/DOCX files.
- 4I-1 stores queue status, parser status, metadata extraction status, external match status, review status, duplicate status, warnings, and blockers.
- 4I-1 does not parse files, call external providers, create SourceDocuments, create SourceCards, or overwrite metadata.
- 4I-2 adds a deterministic mock external metadata provider.
- 4I-2 maps queue records to preview-only external metadata match results and suggested corrections.
- 4I-2 displays mock match confidence, provider candidates, suggested corrections, and no-overwrite notices in Source Library.
- 4I-2 keeps every correction in `pending` preview state.

Not implemented yet:

- Suggested corrections are not persisted.
- External metadata match results are not persisted.
- No correction review queue exists.
- No approve/reject/edit workflow exists.
- No metadata mutation occurs from suggested corrections.
- No batch approval exists.
- No real Crossref, OpenAlex, DOI, ISBN, web, or AI provider exists.

Existing relevant persistence boundaries:

- `batch_research_intake_jobs` is the staging table for imported file records.
- `source_cards` contains compact SourceCard metadata including `title`, `authors`, `year`, `citation_text`, `metadata_status`, and `citation_readiness`.
- `source_card_bibliographic_metadata` contains structured bibliographic metadata such as publisher, journal, DOI, URL, volume, issue, page range, APA readiness, and human verification timestamp.
- `update_source_card_metadata` updates compact SourceCard metadata through an explicit command.
- `upsert_source_card_bibliographic_metadata` updates structured metadata through an explicit command and blocks APA-final verification.
- Existing QA verifies that structured bibliographic metadata does not mutate compact SourceCard citation text.

## C. Suggested Correction Artifact Contract

Future contract name:

`SuggestedMetadataCorrection`

Recommended fields:

```ts
type SuggestedMetadataCorrectionReviewStatus =
  | "pending"
  | "ready_for_batch_approval"
  | "needs_human_review"
  | "low_confidence"
  | "missing_required_metadata"
  | "duplicate_suspected"
  | "provider_conflict"
  | "approved"
  | "rejected"
  | "verified";

type SuggestedMetadataCorrectionDecision =
  | "not_decided"
  | "approved_suggested_value"
  | "rejected_suggested_value"
  | "edited_before_approval"
  | "deferred_needs_more_evidence";

interface SuggestedMetadataCorrection {
  correctionId: string;
  intakeJobId: string;
  sourceCardId: string | null;
  fieldName:
    | "title"
    | "authors"
    | "year"
    | "sourceType"
    | "publisher"
    | "journal"
    | "containerTitle"
    | "edition"
    | "volume"
    | "issue"
    | "pageRange"
    | "doi"
    | "isbn"
    | "url"
    | "accessDate";
  currentValue: string | null;
  suggestedValue: string;
  providerName: string;
  providerRecordRef: string;
  confidenceScore: number;
  confidenceBand: "high" | "medium" | "low" | "none";
  reason: string;
  mismatchReasons: string[];
  warningFlags: string[];
  reviewStatus: SuggestedMetadataCorrectionReviewStatus;
  reviewDecision: SuggestedMetadataCorrectionDecision;
  reviewerEditedValue: string | null;
  reviewerNote: string | null;
  createdAt: string;
  updatedAt: string;
}
```

Contract rules:

- `correctionId` must be stable and unique per intake job, provider record, and field.
- `intakeJobId` must reference the originating batch queue record.
- `sourceCardId` remains nullable until the intake item is linked to a saved SourceCard.
- `currentValue` must capture the ATP value at the time the correction was generated.
- `suggestedValue` must capture provider evidence exactly as normalized by the provider adapter.
- `providerRecordRef` must identify the mock/real provider record used to create the correction.
- `confidenceBand` must be stored alongside `confidenceScore` to preserve routing decisions.
- `reviewStatus` and `reviewDecision` must remain separate: status routes work; decision records the human action.
- `reviewerEditedValue` may differ from both `currentValue` and `suggestedValue`.
- Corrections must not imply APA-final readiness.

## D. Review Queue Model

Future review queues should be derived from correction state, not manually duplicated labels.

Recommended queues:

- `ready_for_batch_approval`: high-confidence correction, no blockers, no provider conflict, no duplicate suspicion, field is safe for batch review.
- `needs_human_review`: default review queue for medium confidence, unusual source type, partial evidence, or non-blocking warnings.
- `low_confidence`: low-confidence or weak title/source-type alignment. Must not be batch approved.
- `missing_required_metadata`: item still lacks required fields after suggestions, such as title, authors, year, or source type depending on record type.
- `duplicate_suspected`: correction belongs to an intake item that may duplicate an existing queue item or SourceCard.
- `provider_conflict`: two or more provider candidates suggest conflicting values for the same field.
- `rejected`: reviewer rejected the suggested value.
- `approved`: reviewer approved the suggested or edited value but the metadata update has not necessarily been applied.
- `verified`: approved correction has been applied through the explicit metadata update boundary and is represented in audit trail.

Queue routing should consider:

- confidence band
- required field status
- provider conflict status
- duplicate status
- warnings and blockers
- linked SourceCard availability
- whether the target field maps to compact SourceCard metadata or structured bibliographic metadata

## E. Review Decision Policy

Supported future decisions:

- Approve suggested value.
- Reject suggested value.
- Edit before approval.
- Defer / needs more evidence.

Decision rules:

- High-confidence corrections with no blockers may become batch-approval candidates.
- High confidence does not mean automatic approval.
- Medium-confidence corrections require item-level review.
- Low-confidence corrections cannot be batch approved.
- Provider conflicts must require item-level review.
- Duplicate suspicion must block batch approval until resolved.
- Missing required fields must not be silently filled without explicit approval.
- DOI, ISBN, URL, journal, publisher, and page range suggestions must remain evidence until reviewed.
- Provider values must not overwrite human-entered metadata automatically.
- Rejected corrections must remain auditable and should not be regenerated as new pending corrections unless provider evidence changes.
- Edited approvals must preserve both the provider suggestion and reviewer-edited value.
- Approved corrections should move to `verified` only after the explicit metadata update succeeds.

No automatic overwrite rule:

```text
suggested correction
-> human decision
-> explicit approved update command
-> structured metadata read-back
-> audit event
```

There is no direct path from provider match result to SourceCard or structured metadata mutation.

## F. Persistence Strategy

4I-3 does not implement migrations. The following tables are recommended for a future implementation sprint.

### `external_metadata_match_results`

Purpose:

Store provider match result summaries for an intake job.

Key fields:

- `id`
- `intake_job_id`
- `provider_id`
- `provider_name`
- `provider_type`
- `provider_record_ref`
- `is_mock`
- `match_status`
- `confidence_score`
- `confidence_band`
- `match_reasons_json`
- `mismatch_reasons_json`
- `warning_flags_json`
- `blockers_json`
- `raw_candidate_snapshot_json`
- `created_at`
- `updated_at`

Relationships:

- `intake_job_id` references `batch_research_intake_jobs(id)`.
- Does not reference SourceCard directly because match results can exist before SourceCard creation/linkage.
- Later may be joined to corrections through `match_result_id`.

Boundary:

This table stores provider evidence only. It must not update ATP metadata.

### `suggested_metadata_corrections`

Purpose:

Store field-level suggested metadata corrections generated from provider match results.

Key fields:

- `id`
- `match_result_id`
- `intake_job_id`
- `source_card_id`
- `target_metadata_table`
- `field_name`
- `current_value`
- `suggested_value`
- `provider_name`
- `provider_record_ref`
- `confidence_score`
- `confidence_band`
- `reason`
- `mismatch_reasons_json`
- `warning_flags_json`
- `review_status`
- `review_decision`
- `reviewer_edited_value`
- `reviewer_note`
- `created_at`
- `updated_at`

Relationships:

- `match_result_id` references `external_metadata_match_results(id)`.
- `intake_job_id` references `batch_research_intake_jobs(id)`.
- `source_card_id` is nullable and later references `source_cards(id)`.
- `target_metadata_table` should be either `source_cards` or `source_card_bibliographic_metadata`.

Boundary:

Rows in this table are review candidates only. They must not mutate SourceCard or bibliographic metadata by themselves.

### `metadata_correction_review_decisions`

Purpose:

Record each explicit reviewer decision.

Key fields:

- `id`
- `correction_id`
- `decision`
- `previous_review_status`
- `next_review_status`
- `reviewer_edited_value`
- `reviewer_note`
- `reviewer_id`
- `decided_at`

Relationships:

- `correction_id` references `suggested_metadata_corrections(id)`.

Boundary:

Decision records are immutable. If a reviewer changes their mind, create a new decision row and update the correction's current review status.

### `metadata_correction_audit_events`

Purpose:

Record audit events for creation, routing, review, application, read-back verification, and rollback/reversal planning.

Key fields:

- `id`
- `correction_id`
- `intake_job_id`
- `source_card_id`
- `event_type`
- `event_summary`
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
- `created_at`

Relationships:

- `correction_id` references `suggested_metadata_corrections(id)`.
- `intake_job_id` references `batch_research_intake_jobs(id)`.
- `source_card_id` is nullable and references `source_cards(id)` when available.

Boundary:

Audit events should be append-only. They make batch approval reversible or at least explainable.

## G. Audit Trail Policy

The audit trail must record:

- original ATP value before the suggested correction was created
- external suggested value
- provider name and provider record reference
- provider confidence score and band
- match reasons and mismatch reasons
- warning flags accepted by the reviewer
- user decision
- reviewer-edited value, if any
- reviewer note, if any
- decision timestamp
- source metadata snapshot at decision time
- applied value after explicit update, if any
- read-back verification result after update, if any

Audit events should be created for:

- provider match result stored
- suggested correction created
- correction routed to queue
- correction approved
- correction rejected
- correction edited before approval
- correction deferred
- approved correction applied
- metadata read-back verified
- correction application failed

Audit trail rules:

- Do not overwrite audit rows.
- Do not remove rejected decisions.
- Do not collapse provider evidence and human decision into one row.
- Preserve both provider suggestion and reviewer edit.
- Preserve `source_metadata_snapshot_json` before applying updates.

## H. Human-Approved Update Boundary

Future approved corrections may update structured metadata only through explicit command boundaries.

Recommended update path:

```text
approved correction(s)
-> build metadata update request
-> validate target SourceCard still exists
-> validate correction decision is approved or edited_before_approval
-> call explicit update command
-> read back updated metadata
-> write audit event
-> mark correction verified
```

Boundary rules:

- Compact SourceCard metadata updates must use an explicit SourceCard metadata command.
- Structured bibliographic metadata updates must use an explicit structured metadata command.
- SourceCard `citationText` must not be overwritten automatically.
- APA-final verification must not be set by correction approval.
- `source_card_bibliographic_metadata.apa_readiness` may become `candidate_ready` or `needs_review`, not `final_verified`.
- Human-approved corrections should update structured metadata only after a reviewer action.
- Batch approval must remain auditable and explainable per field.
- Any future reversal should be possible from audit snapshots, even if a full rollback command is implemented later.

Compact vs structured mapping:

- Compact SourceCard fields: `title`, `authors`, `year`, `sourceType`, possibly citation readiness status.
- Structured bibliographic metadata fields: `publisher`, `journal`, `containerTitle`, `edition`, `volume`, `issue`, `pageRange`, `doi`, `url`, `accessDate`.
- `citationText` should be generated or edited only in a separate citation workflow, not by external metadata correction persistence.

## I. UI Workflow Plan

Future UI should extend Source Library carefully without redesigning the workspace.

Recommended components:

- Review queue list grouped by queue status.
- Confidence filter for high, medium, low, and none.
- Provider filter for Crossref, OpenAlex, DOI, ISBN, mock/manual fixture.
- Suggested correction diff view showing current ATP value vs provider suggestion vs reviewer edit.
- Batch approve button for high-confidence items with no blockers.
- Item-level review drawer for medium confidence, low confidence, conflicts, duplicates, and missing fields.
- Reject control with optional reason.
- Edit-before-approval control.
- Defer / needs more evidence control.
- Audit trail view per correction and per intake item.
- Clear no-auto-overwrite notices.

Future UI notices:

- `External metadata is evidence, not truth.`
- `No metadata is overwritten without approval.`
- `Batch approval applies only eligible high-confidence corrections.`
- `Medium, low-confidence, provider conflict, duplicate, and missing metadata items require item-level review.`
- `SourceCard citation text is not overwritten by metadata correction approval.`

Batch approval UX rule:

The batch approve action must show a preflight summary before applying any update:

- number of corrections to approve
- target fields
- target SourceCards
- skipped medium/low/conflict items
- warning count
- audit event count to be created

## J. QA Strategy

Future tests should cover persistence, routing, review decisions, update boundaries, and no-overwrite guarantees.

Rust/persistence tests:

- Stores external metadata match result for an intake job.
- Stores suggested corrections from a mock provider result.
- Lists corrections by review queue.
- Routes high-confidence corrections to `ready_for_batch_approval`.
- Routes medium-confidence corrections to `needs_human_review`.
- Routes low-confidence corrections to `low_confidence`.
- Routes provider conflicts to `provider_conflict`.
- Routes missing required metadata to `missing_required_metadata`.
- Reject decision creates immutable decision row.
- Edit-before-approval stores reviewer-edited value.
- Audit event is created when correction is created.
- Audit event is created when correction is approved/rejected/edited/deferred.
- Approved correction does not mutate metadata until explicit apply command is called.
- Applying approved structured correction updates only `source_card_bibliographic_metadata`.
- Applying approved compact correction updates only intended compact fields.
- SourceCard `citationText` is not overwritten by structured metadata correction approval.
- APA final verification remains blocked.
- Correction read-back verifies applied values.

TypeScript/mapper tests:

- Suggested correction IDs are stable.
- High/medium/low/no-match routing matches confidence policy.
- Provider conflict detection blocks batch approval.
- Missing required field detection blocks silent fill.
- Correction snapshots preserve original value and suggested value.
- `autoOverwriteAllowed` remains false.

Playwright tests:

- Review queue panel appears when corrections exist.
- Confidence filters work.
- High-confidence batch-approval eligibility appears only for eligible corrections.
- Medium/low/conflict corrections are visibly blocked from batch approval.
- Diff view shows current value, suggested value, provider, confidence, warnings, and decision controls.
- Reject workflow changes correction review status but does not mutate metadata.
- Edit workflow stores reviewer-edited value and still requires explicit approval.
- Approved correction creates audit trail preview/record.
- No overwrite occurs without explicit approval.
- SourceCard citationText not overwritten notice remains visible.

Regression tests:

- Existing Source Library QA remains stable.
- Existing SourceDocument, SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, APA review, and DOCX export workflows remain unchanged.

## K. Recommended Next Sprint

Recommended next implementation sprint:

Sprint 4I-4 - Suggested Corrections Review Queue MVP

Recommended 4I-4 constraints:

- Persist suggested corrections from mock provider only.
- Persist external metadata match result summaries from mock provider only.
- Add review queue listing for persisted mock corrections.
- Keep all correction decisions pending by default.
- No real Crossref/OpenAlex/DOI/ISBN API.
- No automatic metadata overwrite.
- No SourceDocument mutation.
- No SourceCard mutation.
- No structured bibliographic metadata mutation.
- No batch approval implementation.
- No APA finalizer.
- No DOCX export changes.
- No dependency changes.

Recommended 4I-4 deliverables:

- SQLite migration for match result and suggested correction tables.
- Rust create/list/read commands for mock suggested corrections.
- TypeScript persistence adapter.
- Source Library read-only persisted review queue panel.
- QA proving persistence exists while metadata remains unchanged.
