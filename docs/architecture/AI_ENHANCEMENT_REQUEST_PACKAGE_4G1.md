# AI Enhancement Request Package Preview 4G-1

## Purpose

Sprint 4G-1 adds a deterministic preview-only AI Enhancement Request Package for the saved parsed-DOCX pipeline. The package describes what may be sent to a future AI provider after review gates are satisfied, but it does not call a provider, execute a prompt, generate prose, save output, or change DOCX export behavior.

This sprint prepares the request boundary only.

## Input Boundary

The request package can be built only from already available parsed-DOCX workflow objects:

- Saved parsed-DOCX SourceDocument detail.
- Saved parsed-DOCX SourceCard detail.
- Approved parsed-DOCX MarketingTags.
- Saved parsed-DOCX KnowledgeCards.
- Saved mock/not-final parsed-DOCX DraftArtifact detail.
- Parsed-DOCX export package preview.
- Sprint 4G-0 AI/API integration preflight readiness.

The package source mode is `parsed_docx`. Provider mode is `none_preview_only`.

## Output Boundary

The mapper produces structured preview metadata:

- Package metadata with deterministic package ID, status, source mode, and provider mode.
- Source boundary for SourceDocument, SourceCard, DraftArtifact, parser source, source type, and provenance warnings.
- Evidence boundary with KnowledgeCard IDs grouped by type, approved MarketingTag references, trace references, evidence coverage summary, and missing trace blockers.
- Draft boundary with section IDs/titles, section readiness, citation placeholder count, sections requiring human review, and a warning that the current draft is not final prose.
- AI instruction boundary listing allowed future task types as metadata only.
- Forbidden operations.
- Review gate requirements.
- Blockers and warnings aligned with 4G-0 preflight logic.

The output is not AI output. It is not a prompt execution result. It is not a final manuscript.

## Allowed Future AI Task Metadata

The request package may list these future task types as inert metadata:

- `enhance_section_clarity`
- `improve_flow`
- `suggest_managerial_implications`
- `identify_evidence_gaps`
- `suggest_teaching_angle`

These values are not executable prompts in 4G-1. They are planning labels for a later provider adapter sprint.

## Forbidden Operations

The request package explicitly forbids:

- `fabricate_citation`
- `fabricate_page_number`
- `fabricate_author_year`
- `invent_quote`
- `invent_case`
- `remove_human_review`
- `produce_final_manuscript`
- `save_output_automatically`

Future AI integration must preserve this list at the request boundary and enforce it again at response validation.

## Review Gate

The package requires all of the following:

- Human review.
- Citation review.
- Trace review.
- Manual export verification.

The parsed-DOCX path remains explicit-review-only. No AI output can bypass review gates, become a source of truth, or convert placeholders into final APA citation metadata.

## Why No Provider Call Yet

The real provider boundary is intentionally deferred because the project still needs:

- Provider-agnostic request and response DTOs.
- Mock-provider contract tests.
- Response validation for unsupported claims, missing traces, and fabricated citation data.
- Clear separation between enhancement suggestions and final manuscript persistence.
- Explicit user approval before any future provider output affects saved objects.

No API key, provider package, network call, or model-specific prompt is introduced in this sprint.

## Future Provider Adapter Preparation

Sprint 4G-1 prepares for a later provider adapter sprint by making the request boundary visible and testable in Source Library. The next recommended sprint is `4G-2`: define provider-agnostic AI enhancement request/response DTOs and mock-provider-only response validation without real API calls.

## Remaining Limits

- DOCX page numbers remain untrusted and must not be sent as reliable page evidence.
- Citation placeholders are not APA-final.
- DraftArtifact content remains mock/not-final.
- The request package is preview-only and is not persisted.
- DOCX export behavior is unchanged.
