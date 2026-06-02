import type {
  DocumentSegment,
  DocumentTextExtraction,
  ExtractionTrace,
  ExtractionWarning,
  SourceDocument
} from "../../../types/domain";
import {
  mapKnowledgeCardCandidates,
  type KnowledgeCardCandidateStatus
} from "../../../lib/sources/KnowledgeCardCandidateMapper";
import {
  createSourceCardCandidatePreview,
  type SourceCardCandidatePreviewModel
} from "./SourceCardCandidatePreview";
import { Detail, SummaryStat } from "./SourceLibraryPrimitives";

interface KnowledgeCardCandidatePreviewProps {
  candidate: Partial<SourceDocument>;
  extraction: DocumentTextExtraction;
  isReviewApproved: boolean;
  isValidationReady: boolean;
  parserWarnings: ExtractionWarning[];
  readinessWarnings: ExtractionWarning[];
  segments: DocumentSegment[];
  traces: ExtractionTrace[];
}

const statusLabels: Record<KnowledgeCardCandidateStatus, string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

export function KnowledgeCardCandidatePreview({
  candidate,
  extraction,
  isReviewApproved,
  isValidationReady,
  parserWarnings,
  readinessWarnings,
  segments,
  traces
}: KnowledgeCardCandidatePreviewProps) {
  const canPreviewKnowledgeCards = isReviewApproved && isValidationReady;
  const sourceCardCandidate = createSourceCardCandidatePreview({
    candidate,
    extraction,
    isBlocked: !canPreviewKnowledgeCards,
    segments
  });
  const mappingResult = mapKnowledgeCardCandidates({
    extraction,
    parserWarnings,
    readinessWarnings,
    segments,
    sourceCardCandidate,
    sourceDocumentCandidate: candidate,
    traces
  });

  return (
    <div className="mt-4 border-t border-studio-line/70 pt-3">
      {canPreviewKnowledgeCards ? (
        <div
          className="border-2 border-studio-teal bg-studio-teal/10 p-3"
          data-testid="knowledge-card-candidate-preview"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black uppercase text-studio-teal">
                Knowledge Card Candidate Preview
              </p>
              <p
                className="mt-1 text-xs font-black uppercase text-studio-gold"
                data-testid="knowledge-card-preview-only-notice"
              >
                Preview only — no Knowledge Cards are saved.
              </p>
            </div>
            <span className="status-pill">
              {statusLabels[mappingResult.readinessSummary.previewStatus]}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <SummaryStat
              label="Candidates"
              value={mappingResult.readinessSummary.candidateCount}
            />
            <SummaryStat
              label="Trace refs"
              value={mappingResult.readinessSummary.traceReadyCount}
            />
            <SummaryStat
              label="Warnings"
              value={mappingResult.readinessSummary.warningCount}
            />
          </div>

          <CandidateGroup
            dataTestId="concept-card-candidates"
            items={mappingResult.conceptCardCandidates.map((item) => ({
              detail: item.definitionPreview,
              meta: item.traceReference,
              status: item.status,
              title: item.conceptName
            }))}
            title="ConceptCard Candidates"
          />
          <CandidateGroup
            dataTestId="evidence-card-candidates"
            items={mappingResult.evidenceCardCandidates.map((item) => ({
              detail: item.evidenceText,
              meta: item.traceReference,
              status: item.status,
              title: item.claimPreview
            }))}
            title="EvidenceCard Candidates"
          />
          <CandidateGroup
            dataTestId="quote-card-candidates"
            items={mappingResult.quoteCardCandidates.map((item) => ({
              detail: item.quoteText,
              meta: item.traceReference,
              status: item.status,
              title: "Quote preview"
            }))}
            title="QuoteCard Candidates"
          />
          <CandidateGroup
            dataTestId="case-card-candidates"
            items={mappingResult.caseCardCandidates.map((item) => ({
              detail: item.caseSummary,
              meta: item.traceReference,
              status: item.status,
              title: item.caseTitle
            }))}
            title="CaseCard Candidates"
          />
          <CandidateGroup
            dataTestId="writing-angle-card-candidates"
            items={mappingResult.writingAngleCardCandidates.map((item) => ({
              detail: item.teachingUse,
              meta: item.traceReference,
              status: item.status,
              title: item.angleTitle
            }))}
            title="WritingAngleCard Candidates"
          />

          <div className="mt-4 border-t border-studio-line/70 pt-3">
            <p className="text-xs font-black uppercase text-slate-400">
              Trace readiness
            </p>
            <dl className="mt-3 grid gap-2">
              <Detail
                label="SourceCard candidate"
                value={formatSourceCardCandidate(sourceCardCandidate)}
              />
              <Detail
                label="DOCX trace note"
                value="DOCX page numbers are not trusted; use chunk references such as docx:pN."
              />
            </dl>
          </div>

          <div className="mt-4 border-t border-studio-line/70 pt-3">
            <p className="text-xs font-black uppercase text-slate-400">
              Warning / blocker summary
            </p>
            <div className="mt-2 grid gap-2">
              {mappingResult.warnings.map((warning) => (
                <p
                  className="border-l-4 border-studio-gold bg-studio-panel/60 p-2 text-sm leading-6 text-slate-300"
                  key={warning}
                >
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-studio-line bg-studio-panel/60 p-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Knowledge Card Candidate Preview
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-studio-gold">
            Knowledge card candidates are available only after SourceCard candidate
            approval and ready validation.
          </p>
          <p className="mt-2 text-xs font-black uppercase leading-5 text-slate-400">
            Preview only — no Knowledge Cards are saved.
          </p>
        </div>
      )}
    </div>
  );
}

function CandidateGroup({
  dataTestId,
  items,
  title
}: {
  dataTestId: string;
  items: Array<{
    detail: string;
    meta: string;
    status: KnowledgeCardCandidateStatus;
    title: string;
  }>;
  title: string;
}) {
  return (
    <section className="mt-4 border-t border-studio-line/70 pt-3" data-testid={dataTestId}>
      <p className="text-xs font-black uppercase text-slate-400">{title}</p>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <article
            className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
            key={`${title}-${item.title}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-black text-white">{item.title}</p>
              <span className="status-pill">{statusLabels[item.status]}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
            <p className="mt-1 text-xs font-black uppercase text-studio-blue">
              {item.meta}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatSourceCardCandidate(
  sourceCardCandidate: SourceCardCandidatePreviewModel
): string {
  return `${sourceCardCandidate.id} · ${sourceCardCandidate.fileReference} · ${sourceCardCandidate.metadataStatus}`;
}
