# SourceCard Metadata Review Gate Design 4P-0

## Purpose

Sprint 4P-0 defines the SourceCard metadata review gate that must sit between a saved SourceDocument root and any future SourceCard creation path.

This sprint is documentation and architecture only. It does not implement UI, backend commands, schema changes, migrations, parser behavior, classification behavior, AI/API/provider calls, citation generation, APA finalization, export behavior, Writer behavior, tests, dependencies, or lockfile changes.

The design goal is to keep the current SourceDocument-only save/read boundary intact while defining the checks that a future SourceCard creation workflow must pass before a SourceCard record can be created from a saved SourceDocument.

## Current State Summary

The current SourceDocument workflow has a saved root record, explicit approval, audit/read-back visibility, and a read-only metadata readiness preview. A saved SourceDocument can prove local source identity, file type, file name, title, intake provenance when available, and read-back visibility.

A saved SourceDocument does not prove citation readiness. It does not prove authors, year, DOI, journal, publisher, container title, page range, citation text, source type confidence, APA reference text, or APA-final verification.

SourceCard creation remains deferred. The Source Library currently shows SourceCard candidate and readiness surfaces as preview/review-only experiences, while manual SourceCard creation remains local mock-only and non-persistent. Existing SourceCard and APA workflows already separate compact metadata review, structured bibliographic metadata, APA candidate preview, and human APA review.

The future SourceCard metadata review gate should therefore be a separate boundary, not a silent extension of SourceDocument save and not an automatic parser/classification/AI follow-up.

## Files Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/SOURCEDOCUMENT_METADATA_READINESS_HARDENING_4O6.md`
- `docs/architecture/APA_REFERENCE_CANDIDATE_CONTRACT_4H5.md`
- `docs/architecture/HUMAN_APA_VERIFICATION_GATE_4H7.md`
- `docs/architecture/HUMAN_APA_VERIFICATION_GATE_MVP_4H8A.md`
- `src/types/domain.ts`
- `src/lib/sources/SourceDocumentMetadataReadinessMapper.ts`
- `src/lib/sources/SourceCardMapper.ts`
- `src/lib/sources/ParsedDocxSourceCardSaveValidator.ts`
- `src/lib/sources/StructuredBibliographicMetadataReadinessMapper.ts`
- `src/lib/sources/ApaReferenceCandidatePreviewMapper.ts`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `src/features/source-library/components/ManualSourceCardForm.tsx`
- `src/features/source-library/components/SourceCardCandidatePreview.tsx`
- `src/features/source-library/components/SourceCardReadinessSummary.tsx`
- `src-tauri/src/lib.rs`
- `src-tauri/src/vault_db.rs`

## Proposed Review Gate

The future gate should be named **SourceCard Metadata Review Gate** and should evaluate a saved SourceDocument plus human-reviewed metadata before any SourceCard creation action is enabled.

The gate should require:

- saved SourceDocument root exists
- SourceDocument read-back has succeeded
- SourceDocument root identity is present: ID, title, file name, and file type
- SourceDocument provenance is present or its absence is explicitly warned
- no SourceCard has already been created from the same review context unless the user is intentionally entering an update flow
- human-reviewed bibliographic metadata has been entered or confirmed
- SourceCard source type has been selected or confirmed by a human
- citation text is either human-entered, marked draft, or explicitly marked missing; it must not be generated from weak inference
- missing metadata blockers are resolved before create
- remaining warnings are explicitly accepted before create
- APA-final verification is not set and not implied
- no parser, classification, AI, provider, DOI lookup, citation web search, APA finalizer, export, Writer, or downstream record creation runs as part of the gate
- user gives explicit create approval
- future creation records an audit event
- future creation performs read-back verification and shows a receipt

The gate should be deterministic and local by default. It may read saved SourceDocument and human-entered metadata, but it should not fetch external truth or infer citation metadata from titles, file names, candidate IDs, parser chunks, or provider suggestions.

## Required Metadata Categories

### Required To Open The Review Gate

- saved SourceDocument ID
- saved SourceDocument title
- saved SourceDocument file name or local file reference
- saved SourceDocument file type
- SourceDocument read-back timestamp or equivalent receipt
- intake audit/provenance reference when available
- current SourceDocument metadata readiness state
- current SourceCard deferred/not-created state

If provenance is missing, the gate may open for inspection but should show a warning. If SourceDocument identity fields are missing, the gate should be blocked.

### Required Before SourceCard Creation

- linked saved SourceDocument ID
- SourceCard title
- authors or responsible organization
- year/date or explicit no-date review policy
- source type selected or confirmed by a human
- citation text, internal citation label, or explicit "citation metadata required" placeholder
- metadata status
- citation readiness
- human review status
- non-fabrication confirmation
- accepted warnings snapshot
- resolved blocker snapshot
- explicit create approval

These fields support a SourceCard record, not an APA-final reference. Even when present, they do not prove publication-ready citation quality.

### Source-Type-Specific Structured Metadata

Academic journal article:

- required: title, authors, year, journal
- recommended: volume, issue, page range, DOI or URL

Book:

- required: title, authors or editors, year, publisher
- recommended: edition, volume or series, DOI or URL when applicable

Book chapter:

- required: title, authors, year, container title, publisher
- recommended: editors, edition, volume, page range, DOI or URL

Report or white paper:

- required: title, authors or organization, year, publisher/institution
- recommended: report number, DOI or URL

Website or web article:

- required: title, URL
- recommended: author or organization, publication date/year, access date when required

DOCX manuscript or source note:

- required: title
- recommended: author or organization, year/date, source note context
- warning: DOCX parser page/chunk references must not become publication page ranges

Teaching note:

- required: title
- recommended: author or institution, year/date, publisher/institution context
- warning: teaching notes may not be externally citable without human academic review

Unknown source type:

- required: title
- blocker: source type must be reviewed before SourceCard creation can be treated as citation-ready

### Explicitly Not Inferred

The gate must not infer or fabricate:

- authors
- year/date
- DOI
- URL
- journal
- publisher
- container title
- volume or issue
- page range
- citation text
- APA reference text
- APA-final verification
- provider truth
- parser/classification confidence as academic source truth

## Trust And Readiness States

### Green: Ready For SourceCard Creation Review

Meaning:

- SourceDocument identity and read-back are present.
- Required SourceCard metadata is human-reviewed.
- Source type has been selected or confirmed.
- Blockers are resolved.
- Remaining warnings are accepted.
- Citation text is human-entered, clearly draft, or explicitly marked as still requiring citation metadata.
- APA-final remains false and not implied.

Allowed future action:

- enable an explicit "Create SourceCard" action
- write a future audit event
- save exactly one SourceCard record after approval
- immediately read back the created SourceCard and show a receipt

Still blocked:

- auto-create
- SourceCard/downstream record cascades
- APA-final verification
- parser/classification/AI/provider follow-up
- citation/APA export or Writer integration

### Orange: Needs Bibliographic Metadata Review

Meaning:

- SourceDocument root is readable, but SourceCard metadata is incomplete, unconfirmed, or warning-heavy.
- Missing or uncertain bibliographic fields still require human review.
- The source may be usable as a saved root record but is not ready for SourceCard creation.

Allowed future action:

- show review checklist
- allow metadata entry or confirmation in a future scoped sprint
- show missing fields, warnings, and next action

Blocked:

- SourceCard creation
- citation-ready label
- APA candidate/final claims
- downstream records

### Red: Blocked

Meaning:

- SourceDocument identity is missing, read-back failed, required root data is unavailable, source type is unsafe, or the workflow is trying to create a SourceCard without explicit metadata review.

Allowed future action:

- read-only inspection
- show blockers
- preserve existing saved SourceDocument data

Blocked:

- metadata review approval
- SourceCard creation
- audit receipt for creation
- downstream records

## Future UI Gate Recommendation

Add a compact **SourceCard Metadata Review Gate** panel after the saved SourceDocument detail/read-back surface and before any SourceCard creation surface.

Recommended panel sections:

- root verification: SourceDocument ID, title, file name, file type, read-back state
- provenance: audit/provenance reference and warning if missing
- SourceCard status: "SourceCard not created yet"
- metadata checklist: title, authors, year/date, source type, citation text/placeholder, publisher/journal/container as source-type specific fields
- trust state: green, orange, or red
- blockers and warnings
- explicit notices: "Citation metadata is not verified", "APA-final is not verified", "No auto-save", "No downstream records"
- approval control: "I reviewed the metadata and want to create a SourceCard from this saved SourceDocument"
- create button: disabled unless the gate is green and explicit approval is checked
- receipt area: future read-back result after creation

The first UI sprint should be read-only or preview-only if possible. It should make the gate visible before adding a create command. That keeps the user-facing mental model stable before persistence expands.

## Future Backend And Audit Recommendation

Create a narrow future command rather than wiring SourceCard creation into the SourceDocument save path.

Suggested future command name:

```text
create_source_card_from_metadata_review
```

Suggested command rules:

- require an existing saved SourceDocument ID
- require gate result and explicit approval
- require required SourceCard metadata fields
- require `metadataStatus` and `citationReadiness`
- reject APA-final verification
- reject generated citation claims unless clearly marked as candidate/draft
- reject missing root SourceDocument identity
- reject parser/classification/AI/provider side effects
- create only the SourceCard record
- do not create MarketingTags, KnowledgeCards, EvidenceItems, DraftArtifacts, exports, Writer packages, or APA review artifacts
- write a SourceCard metadata review audit event
- return blockers and warnings
- perform read-back verification
- return a creation receipt with saved SourceCard ID and linked SourceDocument ID

The command may reuse existing low-level validation concepts, but the user-facing and audit boundary should remain separate from parser-derived candidate save behavior. This makes it obvious that SourceDocument-to-SourceCard creation is a human metadata review action, not an intake side effect.

Recommended audit fields:

- audit event ID
- saved SourceDocument ID
- created SourceCard ID
- gate status
- blocker snapshot
- warning snapshot
- accepted warning snapshot
- required metadata snapshot
- explicit approval text/version
- created by local reviewer
- created at
- read-back verification result

## Risks

- Users may read "ready" as citation-ready or APA-final.
- A future UI may make SourceCard creation feel automatic if the gate is visually too close to SourceDocument save.
- Missing authors/year/DOI/journal/publisher fields may be guessed from file names or titles.
- Parser chunks or DOCX page references may be mistaken for publication metadata.
- Provider suggestions may be treated as source truth.
- A broad backend command could accidentally create SourceCard/downstream records in one step.
- Citation text may be overwritten by a generated APA candidate if the SourceCard boundary and APA boundary are mixed.
- Structured metadata completeness may be confused with APA-final verification.

## Non-Goals

Sprint 4P-0 does not:

- create SourceCards
- add SourceCard metadata editing UI
- add a SourceCard creation button
- add or change backend commands
- add schema or migrations
- add tests
- change TypeScript app behavior
- change Rust backend behavior
- change SourceDocument save/read behavior
- change parser or classification behavior
- call AI/API/provider services
- perform DOI lookup or citation web search
- generate citation text
- generate APA references
- mark APA-final verification
- create SourceCard/downstream records
- integrate export, Writer, APA review, or DraftArtifact workflows
- change dependencies, package files, Cargo files, or lockfiles

## Recommended Next Sprint

Recommended next sprint:

**Sprint 4P-1 - SourceCard Metadata Review Gate Preview UI**

Recommended scope:

- read-only or preview-only UI panel
- no SourceCard creation command
- no metadata editing unless explicitly scoped
- show green/orange/red gate states
- show required metadata checklist
- show blockers and warnings
- show "SourceCard not created yet"
- preserve no auto-save and SourceDocument-only boundary
- do not create SourceCard/downstream records

This gives users visibility into the future SourceCard creation boundary before any persistence or creation behavior changes.
