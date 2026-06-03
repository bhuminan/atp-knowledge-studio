# Crossref Fixture Review Queue Integration 4I-7B

## Purpose

Sprint 4I-7B connects the Crossref-shaped fixture provider from 4I-7A to the existing persisted external metadata review queue. The integration is deliberately read-only, deterministic, and no-network. It proves the provider-to-review-queue boundary before any live Crossref, OpenAlex, DOI, or ISBN provider is allowed.

## Provider-To-Review-Queue Flow

```text
batch intake job
-> Crossref read-only fixture candidate
-> external_metadata_match_results
-> suggested_metadata_corrections
-> metadata_correction_audit_events
-> human review queue
-> later dry-run/apply boundary only after explicit review
```

The provider result may create a persisted match result and field-level suggested corrections. It must not mutate SourceCards, structured bibliographic metadata, `citationText`, APA verification state, or any downstream drafting/export entity.

## Persistence Behavior

The implementation reuses the existing SQLite tables:

- `external_metadata_match_results`
- `suggested_metadata_corrections`
- `metadata_correction_audit_events`

Crossref fixture match rows persist:

- provider id: `crossref-read-only-fixture`
- provider name: `Crossref Read-Only Fixture`
- provider type: `crossref_fixture_read_only`
- provider record refs such as `crossref:fixture:service-quality-article`
- raw fixture snapshot JSON
- confidence score/band
- warning flags and blocker lists

Suggested corrections remain pending or routed for human review. They are evidence only.

## Idempotency And Duplicate Policy

The persistence path uses the existing unique constraints:

- match results: `(intake_job_id, provider_id, provider_record_ref)`
- corrections: `(intake_job_id, provider_record_ref, field_name)`

Re-running Crossref fixture queue generation refreshes match/correction rows instead of creating unsafe duplicates. Review decisions are preserved when a correction was already reviewed. Audit events may record refresh activity, but match/correction rows remain duplicate-safe.

## No-Network Policy

The provider path is fixture-only:

- no live Crossref request
- no OpenAlex request
- no DOI or ISBN web lookup
- no API key
- no environment configuration requirement
- no network dependency in CI or Playwright QA

Provider data is treated as external evidence, not truth.

## No-Overwrite Boundary

Crossref fixture results must not:

- mutate SourceCard title/authors/year/sourceType
- mutate structured bibliographic metadata
- overwrite `citationText`
- set APA-final or verified-reference state
- trigger dry-run or apply automatically
- bypass the human review queue

Title, authors, year, and sourceType may appear as suggestions, but compact SourceCard apply remains blocked by the existing apply boundary.

## UI Behavior

Source Library now distinguishes review-queue sources:

- `Mock Provider`
- `Crossref Fixture`

The compact queue UI shows:

- fixture/no-network action for Crossref queue generation
- provider source and provider record reference per correction
- confidence score/band
- no-overwrite notice
- review-queue-only notice
- warnings such as fixture-only and no API key/network usage

The Source Library layout is unchanged except for the compact provider distinction and Crossref fixture action.

## QA Results

4I-7B adds coverage for:

- Crossref fixture match result persistence
- Crossref fixture suggested correction persistence
- duplicate-safe refresh behavior
- no SourceCard mutation
- no structured metadata mutation
- no API key or network dependency in UI flow
- Source Library provider distinction
- existing mock provider review queue stability

## Remaining Limitations

- Crossref data is still local fixture data, not live provider data.
- Provider conflict comparison is not implemented.
- Raw-vs-normalized evidence is compact in the UI and may need a fuller inspection drawer later.
- Real provider error states are still planned, not implemented.
- Review queue apply remains limited to explicitly approved structured metadata fields.

## Recommended Next Sprint

Recommended next sprint: 4I-7C Provider Conflict / Candidate Comparison Preview.

Alternative next sprint: 4I-8 Real Crossref Network Preflight Plan.

Do not begin live provider implementation until read-only conflict handling, stale-value protection, fixture-only regression coverage, and no-overwrite boundaries remain stable.
