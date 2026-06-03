# DOCX Parser MVP 4E-1

## Parser Boundary

Sprint 4E-1 exposes the real DOCX parser MVP through the Tauri command:

- `parse_local_docx_file`

The existing `extract_document_text_from_path` command remains as a compatibility wrapper, but both commands use the same DOCX parser request path. React does not read DOCX content directly; it sends the local file reference from the existing file-intake flow to Tauri and receives the existing `DocumentExtractionResponse` shape.

## Dependency Decision

No new dependency was added. The parser MVP reuses existing Rust dependencies:

- `zip` for opening `.docx` packages.
- `quick-xml` for streaming WordprocessingML from `word/document.xml`.

This keeps parser scope small and avoids package/Cargo churn.

## Output Contract

The parser returns the current extraction response shape:

- `fileIntakeJob`
- `extraction`
- `segments`
- `traces`
- `parserWarnings`

`extraction.cleanedText` and `extraction.rawText` preserve paragraph order. Segments are paragraph-level MVP blocks with heading-aware titles when Word heading styles are available. Warnings are returned for low structure confidence, flattened tables, skipped images, skipped footnotes/endnotes, skipped comments, partial XML decoding, and missing headings.

## Trace And Provenance Policy

DOCX page numbers are not fabricated. Segment page ranges and trace page numbers use `0`, which downstream persistence maps to untrusted or null page numbers. Evidence traces rely on stable DOCX chunk references such as `docx:p1`, `docx:p2`, and related DOCX chunk IDs.

The Source Library UI explicitly shows: “DOCX parser MVP — page numbers are not trusted.”

## Unsupported DOCX Features

The MVP does not model:

- PDF parsing
- OCR
- Images or drawings
- Table cell structure
- Footnote/endnote text bodies
- Comment text bodies
- Headers, footers, fields, citations, or bibliography parts
- Final citation validation

Tables may contribute paragraph text, but table structure is not preserved.

## Why PDF Remains Deferred

PDF parsing remains deferred because it requires page layout ordering, column handling, OCR decisions, image-only page handling, table recovery, and page-level evidence confidence. Those policies should not be mixed into the first real DOCX parser boundary.

## Next Recommended Sprint

The next sprint should harden DOCX parser review quality:

- Add fixture-based parser QA for realistic academic DOCX files.
- Improve heading and table segmentation.
- Add parser result review states if needed.
- Keep persistence review-gated and avoid auto-saving parsed output.
- Evaluate PDF dependencies only after DOCX parsing has stable evidence traces.
