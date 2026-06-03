# Parsed DOCX SourceDocument Save 4E-3

## Parser-To-Save Boundary

Sprint 4E-3 connects the parsed DOCX SourceDocument candidate to the existing SourceDocument save/read/list workflow. The save path uses the current `save_source_document_candidate`, `list_saved_source_documents`, and `read_saved_source_document` commands.

The parsed DOCX candidate enters persistence only through the existing SourceDocument candidate bundle. SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, and DOCX export workflows are not triggered automatically.

## Explicit-Save Rule

Parsed DOCX output is never auto-saved. The Source Library shows an explicit action:

“Save Parsed DOCX SourceDocument”

The action appears only inside the existing reviewed candidate/save-preview path. It shows candidate status, parser source, warning count, segment count, trace count, and the page-number policy before save.

## No Auto-Save Policy

Parsing a DOCX produces a preview and candidate only. The user must explicitly approve the candidate and click the SourceDocument save action. A successful save stores only SourceDocument extraction data.

## Provenance Policy

The save UI identifies parsed DOCX candidates as:

- `parserSource: real_docx_parser_mvp`
- `sourceType: DOCX`
- local path reference only
- chunk references only

The saved record remains a SourceDocument extraction artifact, not a final source card, citation, draft, or manuscript.

## Page-Number Policy

DOCX page numbers remain untrusted. The save path preserves chunk references such as `docx:pN`, while page values remain unavailable/untrusted. The UI warns that chunk references are saved and page numbers are not trusted.

## Metadata Limitations

The save integration does not fabricate author, year, publisher, DOI/URL, APA citation, or page numbers. Missing bibliographic metadata keeps the candidate in needs-review status unless a reviewer fills it in later through a future workflow.

## Downstream Workflow Not Triggered Automatically

Saving a parsed DOCX SourceDocument does not automatically save:

- SourceCard
- MarketingTag
- KnowledgeCard
- DraftArtifact
- DOCX export artifact
- final manuscript

The existing downstream buttons remain separate explicit actions.

## Read/List Verification

After a successful SourceDocument save, the Source Library populates the existing saved SourceDocument list/read verification panel. The panel confirms saved SourceDocument ID, extraction run, segment count, trace count, and trace chunk references.

## Next Recommended Sprint

The next sprint should improve reviewed metadata entry for parsed DOCX SourceDocuments before enabling broader downstream persistence. PDF parsing should remain deferred.
