# DraftArtifact Save Boundary 4C-3K

## Decision Summary

Sprint 4C-3K adds the first real local-vault save boundary for mock DraftArtifact records. The boundary is intentionally narrow: ATP may save mock/not-final draft artifact metadata, draft section previews, and links to already saved KnowledgeCards.

This sprint does not save final manuscripts, DOCX exports, Obsidian/Markdown exports, full persistence bundles, SourceCards, tags, or KnowledgeCards from the DraftArtifact action.

## Saved Tables

The migration adds:

- `draft_artifacts`
- `draft_sections`
- `draft_artifact_knowledge_cards`

The saved DraftArtifact row is linked to a saved `source_cards` row. Draft section rows are linked to the DraftArtifact. KnowledgeCard links are stored through the join table and must reference existing saved `knowledge_cards`.

## Save Preconditions

The DraftArtifact save command requires:

- an existing saved SourceCard ID
- at least one existing saved KnowledgeCard ID
- a DraftArtifact candidate ID and title
- `artifactType = mock_draft_section_preview`
- `mockOnly = true`
- `notFinalDraft = true`
- at least one draft section candidate

If the SourceCard or KnowledgeCard dependency is missing, the save is blocked.

## Mock-Only Policy

Saved DraftArtifacts are marked as:

- `artifact_status = mock_only`
- `mock_only = true`
- `not_final = true`

This preserves the current product boundary: the draft preview is useful for academic pipeline QA, but it is not a generated final draft.

## Read/List Verification

The read boundary returns:

- saved DraftArtifact metadata
- saved draft section previews
- linked saved KnowledgeCards
- linked saved SourceCard compact reference

The UI verification panel must continue to state that no final manuscript, DOCX export, or Obsidian export is created.

## Idempotency

The command uses the DraftArtifact candidate ID as the stable saved record ID. Re-saving the same candidate refreshes section rows and KnowledgeCard links instead of creating duplicate DraftArtifact roots.

## Still Not Saved

This sprint does not save:

- final draft prose
- DOCX export artifacts
- Obsidian or Markdown files
- full bundle snapshots
- AI-generated draft output
- citation review records
- pipeline workflow state

## Recommended 4C-3L

Add read/list verification for saved DraftArtifacts if additional UI inspection is needed, then plan the next persistence boundary for draft review snapshots or export-readiness metadata. Keep DOCX export and Obsidian export separate from the local vault save path.
