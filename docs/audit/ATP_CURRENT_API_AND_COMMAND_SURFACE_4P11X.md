# ATP Current API And Command Surface 4P-11X

## API Status

No public REST API endpoints are currently implemented. The app uses Tauri
commands and TypeScript bridge functions.

The command registry is in `src-tauri/src/lib.rs`. The main TypeScript bridge is
`src/lib/persistence/LocalVaultDatabase.ts`; document/file picker and parser
bridge helpers are in `src/lib/sources/LocalDocumentExtraction.ts` and
`src/lib/sources/LocalDocumentFilePicker.ts`.

## Command Table

| API Type | Method/Path | Command Name | Frontend Bridge | What It Does | Mutates Data? | Safety Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Tauri command | N/A | `initialize_vault_database` | `initializeVaultDatabase` | Opens/initializes local SQLite vault and applies migrations. | Yes, initializes DB/migrations | Real infrastructure |
| Tauri command | N/A | `select_local_document_file` | `selectLocalDocumentFile` | Opens local file picker for one supported document. | No DB mutation | Real local desktop picker |
| Tauri command | N/A | `select_local_document_files` | `selectLocalDocumentFiles` | Opens local file picker for multiple documents. | No DB mutation | Real local desktop picker |
| Tauri command | N/A | `inspect_local_document_file_path` | `inspectLocalDocumentFilePath` | Inspects local path metadata for a document path. | No DB mutation | Real local inspection |
| Tauri command | N/A | `extract_document_text_from_path` | Source helper | Extracts text from local document path. | No DB mutation | Real parser helper; not auto-run from current intake save |
| Tauri command | N/A | `parse_local_docx_file` | `parseLocalDocxFile` | Parses a local DOCX file. | No DB mutation | Real parser helper; Source Library still keeps parsing gated |
| Tauri command | N/A | `create_batch_research_intake_jobs` | `createBatchResearchIntakeJobs` | Creates batch intake job records for PDF/DOCX files. | Yes | Real/write-gated local queue |
| Tauri command | N/A | `list_batch_research_intake_jobs` | `listBatchResearchIntakeJobs` | Lists batch intake jobs. | No | Read-only |
| Tauri command | N/A | `create_mock_external_metadata_review_queue_for_intake_jobs` | `createMockExternalMetadataReviewQueueForIntakeJobs` | Creates mock metadata match/correction queue from intake jobs. | Yes | Mock provider queue; no live network |
| Tauri command | N/A | `create_crossref_fixture_metadata_review_queue_for_intake_jobs` | `createCrossrefFixtureMetadataReviewQueueForIntakeJobs` | Creates deterministic Crossref fixture queue from local fixtures. | Yes | Fixture/mock-style; no live Crossref network call |
| Tauri command | N/A | `list_suggested_metadata_corrections` | `listSuggestedMetadataCorrections` | Lists suggested metadata corrections. | No | Read-only |
| Tauri command | N/A | `update_suggested_metadata_correction_review_state` | `updateSuggestedMetadataCorrectionReviewState` | Updates review state for suggested correction. | Yes | Real review-state mutation |
| Tauri command | N/A | `create_metadata_correction_audit_event` | `createMetadataCorrectionAuditEvent` | Writes correction audit event. | Yes | Real audit write |
| Tauri command | N/A | `list_metadata_correction_audit_events` | `listMetadataCorrectionAuditEvents` | Lists correction audit events. | No | Read-only |
| Tauri command | N/A | `run_metadata_correction_apply_dry_run` | `runMetadataCorrectionApplyDryRun` | Runs preflight/dry-run for structured metadata correction. | No | Preview-only/dry-run |
| Tauri command | N/A | `apply_metadata_correction_to_structured_bibliographic_metadata` | `applyMetadataCorrectionToStructuredBibliographicMetadata` | Applies approved correction to structured metadata. | Yes | Real write-capable; gated by review/preflight |
| Tauri command | N/A | `save_source_document_candidate` | `saveSourceDocumentCandidate` | Saves SourceDocument with extraction children in older/legacy path. | Yes | Real but not current SourceDocument-only intake path |
| Tauri command | N/A | `save_intake_source_document_candidates` | `saveIntakeSourceDocumentCandidates` | Saves approved SourceDocument root records only. | Yes | Real/write-gated; SourceCard remains deferred |
| Tauri command | N/A | `list_intake_source_document_audit_events` | `listIntakeSourceDocumentAuditEvents` | Lists intake SourceDocument audit events. | No | Read-only |
| Tauri command | N/A | `list_saved_source_documents` | `listSavedSourceDocuments` | Lists saved SourceDocument roots. | No | Read-only |
| Tauri command | N/A | `read_saved_source_document` | `readSavedSourceDocument` | Reads SourceDocument detail including extraction rows. | No | Read-only |
| Tauri command | N/A | `read_saved_source_document_root` | `readSavedSourceDocumentRoot` | Reads SourceDocument root only. | No | Read-only; used by Source Library saved panel |
| Tauri command | N/A | `save_source_card_candidate` | `saveSourceCardCandidate` | Saves SourceCard linked to SourceDocument. | Yes | Real command, but not triggered by current intake path |
| Tauri command | N/A | `list_saved_source_cards` | `listSavedSourceCards` | Lists saved SourceCards. | No | Read-only |
| Tauri command | N/A | `read_saved_source_card` | `readSavedSourceCard` | Reads SourceCard detail. | No | Read-only |
| Tauri command | N/A | `update_source_card_metadata` | `updateSourceCardMetadata` | Updates compact SourceCard metadata fields. | Yes | Real write-capable; not part of current SourceDocument-only path |
| Tauri command | N/A | `upsert_source_card_bibliographic_metadata` | `upsertSourceCardBibliographicMetadata` | Inserts/updates structured bibliographic metadata. | Yes | Real write-capable; APA finality remains blocked |
| Tauri command | N/A | `get_source_card_bibliographic_metadata` | `getSourceCardBibliographicMetadata` | Reads structured bibliographic metadata. | No | Read-only |
| Tauri command | N/A | `save_source_card_apa_reference_review` | `saveSourceCardApaReferenceReview` | Saves APA reference review. | Yes | Real write-capable; final APA verification remains constrained |
| Tauri command | N/A | `get_source_card_apa_reference_review` | `getSourceCardApaReferenceReview` | Reads APA reference review. | No | Read-only |
| Tauri command | N/A | `save_sourcecard_metadata_review` | `saveSourceCardMetadataReview` | Saves SourceDocument-rooted metadata review record. | Yes | Backend real, but UI save is not wired; rejects unsafe citation/APA/SourceCard flags |
| Tauri command | N/A | `get_sourcecard_metadata_review` | `getSourceCardMetadataReview` | Reads one metadata review record by id. | No | Read-only; used by inspector |
| Tauri command | N/A | `list_sourcecard_metadata_reviews_for_source_document` | `listSourceCardMetadataReviewsForSourceDocument` | Lists metadata review records for SourceDocument. | No | Read-only; used by inspector/status panel |
| Tauri command | N/A | `list_sourcecard_metadata_review_audit_events` | `listSourceCardMetadataReviewAuditEvents` | Lists metadata review audit events. | No | Read-only; used by inspector/status panel |
| Tauri command | N/A | `save_marketing_tags_for_source_card` | `saveMarketingTagsForSourceCard` | Saves approved tags linked to SourceCard. | Yes | Real write-capable; not current intake path |
| Tauri command | N/A | `list_saved_marketing_tags` | `listSavedMarketingTags` | Lists marketing tags. | No | Read-only |
| Tauri command | N/A | `list_saved_tags_for_source_card` | `listSavedTagsForSourceCard` | Lists tags for SourceCard. | No | Read-only |
| Tauri command | N/A | `save_knowledge_cards_for_source_card` | `saveKnowledgeCardsForSourceCard` | Saves KnowledgeCards linked to SourceCard. | Yes | Real write-capable; not current intake path |
| Tauri command | N/A | `list_saved_knowledge_cards` | `listSavedKnowledgeCards` | Lists KnowledgeCards. | No | Read-only |
| Tauri command | N/A | `list_saved_knowledge_cards_for_source_card` | `listSavedKnowledgeCardsForSourceCard` | Lists KnowledgeCards for a SourceCard. | No | Read-only |
| Tauri command | N/A | `read_saved_knowledge_card` | `readSavedKnowledgeCard` | Reads KnowledgeCard detail. | No | Read-only |
| Tauri command | N/A | `save_draft_artifact_candidate` | `saveDraftArtifactCandidate` | Saves mock/not-final draft artifact. | Yes | Real write-capable mock artifact boundary |
| Tauri command | N/A | `list_saved_draft_artifacts` | `listSavedDraftArtifacts` | Lists draft artifacts. | No | Read-only |
| Tauri command | N/A | `list_saved_draft_artifacts_for_source_card` | `listSavedDraftArtifactsForSourceCard` | Lists draft artifacts for SourceCard. | No | Read-only |
| Tauri command | N/A | `read_saved_draft_artifact` | `readSavedDraftArtifact` | Reads draft artifact detail. | No | Read-only |
| Tauri command | N/A | `export_docx_from_draft_artifact_package` | Export helper | Exports DOCX from a draft artifact package. | Writes output file | Real export helper; not wired into current SourceDocument intake path |

## AI / LLM Provider Status

- No real OpenAI, Gemini, Crossref live API, or other network provider call is
  active in the current SourceDocument intake/save path.
- Writer Studio uses `MockProviderAdapter` and labels the output as mock/no API
  call.
- Source Library has mock external metadata and Crossref fixture providers for
  deterministic local evidence. The fixture path is not a live provider lookup.
- Parser/classification/provider/AI safety flags remain false in the
  SourceDocument-only save payload.
- `saveSourceCardMetadataReview` exists in the bridge and backend, but the UI
  does not call it.

## Real vs Preview vs Disabled

- Real: local SQLite initialization, SourceDocument root save/read/list,
  intake SourceDocument audit events, several downstream persistence commands.
- Read-only: saved SourceDocument read panel, metadata review inspector,
  metadata review list/audit list.
- Write-gated: SourceDocument-only intake save, structured metadata correction
  apply, SourceCard/KnowledgeCard/DraftArtifact saves in their own boundaries.
- Preview-only: Source Library readiness/gate/completion previews, dry runs,
  mock provider comparison surfaces.
- Disabled: active SourceCard metadata editing UI, UI metadata review save,
  SourceCard creation from SourceDocument intake, citation-ready verification,
  APA-final verification.
