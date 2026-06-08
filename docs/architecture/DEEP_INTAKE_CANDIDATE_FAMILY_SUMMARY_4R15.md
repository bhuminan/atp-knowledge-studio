# Deep Intake Candidate Family Summary 4R-15

## 1. Purpose

Sprint 4R-15 adds a preview-only Deep Intake Candidate Family Summary and Save Readiness Gate.

The summary consolidates the current no-AI candidate family previews into one decision layer:

- `SourceDocument`
- `SourceSection`
- `ContentChunk`
- `KnowledgeUnit`
- `EvidenceUnit`
- `CaseUnit`
- `QuoteUnit`
- `TeachingUnit`
- `WritingAngle`

It answers:

```text
Is this source ready for the next Deep Intake step, what candidate families are available, what is blocked, and what should the user do next?
```

## 2. Deterministic No-AI Boundary

The mapper is pure TypeScript and no-AI.

It does not:

- call providers
- infer academic truth
- finalize citations
- infer APA-final state
- persist downstream units
- call backend commands
- run parser expansion, PDF extraction, or OCR

The summary only composes existing preview/read-back signals from the Source Library Deep Intake preview stack.

## 3. Input Sources

The summary can use:

- Intake Readiness Preview
- Document Structure Preview
- Chunking Strategy Preview
- Deep Intake Run Candidate Bundle
- SourceSection + ContentChunk Save Candidate mapping
- KnowledgeUnit Candidate Preview
- Evidence / Case / Quote Candidate Preview
- Teaching / Writing Angle Candidate Preview
- saved SourceDocument availability

## 4. Family Availability

Each family row reports:

- family name
- candidate count
- whether candidates exist
- persistence state: `saved`, `preview_only`, or `blocked`
- traceability state
- review status
- trust state

SourceDocument, SourceSection, and ContentChunk may reflect saved/read-back boundaries when a saved SourceDocument is available. Downstream families remain preview-only.

## 5. Save Readiness Gate

The gate status is:

- `blocked` when source, section, chunk, duplicate, unsupported, missing trace, or blocked chunk issues prevent safe next-step review
- `needs_review` when candidates exist but warnings, missing saved SourceDocument linkage, untrusted page numbers, or trace review remain
- `ready_for_next_step` only when required roots are linked and no warnings/blockers remain

The gate never enables downstream unit persistence. It is a review and decision signal only.

## 6. Traceability Rules

The summary must clearly show whether:

- SourceSections and ContentChunks are linked to a saved SourceDocument
- downstream candidate families have trace references
- page numbers are trusted

In 4R-15, page numbers are not trusted. The UI must warn that page numbers and citation-ready claims are not trusted in this gate.

## 7. Explicit Non-Goals

4R-15 does not:

- persist KnowledgeUnits, EvidenceUnits, CaseUnits, QuoteUnits, TeachingUnits, or WritingAngles
- add SQLite schema or migrations
- add Rust or Tauri commands
- implement AI/provider behavior
- implement parser expansion
- implement PDF extraction
- implement OCR
- create SourceCards
- infer citation-ready
- infer APA-final
- add Writer/export behavior
- add auto-save
- redesign Source Library
- process dashboard images

## 8. Next Recommended Sprint

Next recommended sprint:

```text
4R-16 Deep Intake Candidate Family Review Gate / Manual Approval Boundary
```

Before persistence expands beyond SourceSection and ContentChunk, ATP should define explicit human review states for the full candidate family.
