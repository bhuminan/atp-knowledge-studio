# SourceDocument Metadata Readiness Hardening 4O-6

Sprint 4O-6 hardens the read-only SourceDocument metadata readiness preview before SourceCard Metadata Review Gate Design. This sprint keeps the preview local, deterministic, and read-only.

It does not add metadata editing, SourceCard creation, parser/classification/AI behavior, provider/API lookup, citation/APA behavior, schema changes, migrations, dependencies, or new backend write behavior.

## What Was Inspected

- Current SourceDocument metadata readiness preview from Sprint 4O-5.
- Selected saved SourceDocument root detail fields.
- Compact intake audit trace placement and behavior.
- Existing empty/loading/stale states from Sprint 4O-4.
- Source Library Playwright QA coverage for the gated save, selected detail, audit trace, no auto-save, and no SourceCard creation.
- Existing read-only bridge models for saved SourceDocument root records.
- Existing Rust command registration and vault DB read helpers to confirm no backend change was needed.

## Readiness Edge Cases Reviewed

The readiness logic was reviewed for:

- saved root record exists
- missing SourceDocument id
- missing title
- missing file name
- missing source type/file type
- missing candidate id / intake provenance
- missing bibliographic metadata
- citation metadata not verified
- APA-final not verified
- SourceCard deferred / not created copy
- absence of SourceCard action surfaces
- absence of citation-ready or APA-final-ready implication

## Blockers And Warnings Logic

Root essentials are blockers:

- missing SourceDocument id
- missing title
- missing file name
- missing source type/file type

Review needs remain warnings or needs-review notes:

- missing bibliographic metadata means "Needs bibliographic metadata review"
- missing candidate id / intake provenance is a warning, not a root-record blocker
- citation metadata is not verified
- APA-final is not verified
- authors, year, DOI, journal, publisher, citation text, and APA reference are not inferred
- SourceCard creation remains deferred

This keeps the saved SourceDocument root usable as a verified root record while clearly stating that it is not citation-ready and not SourceCard-ready.

## Fixes Made

- Extracted the metadata readiness evaluator into `SourceDocumentMetadataReadinessMapper` so edge-case semantics can be tested directly.
- Hardened status wording:
  - blocked state now reads "Blocked: essential SourceDocument fields missing"
  - needs-review state now reads "Needs bibliographic metadata review"
- Kept all readiness checks based on saved SourceDocument root fields only.
- Preserved the rendered preview boundary: "Preview only — no SourceCard is created."

## Tests Added Or Strengthened

The Source Library Playwright QA was strengthened with focused readiness helper tests:

- missing root essentials produce blockers
- missing bibliographic metadata remains a needs-review warning
- missing candidate provenance is a warning, not a blocker
- SourceCard creation remains deferred
- APA-final is not verified
- authors, year, DOI, journal, publisher, citation text, and APA reference are not inferred
- rendered readiness copy does not include SourceCard creation action wording
- rendered readiness copy does not imply `citation-ready`
- rendered readiness copy does not imply APA-final verification

The existing rendered Source Library QA path still verifies:

- readiness preview appears after selecting a saved SourceDocument
- selected detail remains read-only
- compact audit trace still renders
- no auto-save occurs on page load
- SourceCard/downstream records are not created

No Rust tests were added because no backend behavior changed.

## Why SourceCard Remains Deferred

SourceCard creation requires reviewed bibliographic metadata and citation readiness. A saved SourceDocument root can confirm source identity, file type, intake provenance, and read-back visibility, but it cannot prove authors, year, DOI, journal, publisher, citation text, APA reference, or source type confidence.

SourceCard creation still needs its own metadata review gate with blockers, warnings, approval language, audit behavior, and read-back verification.

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

Those values require human review or a later citation-safe workflow. A title, file name, candidate id, or audit event is not sufficient evidence for formal citation metadata.

## SourceDocument-Only Boundary Preservation

The SourceDocument-only boundary remains intact:

- no auto-save on page load
- both explicit approval checkboxes remain required
- repeated-click guard remains
- saved list/read remains read-only
- selected SourceDocument root detail remains read-only
- metadata readiness preview remains read-only
- compact audit trace remains read-only
- SourceCard/downstream records remain uncreated

No backend write command, schema, migration, save behavior, parser/classification, AI/API/provider, citation/APA/export/Writer/network/dependency/lockfile behavior changed.

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

That sprint should define the SourceCard metadata review contract, including required fields, blockers, warnings, human approval copy, audit events, read-back verification, and strict citation/APA boundaries before any SourceCard creation is wired.
