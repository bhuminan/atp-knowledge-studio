# SourceDocument Detail + Audit Trace View 4O-3

Sprint 4O-3 improves the read-only inspection experience for saved intake SourceDocuments in Source Library. It adds a compact SourceDocument root detail view and a compact intake audit trace section for the selected record.

## Detail UX Added

The Saved SourceDocuments panel now shows a more explicit selected-record detail view.

The detail preview includes:

- SourceDocument id
- title
- file name
- file type
- intake/source marker
- review status
- local path policy
- local path reference when available
- created-from candidate id
- created timestamp
- updated timestamp

The panel labels the selected record as:

- "Read-only SourceDocument root record."
- "SourceCard is not created by this intake path."

The selected record remains compact and user-facing. It is not a full SourceDocument route and does not expose parser, provider, or database internals.

## Audit Trace UX Added

The selected detail area now includes a compact intake audit trace section. It shows matching intake SourceDocument audit events when available.

Each compact audit row displays:

- audit event id
- event type
- result status
- candidate id
- package id
- SourceDocument id when present
- read-back status when present
- created timestamp when present

If there are no matching intake events, the panel shows:

"No intake audit events found for this record."

This is not a full audit browser. It is a small read-only trace attached to the selected SourceDocument root record.

## Backend And Bridge

This sprint reuses existing read-only backend and bridge helpers:

- `list_saved_source_documents`
- `listSavedSourceDocuments`
- `read_saved_source_document_root`
- `readSavedSourceDocumentRoot`
- `list_intake_source_document_audit_events`
- `listIntakeSourceDocumentAuditEvents`

No new backend command was required. No write command was added. No schema or migration was added.

## Audit Trace Matching Logic

The selected SourceDocument root carries `created_from_candidate_id`. The UI uses that value to request intake audit events through `listIntakeSourceDocumentAuditEvents({ candidateId })`.

After the candidate-id read, the UI keeps events that either:

- have no SourceDocument id recorded, or
- match the selected SourceDocument id.

This keeps the trace scoped to the selected intake candidate while avoiding a broader audit browser.

In Source Library QA mode, the existing simulated save receipt supplies matching read-only audit rows so Playwright can verify the compact trace without writing SQLite records from the browser.

## Read-Only Boundary

The detail and audit trace view is read-only.

It does not:

- edit SourceDocument records
- delete SourceDocument records
- re-save SourceDocument records
- create SourceCard records
- parse files
- classify sources
- call AI/API/provider/network code
- create citation or APA records
- create extraction runs, segments, evidence traces, MarketingTags, KnowledgeCards, or DraftArtifacts

Selecting a saved SourceDocument only reads the root record and reads matching intake audit events.

## SourceDocument-Only Boundary Preservation

The existing explicit SourceDocument save gate remains intact:

- no auto-save on page load
- both approval checkboxes remain required
- repeated-click guard remains
- existing save result panel remains
- saved SourceDocuments list remains read-only
- SourceCard created count remains `0`

The new audit trace view does not change `save_intake_source_document_candidates` behavior and does not add downstream handoff behavior.

## Why SourceCard Remains Deferred

SourceCard requires bibliographic and citation readiness that the intake SourceDocument root does not provide. SourceCard creation still needs a separate metadata review gate so authors, year, citation text, source type confidence, APA readiness, and citation metadata are not fabricated or implied.

The audit trace can show that a SourceDocument root was saved and read back. It does not make the source citation-ready.

## What Remains Not Implemented

- No full audit browser.
- No full SourceDocument detail route.
- No SourceCard metadata review gate.
- No SourceCard creation from this intake path.
- No parser boundary connection.
- No parser/classification/AI follow-up.
- No citation or APA workflow consumption of this intake path.
- No duplicate/similarity detection.
- No batch production workflow beyond the current safe gate.

## Next Recommended Sprint

Recommended next sprint: **4P-0 SourceCard Metadata Review Gate Design**.

That sprint should define the human-reviewed metadata and citation-readiness requirements for SourceCard creation. It should remain design-first or read-only until the approval, audit, blockers, warnings, and read-back contract is clear.
