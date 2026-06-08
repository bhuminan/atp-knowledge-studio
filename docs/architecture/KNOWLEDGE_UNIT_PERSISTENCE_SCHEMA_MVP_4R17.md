# KnowledgeUnit Persistence Schema MVP 4R-17

## 1. Purpose

Sprint 4R-17 adds the first narrow downstream Deep Intake persistence schema slice: `KnowledgeUnit` only.

This sprint creates database foundations for future KnowledgeUnit persistence. It does not add runtime save/read/list commands, TypeScript bridge methods, UI behavior, parser expansion, AI/provider behavior, or actual KnowledgeUnit persistence from the Source Library.

The goal is to make the future persistence boundary explicit without letting preview candidates become trusted knowledge records too early.

## 2. Why KnowledgeUnit First

4R-12 introduced deterministic no-AI KnowledgeUnit candidate previews from ContentChunks. 4R-15 added the Deep Intake Candidate Family Summary / Save Readiness Gate. 4R-16 defined the persistence boundary for all future candidate families:

- `KnowledgeUnit`
- `EvidenceUnit`
- `CaseUnit`
- `QuoteUnit`
- `TeachingUnit`
- `WritingAngle`

The safest first schema slice is KnowledgeUnit because it is the parent conceptual layer for later evidence, case, quote, teaching, and writing-angle relationships. ATP should prove trace, trust, review, and audit rules for one downstream family before adding the rest.

4R-17 intentionally does not add EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, or WritingAngle tables.

## 3. Schema Added

Migration:

```text
src-tauri/migrations/016_add_knowledge_units.sql
```

Schema version:

```text
16
```

Tables:

- `knowledge_units`
- `knowledge_unit_audit_events`

## 4. knowledge_units Table

The table is conservative and trace-first.

Fields:

- `id`
- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `candidate_id`
- `title`
- `body`
- `unit_type`
- `source_trace_json`
- `trust_status`
- `review_status`
- `language`
- `warnings_json`
- `created_at`
- `updated_at`
- `superseded_by_id`

Trace rationale:

- `source_document_id` is required so every KnowledgeUnit remains rooted in a saved SourceDocument.
- `source_section_id` is nullable because future migration/backfill cases may temporarily preserve a SourceDocument-rooted unit before section repair.
- `content_chunk_id` is nullable for the same conservative future-proofing reason, but real save commands should strongly prefer chunk-linked records.
- `source_trace_json` stores trace labels, source spans, page trust flags, chunk references, and related preview provenance.
- `candidate_id` preserves linkage back to deterministic no-AI preview candidates where available.

Trust and review fields are stored directly so future commands can reject unsafe records without depending on UI copy.

## 5. knowledge_unit_audit_events Table

The audit table supports future reversibility and review trace.

Fields:

- `id`
- `knowledge_unit_id`
- `source_document_id`
- `event_type`
- `event_payload_json`
- `created_at`

Supported event types:

- `candidate_generated`
- `user_approved`
- `user_edited`
- `user_rejected`
- `saved`
- `save_read_back_verified`
- `save_read_back_failed`
- `superseded`
- `archived`
- `regenerated_from_source`

`knowledge_unit_id` is nullable so package-level or failed-save events can still be tied to the SourceDocument even before a KnowledgeUnit row exists.

## 6. Trust And Review Boundaries

Allowed trust states:

- `green`
- `orange`
- `red`

Allowed review states:

- `preview_only`
- `needs_review`
- `approved`
- `rejected`
- `saved_unverified`
- `saved_verified`
- `blocked`
- `superseded`

These states do not imply:

- citation-ready
- APA-final
- Writer-final
- export-ready
- publication-ready
- academic truth verification
- external fact verification

Future save commands must still require explicit user approval and read-back verification before a KnowledgeUnit can move beyond preview or unverified states.

## 7. Audit And Reversibility Model

4R-17 adds the table foundation only. Future commands should use it to record:

- candidate generation
- user approval
- user edits
- user rejection
- save attempt
- read-back verification
- read-back failure
- supersession
- archive/delete intent
- regeneration from source

Saved KnowledgeUnits should remain reversible:

- normal workflows should archive or supersede rather than hard-delete
- `superseded_by_id` preserves replacement lineage
- audit events preserve user decisions and package provenance
- regenerated candidates should not silently overwrite reviewed records

## 8. Thai Language Support

`language` supports:

- `thai`
- `english`
- `mixed`
- `unknown`

Future save commands should preserve Thai source text, mixed Thai-English terminology, original text, and any translation/adaptation review state in trace or payload fields. Thai segmentation warnings should remain visible through `warnings_json` until a dedicated review flow resolves them.

This schema does not assume English-only headings, whitespace, citation behavior, or writing style.

## 9. Explicit Non-Goals

4R-17 does not:

- add Rust/Tauri save/read/list commands
- add TypeScript bridge methods
- add UI
- modify Source Library behavior
- persist actual KnowledgeUnits from UI
- add EvidenceUnit schema
- add CaseUnit schema
- add QuoteUnit schema
- add TeachingUnit schema
- add WritingAngle schema
- add SourceCard creation
- infer citation-ready
- infer APA-final
- implement AI/provider behavior
- implement parser expansion
- implement PDF extraction
- implement OCR
- add Writer/export behavior
- add auto-save
- redesign UI
- process image assets

## 10. Next Recommended Sprint

Next recommended sprint:

```text
4R-18 KnowledgeUnit Save/Read/List Command Boundary
```

4R-18 should remain narrow. It should add command-level validation and read-back verification for KnowledgeUnit persistence only, with explicit approval flags, source trace validation, parent SourceDocument checks, optional SourceSection/ContentChunk checks, audit event writing, and no UI auto-save. EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, and WritingAngle persistence should remain deferred.
