export type AgentStatus =
  | "idle"
  | "working"
  | "waiting_approval"
  | "completed"
  | "error";

export type WorkflowStatus =
  | "inbox"
  | "analyzing"
  | "synthesizing"
  | "writing"
  | "review"
  | "output_ready"
  | "completed";

export type ConnectorState = "connected" | "online" | "ready" | "mock" | "offline";

export type SourceType =
  | "pdf"
  | "screenshot"
  | "markdown"
  | "docx"
  | "web_clip"
  | "youtube";

export interface Project {
  id: string;
  name: string;
  description: string;
  domain: string;
  targetOutput: string;
  obsidianFolder: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceItem {
  id: string;
  projectId: string;
  type: SourceType;
  title: string;
  pathOrUrl: string;
  status: WorkflowStatus;
  metadata: {
    author?: string;
    year?: string;
    journal?: string;
    sourceLabel?: string;
    accessedAt?: string;
  };
  extractedText?: string;
  confidence: number;
  createdAt: string;
}

export interface SourceSummary {
  id: string;
  sourceId: string;
  keyTakeaways: string[];
  claims: string[];
  examples: string[];
  citationClues: string[];
  citationGapWarnings: string[];
}

export interface KnowledgeNote {
  id: string;
  projectId: string;
  sourceId?: string;
  noteType: "source" | "topic" | "synthesis" | "project" | "output";
  title: string;
  markdownPath: string;
  tags: string[];
  backlinks: string[];
  status: "draft" | "ready_for_review" | "approved";
}

export interface SynthesisNote {
  id: string;
  topic: string;
  sourceIds: string[];
  insights: string[];
  similarities: string[];
  differences: string[];
  citationMap: Record<string, string[]>;
  markdownPath: string;
}

export interface WorkflowTask {
  id: string;
  projectId: string;
  sourceId?: string;
  agentId: string;
  title: string;
  taskType: string;
  status: WorkflowStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  completedAt?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  engine: "mock" | "openai" | "gemini" | "local";
  status: AgentStatus;
  currentTask: string;
  lastOutput: string;
  error?: string;
  confidenceLevel: number;
  nextAction: string;
  zone: {
    row: number;
    column: number;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  status: "success" | "warning" | "error" | "info";
  details: string;
}

export interface ConnectorStatus {
  id: string;
  name: string;
  state: ConnectorState;
  label: string;
  isMock: boolean;
}

export interface SlideBrief {
  id: string;
  projectId: string;
  title: string;
  slides: Array<{
    title: string;
    keyMessage: string;
    bullets: string[];
    speakerNotes: string;
  }>;
  keywords: string[];
}

export interface InfographicBrief {
  id: string;
  projectId: string;
  title: string;
  size: "A4";
  orientation: "portrait" | "landscape";
  palette: string[];
  prompt: string;
  generatedFilePath?: string;
}

export interface WritingStyleProfile {
  id: string;
  name: string;
  description: string;
  rules: string[];
  examples: string[];
  forbiddenWords: string[];
  preferredTone: string;
}
