import type { AuditLogEntry } from "../../types/domain";

export const auditLogs: AuditLogEntry[] = [
  {
    id: "log-1028",
    timestamp: "2026-05-31T10:28:00+07:00",
    actor: "Researcher",
    action: "summarized",
    target: "Service Quality Journal A",
    status: "success",
    details: "Mock summary created with 3 takeaways"
  },
  {
    id: "log-1026",
    timestamp: "2026-05-31T10:26:00+07:00",
    actor: "Gemini Agent",
    action: "queued",
    target: "IMC lecture YouTube link",
    status: "info",
    details: "Future connector placeholder only"
  },
  {
    id: "log-1024",
    timestamp: "2026-05-31T10:24:00+07:00",
    actor: "Obsidian Curator",
    action: "created preview",
    target: "3 Source Notes",
    status: "success",
    details: "No files written to a real vault"
  },
  {
    id: "log-1022",
    timestamp: "2026-05-31T10:22:00+07:00",
    actor: "Writer Agent",
    action: "drafted outline",
    target: "Chapter 5",
    status: "success",
    details: "Formal Thai style profile selected"
  },
  {
    id: "log-1018",
    timestamp: "2026-05-31T10:18:00+07:00",
    actor: "Case Hunter",
    action: "flagged",
    target: "2 case candidates",
    status: "warning",
    details: "Verification required before use"
  }
];
