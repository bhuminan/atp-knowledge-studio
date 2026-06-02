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
