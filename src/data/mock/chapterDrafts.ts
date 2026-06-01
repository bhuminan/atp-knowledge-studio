import type { ChapterDraft } from "../../types/domain";

export const chapterDrafts: ChapterDraft[] = [
  {
    id: "draft-service-quality",
    projectId: "project-product-service",
    topic: "Service Quality",
    audience: "Undergraduate marketing students",
    styleProfileId: "academic-thai",
    exportStatus: "mock_disabled",
    updatedAt: "2026-06-01T09:30:00+07:00",
    geminiCoReviewSummary:
      "Mock co-review: chapter flow is clear for teaching, but visual examples and case evidence should remain pending until source verification is implemented.",
    citationStatuses: [
      {
        id: "cite-concept-ready",
        sectionId: "what-is-it",
        label: "Concept definition",
        status: "metadata_gap",
        sourceDocumentIds: ["doc-service-quality-journal"],
        note: "Author/year and DOI need confirmation before final APA7 output."
      },
      {
        id: "cite-components-ready",
        sectionId: "key-components",
        label: "Expectation, delivery, recovery",
        status: "ready",
        sourceDocumentIds: ["doc-service-encounter-chapter", "doc-service-quality-notes"],
        note: "Mock source map has enough detail for draft preview."
      },
      {
        id: "cite-case-unverified",
        sectionId: "real-world-impact",
        label: "Service recovery case",
        status: "case_unverified",
        sourceDocumentIds: [],
        note: "Case example must stay generic until a verifiable source is added."
      },
      {
        id: "cite-manager-gap",
        sectionId: "manager-takeaway",
        label: "Managerial checklist",
        status: "needs_source",
        sourceDocumentIds: ["doc-service-encounter-chapter"],
        note: "Managerial implication needs a stronger source link."
      }
    ],
    iterationRequests: [
      {
        id: "iter-service-quality-clarity",
        chapterDraftId: "draft-service-quality",
        requestText: "เพิ่มตัวอย่างภาษาไทยให้เห็นภาพ แต่ต้องระบุว่าเป็น mock pending verification",
        status: "mock_pending",
        createdAt: "2026-06-01T09:35:00+07:00"
      }
    ],
    sections: [
      {
        id: "what-is-it",
        order: 1,
        title: "What is it",
        purpose: "Define service quality in a textbook-ready way.",
        sourceDocumentIds: ["doc-service-quality-journal"],
        citationStatusIds: ["cite-concept-ready"],
        draftText:
          "คุณภาพการบริการ (Service Quality) หมายถึงการประเมินของลูกค้าที่เกิดจากการเปรียบเทียบระหว่างความคาดหวังก่อนรับบริการกับประสบการณ์จริงที่ได้รับหลังจากมีปฏิสัมพันธ์กับองค์กร แนวคิดนี้ควรถูกอธิบายในฐานะประสบการณ์ต่อเนื่อง ไม่ใช่คะแนนจากจุดสัมผัสเพียงจุดเดียว [citation needed: author/year pending]"
      },
      {
        id: "key-components",
        order: 2,
        title: "Key Components",
        purpose: "Show the main teaching components for classroom navigation.",
        sourceDocumentIds: ["doc-service-encounter-chapter", "doc-service-quality-notes"],
        citationStatusIds: ["cite-components-ready"],
        draftText:
          "องค์ประกอบหลักของคุณภาพการบริการประกอบด้วยความคาดหวังของลูกค้า (Customer Expectation) ความสม่ำเสมอของการส่งมอบบริการ (Delivery Consistency) และการฟื้นฟูบริการเมื่อเกิดปัญหา (Service Recovery) ทั้งสามส่วนช่วยให้นักศึกษาเห็นว่าคุณภาพไม่ได้เกิดจากขั้นตอนใดขั้นตอนหนึ่ง แต่เกิดจากระบบบริการโดยรวม"
      },
      {
        id: "real-world-impact",
        order: 3,
        title: "Real-world Impact",
        purpose: "Explain customer and market consequences.",
        sourceDocumentIds: ["doc-service-quality-notes"],
        citationStatusIds: ["cite-case-unverified"],
        draftText:
          "ในสถานการณ์จริง คุณภาพการบริการส่งผลต่อความพึงพอใจ ความไว้วางใจ และแนวโน้มการกลับมาใช้บริการซ้ำ ตัวอย่างกรณีบริการควรถูกใช้ด้วยความระมัดระวัง โดยใน Sprint 2A ตัวอย่างทั้งหมดเป็นเพียงตัวอย่างจำลองที่ยังไม่ผ่านการตรวจสอบแหล่งอ้างอิง"
      },
      {
        id: "business-relevance",
        order: 4,
        title: "Business Relevance",
        purpose: "Connect service quality to business performance.",
        sourceDocumentIds: ["doc-service-encounter-chapter"],
        citationStatusIds: [],
        draftText:
          "สำหรับธุรกิจบริการ คุณภาพการบริการมีความเกี่ยวข้องกับการรักษาลูกค้า ต้นทุนการแก้ปัญหา และภาพลักษณ์ของแบรนด์ ผู้จัดการจึงควรมองคุณภาพเป็นระบบการจัดการประสบการณ์ มากกว่ากิจกรรมแก้ไขเฉพาะหน้า"
      },
      {
        id: "research-evidence",
        order: 5,
        title: "Research Evidence",
        purpose: "Summarize research-backed evidence while flagging gaps.",
        sourceDocumentIds: ["doc-service-quality-journal", "doc-service-quality-notes"],
        citationStatusIds: ["cite-concept-ready"],
        draftText:
          "หลักฐานเชิงวิชาการมักเชื่อมโยงคุณภาพการบริการกับคุณค่าที่ลูกค้ารับรู้ (Perceived Value) และความภักดีของลูกค้า (Customer Loyalty) อย่างไรก็ตาม ฉบับร่างนี้ยังต้องตรวจข้อมูลผู้แต่ง ปีพิมพ์ และ DOI/URL ก่อนใช้เป็นต้นฉบับจริงตาม APA 7"
      },
      {
        id: "success-factors",
        order: 6,
        title: "Success Factors",
        purpose: "List factors that make service quality programs work.",
        sourceDocumentIds: ["doc-service-quality-journal"],
        citationStatusIds: [],
        draftText:
          "ปัจจัยความสำเร็จของการจัดการคุณภาพการบริการ ได้แก่ การกำหนดมาตรฐานบริการที่ชัดเจน การฝึกอบรมพนักงาน การติดตามประสบการณ์ลูกค้า และการเรียนรู้จากข้อร้องเรียนอย่างเป็นระบบ ประเด็นเหล่านี้ควรถูกเชื่อมกับแหล่งอ้างอิงก่อนเผยแพร่"
      },
      {
        id: "manager-takeaway",
        order: 7,
        title: "Manager Takeaway",
        purpose: "Close with practical managerial implications.",
        sourceDocumentIds: ["doc-service-encounter-chapter"],
        citationStatusIds: ["cite-manager-gap"],
        draftText:
          "ข้อคิดสำหรับผู้จัดการคือ การยกระดับคุณภาพการบริการต้องเริ่มจากการมองเห็นเส้นทางลูกค้า (Customer Journey) ทั้งระบบ แล้วกำหนดจุดตรวจสอบที่ช่วยให้ทีมงานตอบสนองต่อปัญหาได้รวดเร็ว มีหลักฐาน และสอดคล้องกับคำมั่นสัญญาของแบรนด์"
      }
    ]
  }
];
