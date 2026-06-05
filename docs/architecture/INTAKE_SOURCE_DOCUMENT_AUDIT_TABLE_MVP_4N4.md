# Intake SourceDocument Audit Table MVP 4N-4

Sprint 4N-4 adds the first narrow audit persistence layer for the INPUT Room to SourceDocument save command. The scope is limited to audit events for `save_intake_source_document_candidates`; it does not add UI save wiring or downstream record creation.

## What Was Implemented

- Added SQLite table `intake_source_document_audit_events`.
- Added migration `013_add_intake_source_document_audit_events`.
- Added Rust insert/read/list helpers for intake SourceDocument audit events.
- Registered `list_intake_source_document_audit_events` for future audit receipt inspection.
- Updated `save_intake_source_document_candidates` so each candidate result attempts to write an audit event.
- Returned `auditEventsWritten: true` only when every candidate result has a written audit event.
- Returned audit event ids at package and candidate-result level.

## Audited Statuses

The audit table records candidate outcomes from the save command:

- `saved`
- `already_exists`
- `rejected`
- `failed_read_back`

Unsupported files, missing explicit approval, unsafe safety flags, and read-back failures are audited as command outcomes. Unsupported or rejected candidates still do not create SourceDocument rows.

## Preview Boundary

This sprint does not make the INPUT Room save button active. The save command remains a backend boundary that requires explicit approval in the request payload and is not wired into the UI.

If a SourceDocument row is saved but the audit insert fails, the command reports a warning and `auditEventsWritten: false`. The SourceDocument save is not rolled back solely because an audit event failed after the save completed.

## Explicitly Not Implemented

- No UI save wiring.
- No SourceCard creation.
- No extraction, parser, classification, citation, APA, Writer, DOCX export, provider, AI/API, or network behavior.
- No Source Library downstream records beyond the SourceDocument root.
- No changes to metadata correction audit semantics.

## Safety Boundaries

- Read-back verification remains required for successful `saved` and `already_exists` outcomes.
- Audit rows store blockers, warnings, and safety flags as JSON text snapshots.
- The audit list helper filters by package and candidate only; it does not mutate state.
- The migration is additive and does not alter existing persistence tables.

## Next Recommended Sprint

Sprint 4N-5 should add a constrained backend receipt/readback review around the audit events before any UI approval path is activated.
