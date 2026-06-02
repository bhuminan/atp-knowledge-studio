CREATE TABLE IF NOT EXISTS source_cards (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL,
  title TEXT NOT NULL,
  authors TEXT,
  year TEXT,
  source_type TEXT NOT NULL,
  citation_text TEXT NOT NULL,
  metadata_status TEXT NOT NULL,
  citation_readiness TEXT NOT NULL,
  file_reference TEXT NOT NULL,
  review_status TEXT NOT NULL,
  created_from_candidate_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_source_cards_source_document_id
  ON source_cards(source_document_id);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  2,
  '002_add_source_cards',
  'Create SourceCard metadata table linked to SourceDocument root.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
