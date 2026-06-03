# Human APA Verification Gate MVP 4H-8A

## Purpose

Sprint 4H-8A adds the first real Human APA Verification Gate MVP for internal use only.

The user can review an APA Reference Candidate Preview, inspect blockers and warnings, complete a checklist, edit verified reference text, and explicitly save a human-reviewed APA reference artifact.

This sprint may save:

- `needs_correction`
- `verified_for_internal_use`

This sprint must not save:

- `apa_final_verified`

APA-final verification remains future work with stricter publication-level review.

## Relationship To 4H-1 Through 4H-7

4H-1 added compact SourceCard metadata completion.

4H-2 defined structured bibliographic metadata requirements.

4H-3 added structured metadata persistence.

4H-4 added structured metadata readiness validation.

4H-5 planned the APA Reference Candidate contract.

4H-6 added deterministic, derived-only APA Reference Candidate Preview.

4H-7 planned the human verification gate and recommended a separate review table.

4H-8A implements that narrow internal-use gate without downstream integration.

## Table Design

New table:

`source_card_apa_reference_reviews`

Fields:

- `id`
- `source_card_id`
- `candidate_reference_text`
- `verified_reference_text`
- `verification_status`
- `verification_scope`
- `checklist_json`
- `reviewer_note`
- `source_metadata_snapshot_json`
- `warnings_accepted_json`
- `blockers_resolved_json`
- `apa_style_version`
- `human_reviewed_at`
- `created_at`
- `updated_at`

The table links to `source_cards(id)` with `ON DELETE CASCADE`.

Existing SourceCards remain readable without APA review records. No fake backfill is created.

## Command Boundary

New commands:

- `save_source_card_apa_reference_review`
- `get_source_card_apa_reference_review`

Rules:

- Require an existing saved SourceCard ID.
- Save only the APA reference review artifact.
- Return saved/read-back review data.
- Allow `needs_correction`.
- Allow `verified_for_internal_use`.
- Block `apa_final_verified`.
- Block internal-use verification when candidate blockers remain.
- Require checklist items before `verified_for_internal_use`.
- Do not overwrite `source_cards.citation_text`.
- Do not mutate structured bibliographic metadata.
- Do not mutate SourceDocument, MarketingTag, KnowledgeCard, DraftArtifact, parser provenance, traces, export readiness, DOCX export, AI/provider state, or final manuscript state.

## TypeScript Bridge

The TypeScript persistence bridge adds explicit DTOs and functions:

- `SaveSourceCardApaReferenceReviewRequest`
- `SaveApaReferenceChecklistItem`
- `SavedSourceCardApaReferenceReview`
- `SaveSourceCardApaReferenceReviewResult`
- `saveSourceCardApaReferenceReview`
- `getSourceCardApaReferenceReview`

These are separate from SourceCard compact metadata updates and structured bibliographic metadata updates.

## UI Workflow

Source Library now shows a compact `Human APA Verification Gate` panel near the APA Candidate Preview.

The panel shows:

- candidate text
- candidate blockers
- candidate warnings
- checklist items
- editable verified reference text
- verification status selector
- verification scope selector
- reviewer note
- explicit save action
- save result
- read-back summary

Allowed status options:

- `needs_correction`
- `verified_for_internal_use`

The UI does not expose `apa_final_verified`.

Required notices:

- Human APA review required.
- This does not create APA-final verification.
- Verified for internal use is not publication-ready.
- SourceCard citationText is not overwritten.
- No DOI lookup, web search, AI generation, or APA finalization is performed.

## Verification Status Rules

`needs_correction` may be saved when the user identifies that the candidate cannot yet be verified.

`verified_for_internal_use` requires:

- candidate reference text exists
- candidate blockers are empty
- checklist items are confirmed
- explicit user save action

`apa_final_verified` is blocked in Rust and not selectable in the UI.

## No-Overwrite SourceCard CitationText Policy

Saving a human APA review artifact does not overwrite compact SourceCard `citationText`.

The saved APA review stores its own:

- `candidate_reference_text`
- `verified_reference_text`
- metadata snapshot
- checklist snapshot
- warnings accepted
- blockers resolved

Compact SourceCard metadata remains stable for backward compatibility.

## No Downstream Integration

4H-8A does not integrate with:

- DraftArtifact citation review
- DOCX MVP export
- final manuscript export
- AI writing request packages
- KnowledgeCards
- MarketingTags
- Obsidian/Markdown export

Future downstream consumption must read saved APA review artifacts explicitly and preserve the distinction between internal-use verification and APA-final verification.

## QA Results

Rust tests cover:

- migration creates the new table
- save succeeds as `needs_correction`
- save succeeds as `verified_for_internal_use` with checklist
- missing SourceCard fails
- `apa_final_verified` is blocked
- unresolved candidate blockers block internal-use verification
- SourceCard citation text is not overwritten
- read-back returns saved review
- SourceCard without review reads safely

Playwright QA covers:

- Human APA Verification Gate panel appears after APA Candidate Preview
- not-final and no-automation notices are visible
- `needs_correction` can be saved
- `verified_for_internal_use` can be saved after checklist confirmation
- `apa_final_verified` is not selectable
- read-back verification appears
- SourceCard citation text remains visible and unchanged
- existing Source Library workflow remains stable

## Remaining Limitations

- No APA-final verification.
- No publication-ready review workflow.
- No separate review history listing.
- No stale-review invalidation when metadata changes.
- No downstream DraftArtifact or export consumption.
- Checklist JSON is stored as a snapshot for MVP read-back, not a normalized checklist table.
- Candidate text remains an MVP preview and not a full APA formatter.

## Recommended Next Sprint

Recommended next sprint:

Sprint 4H-8B or Sprint 4H-9 - Human APA Verification Readiness / Downstream Consumption Plan

Recommended constraints:

- plan how verified internal-use reviews affect DraftArtifact citation readiness
- keep `apa_final_verified` separate
- do not integrate DOCX export until review consumption policy is stable
- do not add AI/API, DOI lookup, citation web search, automatic extraction, or fabricated citation data
- preserve no-overwrite SourceCard citation text policy
