CREATE TABLE IF NOT EXISTS sourcecard_metadata_reviews (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL,
  created_from_candidate_id TEXT,
  review_status TEXT NOT NULL CHECK (
    review_status IN ('draft', 'needs_review', 'human_verified', 'saved_not_verified', 'blocked')
  ),
  source_type TEXT NOT NULL,
  reviewed_title TEXT NOT NULL,
  reviewed_authors_json TEXT,
  reviewed_year TEXT,
  reviewed_doi TEXT,
  reviewed_url TEXT,
  reviewed_container TEXT,
  reviewed_publisher TEXT,
  reviewed_volume TEXT,
  reviewed_issue TEXT,
  reviewed_pages TEXT,
  reviewed_notes TEXT,
  citation_text_candidate TEXT,
  apa_reference_candidate TEXT,
  citation_ready INTEGER NOT NULL DEFAULT 0 CHECK (citation_ready IN (0, 1)),
  apa_final_verified INTEGER NOT NULL DEFAULT 0 CHECK (apa_final_verified = 0),
  human_review_required INTEGER NOT NULL DEFAULT 1 CHECK (human_review_required = 1),
  human_verified_fields_json TEXT,
  blockers_json TEXT,
  warnings_json TEXT,
  safety_flags_json TEXT NOT NULL,
  read_back_status TEXT CHECK (
    read_back_status IS NULL
    OR read_back_status IN ('not_verified', 'verified', 'failed')
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sourcecard_metadata_reviews_source_document_id
  ON sourcecard_metadata_reviews(source_document_id);

CREATE INDEX IF NOT EXISTS idx_sourcecard_metadata_reviews_created_from_candidate_id
  ON sourcecard_metadata_reviews(created_from_candidate_id);

CREATE INDEX IF NOT EXISTS idx_sourcecard_metadata_reviews_review_status
  ON sourcecard_metadata_reviews(review_status);

CREATE INDEX IF NOT EXISTS idx_sourcecard_metadata_reviews_updated_at
  ON sourcecard_metadata_reviews(updated_at);

CREATE TABLE IF NOT EXISTS sourcecard_metadata_review_audit_events (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'sourcecard_metadata_review_save_requested',
      'sourcecard_metadata_review_save_rejected',
      'sourcecard_metadata_review_saved',
      'sourcecard_metadata_review_already_exists',
      'sourcecard_metadata_review_failed_read_back',
      'sourcecard_metadata_review_verified'
    )
  ),
  command_name TEXT NOT NULL,
  source_document_id TEXT NOT NULL,
  metadata_review_id TEXT,
  result_status TEXT NOT NULL CHECK (
    result_status IN ('requested', 'rejected', 'saved', 'already_exists', 'failed_read_back', 'verified')
  ),
  blockers_json TEXT,
  warnings_json TEXT,
  safety_flags_json TEXT,
  read_back_status TEXT CHECK (
    read_back_status IS NULL
    OR read_back_status IN ('verified', 'failed', 'not_applicable')
  ),
  message TEXT,
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (metadata_review_id) REFERENCES sourcecard_metadata_reviews(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcecard_metadata_review_audit_events_source_document_id
  ON sourcecard_metadata_review_audit_events(source_document_id);

CREATE INDEX IF NOT EXISTS idx_sourcecard_metadata_review_audit_events_metadata_review_id
  ON sourcecard_metadata_review_audit_events(metadata_review_id);

CREATE INDEX IF NOT EXISTS idx_sourcecard_metadata_review_audit_events_event_type
  ON sourcecard_metadata_review_audit_events(event_type);

CREATE INDEX IF NOT EXISTS idx_sourcecard_metadata_review_audit_events_created_at
  ON sourcecard_metadata_review_audit_events(created_at);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  14,
  '014_add_sourcecard_metadata_reviews',
  'Create SourceCard metadata review record and audit event tables.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
