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
  return (
    <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
      <section className="pixel-panel p-3">
        <p className="panel-label">Agent Status</p>
        <div className="mt-3 space-y-2">
          {agents.map((agent) => (
            <div className="flex items-center justify-between gap-3 text-sm" key={agent.id}>
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

      <section className="pixel-panel p-3">
        <p className="panel-label">Selected Agent</p>
        <div className="mt-3 border-2 border-studio-line bg-studio-ink p-3">
          <h2 className="text-xl font-black text-white">{selectedAgent.name}</h2>
          <p className="mt-1 text-sm font-semibold text-studio-blue">
            {selectedAgent.role}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label="Current task" value={selectedAgent.currentTask} />
            <Detail label="Last output" value={selectedAgent.lastOutput} />
            <Detail
              label="Confidence"
              value={`${selectedAgent.confidenceLevel}% source-aware mock confidence`}
            />
            <Detail label="Next action" value={selectedAgent.nextAction} />
          </dl>
        </div>
      </section>

      <section className="pixel-panel min-h-0 flex-1 overflow-hidden p-3">
        <p className="panel-label">Recent Activity</p>
        <div className="mt-3 space-y-2 overflow-auto pr-1">
          {auditLogs.map((log) => (
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

      <section className="pixel-panel p-3">
        <p className="panel-label">Chat With Office</p>
        <div className="mt-3 rounded-sm border-2 border-studio-line bg-studio-ink p-3 text-sm text-slate-200">
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
      <dd className="mt-1 leading-5 text-slate-100">{value}</dd>
    </div>
  );
}
