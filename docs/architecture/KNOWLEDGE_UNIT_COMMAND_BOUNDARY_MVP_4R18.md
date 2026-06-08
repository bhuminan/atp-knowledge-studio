# KnowledgeUnit Command Boundary MVP 4R-18

## 1. Purpose

Sprint 4R-18 adds the first backend-only command boundary for `KnowledgeUnit` persistence.

4R-17 created the `knowledge_units` and `knowledge_unit_audit_events` tables. 4R-18 makes that schema technically callable and testable through narrow Rust/Tauri commands, without exposing any Source Library UI save flow.

This is still not full Deep Intake automation. It is a conservative persistence boundary for one downstream family only.

## 2. Command Boundary Added

Rust/Tauri commands:

- `save_knowledge_unit`
- `get_knowledge_unit`
- `list_knowledge_units_for_source_document`

TypeScript bridge wrappers:

- `saveKnowledgeUnit`
- `getKnowledgeUnit`
- `listKnowledgeUnitsForSourceDocument`

The bridge is future-ready typing only. No UI calls these methods in 4R-18.

## 3. Save Contract

The save command requires:

- `id`
- `source_document_id`
- existing saved SourceDocument
- non-empty `title`
- non-empty `body`
- non-empty JSON object in `source_trace_json`
- explicit human approval or an approved/verified review state
- supported `trust_status`
- supported `review_status`
- supported `language`
- supported `unit_type`

Optional links:

- `source_section_id`
- `content_chunk_id`
- `candidate_id`

When `source_section_id` or `content_chunk_id` is provided, it must resolve under the same SourceDocument.

The command rejects:

- missing SourceDocument
- missing approval
- missing or empty trace JSON
- red trust state
- unsupported trust/review/language/unit states
- `citationReady=true`
- `apaFinalVerified=true`
- conflicting duplicate rows with the same KnowledgeUnit id

The command allows idempotent repeat submission only when an existing row with the same id matches the submitted critical fields.

## 4. Read/List Contract

`get_knowledge_unit`:

- returns one saved KnowledgeUnit by id
- returns `not_found` when no row exists
- is read-only

`list_knowledge_units_for_source_document`:

- returns KnowledgeUnits for a SourceDocument
- orders by creation time and id
- is read-only

Neither command writes audit events. Read/list calls must not mutate review state or imply Writer readiness.

## 5. Audit And Read-Back Behavior

The save command performs read-back verification after insert.

Audit events:

- `saved`
- `save_read_back_verified`
- `save_read_back_failed`
- `user_rejected`

Audit payloads preserve operational facts only:

- KnowledgeUnit id
- result status
- blockers
- warnings
- saved trust/review state when available
- `citationReady: false`
- `apaFinalVerified: false`
- `aiGenerated: false`
- `writerOutputCreated: false`

Audit payloads must not fabricate source, citation, APA, evidence, or academic truth claims.

If rejection occurs before a valid SourceDocument exists, the command cannot write a `knowledge_unit_audit_events` row because the audit table is SourceDocument-bound. This is a schema boundary limitation to revisit only if package-level non-source audit events become necessary.

## 6. Thai Language Support

The command preserves the `language` field:

- `thai`
- `english`
- `mixed`
- `unknown`

Thai source text, mixed Thai-English terminology, and Thai segmentation warnings should be carried in `body`, `source_trace_json`, and `warnings_json` as provided by future review flows. The command does not translate, normalize Thai academic phrasing, or infer English-only structure.

## 7. Strict Non-Goals

4R-18 does not:

- add Source Library UI
- add save buttons
- auto-save KnowledgeUnits
- add EvidenceUnit persistence
- add CaseUnit persistence
- add QuoteUnit persistence
- add TeachingUnit persistence
- add WritingAngle persistence
- create SourceCards
- infer citation-ready
- infer APA-final
- call AI/provider behavior
- expand parser behavior
- implement PDF extraction
- implement OCR
- add Writer/export behavior
- redesign UI
- process image assets

## 8. Next Recommended Sprint

Next recommended sprint:

```text
4R-19 KnowledgeUnit Save Preview UI / Manual Approval Gate
```

4R-19 should remain conservative. It may expose a disabled/explicit manual save path for reviewed KnowledgeUnit candidates only if the UI can show source trace, approval state, blockers, warnings, audit result, and read-back verification. It must not add EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, or WritingAngle persistence yet.
