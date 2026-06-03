CREATE TABLE IF NOT EXISTS external_metadata_match_results (
  id TEXT PRIMARY KEY,
  intake_job_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  provider_record_ref TEXT NOT NULL,
  is_mock INTEGER NOT NULL DEFAULT 1 CHECK (is_mock IN (0, 1)),
  match_status TEXT NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  confidence_band TEXT NOT NULL CHECK (confidence_band IN ('high', 'medium', 'low', 'none')),
  match_reasons_json TEXT NOT NULL DEFAULT '[]',
  mismatch_reasons_json TEXT NOT NULL DEFAULT '[]',
  warning_flags_json TEXT NOT NULL DEFAULT '[]',
  blockers_json TEXT NOT NULL DEFAULT '[]',
  raw_candidate_snapshot_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (intake_job_id) REFERENCES batch_research_intake_jobs(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_external_metadata_match_results_unique_provider_record
  ON external_metadata_match_results(intake_job_id, provider_id, provider_record_ref);

CREATE INDEX IF NOT EXISTS idx_external_metadata_match_results_intake_job_id
  ON external_metadata_match_results(intake_job_id);

CREATE TABLE IF NOT EXISTS suggested_metadata_corrections (
  id TEXT PRIMARY KEY,
  match_result_id TEXT NOT NULL,
  intake_job_id TEXT NOT NULL,
  source_card_id TEXT,
  target_metadata_table TEXT NOT NULL CHECK (target_metadata_table IN ('source_cards', 'source_card_bibliographic_metadata')),
  field_name TEXT NOT NULL,
  current_value TEXT,
  suggested_value TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_record_ref TEXT NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  confidence_band TEXT NOT NULL CHECK (confidence_band IN ('high', 'medium', 'low', 'none')),
  reason TEXT NOT NULL,
  mismatch_reasons_json TEXT NOT NULL DEFAULT '[]',
  warning_flags_json TEXT NOT NULL DEFAULT '[]',
  review_status TEXT NOT NULL CHECK (
    review_status IN (
      'pending',
      'ready_for_batch_approval',
      'needs_human_review',
      'low_confidence',
      'missing_required_metadata',
      'duplicate_suspected',
      'provider_conflict',
      'approved',
      'rejected',
      'edited',
      'deferred_needs_more_evidence'
    )
  ),
  review_decision TEXT NOT NULL CHECK (
    review_decision IN (
      'not_decided',
      'approved_suggested_value',
      'rejected_suggested_value',
      'edited_before_approval',
      'deferred_needs_more_evidence'
    )
  ),
  reviewer_edited_value TEXT,
  reviewer_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (match_result_id) REFERENCES external_metadata_match_results(id) ON DELETE CASCADE,
  FOREIGN KEY (intake_job_id) REFERENCES batch_research_intake_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (source_card_id) REFERENCES source_cards(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suggested_metadata_corrections_unique_field
  ON suggested_metadata_corrections(intake_job_id, provider_record_ref, field_name);

CREATE INDEX IF NOT EXISTS idx_suggested_metadata_corrections_review_status
  ON suggested_metadata_corrections(review_status);

CREATE INDEX IF NOT EXISTS idx_suggested_metadata_corrections_confidence_band
  ON suggested_metadata_corrections(confidence_band);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  9,
  '009_add_suggested_metadata_corrections',
  'Create external metadata match result and suggested correction review queue tables.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
