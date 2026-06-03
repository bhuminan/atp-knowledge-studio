# Structured Metadata Readiness Validator 4H-4

## Purpose

Sprint 4H-4 adds a deterministic, preview-only readiness validator for human-entered structured bibliographic metadata.

The validator answers one narrow question: does the saved structured bibliographic metadata appear complete enough, for its source type, to consider a future APA reference candidate preview?

It does not generate APA citations. It does not mark APA-final verification.

## Relationship To 4H-1, 4H-2, And 4H-3

4H-1 added compact SourceCard metadata completion. Its `citationReadiness: ready` means basic human-confirmed metadata only.

4H-2 defined the future structured bibliographic metadata contract and separated basic citation metadata, structured metadata completeness, APA reference candidate readiness, and APA-final verification.

4H-3 added storage and read-back for human-entered structured bibliographic metadata in `source_card_bibliographic_metadata`.

4H-4 reads the 4H-3 metadata and computes derived readiness only. It does not persist readiness and does not mutate any vault records.

## Source-Type Rule Summary

The validator supports conservative rules for:

- academic journal article
- book
- book chapter
- report / white paper
- website / web article
- DOCX manuscript / source note
- teaching note
- unknown / pending review

Journal article rules require title, authors, year, and journal. Missing volume/issue, page range, and DOI/URL are warnings.

Book rules require title, authors, year, and publisher. Edition remains a warning because the app cannot know whether the source is a first edition.

Book chapter rules require title, authors, year, container title, and publisher. Page range and edition/volume remain warnings.

Report / white paper rules require title, authors or organization, year, and publisher or institution. DOI/URL remains a warning.

Website / web article rules require title and URL. Author/organization, year/date, and access date remain warnings.

DOCX manuscript / source note rules require title and warn that DOCX source notes are not APA-ready by default. DOCX page numbers remain untrusted.

Teaching note rules require title and warn when author, year, and institution/publisher context are missing.

Unknown / pending review sources are blocked from APA candidate preview until the source type is reviewed.

## Readiness Statuses

The pure mapper emits:

- `not_started`: no structured bibliographic metadata has been saved.
- `needs_metadata`: required fields are missing.
- `incomplete`: structured metadata exists but the status is not complete.
- `structured_complete`: required fields appear present, but APA candidate preview is not yet enabled or warnings remain.
- `apa_candidate_possible`: metadata appears complete enough for a future APA reference candidate preview, but no APA citation is generated.
- `needs_human_review`: source type or metadata state requires human review before further use.

The mapper never emits `apa_final_verified`.

## Why This Is Not APA Generation

The validator does not format references, apply APA punctuation rules, order author lists, normalize titles, inspect DOI metadata, fetch URLs, or consult citation databases.

It only checks presence of human-entered structured fields and returns blockers, warnings, and next action text.

## Why This Is Not APA-Final

APA-final verification requires human academic review and a future citation formatter/validator workflow. The 4H-4 result always reports `apaFinalVerified: false`.

`citationReadiness: ready` from 4H-1 remains basic metadata confirmation only. It is not upgraded to APA-final.

## No-Fabrication Policy

The validator does not fabricate:

- authors
- years
- DOI
- URL
- publisher
- journal
- page range
- APA citation text
- APA readiness

Missing values remain missing. DOI/URL absence is reported as warning or blocker depending on source type; no lookup is performed.

## No-Persistence-Mutation Boundary

4H-4 does not create a table, add a field, update structured metadata automatically, or mutate any saved record.

The validator does not mutate:

- SourceDocument
- compact SourceCard metadata
- structured bibliographic metadata
- MarketingTags
- KnowledgeCards
- DraftArtifacts
- export readiness
- DOCX export state
- parser provenance
- AI/provider state

## QA Results

Sprint 4H-4 adds pure mapper coverage through the existing Source Library Playwright QA file and UI assertions for:

- journal article complete metadata
- journal article missing DOI/URL warning
- book missing publisher blocker
- website missing URL blocker
- DOCX note not APA-ready by default
- unknown source type needs review
- APA-final is never auto-produced
- Source Library readiness panel visibility
- missing fields/blockers/warnings display
- no-APA-generation notice
- APA-final future human review notice

## Remaining Limitations

- No APA reference formatter exists.
- No source-type selector is added in this sprint.
- No DOI/URL verification exists.
- No structured author/editor array exists yet.
- Source type normalization is conservative and may need richer user-facing source-type controls later.

## Recommended Next Sprint

Recommended next sprint:

Sprint 4H-5 — APA Reference Candidate Preview Planning or Validator-to-APA Contract.

4H-5 should define the contract between structured metadata readiness and a future APA reference candidate preview. It should still avoid APA generation unless explicitly scoped, and it must not introduce DOI lookup, web search, AI/API, or APA-final verification.
