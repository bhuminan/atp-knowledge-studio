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

### TD: Exported DOCX Is MVP-Only And Not APA-Final

Parsed-DOCX DOCX export now exists as MVP inspection output only. Exported files are not final manuscripts, not APA-final, not publication-ready, and require manual academic verification before use.

### TD: Rust/TypeScript DTO Drift Risk

Parser and persistence boundaries cross Rust and TypeScript DTOs. `DocumentExtractionResponse`, saved SourceDocument records, traces, and candidate-save DTOs must be kept aligned to avoid silent UI/persistence drift.

### TD: Dense Source Library Workflow

Source Library now contains parser preview, candidate review, save boundaries, read/list verification, and downstream preview panels. It needs later progressive workspace redesign so review stages are easier to scan and operate.

### TD: Manual Citation Metadata Workload

The 4H citation foundation is reliable but still requires substantial human entry and review. ATP needs semi-automatic batch intake, external metadata matching, confidence scoring, and batch review to avoid becoming mostly manual.

### TD: Batch Intake And External Metadata Matching Not Implemented

Batch Research Intake Queue, multi-file import, Crossref/OpenAlex/DOI/ISBN matching, suggested metadata corrections, and batch approve/reject/edit are planned for the 4I direction but not implemented.

### TD: APA Review Artifacts Are Not Downstream Inputs Yet

Saved APA review artifacts exist for `needs_correction` and `verified_for_internal_use`, but DraftArtifact review, export readiness, and final manuscript workflows do not consume them yet.

### TD: Distributed Review State

Local review states for SourceDocument, SourceCard, MarketingTags, and KnowledgeCards are currently component-local. Future work should consider a clearer review-state model without auto-saving.

## Architecture Decisions

### AD: DOCX-First Parser Strategy Before PDF

The project uses a DOCX-first parser strategy. PDF parsing remains deferred until DOCX evidence traces, review gates, and persistence boundaries are stable.

### AD: Preserve DocumentExtractionResponse Boundary

Parser output must preserve the `DocumentExtractionResponse` boundary. Downstream mappers consume this stable shape rather than calling parser internals.

### AD: Parsed DOCX Pipeline Is Explicit-Review-Only

Parsed DOCX output must never auto-save. Each persistence layer requires explicit user action and saves only the requested object type.

### AD: Real DOCX Path Remains Explicit-Review-Only

The real DOCX-to-DOCX MVP loop keeps explicit review gates at SourceDocument, SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, export package, and manual verification stages. No stage may auto-save or auto-export downstream objects.

### AD: Exported DOCX Requires Manual Academic Verification

DOCX MVP export output must keep manual verification warnings visible. File metadata and command success are not academic validation, APA validation, citation validation, page-number verification, or final manuscript approval.

### AD: AI/API Integration Comes After Export Boundary Stability

AI/API extraction, synthesis, tagging, citation generation, or drafting must wait until the parsed-DOCX export boundary, review gates, and manual verification expectations are stable.

### AD: KnowledgeCard Candidates Must Be Traceable And Review-Gated

KnowledgeCard candidates must include chunk references and remain `needs_review` until explicitly approved. Vague or untraceable evidence must not produce durable candidates.

### AD: Controlled Taxonomy For Parsed DOCX MarketingTags

Parsed DOCX MarketingTag candidates use only the controlled taxonomy seed. New taxonomy terms, free tags, or AI-generated tags are outside the 4E scope.

### AD: No Fabricated Citation Metadata

Author, year, publisher, DOI/URL, APA citation text, and page numbers are not fabricated. Missing citation metadata keeps candidates in review-required states.

### AD: Human APA Review Artifacts Stay Separate From SourceCard CitationText

Human APA review artifacts are stored separately from compact SourceCard `citation_text`. Saving an internal-use review must not overwrite compact SourceCard citation text or structured metadata.

### AD: ATP Must Reduce Manual Metadata Workload Through Reviewable Automation

The 4I direction should add semi-automatic intake and metadata matching so ATP does not become mostly manual. Automation may propose metadata, confidence scores, and corrections, but human approval and audit trail remain mandatory.

### AD: External Metadata Is Evidence, Not Absolute Truth

Crossref, OpenAlex, DOI, ISBN, and future metadata providers should be treated as evidence sources. Provider data must not auto-overwrite human-entered metadata without explicit approval.
