# APA Reference Candidate Contract 4H-5

## Purpose

Sprint 4H-5 defines the future APA Reference Candidate contract and preview boundary that will sit after structured bibliographic metadata readiness validation.

This sprint does not generate APA references. It does not add an APA formatter, APA finalizer, DOI lookup, citation web search, AI/API call, persistence mutation, or UI implementation.

ATP needs this contract before any APA generator because an authoritative-looking reference string can create academic risk if the app cannot prove which metadata fields were human-entered, which fields are missing, which source-type rules were applied, and whether a human academic reviewer has verified the result.

The intended sequence remains:

```text
Structured metadata persistence
-> Structured metadata readiness validator
-> APA Reference Candidate contract
-> APA Candidate Preview MVP
-> Human APA verification gate
-> Draft/export integration later
```

## Current Citation Workflow State

### 4H-1: Human Basic SourceCard Metadata Completion

Sprint 4H-1 added a narrow command for human updates to compact SourceCard metadata:

- title
- authors
- year
- citation text
- metadata status
- citation readiness

This supports basic metadata confirmation only. `citationReadiness: ready` means the compact fields have been reviewed enough for the current SourceCard workflow. It does not mean APA-ready or APA-final.

### 4H-2: Structured Bibliographic Metadata Contract

Sprint 4H-2 documented the need for structured bibliographic metadata separate from compact SourceCard fields. It identified source-type-specific metadata such as journal, publisher, container title, volume, issue, page range, DOI, URL, access date, metadata source, APA readiness, and human verification timestamp.

4H-2 established that compact citation text must not be treated as a complete APA reference.

### 4H-3: Structured Metadata Persistence

Sprint 4H-3 added `source_card_bibliographic_metadata` persistence linked to saved SourceCards. The persistence layer stores and reads human-entered structured metadata. It does not mutate compact SourceCards, SourceDocuments, MarketingTags, KnowledgeCards, DraftArtifacts, export state, parser provenance, or traces.

4H-3 recognizes `apaReadiness` values but blocks automated final verification. `apaFinalVerified` remains `false`.

### 4H-4: Structured Metadata Readiness Validator

Sprint 4H-4 added a pure readiness validator that evaluates saved/read-back structured metadata by source type. It returns required fields, present fields, missing fields, blockers, warnings, overall readiness, APA readiness interpretation, and a no-APA-final notice.

The readiness validator does not format references, normalize citation strings, perform lookup, or mark APA-final.

### Distinction Among Readiness States

- `basic_metadata_confirmed`: compact SourceCard metadata has been human reviewed through 4H-1.
- `structured_metadata_complete`: saved structured metadata has required source-type fields present.
- `apa_candidate_possible`: structured metadata appears complete enough to preview a future APA Reference Candidate, with warnings and human review still required.
- `apa_final_verified`: an explicit future human academic verification state. No automated step may set this state.

## APA Reference Candidate Concept

A future APA Reference Candidate is a non-final preview object derived only from human-entered or human-verified metadata.

It must be:

- derived from saved compact SourceCard metadata plus saved structured bibliographic metadata
- routed through the 4H-4 readiness result
- source-type aware
- transparent about required fields, missing fields, blockers, warnings, and metadata provenance
- marked as candidate-only
- never treated as APA-final
- always subject to human academic review

It must not:

- invent missing reference elements
- silently repair metadata
- infer source type from weak labels without review
- turn citation placeholders into final references
- use DOCX parser page numbers as publication page ranges
- save or mutate SourceCards or structured metadata in the preview step

## Proposed APA Reference Candidate DTO

The future DTO should be a derived preview object, not a persistence entity in the first MVP.

```ts
type ApaReferenceCandidateStatus =
  | "blocked"
  | "needs_metadata"
  | "candidate_preview_ready"
  | "needs_human_review";

type ApaReferenceGeneratedBy =
  | "deterministic_local_formatter"
  | "future_ai_assisted_candidate"
  | "human_entered_reference";

type ApaFinalVerificationStatus =
  | "not_reviewed"
  | "needs_correction"
  | "verified_for_internal_use"
  | "apa_final_verified";

interface ApaReferencePart {
  key:
    | "authors"
    | "year"
    | "title"
    | "containerTitle"
    | "journal"
    | "volume"
    | "issue"
    | "pageRange"
    | "publisher"
    | "doi"
    | "url"
    | "accessDate"
    | "sourceTypeLabel";
  label: string;
  value: string | null;
  source: "compact_source_card" | "structured_metadata" | "human_review_note";
  required: boolean;
  present: boolean;
  warning?: string;
}

interface ApaReferenceCandidate {
  sourceCardId: string;
  sourceType:
    | "academic_journal_article"
    | "book"
    | "book_chapter"
    | "report_white_paper"
    | "website_web_article"
    | "docx_manuscript_source_note"
    | "teaching_note"
    | "unknown_pending_review";
  candidateStatus: ApaReferenceCandidateStatus;
  inputMetadataSummary: {
    compactMetadataConfirmed: boolean;
    structuredMetadataStatus: string;
    apaReadiness: string;
    metadataSource: string | null;
    humanVerifiedAt: string | null;
  };
  requiredFields: string[];
  missingFields: string[];
  warnings: string[];
  blockers: string[];
  apaStyleVersion: "APA 7";
  referenceParts: ApaReferencePart[];
  candidateReferenceText: string | null;
  confidenceLevel: "low" | "medium" | "high";
  humanReviewRequired: true;
  finalVerificationStatus: ApaFinalVerificationStatus;
  generatedBy: ApaReferenceGeneratedBy;
  generatedAt: string | null;
  notes: string[];
}
```

`candidateReferenceText` is future-planned only. Sprint 4H-5 does not generate it.

`generatedBy` must distinguish a deterministic local formatter from any future AI-assisted candidate. If future AI is ever allowed, it must remain a candidate source only and cannot become a source of truth.

`finalVerificationStatus` must never default to `apa_final_verified`. The safe default is `not_reviewed`.

## Source-Type APA Requirements

### Academic Journal Article

Minimum required metadata:

- title
- authors
- year
- journal

Recommended metadata:

- volume
- issue
- page range
- DOI, or URL if required by the source context

Blockers:

- missing title, authors, year, or journal
- unknown source type masquerading as article
- request to use DOCX chunk/page refs as publication page range

Warnings:

- missing volume/issue
- missing page range
- missing DOI/URL

APA candidate preview should be allowed only when required fields are present and the readiness validator is not blocked. APA-final remains human review because article punctuation, journal title capitalization, DOI format, issue treatment, and page range accuracy must be verified.

### Book

Minimum required metadata:

- title
- authors or editors
- year
- publisher

Recommended metadata:

- edition when not first edition
- volume when part of a series
- DOI or URL when an online edition requires it

Blockers:

- missing title, authors/editors, year, or publisher

Warnings:

- missing edition confirmation
- uncertain author/editor role
- online book without DOI/URL when applicable

APA candidate preview should be allowed when the minimum fields are present. APA-final remains human review because edition rules, editor roles, title capitalization, and publisher naming can be source-specific.

### Book Chapter

Minimum required metadata:

- chapter title
- chapter authors
- year
- container title
- publisher

Recommended metadata:

- editors
- page range
- edition or volume when applicable
- DOI or URL when applicable

Blockers:

- missing chapter title, authors, year, container title, or publisher

Warnings:

- missing editor names
- missing page range
- missing edition/volume when applicable

APA candidate preview should be allowed only when the chapter and container are distinguishable. APA-final remains human review because chapter formatting depends on editor roles, container title, page range, edition, and source-specific publication details.

### Report / White Paper

Minimum required metadata:

- title
- authors or organization
- year/date
- publisher or issuing institution

Recommended metadata:

- report number
- DOI or URL
- access date only when required by policy or changing content

Blockers:

- missing title, author/organization, year/date, or publisher/institution

Warnings:

- missing DOI/URL
- uncertain publisher versus author organization
- missing report number when expected

APA candidate preview should be allowed when institutional authorship and issuing body are clear. APA-final remains human review because organization names, report numbers, and online retrieval rules vary.

### Website / Web Article

Minimum required metadata:

- title
- URL

Recommended metadata:

- author or organization
- publication date or reviewed no-date policy
- site/container title when different from author
- access date when content is designed to change

Blockers:

- missing title
- missing URL
- unknown source type treated as web source without review

Warnings:

- missing author/organization
- missing year/date
- missing access date when retrieval date may be needed
- unclear site title

APA candidate preview should be allowed only when the URL and title are present. APA-final remains human review because web citation rules depend on author/site identity, changing content, retrieval date policy, and URL stability.

### DOCX Manuscript / Source Note

Minimum required metadata:

- title
- source type explicitly classified as DOCX manuscript/source note

Recommended metadata:

- author or organization when known
- year/date when known
- local file provenance retained through SourceDocument
- human note explaining intended citation use

Blockers:

- missing title
- attempt to treat unclassified DOCX notes as published academic sources
- attempt to use DOCX parser page numbers as publication page range

Warnings:

- author missing
- year/date missing
- DOCX source notes are not APA-ready by default
- DOCX page numbers remain untrusted

APA candidate preview should be restricted. It may preview an internal-use source note only when explicitly classified by a human. APA-final remains human review because a local DOCX is not automatically a published source.

### Teaching Note

Minimum required metadata:

- title

Recommended metadata:

- author or institution
- year/date
- course, publisher, or institutional context
- URL or local provenance when applicable

Blockers:

- missing title
- attempt to cite a private or internal teaching note as a public academic source without review

Warnings:

- missing author/institution
- missing year/date
- missing institution/publisher context
- external citability is uncertain

APA candidate preview should be allowed only as an internal-use candidate unless the reviewer confirms the teaching note is externally citable. APA-final remains human review because teaching notes often have restricted circulation and ambiguous citation status.

### Unknown / Pending Review

Minimum required metadata:

- title or review label
- source type review decision

Recommended metadata:

- any known authorship, date, provenance, and notes

Blockers:

- source type is unknown
- missing title/review label
- any request to produce APA candidate text before classification

Warnings:

- source-type-specific requirements cannot be evaluated

APA candidate preview should not be allowed. Human source-type review must happen first. APA-final remains unavailable.

## Readiness Transition Policy

The future APA Reference Candidate mapper should consume the 4H-4 readiness result as its first gate.

Recommended transitions:

- `not_started`: block candidate preview. Ask for structured bibliographic metadata.
- `needs_metadata`: block candidate preview. Display missing required fields.
- `incomplete`: block or hold as needs metadata until the user marks structured metadata complete.
- `structured_complete`: allow reference parts preview and maybe candidate text preview if no source-type blockers remain.
- `apa_candidate_possible`: allow candidate preview with warnings and `humanReviewRequired: true`.
- `needs_human_review`: block candidate text preview until the reviewer resolves source type or metadata uncertainty.

Specific policies:

- Missing required fields must block candidate preview.
- Unknown source type must require review.
- DOCX manuscript/source note must not pretend to be a published source unless a human classifies it that way through structured metadata.
- DOCX chunk references and parser page numbers must remain evidence provenance, not APA publication page ranges.
- `apaReadiness: candidate_ready` means preview possible only. It is not final verification.
- Any existing `citationReadiness: ready` remains basic compact metadata readiness only.

## No-Fabrication Policy

The APA candidate layer must not invent, infer, normalize, or silently repair:

- authors
- year/date
- title
- journal
- volume
- issue
- page range
- publisher
- DOI
- URL
- access date
- capitalization corrections
- source type
- missing reference elements
- author order
- editor role
- report number
- container title

Missing values must remain missing. The candidate should surface blockers and warnings instead of filling gaps.

No DOI lookup, citation web search, AI/API call, automatic metadata extraction, or APA formatter may be introduced as part of the candidate contract.

## Human Verification Boundary

Future human review states:

- `not_reviewed`: candidate has not been checked by a human reviewer.
- `needs_correction`: reviewer found metadata or formatting issues.
- `verified_for_internal_use`: reviewer approves use in internal notes, draft work, or teaching materials, but not necessarily publication.
- `apa_final_verified`: reviewer explicitly verifies the reference against APA 7 and trusted source metadata.

Rules:

- `verified_for_internal_use` is not publication-ready by default.
- `apa_final_verified` requires explicit human academic review.
- No automated step may mark final verification.
- A deterministic local formatter may produce a candidate only.
- Future AI-assisted output, if ever allowed, must remain lower trust than human verification and cannot mark final.

## UI Preview Plan

Future Source Library behavior should add a compact APA Candidate Preview panel after the structured metadata readiness panel.

Planned UI sections:

- candidate status
- source type
- APA style version
- required fields
- missing fields
- blocker list
- warning list
- reference parts display
- candidate text display only when allowed
- `not APA-final` notice
- human verification checklist
- recommended next action

Candidate text display rules:

- hide candidate text when blocked
- show reference parts even when text is blocked, if useful for metadata review
- show candidate text only for `structured_complete` or `apa_candidate_possible`
- always label text as candidate-only and not APA-final

Review loop:

```text
edit structured metadata
-> save/read back metadata
-> re-run readiness validator
-> regenerate derived APA candidate preview
-> human review
```

The UI must not add an APA finalizer or final verification action until the separate human APA verification gate exists.

## Persistence Strategy

Recommended staged approach:

### Option 1: Derived-Only Preview

APA Reference Candidate is derived in memory from saved SourceCard detail, structured metadata, and readiness result.

Pros:

- no migration
- lower risk
- easy to revalidate after metadata edits
- avoids stale candidate references
- reinforces that the candidate is non-final

Cons:

- no audit history for candidate text
- cannot compare candidate revisions
- cannot attach reviewer comments to a candidate object

### Option 2: Save Candidate As Review Artifact

APA Reference Candidate is saved as a review artifact linked to SourceCard.

Pros:

- supports review history
- can preserve candidate versions
- can support reviewer comments

Cons:

- requires migration and new persistence policy
- risks stale or authoritative-looking saved candidate strings
- needs clear invalidation when metadata changes
- should wait until a human verification gate exists

### Option 3: Link Candidate To DraftArtifact / Export

APA Reference Candidate becomes part of DraftArtifact or export package readiness.

Pros:

- connects citation review to downstream writing and export
- supports later reference list assembly

Cons:

- high risk before APA verification is implemented
- can accidentally promote candidates into final outputs
- depends on stable DraftArtifact citation boundaries

Recommended approach:

Start with derived-only preview in Sprint 4H-6. Persist verified APA reference artifacts only later, after a human APA verification gate exists. Link to DraftArtifact/export after final verification policy is stable.

## QA Strategy

Future QA should cover:

- every supported source type
- required field blockers
- recommended field warnings
- unknown source type blocking
- DOCX note restrictions
- no fabricated fields
- no DOI lookup or web search
- no automatic final verification
- candidate preview disabled when metadata is incomplete
- candidate text hidden when blocked
- `not APA-final` notice visible
- human review required flag always true
- `finalVerificationStatus` defaults to `not_reviewed`
- no SourceCard or structured metadata mutation
- no downstream MarketingTag, KnowledgeCard, DraftArtifact, or export mutation
- no persistence row created in derived-preview mode

Candidate DTO tests should assert that missing fields remain missing and that `candidateReferenceText` remains `null` until 4H-6 explicitly scopes deterministic preview text.

UI tests should avoid brittle exact APA strings. They should assert panel visibility, blocker/warning fields, candidate-only notices, and disabled/hidden preview states.

## Recommended Next Sprint

Recommended next sprint:

Sprint 4H-6 - APA Reference Candidate Preview MVP

Constraints for 4H-6:

- deterministic local preview only
- no AI/API
- no DOI lookup
- no citation web search
- no final APA verification
- no persistence unless explicitly scoped
- no fabricated fields
- no downstream DraftArtifact or export mutation
- candidate text, if introduced, must be clearly labeled preview-only and not APA-final

The first useful 4H-6 deliverable should be a pure mapper that consumes saved SourceCard detail, saved structured metadata, and 4H-4 readiness. It should return candidate status, reference parts, blockers, warnings, and candidate-only notices before any UI save or final verification work is considered.
