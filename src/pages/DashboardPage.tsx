import type { Agent, AuditLogEntry, Project, SourceItem, WorkflowTask } from "../types/domain";
import type { NavKey } from "../app/App";
import { WorkflowBoard } from "../features/workflow-board/WorkflowBoard";
import dashboardInputRoom from "../assets/dashboard/dashboard_input_room.png";
import roomArt from "../assets/dashboard/room_art.png";
import roomCabinet from "../assets/dashboard/room_cabinet.png";
import roomWriter from "../assets/dashboard/room_writer.png";

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
  artworkAlt: string;
  artworkSrc: string;
  label: string;
  status: RoomStatus;
  statusLabel: string;
  navKey: NavKey;
  primaryAction: string;
  copy: string;
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
    artworkAlt: "Pixel art AI Librarian Desk input room",
    artworkSrc: dashboardInputRoom,
    label: "AI Librarian Desk",
    status: "orange",
    statusLabel: "Review recommended",
    navKey: "source-inbox",
    primaryAction: "Add sources",
    copy: "Drop or add sources here."
  },
  {
    id: "cabinet",
    title: "CABINET",
    artworkAlt: "Pixel art knowledge cabinet room",
    artworkSrc: roomCabinet,
    label: "Knowledge Vault",
    status: "orange",
    statusLabel: "Review recommended",
    navKey: "source-inbox",
    primaryAction: "Open Library",
    copy: "Search your knowledge vault."
  },
  {
    id: "writer",
    title: "WRITER",
    artworkAlt: "Pixel art writing studio room",
    artworkSrc: roomWriter,
    label: "Writing Studio",
    status: "orange",
    statusLabel: "Draft review",
    navKey: "article-studio",
    primaryAction: "Open Writer",
    copy: "Request chapters and drafts."
  },
  {
    id: "art",
    title: "ART",
    artworkAlt: "Pixel art visual studio room",
    artworkSrc: roomArt,
    label: "Visual Studio",
    status: "green",
    statusLabel: "Preview planned",
    navKey: "visual-studio",
    primaryAction: "Preview Room",
    copy: "Plan visuals and teaching assets."
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
          room={libraryRooms[0]}
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
  room,
  onNavigate
}: {
  room: LibraryRoom;
  onNavigate: (navKey: NavKey) => void;
}) {
  return (
    <button
      aria-label="INPUT Room. Add sample sources in Source Library."
      className="input-room"
      onClick={() => onNavigate(room.navKey)}
      type="button"
    >
      <div className="room-ceiling">
        <span className={`room-status-light status-${room.status}`} />
        <span>{room.statusLabel}</span>
      </div>

      <div className="room-image-frame input-image-frame">
        <img alt={room.artworkAlt} className="room-image" src={room.artworkSrc} />
      </div>

      <div className="input-room-copy">
        <p className="panel-label">{room.label}</p>
        <h3>{room.copy}</h3>
        <div className="room-action-row">
          <span className="room-primary-action">{room.primaryAction}</span>
        </div>
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
      aria-label={`${room.title} room. ${room.primaryAction}.`}
      className={`library-room-card room-${room.id}`}
      onClick={() => onNavigate(room.navKey)}
      type="button"
    >
      <div className="room-image-frame room-card-image-frame">
        <img alt={room.artworkAlt} className="room-image" src={room.artworkSrc} />
      </div>
      <div className="room-card-copy">
        <div className="room-card-title-row">
          <h3>{room.title}</h3>
          <span className={`room-status-chip status-${room.status}`}>{room.statusLabel}</span>
        </div>
        <p>{room.copy}</p>
        <span className="room-primary-action">{room.primaryAction}</span>
      </div>
    </button>
  );
}
