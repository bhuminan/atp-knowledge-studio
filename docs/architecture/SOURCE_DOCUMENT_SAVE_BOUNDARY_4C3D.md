# Sprint 4C-3D SourceDocument Save Boundary

## Scope

Sprint 4C-3D implements ATP Knowledge Studio's first real local persistence boundary.

Only SourceDocument-root extraction data is saved to SQLite.

## What Is Saved

The `save_source_document_candidate` command writes only these tables:

- `source_documents`
- `extraction_runs`
- `extraction_segments`
- `evidence_traces`

The save payload is derived from the existing Source Library save-candidate flow and includes:

- approved SourceDocument save candidate
- document extraction summary
- extracted segments
- evidence traces
- chunk references such as `docx:pN`

## What Is Not Saved

This sprint does not save:

- SourceCard
- MarketingTag
- SourceCard tag links
- KnowledgeCard
- KnowledgeCard tag links
- DraftArtifact
- DraftSection
- full `PersistenceSaveCandidateBundle`
- AI-generated drafts
- Obsidian or Markdown exports
- pipeline run state

The Source Library UI explicitly states:

> Only SourceDocument extraction data is saved. SourceCard, KnowledgeCards, tags, and drafts are not saved.

## Table Mapping

### source_documents

Stores the reviewed SourceDocument root:

- stable SourceDocument ID from the candidate
- title
- file name
- file type
- local path policy
- metadata status
- citation readiness placeholder
- parser status
- review status
- candidate provenance
- created/updated timestamps

### extraction_runs

Stores extraction-level provenance:

- extraction run ID
- SourceDocument link
- extraction document ID
- parser name and version label
- extraction status
- confidence score
- raw/cleaned text lengths
- created timestamp

### extraction_segments

Stores extracted document sections/chunks:

- segment ID
- segment type
- title
- content
- nullable page start/end
- page-number trust flag
- sort order
- tags JSON

### evidence_traces

Stores chunk-level trace anchors:

- chunk reference
- nullable page number
- page-number trust flag
- section title
- related extraction segment when available

## Idempotency Behavior

Saving the same SourceDocument ID again is idempotent at the SourceDocument boundary:

- the SourceDocument root is upserted
- existing extraction runs, segments, and traces for that SourceDocument are replaced
- duplicate saves do not create duplicate SourceDocument rows
- the operation runs inside a single SQLite transaction

If any write fails, the SourceDocument save transaction rolls back.

## DOCX Trace And Page-Number Policy

DOCX page numbers are not trusted in the current parser.

Rules:

- DOCX traces must preserve chunk references such as `docx:pN`
- DOCX page numbers are stored as `NULL`
- `page_number_trusted` is stored as `0`
- the command rejects DOCX traces that claim trusted positive page numbers

This prevents DOCX chunk traces from being mistaken for citation-ready page references.

## Validation Behavior

The command returns blockers instead of writing when:

- SourceDocument ID is missing
- extraction run ID is missing
- candidate ID is missing
- title is missing
- file name is missing
- source metadata title is missing
- extraction document ID is missing
- file type is unsupported
- review status is not approved
- candidate validation is blocked
- no extraction segments are present
- no evidence traces are present
- any trace is missing a chunk reference
- DOCX traces contain positive page numbers

Warnings are returned for:

- incomplete SourceDocument metadata
- DOCX page-number limitations

## TypeScript Boundary

Added narrow bridge:

- `saveSourceDocumentCandidate(...)`

The bridge accepts only a SourceDocument-only save request. It does not expose full bundle save behavior.

## QA Behavior

Rust tests cover the real SQLite write path with temporary databases.

Playwright Source Library QA uses the existing QA-mode browser flow to verify the save button and result UI without depending on user-specific app-data paths or Tauri runtime availability.

## Recommended Sprint 4C-3E

Add SourceDocument read/list verification:

- Rust command to list saved SourceDocuments
- Rust command to read one saved SourceDocument with extraction runs, segments, and traces
- Source Library verification panel for saved SourceDocument records
- tests proving SourceCard, KnowledgeCard, tags, and drafts remain unsaved

Keep SourceCard save, MarketingTag save, KnowledgeCard save, DraftArtifact save, full-bundle save, Obsidian export, AI/API calls, DOCX export, and PDF parser out of scope until the SourceDocument read/list boundary is verified.
