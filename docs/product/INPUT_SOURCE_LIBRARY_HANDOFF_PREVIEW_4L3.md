# INPUT Source Library Handoff Preview 4L-3

## What The Handoff Preview Does

Sprint 4L-3 adds a local Source Library handoff preview inside the dashboard INPUT Room. When files are present, the user can reveal "Preview Source Library Handoff" to see local candidate rows that describe what could be handed off in a future sprint.

Each candidate is derived from the current in-memory INPUT queue and shows file name, file type, size, support status, review group, intended destination, readiness, and any warnings or blockers.

## Why It Is Preview-Only

The preview is a planning layer, not a handoff. It does not route to Source Library, create Source Library records, save queue data, parse files, classify sources, or call AI/API/network code.

The preview exists to make the future handoff pathway understandable before backend or Source Library integration begins.

## What Is Blocked

Unsupported files are blocked from handoff readiness. Reviewable non-PDF/DOCX files are marked as needs review. PDF and DOCX files are ready for a future reviewed intake job, but still remain local preview candidates only.

## Explicitly Not Implemented

- No Source Library state transfer.
- No backend command.
- No persistence save/read behavior.
- No SQLite schema or migration change.
- No parser or file extraction.
- No classification or knowledge-card generation.
- No AI, API, or network call.
- No citation, export, provider, WriterAgent, or evidence-review changes.

## Safety Boundaries

The UI continues to show that this is local preview only. The handoff panel states: "Preview only -- no files are sent to Source Library." The future next step is explicitly described as a later reviewed Source Library intake job after approval.

## Next Recommended Sprint

Sprint 4L-4 should define the explicit user approval contract and the minimal Source Library intake job shape before any backend, persistence, parser, metadata, or citation workflow is connected.
