# SourceSection + ContentChunk Command Boundary 4R-9

## 1. Purpose

Sprint 4R-9 adds the first narrow backend persistence command boundary for the 4R-8 `source_sections` and `content_chunks` schema.

This is not full Deep Intake automation. It only lets a reviewed candidate package save and read back SourceSection and ContentChunk records linked to an existing SourceDocument.

## 2. Commands

Rust/Tauri commands:

- `save_source_section_content_chunk_candidates`
- `list_source_sections_for_document`
- `list_content_chunks_for_document`

TypeScript bridge wrappers:

- `saveSourceSectionContentChunkCandidates`
- `listSourceSectionsForDocument`
- `listContentChunksForDocument`

These wrappers are not wired to active UI save buttons in 4R-9.

## 3. Validation Boundary

The save command rejects when:

- `source_document_id` is missing.
- The linked SourceDocument does not exist.
- `explicit_user_approval` or `reviewer_confirmed` is not true.
- Sections or chunks are empty.
- A section is missing `id`, `title`, `section_order`, or `trace_label`.
- A chunk is missing `id`, `source_section_id`, `chunk_order`, or `trace_label`.
- A chunk references a SourceSection outside the same package.
- `trust_state`, `review_status`, `language_profile`, or `page_number_trusted` is invalid.
- A package repeats `section_order`.
- A package repeats `chunk_order` inside the same section.
- The package includes unsupported downstream entity arrays such as KnowledgeUnits, EvidenceUnits, CaseUnits, QuoteUnits, TeachingUnits, WritingAngles, or UsageLedger records.

## 4. Transaction And Read-Back

The save command writes SourceSections and ContentChunks in one transaction.

After commit, it reads back all saved sections and chunks for the SourceDocument and verifies:

- saved section count
- saved chunk count
- section ids
- chunk ids
- `source_document_id`
- `section_order`
- `chunk_order`
- `source_section_id`
- `trace_label`
- `trust_state`
- `review_status`

The command returns `failed_read_back` if critical fields do not match.

## 5. Idempotency

4R-9 uses deterministic candidate ids as the MVP idempotency boundary.

If the same package is submitted again and all persisted SourceSection and ContentChunk critical fields match, the command returns `already_exists` with read-back verification.

If existing rows for the SourceDocument do not match the submitted package, the command rejects the save rather than partially merging records.

## 6. Audit Behavior

4R-9 does not create a new audit table.

The command returns:

- `auditEventsWritten: false`
- an audit limitation explaining that no SourceSection/ContentChunk audit table exists yet
- read-back verification status as the safety signal

This avoids writing misleading audit rows to unrelated SourceDocument or metadata audit tables.

## 7. Explicit Non-Goals

4R-9 does not:

- Wire UI save buttons.
- Implement parser expansion.
- Implement PDF extraction.
- Implement OCR.
- Wire AI/provider behavior.
- Create SourceCards.
- Create KnowledgeUnits.
- Create EvidenceUnits.
- Create CaseUnits.
- Create QuoteUnits.
- Create TeachingUnits.
- Create WritingAngles.
- Create UsageLedger records.
- Infer citation-ready.
- Infer APA-final.
- Add auto-save.
- Change Writer/export behavior.

## 8. Next Recommended Sprint

Next recommended sprint:

```text
4R-10 SourceSection/ContentChunk Save Preview UI
```

Before active UI wiring, the product should decide where the human approval gate appears and how preview packages make the transition from candidate state to persisted SourceSection/ContentChunk records.
