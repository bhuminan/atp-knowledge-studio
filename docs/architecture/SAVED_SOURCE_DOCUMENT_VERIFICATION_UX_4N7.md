# Saved SourceDocument Verification UX 4N-7

Sprint 4N-7 improves the post-save verification experience for the Source Library explicit SourceDocument-only save gate.

## Post-save Verification UX Added

The SourceDocument save result panel now shows a compact receipt for each returned candidate result. Each receipt includes:

- SourceDocument id
- title
- file name
- file type/source type
- result status
- read-back verification status
- audit event ids

The panel keeps copy short and user-facing so the user can confirm what was saved or already existed without reading backend details.

## Read-back Summary Behavior

After save, the UI shows a compact summary with:

- total submitted
- saved count
- already_exists count
- rejected count
- failed_read_back count
- read-back verified count
- audit events written state
- SourceCard created count

Success copy appears only when every returned candidate result has read-back verification.

## Audit Trace Display Behavior

The result panel displays package-level `auditEventsWritten` and candidate-level audit event ids returned by `save_intake_source_document_candidates`.

If audit events were not written or package warnings exist, the UI shows an audit review warning. This sprint does not add an audit browser or separate audit history viewer.

## Why SourceCard Remains Deferred

SourceCard creation remains deferred because metadata review, citation readiness, APA verification, and downstream knowledge workflows require separate approval gates. This sprint only makes the SourceDocument root save result easier to inspect.

## What Remains Not Implemented

- no SourceCard creation
- no MarketingTag, KnowledgeCard, DraftArtifact, citation, APA, extraction run, segment, evidence trace, provider, AI/API, Writer, export, parser, or classification behavior
- no audit browser
- no persisted receipt/history list beyond the current save result panel
- no automatic downstream handoff after SourceDocument save

## Next Recommended Sprint

Add a read-only persisted receipt/history view that lists saved SourceDocument rows with their intake audit events, without creating SourceCards or downstream records.
