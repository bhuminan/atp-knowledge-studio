# SourceCard Metadata Review Command Hardening 4P-8C

## Scope

Sprint 4P-8C hardens the SourceCard metadata review command boundary added in 4P-8B. The sprint remains backend and bridge only. No UI wiring, editable metadata fields, SourceCard creation, citation finality, APA final verification, parser/classification/AI/provider behavior, or downstream record creation was added.

## Inspected

- `save_sourcecard_metadata_review`
- `get_sourcecard_metadata_review`
- `list_sourcecard_metadata_reviews_for_source_document`
- `list_sourcecard_metadata_review_audit_events`
- SourceCard metadata review audit insertion
- SourceCard metadata review read-back verification
- idempotent update behavior for repeated `metadataReviewId`
- TypeScript bridge request/result types in `LocalVaultDatabase.ts`
- 4P-8B Rust persistence tests
- 4P-8A schema constraints

## Validation Hardening

The save command boundary rejects:

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
- parser, classification, AI, or provider flags
- cross-document reuse of an existing `metadataReviewId`

Additional tests now cover missing `metadataReviewId`, missing `sourceType`, contradictory safety flags, and unsafe parser/classification/AI/provider/downstream flags.

## Idempotency and Update Semantics

The command keeps the conservative 4P-8B idempotency rule:

- same `metadataReviewId` plus same `sourceDocumentId` may update the existing metadata review row
- same `metadataReviewId` plus a different `sourceDocumentId` is rejected
- repeated safe updates return `status: already_exists`
- repeated safe updates do not create duplicate review rows

4P-8C strengthens tests for same-document update behavior, cross-document rejection, audit filtering by `metadataReviewId`, audit filtering by `sourceDocumentId`, and duplicate row prevention.

## Audit Behavior

Audit events remain limited to `sourcecard_metadata_review_audit_events`.

Events covered:

- `sourcecard_metadata_review_save_requested`
- `sourcecard_metadata_review_save_rejected`
- `sourcecard_metadata_review_saved`
- `sourcecard_metadata_review_already_exists`
- `sourcecard_metadata_review_failed_read_back`
- `sourcecard_metadata_review_verified`

4P-8C strengthens audit tests for:

- rejected validation audit blockers
- saved audit event SourceDocument id
- saved audit event metadata review id
- saved audit event safety flags
- verified audit event read-back status
- cross-document duplicate rejection audit
- audit listing by metadata review id
- audit listing by SourceDocument id

Rejected saves for a missing SourceDocument still cannot write an audit event safely because the audit table requires a valid SourceDocument foreign key.

## Read-Back Verification

The command still does not report clean success until read-back verification passes.

Read-back checks compare:

- metadata review id
- SourceDocument id
- review status
- source type
- reviewed title
- citation readiness remains false
- APA final verification remains false
- human review remains required
- safety flags match the request

4P-8C adds a forced read-back mismatch test. When a mismatch occurs, the command returns `saved: false`, `status: failed_read_back`, `readBackStatus: saved_not_verified`, updates the row read-back status to `failed`, and writes `sourcecard_metadata_review_failed_read_back`. No verified audit event is written for that failed path.

## Downstream Protection

The hardening tests confirm the metadata review command does not create or mutate protected downstream rows:

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

SourceDocument save/read behavior remains unchanged. The tests seed SourceDocument records only as command prerequisites.

## TypeScript Bridge Safety

The TypeScript bridge preserves the explicit command field names:

- `metadataReviewId`
- `sourceDocumentId`
- `citationReady`
- `apaFinalVerified`
- `sourceCardCreated`
- `safetyFlags`
- `explicitHumanApproval`

The bridge does not call commands automatically, does not expose UI auto-save behavior, and does not imply SourceCard creation or citation/APA finality. Browser fallback for save remains blocked rather than simulating persistence.

## Tests Added or Strengthened

- missing `metadataReviewId` and `sourceType` rejection
- unsafe/contradictory safety flag rejection
- saved audit payload assertions
- verified audit read-back status assertion
- protected downstream row count preservation
- cross-document `metadataReviewId` reuse rejection
- audit listing by metadata review id and SourceDocument id
- forced read-back mismatch handling

## Remaining Limitations

- no UI wiring
- no editable metadata inputs
- no SourceCard creation
- no structured bibliographic metadata write
- no citation-ready state
- no APA final verification
- no parser, classification, AI, provider, network, WriterAgent, export, or CitationGuard integration
- no schema changes in this sprint

## Recommended Next Sprint

Sprint 4P-8D should add a read-only integration check that can display saved metadata review state when present, without editable inputs and without invoking save from UI. Active metadata editing and SourceCard creation should remain separate future boundaries.
