# SourceCard Metadata Review Gate Preview 4P-1

## Purpose

Sprint 4P-1 adds a read-only SourceCard Metadata Review Gate Preview to the selected saved SourceDocument detail area.

The preview shows what metadata must be reviewed before a future SourceCard can be created from a saved SourceDocument. It does not create SourceCards, edit metadata, infer citation/APA metadata, call backend write commands, run parser/classification/AI/provider workflows, or create downstream records.

## What Preview Was Added

The selected saved SourceDocument detail now includes a compact section labeled:

```text
SourceCard Metadata Review Gate Preview
```

The section appears only after a saved SourceDocument is selected and read back. It states:

```text
Preview only — no SourceCard is created.
```

The preview is placed after the existing SourceDocument metadata readiness preview and before the compact intake audit trace. It keeps the saved SourceDocument list, root detail, metadata readiness, and audit trace read-only.

The preview includes:

- gate state
- metadata checklist
- warnings
- blockers
- SourceCard/deferred boundary notices
- disabled future-only affordance: `Future: Create SourceCard after metadata review`

## Gate State Logic

The gate uses the trust model from Sprint 4P-0:

- Green: `Ready for SourceCard creation review`
- Orange: `Needs bibliographic metadata review`
- Red: `Blocked`

Current intake-saved SourceDocuments should normally render orange because the saved SourceDocument root does not contain human-reviewed authors, year/date, DOI/URL, journal/publisher/container, citation text, or structured bibliographic metadata.

The preview only renders green if no blockers and no metadata review needs remain. With the current SourceDocument-only root data, that state is not expected.

The preview renders red when missing root essentials make the SourceDocument identity unreliable:

- missing SourceDocument ID
- missing read-back identity
- missing title
- missing file name
- missing source type/file type

Missing provenance is a warning while reliable root identity remains available.

## Metadata Checklist

The checklist includes:

- SourceDocument root exists
- read-back verified
- title present
- file name/source type present
- intake provenance present or warning
- authors reviewed
- year reviewed
- DOI/URL reviewed if applicable
- journal/publisher/container reviewed if applicable
- citation text reviewed
- APA candidate not final
- explicit future approval required
- SourceCard not created yet

Checklist item states are:

- `Passed`
- `Needs review`
- `Warning`
- `Blocked`
- `Future required`

Current intake-saved SourceDocuments pass root identity/read-back checks, flag bibliographic fields as needs-review, keep APA candidate finality as not final, and require explicit future approval before any creation behavior can exist.

## Warning And Blocker Semantics

Blockers are limited to root identity and read-back essentials. Missing bibliographic metadata is not fabricated and does not become a blocker for read-only preview. It keeps the gate in orange.

Warnings make the unsafe assumptions visible:

- missing bibliographic metadata requires review
- metadata is not fabricated
- citation/APA finality is not implied
- SourceCard remains deferred
- missing intake provenance is a warning when root identity remains reliable

The preview must not use titles, file names, candidate IDs, parser chunks, provider hints, or SourceDocument metadata readiness to invent bibliographic metadata.

## Why SourceCard Remains Deferred

The saved SourceDocument root proves a local source intake record, not a citation-ready academic source. It can support future review, but it does not prove:

- authors
- year/date
- DOI/URL
- journal
- publisher
- container title
- page range
- citation text
- APA reference text
- APA-final verification

Future SourceCard creation still needs explicit human metadata review, approval, audit behavior, and read-back verification.

## Why Citation And APA Metadata Are Not Inferred

Citation and APA metadata carry academic risk. The preview therefore does not infer or generate:

- citation text
- APA candidate reference
- APA-final verification
- publication metadata
- source-type truth
- provider truth

The preview repeats that no citation-ready or APA-final state is created. Any future APA workflow must continue to use the existing structured metadata readiness, candidate preview, and human APA verification boundaries.

## What Remains Not Implemented

Sprint 4P-1 does not implement:

- SourceCard creation
- active SourceCard create button
- SourceCard metadata editing
- backend write commands
- schema changes
- migrations
- SourceDocument save/read behavior changes
- parser behavior changes
- classification behavior changes
- AI/API/provider behavior changes
- CitationGuard changes
- APA verification changes
- evidence review changes
- DOCX export changes
- WriterAgent changes
- network behavior changes
- new dependencies or lockfile changes
- MarketingTag, KnowledgeCard, DraftArtifact, citation, APA, extraction, segment, evidence trace, provider, AI, export, or Writer record creation

## Recommended Next Sprint

Recommended next sprint:

**Sprint 4P-2 - SourceCard Metadata Review Gate Contract**

Recommended scope:

- keep the preview read-only
- define the exact future DTO for a human-reviewed SourceCard metadata approval package
- define blockers/warnings/approval snapshot fields
- define audit receipt expectations
- decide whether metadata entry is a separate sprint before any create command
- do not add active SourceCard creation until the contract and audit behavior are stable
