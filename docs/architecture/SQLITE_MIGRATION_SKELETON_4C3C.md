# Sprint 4C-3C SQLite Migration Skeleton

## Scope

Sprint 4C-3C adds the minimal SQLite foundation for ATP's local Knowledge Vault.

This sprint does not save SourceDocuments, SourceCards, MarketingTags, KnowledgeCards, DraftArtifacts, Obsidian notes, files, pipeline state, or workflow records.

## Dependency Added

Added Rust dependency:

- `rusqlite` with the `bundled` feature

Reason:

- keeps SQLite access Rust-side
- supports explicit transaction and migration control
- avoids frontend SQL access
- improves macOS portability by bundling SQLite

No TypeScript database dependency was added.

## Migration Files Added

Added:

- `src-tauri/migrations/001_init_source_document_root.sql`

The migration creates only the SourceDocument-root foundation:

- `schema_version`
- `source_documents`
- `extraction_runs`
- `extraction_segments`
- `evidence_traces`

The migration intentionally does not create:

- `source_cards`
- `marketing_tags`
- `source_card_tags`
- `knowledge_cards`
- `knowledge_card_tags`
- `draft_artifacts`
- `draft_sections`
- `review_snapshots`
- `pipeline_runs`

Those tables remain future work.

## DB Path Behavior

Added Rust path resolution for the future vault database:

`<app_data_dir>/knowledge-vault/atp-knowledge-vault.sqlite`

The database path is resolved in Rust through the Tauri app data directory. The frontend does not provide the path.

The parent directory and database file are created only when `initialize_vault_database` is called.

## Initialization Command

Added Tauri command:

`initialize_vault_database`

Behavior:

- resolves the app-data Knowledge Vault database path
- creates the `knowledge-vault` app-data directory if needed
- opens or creates the SQLite database file
- applies the SourceDocument-root migration if schema version is missing
- returns initialization diagnostics

Returned status includes:

- `dbPath`
- `initialized`
- `appliedMigrations`
- `schemaVersion`
- `persisted`

`persisted` is always `false` for source data in this sprint.

## TypeScript Bridge

Added:

- `src/lib/persistence/LocalVaultDatabase.ts`

It exposes:

- `initializeVaultDatabase()`

The bridge is isolated and is not wired into the Source Library pipeline in this sprint.

## What Initialization Does Not Do

Initialization does not:

- save a SourceDocument
- save a SourceCard
- save MarketingTags
- save KnowledgeCards
- save DraftArtifacts
- save the full candidate bundle
- create Obsidian/Markdown exports
- call AI/API providers
- parse PDF
- export DOCX
- create Knowledge Vault records from preview candidates

## Trace And Page-Number Rules

The `evidence_traces.page_number` column is nullable.

DOCX references must continue to use chunk references such as `docx:pN` as first-class trace anchors. DOCX page numbers remain untrusted unless a later parser resolves pagination.

## Tests Added

Rust tests validate:

- the migration applies to an empty temp SQLite database
- required tables exist
- `schema_version` is initialized
- `evidence_traces.page_number` allows `NULL`
- initialization migration inserts zero SourceDocument rows
- applying migrations twice does not reapply completed migrations

Tests use temporary SQLite database files outside the repository and do not depend on the user's app data directory.

## Recommended Sprint 4C-3D

The next smallest safe sprint should add a SourceDocument-only save command behind the SQLite adapter.

Recommended 4C-3D scope:

- define `SaveSourceDocumentRequest` and `SaveSourceDocumentResult`
- map `SourceDocumentSaveCandidate` plus extraction segments/traces into the four existing SQLite tables
- run one transaction for SourceDocument root, extraction run, segments, and traces
- reject save unless human review is approved and validation is ready
- reject save if trace references are missing
- preserve DOCX page-number uncertainty
- add temp SQLite integration tests
- keep SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, full bundle save, Obsidian export, AI/API, and PDF parser out of scope

## No Source Data Persistence Decision

Sprint 4C-3C initializes the future database structure only.

No SourceDocument, SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, trace payload, review snapshot, pipeline run, Obsidian note, or generated draft is saved from the app pipeline in this sprint.
