import type { DraftInputPackagePreview as DraftInputPackagePreviewModel } from "../../../lib/sources/DraftInputPackageMapper";
import { Detail, SummaryStat } from "./SourceLibraryPrimitives";

interface DraftInputPackagePreviewProps {
  approvedMarketingTags: string[];
  packagePreview: DraftInputPackagePreviewModel;
}

const readinessLabels: Record<"ready" | "needs_review" | "blocked", string> = {
  blocked: "Blocked",
  needs_review: "Needs review",
  ready: "Ready"
};

export function DraftInputPackagePreview({
  approvedMarketingTags,
  packagePreview
}: DraftInputPackagePreviewProps) {
  const approvedCardCount =
    packagePreview.conceptInputs.length +
    packagePreview.evidenceInputs.length +
    packagePreview.quoteInputs.length +
    packagePreview.caseInputs.length +
    packagePreview.writingAngleInputs.length;

  return (
    <div
      className="mt-4 border-t border-studio-line/70 pt-3"
      data-testid="draft-input-package-preview"
    >
      <div className="border-2 border-studio-blue bg-studio-blue/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black uppercase text-studio-blue">
              Draft Input Package Preview
            </p>
            <p
              className="mt-1 text-xs font-black uppercase text-studio-gold"
              data-testid="draft-input-preview-only-notice"
            >
              Preview only — no draft is generated.
            </p>
          </div>
          <span className="status-pill">Source-to-draft input</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryStat label="Approved cards" value={approvedCardCount} />
          <SummaryStat label="Sections" value={packagePreview.suggestedDraftSections.length} />
          <SummaryStat label="Warnings" value={packagePreview.warnings.length} />
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="draft-input-source-summary"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Package source summary
          </p>
          <dl className="mt-3 grid gap-2">
            <Detail label="Package ID" value={packagePreview.packageId} />
            <Detail
              label="Source document"
              value={packagePreview.sourceSummary.sourceDocumentTitle}
            />
            <Detail label="SourceCard" value={packagePreview.sourceSummary.sourceCardId} />
            <Detail label="Source type" value={packagePreview.sourceSummary.sourceType} />
          </dl>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="approved-tags-draft-input-preview"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Approved tags applied in preview
          </p>
          <p className="mt-1 text-xs font-black uppercase text-studio-gold">
            Approved tags are applied in preview only.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {approvedMarketingTags.length > 0 ? (
              approvedMarketingTags.map((tag) => (
                <span
                  className="border border-studio-line bg-studio-panel px-2 py-1 text-xs font-black uppercase text-slate-200"
                  key={tag}
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-400">
                No approved tags are available for this Draft Input Package preview.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-studio-line/70 pt-3">
          <p className="text-xs font-black uppercase text-slate-400">
            Suggested draft sections
          </p>
          <div className="mt-2 grid gap-2">
            {packagePreview.suggestedDraftSections.map((section) => (
              <article
                className="border-l-4 border-studio-blue bg-studio-panel/60 p-2"
                data-testid={getSectionTestId(section.sectionId)}
                key={section.sectionId}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-white">{section.title}</p>
                  <span className="status-pill">{section.inputCount} input(s)</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-300">{section.use}</p>
              </article>
            ))}
          </div>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="draft-input-citation-readiness"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Citation readiness
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-white">
            {readinessLabels[packagePreview.citationReadiness]}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Citation use remains review-gated; this package prepares draft inputs only.
          </p>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="draft-input-trace-readiness"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Trace readiness
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-white">
            {readinessLabels[packagePreview.traceReadiness]}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            DOCX traces use chunk references; page numbers are not treated as verified.
          </p>
        </div>

        <div
          className="mt-4 border-t border-studio-line/70 pt-3"
          data-testid="draft-input-warning-summary"
        >
          <p className="text-xs font-black uppercase text-slate-400">
            Warnings / blockers
          </p>
          <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-300">
            {packagePreview.blockers.length > 0 ? (
              packagePreview.blockers.map((blocker) => (
                <p className="border-l-4 border-studio-rose bg-studio-panel/60 p-2" key={blocker}>
                  {blocker}
                </p>
              ))
            ) : (
              <p className="border-l-4 border-studio-teal bg-studio-panel/60 p-2">
                No blockers for this preview package.
              </p>
            )}
            {packagePreview.warnings.map((warning) => (
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

function getSectionTestId(
  sectionId: DraftInputPackagePreviewModel["suggestedDraftSections"][number]["sectionId"]
): string {
  const testIds: Record<typeof sectionId, string> = {
    business_managerial_implication: "draft-input-managerial-section",
    concept_theory: "draft-input-concept-section",
    phenomenon_real_world_problem: "draft-input-case-section",
    research_evidence: "draft-input-evidence-section",
    teaching_textbook_angle: "draft-input-writing-angle-section"
  };

  return testIds[sectionId];
}
