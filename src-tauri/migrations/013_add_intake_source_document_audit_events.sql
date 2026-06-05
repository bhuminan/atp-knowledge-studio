CREATE TABLE IF NOT EXISTS intake_source_document_audit_events (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'intake_source_document_save_succeeded',
            'intake_source_document_save_already_exists',
            'intake_source_document_save_rejected',
            'intake_source_document_save_failed_read_back'
        )
    ),
    command_name TEXT NOT NULL,
    package_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    source_document_id TEXT,
    result_status TEXT NOT NULL CHECK (
        result_status IN ('saved', 'already_exists', 'rejected', 'failed_read_back')
    ),
    blockers_json TEXT NOT NULL DEFAULT '[]',
    warnings_json TEXT NOT NULL DEFAULT '[]',
    safety_flags_json TEXT NOT NULL DEFAULT '{}',
    read_back_status TEXT CHECK (
        read_back_status IS NULL
        OR read_back_status IN ('verified', 'failed', 'not_applicable')
    ),
    message TEXT
);

CREATE INDEX IF NOT EXISTS idx_intake_source_document_audit_events_package_id
    ON intake_source_document_audit_events(package_id);

CREATE INDEX IF NOT EXISTS idx_intake_source_document_audit_events_candidate_id
    ON intake_source_document_audit_events(candidate_id);

CREATE INDEX IF NOT EXISTS idx_intake_source_document_audit_events_created_at
    ON intake_source_document_audit_events(created_at);

INSERT INTO schema_version (id, version, migration_id, description, applied_at)
VALUES (
    1,
    13,
    '013_add_intake_source_document_audit_events',
    'Add intake SourceDocument audit events',
    datetime('now')
)
ON CONFLICT(id) DO UPDATE SET
    version = excluded.version,
    migration_id = excluded.migration_id,
    description = excluded.description,
    applied_at = excluded.applied_at;
