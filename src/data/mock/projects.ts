import type { Project } from "../../types/domain";

export const projects: Project[] = [
  {
    id: "project-product-service",
    name: "Product & Service Marketing Textbook",
    description: "ตำราการตลาดบริการและผลิตภัณฑ์สำหรับบทเรียนระดับมหาวิทยาลัย",
    domain: "Service Marketing",
    targetOutput: "Chapter draft, slide brief, infographic poster",
    obsidianFolder: "04_Projects/Product & Service Marketing Textbook",
    createdAt: "2026-05-31T08:00:00+07:00",
    updatedAt: "2026-05-31T10:30:00+07:00"
  },
  {
    id: "project-imc",
    name: "IMC Textbook",
    description: "คลังบทเรียน Integrated Marketing Communications",
    domain: "Integrated Marketing Communications",
    targetOutput: "Teaching notes and article outlines",
    obsidianFolder: "04_Projects/IMC Textbook",
    createdAt: "2026-05-31T08:15:00+07:00",
    updatedAt: "2026-05-31T10:20:00+07:00"
  },
  {
    id: "project-marketing-articles",
    name: "Marketing Articles",
    description: "บทความวิชาการและบทความกึ่งวิชาการด้านการตลาด",
    domain: "Marketing",
    targetOutput: "Article briefs and citation reports",
    obsidianFolder: "04_Projects/Marketing Articles",
    createdAt: "2026-05-31T08:30:00+07:00",
    updatedAt: "2026-05-31T09:50:00+07:00"
  }
];

export const activeProject = projects[0];
