import {
  virtualOfficeHub,
  virtualOfficeRooms,
  virtualOfficeWorkflowRoute
} from "../../data/mock/virtualOffice";
import type { Agent, VirtualOfficeRoom } from "../../types/domain";

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
  "intake-agent": "I",
  "evidence-curator": "E",
  "research-intelligence": "R",
  "chapter-planner": "P",
  "writer-agent": "W",
  "citation-guard": "C",
  "style-adapter": "S",
  "visual-designer": "V"
};

export function VirtualOffice({
  agents,
  compact = false,
  selectedAgent,
  onSelectAgent
}: VirtualOfficeProps) {
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  return (
    <div className={`pixel-panel office-scene ${compact ? "office-compact" : ""}`}>
      <div className="office-sky">
        <div>
          <p className="text-xs font-black uppercase text-studio-gold">
            Mock 8-bit Textbook Production Office
          </p>
          <h2 className="text-2xl font-black text-white">ATP Workflow Office</h2>
          <p className="mt-1 text-sm font-bold text-slate-100">
            ห้องทำงานจำลองสำหรับ Source Library → Chapter Engine → Citation Guard
          </p>
        </div>
        <div className="text-right text-xs font-bold text-slate-200">
          <p>8 rooms + ATP Core Hub</p>
          <p>No real API calls</p>
        </div>
      </div>

      <div className="office-grid office-workflow-grid">
        <div className="school-hallway" aria-hidden="true">
          <span className="hallway-locker" />
          <span className="hallway-bulletin" />
          <span className="hallway-clock" />
          <span className="hallway-locker hallway-locker-right" />
        </div>

        <section className="office-hub" aria-label={virtualOfficeHub.title}>
          <p className="workflow-step-badge">Core</p>
          <h3>{virtualOfficeHub.title}</h3>
          <p>{virtualOfficeHub.subtitle}</p>
          <div className="hub-monitor" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <strong>{virtualOfficeHub.activeHandoff}</strong>
        </section>

        {virtualOfficeRooms.map((room) => {
          const agent = agentById.get(room.agentId);
          if (!agent) {
            return null;
          }

          return (
            <OfficeRoom
              agent={agent}
              isSelected={selectedAgent.id === agent.id}
              key={room.id}
              onSelectAgent={onSelectAgent}
              room={room}
            />
          );
        })}
      </div>
    </div>
  );
}

function OfficeRoom({
  agent,
  isSelected,
  onSelectAgent,
  room
}: {
  agent: Agent;
  isSelected: boolean;
  onSelectAgent: (agentId: string) => void;
  room: VirtualOfficeRoom;
}) {
  const handoffLabel =
    room.handoffTo.length > 0
      ? room.handoffTo
          .map((roomId) => virtualOfficeRooms.find((target) => target.id === roomId)?.title)
          .filter(Boolean)
          .join(" / ")
      : "Output ready";
  const animationState = agent.animationState ?? "idle";
  const storyCue = room.ambientCue ?? agent.personalityLabel;

  return (
    <button
      className={`office-room office-room-tone-${room.roomTone} agent-${agent.status} animation-${animationState} ${
        isSelected ? "agent-room-selected" : ""
      }`}
      onClick={() => onSelectAgent(agent.id)}
      style={{ gridArea: room.gridArea }}
      type="button"
    >
      <div className="agent-room-header">
        <span>{room.title}</span>
        <span className="agent-status-token">{statusLabels[agent.status]}</span>
      </div>

      <div className="room-decor" aria-hidden="true">
        <span className="decor-window" />
        <span className="decor-board" />
        <span className="decor-shelf" />
        <span className={`room-cue cue-${room.id}`} />
      </div>

      <div className="workflow-room-row">
        <span className="workflow-step-badge">
          {virtualOfficeWorkflowRoute.indexOf(room.id) + 1}
        </span>
        <span className="handoff-link">{handoffLabel}</span>
      </div>

      <div className="agent-desk">
        <div className={`agent-avatar avatar-${agent.avatarTone}`} aria-hidden="true">
          <span>{avatarMarks[agent.id] ?? agent.name.slice(0, 1)}</span>
        </div>
        <div className="agent-monitor" aria-hidden="true" />
        <div className="agent-paper-stack" aria-hidden="true" />
      </div>

      <div className="agent-speech">
        <div className="agent-card-title">
          <strong>{agent.name}</strong>
          <span className="agent-role-label">{agent.role}</span>
        </div>
        <div className="room-story-row">
          <em>{room.cueLabel}</em>
          {room.taskTokenType ? <span className="task-token">{room.taskTokenType}</span> : null}
        </div>
        {storyCue ? <span className="room-story-cue">{storyCue}</span> : null}
        <span className="agent-task-summary">{agent.currentTask}</span>
      </div>
    </button>
  );
}
