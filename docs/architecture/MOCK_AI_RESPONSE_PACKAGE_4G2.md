# Mock AI Response Package Preview 4G-2

## Purpose

Sprint 4G-2 adds a deterministic preview-only Mock AI Response Package and validation boundary. It models how future AI provider output must be checked before it can affect any parsed-DOCX DraftArtifact.

This sprint does not call a provider, execute a prompt, generate real AI prose, save AI output, replace DraftArtifact content, or change DOCX export behavior.

## Why Mock Response Boundary Comes First

The response boundary is defined before real provider integration so ATP Knowledge Studio can validate output safety rules without network calls, API keys, model behavior, or provider-specific assumptions. The system needs stable local checks for trace support, citation risks, forbidden output types, and review gates before any real provider response can enter the workflow.

## Input From 4G-1 Request Package

The mock response mapper consumes the AI Enhancement Request Package Preview from Sprint 4G-1. That request package already contains:

- Parsed-DOCX source boundary.
- Evidence boundary with KnowledgeCards, MarketingTags, and trace references.
- Draft boundary with section IDs/titles and citation placeholder counts.
- Allowed future AI task metadata.
- Forbidden operations.
- Human, citation, trace, and manual export review gates.

If the request package is blocked, the mock response package is also blocked.

## Output Validation Boundary

The mock response package produces only structured validation placeholders:

- Response metadata with `providerMode: mock_preview_only`.
- Simulated response boundary records by section and task type.
- Validation summary counts.
- Claim validation records.
- Citation validation flags.
- Forbidden output checks.
- Review gate requirements.
- Blockers and warnings.

The simulated output labels are not generated academic paragraphs. They are testable placeholders for future validation logic.

## Claim Validation Policy

Each simulated output receives a claim validation record with:

- Claim ID.
- Section ID.
- Support status: `supported`, `weak_support`, or `unsupported`.
- Trace references.
- KnowledgeCard IDs.
- Warning.
- Blocker.

Unsupported claims are blocked and cannot affect DraftArtifacts. Weak support remains review-only and must pass human trace review before future output could be considered.

## Citation Validation Policy

The citation validation boundary confirms:

- No fabricated APA citation.
- No fabricated author/year.
- No fabricated page number.
- Citation placeholders remain placeholders.
- DOCX page numbers remain untrusted.

Future provider output must not convert placeholders into APA citations or treat DOCX page numbers as reliable evidence.

## Forbidden Output Checks

The mock response package explicitly tracks these forbidden output risks:

- `fabricated_citation`
- `fabricated_page_number`
- `fabricated_author_year`
- `invented_quote`
- `invented_case`
- `unsupported_claim`
- `final_manuscript_claim`
- `auto_save_attempt`
- `human_review_bypass`

These checks are listed at preview time and should become hard response validation rules before a real provider adapter is introduced.

## Review Gate

The mock response package requires:

- Human review.
- Citation review.
- Trace review.
- Academic review.

The package also sets:

- `outputCanBeSaved: false`
- `outputCanReplaceDraft: false`

No mock output can be persisted, replace DraftArtifact content, or become final manuscript text.

## Why Output Cannot Be Saved Yet

Saving or applying AI output is deferred because the project still needs:

- Provider-agnostic response DTOs.
- Hard validation for unsupported claims and missing traces.
- Citation safety checks that reject fabricated metadata.
- A separate user approval flow for any future AI suggestions.
- Clear distinction between draft enhancement suggestions and final manuscript persistence.

## Readiness Criteria Before Real Provider Adapter Sprint

Before any real provider adapter is introduced, the project should have:

- Stable request and response DTOs.
- Mock-provider-only contract tests.
- Response validation that blocks unsupported claims.
- Citation validation that blocks fabricated citation metadata.
- UI review gates that prevent auto-save and draft replacement.
- Documentation confirming provider-neutral behavior and no source-of-truth role for AI.

## Remaining Limits

- No real AI/API integration exists.
- No provider key or provider package exists.
- Mock response labels are not prose.
- DraftArtifact remains mock/not-final.
- DOCX page numbers remain untrusted.
- Citation placeholders remain non-final.
