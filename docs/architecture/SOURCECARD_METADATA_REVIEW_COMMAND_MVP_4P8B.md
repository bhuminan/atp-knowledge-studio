# SourceCard Metadata Review Command MVP 4P-8B

## Scope

Sprint 4P-8B adds a narrow persistence command layer for SourceCard metadata review records. It does not add UI wiring, editable metadata controls, SourceCard creation, citation finality, or APA final verification.

The command remains anchored to a saved SourceDocument. A saved metadata review is a human-approved review record only; it is not a SourceCard and does not create downstream writing or citation records.

## Commands Added

- `save_sourcecard_metadata_review`
- `get_sourcecard_metadata_review`
- `list_sourcecard_metadata_reviews_for_source_document`
- `list_sourcecard_metadata_review_audit_events`

## Frontend Bridge Functions

- `saveSourceCardMetadataReview`
- `getSourceCardMetadataReview`
- `listSourceCardMetadataReviewsForSourceDocument`
- `listSourceCardMetadataReviewAuditEvents`

The bridge is intentionally not called from the UI in this sprint. Browser fallback save behavior returns a blocked result rather than simulating SQLite persistence.

## Save Input Contract

The save request includes:

- stable `metadataReviewId`
- `sourceDocumentId`
- optional `createdFromCandidateId`
- `reviewStatus`
- `sourceType`
- `reviewedTitle`
- optional reviewed bibliographic fields
- optional citation and APA candidate text fields
- blockers and warnings arrays
- `safetyFlags`
- `sourceCardCreated`
- `explicitHumanApproval`
- `citationReady`
- `apaFinalVerified`
- `humanReviewRequired`

## Save Output Contract

The save result returns:

- `saved`
- `status`
- `readBackStatus`
- `review`
- `auditEventIds`
- `blockers`
- `warnings`
- `sourceCardCreated`
- `sourceDocumentId`
- `dbPath`

Clean success is returned only when read-back verification passes. A read-back mismatch returns `saved: false`, `status: failed_read_back`, and `readBackStatus: saved_not_verified`.

## Validation Rules

The save command rejects:

- missing or unreadable `sourceDocumentId`
- missing `metadataReviewId`
- missing `reviewStatus`
- missing `sourceType`
- missing `reviewedTitle`
- missing `explicitHumanApproval`
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

## Idempotency Rule

The command uses conservative idempotency by `metadataReviewId`.

Repeated saves with the same `metadataReviewId` may update the existing review only when the existing record belongs to the same `sourceDocumentId`. This records a `sourcecard_metadata_review_already_exists` audit event and still performs read-back verification.

The same `metadataReviewId` cannot be reassigned to a different SourceDocument.

## Audit Behavior

Audit events are written to `sourcecard_metadata_review_audit_events` for:

- `sourcecard_metadata_review_save_requested`
- `sourcecard_metadata_review_save_rejected`
- `sourcecard_metadata_review_saved`
- `sourcecard_metadata_review_already_exists`
- `sourcecard_metadata_review_failed_read_back`
- `sourcecard_metadata_review_verified`

Rejected saves for a missing SourceDocument cannot safely write an audit event because the audit table has a SourceDocument foreign key. Rejections after SourceDocument validation write requested and rejected events.

Audit payloads include event type, command name, SourceDocument id, optional metadata review id, result status, blockers, warnings, safety flags, read-back status, and message.

## Read-Back Verification

After persistence, the command reads the review back and compares key fields:

- metadata review id
- SourceDocument id
- review status
- source type
- reviewed title
- citation readiness remains false
- APA final verification remains false
- human review remains required
- safety flags match the request

The command updates `read_back_status` to `verified` only after the check passes.

## Why No UI Wiring Was Added

4P-8B is a backend/bridge MVP sprint. The UI still has no active metadata editing controls and no save trigger for this record type. Keeping the bridge uncalled prevents accidental metadata writes before a reviewed interaction design exists.

## Why SourceCard Remains Separate

The metadata review record is a review boundary, not a SourceCard creation boundary. It records human review of candidate metadata while preserving the SourceDocument-only intake boundary. SourceCard creation remains a future explicit action.

## Why Citation and APA Finality Remain Blocked

`citationReady` and `apaFinalVerified` are blocked because citation readiness and APA final verification require their own explicit human verification boundaries. This sprint does not infer bibliographic metadata, generate APA references, or verify citation finality.

## Not Implemented

- UI wiring
- editable metadata inputs
- metadata save buttons
- SourceCard creation
- structured bibliographic metadata writes
- APA review table writes
- citation-ready or APA-final state
- parser/classification/AI/provider calls
- downstream writing, export, evidence, or WriterAgent flows

## Recommended Next Sprint

Sprint 4P-8C should add a small preflight/read-only integration point that surfaces saved metadata review state without introducing editable UI or SourceCard creation. A later sprint can design the explicit human edit and SourceCard creation boundary separately.
