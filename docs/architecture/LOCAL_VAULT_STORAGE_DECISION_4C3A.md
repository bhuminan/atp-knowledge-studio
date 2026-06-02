# Sprint 4C-3A Local Vault Storage Decision

## Scope

Sprint 4C-3A decides the local Knowledge Vault storage strategy before any real persistence is implemented.

This sprint does not add SQLite, database writes, file writes, save commands, Obsidian integration, AI/API calls, PDF parsing, DOCX export, or UI behavior changes.

## Decision Summary

ATP Knowledge Studio should use SQLite as the primary local Knowledge Vault storage for structured academic production records.

Obsidian and Markdown should be treated as secondary export or sync targets, not as the primary source of truth.

The first durable persistence implementation should remain human-triggered and review-gated. Save boundaries should begin with SourceDocument persistence only, then expand to SourceCard, marketing tags, Knowledge Cards, draft artifacts, and pipeline snapshots in later steps.

## Why SQLite Is Recommended

SQLite is the safest primary storage direction for ATP because the product is a desktop academic production system with structured, trace-heavy, review-gated records.

SQLite supports:

- durable local-first storage without requiring a hosted backend
- relational links between source documents, source cards, tags, knowledge cards, traces, drafts, reviews, and pipeline runs
- queryable review status, citation readiness, trace readiness, and workflow state
- migration/versioning discipline for long-running academic projects
- atomic transactions for multi-record save operations
- compact backups and exports
- future sync/export workflows without making Markdown files the internal database

This matches ATP's core workflow:

PDF/DOCX intake -> extraction -> SourceDocument -> SourceCard -> Knowledge Cards -> Draft Input Package -> draft plan -> review/export.

## Why JSON-Only Is Insufficient Long-Term

JSON may be acceptable for a narrow first persistence spike, but it is not sufficient as ATP's long-term Knowledge Vault.

JSON-only storage creates risks:

- difficult querying across tags, sources, traces, review states, and draft artifacts
- higher risk of accidental schema drift
- harder duplicate detection for sources and tags
- weaker transaction safety for multi-record saves
- cumbersome migrations as candidate objects become saved records
- poor fit for evidence trace joins and citation-readiness audits
- higher risk that preview/mock objects get saved without normalized boundaries

If JSON is used at all, it should be limited to fixtures, export snapshots, debug backups, or a very small persistence spike before SQLite.

## Why Obsidian/Markdown Is Not Primary Storage

Obsidian and Markdown remain valuable ATP outputs, but they should not be the primary vault database.

Markdown is excellent for:

- human-readable knowledge notes
- Obsidian graph integration
- teaching notes and article/chapter brief exports
- selected SourceCard or KnowledgeCard exports
- backups and interoperability

Markdown is weak as ATP's primary internal database because:

- relationships are string/link based instead of strongly structured
- review state and trace state are harder to query reliably
- schema migrations are fragile
- duplicate tag/source/card detection becomes harder
- citation metadata readiness can drift from note text
- trace references and parser provenance need stricter structure than prose files provide

Recommended direction: SQLite is the internal source of truth; Markdown/Obsidian export is an explicit later sync/output workflow.

## Required Saved Entities

The first local Knowledge Vault schema should prepare these entities.

### source_documents

Stores the reviewed document-level record created from intake and extraction.

Recommended fields:

- id
- original_file_name
- source_type
- mime_type
- file_size
- local_path_reference
- local_path_policy
- extraction_status
- parser_name
- parser_version
- extraction_id
- cleaned_text_hash
- text_length
- metadata_status
- citation_metadata_required
- review_status
- created_at
- updated_at

### source_cards

Stores canonical source metadata used for citation and academic review.

Recommended fields:

- id
- source_document_id
- title
- authors_json
- year
- source_type
- publication_venue
- publisher
- doi
- url
- citation_text
- metadata_status
- citation_readiness
- review_status
- created_at
- updated_at

### marketing_tags

Stores controlled taxonomy terms and approved local additions.

Recommended fields:

- id
- canonical_label
- category
- tier
- aliases_json
- related_terms_json
- description
- review_status
- use_as_default_tag
- created_at
- updated_at

### source_card_tags

Links SourceCards to reviewed marketing tags.

Recommended fields:

- id
- source_card_id
- marketing_tag_id
- review_status
- source
- created_at

### knowledge_cards

Stores reviewed knowledge units derived from source evidence.

Recommended fields:

- id
- source_card_id
- card_type
- title
- body
- summary
- citation_readiness
- trace_readiness
- review_status
- created_at
- updated_at

Supported card types should include:

- concept
- evidence
- quote
- case
- writing_angle

### knowledge_card_tags

Links KnowledgeCards to reviewed tags.

Recommended fields:

- id
- knowledge_card_id
- marketing_tag_id
- review_status
- source
- created_at

### evidence_traces

Stores provenance for source, evidence, quote, case, and draft usage.

Recommended fields:

- id
- source_document_id
- source_card_id
- knowledge_card_id
- draft_artifact_id
- draft_section_id
- trace_type
- chunk_reference
- page_number
- page_number_trusted
- section_title
- segment_id
- parser_warning
- created_at

DOCX traces should store chunk references such as `docx:pN` as first-class evidence references. DOCX page numbers must remain untrusted unless a later parser can resolve them.

### draft_artifacts

Stores future reviewed draft plans or generated draft outputs.

Recommended fields:

- id
- draft_type
- title
- purpose
- source_card_id
- draft_input_package_id
- quality_status
- citation_readiness
- trace_readiness
- mock_only
- not_final_draft
- review_status
- created_at
- updated_at

Mock artifacts must not be stored as final generated drafts.

### draft_sections

Stores section-level draft structure and evidence mapping.

Recommended fields:

- id
- draft_artifact_id
- section_key
- title
- intended_role
- body
- linked_concept_card_ids_json
- linked_evidence_card_ids_json
- linked_quote_card_ids_json
- linked_case_card_ids_json
- linked_tag_ids_json
- citation_readiness
- trace_readiness
- review_status
- sort_order
- created_at
- updated_at

### review_snapshots

Stores human review checkpoints and validation summaries.

Recommended fields:

- id
- entity_type
- entity_id
- review_status
- reviewer
- validation_status
- warnings_json
- blockers_json
- notes
- created_at

### pipeline_runs

Stores end-to-end workflow snapshots for audit and reproducibility.

Recommended fields:

- id
- source_document_id
- source_card_id
- draft_artifact_id
- overall_status
- stage_statuses_json
- blockers_json
- warnings_json
- next_recommended_action
- created_at
- updated_at

## Schema Principles

The future local vault schema should follow these principles.

- Stable IDs: persisted records need durable IDs that do not depend on transient preview labels.
- Provenance-first: every saved object should know what source, parser, review, and candidate pipeline produced it.
- Trace-first: evidence and draft records should preserve chunk or segment references before any citation claim is trusted.
- DOCX page caution: DOCX page numbers are not trusted unless a later parser resolves pagination; `docx:pN` style chunk references remain valid internal traces.
- Explicit review state: human approval, rejection, and needs-review state should be stored as first-class record data.
- Citation metadata separation: citation metadata readiness should be stored separately from citation text.
- Mock artifact separation: deterministic mock draft artifacts must be marked `mock_only` and `not_final_draft`.
- Save boundaries: SourceDocument, SourceCard, tags, KnowledgeCards, and drafts should be saved through explicit boundaries, not silent downstream creation.
- Export separation: Markdown/Obsidian export should read from saved records, not become the primary write path.

## Migration And Versioning Approach

Recommended approach:

1. Add a SQLite migration table before the first real table.
2. Store schema version and migration timestamp.
3. Keep migrations append-only and reviewable.
4. Treat destructive migrations as manual/admin operations only.
5. Store parser version and mapper version on saved records when practical.
6. Keep preview-candidate contracts separate from saved-record contracts.

Future migration records should include:

- migration_id
- applied_at
- schema_version
- description

## Backup And Export Considerations

SQLite should be the primary vault file. ATP should later support:

- manual database backup/export
- database integrity check before backup
- Markdown/Obsidian export generated from saved records
- JSON export snapshots for debugging or migration safety
- explicit export logs so Markdown files do not drift silently from saved records

Backups and exports should not be introduced until real persistence boundaries are implemented and tested.

## Risks

Primary risks:

- Rust/TypeScript DTO drift between Tauri commands and frontend domain types.
- Preview candidate shapes being mistaken for saved object schemas.
- DOCX trace references being treated as real page numbers.
- Citation text being treated as citation-ready before metadata review.
- Tag review state needing normalization before persistence.
- Multi-record saves creating partial state if transaction boundaries are weak.
- Mock draft preview text being mistaken for final generated manuscript prose.
- SQLite migration mistakes becoming hard to repair for user-owned local vaults.

## Deferred Decisions

These decisions are intentionally deferred:

- exact SQLite crate or Tauri plugin choice
- database file location
- encryption-at-rest strategy
- backup cadence and UI
- whether JSON is useful for a first tiny persistence spike
- Obsidian export file format and folder structure
- Markdown frontmatter schema
- saved KnowledgeCard subtype table design versus single table design
- draft artifact final/provisional versioning model
- contract generation strategy to reduce Rust/TypeScript DTO drift

## Recommended Sprint 4C-3B Scope

Sprint 4C-3B should prepare the SQLite adapter implementation plan without implementing SQLite.

Recommended 4C-3B work:

- compare SQLite dependency options for Tauri v2
- decide whether the adapter lives in Rust, TypeScript, or a hybrid command boundary
- define database file location options
- define first migration set
- define the first real persistence command contract
- define SourceDocument-only save transaction boundaries
- define rollback/error behavior
- define automated QA approach for no accidental downstream record creation

4C-3B should not implement SQLite, create database files, save SourceCards, save KnowledgeCards, save drafts, export Obsidian notes, or add AI/API behavior.

## Explicit No-Persistence Decision For 4C-3A

Sprint 4C-3A is a storage decision and schema plan only.

No SourceDocument, SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, trace, review snapshot, pipeline run, file, database record, Obsidian note, or workflow state is saved in this sprint.
