# KnowledgeUnit Explicit Save UI MVP - 4R-20

## Purpose

Sprint 4R-20 adds the first explicit Source Library UI path for saving approved
KnowledgeUnit candidates to the local vault.

This sprint connects the 4R-19 KnowledgeUnit save preflight panel to the 4R-18
`saveKnowledgeUnit` command boundary, but only through a deliberate user click.
It does not add automation, batch autopilot, or downstream family persistence.

## Why Explicit Save Is Allowed Now

The earlier 4R work established the required safety layers:

- 4R-17 added the KnowledgeUnit schema and audit table.
- 4R-18 added backend save/read/list commands with explicit approval,
  conservative validation, audit events, and read-back verification.
- 4R-19 added a preview-only preflight panel that classifies KnowledgeUnit
  candidates as ready, needs-review, or blocked.

4R-20 keeps the next step narrow: a user may locally approve a preflight-ready
candidate and then click `Save Approved KnowledgeUnits`.

## Approval And Preflight Flow

KnowledgeUnit candidates start in local `needs_review` state.

The user can:

- approve a candidate
- reject a candidate
- leave a candidate in review

The save gate only considers candidates that are both:

- explicitly approved by the user
- preflight-ready after the approval state is applied

Rejected, blocked, or still-needs-review candidates are skipped and are not sent
to persistence.

## Save Contract

The UI calls `saveKnowledgeUnit` only from the explicit save action.

Each request preserves:

- candidate id
- title
- body
- source document id
- source section id where available
- content chunk id where available
- source trace JSON
- trust status
- review status
- language
- unit type
- warnings JSON

Each request explicitly sends:

- `explicitHumanApproval: true`
- `citationReady: false`
- `apaFinalVerified: false`

The UI does not infer citation-ready, APA-final, Writer-ready, or
publication-ready status.

## Read-Back Verification

After saving, the UI lists KnowledgeUnits for the SourceDocument and shows a
compact summary:

- saved count
- skipped count
- blocked count
- read-back verified count
- failed count
- listed saved KnowledgeUnit count

The summary is informational. Audit and read-back truth still come from the
4R-18 backend result.

## Duplicate And Idempotence Behavior

4R-20 reuses the 4R-18 backend idempotence boundary. Repeat submissions of the
same deterministic KnowledgeUnit id may return `already_exists` when critical
fields match.

This sprint does not add a migration or new duplicate-resolution model. Richer
duplicate review remains deferred.

## Thai Language Handling

Thai and mixed Thai-English candidates remain first-class. The UI preserves the
candidate language value and sends it through the save request. It does not
translate, normalize, or rewrite Thai source text. Thai segmentation warnings
remain in warnings JSON until a dedicated review flow resolves them.

## Strict Non-Goals

4R-20 does not implement:

- auto-save
- saving unapproved candidates
- saving blocked candidates
- new Rust/backend commands
- schema or migration changes
- EvidenceUnit persistence
- CaseUnit persistence
- QuoteUnit persistence
- TeachingUnit persistence
- WritingAngle persistence
- SourceCard creation
- citation-ready inference
- APA-final inference
- AI/provider behavior
- parser expansion
- PDF extraction or OCR
- Writer/export behavior
- UI redesign
- image processing

## Recommended Next Sprint

Recommended next sprint: 4R-21 KnowledgeUnit Save Result Review / Reversal Plan.

That sprint should keep persistence narrow and design how users review,
supersede, or archive saved KnowledgeUnits before ATP adds broader batch review
or downstream unit persistence.
