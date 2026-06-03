# Human APA Verification Gate 4H-7

## Purpose

Sprint 4H-7 designs the human APA verification gate that must sit after APA Reference Candidate Preview and before any persisted verified APA reference artifact, DraftArtifact citation upgrade, DOCX export integration, final manuscript workflow, or future AI writing package consumes APA references.

This sprint is documentation/planning only. It does not implement the gate, add persistence, mutate UI, generate verified APA references, perform APA finalization, call AI/API, look up DOI data, search the web, or change DOCX export behavior.

ATP must not treat APA candidate previews as final academic references. The candidate preview is a helpful deterministic draft of reference parts, but it cannot prove source accuracy, APA punctuation, capitalization, italicization, source-type correctness, DOI/URL validity, or publication suitability. A human verification gate is required so the user explicitly inspects, corrects, accepts warnings, and chooses the verification scope before anything is stored as a verified reference artifact.

## Current Citation Workflow

### 4H-1: Human Basic Metadata Completion

Sprint 4H-1 added a human metadata completion path for compact saved SourceCard fields:

- title
- authors
- year
- citation text
- metadata status
- citation readiness

This supports basic SourceCard metadata review only. `citationReadiness: ready` is not APA-final and does not prove structured APA completeness.

### 4H-2: Structured Metadata Contract

Sprint 4H-2 documented structured bibliographic metadata fields needed for source-type-aware citation work, including publisher, journal, container title, volume, issue, page range, DOI, URL, access date, metadata source, APA readiness, and human verification timestamp.

4H-2 separated compact metadata confirmation from structured metadata completeness, APA candidate readiness, and APA-final verification.

### 4H-3: Structured Metadata Persistence

Sprint 4H-3 added `source_card_bibliographic_metadata`, a separate persistence table linked to saved SourceCards.

The command boundary stores and reads human-entered structured metadata only. It does not mutate compact SourceCards, SourceDocuments, MarketingTags, KnowledgeCards, DraftArtifacts, parser provenance, traces, export state, or AI state.

### 4H-4: Structured Metadata Readiness Validator

Sprint 4H-4 added a pure readiness validator for saved/read-back structured metadata. It returns source type, required fields, present fields, missing fields, blockers, warnings, readiness status, and an explicit no-APA-final notice.

The validator does not generate APA references.

### 4H-5: APA Reference Candidate Contract

Sprint 4H-5 defined the future APA Reference Candidate contract. It documented a candidate object as non-final, derived from human-entered or verified metadata, source-type aware, blocker/warning driven, and always requiring human academic review.

### 4H-6: APA Reference Candidate Preview MVP

Sprint 4H-6 implemented a derived-only APA Reference Candidate Preview mapper and compact Source Library panel.

The preview is deterministic and local. It can show candidate reference text only when readiness allows it, but every candidate remains:

- `notFinal: true`
- `humanReviewRequired: true`
- `finalVerificationStatus: not_reviewed`
- `generatedBy: deterministic_local_formatter`

## Verification States

Future human verification should use four explicit states.

### `not_reviewed`

The default state for every APA Reference Candidate Preview. A candidate in this state has not been checked by a human academic reviewer.

No downstream workflow may treat this as a verified reference.

### `needs_correction`

The reviewer has inspected the candidate and found metadata, source-type, APA formatting, or suitability problems that must be corrected before use.

This state should preserve reviewer notes and unresolved checklist items. It should not overwrite compact SourceCard metadata or structured metadata automatically.

### `verified_for_internal_use`

The reviewer has confirmed that the reference is good enough for private drafting, internal notes, teaching preparation, or non-publication workflow context.

This is not necessarily publication-ready. It should not be treated as final APA verification. DraftArtifact review and export readiness may later consume this as an internal-use signal only.

### `apa_final_verified`

The reviewer explicitly verifies the reference against APA 7 expectations and trusted source metadata for final academic use.

No automated process may set `apa_final_verified`. A deterministic formatter, AI-assisted candidate, DOI lookup, web search, or parser output may never mark final verification by itself.

## Human Verification Checklist

Before a candidate can be marked `verified_for_internal_use` or `apa_final_verified`, the user must review the following checklist.

Required checklist items:

- Author order and spelling are correct.
- Author/editor roles are correct.
- Year/date is accurate, including no-date policy if applicable.
- Title is accurate.
- Title capitalization is appropriate for APA 7 and source type.
- Source type is correct.
- Journal, book, publisher, institution, or container title is correct.
- Volume, issue, edition, report number, and page range are correct when applicable.
- DOI is correct when present.
- URL is correct and stable when present.
- Access date is present only when required.
- Missing field warnings have been resolved or deliberately accepted.
- APA punctuation, italicization, capitalization, parentheses, and separators have been checked.
- DOCX parser page numbers were not used as publication page ranges.
- Candidate is suitable either for internal use or final academic output.
- Reviewer confirms no fabricated metadata was added.

The checklist must support three outcomes per item:

- `confirmed`
- `needs_correction`
- `not_applicable`

Warnings should require explicit acceptance when they remain unresolved.

## Proposed Verification Artifact Contract

Future DTO name:

`SourceCardApaReferenceReview`

Suggested fields:

```ts
type ApaReferenceVerificationStatus =
  | "not_reviewed"
  | "needs_correction"
  | "verified_for_internal_use"
  | "apa_final_verified";

type ApaReferenceVerificationScope =
  | "internal_drafting"
  | "teaching_preparation"
  | "publication_ready";

interface ApaReferenceChecklistItem {
  key:
    | "author_order_spelling"
    | "author_editor_roles"
    | "year_date_accuracy"
    | "title_accuracy"
    | "title_capitalization"
    | "source_type_correctness"
    | "container_publisher_correctness"
    | "volume_issue_edition_page_range"
    | "doi_url_access_date"
    | "missing_warning_resolution"
    | "apa_formatting"
    | "docx_page_number_exclusion"
    | "suitability_scope"
    | "no_fabricated_metadata";
  label: string;
  state: "confirmed" | "needs_correction" | "not_applicable";
  reviewerNote?: string | null;
}

interface SourceMetadataSnapshot {
  compactSourceCard: {
    sourceCardId: string;
    title: string;
    authors: string | null;
    year: string | null;
    sourceType: string;
    citationText: string;
    metadataStatus: string;
    citationReadiness: string;
    updatedAt: string;
  };
  structuredBibliographicMetadata: {
    publisher: string | null;
    journal: string | null;
    containerTitle: string | null;
    edition: string | null;
    volume: string | null;
    issue: string | null;
    pageRange: string | null;
    doi: string | null;
    url: string | null;
    accessDate: string | null;
    metadataSource: string;
    structuredMetadataStatus: string;
    apaReadiness: string;
    humanVerifiedAt: string | null;
    updatedAt: string;
  } | null;
  apaCandidatePreview: {
    sourceType: string;
    candidateStatus: string;
    candidateReferenceText: string | null;
    warnings: string[];
    blockers: string[];
    missingFields: string[];
    generatedBy: string;
    notFinal: true;
  };
}

interface SourceCardApaReferenceReview {
  reviewId: string;
  sourceCardId: string;
  apaCandidateId: string;
  candidateFingerprint: string;
  candidateReferenceText: string;
  verifiedReferenceText: string;
  verificationStatus: ApaReferenceVerificationStatus;
  verificationChecklist: ApaReferenceChecklistItem[];
  reviewerNote: string | null;
  humanReviewedAt: string | null;
  verificationScope: ApaReferenceVerificationScope;
  apaStyleVersion: "APA 7";
  sourceMetadataSnapshot: SourceMetadataSnapshot;
  warningsAccepted: string[];
  blockersResolved: string[];
  createdAt: string;
  updatedAt: string;
}
```

Contract rules:

- `candidateReferenceText` is the original candidate text being reviewed.
- `verifiedReferenceText` is human-edited or human-confirmed text.
- `verifiedReferenceText` must not be auto-filled as final without explicit user action.
- `verificationStatus` defaults to `not_reviewed`.
- `apa_final_verified` requires all required checklist items to be confirmed or explicitly marked not applicable.
- `apaCandidateId` may be a deterministic candidate fingerprint until candidate previews become persisted artifacts.
- `sourceMetadataSnapshot` should capture the metadata state used for verification so later metadata edits can invalidate or warn about stale reviews.

## Persistence Strategy

Three future strategies are possible.

### Option 1: `source_card_apa_reference_reviews`

Create a table dedicated to human review decisions.

Pros:

- Models the gate as a review event.
- Can store checklist states, reviewer notes, accepted warnings, and blocker resolution.
- Keeps compact SourceCard fields stable.
- Supports multiple review passes over time.
- Makes it easier to invalidate stale reviews when metadata changes.

Cons:

- Requires a migration and read/list commands.
- Requires a clear latest-review policy if multiple reviews exist.
- Requires careful UI language so `verified_for_internal_use` is not mistaken for final.

### Option 2: `source_card_apa_reference_artifacts`

Create a table dedicated to saved verified reference artifacts.

Pros:

- Cleanly stores the final verified reference text.
- Useful when downstream DraftArtifact/export flows need a stable reference object.
- Easier to list "usable references" later.

Cons:

- Risks making candidate text look authoritative too early.
- Needs a separate review trail anyway.
- Harder to represent `needs_correction` without mixing artifact and workflow state.

### Option 3: Extend Existing `source_card_bibliographic_metadata`

Add verification fields to the existing structured metadata table.

Pros:

- Fewer tables.
- Directly attached to the structured metadata record.

Cons:

- Mixes metadata facts with review workflow.
- Can overwrite or obscure review history.
- Harder to snapshot candidate text and accepted warnings.
- Higher risk of treating metadata completeness as APA verification.

### Recommendation

Use a separate `source_card_apa_reference_reviews` table for the first MVP.

Do not overwrite SourceCard `citationText` automatically. Do not treat candidate preview as a verified artifact. Store a metadata snapshot with the review so later changes can make the review stale or require re-verification.

Later, once the review gate is stable, a separate `source_card_apa_reference_artifacts` table may be added for the latest verified reference object used by DraftArtifact/export flows.

## UI Workflow Plan

Future Source Library UI should show the verification gate after APA Candidate Preview.

Planned flow:

```text
APA Candidate Preview
-> Human verification checklist
-> editable verified reference text
-> verification status selection
-> warning acceptance
-> explicit save verified reference action
-> read-back verification panel
```

UI requirements:

- Show candidate status and block verification when candidate has blockers.
- Show candidate text separately from editable verified reference text.
- Display `not APA-final` warning until final verification is explicitly selected and checklist rules allow it.
- Require checklist completion before `verified_for_internal_use`.
- Require stricter checklist completion before `apa_final_verified`.
- Require a reviewer note when warnings are accepted or candidate needs correction.
- Show accepted warnings and unresolved blockers.
- Show whether the review scope is internal drafting, teaching preparation, or publication-ready.
- Display read-back verification after save.
- Avoid save/export/final-manuscript actions in the same panel.

Blocked behavior:

- If the APA candidate preview is `blocked`, `needs_metadata`, or `needs_human_review`, the verification save action should be disabled.
- The UI should direct the user back to structured metadata editing and candidate regeneration.

Warning behavior:

- If the candidate has warnings but no blockers, the user may save `verified_for_internal_use` only after accepting warnings.
- `apa_final_verified` should require all warnings to be resolved or explicitly accepted with reviewer notes.

## Downstream Integration Boundary

Sprint 4H-7 does not integrate downstream.

Future downstream rules:

### DraftArtifact Citation Review

DraftArtifact review may consume `verified_for_internal_use` to reduce internal citation warnings. It should require `apa_final_verified` before treating references as publication-ready.

### DOCX MVP Export

DOCX MVP export may include verified references only after a saved review artifact exists. Export should continue to display manual verification warnings unless every included reference is `apa_final_verified`.

### Future Final Manuscript Export

Final manuscript export should require `apa_final_verified` references or a deliberate final-review override with explicit warnings. Candidate previews and internal-use reviews are insufficient.

### Future AI Writing Request Packages

AI request packages may include verified reference text only as context. AI must not create, correct, or finalize citations. AI output must not change verification status.

## QA Strategy

Future QA should cover:

- blocked candidates cannot be verified
- candidates with missing metadata route back to metadata completion
- user can mark a candidate as `needs_correction`
- user can save `verified_for_internal_use` only after required checklist completion
- no automated path can set `apa_final_verified`
- final verification requires explicit user selection and complete checklist
- verified artifact read-back shows review ID, SourceCard ID, status, scope, reviewer note, and snapshot summary
- compact SourceCard `citationText` is not overwritten automatically
- structured metadata is not mutated by the review save
- no downstream MarketingTag, KnowledgeCard, DraftArtifact, export, or AI mutation happens
- no fabricated reference elements appear
- stale review warning appears if source metadata changes after verification

Rust persistence tests, if implemented later, should cover:

- save requires existing SourceCard
- save rejects blocked candidate status
- save rejects `apa_final_verified` without complete checklist
- repeated save is idempotent or versioned according to the chosen table policy
- read/list works without requiring DraftArtifact/export tables

Playwright UI tests should cover:

- verification gate panel visibility
- disabled save for blocked candidate
- checklist interaction
- warning acceptance
- read-back panel
- not-final warnings
- no export action exposed

## Recommended Next Sprint

Recommended next implementation sprint:

Sprint 4H-8 - Human APA Verification Gate MVP

Constraints:

- explicit user action only
- separate `source_card_apa_reference_reviews` persistence table
- no automatic `apa_final_verified`
- no downstream integration yet
- no DOCX export changes
- no AI/API
- no DOI lookup or web search
- no automatic metadata extraction
- no fabricated citation data
- no SourceCard compact metadata overwrite

The safest 4H-8 MVP should implement only the save/read/list boundary for human review artifacts, plus a compact Source Library verification panel. DraftArtifact citation upgrades and export integration should wait until the review artifact is proven stable.
