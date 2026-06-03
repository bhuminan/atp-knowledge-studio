# External Metadata Match Mock Provider 4I-2

## Purpose

Sprint 4I-2 adds a preview-only external metadata match contract for the batch intake queue. It prepares the app for later Crossref, OpenAlex, DOI, ISBN, or library metadata lookup without calling any external service in this sprint.

The implementation is deterministic and local:

Batch intake queue record
-> mock external metadata provider
-> metadata match candidate(s)
-> confidence and suggested correction preview
-> human review required
-> no overwrite and no persistence mutation

## Contract

The TypeScript contract lives in:

- `src/lib/sources/ExternalMetadataMatchMapper.ts`
- `src/lib/sources/ExternalMetadataMockProvider.ts`

The provider contract includes:

- provider ID and name
- provider type
- mock-provider flag
- supported source types
- provider notes

The match candidate contract includes:

- matched title, authors, year, and source type
- optional journal, publisher, container, volume, issue, page range, DOI, ISBN, and URL
- raw provider reference
- provider confidence
- provider warnings

The result contract includes:

- match status
- confidence score and confidence band
- match reasons and mismatch reasons
- suggested corrections
- warnings and blockers
- next action
- `autoOverwriteAllowed: false`

## Mock Provider Behavior

The mock provider uses only existing batch queue metadata such as file name and file type. It does not read files, parse documents, call web services, call AI, or request API keys.

Deterministic QA cases:

- `service-quality-chapter` -> high-confidence mock book-chapter candidate
- `article` or `report` -> medium-confidence mock journal/article-style candidate
- `ambiguous` -> low-confidence human-review candidate
- `nomatch` or `unmatched` -> no match

All mock candidate values are fixture evidence for UI and mapper QA only. They are not treated as verified bibliographic truth.

## Confidence Rules

Confidence is derived from:

- provider fixture confidence
- local file-name title token overlap
- file type and suggested source type compatibility

Bands:

- `high`: score >= 80
- `medium`: score >= 55
- `low`: score >= 25
- `none`: no usable match

The mapper always keeps corrections pending. A high-confidence mock match is still not an approval.

## Suggested Corrections

Suggested corrections are generated only as review prompts. They may include title, source type, authors, year, journal, publisher, container title, volume, issue, page range, DOI, ISBN, or URL.

Every correction has:

- current value
- suggested value
- provider name
- confidence
- reason
- `actionState: pending`

No correction is applied automatically.

## UI Preview

Source Library now includes:

`External Metadata Match Preview - Mock`

The panel shows:

- match status
- confidence band and score
- provider candidate details
- suggested corrections
- next action
- mock-only and no-overwrite notices

It does not expose approval, save, or overwrite actions.

## Persistence Boundary

No persistence mutation occurs in Sprint 4I-2.

The preview does not:

- create SourceDocuments
- create SourceCards
- update existing bibliographic metadata
- approve batch metadata
- save APA candidates
- modify KnowledgeCards or DraftArtifacts

The batch queue remains the only saved layer involved, and 4I-2 only reads it for preview.

## No Real Provider Policy

Sprint 4I-2 intentionally avoids:

- real Crossref
- real OpenAlex
- DOI lookup
- ISBN lookup
- web search
- AI/API calls
- API keys
- provider package/dependency changes

Future real provider work should preserve the same contract and keep provider evidence separated from human approval.

## Remaining Limitations

- Metadata values are mock fixtures, not verified records.
- No duplicate-resolution workflow exists yet.
- No batch approval workflow exists yet.
- No automatic merge or overwrite is allowed.
- PDF parsing and OCR remain out of scope.

## Next Recommended Sprint

Sprint 4I-3 should add a human review surface for external metadata match candidates. It should preserve the no-overwrite default and require explicit field-by-field approval before any metadata mutation is allowed.
