import type { SavedBatchResearchIntakeJob } from "../persistence/LocalVaultDatabase";
import type {
  ExternalMetadataConfidenceBand,
  ExternalMetadataMatchCandidate,
  ExternalMetadataSourceType
} from "./ExternalMetadataMatchMapper";
import type {
  CrossrefFixtureCandidateResult,
  CrossrefFixturePayload,
  CrossrefFixtureProvider,
  CrossrefFixtureProviderRequest,
  CrossrefFixtureRecord
} from "./CrossrefProviderTypes";

export const crossrefFixtureProvider: CrossrefFixtureProvider = {
  autoOverwriteAllowed: false,
  isFixtureOnly: true,
  isLiveNetwork: false,
  isMock: false,
  noAutoOverwrite: true,
  notes:
    "Crossref-shaped deterministic fixture provider. No network request or API key is used.",
  providerId: "crossref-read-only-fixture",
  providerName: "Crossref Read-Only Fixture",
  providerType: "crossref_fixture_read_only",
  supportsSourceTypes: ["academic_journal_article", "book_chapter"]
};

const crossrefFixtureRecords: CrossrefFixtureRecord[] = [
  {
    fixtureId: "crossref:fixture:service-quality-article",
    matchTokens: ["article", "report", "service-quality-article"],
    sourceTypes: ["academic_journal_article"],
    payload: {
      status: "ok",
      message: {
        author: [
          { family: "Cronin", given: "J. J." },
          { family: "Taylor", given: "S. A." }
        ],
        containerTitle: ["Journal of Service Quality Studies"],
        DOI: "10.0000/mock-service-quality-article",
        issue: "1",
        page: "12-29",
        publishedPrint: { dateParts: [[1992, 3, 1]] },
        publisher: "Mock Academic Press",
        resource: {
          primary: {
            URL: "https://doi.org/10.0000/mock-service-quality-article"
          }
        },
        title: ["Service Quality Article on Satisfaction and Performance"],
        type: "journal-article",
        URL: "https://doi.org/10.0000/mock-service-quality-article",
        volume: "7"
      }
    }
  },
  {
    fixtureId: "crossref:fixture:service-quality-chapter",
    matchTokens: ["chapter", "service-quality-chapter"],
    sourceTypes: ["book_chapter"],
    payload: {
      status: "ok",
      message: {
        author: [
          { family: "Parasuraman", given: "A." },
          { family: "Zeithaml", given: "V. A." },
          { family: "Berry", given: "L. L." }
        ],
        containerTitle: ["Services Marketing Teaching Compendium"],
        DOI: "10.0000/mock-service-quality-chapter",
        page: "41-58",
        publishedPrint: { dateParts: [[1988]] },
        publisher: "Mock Academic Press",
        resource: {
          primary: {
            URL: "https://doi.org/10.0000/mock-service-quality-chapter"
          }
        },
        title: ["Service Quality Foundations for Customer Satisfaction"],
        type: "book-chapter",
        URL: "https://doi.org/10.0000/mock-service-quality-chapter"
      }
    }
  }
];

export function getCrossrefFixtureCandidates(
  job: SavedBatchResearchIntakeJob,
  request: CrossrefFixtureProviderRequest = {}
): CrossrefFixtureCandidateResult[] {
  const record = selectCrossrefFixtureRecord(job, request);

  if (!record) {
    return [];
  }

  return [normalizeCrossrefFixtureRecord(job, record, request)];
}

export function getCrossrefFixtureExternalMetadataCandidates(
  job: SavedBatchResearchIntakeJob,
  request: CrossrefFixtureProviderRequest = {}
): ExternalMetadataMatchCandidate[] {
  return getCrossrefFixtureCandidates(job, request).map(
    (candidate) => candidate.normalizedCandidate
  );
}

function selectCrossrefFixtureRecord(
  job: SavedBatchResearchIntakeJob,
  request: CrossrefFixtureProviderRequest
): CrossrefFixtureRecord | null {
  const normalizedDoi = normalizeDoi(request.doiCandidate);
  if (normalizedDoi) {
    return (
      crossrefFixtureRecords.find(
        (record) => normalizeDoi(record.payload.message.DOI) === normalizedDoi
      ) ?? null
    );
  }

  const normalizedFileName = job.fileName.toLowerCase();
  return (
    crossrefFixtureRecords.find((record) =>
      record.matchTokens.some((token) => normalizedFileName.includes(token))
    ) ?? null
  );
}

function normalizeCrossrefFixtureRecord(
  job: SavedBatchResearchIntakeJob,
  record: CrossrefFixtureRecord,
  request: CrossrefFixtureProviderRequest
): CrossrefFixtureCandidateResult {
  const payload = record.payload;
  const message = payload.message;
  const title = firstValue(message.title) ?? "Untitled Crossref fixture candidate";
  const authors = normalizeCrossrefAuthors(message.author);
  const year = normalizeCrossrefYear(message.publishedPrint?.dateParts);
  const containerTitle = firstValue(message.containerTitle);
  const doi = message.DOI ?? null;
  const url = message.URL ?? message.resource?.primary?.URL ?? null;
  const matchedSourceType = normalizeCrossrefSourceType(message.type);
  const rawFixtureSnapshotJson = JSON.stringify(payload);
  const sourceTypeCompatible = isSourceTypeCompatible(job, matchedSourceType);
  const confidence = scoreCrossrefFixtureCandidate({
    authors,
    containerTitle,
    doi,
    job,
    matchedSourceType,
    request,
    title,
    year
  });
  const warnings = [
    "Crossref fixture only - no live Crossref API call was made.",
    "No network request and no API key were used.",
    "Crossref fixture data is candidate evidence, not verified metadata.",
    "No SourceCard or structured metadata is overwritten.",
    ...confidence.warnings
  ];

  const normalizedCandidate: ExternalMetadataMatchCandidate = {
    matchedAuthors: authors,
    matchedContainerTitle: containerTitle,
    matchedDoi: doi,
    matchedIsbn: null,
    matchedIssue: message.issue ?? null,
    matchedJournal: matchedSourceType === "academic_journal_article" ? containerTitle : null,
    matchedPageRange: message.page ?? null,
    matchedPublisher: message.publisher ?? null,
    matchedSourceType,
    matchedTitle: title,
    matchedUrl: url,
    matchedVolume: message.volume ?? null,
    matchedYear: year,
    provider: crossrefFixtureProvider,
    providerConfidence: confidence.score,
    rawProviderRef: record.fixtureId,
    warnings
  };

  return {
    autoOverwriteAllowed: false,
    blockers: [],
    confidenceBand: confidence.band,
    confidenceEvidence: confidence.evidence,
    confidenceScore: confidence.score,
    isFixtureOnly: true,
    isLiveNetwork: false,
    noAutoOverwrite: true,
    normalizedCandidate,
    provider: crossrefFixtureProvider,
    providerRecordRef: record.fixtureId,
    rawFixtureSnapshotJson,
    rawVsNormalizedSummary: [
      `Raw title -> ${title}`,
      `Raw DOI -> ${doi ?? "missing"}`,
      `Raw container -> ${containerTitle ?? "missing"}`,
      `Normalized authors -> ${authors.join("; ") || "missing"}`
    ],
    sourceTypeCompatibility: sourceTypeCompatible ? "compatible" : "needs_review",
    warnings
  };
}

function scoreCrossrefFixtureCandidate({
  authors,
  containerTitle,
  doi,
  job,
  matchedSourceType,
  request,
  title,
  year
}: {
  authors: string[];
  containerTitle: string | null;
  doi: string | null;
  job: SavedBatchResearchIntakeJob;
  matchedSourceType: ExternalMetadataSourceType;
  request: CrossrefFixtureProviderRequest;
  title: string;
  year: string | null;
}): {
  band: ExternalMetadataConfidenceBand;
  evidence: string[];
  score: number;
  warnings: string[];
} {
  const evidence: string[] = [];
  const warnings: string[] = [];
  let score = 35;

  if (normalizeDoi(request.doiCandidate) && normalizeDoi(request.doiCandidate) === normalizeDoi(doi)) {
    score += 35;
    evidence.push("DOI exact match from local candidate to Crossref fixture.");
  } else if (request.doiCandidate) {
    score -= 25;
    warnings.push("Local DOI candidate conflicts with Crossref fixture DOI.");
  } else {
    warnings.push("No local DOI candidate was available; DOI evidence is missing.");
  }

  const titleCandidate = request.titleCandidate ?? deriveLocalTitle(job.fileName);
  const titleOverlap = titleTokenOverlap(titleCandidate, title);
  if (titleOverlap >= 0.55) {
    score += 20;
    evidence.push(`Title token overlap is strong (${Math.round(titleOverlap * 100)}%).`);
  } else if (titleOverlap >= 0.25) {
    score += 10;
    evidence.push(`Title token overlap is partial (${Math.round(titleOverlap * 100)}%).`);
  } else {
    score -= 20;
    warnings.push(`Title token overlap is weak (${Math.round(titleOverlap * 100)}%).`);
  }

  if (request.authorsCandidate?.length) {
    const overlap = authorFamilyOverlap(request.authorsCandidate, authors);
    if (overlap >= 0.5) {
      score += 15;
      evidence.push(`Author family overlap supports match (${Math.round(overlap * 100)}%).`);
    } else if (overlap > 0) {
      score += 8;
      evidence.push(`Author family overlap is partial (${Math.round(overlap * 100)}%).`);
    } else {
      score -= 10;
      warnings.push("Local authors do not overlap with Crossref fixture authors.");
    }
  }

  if (request.yearCandidate && year) {
    if (request.yearCandidate === year) {
      score += 10;
      evidence.push("Publication year matches local candidate.");
    } else {
      score -= 10;
      warnings.push("Publication year differs from local candidate.");
    }
  }

  if (request.containerCandidate && containerTitle) {
    const containerOverlap = titleTokenOverlap(request.containerCandidate, containerTitle);
    if (containerOverlap >= 0.5) {
      score += 10;
      evidence.push("Journal/container title supports match.");
    } else {
      score -= 5;
      warnings.push("Journal/container title differs from local candidate.");
    }
  }

  if (isSourceTypeCompatible(job, matchedSourceType)) {
    score += 5;
    evidence.push("File type and Crossref fixture source type are compatible.");
  } else {
    score -= 10;
    warnings.push("File type and Crossref fixture source type need human review.");
  }

  const clampedScore = clampScore(score);
  return {
    band: toConfidenceBand(clampedScore),
    evidence,
    score: clampedScore,
    warnings
  };
}

function normalizeCrossrefAuthors(
  authors: CrossrefFixturePayload["message"]["author"]
): string[] {
  return (authors ?? [])
    .map((author) => [author.family, author.given].filter(Boolean).join(", "))
    .filter(Boolean);
}

function normalizeCrossrefYear(dateParts?: number[][]): string | null {
  const year = dateParts?.[0]?.[0];
  return year ? String(year) : null;
}

function normalizeCrossrefSourceType(value?: string): ExternalMetadataSourceType {
  if (value === "journal-article") {
    return "academic_journal_article";
  }
  if (value === "book-chapter") {
    return "book_chapter";
  }
  return "unknown_pending_review";
}

function firstValue(values?: string[]): string | null {
  return values?.find((value) => value.trim().length > 0) ?? null;
}

function normalizeDoi(value?: string | null): string | null {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
  return normalized || null;
}

function deriveLocalTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function isSourceTypeCompatible(
  job: SavedBatchResearchIntakeJob,
  matchedSourceType: ExternalMetadataSourceType
): boolean {
  const fileType = job.fileType.toUpperCase();

  if (fileType === "PDF") {
    return ["academic_journal_article", "book_chapter", "report_white_paper"].includes(
      matchedSourceType
    );
  }
  if (fileType === "DOCX") {
    return ["book_chapter", "docx_manuscript_source_note", "report_white_paper"].includes(
      matchedSourceType
    );
  }
  return matchedSourceType === "unknown_pending_review";
}

function titleTokenOverlap(left: string, right: string): number {
  const leftTokens = toTokens(left);
  const rightTokens = toTokens(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0;
  }

  const rightSet = new Set(rightTokens);
  const matched = leftTokens.filter((token) => rightSet.has(token)).length;
  return matched / Math.max(leftTokens.length, rightTokens.length);
}

function authorFamilyOverlap(left: string[], right: string[]): number {
  const leftFamilies = left.map(toFamilyName).filter(Boolean);
  const rightFamilies = new Set(right.map(toFamilyName).filter(Boolean));

  if (leftFamilies.length === 0 || rightFamilies.size === 0) {
    return 0;
  }

  const matched = leftFamilies.filter((family) => rightFamilies.has(family)).length;
  return matched / Math.max(leftFamilies.length, rightFamilies.size);
}

function toFamilyName(value: string): string {
  return value.split(",")[0]?.trim().toLowerCase() ?? "";
}

function toTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 2 && token !== "the" && token !== "and");
}

function toConfidenceBand(score: number): ExternalMetadataConfidenceBand {
  if (score >= 80) {
    return "high";
  }
  if (score >= 55) {
    return "medium";
  }
  if (score >= 25) {
    return "low";
  }
  return "none";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
