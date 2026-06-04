# INPUT Source Library Handoff Contract 4L-4

## What Was Added

Sprint 4L-4 adds a local INPUT-to-Source-Library handoff package preview. The package is derived from the current in-memory INPUT queue and the AI Librarian instruction field when the user opens "Preview Source Library Handoff."

The package preview shows package status, source, intended destination, instruction snapshot, candidate counts, candidate readiness, blockers, warnings, and safety flags.

## Handoff Package Shape

The local package includes:

- Package id and createdAt preview label.
- Source: INPUT Room.
- Intended destination: Source Library Intake.
- User instruction snapshot.
- Batch summary: total, ready, needs review, and blocked candidates.
- Candidate list with file metadata, review group, readiness, warnings, and blockers.
- Package-level blockers and warnings derived from candidates.

## Safety Flags

The package always exposes these preview-only flags:

- previewOnly: true
- persisted: false
- parsed: false
- classified: false
- aiProcessed: false

These flags are user-facing contract language. They describe what has not happened and prevent the preview from feeling like a real intake job.

## Preview-Only Boundary

The handoff package is not saved and not sent anywhere. It does not create Source Library records, route state to Source Library, parse files, classify sources, call AI, call network APIs, or mutate backend persistence.

Unsupported files remain blocked from handoff readiness. Ready PDF and DOCX files remain local candidates only until a future reviewed intake flow exists.

## Why No Persistence Is Performed

The current sprint defines the review contract before introducing backend work. This keeps the workflow inspectable and reversible while preserving the product rule that Source Library intake must require explicit review before any real processing.

## Future Real Handoff Requirements

A future sprint should add an explicit approval step, a reviewed Source Library intake job model, backend persistence boundaries, parser safety checks, duplicate review, and a receipt. That future work must still avoid auto-classification, fabricated citation data, or unreviewed AI processing.
