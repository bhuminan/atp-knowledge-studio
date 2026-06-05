# SourceDocument Read UX Hardening 4O-4

Sprint 4O-4 hardens the read-only Saved SourceDocuments panel before any SourceCard metadata review work begins. The sprint focuses on empty, loading, error, and stale-selection states for the SourceDocument root detail and compact intake audit trace view.

## What Was Inspected

- Saved SourceDocuments empty list state before any SourceDocument save.
- Saved SourceDocuments refresh/list loading state.
- Selected SourceDocument root detail read behavior.
- Selected SourceDocument behavior after refresh changes the list.
- Compact intake audit trace empty state.
- Compact intake audit trace read/error behavior.
- Existing read-only copy for the SourceDocument root record.
- Existing copy that confirms SourceCard is not created by this intake path.
- Playwright Source Library QA coverage for no auto-save, gated save, read-back, audit trace, and repeated-save behavior.
- Existing read-only bridge/backend helpers for saved SourceDocument list/root reads and intake audit event reads.

## Empty, Error, And Stale Risks Found

- The panel already had a clear empty saved-list state.
- The panel already had a safe read error state for list/root read failures.
- The audit trace already had the required empty copy: "No intake audit events found for this record."
- The selected detail read path did not expose a dedicated root-record loading state.
- The audit trace read path did not expose a dedicated loading state.
- A previous selected SourceDocument could be cleared by refresh without user-facing stale-selection copy explaining that no mutation occurred.

## Fixes Made

- Added a selected SourceDocument detail loading state: "Reading selected SourceDocument root record. No records are modified."
- Added an intake audit trace loading state: "Reading intake audit trace. No records are modified."
- Added stale-selection copy when a previously selected SourceDocument is no longer listed after refresh: "Previously selected SourceDocument is no longer listed after refresh. No records were modified."
- Cleared stale and audit errors when refresh/select begins so old state is not mistaken for current read state.
- Preserved the existing empty audit trace copy exactly.
- Preserved the existing read-only SourceDocument root and SourceCard-not-created labels.

## Tests Added Or Strengthened

The Source Library Playwright QA was strengthened to verify:

- the saved panel empty state renders safely before save
- no detail/audit loading or stale-selection state is present on initial load
- refresh before save does not create save results or saved rows
- selected record detail remains read-only
- SourceCard-not-created/deferred copy remains visible
- audit trace empty state appears before save
- audit trace shows the QA audit event after gated save
- stale selection after refresh clears detail safely and states that no records were modified
- no auto-save occurs on page load

No Rust tests were added because no backend read-side bug was found and no backend command changed.

## Read-Only Boundary Confirmation

The read panel remains read-only. Refreshing the saved list only lists saved SourceDocument rows. Selecting a row only reads the SourceDocument root record and matching intake audit events. Stale-selection handling only clears local UI selection state.

This sprint does not:

- create SourceDocument records
- edit SourceDocument records
- delete SourceDocument records
- re-save SourceDocument records
- create SourceCard records
- create MarketingTags, KnowledgeCards, DraftArtifacts, citation records, APA records, extraction runs, segments, evidence traces, provider records, or AI records
- parse files
- classify sources
- call AI/API/provider/network code
- run export or Writer workflows

## SourceDocument-Only Boundary Preservation

The existing explicit SourceDocument save gate remains intact:

- no auto-save on page load
- both approval checkboxes remain required
- repeated-click guard remains
- save results still require read-back verification before success copy
- saved list/read remains read-only
- compact audit trace remains read-only
- SourceCard created count remains `0`

No schema, migration, lockfile, package, dependency, parser, classification, AI/provider/API, citation, APA, export, Writer, or network behavior changed.

## Why SourceCard Remains Deferred

The saved SourceDocument root is not a complete citation-ready source. SourceCard creation still requires a separate metadata review gate for authors, year, citation text, source type confidence, APA readiness, blockers, warnings, audit trail, and read-back behavior.

The hardened read panel helps users confirm what SourceDocument root exists and what intake audit trace is attached. It does not make the source ready for citation or downstream writing.

## What Remains Not Implemented

- No full saved SourceDocument browser.
- No full SourceDocument detail route.
- No full audit browser.
- No SourceCard metadata review gate.
- No SourceCard creation from this intake path.
- No parser boundary connection.
- No parser/classification/AI follow-up.
- No citation or APA workflow consumption of this intake path.
- No Writer or export workflow connection.

## Recommended Next Sprint

Recommended next sprint: **4P-0 SourceCard Metadata Review Gate Design**.

That sprint should define metadata and citation-readiness requirements before any SourceCard creation is wired. It should remain design-first or read-only until SourceCard approval, blockers, warnings, audit, and read-back contracts are explicit.
