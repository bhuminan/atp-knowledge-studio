# AI Output Validation Gate Preview 4G-3

## Purpose

Sprint 4G-3 adds a deterministic preview-only AI Output Validation Gate. The gate combines the 4G-0 AI/API Integration Preflight, the 4G-1 AI Enhancement Request Package, and the 4G-2 Mock AI Response Package into one validation decision.

The gate models whether future AI output should be blocked, rejected, marked `needs_review`, or allowed to proceed to human review. It does not call a provider, execute a prompt, generate prose, save output, replace DraftArtifact content, or modify DOCX export behavior.

## Why Validation Gate Comes Before Real Provider Integration

The app needs local, deterministic validation rules before any model output can enter the parsed-DOCX workflow. A real provider adapter should only be introduced after the project can reject unsupported claims, fabricated citation metadata, draft-replacement attempts, auto-save attempts, and human-review bypasses without depending on provider behavior.

## Inputs From 4G-1 And 4G-2

The validation gate consumes:

- AI/API Integration Preflight readiness from 4G-0.
- AI Enhancement Request Package Preview from 4G-1.
- Mock AI Response Package Preview from 4G-2.

The request package supplies source, evidence, draft, allowed-task, forbidden-operation, and review boundaries. The mock response package supplies simulated response records, claim validation, citation validation, forbidden output checks, and review gate constraints.

## Validation Decision Model

The gate emits:

- `blocked`: prerequisites, traces, or coverage are missing.
- `rejected`: forbidden or unsupported output conditions are detected.
- `needs_review`: output can proceed only to human review with warnings.
- `review_ready`: output is ready for human review, but still cannot be saved, exported, or replace draft content.

The validation decision always reports:

- `canReplaceDraftArtifact: false`
- `canBeSaved: false`
- `canExport: false`

`canProceedToHumanReview` is true only for `needs_review` and `review_ready`.

## Evidence Validation Policy

The evidence validation summary includes:

- Total trace refs.
- Missing trace count.
- Unsupported claim count.
- Weak support claim count.
- Supported claim count.
- KnowledgeCard coverage.
- Evidence coverage status: `sufficient`, `partial`, or `insufficient`.

Unsupported claims and missing traces block or reject future AI output before it can reach human review.

## Citation Validation Policy

The citation validation summary includes:

- Citation placeholder count.
- Fabricated citation detection.
- Fabricated author/year detection.
- Fabricated page-number detection.
- `docxPageNumberTrusted: false`.
- Citation status: `blocked`, `needs_review`, or `placeholder_only`.

Citation placeholders remain placeholders. DOCX page numbers remain untrusted. The gate must not allow fabricated APA references, authors, years, page numbers, quotations, or cases.

## Fabrication Validation Policy

The gate explicitly evaluates these forbidden output checks:

- `fabricated_citation`
- `fabricated_page_number`
- `fabricated_author_year`
- `invented_quote`
- `invented_case`
- `unsupported_claim`
- `final_manuscript_claim`
- `auto_save_attempt`
- `human_review_bypass`

Detected fabricated citation metadata, fabricated page numbers, fabricated author/year data, or unsupported claims reject the output boundary.

## Review Requirements

The validation gate always requires:

- Human review.
- Citation review.
- Trace review.
- Academic review.
- Manual export verification.

The gate is preview-only and does not create an approval action.

## Why Output Cannot Be Saved Or Replace DraftArtifact Yet

Saving or applying AI output is deferred because the project still needs:

- Provider-agnostic response DTO contract tests.
- Hard response validation for real provider output.
- Human approval workflow for AI suggestions.
- Citation metadata rejection rules.
- Trace-backed diff or suggestion UI.
- Separate persistence policy for suggestions versus DraftArtifact content.

Until those exist, AI output cannot be saved, exported, or used to replace DraftArtifact content.

## Readiness Criteria Before First Real Provider Adapter Sprint

Before a real provider adapter is added, ATP Knowledge Studio should have:

- Stable request and response DTOs.
- Mock-provider-only validation tests.
- Validation gate tests for blocked, rejected, needs-review, and review-ready states.
- Citation fabrication rejection tests.
- Trace coverage rejection tests.
- UI review gates that keep AI output separate from saved DraftArtifacts.
- Documentation confirming AI is not a source of truth.

## Remaining Limits

- No real provider integration exists.
- No API key or provider package exists.
- No prompt execution occurs.
- No AI-generated prose exists.
- No DraftArtifact content is modified.
- DOCX page numbers remain untrusted.
- Citation placeholders remain non-final.
