CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL,
  migration_id TEXT NOT NULL,
  description TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('PDF', 'DOCX', 'MD')),
  mime_type TEXT,
  file_size INTEGER,
  local_path_reference TEXT,
  local_path_policy TEXT NOT NULL DEFAULT 'local_path_reference_only',
  metadata_status TEXT NOT NULL,
  citation_metadata_required INTEGER NOT NULL DEFAULT 1,
  citation_readiness TEXT NOT NULL,
  parser_status TEXT NOT NULL,
  review_status TEXT NOT NULL,
  created_from_candidate_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS extraction_runs (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL,
  extraction_document_id TEXT NOT NULL,
  parser_name TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  extraction_status TEXT NOT NULL,
  confidence_score INTEGER,
  raw_text_hash TEXT,
  cleaned_text_hash TEXT,
  raw_text_length INTEGER NOT NULL DEFAULT 0,
  cleaned_text_length INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS extraction_segments (
  id TEXT PRIMARY KEY,
  extraction_run_id TEXT NOT NULL,
  source_document_id TEXT NOT NULL,
  segment_id TEXT NOT NULL,
  segment_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT,
  page_start INTEGER,
  page_end INTEGER,
  page_numbers_trusted INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY (extraction_run_id) REFERENCES extraction_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evidence_traces (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL,
  extraction_run_id TEXT NOT NULL,
  extraction_segment_id TEXT,
  trace_type TEXT NOT NULL,
  chunk_reference TEXT NOT NULL,
  page_number INTEGER,
  page_number_trusted INTEGER NOT NULL DEFAULT 0,
  section_title TEXT,
  parser_warning TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (extraction_run_id) REFERENCES extraction_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (extraction_segment_id) REFERENCES extraction_segments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_extraction_runs_source_document_id
  ON extraction_runs(source_document_id);

CREATE INDEX IF NOT EXISTS idx_extraction_segments_source_document_id
  ON extraction_segments(source_document_id);

CREATE INDEX IF NOT EXISTS idx_evidence_traces_source_document_id
  ON evidence_traces(source_document_id);

CREATE INDEX IF NOT EXISTS idx_evidence_traces_chunk_reference
  ON evidence_traces(chunk_reference);

INSERT INTO schema_version (
  id,
  version,
  migration_id,
  description,
  applied_at
)
VALUES (
  1,
  1,
  '001_init_source_document_root',
  'Create SourceDocument root, extraction runs, segments, and evidence traces.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  version = excluded.version,
  migration_id = excluded.migration_id,
  description = excluded.description,
  applied_at = excluded.applied_at;
