import type { WorkflowTask } from "../../types/domain";

export const workflowTasks: WorkflowTask[] = [
  {
    id: "task-paper-a",
    projectId: "project-product-service",
    sourceId: "source-paper-a",
    agentId: "researcher",
    title: "Service Quality Journal A",
    taskType: "Source summary",
    status: "inbox",
    priority: "high",
    nextStep: "Open mock extraction and assign to Researcher",
    createdAt: "2026-05-31T09:40:00+07:00"
  },
  {
    id: "task-imc-youtube",
    projectId: "project-imc",
    sourceId: "source-youtube-imc",
    agentId: "gemini-agent",
    title: "IMC lecture YouTube link",
    taskType: "Transcript summary mock",
    status: "analyzing",
    priority: "medium",
    nextStep: "Keep as demo queue until Gemini workflow is approved",
    createdAt: "2026-05-31T09:45:00+07:00"
  },
  {
    id: "task-obsidian-notes",
    projectId: "project-product-service",
    sourceId: "source-book-chapter",
    agentId: "obsidian-curator",
    title: "Create Obsidian Source Notes",
    taskType: "Markdown note preview",
    status: "analyzing",
    priority: "high",
    nextStep: "Review YAML tags before future vault writing",
    createdAt: "2026-05-31T09:50:00+07:00"
  },
  {
    id: "task-service-synthesis",
    projectId: "project-product-service",
    agentId: "supervisor",
    title: "Service Quality synthesis",
    taskType: "Synthesis note",
    status: "synthesizing",
    priority: "high",
    nextStep: "Merge source claims into chapter argument map",
    createdAt: "2026-05-31T10:02:00+07:00"
  },
  {
    id: "task-customer-loyalty",
    projectId: "project-product-service",
    agentId: "researcher",
    title: "Customer Loyalty relation",
    taskType: "Topic link suggestion",
    status: "synthesizing",
    priority: "medium",
    nextStep: "Confirm relationship to perceived value construct",
    createdAt: "2026-05-31T10:04:00+07:00"
  },
  {
    id: "task-chapter-5",
    projectId: "project-product-service",
    agentId: "writer-agent",
    title: "Chapter 5: Service Quality",
    taskType: "Chapter outline",
    status: "writing",
    priority: "high",
    nextStep: "Draft formal Thai body paragraphs after citation pass",
    createdAt: "2026-05-31T10:08:00+07:00"
  },
  {
    id: "task-citation-check",
    projectId: "project-product-service",
    agentId: "citation-agent",
    title: "APA7 citation checking",
    taskType: "Citation QC",
    status: "review",
    priority: "high",
    nextStep: "Return APA7 warnings to Writer Agent",
    createdAt: "2026-05-31T10:12:00+07:00"
  },
  {
    id: "task-infographic",
    projectId: "project-product-service",
    agentId: "visual-designer",
    title: "Infographic poster generation brief",
    taskType: "A4 visual brief",
    status: "output_ready",
    priority: "medium",
    nextStep: "Hold Canva-ready brief as mock output",
    createdAt: "2026-05-31T10:18:00+07:00"
  },
  {
    id: "task-chapter-4",
    projectId: "project-product-service",
    agentId: "qc-inspector",
    title: "Chapter 4 draft",
    taskType: "Completed draft archive",
    status: "completed",
    priority: "low",
    nextStep: "Archive mock output and keep audit trail",
    createdAt: "2026-05-31T08:10:00+07:00",
    completedAt: "2026-05-31T09:30:00+07:00"
  }
];
