# SourceCard Metadata Editing Boundary Design 4P-5

## Purpose

Sprint 4P-5 defines the future human metadata editing boundary that should sit between a saved SourceDocument and any later SourceCard creation workflow.

This sprint is documentation and architecture only. It does not add editable inputs, save metadata, create SourceCards, change runtime behavior, add backend write commands, change schema or migrations, modify tests, change parser/classification/AI/API/provider behavior, change citation/APA/export/Writer behavior, add dependencies, or change lockfiles.

## Current State Summary

The current intake path is SourceDocument-only. A user can explicitly save a SourceDocument root, read it back, inspect saved details, view audit traces, and see metadata readiness previews.

Current SourceCard-related surfaces remain preview or mock boundaries:

- SourceCard Metadata Review Gate Preview is read-only and keeps SourceCard creation deferred.
- SourceCard Metadata Completion Preview is read-only and shows missing bibliographic fields as review needs.
- Completion hardening explicitly states metadata is not saved, no SourceCard is created, citation/APA readiness is not verified, and future actions remain disabled.
- Manual SourceCard entry exists as a local mock-only form, not as the SourceDocument-to-SourceCard creation path.
- Existing saved SourceCard and structured bibliographic metadata commands apply to already-created SourceCards or older explicit SourceCard flows; they should not be reused silently to create cards from a saved SourceDocument.

The saved SourceDocument root proves local intake identity and read-back visibility. It does not prove authors, year, DOI, journal/container, publisher, page range, citation text, APA reference, citation-ready state, or APA-final verification.

## Files Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_DESIGN_4P0.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_PREVIEW_4P1.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_GATE_HARDENING_4P2.md`
- `docs/architecture/SOURCECARD_METADATA_COMPLETION_PREVIEW_4P3.md`
- `docs/architecture/SOURCECARD_METADATA_COMPLETION_PREVIEW_HARDENING_4P4.md`
- `docs/architecture/SOURCEDOCUMENT_METADATA_READINESS_HARDENING_4O6.md`
- `docs/architecture/STRUCTURED_BIBLIOGRAPHIC_METADATA_CONTRACT_4H2.md`
- `docs/architecture/STRUCTURED_METADATA_READINESS_VALIDATOR_4H4.md`
- `docs/architecture/APA_REFERENCE_CANDIDATE_CONTRACT_4H5.md`
- `docs/architecture/APA_REFERENCE_CANDIDATE_PREVIEW_4H6.md`
- `docs/architecture/HUMAN_APA_VERIFICATION_GATE_4H7.md`
- `docs/architecture/HUMAN_APA_VERIFICATION_GATE_MVP_4H8A.md`
- `src/lib/sources/SourceCardMetadataReviewGateMapper.ts`
- `src/lib/sources/SourceCardMetadataCompletionPreviewMapper.ts`
- `src/lib/sources/SourceDocumentMetadataReadinessMapper.ts`
- `src/lib/sources/StructuredBibliographicMetadataReadinessMapper.ts`
- `src/lib/sources/ParsedDocxSourceCardSaveValidator.ts`
- `src/lib/sources/SourceCardMapper.ts`
- `src/lib/persistence/SourceCardPersistenceReadinessMapper.ts`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `src/features/source-library/components/ManualSourceCardForm.tsx`
- `src/features/source-library/components/SourceCardCandidatePreview.tsx`
- `src/features/source-library/components/SourceCardReadinessSummary.tsx`
- `src/types/domain.ts`

## Proposed Future Editing Boundary

Future metadata editing should be a separate, explicit workflow named **SourceCard Metadata Review** or **SourceDocument-to-SourceCard Metadata Review**.

The boundary should allow:

- a user to manually edit bibliographic metadata
- a user to explicitly confirm reviewed fields
- provisional edits before save
- warnings and blockers before save
- read-only display of AI/provider/parser suggestions as suggestions only in a future sprint
- a structured metadata review save only after explicit user action
- read-back verification of the saved review record
- SourceCard creation eligibility only after metadata review is saved and verified

The boundary should not allow:

- automatic SourceCard creation after metadata save
- automatic metadata save on field change or page navigation
- direct overwrite from AI/provider/parser suggestions
- citation/APA display as final without stricter human citation review
- creation of SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, evidence, export, Writer, or downstream records
- mutation of SourceDocument root data as a side effect of metadata review

Metadata editing and SourceCard creation should remain two separate explicit steps unless a later architecture sprint proves a safe combined transaction with separate approvals, audit events, and read-back receipts for both phases.

## Metadata Field Categories

### A. Editable By Human In Future Metadata Review

These fields may become editable in a future scoped implementation. Editing them should create provisional changes until explicit save:

- title confirmation
- authors
- year
- source type
- journal/container
- publisher
- DOI
- URL
- volume
- issue
- pages / page range
- notes
- source-specific metadata, such as edition, editors, report number, access date, institution, website/container title, teaching-note context, or local source-note context

These fields should accept human-entered values, reviewed imported values, or reviewed suggestions. They should not be inferred from file name, title, parser chunks, provider hints, or candidate IDs without human review.

### B. Read-Only Provenance / System Fields

These fields should be visible for trust and audit context but not editable in the metadata review form:

- SourceDocument id
- file name
- file type
- intake candidate id
- createdAt / updatedAt
- audit event ids
- read-back verification status
- local vault/source path receipt when available
- parser provenance or extraction trace ids when available
- existing SourceCard id if a later update flow is intentionally opened

If these values are wrong, the correction path should be a separate SourceDocument/provenance correction workflow, not a hidden edit inside SourceCard metadata review.

### C. Citation / APA Candidate Fields Requiring Stricter Review

These fields may be displayed in future review surfaces, but they require stricter citation review before they affect citation-safe output:

- citation text candidate
- APA reference candidate
- citation readiness
- APA final verification
- human citation verification flag
- APA checklist state
- accepted citation warnings
- citation review scope, such as internal drafting or teaching preparation

Citation and APA candidate fields may become visible as draft candidates. They must not be labeled final automatically. APA-final verification must remain a separate human academic review boundary.

### D. Explicitly Not Inferred

The metadata review workflow must not infer or fabricate:

- authors
- year
- DOI
- publisher
- journal/container
- pages
- APA-final state
- citation-ready state
- provider truth
- source-type truth
- citation text
- APA reference text

Missing values should remain blank, `needs_review`, or `not_applicable` only after a human marks them not applicable.

## Future Field Status Model

Recommended field statuses:

- `available`: A value is present from saved root data, reviewed imported metadata, or a previous saved review. It may be displayed, but it is not necessarily verified for citation use.
- `needs_review`: A field is missing, uncertain, or not yet confirmed by a human. It blocks SourceCard creation eligibility when required for the selected source type.
- `edited_not_saved`: The user changed the field in the UI, but the value exists only in local form state. It must not unlock SourceCard creation or citation readiness.
- `saved_not_verified`: The value was submitted to the metadata review persistence boundary, but read-back verification has not confirmed it yet. It should not unlock SourceCard creation.
- `human_verified`: The field was saved, read back, and explicitly confirmed by a human reviewer for the selected source type. It may satisfy metadata review gating but still does not imply APA-final.
- `blocked`: The field or workflow state is unsafe, contradictory, or missing required provenance. Blocking fields prevent save or creation eligibility until resolved.
- `not_applicable`: A human explicitly marked the field as not applicable for the selected source type. The UI should require a reason for high-risk fields such as DOI, page range, or publisher when their absence affects citation quality.

Permitted actions by status:

- `available`: allow inspect, allow edit, require confirmation when the field is citation-relevant.
- `needs_review`: allow edit/confirm, block metadata verification.
- `edited_not_saved`: allow save/discard, show unsaved changes, block SourceCard creation.
- `saved_not_verified`: allow read-back retry, block SourceCard creation.
- `human_verified`: allow SourceCard gate checks, allow later correction with audit.
- `blocked`: show blockers, prevent save or creation depending on blocker severity.
- `not_applicable`: allow gate checks only if source-type rules accept not-applicable for that field.

## Future Editing Workflow

Recommended flow:

1. Select a saved SourceDocument.
2. Open the metadata completion/editing panel.
3. Display read-only SourceDocument provenance and current SourceCard deferred state.
4. User fills, edits, or confirms bibliographic fields.
5. System validates required fields for the selected source type.
6. User sees missing fields, warnings, and blockers.
7. User explicitly confirms reviewed fields and accepts remaining warnings.
8. User chooses an explicit save action for metadata review.
9. Metadata save writes a structured review record, not a SourceCard.
10. The app reads the saved metadata review record back from persistence.
11. Read-back verification confirms saved values, review status, audit event ids, and human confirmation.
12. SourceCard creation gate becomes eligible only after metadata review verification passes.
13. User must choose a separate explicit SourceCard creation action in a later creation workflow.

The editing panel should provide clear discard/reset behavior for provisional edits. It should never auto-save on blur, page navigation, source selection change, or preview rendering.

## Backend / Persistence Recommendation

The conservative recommendation is to add a narrow pre-creation metadata review persistence boundary before enabling SourceCard creation.

Recommended future model:

`source_document_sourcecard_metadata_reviews`

Recommended fields:

- `review_id`
- `source_document_id`
- `intake_candidate_id`
- `review_status`
- `source_type`
- `title`
- `authors`
- `year`
- `journal`
- `container_title`
- `publisher`
- `doi`
- `url`
- `volume`
- `issue`
- `page_range`
- `notes`
- `source_specific_metadata_json`
- `field_statuses_json`
- `warnings_json`
- `blockers_json`
- `human_confirmed`
- `human_confirmed_at`
- `read_back_verified`
- `read_back_verified_at`
- `created_at`
- `updated_at`

Why a separate review record is safer:

- A SourceDocument can be reviewed before a SourceCard exists.
- Existing SourceCard metadata update commands require a saved SourceCard id and should not create one indirectly.
- Existing structured bibliographic metadata is attached to SourceCards; pre-creation review needs a SourceDocument-rooted boundary.
- The SourceDocument-only intake boundary stays intact.
- SourceCard creation can later copy or link from a verified review record through a separate create command.

Recommended future command boundaries:

- `save_sourcecard_metadata_review`: saves only the metadata review record.
- `read_sourcecard_metadata_review`: reads the saved review record.
- `verify_sourcecard_metadata_review_readback`: confirms persistence receipt and reviewed field status.
- `create_sourcecard_from_verified_metadata_review`: future separate command, blocked unless review is verified and user explicitly approves SourceCard creation.

The SourceCard creation command should remain separate from metadata save. It should require the verified review id, accepted warning snapshot, blocker snapshot, and explicit create approval.

## UI Guardrails

Future editable UI must:

- avoid accidental save
- use an explicit save action
- show unsaved changes clearly
- require human confirmation before save
- show read-back verification after save
- show citation/APA not final unless explicitly verified in the citation/APA boundary
- keep SourceCard creation disabled until metadata review passes
- never auto-create a SourceCard after metadata save
- separate "Save metadata review" from "Create SourceCard"
- require discard confirmation when changing sources with unsaved edits
- prevent source selection changes from silently applying edits
- display AI/provider/parser values as suggestions only, with provenance labels
- require a user action to accept a suggestion into an editable field
- preserve "No citation/APA metadata is inferred" copy near citation-risk fields

The panel should keep read-only provenance fields visually distinct from editable bibliographic fields. Citation and APA fields should use warning styling, not completion styling, until their own stricter review gates are satisfied.

## Audit Requirements

Future metadata editing should emit audit events for:

- `metadata_review_started`
- `metadata_field_edited`
- `metadata_review_saved`
- `metadata_review_verified`
- `metadata_review_rejected_or_reset`
- `sourcecard_creation_unlocked`
- `sourcecard_creation_blocked`

Required audit payload:

- SourceDocument id
- review id
- candidate id / provenance id
- field name
- previous value if safe
- new value
- field status before change
- field status after change
- review status
- human confirmation flag
- reviewer note when supplied
- accepted warning ids or labels
- blocker ids or labels
- timestamp
- read-back verification status
- SourceCard id only when a later creation step actually creates one

Sensitive or large values should be summarized or redacted in audit payloads when needed. Audit events should record enough information to prove review decisions without leaking unnecessary source content.

## Non-Goals

This sprint does not implement:

- editable inputs
- metadata save
- SourceCard creation
- citation finalization
- APA finalization
- AI/provider lookup
- parser/classification
- KnowledgeCard generation
- Writer/DOCX output
- CitationGuard changes
- APA verification changes
- evidence review changes
- backend commands
- schema changes
- migrations
- tests
- dependency changes
- lockfile changes

## Risks

- Reusing existing SourceCard update commands before a SourceCard exists could accidentally collapse metadata review and SourceCard creation.
- Treating `citationReadiness: ready` as APA-final would overstate citation safety.
- Auto-accepting AI/provider/parser suggestions could fabricate bibliographic metadata.
- Saving provisional form state without read-back verification could make unverified fields look authoritative.
- Combining metadata save and SourceCard creation in one action could hide the approval boundary.
- Allowing citation text candidate edits in the same panel as bibliographic fields could make draft citation text look final.

## Recommended Next Sprint

Recommended next sprint:

**Sprint 4P-6 - SourceCard Metadata Review DTO Contract**

Recommended scope:

- keep runtime behavior unchanged
- define TypeScript-only DTO shapes in documentation or tests first
- define source-type validation rules for the future review record
- define warning/blocker snapshot shape
- define explicit save and read-back receipt copy
- define audit event payload contracts
- continue to defer active metadata editing, metadata save, and SourceCard creation until the boundary contract is stable
