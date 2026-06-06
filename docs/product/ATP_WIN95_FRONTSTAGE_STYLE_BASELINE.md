# ATP Win95 Frontstage Style Baseline

## Status

This document is the accepted UI baseline for ATP Knowledge Studio after the Win95 Functional Frontstage polish. Future Codex UI work should preserve this visual system by default.

This baseline replaces the rejected 8-bit pixel art, isometric virtual office, dashboard room scene, PNG banner dashboard, and old visual storytelling directions. Those rejected directions may remain in the repository only as archived historical context, not as active implementation guidance.

## Default Visual Identity

ATP Knowledge Studio uses a Windows 95 functional desktop UI:

- Minimal, clear, work-oriented surfaces.
- Silver desktop shell with compact panels.
- Navy titlebars and status-oriented chrome.
- White content panels for primary reading and review.
- Bevel borders for panels, buttons, room cards, and inset surfaces.
- No fantasy dashboard.
- No large illustration scene as the dashboard.
- No modern rounded-card SaaS redesign.
- No gradients except the existing titlebar treatment when already present.
- No backend pipeline wall in the frontstage.

The UI should feel like a compact research workstation, not a marketing landing page or decorative virtual room.

## Typography Baseline

- Default font: Tahoma, "MS Sans Serif", system-ui, sans-serif.
- Normal readable text: 12px minimum.
- Home room card text: 12px minimum.
- Headings: 14px to 16px, bold.
- Titlebar: compact bold white text on navy.
- Status and meta labels may be smaller only when they already exist, are secondary, and remain readable.
- Avoid tiny debug-like text in primary UI.

Primary workflow text must be readable before it is dense. If space is tight, simplify or move secondary details to the Inspector instead of shrinking important text below 12px.

## Color Baseline

- Win95 silver app background: `#c0c0c0`.
- Dark/silver panel tone where used: `#d4d0c8`.
- Navy titlebar: `#000080`.
- White content panel: `#ffffff`.
- Black text: `#000000`.
- Teal illustration panel background: `#008080`.

Trust colors:

- Green means trusted or operational.
- Orange means review needed.
- Red means blocked or problem.

Do not introduce a new dominant color language unless a future approved product brief explicitly changes the baseline.

## Component Baseline

The AppShell remains the main frontstage frame:

- Titlebar.
- Menubar.
- Left navigation.
- Main content area.
- Optional Inspector.
- Statusbar.

Left navigation remains simple:

- Home.
- Library.
- Cabinet.
- Writer.
- Art.
- Settings.

Do not reintroduce a top-level Projects section or Quick Actions section.

Panels use Win95 bevel borders. Buttons use Win95 gray bevel. Cards use square corners with no border radius. The Inspector is detail-on-demand and can be collapsed. Backend details, debug information, audit detail, raw command output, blockers, and read-back details belong in the Inspector instead of the main frontstage.

## Home Baseline

Home is a functional command center, not a visual scene.

The Today strip remains compact and behaviorally unchanged unless a future brief explicitly changes it.

Home room cards use a Win95 help-panel layout:

- Image panel on the left.
- Text panel on the right.
- White text panel.
- Bevel border.
- Readable black text.
- Compact, functional navigation copy.

Home room card image assets live in:

```text
src/assets/dashboard/
```

Art may remain disabled with `opacity: 0.55` until it is actively developed.

## Library Baseline

Library is the core daily workspace.

The main Library modes are:

- Saved Sources.
- Add Sources.

Avoid a backend pipeline wall in the Library frontstage. Audit details, read-back evidence, raw persistence detail, command traces, and blockers belong in the Inspector.

Do not activate metadata editing unless explicitly planned. Do not create SourceCards unless explicitly planned. Do not imply citation-ready or APA-final status without verified, planned behavior.

## Rejected Directions

The following directions are rejected and must not be used as active UI guidance:

- 8-bit pixel art virtual office.
- Isometric virtual studio.
- Dashboard lobby scene.
- PNG banner dashboard.
- SVG/isometric scene dashboard.
- Agent-room visual office.
- Backend pipeline wall on Home.
- Projects or Quick Actions frontstage sections.
- Modern rounded-card SaaS redesign.

These may be retained in archives for audit and history, but they must not steer implementation.

## Reusable Instruction Block For Future Codex Prompts

Use this instruction block in future UI prompts when needed:

```text
Preserve the current Win95 Functional Frontstage visual system. Do not redesign UI, do not introduce a new visual language, do not add pixel art scene dashboard, PNG banners, SVG/isometric scenes, rounded modern cards, or backend pipeline walls. Any new UI must reuse existing Win95 utility classes and typography, with minimum readable text size 12px unless it is an existing statusbar/meta label.
```

## Implementation Guidance For Future UI Additions

- Reuse existing classes from `src/styles/index.css`.
- Prefer existing AppShell and Win95 primitives.
- Keep new preview panels compact and work-oriented.
- Show only user-facing status in the main UI for new backend-backed features.
- Put detailed audit data, raw data, blockers, traces, and debug information in the Inspector.
- Keep routing behavior explicit and scoped.
- Avoid adding global UI patterns for a single local need.

## Current Active Docs

Treat these as active sources of truth for future frontstage work:

- `docs/product/ATP_WIN95_FRONTSTAGE_STYLE_BASELINE.md`
- `docs/product/ATP_Codex_MasterFix_Brief.html`
- `docs/product/ATP_Codex_Brief_HomeCards.html`
- `docs/product/ATP_Codex_Brief_Sprint4Q3_Win95Redesign.html`
- `docs/product/ATP_Codex_FixBrief_Sprint4Q3_Polish.html`

## Archive Note

Old rejected visual direction documents should remain archived under:

```text
docs/archive/rejected-visual-directions/
```

Archived rejected visual direction documents are retained for history and audit only. They must not be used as active implementation guidance.
