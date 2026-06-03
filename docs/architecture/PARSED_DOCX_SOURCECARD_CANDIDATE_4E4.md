# Parsed DOCX SourceCard Candidate 4E-4

## Scope

Sprint 4E-4 maps an explicitly saved parsed-DOCX `SourceDocument` into a reviewed `SourceCard` candidate. The flow stays inside Source Library and reuses the existing SourceCard save/read/list boundary.

## Saved SourceDocument To SourceCard Mapping

The mapper is `src/lib/sources/ParsedDocxSourceCardCandidateMapper.ts`.

Input:

- Saved parsed-DOCX `SourceDocument` detail from the local vault read path.
- Extraction segments and evidence traces already available in Source Library state.

Output:

- `SourceCardSaveCandidate`.
- Candidate readiness summary.
- Warnings and blockers.

Mapping policy:

- `sourceType` is always `DOCX`.
- `parserSource` is `real_docx_parser_mvp`.
- The candidate preserves the saved `SourceDocument` ID through `derivedFrom.sourceDocumentSaveCandidateId`.
- The title uses the saved SourceDocument title or file name only.
- The candidate ID remains stable as `candidate-source-card-{savedSourceDocumentId}`.

## Metadata Limitations

The real DOCX parser MVP does not extract bibliographic metadata. Authors, year, publisher, DOI/URL, and APA citation text are not inferred.

The SourceCard candidate therefore stays at:

- `metadataStatus: needs_metadata`
- `citationReadiness: needs_review`
- `validationStatus: needs_review`

## No-Fabrication Rule

The mapper does not fabricate author, year, publisher, DOI, or APA 7 citation data. The required `citationText` string is an explicit metadata-required notice, not a generated citation.

## Explicit Save Boundary

SourceCard persistence is never automatic.

The UI shows a “Parsed DOCX SourceCard Candidate” panel after the parsed-DOCX SourceDocument has been explicitly saved and read back. The user must then click “Save Parsed DOCX SourceCard”.

Save is blocked when:

- No saved/readable SourceDocument link exists.
- The candidate title is empty.
- Existing SourceCard readiness blockers are present.

## Page-Number Policy

DOCX page numbers remain untrusted. The SourceCard candidate does not promote page numbers to citation-ready references. Evidence remains traceable through chunk references from the saved SourceDocument.

## Downstream Generation

Saving the parsed-DOCX SourceCard does not automatically trigger:

- MarketingTag save.
- KnowledgeCard save.
- DraftArtifact save.
- DOCX export.
- Obsidian or Markdown export.

Those remain separate explicit actions.

## Next Recommended Sprint

Sprint 4E-5 should add human metadata review fields for parsed-DOCX SourceCards so author, year, publisher/journal, DOI/URL, and citation text can be entered explicitly before citation readiness is upgraded.
