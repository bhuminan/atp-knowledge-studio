# ATP Current Database Schema 4P-11X

## Scope

This document describes the SQLite schema that exists now after applying the
current migration files in `src-tauri/migrations/`. It is repo-grounded from the
migrations and `src-tauri/src/vault_db.rs`. Planned tables are not included
unless explicitly labeled as not implemented.

## Current Tables

| Table | Introduced In | Current Status | Columns |
| --- | --- | --- | --- |
| `schema_version` | `001_init_source_document_root.sql` | Real infrastructure | `id`, `version`, `migration_id`, `description`, `applied_at` |
| `source_documents` | `001_init_source_document_root.sql` | Actively used. SourceDocument-only intake save/read/list is real. | `id`, `project_id`, `title`, `file_name`, `file_type`, `mime_type`, `file_size`, `local_path_reference`, `local_path_policy`, `metadata_status`, `citation_metadata_required`, `citation_readiness`, `parser_status`, `review_status`, `created_from_candidate_id`, `created_at`, `updated_at` |
| `extraction_runs` | `001_init_source_document_root.sql` | Foundation/legacy save path. Not triggered by current SourceDocument-only intake path. | `id`, `source_document_id`, `extraction_document_id`, `parser_name`, `parser_version`, `extraction_status`, `confidence_score`, `raw_text_hash`, `cleaned_text_hash`, `raw_text_length`, `cleaned_text_length`, `warning_count`, `created_at` |
| `extraction_segments` | `001_init_source_document_root.sql` | Foundation/legacy save path. Not triggered by current SourceDocument-only intake path. | `id`, `extraction_run_id`, `source_document_id`, `segment_id`, `segment_type`, `title`, `content`, `content_hash`, `page_start`, `page_end`, `page_numbers_trusted`, `sort_order`, `tags_json`, `created_at` |
| `evidence_traces` | `001_init_source_document_root.sql` | Foundation/legacy evidence path. Not triggered by current SourceDocument-only intake path. | `id`, `source_document_id`, `extraction_run_id`, `extraction_segment_id`, `trace_type`, `chunk_reference`, `page_number`, `page_number_trusted`, `section_title`, `parser_warning`, `created_at` |
| `source_cards` | `002_add_source_cards.sql` | Real table and commands exist. SourceCard creation is not triggered by current intake path. | `id`, `source_document_id`, `title`, `authors`, `year`, `source_type`, `citation_text`, `metadata_status`, `citation_readiness`, `file_reference`, `review_status`, `created_from_candidate_id`, `created_at`, `updated_at` |
| `marketing_tags` | `003_add_marketing_tags.sql` | Real table and commands exist for approved tags linked to SourceCards. Not created by current SourceDocument-only intake path. | `id`, `label`, `tier`, `category`, `review_status`, `created_at`, `updated_at` |
| `source_card_tags` | `003_add_marketing_tags.sql` | Real join table. Not created by current SourceDocument-only intake path. | `source_card_id`, `marketing_tag_id`, `review_status`, `created_at`, `updated_at` |
| `knowledge_cards` | `004_add_knowledge_cards.sql` | Real table and commands exist. Not created by current SourceDocument-only intake path. | `id`, `source_card_id`, `card_type`, `title`, `content_preview`, `citation_readiness`, `trace_readiness`, `review_status`, `validation_status`, `created_from_candidate_id`, `created_at`, `updated_at` |
| `knowledge_card_traces` | `004_add_knowledge_cards.sql` | Real support table. Not created by current SourceDocument-only intake path. | `id`, `knowledge_card_id`, `chunk_reference`, `page_number`, `page_number_trusted`, `section_title`, `created_at` |
| `knowledge_card_tags` | `004_add_knowledge_cards.sql` | Real join table. Not created by current SourceDocument-only intake path. | `knowledge_card_id`, `marketing_tag_id`, `review_status`, `created_at`, `updated_at` |
| `draft_artifacts` | `005_add_draft_artifacts.sql` | Real table for mock/not-final draft artifacts. Not created by current SourceDocument-only intake path. | `id`, `source_card_id`, `title`, `draft_type`, `artifact_status`, `mock_only`, `not_final`, `citation_readiness`, `trace_readiness`, `created_from_candidate_id`, `created_at`, `updated_at` |
| `draft_sections` | `005_add_draft_artifacts.sql` | Real support table for draft artifacts. | `id`, `draft_artifact_id`, `section_id`, `section_title`, `mock_paragraph`, `citation_placeholders_json`, `linked_evidence_ids_json`, `linked_quote_ids_json`, `linked_case_ids_json`, `approved_tags_json`, `warnings_json`, `sort_order`, `created_at`, `updated_at` |
| `draft_artifact_knowledge_cards` | `005_add_draft_artifacts.sql` | Real join table. | `draft_artifact_id`, `knowledge_card_id`, `created_at` |
| `source_card_bibliographic_metadata` | `006_add_source_card_bibliographic_metadata.sql` | Real structured metadata table. Not populated by current SourceDocument-only intake path. | `source_card_id`, `publisher`, `journal`, `container_title`, `edition`, `volume`, `issue`, `page_range`, `doi`, `url`, `access_date`, `metadata_source`, `structured_metadata_status`, `apa_readiness`, `human_verified_at`, `notes`, `warnings`, `created_at`, `updated_at` |
| `source_card_apa_reference_reviews` | `007_add_source_card_apa_reference_reviews.sql` | Real APA review table. APA-final verification is still gated and not active from current intake path. | `id`, `source_card_id`, `candidate_reference_text`, `verified_reference_text`, `verification_status`, `verification_scope`, `checklist_json`, `reviewer_note`, `source_metadata_snapshot_json`, `warnings_accepted_json`, `blockers_resolved_json`, `apa_style_version`, `human_reviewed_at`, `created_at`, `updated_at` |
| `batch_research_intake_jobs` | `008_add_batch_research_intake_jobs.sql` | Real batch intake table. Current UI uses preview and mock/provider queue tools; not a production cloud pipeline. | `id`, `file_name`, `file_path`, `file_type`, `mime_type`, `file_size`, `source_type_guess`, `queue_status`, `parser_status`, `metadata_extraction_status`, `external_match_status`, `review_status`, `duplicate_status`, `warnings_json`, `blockers_json`, `created_at`, `updated_at` |
| `external_metadata_match_results` | `008_add_batch_research_intake_jobs.sql` | Real table for mock/Crossref fixture provider results. No live external provider call is active. | `id`, `intake_job_id`, `provider_id`, `provider_name`, `provider_type`, `provider_record_ref`, `is_mock`, `match_status`, `confidence_score`, `confidence_band`, `match_reasons_json`, `mismatch_reasons_json`, `warning_flags_json`, `blockers_json`, `raw_candidate_snapshot_json`, `created_at`, `updated_at` |
| `suggested_metadata_corrections` | `009_add_suggested_metadata_corrections.sql` | Real review queue table for suggested corrections. | `id`, `match_result_id`, `intake_job_id`, `source_card_id`, `target_metadata_table`, `field_name`, `current_value`, `suggested_value`, `provider_name`, `provider_record_ref`, `confidence_score`, `confidence_band`, `reason`, `mismatch_reasons_json`, `warning_flags_json`, `review_status`, `review_decision`, `reviewer_edited_value`, `reviewer_note`, `created_at`, `updated_at` |
| `metadata_correction_audit_events` | `010_add_metadata_correction_audit_events.sql`, expanded by `011_expand_metadata_correction_audit_preflight_events.sql` and `012_add_metadata_correction_structured_apply_events.sql` | Real audit table for metadata correction decisions and apply attempts. | `id`, `correction_id`, `intake_job_id`, `source_card_id`, `event_type`, `event_summary`, `target_metadata_table`, `target_field_name`, `original_atp_value`, `external_suggested_value`, `reviewer_edited_value`, `applied_value`, `provider_name`, `provider_record_ref`, `confidence_score`, `confidence_band`, `source_metadata_snapshot_json`, `warning_flags_json`, `reviewer_note`, `created_at` |
| `intake_source_document_audit_events` | `013_add_intake_source_document_audit_events.sql` | Actively used by SourceDocument-only intake save. | `id`, `created_at`, `event_type`, `command_name`, `package_id`, `candidate_id`, `source_document_id`, `result_status`, `blockers_json`, `warnings_json`, `safety_flags_json`, `read_back_status`, `message` |
| `sourcecard_metadata_reviews` | `014_add_sourcecard_metadata_reviews.sql` | Real backend record table. UI read/list inspector exists; active UI save/editing is not wired. | `id`, `source_document_id`, `created_from_candidate_id`, `review_status`, `source_type`, `reviewed_title`, `reviewed_authors_json`, `reviewed_year`, `reviewed_doi`, `reviewed_url`, `reviewed_container`, `reviewed_publisher`, `reviewed_volume`, `reviewed_issue`, `reviewed_pages`, `reviewed_notes`, `citation_text_candidate`, `apa_reference_candidate`, `citation_ready`, `apa_final_verified`, `human_review_required`, `human_verified_fields_json`, `blockers_json`, `warnings_json`, `safety_flags_json`, `read_back_status`, `created_at`, `updated_at` |
| `sourcecard_metadata_review_audit_events` | `014_add_sourcecard_metadata_reviews.sql` | Real backend audit table. UI can list compact audit events for selected metadata review record. | `id`, `created_at`, `event_type`, `command_name`, `source_document_id`, `metadata_review_id`, `result_status`, `blockers_json`, `warnings_json`, `safety_flags_json`, `read_back_status`, `message` |

## Foreign Keys

- `extraction_runs.source_document_id` -> `source_documents.id` cascade delete.
- `extraction_segments.extraction_run_id` -> `extraction_runs.id` cascade delete.
- `extraction_segments.source_document_id` -> `source_documents.id` cascade delete.
- `evidence_traces.source_document_id` -> `source_documents.id` cascade delete.
- `evidence_traces.extraction_run_id` -> `extraction_runs.id` cascade delete.
- `evidence_traces.extraction_segment_id` -> `extraction_segments.id` set null.
- `source_cards.source_document_id` -> `source_documents.id` cascade delete.
- `source_card_tags.source_card_id` -> `source_cards.id` cascade delete.
- `source_card_tags.marketing_tag_id` -> `marketing_tags.id` cascade delete.
- `knowledge_cards.source_card_id` -> `source_cards.id` cascade delete.
- `knowledge_card_traces.knowledge_card_id` -> `knowledge_cards.id` cascade delete.
- `knowledge_card_tags.knowledge_card_id` -> `knowledge_cards.id` cascade delete.
- `knowledge_card_tags.marketing_tag_id` -> `marketing_tags.id` cascade delete.
- `draft_artifacts.source_card_id` -> `source_cards.id` cascade delete.
- `draft_sections.draft_artifact_id` -> `draft_artifacts.id` cascade delete.
- `draft_artifact_knowledge_cards.draft_artifact_id` -> `draft_artifacts.id` cascade delete.
- `draft_artifact_knowledge_cards.knowledge_card_id` -> `knowledge_cards.id` cascade delete.
- `source_card_bibliographic_metadata.source_card_id` -> `source_cards.id` cascade delete.
- `source_card_apa_reference_reviews.source_card_id` -> `source_cards.id` cascade delete.
- `external_metadata_match_results.intake_job_id` -> `batch_research_intake_jobs.id` cascade delete.
- `suggested_metadata_corrections.match_result_id` -> `external_metadata_match_results.id` cascade delete.
- `suggested_metadata_corrections.intake_job_id` -> `batch_research_intake_jobs.id` cascade delete.
- `suggested_metadata_corrections.source_card_id` -> `source_cards.id` set null.
- `metadata_correction_audit_events.correction_id` -> `suggested_metadata_corrections.id` cascade delete.
- `metadata_correction_audit_events.intake_job_id` -> `batch_research_intake_jobs.id` cascade delete.
- `metadata_correction_audit_events.source_card_id` -> `source_cards.id` set null.
- `sourcecard_metadata_reviews.source_document_id` -> `source_documents.id` cascade delete.
- `sourcecard_metadata_review_audit_events.source_document_id` -> `source_documents.id` cascade delete.
- `sourcecard_metadata_review_audit_events.metadata_review_id` -> `sourcecard_metadata_reviews.id` set null.

## Indexes

- `idx_extraction_runs_source_document_id`
- `idx_extraction_segments_source_document_id`
- `idx_evidence_traces_source_document_id`
- `idx_evidence_traces_chunk_reference`
- `idx_source_cards_source_document_id`
- `idx_source_card_tags_source_card_id`
- `idx_source_card_tags_marketing_tag_id`
- `idx_knowledge_cards_source_card_id`
- `idx_knowledge_card_traces_knowledge_card_id`
- `idx_knowledge_card_traces_chunk_reference`
- `idx_knowledge_card_tags_knowledge_card_id`
- `idx_knowledge_card_tags_marketing_tag_id`
- `idx_draft_artifacts_source_card_id`
- `idx_draft_sections_draft_artifact_id`
- `idx_draft_artifact_knowledge_cards_draft_artifact_id`
- `idx_draft_artifact_knowledge_cards_knowledge_card_id`
- `idx_source_card_apa_reference_reviews_source_card_id`
- `idx_batch_research_intake_jobs_created_at`
- `idx_batch_research_intake_jobs_queue_status`
- `idx_external_metadata_match_results_unique_provider_record`
- `idx_external_metadata_match_results_intake_job_id`
- `idx_suggested_metadata_corrections_unique_field`
- `idx_suggested_metadata_corrections_review_status`
- `idx_suggested_metadata_corrections_confidence_band`
- `idx_metadata_correction_audit_events_correction_id`
- `idx_metadata_correction_audit_events_intake_job_id`
- `idx_metadata_correction_audit_events_source_card_id`
- `idx_metadata_correction_audit_events_event_type`
- `idx_metadata_correction_audit_events_created_at`
- `idx_intake_source_document_audit_events_package_id`
- `idx_intake_source_document_audit_events_candidate_id`
- `idx_intake_source_document_audit_events_created_at`
- `idx_sourcecard_metadata_reviews_source_document_id`
- `idx_sourcecard_metadata_reviews_created_from_candidate_id`
- `idx_sourcecard_metadata_reviews_review_status`
- `idx_sourcecard_metadata_reviews_updated_at`
- `idx_sourcecard_metadata_review_audit_events_source_document_id`
- `idx_sourcecard_metadata_review_audit_events_metadata_review_id`
- `idx_sourcecard_metadata_review_audit_events_event_type`
- `idx_sourcecard_metadata_review_audit_events_created_at`

SQLite autoindexes also exist for primary keys, unique constraints, and join
table primary keys.

## Real vs Planned Tables

All tables above exist now. Planned-but-not-implemented table concepts include
field-level SourceCard metadata edit history, SourceCard creation audit,
provider-specific live lookup caches, duplicate/similarity detection records,
and cloud sync tables. Those planned concepts are not implemented in the
current schema.
