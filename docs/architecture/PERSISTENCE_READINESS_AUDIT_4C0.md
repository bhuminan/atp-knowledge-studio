# Sprint 4C-0 Persistence Readiness Audit

## Scope

This audit prepares ATP Knowledge Studio for future real persistence without implementing persistence. Sprint 4C-0 is documentation and contract-readiness only.

No SourceDocument, SourceCard, Knowledge Card, tag, draft, vault, database, Obsidian, storage, AI/API, PDF parser, DOCX export, or workflow state is saved in this sprint.

## Current Pipeline State

The current Source Library pipeline is preview-only and runs through these stages:

1. Local file metadata preview from a pasted PDF/DOCX path.
2. DOCX text extraction preview through the Tauri command boundary.
3. SourceDocument Candidate Preview from extracted text and file metadata.
4. Mock human review state for the SourceDocument candidate.
5. Candidate Validation Summary.
6. Mock Vault Save Preview for the SourceDocument candidate.
7. SourceCard Candidate Preview.
8. Marketing taxonomy tag suggestion and local tag review state.
9. Knowledge Card Candidate Preview for Concept, Evidence, Quote, Case, and WritingAngle candidates.
10. Local Knowledge Card review and validation.
11. Mock Knowledge Vault Save Preview.
12. Draft Input Package Preview.
13. Source-to-Draft Mock Preview.
14. Draft Section Mock Preview.
15. Draft Quality and Citation Risk Review Preview.
16. Pipeline Readiness Summary Preview.

All stages remain local, preview-only, and review-gated.

## Candidate Objects

Current candidate objects are intentionally incomplete and should not be treated as saved domain records.

- SourceDocument candidate: `Partial<SourceDocument>` created by `documentExtractionToSourceDocumentCandidate`.
- SourceCard candidate: `SourceCardCandidatePreviewModel` created by `createSourceCardCandidatePreview`.
- Marketing tag suggestions: `MarketingTagSuggestion[]` with separate local review state.
- Knowledge Card candidates: mapper-specific candidates for concept, evidence, quote, case, and writing angle previews.
- Draft Input Package: `DraftInputPackagePreview`.
- Source-to-Draft Preview: `SourceToDraftMockPreview`.
- Draft Section Mock Preview: `DraftSectionMockPreview`.
- Draft Quality Review: `DraftQualityReviewPreview`.
- Pipeline Readiness Summary: `PipelineReadinessSummaryPreview`.

These shapes are useful for review, but they are not stable persistence contracts yet.

## Future Saved Objects

Future real persistence should introduce explicit saved objects instead of reusing preview objects directly.

- SavedSourceDocument: verified metadata, local file provenance, extraction status, parser version, created/updated timestamps, and human review audit.
- SavedSourceCard: canonical source metadata, citation metadata status, APA readiness, source document link, and approved tags.
- SavedKnowledgeCard: card type, source card link, evidence body, trace references, citation readiness, review status, and vault metadata.
- SavedMarketingTagReview: normalized tag ID, label, taxonomy tier, review status, reviewer, and timestamp.
- SavedDraftInputPackage: immutable snapshot of approved source and knowledge inputs selected for drafting.
- SavedDraftPreview or DraftPlan: future structured draft planning object, not final prose.

## Required Save Boundaries

Persistence should be introduced behind explicit human-controlled save boundaries:

1. Save SourceDocument after extraction preview, candidate validation, and human approval.
2. Save SourceCard only after metadata review clarifies authors, year, publication venue, and citation text.
3. Save tag review state only after tag IDs are normalized and duplicate handling is defined.
4. Save Knowledge Cards only after candidate-level approval and trace checks.
5. Save Draft Input Package only as a snapshot of already approved SourceCard and Knowledge Card records.
6. Save draft previews or draft plans only after the Source-to-Draft and quality review gates are explicit.

No future save boundary should silently create downstream records.

## Persistence Blockers

The current code reveals these blockers before real persistence:

- Stable IDs are still preview-derived, for example `candidate-source-card-*`, `mock-draft-*`, and mapper-generated candidate IDs.
- SourceDocument candidates are `Partial<SourceDocument>`, so required persisted fields are not guaranteed.
- SourceCard candidate metadata status remains `needs_metadata` for real citation use.
- Author, year, DOI/URL, publisher, journal, and APA 7 fields remain placeholders.
- DOCX extraction traces use `pageNumber: 0` and chunk references such as `docx:pN`; page numbers are not real.
- Extraction traces are adequate for review, but not enough for final citation pinpointing.
- Rust and TypeScript extraction DTOs are manually mirrored, creating contract drift risk.
- Marketing tag review state is held as `Record<string, MarketingTagReviewStatus>` in React state, not normalized.
- Knowledge Card review state is held as `Record<string, status>` in React state, not normalized.
- Knowledge Card candidate shapes differ from likely future saved Knowledge Card records.
- Mock vault previews describe future payloads but do not yet define immutable persisted payload schemas.
- Draft quality and pipeline readiness summaries are preview analytics, not saved workflow audit records.
- The Source Library page owns many local states and derived candidate objects; persistence should avoid saving transient UI state directly.

## Contract Risks

Key contract risks to resolve before persistence:

- DTO drift between Rust structs in `src-tauri/src/lib.rs` and TypeScript interfaces in `src/lib/sources/LocalDocumentExtraction.ts` / `src/types/domain.ts`.
- Preview candidate IDs may change if mapper logic changes, so they are not safe as durable primary keys.
- `ExtractionTrace.pageNumber` currently cannot represent DOCX uncertainty cleanly because it is numeric and uses `0` for unknown pages.
- `DocumentSegment.pageStart` and `pageEnd` also use numeric `0` for DOCX unknown pages.
- `SourceDocumentType` is uppercase while intake source types elsewhere are lowercase, requiring consistent normalization at save boundaries.
- Citation readiness and metadata readiness are split across several preview models.
- Tag suggestions contain taxonomy terms, extended candidates, and free suggested tags in one preview flow; future persistence needs separate saved taxonomies and tag review records.
- Knowledge Card candidates are generated heuristically from a small number of segments and should not be persisted without explicit human confirmation.
- Draft Section Mock Preview contains deterministic mock prose and must not be mistaken for generated or final manuscript text.
- Pipeline Readiness Summary is an advisory view and should not become a hidden workflow state machine without a persistence design.

## Recommended Sprint 4C-1 Scope

The smallest safe next sprint is to add persistence contract types and save-boundary DTOs only.

Recommended 4C-1 work:

- Add explicit `SavedSourceDocumentDraft` or `SourceDocumentSaveCandidate` type.
- Add explicit `SourceDocumentSaveReadiness` type with blockers and warnings.
- Add a pure mapper from approved SourceDocument candidate preview to a save candidate.
- Add stable provenance fields: original file intake ID, local path reference policy, parser version, extraction ID, trace policy, and review timestamp.
- Add a preview-only Save Candidate panel if needed, but keep the save action disabled or absent.
- Add automated QA that confirms save candidate preview appears and no persistence occurs.

4C-1 should not add database, storage, Obsidian, automatic record creation, or save buttons that imply real persistence.

## Explicit No-Save Decision

Sprint 4C-0 does not implement persistence. The current app remains preview-only:

- No SourceDocument is saved.
- No SourceCard is saved.
- No Knowledge Card is saved.
- No marketing tag review is saved.
- No draft input package is saved.
- No draft preview is saved.
- No workflow state is saved.

The next implementation should preserve this boundary until explicit persistence contracts and save commands are reviewed.
