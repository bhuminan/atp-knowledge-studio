# Human Attention Progressive Disclosure 4J-4B

## A. Purpose

4J-4B is a Source Library UX quality pass. It improves the parsed-DOCX workflow cockpit after several preview-only layers were added:

- Classification & Tag Preview
- Knowledge Vault Candidate Preview
- Knowledge Vault Review Basket
- Textbook Request Seed Preview

The purpose is to make the screen calmer and more decision-oriented without changing backend behavior, persistence, parsing, export, metadata, citation, or AI boundaries.

## B. Why This Sprint Stops Adding Feature Layers

After 4J-3A through 4J-4A, the Source Library had enough preview layers to show the early target workflow:

```text
Input -> Automatic Classification -> Knowledge Vault Candidates -> Review Basket -> Textbook Request Seed
```

Adding another major panel would make the workflow harder to scan. 4J-4B therefore treats human attention as the scarce resource: show the next decision first, summarize trusted preview output, and keep long detail reachable on demand.

## C. Human Attention Hierarchy

The center workflow now follows this hierarchy:

1. Current action and blocker
2. Human review needed
3. Readiness summary
4. Preview details
5. Debug, provider, audit, and raw evidence

The `Needs Your Attention` summary surfaces only the items the user should decide, check, or act on now. It does not duplicate the full guided action path.

## D. Progressive Disclosure Rules

The full guided action path remains available, but its long detail list is collapsed behind `View full guided action path`.

Preview sections remain visible as compact cards. Long lists and detailed evidence are reachable behind disclosure controls:

- `View classification details`
- `Expand candidate records`
- `Expand review items`
- `Expand textbook topic directions`
- compact guardrail note disclosures

Risk-critical state remains visible as chips or short summaries, including preview-only, not saved, human review required, no AI, no citation finality, no APA-final verification, `citationText` not overwritten, and export gated.

## E. What Changed

- Added a compact `Needs Your Attention` summary in the center workflow.
- Collapsed the full guided action detail list by default.
- Converted detailed classification, vault candidate, review basket, and textbook seed lists into disclosure sections.
- Kept preview-only and human-review guardrails visible without repeating long warning blocks across every panel.
- Updated Source Library QA to assert the attention summary and reachable detail disclosures.

## F. What Did Not Change

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
- existing mock/debug/provider/audit reachability

No new preview layer was added.

## G. Guardrails

Visible guardrails remain:

- preview only
- not saved
- no automatic save
- human review required
- no AI used
- no citation finality
- SourceCard `citationText` not overwritten
- APA-final not supported
- DraftArtifact remains mock/not-final
- DOCX export remains gated
- external metadata evidence is not truth

## H. QA Results

Baseline before implementation:

- `npm run build` passed with the existing Vite chunk-size warning.
- `npm run qa:source-library` initially hit sandbox port binding denial, then passed with 10 tests when rerun with local-server permission.
- `cd src-tauri && cargo test` passed with 82 tests.

Post-implementation:

- `npm run build` passed with the existing Vite chunk-size warning.
- `npm run qa:source-library` passed with 10 tests.
- `cd src-tauri && cargo test` passed with 82 tests.
- `git diff --check` passed.

## I. Remaining Limitations

- Progressive disclosure is local UI organization only; it does not persist expanded/collapsed state.
- The review basket remains deterministic and preview-only.
- The textbook request seed remains a request seed, not generated textbook prose.
- Parsed-ready visual verification still depends on the local app/browser environment accepting text entry.
- Later DraftArtifact and DOCX export readiness remain gated by existing explicit save paths.

## J. Recommended Next Sprint

Recommended next sprint: add local review ergonomics for the review basket only if the current progressive disclosure pass feels calm in manual review.

Do not add another major preview layer until the current cockpit proves easy to operate during the real parsed-DOCX path.
