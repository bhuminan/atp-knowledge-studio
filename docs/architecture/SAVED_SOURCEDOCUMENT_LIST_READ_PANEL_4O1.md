# Saved SourceDocument List / Read Panel 4O-1

Sprint 4O-1 adds a compact read-only Saved SourceDocuments panel to the Source Library intake save area. The panel lets users refresh local vault SourceDocument rows and inspect one saved SourceDocument root record without creating SourceCards or starting downstream workflows.

## What Was Added

- Added a compact Saved SourceDocuments panel near the explicit SourceDocument save gate and save verification result.
- Added a refresh action that lists saved SourceDocument rows from the local vault.
- Added a click-to-select row interaction that reads one SourceDocument root record.
- Added a selected record preview that displays the SourceDocument id, title, file type, file name, path policy/reference, created-from candidate id, created timestamp, and updated timestamp.
- Added explicit user-facing copy: "Read-only saved SourceDocument record."
- Added explicit user-facing copy: "SourceCard is not created by this intake path."

The panel is intentionally compact and user-facing. It is not a full SourceDocument detail page or audit browser.

## Read-Only Boundary

The panel performs read-only operations only. It does not save, update, delete, parse, classify, enrich, cite, export, call providers, call AI, or create downstream records.

The refresh action reads existing local vault state. Selecting a row reads a SourceDocument root record. No auto-save is added. The existing explicit SourceDocument save gate remains the only place where the intake save command can be invoked, and both approvals remain required.

## Backend And Bridge

Existing backend read/list capability was reused where safe:

- `list_saved_source_documents`
- `listSavedSourceDocuments`

The existing parsed-document detail command `read_saved_source_document` was not suitable for intake-only SourceDocument root records because it expects extraction data. Sprint 4O-1 therefore adds the smallest safe read-only root command:

- `read_saved_source_document_root`
- `readSavedSourceDocumentRoot`

This command reads only from `source_documents`. It does not read parser/extraction tables and does not mutate state.

The saved SourceDocument list/read models were expanded to include existing root fields that were already present in the schema:

- `local_path_policy`
- `local_path_reference`
- `created_from_candidate_id`
- citation/parser/review statuses for read-only display context

No schema or migration was added.

## Audit Display Decision

This sprint does not add a full audit browser. The existing save result panel continues to show package-level audit status and candidate-level audit event ids returned by `save_intake_source_document_candidates`.

The Saved SourceDocuments read panel focuses on local vault SourceDocument rows only. A future audit trace sprint can connect selected SourceDocument provenance to intake audit events in a dedicated detail or trace view.

## SourceDocument-Only Boundary Preservation

The SourceDocument-only boundary remains intact:

- SourceCard creation remains deferred.
- SourceCard created count remains `0` in the save result summary.
- No parser, classification, AI/API/provider, citation, APA, Writer, export, MarketingTag, KnowledgeCard, DraftArtifact, extraction run, segment, or evidence trace workflow is triggered by the read panel.
- Refresh/list behavior does not create records.
- Selecting a saved row does not modify records.
- The repeated-click guard and both explicit approval checkboxes remain in the save gate.

## QA Coverage

The Source Library Playwright QA now verifies:

- the Saved SourceDocuments read panel is visible
- the read-only boundary copy is visible
- the SourceCard deferred/no SourceCard creation copy is visible
- refreshing before save renders an empty state safely
- refreshing before save does not create a save result
- after the QA explicit save flow, the saved list shows the saved SourceDocument
- selecting the saved row shows read-only SourceDocument detail
- the selected detail includes the candidate id and local path policy
- repeat save still returns `already_exists` without duplicate result cards

Rust tests were added for the new root-read command behavior because a read-only backend command was added.

## What Remains Not Implemented

- No full saved SourceDocument browse page.
- No full SourceDocument detail route.
- No intake audit trace browser.
- No SourceCard metadata review gate.
- No SourceCard creation from this intake path.
- No parser boundary connection.
- No classification or KnowledgeCard creation from this intake path.
- No citation or APA workflow consumption of this intake path.
- No batch production workflow beyond the current safe gate.

## Next Recommended Sprint

Recommended next sprint: **4O-2 SourceDocument Detail + Audit Trace View**.

That sprint should remain read-only and should connect selected SourceDocument provenance to compact intake audit events. It should not create SourceCards, run parser/classification, or trigger citation/APA/AI/provider workflows.
