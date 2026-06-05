# SourceCard Metadata Review UI Checkpoint 4P-10

## Current State Summary

Sprint 4P-10 is a documentation-only checkpoint for the SourceDocument-to-
SourceCard metadata review path. The product now has a safe preview and backend
foundation for SourceCard metadata review, but active metadata editing, UI
metadata save, and SourceCard creation remain intentionally disabled.

Current Source Library state:

- Saved SourceDocument root records can be created only through the explicit
  SourceDocument-only save gate.
- Saved SourceDocument root records can be read back and inspected.
- SourceCard metadata review readiness can be previewed.
- SourceCard metadata completion needs can be previewed.
- SourceCard metadata review backend status can be inspected read-only.
- A disabled SourceCard Metadata Editing Shell previews future field layout.
- No UI calls `saveSourceCardMetadataReview`.
- No UI creates SourceCards or downstream records.
- Citation-ready and APA-final states are not verified or inferred.

## Implemented UI Layers

### SourceCard Metadata Review Gate Preview

Purpose: show whether a saved SourceDocument has enough reviewed metadata
evidence for future SourceCard creation review.

Status: read-only preview.

Does not:

- save metadata
- create SourceCards
- infer missing bibliographic fields
- mark citation-ready
- verify APA-final readiness

Guardrails preserved:

- SourceCard creation remains deferred.
- Missing bibliographic metadata remains a review need.
- Citation and APA finality are not implied.

### SourceCard Metadata Completion Preview

Purpose: show the future metadata field groups and identify missing
bibliographic, source-specific, citation, and APA values.

Status: read-only preview.

Does not:

- render editable metadata controls
- persist metadata
- create SourceCards
- fabricate authors, year, DOI, journal/container, publisher, citation text, or
  APA reference text

Guardrails preserved:

- Missing values show as needs review or not provided.
- Future save/create affordances remain disabled.
- Safety flags remain false for metadata saved, SourceCard created,
  citation-ready, citation metadata inferred, and APA-final verified.

### SourceCard Metadata Review Backend Status Panel

Purpose: show that the backend schema, commands, and TypeScript bridge exist,
and list existing metadata review records for the selected SourceDocument when
present.

Status: read-only status and inspection panel.

Does not:

- call `saveSourceCardMetadataReview`
- add metadata editing UI
- create demo metadata review records
- create SourceCards or downstream records
- verify citation or APA readiness

Guardrails preserved:

- Uses read/list bridge calls only.
- Empty state is safe when no metadata review records exist.
- Existing records, if displayed, are inspection-only.

### Disabled SourceCard Metadata Editing Shell

Purpose: preview the future metadata editing layout before any active edit/save
behavior is enabled.

Status: disabled shell with static rows and static future labels.

Does not:

- render forms, enabled inputs, selects, textareas, buttons, or metadata
  `onChange` handlers
- save metadata
- create SourceCards
- call any backend write command
- infer citation or APA metadata

Guardrails preserved:

- Boundary copy states metadata editing is disabled.
- No metadata is saved from the shell.
- No SourceCard is created.
- Citation and APA readiness remain unverified.
- Future editing requires explicit human review and a backend save gate.

## Implemented Backend Layers

### Schema

The `sourcecard_metadata_reviews` table exists as a SourceDocument-rooted
metadata review record. It is not a SourceCard and does not replace
`source_cards`, `source_card_bibliographic_metadata`, or
`source_card_apa_reference_reviews`.

The `sourcecard_metadata_review_audit_events` table exists for metadata review
command audit events.

### Commands

The backend command surface includes:

- `save_sourcecard_metadata_review`
- `get_sourcecard_metadata_review`
- `list_sourcecard_metadata_reviews_for_source_document`
- `list_sourcecard_metadata_review_audit_events`

### TypeScript Bridge

The frontend bridge includes:

- `saveSourceCardMetadataReview`
- `getSourceCardMetadataReview`
- `listSourceCardMetadataReviewsForSourceDocument`
- `listSourceCardMetadataReviewAuditEvents`

Only read/list functions are wired into Source Library UI. The save bridge
exists for the backend boundary but is not called by the UI.

### Validation Hardening

The save command rejects unsafe states including missing SourceDocument,
missing review identity, missing required review fields, missing explicit human
approval, `sourceCardCreated: true`, `citationReady: true`,
`apaFinalVerified: true`, unsafe safety flags, parser/classification/AI/API/
provider flags, downstream creation flags, and cross-document metadata review id
reuse.

### Idempotency / Update Rule

The same `metadataReviewId` can update only the same SourceDocument. Reusing a
metadata review id across a different SourceDocument is rejected. Safe repeated
updates do not create duplicate review rows.

### Audit / Read-Back Behavior

The backend writes audit events for requested, rejected, saved, already-exists,
verified, and failed-read-back paths when the SourceDocument foreign key can be
validated. Clean success requires read-back verification.

### Downstream Protection

Backend hardening tests confirm metadata review save behavior does not create
or mutate SourceCards, SourceCard bibliographic metadata, APA review rows,
MarketingTags, KnowledgeCards, DraftArtifacts, provider match results,
suggested correction rows, correction audit rows, extraction runs, segments, or
evidence traces.

## Real vs Preview vs Disabled

Real:

- SourceDocument-only intake save
- Saved SourceDocument read-back and audit receipt
- SourceCard metadata review schema and audit schema
- SourceCard metadata review save/get/list/audit-list backend commands
- TypeScript bridge functions
- Backend validation, audit, idempotency, read-back, and downstream protection

Preview:

- SourceCard Metadata Review Gate Preview
- SourceCard Metadata Completion Preview
- SourceCard metadata readiness and missing-field display

Read-only inspection:

- SourceCard Metadata Review Backend Status Panel
- existing metadata review record list for the selected SourceDocument, when
  records already exist

Disabled:

- SourceCard Metadata Editing Shell
- future edit/save/create labels

Not real yet:

- active metadata editing
- active metadata save from UI
- active SourceCard creation
- citation-ready verification
- APA-final verification

## Strict Non-Goals Still Active

- no active metadata editing
- no active metadata save from UI
- no SourceCard creation
- no SourceCard creation audit
- no citation-ready verification
- no APA-final verification
- no parser/classification/AI/provider lookup
- no KnowledgeCard creation
- no Writer/DOCX output
- no MarketingTag, DraftArtifact, citation, APA, extraction, segment, evidence,
  provider, AI, export, or Writer record creation from this path

## Risk Of Preview Bloat

The Source Library now contains several adjacent preview/status/disabled
surfaces. This protects boundaries, but it also creates a risk that the selected
SourceDocument detail view becomes a long backend-oriented stack rather than a
clear user workflow.

Before adding active edit/save behavior, the next sprint should reduce
ambiguity by choosing one of these conservative options:

- inspect saved metadata review records read-only
- design a disabled metadata save gate preflight
- consolidate preview layers into clearer progressive disclosure

The product should avoid adding another active surface until the user can
understand which state is real, which state is preview, and which action is
intentionally disabled.

## Recommended Next Safe Options

### 4P-11 Disabled-to-Active Metadata Review UI Gate Design

Design the transition from disabled shell to active review UI. This should stay
documentation or disabled-preview only until save gate semantics are clear.

Risk: can drift toward active editing too early.

### 4P-11A Metadata Review Save UI Preflight

Define the pre-save UI gate, explicit approval copy, payload review, audit
receipt expectations, read-back display, stale-state handling, and failure
recovery before wiring any save command.

Risk: must remain disabled unless a later sprint explicitly enables save.

### 4P-11B Read-Only Metadata Review Record Inspector

Add a clearer read-only inspector for existing metadata review records and
audit events, if records already exist. This would improve visibility without
editing or saving.

Risk: low, as long as it stays read-only and does not create demo records.

### 4Q-0 SourceCard Creation Boundary Design

Design the separate SourceCard creation boundary after metadata review.

Risk: premature if metadata save/read-back UI is not designed first.

Recommended next sprint: **4P-11B Read-Only Metadata Review Record Inspector**
or **4P-11A Metadata Review Save UI Preflight**. Prefer the inspector if the
goal is lower risk and better understanding of existing backend records. Prefer
the save UI preflight only if it remains disabled and explicitly avoids wiring
`saveSourceCardMetadataReview`.
