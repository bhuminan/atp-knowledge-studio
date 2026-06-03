# Suggested Corrections Review Queue MVP 4I-4

## Purpose

Sprint 4I-4 implements the first real Suggested Corrections Review Queue MVP for ATP Knowledge Studio.

The goal is narrow:

```text
batch intake queue records
-> deterministic mock external metadata match
-> persisted match result summaries
-> persisted field-level suggested corrections
-> item-level review state updates
-> no metadata application yet
```

This sprint moves beyond preview-only panels while preserving the central guardrail:

External metadata is evidence, not truth.

## Tables Added

Migration:

`src-tauri/migrations/009_add_suggested_metadata_corrections.sql`

New tables:

### `external_metadata_match_results`

Stores mock provider match summaries per intake job.

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

Relationship:

- References `batch_research_intake_jobs(id)`.

### `suggested_metadata_corrections`

Stores field-level correction candidates generated from persisted mock match results.

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

- References `external_metadata_match_results(id)`.
- References `batch_research_intake_jobs(id)`.
- May later reference `source_cards(id)`.

Idempotency:

- Match results are unique by intake job, provider, and provider record.
- Corrections are unique by intake job, provider record, and field.
- Regeneration refreshes evidence but preserves non-pending review decisions.

## Commands Added

New Tauri commands:

- `create_mock_external_metadata_review_queue_for_intake_jobs`
- `list_suggested_metadata_corrections`
- `update_suggested_metadata_correction_review_state`

Command behavior:

- Reads existing batch intake jobs.
- Uses deterministic mock provider logic only.
- Persists match result summaries.
- Persists suggested corrections.
- Lists corrections with optional filters.
- Updates correction review state only.

The commands do not:

- parse files
- call Crossref, OpenAlex, DOI, ISBN, web, or AI providers
- create SourceDocuments
- create SourceCards
- update SourceCard compact metadata
- update structured bibliographic metadata
- update `citationText`
- set APA-final verification

## Review States

Supported `review_status` values:

- `pending`
- `ready_for_batch_approval`
- `needs_human_review`
- `low_confidence`
- `missing_required_metadata`
- `duplicate_suspected`
- `provider_conflict`
- `approved`
- `rejected`
- `edited`
- `deferred_needs_more_evidence`

Current routing:

- high confidence -> `ready_for_batch_approval`
- medium confidence -> `needs_human_review`
- low confidence -> `low_confidence`
- no match -> no correction rows are created in this MVP

The `ready_for_batch_approval` label is only a queue label in 4I-4. It does not apply metadata.

## Decision States

Supported `review_decision` values:

- `not_decided`
- `approved_suggested_value`
- `rejected_suggested_value`
- `edited_before_approval`
- `deferred_needs_more_evidence`

Decision effects:

- Approve -> `review_status: approved`
- Reject -> `review_status: rejected`
- Edit before approval -> `review_status: edited` and stores `reviewer_edited_value`
- Defer -> `review_status: deferred_needs_more_evidence`

Decision updates preserve:

- `current_value`
- `suggested_value`
- provider evidence
- confidence score and band
- warning flags

## No-Overwrite Boundary

4I-4 explicitly does not apply corrections to metadata.

Review decisions are durable review state only:

```text
persisted correction
-> review decision
-> correction row updated
-> SourceCard unchanged
-> structured bibliographic metadata unchanged
-> citationText unchanged
```

This is intentional. ATP needs persisted correction review before it can safely add an explicit apply boundary.

## Why Approval Does Not Apply Metadata Yet

Approval can mean different things:

- approve provider suggestion exactly
- approve reviewer-edited value
- approve only after duplicate resolution
- approve only after SourceCard linkage exists
- approve for structured metadata but not compact citation text

Applying values safely requires an additional audit/apply boundary. Without that boundary, "approval" could silently overwrite human work. Sprint 4I-4 therefore stores decisions but does not mutate SourceCards or structured bibliographic metadata.

## Mock-Provider-Only Boundary

The provider remains deterministic and local.

No real provider is used:

- no Crossref
- no OpenAlex
- no DOI lookup
- no ISBN lookup
- no web search
- no AI/API
- no provider dependencies

The mock provider supports QA cases:

- high-confidence service quality DOCX chapter
- medium-confidence service quality PDF article
- low-confidence ambiguous local notes
- no-match local source names

## Source Library UI

Source Library adds:

`Suggested Corrections Review Queue MVP`

The compact panel shows:

- generate persisted mock review queue action
- total corrections
- review queue summary counts
- field-level correction list
- current ATP value
- provider suggested value
- provider name
- confidence band and score
- reason
- warnings
- review status
- review decision
- reviewer edited value input
- reviewer note input
- approve / reject / edit / defer controls

Required notices are visible:

- External metadata is evidence, not truth.
- No metadata is overwritten without explicit apply step.
- This sprint does not apply corrections to SourceCards.
- This sprint does not update structured bibliographic metadata.
- SourceCard citationText is not overwritten.
- Approval here means review decision only, not verified metadata application.

## QA Results

Required verification for this sprint:

- `npm run build`
- `npm run qa:source-library`
- `cd src-tauri && cargo test`
- `PATH=/Users/apple/.cargo/bin:$PATH npm run tauri -- dev`
- final `npm run qa:source-library`

Rust tests cover:

- migration creates the new tables
- persisted mock match summaries are created
- suggested corrections are created
- duplicate generation avoids duplicate rows
- list corrections works
- high/medium/low routing works
- approve/reject/edit/defer decisions update only correction state
- SourceCard rows are not mutated
- structured bibliographic metadata rows are not mutated
- SourceCard `citationText` is not overwritten

Playwright QA covers:

- Suggested Corrections Review Queue MVP panel appears
- persisted mock queue can be generated from QA intake jobs
- persisted corrections appear
- current and suggested values are visible
- no-overwrite notices are visible
- approve/reject/edit/defer decision states are visible
- existing Source Library flows remain stable

## Remaining Limitations

- Corrections are generated from mock provider only.
- No real provider integration exists.
- No audit trail table exists yet.
- No explicit metadata apply command exists yet.
- No batch approval application exists yet.
- No duplicate resolution workflow exists yet.
- No SourceCard linkage flow for batch intake items exists yet.
- No PDF parser or OCR exists.
- APA final verification remains out of scope.

## Recommended Next Sprint

Recommended next sprint:

Sprint 4I-5 - Metadata Correction Audit Trail + Explicit Apply Boundary Plan or MVP

Recommended constraints:

- Add audit trail for correction decisions.
- Design or implement explicit apply boundary.
- Keep apply field-level and review-gated.
- Preserve SourceCard `citationText` no-overwrite rule.
- Keep APA-final blocked.
- No real external API until the correction review/apply boundary is stable.
