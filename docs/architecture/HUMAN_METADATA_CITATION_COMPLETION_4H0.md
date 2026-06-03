# Human Metadata & Citation Completion Workflow Inspection 4H-0

## Purpose

Sprint 4H-0 inspects the current SourceCard metadata and citation-readiness workflow and defines the safest next implementation path for a human metadata completion workflow.

The goal is to move ATP Knowledge Studio toward an academically usable source-first research-to-writing workflow. This document intentionally avoids adding another preview-only panel. The next useful product step is a human-reviewed metadata completion path that can improve SourceCard readiness without fabricating citation data.

## Files Inspected

- `src/types/domain.ts`
- `src/lib/sources/ParsedDocxSourceCardCandidateMapper.ts`
- `src/lib/sources/ParsedDocxSourceCardSaveValidator.ts`
- `src/lib/sources/SourceValidation.ts`
- `src/lib/persistence/SourceCardPersistenceReadinessMapper.ts`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `src-tauri/migrations/002_add_source_cards.sql`
- `src-tauri/src/vault_db.rs`
- `src/features/source-library/SourceLibraryPage.tsx`
- `src/features/source-library/components/ManualSourceCardForm.tsx`
- `src/features/source-library/components/SourceCardCandidatePreview.tsx`
- `src/features/source-library/components/PersistenceSaveCandidatePreview.tsx`
- `src/lib/sources/ParsedDocxKnowledgeCardSaveValidator.ts`
- `src/lib/sources/ParsedDocxDraftArtifactReviewMapper.ts`
- `src/lib/sources/ParsedDocxExportPackageMapper.ts`
- `src/lib/ai/AiEnhancementRequestPackageMapper.ts`
- `tests/e2e/source-library.spec.ts`

## Current Metadata Fields

### Mock/editor SourceCard fields

The local mock/editor `SourceCard` type supports:

- `sourceId`
- `title`
- `authors`
- `year`
- `sourceType`
- `publisherOrJournal`
- `citationText`
- `apa7Status`
- `reliabilityLevel`
- `notes`

These fields are editable in the current Source Library mock SourceCard editor and manual SourceCard form, but those areas are explicitly local mock state only.

### SourceCard save candidate fields

The persisted-path `SourceCardSaveCandidate` currently supports:

- `candidateId`
- `title`
- `sourceType`
- `fileReference`
- `citationText`
- `metadataStatus`
- `citationReadiness`
- `validationStatus`
- `review`
- `derivedFrom`
- `createdFrom`
- `notPersisted`

It does not carry separate author/year fields. Author/year are passed separately in `SaveSourceCardRequest`.

### Saved SourceCard fields

The SQLite-backed saved SourceCard supports:

- `sourceCardId`
- `sourceDocumentId`
- `title`
- `authors`
- `year`
- `sourceType`
- `citationText`
- `metadataStatus`
- `citationReadiness`
- `fileReference`
- `reviewStatus`
- `createdAt`
- `updatedAt`

## Current Persistence Support

Migration `002_add_source_cards.sql` creates `source_cards` with columns for:

- `title`
- `authors`
- `year`
- `source_type`
- `citation_text`
- `metadata_status`
- `citation_readiness`
- `file_reference`
- `review_status`
- candidate linkage and timestamps

The Rust `save_source_card_candidate` command can insert or update these fields through `ON CONFLICT(id) DO UPDATE`. It accepts optional `authors` and `year` values. It validates supported metadata/citation states and warns when authors/year remain unresolved.

There is no dedicated metadata-completion command yet. Reusing the existing save command as an update path is possible for current columns, but it is not ideal as a user-facing completion boundary because it is named and shaped around saving a candidate.

## Missing Metadata Needed For APA-Style Citation Readiness

The current persisted schema is missing structured fields commonly needed for APA-oriented readiness:

- Publisher or journal name as a first-class persisted field.
- DOI.
- URL.
- Edition.
- Volume.
- Issue.
- Page range.
- Chapter or section title when the source is a chapter-like item.
- Retrieval date when relevant.
- Work/container title for chapters, proceedings, or web pages.
- Source subtype beyond broad `DOCX`, `PDF`, `MD`.
- Human confirmation flags per field.
- Metadata provenance per field.
- Citation style review timestamp/reviewer.

Current `citationText` can store a human-written APA-like string, but without structured supporting fields, the app cannot reliably mark a SourceCard as APA-ready beyond a human assertion.

## Fields That Can Be Edited Safely Now

Without a database migration, the following persisted fields can be edited safely if a dedicated update command is added or the existing save/upsert path is carefully adapted:

- `title`
- `authors`
- `year`
- `source_type`
- `citation_text`
- `metadata_status`
- `citation_readiness`
- `file_reference`
- `review_status`

Safe editing rules:

- Edits must be explicit user actions.
- Empty author/year should be allowed only with `metadata_status: needs_metadata` or `citation_readiness: needs_review`.
- `citation_readiness: ready` should require human confirmation, non-placeholder citation text, title, author, year, and no known untrusted page-number dependency.
- The workflow must not generate APA text automatically.

## Fields Requiring Migration Or Rust Command Changes

### Require DB migration

- `publisher_or_journal`
- `doi`
- `url`
- `edition`
- `volume`
- `issue`
- `page_range`
- `container_title`
- `source_subtype`
- per-field confirmation/provenance fields

### Require Rust command changes

- Dedicated `update_source_card_metadata` command.
- Validation for the proposed metadata completion statuses.
- Optional read/list projection for new structured fields.
- Tests for incomplete, needs-review, citation-ready, and rejected transitions.

### Require TypeScript changes

- Typed metadata completion request/response DTOs.
- A pure readiness mapper for current and future fields.
- Compact UI form for human metadata completion.
- Source Library QA for explicit save/update and read-back verification.

## Proposed Metadata Completion Workflow

1. User saves a parsed-DOCX SourceDocument.
2. User saves the parsed-DOCX SourceCard in `needs_metadata` / `needs_review` state.
3. Source Library shows a compact Human Metadata Completion form attached to the saved SourceCard.
4. User manually enters or edits supported metadata fields.
5. User confirms that fields are human-provided and not inferred by the app.
6. The app validates readiness without generating citation data.
7. User explicitly saves the metadata update.
8. The app reads the saved SourceCard back and updates readiness summaries.
9. Downstream KnowledgeCards, DraftArtifact review, export package, and AI request readiness consume the updated saved SourceCard status.

Recommended first implementation should use current schema fields only:

- `title`
- `authors`
- `year`
- `citationText`
- `sourceType`
- `metadataStatus`
- `citationReadiness`
- `reviewStatus`

Publisher, DOI, URL, and richer APA support should wait for a small migration sprint.

## Proposed Review Statuses

- `incomplete`: required metadata is missing or still placeholder text.
- `needs_review`: metadata exists but citation readiness or human confirmation is incomplete.
- `citation_ready`: human-confirmed metadata and citation text are present, non-placeholder, and ready for downstream use with warnings about untrusted DOCX page numbers.
- `rejected`: user marks the SourceCard metadata as unusable or invalid.

Mapping to current persisted statuses:

- `incomplete` maps to `metadata_status: needs_metadata` and `citation_readiness: needs_review`.
- `needs_review` maps to `metadata_status: ready` or `needs_metadata` with `citation_readiness: needs_review`.
- `citation_ready` maps to `metadata_status: ready` and `citation_readiness: ready`.
- `rejected` maps to `review_status: rejected`; saves should block or keep downstream generation blocked.

## No-Fabrication Rules

The metadata completion workflow must enforce:

- No fabricated author.
- No fabricated year.
- No fabricated title.
- No fabricated publisher.
- No fabricated DOI/URL.
- No fabricated APA citation.
- No fabricated page number.

The app may store user-entered metadata, but it must label it as human-provided and require explicit confirmation before readiness changes.

## Human Confirmation Rules

Before a SourceCard can become `citation_ready`, the user must confirm:

- Title was verified by the user.
- Author(s) were verified by the user.
- Year was verified by the user.
- Citation text was written or confirmed by the user.
- Citation text is not an app-generated final APA citation.
- DOCX page numbers remain untrusted.
- Evidence should use chunk references such as `docx:pN`, not fabricated page numbers.

If DOI/URL/publisher fields are added later, each should have its own human confirmation/provenance status.

## Downstream Effects

### SourceCard readiness

Metadata completion should move SourceCard readiness from `needs_metadata` toward `citation_ready` only after explicit human confirmation. Rejected SourceCards should block downstream saves/generation.

### KnowledgeCard citation readiness

Saved parsed-DOCX KnowledgeCards currently remain `needs_review`. After SourceCard metadata completion, KnowledgeCards can become eligible for citation-readiness re-evaluation, but they should not automatically become `ready`. They still need trace review and academic review.

### DraftArtifact review gate

The DraftArtifact review gate currently warns that citation placeholders are not final APA. Once SourceCard metadata is human-confirmed, the gate can reduce citation metadata warnings, but section-level citation placeholders and trace coverage must still be reviewed.

### DOCX export warning status

DOCX MVP export should continue to warn that exported output is not APA-final unless SourceCard metadata, section citations, and manual export verification have all passed. DOCX page-number warnings remain regardless of metadata completion.

### Future AI request package readiness

AI request package readiness should improve only when saved SourceCard metadata is human-confirmed and citation readiness is not blocked. AI must still be prevented from fabricating citations, authors, years, DOI/URL values, cases, quotes, or page numbers.

## Recommended Next Sprint Implementation Path

Recommended Sprint 4H-1:

**Human SourceCard Metadata Completion MVP**

Scope:

- Add a pure TypeScript readiness mapper for saved SourceCard metadata completion using current schema fields.
- Add a compact Source Library metadata completion form for saved parsed-DOCX SourceCards.
- Add a dedicated Rust command `update_source_card_metadata` using current columns only.
- Persist explicit human-entered `authors`, `year`, `citationText`, `metadataStatus`, `citationReadiness`, and `reviewStatus`.
- Read/list verify updated SourceCard metadata.
- Keep publisher/DOI/URL out of persistence until a later migration sprint.
- Add Playwright coverage for human update, explicit save, read-back, and unchanged no-fabrication notices.
- Add Rust tests for valid update, rejected update, blocked citation readiness, and unresolved author/year warnings.

Recommended Sprint 4H-2:

**Structured Citation Metadata Migration**

Scope:

- Add columns for publisher/journal, DOI, URL, and source subtype.
- Add per-field human confirmation/provenance if needed.
- Update DTOs, commands, and read/list views.
- Extend readiness mapper and QA.

## Risks And Scope Boundaries

Risks:

- Marking `citation_ready` too early would make downstream export and AI readiness misleading.
- Reusing the candidate save command for metadata updates may blur create/update boundaries.
- Adding DOI/URL/publisher without schema support would force lossy storage inside `citationText`.
- Manual citation text may still be APA-incomplete even when author/year/title are present.
- DOCX page numbers remain untrusted and cannot be fixed by metadata completion.
- UI density in Source Library is already high; metadata completion should be compact and task-focused.

Scope boundaries:

- No AI/API calls.
- No generated prose.
- No APA finalizer.
- No automatic metadata extraction.
- No automatic SourceCard mutation.
- No automatic DraftArtifact mutation.
- No DOCX export changes.
- No PDF/OCR.
- No final manuscript persistence.
- No Source Library redesign.
- No unrelated UI polish.

## Implementation Decision For 4H-0

No mapper or UI was added in 4H-0. The inspection shows the most valuable next step is not another preview panel, but a real human metadata update boundary with persistence/read-back verification. A mapper alone would be low risk, but without an update command and minimal UI it would not move the workflow toward academically usable output.
