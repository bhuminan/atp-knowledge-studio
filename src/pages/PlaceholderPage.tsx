import { useState } from "react";
import type { NavKey } from "../app/App";
import type { Agent, AuditLogEntry, Project, SourceItem, WorkflowTask } from "../types/domain";
import { InspectorPanel } from "../components/InspectorPanel";
import { VirtualOffice } from "../features/virtual-office/VirtualOffice";
import { WorkflowBoard } from "../features/workflow-board/WorkflowBoard";

interface PlaceholderPageProps {
  activeNav: NavKey;
  title: string;
  agents: Agent[];
  auditLogs: AuditLogEntry[];
  projects: Project[];
  selectedAgent: Agent;
  sourceItems: SourceItem[];
  workflowTasks: WorkflowTask[];
  onSelectAgent: (agentId: string) => void;
}

export function PlaceholderPage({
  activeNav,
  title,
  agents,
  projects,
  selectedAgent,
  sourceItems,
  workflowTasks,
  onSelectAgent
}: PlaceholderPageProps) {
  const isWorkflow = activeNav === "workflow-board";
  const isSource = activeNav === "source-inbox";
  const isCabinet = activeNav === "knowledge-brain";
  const isArt = activeNav === "visual-studio";
  const isSettings = activeNav === "settings";
  const [isSettingsInspectorOpen, setIsSettingsInspectorOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="pixel-panel min-h-0 flex-1 overflow-auto p-5">
        <div className="mb-5 flex items-center justify-between border-b-2 border-studio-line pb-4">
          <div>
            <p className="panel-label">Sprint 0 Module</p>
            <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
          </div>
          <span className="rounded-sm border-2 border-studio-gold px-3 py-1 text-xs font-black uppercase text-studio-gold">
            Mock only
          </span>
        </div>

        {isCabinet ? (
          <CalmPlaceholder
            title="Cabinet -- Knowledge Vault"
            body="No reviewed SourceCards yet. Complete source intake and metadata review in Library first."
            badge="No real data yet"
          />
        ) : isArt ? (
          <CalmPlaceholder
            title="Art -- Visual Studio"
            body="Available after Writer outputs are stable."
            badge="Soon"
          />
        ) : isSettings ? (
          <div className="flex min-h-[360px] gap-4" data-testid="settings-inspector-demo">
            <div className="min-w-0 flex-1">
              <CalmPlaceholder
                title="Settings"
                body="Provider and integration status will live here later. No real provider connection is active in this sprint."
                badge="Advanced later"
              />
              <button
                className="mt-5 border-2 border-studio-line bg-studio-panel px-4 py-2 text-xs font-black uppercase text-slate-100 hover:border-studio-gold hover:text-studio-gold"
                onClick={() => setIsSettingsInspectorOpen(true)}
                type="button"
              >
                Inspect settings details
              </button>
            </div>
            <InspectorPanel
              title="Settings Details"
              subtitle="Shared shell preview"
              isOpen={isSettingsInspectorOpen}
              onToggle={() => setIsSettingsInspectorOpen((isOpen) => !isOpen)}
              sections={[
                {
                  id: "purpose",
                  title: "Purpose",
                  status: "Preview",
                  children:
                    "Inspector is reserved for structured details such as audit, safety, provider, and diagnostics in later sprints."
                },
                {
                  id: "boundary",
                  title: "Boundary",
                  status: "Read-only",
                  children:
                    "No backend reads, writes, provider calls, metadata saves, or SourceCard creation are wired here."
                }
              ]}
            />
          </div>
        ) : isWorkflow ? (
          <WorkflowBoard
            agents={agents}
            projects={projects}
            sourceItems={sourceItems}
            tasks={workflowTasks}
            tall
          />
        ) : isSource ? (
          <div className="grid grid-cols-2 gap-3">
            {sourceItems.map((source) => (
              <article className="pixel-panel bg-studio-ink/40 p-4" key={source.id}>
                <p className="text-xs font-black uppercase text-studio-blue">
                  {source.type}
                </p>
                <h3 className="mt-2 text-lg font-black text-white">{source.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{source.pathOrUrl}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="status-pill">{source.status}</span>
                  <span className="font-bold text-studio-teal">
                    {source.confidence}% confidence
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_320px] gap-4">
            <div>
              <p className="max-w-3xl text-base leading-7 text-slate-300">
                This section is a Sprint 0 placeholder. The navigation route exists
                so the desktop shell can be tested early while real workflows remain
                mocked until the next sprints.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {agents.slice(0, 6).map((agent) => (
                  <button
                    className="mini-card min-h-20 text-left"
                    key={agent.id}
                    onClick={() => onSelectAgent(agent.id)}
                    type="button"
                  >
                    <span className="font-black text-white">{agent.name}</span>
                    <span className="text-xs text-slate-300">{agent.currentTask}</span>
                  </button>
                ))}
              </div>
            </div>
            <VirtualOffice
              agents={agents}
              compact
              selectedAgent={selectedAgent}
              onSelectAgent={onSelectAgent}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CalmPlaceholder({
  title,
  body,
  badge
}: {
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <section className="max-w-3xl">
      <span className="rounded-sm border-2 border-studio-gold px-3 py-1 text-xs font-black uppercase text-studio-gold">
        {badge}
      </span>
      <h3 className="mt-5 text-2xl font-black text-white">{title}</h3>
      <p className="mt-3 text-base leading-7 text-slate-300">{body}</p>
    </section>
  );
}
