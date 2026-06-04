# Match Result Snapshot Inspector 4I-7E

## Purpose

Sprint 4I-7E inspected whether persisted external metadata match result snapshots can be surfaced safely in Source Library as a read-only Match Result Snapshot Inspector.

The target inspector would show persisted provider evidence only: provider identity, provider record reference, match status, confidence, warning flags, blockers, raw snapshot availability, and a safe truncated raw JSON preview.

## Current Data Availability

The SQLite schema already persists match result snapshots in `external_metadata_match_results.raw_candidate_snapshot_json`.

Mock Provider review queue persistence writes `raw_candidate_snapshot_json` when it inserts or refreshes `external_metadata_match_results`.

Crossref Fixture review queue persistence also writes `raw_candidate_snapshot_json` when it inserts or refreshes `external_metadata_match_results`.

The persisted raw snapshot is therefore available in the database, but it is not currently available to the Source Library frontend.

## Frontend Read Contract

Source Library currently loads suggested corrections through `listSuggestedMetadataCorrections`, which maps to the Tauri `list_suggested_metadata_corrections` command.

The returned `SavedSuggestedMetadataCorrection` shape includes:

- correction ID
- match result ID
- intake job ID
- target table and field
- current ATP value
- suggested value
- provider name
- provider record reference
- confidence score and band
- reason
- mismatch reasons JSON
- warning flags JSON
- review status and decision
- reviewer fields
- created and updated timestamps

It does not include `raw_candidate_snapshot_json`, provider ID, persisted provider type, persisted match status, or persisted blocker arrays.

## Raw Snapshot Availability to Frontend

Raw match result snapshots are not already available to the frontend through the current supported Source Library data shape.

The existing 4I-7D Provider Evidence Detail Inspector correctly reports raw JSON as unavailable because `SavedSuggestedMetadataCorrection` does not expose raw match-result snapshots.

## Evidence-Only Policy

A future Match Result Snapshot Inspector must treat raw provider snapshots as evidence only.

Raw snapshot display must not imply verified metadata truth. Provider agreement, provider confidence, and raw provider payload fields must remain human-review evidence.

The inspector must not:

- edit metadata
- copy provider values into ATP fields
- approve or reject corrections
- update review status
- run dry-runs
- apply corrections
- save provider snapshot display output
- create audit events

## No-Network Boundary

4I-7E performs no live provider call and adds no network path.

It does not call:

- Crossref
- OpenAlex
- DOI lookup
- ISBN lookup
- AI/API services
- web fetches

Mock Provider and Crossref Fixture evidence remain deterministic local evidence.

## No-Overwrite Boundary

4I-7E does not mutate:

- compact SourceCard title
- compact SourceCard authors
- compact SourceCard year
- compact SourceCard source type
- structured bibliographic metadata
- `citationText`
- review status
- audit tables

`SourceCard.citationText` is never overwritten by snapshot inspection.

## No-APA-Final Boundary

The snapshot inspector does not verify APA references and does not set APA-final state.

Raw provider snapshots cannot be treated as APA-final proof.

## Implementation Decision

Documentation-only.

The raw snapshot is persisted but not exposed through the current frontend read contract. Surfacing it would require a backend read expansion, such as a read-only join from `suggested_metadata_corrections.match_result_id` to `external_metadata_match_results.id`, or a separate read-only match-result snapshot query.

The sprint brief defaulted to no backend expansion unless clearly necessary. Because the frontend already communicates the unavailable raw JSON state through the 4I-7D inspector, 4I-7E does not add UI, commands, migrations, tables, audit events, or write paths.

## QA Results

Baseline before documentation:

- `npm run build` passed.
- `npm run qa:source-library` partially passed in this sandbox: 6 mapper/provider tests passed, and the browser-flow test was blocked before assertions by Chromium macOS Mach service permission.
- `cd src-tauri && cargo test` passed, 82 tests.

Implementation checks:

- Documentation-only change; no source behavior changed.

Final verification:

- `npm run qa:source-library` partially passed in this sandbox: 6 mapper/provider tests passed, and the browser-flow test was blocked before assertions by Chromium macOS Mach service permission.
- `cd src-tauri && cargo test` passed, 82 tests.
- `git diff --check` passed.

Tauri smoke:

- `PATH=/Users/apple/.cargo/bin:$PATH npm run tauri -- dev` reached smoke readiness: Vite served `http://localhost:1420/`, Rust compiled, and `target/debug/atp-knowledge-studio` launched.
- The launched app emitted macOS service connection errors in this sandbox.
- Project-specific process cleanup was attempted, but sandbox process permissions blocked process listing and direct termination from this tool session.

## Remaining Limitations

- Source Library cannot show raw match result JSON without expanding the read contract.
- Persisted provider ID, provider type, match status, and blocker arrays are not available in the current `SavedSuggestedMetadataCorrection` frontend shape.
- Provider type/source remains inferred in current derived UI helpers.
- Raw JSON preview remains unavailable in the existing Provider Evidence Detail Inspector.
- Crossref evidence remains fixture-only.

## Recommended Next Sprint

Add a narrow read-only match result snapshot contract.

Recommended shape:

- no migration
- no new table
- no write command
- no audit event
- no apply path
- no provider execution
- no network call
- read existing `external_metadata_match_results` by `match_result_id`
- return provider ID, provider name, provider type, provider record reference, confidence score, confidence band, match status, warning flags, blocker flags, and a bounded raw snapshot preview

Only after that contract exists should Source Library add the read-only Match Result Snapshot Inspector panel.
