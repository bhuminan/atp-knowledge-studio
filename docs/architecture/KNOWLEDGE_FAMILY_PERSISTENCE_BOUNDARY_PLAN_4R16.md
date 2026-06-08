# Knowledge Family Persistence Boundary Plan 4R-16

## 1. Purpose

Sprint 4R-16 is a no-runtime architecture checkpoint for future persistence of Deep Intake knowledge candidate families:

- `KnowledgeUnit`
- `EvidenceUnit`
- `CaseUnit`
- `QuoteUnit`
- `TeachingUnit`
- `WritingAngle`

This sprint does not add schema, migrations, commands, UI, parser behavior, AI/provider behavior, or save behavior. It defines the boundary that must exist before preview candidates can become persistent knowledge records.

ATP is a trusted semi-autopilot knowledge and writing studio. The system should do roughly 60-70% of structuring work while the user screens, approves, requests extra input, edits, and performs final review. ATP must not fabricate citations, evidence, metadata, examples, or academic claims. Every saved record must remain source-grounded, traceable, auditable, reversible, and trust-status aware. Thai language is first-class, not a later localization layer.

## 2. Current State Summary

The current 4R pipeline has the following persistence boundary:

- `SourceDocument` can already exist as the persisted root record.
- `SourceSection` and `ContentChunk` have schema, migration, save, read, and list command boundaries from earlier 4R work.
- The Source Library can manually save SourceSection and ContentChunk candidates only after explicit approval and read-back verification.
- `KnowledgeUnit`, `EvidenceUnit`, `CaseUnit`, `QuoteUnit`, `TeachingUnit`, and `WritingAngle` are currently preview-only candidate families.
- 4R-12 through 4R-14 created deterministic no-AI previews for those downstream families.
- 4R-15 created a Deep Intake Candidate Family Summary and Save Readiness Gate, but it remains preview/readiness only.

The current preview stack should not be treated as proof that a candidate is true, citation-ready, APA-final, Writer-ready, or publication-ready. It only indicates that source-grounded candidate material may be available for human review.

## 3. Candidate-To-Persistent Boundary

Every future unit save must cross a deliberate candidate-to-persistent boundary. A candidate may become a saved record only when it has source trace, parent linkage, human approval, trust status, warning/blocker review, and audit intent.

### KnowledgeUnit

Required source trace:

- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- chunk trace label
- source text span or trace JSON where available
- page number only when explicitly trusted

Required parent relationship:

- child of `ContentChunk`
- optionally related to supporting EvidenceUnits after those records exist

Required human approval state:

- reviewer must approve or edit the candidate statement
- reviewer must confirm that the unit is a source-grounded concept, definition, framework, theme, or claim

Required trust status:

- cannot be green unless source, section, chunk, trace, and review are clean
- starts orange when plausible but not reviewed
- red when missing trace, unsupported, ambiguous, or blocked

Required warnings/blockers:

- missing trace blocks save
- red ContentChunk blocks save
- unsupported source blocks save
- weak Thai/mixed segmentation should require review before save
- page-number uncertainty must remain visible

Batch approval:

- possible only for low-risk theme/definition candidates with green chunk trace, no blockers, and a reviewer-confirmed package summary

One-by-one review:

- required for claims, framework naming, translated/adapted statements, ambiguous Thai segmentation, or any unit that may be used in Writer output

### EvidenceUnit

Required source trace:

- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- exact source text or short evidence excerpt
- trace label
- page number only when trusted

Required parent relationship:

- child of `ContentChunk`
- optionally linked to one or more KnowledgeUnits after those records exist

Required human approval state:

- reviewer must confirm the evidence type and that the evidence does not overstate the source
- reviewer must confirm any numeric value, statistic, sample size, finding, or study cue

Required trust status:

- red for unverified statistics, missing trace, unsupported source, or unclear evidence scope
- orange for plausible extracted evidence needing review
- green only after source trace and reviewer verification

Required warnings/blockers:

- fabricated or transformed statistics are blocked
- missing source span is blocked
- evidence without a clear claim relationship stays needs_review
- PDF metadata-only candidates cannot save

Batch approval:

- limited; possible for repeated low-risk evidence cues only when the source trace is exact and the reviewer approves the batch

One-by-one review:

- required for statistics, study findings, percentages, causal claims, research results, or anything likely to support academic writing

### CaseUnit

Required source trace:

- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- trace label
- exact source span or trace JSON

Required parent relationship:

- child of `ContentChunk`
- optionally linked to KnowledgeUnits or WritingAngles after those records exist

Required human approval state:

- reviewer must verify that the case/example exists in the source text
- reviewer must confirm that company, brand, customer, and context labels are not invented

Required trust status:

- red when the entity name is unclear, external verification is missing where needed, or the source trace is weak
- orange when the case is source-grounded but needs review
- green only after trace and case identity are confirmed

Required warnings/blockers:

- invented case names are blocked
- known brand/company examples must not be generalized beyond the source
- Thai examples and translated company names should preserve original text

Batch approval:

- possible for simple example markers with strong trace and reviewer-confirmed package context

One-by-one review:

- required for named companies, real brands, sensitive examples, case-study claims, or examples intended for teaching or Writer output

### QuoteUnit

Required source trace:

- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- exact quoted text
- trace label
- source span and page trust flag where available

Required parent relationship:

- child of `ContentChunk`
- optionally linked to KnowledgeUnits or EvidenceUnits after those records exist

Required human approval state:

- reviewer must confirm exact quote text, quote boundaries, language, and use case
- reviewer must confirm the quote is short enough and appropriate for the future output context

Required trust status:

- red for missing exact text, missing trace, long copyrighted excerpt risk, or uncertain source boundary
- orange for exact but unreviewed quote candidates
- green only after exactness and trace are verified

Required warnings/blockers:

- paraphrased text cannot be saved as a quote
- long excerpts should be blocked or require special review
- translated quote candidates must preserve original text separately from translation/adaptation

Batch approval:

- generally unsafe except for very short, exact, low-risk definition snippets with strong trace

One-by-one review:

- required for nearly all QuoteUnits

### TeachingUnit

Required source trace:

- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- trace label
- source excerpt or chunk reference

Required parent relationship:

- child of `ContentChunk`
- may reference CaseUnits, EvidenceUnits, or KnowledgeUnits after those records exist

Required human approval state:

- reviewer must confirm that teaching usefulness is grounded in existing source material
- reviewer must approve any classroom framing, example label, or activity intent

Required trust status:

- red when teaching activity text is invented or source trace is missing
- orange when a source-grounded teaching cue exists but needs instructional review
- green only after reviewer confirmation

Required warnings/blockers:

- generated lesson plans are out of scope for persistence here
- Thai classroom examples must preserve original Thai text where present
- mixed Thai-English teaching terms should be explicitly labeled

Batch approval:

- possible for low-risk teaching cues such as "example available" or "discussion cue" when trace is strong

One-by-one review:

- required for classroom activities, discussion prompts, teaching adaptations, or learner-facing wording

### WritingAngle

Required source trace:

- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- trace label
- source excerpt or chunk reference
- linked candidate signals where applicable

Required parent relationship:

- child of `ContentChunk`
- may later reference KnowledgeUnits, EvidenceUnits, CaseUnits, or TeachingUnits

Required human approval state:

- reviewer must confirm that the angle is an allowable interpretation of the source
- reviewer must approve any article, chapter, managerial, strategic, or research framing

Required trust status:

- red when the angle invents an implication, research gap, managerial claim, or future direction
- orange when the angle is plausible but not reviewed
- green only after trace and reviewer approval

Required warnings/blockers:

- no invented implications
- no invented research gaps
- no citation-ready or APA-final status
- Thai academic/plain-language adaptation must be reviewed

Batch approval:

- limited; possible for simple "possible writing angle" tags when they are source-grounded and not used directly in output

One-by-one review:

- required for any angle intended for Writer, chapter planning, article argument, or export

## 4. Minimum Persistent Fields Proposal

The future schema should start conservative. It should store durable record identity, parent links, source trace, review/trust state, and audit/revision linkage. It should not persist UI display copy, mapper-only summary wording, or speculative AI output.

### knowledge_units

- `id`
- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `candidate_family`
- `unit_type`
- `title`
- `body`
- `source_trace_json`
- `trust_status`
- `review_status`
- `approval_status`
- `language_profile`
- `warnings_json`
- `blockers_json`
- `created_at`
- `updated_at`
- `audit_event_id`
- `revision_parent_id`

### evidence_units

- `id`
- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `candidate_family`
- `evidence_type`
- `label`
- `body`
- `source_trace_json`
- `trust_status`
- `review_status`
- `approval_status`
- `language_profile`
- `warnings_json`
- `blockers_json`
- `created_at`
- `updated_at`
- `audit_event_id`
- `revision_parent_id`

### case_units

- `id`
- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `candidate_family`
- `case_type`
- `label`
- `body`
- `source_trace_json`
- `trust_status`
- `review_status`
- `approval_status`
- `language_profile`
- `warnings_json`
- `blockers_json`
- `created_at`
- `updated_at`
- `audit_event_id`
- `revision_parent_id`

### quote_units

- `id`
- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `candidate_family`
- `quote_type`
- `label`
- `body`
- `source_trace_json`
- `original_text`
- `translated_text`
- `translation_status`
- `trust_status`
- `review_status`
- `approval_status`
- `language_profile`
- `warnings_json`
- `blockers_json`
- `created_at`
- `updated_at`
- `audit_event_id`
- `revision_parent_id`

### teaching_units

- `id`
- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `candidate_family`
- `teaching_type`
- `label`
- `body`
- `source_trace_json`
- `trust_status`
- `review_status`
- `approval_status`
- `language_profile`
- `warnings_json`
- `blockers_json`
- `created_at`
- `updated_at`
- `audit_event_id`
- `revision_parent_id`

### writing_angles

- `id`
- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `candidate_family`
- `angle_type`
- `label`
- `body`
- `source_trace_json`
- `trust_status`
- `review_status`
- `approval_status`
- `language_profile`
- `warnings_json`
- `blockers_json`
- `created_at`
- `updated_at`
- `audit_event_id`
- `revision_parent_id`

## 5. Trust And Review Statuses

Future persistence should separate candidate state, review state, trust state, and output readiness.

Proposed statuses:

- `preview_only`: visible in preview but not saved.
- `needs_review`: usable candidate or saved record that requires human screening.
- `approved`: human approved the record for the current boundary.
- `rejected`: human rejected the candidate or saved record.
- `saved_unverified`: persisted but not fully read-back verified or not fully reviewed.
- `saved_verified`: persisted and read-back verified, but not citation-ready or APA-final.
- `blocked`: cannot be saved or used due to trace, trust, duplicate, unsupported source, or review blockers.
- `superseded`: replaced by a newer reviewed record while preserving history.

These statuses must not imply:

- citation-ready
- APA-final
- Writer-final
- export-ready
- academic truth verification
- external fact verification

Trust indicators may still map to the existing green/orange/red visual language where UI indicators are needed, but this document does not redesign UI.

## 6. Audit And Reversibility Model

Every candidate-to-persistent transition should be auditable. The system should support package-level audit events plus record-level details when needed for diagnosis.

Events to audit:

- candidate generated
- user approved
- user edited
- user rejected
- saved
- save read-back verified
- save read-back failed
- superseded
- deleted or archived
- regenerated from source

Saved records should remain reversible:

- never hard-delete by default from normal review flows
- use archive or supersede state for user-facing removal
- preserve previous text, trust status, trace, review status, and reviewer notes through revision linkage
- record the source preview package or candidate id used to create the saved record
- allow regeneration from SourceDocument, SourceSection, and ContentChunk without silently overwriting approved records

Future deletes must be a separate destructive boundary, especially because one source may later contain hundreds or thousands of derived records.

## 7. Batch Review Model

ATP should preserve the semi-autopilot doctrine:

```text
Grouped summary first, then one-by-one or batch review as appropriate.
```

Safe batch review candidates:

- low-risk KnowledgeUnit themes or definitions with strong trace
- simple TeachingUnit cue labels that do not create classroom activities
- simple WritingAngle tags that are not used directly in Writer output
- repeated low-risk CaseUnit example markers without named real-world claims

Unsafe or one-by-one review candidates:

- EvidenceUnits with statistics, findings, sample sizes, percentages, or research results
- QuoteUnits, especially exact quotes and translated quotes
- CaseUnits involving named companies, brands, customers, sensitive examples, or external claims
- WritingAngles that create managerial implications, research gaps, strategic arguments, or chapter/article framing
- TeachingUnits that create classroom activities, discussion prompts, or learner-facing wording
- any candidate with Thai segmentation uncertainty, mixed-language ambiguity, missing trace, red trust, or page-number uncertainty

Batch review must still record explicit human approval. It must not run as auto-save.

## 8. Thai Language Requirements

Thai language is first-class for future persistence.

Future saved records must support:

- Thai source text without forcing English tokenization assumptions
- mixed Thai-English source text and terminology
- Thai academic writing use cases
- Thai plain-language writing use cases
- Thai classroom and teaching examples
- English-to-Thai translation/adaptation review
- preservation of original Thai text
- preservation of original English technical terms where the user wants Thai writing with English terms in parentheses
- segmentation warnings when Thai headings, paragraphs, or sentence boundaries are uncertain
- language profile and mixed-language markers on every saved downstream unit

QuoteUnits and EvidenceUnits must preserve original text separately from translation or adaptation. WritingAngles and TeachingUnits must not invent Thai phrasing as if it came from the source.

## 9. Explicit Non-Goals

Sprint 4R-16 does not implement:

- migrations
- schema changes
- Rust/backend commands
- UI changes
- persistence
- AI/provider behavior
- parser expansion
- PDF extraction
- OCR
- SourceCard creation
- citation-ready inference
- APA-final inference
- Writer/export behavior
- auto-save
- UI redesign
- image processing

It also does not change existing SourceDocument, SourceSection, ContentChunk, SourceCard, KnowledgeCard, metadata review, DraftArtifact, or Writer behavior.

## 10. Next Recommended Sprint

Next recommended sprint:

```text
4R-17 KnowledgeUnit Persistence Schema MVP
```

This is the safest first downstream persistence slice because KnowledgeUnit is the parent conceptual unit for later evidence, case, quote, teaching, and writing-angle relationships. 4R-17 should add schema only or a very narrow schema-plus-test MVP for `knowledge_units`, linked to existing `source_documents`, `source_sections`, and `content_chunks`.

4R-17 should not persist EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, or WritingAngle yet. Those families should follow only after KnowledgeUnit trace, review, trust status, audit, and reversibility rules are proven.
