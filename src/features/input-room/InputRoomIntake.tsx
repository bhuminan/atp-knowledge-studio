import type { DragEvent } from "react";
import { useMemo, useRef, useState } from "react";

type InputRoomSupportStatus = "supported" | "unsupported";
type InputRoomReviewStatus = "ready_for_review" | "needs_format_review" | "review_noted";

interface InputRoomQueueItem {
  id: string;
  fileName: string;
  extension: string;
  typeLabel: string;
  sizeLabel: string;
  supportStatus: InputRoomSupportStatus;
  localPreviewStatus: string;
  reviewStatus: InputRoomReviewStatus;
  warning?: string;
}

const supportedExtensions = new Set(["pdf", "docx"]);

const reviewStatusLabels: Record<InputRoomReviewStatus, string> = {
  ready_for_review: "Ready for review",
  needs_format_review: "Needs format review",
  review_noted: "Review noted"
};

export function InputRoomIntake() {
  const [queueItems, setQueueItems] = useState<InputRoomQueueItem[]>([]);
  const [instructions, setInstructions] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const batchPreview = useMemo(() => {
    const supportedCount = queueItems.filter(
      (item) => item.supportStatus === "supported"
    ).length;
    const warningCount = queueItems.length - supportedCount;
    const mode = instructions.trim().length > 0 ? "Guided Batch Intake" : "Quick Intake";

    return {
      fileCount: queueItems.length,
      mode,
      supportedCount,
      warningCount
    };
  }, [instructions, queueItems]);

  function addFiles(files: FileList | File[]) {
    const nextItems = Array.from(files).map(createQueueItem);

    setQueueItems((currentItems) => [...currentItems, ...nextItems]);
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
          accept=".pdf,.docx"
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
        <SummaryTile label="Supported" value={batchPreview.supportedCount} />
        <SummaryTile label="Warnings" tone="warning" value={batchPreview.warningCount} />
        <SummaryTile label="Mode" value={batchPreview.mode} wide />
      </div>

      {batchPreview.warningCount > 0 ? (
        <div className="input-review-alert">
          <div>
            <strong>Review recommended</strong>
            <span>Some files are not supported-looking for this preview queue.</span>
          </div>
          <button type="button">Review</button>
        </div>
      ) : null}

      <div className="input-safety-copy">
        No files are parsed, saved, classified, or sent to AI in this sprint.
      </div>

      <div className="input-queue-list" aria-label="Local intake queue preview">
        {queueItems.length === 0 ? (
          <div className="input-empty-queue">
            <strong>Queue is empty</strong>
            <span>Select or drop multiple files to preview the batch.</span>
          </div>
        ) : (
          queueItems.map((item) => (
            <article className="input-queue-card" key={item.id}>
              <div className="input-queue-card-top">
                <div>
                  <h5>{item.fileName}</h5>
                  <p>
                    {item.typeLabel} · {item.sizeLabel}
                  </p>
                </div>
                <span
                  className={`input-file-badge ${
                    item.supportStatus === "supported"
                      ? "input-file-badge-supported"
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
              <button onClick={() => handleReview(item.id)} type="button">
                Review
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  tone,
  value,
  wide = false
}: {
  label: string;
  tone?: "warning";
  value: number | string;
  wide?: boolean;
}) {
  return (
    <span
      className={`input-summary-tile ${tone === "warning" ? "summary-warning" : ""} ${
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

  return {
    id: createQueueItemId(file),
    extension: extension || "file",
    fileName: file.name,
    localPreviewStatus: "Local preview queued",
    reviewStatus: isSupported ? "ready_for_review" : "needs_format_review",
    sizeLabel: formatFileSize(file.size),
    supportStatus: isSupported ? "supported" : "unsupported",
    typeLabel: extension ? `${extension.toUpperCase()} file` : "Unknown file",
    warning: isSupported
      ? undefined
      : "Unsupported in Sprint 4L-1 preview. Keep for review, but do not process."
  };
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
