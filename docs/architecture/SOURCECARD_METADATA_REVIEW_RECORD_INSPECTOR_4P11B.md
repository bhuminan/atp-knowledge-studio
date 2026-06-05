# SourceCard Metadata Review Record Inspector 4P-11B

## Purpose

Sprint 4P-11B adds a read-only SourceCard Metadata Review Record Inspector to
the Source Library saved SourceDocument detail view. The inspector lets the user
see whether any existing SourceCard metadata review records are already tied to
the selected saved SourceDocument, then inspect the first returned record and
its compact audit trace without enabling metadata editing or save behavior.

## UI Boundary

The inspector is labeled:

`SourceCard Metadata Review Record Inspector`

It carries explicit boundary copy:

- `Read-only inspector — metadata editing is not enabled.`
- `No metadata is saved from this panel.`
- `No SourceCard is created.`
- `Citation and APA readiness are not verified.`

When no records exist, the inspector shows:

`No metadata review records saved for this SourceDocument yet.`

The empty state is expected while metadata editing and metadata save remain
disabled.

## Read-Only Data Flow

The Source Library UI uses read/list bridge calls only:

- `listSourceCardMetadataReviewsForSourceDocument`
- `getSourceCardMetadataReview`
- `listSourceCardMetadataReviewAuditEvents`

The UI does not call the SourceCard metadata review save bridge. It also does
not create demo metadata review records, test records, SourceCards, or
downstream records from the inspector.

## Inspector Content

When records are present, the inspector lists:

- metadata review id
- review status
- source type
- reviewed title
- read-back status
- createdAt
- updatedAt

The selected record detail is read back by metadata review id and displays
stored values including SourceDocument id, candidate provenance, reviewed
metadata fields, citation/APA readiness flags, blockers, warnings, safety
flags, read-back status, and timestamps.

Citation-ready and APA-final fields are displayed only as stored values. The UI
continues to state that citation and APA readiness are not verified by this
panel.

## Audit Trace

The inspector displays a compact audit trace count and the first audit event
ids, event types, and result statuses for the selected metadata review record.

If no audit events are found, the inspector shows:

`No metadata review audit events found.`

## Guardrails Preserved

- No metadata editing UI was added.
- No metadata inputs, selects, textareas, form, or save controls were added.
- No active metadata save exists.
- No active SourceCard creation exists.
- SourceCard and downstream records are not created.
- Citation and APA metadata are not inferred or verified.
- Parser, classification, AI, API, provider, CitationGuard, APA verification,
  evidence review, DOCX export, WriterAgent, network, dependency, package,
  Cargo, lockfile, schema, and migration behavior remain unchanged.
