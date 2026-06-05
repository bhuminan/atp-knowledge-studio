# ATP Current UX Problems 4P-11X

## Core Concern

ATP has strong backend safety work, but the frontend shows too much of that
backend state too early. The user wants a simple, systematic, smooth,
trustworthy app. The current cognitive load is high because many screens expose
debug/status/audit concepts before the user has a single clear primary action.

## Explicit Current Concerns

- Dashboard is the only screen that clearly communicates what the app is doing.
- Other screens expose too much backend/debug/status detail.
- Source Library is dense and cognitively heavy.
- Writer screen is visually overwhelming and unclear what to do first.
- The left menu reflects older backend/module concepts rather than the current
  user-facing 4-room model.
- Menu items duplicate Dashboard room cards.
- There are too many nested frames and panels.
- Too many preview/status/disabled sections are visible at once.
- Backend quality is valuable but should not be frontstage by default.
- The app needs progressive disclosure.
- Audit/backend/status should move to Advanced, Inspector, or Details.
- The app should feel simple, systematic, smooth, and trustworthy.

## Why It Feels Too Complex

### Too Many Panels At Once

Source Library currently combines:

- intake preview
- parser readiness
- parsed DOCX preview states
- provider/mock evidence
- SourceDocument save gate
- saved SourceDocument read panel
- intake audit trace
- metadata readiness
- SourceCard review gate
- completion preview
- backend status
- record inspector
- disabled editing shell

Each panel is individually useful, but together they make the screen feel like a
backend console.

### Backend Concepts Arrive Too Early

Concepts like read-back, audit event ids, metadata review records, provider
candidate comparisons, dry-run apply states, and disabled shells are valuable
for trust. They should not be the default frontstage for a user trying to add or
review a source.

### Disabled UI Accumulates

Disabled shells and future affordances correctly preserve safety boundaries,
but they also add noise. The user may not know whether they are supposed to use
them, ignore them, or wait for a future sprint.

### Navigation Is Not Yet The 4-Room Model

Dashboard communicates INPUT, CABINET, WRITER, and ART. The left navigation
still lists Source Library, Workflow Board, Knowledge Brain, Writer Studio,
Slide Studio, Visual Studio, Obsidian Vault, Audit Log, and Settings. This
duplicates some room cards and preserves module/backend language.

### Writer Studio Needs One Primary Task

Writer Studio shows draft preview, mock provider, validation, citation guard,
textbook chapter contract, and section navigation. It should first answer:
"What am I writing now?" and "What is the next action?"

## What Should Move Behind Disclosure

- Raw audit event lists.
- Backend command/read-back status.
- SourceCard metadata review backend status.
- Record inspectors.
- Provider evidence details.
- Parser/classification internals.
- Disabled future editing shells.
- Long safety flag panels once the boundary has been acknowledged.

## Product Direction For UX Simplification

The strongest next design direction is to make Source Library a review desk,
not a backend console:

- one main task
- one current object
- one primary action
- one short trust receipt
- advanced inspector for backend details

Backend rigor should remain, but it should support trust quietly unless the user
opens details.
