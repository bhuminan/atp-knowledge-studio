CREATE TABLE IF NOT EXISTS source_sections (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL,
  parent_section_id TEXT,
  section_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  heading_level INTEGER NOT NULL DEFAULT 1,
  language_profile TEXT NOT NULL DEFAULT 'unknown' CHECK (
    language_profile IN ('thai', 'english', 'mixed', 'unknown')
  ),
  source_location_type TEXT NOT NULL DEFAULT 'unknown',
  page_number INTEGER,
  page_number_trusted INTEGER NOT NULL DEFAULT 0 CHECK (page_number_trusted IN (0, 1)),
  paragraph_start_index INTEGER,
  paragraph_end_index INTEGER,
  character_start INTEGER,
  character_end INTEGER,
  trace_label TEXT NOT NULL,
  extraction_run_id TEXT,
  extraction_method TEXT NOT NULL DEFAULT 'preview',
  trust_state TEXT NOT NULL DEFAULT 'orange' CHECK (trust_state IN ('green', 'orange', 'red')),
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (
    review_status IN ('needs_review', 'reviewed', 'blocked')
  ),
  warning_json TEXT NOT NULL DEFAULT '[]',
  blocker_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_document_id, section_order),
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_section_id) REFERENCES source_sections(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_source_sections_source_document_id
  ON source_sections(source_document_id);

CREATE INDEX IF NOT EXISTS idx_source_sections_source_document_order
  ON source_sections(source_document_id, section_order);

CREATE INDEX IF NOT EXISTS idx_source_sections_trust_state
  ON source_sections(trust_state);

CREATE INDEX IF NOT EXISTS idx_source_sections_review_status
  ON source_sections(review_status);

CREATE TABLE IF NOT EXISTS content_chunks (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL,
  source_section_id TEXT NOT NULL,
  chunk_order INTEGER NOT NULL,
  chunk_type TEXT NOT NULL DEFAULT 'section',
  title TEXT,
  preview_text TEXT,
  text_length INTEGER NOT NULL DEFAULT 0,
  language_profile TEXT NOT NULL DEFAULT 'unknown' CHECK (
    language_profile IN ('thai', 'english', 'mixed', 'unknown')
  ),
  source_location_type TEXT NOT NULL DEFAULT 'unknown',
  page_number INTEGER,
  page_number_trusted INTEGER NOT NULL DEFAULT 0 CHECK (page_number_trusted IN (0, 1)),
  paragraph_start_index INTEGER,
  paragraph_end_index INTEGER,
  character_start INTEGER,
  character_end INTEGER,
  trace_label TEXT NOT NULL,
  extraction_run_id TEXT,
  extraction_method TEXT NOT NULL DEFAULT 'preview',
  chunking_confidence TEXT NOT NULL DEFAULT 'low',
  trust_state TEXT NOT NULL DEFAULT 'orange' CHECK (trust_state IN ('green', 'orange', 'red')),
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (
    review_status IN ('needs_review', 'reviewed', 'blocked')
  ),
  readiness_score INTEGER,
  warning_json TEXT NOT NULL DEFAULT '[]',
  blocker_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_document_id, source_section_id, chunk_order),
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (source_section_id) REFERENCES source_sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_chunks_source_document_id
  ON content_chunks(source_document_id);

CREATE INDEX IF NOT EXISTS idx_content_chunks_source_section_id
  ON content_chunks(source_section_id);

CREATE INDEX IF NOT EXISTS idx_content_chunks_source_section_order
  ON content_chunks(source_document_id, source_section_id, chunk_order);

CREATE INDEX IF NOT EXISTS idx_content_chunks_trust_state
  ON content_chunks(trust_state);

CREATE INDEX IF NOT EXISTS idx_content_chunks_review_status
  ON content_chunks(review_status);

CREATE INDEX IF NOT EXISTS idx_content_chunks_language_profile
  ON content_chunks(language_profile);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  15,
  '015_add_source_sections_content_chunks',
  'Create SourceSection and ContentChunk Deep Intake boundary tables.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
