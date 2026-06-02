import { expect, test } from "@playwright/test";

test("Source Library DOCX candidate review flow renders preview-only gates", async ({
  page
}) => {
  await page.goto("/?page=source-inbox&qa=source-library");

  await expect(page.getByTestId("source-library-page")).toBeVisible();
  await expect(page.getByTestId("manual-source-card-form")).toBeVisible();
  await expect(page.getByTestId("source-card-editor")).toBeVisible();

  await page
    .getByTestId("local-path-input")
    .fill("qa-fixtures/qa-service-quality-chapter.docx");
  await page.getByRole("button", { name: "Preview Metadata from Path" }).click();
  await page.getByTestId("extraction-run-button").click();

  await expect(page.getByTestId("extraction-preview-panel")).toBeVisible();
  await expect(page.getByTestId("extraction-preview-panel")).toContainText(
    "Thai Textbook Explanation"
  );
  await expect(page.getByTestId("source-document-candidate-preview")).toBeVisible();
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
