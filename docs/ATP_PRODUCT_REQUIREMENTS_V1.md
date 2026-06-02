# ATP_PRODUCT_REQUIREMENTS_V1.md

## ATP Knowledge Studio

### Product Requirements & Strategic Direction (Version 1.0)

### Last Updated: June 2026

---

# 1. Product Vision

ATP (Academic Thinking and Production Studio) is a personal academic production system designed to transform research materials into high-quality academic outputs.

The primary goal is not to build a general AI platform.

The primary goal is to create a practical research-to-writing engine that helps produce:

* Academic textbooks
* Research articles
* Literature reviews
* Teaching materials
* Lecture preparation documents

ATP must prioritize working academic production functionality before platform expansion, UI enhancements, or advanced agent simulations.

---

# 2. Core Philosophy

ATP follows the principle:

Research First → Evidence First → Writing Second

The system must always maintain traceability between outputs and their supporting sources.

The preferred academic writing flow is:

Phenomenon
→ Concept / Theory
→ Research Evidence
→ Managerial Implication

This writing structure reflects the preferred authoring style of the project owner.

---

# 3. Strategic Priority Order

The following priorities are mandatory.

Higher priorities must be completed before lower-priority platform enhancements.

## Priority 1

PDF / DOCX Intake

Capability:

* Import PDF files
* Import DOCX files
* Extract metadata
* Extract text content

---

## Priority 2

Auto Classification & Knowledge Carding

Capability:

Automatically convert documents into structured knowledge assets.

Workflow:

PDF/DOCX
→ Text Extraction
→ Document Segmentation
→ Auto Classification
→ Knowledge Card Generation
→ Human Review
→ Knowledge Vault

---

## Priority 3

Source Card Auto-Creation

Capability:

Automatically generate structured Source Cards from imported documents.

---

## Priority 4

Source-to-Draft Generation

Capability:

Generate academic outputs from approved knowledge assets.

Examples:

* Concept Brief
* Literature Review
* Textbook Chapter
* Teaching Notes

---

## Priority 5

Citation & Evidence Review

Capability:

* Citation Guard
* Evidence Coverage Analysis
* Unsupported Claim Detection
* Traceability Validation

---

## Priority 6

DOCX Export

Capability:

Export production-ready drafts into DOCX format.

---

## Priority 7

Manuscript Enhancement Mode

Capability:

Improve existing academic manuscripts without rewriting them from scratch.

---

## Priority 8

Style DNA Engine

Capability:

Learn writing styles from reference materials and apply them to future outputs.

---

# 4. Core Production Workflow

The core ATP workflow shall be:

PDF / DOCX
→ Text Extraction
→ Document Segmentation
→ Auto Classification
→ Knowledge Card Generation
→ Human Review
→ Knowledge Vault
→ Draft Generation
→ Citation Review
→ DOCX Export

---

# 5. Required Knowledge Asset Types

ATP shall support the following knowledge objects.

## 5.1 Source Card

Purpose:

Represents an entire document.

Examples:

* Journal article
* Book chapter
* Thesis
* Industry report

Required fields:

* Title
* Authors
* Year
* Source Type
* Abstract / Summary
* Citation Information
* Metadata

---

## 5.2 Concept Card

Purpose:

Stores concepts and theories.

Examples:

* Gamification
* Service Quality
* Customer Experience
* Psychological Ownership

Required fields:

* Concept Name
* Definition
* Key Components
* Related Theories
* Source References

---

## 5.3 Evidence Card

Purpose:

Stores research findings.

Required fields:

* Finding
* Context
* Supporting Source
* Reliability
* Citation Link

---

## 5.4 Case Card

Purpose:

Stores business examples and case studies.

Examples:

* Starbucks
* Disney
* Grab
* LINE MAN

Required fields:

* Organization
* Context
* Findings
* Managerial Lessons
* Related Concepts

---

## 5.5 Quote Card

Purpose:

Stores important quotations with page traceability.

Required fields:

* Quotation
* Source
* Page Number
* Citation Link

---

## 5.6 Writing Angle Card

Purpose:

Stores potential writing perspectives.

Examples:

* Gamification as a Customer Experience Tool
* Service Quality as a Driver of Loyalty

Required fields:

* Angle Title
* Description
* Supporting Evidence
* Related Concepts

---

# 6. Auto Classification Requirements

ATP must automatically:

1. Segment documents into meaningful sections.
2. Detect major concepts.
3. Detect theories.
4. Detect research findings.
5. Detect business cases.
6. Detect managerial implications.
7. Generate topic tags.

Examples:

A single article may be tagged as:

* gamification
* customer experience
* service quality
* customer behavior

simultaneously.

ATP must support multi-topic classification.

---

# 7. Human Review Requirement

AI-generated classifications must not be automatically accepted.

Users must be able to:

* Approve tags
* Edit tags
* Remove tags
* Merge tags
* Approve cards
* Reject cards

before final storage.

---

# 8. Manuscript Enhancement Mode

Purpose:

Improve existing academic work.

Inputs:

* DOCX
* PDF

Examples:

* Existing textbook chapters
* Research papers
* Literature reviews

Outputs:

* Structure analysis
* Gap analysis
* Evidence analysis
* Citation review
* Enhancement recommendations
* Improved draft sections

ATP should enhance rather than replace existing author work.

---

# 9. Style DNA Engine

Purpose:

Learn and reproduce preferred writing styles.

Inputs:

* DOCX
* PDF
* Images
* Text Samples

Analysis dimensions:

* Paragraph length
* Sentence length
* Transition patterns
* Reasoning structure
* Evidence usage
* Citation density
* Example usage
* Tone
* Conclusion style

Output:

Style Profile

Example:

Author Style A
→ phenomenon
→ theory
→ evidence
→ managerial implication

The Style DNA Engine should influence future draft generation while preserving factual accuracy and evidence traceability.

---

# 10. Non-Priority Features

The following features are currently deprioritized until the core academic production pipeline is functional.

* Virtual Office Enhancements
* Agent Personality Systems
* Agent Animation Systems
* Workflow Visualization Expansion
* Dashboard Cosmetic Improvements
* Additional Storytelling Layers

These features may be revisited after ATP becomes a working academic production tool.

---

# 11. Definition of Success

ATP V1 is considered successful when the following workflow is possible:

1. User imports academic PDFs.
2. ATP extracts and classifies knowledge.
3. ATP generates reusable knowledge cards.
4. User reviews and approves assets.
5. ATP generates a textbook chapter draft.
6. ATP validates citations and evidence.
7. ATP exports a usable DOCX document.

Success is measured by academic production capability, not UI sophistication.

---

# 12. Long-Term Vision

ATP should evolve into a Concept Intelligence and Academic Production System.

Future workflow:

Keyword
→ Knowledge Vault
→ Evidence Retrieval
→ Concept Synthesis
→ Draft Generation
→ Citation Validation
→ Publication-Ready Output

Example:

"Gamification + Customer Experience"

should generate:

* Concept Overview
* Supporting Evidence
* Contrasting Findings
* Business Cases
* Writing Angles
* Textbook Content
* Research Article Drafts

from the accumulated knowledge base.
