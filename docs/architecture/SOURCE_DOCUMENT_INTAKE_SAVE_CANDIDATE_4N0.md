# SourceDocument Intake Save Candidate Preview 4N-0

Sprint 4N-0 adds a pure frontend preview layer for the first real intake persistence boundary. It shows which incoming package files could become future `SourceDocument` records after explicit user approval, while keeping the current sprint preview-only.

## What Was Implemented

- Added a deterministic mapper, `createSourceDocumentIntakeSaveCandidatePreview`, for local incoming package candidates.
- Added a compact Source Library preview panel for SourceDocument save candidates.
- Added test coverage in the existing Source Library Playwright spec for candidate readiness, blockers, warnings, and safety flags.

## Candidate Rules

- PDF and DOCX candidates are treated as supported SourceDocument candidates.
- Unsupported file types are blocked.
- Missing file name or missing title blocks a candidate.
- Complete metadata can be ready when no blockers are present.
- Incomplete or missing metadata stays in `needs_review` unless the candidate is blocked.
- `SourceCard` creation is always deferred.
- Citation metadata is not considered final, and APA-final readiness is not implied.

## Preview-Only Boundary

The mapper and UI expose safety flags that remain fixed for this sprint:

- `previewOnly: true`
- `persisted: false`
- `sourceDocumentCreated: false`
- `sourceCardCreated: false`
- `parsed: false`
- `classified: false`
- `aiProcessed: false`

The preview does not call Tauri commands, parser services, provider adapters, AI APIs, or Source Library save flows.

## Explicitly Not Implemented

- No SourceDocument records are created.
- No SourceCard records are created.
- No files are parsed.
- No files are classified.
- No citation or APA verification is performed.
- No Source Library state is mutated.
- No backend persistence or schema change is introduced.

## Next Recommended Sprint

Add an explicit reviewed approval boundary that can turn ready SourceDocument candidates into a real save request contract, still separated from SourceCard creation and citation finality.
