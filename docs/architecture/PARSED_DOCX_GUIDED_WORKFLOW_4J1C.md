# Parsed-DOCX Guided Workflow 4J-1C

## A. Purpose

4J-1C improves the Source Library parsed-DOCX start path inside the one-screen workflow shell.

The sprint goal is clarity only: make the first usable action obvious, align the top next action with existing frontend state, keep the center parsed-DOCX workflow dominant, and prevent mock/source sample detail from looking like an active real source.

Target user flow remains:

```text
Input -> Automatic Classification -> Keep Records by Tag -> Textbook Request -> DOCX Output
```

This sprint focuses on the Input / parsed-DOCX start path. Later stages remain visible but gated or planned.

## B. Relationship To 4J-1A And 4J-1B

4J-1A defined the one-screen Source Library information architecture.

4J-1B implemented the first shell:

- top workflow bar
- compact 8-bit studio navigation
- center active parsed-DOCX work area
- right context inspector
- secondary workbench for mock/demo/provider/debug surfaces

4J-1C refines that shell without changing backend behavior.

## C. What Changed

- The left intake panel now emphasizes `Paste local DOCX path` as the current usable start action.
- Disabled drag/drop and native file picker copy is visually demoted.
- A compact four-step intake card was added:
  - Step 1: Paste DOCX path
  - Step 2: Preview metadata
  - Step 3: Parse DOCX
  - Step 4: Save SourceDocument
- PDF behavior is described as metadata-only/queued.
- Legacy `.doc` files are explicitly described as unsupported and should be converted to `.docx` or PDF.
- The center workflow step list is shorter and highlights the current step from existing frontend state.
- Long guardrail text was converted into compact chips.
- The right context inspector now shows an empty real-source state when no parsed local DOCX workflow exists.
- Mock source card/detail content remains reachable but is labeled as secondary sample content.

## D. First-Viewport Intake Behavior

The first viewport now leads with the usable path:

```text
Paste local DOCX path -> Preview metadata -> Parse DOCX -> Save SourceDocument
```

The disabled file picker remains visible but no longer competes as the primary instruction. Drag/drop is not presented as the dominant source action because it is not active.

## E. Next-Action Behavior

Next action copy is derived from existing frontend state only:

- No selected local file:
  - `Paste a local DOCX path to start.`
- Metadata preview exists but DOCX is not parsed:
  - `Run DOCX parsing, then review extracted segments.`
- Parsed candidate exists and no SourceDocument save state is available in frontend:
  - `Save SourceDocument explicitly.`
- PDF selected:
  - `PDF is metadata-only/queued; paste a DOCX path for parsing.`

No backend saved-state detection was added.

## F. Real Vs Mock/Preview Separation

Real parsed-DOCX workflow content stays in:

- top workflow bar
- left intake start card
- center active work area
- right inspector empty/real-state copy

Mock/demo/provider/debug surfaces remain available under secondary areas. Saved/mock source records remain labeled as mock records and do not present themselves as the active real parsed-DOCX source.

## G. What Did Not Change

4J-1C did not change:

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
- safety gates

## H. Guardrails

Visible compact guardrails remain:

- explicit save required
- DOCX page numbers untrusted
- chunk references safer than fake page numbers
- APA preview internal-use only
- no APA-final verification
- SourceCard `citationText` not overwritten
- DraftArtifact remains mock/not-final
- export remains gated

## I. QA Results

Baseline before implementation:

- `npm run build` passed with the existing Vite chunk-size warning.
- `npm run qa:source-library` was blocked in the sandbox because the local dev server could not bind `127.0.0.1:1420`.
- Rerunning `npm run qa:source-library` with local-server permission started the suite; 6 mapper/provider tests passed and the browser flow timed out on an existing context-inspector summary click interception.
- `cd src-tauri && cargo test` passed with 82 tests.

Post-implementation:

- `npm run build` passed with the existing Vite chunk-size warning.
- `npm run qa:source-library` passed with 7 tests.
- `cd src-tauri && cargo test` passed with 82 tests.
- `git diff --check` passed.

## J. Remaining Limitations

- SourceDocument save state is not tracked in frontend state, so the parsed candidate state can only instruct explicit save.
- PDF remains metadata-only/queued.
- `.doc` remains unsupported.
- Automatic classification, textbook request, and final DOCX output remain gated/planned.
- Mock/provider/debug panels are still reachable in the same page, although visually demoted.
- Manual visual QA depends on the local environment allowing Tauri and browser startup.

## K. Recommended Next Sprint

Recommended next sprint: 4J-1D secondary workbench reduction.

Focus on moving provider, evidence, AI preview, mock/demo, and raw debug surfaces farther behind secondary controls while preserving QA coverage and inspection access.
