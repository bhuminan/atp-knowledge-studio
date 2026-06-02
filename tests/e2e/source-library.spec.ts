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
  await expect(page.getByTestId("mock-vault-save-preview")).toContainText(
    "Vault save preview is available only after approval."
  );

  await page.getByTestId("review-state-approved").click();

  await expect(page.getByTestId("candidate-validation-summary")).toContainText(
    "Ready for future vault save"
  );
  await expect(page.getByTestId("source-card-candidate-preview")).toBeVisible();
  await expect(
    page.getByTestId("source-card-candidate-preview-only-notice")
  ).toContainText("Preview only");
  await expect(page.getByTestId("source-card-candidate-preview")).toContainText(
    "DOCX page numbers are not trusted"
  );
  await expect(page.getByTestId("knowledge-card-candidate-preview")).toBeVisible();
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
