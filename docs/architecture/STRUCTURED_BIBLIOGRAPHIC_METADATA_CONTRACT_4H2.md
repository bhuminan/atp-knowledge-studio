# Structured Bibliographic Metadata Contract 4H-2

## Purpose

Sprint 4H-2 defines the future SourceCard bibliographic metadata contract and persistence plan. It is documentation-only. No SQLite migration, persistence field, UI editor, DOI lookup, APA finalizer, AI/API call, or automatic metadata extraction is added in this sprint.

The goal is to prevent the current compact metadata fields from being mistaken for structured APA readiness.

## A. Current State

### Existing SourceCard Fields

The saved `source_cards` table currently stores:

- `id`
- `source_document_id`
- `title`
- `authors`
- `year`
- `source_type`
- `citation_text`
- `metadata_status`
- `citation_readiness`
- `file_reference`
- `review_status`
- `created_from_candidate_id`
- `created_at`
- `updated_at`

The TypeScript persistence bridge exposes these same compact fields through `SaveSourceCardRequest`, `SavedSourceCardRecord`, and `UpdateSourceCardMetadataRequest`.

### What 4H-1 Added

Sprint 4H-1 added `update_source_card_metadata`, a narrow human metadata update command for existing saved SourceCards.

The command updates only:

- `title`
- `authors`
- `year`
- `citationText`
- `metadataStatus`
- `citationReadiness`

It does not update SourceDocument links, parser provenance, traces, MarketingTags, KnowledgeCards, DraftArtifacts, export state, or downstream records.

4H-1 supports `basic_citation_metadata_confirmed`: a human reviewer can confirm the current compact fields. It does not support structured bibliographic metadata, APA reference generation, or APA final verification.

### What Remains Insufficient

The current model is not sufficient for APA-ready citation workflows because it lacks structured bibliographic fields such as:

- publisher
- journal
- DOI
- URL
- edition
- volume
- issue
- page range
- place of publication when needed
- container title when needed
- access date when needed

The current `citationReadiness: ready` value can mean only "human confirmed the compact fields currently available." It must not be interpreted as APA-final or publication-ready.

## B. Problem Statement

Compact citation fields are useful for early review, but they do not preserve enough detail to generate, validate, or audit APA references.

A single `citationText` string is not enough because:

- It cannot reliably distinguish journal, book, chapter, report, website, and teaching note requirements.
- It cannot separately validate DOI, URL, page range, volume, issue, publisher, or container title.
- It makes it difficult to identify which metadata element is missing or human-confirmed.
- It risks treating a reviewer-entered display string as an APA-ready reference.

DOI, publisher, journal, page range, URL, edition, and container metadata cannot be fabricated. They must come from human entry, trusted imported metadata, parser-derived metadata with provenance, or explicit citation-source review.

APA finalization must wait because ATP currently has no structured metadata schema, citation style engine, citation manager integration, or human APA verification workflow.

## C. Proposed Structured Metadata Contract

Future structured bibliographic metadata should remain attached to a saved SourceCard, but it should be modeled separately from parser traces and downstream artifacts.

Recommended future model name: `SourceCardBibliographicMetadata`.

Field contract:

| Field | Purpose | Required/Optional By Source Type | Source Mode | APA Readiness Use | Fabrication Risk |
| --- | --- | --- | --- | --- | --- |
| `sourceCardId` | Links metadata to saved SourceCard. | Required for all. | Persistence link. | Required for all readiness. | Low; must already exist. |
| `title` | Work title or source title. | Required for all. | Human-entered, parser-derived label, or imported. | Required. | High if inferred from file name without review. |
| `authors` | Author names in reviewed order. | Usually required; may be organization for reports/websites. | Human-entered or imported. | Required unless source truly has no author. | High; never infer from content blindly. |
| `year` | Publication year or date year. | Usually required; use `n.d.` policy only after review. | Human-entered or imported. | Required. | High; parser date guesses are not reliable. |
| `sourceType` | Determines metadata rules. | Required for all. | Human-selected or inherited then reviewed. | Required for validation routing. | Medium; wrong type causes wrong APA form. |
| `publisher` | Publisher or institutional publisher. | Required for books/reports; optional for journal articles; source-specific for websites. | Human-entered or imported. | Required for book/report APA readiness. | High. |
| `journal` | Journal or periodical name. | Required for journal articles. | Human-entered or imported. | Required for article APA readiness. | High. |
| `containerTitle` | Book, proceedings, website, or collection container title. | Required for chapters and some web/content sources. | Human-entered or imported. | Required when source type uses a container. | High. |
| `edition` | Edition statement. | Optional for books/chapters unless not first edition. | Human-entered or imported. | Used when present; may be required if edition exists. | Medium. |
| `volume` | Journal/book volume. | Required for many journal articles; optional source-specific. | Human-entered or imported. | Important for article APA readiness. | High. |
| `issue` | Journal issue. | Optional/required depending on article metadata. | Human-entered or imported. | Used for article APA readiness. | High. |
| `pageRange` | Publication page range, not DOCX parser page number. | Required for journal articles/book chapters when available. | Human-entered or imported. | Required for many APA references. | High; must not use untrusted DOCX page numbers. |
| `doi` | Digital Object Identifier. | Strongly preferred for journal articles; optional if absent. | Human-entered, imported, or trusted lookup in a future sprint. | High-value APA field. | High; never invent. |
| `url` | Stable URL. | Required for websites and online reports when no DOI. | Human-entered or imported. | Required for web APA readiness. | High; never invent. |
| `accessDate` | Retrieval/access date. | Required only when content changes over time or policy requires it. | Human-entered. | Conditional APA field. | Medium; date must be explicit. |
| `citationText` | Human display/reference text or interim citation note. | Required only as display/review field in current system. | Human-entered or generated later from structured fields. | Should not be sole APA readiness source. | High if treated as final without structure. |
| `metadataStatus` | Current compact metadata status. | Required for backward compatibility. | System status plus human action. | Basic gate only. | Medium if overloaded. |
| `citationReadiness` | Current compact citation readiness. | Required for backward compatibility. | System status plus human action. | Basic gate only; not APA-final. | High if treated as APA-ready. |
| `apaReadiness` | Future APA reference readiness state. | Required once structured metadata exists. | Derived from structured fields and human review. | Primary APA readiness gate. | Medium if derived without human verification. |
| `metadataSource` | Provenance of structured metadata. | Required for structured metadata records. | `human_entered`, `human_verified`, `parser_derived`, `imported`, `generated_candidate`. | Audit and trust routing. | Low if explicit; high if omitted. |
| `humanVerifiedAt` | Timestamp for human verification. | Required before APA final verification. | Human action timestamp. | Required for final verification. | Low. |
| `notes` | Human notes about uncertainty. | Optional. | Human-entered. | Review support only. | Low. |
| `warnings` | Structured warnings/blockers. | Optional/recommended. | System-derived. | Review support. | Low. |

Metadata source policy:

- `human_entered`: typed by a user but not necessarily fully reviewed.
- `human_verified`: reviewed by a user against a trusted source.
- `parser_derived`: extracted by parser, never final without review.
- `imported`: imported from a future trusted metadata source.
- `generated_candidate`: generated by a future helper as a candidate only, never final.

## D. Source-Type Requirements

### Academic Journal Article

Minimum structured metadata:

- title
- authors
- year
- journal
- volume when available
- issue when available
- pageRange when available
- DOI if available, otherwise URL if online source requires it

APA readiness should remain incomplete if journal identity, authors, year, and title are not human-confirmed.

### Book

Minimum structured metadata:

- title
- authors or editors as appropriate
- year
- publisher
- edition when not first edition

Place of publication is usually not required for APA 7, but may be retained as optional historical metadata if needed for non-APA workflows.

### Book Chapter

Minimum structured metadata:

- chapter title
- chapter authors
- year
- containerTitle
- editor names when applicable
- publisher
- pageRange when available
- edition/volume when applicable

### Report Or White Paper

Minimum structured metadata:

- title
- authors or organization
- year/date
- publisher or issuing institution
- report number when available
- DOI or URL when available

### Website Or Web Article

Minimum structured metadata:

- title
- authors or organization
- publication date or reviewed `n.d.` policy
- site/container title when different from author
- URL
- accessDate only when content is designed to change or policy requires retrieval date

### DOCX Manuscript Or Source Note

Minimum structured metadata:

- title
- author or organization when known
- year/date if known
- sourceType as DOCX manuscript/source note
- file provenance retained through SourceDocument

DOCX page numbers remain untrusted. Internal chunk references such as `docx:pN` are evidence traces, not publication page ranges.

### Teaching Note

Minimum structured metadata:

- title
- authors or institution
- year/date if known
- publisher/institution/course context when known
- URL or local file provenance when applicable

Teaching notes often need review-specific warnings because they may not be citable as external academic sources.

### Unknown Or Source Pending Review

Minimum structured metadata:

- title or review label
- sourceType: unknown/source pending review
- metadataStatus: needs_metadata
- apaReadiness: needs_metadata
- warnings explaining missing source type and metadata

Unknown sources must not be promoted to APA readiness.

## E. Readiness Model

Future readiness should separate compact citation review from structured APA readiness.

Recommended states:

- `needs_metadata`: required title, author, year, source type, or source-specific fields are missing.
- `basic_metadata_confirmed`: the 4H-1 compact fields are human-confirmed.
- `structured_metadata_incomplete`: structured metadata exists but source-type-required fields are missing.
- `structured_metadata_complete`: source-type-required structured fields are present and human-entered or verified.
- `apa_reference_candidate`: a future APA reference candidate can be generated or previewed from structured fields, but is not final.
- `apa_final_verified`: human academic review has verified APA correctness.

Important mapping rule:

- Current `citationReadiness: ready` maps only to `basic_metadata_confirmed`.
- It must not map directly to `structured_metadata_complete`, `apa_reference_candidate`, or `apa_final_verified`.

Future `apaReadiness` should be a separate field or a separate metadata table field. If it is mapped from current `citationReadiness`, the mapping must be conservative:

- `ready` -> `basic_metadata_confirmed`
- `needs_review` -> `needs_metadata` or `structured_metadata_incomplete`
- `blocked` -> `needs_metadata` with blockers

## F. Persistence And Migration Plan

### Option 1: Extend `source_cards` Directly

Pros:

- Simple read/list queries.
- Fewer joins.
- Easier TypeScript bridge update for a small schema.

Cons:

- `source_cards` becomes wide and mixes compact SourceCard identity with structured bibliographic metadata.
- Source-type-specific optional fields can create many nullable columns.
- Harder to version bibliographic metadata separately.
- Harder to audit future imported/generated metadata provenance.

### Option 2: Add `source_card_bibliographic_metadata`

Pros:

- Keeps SourceCard identity separate from structured bibliographic data.
- Allows metadata-specific provenance, readiness, warnings, and human verification timestamps.
- Easier backward compatibility for existing saved SourceCards.
- Easier future versioning or replacement of metadata without mutating SourceCard root fields.
- Keeps downstream SourceCard links stable while metadata grows.

Cons:

- Requires joins for read/list/detail.
- Requires extra command and tests.
- Requires careful UI handling when a SourceCard has no structured metadata row yet.

### Recommended Approach

Add a separate `source_card_bibliographic_metadata` table in a future sprint.

Recommended future table shape:

- `source_card_id TEXT PRIMARY KEY`
- `title TEXT NOT NULL`
- `authors_json TEXT NOT NULL`
- `year TEXT`
- `source_type TEXT NOT NULL`
- `publisher TEXT`
- `journal TEXT`
- `container_title TEXT`
- `edition TEXT`
- `volume TEXT`
- `issue TEXT`
- `page_range TEXT`
- `doi TEXT`
- `url TEXT`
- `access_date TEXT`
- `citation_text TEXT NOT NULL`
- `metadata_status TEXT NOT NULL`
- `citation_readiness TEXT NOT NULL`
- `apa_readiness TEXT NOT NULL`
- `metadata_source TEXT NOT NULL`
- `human_verified_at TEXT`
- `notes TEXT`
- `warnings_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Foreign key:

- `source_card_id -> source_cards(id) ON DELETE CASCADE`

### Backward Compatibility

Existing saved SourceCards should remain readable without a structured metadata row. Read commands should return compact SourceCard fields plus `structuredBibliographicMetadata: null` or an equivalent missing-structured-metadata status.

Records created before structured metadata exists should map to:

- compact fields preserved as-is
- `apaReadiness: needs_metadata`
- `metadataSource: human_entered` only if 4H-1 update was explicitly performed, otherwise `metadataSource: legacy_compact`
- warning: "Structured bibliographic metadata has not been completed."

### Migration Strategy

Future migration should:

1. Create `source_card_bibliographic_metadata`.
2. Insert no automatic structured rows by default, or insert legacy rows marked `legacy_compact` and `structured_metadata_incomplete`.
3. Preserve current `source_cards` data unchanged.
4. Keep `update_source_card_metadata` behavior stable for compact fields.
5. Add a new command such as `update_source_card_bibliographic_metadata` for structured fields.
6. Add read/list DTOs that include structured metadata when available.

### Command Implications

Future commands should include:

- `read_source_card_bibliographic_metadata`
- `update_source_card_bibliographic_metadata`
- possibly `validate_source_card_bibliographic_metadata`

Existing commands should continue to work:

- `save_source_card_candidate`
- `list_saved_source_cards`
- `read_saved_source_card`
- `update_source_card_metadata`

No downstream MarketingTag, KnowledgeCard, DraftArtifact, trace, parser provenance, or export command should mutate structured bibliographic metadata.

### Test Implications

Future tests should verify:

- migration creates the metadata table
- existing SourceCards remain readable
- structured metadata update requires existing SourceCard ID
- source-type validation blocks incomplete APA readiness
- no DOI/URL/publisher/journal/page range is fabricated
- compact `citationReadiness` is not treated as APA final
- read-back returns structured metadata after update
- no downstream records are mutated by metadata updates

## G. UI Workflow Plan

Future Source Library UI additions should remain compact and review-gated.

Recommended additions:

- Structured metadata editor under the saved SourceCard verification panel.
- Source-type selector that drives required field warnings.
- Source-type-specific required field groups.
- Human verification controls for structured metadata.
- APA readiness preview that is separate from current `citationReadiness`.
- Warnings for missing DOI, URL, page range, publisher, journal, container title, or volume/issue where relevant.
- No-fabrication notices:
  - "Structured metadata must be human-entered, imported from a trusted source, or explicitly verified."
  - "DOI, URL, publisher, journal, and page range are not fabricated."
  - "APA readiness is separate from citation readiness."
- Read-back verification after every structured metadata update.

The UI should not redesign Source Library during the first structured metadata sprint. It should add a narrow panel that respects the existing persistence-preview style.

## H. QA Strategy

Future QA should cover:

- Migration applies cleanly and is idempotent.
- Existing SourceCards without structured metadata still read/list correctly.
- Structured metadata update requires an existing SourceCard ID.
- Source-type validation identifies missing required fields.
- Human verification is required before `structured_metadata_complete`.
- `apa_reference_candidate` requires structured metadata completeness.
- `apa_final_verified` requires explicit human APA review.
- DOI, URL, publisher, journal, page range, authors, and year are never auto-filled without explicit user/imported source.
- Read-back verification displays updated structured fields.
- Updating structured metadata does not mutate SourceDocument, MarketingTags, KnowledgeCards, DraftArtifacts, traces, parser provenance, or export state.
- Current Source Library QA remains stable.
- AI/mock validation gates continue to reject fabricated citation metadata.

## I. Recommended Next Sprint

Recommended next sprint:

Sprint 4H-3 — Add structured bibliographic metadata persistence and editor MVP.

Recommended 4H-3 scope:

- Add SQLite migration for `source_card_bibliographic_metadata`.
- Add Rust DTOs and command for explicit structured metadata update.
- Add TypeScript bridge.
- Add compact Source Library structured metadata editor.
- Add read-back verification.
- Add tests for migration, update, validation, and no downstream mutation.

4H-3 should still avoid DOI lookup, citation web search, AI/API, APA finalization, DOCX export changes, Source Library redesign, and downstream artifact mutation.
