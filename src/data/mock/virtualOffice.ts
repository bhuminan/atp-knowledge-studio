import type {
  VirtualOfficeHub,
  VirtualOfficeRoom,
  VirtualOfficeRoomId
} from "../../types/domain";

export const virtualOfficeWorkflowRoute: VirtualOfficeRoomId[] = [
  "intake-dock",
  "evidence-vault",
  "research-lab",
  "blueprint-room",
  "writer-studio",
  "citation-court",
  "tone-studio",
  "visual-lab"
];

export const virtualOfficeHub: VirtualOfficeHub = {
  id: "atp-core-hub",
  title: "ATP Core Hub",
  subtitle: "Orchestrator / workflow monitor / handoff controller",
  status: "working",
  activeHandoff: "Writer Studio -> Citation Court -> Tone Studio / Visual Lab"
};

export const virtualOfficeRooms: VirtualOfficeRoom[] = [
  {
    id: "intake-dock",
    title: "Intake Dock",
    agentId: "intake-agent",
    workflowStep: 1,
    gridArea: "intake",
    handoffTo: ["evidence-vault"],
    cueLabel: "Source intake",
    roomTone: "blue"
  },
  {
    id: "evidence-vault",
    title: "Evidence Vault",
    agentId: "evidence-curator",
    workflowStep: 2,
    gridArea: "evidence",
    handoffTo: ["research-lab"],
    cueLabel: "Source cards",
    roomTone: "teal"
  },
  {
    id: "research-lab",
    title: "Research Lab",
    agentId: "research-intelligence",
    workflowStep: 3,
    gridArea: "research",
    handoffTo: ["blueprint-room"],
    cueLabel: "Insight map",
    roomTone: "violet"
  },
  {
    id: "blueprint-room",
    title: "Blueprint Room",
    agentId: "chapter-planner",
    workflowStep: 4,
    gridArea: "blueprint",
    handoffTo: ["writer-studio"],
    cueLabel: "Chapter plan",
    roomTone: "gold"
  },
  {
    id: "writer-studio",
    title: "Writer Studio",
    agentId: "writer-agent",
    workflowStep: 5,
    gridArea: "writer",
    handoffTo: ["citation-court"],
    cueLabel: "Thai prose",
    roomTone: "blue"
  },
  {
    id: "citation-court",
    title: "Citation Court",
    agentId: "citation-guard",
    workflowStep: 6,
    gridArea: "citation",
    handoffTo: ["tone-studio", "visual-lab"],
    cueLabel: "APA7 guard",
    roomTone: "rose"
  },
  {
    id: "tone-studio",
    title: "Tone Studio",
    agentId: "style-adapter",
    workflowStep: 7,
    gridArea: "tone",
    handoffTo: ["visual-lab"],
    cueLabel: "Style pass",
    roomTone: "slate"
  },
  {
    id: "visual-lab",
    title: "Visual Lab",
    agentId: "visual-designer",
    workflowStep: 8,
    gridArea: "visual",
    handoffTo: [],
    cueLabel: "Teaching visuals",
    roomTone: "teal"
  }
];
