# Parsed DOCX SourceDocument Candidate 4E-2

## Parser-To-Candidate Mapping

Sprint 4E-2 adds a pure TypeScript mapper:

- `src/lib/sources/ParsedDocumentToSourceDocumentCandidateMapper.ts`

The mapper accepts `DocumentExtractionResponse` from `parse_local_docx_file` and returns a SourceDocument-compatible candidate preview with extraction segments, evidence traces, warnings, and parser provenance metadata.

The mapped candidate remains review-only. It uses `fileType: "DOCX"`, `citationReadiness: "missing_metadata"`, and `metadata.completeness: "missing"` because bibliographic metadata is not extracted or verified by the parser MVP.

## Provenance Policy

The mapper marks parser provenance as:

- `parserSource: "real_docx_parser_mvp"`
- `sourceType: "DOCX"`
- `localPathPolicy: "local_path_reference_only"`
- `tracePolicy: "chunk_references_only"`

The UI displays this provenance in the Source Library so reviewers can distinguish a real DOCX parser candidate from older mock extraction previews.

## Page-Number Policy

DOCX page numbers remain untrusted. The parser does not fabricate page numbers. Segment and trace page values remain `0`, and downstream persistence can continue mapping those values to null/untrusted page numbers.

Evidence review should use stable chunk references such as `docx:p1`, `docx:p2`, or equivalent DOCX block references.

## Metadata Limitations

The mapper does not fabricate:

- authors
- publication year
- publisher
- DOI/URL
- APA 7 citation text
- page numbers

The candidate title is derived from the file name only as a review label. Citation readiness remains blocked by missing metadata until a human reviewer supplies bibliographic details.

## Save Boundary

No parsed DOCX output is auto-saved to SQLite. The Source Library shows a candidate-only notice:

“Candidate only — not saved until explicitly approved.”

The existing downstream save pathway remains review-gated. 4E-2 does not add a full bundle save, schema migration, final manuscript persistence, or automatic Knowledge Vault write.

## What Remains Mock

The following remain mock or preview-only:

- review state
- metadata completeness
- marketing tag suggestions
- SourceCard candidate review
- KnowledgeCard candidate review
- draft generation
- bundle previews
- final citation readiness

The real addition is the parser-source-aware SourceDocument candidate preview from parsed DOCX output.

## Next Recommended Sprint

The next sprint should decide whether to carefully enable reviewed real-parser SourceDocument save for parsed DOCX candidates, with explicit provenance and no auto-save. It should keep PDF deferred and avoid expanding into AI extraction or final manuscript persistence.
