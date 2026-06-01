import type { Agent, AuditLogEntry, Project, SourceItem, WorkflowTask } from "../types/domain";
import { VirtualOffice } from "../features/virtual-office/VirtualOffice";
import { WorkflowBoard } from "../features/workflow-board/WorkflowBoard";

interface DashboardPageProps {
  agents: Agent[];
  auditLogs: AuditLogEntry[];
  projects: Project[];
  selectedAgent: Agent;
  sourceItems: SourceItem[];
  workflowTasks: WorkflowTask[];
  onSelectAgent: (agentId: string) => void;
}

export function DashboardPage({
  agents,
  projects,
  selectedAgent,
  sourceItems,
  workflowTasks,
  onSelectAgent
}: DashboardPageProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px] gap-3 overflow-hidden">
        <VirtualOffice
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={onSelectAgent}
        />
        <div className="pixel-panel flex min-h-0 flex-col gap-3 overflow-y-auto p-3">
          <div>
            <p className="panel-label">Source Inbox</p>
            <div className="mt-2 space-y-2">
              {sourceItems.slice(0, 4).map((source) => (
                <div className="mini-card" key={source.id}>
                  <span className="font-bold leading-5 text-white">{source.title}</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="status-pill">{source.type}</span>
                    <span className="text-xs font-black text-studio-teal">
                      {source.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t-2 border-studio-line pt-3">
            <p className="panel-label">Today Progress</p>
            <div className="mt-3 h-4 border-2 border-studio-line bg-studio-ink">
              <div className="h-full w-[78%] bg-studio-teal" />
            </div>
            <p className="mt-2 text-sm font-bold text-studio-teal">78% mock workflow ready</p>
          </div>
        </div>
      </div>
      <WorkflowBoard
        agents={agents}
        projects={projects}
        sourceItems={sourceItems}
        tasks={workflowTasks}
      />
    </div>
  );
}
