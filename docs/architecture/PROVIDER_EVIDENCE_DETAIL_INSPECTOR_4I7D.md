# Provider Evidence Detail Inspector 4I-7D

## Purpose

Sprint 4I-7D adds a read-only Provider Evidence Detail Inspector to Source Library. The inspector lets users inspect provider evidence behind persisted suggested metadata corrections without creating a new workflow, route, modal framework, persistence table, audit event, or apply path.

The inspector complements the 4I-7C Provider Candidate Comparison Preview. Comparison rows answer whether providers agree or conflict; evidence detail rows show the provider evidence fields that led to each correction.

## Input Data Source

The implementation derives evidence details from existing `SavedSuggestedMetadataCorrection` rows already loaded in Source Library through `listSuggestedMetadataCorrections`.

The pure TypeScript mapper lives in:

- `src/lib/sources/ProviderEvidenceDetailMapper.ts`

The UI lives near the Suggested Corrections Review Queue and Provider Candidate Comparison Preview in:

- `src/features/source-library/SourceLibraryPage.tsx`

No new backend command, migration, table, or query was added.

## Raw-vs-Normalized Interpretation

The inspector uses these terms:

- Raw value: provider evidence snapshot/display value available in the suggested correction row.
- Normalized value: ATP comparison candidate derived locally for field-level comparison.
- Raw JSON preview: unavailable in the current suggested corrections UI data shape.

Neither raw nor normalized values are verified metadata truth. They are review evidence only.

If future work needs raw provider JSON in this inspector, it should expose existing match-result snapshots through a read-only query or existing supported data shape. 4I-7D deliberately does not add persistence or schema changes for raw JSON.

## Evidence-Only Policy

The inspector shows:

- provider name
- provider source/type
- provider record reference
- target metadata table
- target field
- current ATP value
- raw/display provider value
- normalized comparison value
- confidence score and band
- confidence evidence and reason
- mismatch reasons when present
- warning flags
- blocker flags empty state
- fixture-only indicator
- no-network indicator
- no-auto-overwrite indicator

The inspector is derived UI only. It does not update review state, create audit events, approve corrections, run dry-runs, or apply metadata.

## No-Network Boundary

4I-7D performs no provider execution and no network lookup.

It does not call:

- live Crossref
- OpenAlex
- DOI lookup
- ISBN lookup
- AI/API services
- `fetch` or any other network request

Mock Provider and Crossref Fixture evidence remains local and deterministic.

## No-Overwrite Boundary

The inspector must not:

- mutate SourceCard title, authors, year, or source type
- mutate structured bibliographic metadata
- overwrite `citationText`
- create apply buttons
- expand compact SourceCard apply
- update review status automatically
- create audit events
- persist inspector output

Every detail row carries a no-auto-overwrite indicator because provider evidence is not a write path.

## No-APA-Final Boundary

The inspector does not verify APA references and does not set APA-final state. It explicitly states that APA-final verification is not supported here.

## QA Results

Baseline before implementation:

- `npm run build` passed.
- `npm run qa:source-library` passed, 6 tests.
- `cd src-tauri && cargo test` passed, 82 tests.

Implementation checks so far:

- `npm run build` passed.
- `npm run qa:source-library` passed, 7 tests.
- `cd src-tauri && cargo test` passed, 82 tests.
- `PATH=/Users/apple/.cargo/bin:$PATH npm run tauri -- dev` passed smoke: Vite became ready on `http://localhost:1420/`, Rust compiled, and `target/debug/atp-knowledge-studio` launched.
- Project-specific Tauri/Vite/app processes were stopped after smoke.

Final verification:

- `npm run qa:source-library` passed, 7 tests.
- `cd src-tauri && cargo test` passed, 82 tests.

## Remaining Limitations

- Raw provider JSON is not shown because `SavedSuggestedMetadataCorrection` does not expose raw match-result snapshots.
- Provider type/source is inferred from provider name and provider record reference in the derived UI layer.
- Blocker flags currently show an empty-state because persisted suggested correction rows do not expose blocker arrays.
- The inspector is compact and always inline; there is no full evidence drawer.
- Crossref evidence remains fixture-only.
- No live provider error-state evidence is shown.

## Recommended Next Sprint

Recommended next sprint: 4I-7E Read-Only Match Result Snapshot Inspector, exposing existing raw provider snapshots safely without schema changes if the current backend shape supports it.

Alternative: 4I-8 Real Crossref Network Preflight Plan.

Do not begin live provider mutation, compact SourceCard apply expansion, or APA-final verification from 4I-7D.
