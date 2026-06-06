import { PanelRightOpen } from "lucide-react";
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
        className="inspector-rail-collapsed"
        data-testid="inspector-panel-collapsed"
      >
        <button
          aria-label={`Open ${title} inspector`}
          className="inspector-rail-button"
          onClick={onToggle}
          type="button"
        >
          <PanelRightOpen size={16} />
          <span>Inspect</span>
        </button>
      </aside>
    );
  }

  const hasContent = sections.length > 0 || Boolean(children);

  return (
    <aside
      aria-label={`${title} inspector`}
      className="inspector-panel win-panel"
      data-testid="inspector-panel-open"
    >
      <div className="inspector-titlebar">
        <p className="truncate">Inspector · {title}</p>
        <button
          aria-label={`Collapse ${title} inspector`}
          className="win-chrome-button"
          onClick={onToggle}
          type="button"
        >
          ×
        </button>
      </div>

      <div className="inspector-body">
        {subtitle ? <p className="text-meta">{subtitle}</p> : null}
        {hasContent ? (
          <>
            {sections.map((section) => (
              <section className="win-inset inspector-section" key={section.id}>
                <div className="inspector-section-heading">
                  <h3 className="text-label">{section.title}</h3>
                  {section.status ? (
                    <span className="trust-badge trust-badge-green">
                      {section.status}
                    </span>
                  ) : null}
                </div>
                <div className="text-small inspector-section-content">
                  {section.children}
                </div>
              </section>
            ))}
            {children}
          </>
        ) : (
          <p className="text-small">{emptyMessage}</p>
        )}
      </div>

      <button className="win-btn inspector-collapse" onClick={onToggle} type="button">
        Collapse &gt;&gt;
      </button>
    </aside>
  );
}
