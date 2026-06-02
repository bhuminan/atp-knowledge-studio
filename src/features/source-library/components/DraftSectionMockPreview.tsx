import type { DraftSectionMockPreview as DraftSectionMockPreviewModel } from "../../../lib/sources/DraftSectionMockComposer";
import { Detail, SummaryStat } from "./SourceLibraryPrimitives";

interface DraftSectionMockPreviewProps {
  draftPreview: DraftSectionMockPreviewModel;
}

const readinessLabels: Record<"ready" | "needs_review" | "blocked", string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

export function DraftSectionMockPreview({
  draftPreview
}: DraftSectionMockPreviewProps) {
  const linkedEvidenceCount = draftPreview.sections.reduce(
    (count, section) => count + section.linkedEvidenceIds.length,
    0
  );

  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="draft-section-mock-preview"
    >
      <div className="border-2 border-studio-gold bg-studio-gold/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-gold">
              Draft Section Mock Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="mock-draft-preview-only-notice"
            >
              Mock preview only — no draft is generated or saved.
            </p>
          </div>
          <span className="status-pill">Deterministic mock</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryStat label="Sections" value={draftPreview.sections.length} />
          <SummaryStat label="Evidence links" value={linkedEvidenceCount} />
          <SummaryStat label="Warnings" value={draftPreview.warnings.length} />
        </div>

        <dl className="mt-4 grid gap-2">
          <Detail label="Draft ID" value={draftPreview.draftId} />
          <Detail label="Draft title" value={draftPreview.draftTitle} />
          <Detail label="Draft type" value={draftPreview.draftType} />
        </dl>

        <div className="mt-4 grid gap-2">
          {draftPreview.sections.map((section) => (
            <article
              className="border-l-4 border-studio-gold bg-studio-panel/60 p-3"
              data-testid={getSectionTestId(section.sectionId)}
              key={section.sectionId}
            >
              <p className="font-black text-white">{section.sectionTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {section.mockParagraph}
              </p>
              <div
                className="mt-3 grid gap-1 text-xs font-black uppercase text-studio-blue"
                data-testid="mock-draft-linked-evidence"
              >
                <p>Evidence IDs: {formatList(section.linkedEvidenceIds)}</p>
                <p>Quote IDs: {formatList(section.linkedQuoteIds)}</p>
                <p>Case IDs: {formatList(section.linkedCaseIds)}</p>
              </div>
              <div className="mt-3" data-testid="mock-draft-approved-tags">
                <p className="text-xs font-black uppercase text-slate-400">
                  Approved tags
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {formatList(section.approvedTags)}
                </p>
              </div>
              {section.citationPlaceholders.length > 0 ? (
                <div className="mt-3 grid gap-1 text-sm leading-6 text-studio-gold">
                  {section.citationPlaceholders.map((placeholder) => (
                    <p key={placeholder}>{placeholder}</p>
                  ))}
                </div>
              ) : null}
              {section.warnings.length > 0 ? (
                <div className="mt-3 grid gap-1 text-sm leading-6 text-studio-gold">
                  {section.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <ReadinessBlock
          dataTestId="mock-draft-citation-readiness"
          detail="Citation placeholders remain mock-only and require source metadata review."
          label="Citation readiness"
          value={readinessLabels[draftPreview.citationReadiness]}
        />
        <ReadinessBlock
          dataTestId="mock-draft-trace-readiness"
          detail="DOCX traces use chunk references such as docx:pN; page numbers are not fabricated."
          label="Trace readiness"
          value={readinessLabels[draftPreview.traceReadiness]}
        />

        <div className="mt-4 border-t border-studio-line/70 pt-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Warning / blocker summary
          </p>
          <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-300">
            {draftPreview.blockers.length > 0 ? (
              draftPreview.blockers.map((blocker) => (
                <p className="border-l-4 border-studio-rose bg-studio-panel/60 p-2" key={blocker}>
                  {blocker}
                </p>
              ))
            ) : (
              <p className="border-l-4 border-studio-teal bg-studio-panel/60 p-2">
                No blockers for the mock draft section preview.
              </p>
            )}
            {draftPreview.warnings.map((warning) => (
              <p className="border-l-4 border-studio-gold bg-studio-panel/60 p-2" key={warning}>
                {warning}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadinessBlock({
  dataTestId,
  detail,
  label,
  value
}: {
  dataTestId: string;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="mt-4 border-t border-studio-line/70 pt-3" data-testid={dataTestId}>
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-black leading-6 text-white">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}

function getSectionTestId(
  sectionId: DraftSectionMockPreviewModel["sections"][number]["sectionId"]
): string {
  const testIds: Record<typeof sectionId, string> = {
    concept_theory: "mock-draft-section-concept-theory",
    managerial_implication: "mock-draft-section-managerial-implication",
    phenomenon: "mock-draft-section-phenomenon",
    research_evidence: "mock-draft-section-research-evidence",
    teaching_angle: "mock-draft-section-teaching-angle"
  };

  return testIds[sectionId];
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "Review input required";
}
