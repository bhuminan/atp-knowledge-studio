CREATE TABLE IF NOT EXISTS metadata_correction_audit_events (
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
      'match_result_persisted'
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

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  10,
  '010_add_metadata_correction_audit_events',
  'Create append-only metadata correction audit event table.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
