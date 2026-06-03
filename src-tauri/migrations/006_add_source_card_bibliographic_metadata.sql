CREATE TABLE IF NOT EXISTS source_card_bibliographic_metadata (
  source_card_id TEXT PRIMARY KEY,
  publisher TEXT,
  journal TEXT,
  container_title TEXT,
  edition TEXT,
  volume TEXT,
  issue TEXT,
  page_range TEXT,
  doi TEXT,
  url TEXT,
  access_date TEXT,
  metadata_source TEXT NOT NULL,
  structured_metadata_status TEXT NOT NULL,
  apa_readiness TEXT NOT NULL,
  human_verified_at TEXT,
  notes TEXT,
  warnings TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_card_id) REFERENCES source_cards(id) ON DELETE CASCADE
);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  6,
  '006_add_source_card_bibliographic_metadata',
  'Create structured bibliographic metadata table linked to saved SourceCards.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
