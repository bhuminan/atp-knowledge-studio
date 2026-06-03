# Structured Bibliographic Metadata Persistence 4H-3

## Purpose

Sprint 4H-3 adds the first persistence layer for human-entered structured bibliographic metadata linked to already saved SourceCards.

This sprint makes structured bibliographic metadata storable and readable. It does not make citations APA-final, does not generate APA references, and does not perform DOI lookup, web search, AI extraction, or automatic metadata extraction.

## Relationship To 4H-1 And 4H-2

4H-1 added compact human SourceCard metadata completion for:

- title
- authors
- year
- citation text
- metadata status
- citation readiness

4H-2 defined the structured bibliographic metadata contract and warned that `citationReadiness: ready` is only basic human-confirmed citation metadata.

4H-3 implements the 4H-2 persistence foundation by adding a separate structured metadata table. The current 4H-1 compact fields remain unchanged and backward compatible.

## New Table Design

New table:

`source_card_bibliographic_metadata`

Primary key / foreign key:

- `source_card_id TEXT PRIMARY KEY`
- `source_card_id -> source_cards(id) ON DELETE CASCADE`

Fields:

- `publisher`
- `journal`
- `container_title`
- `edition`
- `volume`
- `issue`
- `page_range`
- `doi`
- `url`
- `access_date`
- `metadata_source`
- `structured_metadata_status`
- `apa_readiness`
- `human_verified_at`
- `notes`
- `warnings`
- `created_at`
- `updated_at`

Optional bibliographic fields are nullable. Existing SourceCards are not migrated into fake structured metadata rows.

## Command Boundary

New Tauri commands:

- `upsert_source_card_bibliographic_metadata`
- `get_source_card_bibliographic_metadata`

Command rules:

- Require an existing saved SourceCard ID.
- Fail clearly if the SourceCard does not exist.
- Upsert only `source_card_bibliographic_metadata`.
- Return read-back metadata after upsert.
- Do not mutate compact `source_cards` metadata.
- Do not mutate SourceDocuments, MarketingTags, KnowledgeCards, DraftArtifacts, parser provenance, traces, export state, or AI state.

## TypeScript Bridge Boundary

The local persistence bridge adds explicit DTOs and functions:

- `UpsertSourceCardBibliographicMetadataRequest`
- `SavedSourceCardBibliographicMetadata`
- `UpsertSourceCardBibliographicMetadataResult`
- `upsertSourceCardBibliographicMetadata`
- `getSourceCardBibliographicMetadata`

These functions are separate from SourceCard candidate save and 4H-1 compact metadata update functions.

## UI Workflow

Source Library now shows a compact structured bibliographic metadata editor after a SourceCard has been explicitly saved and read back.

The editor supports human entry for:

- publisher
- journal
- container title
- edition
- volume
- issue
- page range
- DOI
- URL
- access date
- metadata source
- structured metadata status
- APA readiness
- notes

Required notices:

- Human-entered structured metadata only.
- No DOI lookup, web search, AI extraction, or APA finalization is performed.
- APA readiness here is not APA-final.

The editor requires explicit user action to save structured metadata.

## Read-Back Verification

After save/update, Source Library reads the structured metadata record back and displays:

- publisher
- journal
- container title
- page range
- DOI
- URL
- structured metadata status
- APA readiness
- APA final verified state
- APA readiness notice

Repeated saves update the same row instead of creating duplicates.

## Backward Compatibility

Existing SourceCards without structured bibliographic metadata continue to read/list normally.

Missing structured metadata is represented as absent/needs metadata. It is not an error unless a user explicitly requests structured metadata for a SourceCard ID that does not exist.

The 4H-1 `update_source_card_metadata` workflow still updates only compact SourceCard fields.

## Readiness And Status Definitions

`structuredMetadataStatus` values:

- `not_started`
- `incomplete`
- `complete`
- `needs_review`

`apaReadiness` values:

- `not_ready`
- `candidate_ready`
- `needs_review`
- `final_verified`

4H-3 recognizes but blocks `final_verified` because APA-final verification remains future human academic review.

Important separation:

- `citationReadiness: ready` means basic human-confirmed compact metadata.
- `structuredMetadataStatus: complete` means structured fields have been entered sufficiently for the selected review context.
- `apaReadiness: candidate_ready` means a future APA formatter or validator may have enough structured data to preview an APA reference candidate.
- `apa_final_verified` is not implemented.

## No-Fabrication Policy

4H-3 does not fabricate:

- authors
- years
- publisher
- journal
- DOI
- URL
- page range
- APA citation text
- APA readiness

DOI and URL are saved as human-entered text only. No external verification is performed.

## APA-Final Exclusion

The app still has no APA generator, APA validator, citation manager, DOI lookup, or final academic review workflow. Any APA readiness shown in 4H-3 is not APA-final.

`apaFinalVerified` is returned as `false`.

## Downstream Non-Mutation Guarantee

Structured metadata upsert does not trigger or mutate:

- SourceDocument records
- MarketingTags
- SourceCard tag links
- KnowledgeCards
- DraftArtifacts
- export package state
- DOCX export
- AI request/response state
- parser provenance
- evidence traces

## QA Results

Sprint 4H-3 verification covers:

- migration creation
- insert/update for existing SourceCards
- failure for missing SourceCard ID
- safe read when structured metadata is absent
- compact SourceCard metadata unchanged after structured metadata upsert
- no duplicate structured metadata row after repeated upsert
- Source Library structured metadata editor visibility
- no-fabrication notices
- read-back verification
- APA readiness not APA-final messaging

## Remaining Limitations

- No source-type-specific structured metadata validator yet.
- No DOI or URL external verification.
- No APA reference formatter.
- No APA final review workflow.
- No structured author/editor arrays yet.
- `warnings` are stored as text for the MVP.

## Recommended Next Sprint

Recommended next sprint:

Sprint 4H-4 — Source-type-specific structured metadata validation and APA candidate readiness preview.

Keep 4H-4 deterministic and local. Do not add DOI lookup, web search, AI/API, APA finalizer, DOCX export changes, or downstream artifact mutation.
