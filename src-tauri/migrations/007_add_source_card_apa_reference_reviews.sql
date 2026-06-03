CREATE TABLE IF NOT EXISTS source_card_apa_reference_reviews (
  id TEXT PRIMARY KEY,
  source_card_id TEXT NOT NULL,
  candidate_reference_text TEXT NOT NULL,
  verified_reference_text TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('needs_correction', 'verified_for_internal_use')),
  verification_scope TEXT NOT NULL CHECK (verification_scope IN ('internal_drafting', 'teaching_preparation')),
  checklist_json TEXT NOT NULL DEFAULT '[]',
  reviewer_note TEXT,
  source_metadata_snapshot_json TEXT NOT NULL DEFAULT '{}',
  warnings_accepted_json TEXT NOT NULL DEFAULT '[]',
  blockers_resolved_json TEXT NOT NULL DEFAULT '[]',
  apa_style_version TEXT NOT NULL DEFAULT 'APA 7',
  human_reviewed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_card_id) REFERENCES source_cards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_source_card_apa_reference_reviews_source_card_id
  ON source_card_apa_reference_reviews(source_card_id);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  7,
  '007_add_source_card_apa_reference_reviews',
  'Create human APA reference review artifacts linked to saved SourceCards.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
