import { useEffect, useMemo, useState } from "react";
import type { Agent, AuditLogEntry, Project, SourceItem, WorkflowTask } from "../types/domain";
import type { NavKey } from "../app/App";
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
          <RoomCard
            badge={reviewCount > 0 ? `${reviewCount} review` : "Ready"}
            badgeTone={reviewCount > 0 ? "orange" : "green"}
            icon="📚"
            stat={`${savedCount} saved · ${reviewCount} review`}
            title="Library"
            onClick={() => onNavigate("source-inbox")}
          />
          <RoomCard
            badge="Coming soon"
            badgeTone="muted"
            icon="🗄"
            stat="0 SourceCards"
            title="Cabinet"
            onClick={() => onNavigate("knowledge-brain")}
          />
          <RoomCard
            badge="Mock sandbox"
            badgeTone="muted"
            icon="✍"
            stat="Draft workspace"
            title="Writer"
            onClick={() => onNavigate("article-studio")}
          />
          <RoomCard
            badge="After Writer"
            badgeTone="muted"
            icon="🎨"
            stat="Visual planning"
            title="Art"
            onClick={() => onNavigate("visual-studio")}
          />
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
  badge,
  badgeTone,
  icon,
  stat,
  title,
  onClick
}: {
  badge: string;
  badgeTone: "green" | "orange" | "muted";
  icon: string;
  stat: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button className="win-panel room-card" onClick={onClick} type="button">
      <span className={`room-card-icon ${title === "Art" ? "room-card-icon-muted" : ""}`} aria-hidden="true">
        {icon}
      </span>
      <span className="text-detail-title">{title}</span>
      <span className={`trust-badge trust-badge-${badgeTone}`}>{badge}</span>
      <span className="text-meta">{stat}</span>
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
