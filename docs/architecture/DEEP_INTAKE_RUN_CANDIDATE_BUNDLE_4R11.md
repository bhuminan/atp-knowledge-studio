# Deep Intake Run Candidate Bundle 4R-11

## 1. Purpose

Sprint 4R-11 creates a deterministic no-AI Deep Intake Run Candidate Bundle.

The bundle answers what ATP would prepare for a future Deep Intake run from the current source preview state before any AI, KnowledgeUnit generation, parser expansion, or downstream persistence happens.

This is a planning and validation boundary, not full Deep Intake.

## 2. Inputs

The bundle composes existing 4R preview layers:

- Intake Readiness Preview
- Document Structure Preview
- Chunking Strategy Preview
- Deep Intake Candidate Package Preview
- SourceSection + ContentChunk Save Candidate mapping
- saved SourceDocument availability

The mapper is pure TypeScript. It does not call the backend, network, parser, AI provider, or filesystem.

## 3. Status And Risk Rules

The bundle is `blocked` when the source is blocked, duplicate, unsupported, unreadable, empty, or otherwise unsafe.

The bundle is `needs_review` when no saved SourceDocument id is available, when a PDF is metadata-only, or when structure/chunking remains too weak for a safe SourceSection/ContentChunk save plan.

The bundle can be `ready` only when a saved SourceDocument exists and the current previews provide valid text-backed SourceSection and ContentChunk candidates.

The only runnable mode in 4R-11 is:

```text
save_sections_chunks_only
```

Even in that mode, explicit user approval is still required before using the 4R-9 save command.

## 4. Future Unit Boundary

The bundle may show future planned unit categories:

- KnowledgeUnit
- EvidenceUnit
- CaseUnit
- QuoteUnit
- TeachingUnit
- WritingAngle

These are future-plan indicators only. `persistenceAllowedNow` is always `false` in 4R-11.

No future unit rows are created by this mapper or UI.

## 5. Explicit Non-Goals

4R-11 does not:

- implement KnowledgeUnit persistence
- implement EvidenceUnit persistence
- implement CaseUnit persistence
- implement QuoteUnit persistence
- implement TeachingUnit persistence
- implement WritingAngle persistence
- implement UsageLedger
- implement parser expansion
- implement PDF extraction
- implement OCR
- wire AI/provider behavior
- create SourceCards
- infer citation-ready
- infer APA-final
- add auto-save
- change Writer/export behavior
- change schema or migrations
- redesign Source Library

## 6. Next Recommended Sprint

Next recommended sprint:

```text
4R-12 Deep Intake Run Review Gate / Manual Run Approval
```

Before any automation expands beyond SourceSection and ContentChunk records, ATP should add a manual review gate that can approve, defer, or reject a run bundle and persist a narrow audit trail for that decision.
