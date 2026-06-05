# SourceCard Metadata Review Backend Checkpoint 4P-8D

## Current State Summary

Sprint 4P-8D is a documentation-only checkpoint for the SourceCard metadata review backend. It records what is now real after 4P-8A, 4P-8B, and 4P-8C, and it defines conservative next options before any future UI metadata editing, UI save action, or SourceCard creation boundary.

No runtime behavior changed in this sprint.

Current backend state:

- SourceCard metadata review schema exists.
- SourceCard metadata review audit table exists.
- Save/read/list/audit-list commands exist.
- TypeScript bridge functions exist.
- Validation blocks unsafe SourceCard, citation, APA, downstream, parser, classification, AI, and provider flags.
- Same `metadataReviewId` may update only the same SourceDocument.
- Cross-document `metadataReviewId` reuse is rejected.
- Read-back verification exists.
- Audit events exist for requested, rejected, saved, already-exists, verified, and failed-read-back paths.
- Downstream protection tests confirm the metadata review command does not create SourceCard or downstream rows.

Current product state:

- No UI wiring exists.
- No metadata editing UI exists.
- No active metadata save exists in Source Library UI.
- No SourceCard creation exists from this boundary.
- No citation-ready approval boundary exists.
- No APA-final verification boundary exists.
- No parser, classification, AI, or provider integration exists for this record.

## Files Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_SCHEMA_MVP_4P8A.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_COMMAND_MVP_4P8B.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_COMMAND_HARDENING_4P8C.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_RECORD_PREFLIGHT_4P7.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_RECORD_BOUNDARY_4P6.md`
- `docs/architecture/SOURCECARD_METADATA_EDITING_BOUNDARY_DESIGN_4P5.md`
- `docs/architecture/SOURCECARD_METADATA_COMPLETION_PREVIEW_HARDENING_4P4.md`
- `src-tauri/migrations/014_add_sourcecard_metadata_reviews.sql`
- `src-tauri/src/vault_db.rs`
- `src-tauri/src/lib.rs`
- `src/lib/persistence/LocalVaultDatabase.ts`

## Implemented Backend Capabilities

### Schema

Migration `014_add_sourcecard_metadata_reviews` adds:

- `sourcecard_metadata_reviews`
- `sourcecard_metadata_review_audit_events`

The review record is SourceDocument-rooted. It is not a SourceCard and does not replace `source_cards`, `source_card_bibliographic_metadata`, or `source_card_apa_reference_reviews`.

The schema keeps citation and APA readiness conservative:

- `citation_ready` defaults to false.
- `apa_final_verified` is constrained to false.
- `human_review_required` remains true.
- `read_back_status` tracks verification state.

### Commands

The Rust/Tauri command surface now includes:

- `save_sourcecard_metadata_review`
- `get_sourcecard_metadata_review`
- `list_sourcecard_metadata_reviews_for_source_document`
- `list_sourcecard_metadata_review_audit_events`

These commands are registered in `src-tauri/src/lib.rs`.

### Frontend Bridge

The TypeScript bridge in `LocalVaultDatabase.ts` now includes:

- `saveSourceCardMetadataReview`
- `getSourceCardMetadataReview`
- `listSourceCardMetadataReviewsForSourceDocument`
- `listSourceCardMetadataReviewAuditEvents`

The bridge preserves explicit field names such as `metadataReviewId`, `sourceDocumentId`, `citationReady`, `apaFinalVerified`, `sourceCardCreated`, `safetyFlags`, and `explicitHumanApproval`.

The browser fallback does not simulate persistence. Save fallback returns a blocked result so browser QA cannot accidentally imply that metadata review was persisted outside the Tauri SQLite boundary.

## Validation Summary

The save command rejects:

- missing `sourceDocumentId`
- missing or unreadable SourceDocument
- missing `metadataReviewId`
- missing `reviewStatus`
- missing `reviewedTitle`
- missing `sourceType`
- missing explicit human approval
- unsupported review status
- `sourceCardCreated: true`
- safety flag `sourceCardCreated: true`
- `citationReady: true`
- `apaFinalVerified: true`
- `humanReviewRequired: false`
- `metadataReviewOnly: false`
- downstream creation flags
- citation metadata inference flags
- parser flags
- classification flags
- AI flags
- provider/API flags
- cross-document reuse of an existing `metadataReviewId`

The result is intentionally conservative: a saved metadata review can be human verified as a metadata review record, but it still cannot imply citation readiness, APA finality, or SourceCard creation.

## Idempotency And Update Summary

Current idempotency rule:

- Same `metadataReviewId` plus same `sourceDocumentId` may update the existing metadata review row.
- Same `metadataReviewId` plus a different `sourceDocumentId` is rejected.
- Safe repeated updates return `status: already_exists`.
- Repeated updates do not create duplicate review rows.
- Cross-document rejection keeps the `metadataReviewId` in audit payloads so audit listing by metadata review id can find the rejection.

This is safe enough for backend-only persistence, but it is not yet a complete UI edit-history model. There is still no field-level history table, diff view, conflict resolution UI, or stale-field invalidation model.

## Audit And Read-Back Summary

Audit events are written to `sourcecard_metadata_review_audit_events`.

Supported event types:

- `sourcecard_metadata_review_save_requested`
- `sourcecard_metadata_review_save_rejected`
- `sourcecard_metadata_review_saved`
- `sourcecard_metadata_review_already_exists`
- `sourcecard_metadata_review_failed_read_back`
- `sourcecard_metadata_review_verified`

Audit events include:

- event id
- event type
- command name
- SourceDocument id
- metadata review id when available
- result status
- blockers
- warnings
- safety flags
- read-back status
- message

Rejected saves for a missing SourceDocument cannot safely write an audit event because the audit table has a SourceDocument foreign key. Rejections after SourceDocument validation do write requested/rejected audit events.

Read-back verification:

- The save command reads the saved row back before reporting clean success.
- Key fields are compared after read-back.
- Clean success requires `readBackStatus: verified`.
- A mismatch returns a failed-read-back style result rather than clean success.
- Failed read-back is auditable.
- Verified read-back is auditable.

## Downstream Protection Summary

4P-8C tests confirm the metadata review command does not create or mutate protected downstream rows:

- `source_cards`
- `source_card_bibliographic_metadata`
- `source_card_apa_reference_reviews`
- `marketing_tags`
- `knowledge_cards`
- `draft_artifacts`
- `external_metadata_match_results`
- `suggested_metadata_corrections`
- `metadata_correction_audit_events`
- SourceDocument extraction rows, segments, and evidence traces

SourceDocument save/read behavior remains unchanged. SourceDocument records are only prerequisites for this command because the metadata review record is SourceDocument-rooted.

## Remaining Limitations

Not implemented:

- UI wiring
- metadata editing UI
- active metadata save from Source Library UI
- SourceCard creation
- SourceCard creation audit
- citation-ready approval boundary
- APA-final verification boundary
- field-level history table
- field-level stale-state invalidation
- metadata edit conflict handling
- provider metadata suggestions for this record
- AI metadata suggestions for this record
- parser integration
- classification integration
- CitationGuard integration
- APA verification integration
- evidence review integration
- DOCX export integration
- WriterAgent integration
- network behavior

The backend checkpoint means the storage and command boundary exists. It does not mean the product is ready for active metadata editing or SourceCard creation.

## Risks

- If UI save wiring is added too quickly, users may mistake metadata review save for SourceCard creation.
- If editable inputs are introduced without a disabled/save-gate preview first, unsaved edits could be confused with persisted review data.
- If `citationReady` or `apaFinalVerified` become reachable from this metadata review command, stricter citation and APA review gates would be bypassed.
- If SourceCard creation is combined with metadata save, the explicit approval boundary would be hidden.
- If provider or AI suggestions are introduced before provenance and confidence display are designed, the app could appear to validate metadata it has not actually verified.
- If field-level history is delayed too long after active editing begins, reviewers may lack enough traceability for academic metadata changes.

## Next Safe Options

### 4P-9A Read-Only SourceCard Metadata Review Backend Status Panel

Add a read-only UI surface that can show whether a saved metadata review exists for a saved SourceDocument. It should display status, read-back status, latest audit event summary, and the continued warning that SourceCard creation, citation-ready, and APA-final states remain unavailable.

This option should not add editable fields or invoke save from the UI.

Safety: highest.

### 4P-9B Metadata Review UI Save Gate Preview

Design a non-saving preview of a future save gate. It can show blockers, warnings, required fields, human approval requirements, and the difference between unsaved UI state and persisted metadata review state.

This option should still not call `saveSourceCardMetadataReview`.

Safety: high if it remains preview-only.

### 4P-9C Disabled Metadata Editing UI Shell

Create a disabled editing shell that shows planned field groups and disabled controls. It should make clear that editing is not active and that save is unavailable.

Safety: moderate. It is useful for layout planning, but disabled inputs can still create user confusion if copy and affordances are not precise.

### 4Q-0 SourceCard Creation Boundary Design

Design the later explicit SourceCard creation boundary. It should require a verified metadata review id, separate SourceCard creation approval, SourceCard creation audit events, read-back verification, and a separate command path.

Safety: lower as the next immediate sprint. It should not start until read-only status and save-gate UI previews are reviewed.

## Recommended Next Sprint

Recommended next sprint:

**4P-9A Read-Only SourceCard Metadata Review Backend Status Panel**

Reason:

- It uses the backend capability that now exists without creating new write behavior.
- It helps users and reviewers see saved backend state before editing begins.
- It preserves the SourceDocument-only intake boundary.
- It avoids active metadata editing.
- It avoids SourceCard creation.
- It avoids citation-ready and APA-final implications.

Do not proceed directly to active metadata editing or SourceCard creation. The product should first show the saved review status read-only, then preview the save gate, then introduce any disabled editing shell, and only later design SourceCard creation as a separate explicit boundary.

## Explicit Runtime Confirmation

Sprint 4P-8D made no runtime behavior changes. It did not modify TypeScript app code, Rust backend code, SQLite schema, migrations, tests, package files, Cargo files, lockfiles, dependencies, UI, parser/classification/AI/API/provider behavior, CitationGuard, APA verification, evidence review, DOCX export, WriterAgent, network behavior, or unrelated flows.
