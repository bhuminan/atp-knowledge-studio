CREATE TABLE IF NOT EXISTS knowledge_cards (
  id TEXT PRIMARY KEY,
  source_card_id TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('concept', 'evidence', 'quote', 'case', 'writing_angle')),
  title TEXT NOT NULL,
  content_preview TEXT NOT NULL,
  citation_readiness TEXT NOT NULL,
  trace_readiness TEXT NOT NULL,
  review_status TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  created_from_candidate_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_card_id) REFERENCES source_cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_card_traces (
  id TEXT PRIMARY KEY,
  knowledge_card_id TEXT NOT NULL,
  chunk_reference TEXT NOT NULL,
  page_number INTEGER,
  page_number_trusted INTEGER NOT NULL DEFAULT 0,
  section_title TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (knowledge_card_id) REFERENCES knowledge_cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_card_tags (
  knowledge_card_id TEXT NOT NULL,
  marketing_tag_id TEXT NOT NULL,
  review_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (knowledge_card_id, marketing_tag_id),
  FOREIGN KEY (knowledge_card_id) REFERENCES knowledge_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (marketing_tag_id) REFERENCES marketing_tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_knowledge_cards_source_card_id
  ON knowledge_cards(source_card_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_card_traces_knowledge_card_id
  ON knowledge_card_traces(knowledge_card_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_card_traces_chunk_reference
  ON knowledge_card_traces(chunk_reference);

CREATE INDEX IF NOT EXISTS idx_knowledge_card_tags_knowledge_card_id
  ON knowledge_card_tags(knowledge_card_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_card_tags_marketing_tag_id
  ON knowledge_card_tags(marketing_tag_id);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  4,
  '004_add_knowledge_cards',
  'Create KnowledgeCard table linked to SourceCard with trace and tag links.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
