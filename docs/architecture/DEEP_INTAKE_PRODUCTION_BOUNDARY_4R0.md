# Deep Intake Production Boundary 4R-0

## Status

Sprint 4R-0 is an inspection, documentation, and planning sprint only.

This document defines the production boundary for future PDF/DOCX Deep Intake. It does not implement deep intake, does not add schema or migrations, does not add parser dependencies, and does not change runtime UI, Rust commands, persistence behavior, citation behavior, APA behavior, exports, parser behavior, AI/provider behavior, or SourceCard creation.

UI polish is stopped. Future implementation work should shift back to backend/product workflow while preserving the accepted Win95 Functional Frontstage.

## Product Boundary

ATP is a trusted semi-autopilot knowledge and writing studio. The intended work split is that AI performs roughly 60-70% of the heavy research and drafting work, while the user screens, approves, requests extra input, and performs final review at meaningful checkpoints.

Deep Intake is the core differentiator. A full PDF/DOCX textbook or ebook must not become only one flat source record. A long source may eventually become 200-1,000+ structured records. If Deep Intake is weak, Library, Cabinet, Writer, citation review, and output generation will not have reliable raw material.

ATP must not fabricate citations, evidence, metadata, claims, case studies, page numbers, or APA-final states.

## Current Intake Map

### File Selection And Inspection

Current local file inspection is owned by the Tauri boundary and TypeScript adapters:

- `src-tauri/src/lib.rs`
- `src/lib/sources/LocalDocumentFilePicker.ts`
- `src/features/source-library/SourceLibraryPage.tsx`

`inspect_local_document_file_path` normalizes a local path, checks that it points to a file, validates the extension, reads file metadata, and returns a local intake job with:

- file name
- file type
- MIME type
- file size
- created timestamp
- status
- local path reference

Supported inspection extensions are `.pdf` and `.docx`. Unsupported extensions are rejected with a clear extension error. Direct local file content reading stays inside Tauri/Rust rather than browser TypeScript.

### Current Supported Formats

The app currently recognizes these intake file types:

- `PDF`
- `DOCX`

The root `source_documents` table also allows `MD`, but the current intake queue and SourceDocument intake-save boundary are PDF/DOCX only. Legacy `.doc` is not supported; the UI directs users to convert to `.docx` or PDF first.

### DOCX Extraction

DOCX extraction exists as a local Rust parser MVP:

- `extract_document_text_from_path`
- `parse_local_docx_file`
- `extract_docx_plain_text`
- `parse_wordprocessingml_document`
- `src/lib/sources/LocalDocumentExtraction.ts`

The parser reads `word/document.xml` from a DOCX zip package, extracts paragraph text, decodes XML entities, preserves paragraph order, creates segment and trace previews, and emits parser warnings.

Current DOCX support is text-oriented:

- Paragraph text is extracted.
- Heading styles are detected when available.
- Missing headings produce low-structure-confidence warnings.
- Tables are flattened into paragraph text.
- Images/drawings are detected but skipped.
- Footnotes/endnotes are detected but skipped.
- Comments are detected but skipped.
- Partial XML parsing issues become warnings.
- DOCX page numbers remain untrusted; chunk references such as `docx:pN` are safer.

Corrupt DOCX packages and DOCX files missing `word/document.xml` fail clearly in Rust tests. Empty DOCX text fails with "No extractable paragraph text".

This DOCX parser is useful as a preview and persistence foundation, but it is not yet production Deep Intake.

### PDF Extraction

PDF is accepted for file inspection, batch queueing, and intake-only SourceDocument root save. PDF text extraction is explicitly not implemented.

The parser command rejects PDF with the boundary message that PDF parsing is deferred and the current parser MVP is DOCX-only. The UI states that PDF is metadata-only/queued.

Current PDF intake does not detect text layer quality, scanned/image-only pages, page layout, tables, columns, OCR needs, citation blocks, or extraction coverage.

### SourceDocument Candidate Flow

There are two related SourceDocument paths:

1. Parsed-DOCX SourceDocument save path.
2. Intake-only SourceDocument root save path.

The parsed-DOCX path can save reviewed extraction data through `save_source_document_candidate`. That command writes:

- `source_documents`
- `extraction_runs`
- `extraction_segments`
- `evidence_traces`

It is appropriate for reviewed parsed-DOCX output, but it requires at least one segment and trace.

The intake-only path uses `save_intake_source_document_candidates`. It creates only root `source_documents` rows for approved PDF/DOCX intake candidates. It intentionally does not write extraction runs, extraction segments, evidence traces, SourceCards, KnowledgeCards, DraftArtifacts, citation states, APA-final states, parser output, classifier output, provider output, AI output, or exports.

### Save, Read-Back, And Audit Flow

The intake-only save command validates the package and each candidate server-side. It requires:

- package id
- source = `INPUT Room`
- intended destination = `Source Library Intake`
- at least one candidate
- candidate id
- file name
- file type
- local path policy
- readiness status
- review status
- source type
- title
- supported file type: PDF or DOCX
- explicit approval
- readiness status = `ready`
- review status = `approved_for_source_document_save`
- safe flags showing parser/classifier/AI/provider/SourceCard work has not run

For new intake SourceDocuments, the command inserts one `source_documents` root row with:

- `metadata_status` derived from intake metadata state
- `citation_readiness = missing_metadata`
- `parser_status = not_started`
- `review_status = approved_for_source_document_save`
- `local_path_policy = local_path_reference_only` when supplied by the candidate

After save, it reads the root record back and verifies candidate id, title, file name, file type, local path policy, citation readiness, parser status, and review status.

It writes one audit event per candidate result in `intake_source_document_audit_events`. Supported result events are:

- `intake_source_document_save_succeeded`
- `intake_source_document_save_already_exists`
- `intake_source_document_save_rejected`
- `intake_source_document_save_failed_read_back`

Audit events include package id, candidate id, command name, source document id when present, result status, blockers, warnings, safety flags, read-back status, and a message.

### Duplicate And Idempotency Behavior

Current duplicate behavior is idempotency by deterministic SourceDocument id / candidate id, not true duplicate detection.

The intake-only save command checks whether the target SourceDocument id or candidate already exists. If it belongs to the same candidate, the command returns `already_exists`, reads it back, and writes an audit event. If the id belongs to a different candidate, the candidate is rejected.

The batch intake queue has a `duplicate_status` field, but it is currently initialized as `not_checked`. There is no production duplicate detector using content hash, file fingerprint, DOI, title/author/year match, ISBN, local path, or near-duplicate text comparison.

### Current UI Entry Points

The active Win95 frontstage keeps Library as the intake/source entry. In the current UI:

- Home routes to Library.
- Library has Saved Sources and Add Sources modes.
- Add Sources shows "Drop PDF or DOCX files here".
- Local path input can inspect a PDF/DOCX path.
- DOCX can enter the local parse path.
- PDF remains metadata-only/queued.
- Saved-source and Inspector surfaces show read-only status/detail.
- Old backend-heavy flow panels are guarded off the main frontstage.

The accepted room mapping remains:

- Library = intake/source entry
- Cabinet = knowledge vault
- Writer = semi-auto writing/output
- Art = future visual output
- Inspector = audit, debug, and detail-on-demand

Do not revive 8-bit pixel art, isometric virtual office, PNG banner dashboard, SVG scene dashboard, or visual-dashboard-heavy directions.

## Current Strengths

Current reliable pieces to preserve:

- Local file access and file metadata inspection stay in Tauri/Rust.
- PDF/DOCX extension validation exists at inspection and intake queue boundaries.
- DOCX parser MVP has clear failure modes for corrupt package, missing `word/document.xml`, and empty extractable text.
- DOCX parser emits warnings rather than silently pretending skipped content was extracted.
- DOCX page numbers are consistently treated as untrusted.
- Parsed-DOCX persistence can save reviewed extraction runs, segments, and traces.
- Intake-only SourceDocument save is explicit, server-side validated, audited, and read-back verified.
- Intake-only save does not create SourceCards or downstream records.
- Batch intake queue is PDF/DOCX only and does not create SourceDocuments or SourceCards.
- Tests cover many no-fabrication and no-side-effect boundaries.
- TypeScript/Rust DTO boundaries are explicit enough to reuse for the next narrow backend sprint.

## Current Production Gaps

### Duplicate Detection

True duplicate detection is not implemented. Existing behavior is idempotency for repeated candidate saves and a queue placeholder `duplicate_status = not_checked`.

Missing:

- content hash
- normalized file fingerprint
- local path comparison policy
- DOI/ISBN/title/author/year duplicate matching
- fuzzy metadata duplicate matching
- near-duplicate extracted text comparison
- duplicate warnings in intake approval

### File Format Validation

Current validation is mostly extension-based plus DOCX zip/package validation when parsing. Production intake needs stronger validation:

- MIME sniffing or magic-byte checks.
- Zero-byte and suspiciously small file handling.
- Oversized file policy.
- Password-protected/encrypted file detection.
- Mismatched extension/content detection.
- Clear blocked states for unsupported file classes.

### Corrupted File Handling

DOCX corrupt package handling exists in parser tests. The intake-only root save path can still save metadata-only candidates and does not inspect package health. Future production intake should decide whether corrupt-but-selected files can be saved as blocked SourceDocuments or must be blocked before root creation.

### Scanned PDF And No Text Layer

PDF text extraction is not implemented, so scanned/no-text-layer detection is missing. Production Deep Intake needs explicit states for:

- text layer present
- no text layer
- OCR required
- image-only pages
- encrypted or protected PDF
- page extraction failed
- layout order uncertain

### DOCX Mixed Thai-English Behavior

Current DOCX extraction reads paragraph text but does not provide Thai-first segmentation, mixed Thai-English tokenization, terminology preservation, or Thai academic structure detection. This is a major gap for Deep Intake.

### PDF Extraction Status

PDF extraction remains deferred. There is no PDF parser, layout policy, OCR policy, citation block extraction, table extraction, or page-level trace confidence.

### Extraction Quality Scoring

There is no Deep Intake Quality Score today. Current parser warnings and confidence score are useful but not sufficient to decide whether Writer has enough reliable material.

### Deep Segmentation

Current parsed-DOCX segments are parser-level chunks, not production SourceSections or KnowledgeUnits. Long sources are not decomposed into 200-1,000+ structured records.

### Knowledge Unit Generation

No production `KnowledgeUnit`, `EvidenceUnit`, `CaseUnit`, `QuoteUnit`, `TeachingUnit`, or `WritingAngle` generation exists. Do not rush tables or migrations for these objects without a dedicated schema design sprint.

### Usage/Repeat Ledger

No `UsageLedger` or `RepeatReuseLedger` exists. This must be designed early for textbook/book projects so ATP can track reused concepts, cases, examples, frameworks, claims, quotes, statistics, teaching angles, and writing angles across chapters.

### Trust Propagation

Current trust/status fields exist at several boundaries, but trust does not propagate through future Deep Intake objects because those objects do not exist yet. A trusted SourceDocument must not automatically make every extracted claim green.

### Partial Save And Crash Recovery Risks

Current intake-only save uses one transaction per new SourceDocument root. Audit event insertion happens after the root transaction. This means a crash or audit insertion failure could leave a saved SourceDocument with missing or incomplete intake audit evidence. The command reports audit warnings, but production Deep Intake should design atomic write/audit/read-back behavior intentionally.

For multi-candidate packages, saves are per candidate. This supports partial success, but production UI and audit receipts must make partial success obvious.

## Current Schema Safe To Build On

The current schema is safe to build on for root source intake and reviewed parsed-DOCX persistence:

- `source_documents`
- `extraction_runs`
- `extraction_segments`
- `evidence_traces`
- `batch_research_intake_jobs`
- `intake_source_document_audit_events`

These tables already encode useful boundaries:

- root SourceDocument identity
- local file metadata
- metadata/citation/parser/review statuses
- extraction run summaries
- segment rows
- evidence trace rows
- batch queue records
- intake audit events

They should be reused carefully, not bypassed.

## Schema Design That Must Not Be Rushed

Do not add tables/migrations for the Deep Intake object layer without a dedicated schema design sprint.

Target conceptual hierarchy:

```text
SourceDocument
-> SourceSection
-> KnowledgeUnit
-> EvidenceUnit
-> CaseUnit
-> QuoteUnit
-> TeachingUnit
-> WritingAngle
```

Bad schema design here will cause painful migrations, weak traceability, unclear retrieval behavior, duplicate knowledge records, and technical debt in Writer.

The schema design sprint should decide:

- stable IDs and deterministic identifiers
- parent/child ownership
- source trace references
- section hierarchy policy
- quote/evidence/case boundaries
- language metadata
- Thai and mixed-language segmentation fields
- extraction quality score fields
- trust state propagation
- review and approval states
- UsageLedger / RepeatReuseLedger links
- draft and export consumption links

## Deep Intake Target Model

Future Deep Intake should decompose a long PDF/DOCX source into a structured model:

- `SourceDocument`: the source root, file provenance, metadata, and high-level trust state.
- `SourceSection`: chapter/heading/section/subsection structure with source trace.
- `KnowledgeUnit`: reusable concept, theory, definition, framework, claim, or explanation.
- `EvidenceUnit`: empirical evidence, statistic, finding, support, or source-backed assertion.
- `CaseUnit`: company, industry, country, consumer, or campaign case/example.
- `QuoteUnit`: quoted source text with trace, language, and reuse limits.
- `TeachingUnit`: classroom explanation, activity seed, example, or teaching note.
- `WritingAngle`: possible argument, chapter angle, article angle, or output framing.

This sprint does not implement these tables.

## Deep Intake Quality Score Proposal

Every source that passes future Deep Intake should receive a quality score indicating whether Writer has enough reliable material to proceed.

Proposed metrics:

- `extraction_coverage`: how much of the file was extractable.
- `structure_coverage`: how well chapters, headings, sections, tables, figures, footnotes, and references were understood.
- `knowledge_unit_density`: whether the extraction produced enough usable knowledge units for the source type.
- `evidence_trace_coverage`: how many generated units have reliable traces back to source sections/chunks/pages.
- `language_quality`: whether Thai, English, and mixed-language text were segmented and preserved well enough.
- `duplicate_risk`: whether the file or extracted units overlap with existing library content.
- `blocker_count`: count and severity of unresolved blockers.
- `review_need_level`: how much human review is needed before Writer use.
- `writer_readiness`: whether the semi-auto writer has enough reliable material for outline, evidence mapping, and drafting.

The score must not imply citation-ready, APA-final, or publication-ready status.

## Trust-State Propagation Proposal

Future green/orange/red trust states should extend to:

- `SourceDocument`
- `SourceSection`
- `SourceCard`
- `KnowledgeUnit`
- `EvidenceUnit`
- `CaseUnit`
- `QuoteUnit`
- `DraftSection`
- `DraftArtifact`
- Exported output

Use the existing Win95 trust dot visual language where UI indicators are needed. Do not redesign UI.

Propagation rules should be conservative:

- Green SourceDocument means root file/provenance is acceptable, not that every extracted claim is green.
- Orange extraction warnings should lower downstream readiness until reviewed.
- Red blockers should stop dependent automation.
- Missing trace should block EvidenceUnit/QuoteUnit trust.
- Duplicate/reuse risk should affect book/textbook Writer readiness.
- Draft and exported output trust should reflect the weakest important source/evidence dependencies.

## Thai-First Intake Requirements

Thai is a first-class requirement, not later localization.

Future Deep Intake must support:

- Thai academic documents.
- Mixed Thai-English documents.
- Thai segmentation.
- Thai terminology preservation.
- Thai/English concept extraction.
- English-to-Thai adaptation later.
- Thai academic writer output readiness later.
- Thai plain-language writing later.
- Thai teaching examples later.
- Thai DOCX/PDF/HTML output quality later.

Thai-first support affects parser selection, text segmentation, heading detection, concept extraction, quotation handling, citation-adjacent copy, terminology consistency, and Writer readiness.

## Repeat/Reuse Tracking Early Design Warning

Repeat/reuse tracking is a product differentiator, especially for book and textbook projects.

ATP must eventually track which concepts, cases, examples, frameworks, claims, quotes, statistics, teaching angles, and writing angles have already been used in prior chapters or outputs.

The future ledger should warn when reuse is:

- acceptable
- intentional
- excessive
- stale
- too similar to earlier chapter content
- better replaced with another source/example

For standalone journal articles or plain articles, repeat tracking can be lighter. For books/textbooks, a `UsageLedger` or `RepeatReuseLedger` should be designed early before Writer automation begins consuming Deep Intake objects.

## Test Coverage That Exists Today

Current tests cover:

- DOCX parser success for valid minimal DOCX.
- Paragraph order preservation.
- XML entity/special character decoding.
- Corrupt DOCX package failure.
- Missing `word/document.xml` failure.
- Unsupported DOCX content warnings.
- Untrusted DOCX page number policy.
- Batch intake empty input handling.
- Batch intake unsupported file type blocking.
- Batch intake no SourceDocument/SourceCard side effects.
- Intake SourceDocument unsupported file type rejection.
- Missing title/file name rejection.
- Missing explicit approval rejection.
- Unsafe safety flag rejection.
- Approved PDF/DOCX intake-only SourceDocument root save.
- Intake SourceDocument idempotent repeat save.
- Intake SourceDocument read-back verification.
- Intake root read-only behavior without extraction detail.
- SourceCard creation remaining deferred for intake-only roots.
- Source Library Win95 frontstage and Add Sources smoke coverage.

## Test Data Missing

Future production Deep Intake needs a real corpus:

- Thai academic paper PDF.
- English academic paper PDF.
- Thai+English mixed DOCX.
- Textbook/ebook PDF.
- Scanned PDF with no text layer.
- Corrupted file.
- Duplicate file.
- Large file.
- File without DOI.
- File with weak metadata.

Additional useful fixtures:

- password-protected PDF
- DOCX with tables
- DOCX with footnotes/endnotes
- DOCX with comments
- DOCX with embedded images
- PDF with multi-column layout
- PDF with references split across pages
- Thai textbook chapter with English technical terms

## Next Implementation Sprint Recommendation

The next smallest safe implementation sprint should be:

```text
4R-1 File Validation + Duplicate Detection MVP
```

Reason:

- It is safer than starting full PDF parsing or Deep Intake object schema.
- It strengthens the root intake boundary used by both PDF and DOCX.
- It can build on current SourceDocument root, batch intake queue, audit, and read-back patterns.
- It addresses immediate production risk before adding parser dependencies.
- It gives Writer safer raw material later without pretending Deep Intake is complete.

Recommended 4R-1 scope:

- Add stronger file validation before SourceDocument save.
- Add a file fingerprint/content-hash design for PDF/DOCX.
- Add duplicate detection result states without creating Deep Intake tables.
- Preserve current explicit approval, audit, and read-back behavior.
- Keep PDF extraction deferred.
- Keep DOCX parser behavior unchanged except where validation requires clearer blockers.
- Add tests for duplicate file, mismatched extension/content, zero-byte file, unsupported type, and repeat-save/idempotency distinction.

4R-1 should not add `SourceSection`, `KnowledgeUnit`, `EvidenceUnit`, `CaseUnit`, `QuoteUnit`, `TeachingUnit`, `WritingAngle`, `UsageLedger`, or `RepeatReuseLedger` tables. Those require a later schema design sprint.

## Files Inspected

- `docs/product/ATP_PRODUCT_VISION_SEMI_AUTO_WRITER.md`
- `docs/product/ATP_WIN95_FRONTSTAGE_STYLE_BASELINE.md`
- `docs/product/ATP_Codex_MasterFix_Brief.html`
- `docs/architecture/REAL_INTAKE_PARSER_PREFLIGHT_4E0.md`
- `docs/architecture/REAL_DOCX_INTAKE_PIPELINE_STATUS_4E.md`
- `docs/architecture/REAL_INTAKE_PERSISTENCE_BOUNDARY_4M3.md`
- `src-tauri/src/lib.rs`
- `src-tauri/src/vault_db.rs`
- `src-tauri/migrations/001_init_source_document_root.sql`
- `src-tauri/migrations/008_add_batch_research_intake_jobs.sql`
- `src-tauri/migrations/013_add_intake_source_document_audit_events.sql`
- `src/lib/sources/LocalDocumentFilePicker.ts`
- `src/lib/sources/LocalDocumentExtraction.ts`
- `src/lib/sources/SourceDocumentIntakeSaveCandidateMapper.ts`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `src/features/source-library/SourceLibraryPage.tsx`
- `src/features/source-library/components/PersistenceSaveCandidatePreview.tsx`
- `tests/e2e/source-library.spec.ts`

## Non-Goals Confirmed

This sprint does not:

- modify runtime UI
- modify backend commands
- modify Rust logic
- modify SQLite schema or migrations
- modify package dependencies
- implement parser/classification/AI/provider
- implement SourceSection or KnowledgeUnit tables
- implement duplicate detection
- implement Deep Intake
- touch citation/APA/export/Writer behavior
- push changes
