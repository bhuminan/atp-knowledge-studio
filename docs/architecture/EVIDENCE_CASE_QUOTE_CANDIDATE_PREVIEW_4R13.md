# Evidence / Case / Quote Candidate Preview 4R-13

## 1. Purpose

Sprint 4R-13 adds preview-only candidate layers for future:

- `EvidenceUnit`
- `CaseUnit`
- `QuoteUnit`

The preview answers:

```text
If ATP later runs Deep Intake, what evidence, case, and quote candidates might be extracted from current ContentChunks?
```

This is a deterministic inspection layer only. It does not create downstream records and does not perform AI extraction.

## 2. Deterministic No-AI Boundary

The mapper is pure TypeScript and no-AI.

It must not:

- summarize creatively
- invent claims, statistics, companies, citations, authors, or cases
- call backend commands
- call parser, PDF extraction, OCR, or AI provider logic
- save EvidenceUnit, CaseUnit, QuoteUnit, KnowledgeUnit, SourceCard, citation, APA, or Writer records

All preview text comes from existing chunk title, preview text, trust state, language profile, and trace labels.

## 3. Input Sources

The preview can use:

- KnowledgeUnit Candidate Preview state
- SourceSection + ContentChunk save candidates
- saved/listed SourceSections
- saved/listed ContentChunks
- chunk title
- chunk preview text
- trace label
- language profile
- trust state
- warnings and blockers

Saved/read-back chunks are preferred when available. Candidate chunks are used only as a preview fallback before manual save.

## 4. Heuristics

Evidence candidates use deterministic cues such as:

- `%`
- `percent`
- `increase`
- `decrease`
- `growth`
- `sample`
- `n=`
- `study`
- `finding`
- `evidence`
- `research`
- `ผลการศึกษา`
- `งานวิจัย`
- `พบว่า`
- `เพิ่มขึ้น`
- `ลดลง`

Case candidates use deterministic cues such as:

- `case`
- `company`
- `brand`
- `example`
- `Starbucks`
- `Apple`
- `Amazon`
- `Toyota`
- `กรณีศึกษา`
- `ตัวอย่าง`
- `บริษัท`
- `แบรนด์`
- `ลูกค้า`

Quote candidates use quotation marks or strong definition cues such as:

- `definition`
- `meaning`
- `คือ`
- `ความหมาย`

These are candidate cues, not verified extraction results.

## 5. Trace And Trust Rules

Every candidate must expose a source trace label.

Missing trace lowers confidence and red-flags the candidate. A red or blocked ContentChunk cannot become a usable EvidenceUnit, CaseUnit, or QuoteUnit candidate.

Trust states remain conservative:

- `green` only when chunk trust is green, trace exists, and no candidate warnings are present
- `orange` when usable but review is needed
- `red` when blocked, missing trace, or chunk trust is red

This does not imply citation-ready, APA-final, Writer-final, or publication-ready status.

## 6. Copyright-Safe Quote Preview

Quote previews must use short exact excerpts only.

The preview should not paraphrase copyrighted source text into a new quote, and it should not display long excerpts. It should remain a short candidate signal for later human review and citation-bound extraction design.

## 7. Explicit Non-Goals

4R-13 does not:

- add EvidenceUnit persistence
- add CaseUnit persistence
- add QuoteUnit persistence
- add KnowledgeUnit persistence
- add SQLite schema or migrations
- add Rust or Tauri commands
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

## 8. Next Recommended Sprint

Next recommended sprint:

```text
4R-14 TeachingUnit / WritingAngle Candidate Preview
```

Before persistence expands, ATP should finish previewing the remaining future Deep Intake unit categories and keep the boundary explicit: preview first, schema later, persistence only after a dedicated review gate.
