# Vault Candidate Review Save Mapping 4K-1B + 4K-2A

## A. Purpose

This sprint prepares the safe transition from preview-only Knowledge Vault candidates toward a future explicit save workflow. It adds local human review state and a preview-only save candidate mapping contract for MarketingTag and KnowledgeCard candidates.

The goal is to help the user see which candidates could become future saved tag/knowledge records without saving anything automatically.

## B. Relationship to 4K-0 + 4K-1A

4K-0 + 4K-1A inspected the existing save boundaries and added Knowledge Vault Save Readiness. That readiness layer answered whether current preview candidates were blocked by missing human review, missing SourceDocument linkage, missing SourceCard linkage, or future explicit save boundaries.

4K-1B + 4K-2A builds on that by adding the missing local human review state and a deterministic mapping preview. The mapping preview remains downstream of save readiness and does not change the existing persistence model.

## C. Local Review State Rules

Knowledge Vault candidate review state is frontend-only and non-persistent.

Supported local states:

- not_reviewed
- selected_for_review
- approved_for_future_save
- rejected
- needs_more_evidence

The UI wording avoids finality. It uses "approved for future save" rather than "saved" and "local review only" rather than "verified." Review state resets with the active parsed-DOCX source context and is not written to the database or audit trail.

## D. Save Candidate Mapping Contract

The new `KnowledgeVaultSaveCandidateMapper` consumes:

- Knowledge Vault candidate preview
- local review states
- Knowledge Vault save readiness
- saved SourceDocument and SourceCard availability flags

It returns preview-only candidate mappings:

- MarketingTag save candidates
- KnowledgeCard save candidates

Only candidates marked `approved_for_future_save` are mapped into future save candidates. Mapping can still be blocked by missing saved SourceDocument, missing saved SourceCard, insufficient evidence, rejected candidates, or candidates needing more evidence.

## E. What Changed

- Added local review controls inside the existing Knowledge Vault candidate drawer.
- Added a compact Save Candidate Mapping Preview summary in Needs Your Attention.
- Added a collapsible Save Candidate Mapping Preview detail section in the active workflow.
- Added guided action path support for reviewing vault candidates and previewing save mapping.
- Added mapper-level and Source Library QA coverage for local review and preview-only mapping behavior.

## F. What Did Not Change

- No backend commands were added.
- No schema or migration changes were made.
- No Knowledge Vault records are saved automatically.
- No MarketingTag or KnowledgeCard persistence is called by the new mapper.
- No SourceDocument, SourceCard, DraftArtifact, citationText, metadata, APA, DOCX parser, or DOCX export behavior changed.
- No AI, API, provider, network, PDF/OCR, or dependency behavior changed.

## G. Guardrails

- Preview only.
- Not saved.
- Local review only.
- Human review required.
- No automatic vault write.
- No citation finality.
- SourceCard citationText is not overwritten.
- APA-final verification remains unsupported.
- DraftArtifact remains mock/not-final.
- DOCX export remains gated.

## H. QA Results

Baseline before implementation:

- `npm run build`: passed.
- `npm run qa:source-library`: passed after local server permission was granted.
- `cd src-tauri && cargo test`: passed, 82 Rust tests.

Final verification after implementation:

- `npm run build`: passed.
- `npm run qa:source-library`: passed, 12 tests.
- `cd src-tauri && cargo test`: passed, 82 Rust tests.
- `git diff --check`: passed.
- Tauri visual smoke: local app launched through `npm run tauri -- dev`; Source Library and Dashboard rendered in the in-app browser. First viewport stayed calm, Save Candidate Mapping Preview was compact, no Save to Vault or Generate textbook action was introduced. The in-app browser could not type into the local path field because its virtual clipboard/input surface was unavailable, so parsed-DOCX interactivity was verified through the Playwright QA flow.

## I. Remaining Limitations

- Local review state is intentionally non-persistent.
- Save candidate mapping does not create MarketingTags or KnowledgeCards.
- Future explicit save still requires confirmed saved SourceDocument and SourceCard linkage.
- The mapping contract is deterministic and conservative; it does not perform semantic AI classification.
- Evidence readiness remains a preview signal, not verification.

## J. Recommended Next Sprint

Add an explicit save-boundary design for reviewed, approved future-save candidates. That sprint should define the exact validated payloads for MarketingTag and KnowledgeCard writes, the required saved SourceDocument and SourceCard links, and the review/audit fields needed before enabling any real save action.
