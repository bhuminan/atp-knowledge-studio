# Batch Intake Metadata Match Architecture 4I-0

## A. Purpose

Sprint 4I-0 defines the architecture for semi-automatic batch research intake and external metadata matching.

This sprint is documentation and planning only. It does not implement code, migrations, Rust commands, TypeScript, UI, provider calls, DOI/ISBN lookup, PDF parsing, OCR, AI/API, SourceCard mutation, APA finalization, DOCX export changes, or dependency changes.

ATP Knowledge Studio needs this architecture because the 4H citation foundation is reliable but still highly manual. A real research workflow may contain dozens or hundreds of PDFs, DOCX files, reports, and chapters. If every source requires fully manual metadata entry, ATP becomes a slow citation form instead of a research studio.

The product direction is semi-automatic:

- automate intake, comparison, scoring, and suggestion work
- preserve human approval before metadata changes are saved
- keep audit trails for accepted, rejected, and edited suggestions
- treat external metadata as evidence, not absolute truth
- never fabricate citation metadata or APA references

## B. Target Workflow

Future workflow:

```text
1. Select/import multiple files
2. Create intake jobs
3. Queue processing
4. Parse/extract file text or metadata
5. Create candidate SourceDocument / SourceCard metadata
6. Query external metadata providers
7. Compare ATP metadata with external metadata
8. Compute confidence score
9. Generate suggested corrections
10. Route items to review queues
11. Batch approve/reject/edit
12. Save human-verified metadata
```

Architecture sequence:

```text
Multi-file import
-> BatchIntakeJob[]
-> parser/extraction status
-> candidate metadata snapshot
-> ExternalMetadataMatch[]
-> MetadataComparisonResult
-> confidence score
-> SuggestedMetadataCorrection[]
-> review queue routing
-> human decision
-> verified metadata save
-> audit trail event
```

The workflow must not auto-create final SourceCards, overwrite human metadata, or mark APA-final verification.

## C. Batch Intake Job Model

Future contract name:

`BatchResearchIntakeJob`

Suggested fields:

```ts
type BatchIntakeQueueStatus =
  | "queued"
  | "parsing"
  | "parsed"
  | "parser_warning"
  | "parser_failed"
  | "metadata_extracted"
  | "metadata_missing"
  | "external_match_pending"
  | "external_match_found"
  | "no_external_match"
  | "high_confidence_match"
  | "medium_confidence_match"
  | "low_confidence_match"
  | "duplicate_suspected"
  | "needs_review"
  | "approved"
  | "rejected"
  | "verified";

interface BatchResearchIntakeJob {
  intakeJobId: string;
  fileName: string;
  filePath: string | null;
  fileRefPolicy: "local_path" | "app_data_copy" | "security_scoped_ref" | "unavailable";
  fileType: "DOCX" | "PDF" | "TXT" | "HTML" | "UNKNOWN";
  fileSize: number | null;
  sourceTypeGuess:
    | "academic_journal_article"
    | "book"
    | "book_chapter"
    | "report_white_paper"
    | "website_web_article"
    | "docx_manuscript_source_note"
    | "teaching_note"
    | "unknown_pending_review";
  queueStatus: BatchIntakeQueueStatus;
  parserStatus: "not_started" | "queued" | "running" | "parsed" | "warning" | "failed" | "unsupported";
  metadataExtractionStatus:
    | "not_started"
    | "candidate_created"
    | "missing_required_fields"
    | "warning"
    | "failed";
  externalMatchStatus:
    | "not_started"
    | "pending"
    | "match_found"
    | "no_match"
    | "provider_warning"
    | "provider_failed";
  reviewStatus: "not_reviewed" | "needs_review" | "approved" | "rejected" | "verified";
  duplicateStatus: "not_checked" | "none" | "duplicate_suspected" | "duplicate_confirmed" | "not_duplicate";
  parserWarnings: string[];
  metadataWarnings: string[];
  externalMatchWarnings: string[];
  blockers: string[];
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
```

File reference policy:

- `local_path`: current local file reference, useful for desktop-only workflows.
- `app_data_copy`: future safer mode where selected files are copied into app storage.
- `security_scoped_ref`: possible future macOS-style file access reference.
- `unavailable`: item was imported from metadata only or the original file is missing.

The model should preserve enough state to show progress and warnings without forcing immediate SourceDocument or SourceCard creation.

## D. Queue States

Recommended queue/status states:

- `queued`: job exists and is waiting for processing.
- `parsing`: parser or metadata extractor is running.
- `parsed`: parser completed without blocking failure.
- `parser_warning`: parser completed with warnings that require review.
- `parser_failed`: parser failed or file type is unsupported.
- `metadata_extracted`: candidate metadata was derived from parser/file/manual input.
- `metadata_missing`: required fields are absent.
- `external_match_pending`: external match request is queued or running.
- `external_match_found`: at least one provider returned a plausible match.
- `no_external_match`: providers returned no usable match.
- `high_confidence_match`: local/provider comparison is strong enough for batch approval review.
- `medium_confidence_match`: plausible match, item-level review required.
- `low_confidence_match`: weak match, must not overwrite metadata.
- `duplicate_suspected`: likely overlap with an existing SourceCard or intake job.
- `needs_review`: human review is required before save/update.
- `approved`: human approved the proposed item or correction.
- `rejected`: human rejected the proposed item, match, or correction.
- `verified`: approved metadata was saved with audit provenance.

Status should be represented as explicit queue state plus sub-statuses where useful. A job may have `queueStatus: needs_review` and still carry parser warnings, duplicate suspicion, or external match details.

## E. External Metadata Providers

### Crossref

Best use case:

- journal articles
- conference papers
- reports with DOI metadata

Likely input:

- DOI
- title
- author names
- year
- journal/container title

Likely output metadata:

- title
- authors
- DOI
- publication date
- container title
- publisher
- volume/issue/page range when available
- URL
- Crossref work ID

Reliability risks:

- title normalization and capitalization can differ from APA needs
- author ordering may be incomplete or represented differently
- preprints and published versions can be confused
- page ranges may be missing

Rate limit / network risk:

- requires network access
- rate limits and polite identification should be planned
- provider outages must route jobs to review, not failure panic

No-fabrication boundary:

- Crossref data may suggest fields but must not auto-overwrite human metadata without approval.

### OpenAlex

Best use case:

- broad scholarly metadata discovery
- cases where DOI is missing but title/author/year are available
- alternate identifiers and institution/context metadata

Likely input:

- title
- DOI
- author names
- year

Likely output metadata:

- title
- authors
- publication year
- venue/source
- DOI
- OpenAlex ID
- concepts/fields of study
- related works

Reliability risks:

- broad index can return near matches
- venue names and source types may not map cleanly to APA requirements
- concepts are not citation metadata and should not drive APA fields

Rate limit / network risk:

- requires network access
- API limits and response variability need fixture-based QA

No-fabrication boundary:

- OpenAlex matches should be treated as evidence and compared with local metadata before review.

### DOI Metadata

Best use case:

- exact DOI lookup for articles, reports, datasets, and books with DOI records

Likely input:

- DOI string

Likely output metadata:

- canonical DOI
- title
- creators
- publication date
- publisher
- container title
- URL

Reliability risks:

- DOI can point to a different version than the local file
- malformed DOI strings can match nothing
- metadata completeness varies by registrant

Rate limit / network risk:

- depends on resolver/provider
- must handle network failure and malformed DOI safely

No-fabrication boundary:

- exact DOI match can raise confidence, but human approval is still required before overwrite.

### ISBN / Book Metadata Provider

Best use case:

- books
- textbook chapters
- edited volumes

Likely input:

- ISBN-10
- ISBN-13
- title
- author/editor

Likely output metadata:

- title
- authors/editors
- publisher
- publication year/date
- edition
- ISBN
- language

Reliability risks:

- different editions can share similar titles
- chapter metadata may not be represented
- publisher names and dates may vary by region/edition

Rate limit / network risk:

- provider availability varies
- some book providers have restrictive terms or quota limits

No-fabrication boundary:

- ISBN exact match can support high confidence, but edition and chapter fields still require review.

### Zotero-Style Translator Approach

Best use case:

- future webpage/report metadata extraction
- publisher pages with embedded citation metadata
- library catalog pages

Likely input:

- URL
- HTML page metadata

Likely output metadata:

- title
- author
- date
- publisher/site
- DOI/ISBN when embedded
- item type

Reliability risks:

- translators require ongoing maintenance
- website markup changes can break extraction
- page metadata can be promotional or incomplete

Rate limit / network risk:

- requires network and page fetching
- must respect robots/policies and avoid scraping behavior without a clear design

No-fabrication boundary:

- translator output remains candidate metadata only until human approval.

## F. Matching And Confidence Policy

Confidence should be computed from field-level evidence, not a single provider response.

Conceptual scoring factors:

- title similarity
- author overlap
- year/date match
- DOI exact match
- ISBN exact match
- journal/container/publisher match
- page/volume/issue match
- source type match

Recommended bands:

- `high_confidence`: exact DOI or ISBN match, strong title similarity, strong author overlap, and compatible year/source type.
- `medium_confidence`: strong title plus partial author/year/container match, or exact identifier with some non-blocking metadata mismatch.
- `low_confidence`: weak title similarity, missing identifiers, conflicting authors/year/source type, or provider result appears related but not the same source.
- `no_match`: no provider result passes minimum similarity or identifier checks.

Policy:

- High confidence may be batch-approvable.
- Medium confidence needs item-level review.
- Low confidence must not overwrite metadata.
- No match should route to missing metadata or manual review.
- External metadata is evidence, not truth.
- Provider fields should be compared against ATP values before any suggestion is shown as approvable.

Suggested high-confidence conditions:

- DOI exact match and title similarity above threshold.
- ISBN exact match and title/edition compatible.
- Title similarity high, author overlap high, year match exact or explainably close.

Suggested blocker conditions:

- DOI exact match but title is materially different.
- ISBN exact match but edition/source type conflicts.
- title match but author/year conflict.
- provider source type conflicts with human-reviewed source type.

## G. Suggested Correction Model

Future contract name:

`MetadataSuggestedCorrection`

Suggested fields:

```ts
type SuggestedCorrectionAction = "approve" | "reject" | "edit";

interface MetadataSuggestedCorrection {
  suggestionId: string;
  intakeJobId: string;
  sourceCardId: string | null;
  fieldName:
    | "title"
    | "authors"
    | "year"
    | "sourceType"
    | "publisher"
    | "journal"
    | "containerTitle"
    | "edition"
    | "volume"
    | "issue"
    | "pageRange"
    | "doi"
    | "isbn"
    | "url"
    | "accessDate";
  currentAtpValue: string | null;
  externalSuggestedValue: string | null;
  provider: "crossref" | "openalex" | "doi_metadata" | "isbn_provider" | "zotero_translator";
  confidence: "high" | "medium" | "low" | "no_match";
  reason: string;
  action: SuggestedCorrectionAction | null;
  reviewerEditedValue: string | null;
  createdAt: string;
  updatedAt: string;
}
```

Rules:

- suggestions are field-level
- approval can happen per field or per job batch
- edit creates an explicit reviewer value, not a silent provider value
- rejected suggestions stay auditable
- provider values are never hidden once used in a decision

## H. Review Queues

Future review queues:

- Ready to batch approve.
- Needs human review.
- Missing metadata.
- Duplicate suspected.
- Parser warning.
- External match failed.
- Verified.

Queue routing:

- Ready to batch approve: high-confidence suggestions with no blockers.
- Needs human review: medium confidence, conflicting fields, or accepted warnings needed.
- Missing metadata: required fields absent after parser/provider matching.
- Duplicate suspected: likely existing SourceCard or duplicate intake job.
- Parser warning: parser output has unsupported content, untrusted structure, or file-specific warnings.
- External match failed: provider failed, no usable match, or network unavailable.
- Verified: human-approved metadata has been saved and audit event recorded.

Queues should support filtering by file type, source type, confidence band, provider, warning count, duplicate status, and review status.

## I. Batch Approval Policy

Rules:

- No automatic overwrite without approval.
- Batch approve only high-confidence items.
- Medium and low confidence require item-level review.
- Approved changes must create audit trail records.
- User can reject or edit suggested corrections.
- Batch approval must show a summary before save.
- Batch approval must never mark APA-final verification.
- Batch approval must not create final DraftArtifacts or DOCX exports.
- Batch approval must preserve previous ATP values in audit history.

Recommended batch approval preconditions:

- no unresolved parser failure
- no duplicate confirmed
- no source-type conflict
- no candidate blocker
- confidence is high
- required metadata fields are present or intentionally waived
- user explicitly confirms batch approval

## J. Persistence Strategy

Recommended future tables:

- `batch_intake_jobs`
- `external_metadata_matches`
- `external_metadata_match_fields`
- `metadata_suggested_corrections`
- `metadata_review_decisions`
- `metadata_audit_events`

Do not implement these tables in 4I-0.

Persistence recommendations:

- keep queue jobs separate from SourceDocuments and SourceCards
- keep provider raw/normalized match data separate from human metadata
- store field-level suggestions separately from provider match rows
- store human decisions and audit events separately from suggestions
- never mutate SourceCard compact metadata directly from provider output
- update SourceCard/structured metadata only through explicit approved decisions
- preserve existing SourceDocument and SourceCard save boundaries

Potential write flow:

```text
batch_intake_jobs
-> external_metadata_matches
-> metadata_suggested_corrections
-> metadata_review_decisions
-> approved structured metadata update
-> metadata_audit_events
```

## K. UI Workflow Plan

Future UI plan without implementation:

- batch import button
- intake queue dashboard
- status filters
- review queue
- confidence score display
- batch approve controls
- correction diff view
- audit trail view

Suggested Source Library workspace stages:

- Intake Queue: file list, parser state, warnings.
- Metadata Match: external providers, confidence, duplicate status.
- Review Queue: suggested corrections and field-level diffs.
- Approval: batch approve/reject/edit actions.
- Verified Metadata: saved metadata and audit trail summary.

The UI should progressively disclose dense review details rather than adding all controls to the current Source Library panel stack.

## L. QA Strategy

Future QA should cover:

- batch file selection
- queue creation
- job status transitions
- external match mock provider
- confidence scoring
- suggested correction generation
- batch approve/reject/edit
- no overwrite without approval
- audit trail
- duplicate detection

Recommended test types:

- pure TypeScript tests for scoring and suggestion mappers
- Rust persistence tests for future queue/audit tables
- Playwright tests for queue filters and review flows
- provider fixture tests that never require network
- regression tests proving SourceCard metadata is unchanged until approval
- duplicate detection fixture tests
- batch approval summary tests

QA principle:

- tests must not require live Crossref/OpenAlex/DOI/ISBN network calls
- provider behavior should use fixture payloads and deterministic adapters
- no overwrite without approval must be a first-class regression test

## M. Recommended Next Sprint

Recommended next implementation sprint:

Sprint 4I-1 - Multi-file Intake Queue MVP.

Constraints for 4I-1:

- no external API yet
- metadata-only multi-file selection
- create local queue records
- status display
- no parser expansion unless already available
- no auto SourceCard creation
- no overwrite
- no APA-final verification
- no PDF parser implementation
- no OCR
- no Source Library redesign beyond a compact queue MVP surface

4I-1 should prove queue creation and status visibility before provider matching, confidence scoring, and batch approval are implemented.
