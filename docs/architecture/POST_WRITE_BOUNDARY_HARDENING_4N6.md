# Post-write Boundary Hardening 4N-6

Sprint 4N-6 reviews the active Source Library SourceDocument save gate added in 4N-5. This is a hardening sprint, not a new product capability sprint.

## What Was Inspected

- Source Library explicit SourceDocument save gate UI
- Frontend save payload builder
- QA-mode result behavior
- Backend `save_intake_source_document_candidates` command behavior
- Intake SourceDocument audit event coverage
- Idempotent repeat-save behavior
- SourceDocument-only downstream boundary

## Hardening Risks Found

The UI already required both explicit approvals and sent only ready PDF/DOCX candidates. The main hardening risk was rapid repeated activation: a second click could reach the handler before React rendered the disabled saving state.

QA-mode result simulation also always returned `saved`, so the browser QA did not show the idempotent `already_exists` receipt that the backend returns on repeat save.

## Fixes Made

- Added an in-flight ref guard to the Source Library SourceDocument save handler.
- Preserved the disabled button state while saving.
- Updated QA-mode repeat-save receipt to show `already_exists` after a prior successful save result.
- Adjusted result copy so read-back verification is clear for both `saved` and `already_exists` results.

## Tests Strengthened

The Source Library Playwright QA now verifies:

- no result panel exists before approval and click
- button remains disabled until both approvals are checked
- SourceCard deferred copy remains visible
- only the ready PDF candidate appears in the result
- unsupported PNG and needs-review DOCX candidates remain excluded
- repeated save shows `already_exists`
- repeated save still shows one result card, not duplicate candidate output
- audit/read-back status remains visible after save

Existing Rust tests continue to cover:

- unsupported candidates rejected
- missing approval rejected
- unsafe flags rejected
- successful save writes audit events
- repeat save returns `already_exists`
- SourceDocument read-back verification
- SourceCard, extraction, segment, evidence trace, KnowledgeCard, and DraftArtifact counts remain zero for intake SourceDocument save

## Remaining Limitations

- The UI still uses a demo incoming package until a real INPUT Room handoff is wired.
- QA mode simulates the UI receipt; SQLite writes remain covered by Rust tests.
- No persisted receipt/history view is added in this sprint.

## Boundary Confirmation

The SourceDocument-only boundary remains intact. The UI sends only SourceDocument candidate payloads to `save_intake_source_document_candidates`; it does not send SourceCard, parser, classification, AI/API/provider, citation, APA, Writer, export, or downstream payloads.

## Next Recommended Sprint

Add a persisted SourceDocument save receipt/history view that reads saved SourceDocument rows and intake audit events without creating SourceCards or downstream records.
