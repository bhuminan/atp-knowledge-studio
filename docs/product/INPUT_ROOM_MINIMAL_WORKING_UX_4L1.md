# INPUT Room Minimal Working UX 4L-1

## What Was Implemented

Sprint 4L-1 adds a minimal INPUT Room intake workflow to the dashboard home. The dashboard INPUT area now supports selecting or dropping multiple local files, writing optional AI Librarian instructions, and previewing a local intake queue before any processing happens.

The local queue displays file name, detected extension/type, size, preview status, review status, and unsupported-format warnings. PDF and DOCX appear as supported-looking file types. Other file types stay visible in the queue with non-blocking review warnings.

The batch summary shows total files, supported files, warning count, and intake mode. Empty instructions show Quick Intake mode. Non-empty instructions show Guided Batch Intake mode.

## Preview-Only Behavior

This sprint is UI/client-state only. The selected browser `File` objects are used only to derive visible metadata for the current dashboard session. The queue is not persisted, parsed, classified, uploaded, or sent to an AI provider.

Routine warnings use orange review cards and Review affordances. They do not open modal dialogs and do not block the rest of the dashboard.

## Explicitly Not Implemented

- No Rust backend commands.
- No SQLite schema or migration changes.
- No persistence save/read behavior.
- No parser, DOCX/PDF extraction, classification, or knowledge-card generation.
- No CitationGuard, APA verification, evidence review, WriterAgent, ProviderAdapter, export, API, or network behavior.
- No auto-save, auto-classification, or auto-generated research artifacts.

## Safety Boundaries

The INPUT Room clearly states: "Local preview only" and "No files are parsed, saved, classified, or sent to AI in this sprint." These copy points are part of the user-facing safety boundary for 4L-1.

## Next Recommended Sprint

Sprint 4L-2 should add a human-confirmed "Queue for intake" action that still respects review boundaries. It should define the handoff contract separately before any persistence, parsing, metadata matching, citation review, or AI processing is connected.
