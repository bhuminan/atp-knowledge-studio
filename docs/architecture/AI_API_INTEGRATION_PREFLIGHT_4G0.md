# AI/API Integration Preflight 4G-0

## Purpose

Sprint 4G-0 prepares ATP Knowledge Studio for future AI/API integration without calling any real provider. It defines the architecture guardrails for AI-assisted enhancement of parsed-DOCX DraftArtifacts while preserving the current source-first, citation-aware, explicit-review-only workflow.

## Current Non-AI Baseline After 4F

The real DOCX-to-DOCX MVP loop exists:

- DOCX file parsing through `parse_local_docx_file`
- `DocumentExtractionResponse`
- SourceDocument candidate and explicit save/read/list
- SourceCard candidate and explicit save/read/list
- MarketingTag candidate review and approved save
- KnowledgeCard candidate review and approved save
- Draft Input Package Readiness
- DraftArtifact Candidate Preview
- explicit mock/not-final DraftArtifact save
- DraftArtifact citation/evidence/trace review gate
- Export Package Preview
- explicit DOCX MVP export
- manual verification

AI/API integration remains not implemented. Current Writer Studio provider behavior is mock-only and separate from the parsed-DOCX Source Library path.

## Future AI-Assisted Enhancement Use Cases

Future AI may be considered for:

- reorganizing existing draft-only section skeletons
- suggesting clearer academic paragraph transitions
- identifying missing review steps
- flagging citation placeholder risks
- proposing section outline alternatives from saved KnowledgeCards
- improving readability while preserving trace references

These uses must remain enhancement-only and review-gated.

## Strictly Allowed Future AI Role

AI may only operate on saved, reviewed, traceable local data:

- saved parsed-DOCX SourceDocument
- saved parsed-DOCX SourceCard
- approved MarketingTags
- saved KnowledgeCards with chunk references
- saved mock/not-final DraftArtifact
- parsed-DOCX export package/review metadata

AI may assist with draft organization or wording suggestions. It must not become source of truth.

## Strictly Forbidden AI Behavior

AI must not:

- call providers during 4G-0
- generate polished final manuscript prose
- fabricate author, year, publisher, DOI, URL, APA citation, page number, finding, quote, or case
- infer missing citation metadata
- convert placeholders into final APA citations
- treat DOCX page numbers as trusted
- save records automatically
- export automatically
- bypass human review gates
- change provider dependencies or require API keys

## Evidence-Grounded Request Boundary

Future AI requests must be provider-agnostic and assembled only from saved/reviewed objects. Each request should include:

- source identifiers
- DraftArtifact ID
- saved KnowledgeCard IDs
- chunk references such as `docx:pN`
- approved tag labels
- explicit citation placeholder list
- known missing metadata fields
- page-number warning
- instruction that output remains `needs_review`

No raw unsupported claim should enter the request without trace context.

## Evidence-Grounded Response Boundary

Future AI responses must return structured reviewable output, not durable source truth:

- proposed text or outline suggestions
- referenced KnowledgeCard IDs
- referenced chunk refs
- unresolved citation warnings
- unsupported-claim flags
- review status defaulting to `needs_review`

Responses must be rejected or blocked if they omit trace references, invent citations, or imply final manuscript readiness.

## Required Trace/Chunk Reference Policy

Every AI-assisted suggestion must preserve traceability to saved KnowledgeCards or chunk references. DOCX page numbers remain untrusted, so future requests and responses should use chunk references such as `docx:pN` until a page verification workflow exists.

## No-Fabrication Policy

Missing citation metadata must remain missing. AI output must not invent:

- authors
- years
- citation text
- APA references
- page numbers
- empirical findings
- quotes
- case facts

## Citation Metadata Policy

Citation placeholders are not APA-ready. AI may flag them, group them, or suggest that human review is needed. AI must not finalize citation metadata or present placeholders as verified APA citations.

## Human Review Gate Policy

All future AI output must remain draft/needs-review until human approval. Human review is mandatory at SourceCard, MarketingTag, KnowledgeCard, DraftArtifact, export package, and export verification stages.

## Provider-Agnostic Adapter Boundary

Provider role must remain separate from agent role:

- provider adapters expose transport primitives
- agents define task policy and prompt/request assembly
- mappers define deterministic readiness and evidence boundaries
- UI displays review state and never implies provider authority

Future provider contracts should avoid OpenAI/Gemini-specific assumptions in core types.

## Mock Provider Vs Real Provider Distinction

The existing `MockProviderAdapter` is an inert local provider. It can support UI and prompt-shape testing, but it is not evidence validation. Real provider integration must require a later sprint with explicit API-key, safety, logging, and review-boundary decisions.

## Future Provider Readiness Checklist

Before the first real provider call, ATP should require:

- provider-agnostic request/response contracts
- no API keys in source
- mock provider tests
- trace-preservation tests
- citation-placeholder rejection tests
- untrusted DOCX page-number warnings
- explicit human review state
- blocked behavior for missing KnowledgeCard traces
- audit/logging policy
- cost and token-budget policy

## Risks Before First Real Provider Call

Key risks:

- fabricated citation metadata
- unsupported claims presented as academic prose
- loss of chunk references
- treating DOCX page numbers as trusted
- provider-specific DTO drift
- accidental final manuscript implication
- Source Library becoming denser without staged workflow redesign

## Recommended Next Sprint After 4G-0

Recommended next sprint:

- 4G-1: define provider-agnostic AI request/response contracts and mock-provider-only tests for parsed-DOCX DraftArtifact enhancement.

Do not call real OpenAI, Gemini, or any provider until the contract, trace policy, citation guardrails, and human review gate are verified.
