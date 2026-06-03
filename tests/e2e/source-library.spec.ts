import { expect, test } from "@playwright/test";

test("Source Library DOCX candidate review flow renders preview-only gates", async ({
  page
}) => {
  await page.goto("/?page=source-inbox&qa=source-library");

  await expect(page.getByTestId("source-library-page")).toBeVisible();
  await expect(page.getByTestId("manual-source-card-form")).toBeVisible();
  await expect(page.getByTestId("source-card-editor")).toBeVisible();
  await expect(page.getByTestId("real-parser-readiness-panel")).toBeVisible();
  await expect(page.getByTestId("real-parser-preflight-notice")).toContainText(
    "Preflight only"
  );
  await expect(page.getByTestId("real-parser-readiness-panel")).toContainText(
    "DOCX readiness"
  );
  await expect(page.getByTestId("real-parser-readiness-panel")).toContainText(
    "PDF readiness"
  );

  await page
    .getByTestId("local-path-input")
    .fill("qa-fixtures/qa-service-quality-chapter.docx");
  await page.getByRole("button", { name: "Preview Metadata from Path" }).click();
  await expect(page.getByRole("button", { name: "Parse DOCX MVP" })).toBeVisible();
  await page.getByTestId("extraction-run-button").click();

  await expect(page.getByTestId("extraction-preview-panel")).toBeVisible();
  await expect(page.getByTestId("docx-parser-mvp-notice")).toContainText(
    "page numbers are not trusted"
  );
  await expect(page.getByTestId("extraction-preview-panel")).toContainText(
    "Thai Textbook Explanation"
  );
  await expect(page.getByTestId("source-document-candidate-preview")).toBeVisible();
  await expect(page.getByTestId("source-document-candidate-preview")).toContainText(
    "Real DOCX SourceDocument Candidate"
  );
  await expect(page.getByTestId("source-document-candidate-only-notice")).toContainText(
    "Candidate only"
  );
  await expect(page.getByTestId("real-docx-candidate-provenance")).toContainText(
    "real_docx_parser_mvp"
  );
  await expect(page.getByTestId("real-docx-candidate-provenance")).toContainText(
    "docx_page_numbers_untrusted"
  );
  await expect(page.getByTestId("candidate-validation-summary")).toContainText(
    "Needs metadata/review"
  );
  await expect(page.getByTestId("marketing-tag-suggestion-preview")).toBeVisible();
  await expect(page.getByTestId("matched-core-tags")).toContainText("service quality");
  await expect(page.getByTestId("matched-extended-tags")).toBeVisible();
  await expect(page.getByTestId("suggested-marketing-tags")).toBeVisible();
  await expect(page.getByTestId("unmatched-keywords")).toBeVisible();
  await expect(page.getByTestId("tag-suggestion-preview-only-notice")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("marketing-tag-review-summary")).toBeVisible();
  await page.getByTestId("reject-core-marketing-tag-button").first().click();
  await page.getByTestId("approve-suggested-marketing-tag-button").first().click();
  await expect(page.getByTestId("rejected-marketing-tags-count")).toContainText("1");
  await expect(page.getByTestId("approved-marketing-tags-count")).toBeVisible();
  await expect(page.getByTestId("needs-review-marketing-tags-count")).toBeVisible();
  await expect(page.getByTestId("tag-review-preview-only-notice")).toContainText(
    "Approved tags are applied in preview only."
  );
  await expect(page.getByTestId("mock-vault-save-preview")).toContainText(
    "Vault save preview is available only after approval."
  );

  await page.getByTestId("review-state-approved").click();

  await expect(page.getByTestId("candidate-validation-summary")).toContainText(
    "Ready for future vault save"
  );
  await expect(page.getByTestId("source-card-candidate-preview")).toBeVisible();
  await expect(page.getByTestId("approved-tags-source-card-preview")).toContainText(
    "Approved tags are applied in preview only."
  );
  await expect(page.getByTestId("approved-tags-source-card-preview")).not.toContainText(
    "service quality quality"
  );
  await expect(
    page.getByTestId("source-card-candidate-preview-only-notice")
  ).toContainText("Preview only");
  await expect(page.getByTestId("source-card-candidate-preview")).toContainText(
    "DOCX page numbers are not trusted"
  );
  await expect(page.getByTestId("knowledge-card-candidate-preview")).toBeVisible();
  await expect(page.getByTestId("approved-tags-knowledge-card-preview")).toContainText(
    "Approved tags are applied in preview only."
  );
  await expect(page.getByTestId("approved-tags-knowledge-card-preview")).not.toContainText(
    "service quality quality"
  );
  await expect(page.getByTestId("concept-card-candidates")).toContainText(
    "service quality"
  );
  await expect(page.getByTestId("evidence-card-candidates")).toContainText(
    "Evidence for"
  );
  await expect(page.getByTestId("quote-card-candidates")).toContainText(
    "คุณภาพการบริการ"
  );
  await expect(page.getByTestId("case-card-candidates")).toContainText(
    "Bangkok Service Counter Case"
  );
  await expect(page.getByTestId("writing-angle-card-candidates")).toContainText(
    "textbook explanation"
  );
  await expect(page.getByTestId("knowledge-card-preview-only-notice")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("knowledge-card-review-summary")).toBeVisible();
  await expect(page.getByTestId("knowledge-card-review-needs-review-count")).toContainText(
    "5"
  );
  await expect(page.getByTestId("mock-knowledge-vault-save-preview")).toHaveCount(0);

  await page
    .getByTestId("concept-card-candidates")
    .getByRole("button", { name: "Reject" })
    .click();
  await expect(page.getByTestId("knowledge-card-review-rejected-count")).toContainText(
    "1"
  );
  await expect(page.getByTestId("mock-knowledge-vault-save-preview")).toHaveCount(0);
  await page.getByTestId("concept-card-approve-button").click();
  await page.getByTestId("evidence-card-approve-button").click();
  await page.getByTestId("quote-card-approve-button").click();
  await page.getByTestId("case-card-approve-button").click();
  await page.getByTestId("writing-angle-card-approve-button").click();

  await expect(page.getByTestId("knowledge-card-review-approved-count")).toContainText(
    "5"
  );
  await expect(page.getByTestId("knowledge-card-review-needs-review-count")).toContainText(
    "0"
  );
  await expect(page.getByTestId("knowledge-card-review-rejected-count")).toContainText(
    "0"
  );
  await expect(page.getByTestId("knowledge-card-future-vault-readiness")).toContainText(
    "Ready for future Knowledge Vault save"
  );
  await expect(page.getByTestId("knowledge-card-future-vault-readiness")).toContainText(
    "Knowledge Cards are reviewed locally only. No cards are saved."
  );
  await expect(page.getByTestId("mock-knowledge-vault-save-preview")).toBeVisible();
  await expect(page.getByTestId("mock-vault-source-document-summary")).toContainText(
    "Pending real persistence"
  );
  await expect(page.getByTestId("mock-vault-source-card-summary")).toContainText(
    "candidate-source-card"
  );
  await expect(page.getByTestId("mock-vault-approved-concept-cards")).toContainText(
    "service quality"
  );
  await expect(page.getByTestId("mock-vault-approved-evidence-cards")).toContainText(
    "Evidence for"
  );
  await expect(page.getByTestId("mock-vault-approved-quote-cards")).toContainText(
    "คุณภาพการบริการ"
  );
  await expect(page.getByTestId("mock-vault-approved-case-cards")).toContainText(
    "Bangkok Service Counter Case"
  );
  await expect(page.getByTestId("mock-vault-approved-writing-angle-cards")).toContainText(
    "textbook explanation"
  );
  await expect(page.getByTestId("mock-vault-knowledge-warning-summary")).toContainText(
    "Unresolved needs-review candidates: 0"
  );
  await expect(page.getByTestId("mock-vault-knowledge-preview-only-notice")).toContainText(
    "Mock preview only"
  );
  await expect(page.getByTestId("draft-input-package-preview")).toBeVisible();
  await expect(page.getByTestId("draft-input-source-summary")).toContainText(
    "draft-input-candidate-source-card"
  );
  await expect(page.getByTestId("approved-tags-draft-input-preview")).toContainText(
    "Approved tags are applied in preview only."
  );
  await expect(page.getByTestId("approved-tags-draft-input-preview")).not.toContainText(
    "service quality quality"
  );
  await expect(page.getByTestId("draft-input-concept-section")).toContainText(
    "Concept / Theory"
  );
  await expect(page.getByTestId("draft-input-evidence-section")).toContainText(
    "Research Evidence"
  );
  await expect(page.getByTestId("draft-input-case-section")).toContainText(
    "Phenomenon / Real-world problem"
  );
  await expect(page.getByTestId("draft-input-writing-angle-section")).toContainText(
    "Teaching or Textbook Angle"
  );
  await expect(page.getByTestId("draft-input-citation-readiness")).toContainText(
    "Needs review"
  );
  await expect(page.getByTestId("draft-input-trace-readiness")).toContainText("Ready");
  await expect(page.getByTestId("draft-input-warning-summary")).toContainText(
    "no draft is generated"
  );
  await expect(page.getByTestId("draft-input-preview-only-notice")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("source-to-draft-mock-preview")).toBeVisible();
  await expect(page.getByTestId("draft-preview-summary")).toContainText(
    "textbook_chapter_preview"
  );
  await expect(page.getByTestId("draft-section-phenomenon")).toContainText(
    "Phenomenon / Real-world problem"
  );
  await expect(page.getByTestId("draft-section-concept-theory")).toContainText(
    "Concept / Theory"
  );
  await expect(page.getByTestId("draft-section-research-evidence")).toContainText(
    "Research Evidence"
  );
  await expect(page.getByTestId("draft-section-managerial-implication")).toContainText(
    "Business / Managerial Implication"
  );
  await expect(page.getByTestId("draft-section-teaching-angle")).toContainText(
    "Teaching / Textbook Angle"
  );
  await expect(page.getByTestId("draft-evidence-map")).toContainText("docx:p");
  await expect(page.getByTestId("draft-approved-tag-usage")).toContainText(
    "Approved tag"
  );
  await expect(page.getByTestId("draft-citation-readiness")).toBeVisible();
  await expect(page.getByTestId("draft-trace-readiness")).toContainText("Ready");
  await expect(page.getByTestId("draft-preview-only-notice")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("draft-section-mock-preview")).toBeVisible();
  await expect(page.getByTestId("mock-draft-section-phenomenon")).toContainText(
    "Phenomenon / Real-world problem"
  );
  await expect(page.getByTestId("mock-draft-section-concept-theory")).toContainText(
    "Concept / Theory"
  );
  await expect(page.getByTestId("mock-draft-section-research-evidence")).toContainText(
    "Research Evidence"
  );
  await expect(
    page.getByTestId("mock-draft-section-managerial-implication")
  ).toContainText("Business / Managerial Implication");
  await expect(page.getByTestId("mock-draft-section-teaching-angle")).toContainText(
    "Teaching / Textbook Angle"
  );
  await expect(page.getByTestId("mock-draft-linked-evidence").first()).toBeVisible();
  await expect(page.getByTestId("mock-draft-approved-tags").first()).toContainText(
    "Approved tags"
  );
  await expect(page.getByTestId("mock-draft-citation-readiness")).toBeVisible();
  await expect(page.getByTestId("mock-draft-trace-readiness")).toContainText("Ready");
  await expect(page.getByTestId("mock-draft-preview-only-notice")).toContainText(
    "Mock preview only"
  );
  await expect(page.getByTestId("draft-quality-review-preview")).toBeVisible();
  await expect(page.getByTestId("draft-quality-overall-readiness")).toBeVisible();
  await expect(page.getByTestId("draft-quality-section-reviews")).toContainText(
    "Research Evidence"
  );
  await expect(page.getByTestId("draft-quality-evidence-coverage")).toBeVisible();
  await expect(page.getByTestId("draft-quality-citation-risk")).toContainText(
    "citation review"
  );
  await expect(page.getByTestId("draft-quality-traceability")).toContainText(
    "docx:p"
  );
  await expect(page.getByTestId("draft-quality-managerial-usefulness")).toBeVisible();
  await expect(page.getByTestId("draft-quality-teaching-usefulness")).toBeVisible();
  await expect(page.getByTestId("draft-quality-preview-only-notice")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("pipeline-readiness-summary-preview")).toBeVisible();
  await expect(page.getByTestId("pipeline-readiness-overall-status")).toBeVisible();
  await expect(page.getByTestId("pipeline-readiness-stage-statuses")).toContainText(
    "Text extraction"
  );
  await expect(page.getByTestId("pipeline-readiness-stage-statuses")).toContainText(
    "Draft quality review"
  );
  await expect(page.getByTestId("pipeline-readiness-blockers")).toBeVisible();
  await expect(page.getByTestId("pipeline-readiness-warnings")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("pipeline-readiness-next-action")).toBeVisible();
  await expect(page.getByTestId("pipeline-readiness-preview-only-notice")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("persistence-save-candidate-preview")).toBeVisible();
  await expect(page.getByTestId("save-candidate-bundle-summary")).toContainText(
    "Persisted"
  );
  await expect(page.getByTestId("save-candidate-source-document")).toContainText(
    "SourceDocument save candidate"
  );
  await expect(page.getByTestId("save-candidate-source-card")).toContainText(
    "SourceCard save candidate"
  );
  await expect(page.getByTestId("save-candidate-marketing-tags")).toContainText(
    "save-candidate-tag"
  );
  await expect(page.getByTestId("save-candidate-knowledge-cards")).toContainText(
    "save-candidate"
  );
  await expect(page.getByTestId("save-candidate-draft-artifact")).toContainText(
    "mock_only / not final"
  );
  await expect(page.getByTestId("save-candidate-blockers")).toBeVisible();
  await expect(page.getByTestId("save-candidate-warnings")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("save-candidate-preview-only-notice")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("persistence-dry-run-preview")).toBeVisible();
  await expect(page.getByTestId("persistence-dry-run-status")).toContainText(
    "persisted: no"
  );
  await expect(page.getByTestId("persistence-dry-run-simulated-counts")).toContainText(
    "SourceDocs"
  );
  await expect(page.getByTestId("persistence-dry-run-blockers")).toBeVisible();
  await expect(page.getByTestId("persistence-dry-run-warnings")).toContainText(
    "Mock repository dry run"
  );
  await expect(page.getByTestId("persistence-dry-run-preview-only-notice")).toContainText(
    "Dry run only"
  );
  await expect(page.getByTestId("parsed-docx-source-document-save-action")).toContainText(
    "Save Parsed DOCX SourceDocument"
  );
  await expect(page.getByTestId("source-document-save-limited-scope-notice")).toContainText(
    "Explicit save only"
  );
  await expect(page.getByTestId("parsed-docx-save-readiness")).toContainText(
    "real_docx_parser_mvp"
  );
  await expect(page.getByTestId("parsed-docx-save-readiness")).toContainText(
    "DOCX page numbers are not trusted"
  );
  await page.getByTestId("save-source-document-button").click();
  await expect(page.getByTestId("source-document-save-result")).toBeVisible();
  await expect(page.getByTestId("source-document-save-result")).toContainText(
    "persisted: true"
  );
  await expect(page.getByTestId("source-document-save-source-id")).toContainText(
    "candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("source-document-save-extraction-run-id")).toContainText(
    "extraction-run-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("source-document-save-segment-count")).toContainText(
    "4"
  );
  await expect(page.getByTestId("source-document-save-trace-count")).toContainText(
    "4"
  );
  await expect(page.getByTestId("source-document-save-limited-scope-notice")).toContainText(
    "Only SourceDocument extraction data is saved"
  );
  await page.getByTestId("saved-source-document-list-refresh").click();
  await expect(page.getByTestId("saved-source-document-list")).toBeVisible();
  await expect(page.getByTestId("saved-source-document-row")).toContainText(
    "candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("saved-source-document-row")).toContainText(
    "Segments: 4"
  );
  await expect(page.getByTestId("saved-source-document-row")).toContainText(
    "Traces: 4"
  );
  await expect(page.getByTestId("saved-source-document-detail")).toBeVisible();
  await expect(page.getByTestId("saved-source-document-detail")).toContainText(
    "candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("saved-source-document-detail-segments")).toContainText(
    "Thai Textbook Explanation"
  );
  await expect(page.getByTestId("saved-source-document-detail-traces")).toContainText(
    "docx:p"
  );
  await expect(page.getByTestId("saved-source-document-limited-scope-notice")).toContainText(
    "Only SourceDocument extraction data is currently readable"
  );
  await expect(page.getByTestId("parsed-docx-source-card-candidate-panel")).toBeVisible();
  await expect(page.getByTestId("parsed-docx-source-card-candidate-panel")).toContainText(
    "Parsed DOCX SourceCard Candidate"
  );
  await expect(
    page.getByTestId("parsed-docx-source-card-candidate-only-notice")
  ).toContainText("Candidate only");
  await expect(
    page.getByTestId("parsed-docx-source-card-candidate-summary")
  ).toContainText("real_docx_parser_mvp");
  await expect(
    page.getByTestId("parsed-docx-source-card-candidate-summary")
  ).toContainText("authors, year, citationText");
  await expect(
    page.getByTestId("parsed-docx-source-card-candidate-summary")
  ).toContainText("DOCX page numbers remain untrusted");
  await expect(page.getByTestId("parsed-docx-source-card-warnings")).toContainText(
    "Bibliographic metadata is incomplete"
  );
  await expect(page.getByTestId("source-card-persistence-readiness-preview")).toBeVisible();
  await expect(page.getByTestId("source-card-linked-source-document-id")).toContainText(
    "candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("source-card-persistence-status")).toContainText(
    "Needs metadata review"
  );
  await expect(page.getByTestId("source-card-persistence-warnings")).toContainText(
    "citation metadata is incomplete"
  );
  await expect(page.getByTestId("source-card-persistence-preview-only-notice")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("parsed-docx-source-card-save-action")).toContainText(
    "Save Parsed DOCX SourceCard"
  );
  await expect(page.getByTestId("source-card-save-limited-scope-notice")).toContainText(
    "Explicit save only"
  );
  await expect(page.getByTestId("parsed-docx-source-card-save-readiness")).toContainText(
    "needs_metadata"
  );
  await expect(page.getByTestId("parsed-docx-source-card-save-readiness")).toContainText(
    "candidate-source-card-candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("parsed-docx-source-card-save-readiness")).toContainText(
    "Source type: DOCX"
  );
  await expect(page.getByTestId("parsed-docx-source-card-save-readiness")).toContainText(
    "No fabricated citation: yes"
  );
  await page.getByTestId("save-source-card-button").click();
  await expect(page.getByTestId("source-card-save-result")).toBeVisible();
  await expect(page.getByTestId("source-card-save-result")).toContainText(
    "persisted: true"
  );
  await expect(page.getByTestId("source-card-save-source-card-id")).toContainText(
    "candidate-source-card-candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("source-card-save-linked-source-document-id")).toContainText(
    "candidate-document-qa-docx-file-intake-job"
  );
  await expect(
    page.getByTestId("parsed-docx-source-card-save-verification")
  ).toContainText("Saved SourceCard status: saved");
  await expect(
    page.getByTestId("parsed-docx-source-card-save-verification")
  ).toContainText("Citation metadata still needs human review");
  await expect(
    page.getByTestId("parsed-docx-source-card-read-list-verification")
  ).toContainText("Parsed DOCX SourceCard Read/List Verification");
  await expect(
    page.getByTestId("parsed-docx-source-card-read-list-verification")
  ).toContainText("Read detail");
  await expect(
    page.getByTestId("parsed-docx-source-card-read-list-verification")
  ).toContainText("candidate-document-qa-docx-file-intake-job");
  await expect(page.getByTestId("saved-source-card-list")).toBeVisible();
  await expect(page.getByTestId("saved-source-card-row")).toContainText(
    "candidate-source-card-candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("saved-source-card-detail")).toContainText(
    "metadata required"
  );
  await expect(page.getByTestId("source-card-save-limited-scope-notice")).toContainText(
    "Only SourceCard metadata is saved"
  );
  await expect(page.getByTestId("parsed-docx-marketing-tag-candidates-panel")).toBeVisible();
  await expect(page.getByTestId("parsed-docx-marketing-tag-candidates-panel")).toContainText(
    "Parsed DOCX MarketingTag Candidates"
  );
  await expect(
    page.getByTestId("parsed-docx-marketing-tag-candidate-only-notice")
  ).toContainText("Candidates only");
  await expect(page.getByTestId("parsed-docx-marketing-tag-candidates-panel")).toContainText(
    "Core matches"
  );
  await expect(page.getByTestId("parsed-docx-marketing-tag-candidates-panel")).toContainText(
    "Extended matches"
  );
  await expect(page.getByTestId("parsed-docx-marketing-tag-provenance")).toContainText(
    "taxonomy:controlled_seed_only"
  );
  await expect(page.getByTestId("parsed-docx-marketing-tag-provenance")).toContainText(
    "DOCX page numbers remain untrusted"
  );
  await expect(page.getByTestId("parsed-docx-marketing-tag-candidate-list")).toContainText(
    "service quality"
  );
  await expect(page.getByTestId("parsed-docx-marketing-tag-warnings")).toContainText(
    "Controlled taxonomy only"
  );
  await expect(page.getByTestId("parsed-docx-marketing-tag-save-action")).toContainText(
    "Save Approved Parsed DOCX MarketingTags"
  );
  await expect(page.getByTestId("marketing-tags-save-limited-scope-notice")).toContainText(
    "Explicit save only"
  );
  await page.getByTestId("approve-parsed-docx-marketing-tag-button").first().click();
  await page.getByTestId("save-marketing-tags-button").click();
  await expect(page.getByTestId("marketing-tags-save-result")).toBeVisible();
  await expect(page.getByTestId("marketing-tags-save-result")).toContainText(
    "persisted: true"
  );
  await expect(page.getByTestId("marketing-tags-save-count")).toBeVisible();
  await expect(page.getByTestId("marketing-tags-linked-count")).toBeVisible();
  await expect(page.getByTestId("saved-marketing-tags-list")).toContainText(
    "service quality"
  );
  await expect(page.getByTestId("saved-source-card-tags-list")).toContainText(
    "candidate-source-card-candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("marketing-tags-save-limited-scope-notice")).toContainText(
    "Only approved marketing tags are saved"
  );
  await expect(page.getByTestId("parsed-docx-knowledge-card-candidates-panel")).toBeVisible();
  await expect(page.getByTestId("parsed-docx-knowledge-card-candidates-panel")).toContainText(
    "Parsed DOCX KnowledgeCard Candidates"
  );
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-candidate-only-notice")
  ).toContainText("Candidates only");
  await expect(page.getByTestId("parsed-docx-knowledge-card-candidates-panel")).toContainText(
    "Approved tags"
  );
  await expect(page.getByTestId("parsed-docx-knowledge-card-candidates-panel")).toContainText(
    "Trace ready"
  );
  await expect(page.getByTestId("parsed-docx-knowledge-card-provenance")).toContainText(
    "candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("parsed-docx-knowledge-card-provenance")).toContainText(
    "candidate-source-card-candidate-document-qa-docx-file-intake-job"
  );
  await expect(page.getByTestId("parsed-docx-knowledge-card-provenance")).toContainText(
    "chunk reference"
  );
  await expect(page.getByTestId("parsed-docx-knowledge-card-candidate-list")).toContainText(
    "docx:p"
  );
  await expect(page.getByTestId("parsed-docx-knowledge-card-warnings")).toContainText(
    "KnowledgeCards are not auto-saved"
  );
  await expect(page.getByTestId("parsed-docx-knowledge-card-save-action")).toContainText(
    "Save Approved Parsed DOCX KnowledgeCards"
  );
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-save-validation")
  ).toContainText("Parsed DOCX KnowledgeCard Save Verification");
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-save-validation")
  ).toContainText("Explicit-save-only notice");
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-save-validation")
  ).toContainText("DOCX page numbers are untrusted");
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-save-candidate-summary")
  ).toContainText("parsed-docx-knowledge-card");
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-save-validation-warnings")
  ).toContainText("Human academic review");
  await page.getByTestId("approve-parsed-docx-knowledge-card-button").first().click();
  await page.getByTestId("save-knowledge-cards-button").click();
  await expect(page.getByTestId("knowledge-cards-save-result")).toBeVisible();
  await expect(page.getByTestId("knowledge-cards-save-result")).toContainText(
    "persisted: true"
  );
  await expect(page.getByTestId("knowledge-cards-save-count")).toBeVisible();
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-save-verification")
  ).toContainText("Saved KnowledgeCard count");
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-save-verification")
  ).toContainText("trace count");
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-read-list-verification")
  ).toContainText("Parsed DOCX KnowledgeCard Read/List Verification");
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-read-list-verification")
  ).toContainText("Saved KnowledgeCard IDs/types");
  await expect(
    page.getByTestId("parsed-docx-knowledge-card-read-list-verification")
  ).toContainText("human academic review");
  await expect(page.getByTestId("saved-knowledge-cards-list")).toContainText(
    "parsed-docx-knowledge-card"
  );
  await expect(page.getByTestId("saved-knowledge-card-row").first()).toBeVisible();
  await expect(page.getByTestId("saved-knowledge-card-detail")).toContainText(
    "docx:p"
  );
  await expect(page.getByTestId("knowledge-cards-save-limited-scope-notice")).toContainText(
    "Only approved KnowledgeCards are saved"
  );
  await expect(
    page.getByTestId("draft-artifact-persistence-readiness-preview")
  ).toBeVisible();
  await expect(page.getByTestId("draft-artifact-linked-source-card-id")).toContainText(
    "candidate-source-card-candidate-document-qa-docx-file-intake-job"
  );
  await expect(
    page.getByTestId("draft-artifact-linked-knowledge-card-count")
  ).toBeVisible();
  await expect(page.getByTestId("draft-artifact-persistence-status")).toBeVisible();
  await expect(
    page.getByTestId("draft-artifact-persistence-preview-only-notice")
  ).toContainText("Preview only");
  await page.getByTestId("save-draft-artifact-button").click();
  await expect(page.getByTestId("draft-artifact-save-result")).toBeVisible();
  await expect(page.getByTestId("draft-artifact-save-result")).toContainText(
    "persisted: true"
  );
  await expect(page.getByTestId("draft-artifact-save-id")).toContainText(
    "save-candidate-mock-draft"
  );
  await expect(page.getByTestId("draft-artifact-save-section-count")).toBeVisible();
  await expect(
    page.getByTestId("draft-artifact-save-linked-knowledge-card-count")
  ).toBeVisible();
  await expect(page.getByTestId("saved-draft-artifact-list")).toBeVisible();
  await expect(page.getByTestId("saved-draft-artifact-row")).toContainText(
    "mock_only"
  );
  await expect(page.getByTestId("saved-draft-artifact-detail")).toBeVisible();
  await expect(page.getByTestId("saved-draft-artifact-sections")).toContainText(
    "Phenomenon"
  );
  await expect(page.getByTestId("saved-draft-artifact-review-gate")).toBeVisible();
  await expect(
    page.getByTestId("saved-draft-artifact-review-overall-status")
  ).toBeVisible();
  await expect(page.getByTestId("saved-draft-artifact-export-risk")).toBeVisible();
  await expect(page.getByTestId("saved-draft-artifact-section-reviews")).toContainText(
    "Phenomenon"
  );
  await expect(page.getByTestId("saved-draft-artifact-review-warnings")).toContainText(
    "Citation placeholders"
  );
  await expect(
    page.getByTestId("saved-draft-artifact-review-recommendations")
  ).toContainText("Review citation placeholders");
  await expect(
    page.getByTestId("saved-draft-artifact-review-limited-scope-notice")
  ).toContainText("not DOCX export");
  await expect(page.getByTestId("docx-export-package-preview")).toBeVisible();
  await expect(page.getByTestId("docx-export-package-status")).toBeVisible();
  await expect(page.getByTestId("docx-export-package-risk")).toBeVisible();
  await expect(page.getByTestId("docx-export-package-sections")).toContainText(
    "Phenomenon"
  );
  await expect(page.getByTestId("docx-export-evidence-trace-summary")).toContainText(
    "DOCX page numbers trusted"
  );
  await expect(page.getByTestId("docx-export-readiness-checklist")).toContainText(
    "Citation placeholders"
  );
  await expect(page.getByTestId("docx-export-package-warnings")).toContainText(
    "Citation placeholders"
  );
  await expect(page.getByTestId("docx-export-package-next-action")).toContainText(
    "Review citation placeholders"
  );
  await expect(page.getByTestId("docx-export-package-limited-scope-notice")).toContainText(
    "no DOCX file is generated"
  );
  await expect(page.getByTestId("docx-export-mvp-action")).toBeVisible();
  await expect(page.getByTestId("docx-export-mvp-limited-scope-notice")).toContainText(
    "not final manuscript"
  );
  await page.getByTestId("export-docx-mvp-button").click();
  await expect(page.getByTestId("docx-export-mvp-result")).toBeVisible();
  await expect(page.getByTestId("docx-export-mvp-result")).toContainText(
    "exported: true"
  );
  await expect(page.getByTestId("docx-export-mvp-file-path")).toContainText(
    ".docx"
  );
  await expect(page.getByTestId("docx-export-verification-summary")).toBeVisible();
  await expect(page.getByTestId("docx-export-mvp-file-name")).toContainText(
    ".docx"
  );
  await expect(page.getByTestId("docx-export-mvp-file-size")).toContainText(
    "bytes"
  );
  await expect(page.getByTestId("docx-export-mvp-exported-at")).toContainText(
    "qa-mode"
  );
  await expect(page.getByTestId("docx-export-mvp-package-status")).toContainText(
    "needs_review"
  );
  await expect(page.getByTestId("docx-export-mvp-warning-count")).toContainText(
    "Warning count"
  );
  await expect(page.getByTestId("docx-export-copyable-file-path")).toHaveValue(
    /\.docx/
  );
  await expect(page.getByTestId("docx-export-manual-verification-notice")).toContainText(
    "Verify this DOCX manually"
  );
  await expect(page.getByTestId("docx-export-mvp-warnings")).toContainText(
    "QA mode simulates"
  );
  await expect(page.getByTestId("draft-artifact-save-limited-scope-notice")).toContainText(
    "final manuscript is created"
  );
  await expect(page.getByTestId("mock-vault-save-preview")).toContainText(
    "Mock Vault Save Preview"
  );
  await expect(page.getByTestId("mock-vault-save-preview")).toContainText(
    "Pending real persistence"
  );
  await expect(page.getByTestId("mock-vault-save-preview")).toContainText(
    "Mock only — nothing has been saved to Knowledge Vault."
  );
});
