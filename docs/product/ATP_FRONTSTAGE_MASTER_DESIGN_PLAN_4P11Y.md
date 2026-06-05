# ATP Frontstage Master Design Plan 4P-11Y

## 1. Executive Summary

ATP Knowledge Studio is a personal academic knowledge studio and personal
academic library for source intake, knowledge organization, citation-safe
writing, teaching material preparation, and visual academic outputs.

The product should feel like an AI research office, not a backend console. Its
default frontstage UX should be organized around four rooms:

- Library
- Cabinet
- Writer
- Art

Backend quality, audit, read-back, validation, idempotency, and safety
boundaries must remain strong. The redesign goal is not to weaken the backend.
The redesign goal is to translate backend rigor into simpler user-facing
language and hide most backend detail by default.

The immediate design problem is that current non-Dashboard screens expose too
much backend, status, debug, preview, audit, and disabled-future information at
once. The result is high cognitive load. Dashboard currently communicates the
product most clearly because it points toward a room model. The rest of the app
needs to adopt that clarity.

## 2. Current Problem Statement

Current user-facing problems:

- Dashboard is the only screen that currently communicates the product clearly.
- Source Library, Writer, and other screens show too many technical panels.
- The left menu reflects an older module/backend structure rather than current
  user jobs.
- The left menu duplicates Dashboard room cards.
- Screens use many nested frames and panels.
- Too much backend capability is shown frontstage.
- Users can be unsure what to do next on dense screens.
- Writer screen feels confusing because agent/backend status competes with the
  writing task.
- Source Library feels like a backend/debug console, not a review desk.
- The app must become easy, smooth, trustworthy, and systematic.

The current backend and safety work is valuable. The problem is presentation:
technical certainty is being shown as technical surface area. The frontstage
should instead show clear tasks, simple trust states, and short receipts.

## 3. Design Principle: Frontstage vs Backstage

Frontstage is what the user needs to decide or do now.

Backstage is audit, command status, backend status, provider status,
diagnostics, implementation internals, and agent internals.

Rules:

- Backend should remain strong but should not dominate the default UI.
- Backstage detail should live inside Inspector, Advanced, Audit Trace, or
  Developer mode.
- Frontstage copy should translate backend state into plain workflow language.
- The user should see one main task per screen.
- Advanced panels should explain trust when the user asks for detail, not
  compete with the primary action.

Example translation:

- Backend: read-back verified, audit event ids written.
- Frontstage: Source saved. Receipt available.
- Backstage: exact audit event ids and command result details.

## 4. Four-Room Frontstage Model

### A. Library

Purpose:

- intake documents
- save SourceDocuments
- review metadata readiness
- prepare sources for later knowledge/writing use

Primary user question:

> What sources do I have and what needs review next?

Library is the intake and review desk. It should help the user add source
material, understand what is ready, review what is blocked, and preserve
SourceDocument provenance before anything moves downstream.

### B. Cabinet

Purpose:

- organized knowledge vault
- reviewed SourceCards / future KnowledgeCards
- search and retrieve trusted material

Primary user question:

> What trusted knowledge do I have ready to use?

Cabinet should represent reviewed and usable knowledge. It is not the raw
intake queue and should not be confused with Source Library intake.

### C. Writer

Purpose:

- create textbook chapters, drafts, teaching documents, and article drafts
- work from reviewed source packages
- show outline, current draft, and evidence context

Primary user question:

> What am I writing now and what evidence supports it?

Writer should be centered on writing output. Agent/provider/internal validation
state can exist, but it should support the writing task from backstage.

### D. Art

Purpose:

- visual assets
- slide briefs
- infographics
- image prompts
- teaching visuals

Primary user question:

> What visual output do I need from my knowledge base?

Art should use reviewed knowledge as input. It should not be mixed with Writer
unless the current task explicitly requires writing-to-visual production.

## 5. Navigation Strategy

The current left menu should be replaced, minimized, or redesigned around the
frontstage room model.

Current menu items to reconsider:

- Dashboard
- Source Library
- Workflow Board
- Knowledge Brain
- Writer Studio
- Slide Studio
- Visual Studio
- Obsidian Vault
- Audit Log
- Settings

Proposed frontstage navigation:

- Home
- Library
- Cabinet
- Writer
- Art
- Settings / Advanced

Recommendation:

- Dashboard room cards can become the primary navigation.
- Avoid duplicating the same navigation both as room cards and as a long left
  menu.
- Workflow Board, Audit Log, Obsidian Vault, backend/provider diagnostics, and
  agent internals should move to Advanced, Inspector, Admin, or Details.
- If a left rail remains, it should be short, room-based, and quiet.
- Secondary tools should appear contextually inside the room where they help.

## 6. Dashboard Design Direction

Dashboard should be an entrance and orientation screen, not a control panel.

Dashboard should answer:

- What needs attention now?
- Which room should I enter?
- What is safe, needs review, or blocked?

Recommended dashboard elements:

- Four room cards: Library, Cabinet, Writer, Art.
- A small Today's Work or Next Action strip.
- Simple trust summary: Ready / Needs Review / Blocked.
- Minimal diagnostics hidden under Advanced.
- No large workflow board by default.
- No backend status wall by default.
- No repeated nested frames.

The Dashboard should preserve the 8-bit academic office charm, but the charm
should function as orientation. It should not become decorative clutter.

## 7. Library Room Design Direction

Library should become a review desk, not a backend console.

Proposed layout:

- Left: Sources / Saved Documents.
- Center: Current Review Task.
- Right: Inspector / Details.

Default view should show:

- saved sources
- current source status
- primary next action
- simple readiness summary

Hide by default:

- raw backend status
- full audit traces
- command names
- schema/backend details
- multiple preview panels
- disabled shells unless the user opens Advanced

Library should use progressive disclosure:

- Summary first.
- Details second.
- Audit/backend third.

Suggested default Library flow:

1. Select or add a source.
2. Show whether it is saved, needs review, or blocked.
3. Offer one primary next action.
4. Show a short receipt after save/read-back.
5. Keep Advanced Audit available but collapsed.

The Source Library should not stack every safety boundary as a full panel. It
should summarize safety in plain language and let the user open details.

## 8. Cabinet Room Design Direction

Cabinet is the trusted knowledge vault.

It should show only reviewed, usable knowledge:

- SourceCards
- KnowledgeCards
- evidence cards
- case cards
- quote cards
- writing angle cards

Current status:

- Cabinet is mostly future-facing.
- It should not be confused with Source Library intake.
- It should represent organized, trusted material after review.

Cabinet should emphasize search, retrieval, relationships, and evidence
readiness. It should not show raw intake warnings unless a reviewed knowledge
item has a trust issue the user must resolve.

## 9. Writer Room Design Direction

Writer should focus on writing output, not agents or backend state.

Proposed layout:

- Left: Project / Chapter Navigator.
- Center: Current Writing Workspace.
- Right: Evidence / Context Drawer.

Writer should answer:

- What am I writing?
- What section am I on?
- What evidence supports this section?
- What is the next writing action?

Hide by default:

- agent roster
- internal contract details
- backend status
- mock labels
- diagnostics
- long technical panels

Recommended primary actions:

- Continue Draft.
- Generate Draft from Reviewed Sources.
- Review Evidence.
- Export Draft, when ready.

Writer should show source trust where it affects writing. It should not require
the user to parse backend validation panels before understanding the writing
task.

## 10. Art Room Design Direction

Art should be a visual production room for:

- teaching visuals
- infographics
- slides
- image prompts
- visual briefs

Art should not be mixed with Writer unless the task requires it. A writing task
can hand off to Art when a visual output is needed, but Art should have its own
workspace, inputs, and review state.

Art room should use reviewed knowledge as input, not raw unreviewed sources.
If source evidence is not reviewed, Art should show a simple trust warning
rather than exposing backend records.

## 11. SourceDocument and SourceCard UX Translation

Backend reality now:

- SourceDocument save/read/audit exists.
- SourceCard metadata review schema/commands exist.
- SourceCard creation does not exist from the current intake path.
- Metadata editing UI does not exist.
- Citation/APA finality does not exist.

User-facing translation:

- Source saved.
- Metadata needs review.
- No SourceCard created yet.
- Citation/APA not verified.
- Advanced audit available.

Do not show all backend layers by default. The user should not need to know
command names, schema names, or table boundaries to understand the current
source state.

Recommended SourceDocument card language:

- Saved Source.
- Needs Metadata Review.
- Citation Not Verified.
- SourceCard Not Created.
- View Audit Details.

Recommended SourceCard future language:

- Ready to Create SourceCard.
- Blocked: Metadata Review Needed.
- Reviewed Knowledge Item.
- Evidence Attached.

## 12. Trust Model

Trust colors should guide attention:

- Green = ready / safe.
- Orange = needs human review.
- Red = blocked / unsafe.

Trust model rules:

- Green can be summarized.
- Orange requires user review.
- Red blocks action.
- Advanced details explain why.

The UI should avoid showing every safety flag at equal weight. Only the current
blocking or review-relevant state should be frontstage.

## 13. Progressive Disclosure Rules

The UI should follow these rules:

- Primary action visible.
- Secondary details collapsible.
- Audit/backend hidden under Advanced.
- No more than one main task per screen.
- Avoid stacking multiple preview panels.
- Avoid showing disabled future features as full panels unless necessary.
- Use "future" labels sparingly.

Disclosure levels:

1. Frontstage summary: what is happening and what to do next.
2. Detail view: selected source/draft/card fields relevant to the task.
3. Inspector: audit, backend status, provider details, read-back ids, command
   status, and diagnostics.
4. Developer/Admin mode: schema, command names, raw technical surfaces.

## 14. Current Backend Should Not Be Removed

Backend work is valuable and should remain.

Do not remove or weaken:

- audit events
- read-back verification
- idempotency
- validation
- SourceDocument-only boundary
- SourceCard creation boundary
- citation/APA safety boundary
- parser/classification/AI/provider gates

The redesign should map backend state into simpler user-facing language. It
should preserve trust without making backend machinery the main experience.

## 15. What Should Change Next

Recommended next work after external audit:

- simplify navigation
- redesign Dashboard as room entrance
- redesign Source Library as review desk
- redesign Writer as writing workspace
- collapse backend/status/audit details
- reduce nested frames
- remove redundant menu concepts
- create an Advanced or Inspector disclosure pattern

The next UX work should decide what belongs frontstage and what belongs
backstage before new capabilities are made more visible.

## 16. What Should Not Happen Yet

Explicit non-goals:

- do not open active metadata editing yet
- do not create SourceCards yet
- do not connect parser/classification/AI/provider yet
- do not build more visible backend panels
- do not add more top-level rooms
- do not polish visual style before simplifying IA

More backend expansion may be valuable later, but it should not be the immediate
frontstage sprint unless the external audit confirms the UX direction.

## 17. External Audit Questions

Questions for the design consultant:

- Is the 4-room model enough?
- Should the left menu be removed, collapsed, or redesigned?
- Should Dashboard room cards be the main navigation?
- What should the first visible action be in Library?
- What should the first visible action be in Writer?
- Which backend/status panels should be hidden by default?
- How should trust/audit be shown without overwhelming users?
- What should be the minimum viable Source Library screen?
- What should be the minimum viable Writer screen?
- Should metadata editing remain blocked until IA is simplified?
- What is the next safest UX implementation sprint?

Additional critique prompts:

- Which current labels are user-facing and which are internal?
- Where should Advanced/Inspector live?
- What does a trustworthy but calm receipt look like?
- How much of the 8-bit office metaphor should remain visible during work?
- Which current screen can be simplified first without weakening safety?

## 18. Recommended Next Sprint

Recommended next sprint:

- Frontstage IA Redesign Plan

or:

- Source Library Review Desk Simplification Plan

Do not recommend backend expansion as the immediate next sprint unless the
external audit confirms the current UX direction. The safest next step is to
make the existing safety model understandable, calm, and task-centered.
