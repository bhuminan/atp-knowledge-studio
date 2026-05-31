import { useMemo, useState } from "react";
import type { Agent } from "../types/domain";
import { agents } from "../data/mock/agents";
import { auditLogs } from "../data/mock/auditLogs";
import { connectorStatuses } from "../data/mock/connectors";
import { activeProject } from "../data/mock/projects";
import { sourceItems } from "../data/mock/sourceItems";
import { workflowTasks } from "../data/mock/workflowTasks";
import { AppShell } from "../layouts/AppShell";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { DashboardPage } from "../pages/DashboardPage";

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
  "source-inbox": "Source Inbox",
  "workflow-board": "Workflow Board",
  "knowledge-brain": "Knowledge Brain",
  "article-studio": "Article Studio",
  "slide-studio": "Slide Studio",
  "visual-studio": "Visual Studio",
  "obsidian-vault": "Obsidian Vault",
  "audit-log": "Audit Log",
  settings: "Settings"
};

export function App() {
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
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
          selectedAgent={selectedAgent}
          sourceItems={sourceItems}
          workflowTasks={workflowTasks}
          onSelectAgent={setSelectedAgentId}
        />
      ) : (
        <PlaceholderPage
          activeNav={activeNav}
          title={pageTitles[activeNav]}
          agents={agents}
          auditLogs={auditLogs}
          selectedAgent={selectedAgent}
          sourceItems={sourceItems}
          workflowTasks={workflowTasks}
          onSelectAgent={setSelectedAgentId}
        />
      )}
    </AppShell>
  );
}
