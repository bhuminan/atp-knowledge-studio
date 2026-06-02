# Sprint 4C-3B SQLite Adapter Implementation Plan

## Scope

Sprint 4C-3B prepares the SQLite persistence implementation plan for ATP Knowledge Studio.

This sprint does not add SQLite, install dependencies, create database files, add save commands, write files, persist records, export Obsidian notes, call AI/API providers, add PDF parsing, add DOCX export, or change UI behavior.

## Current Baseline

ATP currently has a preview-only persistence boundary:

- `PersistenceSaveCandidateBundle` collects SourceDocument, SourceCard, MarketingTag, KnowledgeCard, and DraftArtifact save candidates.
- `PersistenceAdapter` defines a dry-run adapter interface.
- `MockPersistenceRepository` validates the bundle shape and returns simulated counts.
- `PersistenceDryRunService` presents adapter output to Source Library UI.
- No real record is persisted.
- The latest storage decision recommends SQLite as ATP's primary local Knowledge Vault and Markdown/Obsidian as secondary export/sync.

## Recommended SQLite Approach For Tauri

Use a Rust-side SQLite adapter boundary behind controlled Tauri commands.

Recommended shape:

1. Frontend keeps preview, review, and validation state until the user explicitly triggers a real save.
2. Frontend sends a narrowly scoped save request to a Tauri command.
3. Rust validates the request, opens the SQLite vault, applies migrations if needed, runs a transaction, and returns a typed result.
4. TypeScript receives a save result but does not directly query or mutate SQLite.

This keeps ATP's persistence boundary close to the filesystem and local database, where Tauri has the strongest desktop control.

## Dependency Options And Tradeoffs

| Option | How it works | Pros | Cons | Risk level | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `tauri-plugin-sql` | Adds a Tauri SQL plugin with frontend-accessible database operations. | Tauri-native plugin path; can reduce custom Rust boilerplate; useful for simple app queries. | Frontend can become too close to raw persistence; harder to enforce ATP save boundaries; schema operations may leak into UI code; less ideal for strict review-gated academic saves. | Medium | Do not choose as the first ATP persistence adapter. Reconsider only if a later UI needs read-only query convenience. |
| `rusqlite` | Rust crate for synchronous SQLite access through explicit Rust command/service code. | Mature; strong local control; no async runtime coupling; explicit transaction boundaries; good fit for Tauri command handlers; keeps schema logic in Rust. | Requires writing adapter, migrations, and mapping code; synchronous calls need careful command sizing; DTO drift must be managed. | Low-medium | Recommended for ATP's first SQLite implementation. |
| `sqlx` | Rust async SQL toolkit with compile-time query checking options. | Strong typed query ergonomics; async-friendly; broad database support. | Heavier than needed for local SQLite; compile-time checking can complicate offline setup; extra complexity before ATP needs multi-DB support. | Medium | Defer. Use only if future database complexity justifies it. |
| Custom Rust command layer without a DB crate selected | Define commands and contracts first, add DB crate later. | Lets ATP harden command contracts before dependency choice. | Cannot perform real persistence; risks duplicating planning work. | Low for planning, high if stretched too long | Useful for one planning sprint only. 4C-3B is that planning sprint. |

## Recommended Dependency

Recommend `rusqlite` for the first real SQLite adapter sprint.

Reasons:

- ATP is local-first and desktop-only at this boundary.
- The first save should be a small SourceDocument transaction, not broad SQL access.
- `rusqlite` supports explicit transaction control.
- Rust-side schema control reduces accidental frontend persistence drift.
- A controlled command layer fits ATP's provenance-first and trace-first requirements.

Do not add `rusqlite` during Sprint 4C-3B. Add it only in the future implementation sprint after the command and migration plan is accepted.

## DB Location Recommendation

Use the Tauri app data directory as the default vault location.

Recommended future path concept:

`<app_data_dir>/knowledge-vault/atp-knowledge-vault.sqlite`

Design notes:

- The app data directory avoids writing inside the repository.
- The database path should be resolved in Rust, not supplied by frontend UI.
- The first implementation should create the parent vault directory only when the user triggers the first real save.
- Future settings may allow choosing a custom vault location, but not in the first save sprint.
- Do not use Obsidian folders as the primary database location.

## Migration Strategy

Use repo-stored forward-only SQL migrations.

Recommended future folder:

`src-tauri/migrations/`

Recommended first migration:

`0001_create_source_document_root.sql`

Migration principles:

- Store migrations in the repository.
- Create a `schema_version` table before domain tables.
- Run migration dry-run or validation before applying when possible.
- Apply migrations inside controlled Rust adapter code.
- Treat destructive migrations as unsupported until an explicit backup flow exists.
- Record migration ID, schema version, description, and applied timestamp.
- Keep migrations deterministic and reviewable.

## Schema Versioning Strategy

Add a `schema_version` table.

Recommended fields:

- id
- version
- migration_id
- description
- applied_at

Versioning rules:

- The app should refuse to write if the database schema is newer than the app understands.
- The app may migrate older schemas forward.
- The app should report migration blockers clearly.
- The first persistence sprint should not support downgrade migrations.
- The adapter should include schema version in save results for diagnostics.

## First Real-Save Boundary

The first real persistence boundary should be SourceDocument-only save from `PersistenceSaveCandidateBundle`.

The command should save only:

- one SourceDocument root record
- the related extraction run metadata
- extraction segments
- evidence trace rows

It should not save:

- SourceCard
- MarketingTag
- SourceCard tags
- KnowledgeCard
- KnowledgeCard tags
- DraftArtifact
- DraftSection
- full pipeline run
- Obsidian note

Reason: SourceDocument is the safest persistence root. It establishes durable provenance, extraction metadata, parser status, and trace references before citation metadata and knowledge cards become durable.

## Minimal SourceDocument Persistence Schema

The first schema should focus on document provenance and extraction traceability.

### source_documents

Purpose: durable reviewed SourceDocument root.

Recommended fields:

- id
- project_id
- title
- file_name
- file_type
- mime_type
- file_size
- local_path_reference
- local_path_policy
- metadata_status
- citation_metadata_required
- citation_readiness
- parser_status
- review_status
- created_from_candidate_id
- created_at
- updated_at

### extraction_runs

Purpose: record parser/extraction metadata for the saved SourceDocument.

Recommended fields:

- id
- source_document_id
- extraction_document_id
- parser_name
- parser_version
- extraction_status
- confidence_score
- raw_text_hash
- cleaned_text_hash
- raw_text_length
- cleaned_text_length
- warning_count
- created_at

The first implementation should consider storing text hashes and lengths before storing full extracted text. Storing full text can be evaluated once privacy, backup, and export behavior are clearer.

### extraction_segments

Purpose: store meaningful extracted sections or chunks.

Recommended fields:

- id
- extraction_run_id
- source_document_id
- segment_id
- segment_type
- title
- content
- content_hash
- page_start
- page_end
- page_numbers_trusted
- sort_order
- tags_json
- created_at

For DOCX, `page_start` and `page_end` should be nullable or stored with `page_numbers_trusted = false`; `0` should not be treated as a real page.

### evidence_traces

Purpose: store trace references attached to the SourceDocument root.

Recommended fields:

- id
- source_document_id
- extraction_run_id
- extraction_segment_id
- trace_type
- chunk_reference
- page_number
- page_number_trusted
- section_title
- parser_warning
- created_at

Chunk references such as `docx:pN` are first-class evidence anchors. Page numbers are nullable and untrusted for DOCX unless a later parser resolves pagination.

## SourceDocument Save Command Plan

Recommended future Rust command:

`save_source_document_candidate(request) -> SaveSourceDocumentResult`

Request should include:

- SourceDocument save candidate ID
- SourceDocument candidate fields
- file intake/provenance data
- extraction run summary
- segments
- trace references
- review snapshot
- validation status

Result should include:

- persisted: true
- source_document_id
- extraction_run_id
- saved_segment_count
- saved_trace_count
- schema_version
- warnings
- next_recommended_action

The command must reject requests when:

- validation status is blocked
- human review is not approved
- file type is unsupported
- source document ID is missing
- trace references are absent
- DOCX traces claim trusted page numbers without parser support
- schema migration fails

## Rollback And Backup Considerations

First implementation should use a single SQLite transaction for SourceDocument root, extraction run, segments, and traces.

Rollback rules:

- If any insert fails, roll back the whole SourceDocument save.
- Do not create partial SourceDocument records.
- Return readable error codes and messages to TypeScript.
- Do not attempt automatic retry in the first implementation.

Backup rules:

- Do not add backup UI in the first SQLite implementation.
- Before destructive migrations, require explicit backup support.
- Future backup should copy the SQLite vault only after integrity checks.
- Future Markdown/Obsidian export should not count as a database backup.

## Testing Strategy

Recommended tests for the first SQLite implementation:

- TypeScript unit tests for save-candidate mapping remain pure and preview-only.
- Rust unit tests validate migration SQL shape where practical.
- One Rust temp SQLite integration test creates a temporary database and applies the first migration.
- One Rust temp SQLite integration test saves a SourceDocument candidate with DOCX chunk traces.
- Test that SourceCard, KnowledgeCard, DraftArtifact, and tags are not saved by SourceDocument-only command.
- Test that missing trace references block save.
- Test that untrusted DOCX page numbers remain nullable or flagged.
- `npm run qa:source-library` remains the UI regression guard.
- `npm run build` remains required before commit.

The Playwright Source Library QA should continue confirming preview-only flows until a real save button is explicitly introduced.

## Risks

Key risks:

- Rust/TypeScript DTO drift between save command request/result and frontend candidate contracts.
- Accidentally saving a full bundle when only SourceDocument should be saved.
- Treating DOCX `pageNumber: 0` as a real page.
- Storing mock draft or knowledge artifacts before review boundaries are ready.
- Migration failures corrupting user-owned vaults.
- Adding frontend SQL access that bypasses adapter validation.
- Storing full extracted text before privacy and backup decisions are settled.
- Letting Obsidian export become an implicit persistence path.

## Deferred Decisions

Deferred until later:

- exact `rusqlite` feature flags
- whether to store full extracted text or only hashes plus segments
- database encryption
- custom vault location setting
- backup UI
- Obsidian/Markdown export schema
- SourceCard persistence transaction
- MarketingTag normalization strategy
- KnowledgeCard subtype schema
- DraftArtifact versioning
- generated contract strategy for Rust/TypeScript DTO alignment

## Recommended Sprint 4C-4 Scope

After this planning sprint, the smallest safe implementation sprint should be:

1. Add `rusqlite` dependency.
2. Add migration folder and first SourceDocument-root migration.
3. Add Rust SQLite adapter module with temp DB tests.
4. Add no UI save button yet, or keep any save action behind a disabled/preview-only gate.
5. Keep SourceCard, KnowledgeCard, DraftArtifact, Obsidian, and export persistence out of scope.

If the team wants one more planning step before implementation, run a focused dependency/licensing check for `rusqlite` and Tauri app-data path behavior.

## Explicit No-Implementation Decision For 4C-3B

Sprint 4C-3B does not implement SQLite.

No dependencies are added. No database file is created. No save command is added. No SourceDocument, SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, trace, review snapshot, pipeline run, file, Obsidian note, or workflow state is saved.
