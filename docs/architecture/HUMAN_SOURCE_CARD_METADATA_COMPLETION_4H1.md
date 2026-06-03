# Human SourceCard Metadata Completion 4H-1

## Purpose

Sprint 4H-1 adds a narrow human-entered metadata completion workflow for already saved SourceCards. The workflow exists so a reviewer can complete missing bibliographic fields after the parsed-DOCX pipeline creates and saves a SourceCard with incomplete citation metadata.

This is not automatic extraction, not AI citation generation, and not APA finalization.

## Update Command Boundary

The Tauri command is `update_source_card_metadata`.

It requires an existing saved SourceCard ID and updates only the existing SourceCard row. If the SourceCard ID is missing or does not exist, the command returns a clear error and creates nothing.

Editable fields:

- `title`
- `authors`
- `year`
- `citationText`
- `metadataStatus`
- `citationReadiness`

Non-editable fields in this workflow:

- `sourceDocumentId`
- `sourceType`
- parser provenance
- extraction segments
- evidence traces
- SourceDocuments
- MarketingTags
- KnowledgeCards
- DraftArtifacts
- export state

The command does not create, upsert, or mutate related objects.

## User Confirmation Rule

The Source Library UI requires explicit human action before metadata can be marked citation-ready. The reviewer can keep the SourceCard in `needs_review`, or mark citation readiness only after entering title, authors, year, citation text, and confirming that the metadata was human-entered or human-verified.

Citation readiness means user-confirmed, not APA-final.

## No-Fabrication Rule

The workflow does not fabricate authors, year, title, citation text, DOI, publisher, journal, page numbers, or APA citation strings. It accepts only values entered by the human reviewer.

Placeholder citation text, draft labels, unverified labels, and missing required fields block citation-ready status.

## Read-Back Verification

After a successful metadata update, the app reads the saved SourceCard again and displays the updated values. This confirms that the persisted row changed and that the update did not rely only on optimistic UI state.

The verification summary shows:

- updated title
- updated authors
- updated year
- updated citation text
- metadata status
- citation readiness

## Downstream Effects

Updating SourceCard metadata clears dependent preview/save state in the Source Library UI so later MarketingTag, KnowledgeCard, DraftArtifact, and export previews do not silently continue from stale SourceCard metadata.

The update does not automatically regenerate or save downstream artifacts.

## Why This Is Not APA-Final

The current schema supports only a compact citation text field plus simple author/year fields. Structured DOI, publisher, journal, volume, issue, page range, URL, retrieval date, and citation source fields are not implemented yet.

Because those structured fields are absent, `citationReadiness: ready` means the user confirmed the metadata available in the current schema. It does not mean the citation is APA 7 complete or publication-ready.

## Future Structured Metadata Migration

The next metadata-focused migration should add structured citation fields before APA-final workflows are exposed. Recommended future fields include DOI, publisher, journal or book title, volume, issue, page range, URL, citation source, and human verification timestamp.

Recommended next sprint: add a structured citation metadata schema and review UI without generating or fabricating citation data.
