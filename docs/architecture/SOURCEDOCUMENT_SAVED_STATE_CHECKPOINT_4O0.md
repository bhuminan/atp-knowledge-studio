# SourceDocument Saved-State Architecture Checkpoint 4O-0

Sprint 4O-0 is an architecture checkpoint for the current SourceDocument saved-state path after the first real intake write boundary was opened. It does not add runtime behavior, new persistence behavior, UI controls, schema, parser wiring, classification wiring, provider wiring, AI wiring, citation wiring, APA behavior, or downstream record creation.

The current write path is SourceDocument-only. SourceCard and all downstream records remain deferred.

## Current State Summary

The Source Library incoming package preview can submit approved intake candidates to the Tauri command `save_intake_source_document_candidates`. The command creates SourceDocument root records only when the package and candidate payloads satisfy the SourceDocument-only validation contract.

The saved-state path now has these safety properties:

- An approved, ready PDF or DOCX intake candidate can create a SourceDocument root record.
- Unsupported, blocked, incomplete, unapproved, or unsafe candidates are excluded by the UI or rejected by the backend.
- No auto-save exists in the Source Library preview.
- The active UI save gate requires both explicit approval and safety acknowledgement.
- Repeat save returns `already_exists` for the same intake candidate instead of inserting a duplicate SourceDocument.
- Intake SourceDocument audit event ids are returned and surfaced in the UI receipt.
- Read-back verification is required for `saved` and visible in the UI receipt.
- The result summary keeps SourceCard created count at `0`.
- Parser, classification, AI/provider, citation, APA, Writer, export, MarketingTag, KnowledgeCard, DraftArtifact, extraction run, segment, and evidence trace workflows are not triggered by this path.

## Files Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCE_DOCUMENT_ONLY_INTAKE_SAVE_MVP_4N2.md`
- `docs/architecture/INTAKE_SOURCE_DOCUMENT_AUDIT_TABLE_MVP_4N4.md`
- `docs/architecture/SOURCE_LIBRARY_EXPLICIT_SOURCEDOCUMENT_SAVE_GATE_4N5.md`
- `docs/architecture/POST_WRITE_BOUNDARY_HARDENING_4N6.md`
- `docs/architecture/SAVED_SOURCE_DOCUMENT_VERIFICATION_UX_4N7.md`
- `src/features/source-library/components/SourceLibraryIncomingPackagePreview.tsx`
- `src/lib/sources/SourceDocumentIntakeSaveCandidateMapper.ts`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `tests/e2e/source-library.spec.ts`
- `src-tauri/src/lib.rs`
- `src-tauri/src/vault_db.rs`
- `src-tauri/migrations/013_add_intake_source_document_audit_events.sql`

## Working Capabilities

The current capability is intentionally narrow: intake candidates can become SourceDocument root records only after passing the safe gate.

Working behavior now includes:

- `save_intake_source_document_candidates` is registered as a Tauri command.
- The TypeScript bridge exposes `saveIntakeSourceDocumentCandidates`.
- The Source Library incoming package preview shows an explicit SourceDocument-only save gate.
- The UI sends only ready PDF/DOCX candidates with file name, title, and no blockers.
- The UI excludes unsupported PNG, blocked, incomplete, and needs-review candidates from the save payload.
- The UI payload sets `explicitApproval: true`, `readinessStatus: "ready"`, `reviewStatus: "approved_for_source_document_save"`, and safety flags for persisted, parsed, classified, AI processed, SourceDocument created, and SourceCard created as false.
- The backend saves SourceDocument root rows with `metadata_status = "intake_ready"`, `citation_readiness = "missing_metadata"`, `parser_status = "not_started"`, and `review_status = "approved_for_source_document_save"`.
- The backend returns compact saved SourceDocument data in candidate results.
- Repeat save for the same candidate returns `already_exists` with read-back verification.
- Candidate results include audit event ids after audit insert succeeds.
- Package-level `source_card_created` remains false.

## Validation And Gating Summary

Package validation requires:

- non-empty `packageId`
- `source = "INPUT Room"`
- `intendedDestination = "Source Library Intake"`
- at least one candidate

Candidate validation requires:

- non-empty candidate id
- non-empty file name
- non-empty title
- PDF or DOCX file type
- non-empty source type
- `local_path_policy = "local_path_reference_only"`
- explicit approval
- `readiness_status = "ready"`
- `review_status = "approved_for_source_document_save"`
- safety flags remain false for persisted, parsed, classified, AI processed, SourceDocument created, and SourceCard created

The frontend gate adds a human approval layer before the command runs:

- The save button is disabled until a ready candidate exists.
- The save button is disabled until the user checks "I approve creating SourceDocument records only."
- The save button is disabled until the user checks the acknowledgement that SourceCard, parsing, classification, AI, and citation work remain disabled.
- An in-flight guard blocks rapid repeated activation while a save is already running.

## Audit And Read-Back Summary

The audit table `intake_source_document_audit_events` records outcomes for the intake SourceDocument save command.

Audited result statuses include:

- `saved`
- `already_exists`
- `rejected`
- `failed_read_back`

Audit events store:

- package id
- candidate id
- optional SourceDocument id
- result status
- blockers JSON
- warnings JSON
- safety flags JSON
- read-back status
- message

The save command returns `auditEventsWritten: true` only when every candidate result has at least one audit event id. The UI displays the package-level audit state and per-candidate audit event ids.

Read-back verification checks the saved SourceDocument root after insert or existing-record lookup. A candidate is reported as `saved` only when the saved root matches the expected intake candidate fields and safe statuses. A repeat save can report `already_exists` when the existing SourceDocument belongs to the same intake candidate and passes read-back verification.

## UI Behavior Summary

The current UI behavior is limited to the Source Library incoming package preview and its post-save result panel.

The UI now shows:

- SourceDocument Save Candidate Preview
- SourceCard deferred copy
- candidate readiness counts
- safety flags showing no persisted, parsed, classified, AI processed, SourceDocument-created, or SourceCard-created state before save
- explicit SourceDocument Save Gate
- ready, excluded, and SourceCard count summary
- payload rule copy stating that only ready PDF/DOCX candidates are submitted
- post-save summary for submitted, saved, already exists, rejected, failed read-back, read-back verified, audit event state, and SourceCard created count
- per-candidate SourceDocument id, title, file name, source type, result status, read-back state, and audit event ids

The UI still does not provide an always-available saved SourceDocument browser, full SourceDocument detail page, or audit history browser for saved intake documents.

## QA Coverage Summary

Playwright coverage in `tests/e2e/source-library.spec.ts` verifies the Source Library gate and receipt behavior:

- the SourceDocument save gate is visible in Source Library QA mode
- SourceDocument-only boundaries and SourceCard-deferred copy are visible
- no result panel exists before explicit approval and save
- save remains disabled until both approval checkboxes are checked
- result panel shows read-back verification
- audit event state is visible
- SourceCard created count remains `0`
- only the ready supported candidate appears in the result
- unsupported and needs-review candidates are excluded from the result
- repeat save shows `already_exists`
- repeat save does not create duplicate result cards

Rust tests in `src-tauri/src/vault_db.rs` cover backend persistence and boundaries:

- unsupported file types are rejected and audited
- missing title or file name is rejected
- missing explicit approval is rejected and audited
- unsafe parsed/classified/AI/SourceCard flags are rejected
- approved PDF and DOCX intake candidates save SourceDocument rows
- audit events are written for saved candidates
- repeat save is idempotent and returns `already_exists`
- read-back returns the saved SourceDocument id with `parser_status = "not_started"` and `citation_readiness = "missing_metadata"`
- extraction runs, extraction segments, evidence traces, SourceCards, KnowledgeCards, and DraftArtifacts remain at zero for the intake SourceDocument save path

## Current Limitations

The saved-state foundation is in place, but the user-facing library workflow is not complete.

Known limitations:

- Saved SourceDocument list/browse UX is still limited.
- A dedicated SourceDocument detail page may not exist yet for this intake path.
- A full intake audit browser or audit trace view may not exist yet.
- SourceCard metadata review gate is not implemented for this path.
- Parser boundary is not connected to the saved SourceDocument intake path.
- Classification and KnowledgeCard creation are not active from this path.
- Citation and APA workflows do not consume this intake path yet.
- No batch production workflow exists beyond the current safe gate.
- SourceCard creation remains separate and should not be inferred from SourceDocument save success.

## Risks

Primary risks if the project expands too quickly:

- SourceCard records could be created before bibliographic metadata review is ready.
- Parser or classifier auto-run could blur the boundary between a saved root record and extracted/validated evidence.
- Citation or APA UI could imply source readiness before authors, year, reference text, and citation metadata are reviewed.
- Audit visibility could lag behind new downstream behavior if SourceCard or parser work is added before a read panel or audit trace view.
- Users may confuse a SourceDocument root save with a fully usable SourceCard unless the UI continues to show the deferred state clearly.

## Next Safe Directions

Recommended next sprint: **4O-1 Saved SourceDocument List / Read Panel**.

This is the lowest-risk next step because it reads existing SourceDocument saved state and helps users confirm what exists without creating SourceCards, parsing, classifying, or triggering AI/provider/citation workflows.

Safe sprint options:

- **4O-1 Saved SourceDocument List / Read Panel**: lowest risk. Adds read-only visibility for saved SourceDocument rows and reinforces the existing boundary.
- **4O-2 SourceDocument Detail + Audit Trace View**: low to moderate risk. Best after or alongside list UX so users can inspect one saved SourceDocument and its intake audit events.
- **4P-0 SourceCard Metadata Review Gate Design**: moderate risk. Appropriate as a design sprint before any SourceCard creation is wired. Must specify required metadata, citation readiness, APA constraints, and approval copy.
- **Parser boundary design**: moderate risk. Should define when parser runs, how parser state is audited, and how failed/partial parser states remain separate from SourceCard readiness.

Not recommended yet:

- SourceCard auto-creation from SourceDocument save.
- Parser auto-run after SourceDocument save.
- Classification auto-run after SourceDocument save.
- KnowledgeCard creation from intake save.
- Citation, APA, Writer, export, provider, AI/API, or network follow-up after intake save.

## Boundary Confirmation

Sprint 4O-0 made no runtime behavior changes.

No Rust backend commands were changed. No SQLite schema or migration was changed. No persistence save or read behavior was changed. No SourceDocument records were created by this checkpoint. No SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, citation, APA, extraction run, segment, evidence trace, provider, or AI records were created by this checkpoint. No parser, classification, AI/API/provider, CitationGuard, APA verification, evidence review, DOCX export, WriterAgent, or network behavior was wired.

The SourceDocument-only boundary remains intact.
