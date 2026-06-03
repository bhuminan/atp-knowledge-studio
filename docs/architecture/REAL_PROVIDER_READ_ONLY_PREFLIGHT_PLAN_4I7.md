# Real Provider Read-Only Candidate Preflight Plan 4I-7

## Purpose

Sprint 4I-7 plans the first real external metadata provider integration for ATP Knowledge Studio. This is an architecture and documentation sprint only. It does not implement real API calls, API keys, provider packages, network requests, SourceCard mutation, structured metadata mutation, APA-final verification, PDF/OCR, AI/API, DOCX export, or UI redesign.

The next provider step must be read-only and candidate-only. Provider data can support metadata review, but it must not become a direct write path.

## A. Current Safe Workflow

The current safe workflow is:

```text
mock provider
-> candidate correction
-> review decision
-> audit
-> dry-run
-> structured apply only
```

Current boundaries:

- Batch intake jobs persist file-level queue records.
- The mock provider creates deterministic match candidates and suggested corrections.
- Suggested corrections are reviewed through approve, reject, edit, or defer decisions.
- Review decisions create audit events.
- Dry-run evaluates whether a reviewed correction could later be applied.
- The only implemented apply path writes selected `source_card_bibliographic_metadata` fields.
- Compact SourceCard fields remain blocked.
- `citationText` remains untouched.
- APA-final verification remains untouched.
- Duplicate apply after `verified` is blocked.
- Stale current values block apply.

## B. Why Real Provider Must Start Read-Only

Real provider data can be wrong even when it looks authoritative.

Provider risk examples:

- DOI records can point to a different version than the local file.
- ISBN records can match the wrong edition, region, format, or whole book instead of a chapter.
- Title matches can be stale, translated, abbreviated, or normalized differently from APA needs.
- Author lists can be incomplete, reordered, truncated, or formatted inconsistently.
- Journal/container metadata can reflect an index record instead of the source the user has.
- External metadata is evidence, not truth.

Policy:

- There must be no direct provider-to-apply path.
- Provider output must enter ATP as evidence and candidate corrections only.
- Human review must remain mandatory.
- Provider confidence can prioritize review, but cannot approve metadata.
- Provider data must never overwrite ATP metadata automatically.

## C. Candidate Provider Order

Recommended provider order:

1. Crossref read-only candidate provider.
2. OpenAlex read-only fallback.
3. DOI exact lookup.
4. ISBN/book metadata later.

Rationale:

- Crossref is the best first target because the existing mock fixture already models a Crossref-like provider and many academic records are DOI-centered.
- OpenAlex should follow as broad discovery fallback, not as the first authority source.
- DOI exact lookup should be handled after the Crossref fixture path proves identifier normalization and error handling.
- ISBN/book metadata should come later because edition and chapter boundaries carry higher mismatch risk.

## D. Provider Contract

Future real provider contract should preserve the existing mock mapper shape while adding explicit raw evidence and error metadata.

Recommended TypeScript shape:

```ts
type RealExternalMetadataProviderType =
  | "crossref_read_only"
  | "openalex_read_only"
  | "doi_read_only"
  | "isbn_read_only";

interface RealExternalMetadataProvider {
  providerId: string;
  providerName: string;
  providerType: RealExternalMetadataProviderType;
  isMock: false;
  supportsSourceTypes: string[];
  requiresNetwork: true;
  requiresApiKey: boolean;
  noAutoOverwrite: true;
  notes: string;
}

interface RealProviderRequestInput {
  intakeJobId: string;
  sourceCardId: string | null;
  fileName: string;
  sourceTypeGuess: string;
  titleCandidate: string | null;
  authorsCandidate: string[];
  yearCandidate: string | null;
  doiCandidate: string | null;
  isbnCandidate: string | null;
  containerCandidate: string | null;
}

interface NormalizedProviderCandidate {
  provider: RealExternalMetadataProvider;
  providerRecordRef: string;
  rawProviderSnapshotJson: string;
  normalizedTitle: string | null;
  normalizedAuthors: string[];
  normalizedYear: string | null;
  normalizedSourceType: string | null;
  normalizedDoi: string | null;
  normalizedIsbn: string | null;
  normalizedJournal: string | null;
  normalizedContainerTitle: string | null;
  normalizedPublisher: string | null;
  normalizedVolume: string | null;
  normalizedIssue: string | null;
  normalizedPageRange: string | null;
  normalizedUrl: string | null;
  confidenceScore: number;
  confidenceBand: "high" | "medium" | "low" | "none";
  confidenceEvidence: string[];
  warnings: string[];
  blockers: string[];
  noAutoOverwrite: true;
}

interface ProviderExecutionResult {
  providerId: string;
  requestInput: RealProviderRequestInput;
  status:
    | "candidate_found"
    | "no_match"
    | "provider_timeout"
    | "provider_rate_limited"
    | "provider_network_error"
    | "provider_config_missing"
    | "provider_response_invalid";
  candidates: NormalizedProviderCandidate[];
  warnings: string[];
  blockers: string[];
}
```

Contract rules:

- Store provider id, name, type, and record reference.
- Store request input enough to reproduce review context.
- Store normalized candidate output separately from raw provider snapshot.
- Store confidence evidence as explainable reasons, not only a number.
- Store warnings and blockers from provider, mapper, and comparison layers.
- Represent rate-limit, timeout, network, config, and invalid-response states explicitly.
- Every provider result must carry `noAutoOverwrite: true`.

## E. API, Key, And Network Policy

Required policy:

- No hardcoded API keys.
- Configuration must be environment/config based.
- Missing config must produce `provider_config_missing`, not a crash.
- Network failure must produce offline-safe provider status.
- Provider timeouts must be bounded and visible to the user.
- CI tests must not make network calls.
- Tests must use deterministic fixtures.
- Fixture payloads must cover success, no match, timeout, rate limit, malformed response, and provider conflict cases.
- Provider data must be stored as evidence only.
- Raw provider snapshots must be retained for audit and debugging, subject to future privacy/storage review.
- API keys, request headers, tokens, and secrets must never be stored in audit snapshots or UI logs.

Recommended first-sprint environment names for later implementation:

- `ATP_CROSSREF_MAILTO`
- `ATP_CROSSREF_ENABLED`

These names are planning placeholders only. Do not add `.env` entries until implementation begins.

## F. Confidence Policy

Confidence must be computed from field-level evidence and conflicts.

Suggested evidence rules:

- DOI exact match: strong positive evidence, but not automatic approval.
- Title similarity: compare normalized title tokens; high similarity supports confidence, low similarity can block.
- Author overlap: compare normalized family names where possible; missing authors should lower confidence.
- Year/date match: exact year supports confidence; one-year drift can be warning; larger drift should reduce or block.
- Journal/container match: supports source identity when title and authors also align.
- Source type conflict: should lower confidence or block, especially book vs article or chapter vs whole book.
- Duplicate suspected: should block batch review and require human resolution.
- Provider conflict: conflicting candidates for the same field should route to item-level review.

Recommended bands:

- `high`: exact DOI or strong title/author/year/container agreement with no blockers.
- `medium`: plausible title plus partial author/year/container agreement, or exact identifier with non-blocking mismatch.
- `low`: weak title match, missing identifiers, partial metadata, or ambiguous provider result.
- `none`: no usable provider result or all candidates blocked.

High confidence is review priority only. It is not approval and not metadata truth.

## G. Persistence Boundary

Real provider results may create:

- external metadata match candidate records
- suggested corrections
- audit events

Real provider results must not:

- mutate `source_cards`
- mutate `source_card_bibliographic_metadata`
- set APA-final verification
- overwrite `citationText`
- trigger dry-run automatically
- trigger apply automatically
- create DraftArtifacts, KnowledgeCards, SourceDocuments, or DOCX exports

Recommended persistence flow:

```text
real provider request
-> provider execution result
-> external metadata match candidate
-> suggested corrections
-> review decision
-> audit event
-> optional dry-run by explicit user action
-> optional structured apply by explicit user action
```

No write path may bypass the existing review, audit, dry-run, and explicit apply gates.

## H. UI Preflight Plan

The first real provider UI should be a compact preflight/candidate panel, not an apply UI.

Show:

- provider source
- provider mode: read-only
- confidence score and band
- raw-vs-normalized summary
- field-level evidence reasons
- warnings and blockers
- provider timeout/error state
- candidate-only notice
- no-overwrite notice
- no-APA-final notice
- no direct apply notice

Future action:

- "Send to Review Queue" may be added later.
- It must create persisted match candidates and suggested corrections only.
- It must not apply metadata.

Do not expose:

- direct apply
- compact SourceCard mutation
- citationText overwrite
- APA-final verification
- batch apply

## I. QA Plan

Required QA before any real provider is enabled:

- fixture-only provider tests
- no-network CI tests
- provider timeout tests
- provider rate-limit tests
- provider config-missing tests
- malformed provider response tests
- no-overwrite regression tests
- confidence scoring tests
- DOI exact-match tests
- title similarity tests
- author overlap tests
- year/date conflict tests
- journal/container conflict tests
- stale current-value tests
- duplicate/provider-conflict tests
- raw snapshot preservation tests
- no API key leakage tests

Test policy:

- Unit tests should run against saved fixture JSON payloads.
- Playwright tests should assert candidate-only/no-overwrite notices.
- Rust persistence tests should verify real provider candidate persistence does not mutate SourceCards or structured metadata.
- CI must be green without network access.

## J. Recommended Next Sprint

Recommended next sprint:

4I-7A Crossref Read-Only Fixture Provider MVP

Scope for 4I-7A:

- fixture-backed Crossref-shaped provider adapter
- no live Crossref API call
- no API key
- no network
- read-only candidate output
- raw fixture snapshot
- normalized candidate mapping
- confidence evidence
- warnings/blockers
- no mutation
- QA proving no overwrite

Do not start 4I-7A in this sprint.

## Final Decision

Real provider integration is not safe as a write path yet. It is safe to begin as read-only candidate evidence only, using deterministic fixtures first. Compact SourceCard apply remains blocked, and real provider data must not expand the existing apply boundary.
