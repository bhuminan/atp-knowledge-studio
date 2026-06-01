import {
  LOCKED_CORE_SECTIONS,
  type ChapterSectionId,
  type CitationMarker,
  type CitationWarning,
  type EvidenceItem,
  type SourceCard,
  type TextbookChapterDraft
} from "../../types/domain";

const mockTimestamp = "2026-06-01T14:20:00+07:00";

const mockSourceCards: SourceCard[] = [
  {
    sourceId: "mock-source-service-quality-001",
    title: "Mock Service Quality Foundations",
    authors: ["MockSource"],
    year: "1988",
    sourceType: "PDF",
    publisherOrJournal: "Mock journal record - verification required",
    citationText: "(MockSource, 1988) [MOCK - verification required]",
    apa7Status: "mock",
    reliabilityLevel: "unknown",
    notes:
      "Mock source card for Sprint 2C contract testing only. Do not treat as verified evidence."
  },
  {
    sourceId: "mock-source-service-encounter-002",
    title: "Mock Service Encounter Teaching Chapter",
    authors: ["MockChapterAuthor"],
    year: "2023",
    sourceType: "DOCX",
    publisherOrJournal: "Mock internal textbook chapter - verification required",
    citationText: "(MockChapterAuthor, 2023) [MOCK - verification required]",
    apa7Status: "mock",
    reliabilityLevel: "unknown",
    notes:
      "Mock DOCX source card for service encounter examples. Real metadata is not attached."
  },
  {
    sourceId: "mock-source-service-quality-notes-003",
    title: "Mock Service Quality Synthesis Notes",
    authors: ["ATP Mock Notes"],
    year: "2026",
    sourceType: "MD",
    publisherOrJournal: "Mock Obsidian note preview - not written to vault",
    citationText: "(ATP Mock Notes, 2026) [MOCK - verification required]",
    apa7Status: "mock",
    reliabilityLevel: "unknown",
    notes:
      "Mock synthesis notes used to test the evidence layer without reading or writing Obsidian files."
  }
];

const mockEvidenceItems: EvidenceItem[] = [
  {
    evidenceId: "mock-evidence-definition-001",
    sourceId: "mock-source-service-quality-001",
    claimSummary:
      "Service quality can be introduced as the gap between customer expectations and experienced delivery.",
    evidenceRole: "definition",
    relatedSectionIds: ["what_is_it"],
    quoteOrParaphrase:
      "Mock paraphrase only: service quality depends on expectation, delivery, and perceived outcome alignment.",
    pageOrLocation: "mock p. 12",
    confidence: 0.64,
    verificationStatus: "mock"
  },
  {
    evidenceId: "mock-evidence-components-002",
    sourceId: "mock-source-service-encounter-002",
    claimSummary:
      "Expectation management, delivery consistency, and service recovery can structure classroom explanation.",
    evidenceRole: "framework",
    relatedSectionIds: ["key_components", "success_factors"],
    quoteOrParaphrase:
      "Mock paraphrase only: service encounters should be mapped through preparation, delivery, and recovery.",
    pageOrLocation: "mock chapter section 3.2",
    confidence: 0.61,
    verificationStatus: "mock"
  },
  {
    evidenceId: "mock-evidence-impact-003",
    sourceId: "mock-source-service-quality-notes-003",
    claimSummary:
      "Service quality affects satisfaction, trust, repeat purchase intention, and perceived value.",
    evidenceRole: "empirical_support",
    relatedSectionIds: ["real_world_impact", "research_evidence"],
    quoteOrParaphrase:
      "Mock synthesis only: consistent service quality is linked with customer satisfaction and loyalty pathways.",
    pageOrLocation: "mock note block SQ-IMPACT",
    confidence: 0.58,
    verificationStatus: "mock"
  },
  {
    evidenceId: "mock-evidence-business-004",
    sourceId: "mock-source-service-encounter-002",
    claimSummary:
      "Managers can use service quality as a system for reducing complaint cost and improving brand trust.",
    evidenceRole: "managerial_implication",
    relatedSectionIds: ["business_relevance", "manager_takeaway"],
    quoteOrParaphrase:
      "Mock paraphrase only: service process management connects frontline behavior with brand promise.",
    pageOrLocation: "mock chapter section 3.5",
    confidence: 0.56,
    verificationStatus: "mock"
  },
  {
    evidenceId: "mock-evidence-teaching-005",
    sourceId: "mock-source-service-quality-notes-003",
    claimSummary:
      "A short classroom vignette can help students distinguish verified cases from illustrative examples.",
    evidenceRole: "teaching_example",
    relatedSectionIds: ["what_is_it", "manager_takeaway"],
    quoteOrParaphrase:
      "Mock teaching note only: mark classroom examples as pending verification until a real case source is attached.",
    pageOrLocation: "mock note block SQ-TEACH",
    confidence: 0.52,
    verificationStatus: "mock"
  }
];

const mockCitationMarkers: CitationMarker[] = [
  {
    markerId: "mock-citation-definition-001",
    sourceId: "mock-source-service-quality-001",
    evidenceId: "mock-evidence-definition-001",
    citationText: "(MockSource, 1988) [MOCK - verification required]",
    appearsInSectionId: "what_is_it",
    verificationStatus: "mock",
    mockStatus: "mock"
  },
  {
    markerId: "mock-citation-components-002",
    sourceId: "mock-source-service-encounter-002",
    evidenceId: "mock-evidence-components-002",
    citationText: "(MockChapterAuthor, 2023) [MOCK - verification required]",
    appearsInSectionId: "key_components",
    verificationStatus: "mock",
    mockStatus: "mock"
  },
  {
    markerId: "mock-citation-impact-003",
    sourceId: "mock-source-service-quality-notes-003",
    evidenceId: "mock-evidence-impact-003",
    citationText: "(ATP Mock Notes, 2026) [MOCK - verification required]",
    appearsInSectionId: "real_world_impact",
    verificationStatus: "mock",
    mockStatus: "mock"
  },
  {
    markerId: "mock-citation-manager-004",
    sourceId: "mock-source-service-encounter-002",
    evidenceId: "mock-evidence-business-004",
    citationText: "(MockChapterAuthor, 2023) [MOCK - verification required]",
    appearsInSectionId: "manager_takeaway",
    verificationStatus: "mock",
    mockStatus: "mock"
  }
];

const mockCitationWarnings: CitationWarning[] = [
  {
    warningId: "mock-warning-citations-001",
    severity: "high",
    code: "MOCK_CITATION_REQUIRES_VERIFICATION",
    message:
      "All citation markers in this textbook chapter draft are mock records and must be replaced with verified APA 7 sources before export.",
    sectionId: null,
    sourceId: null,
    evidenceId: null
  },
  {
    warningId: "mock-warning-case-002",
    severity: "medium",
    code: "CASE_PLACEHOLDER_NOT_VERIFIED",
    message:
      "Thai and global case placeholders are teaching scaffolds only and are not approved case studies.",
    sectionId: "real_world_impact",
    sourceId: "mock-source-service-quality-notes-003",
    evidenceId: "mock-evidence-impact-003"
  }
];

const sectionEvidenceMap: Record<ChapterSectionId, string[]> = {
  what_is_it: ["mock-evidence-definition-001", "mock-evidence-teaching-005"],
  key_components: ["mock-evidence-components-002"],
  real_world_impact: ["mock-evidence-impact-003"],
  business_relevance: ["mock-evidence-business-004"],
  research_evidence: ["mock-evidence-definition-001", "mock-evidence-impact-003"],
  success_factors: ["mock-evidence-components-002"],
  manager_takeaway: ["mock-evidence-business-004", "mock-evidence-teaching-005"]
};

const sectionBodyMap: Record<ChapterSectionId, string> = {
  what_is_it:
    "คุณภาพการบริการ (Service Quality) คือกรอบคิดที่อธิบายว่าลูกค้าประเมินบริการจากความสัมพันธ์ระหว่างความคาดหวังก่อนรับบริการกับประสบการณ์ที่ได้รับจริงระหว่างและหลังการใช้บริการ ในฉบับร่างจำลองนี้ แนวคิดดังกล่าวถูกใช้เพื่อจัดระเบียบความเข้าใจของผู้เรียน โดยยังต้องยืนยันแหล่งอ้างอิงจริงก่อนนำไปใช้ในต้นฉบับตำรา (MockSource, 1988) [MOCK - verification required].",
  key_components:
    "องค์ประกอบหลักของคุณภาพการบริการประกอบด้วยการจัดการความคาดหวังของลูกค้า ความสม่ำเสมอของการส่งมอบบริการ และความสามารถในการฟื้นฟูบริการเมื่อเกิดข้อผิดพลาด ทั้งสามองค์ประกอบช่วยให้ผู้เรียนเห็นว่าคุณภาพไม่ได้เกิดจากพนักงานคนใดคนหนึ่งเท่านั้น แต่เกิดจากระบบบริการที่ถูกออกแบบและควบคุมอย่างต่อเนื่อง (MockChapterAuthor, 2023) [MOCK - verification required].",
  real_world_impact:
    "ในโลกธุรกิจ คุณภาพการบริการมีผลต่อความพึงพอใจ ความไว้วางใจ การบอกต่อ และความตั้งใจกลับมาใช้บริการซ้ำ อย่างไรก็ตาม ตัวอย่างผลกระทบในฉบับนี้เป็นข้อมูลจำลองเพื่อทดสอบโครงสร้างบทเรียนเท่านั้น จึงต้องเชื่อมกับหลักฐานจริงก่อนใช้เป็นกรณีศึกษาในชั้นเรียน (ATP Mock Notes, 2026) [MOCK - verification required].",
  business_relevance:
    "สำหรับผู้บริหารการตลาด คุณภาพการบริการเป็นเครื่องมือเชิงกลยุทธ์ที่เชื่อมประสบการณ์ลูกค้ากับต้นทุนการแก้ปัญหาและคุณค่าของแบรนด์ หากองค์กรจัดการบริการอย่างเป็นระบบ ผู้จัดการจะสามารถมองเห็นจุดสัมผัสที่สร้างความเสี่ยงและออกแบบมาตรการป้องกันก่อนเกิดความเสียหายต่อความสัมพันธ์กับลูกค้า.",
  research_evidence:
    "หลักฐานเชิงวิชาการเกี่ยวกับคุณภาพการบริการมักเชื่อมโยงกับคุณค่าที่ลูกค้ารับรู้ ความพึงพอใจ และความภักดีของลูกค้า ใน Sprint 2C ข้อความส่วนนี้ยังเป็นร่างจำลองที่ใช้เพื่อทดสอบชั้นหลักฐาน จึงไม่ควรถูกตีความว่าเป็นข้อสรุปจากบทความจริงจนกว่าจะมีการตรวจสอบแหล่งที่มา หน้าอ้างอิง และ DOI หรือ URL.",
  success_factors:
    "ปัจจัยความสำเร็จของการยกระดับคุณภาพการบริการประกอบด้วยมาตรฐานบริการที่ชัดเจน การฝึกอบรมพนักงาน การเก็บข้อมูลประสบการณ์ลูกค้า และระบบเรียนรู้จากข้อร้องเรียน ปัจจัยเหล่านี้ช่วยให้องค์กรเปลี่ยนคุณภาพจากคำประกาศเชิงนโยบายให้กลายเป็นพฤติกรรมที่วัดผลและปรับปรุงได้อย่างต่อเนื่อง.",
  manager_takeaway:
    "ข้อคิดสำหรับผู้จัดการคือ คุณภาพการบริการต้องเริ่มจากการมองเส้นทางลูกค้าเป็นระบบเดียวกัน ตั้งแต่ความคาดหวังก่อนซื้อจนถึงการฟื้นฟูหลังเกิดปัญหา ผู้จัดการควรใช้หลักฐานจริงประกอบการตัดสินใจ และควรแยกตัวอย่างจำลองออกจากกรณีศึกษาที่ผ่านการตรวจสอบอย่างชัดเจน (MockChapterAuthor, 2023) [MOCK - verification required]."
};

export const mockTextbookChapterDraft: TextbookChapterDraft = {
  chapterMeta: {
    chapterId: "mock-textbook-chapter-service-quality",
    chapterTitle: "Service Quality",
    conceptKeyword: "Service Quality",
    targetCourse: "Product & Service Marketing",
    targetLevel: "Undergraduate marketing students",
    language: "th",
    styleMode: "formal_textbook",
    createdByProvider: "Mock Provider - no API call",
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
    mockStatus: "mock"
  },
  frontMatter: {
    overview:
      "บทนี้อธิบายคุณภาพการบริการในฐานะระบบการจัดการประสบการณ์ลูกค้า โดยเชื่อมแนวคิดหลักกับหลักฐานจำลองที่ยังต้องตรวจสอบก่อนใช้งานจริง.",
    openingVignette:
      "ลองนึกถึงนักศึกษาที่ไปใช้บริการร้านกาแฟในมหาวิทยาลัย หากการสั่งซื้อรวดเร็วแต่การแก้ปัญหาเมื่อเครื่องดื่มผิดพลาดล่าช้า นักศึกษาจะประเมินคุณภาพบริการจากประสบการณ์ทั้งหมด ไม่ใช่จากจุดสัมผัสเพียงจุดเดียว.",
    whyItMatters:
      "คุณภาพการบริการสำคัญเพราะเป็นสะพานเชื่อมระหว่างความคาดหวังของลูกค้า การปฏิบัติงานขององค์กร และผลลัพธ์ทางธุรกิจ เช่น ความพึงพอใจ ความไว้วางใจ และการกลับมาใช้บริการซ้ำ.",
    learningObjectives: [
      "อธิบายความหมายของคุณภาพการบริการด้วยภาษาตำราเรียนที่ชัดเจน",
      "จำแนกองค์ประกอบหลักของคุณภาพการบริการและความเกี่ยวข้องกับการจัดการการตลาด",
      "ประเมินตัวอย่างบริการโดยแยกข้อมูลจำลองออกจากหลักฐานที่ผ่านการตรวจสอบ"
    ],
    keyQuestions: [
      "ลูกค้าประเมินคุณภาพการบริการจากจุดใดบ้างในเส้นทางลูกค้า",
      "ผู้จัดการควรใช้หลักฐานแบบใดเพื่อปรับปรุงคุณภาพการบริการ",
      "กรณีศึกษาที่ยังไม่ผ่านการตรวจสอบควรถูกนำเสนออย่างไรในตำราเรียน"
    ]
  },
  coreSections: LOCKED_CORE_SECTIONS.map((section) => {
    const linkedEvidenceIds = sectionEvidenceMap[section.sectionId];
    const citationMarkers = mockCitationMarkers.filter(
      (marker) => marker.appearsInSectionId === section.sectionId
    );

    return {
      sectionId: section.sectionId,
      title: section.title,
      order: section.order,
      bodyThai: sectionBodyMap[section.sectionId],
      linkedEvidenceIds,
      citationMarkers,
      citationStatus: citationMarkers.length > 0 ? "needs_review" : "partially_supported",
      warnings: mockCitationWarnings.filter(
        (warning) => warning.sectionId === section.sectionId
      )
    };
  }),
  evidenceLayer: {
    sourceCards: mockSourceCards,
    evidenceItems: mockEvidenceItems,
    citationMarkers: mockCitationMarkers,
    citationGuardResult: {
      status: "warnings",
      warnings: mockCitationWarnings,
      checkedCitationCount: mockCitationMarkers.length,
      fabricatedRiskCount: 0,
      mockCitationCount: mockCitationMarkers.length,
      unsupportedCitationCount: 0
    },
    evidenceCoverageScore: 0.62,
    verificationStatus: "mock"
  },
  learningApparatus: {
    keyTerms: [
      "Service Quality",
      "Customer Expectation",
      "Delivery Consistency",
      "Service Recovery",
      "Customer Journey"
    ],
    chapterSummary:
      "คุณภาพการบริการเป็นแนวคิดที่ช่วยให้นักการตลาดเข้าใจว่าลูกค้าประเมินบริการจากประสบการณ์รวม ไม่ใช่จากขั้นตอนใดขั้นตอนหนึ่งเท่านั้น ร่างนี้ยังเป็น mock chapter contract ที่ต้องตรวจสอบหลักฐานก่อนเผยแพร่.",
    discussionQuestions: [
      "เหตุใดลูกค้าจึงอาจประเมินบริการเดียวกันแตกต่างกัน",
      "การฟื้นฟูบริการหลังเกิดปัญหาส่งผลต่อความไว้วางใจอย่างไร",
      "ผู้จัดการควรแยกตัวอย่างจำลองออกจากกรณีศึกษาจริงอย่างไร"
    ],
    applicationExercise:
      "ให้นักศึกษาเลือกบริการหนึ่งประเภท แล้วเขียนแผนที่เส้นทางลูกค้าเพื่อระบุจุดที่คุณภาพการบริการอาจลดลง พร้อมระบุว่าหลักฐานใดต้องใช้เพื่อยืนยันข้อเสนอ.",
    reflectionQuestions: [
      "ประสบการณ์บริการใดที่ทำให้คุณเปลี่ยนมุมมองต่อแบรนด์",
      "คุณจะใช้ข้อมูลลูกค้าเพื่อปรับปรุงคุณภาพบริการอย่างมีจริยธรรมได้อย่างไร"
    ]
  },
  casesAndExamples: {
    thaiCases: [
      "กรณีจำลองร้านกาแฟมหาวิทยาลัยในประเทศไทย [MOCK CASE - verification required]"
    ],
    globalCases: [
      "กรณีจำลองสายการบินระหว่างประเทศที่ต้องฟื้นฟูบริการหลังเที่ยวบินล่าช้า [MOCK CASE - verification required]"
    ],
    miniExamples: [
      "ตัวอย่างจำลอง: พนักงานแจ้งเวลารอคิวชัดเจนเพื่อลดความไม่แน่นอนของลูกค้า",
      "ตัวอย่างจำลอง: ระบบติดตามข้อร้องเรียนช่วยให้ผู้จัดการเห็นปัญหาซ้ำในจุดบริการเดิม"
    ]
  },
  exhibits: [
    {
      exhibitId: "mock-exhibit-framework-service-quality",
      exhibitType: "framework",
      title: "Framework Box: Expectation-Delivery-Recovery",
      description:
        "กล่องกรอบแนวคิดจำลองสำหรับอธิบายความสัมพันธ์ระหว่างความคาดหวัง การส่งมอบ และการฟื้นฟูบริการ.",
      relatedSectionIds: ["key_components", "success_factors"],
      placeholderStatus: "placeholder"
    },
    {
      exhibitId: "mock-exhibit-table-service-touchpoints",
      exhibitType: "table",
      title: "Table: Service Touchpoint Evidence Map",
      description:
        "ตารางจำลองสำหรับจับคู่จุดสัมผัสบริการกับหลักฐานที่ต้องใช้ตรวจสอบก่อนเขียนฉบับจริง.",
      relatedSectionIds: ["real_world_impact", "business_relevance"],
      placeholderStatus: "placeholder"
    },
    {
      exhibitId: "mock-exhibit-kpi-service-quality",
      exhibitType: "checklist",
      title: "Metric/KPI Box: Service Quality Review Signals",
      description:
        "กล่อง KPI จำลองสำหรับสรุปตัวชี้วัด เช่น complaint recovery time, satisfaction trend, and repeat visit signal.",
      relatedSectionIds: ["business_relevance", "manager_takeaway"],
      placeholderStatus: "placeholder"
    }
  ],
  teachingOutputs: {
    slideBrief:
      "Placeholder only: 8-10 slide teaching brief covering definition, components, impact, evidence warnings, and managerial takeaway.",
    instructorNotes:
      "Placeholder only: remind instructors that all mock cases and mock citations require verification before classroom publication.",
    quizSeeds: [
      "Which part of service quality connects expectation and actual experience?",
      "Why should mock cases be separated from verified case studies?",
      "What evidence would strengthen a managerial takeaway?"
    ],
    assignmentIdeas: [
      "Create a customer journey map for a selected service and mark evidence gaps.",
      "Rewrite one mock paragraph after replacing mock citations with verified APA 7 sources."
    ]
  },
  validationState: {
    structureStatus: "valid",
    citationStatus: "warnings",
    evidenceStatus: "partially_grounded",
    readinessStatus: "needs_review",
    warnings: mockCitationWarnings
  }
};

export function createMockTextbookChapterDraft(): TextbookChapterDraft {
  return {
    ...mockTextbookChapterDraft,
    chapterMeta: {
      ...mockTextbookChapterDraft.chapterMeta,
      updatedAt: mockTimestamp
    },
    coreSections: mockTextbookChapterDraft.coreSections.map((section) => ({
      ...section,
      citationMarkers: [...section.citationMarkers],
      linkedEvidenceIds: [...section.linkedEvidenceIds],
      warnings: [...section.warnings]
    })),
    evidenceLayer: {
      ...mockTextbookChapterDraft.evidenceLayer,
      sourceCards: [...mockTextbookChapterDraft.evidenceLayer.sourceCards],
      evidenceItems: [...mockTextbookChapterDraft.evidenceLayer.evidenceItems],
      citationMarkers: [...mockTextbookChapterDraft.evidenceLayer.citationMarkers],
      citationGuardResult: {
        ...mockTextbookChapterDraft.evidenceLayer.citationGuardResult,
        warnings: [...mockTextbookChapterDraft.evidenceLayer.citationGuardResult.warnings]
      }
    },
    exhibits: [...mockTextbookChapterDraft.exhibits],
    validationState: {
      ...mockTextbookChapterDraft.validationState,
      warnings: [...mockTextbookChapterDraft.validationState.warnings]
    }
  };
}
