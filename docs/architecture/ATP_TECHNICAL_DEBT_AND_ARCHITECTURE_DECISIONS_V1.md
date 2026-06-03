# ATP Technical Debt And Architecture Decisions V1

This markdown file is the editable project-doc equivalent for the tracked binary document `docs/ATP_TECHNICAL_DEBT_AND_ARCHITECTURE_DECISIONS_V1.docx`.

## Technical Debt

### TD: DOCX Page Numbers Remain Untrusted

DOCX parser MVP output does not produce trusted page numbers. Evidence must rely on chunk references such as `docx:pN`. Persistence should continue mapping DOCX page values to null/untrusted fields.

### TD: DOCX Parser MVP Has Limited Structural Support

The DOCX parser MVP does not fully support:

- table structure
- images/drawings
- footnotes/endnotes
- comments
- headers/footers
- fields, citations, or bibliography parts

Tables may contribute text, but structural semantics are not preserved.

### TD: Rust/TypeScript DTO Drift Risk

Parser and persistence boundaries cross Rust and TypeScript DTOs. `DocumentExtractionResponse`, saved SourceDocument records, traces, and candidate-save DTOs must be kept aligned to avoid silent UI/persistence drift.

### TD: Dense Source Library Workflow

Source Library now contains parser preview, candidate review, save boundaries, read/list verification, and downstream preview panels. It needs later progressive workspace redesign so review stages are easier to scan and operate.

### TD: Distributed Review State

Local review states for SourceDocument, SourceCard, MarketingTags, and KnowledgeCards are currently component-local. Future work should consider a clearer review-state model without auto-saving.

## Architecture Decisions

### AD: DOCX-First Parser Strategy Before PDF

The project uses a DOCX-first parser strategy. PDF parsing remains deferred until DOCX evidence traces, review gates, and persistence boundaries are stable.

### AD: Preserve DocumentExtractionResponse Boundary

Parser output must preserve the `DocumentExtractionResponse` boundary. Downstream mappers consume this stable shape rather than calling parser internals.

### AD: Parsed DOCX Pipeline Is Explicit-Review-Only

Parsed DOCX output must never auto-save. Each persistence layer requires explicit user action and saves only the requested object type.

### AD: KnowledgeCard Candidates Must Be Traceable And Review-Gated

KnowledgeCard candidates must include chunk references and remain `needs_review` until explicitly approved. Vague or untraceable evidence must not produce durable candidates.

### AD: Controlled Taxonomy For Parsed DOCX MarketingTags

Parsed DOCX MarketingTag candidates use only the controlled taxonomy seed. New taxonomy terms, free tags, or AI-generated tags are outside the 4E scope.

### AD: No Fabricated Citation Metadata

Author, year, publisher, DOI/URL, APA citation text, and page numbers are not fabricated. Missing citation metadata keeps candidates in review-required states.
