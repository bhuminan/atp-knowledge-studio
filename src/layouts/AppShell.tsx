import {
  BookOpen,
  FileText,
  Home,
  Palette,
  PanelRightOpen,
  Settings,
  Archive
} from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { LibraryMode, NavKey } from "../app/App";
import type { Agent } from "../types/domain";
import { InspectorPanel } from "../components/InspectorPanel";

interface AppShellProps {
  activeNav: NavKey;
  isInspectorOpen: boolean;
  libraryMode: LibraryMode;
  selectedAgent: Agent;
  onNavigate: (navKey: NavKey) => void;
  onSetInspectorOpen: Dispatch<SetStateAction<boolean>>;
  onSetLibraryMode: (mode: LibraryMode) => void;
  children: ReactNode;
}

const navItems: Array<{
  key: NavKey;
  label: string;
  icon: typeof Home;
}> = [
  { key: "dashboard", label: "Home", icon: Home },
  { key: "source-inbox", label: "Library", icon: FileText },
  { key: "knowledge-brain", label: "Cabinet", icon: Archive },
  { key: "article-studio", label: "Writer", icon: BookOpen },
  { key: "visual-studio", label: "Art", icon: Palette },
  { key: "settings", label: "Settings", icon: Settings }
];

const navLabels = new Map(navItems.map((item) => [item.key, item.label]));

export function AppShell({
  activeNav,
  children,
  isInspectorOpen,
  libraryMode,
  selectedAgent,
  onNavigate,
  onSetInspectorOpen,
  onSetLibraryMode
}: AppShellProps) {
  const roomName = navLabels.get(activeNav) ?? "Room";

  return (
    <div className="app-shell">
      <header className="win-titlebar">
        <div className="min-w-0 flex-1 truncate">
          ATP Knowledge Studio{roomName ? ` - ${roomName}` : ""}
        </div>
        <div className="win-window-buttons" aria-hidden="true">
          <span>_</span>
          <span>□</span>
          <span>×</span>
        </div>
      </header>

      <div className="win-menubar" role="menubar" aria-label="Application menu">
        {["File", "Edit", "View", "Help"].map((item) => (
          <button className="win-menuitem" key={item} type="button">
            {item}
          </button>
        ))}
      </div>

      <div className={`app-body ${isInspectorOpen ? "inspector-open" : ""}`}>
        <nav aria-label="Primary navigation" className="win-nav" data-testid="primary-navigation">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;
            const afterLibrary = item.key === "knowledge-brain";
            const afterArt = item.key === "settings";

            return (
              <div key={item.key}>
                {afterLibrary || afterArt ? <div className="win-nav-divider" /> : null}
                <button
                  className={`win-nav-button ${isActive ? "win-nav-button-active" : ""}`}
                  onClick={() => onNavigate(item.key)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={28} strokeWidth={1.75} />
                  <span className="text-nav-label">{item.label}</span>
                </button>
                {item.key === "source-inbox" && activeNav === "source-inbox" ? (
                  <div className="win-nav-subitems" data-testid="library-subnav">
                    <button
                      className={`win-nav-subitem ${
                        libraryMode === "saved" ? "win-nav-subitem-active" : ""
                      }`}
                      onClick={() => onSetLibraryMode("saved")}
                      type="button"
                    >
                      ● Saved
                    </button>
                    <button
                      className={`win-nav-subitem ${
                        libraryMode === "add" ? "win-nav-subitem-active" : ""
                      }`}
                      onClick={() => onSetLibraryMode("add")}
                      type="button"
                    >
                      * Add
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <main className="win-content" data-testid="frontstage-content">
          {children}
        </main>

        <InspectorPanel
          title={`${roomName} Details`}
          subtitle="Contextual inspector"
          isOpen={isInspectorOpen}
          onToggle={() => onSetInspectorOpen((isOpen) => !isOpen)}
          sections={[
            {
              id: "context",
              title: "Context",
              status: "Read-only",
              children: `${roomName} frontstage details. Inspector opens only by user action.`
            },
            {
              id: "guardrails",
              title: "Guardrails",
              status: "Active",
              children:
                "No SourceCard creation, metadata save activation, parser, provider, citation, or APA-final inference is wired from this shell."
            }
          ]}
        />
      </div>

      <footer className="win-statusbar">
        <span className="win-statusbar-pane">ATP Knowledge Studio</span>
        <span className="win-statusbar-pane">Room: {roomName}</span>
        <span className="win-statusbar-pane">Agent: {selectedAgent.name}</span>
        <span className="win-statusbar-pane">SQLite local vault</span>
        <button
          className="win-statusbar-pane win-statusbar-button"
          onClick={() => onSetInspectorOpen((isOpen) => !isOpen)}
          type="button"
        >
          <PanelRightOpen size={12} />
          Inspector
        </button>
      </footer>
    </div>
  );
}
