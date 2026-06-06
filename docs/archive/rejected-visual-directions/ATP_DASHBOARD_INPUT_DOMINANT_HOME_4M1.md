# ATP Dashboard Input-Dominant Home 4M1

## Purpose

4M-1 turns the Dashboard into an INPUT-dominant Virtual Library Home for ATP Knowledge Studio. The home screen now communicates that ATP is a Personal Academic Library and Writer's Brain where the daily habit is adding sources, reviewing what needs attention, and using the organized library later for writing and visuals.

## Relationship to Master Design Plan

This implementation follows `ATP_MASTER_DESIGN_PLAN_V1.md`, especially the Option B direction: desktop-first, landscape, 8-bit isometric academic library mood, minimal metrics, and four user-facing rooms. Backend roles, provider detail, workflow stages, and audit/debug information are kept behind disclosure.

## What Changed

- Replaced the dashboard's dense workflow-office first viewport with a four-room library home.
- Made INPUT Room the dominant, largest workspace.
- Added CABINET, WRITER, and ART as secondary clickable room cards.
- Hid the right-side agent detail rail on Dashboard only.
- Replaced Dashboard header provider cards with compact room-level context.
- Moved the workflow board and agent diagnostic previews into a collapsed System details section.

## Four-Room Hierarchy

- INPUT Room: primary AI Librarian Desk for adding sample sources and reviewing intake readiness.
- CABINET: secondary Knowledge Vault concept/search room, currently routed safely to Source Library.
- WRITER: secondary writing room, routed to the existing Writer Studio.
- ART: secondary planned visual room, routed to the existing Visual Studio placeholder.

## Why INPUT Is Dominant

The Master Design Plan defines library-building as the main daily work. The Dashboard therefore gives INPUT the largest floor area, the clearest call to action, and the most visible ambient work scene. CABINET, WRITER, and ART remain visible but smaller because they support retrieval, drafting, and visual output after the library has been fed.

## Ambient Character Rules

Characters are visual workers only. They help users understand the room mood and task type, but they are not exposed as backend data panels. The INPUT Room includes AI Librarian, Parser Bot, Tag Clerk, and Review Scout. Secondary rooms use role characters such as Vault Librarian, Search Assistant, AI Writer, Citation Guard, Visual Director, and Slide Builder.

## Status Colors

- Green: trusted enough or no immediate action.
- Orange: review recommended.
- Red: problem or human action required.

The Dashboard uses room-level status only and avoids technical per-agent status as the default view.

## Hidden Or Demoted

- Provider cards are not shown in the Dashboard first viewport.
- Workflow board is collapsed under System details.
- Agent rail is hidden on Dashboard and still available on other app pages.
- Technical audit and diagnostic signals are represented only as compact preview text inside System details.

## What Did Not Change

- No backend commands changed.
- No Rust code changed.
- No schemas, migrations, parser behavior, persistence behavior, DOCX export, AI/API behavior, or package dependencies changed.
- Source Library behavior remains intact.
- No Save to Vault, citation overwrite, live provider lookup, image generation, or knowledge graph implementation was added.

## QA Results

Baseline before editing:

- `npm run build` passed.
- `npm run qa:source-library` passed, 12 tests.
- `cd src-tauri && cargo test` passed, 82 tests.

Post-implementation:

- `npm run build` passed.
- `npm run qa:source-library` passed, 12 tests.
- `cd src-tauri && cargo test` passed, 82 tests.
- `git diff --check` passed.
- Browser visual smoke passed at `http://127.0.0.1:1420/` after rerunning the local dev server with permission for the known `listen EPERM` issue.
- Visual smoke confirmed INPUT dominance, visible CABINET/WRITER/ART room cards, no provider-card dominance, no workflow-board dominance, no long agent rail dominance, room clickability, and no obvious first-viewport text overflow.

## Remaining Limitations

- CABINET is represented conceptually and routes to Source Library until a dedicated vault/search room exists.
- ART is a planned room and routes to the existing Visual Studio placeholder.
- Dashboard counts are sample/mock state and do not claim live automation.
- The visual scene is CSS-based pixel ambience, not a full interactive isometric engine.

## Recommended Next Sprint

4M-2 should define the real INPUT Room intake path: file selection/drop affordance, pre-queue file list, duplicate/similarity summary, confirmation receipt, and safe review boundaries without adding backend persistence changes prematurely.
