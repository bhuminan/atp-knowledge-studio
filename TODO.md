# TODO

## Sprint 1: App Shell Refinement

- Improve responsive behavior for laptop-size desktop windows.
- Add keyboard-accessible focus states for navigation and agent rooms.
- Replace mock quick-action buttons with disabled mock workflows and visible feedback.
- Add selected module state to the right panel when not on Dashboard.
- Add a compact project switcher using mock project data.

## Sprint 2: Source Inbox Mock Workflow

- Add drag-and-drop UI for mock source intake.
- Add source classification controls with editable mock confidence.
- Add Source Card detail drawer.
- Add mock OCR/parser status states for PDF, screenshot, Markdown, and DOCX.
- Add citation metadata completeness indicators.

## Sprint 3: Obsidian Preview

- Add Markdown source note preview.
- Add controlled taxonomy selector.
- Add proposed tag state.
- Add no-overwrite warning UI for future vault writes.
- Keep actual vault writing disabled until explicitly implemented.

## Sprint 4: Agent Workflow State

- Add task queue state transitions.
- Add mock approval prompts for synthesis merge and case verification.
- Add audit log filtering by agent, project, source, and status.
- Add error and waiting-approval visual states.

## Later Integration Work

- Add secure API key handling strategy before connecting any provider.
- Implement OpenAI summary prototype only after source note and citation warning UX is stable.
- Treat Gemini, NotebookLM, Canva, and real Obsidian writes as later connector phases.
- Keep case study generation source-verified only; never fabricate citations or case facts.
