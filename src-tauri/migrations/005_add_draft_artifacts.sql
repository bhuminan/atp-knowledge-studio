CREATE TABLE IF NOT EXISTS draft_artifacts (
  id TEXT PRIMARY KEY,
  source_card_id TEXT NOT NULL,
  title TEXT NOT NULL,
  draft_type TEXT NOT NULL CHECK (draft_type IN ('mock_draft_section_preview')),
  artifact_status TEXT NOT NULL CHECK (artifact_status IN ('mock_only', 'not_final')),
  mock_only INTEGER NOT NULL DEFAULT 1,
  not_final INTEGER NOT NULL DEFAULT 1,
  citation_readiness TEXT NOT NULL,
  trace_readiness TEXT NOT NULL,
  created_from_candidate_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_card_id) REFERENCES source_cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS draft_sections (
  id TEXT PRIMARY KEY,
  draft_artifact_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  section_title TEXT NOT NULL,
  mock_paragraph TEXT NOT NULL,
  citation_placeholders_json TEXT NOT NULL DEFAULT '[]',
  linked_evidence_ids_json TEXT NOT NULL DEFAULT '[]',
  linked_quote_ids_json TEXT NOT NULL DEFAULT '[]',
  linked_case_ids_json TEXT NOT NULL DEFAULT '[]',
  approved_tags_json TEXT NOT NULL DEFAULT '[]',
  warnings_json TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (draft_artifact_id) REFERENCES draft_artifacts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS draft_artifact_knowledge_cards (
  draft_artifact_id TEXT NOT NULL,
  knowledge_card_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (draft_artifact_id, knowledge_card_id),
  FOREIGN KEY (draft_artifact_id) REFERENCES draft_artifacts(id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_card_id) REFERENCES knowledge_cards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_draft_artifacts_source_card_id
  ON draft_artifacts(source_card_id);

CREATE INDEX IF NOT EXISTS idx_draft_sections_draft_artifact_id
  ON draft_sections(draft_artifact_id);

CREATE INDEX IF NOT EXISTS idx_draft_artifact_knowledge_cards_draft_artifact_id
  ON draft_artifact_knowledge_cards(draft_artifact_id);

CREATE INDEX IF NOT EXISTS idx_draft_artifact_knowledge_cards_knowledge_card_id
  ON draft_artifact_knowledge_cards(knowledge_card_id);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  5,
  '005_add_draft_artifacts',
  'Create mock-only DraftArtifact tables linked to SourceCard and KnowledgeCards.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
