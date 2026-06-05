import {
  BookOpen,
  FileInput,
  LayoutDashboard,
  Library,
  Palette,
  Settings,
  Sparkles,
  Upload,
  Wrench
} from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { NavKey } from "../app/App";
import type { Agent, AuditLogEntry, ConnectorStatus, Project } from "../types/domain";
import { AgentDetailPanel } from "../features/agents/AgentDetailPanel";

interface AppShellProps {
  activeNav: NavKey;
  activeProject: Project;
  agents: Agent[];
  auditLogs: AuditLogEntry[];
  connectors: ConnectorStatus[];
  selectedAgent: Agent;
  setActiveNav: Dispatch<SetStateAction<NavKey>>;
  children: ReactNode;
}

const navItems: Array<{
  key: NavKey;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}> = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "source-inbox", label: "Library", icon: FileInput },
  { key: "knowledge-brain", label: "Cabinet", icon: Library },
  { key: "article-studio", label: "Writer", icon: BookOpen },
  { key: "visual-studio", label: "Art", icon: Palette, badge: "Soon" },
  { key: "settings", label: "Settings", icon: Settings }
];

const navLabels = new Map(navItems.map((item) => [item.key, item.label]));

export function AppShell({
  activeNav,
  activeProject,
  agents,
  auditLogs,
  selectedAgent,
  setActiveNav,
  children
}: AppShellProps) {
  const isSourceLibrary = activeNav === "source-inbox";
  const isDashboard = activeNav === "dashboard";

  return (
    <div className="min-h-screen bg-studio-ink text-slate-100">
      <div className="flex h-screen min-h-[760px] overflow-hidden">
        <aside className="flex w-60 shrink-0 flex-col gap-3 overflow-y-auto border-r-4 border-studio-line bg-studio-navy p-3 shadow-pixel">
          <div className="pixel-panel flex items-center gap-3 p-3">
            <div className="grid h-11 w-11 place-items-center border-2 border-studio-gold bg-studio-panel text-studio-gold">
              <Library size={24} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-white">
                ATP Studio
              </p>
              <p className="text-xs font-semibold text-studio-gold">
                AI Research Office
              </p>
            </div>
          </div>

          <nav aria-label="Primary navigation" className="pixel-panel flex-1 p-2">
            <p className="px-2 pb-2 text-xs font-black uppercase text-slate-300">
              Rooms
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.key;
                return (
                  <button
                    className={`nav-button ${isActive ? "nav-button-active" : ""}`}
                    key={item.key}
                    onClick={() => setActiveNav(item.key)}
                    type="button"
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-sm border border-studio-gold/60 px-1.5 py-0.5 text-[0.62rem] font-black uppercase text-studio-gold">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="pixel-panel p-3">
            <p className="mb-2 text-xs font-black uppercase text-slate-300">
              Projects
            </p>
            <div className="space-y-2 text-sm">
              <div className="rounded-sm border border-studio-teal/70 bg-studio-teal/15 px-2 py-2 font-bold text-studio-gold">
                {activeProject.name}
              </div>
              <div className="px-2 text-slate-300">IMC Textbook</div>
              <div className="px-2 text-slate-300">Marketing Articles</div>
            </div>
          </div>

          <div className="pixel-panel p-3">
            <p className="mb-3 text-xs font-black uppercase text-slate-300">
              Quick Action
            </p>
            <div className="grid grid-cols-3 gap-2">
              <QuickAction icon={<Upload size={18} />} label="Import" />
              <QuickAction icon={<Wrench size={18} />} label="Clip" />
              <QuickAction icon={<Sparkles size={18} />} label="Brief" />
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex h-[86px] shrink-0 items-center justify-between gap-4 overflow-hidden border-b-4 border-studio-line bg-gradient-to-r from-studio-navy via-[#0b3158] to-studio-panel px-5">
            <div>
              <h1 className="text-xl font-black uppercase text-white">
                ATP Studio
              </h1>
              <p className="text-sm font-semibold text-studio-gold">
                {navLabels.get(activeNav) ?? "Room"} / ATP Knowledge Studio
              </p>
            </div>
            <button
              className="grid h-11 w-11 place-items-center border-2 border-studio-line bg-studio-panel text-slate-100 hover:border-studio-gold hover:text-studio-gold"
              onClick={() => setActiveNav("settings")}
              type="button"
              aria-label="Open Settings"
            >
              <Settings size={19} />
            </button>
          </header>

          <div
            className={`grid min-h-0 flex-1 gap-3 overflow-hidden p-3 ${
              isDashboard
                ? "grid-cols-[minmax(0,1fr)]"
                : isSourceLibrary
                ? "grid-cols-[minmax(0,1fr)_220px]"
                : "grid-cols-[minmax(0,1fr)_340px]"
            }`}
          >
            <section className="min-w-0 overflow-hidden">{children}</section>
            {isDashboard ? null : (
              <AgentDetailPanel
                agents={agents}
                auditLogs={auditLogs}
                compact={isSourceLibrary}
                selectedAgent={selectedAgent}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      className="grid min-h-16 place-items-center gap-1 border-2 border-studio-line bg-studio-panel p-2 text-xs font-black uppercase text-slate-100 hover:border-studio-gold hover:text-studio-gold"
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
