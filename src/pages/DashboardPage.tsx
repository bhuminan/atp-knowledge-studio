import { useEffect, useMemo, useState } from "react";
import type { Agent, AuditLogEntry, Project, SourceItem, WorkflowTask } from "../types/domain";
import type { NavKey } from "../app/App";
import artHomeImage from "../assets/dashboard/art_home.png";
import cabinetHomeImage from "../assets/dashboard/cabinet_home.png";
import libraryHomeImage from "../assets/dashboard/library_home.png";
import writerHomeImage from "../assets/dashboard/writer_home.png";
import {
  listSavedSourceDocuments,
  type SavedSourceDocumentListItem
} from "../lib/persistence/LocalVaultDatabase";

interface DashboardPageProps {
  agents: Agent[];
  auditLogs: AuditLogEntry[];
  isInspectorOpen: boolean;
  projects: Project[];
  selectedAgent: Agent;
  sourceItems: SourceItem[];
  workflowTasks: WorkflowTask[];
  onNavigate: (navKey: NavKey) => void;
  onOpenLibraryAdd: () => void;
  onSelectAgent: (agentId: string) => void;
}

type SourceCountState =
  | { status: "loading"; sources: SavedSourceDocumentListItem[] }
  | { status: "ready"; sources: SavedSourceDocumentListItem[] }
  | { status: "fallback"; sources: SavedSourceDocumentListItem[] };

interface HomeRoomCard {
  alt: string;
  badge: string;
  bullets: string[];
  disabled?: boolean;
  image: string;
  route: NavKey;
  stat: string;
  title: string;
}

export function DashboardPage({
  isInspectorOpen,
  onNavigate,
  onOpenLibraryAdd
}: DashboardPageProps) {
  const [sourceCountState, setSourceCountState] = useState<SourceCountState>({
    status: "loading",
    sources: []
  });

  useEffect(() => {
    let isMounted = true;

    listSavedSourceDocuments()
      .then((sources) => {
        if (isMounted) {
          setSourceCountState({ status: "ready", sources });
        }
      })
      .catch(() => {
        if (isMounted) {
          setSourceCountState({ status: "fallback", sources: [] });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const savedCount = sourceCountState.sources.length;
  const reviewCount = useMemo(
    () =>
      sourceCountState.sources.filter((source) =>
        `${source.metadataStatus} ${source.reviewStatus}`.toLowerCase().includes("review")
      ).length,
    [sourceCountState.sources]
  );

  const countCopy =
    sourceCountState.status === "fallback"
      ? "Source count unavailable"
      : savedCount === 0
        ? "No sources yet — add your first source"
        : `${savedCount} sources saved · ${reviewCount} needs review`;
  const actionCopy = savedCount === 0 ? "Add first source" : "Review now →";
  const roomCards: HomeRoomCard[] = [
    {
      alt: "Library research source room",
      badge: "READY",
      bullets: [
        "Add PDF, DOCX or Markdown sources",
        "Review metadata before use in Writer",
        "Full audit trail for every source"
      ],
      image: libraryHomeImage,
      route: "source-inbox",
      stat: `${savedCount} saved · ${reviewCount} review`,
      title: "Library"
    },
    {
      alt: "Cabinet knowledge vault room",
      badge: "COMING SOON",
      bullets: [
        "SourceCards appear after metadata review",
        "Organise knowledge by topic and tag",
        "Citation-ready records stored here"
      ],
      image: cabinetHomeImage,
      route: "knowledge-brain",
      stat: "0 SourceCards",
      title: "Cabinet"
    },
    {
      alt: "Writer chapter draft room",
      badge: "MOCK SANDBOX",
      bullets: [
        "Build chapter drafts from reviewed sources",
        "7-section structure with AI assistance",
        "Citation guard flags missing references"
      ],
      image: writerHomeImage,
      route: "article-studio",
      stat: "Draft workspace",
      title: "Writer"
    },
    {
      alt: "Art visual production room",
      badge: "AFTER WRITER",
      bullets: [
        "Infographic and slide production",
        "Visual layout from draft content",
        "Available after Writer is stable"
      ],
      disabled: true,
      image: artHomeImage,
      route: "visual-studio",
      stat: "Visual planning",
      title: "Art"
    }
  ];

  return (
    <section
      className={`dashboard-home ${isInspectorOpen ? "dashboard-home-inspector-open" : ""}`}
      data-testid="dashboard-home"
    >
      <div className="dashboard-main">
        <section className="win-panel today-strip" data-testid="dashboard-today-strip">
          <p className="text-label">TODAY</p>
          <p className="text-body today-message">{countCopy}</p>
          <button className="win-btn win-btn-primary" onClick={onOpenLibraryAdd} type="button">
            {actionCopy}
          </button>
        </section>

        <section className="room-grid" data-testid="dashboard-room-cards">
          {roomCards.map((card) => (
            <RoomCard
              card={card}
              key={card.title}
              onClick={() => {
                onNavigate(card.route);
              }}
            />
          ))}
        </section>
      </div>

      {!isInspectorOpen ? (
        <aside className="win-panel studio-status" data-testid="studio-status-panel">
          <div className="win-titlebar studio-status-title">Studio Status</div>
          <StatusRow label="SQLite" tone="green" value="Connected" />
          <StatusRow label="Sources" value={sourceCountState.status === "fallback" ? "Unavailable" : String(savedCount)} />
          <StatusRow label="Review queue" value={sourceCountState.status === "fallback" ? "Unavailable" : String(reviewCount)} />
          <StatusRow label="SourceCards" tone="muted" value="0" />
          <StatusRow label="Drafts" tone="muted" value="0" />
          <div className="workflow-progress" aria-label="Workflow progress">
            {["✅ Intake", "⏳ Review", "⬜ SourceCard", "⬜ Citation", "⬜ Draft"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}

function RoomCard({
  card,
  onClick
}: {
  card: HomeRoomCard;
  onClick: () => void;
}) {
  const content = (
    <>
      <span className="room-card-image-panel">
        <img alt={card.alt} draggable={false} src={card.image} />
      </span>
      <span className="room-card-text-panel">
        <span className="room-card-title">{card.title}</span>
        <span className="room-card-badge">{card.badge}</span>
        <span className="room-card-bullets">
          {card.bullets.map((bullet) => (
            <span className="room-card-bullet" key={bullet}>
              {bullet}
            </span>
          ))}
        </span>
        <span className="room-card-stats">{card.stat}</span>
      </span>
    </>
  );

  if (card.disabled) {
    return (
      <div aria-disabled="true" className="room-card room-card-disabled" data-room={card.title.toLowerCase()}>
        {content}
      </div>
    );
  }

  return (
    <button className="room-card" data-room={card.title.toLowerCase()} onClick={onClick} type="button">
      {content}
    </button>
  );
}

function StatusRow({
  label,
  tone = "green",
  value
}: {
  label: string;
  tone?: "green" | "muted";
  value: string;
}) {
  return (
    <div className="status-row">
      <span className={`trust-dot trust-dot-${tone}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
