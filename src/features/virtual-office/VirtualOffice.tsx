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

const avatarMarks: Record<string, string> = {
  supervisor: "P",
  researcher: "R",
  "gemini-agent": "G",
  "obsidian-curator": "O",
  "writer-agent": "W",
  "case-hunter": "C",
  "citation-agent": "A",
  "visual-designer": "V",
  "qc-inspector": "Q"
};

const roomCueLabels: Record<string, string> = {
  supervisor: "Planning board",
  researcher: "Journal stack",
  "gemini-agent": "Media transcript",
  "obsidian-curator": "Archive notes",
  "writer-agent": "Manuscript desk",
  "case-hunter": "Case folder",
  "citation-agent": "APA stamp",
  "visual-designer": "Poster palette",
  "qc-inspector": "QC checklist"
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
            Mock 8-bit Academic Office
          </p>
          <h2 className="text-2xl font-black text-white">
            ATP Retro School Command Center
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-100">
            อาคารเรียนวิจัยจำลองสำหรับงานเขียน วิจัย และตรวจอ้างอิง
          </p>
        </div>
        <div className="text-right text-xs font-bold text-slate-200">
          <p>Demo floor: 3F Academic Wing</p>
          <p>No real API calls</p>
        </div>
      </div>

      <div className="office-grid">
        <div className="school-hallway" aria-hidden="true">
          <span className="hallway-locker" />
          <span className="hallway-bulletin" />
          <span className="hallway-clock" />
          <span className="hallway-locker hallway-locker-right" />
        </div>
        {agents.map((agent) => {
          const isSelected = selectedAgent.id === agent.id;
          return (
            <button
              className={`agent-room agent-${agent.status} room-${agent.id} ${
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
                <span>{agent.roomLabel}</span>
                <span className="agent-status-token">{statusLabels[agent.status]}</span>
              </div>
              <div className="room-decor" aria-hidden="true">
                <span className="decor-window" />
                <span className="decor-board" />
                <span className="decor-shelf" />
                <span className={`room-cue cue-${agent.id}`} />
              </div>
              <div className="agent-desk">
                <div
                  className={`agent-avatar avatar-${agent.avatarTone}`}
                  aria-hidden="true"
                >
                  <span>{avatarMarks[agent.id] ?? agent.name.slice(0, 1)}</span>
                </div>
                <div className="agent-monitor" aria-hidden="true" />
                <div className="agent-paper-stack" aria-hidden="true" />
              </div>
              <div className="agent-speech">
                <div className="agent-card-title">
                  <strong>{agent.name}</strong>
                  <span>{agent.role}</span>
                </div>
                <em>{roomCueLabels[agent.id]}</em>
                <span>{agent.currentTask}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
