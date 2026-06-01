import type { SourceDocument } from "../../types/domain";
import type { CitationGuardFlag, CitationGuardResult } from "./types";

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

function citationKey(author: string, year: string): string {
  return `${author.trim().toLowerCase()}::${year.trim()}`;
}
