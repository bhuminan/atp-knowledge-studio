# SourceDocument-Only Intake Save MVP 4N-2

Sprint 4N-2 adds the first real persistence boundary from reviewed INPUT Room intake candidates into SourceDocument root records. The implementation is intentionally narrow: SourceDocument roots only, explicit approval only, read-back verified, idempotent by intake candidate identity, and not wired to UI auto-save.

## What Was Implemented

- Added the Tauri command `save_intake_source_document_candidates`.
- Added a TypeScript bridge function `saveIntakeSourceDocumentCandidates`.
- Added Rust tests for validation, approved saves, idempotency, read-back verification, and downstream non-creation.
- Reused the existing `source_documents` table without adding migrations.

The command inserts only `source_documents` rows. It does not use the existing parsed/extraction-oriented `save_source_document_candidate` path.

## Command Input Contract

`SaveIntakeSourceDocumentCandidatesRequest`:

- `packageId`
- `source`: must be `INPUT Room`
- `intendedDestination`: must be `Source Library Intake`
- `candidates`

Each candidate includes:

- `candidateId`
- `sourceDocumentId` optional; if absent, a deterministic id is derived from `candidateId`
- `fileName`
- `fileType`
- `fileSize`
- `localPathReference`
- `localPathPolicy`
- `title`
- `sourceType`
- `readinessStatus`
- `reviewStatus`
- `explicitApproval`
- safety flags for persisted, parsed, classified, AI processed, SourceDocument created, and SourceCard created

## Command Output Contract

`SaveIntakeSourceDocumentCandidatesResult` returns:

- `saved`
- `packageId`
- `dbPath`
- `sourceCardCreated: false`
- `auditEventsWritten: false`
- `auditLimitation`
- package-level blockers and warnings
- per-candidate results

Per-candidate results return:

- `status`: `saved`, `already_exists`, `rejected`, or `failed_read_back`
- `readBackVerified`
- `sourceDocumentId`
- compact saved SourceDocument root data when available
- blockers and warnings

## Validation Rules

The command rejects package requests when:

- package id is missing
- source is not `INPUT Room`
- destination is not `Source Library Intake`
- candidate list is empty

The command rejects candidates when:

- candidate id is missing
- file name is missing
- title is missing
- file type is not PDF or DOCX
- source type is missing
- local path policy is missing or not `local_path_reference_only`
- explicit approval is false
- readiness status is not `ready`
- review status is not `approved_for_source_document_save`
- any safety flag implies the candidate was already persisted, parsed, classified, AI processed, SourceDocument-created, or SourceCard-created

Warnings that do not block SourceDocument root save:

- file size is unavailable
- local path reference is unavailable
- citation metadata is not final
- APA-final readiness is not implied
- SourceCard remains deferred
- source type is validated but not persisted until a future schema supports it

## Persistence Scope

The command writes only `source_documents` rows.

Persisted values intentionally keep downstream states non-final:

- `metadata_status`: `intake_ready`
- `citation_readiness`: `missing_metadata`
- `parser_status`: `not_started`
- `review_status`: `approved_for_source_document_save`
- `citation_metadata_required`: true
- `created_from_candidate_id`: intake candidate id

The command does not create:

- SourceCard records
- MarketingTag records
- KnowledgeCard records
- DraftArtifact records
- extraction runs
- extraction segments
- evidence traces
- citation or APA records
- provider or AI records

It does not run parser, classifier, provider, AI/API/network, CitationGuard, APA verification, evidence review, DOCX export, WriterAgent, or Source Library handoff automation.

## Idempotency Behavior

The command first checks for an existing SourceDocument by:

- requested or derived SourceDocument id
- `created_from_candidate_id`

If an existing SourceDocument belongs to the same intake candidate, the command returns `already_exists` with read-back verification and does not insert a duplicate.

If the requested SourceDocument id already belongs to a different candidate, the candidate is rejected.

No new unique index or schema migration was added in 4N-2. The idempotency rule is conservative and uses existing fields only.

## Audit Behavior

No audit row is written in 4N-2 because the current audit table is metadata-correction-specific and no safe intake audit schema exists yet.

The command returns:

- `auditEventsWritten: false`
- an `auditLimitation` message

Future work should add an intake-specific append-only audit table before this command is wired into production UI approval flows.

## Read-Back Verification

After insert, the command reads back the saved SourceDocument root directly from `source_documents`. It verifies:

- candidate id provenance
- title
- file name
- file type
- local path policy
- citation readiness remains `missing_metadata`
- parser status remains `not_started`
- review status remains `approved_for_source_document_save`

The command does not report a candidate as `saved` unless read-back verification passes. A mismatch returns `failed_read_back`.

## Why SourceCard Remains Deferred

SourceCard creation requires human-reviewed citation and bibliographic metadata. INPUT intake candidates can identify a file and a candidate title, but they do not yet verify authors, year, citation text, APA readiness, source type confidence, or structured bibliographic metadata.

Keeping SourceCard deferred prevents fabricated citation state and preserves the existing SourceCard save boundary.

## Explicitly Not Implemented

- No active UI save button.
- No UI auto-save.
- No SourceCard creation.
- No extraction, parsing, classification, AI, provider, citation, APA, export, MarketingTag, KnowledgeCard, or DraftArtifact creation.
- No schema migration.
- No new audit table.
- No real INPUT Room route/state transfer.
- No Source Library auto-handoff.

## Future Next Sprint Recommendation

Sprint 4N-3 should add an intake-specific audit design or dry-run preflight around `save_intake_source_document_candidates`. The save command should remain unwired from active UI approval until audit events, explicit approval UX, and user-facing save receipts are available.
