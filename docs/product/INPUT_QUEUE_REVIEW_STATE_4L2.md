# INPUT Queue Review State 4L-2

## What Was Added

Sprint 4L-2 turns the dashboard INPUT Room preview into a guided local workflow. The queue now groups selected files into Ready, Needs Review, and Unsupported states, adds an item inspector, and shows AI Librarian alert copy that changes with the local queue state.

The workflow also adds compact next-action affordances: Review warnings, Prepare intake preview, Clear queue, and Later: Send to Source Library. The Source Library handoff is disabled and marked as a future action.

## Queue Review States

Review states are derived only from browser-selected file metadata:

- Ready: PDF and DOCX files.
- Needs Review: reviewable but not intake-ready files such as Markdown, text, RTF, and common image files.
- Unsupported: all other file types or files without a useful extension.

No backend data, saved records, parser output, citation data, or AI output contributes to these states.

## Preview-Only Behavior

The selected item inspector displays file name, extension/type, size, support status, review status, warning copy, instruction preview, and intended next step. It is an in-memory dashboard preview only.

The AI Librarian alert is non-blocking. Green means the current queue is calm, orange means review is recommended, and red means unsupported files are present. No modal is used for routine warnings.

## Disabled And Future Actions

"Later: Send to Source Library" is intentionally disabled. It does not create Source Library records, save queue state, parse files, classify sources, or call any provider.

"Prepare intake preview" only updates local guidance copy. "Review warnings" selects the first warning item. "Clear queue" clears local React state.

## Safety Boundaries

Sprint 4L-2 remains UI/client-state only:

- No parsing.
- No saving.
- No classification.
- No AI, API, or network call.
- No Source Library handoff.
- No backend command, migration, persistence, citation, parser, export, provider, or AI integration changes.

## Next Recommended Sprint

Sprint 4L-3 should define a human-confirmed intake handoff contract before connecting any Source Library persistence, parser, metadata matching, citation review, or AI/provider work.
