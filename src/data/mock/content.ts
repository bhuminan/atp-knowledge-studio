import type {
  InfographicBrief,
  KnowledgeNote,
  SlideBrief,
  SynthesisNote,
  WritingStyleProfile
} from "../../types/domain";

export const knowledgeNotes: KnowledgeNote[] = [
  {
    id: "note-service-quality-source",
    projectId: "project-product-service",
    sourceId: "source-paper-a",
    noteType: "source",
    title: "Service Quality Journal A",
    markdownPath: "01_Sources/Journal Articles/Service Quality Journal A.md",
    tags: ["domain/service-marketing", "topic/service-quality", "source/journal-article"],
    backlinks: ["Service Quality", "Customer Loyalty"],
    status: "ready_for_review"
  },
  {
    id: "note-service-quality-synthesis",
    projectId: "project-product-service",
    noteType: "synthesis",
    title: "Service Quality - Integrated View",
    markdownPath: "03_Synthesis/Service Quality - Integrated View.md",
    tags: ["topic/service-quality", "use/textbook"],
    backlinks: ["Product & Service Marketing Textbook"],
    status: "draft"
  }
];

export const synthesisNotes: SynthesisNote[] = [
  {
    id: "synthesis-service-quality",
    topic: "Service Quality",
    sourceIds: ["source-paper-a", "source-book-chapter", "source-screenshot"],
    insights: [
      "Service quality can be framed as a journey-level construct rather than a single interaction score.",
      "Citation confidence is strongest for conceptual claims and weakest for case examples."
    ],
    similarities: [
      "Sources emphasize expectations, delivery consistency, and customer perception."
    ],
    differences: [
      "The book chapter is more instructional, while the journal source is more measurement-oriented."
    ],
    citationMap: {
      "expectation-delivery gap": ["source-paper-a", "source-book-chapter"],
      "service process touchpoints": ["source-screenshot"]
    },
    markdownPath: "03_Synthesis/Service Quality - Integrated View.md"
  }
];

export const slideBriefs: SlideBrief[] = [
  {
    id: "slide-service-quality",
    projectId: "project-product-service",
    title: "Service Quality Teaching Brief",
    slides: [
      {
        title: "Service Quality as Experience",
        keyMessage: "Quality is judged across the whole service journey.",
        bullets: ["Expectation", "Delivery", "Recovery"],
        speakerNotes:
          "อธิบาย Service Quality ในฐานะประสบการณ์ต่อเนื่อง ไม่ใช่เพียงการประเมินจุดสัมผัสเดียว"
      }
    ],
    keywords: ["service quality", "touchpoint", "customer perception"]
  }
];

export const infographicBriefs: InfographicBrief[] = [
  {
    id: "info-service-quality",
    projectId: "project-product-service",
    title: "Service Quality A4 Poster",
    size: "A4",
    orientation: "portrait",
    palette: ["#0a2342", "#43b8ff", "#26d6a3", "#f6b84a"],
    prompt:
      "Create a text-light A4 portrait teaching poster showing expectation, delivery, recovery, and loyalty links for service quality."
  }
];

export const writingStyleProfiles: WritingStyleProfile[] = [
  {
    id: "academic-thai",
    name: "Academic Marketing Formal",
    description: "ภาษาไทยทางการสำหรับบทความวิชาการและตำรา",
    rules: [
      "Write in formal Thai paragraphs",
      "Use English technical terms in parentheses when needed",
      "Prefer APA7 citation orientation",
      "Flag unsupported claims"
    ],
    examples: [],
    forbiddenWords: ["ยอดเยี่ยม", "สมบูรณ์แบบ", "ปฏิวัติวงการ"],
    preferredTone: "Formal, precise, source-aware"
  }
];
