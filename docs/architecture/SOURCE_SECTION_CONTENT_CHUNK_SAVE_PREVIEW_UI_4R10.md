# SourceSection + ContentChunk Save Preview UI 4R-10

## 1. Purpose

Sprint 4R-10 exposes a compact Source Library UI boundary for reviewing a SourceSection + ContentChunk candidate package and manually triggering the 4R-9 save command.

This is still not full Deep Intake. The UI only connects reviewed preview data to the existing SourceSection/ContentChunk command boundary.

## 2. UI Boundary

The Source Library preview shows:

- SourceSection + ContentChunk candidate counts.
- SourceDocument id when available.
- Trust summary from the Deep Intake candidate package.
- blockers and warnings from readiness, structure, chunking, and package previews.
- preview-only copy until the user explicitly saves.

The UI states clearly:

```text
This saves SourceSection and ContentChunk records only. It does not create KnowledgeUnits, SourceCards, citations, APA records, or Writer output.
```

## 3. Explicit Save Behavior

The save button is the only path that calls `saveSourceSectionContentChunkCandidates`.

The UI does not:

- save on render
- save when previews change
- save without a SourceDocument id
- save without a user click
- pass `explicitUserApproval` or `reviewerConfirmed` before click

On click, the UI sends:

- deterministic SourceSection candidate ids
- deterministic ContentChunk candidate ids
- `explicitUserApproval: true`
- `reviewerConfirmed: true`
- current preview warnings/blockers serialized into candidate JSON fields

## 4. Disabled States

The save button stays disabled when:

- no SourceDocument id is available
- the Deep Intake candidate package is blocked
- no valid SourceSection candidates exist
- no valid ContentChunk candidates exist
- the candidate is PDF metadata-only without text-backed structure/chunk candidates
- the mapper reports blockers
- a save is already in progress

## 5. Read-Back Verification Display

After save, the UI shows a compact read-back result:

- saved status, including `saved`, `already_exists`, or backend rejection
- read-back verified state
- saved section count
- saved chunk count
- first saved section titles
- first saved chunk trace labels
- audit status and audit limitation when audit events are not written

Raw audit/debug details remain outside this compact panel.

## 6. Non-Goals

4R-10 does not:

- implement parser expansion
- implement PDF extraction
- implement OCR
- wire AI/provider behavior
- create SourceCards
- create KnowledgeUnits
- create EvidenceUnits
- create CaseUnits
- create QuoteUnits
- create TeachingUnits
- create WritingAngles
- create UsageLedger records
- infer citation-ready
- infer APA-final
- add auto-save
- change Writer/export behavior
- redesign Source Library
- change schema or migrations

## 7. Next Recommended Sprint

Next recommended sprint:

```text
4R-11 SourceSection/ContentChunk Review and Promotion Guard
```

Before moving toward KnowledgeUnit candidates, ATP should add a review status surface for saved SourceSections and ContentChunks so weak or risky records can be held back from downstream use.
