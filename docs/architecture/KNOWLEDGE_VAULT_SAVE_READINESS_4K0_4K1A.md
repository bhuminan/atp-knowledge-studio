# Knowledge Vault Save Readiness 4K-0 / 4K-1A

## A. Purpose

4K-0 / 4K-1A inspects the current Source Library save boundaries and adds a compact frontend-only Knowledge Vault Save Readiness summary.

The goal is to prepare the path from preview-only Knowledge Vault candidates toward a future explicit `Keep Records by Tag` workflow without adding any save mutation in this sprint.

## B. Existing Save Boundary Inspection

Existing real Tauri commands and local vault database write paths were inspected in `src-tauri/src/vault_db.rs`.

Existing explicit save/read/list boundaries include:

- `save_source_document_candidate`
- `list_saved_source_documents`
- `read_saved_source_document`
- `save_source_card_candidate`
- `list_saved_source_cards`
- `read_saved_source_card`
- `save_marketing_tags_for_source_card`
- `list_saved_marketing_tags`
- `list_saved_tags_for_source_card`
- `save_knowledge_cards_for_source_card`
- `list_saved_knowledge_cards`
- `list_saved_knowledge_cards_for_source_card`
- `read_saved_knowledge_card`
- `save_draft_artifact_candidate`
- `list_saved_draft_artifacts`
- `list_saved_draft_artifacts_for_source_card`
- `read_saved_draft_artifact`

The existing Source Library persistence UI already contains explicit save flows for SourceDocument, SourceCard, MarketingTags, KnowledgeCards, and mock/not-final DraftArtifacts. Those controls remain the canonical save surfaces.

## C. What Can Map Safely To Existing Records

Current preview candidates can map safely only as future save inputs, not as direct saved records:

- Knowledge Vault candidate tags can point toward future `MarketingTag` save candidates.
- Concept, evidence, and teaching-case uses can point toward future `KnowledgeCard` candidates.
- All tag and card saves require a saved SourceCard root.
- Draft input readiness can be informed by saved MarketingTags and saved KnowledgeCards later.
- SourceCard-linked evidence remains dependent on saved SourceDocument and SourceCard state.

The readiness layer therefore reports possible future save targets:

- `marketing_tag`
- `knowledge_card`
- `source_card_linked_record`
- `draft_input_package`

## D. What Cannot Be Saved Yet

This sprint does not save Knowledge Vault candidates because the current preview basket does not yet provide a persisted human review decision for those candidate records.

Current blockers include:

- missing parsed DOCX
- missing classification preview
- missing Knowledge Vault candidates
- human review required
- no saved SourceDocument in the center workflow shell
- no saved SourceCard in the center workflow shell
- insufficient evidence for low-confidence candidates

The existing save commands are real, but the preview candidate-to-save boundary still needs a future explicit review and mapping sprint.

## E. Readiness Rules

The readiness mapper is `KnowledgeVaultSaveReadinessMapper`.

It consumes existing frontend state only:

- parsed DOCX availability
- Knowledge Vault candidate preview
- Knowledge Vault review basket
- Textbook Request Seed Preview
- saved SourceDocument flag
- saved SourceCard flag

It returns:

- status
- readiness summary counts
- possible future save targets
- blockers
- warnings
- next action

Statuses are:

- `not_started`
- `needs_candidates`
- `needs_human_review`
- `ready_for_future_explicit_save`
- `blocked`

In the current Source Library workflow shell, saved SourceDocument and SourceCard are not owned by this center summary state, so readiness remains blocker-oriented and does not claim save readiness prematurely.

## F. UI Behavior

The UI adds a compact `Knowledge Vault Save Readiness` row inside `Needs Your Attention`.

It shows:

- readiness status
- reviewable candidate count
- high-priority review count
- blocker count
- next action
- possible future explicit save targets
- compact labels for preview-only, not saved, and human review required

Detailed blockers and warnings are available behind a disclosure control. No new large panel was added.

## G. What Changed

- Added a pure TypeScript Knowledge Vault save readiness mapper.
- Added a compact save readiness summary inside the Source Library attention area.
- Added guided action path step: `Check Vault Save Readiness`.
- Added mapper-level QA for boundary/readiness behavior.
- Updated Source Library QA to assert the readiness summary and guardrails.

## H. What Did Not Change

This sprint did not change:

- backend commands
- schema
- migrations
- persistence behavior
- DOCX parser behavior
- DOCX export behavior
- metadata mutation
- metadata apply expansion
- compact SourceCard apply
- SourceCard title/authors/year/sourceType mutation through correction workflows
- `citationText`
- APA-final verification
- live Crossref/OpenAlex/DOI/ISBN calls
- API keys
- AI/API behavior
- PDF/OCR implementation
- dependencies
- existing save/review gates

No save button, automatic tag persistence, automatic KnowledgeCard persistence, DraftArtifact generation, final textbook prose, or export behavior was added.

## I. Guardrails

Visible guardrails remain:

- preview only
- not saved
- no automatic save
- human review required
- no automatic vault write
- no citation finality
- SourceCard `citationText` not overwritten
- APA-final not supported
- DraftArtifact remains mock/not-final
- DOCX export remains gated

## J. QA Results

Baseline before implementation:

- `npm run build` passed with the existing Vite chunk-size warning.
- `npm run qa:source-library` initially hit sandbox port binding denial, then passed with 10 tests when rerun with local-server permission.
- `cd src-tauri && cargo test` passed with 82 tests.

Post-implementation:

- `npm run build` passed with the existing Vite chunk-size warning.
- `npm run qa:source-library` passed with 11 tests.
- `cd src-tauri && cargo test` passed with 82 tests.
- `git diff --check` passed.

## K. Remaining Limitations

- The readiness layer does not know about saved SourceDocument or saved SourceCard results inside the separate persistence panel.
- The review basket remains preview-only and does not store human review decisions.
- No direct Knowledge Vault save command exists for these preview candidates.
- Existing MarketingTag and KnowledgeCard saves require explicit saved SourceCard linkage.
- The readiness row is a planning boundary, not a save workflow.

## L. Recommended Next Sprint

Recommended next sprint: add local human review state for Knowledge Vault candidate/basket items and define the explicit candidate-to-MarketingTag / candidate-to-KnowledgeCard mapping contract.

Only after that contract is reviewed should the UI reveal existing explicit save sections for this workflow.
