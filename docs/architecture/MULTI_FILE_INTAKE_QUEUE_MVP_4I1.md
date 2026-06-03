# Multi-file Intake Queue MVP 4I-1

## Purpose

Sprint 4I-1 adds the first narrow Multi-file Intake Queue MVP for ATP Knowledge Studio.

The goal is to let a user select/import multiple local research files and create durable queue records for later semi-automatic intake and metadata matching.

This sprint creates queue records only. It does not parse PDFs, call external metadata APIs, score confidence, create SourceDocuments, create SourceCards, overwrite metadata, finalize APA references, mutate KnowledgeCards, mutate DraftArtifacts, or change DOCX export behavior.

## Relationship To 4I-0

Sprint 4I-0 defined the batch intake and metadata match architecture:

```text
multi-file import
-> intake queue
-> parser/extraction status
-> candidate metadata snapshot
-> external metadata matching
-> confidence score
-> suggested corrections
-> review queues
-> batch approval
-> human-verified metadata
```

4I-1 implements only the first persistence foundation:

```text
Select multiple PDF/DOCX files
-> collect metadata only
-> create batch intake queue records
-> list/read queue status in Source Library
```

## Table Design

New table:

`batch_research_intake_jobs`

Fields:

- `id`
- `file_name`
- `file_path`
- `file_type`
- `mime_type`
- `file_size`
- `source_type_guess`
- `queue_status`
- `parser_status`
- `metadata_extraction_status`
- `external_match_status`
- `review_status`
- `duplicate_status`
- `warnings_json`
- `blockers_json`
- `created_at`
- `updated_at`

Initial statuses:

- `queue_status`: `queued`
- `parser_status`: `not_started`
- `metadata_extraction_status`: `not_started`
- `external_match_status`: `not_started`
- `review_status`: `pending`
- `duplicate_status`: `not_checked`
- `source_type_guess`: `unknown_pending_review`

The table has no foreign key to SourceDocument or SourceCard because queue records must not auto-create downstream records.

## Command Boundary

New Tauri commands:

- `create_batch_research_intake_jobs`
- `list_batch_research_intake_jobs`

Rules:

- Accept selected local file metadata records.
- Store queue records only.
- Return created/listed queue records.
- List records newest-first by `created_at DESC, id ASC`.
- Block unsupported file types.
- Handle empty input safely.
- Do not parse files.
- Do not call DOCX parser or PDF parser.
- Do not call Crossref/OpenAlex/DOI/ISBN providers.
- Do not mutate SourceDocument, SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, APA review, or export tables.

## Multi-file Selection Behavior

New Tauri picker command:

- `select_local_document_files`

Supported extensions:

- `.pdf`
- `.docx`

Returned metadata:

- file name
- local path reference
- file type
- MIME type
- file size
- selected timestamp
- warning when metadata is incomplete

The picker returns metadata only. It does not upload files, read full file bodies, parse text, or call external services.

## Queue Statuses

4I-1 initializes conservative statuses only.

Future queue states from 4I-0 remain planned, but 4I-1 stores the first baseline states:

- `queued`
- `not_started` parser status
- `not_started` metadata extraction status
- `not_started` external match status
- `pending` review status
- `not_checked` duplicate status

## No Parser / No External API Boundary

4I-1 does not:

- parse PDFs
- expand DOCX parser behavior
- run OCR
- call external metadata providers
- perform DOI lookup
- perform ISBN lookup
- calculate confidence scores
- generate suggested corrections
- batch approve metadata

Queue records exist so those later workflows have a stable local foundation.

## No Automatic SourceDocument / SourceCard Creation

Creating intake queue records does not create:

- `source_documents`
- `source_cards`
- `source_card_bibliographic_metadata`
- `source_card_apa_reference_reviews`
- MarketingTags
- KnowledgeCards
- DraftArtifacts
- export records

Queue records are staging records. A later sprint must add explicit review and save boundaries before queue records become SourceDocuments or SourceCards.

## UI Behavior

Source Library adds a compact `Multi-file Intake Queue MVP` panel.

The panel shows:

- `Select PDF/DOCX files` action
- created job count
- queue list
- file name
- file type
- file size
- queue status
- parser status
- metadata extraction status
- external match status
- review status
- duplicate status
- warnings/blockers when present

Required notices:

- `Queue only — files are not parsed in this sprint.`
- `No external metadata lookup is performed.`
- `No SourceDocument or SourceCard is created automatically.`
- `No metadata is overwritten.`

The panel is intentionally compact and does not redesign Source Library.

## QA Results

Rust tests cover:

- migration creates `batch_research_intake_jobs`
- create one intake job
- create multiple intake jobs
- list jobs newest-first
- unsupported file type is blocked
- empty input is safe
- statuses initialize correctly
- SourceDocument and SourceCard rows are not created

Playwright Source Library QA covers:

- Multi-file Intake Queue panel appears
- queue-only notices are visible
- QA fixture creates multiple queue records
- initial statuses are visible
- PDF warning is visible
- existing Source Library DOCX candidate review flow remains stable

Verification commands:

- `npm run build`
- `npm run qa:source-library`
- `cd src-tauri && cargo test`

## Remaining Limitations

Remaining limitations:

- No PDF parser.
- No OCR.
- No external metadata provider integration.
- No Crossref/OpenAlex/DOI/ISBN lookup.
- No confidence scoring.
- No suggested correction model.
- No batch approve/reject/edit workflow.
- No duplicate detection beyond the initial status field.
- No automatic SourceDocument or SourceCard creation.
- No Source Library redesign.

## Recommended Next Sprint

Recommended next sprint:

Sprint 4I-2 - External Metadata Match Provider Contract / Mock Provider MVP.

Recommended constraints:

- provider contract and fixture/mock provider first
- no live external API calls until provider policy is stable
- no automatic overwrite
- no SourceCard mutation without explicit approval
- no APA finalizer
- no PDF/OCR expansion
