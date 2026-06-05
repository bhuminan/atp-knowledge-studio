# Real Intake Persistence Boundary 4M-3

## Current State Summary

Sprint 4M-3 is an architecture and boundary inspection sprint. It makes no runtime behavior changes.

The INPUT Room now has a local-only handoff package preview, and Source Library has a local/static incoming package preview plus approval preflight copy. None of those UI layers transfers state, saves records, parses files, classifies sources, calls AI, calls providers, or mutates Source Library.

The existing backend already supports explicit SourceDocument and SourceCard save commands, but those commands are tied to reviewed candidate payloads and current parsed-DOCX/source-library flows. A future incoming package persistence sprint should reuse the current explicit-save discipline rather than turning the 4L/4M preview packages into automatic saves.

## Existing Persistence Capabilities Inspected

### SourceDocument

The backend command `save_source_document_candidate` accepts a `SaveSourceDocumentRequest` and writes:

- `source_documents`
- `extraction_runs`
- `extraction_segments`
- `evidence_traces`

The save is transactional. It validates required ids/title/file metadata, requires approved review status, blocks blocked candidates, requires at least one segment and one trace, preserves chunk references, and blocks trusted DOCX page numbers. It returns blockers/warnings and does not create SourceCards.

Read/list commands exist through `list_saved_source_documents` and `read_saved_source_document`. The read detail returns the SourceDocument root, latest extraction run, segments, and traces.

### SourceCard

The backend command `save_source_card_candidate` accepts a `SaveSourceCardRequest` linked to an existing SourceDocument. It validates SourceCard metadata/citation statuses, blocks rejected or blocked candidates, blocks missing linked SourceDocument, and returns warnings for incomplete metadata, unresolved authors/year, and citation text requiring review.

Read/list commands exist through `list_saved_source_cards` and `read_saved_source_card`. SourceCard detail joins back to its SourceDocument.

### Downstream Records

MarketingTag, KnowledgeCard, and DraftArtifact saves are already separate explicit commands. Existing validators block missing linked SourceCards, save only approved MarketingTags/KnowledgeCards, and keep DraftArtifacts mock/not-final. These should not be included in the first real incoming intake persistence sprint.

### Batch Intake Queue

The `batch_research_intake_jobs` table and `create_batch_research_intake_jobs` command store PDF/DOCX queue records only. Validation states:

- Files are not parsed.
- No external metadata lookup is performed.
- No SourceDocument or SourceCard is created automatically.
- No metadata is overwritten.

This queue shape is useful background, but a future INPUT package approval flow should not silently reuse it to imply SourceDocument creation.

### Audit And Read-Back Patterns

Metadata correction flows already demonstrate useful safety patterns:

- Review decisions write audit events.
- Apply dry-run can write preflight audit events.
- Structured apply requires reviewer confirmation.
- Structured apply writes started/applied/read-back-verified or failed audit events.
- Read-back verification determines whether the result is `applied_and_verified` or `read_back_failed`.

Future incoming package persistence should copy this audit/read-back pattern, not bypass it.

## Proposed Future Approval Boundary

A future real intake package must be eligible only when all of these are true:

- The package was explicitly reviewed by the user in Source Library.
- The user clicked an active approval control, not a preview-only or disabled affordance.
- The package source is INPUT Room and destination is Source Library Intake.
- Safety flags confirm no AI/classification/parser work was already assumed.
- Every candidate has a readiness state.
- Unsupported files are removed or remain blocked.
- At least one supported candidate is approved for future intake.
- Each candidate has required file metadata: id, file name, file type, size when available, and local-path/reference policy.
- Metadata completeness state is explicit. Missing bibliographic metadata must not be fabricated.
- The future command writes an audit event before any persistence.
- The future command performs read-back verification after any save.
- Any failure leaves the package in a blocked or retryable review state.

## Proposed Future Minimal Save Sequence

The smallest safe MVP should create SourceDocument first and defer SourceCard unless metadata is sufficiently reviewed.

1. User opens Source Library incoming package preflight.
2. User reviews the incoming package and candidate list.
3. UI blocks unsupported candidates.
4. UI requires explicit approval of one or more supported candidates.
5. Backend writes an `incoming_intake_approval_started` audit event.
6. Backend validates the candidate again server-side.
7. Backend creates only SourceDocument root records for approved candidates that have enough non-fabricated file/source metadata.
8. Backend does not run parser, classifier, provider lookup, AI, or citation finalization.
9. Backend reads each saved SourceDocument back.
10. Backend writes `incoming_intake_source_document_created` and `incoming_intake_read_back_verified` audit events for successes.
11. Backend writes `incoming_intake_failed` audit events for failures.
12. UI shows a receipt with saved SourceDocument ids, blocked candidates, warnings, and read-back status.

SourceCard creation should remain a second explicit step unless the candidate has human-reviewed metadata sufficient to satisfy SourceCard save validators without fabricated citation text. If metadata is incomplete, the UI should show “SourceCard blocked until metadata review.”

## Required Validations

Future backend validation should require:

- Package id is present.
- Package source is INPUT Room.
- Intended destination is Source Library Intake.
- Approval state is explicit and human-confirmed.
- Candidate review status is approved for intake.
- Candidate file type is supported: initially PDF or DOCX only.
- Unsupported files cannot be saved.
- Candidate is not blocked.
- Candidate metadata completeness is declared.
- Local path/reference policy is declared and does not imply file copy/upload.
- No generated citation metadata is accepted as final.
- SourceDocument id is deterministic or collision-safe.
- Existing record conflicts are handled as blocked or idempotent only when explicitly designed.
- Read-back succeeds after save.

Future SourceCard validation should additionally require:

- Saved SourceDocument exists.
- SourceCard candidate is not rejected or blocked.
- Metadata status is not blocked.
- Citation readiness is not blocked.
- Citation text is human-reviewed or explicitly marked needs review.
- Authors/year gaps remain warnings, not fabricated values.

## Required Audit Events

Recommended future audit event names:

- `incoming_intake_approval_started`
- `incoming_intake_candidate_blocked`
- `incoming_intake_source_document_create_started`
- `incoming_intake_source_document_created`
- `incoming_intake_read_back_verified`
- `incoming_intake_source_card_deferred`
- `incoming_intake_failed`

Audit payloads should include package id, candidate id, file name, file type, user approval timestamp, resulting SourceDocument id when present, blockers, warnings, and read-back result.

The first real sprint may need a new audit table, or a generalized intake audit table. It should not overload metadata correction audit events unless the event semantics are intentionally generalized first.

## Required Read-Back Verification

Every successful future write must be read back before the UI marks it complete.

For SourceDocument:

- Read the saved SourceDocument by id.
- Verify id, title, file name, file type, metadata status, parser status, review status, and created-from-candidate id.
- Verify extraction/segment/trace expectations according to the chosen MVP. If the MVP creates metadata-only SourceDocuments, schema changes may be required because current SourceDocument save expects segments and traces.

For SourceCard:

- Read the saved SourceCard by id.
- Verify linked SourceDocument id.
- Verify metadata status and citation readiness remain non-final unless human review completed them.
- Verify citation text was not fabricated or overwritten by automation.

If read-back fails, the future command should return a failed status and write an audit event. If the write was partially committed, the failure must be visible and retry-safe.

## Rollback And Failure Behavior

The safest future MVP should use one transaction per approved candidate or one transaction for the whole approved package. The choice changes user experience:

- Per-candidate transaction: one bad candidate does not block all approved candidates, but the receipt must show partial success.
- Whole-package transaction: simpler all-or-nothing behavior, but one bad candidate blocks the package.

For the first real persistence sprint, prefer per-candidate transactions with explicit receipt rows if the UI can explain partial success. Prefer whole-package transaction if the UI cannot make partial success clear.

In either case:

- Unsupported candidates remain blocked before transaction start.
- Failed candidates return blockers.
- Successful records are read back.
- Audit events make the result inspectable.
- No downstream SourceCard/KnowledgeCard/DraftArtifact work runs automatically.

## UI Implications

The Source Library incoming package preview should stay preview-only until a backend command exists. A future real UI should add:

- Explicit candidate approval controls.
- Package-level approval confirmation.
- A visible “SourceDocument only” MVP scope notice.
- A warning that SourceCard creation is blocked until metadata review when metadata is incomplete.
- A processing receipt after save.
- Read-back verification badges.
- Audit event visibility or a link to audit detail.

The disabled “Future: Approve intake package” affordance from 4M-2 should become active only after backend validation, audit, and read-back behavior are implemented.

## Risks

- Accidentally creating SourceCards with incomplete or fabricated citation metadata.
- Treating INPUT preview candidates as real files without local-path policy review.
- Triggering parser/classification/AI/provider work during intake approval.
- Saving SourceDocument rows without adequate trace/provenance strategy.
- Reusing metadata correction audit events for a semantically different intake approval flow.
- Hiding partial failures in batch approval.
- Marking APA/citation states as final too early.

## Non-Goals For First Real Intake Persistence Sprint

- No AI classification.
- No parser execution.
- No citation finalization.
- No APA-final status.
- No automatic SourceCard creation if metadata is incomplete.
- No batch auto-save without review.
- No network/provider lookup.
- No DOCX/PDF text extraction changes.
- No MarketingTag, KnowledgeCard, or DraftArtifact creation.
- No automatic metadata correction apply.

## Recommended Next Sprint

Sprint 4M-4 should design the concrete backend command contract and migration shape for an incoming intake approval audit table. It should remain command/schema design or implement only a dry-run/preflight command unless the team is ready to build full audit plus read-back behavior.

If runtime implementation begins, the first real persistence sprint should be SourceDocument-only with explicit user approval, server-side validation, audit events, and read-back verification. SourceCard creation should be deferred until metadata review is complete.

## Files Inspected

- `docs/product/INPUT_SOURCE_LIBRARY_HANDOFF_CONTRACT_4L4.md`
- `docs/product/SOURCE_LIBRARY_INCOMING_PACKAGE_PREVIEW_4M1.md`
- `docs/product/SOURCE_LIBRARY_INCOMING_PACKAGE_PREFLIGHT_4M2.md`
- `src/features/source-library/SourceLibraryPage.tsx`
- `src/features/source-library/components/SourceLibraryIncomingPackagePreview.tsx`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `src/lib/persistence/PersistenceDryRunService.ts`
- `src/lib/sources/PersistenceSaveCandidateMapper.ts`
- `src/lib/sources/KnowledgeVaultSaveReadinessMapper.ts`
- `src/lib/sources/KnowledgeVaultSaveCandidateMapper.ts`
- `src-tauri/src/lib.rs`
- `src-tauri/src/vault_db.rs`
- `src-tauri/migrations/001_init_source_document_root.sql`
- `src-tauri/migrations/002_add_source_cards.sql`
- `src-tauri/migrations/008_add_batch_research_intake_jobs.sql`
- `src-tauri/migrations/010_add_metadata_correction_audit_events.sql`
- `tests/e2e/source-library.spec.ts`

## Runtime Behavior Confirmation

Sprint 4M-3 made no runtime behavior changes. It did not modify app code, Rust backend commands, SQLite migrations, persistence save/read behavior, parser/classification/provider/AI/API code, Source Library state, or package/Cargo lockfiles.
