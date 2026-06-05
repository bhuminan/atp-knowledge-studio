# Source Library Incoming Package Preflight 4M-2

## What The Approval Preflight Preview Does

Sprint 4M-2 extends the Source Library incoming package preview with a receiving-side approval gate. It shows what must be true before a future INPUT package can become real Source Library intake records.

The preflight uses demo/static checklist data only. It does not inspect INPUT Room state, router state, saved Source Library data, backend commands, or persistence.

## Checklist Logic

The preview checklist covers the future human review boundary:

- Package reviewed by user.
- Unsupported files removed or blocked.
- Metadata review required for each candidate.
- Explicit approval required before SourceDocument creation.
- Explicit approval required before SourceCard creation.
- Audit event required before future persistence.
- Parser, AI, and classification remain disabled until a controlled future sprint.

The default status is "Needs review before future intake." This does not imply that any real package is ready to save.

## Preview-Only Boundary

No package has been received from INPUT Room. No SourceDocument or SourceCard will be created in this sprint. No metadata is persisted. No parser, classifier, AI, API, route transfer, or backend call is connected.

The "Future: Approve intake package" affordance is disabled and future-only.

## Future Approval And Audit Requirement

A real intake approval must require explicit user confirmation, a reviewed incoming package, candidate readiness checks, unsupported-file blockers, metadata review status, and an audit event before persistence. Only then could future SourceDocument or SourceCard creation be considered.

## Relationship To 4L-4 And 4M-1

Sprint 4L-4 defined the INPUT-side handoff package contract as a local preview. Sprint 4M-1 added the Source Library receiving placeholder. Sprint 4M-2 adds the approval preflight layer that explains why the receiving placeholder still cannot create real records until a future approval and audit flow exists.
