# KnowledgeUnit Save Preflight Preview - 4R-19

## Purpose

Sprint 4R-19 adds a preview-only KnowledgeUnit save preflight layer before any
runtime UI can save KnowledgeUnit records. 4R-18 made KnowledgeUnit persistence
callable through a strict backend command boundary, but the Source Library still
must not expose a save button or auto-save KnowledgeUnits.

This sprint helps ATP answer: which deterministic KnowledgeUnit candidates look
ready for a future save flow, which need review, and which are blocked?

## Current Boundary

- SourceDocument can be persisted and read back.
- SourceSection and ContentChunk can be persisted through the earlier explicit
  save boundary.
- KnowledgeUnit persistence exists as a backend command boundary only.
- KnowledgeUnit candidates are still preview data until a later user-approved
  save UI sprint.
- The 4R-19 panel is read-only and does not call `save_knowledge_unit` or
  `saveKnowledgeUnit`.

## Mapper Contract

`KnowledgeUnitSavePreflightMapper` evaluates the current
KnowledgeUnit candidate preview against the 4R-18 save contract.

The preflight requires:

- a saved SourceDocument link
- candidate id
- non-empty title
- non-empty body/summary text
- source trace JSON or equivalent trace label
- language value, with `unknown` treated conservatively
- explicit human approval before any future save
- no citation-ready claim
- no APA-final claim

The mapper returns:

- overall status: `ready`, `needs_review`, or `blocked`
- total, ready, needs-review, and blocked counts
- compact candidate rows
- blockers and warnings
- top blockers
- recommended next action
- exact preview-only notice

## UI Behavior

The Source Library Add Sources workspace shows a compact Win95-style
`KnowledgeUnit Save Preflight` panel next to the existing Deep Intake preview
panels.

The panel shows:

- total KnowledgeUnit candidate count
- ready / needs-review / blocked counts
- SourceDocument linkage
- explicit approval requirement
- citation and APA finality boundaries
- candidate rows with trace, trust, language, blockers, and warnings
- recommended next action

The required notice is:

`Preview only — KnowledgeUnits are not saved from this panel.`

The panel has no save button and no write behavior.

## Trust, Citation, and APA Boundaries

Preflight readiness is not citation readiness. A candidate that passes preflight
is only structurally eligible for a later manual save flow.

The mapper blocks any input that claims citation-ready or APA-final status.
Those states require separate review, citation validation, and future Writer or
export boundaries. 4R-19 does not infer citation-ready, APA-final, Writer-ready,
or publication-ready status.

## Thai Handling

Thai and mixed Thai-English candidates remain first-class. The preflight keeps
the candidate language profile and treats unknown language as a review warning
instead of silently upgrading the record. Future save UI must preserve original
Thai text, mixed-language traces, and segmentation warnings.

## Strict Non-Goals

4R-19 does not implement:

- schema changes or migrations
- Rust/backend command changes
- UI save buttons
- KnowledgeUnit auto-save
- EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, or WritingAngle persistence
- SourceCard creation
- citation-ready inference
- APA-final inference
- parser expansion
- AI/provider behavior
- PDF extraction or OCR
- Writer/export behavior
- UI redesign
- image processing

## Recommended Next Sprint

Recommended next sprint: 4R-20 KnowledgeUnit Manual Save UI Gate.

That sprint should add a narrow, explicit, human-approved UI flow that calls the
existing 4R-18 backend command for a single selected KnowledgeUnit candidate,
then verifies read-back and audit output. It should not add batch save until the
single-record gate is proven safe.
