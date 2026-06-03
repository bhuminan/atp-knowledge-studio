# Real Intake Parser Preflight 4E-0

## 1. Current Intake Flow

Source Library intake currently starts in `SourceLibraryPage` with a disabled native picker and a local-path fallback. The fallback calls the Tauri file inspection boundary through `LocalDocumentFilePicker`, returning file name, type, MIME type, size, created timestamp, status, warning, and local path.

DOCX files can then enter a review-gated extraction preview path through `LocalDocumentExtraction`. The UI displays cleaned text, segment previews, trace references, and parser warnings before mapping to a `SourceDocument` candidate. PDF files are accepted as metadata candidates, but extraction is explicitly blocked.

## 2. Current Mock Extraction Preview Boundary

The preview stack is still separated from final knowledge production:

- `DocumentExtractionMapper` converts file intake, text extraction, segments, and traces into a `SourceDocument` candidate.
- `DocumentExtractionMappingPreview` shows mock mapping fixtures without creating records.
- `SourceDocumentCandidatePreview` applies local review gates before downstream SourceCard, tag, KnowledgeCard, draft, persistence, and export previews.
- QA mode uses fixture data for deterministic Source Library coverage.

This boundary is suitable for a real parser handoff because parser output can be shaped into the existing extraction contract before any downstream candidate creation runs.

## 3. Current Contract Readiness

`SourceDocument` is ready for parser output review because it already has file metadata, citation readiness, parser status, summary preview, and linked chapter sections.

`ExtractionRun` persistence exists on the Rust/SQLite side as the saved extraction run record associated with a SourceDocument save. It stores extraction status, raw/cleaned text lengths, confidence, warning counts, and timestamps.

`ExtractionSegment` is represented by `DocumentSegment` in TypeScript and by saved extraction segment rows in SQLite. The current contract supports segment title, content, type, tags, and page range fields.

`EvidenceTrace` is represented by `ExtractionTrace` in TypeScript and by saved evidence trace rows in SQLite. The contract supports source document ID, page number, section title, segment ID, and chunk reference. DOCX page numbers should remain untrusted; paragraph/chunk references are safer for DOCX MVP.

## 4. Recommended Real Parser Architecture

Add a parser adapter boundary before changing parsing internals:

- UI: keep `SourceLibraryPage` responsible for file selection, preview, and review gates.
- TypeScript contract: keep `DocumentExtractionResponse` as the parser output shape consumed by mappers.
- Parser adapter: introduce a small DOCX parser service that returns text, segments, traces, warnings, and confidence in the existing response shape.
- Tauri command: expose the adapter through a stable command, but avoid leaking dependency-specific details into React.
- Persistence: write only reviewed SourceDocument extraction data through the existing save candidate path.

The next sprint should prove this adapter with DOCX only, then decide whether the current Rust-side extraction should be hardened, replaced, or wrapped.

## 5. Rust vs TypeScript Parser Decision

Rust remains the safer runtime location for local document parsing because Tauri already owns local file access, app data paths, and SQLite persistence. It also avoids exposing local file reads to the browser layer.

TypeScript should own readiness mapping, UI review, and candidate creation. It should not read DOCX/PDF contents directly in the browser. If a JavaScript parser is evaluated later, it should still be hidden behind the same parser adapter contract.

## 6. DOCX-First vs PDF-First Recommendation

Recommend DOCX-first parser MVP before PDF parser.

Reason: DOCX text structure is more predictable than PDF, easier to preserve heading/paragraph structure, and safer for first real extraction. PDF parser work should remain deferred until the DOCX parsing boundary is proven.

PDF parsing needs additional decisions for page layout, text ordering, tables, OCR, image-only pages, citations split across columns, and trace confidence. Those risks are too broad for the first real parser sprint.

## 7. Dependency Risk And Evaluation Criteria

Parser dependency evaluation should consider:

- Security history and maintenance activity.
- Tauri v2 and target-platform compatibility.
- Bundle size and build complexity.
- Ability to preserve DOCX paragraph, heading, table, footnote, comment, and relationship structure.
- Clear failure modes for corrupted packages and unsupported embedded content.
- Deterministic output suitable for Playwright and Rust tests.
- No network requirements.
- No API keys or cloud parsing.

PDF dependencies should be evaluated separately after DOCX because PDF requires page/layout/OCR policies that DOCX does not.

## 8. Proposed Next Sprint

Sprint 4E-1 should implement a DOCX-first parser MVP through a stable parser adapter contract. It should:

- Keep PDF extraction blocked.
- Preserve local file metadata and review gates.
- Return cleaned text, structured segments, evidence traces, parser warnings, and confidence.
- Save only reviewed SourceDocument extraction data.
- Add Rust tests for parser output and TypeScript tests for mapper readiness.

## 9. Files Likely To Change In Next Sprint

- `src/lib/sources/LocalDocumentExtraction.ts`
- `src/lib/sources/DocumentExtractionMapper.ts`
- `src/features/source-library/SourceLibraryPage.tsx`
- `src/features/source-library/components/DocumentExtractionMappingPreview.tsx`
- `src-tauri/src/lib.rs`
- `src-tauri/src/vault_db.rs` only if the existing save contract needs non-schema validation changes
- `tests/e2e/source-library.spec.ts`
- new parser adapter tests under the Rust test module or a focused Rust module

## 10. Files That Must Not Change Yet

- DOCX export implementation and QA files.
- Package and Cargo dependency manifests until dependency evaluation is approved.
- SQLite schema migrations.
- VirtualOffice, Dashboard, WorkflowBoard, Writer Studio, provider, citation, and validator files.
- Obsidian/Markdown export files.
- Final manuscript persistence files.

## 11. Test Plan For Real Parser Sprint

- `npm run build`
- `npm run qa:source-library`
- `cd src-tauri && cargo test`
- Rust parser tests for valid DOCX, missing path, unsupported PDF, corrupted DOCX, empty document text, flattened table warning, skipped image warning, and untrusted page numbers.
- TypeScript mapper tests for DOCX parser output, missing segments, missing traces, low confidence, and blocked extraction.
- Playwright QA for preview panel, review gate, SourceDocument save candidate, saved SourceDocument readback, and PDF blocked notice.

## 12. Known Limitations

- No real PDF parser is available.
- DOCX page numbers are not trustworthy; use chunk references such as paragraph IDs.
- Citation metadata is still review-gated and incomplete by default.
- Parser output does not imply SourceCard, KnowledgeCard, draft, or final manuscript persistence.
- No AI extraction, APA finalization, Obsidian export, or final manuscript save is in scope.
- Existing DOCX extraction should be treated as a preview boundary until the parser adapter contract is explicitly hardened.
