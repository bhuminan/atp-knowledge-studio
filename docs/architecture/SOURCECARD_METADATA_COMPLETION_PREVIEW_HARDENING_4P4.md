# SourceCard Metadata Completion Preview Hardening 4P-4

## Purpose

Sprint 4P-4 hardens the read-only SourceCard Metadata Completion Preview before any future metadata editing, metadata saving, or SourceCard creation work.

This sprint does not save metadata, create SourceCards, add editable inputs, call backend write commands, change schema, add migrations, modify parser/classification/AI/provider behavior, change citation/APA/export/Writer behavior, add dependencies, or change lockfiles.

## What Was Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCECARD_METADATA_COMPLETION_PREVIEW_4P3.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_HARDENING_4P2.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_DESIGN_4P0.md`
- `docs/architecture/SOURCEDOCUMENT_METADATA_READINESS_HARDENING_4O6.md`
- `src/lib/sources/SourceCardMetadataCompletionPreviewMapper.ts`
- `src/lib/sources/SourceCardMetadataReviewGateMapper.ts`
- `src/lib/sources/SourceDocumentMetadataReadinessMapper.ts`
- `src/features/source-library/components/SourceLibraryIncomingPackagePreview.tsx`
- `tests/e2e/source-library.spec.ts`
- `src/types/domain.ts`

## Edge Cases Reviewed

The completion preview was reviewed for:

- saved SourceDocument title present
- file name present
- source type/file type present
- intake candidate id/provenance present or missing
- missing authors
- missing year/date
- missing journal/container
- missing publisher
- missing DOI
- missing URL
- missing volume/issue/pages
- missing citation text
- missing APA reference
- APA candidate not final
- human review required
- disabled future metadata save action
- disabled future SourceCard create action
- no editable metadata inputs
- no active metadata save button
- no active SourceCard create button

## Field Status Semantics

The hardened field statuses are:

- `available`: the value exists from the saved SourceDocument root or a future approved reviewed source.
- `needs_review`: human metadata review is required before the value can be trusted.
- `not_applicable`: reserved for cases that are clearly not applicable; current intake-saved SourceDocuments do not use this state.
- `blocked`: reserved for unsafe root/source identity cases.

Root identity fields may be `available` from saved SourceDocument root data. Bibliographic, source-type-specific, citation, and APA reference fields remain `needs_review` because the SourceDocument root does not prove them.

## No-Fabrication Rules

The preview does not fabricate or infer:

- authors
- year/date
- DOI
- URL
- journal
- publisher
- container title
- volume
- issue
- page range
- citation text
- APA reference
- APA-final verification

Missing values display as `Needs review` or `Not provided yet`.

## Fixes Made

- Split the visible boundary copy into:
  - `Preview only — metadata is not saved.`
  - `No SourceCard is created.`
- Added explicit safety-note copy:
  - `Missing bibliographic fields require human review.`
  - `Future actions are disabled until metadata review is complete.`
- Added an explicit `APA reference` needs-review field.
- Added safety flags for `persisted: false` and `citationReady: false`.
- Preserved disabled future-only actions:
  - `Future: Save reviewed metadata`
  - `Future: Create SourceCard after review`

## Tests Added Or Strengthened

Source Library QA now verifies:

- completion preview renders after selecting a saved SourceDocument
- all field groups are visible
- saved root identity values are shown only from saved SourceDocument fields
- authors, year, DOI, citation text, and APA reference show `Needs review`
- no fabricated citation-ready or APA-final copy appears
- future actions remain disabled
- no active metadata save button exists
- no active SourceCard create button exists
- no input, textarea, or select metadata controls exist
- safety flags remain false for metadata saved, persisted, SourceCard created, citation metadata inferred, citation ready, and APA-final verified
- SourceDocument detail/readiness, SourceCard review gate, and compact audit trace still render

No Rust tests were added because no backend behavior changed.

## Why No Metadata Is Saved

The preview is a form-design surface only. It is not a metadata persistence workflow. Future metadata saving needs a separate DTO, explicit approval, audit behavior, read-back receipt, validation rules, and a backend boundary.

Saving metadata now would blur the SourceDocument-only intake boundary and could make unreviewed bibliographic fields look authoritative.

## Why SourceCard Remains Deferred

SourceCard creation requires reviewed bibliographic metadata, explicit SourceCard creation approval, audit behavior, and read-back verification. Current saved SourceDocument root fields are enough for local intake identity, but not enough for a SourceCard record.

## Why Citation And APA Readiness Are Not Implied

Citation and APA readiness require human academic review. The preview does not generate citation text, APA reference text, citation-ready state, or APA-final verification.

## What Remains Not Implemented

- No metadata save.
- No active metadata editing.
- No editable metadata inputs.
- No SourceCard creation.
- No SourceCard metadata completion DTO.
- No backend write command.
- No schema or migrations.
- No SourceCard audit event.
- No parser/classification/AI/provider workflow.
- No CitationGuard, APA verification, evidence review, DOCX export, Writer, or network workflow.
- No downstream records.

## Recommended Next Sprint

Recommended next sprint:

**Sprint 4P-5 - SourceCard Metadata Completion Contract**

Recommended scope:

- keep the UI preview read-only
- define future metadata completion DTO shape
- define required and optional field validation
- define source-type-specific applicability rules
- define blocker and warning snapshots
- define explicit approval wording
- define audit and read-back receipt expectations
- do not add active metadata saving or SourceCard creation until the contract is stable
