# Parsed DOCX DraftArtifact Review Gate 4F-3

## Purpose

Sprint 4F-3 adds a citation, evidence, and trace review gate for explicitly saved parsed-DOCX DraftArtifacts. The gate is a review surface only. It does not generate prose, does not approve a final manuscript, and does not expose DOCX export for the parsed-DOCX path.

## Review Inputs

- Saved parsed-DOCX SourceDocument detail.
- Saved parsed-DOCX SourceCard detail.
- Approved parsed-DOCX MarketingTags.
- Saved parsed-DOCX KnowledgeCards.
- Explicitly saved parsed-DOCX DraftArtifact detail.
- Existing saved DraftArtifact citation/evidence review logic where safe.

## Review Rules

- Block when the saved DraftArtifact is missing.
- Block when linked saved KnowledgeCards are missing.
- Block when the DraftArtifact is not `mock_only` and `not_final`.
- Require saved SourceDocument and SourceCard linkage to remain DOCX.
- Every reviewed section should retain KnowledgeCard or trace support.
- Mark the gate `needs_review` when citation placeholder, evidence, or trace coverage is weak.
- Do not generate, rewrite, polish, or finalize manuscript prose.

## Citation And Page-Number Limitations

- DOCX page numbers remain untrusted.
- Chunk references such as `docx:pN` remain the trace anchor until human page verification exists.
- Citation placeholders are not APA 7 citations.
- No fabricated authors, years, citations, findings, evidence, cases, or quotes are introduced by this gate.

## No DOCX Export Rule

The parsed-DOCX review gate does not expose the existing DOCX export action. The current output is a compact Source Library review summary with status, evidence coverage, citation readiness, trace completeness, section review details, warnings, blockers, and recommended next action.

## No Final Manuscript Rule

Saved parsed-DOCX DraftArtifacts remain mock/not-final. Human academic review is mandatory before any future export or manuscript workflow can be considered.

## Next Recommended Sprint

Add a parsed-DOCX export-readiness checklist that remains gated and preview-only, or add deeper human review controls for resolving citation placeholder and trace coverage warnings before any export sprint begins.
