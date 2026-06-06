# ATP Product Vision: Semi-Auto Writer

## 1. Product Positioning

ATP Knowledge Studio is a trusted semi-autopilot knowledge and writing studio.

ATP is not a mostly manual checklist tool. It is not a generic chatbot, not merely a reference manager, and not a visual dashboard project. The product is a source-grounded writing engine with a private knowledge base, strict trust states, and auditable academic production boundaries.

The core product target is a human-governed system where AI performs the heavy research and drafting work when evidence and confidence are sufficient, while the user remains the screener, approver, requester of additional evidence, and final reviewer.

## 2. Core Product Promise

ATP should let the user:

- Input credible sources and personal knowledge, including PDF and DOCX academic papers, textbooks, ebooks, notes, and web sources.
- Build a trusted private library and structured knowledge base from those sources.
- Expand the knowledge base with credible external sources when needed.
- Generate academic, teaching, plain-language, visual, and interactive outputs.
- Preserve traceability, auditability, reversibility, and trust state for important sources, claims, citations, generated sections, and knowledge records.

ATP must not fabricate sources, citations, evidence, case studies, or unsupported claims. When evidence is missing or weak, ATP should say so and ask for meaningful human direction.

## 3. Desired Work Split

The desired work split is:

- AI does approximately 60-70% of the work.
- The user screens, approves, rejects, asks for more evidence, and performs final review at key checkpoints.
- The user does not manually supervise every record unless trust level or academic risk requires it.

ATP should automate low-risk, evidence-supported work aggressively. It should reserve human gates for high-risk academic transitions, such as citation readiness, APA-final status, publication readiness, unsupported claims, and weak or ambiguous source evidence.

## 4. Deep Intake Requirement

A PDF, DOCX, ebook, textbook, or book is not just one source record.

Deep Intake is the hardest and most important technical challenge in ATP. It is the core differentiator that makes the semi-autopilot writer possible.

ATP must be able to decompose long sources into structured records, including:

- `SourceDocument`
- `SourceSection`
- `KnowledgeUnit`
- `EvidenceUnit`
- `CaseUnit`
- `QuoteUnit`
- `TeachingUnit`
- `WritingAngle`

A full textbook may become 200-1,000+ structured records. This is intentional and necessary for semi-auto writing. A single credible source can provide many concepts, cases, definitions, frameworks, examples, statistics, teaching angles, and writing angles.

For example, when the user inputs a complete marketing textbook, ATP should segment, decompose, and index the book into a large searchable knowledge structure. Later, when the user requests a chapter, ATP should retrieve and combine relevant internal knowledge units rather than treating the textbook as one flat citation entry.

Deep Intake is the foundation for Writer quality. If deep intake is weak, Library, Cabinet, Writer, citation review, and output generation will not have reliable raw material. Weak source decomposition creates weak retrieval, weak evidence mapping, weak citation guard behavior, and weak generated output.

## 5. Schema-First Design Warning

The Knowledge Unit schema must be designed carefully before implementation.

Target conceptual hierarchy:

```text
SourceDocument
-> SourceSection
-> KnowledgeUnit
-> EvidenceUnit
-> CaseUnit
-> QuoteUnit
-> TeachingUnit
-> WritingAngle
```

Do not rush database tables or SQLite migrations for these objects without a dedicated schema design sprint. Bad schema design in this layer will create painful migrations, unclear retrieval behavior, weak audit trails, and long-term technical debt.

The schema design sprint should decide, at minimum:

- Object identity and stable IDs.
- Parent/child relationships.
- Source trace references.
- Trust state propagation.
- Language metadata.
- Extraction quality metrics.
- Review and approval states.
- Repeat/reuse ledger links.
- Draft and export consumption references.

## 6. Semi-Auto Writer Workflow

A semi-auto writing workflow should support:

1. Topic or chapter request.
2. Internal retrieval from the private library.
3. Optional credible external source expansion.
4. Coverage analysis for missing or weak evidence.
5. Outline or chapter planning.
6. Evidence mapping from source units to sections.
7. Draft generation.
8. Citation guard review.
9. Repeat and reuse detection for book or textbook mode.
10. Export to DOCX, PDF, or interactive HTML.

For a request such as "Product and Service Management Chapter 1: Introduction to the Service Economy in 2027", ATP should retrieve from the internal library, suggest or search credible external sources when appropriate, integrate textbook concepts with papers, cases, and industry evidence, translate or adapt English material into Thai where useful, draft a coherent chapter, identify weak coverage, and ask the user only at meaningful checkpoints.

## 7. Output Modes

ATP should support these output modes:

- `textbook_chapter`
- `research_article`
- `plain_article`
- `teaching_note`
- `visual_script`
- `interactive_html`

Each output mode can use different review intensity, repeat tracking, citation guard behavior, and export requirements. Academic outputs require stricter evidence and citation boundaries than informal planning or internal teaching drafts.

## 8. Repeat And Reuse Tracking Doctrine

Repeat and reuse tracking is a key ATP differentiator.

Repeat tracking is required for book, textbook, and multi-chapter projects. ATP must know what has already been used so it can protect chapter quality, reduce repetitive examples, and help the user intentionally reuse anchor concepts when appropriate.

ATP must track reuse of:

- Concepts
- Cases
- Examples
- Statistics
- Frameworks
- Claims
- Quotes
- Knowledge units
- Teaching angles

When a case, concept, statistic, framework, or example is reused, ATP should notify the user and classify the repeat:

- Acceptable reuse
- Intentional anchor
- Repeated too heavily
- Should replace with another example or source

For standalone journal articles, research articles, and plain articles, repeat tracking can be lighter because the output is self-contained. For book and textbook projects, repeat tracking is a quality requirement because excessive reuse weakens chapter differentiation.

This requires a `UsageLedger` or `RepeatReuseLedger` design early in the backend roadmap. The ledger should connect knowledge units, evidence units, case units, quotes, frameworks, statistics, draft sections, and exported outputs. It should preserve why an item was reused, whether reuse was accepted, and whether the user intentionally marked it as an anchor.

## 9. Trust State Propagation

Trust states must not stop at the `SourceDocument` level.

Eventually, green/orange/red trust indicators should extend to:

- `SourceDocument`
- `SourceSection`
- `SourceCard`
- `KnowledgeUnit`
- `EvidenceUnit`
- `CaseUnit`
- `QuoteUnit`
- `DraftSection`
- `DraftArtifact`
- Exported output

Trust state should propagate carefully. A trusted source document does not automatically make every extracted claim green. A weak extraction, ambiguous passage, unsupported case, missing trace, or stale citation can lower the trust state of downstream objects.

Use the existing Win95 trust dot visual language where UI indicators are needed. Do not redesign the UI to support trust propagation.

## 10. Thai-First Requirement

Thai language is a first-class product requirement, not a later localization task.

ATP must consider Thai from the beginning for:

- Thai academic documents.
- Mixed Thai-English documents.
- Segmentation.
- Concept extraction.
- English-to-Thai translation and adaptation.
- Thai academic writing.
- Thai plain-language writing.
- Thai teaching examples.
- DOCX, PDF, and HTML output quality.

Thai support affects parsing, chunking, terminology preservation, evidence mapping, translation quality, citation-adjacent copy, and teaching output. It should be designed into Deep Intake and Writer behavior rather than patched on after English workflows are finished.

## 11. Deep Intake Quality Score

Every source that passes Deep Intake should eventually receive a Deep Intake Quality Score.

This score should indicate how complete and reliable the structured extraction is, and whether the semi-auto writer has enough reliable material to work from.

Suggested metrics:

- `extraction_coverage`
- `structure_coverage`
- `knowledge_unit_density`
- `evidence_trace_coverage`
- `language_quality`
- `duplicate_risk`
- `blocker_count`
- `review_need_level`
- `writer_readiness`

The score should not imply citation-ready, APA-final, or publication-ready status. It is a practical signal for whether ATP can safely proceed with retrieval, outline planning, evidence mapping, and draft generation.

## 12. Automation Boundary

ATP should automate low-risk steps when trust is sufficient.

Human gates remain required for high-risk academic transitions:

- No silent APA-final status.
- No silent citation-ready status.
- No fabricated citation.
- No fabricated evidence.
- No unsupported claim presented as fact.
- No publication-ready claim without explicit review.

Trust states guide automation:

- Green means trusted enough for provisional auto-save or proceed, with audit and reversibility.
- Orange means saved or generated, but review is recommended or required before final use.
- Red means blocked or not trusted and requires human action.

Green does not mean publication-final. Orange does not mean unusable. Red means ATP must stop or ask for human action.

## 13. Backend Roadmap Implication

The backend roadmap should prioritize:

1. Production-ready PDF/DOCX deep intake.
2. File validation and duplicate detection.
3. Extraction quality scoring.
4. Source decomposition.
5. `KnowledgeUnit`, `EvidenceUnit`, and `CaseUnit` schema.
6. Schema-first design sprint for structured knowledge objects.
7. Usage ledger or repeat/reuse ledger for book projects.
8. Trust propagation across source, knowledge, draft, and export objects.
9. Thai-first segmentation, extraction, adaptation, and output support.
10. Deep Intake Quality Score.
11. Retrieval and coverage engine.
12. Semi-auto writer engine.
13. DOCX, PDF, and HTML output hardening.

This roadmap shifts ATP away from mock-only preview surfaces and toward production source ingestion, structured knowledge creation, retrieval, coverage analysis, writing, and export.

## 14. UI Alignment

This product vision does not change the accepted Win95 Functional Frontstage.

Existing room mapping remains valid:

- Library = intake and source entry.
- Cabinet = knowledge vault.
- Writer = semi-auto writing and output.
- Art = future visual output.
- Inspector = audit, debug, and detail-on-demand.

Do not revive 8-bit pixel art, isometric virtual office, PNG banner dashboard, SVG scene dashboard, or visual-dashboard-heavy directions.

Future UI additions should preserve the current Win95 Functional Frontstage visual system and reuse the existing trust dot language where trust indicators are needed.

## 15. Codex Prompt Doctrine

Use this instruction block in future Codex work:

```text
ATP is a trusted semi-autopilot knowledge and writing studio. Automate reliable low-risk steps, but preserve explicit review gates for high-risk academic transitions. Do not make ATP mostly manual. Every claim, citation, source, generated section, and knowledge record must be traceable, auditable, reversible, and marked by trust status.
```

Additional implementation reminders:

```text
Deep Intake is ATP's core differentiator. Do not rush KnowledgeUnit, EvidenceUnit, CaseUnit, QuoteUnit, TeachingUnit, WritingAngle, UsageLedger, RepeatReuseLedger, or trust propagation tables without a dedicated schema design sprint. Thai is a first-class requirement from the beginning. Preserve the Win95 Functional Frontstage UI baseline.
```

Future implementation should treat this doctrine as product-level guidance, alongside the Win95 Functional Frontstage UI baseline for visual work.
