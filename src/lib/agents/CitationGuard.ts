import {
  LOCKED_CORE_SECTIONS,
  type ChapterSectionId,
  type CitationWarning,
  type SourceDocument,
  type TextbookChapterDraft
} from "../../types/domain";
import type {
  CitationGuardFlag,
  CitationGuardResult,
  TextbookCitationGuardResult
} from "./types";

const citationPattern = /\(([A-Z][A-Za-z .'-]+),\s*(\d{4})\)/g;

export function guardCitations(
  text: string,
  verifiedSources: SourceDocument[]
): CitationGuardResult {
  const flags: CitationGuardFlag[] = [];
  const verifiedKeys = new Map(
    verifiedSources
      .filter((source) => source.metadata.author && source.metadata.year)
      .map((source) => [
        citationKey(source.metadata.author ?? "", source.metadata.year ?? ""),
        source
      ])
  );

  for (const match of text.matchAll(citationPattern)) {
    const citation = match[0];
    const author = match[1] ?? "";
    const year = match[2] ?? "";
    const source = verifiedKeys.get(citationKey(author, year));

    if (source?.citationReadiness === "ready") {
      flags.push({
        citation,
        author,
        year,
        classification: "VERIFIED",
        matchedSourceId: source.id,
        note: "Citation matches a mock verified source record."
      });
      continue;
    }

    if (source) {
      flags.push({
        citation,
        author,
        year,
        classification: "UNVERIFIED",
        matchedSourceId: source.id,
        note: "Citation exists in mock source list but metadata is not ready."
      });
      continue;
    }

    flags.push({
      citation,
      author,
      year,
      classification: "FABRICATED-RISK",
      note: "Citation does not match the mock verified source list."
    });
  }

  return {
    detectedCount: flags.length,
    status: flags.length === 0 ? "no_citations_detected" : "has_flags",
    flags
  };
}

export function guardTextbookChapterCitations(
  chapter: TextbookChapterDraft
): TextbookCitationGuardResult {
  const warnings: CitationWarning[] = [];
  const lockedSectionIds = new Set<ChapterSectionId>(
    LOCKED_CORE_SECTIONS.map((section) => section.sectionId)
  );
  const sourceCards = chapter.evidenceLayer.sourceCards ?? [];
  const evidenceItems = chapter.evidenceLayer.evidenceItems ?? [];
  const citationMarkers = chapter.evidenceLayer.citationMarkers ?? [];
  const sourceIds = new Set(sourceCards.map((source) => source.sourceId));
  const evidenceIds = new Set(evidenceItems.map((evidence) => evidence.evidenceId));
  const citationMarkerIds = new Set(
    citationMarkers.map((marker) => marker.markerId)
  );

  sourceCards.forEach((source) => {
    if (!hasText(source.sourceId)) {
      warnings.push(
        createCitationWarning(
          "high",
          "SOURCE_MISSING_ID",
          "Source card is missing sourceId.",
          { sourceId: source.sourceId || null }
        )
      );
    }

    if (!hasText(source.title)) {
      warnings.push(
        createCitationWarning(
          "medium",
          "SOURCE_MISSING_TITLE",
          "Source card is missing title.",
          { sourceId: source.sourceId || null }
        )
      );
    }

    if (!Array.isArray(source.authors) || source.authors.length === 0) {
      warnings.push(
        createCitationWarning(
          "high",
          "SOURCE_MISSING_AUTHORS",
          "Source card is missing authors.",
          { sourceId: source.sourceId || null }
        )
      );
    }

    if (!hasText(source.year)) {
      warnings.push(
        createCitationWarning(
          "high",
          "SOURCE_MISSING_YEAR",
          "Source card is missing year.",
          { sourceId: source.sourceId || null }
        )
      );
    }

    if (!hasText(source.sourceType)) {
      warnings.push(
        createCitationWarning(
          "medium",
          "SOURCE_MISSING_TYPE",
          "Source card is missing sourceType.",
          { sourceId: source.sourceId || null }
        )
      );
    }

    if (!hasText(source.citationText)) {
      warnings.push(
        createCitationWarning(
          "high",
          "SOURCE_MISSING_CITATION_TEXT",
          "Source card is missing citationText.",
          { sourceId: source.sourceId || null }
        )
      );
    }

    if (["mock", "needs_review", "needs_metadata"].includes(source.apa7Status)) {
      warnings.push(
        createCitationWarning(
          "medium",
          "SOURCE_APA7_NOT_READY",
          "Source APA 7 metadata is incomplete, mock, or needs review.",
          { sourceId: source.sourceId || null }
        )
      );
    }

    if (source.reliabilityLevel === "low" || source.reliabilityLevel === "unknown") {
      warnings.push(
        createCitationWarning(
          "medium",
          "SOURCE_RELIABILITY_NOT_CONFIRMED",
          "Source reliability is low or unknown.",
          { sourceId: source.sourceId || null }
        )
      );
    }
  });

  evidenceItems.forEach((evidence) => {
    if (!hasText(evidence.evidenceId)) {
      warnings.push(
        createCitationWarning(
          "high",
          "EVIDENCE_MISSING_ID",
          "Evidence item is missing evidenceId.",
          { evidenceId: evidence.evidenceId || null }
        )
      );
    }

    if (!hasText(evidence.sourceId) || !sourceIds.has(evidence.sourceId)) {
      warnings.push(
        createCitationWarning(
          "high",
          "EVIDENCE_SOURCE_MISSING",
          "Evidence item points to a missing source card.",
          { sourceId: evidence.sourceId || null, evidenceId: evidence.evidenceId || null }
        )
      );
    }

    if (!hasText(evidence.claimSummary)) {
      warnings.push(
        createCitationWarning(
          "medium",
          "EVIDENCE_MISSING_CLAIM",
          "Evidence item is missing claimSummary.",
          { sourceId: evidence.sourceId || null, evidenceId: evidence.evidenceId || null }
        )
      );
    }

    if (!hasText(evidence.evidenceRole)) {
      warnings.push(
        createCitationWarning(
          "medium",
          "EVIDENCE_MISSING_ROLE",
          "Evidence item is missing evidenceRole.",
          { sourceId: evidence.sourceId || null, evidenceId: evidence.evidenceId || null }
        )
      );
    }

    if (!Array.isArray(evidence.relatedSectionIds) || evidence.relatedSectionIds.length === 0) {
      warnings.push(
        createCitationWarning(
          "medium",
          "EVIDENCE_MISSING_RELATED_SECTIONS",
          "Evidence item has no related section IDs.",
          { sourceId: evidence.sourceId || null, evidenceId: evidence.evidenceId || null }
        )
      );
    } else {
      evidence.relatedSectionIds.forEach((sectionId) => {
        if (!isLockedSectionId(sectionId, lockedSectionIds)) {
          warnings.push(
            createCitationWarning(
              "high",
              "EVIDENCE_SECTION_NOT_LOCKED",
              "Evidence item references a section outside the locked core section contract.",
              {
                sectionId: null,
                sourceId: evidence.sourceId || null,
                evidenceId: evidence.evidenceId || null
              }
            )
          );
        }
      });
    }

    if (["mock", "needs_review", "unsupported"].includes(evidence.verificationStatus)) {
      warnings.push(
        createCitationWarning(
          evidence.verificationStatus === "unsupported" ? "high" : "medium",
          "EVIDENCE_NOT_VERIFIED",
          "Evidence item is mock, needs review, or unsupported.",
          { sourceId: evidence.sourceId || null, evidenceId: evidence.evidenceId || null }
        )
      );
    }
  });

  citationMarkers.forEach((marker) => {
    if (!hasText(marker.markerId)) {
      warnings.push(
        createCitationWarning(
          "high",
          "CITATION_MARKER_MISSING_ID",
          "Citation marker is missing markerId.",
          { sourceId: marker.sourceId || null, evidenceId: marker.evidenceId || null }
        )
      );
    }

    if (!hasText(marker.sourceId) || !sourceIds.has(marker.sourceId)) {
      warnings.push(
        createCitationWarning(
          "high",
          "CITATION_SOURCE_MISSING",
          "Citation marker points to a missing source card.",
          { sourceId: marker.sourceId || null, evidenceId: marker.evidenceId || null }
        )
      );
    }

    if (hasText(marker.evidenceId) && !evidenceIds.has(marker.evidenceId)) {
      warnings.push(
        createCitationWarning(
          "high",
          "CITATION_EVIDENCE_MISSING",
          "Citation marker points to a missing evidence item.",
          { sourceId: marker.sourceId || null, evidenceId: marker.evidenceId || null }
        )
      );
    }

    if (!isLockedSectionId(marker.appearsInSectionId, lockedSectionIds)) {
      warnings.push(
        createCitationWarning(
          "high",
          "CITATION_SECTION_NOT_LOCKED",
          "Citation marker appears in a section outside the locked core section contract.",
          {
            sectionId: null,
            sourceId: marker.sourceId || null,
            evidenceId: marker.evidenceId || null
          }
        )
      );
    }

    if (["mock", "needs_review", "unsupported"].includes(marker.verificationStatus)) {
      warnings.push(
        createCitationWarning(
          marker.verificationStatus === "unsupported" ? "high" : "medium",
          "CITATION_NOT_VERIFIED",
          "Citation marker is mock, needs review, or unsupported.",
          {
            sectionId: marker.appearsInSectionId,
            sourceId: marker.sourceId || null,
            evidenceId: marker.evidenceId || null
          }
        )
      );
    }

    if (marker.mockStatus === "mock") {
      warnings.push(
        createCitationWarning(
          "medium",
          "CITATION_IS_MOCK",
          "Citation marker is explicitly mock and must not be treated as verified.",
          {
            sectionId: marker.appearsInSectionId,
            sourceId: marker.sourceId || null,
            evidenceId: marker.evidenceId || null
          }
        )
      );
    }
  });

  chapter.coreSections.forEach((section) => {
    section.linkedEvidenceIds.forEach((evidenceId) => {
      if (!evidenceIds.has(evidenceId)) {
        warnings.push(
          createCitationWarning(
            "high",
            "SECTION_EVIDENCE_MISSING",
            "Core section linkedEvidenceIds points to a missing evidence item.",
            { sectionId: section.sectionId, evidenceId }
          )
        );
      }
    });

    section.citationMarkers.forEach((marker) => {
      if (!citationMarkerIds.has(marker.markerId)) {
        warnings.push(
          createCitationWarning(
            "high",
            "SECTION_CITATION_MARKER_MISSING",
            "Core section citation marker is missing from evidenceLayer.citationMarkers.",
            {
              sectionId: section.sectionId,
              sourceId: marker.sourceId || null,
              evidenceId: marker.evidenceId || null
            }
          )
        );
      }
    });

    if (hasText(section.bodyThai) && section.linkedEvidenceIds.length === 0) {
      warnings.push(
        createCitationWarning(
          "medium",
          "SECTION_HAS_TEXT_WITHOUT_EVIDENCE",
          "Core section has bodyThai but no linkedEvidenceIds.",
          { sectionId: section.sectionId }
        )
      );
    }

    if (section.citationStatus === "supported" && section.linkedEvidenceIds.length === 0) {
      warnings.push(
        createCitationWarning(
          "high",
          "SUPPORTED_SECTION_HAS_NO_EVIDENCE",
          "Core section is marked supported but has no linkedEvidenceIds.",
          { sectionId: section.sectionId }
        )
      );
    }
  });

  const researchEvidenceSection = chapter.coreSections.find(
    (section) => section.sectionId === "research_evidence"
  );

  if (researchEvidenceSection && researchEvidenceSection.citationMarkers.length === 0) {
    warnings.push(
      createCitationWarning(
        "medium",
        "RESEARCH_EVIDENCE_HAS_NO_CITATIONS",
        "Research Evidence section has zero citation markers.",
        { sectionId: "research_evidence" }
      )
    );
  }

  const fabricatedRiskCount = warnings.filter((warning) =>
    [
      "CITATION_SOURCE_MISSING",
      "CITATION_EVIDENCE_MISSING",
      "EVIDENCE_SOURCE_MISSING",
      "SECTION_EVIDENCE_MISSING",
      "SECTION_CITATION_MARKER_MISSING"
    ].includes(warning.code)
  ).length;
  const mockCitationCount = citationMarkers.filter(
    (marker) => marker.mockStatus === "mock" || marker.verificationStatus === "mock"
  ).length;
  const unsupportedCitationCount = citationMarkers.filter(
    (marker) => marker.verificationStatus === "unsupported"
  ).length;
  const incompleteMetadataCount = sourceCards.filter((source) =>
    ["mock", "needs_review", "needs_metadata"].includes(source.apa7Status)
  ).length;
  const evidenceCoverageStatus =
    sourceCards.length === 0 || evidenceItems.length === 0 || citationMarkers.length === 0
      ? "missing"
      : chapter.coreSections.some((section) => section.linkedEvidenceIds.length === 0)
        ? "partial"
        : "covered";
  const hasHighRisk = warnings.some(
    (warning) => warning.severity === "critical" || warning.severity === "high"
  );
  const status =
    fabricatedRiskCount > 0 || unsupportedCitationCount > 0 || hasHighRisk
      ? "failed"
      : warnings.length > 0
        ? "needs_review"
        : "passed";

  return {
    status,
    warnings,
    checkedCitationCount: citationMarkers.length,
    checkedSourceCount: sourceCards.length,
    checkedEvidenceCount: evidenceItems.length,
    fabricatedRiskCount,
    mockCitationCount,
    unsupportedCitationCount,
    incompleteMetadataCount,
    evidenceCoverageStatus
  };
}

function citationKey(author: string, year: string): string {
  return `${author.trim().toLowerCase()}::${year.trim()}`;
}

function createCitationWarning(
  severity: CitationWarning["severity"],
  code: string,
  message: string,
  context: {
    sectionId?: ChapterSectionId | null;
    sourceId?: string | null;
    evidenceId?: string | null;
  } = {}
): CitationWarning {
  return {
    warningId: `${code.toLowerCase()}-${context.sectionId ?? "chapter"}-${
      context.sourceId ?? "source"
    }-${context.evidenceId ?? "evidence"}`,
    severity,
    code,
    message,
    sectionId: context.sectionId ?? null,
    sourceId: context.sourceId ?? null,
    evidenceId: context.evidenceId ?? null
  };
}

function isLockedSectionId(
  sectionId: string,
  lockedSectionIds: Set<ChapterSectionId>
): sectionId is ChapterSectionId {
  return lockedSectionIds.has(sectionId as ChapterSectionId);
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
