CREATE TABLE IF NOT EXISTS knowledge_units (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL,
  source_section_id TEXT,
  content_chunk_id TEXT,
  candidate_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'theme' CHECK (
    unit_type IN ('definition', 'framework', 'concept', 'theme', 'claim', 'unknown')
  ),
  source_trace_json TEXT NOT NULL DEFAULT '{}',
  trust_status TEXT NOT NULL DEFAULT 'orange' CHECK (trust_status IN ('green', 'orange', 'red')),
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (
    review_status IN (
      'preview_only',
      'needs_review',
      'approved',
      'rejected',
      'saved_unverified',
      'saved_verified',
      'blocked',
      'superseded'
    )
  ),
  language TEXT NOT NULL DEFAULT 'unknown' CHECK (language IN ('thai', 'english', 'mixed', 'unknown')),
  warnings_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  superseded_by_id TEXT,
  UNIQUE(source_document_id, candidate_id),
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (source_section_id) REFERENCES source_sections(id) ON DELETE SET NULL,
  FOREIGN KEY (content_chunk_id) REFERENCES content_chunks(id) ON DELETE SET NULL,
  FOREIGN KEY (superseded_by_id) REFERENCES knowledge_units(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_source_document_id
  ON knowledge_units(source_document_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_source_section_id
  ON knowledge_units(source_section_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_content_chunk_id
  ON knowledge_units(content_chunk_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_candidate_id
  ON knowledge_units(candidate_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_trust_status
  ON knowledge_units(trust_status);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_review_status
  ON knowledge_units(review_status);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_language
  ON knowledge_units(language);

CREATE TABLE IF NOT EXISTS knowledge_unit_audit_events (
  id TEXT PRIMARY KEY,
  knowledge_unit_id TEXT,
  source_document_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'candidate_generated',
      'user_approved',
      'user_edited',
      'user_rejected',
      'saved',
      'save_read_back_verified',
      'save_read_back_failed',
      'superseded',
      'archived',
      'regenerated_from_source'
    )
  ),
  event_payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (knowledge_unit_id) REFERENCES knowledge_units(id) ON DELETE SET NULL,
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_knowledge_unit_audit_events_knowledge_unit_id
  ON knowledge_unit_audit_events(knowledge_unit_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_unit_audit_events_source_document_id
  ON knowledge_unit_audit_events(source_document_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_unit_audit_events_event_type
  ON knowledge_unit_audit_events(event_type);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  16,
  '016_add_knowledge_units',
  'Create KnowledgeUnit Deep Intake boundary tables.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
