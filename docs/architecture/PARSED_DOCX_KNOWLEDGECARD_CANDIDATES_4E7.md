# Parsed DOCX KnowledgeCard Candidates 4E-7

## Scope

Sprint 4E-7 creates reviewable KnowledgeCard candidates from explicitly saved parsed-DOCX sources. The flow stays inside Source Library and does not auto-save KnowledgeCards.

## Mapping Inputs

The mapper is `src/lib/sources/ParsedDocxKnowledgeCardCandidateMapper.ts`.

Inputs:

- Saved parsed-DOCX SourceDocument detail.
- Saved parsed-DOCX SourceCard detail.
- Parsed extraction segments and traces when available.
- Approved parsed-DOCX MarketingTags.

## Candidate Mapping

The mapper creates deterministic candidates only when traceable evidence exists:

- ConceptCard from the first traceable segment and approved tag label.
- EvidenceCard from a traceable evidence segment, or first traceable segment.
- QuoteCard only from an exact traceable text snippet.
- CaseCard only when a case-like segment or organization/case signal is present.
- WritingAngleCard only when approved tags and traceable segment evidence exist.

Every candidate includes:

- Saved SourceDocument ID.
- Saved SourceCard ID.
- At least one DOCX chunk reference.
- `needs_review` status by default.

## No-AI And No-Fabrication Rule

The mapper performs deterministic local selection only. It does not call AI/API services and does not fabricate concepts, findings, quotes, cases, APA citations, or page numbers.

If signals are weak or untraceable, fewer candidates are produced and warnings are shown.

## Trace Requirement

Every generated candidate must have a chunk reference. Candidates without traceable chunk evidence are omitted. Save is blocked if no approved, traceable candidates exist.

## Page-Number Policy

DOCX page numbers remain untrusted. Candidate trace references store chunk references and mark page numbers as untrusted.

## Explicit Review/Save Boundary

KnowledgeCards are never auto-saved. The user must approve candidate cards in the “Parsed DOCX KnowledgeCard Candidates” panel. The existing KnowledgeCard save command receives only approved parsed-DOCX candidates.

Save is blocked when:

- No saved SourceCard link exists.
- No approved parsed-DOCX MarketingTags exist.
- No candidate has a chunk reference.
- No candidate has been approved.

## No DraftArtifact Auto-Generation

Saving parsed-DOCX KnowledgeCards does not automatically trigger DraftArtifact generation, DOCX export, Obsidian export, or final manuscript persistence. Those remain separate explicit actions.

## Remaining Limitations

The mapper is conservative and deterministic. It does not perform semantic extraction, citation validation, or bibliographic completion.

## Next Recommended Sprint

Sprint 4E-8 should harden parsed-DOCX KnowledgeCard save/read/list verification and keep DraftArtifact generation gated behind an explicit user action.
