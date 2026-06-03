# ATP Project Status Handoff 4H Current

## Latest Origin/Main

Latest verified `origin/main` after Sprint 4H-8A push:

- `3fb5ba5 feat: add human apa verification gate mvp`

## Current Citation Foundation

Sprint 4H is complete through the internal-use Human APA Verification Gate MVP.

Completed layers:

- Human SourceCard metadata completion.
- Structured bibliographic metadata contract.
- Structured bibliographic metadata persistence.
- Structured metadata readiness validation.
- APA Reference Candidate contract.
- Deterministic APA Reference Candidate Preview.
- Human APA Verification Gate plan.
- Human APA Verification Gate MVP with saved review artifacts.

## Current Persistent Citation Layers

Persistent layers:

- compact SourceCard metadata updates
- `source_card_bibliographic_metadata`
- `source_card_apa_reference_reviews`

APA review artifacts are separate from compact SourceCard `citationText` and do not overwrite SourceCard citation text.

## Current Review Boundaries

Current review boundaries:

- Compact SourceCard metadata can be human completed.
- Structured bibliographic metadata can be human entered and read back.
- Structured metadata readiness is preview-only.
- APA Reference Candidate Preview is preview-only and not final.
- Human APA review can save `needs_correction` or `verified_for_internal_use`.
- `apa_final_verified` is still not implemented.

## Current QA Baseline

Required baseline remains:

- `npm run build`
- `npm run qa:source-library`
- `cd src-tauri && cargo test`

As of this checkpoint, build passes, Source Library QA passes, and Rust tests pass.

## What Remains Manual

Still manual:

- entering missing author/year/title/publisher/journal/DOI/URL fields
- verifying source type
- reviewing APA candidate text
- accepting warnings
- resolving blockers
- confirming internal-use APA review

This is reliable but not scalable enough as the final product direction.

## What Remains Not Implemented

Not implemented:

- APA-final verification
- DOI lookup
- ISBN lookup
- Crossref/OpenAlex matching
- automatic metadata extraction
- batch intake queue
- batch approve/reject/edit
- PDF parser
- OCR
- citation manager integration
- AI/API citation generation
- downstream DraftArtifact/export consumption of saved APA review artifacts

## 4I Roadmap Direction

The next major direction should reduce manual citation and metadata workload while preserving human approval and audit trails.

Planned 4I direction:

- Batch Research Intake Queue.
- Multi-file PDF/DOCX import.
- External metadata cross-check.
- Crossref / OpenAlex / DOI / ISBN metadata matching.
- Confidence scoring.
- Suggested metadata corrections.
- Pending review queues.
- Batch approve / reject / edit.
- Human-verified audit trail.

ATP must not become mostly manual. Automation should produce reviewable suggestions, not unreviewed truth.

## Known UX Backlog

Known UX backlog:

- Source Library is dense and operational.
- Citation review needs progressive disclosure.
- Batch queues need dedicated triage surfaces.
- Metadata differences need field-level comparison UI.
- Review/audit history needs clearer navigation.

## Technical Debt Summary

Key technical debt:

- DOCX page numbers remain untrusted.
- DOCX parser MVP has limited structural support.
- Exported DOCX is MVP-only and not APA-final.
- APA review artifacts do not yet feed downstream DraftArtifact/export readiness.
- Source Library density is growing.
- Batch intake and external metadata matching are planned but not implemented.

## Next Recommended Sprint

Recommended next sprint:

Sprint 4I-0 - Batch Intake & Metadata Match Architecture.

Scope should remain architecture-first. Do not implement provider calls, DOI lookup, PDF parsing, database migrations, or UI redesign until the queue, confidence, and audit policies are agreed.
