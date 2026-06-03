PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS suggested_metadata_corrections_next (
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
      'deferred_needs_more_evidence',
      'verified'
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

INSERT INTO suggested_metadata_corrections_next (
  id,
  match_result_id,
  intake_job_id,
  source_card_id,
  target_metadata_table,
  field_name,
  current_value,
  suggested_value,
  provider_name,
  provider_record_ref,
  confidence_score,
  confidence_band,
  reason,
  mismatch_reasons_json,
  warning_flags_json,
  review_status,
  review_decision,
  reviewer_edited_value,
  reviewer_note,
  created_at,
  updated_at
)
SELECT
  id,
  match_result_id,
  intake_job_id,
  source_card_id,
  target_metadata_table,
  field_name,
  current_value,
  suggested_value,
  provider_name,
  provider_record_ref,
  confidence_score,
  confidence_band,
  reason,
  mismatch_reasons_json,
  warning_flags_json,
  review_status,
  review_decision,
  reviewer_edited_value,
  reviewer_note,
  created_at,
  updated_at
FROM suggested_metadata_corrections;

DROP TABLE suggested_metadata_corrections;
ALTER TABLE suggested_metadata_corrections_next RENAME TO suggested_metadata_corrections;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suggested_metadata_corrections_unique_field
  ON suggested_metadata_corrections(intake_job_id, provider_record_ref, field_name);

CREATE INDEX IF NOT EXISTS idx_suggested_metadata_corrections_review_status
  ON suggested_metadata_corrections(review_status);

CREATE INDEX IF NOT EXISTS idx_suggested_metadata_corrections_confidence_band
  ON suggested_metadata_corrections(confidence_band);

CREATE TABLE IF NOT EXISTS metadata_correction_audit_events_next (
  id TEXT PRIMARY KEY,
  correction_id TEXT NOT NULL,
  intake_job_id TEXT NOT NULL,
  source_card_id TEXT,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'correction_created',
      'correction_approved',
      'correction_rejected',
      'correction_edited_before_approval',
      'correction_deferred',
      'correction_routed',
      'match_result_persisted',
      'apply_preflight_passed',
      'apply_preflight_blocked',
      'correction_apply_started',
      'correction_applied',
      'metadata_read_back_verified',
      'correction_apply_failed'
    )
  ),
  event_summary TEXT NOT NULL,
  target_metadata_table TEXT,
  target_field_name TEXT,
  original_atp_value TEXT,
  external_suggested_value TEXT,
  reviewer_edited_value TEXT,
  applied_value TEXT,
  provider_name TEXT,
  provider_record_ref TEXT,
  confidence_score INTEGER CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
  confidence_band TEXT CHECK (confidence_band IS NULL OR confidence_band IN ('high', 'medium', 'low', 'none')),
  source_metadata_snapshot_json TEXT NOT NULL DEFAULT '{}',
  warning_flags_json TEXT NOT NULL DEFAULT '[]',
  reviewer_note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (correction_id) REFERENCES suggested_metadata_corrections(id) ON DELETE CASCADE,
  FOREIGN KEY (intake_job_id) REFERENCES batch_research_intake_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (source_card_id) REFERENCES source_cards(id) ON DELETE SET NULL
);

INSERT INTO metadata_correction_audit_events_next (
  id,
  correction_id,
  intake_job_id,
  source_card_id,
  event_type,
  event_summary,
  target_metadata_table,
  target_field_name,
  original_atp_value,
  external_suggested_value,
  reviewer_edited_value,
  applied_value,
  provider_name,
  provider_record_ref,
  confidence_score,
  confidence_band,
  source_metadata_snapshot_json,
  warning_flags_json,
  reviewer_note,
  created_at
)
SELECT
  id,
  correction_id,
  intake_job_id,
  source_card_id,
  event_type,
  event_summary,
  target_metadata_table,
  target_field_name,
  original_atp_value,
  external_suggested_value,
  reviewer_edited_value,
  applied_value,
  provider_name,
  provider_record_ref,
  confidence_score,
  confidence_band,
  source_metadata_snapshot_json,
  warning_flags_json,
  reviewer_note,
  created_at
FROM metadata_correction_audit_events;

DROP TABLE metadata_correction_audit_events;
ALTER TABLE metadata_correction_audit_events_next RENAME TO metadata_correction_audit_events;

CREATE INDEX IF NOT EXISTS idx_metadata_correction_audit_events_correction_id
  ON metadata_correction_audit_events(correction_id);

CREATE INDEX IF NOT EXISTS idx_metadata_correction_audit_events_intake_job_id
  ON metadata_correction_audit_events(intake_job_id);

CREATE INDEX IF NOT EXISTS idx_metadata_correction_audit_events_source_card_id
  ON metadata_correction_audit_events(source_card_id);

CREATE INDEX IF NOT EXISTS idx_metadata_correction_audit_events_event_type
  ON metadata_correction_audit_events(event_type);

CREATE INDEX IF NOT EXISTS idx_metadata_correction_audit_events_created_at
  ON metadata_correction_audit_events(created_at);

PRAGMA foreign_keys = ON;

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  12,
  '012_add_metadata_correction_structured_apply_events',
  'Allow structured metadata correction apply audit events and verified correction state.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
