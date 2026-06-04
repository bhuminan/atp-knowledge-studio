import type { Agent, AuditLogEntry, Project, SourceItem, WorkflowTask } from "../types/domain";
import type { NavKey } from "../app/App";
import { WorkflowBoard } from "../features/workflow-board/WorkflowBoard";

interface DashboardPageProps {
  agents: Agent[];
  auditLogs: AuditLogEntry[];
  projects: Project[];
  selectedAgent: Agent;
  sourceItems: SourceItem[];
  workflowTasks: WorkflowTask[];
  onNavigate: (navKey: NavKey) => void;
  onSelectAgent: (agentId: string) => void;
}

type RoomStatus = "green" | "orange" | "red";

interface LibraryRoom {
  id: "input" | "cabinet" | "writer" | "art";
  title: string;
  label: string;
  status: RoomStatus;
  statusLabel: string;
  navKey: NavKey;
  primaryAction: string;
  copy: string;
  detail: string;
  characters: Array<{ name: string; tone: "blue" | "teal" | "gold" | "rose" }>;
  props: string[];
}

const roomStatusLabels: Record<RoomStatus, string> = {
  green: "Trusted enough",
  orange: "Review recommended",
  red: "Human action required"
};

const libraryRooms: LibraryRoom[] = [
  {
    id: "input",
    title: "INPUT Room",
    label: "AI Librarian Desk",
    status: "orange",
    statusLabel: "Review recommended",
    navKey: "source-inbox",
    primaryAction: "Add sources",
    copy: "Drop or add sources here.",
    detail: "AI Librarian organizes sample intake into your knowledge cabinet after review.",
    characters: [
      { name: "AI Librarian", tone: "blue" },
      { name: "Parser Bot", tone: "teal" },
      { name: "Tag Clerk", tone: "gold" },
      { name: "Review Scout", tone: "rose" }
    ],
    props: ["Drop desk", "File tray", "Review lamp"]
  },
  {
    id: "cabinet",
    title: "CABINET",
    label: "Knowledge Vault",
    status: "orange",
    statusLabel: "Review recommended",
    navKey: "source-inbox",
    primaryAction: "Open library",
    copy: "Search concepts, source cards, and evidence bundles.",
    detail: "Cabinet browsing currently routes to Source Library while vault views mature.",
    characters: [
      { name: "Vault Librarian", tone: "teal" },
      { name: "Search Assistant", tone: "blue" }
    ],
    props: ["Concept drawers", "Trace tags", "Map table"]
  },
  {
    id: "writer",
    title: "WRITER",
    label: "Writing Studio",
    status: "orange",
    statusLabel: "Draft review",
    navKey: "article-studio",
    primaryAction: "Open writer",
    copy: "Draft requests and outputs live here.",
    detail: "Use Cabinet material for chapters, articles, literature reviews, and teaching notes.",
    characters: [
      { name: "AI Writer", tone: "blue" },
      { name: "Citation Guard", tone: "rose" }
    ],
    props: ["Draft desk", "APA stamp", "Output queue"]
  },
  {
    id: "art",
    title: "ART",
    label: "Visual Studio",
    status: "green",
    statusLabel: "Preview planned",
    navKey: "visual-studio",
    primaryAction: "Preview room",
    copy: "Plan infographics, slide briefs, and teaching visuals.",
    detail: "Visual generation is planned only; no external image or Canva action runs here.",
    characters: [
      { name: "Visual Director", tone: "gold" },
      { name: "Slide Builder", tone: "teal" }
    ],
    props: ["Slide board", "Figure shelf", "Mood notes"]
  }
];

export function DashboardPage({
  agents,
  auditLogs,
  projects,
  selectedAgent,
  sourceItems,
  workflowTasks,
  onNavigate,
  onSelectAgent
}: DashboardPageProps) {
  const reviewCount = sourceItems.filter((source) => source.confidence < 82).length;
  const readyCount = sourceItems.length - reviewCount;
  const activeAgents = agents.filter((agent) => agent.status === "working").length;
  const warningLogs = auditLogs.filter((log) => log.status === "warning").length;

  return (
    <div className="dashboard-library-home flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      <div className="library-hero pixel-panel">
        <div>
          <p className="panel-label">ATP Knowledge Studio</p>
          <h2>Personal Academic Library</h2>
          <p>
            Feed the library every day. Let the AI Librarian organize sources for later
            writing, teaching, and visual work.
          </p>
        </div>
        <div className="library-trust-summary" aria-label="Sample library status summary">
          <span>
            <strong>{sourceItems.length}</strong>
            sample sources
          </span>
          <span>
            <strong>{reviewCount}</strong>
            need review
          </span>
          <span>
            <strong>{readyCount}</strong>
            no immediate action
          </span>
        </div>
      </div>

      <div className="library-floor pixel-panel">
        <MainInputRoom
          reviewCount={reviewCount}
          room={libraryRooms[0]}
          sourceItems={sourceItems}
          onNavigate={onNavigate}
        />
        <div className="library-side-rooms">
          {libraryRooms.slice(1).map((room) => (
            <RoomCard key={room.id} room={room} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      <details className="pixel-panel dashboard-system-details">
        <summary>System details</summary>
        <div className="dashboard-system-grid">
          <div>
            <p className="panel-label">Room Status Meaning</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(roomStatusLabels) as RoomStatus[]).map((status) => (
                <span className={`room-status-chip status-${status}`} key={status}>
                  {roomStatusLabels[status]}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="panel-label">Diagnostics Preview</p>
            <p className="mt-2 text-sm font-bold text-slate-300">
              {activeAgents} ambient workers active, {warningLogs} sample warning logs, selected:
              {" "}
              {selectedAgent.name}.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <WorkflowBoard
            agents={agents}
            projects={projects}
            sourceItems={sourceItems}
            tasks={workflowTasks}
          />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {agents.slice(0, 4).map((agent) => (
            <button
              className="mini-card text-left hover:border-studio-gold"
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              type="button"
            >
              <span className="font-black text-white">{agent.name}</span>
              <span className="text-xs font-bold text-slate-300">{agent.personalityLabel}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

function MainInputRoom({
  reviewCount,
  room,
  sourceItems,
  onNavigate
}: {
  reviewCount: number;
  room: LibraryRoom;
  sourceItems: SourceItem[];
  onNavigate: (navKey: NavKey) => void;
}) {
  return (
    <button className="input-room" onClick={() => onNavigate(room.navKey)} type="button">
      <div className="room-ceiling">
        <span className={`room-status-light status-${room.status}`} />
        <span>{room.statusLabel}</span>
      </div>

      <div className="input-room-desk" aria-hidden="true">
        <span className="drop-zone-floor" />
        <span className="library-bookshelf shelf-left" />
        <span className="library-bookshelf shelf-right" />
        {room.characters.map((character, index) => (
          <span
            className={`library-character character-${character.tone}`}
            key={character.name}
            style={{ left: `${18 + index * 16}%` }}
          >
            {character.name.slice(0, 1)}
          </span>
        ))}
      </div>

      <div className="input-room-copy">
        <p className="panel-label">{room.label}</p>
        <h3>{room.copy}</h3>
        <p>{room.detail}</p>
        <div className="room-action-row">
          <span className="room-primary-action">{room.primaryAction}</span>
          <span>{reviewCount} sample item(s) may need review</span>
        </div>
      </div>

      <div className="input-source-strip">
        {sourceItems.slice(0, 3).map((source) => (
          <span key={source.id}>
            {source.type}
            <strong>{source.confidence}%</strong>
          </span>
        ))}
      </div>
    </button>
  );
}

function RoomCard({
  room,
  onNavigate
}: {
  room: LibraryRoom;
  onNavigate: (navKey: NavKey) => void;
}) {
  return (
    <button
      className={`library-room-card room-${room.id}`}
      onClick={() => onNavigate(room.navKey)}
      type="button"
    >
      <div className="room-card-header">
        <span>{room.title}</span>
        <span className={`room-status-chip status-${room.status}`}>{room.statusLabel}</span>
      </div>
      <div className="room-card-scene" aria-hidden="true">
        {room.characters.map((character, index) => (
          <span
            className={`library-character character-${character.tone}`}
            key={character.name}
            style={{ left: `${22 + index * 25}%` }}
          >
            {character.name.slice(0, 1)}
          </span>
        ))}
        {room.props.map((prop) => (
          <span className="room-prop" key={prop} />
        ))}
      </div>
      <div className="room-card-copy">
        <p className="panel-label">{room.label}</p>
        <h3>{room.copy}</h3>
        <p>{room.detail}</p>
      </div>
      <span className="room-primary-action">{room.primaryAction}</span>
    </button>
  );
}
