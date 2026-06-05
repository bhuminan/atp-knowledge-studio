# ATP Visual System And Platform Specs 4P-11X

## Platform

- Desktop app via Tauri v2.
- Local-first and desktop-first.
- Likely target OS today: macOS first, because current development and
  screenshots are on macOS.
- Windows may be a later target, but no current Windows-specific packaging
  evidence was inspected in this sprint.
- Local database: SQLite through `rusqlite` with bundled SQLite.
- No cloud sync is currently implemented.
- No production cloud backend is currently implemented.
- No public REST API is currently implemented.

## Screen Assumptions

`src/styles/index.css` sets:

- `body` minimum width: `1024px`
- `body` minimum height: `760px`
- dark color scheme

Screenshots were captured at `1280x720`. The app is not currently mobile-first.
Responsive behavior is limited by the fixed/minimum desktop shell.

## Current Palette

From `tailwind.config.js`:

| Token | Hex | Role |
| --- | --- | --- |
| `studio.ink` | `#071426` | Base background |
| `studio.navy` | `#0a2342` | Sidebar/header dark blue |
| `studio.panel` | `#0d2c4f` | Panel background |
| `studio.line` | `#1f73a8` | Panel borders/grid lines |
| `studio.blue` | `#43b8ff` | Primary accent / active state |
| `studio.teal` | `#26d6a3` | Success/trust accent |
| `studio.gold` | `#f6b84a` | Attention/gold highlight |
| `studio.warning` | `#f97316` | Warning/orange |
| `studio.rose` | `#e96d8a` | Error/risk accent |

Additional CSS colors include deep shadow `#03101f`, gradient blues, and
virtual-office floor/brown tones.

## Typography

From `src/styles/index.css` and `tailwind.config.js`:

- `Inter`
- `Noto Sans Thai`
- `Tahoma`
- `system-ui`
- `sans-serif`

The app uses heavy uppercase labels, compact badges, and high font weights.
Letter spacing is mostly zero or standard tracking utilities.

## Icon Set

Icons come from `lucide-react`, including navigation and action icons such as:

- dashboard/layout
- file input
- clipboard
- brain
- book
- monitor/play
- palette
- gem
- scroll text
- settings
- upload/sparkles

## Visual Direction

ATP currently uses an 8-bit/pixel-inspired academic studio direction:

- dark blue dashboard base
- pixel panels with hard borders and shadow offsets
- connector chips
- status pills
- room cards and virtual office scenes
- mock badges and safety/status labels

The visual identity is memorable, but density currently works against clarity
on complex screens.

## Screenshot References

- `screenshots/4P11X/dashboard.png`
- `screenshots/4P11X/source-library.png`
- `screenshots/4P11X/source-library-saved-sourcedocument-inspector.png`
- `screenshots/4P11X/writer-studio.png`
- `screenshots/4P11X/workflow-board.png`
- `screenshots/4P11X/knowledge-brain.png`
- `screenshots/4P11X/slide-studio.png`
- `screenshots/4P11X/visual-studio.png`
- `screenshots/4P11X/obsidian-vault.png`
- `screenshots/4P11X/audit-log.png`
- `screenshots/4P11X/settings.png`

## Visual Risk Notes

- Nested panels make the UI feel narrower than the actual screen.
- Many status colors compete for attention.
- The left nav, dashboard room cards, right agent rail, and central task panels
  compete for navigation meaning.
- Pixel styling is effective on Dashboard but becomes heavy in Source Library
  when every backend/status surface uses the same visual weight.
- The best next visual change is not polish; it is information hierarchy and
  progressive disclosure.
