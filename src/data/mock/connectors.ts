import type { ConnectorStatus } from "../../types/domain";

export const connectorStatuses: ConnectorStatus[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    state: "mock",
    label: "Mock connected",
    isMock: true
  },
  {
    id: "openai",
    name: "OpenAI",
    state: "mock",
    label: "Mock online",
    isMock: true
  },
  {
    id: "gemini",
    name: "Gemini",
    state: "mock",
    label: "Mock online",
    isMock: true
  },
  {
    id: "notebooklm",
    name: "NotebookLM",
    state: "mock",
    label: "Mock ready",
    isMock: true
  }
];
