# Source Library Explicit SourceDocument Save Gate 4N-5

Sprint 4N-5 adds the first active Source Library UI gate for saving reviewed INPUT Room intake candidates as SourceDocument root records only.

## UI Gate Added

The Source Library incoming package preview now includes an explicit SourceDocument save gate near the SourceDocument Save Candidate Preview. The gate states that the operation is SourceDocument-only and that SourceCard creation remains deferred.

The gate keeps the existing preview panel visible and adds:

- boundary copy for SourceDocument-only save
- ready/excluded/SourceCard count summary
- explicit approval checkbox
- safety acknowledgement checkbox
- active save button when conditions pass
- audit/read-back result panel after save

## Gating Conditions

The save button is disabled unless:

- at least one candidate is ready
- the candidate is PDF or DOCX
- the candidate has a file name and title
- blocked, unsupported, and incomplete candidates are excluded
- “I approve creating SourceDocument records only.” is checked
- “I understand SourceCard, parsing, classification, AI, and citation work remain disabled.” is checked

## Save Payload Rules

The UI sends only ready supported candidates to `save_intake_source_document_candidates`.

The payload sets:

- `source: "INPUT Room"`
- `intendedDestination: "Source Library Intake"`
- `explicitApproval: true`
- `readinessStatus: "ready"`
- `reviewStatus: "approved_for_source_document_save"`
- safety flags for parsed, classified, AI, persisted, SourceDocument created, and SourceCard created as false

The UI does not send blocked, unsupported, or incomplete candidates. It does not send SourceCard, extraction, citation, APA, Writer, provider, AI/API, or downstream payloads.

## Result Display

After the save action returns, the UI displays:

- per-candidate status
- saved SourceDocument id when available
- read-back verification status
- audit event ids
- `auditEventsWritten`
- audit limitation or warning copy
- success copy only when all returned candidate results pass read-back verification

## Audit And Read-Back

Sprint 4N-4 made the backend audit-visible. Sprint 4N-5 surfaces that contract in the UI. A successful UI receipt requires both the backend save result and read-back verification in the returned candidate results.

## Why SourceCard Remains Deferred

SourceCard records require metadata review and future approval. This sprint only creates SourceDocument root records so the Source Library can establish a narrow, auditable persistence boundary before downstream source-card, parser, classification, citation, and writing workflows are activated.

## Not Implemented

- no auto-save on page load
- no SourceCard creation
- no MarketingTag, KnowledgeCard, DraftArtifact, citation, APA, extraction, segment, evidence trace, provider, AI/API, Writer, export, or network behavior
- no parser or classifier follow-up
- no automatic handoff to downstream workflows

## Next Recommended Sprint

Sprint 4N-6 should add a persisted SourceDocument receipt/history view that reads audit events and saved SourceDocument records without creating SourceCards or downstream records.
