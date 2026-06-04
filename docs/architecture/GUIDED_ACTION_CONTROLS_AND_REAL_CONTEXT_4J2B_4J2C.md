# Guided Action Controls And Real Context 4J-2B / 4J-2C

## A. Purpose

This sprint makes the existing Source Library guided action path more operational without adding backend behavior.

The goal is to help users move through the parsed-DOCX workflow by revealing existing controls and clarifying the right-side real source context.

## B. Relationship To 4J-1A, 4J-1B, 4J-1C, And 4J-1D/4J-2A

4J-1A defined the one-screen Source Library information architecture.

4J-1B implemented the workflow shell.

4J-1C clarified the parsed-DOCX intake path and empty real-source state.

4J-1D / 4J-2A added the 10-step guided action path and demoted secondary/mock/provider/debug surfaces.

4J-2B / 4J-2C keeps that structure and adds lightweight reveal controls plus clearer real parsed-DOCX context copy.

## C. Guided Action Control Behavior

The 10-step guided action path remains:

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

Current, available, and done steps may show a small affordance such as:

- Paste path on left
- Open metadata preview
- Open parsed DOCX preview
- Open save SourceDocument section
- Open SourceCard save section
- Open metadata review
- Open KnowledgeCard section
- Open DraftArtifact section
- Open export readiness

These controls only reveal existing UI sections through local refs or existing drawer state. They do not save, export, apply metadata, verify APA, or call new commands.

Blocked, gated, and planned steps continue to show reasons instead of action buttons.

## D. Real Source Context Behavior

The right context inspector still shows a clean empty state when no real parsed-DOCX source is active.

When parsed DOCX frontend state exists, the inspector shows compact real context:

- SourceDocument status
- SourceCard status
- metadata review state
- KnowledgeCard readiness
- DraftArtifact readiness

This is frontend workflow context only. It does not claim that records are saved unless existing frontend state can support that claim.

Mock/source sample detail remains reachable through the existing collapsed sample drawer and remains labeled as mock/secondary.

## E. What Changed

- Added local reveal affordances to guided action steps.
- Added a primary current-step control in the center workflow.
- Added compact real parsed-DOCX context to the right inspector when parsed frontend state exists.
- Preserved the empty real-source state when no parsed DOCX exists.
- Kept secondary/mock records and provider/debug panels demoted and reachable.
- Added the external metadata evidence-is-not-truth guardrail to the compact guardrail chip list.

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
- existing save/export/apply controls

## G. Guardrails

Visible compact guardrails remain:

- explicit save required
- DOCX page numbers untrusted
- chunk references safer than fake page numbers
- APA preview internal-use only
- no APA-final verification
- SourceCard `citationText` not overwritten
- DraftArtifact remains mock/not-final
- export remains gated
- external metadata evidence is not truth

## H. QA Results

Baseline before implementation:

- `npm run build` passed with the existing Vite chunk-size warning.
- `npm run qa:source-library` passed with 7 tests.
- `cd src-tauri && cargo test` passed with 82 tests.

Post-implementation:

- `npm run build` passed with the existing Vite chunk-size warning.
- `npm run qa:source-library` passed with 7 tests.
- `cd src-tauri && cargo test` passed with 82 tests.
- `git diff --check` passed.

## I. Remaining Limitations

- Reveal controls are local UI navigation helpers, not workflow automation.
- Saved/read-back SourceDocument and SourceCard state still lives inside existing persistence UI rather than a shared global Source Library state.
- The real context inspector can only summarize frontend parsed-DOCX state available to the page.
- Later stages remain gated or planned where prerequisites are not present.

## J. Recommended Next Sprint

Recommended next sprint: 4J-2D shared persistence status surfacing.

Focus on safely lifting saved/read-back SourceDocument and SourceCard status from existing persistence controls into a shared UI summary while preserving explicit save gates and backend behavior.
