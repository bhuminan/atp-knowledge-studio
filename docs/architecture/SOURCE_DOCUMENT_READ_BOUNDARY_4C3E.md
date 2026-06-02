# ATP Sprint 4C-3E: SourceDocument Read Boundary

## Decision Summary

Sprint 4C-3E adds read/list verification for the local SQLite Knowledge Vault, limited to the SourceDocument persistence root. The read boundary confirms that saved SourceDocument extraction data is inspectable without expanding persistence to SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, Obsidian, or export workflows.

This sprint is a real read/list boundary for the existing SourceDocument-only save path. It does not introduce additional save behavior.

## What Can Be Read

The read/list commands may inspect only these tables:

- `source_documents`
- `extraction_runs`
- `extraction_segments`
- `evidence_traces`

The compact list returns:

- SourceDocument ID
- title / file name
- file type
- metadata status
- extraction status
- created / updated timestamps
- segment count
- trace count

The detail read returns:

- SourceDocument row fields required for verification
- extraction run summary
- extraction segment rows
- evidence trace rows

## What Cannot Be Read Yet

The 4C-3E boundary does not read or imply saved records for:

- SourceCard
- MarketingTag
- KnowledgeCard
- DraftArtifact
- full persistence bundle
- generated draft
- Obsidian or Markdown export

Those artifacts remain preview-only candidates until a later explicit persistence boundary is implemented.

## Command Behavior

### `list_saved_source_documents`

Returns compact SourceDocument-root records with segment and trace counts. It orders by the SourceDocument `updated_at` value descending so the latest save is easiest to inspect.

### `read_saved_source_document`

Returns the selected saved SourceDocument detail with its latest extraction run, saved segments, and saved evidence traces.

Expected error behavior:

- Empty SourceDocument ID returns a readable required-field error.
- Unknown SourceDocument ID returns a clear not-found error.
- Missing extraction run is treated as an incomplete saved root and returns a readable error.

## Table Mapping

`source_documents` maps to the saved SourceDocument root and preserves:

- stable ID
- title
- file name
- file type
- metadata status
- citation readiness
- parser status
- review status
- creation/update timestamps

`extraction_runs` maps to parser/extraction summary data and preserves:

- extraction run ID
- extraction status
- confidence score
- raw/cleaned text lengths
- warning count

`extraction_segments` maps to document sections and preserves:

- segment ID
- segment title/type
- content
- sort order
- nullable page start/end
- page-number trust flag

`evidence_traces` maps to traceability references and preserves:

- trace ID
- chunk reference, such as `docx:pN`
- nullable page number
- page-number trust flag
- section title
- optional linked extraction segment

## DOCX Trace Constraint

DOCX page numbers remain nullable and untrusted. Chunk references such as `docx:pN` remain first-class trace identifiers until a future pagination-aware extraction layer exists.

The UI must not present nullable DOCX page numbers as real academic page references.

## Recommended Sprint 4C-3F

Implement a SourceCard-only save candidate rooted in an already saved SourceDocument.

Recommended boundaries:

- Require a saved SourceDocument ID before SourceCard save.
- Save SourceCard metadata only, not KnowledgeCards or drafts.
- Preserve citation metadata readiness separately from citation text.
- Keep KnowledgeCards, tags, draft artifacts, and Obsidian export preview-only.
- Add Rust tests proving SourceCard save cannot proceed without a saved SourceDocument root.

## No-Save Expansion Decision

Sprint 4C-3E does not expand persistence beyond SourceDocument-root read/list verification. It confirms that the first saved root is visible and traceable before ATP adds downstream academic artifacts.
