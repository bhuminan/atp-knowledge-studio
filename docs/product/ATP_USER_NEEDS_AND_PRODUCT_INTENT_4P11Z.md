# ATP User Needs And Product Intent 4P-11Z

## 1. Executive Summary

ATP Knowledge Studio is intended to be a personal academic knowledge studio,
personal academic library, and AI research office.

The primary user is an academic, lecturer, and researcher who handles many
documents, papers, textbook materials, teaching materials, and writing projects.
The tool must help transform scattered academic sources into organized,
reviewable, citation-aware knowledge and writing outputs.

The app must be easy, systematic, trustworthy, and low-cognitive-load. It
should feel like a careful academic assistant and knowledge studio, not a
backend dashboard. Backend safety, audit, read-back, and validation are
important, but backend complexity should not dominate the visible UI.

## 2. User Profile and Working Context

The user is an academic in marketing and business education. The user's work
includes:

- textbook chapters
- academic articles
- teaching materials
- research evidence
- source cards
- knowledge cards
- visual and teaching assets
- slide and infographic concepts

The user needs to build long-term knowledge assets, not just generate one-off
drafts. Academic work depends on sources, provenance, citation discipline, and
careful metadata. The product must support both research production and
teaching material production.

This user does not need another generic AI chat surface. The user needs a
trusted academic workspace that helps organize sources, preserve evidence, and
reuse reviewed knowledge over time.

## 3. Core Problem the User Wants to Solve

The user has too many PDFs, DOCX files, notes, papers, and teaching materials
to organize manually with confidence.

Academic writing requires:

- evidence
- citation
- source provenance
- careful bibliographic metadata
- reviewable claims
- teaching context
- reusable knowledge units

Existing tools do not easily connect source intake to knowledge organization,
writing, and visual output. They may help with isolated tasks, but they do not
provide one systematic source-first workflow.

AI can help, but AI output is risky if source and citation integrity are weak.
The user does not want a black-box AI writer. The user wants an AI-assisted
system that is inspectable, auditable, and reviewable.

## 4. Product Vision

ATP should be an AI-powered personal academic knowledge studio.

It should be:

- a local-first research-to-writing assistant
- a source-first and citation-aware production environment
- a trusted academic knowledge base built over time
- a tool for converting reviewed sources into textbook chapters, literature
  reviews, academic articles, teaching notes, slides, and visual briefs

The long-term product vision is not "press a button and get a draft." The
vision is to build a trusted library, let the AI Librarian help organize it,
review only what needs attention, and later write or create from reviewed
knowledge.

## 5. Expected Benefits

Expected practical benefits:

- faster source intake and organization
- reduced manual tracking of documents and metadata
- clear distinction between raw source, reviewed source, SourceDocument,
  SourceCard, KnowledgeCard, and writing output
- better citation discipline
- lower risk of fabricated citation or APA metadata
- easier reuse of trusted knowledge for teaching and writing
- more efficient textbook chapter and article drafting
- reduced cognitive load during academic production
- better long-term knowledge management

The user should feel that ATP remembers and organizes academic material in a
trustworthy way, while still requiring human review where academic risk is high.

## 6. Intended User Workflow

### Step 1: Add Sources

The user drops or selects PDF, DOCX, or other source files. The system previews
and classifies readiness. There should be no hidden auto-save or risky
processing.

The user should see what is ready, what needs review, and what is blocked.

### Step 2: Save SourceDocument

The user explicitly approves safe SourceDocument save. The system records audit
and read-back verification.

The user-facing experience should be simple:

- Source saved.
- Receipt available.
- No SourceCard created yet.
- Metadata still needs review if incomplete.

### Step 3: Review Metadata

The user checks bibliographic metadata. Authors, year, DOI, journal, publisher,
citation fields, and APA-relevant details are reviewed, not fabricated.

AI may suggest metadata, but suggestions should remain provisional until human
review confirms them.

### Step 4: Create Trusted SourceCard Later

SourceCard is created only after metadata review and explicit approval.
SourceCard creation should not happen as a hidden side effect of SourceDocument
save.

### Step 5: Build Cabinet Knowledge

Reviewed sources become reusable knowledge assets. The Cabinet should hold
trusted SourceCards, KnowledgeCards, evidence, quotes, concepts, and case
examples.

### Step 6: Write

Writer uses trusted source packages to draft textbook chapters, teaching
materials, articles, or literature review sections.

Writing should be evidence-aware. The user should be able to see what evidence
supports a section, but should not be forced to parse backend panels before
writing.

### Step 7: Create Visuals

Art uses reviewed knowledge to make slide briefs, infographic briefs, visual
assets, teaching visuals, and image prompts.

Visual production should depend on reviewed knowledge, not raw unreviewed
sources.

## 7. Four-Room Product Model

### Library

Library handles intake, review, SourceDocument save, and metadata readiness.

Primary question:

> What sources do I have and what needs review?

Library should feel like a review desk. It should help the user add sources,
save SourceDocuments, inspect readiness, and prepare sources for later use.

### Cabinet

Cabinet is the trusted knowledge vault. It stores reviewed SourceCards,
KnowledgeCards, evidence, quotes, concepts, and case examples.

Primary question:

> What trusted knowledge can I reuse?

Cabinet should not feel like an intake queue. It should represent organized,
reviewed, reusable knowledge.

### Writer

Writer is the workspace for textbook chapters, academic articles, teaching
notes, and literature reviews.

Primary question:

> What am I writing and what evidence supports it?

Writer should show the current project, current section, draft workspace, and
evidence context.

### Art

Art is the visual production room for slides, infographics, teaching visuals,
image prompts, and visual briefs.

Primary question:

> What visual output do I need from my knowledge?

Art should use reviewed knowledge as input and should not be mixed with Writer
unless the task requires a writing-to-visual handoff.

## 8. AI Librarian Role

The AI Librarian is the assistant metaphor.

The AI Librarian helps organize, suggest, summarize, classify, and prepare
material. It should help the user decide what needs review, what is safe to
trust, and what can move forward.

AI should not silently overwrite trusted records. AI suggestions should be:

- provisional
- inspectable
- reversible
- clearly labeled
- separated from human-verified records

Human review is required for risky academic metadata, citation, APA, and
SourceCard creation. The AI should feel like a careful assistant, not an
autonomous black box.

## 9. Trust and Safety Principles

Trust principles:

- Auto where reliable.
- Human approval where risky.
- Audit trail always.
- Read-back verification for saved records.
- No hidden mutation.
- No direct AI/provider-to-persistence overwrite.
- No citation-ready or APA-final status without human verification.
- No SourceCard creation without metadata review.
- No backend process should be shown frontstage unless it helps user
  decision-making.

The app should preserve academic trust. It should avoid any UI that implies a
source, citation, APA reference, or knowledge card is verified before the
required review has happened.

## 10. UX Expectations

Desired UX:

- simple
- calm
- clear
- systematic
- trustworthy
- low-cognitive-load

One screen should have one main purpose. One primary action should be visible at
a time. The visual room metaphor should help orientation, not add noise.

Backend, audit, command status, provider status, and diagnostics should be
hidden under Advanced or Inspector unless they directly help the user decide
what to do now.

Screen expectations:

- Dashboard should explain what is happening.
- Source Library should feel like a review desk, not a backend console.
- Writer should feel like a writing workspace, not an agent/debug dashboard.
- Art should feel like a visual production workspace.

## 11. Current Concern from User Testing

Current user concerns:

- Dashboard is the clearest current screen.
- Other screens are too dense and backend-heavy.
- The left menu reflects old module/backend concepts and duplicates room
  navigation.
- Source Library currently shows too many preview, status, disabled, and
  backend layers at once.
- Writer screen shows too much agent/backend status and makes the writing task
  unclear.
- The user is concerned that code/backend work may not translate into an easy
  and smooth app experience.
- The user wants backend quality preserved but frontstage simplified.

The immediate design challenge is to make the strong backend feel calm and
usable instead of technical and overwhelming.

## 12. What the User Does Not Want

The user does not want:

- a black-box AI writer
- a backend dashboard
- a citation-fabricating generator
- a dense developer console
- many rooms/modules that users do not understand
- automatic SourceCard, citation, or APA creation without review
- visual polish that hides workflow confusion

The product should not become a set of technical panels that only the builder
understands. It must become a usable academic workspace.

## 13. What Success Looks Like

Success means:

- The user can open the app and immediately know what to do next.
- The user can add sources and understand their status.
- The user can see what needs review.
- The user can trust what has been saved.
- The user can tell what is real, preview, disabled, and future.
- The user can write from trusted sources.
- Backend safety is strong but not visually overwhelming.
- The app feels like an academic assistant and knowledge studio, not a system
  admin panel.

The product succeeds when the user feels both oriented and protected: the app
helps them move forward, but never hides academic risk.

## 14. Design Audit Questions

Questions for the external design consultant:

- Does the 4-room model communicate the product clearly?
- Does the proposed workflow match academic production needs?
- What should be visible by default vs hidden in Advanced?
- How should the AI Librarian appear in the UI?
- What is the simplest possible Source Library screen?
- What is the simplest possible Writer screen?
- Should the left menu be removed, collapsed, or redesigned?
- How can trust/audit be shown without cognitive overload?
- What should be the next UX implementation sprint before metadata editing is
  activated?

The design audit should judge ATP by whether it helps the academic user build,
trust, retrieve, write, and create from reviewed knowledge without turning the
workflow into a backend console.
