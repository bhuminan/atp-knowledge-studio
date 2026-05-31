import type { Agent } from "../../types/domain";

export const agents: Agent[] = [
  {
    id: "supervisor",
    name: "Supervisor",
    role: "Task planner and routing lead",
    engine: "mock",
    status: "working",
    currentTask: "วางแผน Chapter 5: Service Quality",
    lastOutput: "Created mock routing plan for 6 active tasks",
    confidenceLevel: 92,
    nextAction: "Assign source summaries to Researcher and Citation Agent",
    zone: { row: 1, column: 1 }
  },
  {
    id: "researcher",
    name: "Researcher",
    role: "Source summary and insight extraction",
    engine: "mock",
    status: "working",
    currentTask: "สรุป Journal A และบทหนังสือบทที่ 3",
    lastOutput: "3 key takeaways for service encounter quality",
    confidenceLevel: 88,
    nextAction: "Send knowledge blocks to Synthesis Agent",
    zone: { row: 1, column: 2 }
  },
  {
    id: "gemini-agent",
    name: "Gemini Agent",
    role: "Future YouTube and visual reasoning specialist",
    engine: "mock",
    status: "idle",
    currentTask: "Mock YouTube transcript queue",
    lastOutput: "Placeholder transcript summary for IMC lecture",
    confidenceLevel: 76,
    nextAction: "Wait for Phase 2 connector feasibility",
    zone: { row: 1, column: 3 }
  },
  {
    id: "obsidian-curator",
    name: "Obsidian Curator",
    role: "Markdown note structure and taxonomy",
    engine: "mock",
    status: "completed",
    currentTask: "สร้าง Source Note mock สำหรับ Service Quality",
    lastOutput: "Drafted 3 note previews with YAML and controlled tags",
    confidenceLevel: 91,
    nextAction: "Request approval before any future vault write",
    zone: { row: 2, column: 1 }
  },
  {
    id: "writer-agent",
    name: "Writer Agent",
    role: "Formal Thai academic chapter drafting",
    engine: "mock",
    status: "working",
    currentTask: "ร่างโครง Chapter 5 แบบย่อหน้า",
    lastOutput: "Prepared thesis and section outline for Service Quality",
    confidenceLevel: 84,
    nextAction: "Wait for citation gap report",
    zone: { row: 2, column: 2 }
  },
  {
    id: "case-hunter",
    name: "Case Hunter",
    role: "Verifiable case study candidate finder",
    engine: "mock",
    status: "waiting_approval",
    currentTask: "คัดกรองกรณีศึกษาการบริการในเอเชีย",
    lastOutput: "2 candidate case blocks marked needs verification",
    confidenceLevel: 69,
    nextAction: "Ask user to approve source verification workflow",
    zone: { row: 2, column: 3 }
  },
  {
    id: "citation-agent",
    name: "Citation Agent",
    role: "APA7, citation gap, and source mapping QC",
    engine: "mock",
    status: "working",
    currentTask: "ตรวจ APA7 และ claim-source mapping",
    lastOutput: "Flagged 4 citation gaps in mock chapter claims",
    confidenceLevel: 87,
    nextAction: "Return warnings to Writer Agent",
    zone: { row: 3, column: 1 }
  },
  {
    id: "visual-designer",
    name: "Visual Designer",
    role: "Slide brief and infographic planning",
    engine: "mock",
    status: "working",
    currentTask: "สร้าง brief โปสเตอร์ A4 เรื่อง Service Quality",
    lastOutput: "A4 portrait infographic layout with blue, teal, gold palette",
    confidenceLevel: 82,
    nextAction: "Prepare Canva-ready visual brief in Phase 2",
    zone: { row: 3, column: 2 }
  },
  {
    id: "qc-inspector",
    name: "QC Inspector",
    role: "Logic, style, and hallucination review",
    engine: "mock",
    status: "idle",
    currentTask: "รอตรวจร่างหลัง citation pass",
    lastOutput: "No final draft available yet",
    confidenceLevel: 72,
    nextAction: "Review chapter once Writer Agent finishes draft",
    zone: { row: 3, column: 3 }
  }
];
