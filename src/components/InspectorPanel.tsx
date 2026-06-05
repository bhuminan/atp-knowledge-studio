import { ChevronLeft, ChevronRight, PanelRightOpen } from "lucide-react";
import type { ReactNode } from "react";

export interface InspectorSection {
  id: string;
  title: string;
  status?: string;
  children: ReactNode;
}

interface InspectorPanelProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  sections?: InspectorSection[];
  children?: ReactNode;
  emptyMessage?: string;
}

export function InspectorPanel({
  title,
  subtitle,
  isOpen,
  onToggle,
  sections = [],
  children,
  emptyMessage = "No details selected."
}: InspectorPanelProps) {
  if (!isOpen) {
    return (
      <aside
        aria-label={`${title} inspector collapsed`}
        className="flex w-10 shrink-0 items-stretch overflow-hidden border-l-2 border-studio-line bg-studio-panel/70"
        data-testid="inspector-panel-collapsed"
      >
        <button
          aria-label={`Open ${title} inspector`}
          className="flex w-full flex-col items-center justify-start gap-2 px-1 py-3 text-studio-gold hover:bg-studio-teal/10 hover:text-studio-teal"
          onClick={onToggle}
          type="button"
        >
          <PanelRightOpen size={18} />
          <span className="mt-1 [writing-mode:vertical-rl] rotate-180 text-[0.65rem] font-black uppercase tracking-wide">
            Inspect
          </span>
        </button>
      </aside>
    );
  }

  const hasContent = sections.length > 0 || Boolean(children);

  return (
    <aside
      aria-label={`${title} inspector`}
      className="flex w-[260px] min-w-[240px] max-w-[280px] shrink-0 flex-col overflow-hidden border-l-2 border-studio-line bg-studio-panel/80"
      data-testid="inspector-panel-open"
    >
      <div className="flex items-start justify-between gap-3 border-b-2 border-studio-line px-3 py-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black uppercase text-studio-gold">
            Inspector
          </p>
          <h2 className="mt-1 text-sm font-black text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs font-semibold text-slate-300">{subtitle}</p>
          ) : null}
        </div>
        <button
          aria-label={`Collapse ${title} inspector`}
          className="grid h-8 w-8 shrink-0 place-items-center border-2 border-studio-line bg-studio-ink text-slate-100 hover:border-studio-gold hover:text-studio-gold"
          onClick={onToggle}
          type="button"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {hasContent ? (
          <>
            {sections.map((section) => (
              <section
                className="rounded-sm border border-studio-line bg-studio-ink/45 p-3"
                key={section.id}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-xs font-black uppercase text-white">
                    {section.title}
                  </h3>
                  {section.status ? (
                    <span className="rounded-sm border border-studio-teal/60 px-1.5 py-0.5 text-[0.62rem] font-black uppercase text-studio-teal">
                      {section.status}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs leading-5 text-slate-300">{section.children}</div>
              </section>
            ))}
            {children}
          </>
        ) : (
          <p className="text-sm font-semibold text-slate-300">{emptyMessage}</p>
        )}
      </div>

      <button
        className="flex items-center justify-center gap-1 border-t-2 border-studio-line px-3 py-2 text-xs font-black uppercase text-slate-300 hover:bg-studio-teal/10 hover:text-studio-teal"
        onClick={onToggle}
        type="button"
      >
        <ChevronLeft size={14} />
        Collapse
      </button>
    </aside>
  );
}
