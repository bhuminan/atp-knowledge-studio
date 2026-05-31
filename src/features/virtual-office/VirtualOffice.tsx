import type { Agent } from "../../types/domain";

interface VirtualOfficeProps {
  agents: Agent[];
  selectedAgent: Agent;
  compact?: boolean;
  onSelectAgent: (agentId: string) => void;
}

const statusLabels: Record<Agent["status"], string> = {
  idle: "Idle",
  working: "Working",
  waiting_approval: "Waiting",
  completed: "Done",
  error: "Error"
};

export function VirtualOffice({
  agents,
  compact = false,
  selectedAgent,
  onSelectAgent
}: VirtualOfficeProps) {
  return (
    <div className={`pixel-panel office-scene ${compact ? "office-compact" : ""}`}>
      <div className="office-sky">
        <div>
          <p className="text-xs font-black uppercase text-studio-gold">
            8-bit Virtual Office
          </p>
          <h2 className="text-2xl font-black text-white">โรงเรียนลูกผู้ชายวิชาการ</h2>
        </div>
        <div className="text-right text-xs font-bold text-slate-200">
          <p>31 May 2026</p>
          <p>10:30 AM Mock Desk</p>
        </div>
      </div>

      <div className="office-grid">
        {agents.map((agent) => {
          const isSelected = selectedAgent.id === agent.id;
          return (
            <button
              className={`agent-room agent-${agent.status} ${
                isSelected ? "agent-room-selected" : ""
              }`}
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              style={{
                gridColumn: agent.zone.column,
                gridRow: agent.zone.row
              }}
              type="button"
            >
              <div className="agent-room-header">
                <span>{agent.name}</span>
                <span>{statusLabels[agent.status]}</span>
              </div>
              <div className="agent-desk">
                <div className="agent-avatar" aria-hidden="true">
                  <span />
                </div>
                <div className="agent-monitor" aria-hidden="true" />
              </div>
              <div className="agent-speech">
                <strong>{agent.role}</strong>
                <span>{agent.currentTask}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
