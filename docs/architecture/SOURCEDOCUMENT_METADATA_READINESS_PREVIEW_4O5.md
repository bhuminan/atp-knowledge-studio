# SourceDocument Metadata Readiness Preview 4O-5

Sprint 4O-5 adds a compact read-only metadata readiness preview to the selected saved SourceDocument detail area. The preview helps explain what is still needed before a saved SourceDocument can move toward a future SourceCard metadata review gate.

This sprint does not create SourceCards, edit metadata, infer citation fields, run parser/classification work, call providers, or imply APA readiness.

## Readiness Preview Added

The saved SourceDocument detail panel now includes a metadata readiness preview beneath the root fields and above the compact intake audit trace.

The preview shows:

- readiness status
- passed checks
- warnings
- blockers
- future next-step copy
- explicit boundary copy: "Preview only — no SourceCard is created."

The preview is local and deterministic. It uses only the selected saved SourceDocument root record that is already read by the existing `readSavedSourceDocumentRoot` flow.

## Readiness Checks

The preview evaluates existing saved/root fields only:

- SourceDocument id exists
- saved root record was read back by the root-read panel
- title is present
- file name is present
- source type/file type is present
- candidate id / intake provenance is present when available
- SourceCard is not created yet
- citation readiness is not verified
- APA-final readiness is not verified

The preview does not query SourceCard metadata tables and does not infer bibliographic fields from title, file name, candidate id, or audit events.

## Warnings And Blockers Logic

Blockers are limited to insufficient root data:

- missing SourceDocument id
- missing title
- missing file name
- missing source type/file type

Warnings are used for review needs that should not block the saved SourceDocument root itself:

- missing bibliographic metadata means "Needs bibliographic metadata review"
- missing intake provenance is a warning, not an automatic block
- citation metadata is not verified
- APA-final readiness is not verified
- authors, year, DOI, journal, publisher, citation text, and APA reference are not inferred
- SourceCard creation remains deferred

The normal intake SourceDocument root saved by the current explicit gate has enough root data to avoid blockers, but it still shows "Needs bibliographic metadata" because citation readiness remains `missing_metadata`.

## Why SourceCard Remains Deferred

SourceCard creation requires reviewed bibliographic and citation metadata. The saved SourceDocument root confirms that a local vault root record exists; it does not prove authors, year, DOI, journal, publisher, citation text, APA reference, or source type confidence.

SourceCard creation still needs a separate metadata review gate with blockers, warnings, approval copy, audit behavior, and read-back verification.

## Why No Citation Or APA Metadata Is Inferred

The readiness preview intentionally does not fabricate or infer:

- authors
- year
- DOI
- journal
- publisher
- citation text
- APA reference
- APA-final verification

Those values require human review or a later citation-safe workflow. A SourceDocument title or file name is not enough evidence for formal citation metadata.

## SourceDocument-Only Boundary Preservation

The existing SourceDocument-only boundary remains intact:

- no auto-save on page load
- both explicit approval checkboxes remain required
- repeated-click guard remains
- saved list/read remains read-only
- selected SourceDocument root detail remains read-only
- compact audit trace remains read-only
- SourceCard/downstream records remain uncreated

No backend write command, schema, migration, save behavior, parser/classification, AI/API/provider, citation/APA/export/Writer/network/dependency/lockfile behavior changed.

## Tests Added Or Strengthened

The Source Library Playwright QA now verifies:

- metadata readiness preview appears after selecting a saved SourceDocument
- readiness status shows "Needs bibliographic metadata"
- passed checks include saved root read-back, title/file/root/provenance checks, and SourceCard-not-created state
- warnings state that bibliographic metadata needs review
- warnings state that APA-final is not verified
- warnings state that authors, year, DOI, journal, publisher, citation text, and APA reference are not inferred
- blockers are empty for the normal saved QA SourceDocument root
- future SourceCard metadata review gate copy remains visible
- no SourceCard creation action appears in the readiness preview
- existing detail and compact audit trace still render
- no auto-save occurs on page load

No Rust tests were added because no backend behavior changed.

## What Remains Not Implemented

- No SourceCard metadata review gate.
- No SourceCard creation from this intake path.
- No metadata editing.
- No bibliographic metadata persistence.
- No citation or APA verification workflow.
- No parser boundary connection.
- No parser/classification/AI follow-up.
- No provider/API/network lookup.
- No Writer or export workflow connection.

## Recommended Next Sprint

Recommended next sprint: **4P-0 SourceCard Metadata Review Gate Design**.

That sprint should define the human-reviewed metadata fields, blockers, warnings, citation readiness rules, APA constraints, approval language, audit events, and read-back contract for eventual SourceCard creation.
