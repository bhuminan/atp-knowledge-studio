import type { Agent, AuditLogEntry, SourceItem, WorkflowTask } from "../types/domain";
import { VirtualOffice } from "../features/virtual-office/VirtualOffice";
import { WorkflowBoard } from "../features/workflow-board/WorkflowBoard";

interface DashboardPageProps {
  agents: Agent[];
  auditLogs: AuditLogEntry[];
  selectedAgent: Agent;
  sourceItems: SourceItem[];
  workflowTasks: WorkflowTask[];
  onSelectAgent: (agentId: string) => void;
}

export function DashboardPage({
  agents,
  selectedAgent,
  sourceItems,
  workflowTasks,
  onSelectAgent
}: DashboardPageProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_260px] gap-3">
        <VirtualOffice
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={onSelectAgent}
        />
        <div className="pixel-panel flex flex-col gap-3 overflow-hidden p-3">
          <div>
            <p className="panel-label">Source Inbox</p>
            <div className="mt-2 space-y-2">
              {sourceItems.slice(0, 4).map((source) => (
                <div className="mini-card" key={source.id}>
                  <span className="truncate font-bold">{source.title}</span>
                  <span className="status-pill">{source.type}</span>
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
      <WorkflowBoard tasks={workflowTasks} />
    </div>
  );
}
