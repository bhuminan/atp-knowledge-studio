# Parsed DOCX DOCX Export MVP 4F-5

## Purpose

Sprint 4F-5 adds an explicit DOCX MVP export action to the parsed-DOCX DraftArtifact path. The action is available only from the parsed-DOCX export package preview and remains draft-only, mock/not-final, and not APA-final.

## Export Boundary

- Export is never automatic.
- Export is blocked when the parsed-DOCX export package preview is blocked.
- A `needs_review` package may be exported only as MVP inspection output when the existing DOCX MVP command allows it.
- Export output must be manually verified before academic use.
- Export output is not final manuscript approval.

## Reuse Of Existing DOCX Command

The parsed-DOCX path uses a TypeScript adapter to convert the parsed-DOCX export package preview into the existing generic DOCX export package contract. The existing DOCX export command/service is reused without command redesign and without new dependencies.

## Draft-Only Limitation

The saved parsed-DOCX DraftArtifact remains `mock_only` and `not_final`. The DOCX MVP output is an inspection artifact only. It does not create polished academic prose, final manuscript state, or downstream publication readiness.

## Citation And Page-Number Limitations

- Citation placeholders are preserved as unresolved placeholders.
- The export is not APA-final.
- DOCX page numbers remain untrusted.
- Chunk references remain the trace anchor until a future page-number verification workflow exists.
- No citations, evidence, cases, quotes, or findings are fabricated.

## No Final Manuscript Rule

The parsed-DOCX DOCX MVP export does not save a final manuscript, does not run an APA finalizer, does not invoke a citation manager, and does not trigger AI/API generation.

## Next Recommended Sprint

Add a manual export verification checklist for parsed-DOCX DOCX MVP output, including copied file path review, unresolved citation placeholders, untrusted DOCX page-number warnings, and section-level academic review status.
