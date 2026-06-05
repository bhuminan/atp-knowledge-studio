# SourceCard Metadata Backend Status Panel Hardening 4P-9B

## Scope

Sprint 4P-9B hardens the read-only SourceCard Metadata Review Backend Status
panel added in 4P-9A. The panel remains a status and inspection surface only.
It does not enable metadata editing, metadata save, SourceCard creation,
citation readiness, or APA-final verification.

## Files Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_BACKEND_STATUS_PANEL_4P9A.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_BACKEND_CHECKPOINT_4P8D.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_COMMAND_HARDENING_4P8C.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_COMMAND_MVP_4P8B.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_SCHEMA_MVP_4P8A.md`
- `src/features/source-library/components/SourceLibraryIncomingPackagePreview.tsx`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `tests/e2e/source-library.spec.ts`

## Inspection Findings

The 4P-9A panel already followed the intended boundary:

- The panel appears only inside the selected saved SourceDocument detail view.
- It reads metadata review records with
  `listSourceCardMetadataReviewsForSourceDocument`.
- It reads compact audit status with
  `listSourceCardMetadataReviewAuditEvents`.
- It does not import or call `saveSourceCardMetadataReview`.
- It has no inputs, selects, textareas, or buttons.
- It does not create metadata review records, SourceCards, or downstream rows.

Hardening risks found:

- Loading copy was safe but could state the read-only nature more directly.
- Error copy came from the generic SourceDocument read formatter and could be
  clearer that metadata review records were not modified.
- Stale selected SourceDocument copy already said no records were modified, but
  it did not explicitly mention metadata review status clearing.
- QA covered the rendered panel and inactive controls, but it did not include a
  source-level guard against accidental UI save command wiring.

## Fixes Made

The panel loading state now says:

`Reading metadata review records… No records are modified.`

The panel error state now prefixes read/list failures with:

`Unable to read metadata review records. No records were modified.`

The stale selected SourceDocument notice now states that metadata review status
was cleared and no records were modified.

No backend behavior changed.

## Read-Only Safety Confirmation

The UI remains read-only:

- no metadata editing UI
- no editable metadata inputs
- no active metadata save button
- no active SourceCard creation button
- no `saveSourceCardMetadataReview` UI call
- no auto-save on page load
- no demo metadata review record creation
- no SourceCard or downstream record creation
- no citation-ready state from UI
- no APA-final state from UI

The panel can show existing metadata review records if they already exist in the
backend. Showing existing records is inspection-only and does not imply that the
UI can create or edit them.

## Tests Strengthened

The Source Library Playwright QA now verifies:

- the backend status panel is absent before a saved SourceDocument is selected
- the backend status panel renders after saved SourceDocument selection
- the empty metadata review record state appears
- loading and error notices are absent after the settled QA read path
- no inputs, selects, textareas, or buttons appear in the panel
- no active metadata save button exists
- no active SourceCard creation button exists
- stale selection copy clears metadata review status without mutation
- existing SourceDocument detail, readiness, audit trace, review gate, and
  completion preview still render

A source-level QA guard now reads the Source Library panel source and confirms
that it includes the read/list bridge calls while excluding
`saveSourceCardMetadataReview` and `save_sourcecard_metadata_review`.

## Why No Save Command Is Called From UI

The metadata review save command is intentionally excluded because this sprint
only hardens backend status inspection. A future metadata editing shell must
first define disabled draft states, review affordances, stale-field handling,
and explicit save-gate copy before any active save command can be exposed.

## Why Metadata Editing UI Is Not Enabled

The current product boundary is still SourceDocument-rooted inspection. Enabling
metadata editing now would blur unsaved draft values, persisted metadata review
records, citation readiness, and SourceCard creation. Those are separate gates.

## Why SourceCard Remains Deferred

The backend metadata review record is not a SourceCard. It is a SourceDocument
metadata review checkpoint. SourceCard creation still requires a future explicit
approval boundary and must not be implied by backend schema, command existence,
or displayed metadata review records.

## Not Implemented

- metadata editing shell
- metadata save gate
- active metadata save command wiring
- SourceCard creation
- SourceCard creation audit
- citation-ready approval
- APA-final verification
- parser integration
- classification integration
- AI/API/provider integration
- CitationGuard integration
- evidence review
- DOCX export integration
- WriterAgent integration
- network behavior
- dependency, package, Cargo, lockfile, schema, or migration changes

## Recommended Next Sprint

The next safe sprint is a documentation or disabled-UI design sprint for a
future metadata editing shell. It should define draft/read-back language,
stale-field states, disabled save affordances, explicit human approval copy, and
SourceCard deferral copy before any active metadata save behavior is added.
