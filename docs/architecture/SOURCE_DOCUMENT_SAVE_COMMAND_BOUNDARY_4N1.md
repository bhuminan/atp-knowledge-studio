# SourceDocument Save Command Boundary Inspection 4N-1

Sprint 4N-1 inspects the safest backend boundary for a future SourceDocument-only save command from reviewed INPUT Room intake candidates. It is documentation and inspection only. No runtime behavior, Rust command, schema, migration, persistence, parser, Source Library state, or AI/API behavior changes in this sprint.

## Inspected Files

- `docs/product/ATP_MASTER_DESIGN_PLAN_V1.md`
- `docs/architecture/REAL_INTAKE_PERSISTENCE_BOUNDARY_4M3.md`
- `docs/architecture/SOURCE_DOCUMENT_INTAKE_SAVE_CANDIDATE_4N0.md`
- `src/lib/sources/SourceDocumentIntakeSaveCandidateMapper.ts`
- `src/features/source-library/components/SourceLibraryIncomingPackagePreview.tsx`
- `src/features/source-library/components/PersistenceSaveCandidatePreview.tsx`
- `src/lib/persistence/LocalVaultDatabase.ts`
- `src/lib/persistence/PersistenceDryRunService.ts`
- `src/lib/sources/PersistenceSaveCandidateMapper.ts`
- `src-tauri/src/lib.rs`
- `src-tauri/src/vault_db.rs`
- `src-tauri/migrations/001_init_source_document_root.sql`
- `src-tauri/migrations/002_add_source_cards.sql`
- `src-tauri/migrations/008_add_batch_research_intake_jobs.sql`
- `src-tauri/migrations/010_add_metadata_correction_audit_events.sql`
- `tests/e2e/source-library.spec.ts`

## Current Capabilities

The current backend already exposes explicit Tauri commands for saved SourceDocument records:

- `save_source_document_candidate`
- `list_saved_source_documents`
- `read_saved_source_document`

The current SourceDocument save is built for reviewed parsed-document candidates, not raw INPUT Room handoff candidates. It accepts `SaveSourceDocumentRequest`, starts a SQLite transaction, upserts a `source_documents` root row, deletes and replaces child extraction rows, writes one `extraction_runs` row, writes `extraction_segments`, writes `evidence_traces`, commits, and returns blockers, warnings, saved state, ids, and saved child counts.

The current SourceDocument read boundary returns the SourceDocument root, latest extraction run, extraction segments, and evidence traces. Existing tests verify list/read behavior, missing-read errors, idempotent repeat save, DOCX page-number safety, and that SourceDocument save does not create SourceCard, KnowledgeCard, or DraftArtifact rows.

The current backend also exposes explicit SourceCard commands:

- `save_source_card_candidate`
- `list_saved_source_cards`
- `read_saved_source_card`

SourceCard save requires an existing SourceDocument and writes only compact SourceCard metadata. It does not run automatically after SourceDocument save.

Vault initialization applies migrations through `open_initialized_vault_database`, `apply_migrations`, and `read_schema_version`. The current schema has `source_documents`, `extraction_runs`, `extraction_segments`, `evidence_traces`, `source_cards`, `batch_research_intake_jobs`, and metadata correction audit tables.

## Current Constraints

The existing `save_source_document_candidate` command is not the correct first boundary for raw INPUT Room candidates because it requires extracted content:

- `sourceDocumentId`
- `extractionRunId`
- `sourceDocument.candidateId`
- `sourceDocument.title`
- `sourceDocument.fileName`
- `sourceDocument.sourceMetadata.title`
- `extraction.documentId`
- at least one extraction segment
- at least one evidence trace
- preserved evidence trace chunk references

It currently permits `PDF`, `DOCX`, and `MD`; the 4N intake preview supports PDF and DOCX only. It also stores parser-related state and extraction artifacts. A future INPUT Room SourceDocument-only save must not imply that parsing happened.

The `batch_research_intake_jobs` command is also not a SourceDocument save boundary. It queues PDF/DOCX file metadata only and explicitly warns that files are not parsed, external metadata lookup is not performed, SourceDocument/SourceCard records are not created automatically, and metadata is not overwritten.

## Frontend Bridge Inspection

`LocalVaultDatabase.ts` calls real persistence through Tauri `invoke`. `saveSourceDocumentCandidate` calls `save_source_document_candidate`; `listSavedSourceDocuments` and `readSavedSourceDocument` call the matching read/list commands.

`PersistenceSaveCandidatePreview.tsx` connects the parsed DOCX workflow to the real SourceDocument save command. It blocks empty segment and trace arrays before invoking save. After a successful save it lists saved SourceDocuments and reads the target document back into the UI. In QA mode, it uses local mock read-back data and does not invoke Tauri.

The 4N-0 incoming candidate mapper stays outside this persistence bridge. `SourceDocumentIntakeSaveCandidateMapper.ts` derives preview-only candidates with fixed safety flags:

- `previewOnly: true`
- `persisted: false`
- `sourceDocumentCreated: false`
- `sourceCardCreated: false`
- `parsed: false`
- `classified: false`
- `aiProcessed: false`

The safest future frontend connection point is the Source Library incoming package preview panel after candidate review, not the existing parsed-DOCX save action. The future action should convert reviewed 4N candidate previews into a new backend request only after explicit user approval.

## Proposed Future Command Boundary

Add a new command only in a future implementation sprint:

`save_intake_source_document_candidates`

This command should be SourceDocument-only and should not call the parser, classifier, providers, AI, SourceCard save, MarketingTag save, KnowledgeCard save, DraftArtifact save, citation verification, APA verification, or DOCX export.

Recommended request shape:

```ts
interface SaveIntakeSourceDocumentCandidatesRequest {
  packageId: string;
  source: "INPUT Room";
  intendedDestination: "Source Library Intake";
  reviewerApproval: {
    approved: true;
    approvedAt: string;
    approvalMode: "explicit_user_click";
    reviewerNote?: string | null;
  };
  safetyFlags: {
    previewOnlyWasShown: true;
    parserDisabled: true;
    classificationDisabled: true;
    aiDisabled: true;
    sourceCardDeferred: true;
  };
  candidates: SaveIntakeSourceDocumentCandidate[];
}

interface SaveIntakeSourceDocumentCandidate {
  candidateId: string;
  sourceDocumentId: string;
  fileName: string;
  fileType: "PDF" | "DOCX";
  fileSize?: number | null;
  localPathReference?: string | null;
  localPathPolicy: "local_path_reference_only";
  title: string;
  metadataCompleteness: "complete" | "incomplete" | "missing";
  readinessStatus: "ready" | "needs_review";
  reviewStatus: "approved_for_source_document_save";
  warnings: string[];
}
```

Recommended response shape:

```ts
interface SaveIntakeSourceDocumentCandidatesResult {
  auditEventIds: string[];
  blockers: string[];
  candidateResults: SaveIntakeSourceDocumentCandidateResult[];
  dbPath: string;
  packageId: string;
  saved: boolean;
  sourceCardCreated: false;
  warnings: string[];
}

interface SaveIntakeSourceDocumentCandidateResult {
  blockers: string[];
  readBackVerified: boolean;
  readinessStatus: "saved_and_verified" | "blocked" | "failed";
  sourceDocumentId: string;
  warnings: string[];
}
```

## Validation Rules

Future server-side validation should block when:

- package id is missing
- source is not `INPUT Room`
- intended destination is not `Source Library Intake`
- approval is missing or not explicit
- approval mode is not `explicit_user_click`
- candidate list is empty
- candidate id is missing
- SourceDocument id is missing
- file name is missing
- title is missing
- file type is not PDF or DOCX
- candidate readiness is `blocked`
- review status is not `approved_for_source_document_save`
- local path policy is missing or implies file copy/upload
- safety flags imply parser, classification, AI, or SourceCard creation

Warnings that should not block SourceDocument root save:

- metadata is incomplete
- file size is unavailable
- local path reference is unavailable, if policy allows reference-only intake
- citation metadata is not final
- APA-final readiness is not implied
- SourceCard is deferred

## SourceCard Deferral

SourceCard must remain deferred because SourceCard persistence carries citation and bibliographic metadata expectations. INPUT Room file candidates may have enough information for a SourceDocument root, but they do not yet have human-verified authors, year, citation text, structured bibliographic metadata, APA readiness, or source type confidence.

The first future save boundary should create only SourceDocument roots. SourceCard creation should require a separate explicit review step and should continue to validate that the linked SourceDocument exists.

## Parser, Classification, And AI Boundary

The future command must not parse files, classify files, create MarketingTags or KnowledgeCards, run WriterAgent, call ProviderAdapter, call AI/API/network code, verify APA, or infer citation metadata. It should persist only reviewed SourceDocument root metadata and fixed safety states such as `parser_status = not_started` or an equivalent explicit value.

If the current schema cannot represent metadata-only SourceDocuments without extraction rows, the future implementation should add a deliberate schema/command boundary rather than faking extraction segments or traces.

## Idempotency Expectation

The current SourceDocument save is idempotent by `source_documents.id`: repeat save upserts the root and replaces extraction children. The future intake-only command should define idempotency by deterministic `sourceDocumentId` or by a unique package/candidate pair.

Repeat approval of the same package candidate should not create duplicate SourceDocuments. It should return the existing saved SourceDocument as already saved/read-back verified, or update only fields that are explicitly safe to refresh.

## Audit And Read-Back Requirements

The future command needs an intake-specific audit trail. It should not overload metadata correction audit events unless those events are generalized first.

Recommended audit events:

- `intake_source_document_save_requested`
- `intake_source_document_candidate_blocked`
- `intake_source_document_save_started`
- `intake_source_document_saved`
- `intake_source_document_read_back_verified`
- `intake_source_card_deferred`
- `intake_source_document_save_failed`

Every successful candidate save must be read back before the UI marks it complete. Read-back should verify:

- SourceDocument id
- title
- file name
- file type
- local path policy/reference
- metadata status
- parser status remains not started
- review status
- created-from package/candidate provenance
- no SourceCard was created

## Rollback And Failure Behavior

Use a transaction boundary that is easy to explain in the UI. For the first implementation, prefer per-candidate transactions if the UI shows a clear receipt for partial success. Prefer whole-package transaction only if the UI cannot explain partial success.

Failure behavior must guarantee:

- unsupported candidates are blocked before save starts
- rejected candidates do not create rows
- failed candidates return blockers
- no SourceCard, KnowledgeCard, MarketingTag, or DraftArtifact rows are created
- audit events expose started, failed, and read-back states
- retry is safe and idempotent

## Future QA Plan

Required backend tests:

- reject unsupported candidate file type
- reject missing title
- reject missing file name
- reject missing explicit approval
- reject candidate whose safety flags imply parser/classification/AI/SourceCard work
- accept approved PDF SourceDocument candidate
- accept approved DOCX SourceDocument candidate
- repeat approved save is idempotent
- read-back verification succeeds after save
- failure path does not partially create SourceCard, KnowledgeCard, MarketingTag, or DraftArtifact records
- failed read-back returns failed status and audit event

Required frontend QA:

- preview candidate remains safe until explicit save
- disabled/future action does not invoke Tauri
- explicit future save action is unavailable for blocked candidates
- unsupported candidate displays blocked state
- PDF/DOCX ready candidates show SourceDocument-only save scope
- receipt shows read-back verified state
- receipt confirms SourceCard deferred

## Non-Goals

- No new Rust command in 4N-1.
- No existing Rust command changes.
- No SQLite schema or migration change.
- No SourceDocument creation.
- No SourceCard creation.
- No Source Library state mutation.
- No route/state transfer from INPUT Room.
- No parser, classifier, provider, AI/API, citation, APA, DOCX export, MarketingTag, KnowledgeCard, or DraftArtifact work.
- No dependency or lockfile changes.

## Risks

- Reusing `save_source_document_candidate` could imply extracted content exists when it does not.
- Creating placeholder extraction rows would weaken evidence provenance.
- Creating SourceCards too early could fabricate or freeze incomplete citation metadata.
- A package-level save without clear per-candidate receipt could hide partial failures.
- Reusing metadata correction audit tables could blur audit semantics.
- Allowing MD in the intake command would exceed the 4N candidate preview scope.

## Recommended Next Sprint

Sprint 4N-2 should design the exact intake SourceDocument root schema or dry-run command needed for metadata-only SourceDocument creation. If implementation starts, begin with a backend dry-run/preflight command that validates the proposed payload and returns blockers, warnings, audit preview, and read-back plan without writing rows.
