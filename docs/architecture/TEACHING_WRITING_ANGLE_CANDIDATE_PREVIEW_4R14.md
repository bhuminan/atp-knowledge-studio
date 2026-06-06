# Teaching / Writing Angle Candidate Preview 4R-14

## 1. Purpose

Sprint 4R-14 adds preview-only candidate layers for future:

- `TeachingUnit`
- `WritingAngle`

The preview answers:

```text
If ATP later runs Deep Intake, what teaching-use and writing-angle candidates might be prepared from current ContentChunks?
```

This completes the first no-AI Deep Intake candidate family after KnowledgeUnit, EvidenceUnit, CaseUnit, and QuoteUnit previews. It remains an inspection layer only.

## 2. Deterministic No-AI Boundary

The mapper is pure TypeScript and no-AI.

It must not:

- generate creative teaching activities
- invent discussion questions
- invent managerial implications
- invent research gaps
- call backend commands
- call parser, PDF extraction, OCR, or AI provider logic
- save TeachingUnit, WritingAngle, KnowledgeUnit, EvidenceUnit, CaseUnit, QuoteUnit, SourceCard, citation, APA, or Writer records

All preview text comes from existing chunk title, preview text, trace labels, trust state, language profile, and existing preview candidate signals.

## 3. Input Sources

The preview can use:

- KnowledgeUnit Candidate Preview state
- Evidence / Case / Quote Candidate Preview state
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

Teaching candidates use deterministic cues such as:

- `example`
- `teaching`
- `classroom`
- `discussion`
- `activity`
- `explain`
- `lecture`
- `students`
- `ตัวอย่าง`
- `อธิบาย`
- `ห้องเรียน`
- `อภิปราย`
- `กิจกรรม`
- `นักศึกษา`
- `การสอน`

Case candidates from 4R-13 may support a teaching candidate, but the preview must still use only existing chunk text. It must not invent a lesson plan or discussion question.

Writing angle candidates use deterministic cues such as:

- `implication`
- `managerial`
- `strategy`
- `trend`
- `challenge`
- `opportunity`
- `gap`
- `future`
- `chapter`
- `article`
- `นัยยะ`
- `ผู้จัดการ`
- `กลยุทธ์`
- `แนวโน้ม`
- `ความท้าทาย`
- `โอกาส`
- `ช่องว่าง`
- `อนาคต`
- `บทความ`
- `บทที่`

Evidence and case candidates from 4R-13 may support writing-angle candidates, but they must not become invented implications, claims, or research gaps.

## 5. Trace And Trust Rules

Every candidate must expose a source trace label.

Missing trace lowers confidence and red-flags the candidate. A red or blocked ContentChunk cannot become a usable TeachingUnit or WritingAngle candidate.

Trust states remain conservative:

- `green` only when chunk trust is green, trace exists, and no candidate warnings are present
- `orange` when usable but review is needed
- `red` when blocked, missing trace, or chunk trust is red

This does not imply citation-ready, APA-final, Writer-final, or publication-ready status.

## 6. Teaching And Writing Limitations

Teaching notes and writing angles are preview cues only.

They should be safe truncated excerpts from existing chunk text. They are not lesson plans, classroom activities, writing outlines, managerial implications, research gaps, or finished Writer output.

Future AI or Writer behavior must pass through a separate review and trace boundary before these candidates can be used in generated outputs.

## 7. Explicit Non-Goals

4R-14 does not:

- add TeachingUnit persistence
- add WritingAngle persistence
- add EvidenceUnit, CaseUnit, or QuoteUnit persistence
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
4R-15 Deep Intake Candidate Family Review Gate
```

Before adding persistence for any future unit family, ATP should add a manual review gate for the full candidate family: KnowledgeUnit, EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, and WritingAngle.
