# Deep Intake Schema Risk And Migration Plan 4R-7

## 1. Executive Decision

Sprint 4R-7 implements no schema.

This is a documentation, inspection, and planning checkpoint only. It reviews the current persistence surface, identifies migration risks, and proposes the safest first Deep Intake migration boundary.

The recommended first implementation target remains narrow:

```text
SourceDocument
-> SourceSection
-> ContentChunk
```

The first migration should add only `source_sections` and `content_chunks` as future tables. It should not attempt to persist `KnowledgeUnit`, `EvidenceUnit`, `CaseUnit`, `QuoteUnit`, `TeachingUnit`, `WritingAngle`, `UsageLedger`, or `RepeatReuseLedger` yet.

Reason: ATP's Deep Intake differentiator depends on reliable source decomposition, but the schema must not jump directly from root SourceDocument records to all downstream knowledge objects. `SourceSection` and `ContentChunk` are the safest trace boundary to prove first.

## 2. Current Persistence Map

The current persistence layer already has several production boundaries that future Deep Intake must preserve. New Deep Intake tables must add to these boundaries without changing their current behavior.

### SourceDocument Root And Parsed Extraction Records

- Tables: `source_documents`, `extraction_runs`, `extraction_segments`, `evidence_traces`.
- Migration location: `src-tauri/migrations/001_init_source_document_root.sql`.
- Rust path: `src-tauri/src/vault_db.rs`.
- Commands: `save_source_document_candidate`, `list_saved_source_documents`, `read_saved_source_document`, `read_saved_source_document_root`.
- Tauri registration: `src-tauri/src/lib.rs`.
- TypeScript bridge: `src/lib/persistence/LocalVaultDatabase.ts`.
- Read-back/audit behavior: parsed-DOCX SourceDocument save writes root document, extraction run, segments, and evidence traces, then supports list/read detail. Evidence trace fields preserve `page_number_trusted` and chunk references.
- Must not break: root SourceDocument identity, parser status, citation readiness, review status, local path policy, DOCX page-number distrust, extraction segment read-back, and trace linkage.

### Intake-Only SourceDocument Save And Audit

- Tables: `source_documents`, `intake_source_document_audit_events`.
- Migration location: `src-tauri/migrations/001_init_source_document_root.sql`, `src-tauri/migrations/013_add_intake_source_document_audit_events.sql`.
- Rust path: `src-tauri/src/vault_db.rs`.
- Commands: `save_intake_source_document_candidates`, `list_intake_source_document_audit_events`.
- TypeScript bridge: `src/lib/persistence/LocalVaultDatabase.ts`.
- Read-back/audit behavior: intake candidates are server-side validated, blocked candidates are rejected, saved SourceDocuments are read back, and audit events record success, rejection, already-exists, or failed read-back.
- Must not break: explicit approval, duplicate guard, idempotency by candidate/source document identity, no SourceCard creation, no parser/classifier/AI/provider side effects, and audit trace integrity.

### Batch Intake Queue And Metadata Review Queue

- Tables: `batch_research_intake_jobs`, `external_metadata_match_results`, `suggested_metadata_corrections`, `metadata_correction_audit_events`.
- Migration locations: `src-tauri/migrations/008_add_batch_research_intake_jobs.sql`, `009_add_suggested_metadata_corrections.sql`, `010_add_metadata_correction_audit_events.sql`, `011_expand_metadata_correction_audit_preflight_events.sql`, `012_add_metadata_correction_structured_apply_events.sql`.
- Rust path: `src-tauri/src/vault_db.rs`.
- Commands include `create_batch_research_intake_jobs`, `list_batch_research_intake_jobs`, `create_mock_external_metadata_review_queue_for_intake_jobs`, `create_crossref_fixture_metadata_review_queue_for_intake_jobs`, `list_suggested_metadata_corrections`, `update_suggested_metadata_correction_review_state`, `create_metadata_correction_audit_event`, `list_metadata_correction_audit_events`, `run_metadata_correction_apply_dry_run`, and structured metadata apply.
- TypeScript bridge: `src/lib/persistence/LocalVaultDatabase.ts`.
- Read-back/audit behavior: metadata correction and apply flows preserve review decisions, audit events, dry-run status, and structured apply read-back checks.
- Must not break: metadata review remains human-gated; metadata correction approval does not automatically overwrite SourceCard citation text; external provider fixture paths remain separated from runtime Deep Intake.

### SourceCard And Structured Bibliographic Metadata

- Tables: `source_cards`, `source_card_bibliographic_metadata`, `source_card_apa_reference_reviews`.
- Migration locations: `src-tauri/migrations/002_add_source_cards.sql`, `006_add_source_card_bibliographic_metadata.sql`, `007_add_source_card_apa_reference_reviews.sql`.
- Rust path: `src-tauri/src/vault_db.rs`.
- Commands include `save_source_card_candidate`, `list_saved_source_cards`, `read_saved_source_card`, `update_source_card_metadata`, `upsert_source_card_bibliographic_metadata`, `get_source_card_bibliographic_metadata`, `save_source_card_apa_reference_review`, and `get_source_card_apa_reference_review`.
- TypeScript bridge: `src/lib/persistence/LocalVaultDatabase.ts`.
- Read-back/audit behavior: SourceCards link to SourceDocuments and structured metadata links to SourceCards. APA reference review is stored separately from SourceDocument intake.
- Must not break: SourceCard creation remains a separate gate from SourceDocument intake and future Deep Intake; structured bibliographic metadata does not mean APA-final; SourceCard citation text must not be silently overwritten by section/chunk work.

### SourceCard Metadata Review Records

- Tables: `sourcecard_metadata_reviews`, `sourcecard_metadata_review_audit_events`.
- Migration location: `src-tauri/migrations/014_add_sourcecard_metadata_reviews.sql`.
- Rust path: `src-tauri/src/vault_db.rs`.
- Commands: `save_sourcecard_metadata_review`, `get_sourcecard_metadata_review`, `list_sourcecard_metadata_reviews_for_source_document`, `list_sourcecard_metadata_review_audit_events`.
- TypeScript bridge: `src/lib/persistence/LocalVaultDatabase.ts`.
- Read-back/audit behavior: review-only records require safety flags, write audit events, verify read-back status, and explicitly keep `apa_final_verified` false.
- Must not break: metadata review does not create SourceCards, KnowledgeCards, DraftArtifacts, citation-ready status, or APA-final status.

### MarketingTags And KnowledgeCards

- Tables: `marketing_tags`, `source_card_tags`, `knowledge_cards`, `knowledge_card_traces`, `knowledge_card_tags`.
- Migration locations: `src-tauri/migrations/003_add_marketing_tags.sql`, `004_add_knowledge_cards.sql`.
- Rust path: `src-tauri/src/vault_db.rs`.
- Commands include `save_marketing_tags_for_source_card`, `list_saved_marketing_tags`, `list_saved_tags_for_source_card`, `save_knowledge_cards_for_source_card`, `list_saved_knowledge_cards`, `list_saved_knowledge_cards_for_source_card`, and `read_saved_knowledge_card`.
- TypeScript bridge: `src/lib/persistence/LocalVaultDatabase.ts`.
- Read-back/audit behavior: KnowledgeCards are linked to SourceCards, not directly to future SourceSections. Existing trace records use chunk references and page trust flags.
- Must not break: existing KnowledgeCards are MVP/persistence records, not the new production `KnowledgeUnit` schema. Future Deep Intake must not retrofit them silently into KnowledgeUnits.

### DraftArtifacts

- Tables: `draft_artifacts`, `draft_sections`, `draft_artifact_knowledge_cards`.
- Migration location: `src-tauri/migrations/005_add_draft_artifacts.sql`.
- Rust path: `src-tauri/src/vault_db.rs`.
- Commands: `save_draft_artifact_candidate`, `list_saved_draft_artifacts`, `list_saved_draft_artifacts_for_source_card`, `read_saved_draft_artifact`.
- TypeScript bridge: `src/lib/persistence/LocalVaultDatabase.ts`.
- Read-back/audit behavior: mock-only DraftArtifacts link to existing SourceCards and KnowledgeCards.
- Must not break: DraftArtifacts remain mock-only/not-final. Future Deep Intake must not imply Writer-final output, export readiness, citation-ready status, or APA-final status.

## 3. Migration Risk Inventory

### Parent SourceDocument Linkage

Every future `source_sections` and `content_chunks` row must link to a real `source_documents.id`. The future save command must reject candidates when the parent SourceDocument does not exist. This prevents orphan sections and chunks from becoming untraceable source material.

### Cascade And Delete Behavior

The existing schema uses `ON DELETE CASCADE` from SourceDocument to extraction records and SourceCards, and from SourceCard to KnowledgeCards/DraftArtifacts. Future section/chunk tables need an explicit decision: cascade with SourceDocument deletion is consistent, but can remove hundreds or thousands of rows. The command layer should still treat deletion as a future separate risk, not a side effect of 4R-8.

### Orphan Rows

`content_chunks` must require both `source_document_id` and `source_section_id`. If a section save fails, chunks for that section must not remain. If a chunk read-back fails, the entire future save should roll back.

### Duplicate Sections And Chunks

Deep Intake can be rerun. Repeated runs must not create duplicate chapter headings or duplicate chunks for the same source. The MVP needs stable candidate IDs or deterministic keys before persistence.

### Large Document Record Volume

A textbook may produce 200-1,000+ records before KnowledgeUnits exist. The MVP should assume high row volume, not one record per file. Query paths must be indexed and paginated from the start.

### Transaction Atomicity

Sections and chunks should be saved in one transaction where possible. Partial saves are especially dangerous because they create false confidence for downstream previews.

### Read-Back Verification

The current intake save pattern reads back critical fields after write. SourceSection/ContentChunk save should copy that pattern. Counts, parent ids, candidate ids, order fields, trust states, and critical text hashes should be verified.

### Audit Event Volume

Writing one audit event per chunk could be noisy for textbooks. The MVP should prefer one package-level audit event plus summary counts and mismatch details, with per-record details stored only when needed for failure diagnosis.

### Future KnowledgeUnit Linkage

`KnowledgeUnit`, `EvidenceUnit`, `CaseUnit`, `QuoteUnit`, `TeachingUnit`, and `WritingAngle` will need stable links to chunks. If chunk IDs or trace labels are unstable, downstream unit records will be fragile.

### Page Number Trust

PDF page numbers may become available after real extraction. DOCX page numbers remain untrusted unless a reliable pagination engine is introduced. The schema should store page numbers with an explicit trust flag rather than treating page number as always valid.

### DOCX Untrusted Pagination

DOCX preview text is paragraph-oriented, not page-layout oriented. Chunk references such as `docx:pN` or paragraph/character offsets are safer than fabricated page references.

### Thai And Mixed-Language Segmentation

Thai headings, mixed Thai-English terms, and Thai academic prose require language profile fields and segmentation quality states. The schema must not assume English whitespace, English chapter labels, or English-only heading patterns.

### Schema Overfitting To Preview Mappers

4R-2 through 4R-5 preview mappers are useful planning tools, but table design must not overfit to their current output shapes. Persist stable concepts such as trust state, language profile, trace, order, text hash, warning snapshots, and extraction metadata; keep UI-specific summary copy out of the schema.

### Migration Rollback Limitations

SQLite migrations are easier to add than to safely undo after user data exists. The first migration should be additive and non-destructive. Avoid changing existing tables unless a separate risk review proves the need.

### Performance With 200-1,000+ Records Per Source

List views and read APIs must not load every chunk for every source by default. Index by source id and order fields, support page-sized reads, and avoid huge JSON blobs for normal browse paths.

### Avoiding Premature KnowledgeUnit Schema

Persisting unit records too early would freeze unresolved choices around claim strength, case sensitivity, quote exactness, Thai adaptation, evidence relationships, and repeat/reuse tracking. The MVP should prove sections and chunks first.

## 4. Recommended First Schema Boundary

4R-8 should design an additive migration for future `source_sections` and `content_chunks` only. This document intentionally does not write final migration SQL.

### Future `source_sections` Field Design

Identity:

- `id`
- `created_from_candidate_id`
- `extraction_run_id` or `extraction_package_id`
- `schema_version`

SourceDocument linkage:

- `source_document_id`
- foreign key to `source_documents(id)`

Section order:

- `section_order`
- `sort_order`
- `heading_number`

Parent section linkage:

- `parent_source_section_id`
- nullable self-reference for chapter/heading/subheading structures

Title:

- `title`
- `normalized_title`
- optional `reviewed_title`

Heading level:

- `heading_level`
- `section_type`
- `detected_heading_pattern`

Language profile:

- `language_profile`
- `source_language`
- `mixed_language_warning`
- `thai_segmentation_quality`

Source trace:

- `trace_label`
- `source_location_type`
- `page_start`
- `page_end`
- `page_numbers_trusted`
- `paragraph_start`
- `paragraph_end`
- `character_start`
- `character_end`

Extraction metadata:

- `detected_by`
- `parser_name`
- `parser_version`
- `structure_confidence`
- `warnings_json`
- `blockers_json`

Trust/review state:

- `trust_state`
- `review_status`
- `reviewer_note`
- `human_review_required`

Audit/read-back fields:

- `read_back_status`
- `saved_from_command`
- `audit_event_ids_json`

Timestamps:

- `created_at`
- `updated_at`

### Future `content_chunks` Field Design

Identity:

- `id`
- `created_from_candidate_id`
- `extraction_run_id` or `extraction_package_id`
- `schema_version`

SourceDocument linkage:

- `source_document_id`
- foreign key to `source_documents(id)`

SourceSection linkage:

- `source_section_id`
- foreign key to `source_sections(id)`

Chunk order:

- `chunk_order`
- `sort_order`
- `section_chunk_order`

Chunk type:

- `chunk_type`
- examples: `section`, `paragraph_group`, `paragraph`, `metadata_only_stub`

Preview/content text:

- `content_text`
- `content_preview`
- `content_hash`
- `text_length`
- `token_estimate`

Language profile:

- `language_profile`
- `source_language`
- `mixed_language_warning`
- `thai_segmentation_quality`

Character offsets:

- `character_start`
- `character_end`
- `paragraph_start`
- `paragraph_end`

Trace label:

- `trace_label`
- `source_location_type`
- `page_number`
- `page_number_trusted`
- `docx_chunk_ref`

Extraction metadata:

- `detected_by`
- `chunking_mode`
- `chunking_confidence`
- `parser_name`
- `parser_version`
- `warnings_json`
- `blockers_json`

Trust/review state:

- `trust_state`
- `review_status`
- `human_review_required`
- `reviewer_note`

Readiness score inputs:

- `readiness_score`
- `extraction_readiness`
- `structure_confidence`
- `duplicate_risk`
- `writer_readiness`

Timestamps:

- `created_at`
- `updated_at`

## 5. Constraints For The First Migration

The first SourceSection/ContentChunk migration should obey these constraints:

- No `KnowledgeUnit`, `EvidenceUnit`, `CaseUnit`, `QuoteUnit`, `TeachingUnit`, `WritingAngle`, `UsageLedger`, or `RepeatReuseLedger` tables.
- No SourceCard creation.
- No citation-ready inference.
- No APA-final inference.
- No AI/provider calls.
- No PDF extraction or OCR.
- Support DOCX preview text first.
- Allow PDF metadata-only candidates to remain blocked or limited.
- Preserve read-back verification.
- Preserve audit events.
- Preserve idempotency and rerun safety.
- Avoid destructive changes to existing tables.
- Avoid parser or dependency expansion in the migration sprint.
- Avoid huge UI lists or all-chunk reads by default.

## 6. Transaction, Read-Back, And Audit Plan

A future save command should be shaped as an explicit package save, not an automatic parser side effect.

Recommended flow:

1. Validate that the parent SourceDocument exists.
2. Validate package source, candidate ids, safety flags, and no-AI/no-SourceCard boundaries.
3. Validate all SourceSection candidates before writing any row.
4. Validate all ContentChunk candidates before writing any row.
5. Start one transaction.
6. Insert or idempotently upsert sections.
7. Insert or idempotently upsert chunks.
8. Read back created or matched records.
9. Verify expected section count, chunk count, parent ids, order fields, trust states, trace labels, content hashes, and read-back status.
10. Write package-level audit event with counts, blockers, warnings, saved ids, and mismatch details.
11. Commit only if read-back verification succeeds.
12. Roll back and reject if counts or critical fields mismatch.

The command result should return:

- package status
- saved section count
- saved chunk count
- already-existing count
- rejected count
- read-back status
- audit event ids
- warnings
- blockers
- saved section summaries
- saved chunk summaries

## 7. Idempotency And Duplicate Strategy

Deep Intake reruns need stable identity. The MVP should choose deterministic record IDs generated from stable source/candidate fields rather than random IDs.

Candidate key options:

- `source_document_id + section_order + normalized_title`
- `source_document_id + chunk_order + source_section_id`
- `source_document_id + trace_label`
- `extraction_run_id + candidate_id`

Recommended MVP:

- Section id: deterministic hash or slug from `source_document_id + extraction_package_id + section_order + normalized_title`.
- Chunk id: deterministic hash or slug from `source_document_id + source_section_id + chunk_order + content_hash`.
- Candidate id: keep the preview-generated candidate id and store it in `created_from_candidate_id`.
- Duplicate check: reject conflicting rows when the same deterministic id points to different critical fields.
- Rerun behavior: return `already_exists` only when the existing row matches the same candidate identity and critical fields.

This preserves the current distinction between idempotency and true duplicate detection. It does not implement near-duplicate text detection.

## 8. Trust-State Plan

Future `SourceSection` and `ContentChunk` rows should use green/orange/red trust states:

- Red: blocked, unsupported, duplicate-blocked, orphaned, no usable trace, failed read-back, or unsafe for automation.
- Orange: usable as preview or limited input, but human review is required.
- Green: trusted enough for provisional downstream candidate generation with audit and reversibility.

Rules:

- Green section/chunk state does not mean citation-ready.
- Green section/chunk state does not mean APA-final.
- Green section/chunk state does not mean Writer-final.
- A green SourceDocument does not automatically make every section or chunk green.
- Weak trace, Thai segmentation uncertainty, DOCX pagination ambiguity, extraction warnings, or duplicate risk should keep records orange or red.
- UI indicators, when added later, should reuse the existing Win95 trust-dot visual language and should not redesign the UI.

## 9. Thai-First Migration Considerations

Thai support must be represented from the first Deep Intake persistence layer.

SourceSection and ContentChunk field design should support:

- Thai headings such as `บทที่`.
- Mixed Thai-English headings and terms.
- Unicode-safe storage.
- Thai academic prose.
- Thai plain-language prose.
- Thai teaching examples.
- Language profile snapshots.
- Thai segmentation quality.
- Mixed-language warnings.
- Later English-to-Thai translation/adaptation status.

The MVP does not need a perfect Thai parser, but it must avoid schema choices that make Thai a later bolt-on. Store language profile and segmentation quality as first-class extraction metadata from the start.

## 10. Performance And Query Plan

Deep Intake should assume long-source volume:

- A textbook can create hundreds or thousands of sections/chunks before unit extraction.
- Index `source_sections.source_document_id`.
- Index `source_sections.source_document_id + section_order`.
- Index `content_chunks.source_document_id`.
- Index `content_chunks.source_section_id`.
- Index `content_chunks.source_document_id + chunk_order`.
- Consider indexing `created_from_candidate_id` for idempotency and audit diagnosis.
- List APIs should paginate.
- Detail APIs should fetch one source, section, or chunk scope at a time.
- UI should not render every chunk in a large source by default.
- Content text size should have a clear policy before migration.
- Future FTS/search can be considered after the basic save/read/list boundary is stable; do not add FTS in the first migration.

## 11. Proposed Implementation Sequence

Recommended next steps:

1. 4R-8 SourceSection + ContentChunk Migration MVP.
2. 4R-9 Save/Read/List SourceSection + ContentChunk Commands.
3. 4R-10 SourceSection/ContentChunk Save Preview UI.
4. 4R-11 Deep Intake Run Candidate Bundle / no-AI MVP.
5. 4R-12 KnowledgeUnit Candidate Preview from ContentChunks.
6. 4R-13 KnowledgeUnit/EvidenceUnit/CaseUnit Schema Risk Review.
7. 4R-14 UsageLedger / RepeatReuseLedger Design for Book Projects.

The immediate next implementation sprint should be 4R-8, but only after this 4R-7 plan is reviewed and accepted.

## 12. Explicit Non-Goals

4R-7 does not:

- Add migrations.
- Add tables.
- Change SQLite schema.
- Change Rust backend behavior.
- Change TypeScript runtime behavior.
- Change UI.
- Change routing.
- Change tests.
- Add dependencies.
- Add parser behavior.
- Add PDF extraction.
- Add OCR.
- Add AI/provider wiring.
- Create SourceCards.
- Create SourceSections.
- Create ContentChunks.
- Create KnowledgeUnits.
- Create EvidenceUnits.
- Create CaseUnits.
- Create QuoteUnits.
- Create TeachingUnits.
- Create WritingAngles.
- Create UsageLedger or RepeatReuseLedger rows.
- Infer citation-ready status.
- Infer APA-final status.
- Generate Writer output.
- Process images.

## 13. Recommended Decision For 4R-8

If 4R-7 is accepted, 4R-8 should create an additive migration for `source_sections` and `content_chunks` only.

The migration should be small, indexed, and reversible by forward-only migration discipline. It should preserve all existing SourceDocument, SourceCard, metadata review, KnowledgeCard, DraftArtifact, audit, and intake behavior.

The first save command should remain conservative: DOCX preview text can create section/chunk candidates when reviewed, PDF metadata-only should remain limited or blocked, and no downstream SourceCard or KnowledgeUnit records should be created.
