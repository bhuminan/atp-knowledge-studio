# Secondary Workbench And Guided Action Path 4J-1D / 4J-2A

## A. Purpose

This batch sprint cleans up Source Library's secondary workbench and adds a clearer parsed-DOCX guided action path MVP.

The goal is to make Source Library feel more action-oriented while keeping source, citation, and persistence boundaries conservative.

Target workflow remains:

```text
Input -> Automatic Classification -> Keep Records by Tag -> Textbook Request -> DOCX Output
```

## B. Relationship To 4J-1A, 4J-1B, And 4J-1C

4J-1A defined the one-screen Source Library information architecture.

4J-1B implemented the workflow shell with top production flow, studio navigation, center work area, context inspector, and a secondary workbench.

4J-1C clarified the left parsed-DOCX intake path and made the right inspector stop presenting mock detail as an active real source.

4J-1D / 4J-2A builds on those changes by:

- making secondary/mock/provider/debug content visually quieter
- keeping secondary panels reachable but collapsed
- adding a 10-step guided action path in the center workflow
- making current, blocked, gated, planned, available, and done states visible from existing frontend state only

## C. What Changed In Secondary Workbench Organization

- The secondary workbench is now labeled as collapsed support tools.
- Mock/demo, provider evidence, queue, audit, and debug previews are explicitly described as secondary to the parsed-DOCX action path.
- Boundary chips remain visible for mock, preview-only, fixture-only, no-network, and evidence-only surfaces.
- The secondary workbench remains reachable with the same existing controls and QA coverage.
- Saved/mock source records are labeled as secondary records and no longer compete visually with the center action path.

## D. What Changed In Guided Action Path

The center active workflow now includes a compact 10-step guided action path:

1. Paste DOCX path
2. Preview file metadata
3. Parse DOCX
4. Review segments/candidate
5. Save SourceDocument
6. Save SourceCard
7. Review metadata
8. Save tags/KnowledgeCards
9. Save DraftArtifact mock/not-final
10. Review export readiness

Each step shows a state derived from existing frontend state:

- current
- available
- done
- blocked
- gated
- planned

No new commands or automation were added. The path points users toward existing controls and preserves explicit-save boundaries.

## E. First Viewport Behavior

The first viewport prioritizes:

- top ATP production flow
- Next action
- left DOCX start action
- center guided action path
- compact guardrails
- right context inspector empty/real-state behavior

Secondary workbench content remains collapsed and visually subordinate.

## F. Real Vs Mock/Preview/Debug Separation

Real parsed-DOCX workflow content remains visually dominant in the top bar, left start area, center guided path, and right real-state inspector.

Mock records, sample source detail, provider candidates, provider evidence, audit trails, dry-run panels, and debug previews remain available but clearly secondary. Mock and preview labels remain visible where mock data or preview-only output is shown.

## G. What Did Not Change

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
- safety gates
- existing functionality

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
- `npm run qa:source-library` passed with 7 tests.
- `cd src-tauri && cargo test` passed with 82 tests.

Post-implementation:

- `npm run build` passed with the existing Vite chunk-size warning.
- `npm run qa:source-library` passed with 7 tests.
- `cd src-tauri && cargo test` passed with 82 tests.
- `git diff --check` passed.

## J. Remaining Limitations

- The guided action path is a frontend workflow map, not a new automation engine.
- SourceDocument/SourceCard save status is owned by existing persistence controls and is not lifted into global Source Library state.
- Later stages can be marked available, gated, or planned based only on existing local review state.
- Provider/debug/audit surfaces remain in the same page for QA and inspection, though visually demoted.
- PDF remains metadata-only/queued.
- `.doc` remains unsupported.

## K. Recommended Next Sprint

Recommended next sprint: 4J-2B persistence-state surfacing.

Focus on safely reflecting saved/read-back SourceDocument and SourceCard state in the main guided action path without changing persistence semantics or weakening explicit save gates.
