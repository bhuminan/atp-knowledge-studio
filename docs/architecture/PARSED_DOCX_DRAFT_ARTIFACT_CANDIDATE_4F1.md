# Parsed DOCX DraftArtifact Candidate Preview 4F-1

Sprint 4F-1 adds a preview-only DraftArtifact candidate contract for the parsed-DOCX pipeline. It prepares a future save boundary, but it does not save DraftArtifact records.

## Purpose

The candidate preview converts a parsed-DOCX Draft Input Package readiness result into deterministic section skeletons. The preview helps users inspect how saved parsed-DOCX KnowledgeCards, approved MarketingTags, and trace references could be organized before any later DraftArtifact save sprint.

## Input Dependencies

The pure mapper `ParsedDocxDraftArtifactCandidateMapper` receives:

- parsed-DOCX Draft Input Package readiness result
- saved parsed-DOCX SourceDocument detail
- saved parsed-DOCX SourceCard detail
- approved parsed-DOCX MarketingTag links
- saved parsed-DOCX KnowledgeCard list records
- optional saved KnowledgeCard detail for trace refs

The mapper reads in-memory TypeScript data only. It does not invoke Tauri commands and does not write to SQLite.

## Section Candidate Rules

The mapper creates section skeleton candidates only. Suggested groupings are:

- Concept overview
- Evidence and findings
- Case/application notes
- Teaching or managerial implications
- Writing angles

Rules:

- use KnowledgeCard type and approved tags to group content
- do not generate polished academic prose
- do not create final manuscript sections
- every section candidate must link to at least one KnowledgeCard or trace
- DOCX page numbers remain untrusted
- citation placeholders remain placeholders
- candidate remains mock/not-final/needs-review

## No DraftArtifact Save Rule

The Source Library panel shows:

> Preview only — DraftArtifact is not saved and prose is not final.

No parsed-DOCX DraftArtifact save action is exposed. The existing persistence commands are not called by this preview.

## No AI And No Prose Generation

4F-1 does not call AI/API providers. It does not write polished academic paragraphs, fabricate evidence, invent citations, or infer unsupported claims. Skeleton notes are deterministic labels that describe organization only.

## Citation And Page-Number Limitations

Citation placeholders are not APA-ready. Human citation review remains required.

DOCX page numbers remain untrusted. Evidence anchoring uses chunk references only.

## Next Recommended Sprint

The next sprint should harden the parsed-DOCX DraftArtifact candidate review gate before any save boundary. It should continue to avoid AI/API, DraftArtifact persistence, DOCX export changes, PDF/OCR, database migrations, and final manuscript generation unless explicitly authorized.
