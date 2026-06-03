# APA Reference Candidate Preview 4H-6

## Purpose

Sprint 4H-6 adds a deterministic, derived-only APA Reference Candidate Preview MVP.

The preview is local, source-type aware, warning/blocker driven, and never persisted. It may show candidate reference text only when structured metadata readiness allows it. The text is not APA-final, not exported, and not suitable for academic use without human verification.

This sprint does not add AI/API calls, DOI lookup, citation web search, automatic metadata extraction, APA finalization, database migration, Rust command changes, DraftArtifact mutation, or DOCX export changes.

## Relationship To 4H-1 Through 4H-5

4H-1 added human completion of compact SourceCard metadata such as title, authors, year, citation text, metadata status, and citation readiness. That completion means basic metadata review only.

4H-2 defined the structured bibliographic metadata contract and separated compact metadata from source-type-specific APA readiness.

4H-3 added persistence and read-back for structured bibliographic metadata linked to saved SourceCards.

4H-4 added a pure structured metadata readiness validator. It emits required fields, missing fields, blockers, warnings, readiness status, and a no-APA-final notice.

4H-5 planned the APA Reference Candidate contract and recommended a derived-only preview first.

4H-6 implements that first derived-only preview. It consumes the 4H-4 readiness result and existing saved/read-back metadata. It does not create a new persistence boundary.

## Mapper Boundary

New pure TypeScript helper:

`src/lib/sources/ApaReferenceCandidatePreviewMapper.ts`

Input:

- saved compact SourceCard metadata
- saved structured bibliographic metadata, or null
- structured metadata readiness result from 4H-4

Output:

- `sourceCardId`
- `sourceType`
- `candidateStatus`
- `candidateReferenceText`
- `referenceParts`
- `warnings`
- `blockers`
- `missingFields`
- `humanReviewRequired: true`
- `finalVerificationStatus: not_reviewed`
- `apaStyleVersion: APA 7`
- `generatedBy: deterministic_local_formatter`
- `notes`
- `notFinal: true`

The mapper is deterministic and has no side effects. It does not call Tauri commands, save records, mutate metadata, fetch external citation data, or normalize fields beyond safe trimming and joining of already-entered strings.

## Source-Type Preview Behavior

### Academic Journal Article

Preview can be shown when the readiness validator has no blockers and required fields are present:

- title
- authors
- year
- journal

The preview may include volume, issue, page range, DOI, or URL when already present. Missing DOI/URL and page range remain warnings. The mapper does not invent journal details or claim the result is perfect APA.

### Book

Preview requires:

- title
- authors or editors as entered in the compact authors field
- year
- publisher

Missing publisher blocks preview. Edition is not fabricated and remains a warning when absent.

### Book Chapter

Preview requires:

- chapter title
- chapter authors
- year
- container title
- publisher

The current structured metadata contract does not yet store editor names as a dedicated field, so the mapper warns that editor names are not fabricated. Page range is included only when human-entered.

### Report / White Paper

Preview requires:

- title
- author or organization
- year/date
- publisher or issuing institution

DOI or URL is included only when already present.

### Website / Web Article

Preview requires:

- title
- URL

Author, year, and access date are included only when present. The mapper does not create `n.d.`, "Unknown author", or retrieval dates automatically.

### DOCX Manuscript / Source Note

Preview may be shown only as a non-publication-style internal candidate when enough human metadata exists. It uses a clear source-note marker:

`[DOCX manuscript/source note - internal candidate only]`

DOCX page numbers remain untrusted and must not become publication page ranges.

### Teaching Note

Preview may be shown as a teaching-note candidate with a citability warning. It is not treated as an external academic source unless a human reviewer verifies that use.

### Unknown / Pending Review

Unknown source type blocks candidate text. Human source-type review must happen first.

## Blocker And Warning Policy

Candidate text is disabled when:

- structured metadata has not been saved
- required fields are missing
- readiness is incomplete
- source type is unknown
- readiness contains blockers
- APA-final verification is attempted automatically

Warnings remain visible when preview is allowed. Warnings do not become fabricated fields. Common warning cases include:

- DOI or URL missing
- page range missing
- editor names not supported yet
- DOCX source notes are not APA-ready by default
- teaching notes may not be externally citable
- compact `citationReadiness: ready` is not APA-final

## No-Fabrication Policy

The candidate preview must not invent:

- authors
- author order
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
- editor names
- report numbers
- source type
- capitalization corrections
- missing reference elements

Missing values remain missing. The preview either omits missing optional fields or blocks when a missing field is required.

## No-Persistence Boundary

Sprint 4H-6 does not persist APA Reference Candidates.

The preview does not mutate:

- SourceDocument
- compact SourceCard metadata
- structured bibliographic metadata
- MarketingTags
- KnowledgeCards
- DraftArtifacts
- export readiness
- DOCX export state
- AI/provider state
- parser provenance
- evidence traces

No database migration, Rust command, or persistence DTO change is introduced.

## Not-APA-Final Policy

Every candidate has:

- `notFinal: true`
- `humanReviewRequired: true`
- `finalVerificationStatus: not_reviewed`
- `generatedBy: deterministic_local_formatter`

The UI shows:

- `APA candidate preview only - not APA-final`
- `No DOI lookup, web search, AI generation, or APA finalization is performed`
- `Do not use as final academic reference without human verification`

No automated step may mark `apa_final_verified`.

## UI Behavior

Source Library now shows a compact `APA Reference Candidate Preview` panel near the structured metadata readiness panel.

The panel displays:

- candidate status
- source type
- APA style version
- generated-by mode
- human review requirement
- final verification status
- not-final state
- missing fields
- candidate reference text when allowed
- blocked-message text when blocked
- reference parts
- blockers
- warnings
- candidate-only notes

The panel does not expose save, export, finalization, DOI lookup, web search, or AI actions.

## QA Results

Sprint 4H-6 adds pure mapper coverage through Source Library QA for:

- journal article candidate with minimum complete metadata
- journal article missing DOI/URL warning
- book missing publisher blocker
- website missing URL blocker
- unknown source type blocked
- DOCX note non-final warning
- no APA-final auto verification
- no invented author/year placeholders

Source Library QA also covers:

- APA Candidate Preview panel visibility
- candidate-only notices
- blocked state before structured metadata is saved
- allowed DOCX source-note candidate after structured metadata save
- human review and final verification status display
- existing structured metadata workflow stability

## Remaining Limitations

- Candidate text is an MVP preview, not a full APA formatter.
- Author/editor parsing is not structured.
- Book chapter editor fields are not supported yet.
- DOI and URL are not externally verified.
- Website no-date policy is not implemented.
- APA-final verification workflow does not exist yet.
- Candidates are not persisted or versioned.

## Recommended Next Sprint

Recommended next sprint:

Sprint 4H-7 - Human APA Verification Gate Plan

4H-7 should plan the human verification boundary before any persisted APA reference artifact exists. It should define reviewer actions, correction states, final verification criteria, invalidation when metadata changes, and how verified references might later connect to DraftArtifact/export flows.

4H-7 should still avoid AI/API, DOI lookup, web search, automatic extraction, APA finalization by automation, persistence mutation unless explicitly scoped, and downstream export changes.
