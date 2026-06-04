# Source Library One-Screen Workflow Shell 4J-1B

## A. Purpose

4J-1B implements the first layout-only Source Library workflow shell for ATP Knowledge Studio.

The goal is to make the main source-first academic production flow visible in the first viewport without changing backend behavior, persistence, metadata mutation, provider behavior, citation behavior, APA verification, AI/API behavior, PDF/OCR support, or DOCX export behavior.

Target user flow:

```text
Input -> Automatic Classification -> Keep Records by Tag -> Textbook Request -> DOCX Output
```

## B. Relationship To 4J-1A IA

This sprint follows `SOURCE_LIBRARY_ONE_SCREEN_WORKFLOW_IA_4J1A.md`.

4J-1A recommended a one-screen cockpit with:

- top workflow bar
- left studio navigation / intake zone
- center active work area
- right context inspector
- collapsed or secondary debug/provider/mock surfaces

4J-1B is the first shell implementation of that IA. It does not complete the future guided parsed-DOCX workflow.

## C. What Changed In The Source Library Shell

The Source Library page now has:

- a top workflow bar showing `Input - Classify - Tag Vault - Textbook Request - Draft/Review - DOCX Export`
- a visible `Next action` summary derived from existing frontend state
- a lightweight 8-bit studio navigation rail with room labels
- a center active work area for the Input / parsed-DOCX path
- the existing Source Detail area reshaped into a compact context inspector
- the global Agent Status rail compacted on Source Library so it is secondary
- a collapsed secondary workbench grouping queue, mock/demo, provider, and debug preview panels
- collapsed mock/source record and source-card detail drawers with internal scrolling

Existing save/review/detail controls remain reachable.

## D. First Viewport Behavior

The first viewport now prioritizes:

- production workflow stages
- current stage
- next action
- the current usable DOCX path
- the center active parsed-DOCX workflow summary
- safety guardrails
- right-side source/detail context

The old drag/drop copy is no longer the dominant start instruction. The visible start path is local DOCX path preview and parsing.

Page-level scrolling is reduced by keeping the Source Library root overflow-contained. Longer surfaces now scroll inside their own panels or drawers rather than stretching the whole page.

## E. Real Vs Preview/Mock/Debug Separation

The real parsed-DOCX path is visually dominant in the top bar and center active work area.

Preview/mock/debug/provider surfaces remain available but are grouped under a collapsed secondary workbench. Provider evidence and correction review panels are still present for existing QA and inspection, but they are labeled as secondary rather than the primary production workflow.

Mock/demo records remain labeled as mock records and are behind a collapsed records drawer with an internal scroll container.

## F. 8-Bit Studio Workflow Navigation Role

The 8-bit studio concept is represented as compact workflow navigation:

- Intake Desk
- Classifier Room
- Knowledge Vault
- Writing Studio
- Citation Guard
- Export Station

These room labels map to workflow stages. They are stage markers, not decorative panels, and they do not introduce new automation.

## G. What Did Not Change

4J-1B did not change:

- backend commands
- schema
- migrations
- persistence behavior
- DOCX export behavior
- metadata apply behavior
- compact SourceCard apply behavior
- SourceCard title/authors/year/sourceType mutation
- `citationText`
- APA-final verification
- live provider lookup
- AI/API behavior
- PDF/OCR behavior
- dependencies

## H. Guardrails

The shell keeps these boundaries visible:

- explicit save is required
- DOCX page numbers remain untrusted
- APA preview is internal-use only
- no APA-final verification is performed
- SourceCard `citationText` is not overwritten
- DraftArtifact remains mock/not-final
- DOCX export remains gated
- provider evidence is not metadata truth
- no live network/API call is introduced

## I. QA Results

Baseline before implementation:

- `npm run build` passed with the existing Vite bundle-size warning.
- `npm run qa:source-library` was blocked before assertions because the local dev server could not bind `127.0.0.1:1420` in this sandbox.
- `cd src-tauri && cargo test` passed with 82 tests.

Post-implementation:

- `npm run build` passed with the existing Vite bundle-size warning.
- `npm run qa:source-library` partially passed: 6 mapper/provider tests passed, and the browser-flow test was blocked before assertions by Chromium macOS Mach service permission.
- `cd src-tauri && cargo test` passed with 82 tests.
- `git diff --check` passed.
- `PATH=/Users/bhuminan/.cargo/bin:$PATH npm run tauri -- dev` was blocked before app launch because port `1420` was already in use by an existing `node` listener.

Revision pass:

- Reduced page-level vertical scroll by making the Source Library root and three-column cockpit overflow-contained.
- Closed the secondary workbench by default and added an internal scroll container for long secondary panels.
- Moved mock/source records into a collapsed drawer with internal scrolling.
- Changed the Source Detail side area into a compact context inspector with internal-scroll drawers.
- Compacted the global Agent Status rail on Source Library only.
- `npm run build` passed with the existing Vite bundle-size warning.
- `npm run qa:source-library` partially passed: 6 mapper/provider tests passed, and the browser-flow test was blocked before assertions by Chromium macOS Mach service permission.
- `cd src-tauri && cargo test` passed with 82 tests.
- `PATH=/Users/bhuminan/.cargo/bin:$PATH npm run tauri -- dev` was blocked before app launch because port `1420` remained occupied by an existing `node` listener after attempted cleanup.

## J. Remaining Limitations

- The shell is still a first layout pass, not a complete guided workflow.
- Provider/debug/mock surfaces are visually demoted and collapsed, but not fully relocated into a dedicated route.
- The workflow stage state is derived from existing frontend state only.
- Automatic classification, textbook request, and final DOCX output are shown as workflow stages but remain gated/planned where behavior is not implemented.
- Manual visual QA may be blocked if local dev server, Tauri, or Chromium startup is restricted by the environment.

## K. Recommended Next Sprint

Recommended next sprint: 4J-1C parsed-DOCX guided workflow.

Focus on making the center active work area guide the user through:

- DOCX path selection
- parse result review
- SourceDocument candidate review
- explicit SourceDocument save
- explicit SourceCard save
- structured metadata review
- tags and KnowledgeCards
- DraftArtifact mock/not-final save
- export readiness review

Do not expand provider UI unless it becomes the practical blocker to the source-to-draft pipeline.
