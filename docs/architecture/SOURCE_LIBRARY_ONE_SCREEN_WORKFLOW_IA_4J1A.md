# Source Library One-Screen Workflow IA 4J-1A

Status note: The workflow/IA ideas in this document may remain useful, but its 8-bit studio visual language is superseded by `docs/product/ATP_WIN95_FRONTSTAGE_STYLE_BASELINE.md`. Use the current Win95 Functional Frontstage baseline for UI implementation.

## A. Purpose

4J-1A defines the information architecture for turning Source Library into ATP Knowledge Studio's main source-first academic production workspace.

This is an inspection and planning sprint only. It does not implement a new layout, change backend behavior, change persistence, alter metadata semantics, or expand provider UI.

The target workflow is:

```text
Input
-> Automatic Classification
-> Keep Records by Tag
-> Textbook Request
-> DOCX Output
```

The practical goal is to make the real source-to-draft path visible in one screen before adding more features.

## B. Current Screen Problems

Source Library has accumulated several useful but competing surfaces:

- parsed-DOCX intake and persistence workflow
- SourceDocument and SourceCard save/read/list paths
- structured bibliographic metadata review
- MarketingTag and KnowledgeCard candidate/save paths
- DraftArtifact mock/not-final save path
- DOCX export package preview
- provider comparison and evidence panels
- AI request and validation previews
- mock/demo source intake affordances
- debug and audit detail

The problem is not a lack of functionality. The problem is that the strongest working path is visually competing with preview-only, debug-only, provider-only, and older mock surfaces.

The user should not need to scroll through many panels to answer:

- where am I in the academic production pipeline?
- what record is active?
- what is the next safe action?
- which parts are real and which are preview/debug?
- what should I not trust yet?

## C. Main User Workflow

The main Source Library workflow should be treated as one continuous production line:

1. Input
   - Accept a real academic source file or parsed DOCX input.
   - Create or inspect a SourceDocument candidate.
   - Save only through explicit save actions.

2. Automatic Classification
   - Classify the source into safe internal categories.
   - Preserve uncertainty and review requirements.
   - Avoid provider or AI expansion unless explicitly enabled by a later sprint.

3. Keep Records by Tag
   - Save or review SourceCards, structured bibliographic metadata, MarketingTags, and KnowledgeCards.
   - Keep SourceDocument and SourceCard identity distinct.
   - Keep compact metadata and structured bibliographic metadata distinct.

4. Textbook Request
   - Use saved source records and KnowledgeCards as input for a draft request.
   - Keep DraftArtifact status mock/not-final until the drafting workflow is hardened.

5. DOCX Output
   - Review export package readiness.
   - Generate or inspect DOCX output only through existing MVP boundaries.
   - Keep citation and page-number caveats visible.

## D. Proposed One-Screen Source Library Layout

The proposed one-screen layout has five zones.

1. Top Workflow Bar

Shows the production stages:

```text
Input -> Classify -> Tag Vault -> Textbook Request -> Draft/Review -> DOCX Export
```

This bar should show current stage, saved/unsaved state, blockers, and the next safe action.

2. Left Studio Navigation

Uses the 8-bit virtual studio as functional navigation, not decoration.

Proposed rooms:

- Intake Desk
- Classifier Room
- Knowledge Vault
- Writing Studio
- Citation Guard
- Export Station

Each room maps to a production task. Room selection should change the center work area and context inspector without implying a backend behavior change.

3. Center Active Work Area

The center area is the primary task surface. It should show the current source or workflow step, the main review content, and one clear primary action.

For the default state, this should emphasize real parsed-DOCX/source intake rather than mock examples or provider evidence.

4. Right Context Inspector

Shows details for the selected source, card, metadata record, provider candidate, KnowledgeCard, DraftArtifact, or export package.

It should not duplicate the center workflow. It should answer, "What do I need to know about the selected thing?"

5. Collapsed Secondary and Debug Area

Preview-only, mock-only, provider detail, raw evidence, AI request packages, validation previews, audit traces, and raw JSON should start collapsed or be moved behind explicit secondary controls.

## E. First Viewport Priorities

The first viewport should prioritize:

- the production workflow stage
- the selected room
- the active source or record
- the next safe action
- the primary action button
- blocking warnings
- real vs preview/mock/debug labeling
- minimal context for the selected item

The first viewport should not be dominated by provider panels, raw evidence, mock intake copy, AI previews, or historical debugging surfaces.

## F. What Is Visible Without Scrolling

Without scrolling, a user should see:

- top workflow bar
- current stage and next action
- selected studio room
- current input/source/card/draft/export package summary
- one primary center task
- saved/unsaved status chips or counters
- citation/export blockers
- right-side context summary
- clear boundary labels for real, preview, mock, and debug content

## G. What Is Collapsed Or Secondary

These should be collapsed, secondary, or opened only from context-specific controls:

- provider evidence detail
- provider candidate comparison
- external metadata debug panels
- raw source/provider JSON
- AI request package previews
- AI validation previews
- mock/demo records
- historical source examples
- detailed persistence read/list tables
- audit trail expansion
- export internals that are not required for the immediate decision

Collapsed does not mean hidden forever. It means the production workflow remains the first thing the user sees.

## H. Real Vs Preview/Mock/Debug Separation Rules

Use explicit labels and placement rules:

- Real workflow content appears in the top bar, center active work area, and selected context inspector.
- Preview-only content appears behind secondary preview controls.
- Mock-only content is labeled as mock/demo and does not occupy the default primary task position.
- Debug-only content starts collapsed.
- Provider evidence remains context detail, not the main workflow.
- AI request/validation previews remain preview-only until AI/API work is explicitly approved.
- DraftArtifact remains mock/not-final until the draft workflow is hardened.
- APA internal-use candidates remain separate from APA-final verification.

## I. How The 8-Bit Virtual Studio Supports Workflow

The 8-bit studio should help users understand the pipeline at a glance.

It can support workflow by:

- mapping rooms to production stages
- showing the user's current location in the source-to-draft process
- making stage transitions memorable
- giving the dense academic workflow a consistent mental model
- keeping debug/provider/detail panels visually subordinate to production rooms

The studio should not become a decorative landing page. It should act as navigation, stage context, and state communication.

## J. Proposed Information Hierarchy

1. Production workflow state
2. Primary task and next safe action
3. Blocking review, citation, and export warnings
4. Saved record summaries
5. Selected item context
6. Secondary provider, preview, mock, and debug evidence

This hierarchy should be enforced visually through placement, default expansion state, and copy.

## K. Proposed Future Implementation Phases

### 4J-1B Shell/Layout Only

Create the one-screen Source Library shell:

- top workflow bar
- left studio navigation
- center active work area
- right context inspector
- collapsed secondary/debug area

No backend changes. No persistence changes. No new provider behavior. No DOCX export behavior changes.

### 4J-1C Parsed-DOCX Guided Workflow

Move the parsed-DOCX workflow into the center active work area as a guided path.

Focus on:

- current step
- next safe action
- explicit save gates
- review blockers
- citation/export caveats

### 4J-1D Collapse Secondary Provider/Debug Panels

Move provider, evidence, AI preview, mock/demo, and raw debug surfaces into secondary areas.

Keep them available for inspection, but remove them from the default production path.

### 4J-2 Continue Functional Pipeline

After the layout and workflow hierarchy are approved, continue with the highest-value functional pipeline step.

Likely candidates:

- source-to-draft usability improvement
- parsed-DOCX guided workflow improvement
- DOCX export verification improvement
- SourceCard/metadata review workflow improvement

Provider UI should continue only if inspection proves it is the practical blocker.

## L. Guardrails

Do not change in this planning sprint:

- backend commands
- migrations
- persistence behavior
- schema
- SourceDocument save/read/list semantics
- SourceCard save/read/list semantics
- structured bibliographic metadata behavior
- metadata apply behavior
- compact SourceCard apply behavior
- SourceCard title/authors/year/sourceType mutation
- `citationText`
- APA-final verification
- AI/API behavior
- provider lookup behavior
- PDF/OCR behavior
- DOCX export behavior
- dependencies

Future layout work should preserve:

- explicit save gates
- human review boundaries
- untrusted DOCX page number warnings
- chunk references as safer trace evidence
- separation between compact SourceCard metadata and structured bibliographic metadata
- DraftArtifact mock/not-final status

## M. Acceptance Criteria

Future 4J-1B implementation should pass these criteria:

- first viewport shows the main production workflow
- user can tell where to start without scrolling
- real parsed-DOCX/source intake path is dominant
- preview/mock/debug/provider surfaces are secondary or collapsed
- current state and next safe action are visible
- 8-bit studio acts as functional navigation
- citation and export guardrails remain visible
- no backend, persistence, schema, metadata, or export behavior changes
- existing build and Rust tests still pass

## N. Recommendation For Current Uncommitted 4J-1 Changes

Uncommitted 4J-1 changes exist and should not be committed as-is.

Changed files observed:

- `src/features/source-library/SourceLibraryPage.tsx`
- `src/features/source-library/components/PersistenceSaveCandidatePreview.tsx`
- `tests/e2e/source-library.spec.ts`
- `docs/architecture/PARSED_DOCX_SOURCE_TO_DRAFT_WORKFLOW_USABILITY_4J1.md`

Reusable ideas:

- renaming the old mock-oriented intake copy toward Source Intake Desk
- making the real parsed-DOCX path more visible
- showing current workflow step and next safe action
- keeping citation/export guardrails close to the workflow
- deriving visible status from existing frontend state without persistence changes

Not reusable as-is:

- the full Real DOCX Pipeline Status panel inside `PersistenceSaveCandidatePreview.tsx`, because it adds another vertical panel before the screen hierarchy is fixed
- test assertions tied to that specific panel
- the 4J-1 documentation file as the final sprint artifact, because 4J-1A supersedes it with an IA-first direction

Recommendation: revise later after this IA plan is approved. If the user wants to salvage work before implementing 4J-1B, keep selected copy and next-action helper ideas only, then reshape them into the one-screen shell.

Do not discard the current uncommitted changes until the user explicitly approves that cleanup.

## O. QA Plan For Future Implementation

For 4J-1B and later implementation sprints, run:

- `npm run build`
- `npm run qa:source-library`
- `cd src-tauri && cargo test`
- `git diff --check`
- `git status`

Additional browser QA should verify:

- first viewport at desktop size
- first viewport at narrow/mobile width if supported
- no overlapping text or controls
- real workflow remains visually dominant
- provider/mock/debug panels are secondary or collapsed
- no behavior changes to save/read/list/export flows

If Chromium browser QA is blocked by macOS sandbox permissions, report the environment issue and rely on build, unit, and Rust tests for the planning sprint.
