# Parsed DOCX MarketingTag Candidates 4E-6

## Scope

Sprint 4E-6 creates reviewable MarketingTag candidates from an explicitly saved parsed-DOCX SourceCard and its linked parsed-DOCX SourceDocument signals.

## Saved SourceCard To MarketingTag Mapping

The mapper is `src/lib/sources/ParsedDocxMarketingTagCandidateMapper.ts`.

Inputs:

- Saved parsed-DOCX SourceCard detail.
- Linked saved parsed-DOCX SourceDocument detail when available.
- Existing extraction text, segments, and traces already present in Source Library state.
- Controlled marketing taxonomy seed.

Output:

- Reviewable MarketingTag save candidates.
- Readiness summary.
- Warnings and blockers.

## Controlled Taxonomy-Only Rule

The mapper only matches terms from `marketingTaxonomySeed`. It does not invent new taxonomy terms, free tags, or AI-generated labels.

Core taxonomy matches and extended taxonomy matches are counted separately. Every generated candidate starts as `needs_review`.

## No AI/API Generation Rule

The flow uses deterministic local text matching against existing taxonomy labels and aliases. It does not call AI providers, external APIs, OCR, PDF parsers, or any enrichment service.

## Explicit Review/Save Boundary

MarketingTags are never auto-saved.

The Source Library panel shows candidates after a parsed-DOCX SourceCard has been explicitly saved and read back. The user must approve candidates in the panel. The existing MarketingTag save command receives only user-approved candidates.

Save is blocked when:

- No saved SourceCard link exists.
- No controlled taxonomy candidates exist.
- No user-approved candidate exists.

## No Downstream KnowledgeCard Generation

Saving parsed-DOCX MarketingTags does not automatically trigger KnowledgeCard generation, DraftArtifact generation, DOCX export, Obsidian export, or final manuscript persistence.

## Provenance And Page-Number Policy

Candidate provenance records the saved SourceCard ID, linked saved SourceDocument ID when available, trace count, and controlled taxonomy source. DOCX page numbers remain untrusted; provenance relies on saved SourceDocument linkage and chunk-reference evidence only.

## Next Recommended Sprint

Sprint 4E-7 should connect approved parsed-DOCX MarketingTags to reviewable KnowledgeCard candidates without auto-saving or generating downstream drafts.
