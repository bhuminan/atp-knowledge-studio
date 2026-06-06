# KnowledgeUnit Candidate Preview 4R-12

## 1. Purpose

Sprint 4R-12 adds a preview-only KnowledgeUnit Candidate layer from current ContentChunk signals.

The preview answers:

```text
If ATP later runs Deep Intake, what deterministic KnowledgeUnit candidates could be prepared from these ContentChunks?
```

This is not KnowledgeUnit persistence. It is a product and architecture boundary that lets ATP inspect likely future conceptual units before adding KnowledgeUnit schema, migrations, parser expansion, or AI extraction.

## 2. Deterministic No-AI Boundary

The mapper is pure TypeScript and no-AI.

It must not:

- summarize creatively
- invent theory names
- invent authors, citations, cases, claims, or statistics
- call the backend
- call parser, PDF extraction, OCR, or AI provider logic
- save KnowledgeUnit records

Candidate titles and summaries come only from existing chunk title, section title, trace label, and safe truncated preview text.

## 3. Input Sources

The preview can use:

- Deep Intake Run Candidate Bundle state
- SourceSection + ContentChunk save candidates
- saved/listed SourceSections
- saved/listed ContentChunks
- chunk title
- chunk preview text
- trace label
- language profile
- trust state
- blockers and warnings

Saved/listed chunks are preferred when available because they reflect read-back state. Candidate chunks are used as a preview fallback before manual save.

## 4. Unit Type Heuristics

4R-12 uses deterministic keyword heuristics only:

- `definition`, `meaning`, `คือ`, `ความหมาย` -> `definition`
- `framework`, `model`, `โมเดล`, `กรอบแนวคิด` -> `framework`
- `concept`, `แนวคิด` -> `concept`
- any non-empty safe title/text without a stronger signal -> `theme`
- empty or unusable signal -> `unknown`

The mapper deliberately avoids overclaiming. A `theme` candidate is not treated as a verified concept, claim, or citation-ready item.

## 5. Trust And Trace Rules

Every candidate must expose a source trace label.

Missing trace lowers confidence and red-flags the candidate. A red or blocked ContentChunk cannot become a usable KnowledgeUnit candidate.

Trust states remain conservative:

- `green` only when chunk trust is green, trace exists, and no candidate warnings are present
- `orange` when usable but review is needed
- `red` when blocked, missing trace, or chunk trust is red

This does not imply citation-ready, APA-final, Writer-final, or publication-ready status.

## 6. Explicit Non-Goals

4R-12 does not:

- add KnowledgeUnit persistence
- add SQLite schema or migrations
- add Rust or Tauri commands
- add EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, WritingAngle, or UsageLedger tables
- implement parser expansion
- implement PDF extraction
- implement OCR
- wire AI/provider behavior
- create SourceCards
- infer citation-ready
- infer APA-final
- add Writer/export behavior
- add auto-save
- redesign Source Library
- process dashboard images

## 7. Next Recommended Sprint

Next recommended sprint:

```text
4R-13 KnowledgeUnit Candidate Review Gate / Manual Approval Boundary
```

Before KnowledgeUnit schema or persistence is added, ATP should define the human review states and approval boundary for candidate units, including rejection, defer, merge/split intent, and trace-quality review.
