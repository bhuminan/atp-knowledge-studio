# ATP Knowledge Studio Master Design Plan V1

## 1. Executive Summary

ATP Knowledge Studio is an AI-assisted Personal Academic Library and Writer's Brain for marketing academic work, textbook production, teaching materials, literature reviews, article drafting, and visual academic outputs.

The main daily work is building a trusted knowledge base, not writing every day. The product should make it natural to feed the library with source material, let the AI Librarian organize provisional knowledge, review only items that need attention, and retrieve knowledge later for writing, teaching, and visual production.

The app should feel like a living 8-bit isometric academic library/studio, not a dense control-room dashboard. Pixel art is an ambience and wayfinding metaphor. It is not the mission, and it must not reduce readability or academic seriousness.

The backend remains rigorous: source-first, citation-safe, traceable, reversible, reviewable. Any automation must preserve provenance, human review boundaries, and safe correction/reversal paths.

## 2. Product North Star

Feed the library every day. Let the AI Librarian organize knowledge. Review only what needs attention. Use the Cabinet to understand and retrieve knowledge. Ask the Writer to produce chapters, articles, literature reviews, teaching notes, and outputs when needed.

## 3. Core Room Model

ATP has four main rooms:

- INPUT Room
- CABINET Room
- WRITER Room
- ART Room

Each room is a user-facing academic workspace. Backend roles, provider stages, parser internals, audit data, and raw technical evidence must stay behind disclosure unless the user is actively inspecting them.

### INPUT Room

Purpose: Capture source material and start trusted library-building.

Primary user task: Add files, give optional processing guidance, review duplicates/similarity, confirm intake, and receive a processing receipt.

Visible by default:

- Multi-file drop or browse/select from folder
- Optional AI instruction field
- File list before processing
- Duplicate/similarity warning summary
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

The Dashboard should be an INPUT-dominant Virtual Library Home. INPUT is the largest/default room because 70-80% of daily usage is input/library-building. CABINET, WRITER, and ART appear as smaller room cards or stations.

The 8-bit isometric pixel-art style is used as visual metaphor and ambience, not as a data-dense monitoring board. The dashboard should look like a living academic library/studio where work is happening, not a technical process dashboard.

Dashboard metrics are minimal by default:

- Sources added today/recently
- Items needing review
- Cabinet growth summary
- Writer output queue badge
- Art asset queue badge

Details appear by disclosure. Backend roles should not be exposed as technical panels. Room-level status is enough.

The preferred reference direction is Option B / INPUT-dominant virtual library dashboard, not a vertical/mobile dashboard.

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

## 6. Ambient Character Doctrine

Characters are visual workers, not UI panels.

Multiple characters per room are allowed. Characters may have short labels or role tags, but they should not expose per-agent backend logs, progress bars, JSON, provider state, or technical stages by default.

Room-level status is enough for the default dashboard:

- INPUT: AI Librarian, Parser Bot, Tag Clerk, Metadata Detective / Review Scout
- CABINET: Vault Librarian, Graph Curator, Citation Clerk, Search Assistant
- WRITER: Chapter Planner, Evidence Synthesizer, AI Writer, Citation Guard / Export Clerk
- ART: Visual Director, Infographic Artist, Slide Builder, Teaching Material Designer

Characters should communicate ambience, task ownership, and status. They should not become a control-room monitoring system.

## 7. Trust + Action Color System

Use trust/action colors consistently across the app:

- Green = trusted enough / no immediate action / auto-saved provisional
- Orange = saved or generated but review recommended / needs review
- Red = problem / not trusted / human action required before use

Apply these colors across:

- input processing
- knowledge units
- citation/metadata checks
- writer claims
- export review
- art/assets

Green does not mean final truth. Orange does not mean unusable. Red means the app should not let the user rely on the item until the problem is reviewed or resolved.

## 8. INPUT Room Product Requirements

INPUT must support:

- multi-file drop
- browse/select from folder
- optional AI instruction field
- quick no-text intake
- guided batch intake
- file list review before queue
- duplicate/similarity check before processing
- user confirmation before entering queue

Duplicate handling:

- Skip this file
- Compare before deciding
- If compare, final choices are Confirm Import or Reject

No automatic start immediately after file selection.

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

The INPUT Room should feel fast and calm: "drop sources, review the queue, confirm, receive receipt, handle exceptions."

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

## 16. Immediate Roadmap Recommendation

Do not push the current 4L-0 visual experiment as the product foundation. Treat it as an archived reference experiment.

Recommended sequence:

A. Documentation checkpoint: this Master Design Plan

B. Frontend IA reset: Dashboard shell based on INPUT-dominant Virtual Library Home

C. INPUT Room minimal working UX: multi-file list review + optional instruction + duplicate warning placeholder + queue receipt

D. Backend safety: structured metadata reversal/undo

E. Backend data model: provisional knowledge units and review baskets

F. CABINET room: search + top concepts + relationship-map preview

G. WRITER room: chat-first request + output queue + citation strictness mode

H. ART room: suggested asset queue + confirmation flow

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
