import type { SavedBatchResearchIntakeJob } from "../persistence/LocalVaultDatabase";
import type {
  ExternalMetadataMatchCandidate,
  ExternalMetadataProvider
} from "./ExternalMetadataMatchMapper";

export const mockExternalMetadataProviders: ExternalMetadataProvider[] = [
  {
    providerId: "mock-crossref-local-fixture",
    providerName: "Mock Crossref Fixture",
    providerType: "crossref_mock",
    isMock: true,
    supportsSourceTypes: ["academic_journal_article", "book_chapter"],
    notes: "Deterministic local fixture only. No Crossref API request is made."
  },
  {
    providerId: "mock-openalex-local-fixture",
    providerName: "Mock OpenAlex Fixture",
    providerType: "openalex_mock",
    isMock: true,
    supportsSourceTypes: ["academic_journal_article", "report_white_paper"],
    notes: "Deterministic local fixture only. No OpenAlex API request is made."
  },
  {
    providerId: "mock-manual-metadata-fixture",
    providerName: "Mock Manual Metadata Fixture",
    providerType: "manual_fixture_mock",
    isMock: true,
    supportsSourceTypes: ["unknown_pending_review", "docx_manuscript_source_note"],
    notes: "Deterministic low-confidence fixture for human review QA."
  }
];

export function getMockExternalMetadataMatchCandidates(
  job: SavedBatchResearchIntakeJob
): ExternalMetadataMatchCandidate[] {
  const normalizedFileName = job.fileName.toLowerCase();

  if (normalizedFileName.includes("nomatch") || normalizedFileName.includes("unmatched")) {
    return [];
  }

  if (normalizedFileName.includes("service-quality-chapter")) {
    return [
      {
        matchedAuthors: ["Parasuraman, A.", "Zeithaml, V. A.", "Berry, L. L."],
        matchedContainerTitle: "Services Marketing Teaching Compendium",
        matchedDoi: null,
        matchedIsbn: "978-0-0000-0000-0",
        matchedIssue: null,
        matchedJournal: null,
        matchedPageRange: "41-58",
        matchedPublisher: "Mock Academic Press",
        matchedSourceType: "book_chapter",
        matchedTitle: "Service Quality Foundations for Customer Satisfaction",
        matchedUrl: null,
        matchedVolume: null,
        matchedYear: "1988",
        provider: mockExternalMetadataProviders[0],
        providerConfidence: 91,
        rawProviderRef: "mock:crossref:service-quality-chapter",
        warnings: [
          "Mock high-confidence fixture; bibliographic details are not verified authority data."
        ]
      }
    ];
  }

  if (normalizedFileName.includes("article") || normalizedFileName.includes("report")) {
    return [
      {
        matchedAuthors: ["Cronin, J. J.", "Taylor, S. A."],
        matchedContainerTitle: null,
        matchedDoi: "10.0000/mock-service-quality-article",
        matchedIsbn: null,
        matchedIssue: "1",
        matchedJournal: "Journal of Service Quality Studies",
        matchedPageRange: "12-29",
        matchedPublisher: null,
        matchedSourceType: "academic_journal_article",
        matchedTitle: "Service Quality Article on Satisfaction and Performance",
        matchedUrl: "https://example.invalid/mock-service-quality-article",
        matchedVolume: "7",
        matchedYear: "1992",
        provider: mockExternalMetadataProviders[1],
        providerConfidence: 64,
        rawProviderRef: "mock:openalex:service-quality-article",
        warnings: [
          "Mock medium-confidence fixture; title and source type require human confirmation."
        ]
      }
    ];
  }

  if (normalizedFileName.includes("ambiguous")) {
    return [
      {
        matchedAuthors: [],
        matchedContainerTitle: null,
        matchedDoi: null,
        matchedIsbn: null,
        matchedIssue: null,
        matchedJournal: null,
        matchedPageRange: null,
        matchedPublisher: null,
        matchedSourceType: "unknown_pending_review",
        matchedTitle: "Ambiguous Local Source Note",
        matchedUrl: null,
        matchedVolume: null,
        matchedYear: null,
        provider: mockExternalMetadataProviders[2],
        providerConfidence: 28,
        rawProviderRef: "mock:manual-fixture:ambiguous-source",
        warnings: [
          "Mock low-confidence fixture; use only as a review prompt."
        ]
      }
    ];
  }

  return [];
}
