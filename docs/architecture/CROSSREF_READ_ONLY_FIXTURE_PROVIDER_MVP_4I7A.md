# Crossref Read-Only Fixture Provider MVP 4I-7A

## Purpose

Sprint 4I-7A adds the first real-provider-shaped external metadata provider for ATP Knowledge Studio. It uses local deterministic Crossref-style fixture payloads only. The sprint proves provider normalization, confidence evidence, and Source Library candidate preview without live network access or metadata mutation.

## Fixture-Only Boundary

The provider is intentionally fixture-only:

- `isLiveNetwork: false`
- `isFixtureOnly: true`
- `autoOverwriteAllowed: false`
- `noAutoOverwrite: true`
- no API key
- no live Crossref request
- no dependency changes

The fixture payloads are Crossref-shaped local records. They are evidence for review, not verified bibliographic truth.

## No-Network Policy

The provider does not call `fetch`, does not open a network connection, and does not read environment variables. CI and local QA remain deterministic and offline-safe.

Future live Crossref work must keep fixture-backed tests and must not require network in CI.

## Provider Contract

The provider lives in:

- `src/lib/sources/CrossrefProviderTypes.ts`
- `src/lib/sources/CrossrefFixtureProvider.ts`

The contract includes:

- provider id/name/type
- fixture-only and no-network flags
- no-auto-overwrite flags
- raw fixture snapshot JSON
- normalized external metadata candidate
- confidence score and band
- confidence evidence
- warnings and blockers
- raw-vs-normalized summary

The normalized candidate is compatible with the existing `ExternalMetadataMatchCandidate` shape so it can feed candidate preview and future review queue integration safely.

## Normalization Behavior

Crossref-style fixture payloads normalize to:

- title
- authors
- year/date
- journal/container title
- publisher
- volume
- issue
- page range
- DOI
- URL
- provider record reference
- raw provider snapshot

The raw fixture snapshot is preserved as JSON for audit/debug review. The normalized values are separate from the raw payload so UI and future persistence can show raw-vs-normalized evidence clearly.

## Confidence Rules

Scoring is deterministic and local:

- DOI exact match adds strong evidence but does not approve metadata.
- Title token overlap supports or lowers confidence.
- Author family overlap supports or lowers confidence.
- Year match supports confidence; mismatch lowers confidence.
- Journal/container match supports confidence; mismatch lowers confidence.
- Source type compatibility supports confidence; conflict creates a warning.
- Missing DOI remains a candidate but lowers confidence.

Confidence bands remain review-routing signals only:

- `high`
- `medium`
- `low`
- `none`

High confidence does not mean provider truth and does not trigger metadata apply.

## UI Behavior

Source Library now includes a compact panel:

`Crossref Read-Only Fixture Candidate Preview`

The panel shows:

- fixture-only badge
- no-network badge
- no API key badge
- candidate-only badge
- normalized candidate fields
- confidence band and score
- confidence evidence
- warnings/blockers
- raw-vs-normalized summary
- raw fixture snapshot preserved notice
- no-overwrite notice

The panel exposes no direct apply, no direct save, and no review-queue persistence action in 4I-7A.

## No-Overwrite Boundary

Crossref fixture output must not:

- mutate `source_cards`
- mutate `source_card_bibliographic_metadata`
- overwrite `citationText`
- set APA-final verification
- trigger dry-run
- trigger apply
- create SourceDocuments, SourceCards, DraftArtifacts, KnowledgeCards, MarketingTags, or DOCX exports

Provider output may only support:

- candidate preview
- normalized candidate evidence
- future suggested correction creation
- future review queue evidence

## QA Results

4I-7A adds coverage for:

- deterministic fixture candidate generation
- raw payload preservation
- normalized title/authors/year/journal/DOI fields
- DOI exact-match confidence evidence
- title mismatch confidence reduction
- missing DOI candidate behavior
- no-network/no-API-key fixture flags
- no-overwrite policy
- existing mock provider stability
- Source Library fixture preview rendering

## Remaining Limitations

- No live Crossref API is implemented.
- No OpenAlex fallback exists.
- DOI lookup is fixture matching only.
- ISBN/book metadata lookup is not implemented.
- Fixture candidates are not persisted as real provider records yet.
- Fixture candidates do not create review queue corrections yet.
- Provider conflict handling is still limited to deterministic tests and warnings.

## Recommended Next Sprint

Recommended next sprint:

4I-7B Crossref Candidate to Persisted Review Queue Integration

Alternative:

4I-7B OpenAlex Fixture Fallback Provider Plan

Do not start either next sprint from 4I-7A.
