import type { SourceToDraftMockPreview as SourceToDraftMockPreviewModel } from "../../../lib/sources/SourceToDraftMockMapper";
import { Detail, SummaryStat } from "./SourceLibraryPrimitives";

interface SourceToDraftMockPreviewProps {
  draftPreview: SourceToDraftMockPreviewModel;
}

const readinessLabels: Record<"ready" | "needs_review" | "blocked", string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

export function SourceToDraftMockPreview({
  draftPreview
}: SourceToDraftMockPreviewProps) {
  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="source-to-draft-mock-preview"
    >
      <div className="border-2 border-studio-teal bg-studio-teal/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-teal">
              Source-to-Draft Mock Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="draft-preview-only-notice"
            >
              Preview only — no draft is generated.
            </p>
          </div>
          <span className="status-pill">Textbook chapter preview</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryStat label="Sections" value={draftPreview.sectionPlans.length} />
          <SummaryStat label="Evidence links" value={draftPreview.evidenceMap.length} />
          <SummaryStat label="Warnings" value={draftPreview.warnings.length} />
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="draft-preview-summary"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Draft preview summary
          </p>
          <dl className="mt-3 grid gap-2">
            <Detail label="Preview ID" value={draftPreview.draftPreviewId} />
            <Detail label="Draft type" value={draftPreview.draftType} />
            <Detail label="Draft title" value={draftPreview.draftTitle} />
            <Detail label="Purpose" value={draftPreview.draftPurpose} />
          </dl>
        </div>

        <div className="mt-4 border-t border-studio-line/70 pt-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Suggested section structure
          </p>
          <div className="mt-2 grid gap-2">
            {draftPreview.sectionPlans.map((section) => (
              <article
                className="border-l-4 border-studio-teal bg-studio-panel/60 p-2"
                data-testid={getSectionTestId(section.sectionId)}
                key={section.sectionId}
              >
                <p className="font-black text-white">{section.sectionTitle}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {section.intendedRole}
                </p>
                <div className="mt-2 grid gap-1 text-xs font-black uppercase text-studio-blue">
                  <p>Concepts: {formatList(section.linkedConcepts)}</p>
                  <p>Evidence: {formatList(section.linkedEvidence)}</p>
                  <p>Cases: {formatList(section.linkedCases)}</p>
                  <p>Quotes: {formatList(section.linkedQuotes)}</p>
                  <p>Approved tags: {formatList(section.approvedTags)}</p>
                </div>
                {section.missingEvidenceWarnings.length > 0 ? (
                  <div className="mt-2 grid gap-1 text-sm leading-6 text-studio-gold">
                    {section.missingEvidenceWarnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-studio-line/70 pt-3" data-testid="draft-evidence-map">
          <p className="text-xs font-black uppercase text-slate-400">Evidence map</p>
          <div className="mt-2 grid gap-2">
            {draftPreview.evidenceMap.map((item) => (
              <article
                className="border-l-4 border-studio-blue bg-studio-panel/60 p-2"
                key={`${item.evidenceType}-${item.title}-${item.traceReference}`}
              >
                <p className="font-black text-white">{item.title}</p>
                <p className="mt-1 text-xs font-black uppercase text-studio-blue">
                  {item.evidenceType} · {item.sourceCardId} · {item.traceReference}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="draft-approved-tag-usage"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Approved tag usage
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {formatList(
              Array.from(new Set(draftPreview.sectionPlans.flatMap((section) => section.approvedTags)))
            )}
          </p>
        </div>

        <ReadinessBlock
          dataTestId="draft-citation-readiness"
          detail="Citation use remains review-gated; no APA citation is invented here."
          label="Citation readiness"
          value={readinessLabels[draftPreview.citationReadiness]}
        />
        <ReadinessBlock
          dataTestId="draft-trace-readiness"
          detail="DOCX page numbers are not trusted; chunk references remain the audit trail."
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
                No blockers for the source-to-draft preview.
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
  sectionId: SourceToDraftMockPreviewModel["sectionPlans"][number]["sectionId"]
): string {
  const testIds: Record<typeof sectionId, string> = {
    concept_theory: "draft-section-concept-theory",
    managerial_implication: "draft-section-managerial-implication",
    phenomenon: "draft-section-phenomenon",
    research_evidence: "draft-section-research-evidence",
    teaching_angle: "draft-section-teaching-angle"
  };

  return testIds[sectionId];
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "Review input required";
}
