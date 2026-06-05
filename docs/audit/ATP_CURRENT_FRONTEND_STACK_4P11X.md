# ATP Current Frontend Stack 4P-11X

## Framework And Versions

From `package.json`:

- React: `^18.3.1`
- React DOM: `^18.3.1`
- TypeScript: `^5.5.3`
- Vite: `^5.4.0`
- Tauri JS API: `^2.0.0`
- Tauri CLI: `^2.0.0`
- Tailwind CSS: `^3.4.6`
- Playwright test: `^1.60.0`
- Icon library: `lucide-react` `^0.468.0`

From `src-tauri/Cargo.toml`:

- Tauri: `2`
- Tauri plugins: dialog `2`, shell `2`
- SQLite: `rusqlite` `0.32.1` with bundled SQLite
- DOCX/XML support: `zip` and `quick-xml`

## Component Approach

ATP uses custom React components rather than a third-party component library.
Common styling is expressed through Tailwind utility classes and a small set of
custom CSS component classes in `src/styles/index.css`, including:

- `pixel-panel`
- `panel-label`
- `nav-button`
- `nav-button-active`
- `connector-chip`
- `mock-badge`
- `mini-card`
- `status-pill`
- virtual office classes
- input intake classes
- dashboard room/card classes

Icons are from `lucide-react` and are used in navigation, quick actions, Source
Library affordances, and Writer Studio controls.

## State Management

Current state management is local React state:

- `useState`, `useMemo`, `useRef`, and `useEffect`
- No Redux was found.
- No Zustand was found.
- No global app store was found.
- Main navigation state lives in `src/app/App.tsx`.
- Source Library and Writer Studio keep workflow state inside their own
  components.

## Routing / Navigation

There is no router package. The app uses a `NavKey` union in `src/app/App.tsx`
and renders the selected screen inside `AppShell`.

Current nav keys:

- `dashboard`
- `source-inbox`
- `workflow-board`
- `knowledge-brain`
- `article-studio`
- `slide-studio`
- `visual-studio`
- `obsidian-vault`
- `audit-log`
- `settings`

Only `?page=source-inbox` is parsed from the URL. Other screens are reached
through the left navigation buttons.

## Testing Stack

- Playwright: `tests/e2e/source-library.spec.ts`
- Rust tests: `src-tauri/src/vault_db.rs` and `src-tauri/src/lib.rs`
- Build verification: `npm run build`
- Source Library QA command: `npm run qa:source-library`
- Rust command: `cd src-tauri && cargo test`
- Whitespace diff check: `git diff --check`

## Styling And Visual Theme

Files inspected:

- `src/styles/index.css`
- `tailwind.config.js`
- `src/layouts/AppShell.tsx`
- `src/pages/DashboardPage.tsx`
- `src/features/source-library/SourceLibraryPage.tsx`
- `src/features/writer-studio/WriterStudioPage.tsx`

The current visual theme is desktop-first, dark blue, pixel-panel based, and
inspired by an 8-bit academic office/library. The CSS sets a minimum page size
of `1024px` by `760px`, so this is not currently a mobile-first app.

## Current Frontend Risk

The frontend successfully exposes many backend trust boundaries, but it exposes
too many of them at once. The implementation is technically careful, yet the
visible screen hierarchy often feels like a backend console instead of a calm
research workspace.
