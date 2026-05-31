import type { Agent, AuditLogEntry } from "../../types/domain";

interface AgentDetailPanelProps {
  agents: Agent[];
  auditLogs: AuditLogEntry[];
  selectedAgent: Agent;
}

const statusClass: Record<Agent["status"], string> = {
  idle: "bg-slate-400",
  working: "bg-studio-teal",
  waiting_approval: "bg-studio-gold",
  completed: "bg-studio-blue",
  error: "bg-studio-rose"
};

export function AgentDetailPanel({
  agents,
  auditLogs,
  selectedAgent
}: AgentDetailPanelProps) {
  const selectedAgentLogs = auditLogs.filter(
    (log) => log.actor === selectedAgent.name || log.target.includes(selectedAgent.name)
  );
  const visibleLogs = selectedAgentLogs.length > 0 ? selectedAgentLogs : auditLogs.slice(0, 3);

  return (
    <aside className="right-agent-panel flex min-h-0 flex-col gap-3 overflow-y-auto pr-1 text-[0.96rem]">
      <section className="pixel-panel shrink-0 p-3">
        <div className="flex items-center justify-between">
          <p className="panel-label">Agent Status</p>
          <span className="mock-badge">Demo</span>
        </div>
        <div className="mt-3 grid gap-1.5">
          {agents.map((agent) => (
            <div
              className={`agent-status-row ${
                agent.id === selectedAgent.id ? "agent-status-row-active" : ""
              }`}
              key={agent.id}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-3 w-3 shrink-0 ${statusClass[agent.status]}`} />
                <span className="truncate font-bold text-white">{agent.name}</span>
              </div>
              <span className="shrink-0 text-xs font-bold uppercase text-studio-gold">
                {agent.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="pixel-panel shrink-0 p-3">
        <p className="panel-label">Selected Agent</p>
        <div className="selected-agent-card mt-3">
          <div className="flex items-start gap-3">
            <div className={`detail-avatar avatar-${selectedAgent.avatarTone}`} aria-hidden="true">
              {selectedAgent.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white">{selectedAgent.name}</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-studio-blue">
                {selectedAgent.role}
              </p>
            </div>
          </div>
          <dl className="mt-3 grid gap-2 text-[0.88rem]">
            <Detail label="Current task" value={selectedAgent.currentTask} />
            <Detail label="Source used" value={selectedAgent.sourceUsed} />
            <Detail label="Last output" value={selectedAgent.lastOutput} />
            <Detail
              label="Confidence"
              value={`${selectedAgent.confidenceLevel}% source-aware mock confidence`}
            />
            <Detail label="Next action" value={selectedAgent.nextAction} />
            <Detail label="Mock audit status" value={selectedAgent.mockAuditStatus} />
          </dl>
          <div className="mock-preview mt-3">
            <p className="text-xs font-black uppercase text-studio-gold">Mock Output Preview</p>
            <p className="mt-2 whitespace-pre-line leading-6 text-slate-100">
              {selectedAgent.mockOutputPreview}
            </p>
          </div>
        </div>
      </section>

      <section className="pixel-panel min-h-40 shrink-0 overflow-hidden p-3">
        <p className="panel-label">Recent Activity</p>
        <div className="mt-3 space-y-2 overflow-auto pr-1">
          {visibleLogs.map((log) => (
            <article className="border-l-4 border-studio-line bg-studio-ink/70 p-2" key={log.id}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-black text-studio-blue">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
                <span className="font-bold uppercase text-studio-gold">{log.status}</span>
              </div>
              <p className="mt-1 text-sm font-bold text-white">
                {log.actor} {log.action}
              </p>
              <p className="text-xs leading-5 text-slate-300">{log.details}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pixel-panel shrink-0 p-3">
        <p className="panel-label">Chat With Office</p>
        <div className="mt-3 rounded-sm border-2 border-studio-line bg-studio-ink p-3 text-sm leading-6 text-slate-200">
          <p className="font-bold text-white">Professor</p>
          <p className="mt-1">ช่วยเตรียม Overview ของบทที่ 5 ให้หน่อยครับ</p>
        </div>
      </section>
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 leading-6 text-slate-100">{value}</dd>
    </div>
  );
}
