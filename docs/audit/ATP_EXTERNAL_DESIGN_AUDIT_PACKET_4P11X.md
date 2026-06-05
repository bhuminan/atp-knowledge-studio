# ATP External Design Audit Packet 4P-11X

## Purpose

This packet gives an external design consultant a factual, repo-grounded view of
ATP Knowledge Studio as it exists now. It separates real behavior from
preview-only, disabled, mock, and planned capabilities.

## Packet Contents

- `ATP_CURRENT_DATABASE_SCHEMA_4P11X.md`
- `ATP_CURRENT_API_AND_COMMAND_SURFACE_4P11X.md`
- `ATP_CURRENT_FRONTEND_STACK_4P11X.md`
- `ATP_CURRENT_SCREEN_WALKTHROUGH_4P11X.md`
- `ATP_CURRENT_UX_PROBLEMS_4P11X.md`
- `ATP_VISUAL_SYSTEM_AND_PLATFORM_SPECS_4P11X.md`
- `ATP_NEXT_SPRINT_PRIORITIES_4P11X.md`
- `ATP_EXTERNAL_AUDIT_QUESTIONS_4P11X.md`
- `screenshots/4P11X/`

## Current Product Truth

ATP Knowledge Studio is a Tauri v2 desktop app for local-first academic source
intake, knowledge organization, and writing support. The current strongest
working workflow is SourceDocument-only intake save/read/audit in Source
Library.

Currently real:

- Desktop app shell.
- Dashboard with 4-room model.
- Local INPUT preview queue.
- Source Library preview/gated SourceDocument save path.
- SourceDocument root persistence in local SQLite.
- Intake SourceDocument audit events.
- Saved SourceDocument list/read panel.
- SourceCard metadata review backend schema/commands.
- Read-only SourceCard metadata review record inspector.
- Mock Writer Studio draft generation.
- Several downstream persistence tables/commands.

Preview-only or mock:

- INPUT-to-Source-Library handoff preview.
- Parser/classification/readiness previews.
- Mock/Crossref fixture metadata provider queue.
- Writer Studio mock provider output.
- Workflow Board and several shell routes.

Disabled:

- active SourceCard metadata editing UI
- UI metadata review save
- SourceCard creation from SourceDocument intake
- citation-ready verification
- APA-final verification
- automatic parser/classification/AI/provider work from intake save

Planned/not implemented:

- cloud backend
- public REST API
- cloud sync
- real OpenAI/Gemini provider call in current path
- full Cabinet search/retrieval room
- production Writer export path from SourceDocument intake
- active visual/slide production workflows

## Current Database Summary

The SQLite schema has 23 current tables across 14 migrations. Key active
tables are `source_documents`, `intake_source_document_audit_events`,
`sourcecard_metadata_reviews`, and
`sourcecard_metadata_review_audit_events`. SourceCard, structured
bibliographic metadata, APA review, KnowledgeCard, MarketingTag, DraftArtifact,
batch intake, provider match, correction, and audit tables also exist, but many
are foundation or gated surfaces rather than active from the current
SourceDocument-only intake path.

See `ATP_CURRENT_DATABASE_SCHEMA_4P11X.md`.

## Current Command/API Summary

No public REST API endpoints are currently implemented. The app uses Tauri
commands and TypeScript bridge functions. Commands include local document
selection/parsing, vault initialization, SourceDocument save/read/list, intake
audit list, SourceCard/metadata/APA/KnowledgeCard/DraftArtifact persistence,
metadata correction queue/dry-run/apply, and SourceCard metadata review
save/get/list/audit list.

See `ATP_CURRENT_API_AND_COMMAND_SURFACE_4P11X.md`.

## Current Frontend Summary

Frontend stack:

- React 18
- TypeScript
- Vite
- Tailwind CSS
- custom components
- lucide-react icons
- local React state
- Playwright QA

No Redux/Zustand/global store was found.

See `ATP_CURRENT_FRONTEND_STACK_4P11X.md`.

## Current Screen Summary

Dashboard is the clearest current screen. Source Library is the densest and
most technically complete. Writer Studio has a mock provider interaction but
needs simplification. Workflow Board and the other routes are mostly
placeholder/mock shell screens.

Screenshots are in `screenshots/4P11X/`.

See `ATP_CURRENT_SCREEN_WALKTHROUGH_4P11X.md`.

## UX Problem Summary

The main UX issue is not missing backend rigor. It is excessive frontstage
complexity. Source Library and Writer Studio expose too many panels,
status/debug concepts, disabled sections, and backend trust details at once.
The app needs progressive disclosure and a stronger 4-room frontstage IA.

See `ATP_CURRENT_UX_PROBLEMS_4P11X.md`.

## Visual System Summary

The current visual system is dark blue, pixel-inspired, desktop-first, and
8-bit academic studio oriented. Palette tokens are defined in
`tailwind.config.js`. The identity works best on Dashboard and becomes noisy on
dense backend-heavy screens.

See `ATP_VISUAL_SYSTEM_AND_PLATFORM_SPECS_4P11X.md`.

## Recommended Next Priority

The next sprint should be IA and UX simplification, not more feature wiring.
Recommended focus:

- 4-room frontstage navigation
- Source Library review desk
- Writer primary-task simplification
- Advanced/Inspector disclosure model
- preserve backend trust boundaries

See `ATP_NEXT_SPRINT_PRIORITIES_4P11X.md`.

## Audit Evidence Scope

This sprint is documentation and screenshot evidence only. It does not modify
runtime behavior, app UI, backend behavior, schema, migrations, tests,
dependencies, package files, lockfiles, parser/classification behavior,
AI/provider behavior, CitationGuard, APA verification, DOCX export, WriterAgent,
or network behavior.
