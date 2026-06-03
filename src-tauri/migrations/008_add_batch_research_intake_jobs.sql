CREATE TABLE IF NOT EXISTS batch_research_intake_jobs (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('PDF', 'DOCX')),
  mime_type TEXT,
  file_size INTEGER,
  source_type_guess TEXT NOT NULL DEFAULT 'unknown_pending_review',
  queue_status TEXT NOT NULL DEFAULT 'queued',
  parser_status TEXT NOT NULL DEFAULT 'not_started',
  metadata_extraction_status TEXT NOT NULL DEFAULT 'not_started',
  external_match_status TEXT NOT NULL DEFAULT 'not_started',
  review_status TEXT NOT NULL DEFAULT 'pending',
  duplicate_status TEXT NOT NULL DEFAULT 'not_checked',
  warnings_json TEXT NOT NULL DEFAULT '[]',
  blockers_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_batch_research_intake_jobs_created_at
  ON batch_research_intake_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_batch_research_intake_jobs_queue_status
  ON batch_research_intake_jobs(queue_status);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  8,
  '008_add_batch_research_intake_jobs',
  'Create batch research intake queue records for multi-file metadata-only intake.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
