# ATP Current Screen Walkthrough 4P-11X

## Screenshot Evidence

Screenshots were captured at `1280x720` in `docs/audit/screenshots/4P11X/`.
Chromium screenshot capture required elevated permission because the sandboxed
run hit the known macOS Chromium Mach-service permission blocker.

| Screen | Route/Menu Item | Screenshot | Current Status | What The User Sees / Can Do |
| --- | --- | --- | --- | --- |
| Dashboard | Dashboard | `screenshots/4P11X/dashboard.png` | Real shell with mock status data | A clearer 4-room frontstage: INPUT, CABINET, WRITER, ART. User can open room cards and system details. |
| Source Library | Source Library | `screenshots/4P11X/source-library.png` | Mixed real, preview, disabled, and mock | Dense intake/review cockpit. User can inspect local parser readiness, QA previews, mock provider panels, and SourceDocument-only save gate. |
| Source Library saved SourceDocument inspector | Source Library QA state | `screenshots/4P11X/source-library-saved-sourcedocument-inspector.png` | Real SourceDocument read panel with read-only SourceCard metadata review inspector | User can see read-back/audit state and no-record metadata review inspector. |
| Workflow Board | Workflow Board | `screenshots/4P11X/workflow-board.png` | Mock/Sprint 0 module | User sees workflow board with mock tasks and agent context. |
| Knowledge Brain | Knowledge Brain | `screenshots/4P11X/knowledge-brain.png` | Placeholder/mock | User sees placeholder copy, mock agent cards, and virtual office preview. |
| Writer Studio | Writer Studio | `screenshots/4P11X/writer-studio.png` | Mock writer surface | User can choose a mock chapter/section and generate a mock draft using local mock provider. |
| Slide Studio | Slide Studio | `screenshots/4P11X/slide-studio.png` | Placeholder/mock | User sees placeholder copy, mock agent cards, and virtual office preview. |
| Visual Studio | Visual Studio | `screenshots/4P11X/visual-studio.png` | Placeholder/mock | User sees placeholder copy and mock virtual office. |
| Obsidian Vault | Obsidian Vault | `screenshots/4P11X/obsidian-vault.png` | Placeholder/mock | User sees placeholder copy and mock virtual office. No real Obsidian integration is visible. |
| Audit Log | Audit Log | `screenshots/4P11X/audit-log.png` | Placeholder/mock | User sees placeholder copy and mock virtual office. Not a full audit browser. |
| Settings | Settings | `screenshots/4P11X/settings.png` | Placeholder/mock | User sees placeholder copy and mock virtual office. |

## What Users Can Actually Do Today

### 1. Dashboard

The Dashboard communicates the app better than any other screen. It presents
ATP as a Personal Academic Library with four rooms:

- INPUT Room
- CABINET
- WRITER
- ART

The user can click room cards to navigate. The Dashboard also has collapsible
system details with diagnostics preview and workflow board information.

Status: real shell plus mock/sample data.

### 2. INPUT / Library Intake

In the INPUT-style local intake surface, the user can:

1. Drop files or browse/select local files.
2. Add optional AI Librarian instructions.
3. See local queue grouping: ready, needs review, unsupported.
4. Mark a local preview item as reviewed.
5. Prepare a local preview.
6. Preview a Source Library handoff package.

Current boundaries:

- This is local preview behavior.
- Unsupported files remain visible as review warnings.
- No parser, AI, classification, provider lookup, or persistence is triggered
  by the basic INPUT preview.

### 3. SourceDocument Save Path

In Source Library QA/current flow, a saved SourceDocument path exists:

1. The user reviews candidate readiness.
2. Only ready PDF/DOCX candidates are eligible.
3. The user must check explicit SourceDocument-only approval.
4. The user must check the safety acknowledgement that SourceCard, parser,
   classification, AI, and citation work remain disabled.
5. The save button creates SourceDocument root records only.
6. The result shows read-back status and audit event ids.
7. The saved SourceDocument list/read panel can inspect the selected root
   record.
8. The detail view shows intake audit trace and metadata readiness preview.

Current boundaries:

- Real SourceDocument root save/read/list/audit.
- No SourceCard is created.
- No extraction rows are created by this SourceDocument-only path.
- Citation and APA readiness are not finalized.

### 4. SourceCard Metadata Review Path

Current visible SourceCard metadata review surfaces:

1. Review gate preview.
2. Metadata completion preview.
3. Backend status panel.
4. Read-only metadata review record inspector.
5. Disabled metadata editing shell.

Current backend commands exist for save/get/list/audit list, but the UI only
uses read/list inspector functions. The UI does not call the save bridge.

Current boundaries:

- No active metadata editing UI.
- No active metadata save from UI.
- No active SourceCard creation.
- No citation-ready verification.
- No APA-final verification.

### 5. Writer Studio

Writer Studio currently shows:

- Chapter Builder left rail.
- Chapter topic selector.
- Seven-section structure list.
- Draft preview.
- Mock Provider panel.
- Structure validation.
- Citation guard and textbook chapter contract preview lower on the page.

The user can:

- Select a mock chapter topic.
- Select a section.
- Generate a mock draft through `MockProviderAdapter`.

Current boundaries:

- Mock provider only.
- No real OpenAI/Gemini/API call.
- No Writer path is triggered from SourceDocument intake.
- UI is visually busy and unclear about the first task.

### 6. Other Routes

Workflow Board uses mock workflow/task data. Knowledge Brain, Slide Studio,
Visual Studio, Obsidian Vault, Audit Log, and Settings are placeholder/mock
routes. They are useful for shell/navigation testing, not current production
workflows.

## UX Risk Notes

- Source Library mixes real persistence, preview-only gates, backend status,
  disabled shells, audit traces, and future affordances in one dense view.
- Writer Studio has a real mock generation interaction, but the screen lacks a
  single dominant writing task.
- Placeholder routes may look more complete than they are because they share
  the same polished shell.
