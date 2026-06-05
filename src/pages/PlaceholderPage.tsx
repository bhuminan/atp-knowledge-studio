import type { NavKey } from "../app/App";
import type { Agent, AuditLogEntry, Project, SourceItem, WorkflowTask } from "../types/domain";

interface PlaceholderPageProps {
  activeNav: NavKey;
  title: string;
  agents: Agent[];
  auditLogs: AuditLogEntry[];
  projects: Project[];
  selectedAgent: Agent;
  sourceItems: SourceItem[];
  workflowTasks: WorkflowTask[];
  onSelectAgent: (agentId: string) => void;
}

const placeholderCopy: Partial<Record<NavKey, { badge: string; body: string }>> = {
  "knowledge-brain": {
    badge: "Coming soon",
    body: "Reviewed SourceCards will appear here after Library metadata review is complete."
  },
  "article-studio": {
    badge: "Mock sandbox",
    body: "Drafting remains a guarded mock workspace until source review and citation checks are ready."
  },
  "visual-studio": {
    badge: "After Writer",
    body: "Visual outputs are planned after stable Writer outputs."
  },
  settings: {
    badge: "Read-only",
    body: "Provider and integration settings will live here later. This sprint does not wire backend provider changes."
  }
};

export function PlaceholderPage({ activeNav, title }: PlaceholderPageProps) {
  const copy = placeholderCopy[activeNav] ?? {
    badge: "Placeholder",
    body: "This section is intentionally quiet in the functional frontstage."
  };

  return (
    <section className="placeholder-room win-panel" data-testid={`${activeNav}-placeholder`}>
      <div className="win-titlebar placeholder-titlebar">{title}</div>
      <div className="placeholder-body">
        <span className="trust-badge trust-badge-muted">{copy.badge}</span>
        <h1 className="text-detail-title">{title}</h1>
        <p className="text-body">{copy.body}</p>
      </div>
    </section>
  );
}
