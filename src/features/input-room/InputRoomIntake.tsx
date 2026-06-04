import type { DragEvent } from "react";
import { useMemo, useRef, useState } from "react";

type InputRoomSupportStatus = "supported" | "unsupported";
type InputRoomReviewStatus =
  | "ready_for_preview"
  | "needs_format_review"
  | "blocked_unsupported"
  | "review_noted";
type InputRoomReviewGroup = "ready" | "needs_review" | "unsupported";
type InputRoomAlertTone = "ready" | "review" | "blocked";
type InputRoomHandoffReadiness = "ready" | "needs_review" | "blocked";

interface InputRoomQueueItem {
  id: string;
  fileName: string;
  extension: string;
  typeLabel: string;
  sizeLabel: string;
  supportStatus: InputRoomSupportStatus;
  reviewGroup: InputRoomReviewGroup;
  localPreviewStatus: string;
  reviewStatus: InputRoomReviewStatus;
  intendedNextStep: string;
  warning?: string;
}

interface InputRoomHandoffCandidate {
  id: string;
  fileName: string;
  extension: string;
  typeLabel: string;
  sizeLabel: string;
  supportStatus: InputRoomSupportStatus;
  reviewGroup: InputRoomReviewGroup;
  intendedDestination: "Source Library Intake";
  handoffReadiness: InputRoomHandoffReadiness;
  blockers: string[];
  warnings: string[];
}

const supportedExtensions = new Set(["pdf", "docx"]);
const reviewableExtensions = new Set(["md", "txt", "rtf", "png", "jpg", "jpeg"]);

const reviewStatusLabels: Record<InputRoomReviewStatus, string> = {
  ready_for_preview: "Ready for preview",
  needs_format_review: "Needs format review",
  blocked_unsupported: "Unsupported",
  review_noted: "Review noted"
};

const reviewGroupLabels: Record<InputRoomReviewGroup, string> = {
  ready: "Ready",
  needs_review: "Needs Review",
  unsupported: "Unsupported"
};

const supportStatusLabels: Record<InputRoomSupportStatus, string> = {
  supported: "Supported-looking",
  unsupported: "Unsupported-looking"
};

const handoffReadinessLabels: Record<InputRoomHandoffReadiness, string> = {
  ready: "Ready",
  needs_review: "Needs review",
  blocked: "Blocked"
};

export function InputRoomIntake() {
  const [queueItems, setQueueItems] = useState<InputRoomQueueItem[]>([]);
  const [instructions, setInstructions] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isHandoffPreviewVisible, setIsHandoffPreviewVisible] = useState(false);
  const [actionNote, setActionNote] = useState(
    "Add PDF or DOCX sources to start a local intake preview."
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const batchPreview = useMemo(() => {
    const readyCount = queueItems.filter((item) => item.reviewGroup === "ready").length;
    const needsReviewCount = queueItems.filter(
      (item) => item.reviewGroup === "needs_review"
    ).length;
    const unsupportedCount = queueItems.filter(
      (item) => item.reviewGroup === "unsupported"
    ).length;
    const warningCount = needsReviewCount + unsupportedCount;
    const mode = instructions.trim().length > 0 ? "Guided Batch Intake" : "Quick Intake";
    const alertTone: InputRoomAlertTone =
      unsupportedCount > 0 ? "blocked" : warningCount > 0 ? "review" : "ready";

    return {
      alertTone,
      fileCount: queueItems.length,
      mode,
      needsReviewCount,
      readyCount,
      unsupportedCount,
      warningCount
    };
  }, [instructions, queueItems]);
  const selectedItem = queueItems.find((item) => item.id === selectedItemId);
  const instructionPreview = instructions.trim() || "No instruction. Quick Intake mode.";
  const hasQueueItems = queueItems.length > 0;
  const handoffCandidates = useMemo(
    () => buildInputRoomHandoffCandidates(queueItems),
    [queueItems]
  );
  const handoffSummary = useMemo(
    () => ({
      blockedCount: handoffCandidates.filter(
        (candidate) => candidate.handoffReadiness === "blocked"
      ).length,
      needsReviewCount: handoffCandidates.filter(
        (candidate) => candidate.handoffReadiness === "needs_review"
      ).length,
      readyCount: handoffCandidates.filter(
        (candidate) => candidate.handoffReadiness === "ready"
      ).length,
      totalCount: handoffCandidates.length
    }),
    [handoffCandidates]
  );
  const groupedQueueItems: Record<InputRoomReviewGroup, InputRoomQueueItem[]> = {
    ready: queueItems.filter((item) => item.reviewGroup === "ready"),
    needs_review: queueItems.filter((item) => item.reviewGroup === "needs_review"),
    unsupported: queueItems.filter((item) => item.reviewGroup === "unsupported")
  };

  function addFiles(files: FileList | File[]) {
    const nextItems = Array.from(files).map(createQueueItem);

    setQueueItems((currentItems) => [...currentItems, ...nextItems]);
    setSelectedItemId((currentSelectedId) => currentSelectedId ?? nextItems[0]?.id ?? null);
    setActionNote("Local queue updated. Review grouped files before any future handoff.");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  }

  function handleReview(itemId: string) {
    setQueueItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, reviewStatus: "review_noted" } : item
      )
    );
    setSelectedItemId(itemId);
    setActionNote("Review note recorded locally for this preview session only.");
  }

  function handleReviewWarnings() {
    const firstWarningItem = queueItems.find((item) => item.reviewGroup !== "ready");

    setSelectedItemId(firstWarningItem?.id ?? null);
    setActionNote(
      firstWarningItem
        ? "Showing the first item that needs human review."
        : "No warnings in the local queue."
    );
  }

  function handlePreparePreview() {
    setActionNote(
      queueItems.length > 0
        ? "Intake preview is prepared locally. Nothing has been parsed or saved."
        : "Add files before preparing a local preview."
    );
  }

  function handleClearQueue() {
    setQueueItems([]);
    setSelectedItemId(null);
    setIsHandoffPreviewVisible(false);
    setActionNote("Local queue cleared. No files were saved.");
  }

  function handlePreviewHandoff() {
    setIsHandoffPreviewVisible(true);
    setActionNote("Source Library handoff preview opened locally. No files were sent.");
  }

  return (
    <div className="input-intake-workbench">
      <div className="input-intake-header">
        <div>
          <p className="panel-label">Local intake preview</p>
          <h4>Start an intake session</h4>
        </div>
        <span className="input-safety-chip">Local preview only</span>
      </div>

      <div
        className={`input-drop-zone ${isDragging ? "input-drop-zone-active" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          className="input-file-control"
          multiple
          onChange={(event) => {
            if (event.target.files) {
              addFiles(event.target.files);
              event.target.value = "";
            }
          }}
          ref={fileInputRef}
          type="file"
        />
        <button
          className="input-browse-button"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Browse files
        </button>
        <div>
          <strong>Drop PDF or DOCX files here</strong>
          <span>Unsupported files stay visible as review warnings.</span>
        </div>
      </div>

      <label className="input-instruction-field">
        <span>AI Librarian instructions</span>
        <textarea
          onChange={(event) => setInstructions(event.target.value)}
          placeholder="Optional: focus on branding theory, methods, APA clues..."
          rows={3}
          value={instructions}
        />
      </label>

      <div className="input-batch-summary" aria-label="Input room batch summary">
        <SummaryTile label="Files" value={batchPreview.fileCount} />
        <SummaryTile label="Ready" tone="ready" value={batchPreview.readyCount} />
        <SummaryTile label="Warnings" tone="warning" value={batchPreview.warningCount} />
        <SummaryTile label="Unsupported" tone="blocked" value={batchPreview.unsupportedCount} />
        <SummaryTile label="Mode" value={batchPreview.mode} wide />
        <SummaryTile label="Instruction" value={instructionPreview} wide />
      </div>

      <LibrarianAlert
        hasQueueItems={hasQueueItems}
        onReviewWarnings={handleReviewWarnings}
        readyCount={batchPreview.readyCount}
        tone={batchPreview.alertTone}
        unsupportedCount={batchPreview.unsupportedCount}
        warningCount={batchPreview.warningCount}
      />

      <div className="input-actions-panel">
        {hasQueueItems ? (
          <div className="input-action-grid" aria-label="Input room guided next actions">
            {batchPreview.warningCount > 0 ? (
              <button
                className="input-action-warning"
                onClick={handleReviewWarnings}
                type="button"
              >
                <strong>Review warnings</strong>
                <span>{batchPreview.warningCount} need attention</span>
              </button>
            ) : null}
            <button onClick={handlePreparePreview} type="button">
              <strong>Prepare intake preview</strong>
              <span>Local checklist only</span>
            </button>
            <button onClick={handleClearQueue} type="button">
              <strong>Clear queue</strong>
              <span>Remove local preview</span>
            </button>
            <button
              className="input-action-future"
              onClick={handlePreviewHandoff}
              type="button"
            >
              <strong>Preview Source Library Handoff</strong>
              <span>Local candidates only</span>
            </button>
          </div>
        ) : null}
        <div className="input-safety-copy">
          Local preview only. No parsing, saving, classification, AI, API, or network call.
        </div>
        {hasQueueItems ? <p className="input-action-note">{actionNote}</p> : null}
      </div>

      <div className="input-review-layout">
        <div className="input-queue-list" aria-label="Local intake queue preview">
          {queueItems.length === 0 ? (
            <div className="input-empty-queue">
              <strong>Add PDF or DOCX sources to start a local intake preview.</strong>
              <span>Nothing is saved or processed until a future confirmed handoff.</span>
            </div>
          ) : (
            (Object.keys(groupedQueueItems) as InputRoomReviewGroup[]).map((group) => (
              <QueueGroup
                group={group}
                items={groupedQueueItems[group]}
                key={group}
                onReview={handleReview}
                onSelect={setSelectedItemId}
                selectedItemId={selectedItemId}
              />
            ))
          )}
        </div>

        <SelectedItemInspector
          instructionPreview={instructionPreview}
          item={selectedItem}
        />
      </div>

      {hasQueueItems && isHandoffPreviewVisible ? (
        <InputRoomHandoffPreview
          candidates={handoffCandidates}
          summary={handoffSummary}
        />
      ) : null}
    </div>
  );
}

function LibrarianAlert({
  hasQueueItems,
  onReviewWarnings,
  readyCount,
  tone,
  unsupportedCount,
  warningCount
}: {
  hasQueueItems: boolean;
  onReviewWarnings: () => void;
  readyCount: number;
  tone: InputRoomAlertTone;
  unsupportedCount: number;
  warningCount: number;
}) {
  const alertCopy: Record<InputRoomAlertTone, { title: string; body: string }> = {
    ready: {
      title: "AI Librarian ready",
      body: readyCount > 0 ? "All files look ready for local preview." : "Waiting for sources."
    },
    review: {
      title: "Review recommended",
      body: `${warningCount} file${warningCount === 1 ? "" : "s"} should be checked before any future queue step.`
    },
    blocked: {
      title: "Unsupported files blocked",
      body: `${unsupportedCount} file${
        unsupportedCount === 1 ? "" : "s"
      } cannot move beyond preview in this sprint.`
    }
  };

  return (
    <div className={`input-librarian-alert alert-${tone}`}>
      <span className="input-librarian-status">{alertCopy[tone].title}</span>
      <div>
        <span>{alertCopy[tone].body}</span>
      </div>
      {hasQueueItems && warningCount > 0 ? (
        <button onClick={onReviewWarnings} type="button">
          Review
        </button>
      ) : null}
    </div>
  );
}

function QueueGroup({
  group,
  items,
  onReview,
  onSelect,
  selectedItemId
}: {
  group: InputRoomReviewGroup;
  items: InputRoomQueueItem[];
  onReview: (itemId: string) => void;
  onSelect: (itemId: string) => void;
  selectedItemId: string | null;
}) {
  return (
    <section className={`input-queue-group group-${group}`}>
      <div className="input-queue-group-header">
        <strong>{reviewGroupLabels[group]}</strong>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="input-queue-group-empty">No files in this state.</p>
      ) : (
        items.map((item) => (
          <article
            className={`input-queue-card ${
              selectedItemId === item.id ? "input-queue-card-selected" : ""
            }`}
            key={item.id}
            onClick={() => onSelect(item.id)}
          >
            <div className="input-queue-card-top">
              <div>
                <h5>{item.fileName}</h5>
                <p>
                  {item.typeLabel} · {item.sizeLabel}
                </p>
              </div>
              <span
                className={`input-file-badge ${
                  item.reviewGroup === "ready"
                    ? "input-file-badge-supported"
                    : item.reviewGroup === "unsupported"
                      ? "input-file-badge-blocked"
                      : "input-file-badge-warning"
                }`}
              >
                {item.extension.toUpperCase()}
              </span>
            </div>
            <div className="input-card-status-row">
              <span>{item.localPreviewStatus}</span>
              <span>{reviewStatusLabels[item.reviewStatus]}</span>
            </div>
            {item.warning ? <p className="input-card-warning">{item.warning}</p> : null}
            <button
              onClick={(event) => {
                event.stopPropagation();
                onReview(item.id);
              }}
              type="button"
            >
              Review
            </button>
          </article>
        ))
      )}
    </section>
  );
}

function SelectedItemInspector({
  instructionPreview,
  item
}: {
  instructionPreview: string;
  item?: InputRoomQueueItem;
}) {
  if (!item) {
    return (
      <aside className="input-item-inspector">
        <p className="panel-label">Queue inspector</p>
        <strong>Select a queue card to inspect file readiness.</strong>
        <span>Supported PDF and DOCX files will appear as ready for local preview.</span>
      </aside>
    );
  }

  return (
    <aside className="input-item-inspector">
      <p className="panel-label">Queue inspector</p>
      <strong>{item.fileName}</strong>
      <dl>
        <div>
          <dt>Type</dt>
          <dd>{item.typeLabel}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{item.sizeLabel}</dd>
        </div>
        <div>
          <dt>Support</dt>
          <dd>{supportStatusLabels[item.supportStatus]}</dd>
        </div>
        <div>
          <dt>Review</dt>
          <dd>{reviewStatusLabels[item.reviewStatus]}</dd>
        </div>
        <div>
          <dt>Instruction</dt>
          <dd>{instructionPreview}</dd>
        </div>
      </dl>
      {item.warning ? <p className="input-card-warning">{item.warning}</p> : null}
      <p className="input-next-step">{item.intendedNextStep}</p>
    </aside>
  );
}

function InputRoomHandoffPreview({
  candidates,
  summary
}: {
  candidates: InputRoomHandoffCandidate[];
  summary: {
    blockedCount: number;
    needsReviewCount: number;
    readyCount: number;
    totalCount: number;
  };
}) {
  return (
    <section className="input-handoff-preview" aria-label="Source Library handoff preview">
      <div className="input-handoff-header">
        <div>
          <p className="panel-label">Source Library handoff</p>
          <strong>Preview only</strong>
        </div>
        <span>No files sent</span>
      </div>

      <div className="input-handoff-summary">
        <SummaryTile label="Candidates" value={summary.totalCount} />
        <SummaryTile label="Ready" tone="ready" value={summary.readyCount} />
        <SummaryTile label="Needs review" tone="warning" value={summary.needsReviewCount} />
        <SummaryTile label="Blocked" tone="blocked" value={summary.blockedCount} />
      </div>

      <p className="input-handoff-warning">
        Preview only -- no files are sent to Source Library.
      </p>

      <div className="input-handoff-list">
        {candidates.map((candidate) => (
          <article
            className={`input-handoff-card handoff-${candidate.handoffReadiness}`}
            key={candidate.id}
          >
            <div>
              <h5>{candidate.fileName}</h5>
              <p>
                {candidate.typeLabel} · {candidate.sizeLabel} ·{" "}
                {supportStatusLabels[candidate.supportStatus]} ·{" "}
                {reviewGroupLabels[candidate.reviewGroup]} · {candidate.intendedDestination}
              </p>
            </div>
            <span>{handoffReadinessLabels[candidate.handoffReadiness]}</span>
            {candidate.blockers.length > 0 ? (
              <p className="input-card-warning">{candidate.blockers.join(" ")}</p>
            ) : null}
            {candidate.warnings.length > 0 ? (
              <p className="input-card-warning">{candidate.warnings.join(" ")}</p>
            ) : null}
          </article>
        ))}
      </div>

      <p className="input-next-step">
        Future sprint: create reviewed Source Library intake job after explicit approval.
      </p>
    </section>
  );
}

function SummaryTile({
  label,
  tone,
  value,
  wide = false
}: {
  label: string;
  tone?: "ready" | "warning" | "blocked";
  value: number | string;
  wide?: boolean;
}) {
  return (
    <span
      className={`input-summary-tile ${tone ? `summary-${tone}` : ""} ${
        wide ? "summary-wide" : ""
      }`}
    >
      <strong>{value}</strong>
      {label}
    </span>
  );
}

function createQueueItem(file: File): InputRoomQueueItem {
  const extension = getFileExtension(file.name);
  const isSupported = supportedExtensions.has(extension);
  const needsReview = !isSupported && reviewableExtensions.has(extension);
  const reviewGroup: InputRoomReviewGroup = isSupported
    ? "ready"
    : needsReview
      ? "needs_review"
      : "unsupported";

  return {
    id: createQueueItemId(file),
    extension: extension || "file",
    fileName: file.name,
    intendedNextStep: getIntendedNextStep(reviewGroup),
    localPreviewStatus: "Local preview only",
    reviewGroup,
    reviewStatus: isSupported
      ? "ready_for_preview"
      : needsReview
        ? "needs_format_review"
        : "blocked_unsupported",
    sizeLabel: formatFileSize(file.size),
    supportStatus: isSupported ? "supported" : "unsupported",
    typeLabel: extension ? `${extension.toUpperCase()} file` : "Unknown file",
    warning: isSupported
      ? undefined
      : needsReview
        ? "Not intake-ready in this sprint. Review before converting or removing."
        : "Unsupported in Sprint 4L-2 preview. Keep visible, but do not process."
  };
}

function buildInputRoomHandoffCandidates(
  queueItems: InputRoomQueueItem[]
): InputRoomHandoffCandidate[] {
  return queueItems.map((item) => {
    const handoffReadiness: InputRoomHandoffReadiness =
      item.supportStatus === "unsupported"
        ? "blocked"
        : item.reviewGroup === "ready"
        ? "ready"
        : item.reviewGroup === "needs_review"
          ? "needs_review"
          : "blocked";

    return {
      blockers:
        handoffReadiness === "blocked"
          ? ["Unsupported files are blocked from handoff preview readiness."]
          : [],
      extension: item.extension,
      fileName: item.fileName,
      handoffReadiness,
      id: item.id,
      intendedDestination: "Source Library Intake",
      reviewGroup: item.reviewGroup,
      sizeLabel: item.sizeLabel,
      supportStatus: item.supportStatus,
      typeLabel: item.typeLabel,
      warnings:
        handoffReadiness === "needs_review"
          ? ["Review this file before any future Source Library intake job."]
          : []
    };
  });
}

function getIntendedNextStep(reviewGroup: InputRoomReviewGroup) {
  if (reviewGroup === "ready") {
    return "Next: keep in local preview and wait for a future confirmed intake action.";
  }

  if (reviewGroup === "needs_review") {
    return "Next: review the file format and decide whether to replace it with PDF or DOCX.";
  }

  return "Next: remove or replace this file before any future Source Library handoff.";
}

function createQueueItemId(file: File) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${file.name}-${file.size}-${file.lastModified}-${randomId}`;
}

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  return lastDotIndex >= 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";
}

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  const sizeInKilobytes = sizeInBytes / 1024;

  if (sizeInKilobytes < 1024) {
    return `${sizeInKilobytes.toFixed(1)} KB`;
  }

  return `${(sizeInKilobytes / 1024).toFixed(1)} MB`;
}
