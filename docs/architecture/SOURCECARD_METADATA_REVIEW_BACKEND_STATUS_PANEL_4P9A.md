# SourceCard Metadata Review Backend Status Panel 4P-9A

## Scope

Sprint 4P-9A adds a compact read-only status panel to the saved
SourceDocument detail view in the Source Library. The panel sits near the
existing SourceCard Metadata Review Gate Preview and SourceCard Metadata
Completion Preview so a reviewer can see that the metadata review backend
foundation exists without exposing metadata editing or downstream creation.

## UI Boundary

The panel label is `SourceCard Metadata Review Backend Status`.

Boundary copy shown in the panel:

- Read-only status - metadata editing is not enabled.
- No SourceCard is created.
- Citation and APA readiness are not verified.

The panel lists backend capability status:

- Metadata review schema: available
- Metadata review commands: available
- TypeScript bridge: available
- UI editing: not enabled
- UI metadata save: not enabled
- SourceCard creation: not enabled
- Citation-ready: not verified
- APA-final: not verified

## Read-Only Data Flow

When a saved SourceDocument is selected, the UI may call
`listSourceCardMetadataReviewsForSourceDocument` to read existing metadata
review records for that SourceDocument. If records exist, the panel shows a
compact read-only list with:

- `metadataReviewId`
- `reviewStatus`
- `sourceType`
- `reviewedTitle`
- `readBackStatus`
- `updatedAt`

If no records exist, the panel shows:

`No metadata review records saved for this SourceDocument yet.`

For the first listed review record, the UI may also call
`listSourceCardMetadataReviewAuditEvents` and display a compact audit count and
event id summary. This is a read-only status check only.

## Explicit Non-Goals

The panel does not call `saveSourceCardMetadataReview`.

This sprint does not add:

- metadata editing UI
- editable metadata inputs, selects, or textareas
- active metadata save buttons
- active SourceCard creation buttons
- demo metadata review record creation
- SourceCard or downstream record creation
- citation-ready inference
- APA-final verification
- parser, classification, AI, API, provider, CitationGuard, APA verification,
  evidence review, DOCX export, WriterAgent, network, dependency, package,
  Cargo, lockfile, schema, or migration changes

## Verification Notes

The Source Library QA flow verifies that the panel appears after selecting a
saved SourceDocument, that schema/commands/bridge status is visible, that UI
editing/save and SourceCard creation remain disabled, and that no editable
metadata controls or active downstream buttons exist.
