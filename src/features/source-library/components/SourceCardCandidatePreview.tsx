import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionTrace,
  ExtractionWarning,
  SourceDocument
} from "../../../types/domain";
import { Detail } from "./SourceLibraryPrimitives";

export type SourceCardCandidateMetadataStatus = "ready" | "needs_metadata" | "blocked";

export interface SourceCardCandidatePreviewModel {
  abstract: string;
  authors: string[];
  citationText: string;
  fileReference: string;
  id: string;
  keywords: string[];
  metadataStatus: SourceCardCandidateMetadataStatus;
  sourceType: string;
  title: string;
  year: string;
}

interface SourceCardCandidatePreviewProps {
  candidate: Partial<SourceDocument>;
  extraction: DocumentTextExtraction;
  isReviewApproved: boolean;
  isValidationReady: boolean;
  parserWarnings: ExtractionWarning[];
  readinessWarnings: ExtractionWarning[];
  reviewStatusLabel: string;
  segments: DocumentSegment[];
  traces: ExtractionTrace[];
}

const metadataStatusLabels: Record<SourceCardCandidateMetadataStatus, string> = {
  blocked: "Blocked",
  needs_metadata: "Needs metadata",
  ready: "Ready"
};

export function SourceCardCandidatePreview({
  candidate,
  extraction,
  isReviewApproved,
  isValidationReady,
  parserWarnings,
  readinessWarnings,
  reviewStatusLabel,
  segments,
  traces
}: SourceCardCandidatePreviewProps) {
  const canPreviewSourceCardCandidate = isReviewApproved && isValidationReady;
  const sourceCardCandidate = createSourceCardCandidatePreview({
    candidate,
    extraction,
    isBlocked: !canPreviewSourceCardCandidate,
    segments
  });
  const combinedWarnings = dedupeWarnings([...parserWarnings, ...readinessWarnings]);
  const traceReferences = traces.map((trace) => trace.chunkReference).filter(Boolean);

  return (
    <div className="mt-4 border-t border-studio-line/70 pt-3">
      {canPreviewSourceCardCandidate ? (
        <div
          className="border-2 border-studio-blue bg-studio-blue/10 p-3"
          data-testid="source-card-candidate-preview"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black uppercase text-studio-blue">
                SourceCard Candidate Preview
              </p>
              <p
                className="mt-1 text-xs font-black uppercase text-studio-gold"
                data-testid="source-card-candidate-preview-only-notice"
              >
                Preview only — no SourceCard is saved.
              </p>
            </div>
            <span className="status-pill">Candidate only</span>
          </div>

          <dl className="mt-4 grid gap-2">
            <Detail label="ID" value={sourceCardCandidate.id} />
            <Detail label="Title" value={sourceCardCandidate.title} />
            <Detail label="Authors" value={sourceCardCandidate.authors.join(", ")} />
            <Detail label="Year" value={sourceCardCandidate.year} />
            <Detail label="Source type" value={sourceCardCandidate.sourceType} />
            <Detail label="Abstract" value={sourceCardCandidate.abstract} />
            <Detail label="Keywords" value={sourceCardCandidate.keywords.join(", ")} />
            <Detail label="Citation text" value={sourceCardCandidate.citationText} />
            <Detail
              label="Metadata status"
              value={metadataStatusLabels[sourceCardCandidate.metadataStatus]}
            />
            <Detail label="File reference" value={sourceCardCandidate.fileReference} />
          </dl>

          <div className="mt-4 border-t border-studio-line/70 pt-3">
            <p className="text-xs font-black uppercase text-slate-400">
              Metadata readiness
            </p>
            <div className="mt-2 grid gap-2">
              {createMetadataChecks(sourceCardCandidate).map((check) => (
                <ReadinessRow key={check.label} {...check} />
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-studio-line/70 pt-3">
            <p className="text-xs font-black uppercase text-slate-400">
              Evidence / trace readiness
            </p>
            <div className="mt-2 grid gap-2">
              <ReadinessRow
                detail={`${segments.length} extraction segment${segments.length === 1 ? "" : "s"} available.`}
                label="Segment coverage"
                status={segments.length > 0 ? "ready" : "blocked"}
              />
              <ReadinessRow
                detail={
                  traceReferences.length > 0
                    ? `${traceReferences.slice(0, 5).join(", ")}${traceReferences.length > 5 ? "..." : ""}`
                    : "No extraction trace references available."
                }
                label="Trace references"
                status={traceReferences.length > 0 ? "ready" : "blocked"}
              />
              <ReadinessRow
                detail="DOCX page numbers are not trusted; use chunk references such as docx:pN for review."
                label="DOCX page limitation"
                status="needs_metadata"
              />
            </div>
          </div>

          <div className="mt-4 border-t border-studio-line/70 pt-3">
            <p className="text-xs font-black uppercase text-slate-400">
              Warning / blocker summary
            </p>
            <div className="mt-2 grid gap-2">
              {combinedWarnings.length > 0 ? (
                combinedWarnings.slice(0, 5).map((warning) => (
                  <article
                    className="border-l-4 border-studio-gold bg-studio-panel/60 p-2"
                    key={warning.warningId}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black uppercase text-studio-gold">
                        {warning.severity}
                      </span>
                      <span className="text-xs font-black uppercase text-studio-blue">
                        {warning.field ?? "source card candidate"}
                      </span>
                    </div>
                    <p className="mt-1 font-black text-white">{warning.code}</p>
                    <p className="mt-1 text-slate-300">{warning.message}</p>
                  </article>
                ))
              ) : (
                <p className="text-studio-teal">No parser warnings returned.</p>
              )}
              <ReadinessRow
                detail="Author, year, publisher, and APA 7 details still require human verification."
                label="Missing metadata"
                status="needs_metadata"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-studio-line bg-studio-panel/60 p-3">
          <p className="text-xs font-black uppercase text-slate-400">
            SourceCard Candidate Preview
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-studio-gold">
            SourceCard candidate preview is available only after approval and ready
            validation.
          </p>
          <p className="mt-2 text-xs font-black uppercase leading-5 text-slate-400">
            Current review state: {reviewStatusLabel}. Preview only — no SourceCard is
            saved.
          </p>
        </div>
      )}
    </div>
  );
}

export function createSourceCardCandidatePreview({
  candidate,
  extraction,
  isBlocked,
  segments
}: {
  candidate: Partial<SourceDocument>;
  extraction: DocumentTextExtraction;
  isBlocked: boolean;
  segments: DocumentSegment[];
}): SourceCardCandidatePreviewModel {
  const title = candidate.metadata?.title ?? candidate.title ?? "Title metadata required";
  const authors = candidate.metadata?.author
    ? splitAuthorList(candidate.metadata.author)
    : ["Author metadata required"];
  const year = candidate.metadata?.year ?? "Year metadata required";
  const keywords = Array.from(
    new Set(segments.flatMap((segment) => segment.tags).filter(Boolean))
  );

  return {
    abstract: createAbstractPreview(extraction.cleanedText || extraction.rawText),
    authors,
    citationText: `${authors[0]} (${year}). ${title}. [DRAFT - metadata required]`,
    fileReference: candidate.fileName ?? extraction.documentId,
    id: `candidate-source-card-${candidate.id ?? extraction.documentId}`,
    keywords: keywords.length > 0 ? keywords : ["metadata review required"],
    metadataStatus: isBlocked ? "blocked" : "needs_metadata",
    sourceType: candidate.fileType ?? "DOCX",
    title,
    year
  };
}

function createMetadataChecks(sourceCardCandidate: SourceCardCandidatePreviewModel) {
  return [
    {
      detail: sourceCardCandidate.title,
      label: "Has title",
      status: isPlaceholder(sourceCardCandidate.title) ? "needs_metadata" : "ready"
    },
    {
      detail: sourceCardCandidate.authors.join(", "),
      label: "Has authors",
      status: sourceCardCandidate.authors.some((author) => !isPlaceholder(author))
        ? "ready"
        : "needs_metadata"
    },
    {
      detail: sourceCardCandidate.year,
      label: "Has year",
      status: isPlaceholder(sourceCardCandidate.year) ? "needs_metadata" : "ready"
    },
    {
      detail: sourceCardCandidate.sourceType,
      label: "Has source type",
      status: sourceCardCandidate.sourceType ? "ready" : "blocked"
    },
    {
      detail: sourceCardCandidate.citationText,
      label: "Has citation text",
      status: sourceCardCandidate.citationText ? "needs_metadata" : "blocked"
    },
    {
      detail: sourceCardCandidate.fileReference,
      label: "Has file reference",
      status: sourceCardCandidate.fileReference ? "ready" : "blocked"
    }
  ] satisfies Array<{
    detail: string;
    label: string;
    status: SourceCardCandidateMetadataStatus;
  }>;
}

function ReadinessRow({
  detail,
  label,
  status
}: {
  detail: string;
  label: string;
  status: SourceCardCandidateMetadataStatus;
}) {
  const statusColor =
    status === "ready"
      ? "text-studio-teal"
      : status === "blocked"
        ? "text-studio-rose"
        : "text-studio-gold";

  return (
    <div className="flex items-start justify-between gap-3 border border-studio-line bg-studio-panel/60 px-2 py-2">
      <div>
        <p className="text-xs font-black uppercase text-white">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">{detail}</p>
      </div>
      <span className={`shrink-0 text-xs font-black uppercase ${statusColor}`}>
        {metadataStatusLabels[status]}
      </span>
    </div>
  );
}

function createAbstractPreview(text: string): string {
  const normalizedText = text.trim().replace(/\s+/g, " ");

  if (!normalizedText) {
    return "Abstract requires extracted text review.";
  }

  return normalizedText.length > 280
    ? `${normalizedText.slice(0, 280)}...`
    : normalizedText;
}

function dedupeWarnings(warnings: ExtractionWarning[]): ExtractionWarning[] {
  const seenWarningIds = new Set<string>();

  return warnings.filter((warning) => {
    if (seenWarningIds.has(warning.warningId)) {
      return false;
    }

    seenWarningIds.add(warning.warningId);
    return true;
  });
}

function isPlaceholder(value: string): boolean {
  return /metadata required|review required|pending/i.test(value);
}

function splitAuthorList(authorValue: string): string[] {
  return authorValue
    .split(/\s*(?:;|,|\band\b|&)\s*/i)
    .map((author) => author.trim())
    .filter(Boolean);
}
