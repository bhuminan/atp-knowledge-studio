CREATE TABLE IF NOT EXISTS marketing_tags (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('core', 'extended', 'suggested')),
  category TEXT NOT NULL,
  review_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_card_tags (
  source_card_id TEXT NOT NULL,
  marketing_tag_id TEXT NOT NULL,
  review_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (source_card_id, marketing_tag_id),
  FOREIGN KEY (source_card_id) REFERENCES source_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (marketing_tag_id) REFERENCES marketing_tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_source_card_tags_source_card_id
  ON source_card_tags(source_card_id);

CREATE INDEX IF NOT EXISTS idx_source_card_tags_marketing_tag_id
  ON source_card_tags(marketing_tag_id);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  3,
  '003_add_marketing_tags',
  'Create MarketingTag table and SourceCard tag links.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
