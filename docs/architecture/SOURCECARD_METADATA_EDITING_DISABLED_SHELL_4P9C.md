# SourceCard Metadata Editing Disabled Shell 4P-9C

## Scope

Sprint 4P-9C adds a disabled SourceCard Metadata Editing Shell to the selected
saved SourceDocument detail view. The shell previews the future metadata review
layout without enabling editing, metadata save, SourceCard creation, citation
readiness, or APA-final verification.

No backend behavior changed.

## Disabled Shell Added

The shell appears near the SourceCard Metadata Review Backend Status panel and
the SourceCard Metadata Completion Preview. Its label is:

`SourceCard Metadata Editing Shell`

Boundary copy:

- Disabled preview - metadata editing is not enabled.
- No metadata is saved.
- No SourceCard is created.
- Citation and APA readiness are not verified.

The shell uses static rows and future-only labels. It does not use editable
inputs, selects, textareas, or active buttons.

## Field Groups Displayed

### Root Identity

- SourceDocument title
- File name
- Source type / file type
- Intake provenance / candidate id

These values are read from the saved SourceDocument root and shown as read-only
identity/provenance context.

### Bibliographic Metadata

- Authors
- Year
- Source type confirmation

These rows show future metadata review needs only. The shell does not infer
authors, year, or source-type truth.

### Source-Type-Specific Metadata

- DOI
- URL
- Journal / container
- Publisher
- Volume / issue / pages

These rows remain `Needs review` in the disabled shell. No provider, parser, AI,
or citation metadata is inferred.

### Citation / APA Candidate Area

- Citation text candidate
- APA reference candidate
- Citation-ready
- APA-final

These rows explicitly remain not verified. The shell does not generate citation
text or APA reference text.

### Future Approval

- Human metadata review required
- SourceCard creation remains separate

These rows preserve the separation between future metadata review and future
SourceCard creation.

## Disabled / Read-Only Behavior

The shell has no active controls:

- no editable inputs
- no selects
- no textareas
- no active metadata save button
- no active SourceCard creation button
- no metadata value `onChange` handlers
- no write command calls

Future affordances are shown as static labels:

- Future: Edit metadata
- Future: Save reviewed metadata
- Future: Create SourceCard after review

They are not active buttons.

## Why No Metadata Save Command Is Called

The shell is a visual and workflow preview only. Calling
`saveSourceCardMetadataReview` would make this sprint an active metadata review
save sprint, which would require explicit approval copy, a save gate, submitted
payload review, audit receipt display, read-back verification, stale-field
handling, and failure recovery. Those are not implemented in this disabled shell
sprint.

The Source Library UI still does not import or call
`saveSourceCardMetadataReview`.

## Why Active Editing Controls Are Not Enabled

Active inputs would imply users can edit metadata, even if save remains absent.
That would blur the distinction between previewed future fields and persisted
metadata review records. The shell therefore uses read-only rows that look like
review fields without accepting user edits.

## Why SourceCard Remains Deferred

SourceCard creation remains a separate future gate. A saved SourceDocument root
and a disabled metadata editing shell do not prove bibliographic metadata,
citation safety, APA finality, or human metadata review completion.

## Why Citation / APA Readiness Is Not Verified

Citation and APA readiness require stricter human academic review. The disabled
shell does not infer citation text, APA reference text, citation-ready state, or
APA-final verification from saved SourceDocument root data.

## Tests Added Or Strengthened

Source Library QA now verifies:

- the disabled shell renders after selecting a saved SourceDocument
- the shell states metadata editing is disabled
- the shell states no metadata is saved
- the shell states no SourceCard is created
- the shell states citation and APA readiness are not verified
- all future field groups render
- future affordances are static labels
- no inputs, selects, textareas, or buttons exist in the shell
- no active metadata save button exists
- no active SourceCard creation button exists
- no `saveSourceCardMetadataReview` UI call exists
- the existing review gate, backend status panel, and completion preview still
  render

No Rust tests were added because no backend behavior changed.

## Not Implemented

- active metadata editing
- enabled metadata inputs/selects/textareas
- metadata draft state
- metadata save gate
- `saveSourceCardMetadataReview` UI wiring
- SourceCard creation
- SourceCard creation audit
- citation-ready approval
- APA-final verification
- parser/classification/AI/API/provider behavior
- CitationGuard, APA verification, evidence review, DOCX export, WriterAgent,
  or network behavior
- dependency, package, Cargo, lockfile, schema, or migration changes

## Recommended Next Sprint

The next safe sprint is a disabled metadata save gate preview or a design-only
metadata save contract. It should define explicit approval copy, payload review,
audit receipt display, read-back verification display, stale-field behavior, and
failure recovery before any active metadata save command is wired into the UI.
