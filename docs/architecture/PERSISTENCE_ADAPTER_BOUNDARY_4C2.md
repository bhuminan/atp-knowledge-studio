# Sprint 4C-2 Persistence Adapter Boundary

## Scope

Sprint 4C-2 adds a persistence adapter boundary and mock repository dry run only. It does not persist any data.

No files, database records, Obsidian notes, vault entries, SourceDocuments, SourceCards, Knowledge Cards, tags, drafts, or workflow states are created in this sprint.

## Adapter Boundary

The persistence boundary is represented by:

- `PersistenceAdapter`
- `SaveBundleRequest`
- `SaveBundleDryRunResult`
- `SaveBundleResult`
- `PersistenceAdapterStatus`
- `PersistenceAdapterError`

The adapter accepts a `PersistenceSaveCandidateBundle` and supports dry-run validation. The current implementation always reports `persisted: false`.

## Mock Repository Behavior

`MockPersistenceRepository` performs a safe contract rehearsal:

- validates the save-candidate bundle shape
- returns adapter status `mock_dry_run_only`
- returns simulated saved counts
- forwards blockers and warnings from the bundle
- adds dry-run warnings for mock-only and DOCX trace limitations
- does not store anything in memory as durable state
- does not use localStorage
- does not write files
- does not connect to a database or Obsidian

## Dry-Run Service

`PersistenceDryRunService` wraps the mock repository and exposes a UI-friendly dry-run preview result. The Source Library can display dry-run readiness without knowing persistence implementation details.

## No Real Persistence Decision

This sprint intentionally keeps all save behavior disabled. The dry-run result is an architectural boundary, not a save action.

The Source Library must continue to communicate:

> Dry run only — no files, database records, or vault entries are created.

## Recommended Sprint 4C-3 Storage Choice Options

Before implementing real persistence, Sprint 4C-3 should decide one storage boundary:

1. Tauri command plus local JSON vault for first controlled persistence spike.
2. SQLite-backed local vault for durable desktop persistence.
3. Obsidian Markdown export boundary for knowledge note persistence.
4. Hybrid: SQLite for internal records, Obsidian export as a later sync/output step.

Recommended next step: choose the first durable storage boundary and implement only a human-triggered SourceDocument save command before SourceCard or Knowledge Card persistence.
