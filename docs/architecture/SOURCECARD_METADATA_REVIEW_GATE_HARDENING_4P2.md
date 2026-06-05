# SourceCard Metadata Review Gate Hardening 4P-2

## Purpose

Sprint 4P-2 hardens the read-only SourceCard Metadata Review Gate Preview before any future SourceCard creation work.

This sprint does not create SourceCards, add metadata editing, call backend write commands, change schema, add migrations, modify parser/classification/AI/provider behavior, change citation/APA/export/Writer behavior, add dependencies, or change lockfiles.

## What Was Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_DESIGN_4P0.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_PREVIEW_4P1.md`
- `docs/architecture/SOURCEDOCUMENT_METADATA_READINESS_HARDENING_4O6.md`
- `src/lib/sources/SourceCardMetadataReviewGateMapper.ts`
- `src/lib/sources/SourceDocumentMetadataReadinessMapper.ts`
- `src/features/source-library/components/SourceLibraryIncomingPackagePreview.tsx`
- `tests/e2e/source-library.spec.ts`
- `src/types/domain.ts`

## Edge Cases Reviewed

The gate preview was reviewed for:

- default intake-saved SourceDocument state
- missing SourceDocument ID
- missing title
- missing file name
- missing source type/file type
- missing intake provenance
- missing authors
- missing year/date
- missing DOI/URL review
- missing journal/publisher/container review
- missing citation text review
- unsafe APA-final verification signal
- unsafe citation readiness implication
- duplicate or already-created SourceCard state
- disabled future-only create affordance
- absence of metadata editing controls
- absence of active SourceCard creation controls

## Trust-State Semantics

The hardened trust states are:

- Green: `Ready for SourceCard creation review`
- Orange: `Needs bibliographic metadata review`
- Red: `Blocked`

Green is now explicitly guarded by optional reviewed metadata evidence in the pure frontend mapper. The current SourceDocument detail UI does not supply that evidence, so current intake-saved SourceDocuments remain Orange.

Green requires:

- reliable saved SourceDocument identity
- read-back identity present
- title present
- file name/source type present
- authors reviewed
- year/date reviewed
- DOI/URL reviewed if applicable
- journal/publisher/container reviewed if applicable
- citation text reviewed
- APA candidate kept non-final
- explicit future approval requirement represented
- no existing SourceCard conflict

Orange is used when the saved SourceDocument root is reliable but bibliographic metadata still needs review.

Red is used when root/source identity is unsafe, citation readiness is implied by the preview, APA-final verification is implied, or a duplicate/already-created SourceCard state is detected.

## Warning And Blocker Semantics

Blockers:

- missing SourceDocument root identity
- missing read-back identity
- missing title
- missing file name or source type
- implied citation readiness
- implied APA-final verification
- already-created SourceCard conflict

Warnings:

- missing provenance while root identity remains reliable
- missing bibliographic metadata requiring review
- citation/APA finality not implied
- SourceCard remains deferred

Missing provenance remains a warning unless reliable identity is also missing. Missing bibliographic metadata is never fabricated.

## Fixes Made

- Added optional `SourceCardMetadataReviewEvidence` input to the pure frontend mapper.
- Preserved current UI behavior by not passing review evidence from the selected SourceDocument detail.
- Hardened Green so it is not shown unless all reviewed metadata flags are supplied.
- Hardened Red for unsafe APA-final, citation-readiness implication, and already-created SourceCard states.
- Added compact user-facing copy:
  - `Bibliographic metadata must be reviewed before SourceCard creation.`
  - `Citation and APA readiness are not verified.`
  - `Future action disabled until metadata review is complete.`
- Kept the future-only SourceCard action disabled.
- Confirmed no metadata editing controls are rendered inside the gate preview.

## Tests Added Or Strengthened

Source Library QA now covers:

- default deferred Orange state for intake-saved SourceDocuments
- missing root essentials produce Red/Blocked
- missing provenance remains warning, not blocker
- Green only appears when required reviewed metadata evidence is present
- unsafe APA-final/citation-ready implication states are blocked
- already-created SourceCard conflict is blocked
- rendered preview includes compact deferred/hardening copy
- future-only action remains disabled
- no input, textarea, or select controls exist inside the gate preview
- no `citation-ready` or `APA-final verified` copy appears
- SourceDocument detail, metadata readiness preview, and compact audit trace still render
- no auto-save occurs on page load

No Rust tests were added because backend behavior did not change.

## Why SourceCard Remains Deferred

The saved SourceDocument root confirms local intake identity and read-back visibility only. It does not prove authors, year/date, DOI/URL, journal, publisher, container, page range, citation text, source-type truth, APA reference text, or APA-final verification.

SourceCard creation still needs explicit human metadata review, future approval, audit behavior, and read-back verification. This sprint only hardens the preview before that future creation boundary exists.

## Why No Citation Or APA Metadata Is Inferred

The gate preview does not infer or generate:

- authors
- year/date
- DOI/URL
- journal
- publisher
- container title
- page range
- citation text
- APA reference text
- APA-final verification
- provider truth
- parser/classification truth

Titles, file names, candidate IDs, parser chunks, and provider hints are not enough evidence for citation metadata.

## What Remains Not Implemented

- No SourceCard creation.
- No active SourceCard create button.
- No metadata editing.
- No backend write command.
- No SourceCard metadata approval DTO.
- No SourceCard creation audit event.
- No schema or migration work.
- No parser/classification/AI/provider work.
- No CitationGuard, APA verification, evidence review, DOCX export, Writer, or network changes.
- No downstream records.

## Recommended Next Sprint

Recommended next sprint:

**Sprint 4P-3 - SourceCard Metadata Review Contract**

Recommended scope:

- keep the UI preview read-only
- define the future review evidence/approval DTO
- define blocker, warning, approval, and audit snapshots
- define read-back receipt expectations
- decide whether metadata entry comes before any create command
- do not add active SourceCard creation until the contract and audit model are stable
