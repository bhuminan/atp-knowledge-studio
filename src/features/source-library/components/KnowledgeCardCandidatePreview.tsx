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
  onReviewStatusChange: (
    candidateId: string,
    status: KnowledgeCardCandidateReviewStatus
  ) => void;
  parserWarnings: ExtractionWarning[];
  readinessWarnings: ExtractionWarning[];
  reviewStatuses: Record<string, KnowledgeCardCandidateReviewStatus>;
  segments: DocumentSegment[];
  traces: ExtractionTrace[];
}

type KnowledgeCardCandidateReviewStatus = "approved" | "needs_review" | "rejected";
type KnowledgeCardFutureVaultReadiness =
  | "ready_for_future_vault_save"
  | "needs_review"
  | "blocked";

const statusLabels: Record<KnowledgeCardCandidateStatus, string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

const reviewLabels: Record<KnowledgeCardCandidateReviewStatus, string> = {
  approved: "Approved",
  needs_review: "Needs review",
  rejected: "Rejected"
};

const futureVaultReadinessLabels: Record<KnowledgeCardFutureVaultReadiness, string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready_for_future_vault_save: "Ready for future Knowledge Vault save"
};

export function KnowledgeCardCandidatePreview({
  candidate,
  extraction,
  isReviewApproved,
  isValidationReady,
  onReviewStatusChange,
  parserWarnings,
  readinessWarnings,
  reviewStatuses,
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
  const cardItems = createKnowledgeCardReviewItems(mappingResult, reviewStatuses);
  const reviewSummary = summarizeKnowledgeCardReviews({
    cardItems,
    mappingWarningCount: mappingResult.warnings.length,
    sourceCardCandidate
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

          <KnowledgeCardReviewSummary summary={reviewSummary} />

          <CandidateGroup
            dataTestId="concept-card-candidates"
            items={cardItems.filter((item) => item.cardType === "concept")}
            onReviewStatusChange={onReviewStatusChange}
            title="ConceptCard Candidates"
          />
          <CandidateGroup
            dataTestId="evidence-card-candidates"
            items={cardItems.filter((item) => item.cardType === "evidence")}
            onReviewStatusChange={onReviewStatusChange}
            title="EvidenceCard Candidates"
          />
          <CandidateGroup
            dataTestId="quote-card-candidates"
            items={cardItems.filter((item) => item.cardType === "quote")}
            onReviewStatusChange={onReviewStatusChange}
            title="QuoteCard Candidates"
          />
          <CandidateGroup
            dataTestId="case-card-candidates"
            items={cardItems.filter((item) => item.cardType === "case")}
            onReviewStatusChange={onReviewStatusChange}
            title="CaseCard Candidates"
          />
          <CandidateGroup
            dataTestId="writing-angle-card-candidates"
            items={cardItems.filter((item) => item.cardType === "writing_angle")}
            onReviewStatusChange={onReviewStatusChange}
            title="WritingAngleCard Candidates"
          />

          <KnowledgeCardFutureVaultReadinessPanel summary={reviewSummary} />

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
  onReviewStatusChange,
  title
}: {
  dataTestId: string;
  items: KnowledgeCardReviewItem[];
  onReviewStatusChange: (
    candidateId: string,
    status: KnowledgeCardCandidateReviewStatus
  ) => void;
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
            <div className="mt-3 grid grid-cols-3 gap-2">
              <ReviewButton
                isActive={item.reviewStatus === "approved"}
                label="Approve"
                onClick={() => onReviewStatusChange(item.candidateId, "approved")}
                testId={getApproveButtonTestId(item.cardType)}
                tone="teal"
              />
              <ReviewButton
                isActive={item.reviewStatus === "needs_review"}
                label="Needs Review"
                onClick={() => onReviewStatusChange(item.candidateId, "needs_review")}
                tone="gold"
              />
              <ReviewButton
                isActive={item.reviewStatus === "rejected"}
                label="Reject"
                onClick={() => onReviewStatusChange(item.candidateId, "rejected")}
                tone="rose"
              />
            </div>
            <p className="mt-2 text-xs font-black uppercase text-slate-400">
              Review status: {reviewLabels[item.reviewStatus]}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

interface KnowledgeCardReviewItem {
  cardType: "concept" | "evidence" | "quote" | "case" | "writing_angle";
  candidateId: string;
  citationNeedsReview: boolean;
  detail: string;
  meta: string;
  reviewStatus: KnowledgeCardCandidateReviewStatus;
  status: KnowledgeCardCandidateStatus;
  title: string;
  traceReady: boolean;
}

interface KnowledgeCardReviewSummaryModel {
  approvedCount: number;
  blockedCount: number;
  citationNeedsReviewCount: number;
  futureVaultReadiness: KnowledgeCardFutureVaultReadiness;
  needsReviewCount: number;
  rejectedCount: number;
  totalCandidates: number;
  traceReadyCount: number;
  warningCount: number;
}

function KnowledgeCardReviewSummary({
  summary
}: {
  summary: KnowledgeCardReviewSummaryModel;
}) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="knowledge-card-review-summary"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            Knowledge Card Validation Summary
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {futureVaultReadinessLabels[summary.futureVaultReadiness]}
          </p>
        </div>
        <span className="status-pill">
          {futureVaultReadinessLabels[summary.futureVaultReadiness]}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <SummaryStat label="Total" value={summary.totalCandidates} />
        <div data-testid="knowledge-card-review-approved-count">
          <SummaryStat label="Approved" value={summary.approvedCount} />
        </div>
        <div data-testid="knowledge-card-review-needs-review-count">
          <SummaryStat label="Needs review" value={summary.needsReviewCount} />
        </div>
        <div data-testid="knowledge-card-review-rejected-count">
          <SummaryStat label="Rejected" value={summary.rejectedCount} />
        </div>
        <SummaryStat label="Blocked" value={summary.blockedCount} />
        <SummaryStat label="Trace-ready" value={summary.traceReadyCount} />
        <SummaryStat label="Citation review" value={summary.citationNeedsReviewCount} />
        <SummaryStat label="Warnings" value={summary.warningCount} />
      </div>
    </div>
  );
}

function KnowledgeCardFutureVaultReadinessPanel({
  summary
}: {
  summary: KnowledgeCardReviewSummaryModel;
}) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="knowledge-card-future-vault-readiness"
    >
      <div className="border-2 border-studio-line bg-studio-panel/60 p-3">
        <p className="text-xs font-black uppercase text-slate-400">
          Future Knowledge Vault Readiness
        </p>
        <p className="mt-2 text-sm font-black leading-6 text-white">
          {futureVaultReadinessLabels[summary.futureVaultReadiness]}
        </p>
        <p className="mt-2 text-xs font-black uppercase leading-5 text-studio-gold">
          Knowledge Cards are reviewed locally only. No cards are saved.
        </p>
        {summary.futureVaultReadiness !== "ready_for_future_vault_save" ? (
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Blockers: approve at least one candidate, keep rejected cards out of the
            ready set, and preserve trace references for QuoteCard and EvidenceCard
            candidates.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-studio-teal">
            Ready for future Knowledge Vault save.
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewButton({
  isActive,
  label,
  onClick,
  testId,
  tone
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
  testId?: string;
  tone: "teal" | "gold" | "rose";
}) {
  const activeClasses: Record<typeof tone, string> = {
    gold: "border-studio-gold bg-studio-gold/25 text-studio-gold",
    rose: "border-studio-rose bg-studio-rose/25 text-studio-rose",
    teal: "border-studio-teal bg-studio-teal/25 text-studio-teal"
  };

  return (
    <button
      className={`border-2 px-2 py-2 text-xs font-black uppercase shadow-pixel ${
        isActive ? activeClasses[tone] : "border-studio-line bg-studio-panel text-slate-300"
      }`}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function createKnowledgeCardReviewItems(
  mappingResult: ReturnType<typeof mapKnowledgeCardCandidates>,
  reviewStatuses: Record<string, KnowledgeCardCandidateReviewStatus>
): KnowledgeCardReviewItem[] {
  return [
    ...mappingResult.conceptCardCandidates.map((item): KnowledgeCardReviewItem => ({
      cardType: "concept",
      candidateId: item.candidateId,
      citationNeedsReview: true,
      detail: item.definitionPreview,
      meta: item.traceReference,
      reviewStatus: reviewStatuses[item.candidateId] ?? "needs_review",
      status: item.status,
      title: item.conceptName,
      traceReady: hasUsableTrace(item.traceReference)
    })),
    ...mappingResult.evidenceCardCandidates.map((item): KnowledgeCardReviewItem => ({
      cardType: "evidence",
      candidateId: item.candidateId,
      citationNeedsReview: true,
      detail: item.evidenceText,
      meta: item.traceReference,
      reviewStatus: reviewStatuses[item.candidateId] ?? "needs_review",
      status: item.status,
      title: item.claimPreview,
      traceReady: hasUsableTrace(item.traceReference)
    })),
    ...mappingResult.quoteCardCandidates.map((item): KnowledgeCardReviewItem => ({
      cardType: "quote",
      candidateId: item.candidateId,
      citationNeedsReview: true,
      detail: item.quoteText,
      meta: item.traceReference,
      reviewStatus: reviewStatuses[item.candidateId] ?? "needs_review",
      status: item.status,
      title: "Quote preview",
      traceReady: hasUsableTrace(item.traceReference)
    })),
    ...mappingResult.caseCardCandidates.map((item): KnowledgeCardReviewItem => ({
      cardType: "case",
      candidateId: item.candidateId,
      citationNeedsReview: true,
      detail: item.caseSummary,
      meta: item.traceReference,
      reviewStatus: reviewStatuses[item.candidateId] ?? "needs_review",
      status: item.status,
      title: item.caseTitle,
      traceReady: hasUsableTrace(item.traceReference)
    })),
    ...mappingResult.writingAngleCardCandidates.map((item): KnowledgeCardReviewItem => ({
      cardType: "writing_angle",
      candidateId: item.candidateId,
      citationNeedsReview: true,
      detail: item.teachingUse,
      meta: item.traceReference,
      reviewStatus: reviewStatuses[item.candidateId] ?? "needs_review",
      status: item.status,
      title: item.angleTitle,
      traceReady: hasUsableTrace(item.traceReference)
    }))
  ];
}

function summarizeKnowledgeCardReviews({
  cardItems,
  mappingWarningCount,
  sourceCardCandidate
}: {
  cardItems: KnowledgeCardReviewItem[];
  mappingWarningCount: number;
  sourceCardCandidate: SourceCardCandidatePreviewModel;
}): KnowledgeCardReviewSummaryModel {
  const approvedCount = cardItems.filter(
    (item) => item.reviewStatus === "approved"
  ).length;
  const rejectedCount = cardItems.filter(
    (item) => item.reviewStatus === "rejected"
  ).length;
  const needsReviewCount = cardItems.filter(
    (item) => item.reviewStatus === "needs_review"
  ).length;
  const blockedCount = cardItems.filter(
    (item) => item.status === "blocked" || item.reviewStatus === "rejected"
  ).length;
  const traceReadyCount = cardItems.filter((item) => item.traceReady).length;
  const citationNeedsReviewCount = cardItems.filter(
    (item) => item.citationNeedsReview || sourceCardCandidate.metadataStatus !== "ready"
  ).length;
  const activeItems = cardItems.filter((item) => item.reviewStatus !== "rejected");
  const approvedItems = activeItems.filter((item) => item.reviewStatus === "approved");
  const approvedTraceCriticalBlocked = approvedItems.some(
    (item) =>
      (item.cardType === "evidence" || item.cardType === "quote") && !item.traceReady
  );
  const approvedMappingBlocked = approvedItems.some((item) => item.status === "blocked");
  const futureVaultReadiness: KnowledgeCardFutureVaultReadiness =
    cardItems.length === 0 ||
    activeItems.length === 0 ||
    approvedTraceCriticalBlocked ||
    approvedMappingBlocked
      ? "blocked"
      : approvedCount > 0
        ? "ready_for_future_vault_save"
        : "needs_review";

  return {
    approvedCount,
    blockedCount,
    citationNeedsReviewCount,
    futureVaultReadiness,
    needsReviewCount,
    rejectedCount,
    totalCandidates: cardItems.length,
    traceReadyCount,
    warningCount: mappingWarningCount + citationNeedsReviewCount
  };
}

function getApproveButtonTestId(cardType: KnowledgeCardReviewItem["cardType"]): string {
  const testIds: Record<KnowledgeCardReviewItem["cardType"], string> = {
    case: "case-card-approve-button",
    concept: "concept-card-approve-button",
    evidence: "evidence-card-approve-button",
    quote: "quote-card-approve-button",
    writing_angle: "writing-angle-card-approve-button"
  };

  return testIds[cardType];
}

function hasUsableTrace(traceReference: string): boolean {
  return traceReference.startsWith("docx:");
}

function formatSourceCardCandidate(
  sourceCardCandidate: SourceCardCandidatePreviewModel
): string {
  return `${sourceCardCandidate.id} · ${sourceCardCandidate.fileReference} · ${sourceCardCandidate.metadataStatus}`;
}
