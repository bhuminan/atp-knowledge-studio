import { expect, test } from "@playwright/test";
import {
  createApaReferenceCandidatePreview,
  type ApaReferenceCandidatePreviewInput
} from "../../src/lib/sources/ApaReferenceCandidatePreviewMapper";
import {
  evaluateStructuredBibliographicMetadataReadiness,
  type StructuredBibliographicMetadataReadinessInput
} from "../../src/lib/sources/StructuredBibliographicMetadataReadinessMapper";
import {
  mapExternalMetadataMatch
} from "../../src/lib/sources/ExternalMetadataMatchMapper";
import {
  getCrossrefFixtureCandidates
} from "../../src/lib/sources/CrossrefFixtureProvider";
import {
  getMockExternalMetadataMatchCandidates
} from "../../src/lib/sources/ExternalMetadataMockProvider";
import {
  mapProviderCandidateComparisons
} from "../../src/lib/sources/ProviderCandidateComparisonMapper";
import {
  mapProviderEvidenceDetails
} from "../../src/lib/sources/ProviderEvidenceDetailMapper";
import type {
  SavedBatchResearchIntakeJob,
  SavedSuggestedMetadataCorrection
} from "../../src/lib/persistence/LocalVaultDatabase";

const compactReadySourceCard = {
  authors: "Parasuraman, Zeithaml, and Berry",
  citationReadiness: "ready",
  citationText: "Parasuraman, Zeithaml, and Berry (1988). SERVQUAL.",
  sourceType: "academic_journal_article",
  title: "SERVQUAL measurement foundation",
  year: "1988"
} as const;

const savedCompactSourceCard = {
  ...compactReadySourceCard,
  sourceCardId: "candidate-source-card-qa"
} satisfies ApaReferenceCandidatePreviewInput["compactSourceCard"];

function metadataFixture(
  overrides: Partial<NonNullable<StructuredBibliographicMetadataReadinessInput["metadata"]>> = {}
): NonNullable<StructuredBibliographicMetadataReadinessInput["metadata"]> {
  return {
    accessDate: null,
    apaFinalVerified: false,
    apaReadiness: "candidate_ready",
    apaReadinessNotice:
      "APA readiness is a structured metadata preview state, not APA-final verification.",
    containerTitle: null,
    createdAt: "qa",
    doi: "10.1234/service-quality",
    edition: null,
    humanVerifiedAt: "qa-human-review",
    issue: "2",
    journal: "Journal of Retail Service",
    metadataSource: "human_entered",
    notes: "QA structured metadata.",
    pageRange: "12-24",
    publisher: "Journal of Marketing",
    sourceCardId: "candidate-source-card-qa",
    structuredMetadataStatus: "complete",
    updatedAt: "qa",
    url: "https://example.com/service-quality",
    volume: "15",
    warnings: null,
    ...overrides
  };
}

function batchIntakeJobFixture(
  fileName: string,
  overrides: Partial<SavedBatchResearchIntakeJob> = {}
): SavedBatchResearchIntakeJob {
  const fileType = fileName.toLowerCase().endsWith(".pdf") ? "PDF" : "DOCX";

  return {
    blockersJson: "[]",
    createdAt: "qa-created",
    duplicateStatus: "not_checked",
    externalMatchStatus: "pending",
    fileName,
    filePath: `qa-fixtures/${fileName}`,
    fileSize: 1024,
    fileType,
    intakeJobId: `qa-${fileName.replace(/[^a-z0-9]+/gi, "-")}`,
    metadataExtractionStatus: "not_started",
    mimeType:
      fileType === "PDF"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    parserStatus: "not_started",
    queueStatus: "queued",
    reviewStatus: "pending",
    sourceTypeGuess: fileType === "PDF" ? "unknown_pending_review" : "DOCX",
    updatedAt: "qa-updated",
    warningsJson: "[]",
    ...overrides
  };
}

function suggestedCorrectionFixture(
  overrides: Partial<SavedSuggestedMetadataCorrection>
): SavedSuggestedMetadataCorrection {
  return {
    confidenceBand: "medium",
    confidenceScore: 64,
    correctionId: "suggested-correction-fixture",
    createdAt: "qa-created",
    currentValue: null,
    fieldName: "doi",
    intakeJobId: "qa-intake-job",
    matchResultId: "external-match-fixture",
    mismatchReasonsJson: "[]",
    providerName: "Mock OpenAlex Fixture",
    providerRecordRef: "mock:openalex:service-quality-article",
    reason: "Provider fixture has a candidate value.",
    reviewDecision: "not_decided",
    reviewerEditedValue: null,
    reviewerNote: null,
    reviewStatus: "needs_human_review",
    sourceCardId: null,
    suggestedValue: "10.0000/mock-service-quality-article",
    targetMetadataTable: "source_card_bibliographic_metadata",
    updatedAt: "qa-updated",
    warningFlagsJson: "[]",
    ...overrides
  };
}

test("Structured bibliographic metadata readiness mapper is conservative", () => {
  const journalComplete = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: compactReadySourceCard,
    metadata: metadataFixture(),
    sourceType: "academic_journal_article"
  });
  expect(journalComplete.overallStatus).toBe("apa_candidate_possible");
  expect(journalComplete.apaFinalVerified).toBe(false);
  expect(journalComplete.notApaFinalNotice).toContain("no APA citation is generated");

  const journalMissingDoiUrl = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: compactReadySourceCard,
    metadata: metadataFixture({ doi: null, url: null }),
    sourceType: "academic_journal_article"
  });
  expect(journalMissingDoiUrl.warnings.join(" ")).toContain("DOI or URL is missing");
  expect(journalMissingDoiUrl.blockers).toHaveLength(0);

  const bookMissingPublisher = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: { ...compactReadySourceCard, sourceType: "book" },
    metadata: metadataFixture({ publisher: null }),
    sourceType: "book"
  });
  expect(bookMissingPublisher.overallStatus).toBe("needs_metadata");
  expect(bookMissingPublisher.blockers.join(" ")).toContain("publisher");

  const websiteMissingUrl = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: { ...compactReadySourceCard, sourceType: "website_web_article" },
    metadata: metadataFixture({ url: null }),
    sourceType: "website_web_article"
  });
  expect(websiteMissingUrl.overallStatus).toBe("needs_metadata");
  expect(websiteMissingUrl.blockers.join(" ")).toContain("URL");

  const docxNote = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: { ...compactReadySourceCard, sourceType: "DOCX" },
    metadata: metadataFixture(),
    sourceType: "DOCX"
  });
  expect(docxNote.sourceType).toBe("docx_manuscript_source_note");
  expect(docxNote.warnings.join(" ")).toContain("not APA-ready by default");

  const unknown = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: { ...compactReadySourceCard, sourceType: "unknown" },
    metadata: metadataFixture(),
    sourceType: "unknown"
  });
  expect(unknown.overallStatus).toBe("needs_human_review");
  expect(unknown.blockers.join(" ")).toContain("Source type is unknown");

  const finalVerifiedAttempt = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: compactReadySourceCard,
    metadata: metadataFixture({ apaFinalVerified: true, apaReadiness: "final_verified" }),
    sourceType: "academic_journal_article"
  });
  expect(finalVerifiedAttempt.apaFinalVerified).toBe(false);
  expect(finalVerifiedAttempt.blockers.join(" ")).toContain(
    "APA final verification cannot be produced automatically"
  );
});

test("APA reference candidate preview mapper is derived-only and not final", () => {
  const journalReadiness = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: savedCompactSourceCard,
    metadata: metadataFixture(),
    sourceType: "academic_journal_article"
  });
  const journalCandidate = createApaReferenceCandidatePreview({
    compactSourceCard: savedCompactSourceCard,
    metadata: metadataFixture(),
    readiness: journalReadiness
  });
  expect(journalCandidate.candidateStatus).toBe("candidate_preview_ready");
  expect(journalCandidate.candidateReferenceText).toContain(
    "Parasuraman, Zeithaml, and Berry (1988)"
  );
  expect(journalCandidate.candidateReferenceText).toContain("Journal of Retail Service");
  expect(journalCandidate.notFinal).toBe(true);
  expect(journalCandidate.humanReviewRequired).toBe(true);
  expect(journalCandidate.finalVerificationStatus).toBe("not_reviewed");
  expect(journalCandidate.generatedBy).toBe("deterministic_local_formatter");

  const journalMissingDoiUrlReadiness = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: savedCompactSourceCard,
    metadata: metadataFixture({ doi: null, url: null }),
    sourceType: "academic_journal_article"
  });
  const journalMissingDoiUrlCandidate = createApaReferenceCandidatePreview({
    compactSourceCard: savedCompactSourceCard,
    metadata: metadataFixture({ doi: null, url: null }),
    readiness: journalMissingDoiUrlReadiness
  });
  expect(journalMissingDoiUrlCandidate.candidateStatus).toBe(
    "candidate_preview_ready"
  );
  expect(journalMissingDoiUrlCandidate.warnings.join(" ")).toContain(
    "DOI or URL is missing"
  );
  expect(journalMissingDoiUrlCandidate.candidateReferenceText).not.toContain(
    "10.1234"
  );

  const bookMissingPublisherReadiness = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: { ...savedCompactSourceCard, sourceType: "book" },
    metadata: metadataFixture({ publisher: null }),
    sourceType: "book"
  });
  const bookMissingPublisherCandidate = createApaReferenceCandidatePreview({
    compactSourceCard: { ...savedCompactSourceCard, sourceType: "book" },
    metadata: metadataFixture({ publisher: null }),
    readiness: bookMissingPublisherReadiness
  });
  expect(bookMissingPublisherCandidate.candidateStatus).toBe("needs_metadata");
  expect(bookMissingPublisherCandidate.candidateReferenceText).toBeNull();
  expect(bookMissingPublisherCandidate.blockers.join(" ")).toContain("publisher");

  const websiteMissingUrlReadiness = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: { ...savedCompactSourceCard, sourceType: "website_web_article" },
    metadata: metadataFixture({ url: null }),
    sourceType: "website_web_article"
  });
  const websiteMissingUrlCandidate = createApaReferenceCandidatePreview({
    compactSourceCard: { ...savedCompactSourceCard, sourceType: "website_web_article" },
    metadata: metadataFixture({ url: null }),
    readiness: websiteMissingUrlReadiness
  });
  expect(websiteMissingUrlCandidate.candidateStatus).toBe("needs_metadata");
  expect(websiteMissingUrlCandidate.candidateReferenceText).toBeNull();
  expect(websiteMissingUrlCandidate.blockers.join(" ")).toContain("URL");

  const unknownReadiness = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: { ...savedCompactSourceCard, sourceType: "unknown" },
    metadata: metadataFixture(),
    sourceType: "unknown"
  });
  const unknownCandidate = createApaReferenceCandidatePreview({
    compactSourceCard: { ...savedCompactSourceCard, sourceType: "unknown" },
    metadata: metadataFixture(),
    readiness: unknownReadiness
  });
  expect(unknownCandidate.candidateStatus).toBe("needs_human_review");
  expect(unknownCandidate.candidateReferenceText).toBeNull();

  const docxReadiness = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: { ...savedCompactSourceCard, sourceType: "DOCX" },
    metadata: metadataFixture(),
    sourceType: "DOCX"
  });
  const docxCandidate = createApaReferenceCandidatePreview({
    compactSourceCard: { ...savedCompactSourceCard, sourceType: "DOCX" },
    metadata: metadataFixture(),
    readiness: docxReadiness
  });
  expect(docxCandidate.notFinal).toBe(true);
  expect(docxCandidate.candidateReferenceText).toContain("DOCX manuscript/source note");
  expect(docxCandidate.warnings.join(" ")).toContain("non-publication style");

  const websiteNoAuthorYearReadiness = evaluateStructuredBibliographicMetadataReadiness({
    compactSourceCard: {
      ...savedCompactSourceCard,
      authors: null,
      sourceType: "website_web_article",
      year: null
    },
    metadata: metadataFixture({ url: "https://example.com/service-quality" }),
    sourceType: "website_web_article"
  });
  const websiteNoAuthorYearCandidate = createApaReferenceCandidatePreview({
    compactSourceCard: {
      ...savedCompactSourceCard,
      authors: null,
      sourceType: "website_web_article",
      year: null
    },
    metadata: metadataFixture({ url: "https://example.com/service-quality" }),
    readiness: websiteNoAuthorYearReadiness
  });
  expect(websiteNoAuthorYearCandidate.candidateStatus).toBe(
    "candidate_preview_ready"
  );
  expect(websiteNoAuthorYearCandidate.candidateReferenceText).toContain(
    "SERVQUAL measurement foundation"
  );
  expect(websiteNoAuthorYearCandidate.candidateReferenceText).not.toContain("n.d.");
  expect(websiteNoAuthorYearCandidate.candidateReferenceText).not.toContain(
    "Unknown"
  );
});

test("External metadata mock provider maps deterministic confidence bands without mutation", () => {
  const high = mapExternalMetadataMatch(
    batchIntakeJobFixture("qa-service-quality-chapter.docx"),
    getMockExternalMetadataMatchCandidates(
      batchIntakeJobFixture("qa-service-quality-chapter.docx")
    )
  );
  expect(high.matchStatus).toBe("high_confidence_match");
  expect(high.confidenceBand).toBe("high");
  expect(high.autoOverwriteAllowed).toBe(false);
  expect(high.providerCandidates[0]?.provider.isMock).toBe(true);
  expect(high.suggestedCorrections.some((item) => item.fieldName === "title")).toBe(
    true
  );
  expect(high.suggestedCorrections.every((item) => item.actionState === "pending")).toBe(
    true
  );
  expect(high.warnings.join(" ")).toContain("no Crossref");
  expect(high.warnings.join(" ")).toContain("No metadata is overwritten");

  const medium = mapExternalMetadataMatch(
    batchIntakeJobFixture("qa-service-quality-article.pdf"),
    getMockExternalMetadataMatchCandidates(
      batchIntakeJobFixture("qa-service-quality-article.pdf")
    )
  );
  expect(medium.matchStatus).toBe("medium_confidence_match");
  expect(medium.confidenceBand).toBe("medium");
  expect(medium.suggestedCorrections.some((item) => item.fieldName === "doi")).toBe(
    true
  );

  const low = mapExternalMetadataMatch(
    batchIntakeJobFixture("ambiguous-local-notes.docx"),
    getMockExternalMetadataMatchCandidates(
      batchIntakeJobFixture("ambiguous-local-notes.docx")
    )
  );
  expect(low.matchStatus).toBe("low_confidence_match");
  expect(low.confidenceBand).toBe("low");
  expect(low.nextAction).toContain("human metadata review");

  const none = mapExternalMetadataMatch(
    batchIntakeJobFixture("unmatched-source.docx"),
    getMockExternalMetadataMatchCandidates(batchIntakeJobFixture("unmatched-source.docx"))
  );
  expect(none.matchStatus).toBe("no_match");
  expect(none.confidenceBand).toBe("none");
  expect(none.providerCandidates).toHaveLength(0);
  expect(none.suggestedCorrections).toHaveLength(0);
  expect(none.nextAction).toContain("future provider support");
});

test("Crossref fixture provider is read-only deterministic candidate evidence", () => {
  const articleJob = batchIntakeJobFixture("qa-service-quality-article.pdf", {
    sourceTypeGuess: "academic_journal_article"
  });
  const exactDoiCandidates = getCrossrefFixtureCandidates(articleJob, {
    authorsCandidate: ["Cronin, J. J.", "Taylor, S. A."],
    containerCandidate: "Journal of Service Quality Studies",
    doiCandidate: "https://doi.org/10.0000/mock-service-quality-article",
    titleCandidate: "Service Quality Article on Satisfaction and Performance",
    yearCandidate: "1992"
  });

  expect(exactDoiCandidates).toHaveLength(1);
  const exact = exactDoiCandidates[0];
  expect(exact.provider.providerId).toBe("crossref-read-only-fixture");
  expect(exact.provider.isLiveNetwork).toBe(false);
  expect(exact.provider.isFixtureOnly).toBe(true);
  expect(exact.provider.noAutoOverwrite).toBe(true);
  expect(exact.autoOverwriteAllowed).toBe(false);
  expect(exact.rawFixtureSnapshotJson).toContain(
    "10.0000/mock-service-quality-article"
  );
  expect(exact.normalizedCandidate.matchedTitle).toBe(
    "Service Quality Article on Satisfaction and Performance"
  );
  expect(exact.normalizedCandidate.matchedAuthors).toEqual([
    "Cronin, J. J.",
    "Taylor, S. A."
  ]);
  expect(exact.normalizedCandidate.matchedYear).toBe("1992");
  expect(exact.normalizedCandidate.matchedJournal).toBe(
    "Journal of Service Quality Studies"
  );
  expect(exact.normalizedCandidate.matchedDoi).toBe(
    "10.0000/mock-service-quality-article"
  );
  expect(exact.confidenceBand).toBe("high");
  expect(exact.confidenceEvidence.join(" ")).toContain("DOI exact match");
  expect(exact.warnings.join(" ")).toContain("no live Crossref API call");
  expect(exact.warnings.join(" ")).toContain("No network request");

  const mapped = mapExternalMetadataMatch(
    articleJob,
    exactDoiCandidates.map((candidate) => candidate.normalizedCandidate)
  );
  expect(mapped.autoOverwriteAllowed).toBe(false);
  expect(mapped.suggestedCorrections.some((item) => item.fieldName === "doi")).toBe(
    true
  );

  const missingDoi = getCrossrefFixtureCandidates(articleJob, {
    titleCandidate: "Service Quality Article on Satisfaction and Performance"
  })[0];
  expect(missingDoi).toBeTruthy();
  expect(missingDoi.warnings.join(" ")).toContain("DOI evidence is missing");
  expect(missingDoi.confidenceScore).toBeLessThan(exact.confidenceScore);

  const titleMismatch = getCrossrefFixtureCandidates(articleJob, {
    titleCandidate: "Unrelated pricing worksheet"
  })[0];
  expect(titleMismatch.confidenceScore).toBeLessThan(missingDoi.confidenceScore);
  expect(titleMismatch.warnings.join(" ")).toContain("Title token overlap is weak");
});

test("Provider candidate comparison mapper derives field-level preview states", () => {
  const mockDoi = suggestedCorrectionFixture({});
  const crossrefDoi = suggestedCorrectionFixture({
    confidenceBand: "high",
    confidenceScore: 96,
    correctionId: "suggested-correction-crossref-doi",
    providerName: "Crossref Read-Only Fixture",
    providerRecordRef: "crossref:fixture:service-quality-article",
    suggestedValue: "https://doi.org/10.0000/mock-service-quality-article"
  });
  const consensus = mapProviderCandidateComparisons([mockDoi, crossrefDoi]);
  expect(consensus).toHaveLength(1);
  expect(consensus[0].state).toBe("provider_consensus");
  expect(consensus[0].mockCandidate?.normalizedValue).toBe(
    "10.0000/mock-service-quality-article"
  );
  expect(consensus[0].crossrefFixtureCandidate?.normalizedValue).toBe(
    "10.0000/mock-service-quality-article"
  );
  expect(consensus[0].reason).toContain("provider agreement is still not verification");
  expect(consensus[0].warningFlags).toContain("no_auto_overwrite");

  const conflict = mapProviderCandidateComparisons([
    suggestedCorrectionFixture({
      fieldName: "year",
      suggestedValue: "1992",
      targetMetadataTable: "source_cards"
    }),
    suggestedCorrectionFixture({
      confidenceBand: "high",
      confidenceScore: 88,
      correctionId: "suggested-correction-crossref-year",
      fieldName: "year",
      providerName: "Crossref Read-Only Fixture",
      providerRecordRef: "crossref:fixture:service-quality-article",
      suggestedValue: "1993",
      targetMetadataTable: "source_cards"
    })
  ]);
  expect(conflict[0].state).toBe("provider_conflict");
  expect(conflict[0].warningFlags).toContain("provider_conflict");
  expect(conflict[0].reason).toContain("requires human review");

  const onlyMock = mapProviderCandidateComparisons([
    suggestedCorrectionFixture({
      fieldName: "url",
      suggestedValue: "https://example.invalid/mock-service-quality-article"
    })
  ]);
  expect(onlyMock[0].state).toBe("provider_only_mock");
  expect(onlyMock[0].reason).toContain("Crossref fixture is missing");

  const onlyCrossrefFixture = mapProviderCandidateComparisons([
    suggestedCorrectionFixture({
      confidenceBand: "high",
      confidenceScore: 90,
      correctionId: "suggested-correction-crossref-publisher",
      fieldName: "publisher",
      providerName: "Crossref Read-Only Fixture",
      providerRecordRef: "crossref:fixture:service-quality-article",
      suggestedValue: "Mock Academic Press"
    })
  ]);
  expect(onlyCrossrefFixture[0].state).toBe("provider_only_crossref_fixture");
  expect(onlyCrossrefFixture[0].warningFlags).toContain("fixture_only");
  expect(onlyCrossrefFixture[0].reason).toContain("fixture-only evidence");
});

test("Provider evidence detail mapper derives raw display and normalized evidence only", () => {
  const details = mapProviderEvidenceDetails([
    suggestedCorrectionFixture({
      confidenceBand: "medium",
      confidenceScore: 64,
      fieldName: "doi",
      providerName: "Mock OpenAlex Fixture",
      providerRecordRef: "mock:openalex:service-quality-article",
      reason: "Provider fixture has DOI evidence.",
      suggestedValue: "https://doi.org/10.0000/mock-service-quality-article",
      warningFlagsJson: JSON.stringify([
        "Mock provider only - no real external metadata API was called.",
        "No metadata is overwritten automatically."
      ])
    }),
    suggestedCorrectionFixture({
      confidenceBand: "high",
      confidenceScore: 90,
      correctionId: "suggested-correction-crossref-title",
      fieldName: "title",
      mismatchReasonsJson: JSON.stringify(["Title differs after normalization."]),
      providerName: "Crossref Read-Only Fixture",
      providerRecordRef: "crossref:fixture:service-quality-article",
      reason: "Provider title differs from local title.",
      suggestedValue: "Service Quality Article on Satisfaction and Performance",
      targetMetadataTable: "source_cards",
      warningFlagsJson: JSON.stringify([
        "Crossref fixture only - no live Crossref API call was made.",
        "No network request and no API key were used.",
        "No SourceCard or structured metadata is overwritten."
      ])
    })
  ]);

  expect(details).toHaveLength(2);
  const crossrefDetail = details.find(
    (detail) => detail.providerSource === "crossref_fixture"
  );
  expect(crossrefDetail?.providerType).toBe("crossref_fixture_read_only");
  expect(crossrefDetail?.rawDisplayValue).toBe(
    "Service Quality Article on Satisfaction and Performance"
  );
  expect(crossrefDetail?.normalizedValue).toBe(
    "service quality article on satisfaction and performance"
  );
  expect(crossrefDetail?.confidenceEvidence.join(" ")).toContain(
    "Provider confidence high / 90"
  );
  expect(crossrefDetail?.mismatchReasons).toContain(
    "Title differs after normalization."
  );
  expect(crossrefDetail?.fixtureOnly).toBe(true);
  expect(crossrefDetail?.noNetwork).toBe(true);
  expect(crossrefDetail?.noAutoOverwrite).toBe(true);
  expect(crossrefDetail?.rawJsonPreview).toBeNull();
  expect(crossrefDetail?.rawJsonUnavailableReason).toContain(
    "no new persistence was added"
  );

  const mockDetail = details.find((detail) => detail.providerSource === "mock_provider");
  expect(mockDetail?.providerType).toBe("openalex_mock");
  expect(mockDetail?.rawDisplayValue).toBe(
    "https://doi.org/10.0000/mock-service-quality-article"
  );
  expect(mockDetail?.normalizedValue).toBe(
    "10.0000/mock-service-quality-article"
  );
});

test("Source Library DOCX candidate review flow renders preview-only gates", async ({
  page
}) => {
  await page.goto("/?page=source-inbox&qa=source-library");

  await expect(page.getByTestId("source-library-page")).toBeVisible();
  await expect(page.getByTestId("source-library-workflow-bar")).toBeVisible();
  await expect(page.getByTestId("source-library-main-flow")).toContainText("Input");
  await expect(page.getByTestId("source-library-main-flow")).toContainText("Classify");
  await expect(page.getByTestId("source-library-main-flow")).toContainText("Tag Vault");
  await expect(page.getByTestId("source-library-main-flow")).toContainText(
    "Textbook Request"
  );
  await expect(page.getByTestId("source-library-main-flow")).toContainText("DOCX Export");
  await expect(page.getByTestId("source-library-next-action")).toBeVisible();
  await expect(page.getByTestId("source-library-next-action")).toContainText(
    "Paste a local DOCX path to start."
  );
  await expect(page.getByTestId("source-library-left-intake-start")).toBeVisible();
  await expect(page.getByTestId("source-library-left-intake-start")).toContainText(
    "Paste local DOCX path"
  );
  await expect(page.getByTestId("source-library-left-intake-start")).toContainText(
    "Step 1: Paste DOCX path"
  );
  await expect(page.getByTestId("source-library-left-intake-start")).toContainText(
    "PDF is metadata-only"
  );
  await expect(page.getByTestId("source-library-left-intake-start")).toContainText(
    ".doc is unsupported"
  );
  await expect(page.getByTestId("source-library-active-work-area")).toBeVisible();
  await expect(page.getByTestId("source-library-guided-action-path")).toBeVisible();
  await expect(page.getByTestId("source-library-guided-action-path")).toContainText(
    "Paste DOCX path"
  );
  await expect(page.getByTestId("source-library-guided-action-path")).toContainText(
    "current"
  );
  await expect(page.getByTestId("source-library-guided-action-path")).toContainText(
    "Save SourceCard"
  );
  await expect(page.getByTestId("source-library-guided-action-path")).toContainText(
    "gated"
  );
  await expect(page.getByTestId("source-library-docx-workflow-path")).toContainText(
    "Save SourceDocument"
  );
  await expect(page.getByTestId("source-library-active-work-area")).toContainText(
    "APA internal-use candidate"
  );
  await expect(page.getByTestId("source-library-active-work-area")).toContainText(
    "DraftArtifact mock/not-final"
  );
  await expect(page.getByTestId("source-library-guardrail-chips")).toContainText(
    "No APA-final verification"
  );
  await expect(page.getByTestId("source-library-guardrail-chips")).toContainText(
    "citationText not overwritten"
  );
  await expect(page.getByTestId("source-library-secondary-debug-area")).toContainText(
    "Secondary workbench: collapsed support tools"
  );
  await expect(page.getByTestId("compact-agent-status-panel")).toBeVisible();
  await expect(page.getByTestId("source-library-context-inspector")).toBeVisible();
  await expect(page.getByTestId("source-library-real-mock-separation")).toContainText(
    "No real source selected yet"
  );
  await expect(page.getByTestId("source-library-real-mock-separation")).toContainText(
    "Mock source detail remains reachable"
  );
  await page
    .getByTestId("source-library-context-inspector")
    .locator("details", { hasText: "Mock source card preview and editor" })
    .evaluate((detailsElement) => {
      (detailsElement as HTMLDetailsElement).open = true;
    });
  await page.getByTestId("source-library-secondary-debug-area").getByText(
    "Secondary workbench: collapsed support tools"
  ).click();
  await expect(page.getByTestId("source-library-secondary-workbench-boundary")).toContainText(
    "secondary to the parsed-DOCX action path"
  );
  await expect(page.getByTestId("source-library-secondary-debug-area")).toContainText(
    "no-network"
  );
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
  await expect(page.getByTestId("batch-intake-queue-panel")).toBeVisible();
  await expect(page.getByTestId("batch-intake-queue-only-notice")).toContainText(
    "Queue only"
  );
  await expect(page.getByTestId("batch-intake-boundary-notices")).toContainText(
    "No external metadata lookup"
  );
  await expect(page.getByTestId("batch-intake-boundary-notices")).toContainText(
    "No SourceDocument or SourceCard is created automatically"
  );
  await expect(page.getByTestId("batch-intake-boundary-notices")).toContainText(
    "No metadata is overwritten"
  );
  await page.getByTestId("batch-intake-select-files-button").click();
  await expect(page.getByTestId("batch-intake-create-result")).toContainText(
    "Created jobs"
  );
  await expect(page.getByTestId("batch-intake-created-count")).toContainText("2 jobs");
  await expect(page.getByTestId("batch-intake-queue-list")).toContainText(
    "qa-service-quality-chapter.docx"
  );
  await expect(page.getByTestId("batch-intake-queue-list")).toContainText(
    "qa-service-quality-article.pdf"
  );
  await expect(page.getByTestId("batch-intake-queue-list")).toContainText("queued");
  await expect(page.getByTestId("batch-intake-queue-list")).toContainText("not_started");
  await expect(page.getByTestId("batch-intake-queue-list")).toContainText("pending");
  await expect(page.getByTestId("batch-intake-queue-list")).toContainText(
    "not_checked"
  );
  await expect(page.getByTestId("batch-intake-queue-list")).toContainText(
    "PDF parser is not implemented"
  );
  await expect(page.getByTestId("external-metadata-match-preview-panel")).toBeVisible();
  await expect(page.getByTestId("external-metadata-match-mock-notice")).toContainText(
    "Mock provider only"
  );
  await expect(page.getByTestId("external-metadata-match-boundary-notices")).toContainText(
    "External metadata is evidence, not truth"
  );
  await expect(page.getByTestId("external-metadata-match-boundary-notices")).toContainText(
    "No metadata is overwritten"
  );
  await expect(page.getByTestId("external-metadata-match-boundary-notices")).toContainText(
    "No SourceDocument or SourceCard is created automatically"
  );
  await expect(page.getByTestId("external-metadata-match-result")).toHaveCount(2);
  await expect(page.getByTestId("external-metadata-match-preview-panel")).toContainText(
    "high"
  );
  await expect(page.getByTestId("external-metadata-match-preview-panel")).toContainText(
    "medium"
  );
  await expect(page.getByTestId("external-metadata-match-preview-panel")).toContainText(
    "mock only"
  );
  await expect(page.getByTestId("external-metadata-match-preview-panel")).toContainText(
    "pending"
  );
  await expect(page.getByTestId("external-metadata-match-preview-panel")).toContainText(
    "do not overwrite"
  );
  await expect(page.getByTestId("crossref-fixture-preview-panel")).toBeVisible();
  await expect(page.getByTestId("crossref-fixture-boundary-badges")).toContainText(
    "Fixture only"
  );
  await expect(page.getByTestId("crossref-fixture-boundary-badges")).toContainText(
    "no network"
  );
  await expect(page.getByTestId("crossref-fixture-boundary-notices")).toContainText(
    "No SourceCard or structured metadata is mutated"
  );
  await expect(page.getByTestId("crossref-fixture-candidate")).toHaveCount(2);
  await expect(page.getByTestId("crossref-fixture-normalized-fields").first()).toContainText(
    "DOI"
  );
  await expect(page.getByTestId("crossref-fixture-evidence-summary").first()).toContainText(
    "Raw-vs-normalized summary"
  );
  await expect(page.getByTestId("crossref-fixture-raw-snapshot-notice").first()).toContainText(
    "Raw fixture snapshot preserved"
  );
  await expect(page.getByTestId("suggested-corrections-review-queue-panel")).toBeVisible();
  await expect(page.getByTestId("suggested-corrections-no-overwrite-notice")).toContainText(
    "No metadata is overwritten"
  );
  await expect(page.getByTestId("suggested-corrections-boundary-notices")).toContainText(
    "External metadata is evidence, not truth"
  );
  await expect(page.getByTestId("suggested-corrections-boundary-notices")).toContainText(
    "This sprint does not apply corrections to SourceCards"
  );
  await expect(page.getByTestId("suggested-corrections-boundary-notices")).toContainText(
    "SourceCard citationText is not overwritten"
  );
  await expect(page.getByTestId("suggested-corrections-boundary-notices")).toContainText(
    "Review queue only - not applied"
  );
  await page.getByTestId("suggested-corrections-generate-button").click();
  await expect(page.getByTestId("suggested-corrections-create-result")).toContainText(
    "Corrections"
  );
  await expect(page.getByTestId("provider-candidate-comparison-preview-panel")).toBeVisible();
  await expect(page.getByTestId("provider-candidate-comparison-provider-pair")).toContainText(
    "Mock Provider vs Crossref Fixture"
  );
  await expect(page.getByTestId("provider-candidate-comparison-notices")).toContainText(
    "Preview only"
  );
  await expect(page.getByTestId("provider-candidate-comparison-notices")).toContainText(
    "Provider agreement is not verification"
  );
  await expect(page.getByTestId("provider-candidate-comparison-notices")).toContainText(
    "No metadata is applied"
  );
  await expect(page.getByTestId("provider-candidate-comparison-notices")).toContainText(
    "SourceCard citationText is never overwritten"
  );
  await expect(page.getByTestId("provider-candidate-comparison-notices")).toContainText(
    "No live network/API call"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "provider_only_mock"
  );
  await expect(page.getByTestId("provider-candidate-comparison-preview-panel")).not.toContainText(
    "Apply to Structured Metadata"
  );
  await expect(page.getByTestId("provider-evidence-detail-inspector")).toBeVisible();
  await expect(page.getByTestId("provider-evidence-detail-notices")).toContainText(
    "Provider evidence is not metadata truth"
  );
  await expect(page.getByTestId("provider-evidence-detail-notices")).toContainText(
    "Human review remains required"
  );
  await expect(page.getByTestId("provider-evidence-detail-notices")).toContainText(
    "No metadata is applied from this panel"
  );
  await expect(page.getByTestId("provider-evidence-detail-notices")).toContainText(
    "SourceCard citationText is never overwritten"
  );
  await expect(page.getByTestId("provider-evidence-detail-notices")).toContainText(
    "APA-final verification is not supported here"
  );
  await expect(page.getByTestId("provider-evidence-detail-notices")).toContainText(
    "No live network/API call is used"
  );
  await expect(page.getByTestId("provider-evidence-raw-normalized-explanation")).toContainText(
    "Raw value = provider evidence snapshot/display value"
  );
  await expect(page.getByTestId("provider-evidence-raw-normalized-explanation")).toContainText(
    "Normalized value = ATP comparison candidate"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "Mock Crossref Fixture"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "Raw/display value"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "Normalized value"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "Confidence evidence"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "Warning flags"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "No auto overwrite"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "Raw provider JSON is not exposed"
  );
  await expect(page.getByTestId("provider-evidence-detail-inspector")).not.toContainText(
    "Apply to Structured Metadata"
  );
  await expect(page.getByTestId("metadata-correction-audit-trail")).toBeVisible();
  await expect(page.getByTestId("metadata-correction-audit-count")).toContainText(
    "events"
  );
  await expect(page.getByTestId("metadata-correction-audit-notices")).toContainText(
    "Audit trail only"
  );
  await expect(page.getByTestId("metadata-correction-audit-notices")).toContainText(
    "SourceCard metadata is not changed"
  );
  await expect(page.getByTestId("metadata-correction-audit-notices")).toContainText(
    "Structured bibliographic metadata is not changed"
  );
  await expect(page.getByTestId("metadata-correction-audit-notices")).toContainText(
    "SourceCard citationText is not overwritten"
  );
  await expect(page.getByTestId("metadata-correction-audit-notices")).toContainText(
    "APA-final verification is not set"
  );
  await expect(page.getByTestId("metadata-correction-audit-event").first()).toContainText(
    "correction_created"
  );
  await expect(page.getByTestId("metadata-correction-dry-run-panel")).toBeVisible();
  await expect(page.getByTestId("metadata-correction-dry-run-notices")).toContainText(
    "Dry-run only"
  );
  await expect(page.getByTestId("metadata-correction-dry-run-notices")).toContainText(
    "SourceCard metadata is not changed"
  );
  await expect(page.getByTestId("metadata-correction-dry-run-notices")).toContainText(
    "Structured bibliographic metadata is not changed"
  );
  await expect(page.getByTestId("metadata-correction-dry-run-notices")).toContainText(
    "SourceCard citationText is not overwritten"
  );
  await expect(page.getByTestId("metadata-correction-dry-run-notices")).toContainText(
    "APA-final verification is not set"
  );
  await expect(page.getByTestId("metadata-correction-structured-apply-panel")).toBeVisible();
  await expect(
    page.getByTestId("metadata-correction-structured-apply-notices")
  ).toContainText("Applies only to structured bibliographic metadata");
  await expect(
    page.getByTestId("metadata-correction-structured-apply-notices")
  ).toContainText("SourceCard citationText is not overwritten");
  await expect(
    page.getByTestId("metadata-correction-structured-apply-notices")
  ).toContainText("No undo yet - audit trail only");
  await expect(
    page.getByTestId("metadata-correction-structured-apply-notices")
  ).toContainText("Reversal/undo is planned, not implemented");
  await page.getByTestId("metadata-correction-dry-run-button").first().click();
  await expect(page.getByTestId("metadata-correction-dry-run-result")).toContainText(
    "missing_source_card"
  );
  await expect(page.getByTestId("metadata-correction-dry-run-blockers")).toContainText(
    "approved or edited"
  );
  await expect(page.getByTestId("metadata-correction-dry-run-blockers")).toContainText(
    "SourceCard linkage"
  );
  await expect(page.getByTestId("metadata-correction-audit-trail")).toContainText(
    "apply_preflight_blocked"
  );
  await expect(
    page.getByTestId("metadata-correction-structured-apply-blocked-message")
  ).toContainText("Compact SourceCard fields are blocked");
  await expect(page.getByTestId("suggested-corrections-summary")).toContainText(
    "Batch ready"
  );
  await expect(page.getByTestId("suggested-corrections-summary")).toContainText(
    "Needs review"
  );
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "Current ATP value"
  );
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "Suggested value"
  );
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "Mock"
  );
  await page.getByTestId("suggested-correction-approve-button").first().click();
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "approved_suggested_value"
  );
  await page.getByTestId("metadata-correction-dry-run-button").first().click();
  await expect(page.getByTestId("metadata-correction-dry-run-result")).toContainText(
    "missing_source_card"
  );
  await expect(page.getByTestId("metadata-correction-audit-trail")).toContainText(
    "correction_approved"
  );
  await page.getByTestId("suggested-correction-reject-button").first().click();
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "rejected_suggested_value"
  );
  await expect(page.getByTestId("metadata-correction-audit-trail")).toContainText(
    "correction_rejected"
  );
  await page
    .getByTestId("suggested-correction-edited-value-input")
    .first()
    .fill("Reviewer edited mock value");
  await page.getByTestId("suggested-correction-edit-button").first().click();
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "edited_before_approval"
  );
  await page.getByTestId("metadata-correction-dry-run-button").first().click();
  await expect(page.getByTestId("metadata-correction-dry-run-result")).toContainText(
    "Reviewer edited mock value"
  );
  await expect(page.getByTestId("metadata-correction-audit-trail")).toContainText(
    "correction_edited_before_approval"
  );
  await expect(page.getByTestId("metadata-correction-audit-trail")).toContainText(
    "Reviewer edited mock value"
  );
  await page
    .getByTestId("suggested-correction-note-input")
    .first()
    .fill("Needs more evidence before apply.");
  await page.getByTestId("suggested-correction-defer-button").first().click();
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "deferred_needs_more_evidence"
  );
  await expect(page.getByTestId("metadata-correction-audit-trail")).toContainText(
    "correction_deferred"
  );
  const structuredCorrection = page
    .getByTestId("suggested-correction-item")
    .filter({ hasText: "publisher" })
    .first();
  await expect(structuredCorrection).toBeVisible();
  await structuredCorrection.getByTestId("suggested-correction-approve-button").click();
  await expect(structuredCorrection).toContainText("approved_suggested_value");
  await structuredCorrection.getByTestId("metadata-correction-dry-run-button").click();
  await expect(page.getByTestId("metadata-correction-dry-run-result")).toContainText(
    "ready_to_apply_later"
  );
  await expect(
    page.getByTestId("metadata-correction-structured-apply-target")
  ).toContainText("source_card_bibliographic_metadata");
  await expect(
    page.getByTestId("metadata-correction-structured-apply-target")
  ).toContainText("publisher");
  await expect(page.getByTestId("metadata-correction-structured-apply-button")).toBeEnabled();
  await page.getByTestId("metadata-correction-structured-apply-button").click();
  await expect(
    page.getByTestId("metadata-correction-structured-apply-result")
  ).toContainText("applied_and_verified");
  await expect(
    page.getByTestId("metadata-correction-structured-apply-result")
  ).toContainText("Read-back verified");
  await expect(
    page.getByTestId("metadata-correction-structured-apply-result")
  ).toContainText("verified");
  await expect(page.getByTestId("metadata-correction-audit-trail")).toContainText(
    "correction_applied"
  );
  await expect(page.getByTestId("metadata-correction-audit-trail")).toContainText(
    "metadata_read_back_verified"
  );
  await expect(page.getByTestId("suggested-corrections-list")).toContainText("verified");
  await structuredCorrection.getByTestId("metadata-correction-dry-run-button").click();
  await expect(page.getByTestId("metadata-correction-dry-run-result")).toContainText(
    "blocked"
  );
  await expect(page.getByTestId("metadata-correction-dry-run-blockers")).toContainText(
    "already been applied"
  );
  await expect(page.getByTestId("metadata-correction-already-verified-warning")).toContainText(
    "Already verified"
  );
  await page.getByTestId("crossref-fixture-review-queue-generate-button").click();
  await expect(page.getByTestId("suggested-corrections-create-result")).toContainText(
    "Corrections"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "Mock value"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "Crossref Fixture value"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "provider_consensus"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "provider_conflict"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "provider_only_crossref_fixture"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "Mock OpenAlex Fixture"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "Crossref Read-Only Fixture"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "no_auto_overwrite"
  );
  await expect(page.getByTestId("provider-candidate-comparison-list")).toContainText(
    "needs_human_review"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "Mock OpenAlex Fixture"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "Crossref Read-Only Fixture"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "crossref_fixture_read_only"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText(
    "No network"
  );
  await expect(page.getByTestId("provider-evidence-detail-list")).toContainText("yes");
  await expect(page.getByTestId("suggested-correction-provider-source").first()).toContainText(
    "Crossref Fixture"
  );
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "Crossref Read-Only Fixture"
  );
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "crossref:fixture"
  );
  await expect(page.getByTestId("suggested-corrections-list")).toContainText(
    "No network request and no API key were used"
  );
  await expect(page.getByTestId("metadata-correction-audit-trail")).toContainText(
    "Crossref fixture"
  );

  await page
    .getByTestId("local-path-input")
    .fill("qa-fixtures/qa-service-quality-chapter.docx");
  await page.getByRole("button", { name: "Preview Metadata from Path" }).click();
  await expect(page.getByTestId("source-library-next-action")).toContainText(
    "Run DOCX parsing, then review extracted segments."
  );
  await expect(page.getByTestId("source-library-guided-action-path")).toContainText(
    "Parse DOCX"
  );
  await expect(page.getByRole("button", { name: "Parse DOCX MVP" })).toBeVisible();
  await page.getByTestId("extraction-run-button").click();

  await expect(page.getByTestId("extraction-preview-panel")).toBeVisible();
  await expect(page.getByTestId("source-library-next-action")).toContainText(
    "Save SourceDocument explicitly."
  );
  await expect(page.getByTestId("source-library-guided-action-path")).toContainText(
    "Review segments/candidate"
  );
  await expect(page.getByTestId("source-library-guided-action-path")).toContainText(
    "Save SourceDocument"
  );
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
  await expect(page.getByTestId("source-card-metadata-completion-panel")).toBeVisible();
  await expect(page.getByTestId("source-card-metadata-human-only-notice")).toContainText(
    "Human-entered metadata only."
  );
  await expect(page.getByTestId("source-card-metadata-completion-notices")).toContainText(
    "No citation metadata is fabricated."
  );
  await expect(page.getByTestId("source-card-metadata-completion-notices")).toContainText(
    "Citation readiness means user-confirmed, not APA-final."
  );
  await expect(page.getByTestId("source-card-metadata-completion-notices")).toContainText(
    "Structured DOI/publisher/journal fields are not implemented yet."
  );
  await expect(
    page.getByTestId("source-card-metadata-mark-citation-ready-button")
  ).toBeDisabled();
  await page
    .getByTestId("source-card-metadata-title-input")
    .fill("SERVQUAL measurement foundation");
  await page
    .getByTestId("source-card-metadata-authors-input")
    .fill("Parasuraman, Zeithaml, and Berry");
  await page.getByTestId("source-card-metadata-year-input").fill("1988");
  await page
    .getByTestId("source-card-metadata-citation-input")
    .fill("Parasuraman, Zeithaml, and Berry (1988). SERVQUAL. Human verified.");
  await page.getByTestId("source-card-metadata-human-confirmation").check();
  await expect(page.getByTestId("source-card-metadata-readiness-summary")).toContainText(
    "Missing metadata count: 0"
  );
  await page.getByTestId("source-card-metadata-mark-citation-ready-button").click();
  await expect(page.getByTestId("source-card-metadata-update-result")).toContainText(
    "Saved: true"
  );
  await expect(page.getByTestId("source-card-metadata-update-warnings")).toContainText(
    "not APA-final"
  );
  await expect(page.getByTestId("source-card-metadata-readback")).toContainText(
    "Title: SERVQUAL measurement foundation"
  );
  await expect(page.getByTestId("source-card-metadata-readback")).toContainText(
    "Authors: Parasuraman, Zeithaml, and Berry"
  );
  await expect(page.getByTestId("source-card-metadata-readback")).toContainText(
    "Year: 1988"
  );
  await expect(page.getByTestId("source-card-metadata-readback")).toContainText(
    "Metadata status: ready"
  );
  await expect(page.getByTestId("source-card-metadata-readback")).toContainText(
    "Citation readiness: ready"
  );
  await expect(page.getByTestId("source-card-bibliographic-metadata-panel")).toBeVisible();
  await expect(
    page.getByTestId("source-card-bibliographic-basic-separation")
  ).toContainText("Separate from 4H-1 basic SourceCard metadata.");
  await expect(
    page.getByTestId("source-card-bibliographic-no-fabrication-notices")
  ).toContainText("Human-entered structured metadata only.");
  await expect(
    page.getByTestId("source-card-bibliographic-no-fabrication-notices")
  ).toContainText("No DOI lookup, web search, AI extraction, or APA finalization is performed.");
  await expect(
    page.getByTestId("source-card-bibliographic-no-fabrication-notices")
  ).toContainText("APA readiness here is not APA-final.");
  await expect(page.getByTestId("bibliographic-metadata-readback")).toContainText(
    "No structured bibliographic metadata has been saved"
  );
  await expect(page.getByTestId("structured-metadata-readiness-panel")).toBeVisible();
  await expect(page.getByTestId("structured-metadata-readiness-notice")).toContainText(
    "no APA citation is generated"
  );
  await expect(page.getByTestId("structured-metadata-apa-final-notice")).toContainText(
    "APA-final verification remains future human academic review"
  );
  await expect(page.getByTestId("structured-metadata-readiness-summary")).toContainText(
    "Missing required fields"
  );
  await expect(page.getByTestId("structured-metadata-readiness-blockers")).toContainText(
    "Structured bibliographic metadata has not been saved yet"
  );
  await expect(page.getByTestId("apa-reference-candidate-preview-panel")).toBeVisible();
  await expect(page.getByTestId("apa-reference-candidate-not-final-notice")).toContainText(
    "not APA-final"
  );
  await expect(page.getByTestId("apa-reference-candidate-no-automation-notice")).toContainText(
    "No DOI lookup, web search, AI generation, or APA finalization is performed"
  );
  await expect(page.getByTestId("apa-reference-candidate-human-review-notice")).toContainText(
    "Do not use as final academic reference without human verification"
  );
  await expect(page.getByTestId("apa-reference-candidate-status")).toContainText(
    "needs_metadata"
  );
  await expect(page.getByTestId("apa-reference-candidate-text")).toContainText(
    "Candidate reference text is blocked"
  );
  await expect(page.getByTestId("apa-reference-candidate-blockers")).toContainText(
    "Structured bibliographic metadata has not been saved yet"
  );
  await expect(page.getByTestId("human-apa-verification-gate-panel")).toBeVisible();
  await expect(page.getByTestId("human-apa-verification-notices")).toContainText(
    "Human APA review required"
  );
  await expect(page.getByTestId("human-apa-verification-notices")).toContainText(
    "This does not create APA-final verification"
  );
  await expect(page.getByTestId("human-apa-verification-notices")).toContainText(
    "SourceCard citationText is not overwritten"
  );
  await expect(page.getByTestId("human-apa-verification-status-select")).not.toContainText(
    "apa_final_verified"
  );
  await expect(page.getByTestId("human-apa-verification-candidate-blockers")).toContainText(
    "Structured bibliographic metadata has not been saved yet"
  );
  await page
    .getByTestId("human-apa-reviewer-note-input")
    .fill("Needs correction until structured metadata is saved.");
  await page.getByTestId("save-human-apa-verification-button").click();
  await expect(page.getByTestId("human-apa-verification-save-result")).toContainText(
    "Saved: true"
  );
  await expect(page.getByTestId("human-apa-verification-readback")).toContainText(
    "Status: needs_correction"
  );
  await page.getByTestId("bibliographic-publisher-input").fill("Journal of Marketing");
  await page.getByTestId("bibliographic-journal-input").fill("Journal of Retail Service");
  await page
    .getByTestId("bibliographic-container-title-input")
    .fill("Service Quality Research Collection");
  await page.getByTestId("bibliographic-volume-input").fill("15");
  await page.getByTestId("bibliographic-issue-input").fill("2");
  await page.getByTestId("bibliographic-page-range-input").fill("12-24");
  await page.getByTestId("bibliographic-doi-input").fill("10.1234/service-quality");
  await page
    .getByTestId("bibliographic-url-input")
    .fill("https://example.com/service-quality");
  await page.getByTestId("bibliographic-structured-status-select").selectOption("complete");
  await page.getByTestId("bibliographic-apa-readiness-select").selectOption("candidate_ready");
  await page
    .getByTestId("bibliographic-notes-input")
    .fill("Human-entered structured metadata for QA.");
  await page.getByTestId("save-bibliographic-metadata-button").click();
  await expect(page.getByTestId("bibliographic-metadata-save-result")).toContainText(
    "Saved: true"
  );
  await expect(page.getByTestId("bibliographic-metadata-save-warnings")).toContainText(
    "not APA-final"
  );
  await expect(page.getByTestId("bibliographic-metadata-readback")).toContainText(
    "Publisher: Journal of Marketing"
  );
  await expect(page.getByTestId("bibliographic-metadata-readback")).toContainText(
    "Journal: Journal of Retail Service"
  );
  await expect(page.getByTestId("bibliographic-metadata-readback")).toContainText(
    "DOI: 10.1234/service-quality"
  );
  await expect(page.getByTestId("bibliographic-metadata-readback")).toContainText(
    "APA readiness: candidate_ready"
  );
  await expect(page.getByTestId("bibliographic-metadata-readback")).toContainText(
    "APA final verified: false"
  );
  await expect(page.getByTestId("structured-metadata-readiness-status")).toBeVisible();
  await expect(page.getByTestId("structured-metadata-readiness-summary")).toContainText(
    "Source type: docx_manuscript_source_note"
  );
  await expect(page.getByTestId("structured-metadata-readiness-summary")).toContainText(
    "APA final verified: false"
  );
  await expect(page.getByTestId("structured-metadata-readiness-summary")).toContainText(
    "no APA citation is generated"
  );
  await expect(page.getByTestId("structured-metadata-readiness-warnings")).toContainText(
    "not APA-ready by default"
  );
  await expect(page.getByTestId("apa-reference-candidate-status")).toContainText(
    "candidate_preview_ready"
  );
  await expect(page.getByTestId("apa-reference-candidate-summary")).toContainText(
    "Human review required: true"
  );
  await expect(page.getByTestId("apa-reference-candidate-summary")).toContainText(
    "Final verification status: not_reviewed"
  );
  await expect(page.getByTestId("apa-reference-candidate-summary")).toContainText(
    "Not final: true"
  );
  await expect(page.getByTestId("apa-reference-candidate-text")).toContainText(
    "DOCX manuscript/source note"
  );
  await expect(page.getByTestId("apa-reference-candidate-warnings")).toContainText(
    "non-publication style"
  );
  await expect(page.getByTestId("apa-reference-candidate-notes")).toContainText(
    "Candidate text uses only available human-entered or human-verified metadata"
  );
  await page
    .getByTestId("human-apa-verification-status-select")
    .selectOption("verified_for_internal_use");
  await expect(page.getByTestId("human-apa-internal-use-blocking-note")).toBeVisible();
  const apaChecklistItems = page.locator('[data-testid^="human-apa-checklist-"]');
  const apaChecklistCount = await apaChecklistItems.count();
  for (let index = 0; index < apaChecklistCount; index += 1) {
    await apaChecklistItems.nth(index).check();
  }
  await page
    .getByTestId("human-apa-verified-reference-input")
    .fill(
      "Parasuraman, Zeithaml, and Berry (1988). SERVQUAL measurement foundation. [DOCX manuscript/source note - internal use only]"
    );
  await page
    .getByTestId("human-apa-reviewer-note-input")
    .fill("Checklist confirmed for internal drafting only.");
  await page.getByTestId("save-human-apa-verification-button").click();
  await expect(page.getByTestId("human-apa-verification-save-result")).toContainText(
    "Saved: true"
  );
  await expect(page.getByTestId("human-apa-verification-save-warnings")).toContainText(
    "internal use only"
  );
  await expect(page.getByTestId("human-apa-verification-save-warnings")).toContainText(
    "SourceCard citationText is not overwritten"
  );
  await expect(page.getByTestId("human-apa-verification-readback")).toContainText(
    "Status: verified_for_internal_use"
  );
  await expect(page.getByTestId("human-apa-verification-readback")).toContainText(
    "SourceCard citationText overwritten: false"
  );
  await page.getByTestId("bibliographic-publisher-input").fill("Updated Journal Publisher");
  await page.getByTestId("save-bibliographic-metadata-button").click();
  await expect(page.getByTestId("bibliographic-metadata-readback")).toContainText(
    "Publisher: Updated Journal Publisher"
  );
  await expect(page.getByTestId("source-card-metadata-readback")).toContainText(
    "Title: SERVQUAL measurement foundation"
  );
  await expect(page.getByTestId("source-card-metadata-readback")).toContainText(
    "Citation readiness: ready"
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
    page.getByTestId("parsed-docx-draft-input-readiness-panel")
  ).toBeVisible();
  await expect(
    page.getByTestId("parsed-docx-draft-input-readiness-panel")
  ).toContainText("Parsed DOCX Draft Input Package Readiness");
  await expect(
    page.getByTestId("parsed-docx-draft-input-preview-only-notice")
  ).toContainText("Readiness preview only");
  await expect(
    page.getByTestId("parsed-docx-draft-input-preview-only-notice")
  ).toContainText("no DraftArtifact is generated or saved");
  await expect(
    page.getByTestId("parsed-docx-draft-input-source-document-id")
  ).toContainText("candidate-document-qa-docx-file-intake-job");
  await expect(page.getByTestId("parsed-docx-draft-input-source-card-id")).toContainText(
    "candidate-source-card-candidate-document-qa-docx-file-intake-job"
  );
  await expect(
    page.getByTestId("parsed-docx-draft-input-type-counts")
  ).toContainText("concept");
  await expect(
    page.getByTestId("parsed-docx-draft-input-type-counts")
  ).toContainText("evidence");
  await expect(
    page.getByTestId("parsed-docx-draft-input-evidence-coverage")
  ).toContainText("saved KnowledgeCards have trace refs");
  await expect(
    page.getByTestId("parsed-docx-draft-input-citation-readiness")
  ).toContainText("APA citations are not final");
  await expect(
    page.getByTestId("parsed-docx-draft-input-warnings")
  ).toContainText("DOCX page numbers remain untrusted");
  await expect(
    page.getByTestId("parsed-docx-draft-input-next-action")
  ).toContainText("Review traces");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-candidate-preview")
  ).toBeVisible();
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-candidate-preview")
  ).toContainText("Parsed DOCX DraftArtifact Candidate Preview");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-preview-only-notice")
  ).toContainText("Preview only");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-preview-only-notice")
  ).toContainText("DraftArtifact is not saved");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-section-candidates")
  ).toContainText("Concept overview");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-section-candidates")
  ).toContainText("skeleton only");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-trace-summary")
  ).toContainText("chunk trace refs linked");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-citation-summary")
  ).toContainText("no APA citation is final");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-warnings")
  ).toContainText("prose is not final");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-save-action")
  ).toContainText("Save Parsed DOCX DraftArtifact");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-save-limited-scope-notice")
  ).toContainText("Explicit save only");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-save-readiness")
  ).toContainText("Section count");
  await page.getByTestId("save-parsed-docx-draft-artifact-button").click();
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-save-result")
  ).toContainText("Saved DraftArtifact ID");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-save-result")
  ).toContainText("saved mock/not-final");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-read-list-verification")
  ).toContainText("Parsed DOCX DraftArtifact Read/List Verification");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-read-list-verification")
  ).toContainText("Saved section count");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-read-list-verification")
  ).toContainText("Academic prose and citations still require review");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-review-gate")
  ).toBeVisible();
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-review-gate-notice")
  ).toContainText("Review gate only");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-review-gate-notice")
  ).toContainText("no DOCX export or final manuscript is generated");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-review-summary")
  ).toContainText("Saved DraftArtifact ID");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-review-summary")
  ).toContainText("Linked KnowledgeCard coverage");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-section-review-summary")
  ).toContainText("Evidence refs");
  await expect(
    page.getByTestId("parsed-docx-draft-artifact-review-warnings")
  ).toContainText("Citation placeholders are not final APA citations");
  await expect(page.getByTestId("parsed-docx-export-package-preview")).toBeVisible();
  await expect(
    page.getByTestId("parsed-docx-export-package-preview-only-notice")
  ).toContainText("Preview only");
  await expect(
    page.getByTestId("parsed-docx-export-package-preview-only-notice")
  ).toContainText("no DOCX file is generated");
  await expect(page.getByTestId("parsed-docx-export-package-status")).toContainText(
    "Blocked"
  );
  await expect(page.getByTestId("parsed-docx-export-package-summary")).toContainText(
    "Risk level"
  );
  await expect(page.getByTestId("parsed-docx-export-package-summary")).toContainText(
    "Section count"
  );
  await expect(page.getByTestId("parsed-docx-export-package-summary")).toContainText(
    "Citation placeholder count"
  );
  await expect(
    page.getByTestId("parsed-docx-export-package-checklist")
  ).toContainText("DOCX page numbers verified");
  await expect(
    page.getByTestId("parsed-docx-export-package-warnings")
  ).toContainText("DOCX page numbers remain untrusted");
  await expect(page.getByTestId("parsed-docx-export-mvp-action")).toBeVisible();
  await expect(page.getByTestId("parsed-docx-export-mvp-only-notice")).toContainText(
    "MVP export only"
  );
  await expect(page.getByTestId("parsed-docx-export-mvp-only-notice")).toContainText(
    "not APA-final"
  );
  await expect(page.getByTestId("parsed-docx-export-mvp-readiness")).toContainText(
    "Package status"
  );
  await expect(page.getByTestId("parsed-docx-export-mvp-readiness")).toContainText(
    "Warning count"
  );
  await expect(page.getByTestId("export-parsed-docx-mvp-button")).toBeDisabled();
  await expect(
    page.getByTestId("parsed-docx-export-verification-summary")
  ).toContainText("Package status");
  await expect(
    page.getByTestId("parsed-docx-export-verification-summary")
  ).toContainText("Export result: not_run");
  await expect(
    page.getByTestId("parsed-docx-export-verification-summary")
  ).toContainText("File name available: no");
  await expect(
    page.getByTestId("parsed-docx-export-verification-summary")
  ).toContainText("Citation placeholder warning: present");
  await expect(
    page.getByTestId("parsed-docx-export-verification-summary")
  ).toContainText("DOCX page-number warning: present");
  await expect(
    page.getByTestId("parsed-docx-export-verification-summary")
  ).toContainText("Verify this DOCX manually before academic use");
  await expect(page.getByTestId("parsed-docx-export-mvp-result")).toHaveCount(0);
  await expect(page.getByTestId("ai-integration-preflight-preview")).toBeVisible();
  await expect(
    page.getByTestId("ai-integration-preflight-no-provider-notice")
  ).toContainText("Preflight only");
  await expect(
    page.getByTestId("ai-integration-preflight-no-provider-notice")
  ).toContainText("no AI provider is called");
  await expect(
    page.getByTestId("ai-integration-preflight-boundary-summary")
  ).toContainText("No prose is generated");
  await expect(
    page.getByTestId("ai-integration-preflight-boundary-summary")
  ).toContainText("No citation metadata is fabricated");
  await expect(
    page.getByTestId("ai-integration-preflight-boundary-summary")
  ).toContainText("Human review remains mandatory");
  await expect(
    page.getByTestId("ai-integration-preflight-evidence-summary")
  ).toContainText("Untrusted");
  await expect(page.getByTestId("ai-integration-preflight-warnings")).toContainText(
    "DOCX page numbers remain untrusted"
  );
  await expect(
    page.getByTestId("ai-enhancement-request-package-preview")
  ).toBeVisible();
  await expect(
    page.getByTestId("ai-enhancement-request-no-provider-notice")
  ).toContainText("Preview only");
  await expect(
    page.getByTestId("ai-enhancement-request-no-provider-notice")
  ).toContainText("no AI provider is called");
  await expect(
    page.getByTestId("ai-enhancement-request-package-notices")
  ).toContainText("This is a request package, not AI output");
  await expect(
    page.getByTestId("ai-enhancement-request-package-notices")
  ).toContainText("No prose is generated in this sprint");
  await expect(
    page.getByTestId("ai-enhancement-request-package-notices")
  ).toContainText("No citation metadata is fabricated");
  await expect(
    page.getByTestId("ai-enhancement-request-package-notices")
  ).toContainText("Human review remains mandatory");
  await expect(page.getByTestId("mock-ai-response-package-preview")).toBeVisible();
  await expect(page.getByTestId("mock-ai-response-no-provider-notice")).toContainText(
    "Mock preview only"
  );
  await expect(page.getByTestId("mock-ai-response-no-provider-notice")).toContainText(
    "no AI provider is called"
  );
  await expect(page.getByTestId("mock-ai-response-required-notices")).toContainText(
    "This is not AI-generated prose"
  );
  await expect(page.getByTestId("mock-ai-response-required-notices")).toContainText(
    "Mock output cannot replace DraftArtifact content"
  );
  await expect(page.getByTestId("mock-ai-response-required-notices")).toContainText(
    "No citation metadata is fabricated"
  );
  await expect(page.getByTestId("mock-ai-response-required-notices")).toContainText(
    "Human academic review remains mandatory"
  );
  await expect(page.getByTestId("ai-output-validation-gate-preview")).toBeVisible();
  await expect(
    page.getByTestId("ai-output-validation-no-provider-notice")
  ).toContainText("Validation preview only");
  await expect(
    page.getByTestId("ai-output-validation-no-provider-notice")
  ).toContainText("no AI provider is called");
  await expect(
    page.getByTestId("ai-output-validation-required-notices")
  ).toContainText("No AI output is saved");
  await expect(
    page.getByTestId("ai-output-validation-required-notices")
  ).toContainText("AI output cannot replace DraftArtifact content");
  await expect(
    page.getByTestId("ai-output-validation-required-notices")
  ).toContainText("No citation metadata is fabricated");
  await expect(
    page.getByTestId("ai-output-validation-required-notices")
  ).toContainText("Human academic review remains mandatory");
  await expect(page.getByTestId("save-draft-artifact-button")).toHaveCount(0);
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
