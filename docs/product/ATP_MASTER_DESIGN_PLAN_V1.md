# ATP Knowledge Studio Master Design Plan V1

## 1. Executive Summary

ATP Knowledge Studio is an AI-assisted Personal Academic Library and Writer's Brain for marketing academic work, textbook production, teaching materials, literature reviews, article drafting, and visual academic outputs.

The main daily work is building a trusted knowledge base, not writing every day. The product should make it natural to feed the library with source material, let the AI Librarian organize provisional knowledge, review only items that need attention, and retrieve knowledge later for writing, teaching, and visual production.

The AI Librarian is the central assistant metaphor. It should help the user decide what to review, what is safe to trust, what remains blocked, and what can be carried forward into writing or teaching work. Parser Bot, Metadata Detective, Citation Clerk, and similar roles are supporting metaphors, not competing product centers.

The app should feel like a living 8-bit isometric academic library/studio, not a dense control-room dashboard. Pixel art is an ambience and wayfinding metaphor. It is not the mission, and it must not reduce readability or academic seriousness.

Workflow value comes before visual polish. The 8-bit / 90s pixel academic studio identity should make the product memorable and pleasant, but the primary value is source intake, verification, retrieval, and citation-safe writing support.

The backend remains rigorous: source-first, citation-safe, traceable, reversible, reviewable. Any automation must preserve provenance, human review boundaries, and safe correction/reversal paths.

## 2. Product North Star

Feed the library every day. Let the AI Librarian organize knowledge. Review only what needs attention. Use the Cabinet to understand and retrieve knowledge. Ask the Writer to produce chapters, articles, literature reviews, teaching notes, and outputs when needed.

## 2.1 Main User Job

The user's main job is to build and verify a trusted academic knowledge base.

Writing and export are output stages. They matter, but they should not dominate the product architecture. Library is the core daily workspace for adding sources, reviewing queue state, verifying SourceDocuments, confirming metadata readiness, and preserving provenance before downstream use.

The app should optimize this loop:

- add or select source files
- review what can enter the queue
- resolve duplicate, unsupported, or needs-review items
- confirm safe intake actions
- verify saved SourceDocument state
- defer SourceCard, citation, parser, classification, and writing work until their own gates are ready

## 2.2 Current Product Truth Through 4O-1

The current implemented workflow is narrower than the future vision, and the master plan must keep that distinction clear.

Currently real:

- Historical INPUT/local intake preview exists and is now understood as Library Add sources mode.
- Intake queue review states exist: supported/ready, needs review, and unsupported/blocked.
- Historical INPUT-to-Source-Library handoff preview exists as a local preview and should be renamed/reframed in future UI work.
- Source Library incoming package preview exists.
- SourceDocument save candidate preview exists.
- Explicit SourceDocument-only save command exists.
- Intake SourceDocument audit events exist.
- Explicit SourceDocument save UI gate exists.
- Post-write hardening exists, including repeated-click guard and idempotent `already_exists` receipt behavior.
- Saved SourceDocument verification UX exists with read-back and audit id visibility.
- Read-only Saved SourceDocuments list/read panel exists.

Currently not real:

- No SourceCard auto-creation from intake.
- No parser auto-run from Library Add sources mode.
- No classification auto-run.
- No AI/API/provider call from the Library intake/save path.
- No APA or citation finalization from intake.
- No Writer auto-generation from intake.
- No full intake audit browser yet.
- No duplicate/similarity detection yet.

## 2.3 4Q-0 Auditor-Aligned Frontstage IA Checkpoint

Sprint 4Q-0 accepts the external audit direction that ATP must feel like a
personal academic knowledge studio / AI research office, not a backend console.
The current backend trust work remains essential, but the frontstage IA must
translate that rigor into calmer academic workflow.

The accepted frontstage room model is:

- Home
- Library
- Cabinet
- Writer
- Art
- Settings

INPUT is no longer a top-level frontstage room name. Intake lives inside
Library. Library is the source intake and saved SourceDocument review desk.
The Home AI Librarian Desk may shortcut into Library, preferably with Library
opened in Add sources mode.

The accepted post-audit implementation sequence is:

1. 4Q-1A Navigation & Topbar Simplification
2. 4Q-1B Shared Inspector Shell
3. 4Q-1C Library Review Desk Simplification
4. 4Q-2 Writer Workspace Simplification
5. 4Q-3 Mock/Real Data Cleanup and Dashboard/placeholder clarity

The Inspector shell must come before the Library review desk redesign so
backend/audit/status panels have a consistent disclosure destination before
they are removed from the default frontstage.

Shared Inspector decision:

- Use a right-side collapsible drawer/panel, not a modal.
- Collapsed width: 40px icon rail.
- Open width: 240-280px, default target 260px.
- Parent controls collapsed/open state.
- Triggered by Inspect or View audit details.
- If open and the selected source changes, keep the Inspector open and update
  its content.
- Use it for audit ids, read-back detail, backend command detail, metadata
  review records, safety flags, provider details, and developer diagnostics.
- Organize details into clear sections rather than showing an unstructured
  backend dump.

Library badge rule:

- Use one primary badge only.
- Severity hierarchy: Blocked > Needs review > Saved.
- Show the highest-severity unresolved state as the primary badge.
- Show one quiet secondary detail line, for example:
  "Read-back verified - SourceCard not created - Citation not verified".
- Do not show all states as equal badges.
- Do not derive citation-ready, APA-final, or SourceCard-ready from UI state.

5-second test acceptance:

- Which room am I in?
- What should I do next?
- Is anything blocked or risky?
- Where do I find more detail?

Future UI sprints should test at least Library empty state, Library with a
selected source, Writer empty/no draft state, and Writer with draft generated.

This checkpoint does not change runtime behavior. Existing SourceDocument-only
save gates, audit events, read-back verification, idempotency, SourceCard
creation boundary, citation-ready boundary, APA-final boundary,
parser/classification/AI/provider gates, no hidden mutation, no auto-save
without explicit approval, and no fabricated citation metadata remain active.

## 3. Core Room Model

ATP frontstage has six visible destinations:

- Home
- Library
- Cabinet
- Writer
- Art
- Settings

Each room is a user-facing academic workspace. Backend roles, provider stages, parser internals, audit data, and raw technical evidence must stay behind disclosure unless the user is actively inspecting them.

INPUT is no longer a top-level frontstage room name. Intake is an internal
Library mode. Existing INPUT requirements remain useful as Library Add sources
requirements until future implementation updates the naming throughout the
product.

### Home

Purpose: Orient the user and point them to the right room or next action.

Primary user task: Understand what needs attention now, where to enter, and
whether anything is blocked or risky.

Visible by default:

- ATP Studio wordmark and calm room identity
- next action / today's work strip
- room cards for Library, Cabinet, Writer, and Art
- AI Librarian Desk shortcut into Library Add sources mode
- simple Ready / Needs review / Blocked summary

Hidden or collapsed:

- provider/debug panels
- full audit logs
- backend command state
- workflow boards
- agent status rails

### Library Add Sources Mode

Purpose: Capture source material and start trusted library-building.

Primary user task: Add files, give optional processing guidance, review the queue before processing, choose Quick Intake or Guided Batch Intake, and receive a clear next-step or processing receipt.

Visible by default:

- Multi-file drop or browse/select from folder
- Optional AI instruction field
- File list before processing
- Quick Intake state when no instruction is supplied
- Guided Batch Intake state when the user supplies AI Librarian guidance
- Supported / needs review / blocked queue groups
- Duplicate/similarity warning summary when this future capability is implemented
- Confirm queue action
- Processing receipt after completion
- Green/orange/red summary counts
- AI Librarian alert for items needing attention

Hidden or collapsed:

- Parser internals
- Provider evidence
- Raw metadata snapshots
- Audit logs
- Per-agent/backend progress panels
- Long technical workflow paths

Allowed ambient characters:

- AI Librarian
- Parser Bot
- Tag Clerk
- Metadata Detective / Review Scout

Status colors:

- Green: captured as provisional and no immediate action needed
- Orange: captured but review recommended
- Red: blocked/problem; human action required before use

Good UI copy:

- "Review file list before queue"
- "Quick Intake"
- "Guided Batch Intake"
- "3 sources captured, 1 needs review"
- "Possible duplicate found: compare before deciding"
- "AI Librarian found metadata that needs attention"
- "Processing receipt ready"

Must not be shown by default:

- Provider cards
- JSON/raw snapshots
- Backend command names
- Long parser progress boards
- Agent status rails

### Library Saved Sources Review Desk

Purpose: Receive, review, verify, and control source records before they become writing inputs.

Library is the receiving and control room between Add sources mode and Cabinet. It receives or previews intake packages, handles SourceDocument verification, manages metadata review readiness, protects SourceCard readiness, and later prepares citation-safe inputs for CABINET and WRITER.

Current real capabilities:

- Incoming package preview
- SourceDocument save candidate preview
- Explicit SourceDocument-only save gate
- Audit/read-back save result
- Saved SourceDocument verification receipt
- Read-only Saved SourceDocuments list/read panel
- SourceCard metadata review gate preview
- SourceCard metadata completion preview
- SourceCard metadata review backend status panel
- Disabled SourceCard metadata editing shell

Visible by default:

- Incoming package readiness summary
- SourceDocument-only boundary copy
- Candidate readiness and exclusion counts
- Explicit approval controls when a save is available
- Read-back and audit receipt after save
- Read-only saved SourceDocument list/read panel
- SourceCard deferred copy
- SourceCard metadata review preview/status surfaces after selecting a saved SourceDocument

Hidden or collapsed:

- Full audit event browser
- Parser internals
- Classification internals
- Provider/debug state
- Raw SQLite details
- SourceCard metadata internals until a saved SourceDocument is selected

#### SourceCard Metadata Review Direction

The SourceDocument-to-SourceCard path is now gated through metadata review. The
SourceCard metadata review backend exists, including schema, commands, bridge,
validation, audit, read-back, and downstream protection. Source Library UI
currently shows preview/status/disabled-shell surfaces only: review gate
preview, completion preview, backend status panel, and disabled metadata editing
shell.

Active metadata editing and UI metadata save are intentionally not enabled yet.
SourceCard creation remains deferred. Citation-ready and APA-final states
require separate human verification and must not be implied by SourceDocument
root data, backend command existence, or preview panels.

The next safe product direction is a read-only metadata review record inspector
or a disabled metadata save UI preflight before any active metadata editing or
save command wiring.

Good UI copy:

- "SourceDocument-only save"
- "SourceCard remains deferred"
- "Read-back verified"
- "Audit events written"
- "Read-only saved SourceDocument record"
- "SourceCard is not created by this intake path"

Must not be shown or implied by default:

- SourceCard creation as a side effect of intake save
- Citation metadata as final
- APA-final readiness
- Parser/classifier/AI/provider follow-up after intake save
- Dense backend console panels

### CABINET Room

Purpose: Browse, search, understand, and retrieve organized knowledge.

Primary user task: Find concepts, inspect relationships, retrieve evidence bundles, and trace claims back to original sources.

Visible by default:

- Search bar with autocomplete
- Top 10 high-volume concept/tag cabinets
- Trust color filters
- Source type and knowledge unit filters
- Relationship map for selected concept
- Evidence by claim
- Source trace links

Hidden or collapsed:

- Raw embedding/debug detail
- Provider cross-check detail
- Full source metadata tables
- Graph algorithm controls
- Audit trails

Allowed ambient characters:

- Vault Librarian
- Graph Curator
- Citation Clerk
- Search Assistant

Status colors:

- Green: source trace and confidence are strong enough for normal retrieval
- Orange: useful but needs review before formal citation or high-stakes use
- Red: blocked, conflicting, insufficiently sourced, or not safe to use

Good UI copy:

- "Search your Writer's Brain"
- "Top concept cabinets"
- "Open relationship map"
- "Evidence bundle ready"
- "Trace this claim to source"

Must not be shown by default:

- Provider/debug panels
- Dense database tables
- Full technical graph metrics
- Unsourced generated claims

### WRITER Room

Purpose: Request academic writing outputs using trusted library material.

Primary user task: Ask for a chapter, article, literature review, teaching note, or revision; select source/tag context; review output readiness; export DOCX/PDF.

Visible by default:

- Chat/input-first writing request
- Output type chips: Chapter, Article, Literature Review, Teaching Note, Revision
- Optional tag/topic picker from CABINET
- Citation strictness mode
- Recent drafts/output queue
- Export readiness
- Revision instruction field

Hidden or collapsed:

- Full retrieval package internals
- Raw prompt packages
- Citation trace detail until requested
- Export internals
- Provider/backend debug detail

Allowed ambient characters:

- Chapter Planner
- Evidence Synthesizer
- AI Writer
- Citation Guard / Export Clerk

Status colors:

- Green: evidence-backed and ready for normal review/export
- Orange: moderate synthesis or needs user review
- Red: weak/speculative/problem claim or export blocker

Good UI copy:

- "Ask the Writer"
- "Select output type"
- "Use Cabinet tags"
- "Citation strictness: standard"
- "Export review ready"
- "Revision instruction"

Must not be shown by default:

- In-app Word processor UI
- Long technical generation stages
- Provider logs
- Debug prompts
- Claims without citation status

### ART Room

Purpose: Create or prepare visuals for writing outputs and teaching materials.

Primary user task: Review Writer-suggested visual assets, add manual requests, choose template/style direction, confirm image generation, and manage output files.

Visible by default:

- Writer-generated asset queue
- Manual visual request field
- Template chips
- Mood-and-tone note
- User confirmation before generation
- File naming preview
- One image per output file

Hidden or collapsed:

- Prompt internals
- Provider detail
- Raw generation settings
- Debug states
- Multi-image canvas layouts

Allowed ambient characters:

- Visual Director
- Infographic Artist
- Slide Builder
- Teaching Material Designer

Status colors:

- Green: visual request is ready or output accepted
- Orange: draft visual needs review/revision
- Red: missing confirmation, unsafe prompt, or generation problem

Good UI copy:

- "Suggested visuals from Writer"
- "Confirm before generation"
- "Generate 5 chapter visuals"
- "One image per file"
- "Add mood and tone note"

Must not be shown by default:

- Automatic image generation without confirmation
- Multiple images in one canvas
- Raw provider state
- Backend logs

## 4. Dashboard Design Doctrine

ATP is desktop-first for a MacBook Pro 16 inch landscape layout. It is not mobile-first.

The Dashboard is now Home: an orientation room and calm entry point into the
frontstage rooms. The earlier intake-dominant direction is refined into a
Library-first intake shortcut. Intake and library-building still represent the
largest daily workflow, but INPUT is not a top-level frontstage room name.
Home may emphasize an AI Librarian Desk or primary Library shortcut that opens
Library in Add sources mode. Cabinet, Writer, and Art remain visible as room
cards or stations.

The 8-bit isometric pixel-art style is used as visual metaphor and ambience, not as a data-dense monitoring board. The dashboard should look like a living academic library/studio where work is happening, not a technical process dashboard.

Dashboard metrics are minimal by default:

- Sources added today/recently
- Items needing review
- Cabinet growth summary
- Writer output queue badge
- Art asset queue badge

Details appear by disclosure. Backend roles should not be exposed as technical panels. Room-level status is enough.

The preferred reference direction is the earlier Option B concept reframed as a Library-first virtual academic Home, not a vertical/mobile dashboard.

## 5. Visual Style Direction

The visual style should be a 90s isometric 8-bit / 16-bit pixel art virtual academic office:

- dark but warm academic library mood
- cozy, productive, serious, and delightful
- dark navy / deep ink base
- warm library light, teal-blue digital accents, golden review accents
- readable typography
- pixel art used for room ambience and status cues
- desktop landscape composition
- green/orange/red trust system

Characters are ambient role characters, not process dashboards. Pixel art should never reduce readability or make academic material feel childish. The product should feel like a serious research and writing studio with a distinctive visual soul.

## 5.1 UX Principles

The main screen should feel useful, calm, and pleasant, not like a backend console.

UX rules:

- Avoid dense panels by default.
- Use progressive disclosure.
- Show only what the user must decide or check now.
- Summarize routine trustworthy work.
- Make risky or blocked work inspectable.
- Keep technical details behind deliberate user action.
- Let visual polish support clarity, not outrank the main workflow.
- Use pixel style for wayfinding, room identity, and status atmosphere, not clutter.

The 5-second test matters more than decorative completeness: the user should know where they are, what can be done now, what needs attention, what has been saved, and where to go next.

## 6. Ambient Character Doctrine

Characters are visual workers, not UI panels.

Multiple characters per room are allowed. Characters may have short labels or role tags, but they should not expose per-agent backend logs, progress bars, JSON, provider state, or technical stages by default.

Room-level status is enough for the default dashboard:

- Library Add sources mode: AI Librarian, Parser Bot, Tag Clerk, Metadata Detective / Review Scout
- CABINET: Vault Librarian, Graph Curator, Citation Clerk, Search Assistant
- WRITER: Chapter Planner, Evidence Synthesizer, AI Writer, Citation Guard / Export Clerk
- ART: Visual Director, Infographic Artist, Slide Builder, Teaching Material Designer

Characters should communicate ambience, task ownership, and status. They should not become a control-room monitoring system.

## 7. Trust + Action Color System

Use trust/action colors consistently across the app:

- Green = safe enough for the current step / ready / no immediate action
- Orange = useful but needs human review before higher-stakes use
- Red = blocked / unsafe / human action required before use

Apply these colors across:

- input processing
- knowledge units
- citation/metadata checks
- writer claims
- export review
- art/assets

Green does not mean final truth. Orange does not mean unusable. Red means the app should not let the user rely on the item until the problem is reviewed or resolved.

Trust state should govern both automation visibility and user attention. Work that is automatic and trustworthy should be summarized calmly. Risky or uncertain work must be inspectable, reviewable, and blocked from downstream use until the user resolves it.

## 7.1 Automation And Mutation Principles

ATP should automate where the system is reliable and ask for human approval where the action is risky.

Core rules:

- Auto where reliable.
- Human approval where risky.
- Audit trail always.
- No hidden mutation.
- No direct AI/provider-to-persistence overwrite.
- No fabricated citation metadata.
- No APA-final state without explicit human verification.
- Provisional and reversible states before final states.

AI and provider outputs are evidence candidates, not truth. They may suggest metadata, tags, classifications, or writing material, but persistence should pass through explicit review boundaries, audit trails, and read-back verification when it mutates important records.

## 8. Library Add Sources Mode Product Requirements

Library Add sources mode must support:

- multi-file drop
- browse/select from folder
- optional AI instruction field
- quick no-text intake
- guided batch intake
- file list review before queue
- duplicate/similarity check before processing
- user confirmation before entering queue
- supported / needs review / blocked queue states
- no automatic processing immediately after file selection

Current intake/Add sources state:

- File selection/drop preview exists.
- Optional AI Librarian instruction exists.
- Quick Intake and Guided Batch Intake states are derived from whether instructions are present.
- Queue review states exist.
- Historical INPUT-to-Source-Library handoff preview exists and should be reframed as Add sources-to-saved-source review flow in future UI work.
- Add sources preview remains local/client-state only and does not parse, save, classify, call AI, call providers, or transfer state automatically.

Duplicate handling:

- This remains future work.
- The user may have many overlapping PDFs/DOCX files, so duplicate imports and near-duplicate imports are major risks.
- Future intake should check duplicate or high-similarity documents before processing.
- Example future UX: "85% content similarity".
- Skip this file
- Compare before deciding
- If compare, final choices are Confirm Import or Reject

No automatic start immediately after file selection. No automatic processing without review.

After processing, show a processing receipt:

- inputs processed
- knowledge units created
- green/orange/red counts
- cabinet distribution
- source traceability

Orange/red alert behavior:

- no blocking modal
- AI Librarian visual alert
- review card or badge

Review flow:

- grouped summary first
- then batch review or one-by-one review

Library Add sources mode should feel fast and calm: "drop sources, review the queue, confirm, receive receipt, handle exceptions."

## 9. Provisional Auto-Save Knowledge Model

Target architecture direction:

High-confidence knowledge units should eventually be auto-saved as provisional, inspectable, reversible records.

This is not currently implemented as a final persistence model. It is the intended direction.

Save does not mean final truth. Save means captured with:

- status
- confidence
- source trace
- review state
- reversibility

Orange may be saved but pending review. Red should not be trusted or used until human action. The app should support automatic capture where safe, but every important record must remain traceable, inspectable, and reversible.

## 10. CABINET Room Product Requirements

CABINET must support:

- search-first knowledge retrieval
- concept cabinet browsing
- top 10 high-volume concept/tag cabinets by default
- autocomplete suggestions
- source type filters
- knowledge unit type filters
- trust color filters
- date added filters
- citation status filters
- project/use filters

Example autocomplete:

Typing "Customer..." suggests:

- Customer Experience
- Customer Journey
- Customer Trust

Concept cabinets should be organized by Topic/Concept + Knowledge Unit Type.

Opening a concept cabinet should show the relationship map first. Example Trust cabinet:

- Trust -> Satisfaction
- Trust -> Purchase Intention
- Trust -> Word of Mouth
- Trust -> Lower Cognitive Load
- Trust -> Perceived Value
- Trust -> Retention / lower acquisition cost

CABINET must support:

- evidence by claim
- source trace back to original paper/input
- editing, retagging, and correction later

## 11. Knowledge Graph / Writer's Brain Model

ATP is not an Obsidian clone, but it should learn from Obsidian-style linked knowledge.

ATP adds:

- academic source traceability
- citation integrity
- metadata verification
- AI classification
- evidence-to-writing pipeline

Relation priority:

1. Academic relations: supports, contradicts, extends, critiques, measures
2. Marketing logic relations: driver/outcome, cause/effect, segment/context, brand action/customer response
3. Writing relations: definition, example, evidence, counterpoint, teaching hook

Retrieval flow:

1. Knowledge map
2. Evidence bundle
3. Writing brief

The Writer's Brain should help the user reason from sources to claims to outputs, not merely store notes.

## 12. WRITER Room Product Requirements

WRITER must be chat/input-first.

Default output type chips:

- Chapter
- Article
- Literature Review
- Teaching Note
- Revision

WRITER should support:

- optional tag/topic picker from CABINET
- recent drafts/output queue
- citation strictness defaults by output type
- user override of citation strictness
- DOCX/PDF export
- revision instructions from external edits

AI Writer should not be an in-app Word processor. The user edits exported DOCX/PDF in Microsoft Word or another external editor.

Revision example:

"Page 7 lines 12-15 are weak; rewrite with stronger reasoning and add examples/citations."

Citation strictness:

- textbook: standard/light citation may be acceptable
- research article/literature review: strict citation
- teaching note: evidence-aware but may be less citation-dense

DOCX review outputs may include font-color cues:

- green = direct support
- orange = moderate synthesis/review
- red = weak/speculative/problem

Final clean export may be a later separate mode.

## 13. ART Room Product Requirements

ART starts from the Writer-generated asset queue, then supports manual requests.

ART must include:

- Writer-generated asset queue
- manual request field
- template chips
- mood-and-tone note
- user confirmation before image generation

Default suggestion:

- 3-5 visuals per chapter/article
- often 5 visuals

Generation rule:

- Generate one image per file.
- Never generate multiple images in one canvas by default.

File naming:

- `article_or_chapter_title_01`
- `article_or_chapter_title_02`
- `article_or_chapter_title_03`
- `article_or_chapter_title_04`
- `article_or_chapter_title_05`

Default visual style:

- realistic textbook/book illustration
- warm natural light
- natural beautiful color
- Asian people
- diverse genders and ages
- emphasis on teenagers and working-age adults more than elderly
- friendly service scenes
- product shots showing real usage behavior

The user can add an extra mood-and-tone note before generation.

## 14. OUTPUT Model

There is no separate Output/Printer room for now.

Dashboard shows Writer output readiness with a badge or green room signal.

Actual reading, download, export, and revision workflow lives in the WRITER Room output queue.

Export DOCX/PDF from WRITER Room. ART receives an optional suggested visual queue from Writer.

## 15. Backend Implications

Future backend/data needs:

- batch intake jobs
- duplicate/similarity detection
- file hash
- file metadata
- content fingerprint
- SourceDocument traceability
- segment/knowledge unit model
- provisional auto-save status
- confidence routing green/orange/red
- review basket persistence
- reversible history / undo
- citation metadata verification
- external provider cross-checking
- Knowledge Graph relations
- retrieval packages for Writer
- DOCX export with review-color annotations

Backend development should continue to prioritize source integrity, citation safety, reviewability, and reversal before expanding automatic apply/save behavior.

Current SourceDocument saved-state boundary:

- SourceDocument-only intake save exists.
- Explicit approval is required.
- No auto-save exists.
- Intake audit events are required.
- Read-back verification is required.
- Saved SourceDocument list/read panel exists.
- SourceCard remains deferred.

SourceCard deferred principle:

- SourceCard must not be auto-created from intake unless metadata review is ready.
- SourceCard requires stricter bibliographic and citation readiness than SourceDocument root save.
- Citation metadata must not be fabricated.
- APA-final readiness must never be implied automatically.
- SourceCard creation should have its own metadata review gate, blockers, warnings, audit trail, and read-back receipt.
- The SourceCard metadata review backend and preview layers exist, but active UI metadata save and SourceCard creation remain deferred.

The saved SourceDocument root is not a complete citation-ready academic source. It is a verified local vault root record that can later support metadata review, parser work, SourceCard readiness, and writing inputs behind explicit boundaries.

## 16. Immediate Roadmap Recommendation

Do not push the current 4L-0 visual experiment as the product foundation. Treat it as an archived reference experiment.

Accepted post-audit 4Q sequence:

A. 4Q-1A Navigation & Topbar Simplification.

B. 4Q-1B Shared Inspector Shell.

C. 4Q-1C Library Review Desk Simplification.

D. 4Q-2 Writer Workspace Simplification.

E. 4Q-3 Mock/Real Data Cleanup and Dashboard/placeholder clarity.

The Inspector shell must come before the Library review desk redesign so
backend/audit/status panels have a consistent disclosure destination.

Longer-term boundary sequence:

F. Continue saved SourceDocument verification/read UX.

G. Add SourceDocument detail + audit trace view.

H. Inspect or preflight SourceCard metadata review records without enabling active metadata save.

I. Connect parser boundary only after SourceDocument detail/audit visibility is clear.

J. Connect classification only after parser state and SourceCard readiness boundaries are explicit.

K. Expand CABINET room retrieval after source trace, metadata readiness, and trust states are stable.

L. Expand WRITER room only after retrieval packages can distinguish verified evidence from provisional or review-needed material.

M. Expand ART room from Writer-suggested visual queues after writing outputs are stable.

Do not jump directly from SourceDocument save to SourceCard creation, parser auto-run, classification auto-run, or AI automation. The product should earn automation one boundary at a time.

## 17. Guardrails

Preserve:

- source-first workflow
- citation-safe behavior
- no `citationText` overwrite
- no APA-final automatic verification
- provider evidence is not truth
- explicit human review for uncertain/critical records
- audit trail before apply
- reversibility before expanding auto-save/apply
- no live network/provider/API expansion unless scoped
- no UI that makes preview look final
- no SourceCard auto-creation from intake
- no parser/classification/AI/provider follow-up from intake save
- no hidden persistence mutation
- no auto-save without explicit user intent
- no dense debug console as the primary Source Library experience

## 17.1 Explicit Non-Goals / Not Yet Implemented

The master plan must not imply these are currently implemented:

- No SourceCard auto-creation.
- No parser auto-run from Library Add sources mode.
- No classification auto-run.
- No AI/API/provider call from the Library intake/save path.
- No APA/citation finalization from intake.
- No Writer auto-generation from intake.
- No full intake audit browser yet.
- No duplicate/similarity detection yet.
- No active SourceCard metadata editing UI yet.
- No active metadata review save from UI yet.
- No SourceCard creation boundary yet.

## 18. Open Questions / Later Decisions

Non-blocking future questions:

- exact threshold for green/orange/red similarity/confidence
- exact visual tokens/colors
- exact graph layout
- exact DOCX color style convention
- exact asset template library
- Obsidian export/integration strategy

These are not blockers for the Master Design Plan or the next IA reset.

## 19. Implementation Acceptance Criteria

Future UI must pass the 5-second test:

- Where am I?
- What can I do now?
- What needs my attention?
- What has been saved/organized?
- Where do I go to write or inspect?

Future dashboard must avoid:

- provider cards in main default view
- workflow board in main default view
- agent status rail in main default view
- 17-step technical path in main default view
- mock/debug/audit panels as primary content

Acceptance requires that a user can understand the current room, current action, trust status, and next destination without reading technical process detail.
