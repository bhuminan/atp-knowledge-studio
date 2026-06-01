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
    roomTone: "blue",
    roomIdentity: "Arrival desk",
    purpose: "Capture raw learning materials.",
    signatureProp: "OCR scanner",
    ambientCue: "Files arriving",
    taskTokenType: "file"
  },
  {
    id: "evidence-vault",
    title: "Evidence Vault",
    agentId: "evidence-curator",
    workflowStep: 2,
    gridArea: "evidence",
    handoffTo: ["research-lab"],
    cueLabel: "Source cards",
    roomTone: "teal",
    roomIdentity: "Evidence archive",
    purpose: "Turn intake into source cards.",
    signatureProp: "Source card stamp",
    ambientCue: "Cards sorted",
    taskTokenType: "source_card"
  },
  {
    id: "research-lab",
    title: "Research Lab",
    agentId: "research-intelligence",
    workflowStep: 3,
    gridArea: "research",
    handoffTo: ["blueprint-room"],
    cueLabel: "Insight map",
    roomTone: "violet",
    roomIdentity: "Concept lab",
    purpose: "Find patterns across evidence.",
    signatureProp: "Insight map",
    ambientCue: "Concept links",
    taskTokenType: "concept"
  },
  {
    id: "blueprint-room",
    title: "Blueprint Room",
    agentId: "chapter-planner",
    workflowStep: 4,
    gridArea: "blueprint",
    handoffTo: ["writer-studio"],
    cueLabel: "Chapter plan",
    roomTone: "gold",
    roomIdentity: "Structure table",
    purpose: "Shape the 7-section chapter.",
    signatureProp: "Chapter blueprint",
    ambientCue: "Outline locked",
    taskTokenType: "outline"
  },
  {
    id: "writer-studio",
    title: "Writer Studio",
    agentId: "writer-agent",
    workflowStep: 5,
    gridArea: "writer",
    handoffTo: ["citation-court"],
    cueLabel: "Thai prose",
    roomTone: "blue",
    roomIdentity: "Drafting desk",
    purpose: "Write formal Thai prose.",
    signatureProp: "Retro keyboard",
    ambientCue: "Draft in progress",
    taskTokenType: "draft"
  },
  {
    id: "citation-court",
    title: "Citation Court",
    agentId: "citation-guard",
    workflowStep: 6,
    gridArea: "citation",
    handoffTo: ["tone-studio", "visual-lab"],
    cueLabel: "APA7 guard",
    roomTone: "rose",
    roomIdentity: "Citation bench",
    purpose: "Block unsupported claims.",
    signatureProp: "APA7 stamp",
    ambientCue: "Citation check",
    taskTokenType: "citation"
  },
  {
    id: "tone-studio",
    title: "Tone Studio",
    agentId: "style-adapter",
    workflowStep: 7,
    gridArea: "tone",
    handoffTo: ["visual-lab"],
    cueLabel: "Style pass",
    roomTone: "slate",
    roomIdentity: "Tone console",
    purpose: "Adapt voice and format.",
    signatureProp: "Tone console",
    ambientCue: "Voice pass",
    taskTokenType: "output"
  },
  {
    id: "visual-lab",
    title: "Visual Lab",
    agentId: "visual-designer",
    workflowStep: 8,
    gridArea: "visual",
    handoffTo: [],
    cueLabel: "Teaching visuals",
    roomTone: "teal",
    roomIdentity: "Visual bench",
    purpose: "Plan diagrams and exhibits.",
    signatureProp: "Pixel lightboard",
    ambientCue: "Visual brief",
    taskTokenType: "output"
  }
];
