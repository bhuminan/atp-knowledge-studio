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

export type IntakeSourceType =
  | "pdf"
  | "docx"
  | "markdown"
  | "image"
  | "screenshot"
  | "scanned_page"
  | "pasted_text"
  | "web_clip"
  | "youtube";

export type ExtractionStatus =
  | "not_started"
  | "queued"
  | "extracting"
  | "extracted"
  | "needs_review"
  | "failed";

export type IntakeWarningSeverity = "info" | "warning" | "critical";

export interface IntakeWarning {
  id: string;
  severity: IntakeWarningSeverity;
  message: string;
  field?: string;
}

export type EvidenceValue =
  | "textbook_explanation"
  | "research_finding"
  | "case_example"
  | "statistic"
  | "framework"
  | "diagram"
  | "table"
  | "teaching_note"
  | "unknown";

export interface IntakeExtractionResult {
  extractedText?: string;
  cleanedText?: string;
  summary?: string;
  keyConcepts: string[];
  keyClaims: string[];
  evidenceValue: EvidenceValue;
  confidenceLevel: number;
  warnings: IntakeWarning[];
}

export type IntakeReviewStatus =
  | "new"
  | "needs_text_review"
  | "needs_metadata"
  | "ready_for_source_card"
  | "approved"
  | "rejected";

export type IntakeReviewAction =
  | "review_text"
  | "add_metadata"
  | "create_source_card"
  | "approve_for_vault"
  | "reject"
  | "reprocess";

export interface IntakeSourceRecord {
  id: string;
  title: string;
  intakeSourceType: IntakeSourceType;
  originalFilename?: string;
  sourceLabel?: string;
  extractionStatus: ExtractionStatus;
  extractionResult?: IntakeExtractionResult;
  citationMetadataRequired: boolean;
  linkedSourceCardId?: string;
  linkedSourceDocumentId?: string;
  reviewStatus?: IntakeReviewStatus;
  recommendedActions?: IntakeReviewAction[];
  reviewerNote?: string;
  approvedForVault?: boolean;
  citationUseAllowed?: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export type SourceDocumentType = "PDF" | "DOCX" | "MD";

export interface SourceMetadata {
  title: string;
  author?: string;
  year?: string;
  doiOrUrl?: string;
  publisher?: string;
  completeness: "complete" | "partial" | "missing";
}

export interface SourceDocument {
  id: string;
  projectId: string;
  title: string;
  fileName: string;
  fileType: SourceDocumentType;
  metadata: SourceMetadata;
  citationReadiness: "ready" | "needs_review" | "missing_metadata";
  chapterRelevance: "high" | "medium" | "low";
  indexedAt: string;
  parserStatus: "mock_indexed" | "mock_pending" | "mock_needs_review";
  summaryPreview: string;
  linkedChapterSections: string[];
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

export interface CitationStatus {
  id: string;
  sectionId: string;
  label: string;
  status: "ready" | "needs_source" | "metadata_gap" | "case_unverified";
  sourceDocumentIds: string[];
  note: string;
}

export interface ChapterSection {
  id: string;
  order: number;
  title: string;
  purpose: string;
  draftText: string;
  sourceDocumentIds: string[];
  citationStatusIds: string[];
}

export interface IterationRequest {
  id: string;
  chapterDraftId: string;
  requestText: string;
  status: "mock_pending" | "mock_applied" | "mock_blocked";
  createdAt: string;
}

export interface ChapterDraft {
  id: string;
  projectId: string;
  topic: string;
  audience: string;
  styleProfileId: string;
  sections: ChapterSection[];
  citationStatuses: CitationStatus[];
  iterationRequests: IterationRequest[];
  geminiCoReviewSummary: string;
  exportStatus: "mock_disabled" | "mock_ready";
  updatedAt: string;
}

export type ChapterSectionId =
  | "what_is_it"
  | "key_components"
  | "real_world_impact"
  | "business_relevance"
  | "research_evidence"
  | "success_factors"
  | "manager_takeaway";

export interface LockedCoreSectionDefinition {
  sectionId: ChapterSectionId;
  title: string;
  order: number;
}

export const LOCKED_CORE_SECTIONS = [
  { sectionId: "what_is_it", title: "What is it", order: 1 },
  { sectionId: "key_components", title: "Key Components", order: 2 },
  { sectionId: "real_world_impact", title: "Real-world Impact", order: 3 },
  { sectionId: "business_relevance", title: "Business Relevance", order: 4 },
  { sectionId: "research_evidence", title: "Research Evidence", order: 5 },
  { sectionId: "success_factors", title: "Success Factors", order: 6 },
  { sectionId: "manager_takeaway", title: "Manager Takeaway", order: 7 }
] as const satisfies readonly LockedCoreSectionDefinition[];

export type ChapterLanguage = "th" | "en";

export type ChapterStyleMode =
  | "formal_textbook"
  | "academic_article"
  | "business_journalism"
  | "custom";

export type ChapterMockStatus = "mock" | "real" | "mixed";

export type VerificationStatus = "verified" | "mock" | "needs_review" | "unsupported";

export type TextbookCitationStatus =
  | "supported"
  | "partially_supported"
  | "unsupported"
  | "needs_review";

export type Apa7Status = "ready" | "needs_metadata" | "needs_review" | "mock";

export type SourceReliabilityLevel = "high" | "medium" | "low" | "unknown";

export type EvidenceRole =
  | "definition"
  | "framework"
  | "empirical_support"
  | "case_context"
  | "managerial_implication"
  | "teaching_example";

export type CitationWarningSeverity = "critical" | "high" | "medium" | "low";

export type CitationGuardStatus = "passed" | "warnings" | "blocked" | "not_checked";

export type TextbookStructureStatus = "valid" | "invalid" | "not_checked";

export type TextbookEvidenceStatus =
  | "grounded"
  | "partially_grounded"
  | "ungrounded"
  | "not_checked";

export type TextbookReadinessStatus =
  | "draft"
  | "needs_review"
  | "ready_for_export"
  | "blocked";

export type ExhibitType =
  | "table"
  | "diagram"
  | "framework"
  | "checklist"
  | "infographic_placeholder";

export type ExhibitPlaceholderStatus = "placeholder" | "mock_ready" | "ready";

export interface TextbookChapterDraft {
  chapterMeta: ChapterMeta;
  frontMatter: ChapterFrontMatter;
  coreSections: TextbookCoreSection[];
  evidenceLayer: EvidenceLayer;
  learningApparatus: LearningApparatus;
  casesAndExamples: CasesAndExamples;
  exhibits: Exhibit[];
  teachingOutputs: TeachingOutputs;
  validationState: TextbookChapterValidationState;
}

export interface ChapterMeta {
  chapterId: string;
  chapterTitle: string;
  conceptKeyword: string;
  targetCourse: string;
  targetLevel: string;
  language: ChapterLanguage;
  styleMode: ChapterStyleMode;
  createdByProvider: string;
  createdAt: string;
  updatedAt: string;
  mockStatus: ChapterMockStatus;
}

export interface ChapterFrontMatter {
  overview: string;
  openingVignette: string;
  whyItMatters: string;
  learningObjectives: string[];
  keyQuestions: string[];
}

export interface TextbookCoreSection {
  sectionId: ChapterSectionId;
  title: string;
  order: number;
  bodyThai: string;
  linkedEvidenceIds: string[];
  citationMarkers: CitationMarker[];
  citationStatus: TextbookCitationStatus;
  warnings: CitationWarning[];
}

export interface EvidenceLayer {
  sourceCards: SourceCard[];
  evidenceItems: EvidenceItem[];
  citationMarkers: CitationMarker[];
  citationGuardResult: CitationGuardResult;
  evidenceCoverageScore: number;
  verificationStatus: VerificationStatus;
}

export interface SourceCard {
  sourceId: string;
  title: string;
  authors: string[];
  year: string;
  sourceType: SourceDocumentType;
  publisherOrJournal: string;
  citationText: string;
  apa7Status: Apa7Status;
  reliabilityLevel: SourceReliabilityLevel;
  notes: string;
}

export interface EvidenceItem {
  evidenceId: string;
  sourceId: string;
  claimSummary: string;
  evidenceRole: EvidenceRole;
  relatedSectionIds: ChapterSectionId[];
  quoteOrParaphrase: string;
  pageOrLocation: string;
  confidence: number;
  verificationStatus: VerificationStatus;
}

export interface CitationMarker {
  markerId: string;
  sourceId: string;
  evidenceId: string;
  citationText: string;
  appearsInSectionId: ChapterSectionId;
  verificationStatus: VerificationStatus;
  mockStatus: ChapterMockStatus;
}

export interface CitationWarning {
  warningId: string;
  severity: CitationWarningSeverity;
  code: string;
  message: string;
  sectionId: ChapterSectionId | null;
  sourceId: string | null;
  evidenceId: string | null;
}

export interface CitationGuardResult {
  status: CitationGuardStatus;
  warnings: CitationWarning[];
  checkedCitationCount: number;
  fabricatedRiskCount: number;
  mockCitationCount: number;
  unsupportedCitationCount: number;
}

export interface LearningApparatus {
  keyTerms: string[];
  chapterSummary: string;
  discussionQuestions: string[];
  applicationExercise: string;
  reflectionQuestions: string[];
}

export interface CasesAndExamples {
  thaiCases: string[];
  globalCases: string[];
  miniExamples: string[];
}

export interface Exhibit {
  exhibitId: string;
  exhibitType: ExhibitType;
  title: string;
  description: string;
  relatedSectionIds: ChapterSectionId[];
  placeholderStatus: ExhibitPlaceholderStatus;
}

export interface TeachingOutputs {
  slideBrief: string;
  instructorNotes: string;
  quizSeeds: string[];
  assignmentIdeas: string[];
}

export interface TextbookChapterValidationState {
  structureStatus: TextbookStructureStatus;
  citationStatus: CitationGuardStatus;
  evidenceStatus: TextbookEvidenceStatus;
  readinessStatus: TextbookReadinessStatus;
  warnings: CitationWarning[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
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
  nextStep: string;
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
  sourceUsed: string;
  mockOutputPreview: string;
  mockAuditStatus: string;
  error?: string;
  confidenceLevel: number;
  nextAction: string;
  roomLabel: string;
  avatarTone: "blue" | "teal" | "gold" | "rose" | "violet" | "slate";
  personalityLabel?: string;
  archetype?: string;
  missionStatement?: string;
  signatureProp?: string;
  operatingStyle?: string;
  roomId?: VirtualOfficeRoomId;
  workflowStep?: number;
  animationState?: "idle" | "active" | "handoff" | "blocked" | "completed";
  zone: {
    row: number;
    column: number;
  };
}

export type VirtualOfficeRoomId =
  | "intake-dock"
  | "evidence-vault"
  | "research-lab"
  | "blueprint-room"
  | "writer-studio"
  | "citation-court"
  | "tone-studio"
  | "visual-lab";

export type WorkflowStepStatus =
  | "idle"
  | "working"
  | "waiting_approval"
  | "completed"
  | "error";

export interface VirtualOfficeRoom {
  id: VirtualOfficeRoomId;
  title: string;
  agentId: string;
  workflowStep: number;
  gridArea: string;
  handoffTo: VirtualOfficeRoomId[];
  cueLabel: string;
  roomTone: "blue" | "teal" | "gold" | "rose" | "violet" | "slate";
  roomIdentity?: string;
  purpose?: string;
  signatureProp?: string;
  ambientCue?: string;
  taskTokenType?: "file" | "source_card" | "concept" | "outline" | "draft" | "citation" | "output";
}

export interface VirtualOfficeHub {
  id: "atp-core-hub";
  title: string;
  subtitle: string;
  status: WorkflowStepStatus;
  activeHandoff: string;
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
