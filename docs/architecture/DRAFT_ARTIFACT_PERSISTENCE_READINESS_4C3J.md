# DraftArtifact Persistence Readiness 4C-3J

## Decision Summary

Sprint 4C-3J adds preview-only DraftArtifact persistence readiness validation. It does not save draft artifacts, draft sections, full bundles, DOCX exports, or Obsidian/Markdown files.

The readiness layer exists so ATP can verify that a future draft save will depend on real saved SourceDocument, SourceCard, MarketingTag, and KnowledgeCard roots.

## Why DraftArtifact Save Must Wait

Current draft content is still deterministic/mock preview output. It is useful for pipeline planning, but it is not a final academic draft and must not be treated as persisted writing output yet.

DraftArtifact persistence should wait until ATP has:

- stable saved SourceCard metadata
- saved KnowledgeCards
- citation readiness review
- trace readiness review
- a clear policy for mock draft versus final draft artifacts

## Dependency Boundary

DraftArtifact readiness depends on:

- saved/readable SourceDocument extraction data
- saved/readable SourceCard metadata
- saved/readable KnowledgeCards

MarketingTag links may support downstream context, but DraftArtifact readiness is blocked primarily by missing saved SourceCard or KnowledgeCards.

## Mock-Only Policy

The current DraftArtifact candidate has:

- `mockOnly: true`
- `notFinalDraft: true`
- `notPersisted: true`

These fields must remain visible in readiness warnings. The UI must not imply that a draft has been saved.

## Citation And Trace Requirements

Future draft persistence should preserve:

- linked SourceCard ID
- linked KnowledgeCard IDs
- citation readiness state
- trace readiness state
- warnings for DOCX page-number limitations
- chunk references such as `docx:pN`

DOCX page numbers remain untrusted unless a later parser resolves them.

## What Is Validated Now

The readiness preview validates:

- DraftArtifact candidate ID
- linked saved SourceCard ID
- linked saved KnowledgeCard count
- citation readiness
- trace readiness
- mock-only status
- blockers
- warnings

## What Is Not Saved Yet

This sprint does not save:

- DraftArtifact records
- draft section records
- generated prose
- DOCX export files
- Obsidian/Markdown export files
- full persistence bundles

## Recommended 4C-3K

Add DraftArtifact table migration and a real DraftArtifact-only save command. Keep it limited to draft artifact metadata and section previews, with no DOCX export and no Obsidian export.
