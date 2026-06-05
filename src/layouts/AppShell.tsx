import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import type { LibraryMode, NavKey } from "../app/App";
import type { Agent } from "../types/domain";
import { InspectorPanel } from "../components/InspectorPanel";
import {
  listSavedSourceDocuments,
  type SavedSourceDocumentListItem
} from "../lib/persistence/LocalVaultDatabase";

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
  icon: string;
  disabled?: boolean;
}> = [
  { key: "dashboard", label: "Home", icon: "🏠" },
  { key: "source-inbox", label: "Library", icon: "📚" },
  { key: "knowledge-brain", label: "Cabinet", icon: "🗄" },
  { key: "article-studio", label: "Writer", icon: "✍" },
  { key: "visual-studio", label: "Art", icon: "🎨", disabled: true },
  { key: "settings", label: "Settings", icon: "⚙" }
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
  const [savedSources, setSavedSources] = useState<SavedSourceDocumentListItem[]>([]);
  const [sourceStatus, setSourceStatus] = useState<"loading" | "ready" | "fallback">(
    "loading"
  );
  const [openMenu, setOpenMenu] = useState<"file" | "view" | "help" | null>(null);

  useEffect(() => {
    let isMounted = true;

    listSavedSourceDocuments()
      .then((sources) => {
        if (isMounted) {
          setSavedSources(sources);
          setSourceStatus("ready");
        }
      })
      .catch(() => {
        if (isMounted) {
          setSavedSources([]);
          setSourceStatus("fallback");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const closeMenu = () => setOpenMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const reviewCount = useMemo(
    () =>
      savedSources.filter((source) =>
        `${source.metadataStatus} ${source.reviewStatus}`.toLowerCase().includes("review")
      ).length,
    [savedSources]
  );
  const sourceCountLabel =
    sourceStatus === "fallback" ? "sources unavailable" : `${savedSources.length} sources saved`;
  const roomStatusPanes = createStatusPanes({
    activeNav,
    libraryMode,
    reviewCount,
    roomName,
    savedCount: savedSources.length,
    sourceStatus
  });
  const handleMenuClick = (menu: "file" | "view" | "help") => {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu));
  };
  const navigateFromMenu = (navKey: NavKey) => {
    onNavigate(navKey);
    setOpenMenu(null);
  };
  const openLibraryAdd = () => {
    onNavigate("source-inbox");
    onSetLibraryMode("add");
    setOpenMenu(null);
  };

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

      <div
        className="win-menubar"
        role="menubar"
        aria-label="Application menu"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`menu-item ${openMenu === "file" ? "open" : ""}`}
          onClick={(event) => {
            if (!(event.target as HTMLElement).closest(".dropdown")) {
              handleMenuClick("file");
            }
          }}
          role="button"
          tabIndex={0}
        >
          <u>F</u>ile
          <div className="dropdown">
            <button className="dd-item" onClick={openLibraryAdd} type="button">
              <span className="dd-icon">📂</span>
              <span className="dd-label"><u>O</u>pen source file...</span>
              <span className="dd-shortcut">Ctrl+O</span>
            </button>
            <div className="dd-item">
              <span className="dd-icon">📥</span>
              <span className="dd-label"><u>A</u>dd sources</span>
              <span className="dd-arrow">▶</span>
              <div className="submenu">
                <button className="dd-item" onClick={openLibraryAdd} type="button">
                  <span className="dd-icon">📄</span>
                  <span className="dd-label">Drop PDF or DOCX file</span>
                </button>
                <button className="dd-item" onClick={openLibraryAdd} type="button">
                  <span className="dd-icon">📋</span>
                  <span className="dd-label">Paste local file path</span>
                </button>
                <div className="dd-sep" />
                <button className="dd-item" onClick={openLibraryAdd} type="button">
                  <span className="dd-icon">🔍</span>
                  <span className="dd-label">Browse files...</span>
                </button>
              </div>
            </div>
            <button className="dd-item" onClick={openLibraryAdd} type="button">
              <span className="dd-icon">💾</span>
              <span className="dd-label">Save to Library</span>
              <span className="dd-shortcut">Ctrl+S</span>
            </button>
            <div className="dd-sep" />
            <button
              className="dd-item"
              onClick={() => {
                onSetInspectorOpen(true);
                setOpenMenu(null);
              }}
              type="button"
            >
              <span className="dd-icon">🔍</span>
              <span className="dd-label">Inspect source</span>
              <span className="dd-shortcut">Ctrl+I</span>
            </button>
            <button className="dd-item" onClick={() => setOpenMenu(null)} type="button">
              <span className="dd-icon">📋</span>
              <span className="dd-label">View audit log</span>
            </button>
            <div className="dd-sep" />
            <button className="dd-item" onClick={() => navigateFromMenu("dashboard")} type="button">
              <span className="dd-icon">✕</span>
              <span className="dd-label">E<u>x</u>it</span>
              <span className="dd-shortcut">Alt+F4</span>
            </button>
          </div>
        </div>

        <div
          className={`menu-item ${openMenu === "view" ? "open" : ""}`}
          onClick={(event) => {
            if (!(event.target as HTMLElement).closest(".dropdown")) {
              handleMenuClick("view");
            }
          }}
          role="button"
          tabIndex={0}
        >
          <u>V</u>iew
          <div className="dropdown">
            <div className="dd-item">
              <span className="dd-icon">🚪</span>
              <span className="dd-label"><u>R</u>ooms</span>
              <span className="dd-arrow">▶</span>
              <div className="submenu">
                {navItems.slice(0, 4).map((item) => (
                  <button
                    className="dd-item"
                    key={item.key}
                    onClick={() => navigateFromMenu(item.key)}
                    type="button"
                  >
                    <span className="dd-icon">{activeNav === item.key ? "✓" : item.icon}</span>
                    <span className="dd-label">{item.label}</span>
                  </button>
                ))}
                <div className="dd-sep" />
                <div className="dd-item disabled">
                  <span className="dd-icon">🎨</span>
                  <span className="dd-label">Art (coming soon)</span>
                </div>
              </div>
            </div>
            <div className="dd-sep" />
            <button
              className="dd-item"
              onClick={() => {
                onSetInspectorOpen((isOpen) => !isOpen);
                setOpenMenu(null);
              }}
              type="button"
            >
              <span className="dd-icon">🔍</span>
              <span className="dd-label">Show <u>I</u>nspector</span>
              <span className="dd-shortcut">F5</span>
            </button>
            <button className="dd-item" onClick={() => setOpenMenu(null)} type="button">
              <span className="dd-icon">📊</span>
              <span className="dd-label">Studio Status</span>
              <span className="dd-shortcut">F6</span>
            </button>
            <div className="dd-sep" />
            <div className="dd-item">
              <span className="dd-icon">🔤</span>
              <span className="dd-label">Text size</span>
              <span className="dd-arrow">▶</span>
              <div className="submenu">
                <button className="dd-item" onClick={() => setOpenMenu(null)} type="button">
                  <span className="dd-icon" />
                  <span className="dd-label">Small</span>
                </button>
                <button className="dd-item" onClick={() => setOpenMenu(null)} type="button">
                  <span className="dd-icon">✓</span>
                  <span className="dd-label">Normal</span>
                </button>
                <button className="dd-item" onClick={() => setOpenMenu(null)} type="button">
                  <span className="dd-icon" />
                  <span className="dd-label">Large</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`menu-item ${openMenu === "help" ? "open" : ""}`}
          onClick={(event) => {
            if (!(event.target as HTMLElement).closest(".dropdown")) {
              handleMenuClick("help");
            }
          }}
          role="button"
          tabIndex={0}
        >
          <u>H</u>elp
          <div className="dropdown">
            <button className="dd-item" onClick={() => setOpenMenu(null)} type="button">
              <span className="dd-icon">❓</span>
              <span className="dd-label">Help topics</span>
              <span className="dd-shortcut">F1</span>
            </button>
            <button className="dd-item" onClick={() => setOpenMenu(null)} type="button">
              <span className="dd-icon">💡</span>
              <span className="dd-label">Did you know...</span>
            </button>
            <div className="dd-sep" />
            <button className="dd-item" onClick={() => setOpenMenu(null)} type="button">
              <span className="dd-icon">ℹ</span>
              <span className="dd-label">About ATP Knowledge Studio</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`app-body ${isInspectorOpen ? "inspector-open" : ""}`}>
        <nav aria-label="Primary navigation" className="win-nav" data-testid="primary-navigation">
          {navItems.map((item) => {
            const isActive = activeNav === item.key;
            const afterLibrary = item.key === "knowledge-brain";
            const afterArt = item.key === "settings";

            return (
              <div key={item.key}>
                {afterLibrary || afterArt ? <div className="win-nav-divider" /> : null}
                <button
                  className={`nav-item ${isActive ? "active" : ""} ${item.disabled ? "disabled" : ""}`}
                  disabled={item.disabled}
                  onClick={() => onNavigate(item.key)}
                  type="button"
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
                {item.key === "source-inbox" && activeNav === "source-inbox" ? (
                  <div className="win-nav-subitems" data-testid="library-subnav">
                    <button
                      className={`nav-sub ${
                        libraryMode === "saved" ? "active" : ""
                      }`}
                      onClick={() => onSetLibraryMode("saved")}
                      type="button"
                    >
                      <span aria-hidden="true">●</span>
                      <span>Saved sources</span>
                    </button>
                    <button
                      className={`nav-sub ${
                        libraryMode === "add" ? "active" : ""
                      }`}
                      onClick={() => onSetLibraryMode("add")}
                      type="button"
                    >
                      <span aria-hidden="true">+</span>
                      <span>Add sources</span>
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
              children: `${roomName} audit, read-back, command, metadata review, and blocker details appear here when selected.`
            }
          ]}
        />
      </div>

      <footer className="win-statusbar">
        {roomStatusPanes.map((pane) => (
          <span className="win-statusbar-pane" key={pane}>
            {pane === "{source-count}" ? sourceCountLabel : pane}
          </span>
        ))}
        <span className="win-statusbar-pane">
          <span className="trust-dot trust-dot-green" />
          All systems operational
        </span>
      </footer>
    </div>
  );
}

function createStatusPanes({
  activeNav,
  libraryMode,
  reviewCount,
  roomName,
  savedCount,
  sourceStatus
}: {
  activeNav: NavKey;
  libraryMode: LibraryMode;
  reviewCount: number;
  roomName: string;
  savedCount: number;
  sourceStatus: "loading" | "ready" | "fallback";
}): string[] {
  if (activeNav === "source-inbox") {
    return [
      libraryMode === "saved" ? "Library · Saved sources" : "Library · Add sources",
      sourceStatus === "fallback" ? "sources unavailable" : `${savedCount} saved`,
      sourceStatus === "fallback" ? "review unavailable" : `${reviewCount} needs review`
    ];
  }

  if (activeNav === "article-studio") {
    return ["Writer · Chapter Builder", "Mock sandbox"];
  }

  return ["ATP Knowledge Studio", `Room: ${roomName}`, "{source-count}"];
}
