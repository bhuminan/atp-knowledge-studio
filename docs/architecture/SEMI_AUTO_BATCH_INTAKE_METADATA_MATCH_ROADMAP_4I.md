# Semi-Auto Batch Intake Metadata Match Roadmap 4I

## Problem Statement

ATP Knowledge Studio must not become mostly manual. Sprint 4H created a reliable human citation foundation, but manually entering and verifying every source field will not scale for real research projects.

The 4I direction should reduce citation and metadata workload through semi-automatic intake, external metadata matching, confidence scoring, suggested corrections, and batch review, while preserving human approval and audit trails.

## Target Workflow

```text
multi-file import
-> intake queue
-> parser
-> metadata extraction
-> external metadata matching
-> compare
-> confidence score
-> suggested correction
-> pending review queue
-> batch approval / reject / edit
-> human-verified metadata
-> downstream SourceCard / APA review gates
```

## Planned 4I-Series

### 4I-0 Batch Intake & Metadata Match Architecture

Documentation and architecture checkpoint for queue model, metadata matching boundaries, provider policy, confidence scoring shape, audit requirements, and QA strategy. No provider implementation yet.

### 4I-1 Multi-File PDF/DOCX Intake Queue MVP

Add a local queue for multiple files with clear states, parser warnings, duplicate suspicion, and per-file review surfaces. PDF parsing may remain queued or unsupported if the parser is not ready.

### 4I-2 External Metadata Match MVP

Introduce provider adapters for Crossref, OpenAlex, DOI, and ISBN metadata matching. Provider output must be evidence for review, not automatic truth. API keys and rate-limit policies must be explicit.

### 4I-3 Confidence Score + Suggested Corrections

Compare local/parser/human metadata with provider matches. Produce suggested corrections, confidence score, field-level provenance, and reasons. Do not overwrite human data automatically.

### 4I-4 Batch Approve / Reject / Edit Workflow

Allow high-confidence suggestions to be batch-approved, low-confidence suggestions to be routed to review, duplicates to be resolved, and rejected suggestions to remain auditable.

## Queue States

Recommended queue states:

- `queued`
- `parsing`
- `metadata_extracted`
- `external_match_found`
- `high_confidence_match`
- `needs_review`
- `missing_metadata`
- `duplicate_suspected`
- `parser_warning`
- `approved`
- `rejected`
- `verified`

State rules:

- `queued`: file is accepted into the intake queue but not parsed.
- `parsing`: local parser is running or waiting for parser worker completion.
- `metadata_extracted`: local parser or human entry produced candidate metadata.
- `external_match_found`: at least one provider returned a possible match.
- `high_confidence_match`: provider/local comparison passes a conservative confidence threshold.
- `needs_review`: human review is required before persistence or upgrade.
- `missing_metadata`: required source fields remain absent.
- `duplicate_suspected`: candidate overlaps with existing SourceCard or queue item.
- `parser_warning`: parser completed with warnings that affect trust.
- `approved`: human approved proposed metadata for persistence or update.
- `rejected`: human rejected the candidate or match.
- `verified`: human-approved metadata is saved with audit provenance.

## External Metadata Match Policy

External metadata policy:

- Never auto-overwrite human data without approval.
- High-confidence suggestions can be batch-approved.
- Low-confidence suggestions require review.
- Keep an audit trail for every accepted, rejected, or edited suggestion.
- Record metadata source and confidence score.
- Preserve local/parser metadata even when external suggestions exist.
- Make field-level provenance visible before approval.
- Treat external metadata as evidence, not absolute truth.

Recommended provider fields to capture:

- provider name
- provider record ID
- DOI or ISBN used for lookup
- matched title
- matched authors
- matched year/date
- journal/container/publisher
- volume/issue/page range
- DOI/URL
- confidence score
- match reasons
- mismatch reasons
- retrieved timestamp

## Reliability Policy

Reliability rules:

- No fabricated metadata.
- No fabricated citation strings.
- No automatic APA-final verification.
- Human-approved final state remains mandatory.
- External metadata is evidence, not absolute truth.
- Parser-derived metadata remains untrusted until reviewed.
- DOCX parser page numbers remain evidence chunk references, not publication page ranges.
- PDF/OCR extraction must be warning-heavy until accuracy is proven.
- Batch approval must be reversible or auditable.

## Future Data Model Considerations

Potential future entities:

- `research_intake_queue_items`
- `intake_file_parse_runs`
- `external_metadata_matches`
- `external_metadata_match_fields`
- `metadata_suggestions`
- `metadata_review_decisions`
- `metadata_audit_events`
- `duplicate_source_candidates`

Design considerations:

- Keep provider raw payloads separate from normalized suggestions.
- Keep human-entered metadata separate from provider suggestions.
- Store field-level source/provenance.
- Track confidence per field and per record.
- Support stale-match detection when metadata changes.
- Avoid coupling provider output directly to SourceCard update commands.
- Preserve existing explicit SourceCard and APA review boundaries.

## Future QA Strategy

Recommended QA layers:

- pure mapper tests for confidence scoring
- provider adapter tests with fixture payloads only
- no-network tests for build and CI
- queue state transition tests
- duplicate suspicion fixture tests
- field-level suggestion diff tests
- batch approve/reject/edit Playwright flow
- audit trail persistence tests
- regression tests proving human data is not overwritten without approval

## Risks And Mitigations

Risk: external providers disagree.

Mitigation: store alternatives, field-level confidence, and mismatch reasons.

Risk: high-confidence matching overwrites correct human data.

Mitigation: require approval, preserve previous values, and audit every change.

Risk: DOI/ISBN lookup appears authoritative when source type is wrong.

Mitigation: source-type review and field-level comparison before approval.

Risk: batch approval hides low-quality matches.

Mitigation: conservative thresholds, review queue for warnings, sampled QA summaries, and undo/audit history.

Risk: Source Library becomes denser.

Mitigation: future progressive workspace redesign with queue, review, and verification stages separated.

## Next Recommended Step

Next recommended sprint:

Sprint 4I-0 - Batch Intake & Metadata Match Architecture.

4I-0 should remain architecture-first and should not implement Crossref/OpenAlex/DOI/ISBN calls until provider boundaries, confidence rules, and audit requirements are stable.
