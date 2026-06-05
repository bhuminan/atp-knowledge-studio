import { useMemo, useState } from "react";
import type { Agent } from "../types/domain";
import { agents } from "../data/mock/agents";
import { auditLogs } from "../data/mock/auditLogs";
import { connectorStatuses } from "../data/mock/connectors";
import { chapterDrafts } from "../data/mock/chapterDrafts";
import { activeProject, projects } from "../data/mock/projects";
import { sourceDocuments } from "../data/mock/sourceDocuments";
import { sourceItems } from "../data/mock/sourceItems";
import { workflowTasks } from "../data/mock/workflowTasks";
import { AppShell } from "../layouts/AppShell";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { DashboardPage } from "../pages/DashboardPage";
import { SourceLibraryPage } from "../features/source-library/SourceLibraryPage";
import { WriterStudioPage } from "../features/writer-studio/WriterStudioPage";

export type NavKey =
  | "dashboard"
  | "source-inbox"
  | "workflow-board"
  | "knowledge-brain"
  | "article-studio"
  | "slide-studio"
  | "visual-studio"
  | "obsidian-vault"
  | "audit-log"
  | "settings";

const pageTitles: Record<Exclude<NavKey, "dashboard">, string> = {
  "source-inbox": "Library",
  "workflow-board": "Workflow Board",
  "knowledge-brain": "Cabinet",
  "article-studio": "Writer",
  "slide-studio": "Slide Studio",
  "visual-studio": "Art",
  "obsidian-vault": "Obsidian Vault",
  "audit-log": "Audit Log",
  settings: "Settings"
};

export function App() {
  const [activeNav, setActiveNav] = useState<NavKey>(getInitialNav());
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0].id);

  const selectedAgent: Agent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? agents[0],
    [selectedAgentId]
  );

  return (
    <AppShell
      activeNav={activeNav}
      activeProject={activeProject}
      agents={agents}
      auditLogs={auditLogs}
      connectors={connectorStatuses}
      selectedAgent={selectedAgent}
      setActiveNav={setActiveNav}
    >
      {activeNav === "dashboard" ? (
        <DashboardPage
          agents={agents}
          auditLogs={auditLogs}
          projects={projects}
          selectedAgent={selectedAgent}
          sourceItems={sourceItems}
          workflowTasks={workflowTasks}
          onNavigate={setActiveNav}
          onSelectAgent={setSelectedAgentId}
        />
      ) : activeNav === "source-inbox" ? (
        <SourceLibraryPage sourceDocuments={sourceDocuments} />
      ) : activeNav === "article-studio" ? (
        <WriterStudioPage chapterDrafts={chapterDrafts} />
      ) : (
        <PlaceholderPage
          activeNav={activeNav}
          title={pageTitles[activeNav]}
          agents={agents}
          auditLogs={auditLogs}
          projects={projects}
          selectedAgent={selectedAgent}
          sourceItems={sourceItems}
          workflowTasks={workflowTasks}
          onSelectAgent={setSelectedAgentId}
        />
      )}
    </AppShell>
  );
}

function getInitialNav(): NavKey {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const requestedPage = new URLSearchParams(window.location.search).get("page");

  return requestedPage === "source-inbox" ? "source-inbox" : "dashboard";
}
