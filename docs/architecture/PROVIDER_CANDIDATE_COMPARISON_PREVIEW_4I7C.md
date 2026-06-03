# Provider Candidate Comparison Preview 4I-7C

## Purpose

Sprint 4I-7C adds a read-only Provider Candidate Comparison Preview for the Source Library review queue. The preview compares persisted Mock Provider suggested corrections with persisted Crossref Fixture suggested corrections at field level.

The comparison is derived in TypeScript from existing UI-ready correction rows. It does not add a database migration, command, audit event, provider execution path, or apply action.

## Comparison States

The mapper groups correction rows by:

- `intakeJobId`
- target metadata table
- field name
- provider identity inferred from provider name and provider record reference

It then emits these field-level states:

- `provider_consensus`: both providers suggest equivalent non-empty normalized values.
- `provider_conflict`: both providers suggest different non-empty normalized values.
- `provider_only_mock`: only the mock provider has a suggestion for the grouped field.
- `provider_only_crossref_fixture`: only the Crossref fixture has a suggestion for the grouped field.
- `missing_comparable_candidate`: not enough comparable provider data is available.

Each comparison row preserves both display values and normalized comparison values for Mock Provider and Crossref Fixture. It also keeps provider name, inferred provider id/type, provider record reference, confidence band, and confidence score visible for human review.

## No-Overwrite Boundary

The preview is candidate-only and read-only.

It must not:

- mutate SourceCard title, authors, year, or source type
- mutate structured bibliographic metadata
- overwrite `citationText`
- set APA-final verification
- update `review_status`
- create audit events
- create apply buttons or expand the apply boundary
- persist comparison results

Warning flags are derived for review context only:

- `provider_conflict`
- `fixture_only`
- `no_auto_overwrite`
- `needs_human_review`

## No-Network Boundary

The comparison preview performs no provider execution. It consumes rows already loaded by the existing suggested corrections list.

It does not call:

- live Crossref
- OpenAlex
- DOI lookup
- ISBN lookup
- AI/API services
- `fetch` or any network request

The Crossref side remains the deterministic fixture provider from 4I-7A and the persisted review queue integration from 4I-7B.

## Why Consensus Is Not Verification

Provider agreement can be useful evidence, but it is not bibliographic verification. Two providers can agree because they share an upstream index, fixture data can be incomplete, and matching metadata can still describe the wrong edition, version, container, or source boundary.

For that reason, `provider_consensus` still carries `no_auto_overwrite` and `needs_human_review`. It never approves, verifies, or applies metadata.

## UI Behavior

Source Library now shows a compact panel near the Suggested Corrections Review Queue:

`Provider Candidate Comparison Preview`

The panel shows:

- provider pair: Mock Provider vs Crossref Fixture
- field name and target metadata table
- Mock value and normalized value
- Crossref Fixture value and normalized value
- comparison state
- confidence band/score for each provider when available
- reason and warning flags
- notices for preview-only, no verification, human review, no apply, no `citationText` overwrite, and no live network/API call

The panel exposes no apply button.

## QA Results

Baseline before implementation:

- `npm run build` passed.
- `npm run qa:source-library` passed, 5 tests.
- `cd src-tauri && cargo test` passed, 82 tests.

Implementation verification:

- `npm run build` passed.
- `npm run qa:source-library` passed, 6 tests.
- `cd src-tauri && cargo test` passed, 82 tests.
- `PATH=/Users/apple/.cargo/bin:$PATH npm run tauri -- dev` passed smoke: Vite became ready on `http://localhost:1420/`, Rust compiled, and `target/debug/atp-knowledge-studio` launched.
- Project-specific Tauri/Vite/app processes were stopped after smoke.

Final verification:

- `npm run qa:source-library` passed, 6 tests.
- `cd src-tauri && cargo test` passed, 82 tests.

## Remaining Limitations

- Provider id/type are inferred in the TypeScript preview from existing correction row evidence because `suggested_metadata_corrections` does not currently expose provider id/type directly.
- The preview compares one strongest correction per provider per field group.
- The preview is compact and does not include a full raw provider evidence drawer.
- Crossref remains fixture-only.
- No live provider error-state comparison is implemented.
- No review workflow automation is implemented for conflicts.

## Recommended Next Sprint

Recommended next sprint: 4I-7D Provider Evidence Detail Drawer / Raw-vs-Normalized Inspection.

Alternative: 4I-8 Real Crossref Network Preflight Plan.

Do not begin live provider mutation or compact SourceCard apply expansion from 4I-7C.
