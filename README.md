# ATP Knowledge Studio

ATP Knowledge Studio is a desktop AI research and writing studio for marketing academic articles, textbook chapters, Obsidian knowledge notes, slide briefs, and visual infographic outputs.

Sprint 0 is a mock-only scaffold. It focuses on the app shell, navigation, dashboard layout, 8-bit pixel-inspired virtual office direction, mock agents, mock workflow board, and typed local data models.

## Sprint 0 Scope

- Tauri v2 scaffold
- React + TypeScript + Vite frontend
- Tailwind CSS styling
- Desktop-first dark blue dashboard shell
- Left navigation, top connector status bar, right agent detail/activity/chat panel, bottom workflow board
- Functional mock virtual office with clickable agent zones
- Mock project, source, workflow, connector, audit, and agent data
- Placeholder pages for core modules

No real OpenAI, Gemini, NotebookLM, Canva, or Obsidian integration is implemented in Sprint 0.

## Development

Install dependencies:

```bash
npm install
```

Run the web app during UI development:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Run as a Tauri desktop app:

```bash
npm run tauri:dev
```

Tauri requires Rust and platform-specific prerequisites. If `cargo` or `rustc` is missing, install the Tauri prerequisites before running desktop commands.

## Environment

Copy `.env.example` when future connector work begins. Do not commit real API keys.

```bash
cp .env.example .env
```

## Repository Notes

- Work from the repository root.
- Do not create a nested duplicate app folder.
- Use mock local data in Sprint 0.
- Keep future integrations behind typed boundaries and secure configuration.
- Default writing orientation is formal Thai with English technical terms in parentheses and APA 7 citation awareness.
