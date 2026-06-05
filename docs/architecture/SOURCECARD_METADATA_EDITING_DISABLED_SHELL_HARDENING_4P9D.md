# SourceCard Metadata Editing Disabled Shell Hardening 4P-9D

## Scope

Sprint 4P-9D hardens the disabled SourceCard Metadata Editing Shell added in
4P-9C. The shell remains a static preview of future metadata editing layout. It
does not enable active metadata editing, metadata save, SourceCard creation,
citation readiness, or APA-final verification.

No backend behavior changed.

## What Was Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCECARD_METADATA_EDITING_DISABLED_SHELL_4P9C.md`
- `docs/architecture/SOURCECARD_METADATA_BACKEND_STATUS_PANEL_HARDENING_4P9B.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_BACKEND_STATUS_PANEL_4P9A.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_COMMAND_HARDENING_4P8C.md`
- `docs/architecture/SOURCECARD_METADATA_EDITING_BOUNDARY_DESIGN_4P5.md`
- `docs/architecture/SOURCECARD_METADATA_COMPLETION_PREVIEW_HARDENING_4P4.md`
- `src/features/source-library/components/SourceLibraryIncomingPackagePreview.tsx`
- `src/lib/sources/SourceCardMetadataCompletionPreviewMapper.ts`
- `src/lib/sources/SourceCardMetadataReviewGateMapper.ts`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `tests/e2e/source-library.spec.ts`

## Risks Found

The 4P-9C shell already used static rows and static future labels, but hardening
identified a few areas to make safer before any future edit/save UI:

- Boundary copy said no metadata was saved, but it did not explicitly say no
  metadata is saved from the shell.
- Citation/APA copy could be clearer that readiness remains unverified.
- The shell did not explicitly state that future editing requires human review
  and a backend save gate.
- QA verified rendered non-interactivity, but it did not inspect the shell
  source slice for accidental form, button, or `onChange` wiring.
- QA checked no active metadata save or SourceCard creation globally, but the
  selected detail area needed its own active-action guard.

## Fixes Made

Boundary copy now says:

- `Disabled preview — metadata editing is not enabled.`
- `No metadata is saved from this shell.`
- `No SourceCard is created.`
- `Citation and APA readiness remain unverified.`
- `Future editing requires explicit human review and backend save gate.`

The shell still renders future affordances as static labels, not buttons.

## Non-Interactive Guarantees

The disabled shell has:

- no `<form>`
- no `<input>`
- no `<select>`
- no `<textarea>`
- no `<button>`
- no metadata value `onChange` handlers
- no active metadata save action
- no active SourceCard creation action
- no `saveSourceCardMetadataReview` UI call
- no `save_sourcecard_metadata_review` UI call
- no auto-save on page load
- no metadata review record creation from rendering

Opening, refreshing, or rendering the shell does not write metadata and does not
create SourceCards or downstream records.

## Field Groups Confirmed

The shell preserves the required static field groups:

- Root identity
- Bibliographic metadata
- Source-type-specific metadata
- Citation / APA candidate area
- Future approval

Root identity rows read saved SourceDocument root values. Bibliographic,
source-type-specific, citation, APA, and approval rows remain future review
placeholders and do not infer missing metadata.

## Tests Added Or Strengthened

Source Library QA now verifies:

- the shell does not render before a saved SourceDocument is selected
- the shell renders after selecting a saved SourceDocument
- disabled boundary copy appears with the stricter 4P-9D wording
- all field groups appear
- no inputs, selects, textareas, or buttons appear in the shell
- future labels are not active buttons
- no active metadata save button exists in the selected detail area
- no active SourceCard creation button exists in the selected detail area
- the Source Library UI file contains no `saveSourceCardMetadataReview` call
- the shell source slice contains no form, input, select, textarea, button, or
  `onChange` wiring
- existing SourceCard gate, completion preview, and backend status panel still
  render

No Rust tests were added because backend behavior did not change.

## Why No Save Command Is Called From UI

This sprint is a non-interactive shell hardening sprint. Calling
`saveSourceCardMetadataReview` would require a separate active metadata save
gate with explicit human approval, payload review, audit receipt display,
read-back verification, stale-state behavior, and failure recovery. Those are
not part of this sprint.

## Why Metadata Editing UI Is Not Enabled

Enabled editing controls would create user-editable draft state. Draft state
needs save/discard semantics, validation, stale-field handling, and user-visible
read-back behavior. The shell is intentionally static until those boundaries are
designed and verified.

## Why SourceCard Remains Deferred

SourceCard creation remains separate from metadata review. A saved
SourceDocument root and a disabled shell do not prove reviewed bibliographic
metadata, citation safety, APA-final verification, or SourceCard creation
approval.

## Not Implemented

- active metadata editing
- enabled metadata inputs/selects/textareas
- metadata draft state
- metadata save gate
- `saveSourceCardMetadataReview` UI wiring
- metadata review record creation from UI
- SourceCard creation
- SourceCard creation audit
- citation-ready approval
- APA-final verification
- parser/classification/AI/API/provider behavior
- CitationGuard, APA verification, evidence review, DOCX export, WriterAgent,
  or network behavior
- dependency, package, Cargo, lockfile, schema, or migration changes

## Recommended Next Sprint

The next safe sprint is a design-only or disabled-preview sprint for the
metadata save gate. It should define explicit approval copy, payload review,
read-back receipt display, audit event visibility, stale-state behavior,
discard/reset semantics, and failure recovery before any active metadata save
command is wired into the UI.
