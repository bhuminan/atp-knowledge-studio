import {
  BarChart3,
  BookOpen,
  Brain,
  ClipboardList,
  FileInput,
  Gem,
  LayoutDashboard,
  Library,
  MonitorPlay,
  Palette,
  ScrollText,
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
}> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "source-inbox", label: "Source Inbox", icon: FileInput },
  { key: "workflow-board", label: "Workflow Board", icon: ClipboardList },
  { key: "knowledge-brain", label: "Knowledge Brain", icon: Brain },
  { key: "article-studio", label: "Article Studio", icon: BookOpen },
  { key: "slide-studio", label: "Slide Studio", icon: MonitorPlay },
  { key: "visual-studio", label: "Visual Studio", icon: Palette },
  { key: "obsidian-vault", label: "Obsidian Vault", icon: Gem },
  { key: "audit-log", label: "Audit Log", icon: ScrollText },
  { key: "settings", label: "Settings", icon: Settings }
];

export function AppShell({
  activeNav,
  activeProject,
  agents,
  auditLogs,
  connectors,
  selectedAgent,
  setActiveNav,
  children
}: AppShellProps) {
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

          <nav className="pixel-panel flex-1 p-2">
            <p className="px-2 pb-2 text-xs font-black uppercase text-slate-300">
              Main Menu
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

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[86px] shrink-0 items-center justify-between gap-4 overflow-hidden border-b-4 border-studio-line bg-gradient-to-r from-studio-navy via-[#0b3158] to-studio-panel px-5">
            <div>
              <h1 className="text-xl font-black uppercase text-white">
                ATP Knowledge Studio
              </h1>
              <p className="text-sm font-semibold text-studio-gold">
                Source-first, citation-aware research production
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {connectors.map((connector) => (
                <div className="connector-chip" key={connector.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase text-white">
                      {connector.name}
                    </span>
                    <span className="connector-dot" />
                  </div>
                  <span className="text-[0.68rem] font-bold uppercase text-studio-teal">
                    {connector.label}
                  </span>
                  {connector.isMock ? <span className="connector-mock">Mock</span> : null}
                </div>
              ))}
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_340px] gap-3 p-3">
            <section className="min-w-0 overflow-hidden">{children}</section>
            <AgentDetailPanel
              agents={agents}
              auditLogs={auditLogs}
              selectedAgent={selectedAgent}
            />
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
