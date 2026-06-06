# Deep Intake Schema Boundary 4R-6

## 1. Executive Decision

Sprint 4R-6 implements no schema.

This document defines the recommended Source-to-Knowledge boundary and schema direction for future Deep Intake. It does not add SQLite tables, migrations, Rust commands, TypeScript runtime behavior, parser behavior, AI/provider behavior, SourceCard creation, or Writer generation.

Future implementation should be split into small gated migrations. The first implementation migration should not attempt to persist every Deep Intake object at once. The safer path is to design, migrate, save, read back, and audit `SourceSection` and `ContentChunk` first, then add candidate previews and persistence for unit records only after the trace and trust model is stable.

## 2. Current State Summary

The current pushed 4R pipeline is boundary and preview work:

- 4R-1: file validation and duplicate guard for intake candidates.
- 4R-2: intake readiness preview.
- 4R-3: document structure preview.
- 4R-4: chunking strategy preview.
- 4R-5: Deep Intake candidate package preview.

These layers help ATP estimate whether a source is safe for future Deep Intake. They do not create `SourceSection`, `ContentChunk`, `KnowledgeUnit`, `EvidenceUnit`, `CaseUnit`, `QuoteUnit`, `TeachingUnit`, `WritingAngle`, or `UsageLedger` records.

Current persistence supports root `SourceDocument` records, extraction runs, extraction segments, evidence traces, intake audit events, SourceCards, KnowledgeCards, DraftArtifacts, metadata review records, and related audit tables. The existing `extraction_segments` and `knowledge_cards` tables are useful historical and MVP structures, but they are not yet the production Deep Intake object model described here.

## 3. Target Conceptual Hierarchy

Future Deep Intake should target this hierarchy:

```text
SourceDocument
-> SourceSection
-> ContentChunk
-> KnowledgeUnit
-> EvidenceUnit
-> CaseUnit
-> QuoteUnit
-> TeachingUnit
-> WritingAngle
```

`ContentChunk` is an explicit bridge between `SourceSection` and unit records. A `SourceSection` can be too large for retrieval, extraction, review, and Writer coverage. Chunks are the operational decomposition layer: they carry reliable trace boundaries, chunk confidence, language metadata, and extraction quality before ATP proposes knowledge units or writing angles.

## 4. Proposed Entities And Responsibilities

### A. SourceDocument

Purpose: represent the root source artifact selected by the user.

Example: `Principles of Service Marketing textbook.pdf`.

Required fields:

- `source_document_id`
- `project_id`
- `title`
- `file_name`
- `file_type`
- `local_path_policy`
- `metadata_status`
- `parser_status`
- `review_status`
- `citation_readiness`
- `created_at`
- `updated_at`

Optional fields:

- `file_size`
- `mime_type`
- `local_path_reference`
- `content_fingerprint`
- `doi`
- `isbn`
- `source_language`
- `language_profile`
- `deep_intake_quality_score`
- `duplicate_status`

Trust state: starts red for unsupported or unsafe files, orange for metadata-only or incomplete review, green only when the root source is validated enough for provisional downstream preview. Green is not citation-ready, APA-final, or publication-ready.

Trace fields: root trace starts with file identity, local path policy, candidate id, optional fingerprint, and extraction run ids.

Review fields: `review_status`, `metadata_status`, `approved_for_intake_at`, `approved_by`, `review_note`, blocker and warning snapshots.

Relationships: parent of `SourceSection`; can be related to `SourceCard` later after bibliographic review, but SourceCard creation remains a separate gate.

Persistence timing: already persisted as a root table. Future migrations may add fields, but should avoid overloading it with section, chunk, or unit data.

### B. SourceSection

Purpose: represent a structural unit detected or reviewed within a source document.

Example: `Chapter 3: Service Quality Measurement` or `บทที่ 2 คุณภาพบริการ`.

Required fields:

- `source_section_id`
- `source_document_id`
- `section_title`
- `section_level`
- `section_order`
- `section_type`
- `trust_state`
- `review_status`
- `created_at`
- `updated_at`

Optional fields:

- `parent_source_section_id`
- `normalized_title`
- `heading_number`
- `section_summary_candidate`
- `language_profile`
- `source_language`
- `detected_by`
- `structure_confidence`
- `section_start_trace`
- `section_end_trace`

Trust state: red when section detection is blocked or unsafe, orange when section is plausible but needs review, green when section boundaries are reliable enough for provisional chunking.

Trace fields: `source_document_id`, `extraction_run_id`, section title, section order, character offsets where available, page range only when trusted, and `trace_label`.

Review fields: reviewer decision, reviewer edited title, reviewer note, review timestamp, structure warnings, and boundary confidence.

Relationships: child of `SourceDocument`; parent of `ContentChunk`; may have nested SourceSections for chapter, heading, and subheading hierarchy.

Persistence timing: should be one of the first Deep Intake tables, but only after a dedicated migration plan. It is the structural anchor for all downstream units.

### C. ContentChunk

Purpose: represent a retrieval and extraction unit within a SourceSection.

Example: a 600 word passage under `1.2 Service-Dominant Logic`, or a Thai paragraph group explaining classroom examples.

Required fields:

- `content_chunk_id`
- `source_document_id`
- `source_section_id`
- `chunk_order`
- `chunk_type`
- `content_text`
- `content_hash`
- `trust_state`
- `review_status`
- `created_at`
- `updated_at`

Optional fields:

- `chunk_title`
- `chunk_summary_candidate`
- `language_profile`
- `source_language`
- `token_count`
- `paragraph_count`
- `chunking_confidence`
- `semantic_tags_json`
- `warnings_json`

Trust state: red when chunk boundaries or source trace are unusable, orange when useful but review is needed, green when trace and text quality are strong enough for provisional unit candidates.

Trace fields: `source_document_id`, `source_section_id`, `extraction_run_id`, `source_location_type`, `paragraph_index`, `character_start`, `character_end`, `docx_chunk_ref`, `page_number`, `page_number_trusted`, and `trace_label`.

Review fields: chunk approval status, reviewer split/merge decisions, reviewer note, extraction warning snapshots, and read-back verification status.

Relationships: child of `SourceSection`; parent or source anchor for `KnowledgeUnit`, `EvidenceUnit`, `CaseUnit`, `QuoteUnit`, `TeachingUnit`, and `WritingAngle`.

Persistence timing: should be persisted early with SourceSection because it is the practical bridge between source structure and future knowledge units. Do not persist unit records before chunk trace quality is stable.

### D. KnowledgeUnit

Purpose: represent a distilled concept, claim, framework, definition, or insight extracted from one or more chunks.

Example: `Service quality is evaluated by comparing expected and perceived service performance.`

Required fields:

- `knowledge_unit_id`
- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `unit_type`
- `title`
- `canonical_statement`
- `trust_state`
- `review_status`
- `created_at`
- `updated_at`

Optional fields:

- `plain_language_summary`
- `thai_summary_candidate`
- `concept_tags_json`
- `framework_name`
- `claim_strength`
- `source_language`
- `output_language`
- `translation_status`
- `related_unit_ids_json`

Trust state: red when unsupported or ambiguous, orange when plausible but review is needed, green when trace, extraction, and review are strong enough for provisional retrieval and Writer use.

Trace fields: link to source document, section, chunk, extraction run, trace label, character offsets, page number only if trusted, and supporting evidence unit ids.

Review fields: reviewer approval, reviewer edits, confidence score, blocker/warning snapshots, and human verification timestamp.

Relationships: child of `ContentChunk`; may be supported by EvidenceUnits, illustrated by CaseUnits, quoted by QuoteUnits, adapted into TeachingUnits, and consumed by WritingAngles.

Persistence timing: should not be persisted in the first Deep Intake migration. Start with candidate preview from chunks, then add persistence after review and trace rules are proven.

### E. EvidenceUnit

Purpose: represent a specific support item for a claim or KnowledgeUnit.

Example: a study finding, statistic, measurement result, definition, or cited proposition in the source.

Required fields:

- `evidence_unit_id`
- `knowledge_unit_id`
- `source_document_id`
- `content_chunk_id`
- `evidence_text`
- `evidence_type`
- `trust_state`
- `review_status`
- `created_at`
- `updated_at`

Optional fields:

- `statistic_value`
- `method_context`
- `sample_context`
- `evidence_strength`
- `citation_context`
- `language_profile`
- `limitations`

Trust state: red for unsupported or unverifiable evidence, orange for useful evidence requiring review, green when source trace and content boundaries are reliable.

Trace fields: source document, section, chunk, character offsets, paragraph index, page number if trusted, extraction run id, and trace label.

Review fields: evidence verification status, reviewer note, confidence, limitation note, and warning snapshots.

Relationships: usually child of `KnowledgeUnit` and `ContentChunk`; may support multiple Writer sections later, but reuse should go through a ledger.

Persistence timing: persist after KnowledgeUnit candidate preview proves stable. Evidence trace quality should be stricter than general concept extraction.

### F. CaseUnit

Purpose: represent a case, example, scenario, company example, classroom example, or applied illustration.

Example: a retail service recovery case described in a textbook chapter.

Required fields:

- `case_unit_id`
- `source_document_id`
- `content_chunk_id`
- `case_title`
- `case_summary`
- `case_type`
- `trust_state`
- `review_status`
- `created_at`
- `updated_at`

Optional fields:

- `organization_name`
- `industry`
- `country_or_region`
- `teaching_use`
- `thai_adaptation_candidate`
- `sensitivity_warning`
- `related_knowledge_unit_ids_json`

Trust state: red when the case cannot be verified or risks fabrication, orange when it is useful but requires review, green when the case is clearly source-grounded and reviewed enough for provisional reuse.

Trace fields: source document, section, chunk, source passage offsets, page number if trusted, extraction run id, and trace label.

Review fields: case verification, reviewer note, adaptation approval, warning flags, and reuse sensitivity.

Relationships: child of ContentChunk; may illustrate one or more KnowledgeUnits and feed TeachingUnits or WritingAngles.

Persistence timing: do not persist early. Case boundaries, sensitivity, and reuse rules need candidate preview first.

### G. QuoteUnit

Purpose: represent an exact quote from the source.

Example: a short definition quoted from an academic source.

Required fields:

- `quote_unit_id`
- `source_document_id`
- `content_chunk_id`
- `quote_text`
- `quote_context`
- `trust_state`
- `review_status`
- `created_at`
- `updated_at`

Optional fields:

- `speaker_or_author`
- `quote_type`
- `translation_candidate`
- `translation_status`
- `quote_length`
- `copyright_or_fair_use_warning`

Trust state: red when exact wording or trace is unreliable, orange when exactness or context needs review, green when exact text, source trace, and review are reliable enough for provisional use.

Trace fields: exact character offsets are strongly recommended; page number only if trusted; trace label, paragraph index, source section, chunk, and extraction run id are required.

Review fields: exactness verification, quote context review, translation review, and usage approval.

Relationships: child of ContentChunk; may support KnowledgeUnits, EvidenceUnits, or Writer outputs.

Persistence timing: should be delayed until exact text trace is reliable. QuoteUnit has higher risk than general KnowledgeUnit.

### H. TeachingUnit

Purpose: represent a teaching explanation, classroom example, activity idea, discussion prompt, or Thai plain-language adaptation derived from source-grounded material.

Example: a Thai classroom prompt explaining service recovery using a source-backed case.

Required fields:

- `teaching_unit_id`
- `source_document_id`
- `content_chunk_id`
- `teaching_title`
- `teaching_content`
- `teaching_unit_type`
- `trust_state`
- `review_status`
- `created_at`
- `updated_at`

Optional fields:

- `target_audience`
- `output_language`
- `thai_adaptation_status`
- `plain_language_level`
- `activity_duration`
- `related_case_unit_ids_json`
- `related_knowledge_unit_ids_json`

Trust state: red when source grounding or translation is unsafe, orange when pedagogically useful but needs review, green when source trace and adaptation quality are reliable enough for provisional teaching output.

Trace fields: source document, chunk, related unit ids, source passage trace, language adaptation trace, and extraction run id.

Review fields: teaching review, Thai adaptation review, audience fit review, and reviewer note.

Relationships: derived from chunks and often linked to KnowledgeUnits, CaseUnits, and WritingAngles.

Persistence timing: delay until KnowledgeUnit/CaseUnit relationships are stable. TeachingUnit may be previewed before persistence.

### I. WritingAngle

Purpose: represent a possible use of source material in a draft, chapter, article, visual script, or teaching note.

Example: `Use service recovery as a chapter-opening example for customer experience design.`

Required fields:

- `writing_angle_id`
- `source_document_id`
- `content_chunk_id`
- `angle_title`
- `angle_summary`
- `output_mode`
- `trust_state`
- `review_status`
- `created_at`
- `updated_at`

Optional fields:

- `target_section_type`
- `audience`
- `language_profile`
- `thai_output_candidate`
- `coverage_role`
- `related_unit_ids_json`
- `reuse_sensitivity`

Trust state: red when unsupported or misleading, orange when useful but review is needed, green when trace and fit are strong enough for provisional Writer planning.

Trace fields: source document, chunk, related unit ids, trace label, extraction run id, and usage ledger links after use.

Review fields: reviewer approval, output mode fit, coverage note, reuse decision, and warning snapshots.

Relationships: child or derivative of ContentChunk and related unit records; consumed by Writer planning, DraftSections, and exports.

Persistence timing: start as preview. Persist after Writer retrieval and usage ledger design are clearer.

### J. UsageLedger / RepeatReuseLedger

Purpose: track use and reuse of source-grounded records across projects, chapters, draft sections, and exports.

Example: a CaseUnit used centrally in Chapter 1 and reused as a minor callback in Chapter 4.

Required fields:

- `usage_ledger_id`
- `project_id`
- `source_record_type`
- `source_record_id`
- `target_artifact_type`
- `target_artifact_id`
- `usage_strength`
- `reuse_status`
- `created_at`
- `updated_at`

Optional fields:

- `chapter_id`
- `draft_section_id`
- `output_mode`
- `user_decision_note`
- `reuse_warning`
- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `exported_output_id`

Trust state: ledger records should not decide truth by themselves, but they can lower Writer recommendation trust when reuse is excessive or unresolved.

Trace fields: source record id, source document/section/chunk, draft target, export target, and usage event trace.

Review fields: user decision, accepted reuse, intentional anchor, replacement requested, and reviewer note.

Relationships: links unit records to DraftSections, DraftArtifacts, and ExportedOutput records.

Persistence timing: design early, implement after SourceSection/ContentChunk and initial unit candidate previews. It is required for book/textbook mode and lighter for standalone articles.

## 5. Field Design Guidance

Future record types should use field categories rather than rushed migration SQL:

- Identity fields: stable IDs, deterministic candidate IDs where appropriate, created/updated timestamps, schema version.
- Parent linkage: `source_document_id`, `source_section_id`, `content_chunk_id`, related unit ids, project id.
- Source trace fields: source location type, page number, page trust, section title, paragraph index, character offsets, DOCX chunk reference, extraction run id, trace label.
- Content fields: title, canonical statement, source text, normalized text, summaries, quote text, case summary, teaching content, writing angle summary.
- Language fields: language profile, source language, output language, translation flags, Thai adaptation status, mixed-language warnings.
- Trust and review fields: trust state, review status, reviewer decision, reviewer note, blocker and warning snapshots, confidence.
- Extraction metadata: parser name/version, extraction run id, extraction confidence, structure confidence, chunking confidence, text hashes, duplicate risk.
- Semantic tags: concepts, frameworks, methods, industries, teaching roles, output modes, source type tags.
- Usage/reuse metadata: usage strength, reuse status, chapter linkage, target draft/export ids, intentional anchor flag.
- Audit/read-back fields: command name, result status, read-back verification, audit event ids, snapshot JSON, created from candidate id.

## 6. Source Trace Model

Every future record should trace back to source. Recommended trace fields:

- `source_document_id`
- `source_section_id`
- `content_chunk_id`
- `source_location_type`
- `page_number`
- `page_number_trusted`
- `section_title`
- `paragraph_index`
- `character_start`
- `character_end`
- `docx_chunk_ref`
- `extraction_run_id`
- `trace_label`

Rules:

- Do not fabricate page numbers.
- DOCX page numbers are untrusted unless produced by a reliable pagination engine.
- PDF page numbers may be possible later only after actual extraction.
- Character offsets are valuable when extraction text is stable, but should not be invented.
- Trace quality should directly affect trust state.
- Missing or weak trace can still allow preview, but should usually keep downstream records orange or red.

## 7. Trust-State Propagation

Trust states should eventually apply to:

- `SourceDocument`
- `SourceSection`
- `ContentChunk`
- `KnowledgeUnit`
- `EvidenceUnit`
- `CaseUnit`
- `QuoteUnit`
- `TeachingUnit`
- `WritingAngle`
- `DraftSection`
- `DraftArtifact`
- `ExportedOutput`

State definitions:

- Red: blocked, unsafe, unsupported, duplicate-blocked, trace-unusable, or not usable for automation.
- Orange: usable for preview or limited workflow, but review is required before final use.
- Green: trusted enough for provisional automation with audit and reversibility.

State transitions:

- Red to orange: blockers are resolved or the source becomes usable enough for review.
- Orange to green: human review, reliable trace, and sufficient extraction quality confirm provisional use.
- Green to orange: downstream ambiguity, weak trace, translation sensitivity, reuse risk, or stale citation evidence appears.
- Any state to red: duplicate, unsupported file, unsafe citation state, fabricated page evidence, failed read-back, or unresolved blocker appears.

Final citation-ready, APA-final, and publication-ready states require stricter gates and must not be inferred silently from green Deep Intake trust.

## 8. Thai-First And Multilingual Fields

Thai language support is a first-class schema concern, not a later localization layer. Future Deep Intake objects should plan for:

- `language_profile`: `thai | english | mixed | unknown`
- `source_language`
- `output_language`
- `translation_needed`
- `translation_status`
- `adaptation_status`
- `thai_segmentation_quality`
- `mixed_language_warning`
- `generated_thai_summary_candidate`
- `human_review_required`

These fields should support Thai academic sources, mixed Thai-English documents, Thai teaching examples, English-to-Thai adaptation, Thai plain-language writing, and DOCX/PDF/HTML output quality. They should not be implemented in 4R-6.

## 9. Deep Intake Quality Score Relationship

Deep Intake quality should accumulate from SourceDocument, SourceSection, and ContentChunk readiness into a score that tells Writer whether enough reliable material exists.

Suggested inputs:

- `extraction_coverage`: how much usable text was extracted from the source.
- `structure_coverage`: how much of the source has reliable SourceSection boundaries.
- `chunking_confidence`: how reliable ContentChunk boundaries are.
- `knowledge_unit_density`: how many useful unit candidates appear per chunk or section.
- `evidence_trace_coverage`: how many claims have reliable trace fields.
- `language_quality`: source language and Thai/mixed-language handling quality.
- `duplicate_risk`: duplicate or near-duplicate warnings.
- `blocker_count`: unresolved red blockers.
- `review_need_level`: how much human review is needed before automation.
- `writer_readiness`: whether Writer can safely use this source for retrieval and coverage.

The score should not imply citation-ready, APA-final, or publication-ready output.

## 10. Repeat/Reuse Tracking Design

`UsageLedger` or `RepeatReuseLedger` should support:

- Book and textbook projects.
- Chapter-level tracking.
- Section-level tracking.
- Concept, case, example, statistic, framework, claim, quote, and teaching angle reuse.
- Usage strength: `minor | moderate | central`.
- Reuse status: `new | acceptable_reuse | intentional_anchor | repeated_too_heavily | should_replace`.
- User decision note.
- Source record trace.

For book/textbook mode, repeat tracking is required because repeated examples, frameworks, cases, and statistics weaken chapter differentiation. ATP should warn when reuse is excessive, acceptable, or intentionally anchored. For standalone journal articles, research articles, and plain articles, repeat tracking can be lighter because the output is self-contained.

## 11. Retrieval And Writer Implications

Future Writer retrieval should support lookup:

- By topic.
- By concept.
- By source.
- By section.
- By trust state.
- By language.
- By output mode.
- By unused or repeated status.
- By case/example availability.

Writer should use the Deep Intake object model to assemble coverage, identify weak evidence, map claims to sources, avoid excessive repetition, and ask for more input when coverage is weak. It should not silently fabricate missing evidence or promote source material to citation-ready, APA-final, or publication-ready status.

## 12. Proposed Phased Implementation Plan

Recommended future sprints:

- 4R-7: Schema risk review and migration plan.
- 4R-8: SourceSection and ContentChunk schema MVP.
- 4R-9: SourceSection/ContentChunk save, read-back, and audit MVP.
- 4R-10: KnowledgeUnit candidate preview from chunks.
- 4R-11: EvidenceUnit, CaseUnit, and QuoteUnit candidate preview.
- 4R-12: TeachingUnit and WritingAngle candidate preview.
- 4R-13: UsageLedger / RepeatReuseLedger design and MVP.
- 4R-14: Deep Intake Quality Score MVP.

## 13. Explicit Non-Goals

4R-6 does not implement:

- SQLite schema.
- SQLite migrations.
- Parser behavior.
- AI extraction.
- PDF extraction or OCR.
- KnowledgeUnit persistence.
- SourceSection persistence.
- ContentChunk persistence.
- UsageLedger persistence.
- SourceCard auto-creation.
- Citation-ready inference.
- APA-final inference.
- Writer generation.
- Runtime UI changes.
- Image processing.

## 14. Implementation Recommendation

Do not implement all entities at once.

Start with `SourceSection` and `ContentChunk` only. Then build candidate previews for unit records. Add persistence after trace quality, trust propagation, and review states are proven. Add UsageLedger after Writer retrieval needs are better understood.

Keep migrations small, reversible, and separately verified. Every new persistence step should include server-side validation, explicit human approval where needed, audit event writing, read-back verification, and tests proving no SourceCard, citation-ready, APA-final, or Writer-final behavior is inferred silently.
