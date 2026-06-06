# ATP Auditor-Aligned Frontstage IA Decision 4Q-0

## Executive Summary

Sprint 4Q-0 records the accepted post-audit operating decision for ATP
Knowledge Studio frontstage information architecture.

ATP is a personal academic knowledge studio and AI research office, not a
backend console. The app should translate backend trust into calm
academic-facing workflow. Audit, read-back, command state, safety flags, and
provider detail remain essential, but they should live behind progressive
disclosure unless they are needed for an immediate user decision.

The accepted frontstage room model is:

- Home
- Library
- Cabinet
- Writer
- Art
- Settings

INPUT is no longer a top-level frontstage room name. Intake remains important,
but it now lives inside Library as an internal mode. Library is the user's
source intake and saved SourceDocument review desk.

This checkpoint converts the 4P-11 external audit packet, frontstage master
plan, user-needs brief, and SourceDocument/SourceCard guardrail checkpoints
into an implementation sequence for the next IA simplification sprints. It does
not modify runtime UI, backend behavior, schema, commands, persistence,
parser/classification, AI/provider behavior, citation, APA, Writer, DOCX
export, package files, dependencies, or lockfiles.

## Source Documents Inspected

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/product/ATP_FRONTSTAGE_MASTER_DESIGN_PLAN_4P11Y.md`
- `docs/product/ATP_USER_NEEDS_AND_PRODUCT_INTENT_4P11Z.md`
- `docs/audit/ATP_EXTERNAL_DESIGN_AUDIT_PACKET_4P11X.md`
- `docs/audit/ATP_CURRENT_UX_PROBLEMS_4P11X.md`
- `docs/audit/ATP_NEXT_SPRINT_PRIORITIES_4P11X.md`
- `docs/audit/ATP_EXTERNAL_AUDIT_QUESTIONS_4P11X.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_UI_CHECKPOINT_4P10.md`
- `docs/architecture/SOURCECARD_METADATA_REVIEW_BACKEND_CHECKPOINT_4P8D.md`
- `docs/architecture/SOURCEDOCUMENT_SAVED_STATE_CHECKPOINT_4O0.md`

The local repository also contains newer local commits after the stated
`origin/main` reference `9c3349e`. The current local branch is treated as the
source of truth for this checkpoint.

## Auditor Recommendations Accepted

The audit conclusion is accepted: the current primary risk is excessive
frontstage complexity, not insufficient backend rigor.

Accepted recommendations:

- Simplify navigation around user-facing rooms.
- Make ATP feel like an academic research office, not a backend console.
- Hide backend/audit/status details by default.
- Use progressive disclosure for trust evidence.
- Make Source Library a review desk rather than a backend stack.
- Simplify Writer around one primary writing task.
- Keep backend trust boundaries intact while reducing visible technical noise.
- Preserve pixel art as identity and wayfinding, not dense work structure.
- Use a 5-second test as the practical acceptance standard for future UI
  sprints.

## Auditor Recommendations Refined

The 4P-11Y plan used a four-room frontstage model: Library, Cabinet, Writer,
and Art. Sprint 4Q-0 refines that into the operating navigation model:

- Home
- Library
- Cabinet
- Writer
- Art
- Settings

Home is the orientation room and calm entry point. Settings remains visible
because provider, integration, and advanced status need a stable destination
outside daily work rooms.

The earlier INPUT room concept is refined rather than deleted. Intake remains a
core daily workflow, but INPUT is not a top-level frontstage room. Intake is a
Library mode, opened from Library navigation or from the Home AI Librarian Desk
shortcut.

The audit recommendation to hide backend detail is also refined: backend detail
must not disappear. It should move into a consistent Inspector pattern so the
user can inspect trust when needed without seeing an unstructured backend dump.

## Recommendations Deferred

These recommendations are deferred until after the 4Q IA simplification pass:

- Active SourceCard metadata editing UI.
- UI call to `saveSourceCardMetadataReview`.
- Active SourceCard creation.
- Citation-ready verification.
- APA-final verification.
- Parser/classification integration from the Library save path.
- AI/provider lookup or provider-to-persistence behavior.
- Writer real generation.
- DOCX export changes.
- Cabinet production retrieval UX beyond clear placeholder/data honesty.
- Art production workflows beyond clear placeholder/data honesty.
- Project context in the topbar before project management exists.

## Recommendations Rejected

No external audit recommendation is rejected outright in this checkpoint.

Two possible interpretations are explicitly rejected:

- Do not create a separate INPUT top-level navigation item.
- Do not solve cognitive load by weakening audit, read-back, idempotency,
  SourceCard, citation, APA, parser, classification, AI/provider, or no-hidden-
  mutation guardrails.

## Updated Frontstage IA Model

The accepted frontstage model is:

### Home

Home is the orientation room. It answers what needs attention, what room the
user should enter next, and whether anything is blocked or risky.

Home may include an AI Librarian Desk. The desk is a shortcut into Library,
ideally opening Library in Add sources mode. It is not a separate INPUT room.

### Library

Library is the intake and saved SourceDocument review desk.

Primary user question:

> What sources do I have and what needs review next?

Library contains both source intake and saved SourceDocument review. It
protects the SourceDocument-only boundary, keeps SourceCard creation deferred,
and makes metadata readiness visible without implying citation or APA finality.

### Cabinet

Cabinet is the trusted knowledge vault.

Primary user question:

> What trusted knowledge can I reuse?

Cabinet should remain visible as a calm room even when real data is limited.
If it has no real production records yet, it should show honest empty or
placeholder state, not fabricated mock knowledge.

### Writer

Writer is the writing workspace.

Primary user question:

> What am I writing now and what evidence supports it?

Writer remains mock-only unless a later sprint explicitly changes that. Future
Writer simplification should make the draft/writing request the center of the
screen and move agent/backend details behind Inspector or compact validation.

### Art

Art is the visual output room for slides, infographics, visual briefs, and
teaching assets.

Art remains visible at normal opacity with a small "soon" badge when not fully
real. It should not be dimmed so much that it looks broken.

### Settings

Settings is the place for integration status, provider status, advanced
configuration, and developer-oriented diagnostic destinations. Provider chips
and mock provider badges do not belong in the default topbar.

## Library = Intake + Review Desk Decision

Library is the room. Intake and saved source review are internal Library modes.

Library mode switch:

- Place a compact two-option toggle at the top of the left column.
- Labels: "Saved sources" and "Add sources".
- Do not use top-level tabs.
- Do not use a full-page segmented control.

Add sources mode:

- Shows drop zone, path entry, queue, and approval controls.
- Keeps SourceDocument-only save boundaries explicit.
- Shows a short receipt after save.

Saved sources mode:

- Shows saved SourceDocuments.
- Shows selected SourceDocument detail.
- Shows metadata readiness without implying SourceCard, citation, or APA
  readiness.

Home AI Librarian Desk:

- May link directly into Library.
- Should preferably open Library in Add sources mode.
- Must not create a separate INPUT top-level nav item.

## Navigation / Topbar Decision

4Q-1A should simplify navigation and topbar before deeper screen redesign.

Navigation decisions:

- Rename Dashboard to Home.
- Use text + icon navigation, not icon-only navigation.
- Reduce navigation to Home, Library, Cabinet, Writer, Art, Settings.
- Keep Cabinet visible as a calm room with honest no-real-data state if needed.
- Keep Art visible at normal opacity with a small "soon" badge if needed.
- Remove Workflow Board, Knowledge Brain, Slide Studio, Visual Studio,
  Obsidian Vault, Audit Log, and similar backend/module routes from default
  daily navigation unless they are re-homed into a room or Advanced location.

Topbar decisions:

- Keep the topbar quiet.
- Show ATP Studio wordmark.
- Show current room breadcrumb.
- Show a Settings icon.
- Remove mock provider chips from the default topbar.
- Move provider, integration, mock/API, and advanced status to Settings /
  Integrations / Advanced.
- Add project context only after real project management exists.

## Inspector Decision

4Q-1B should introduce or standardize a shared Inspector shell before the
Library review desk redesign.

The Inspector is a right-side collapsible drawer/panel, not a modal.

Expected pattern:

- Collapsed width: 40px icon rail.
- Open width: 240-280px.
- Default target width: 260px.
- Parent controls collapsed/open state.
- Triggered by an Inspect button or View audit details link.
- If the Inspector is open and the user changes selected source, the Inspector
  stays open and updates its content.

Inspector content belongs here:

- audit ids
- read-back detail
- backend command details
- metadata review records
- safety flags
- provider details
- developer diagnostics
- raw or structured trust evidence

Inspector must be structured. It must not become a loose backend dump. Details
should be grouped into clear sections such as Receipt, Audit, Metadata Review,
Safety Flags, Provider Evidence, and Diagnostics.

The Inspector must come before the Library review desk redesign so audit,
backend, and status panels have a consistent disclosure destination.

## Library Review Desk Decision

4Q-1C should redesign Library around a three-column review desk:

- Left: source list / intake queue controls.
- Center: selected source or add-source task.
- Right: Inspector rail/drawer.

Library empty state:

- Show Add sources as the clear primary action.
- Use short calm copy, two sentences max.
- AI Librarian illustration is allowed.
- Do not show ATP Production Flow.
- Do not show blocked workflow steps.
- Do not show Context Inspector.
- Do not show Agent Status rail.
- Do not show backend/debug panels.
- Do not show full pipeline graphics when no source exists.

Library selected source state:

- Use one primary badge only.
- Severity hierarchy: Blocked > Needs review > Saved.
- Show the highest-severity unresolved state as the primary badge.
- Use one quiet secondary detail line.

Recommended secondary detail line:

> Read-back verified - SourceCard not created - Citation not verified

Do not show all states as equal badges. Do not derive citation-ready,
APA-final, or SourceCard-ready from UI state.

Calm receipt:

- "Source saved."
- "Read-back verified - Audit written - SourceCard not yet created."
- "View audit details ->"

Raw audit ids, command names, read-back comparison tables, safety flag JSON,
and backend details go into Inspector.

## Writer Workspace Decision

4Q-2 should make Writer writing-workspace-first.

Accepted Writer decisions:

- Draft / writing request dominates the center.
- Agent Status rail is hidden by default.
- Mock state is shown as one small honest badge, for example:
  "Mock sandbox - No real API call".
- Repeated large mock badges should be removed from the draft area in future
  implementation.
- Replace agent rail with compact validation strip:
  Evidence / Citation / Structure.
- Clicking a validation chip may later open Inspector filtered to the relevant
  detail.
- Writer remains mock-only unless a later sprint explicitly changes that.

## Visual System Decision

Pixel art remains part of ATP identity, but it should not carry dense work
structure.

Accepted visual decisions:

- Pixel art is identity and wayfinding, not structure.
- Keep pixel art on Home, room cards, room headers, AI Librarian avatar, and
  empty states.
- Reduce pixel border decoration in dense work areas.
- Reduce hard pixel panel shadows in dense work areas.
- Make work panels cleaner, calmer, and more readable.
- Keep dark blue academic base, teal/light-blue action accents, and golden
  review accents.
- Use green/orange/red trust status consistently, but avoid displaying many
  equal-status badges at once.

## 5-Second Test QA Standard

Future UI sprints should use a 5-second acceptance test.

A screen passes if a user can answer these questions in 5 seconds:

- Which room am I in?
- What should I do next?
- Is anything blocked or risky?
- Where do I find more detail?

Preferred solo testing method:

- Wait 24-48 hours before retesting the screen.

Alternative solo testing method:

- Take a screenshot.
- Cover surrounding context.
- Ask the four 5-second questions from the screenshot alone.

Minimum future states to test:

- Library empty state.
- Library with selected source.
- Writer empty/no draft state.
- Writer with draft generated.

## Implementation Sequence 4Q-1A Through 4Q-3

Accepted post-audit implementation sequence:

1. 4Q-1A Navigation & Topbar Simplification
2. 4Q-1B Shared Inspector Shell
3. 4Q-1C Library Review Desk Simplification
4. 4Q-2 Writer Workspace Simplification
5. 4Q-3 Mock/Real Data Cleanup and Dashboard/placeholder clarity

The Inspector shell must come before the Library review desk redesign so the
existing backend/audit/status panels have a consistent destination before they
are removed from default frontstage.

## Guardrails / Strict Non-Goals

The following guardrails must remain active:

- SourceDocument-only explicit save gate.
- Audit events.
- Read-back verification.
- Idempotency.
- SourceCard creation boundary.
- Citation-ready boundary.
- APA-final boundary.
- Parser/classification/AI/provider gates.
- No hidden mutation.
- No auto-save without explicit approval.
- No direct AI/provider-to-persistence overwrite.
- No fabricated citation metadata.

Strict non-goals for this sprint:

- No runtime UI changes.
- No React component changes.
- No backend code changes.
- No SQLite schema or migration changes.
- No command or TypeScript bridge changes.
- No active metadata editing UI.
- No call to `saveSourceCardMetadataReview` from UI.
- No SourceCard creation.
- No citation-ready or APA-final verification.
- No parser/classification/AI/provider integration.
- No Writer real generation.
- No DOCX export changes.
- No package, Cargo, dependency, or lockfile changes.

## Acceptance Criteria For 4Q-0

4Q-0 is accepted when:

- The accepted frontstage room model is documented as Home, Library, Cabinet,
  Writer, Art, Settings.
- INPUT is documented as an internal Library intake mode, not a top-level room.
- The Library = intake + saved SourceDocument review desk decision is recorded.
- The 4Q-1A through 4Q-3 implementation sequence is recorded.
- Navigation/topbar decisions are recorded.
- Inspector pattern decisions are recorded.
- Library review desk decisions are recorded.
- Writer workspace decisions are recorded.
- Visual system decisions are recorded.
- The 5-second test QA standard is recorded.
- Guardrails and strict non-goals are preserved.
- The master design plan is updated with a concise 4Q-0 checkpoint.
- Verification passes.

## Scope Protection Statement

This sprint is documentation-only. It records product and IA decisions for
future implementation sprints.

It does not add, remove, or alter runtime behavior. It does not change
TypeScript app code, Rust backend code, SQLite schema/migrations, tests,
commands, bridges, parser/classification behavior, AI/API/provider behavior,
CitationGuard, APA verification, citation metadata, evidence review, DOCX
export, WriterAgent behavior, network behavior, dependencies, package files,
Cargo files, or lockfiles.

SourceDocument-only intake remains intact. SourceCard/downstream records are
not created. Metadata editing remains inactive. Citation/APA metadata is not
inferred.
