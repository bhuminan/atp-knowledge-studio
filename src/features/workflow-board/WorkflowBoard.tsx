import type { WorkflowStatus, WorkflowTask } from "../../types/domain";

interface WorkflowBoardProps {
  tasks: WorkflowTask[];
  tall?: boolean;
}

const columns: Array<{ key: WorkflowStatus; label: string }> = [
  { key: "inbox", label: "Inbox" },
  { key: "analyzing", label: "Analyzing" },
  { key: "synthesizing", label: "Synthesizing" },
  { key: "writing", label: "Writing" },
  { key: "review", label: "Review" },
  { key: "output_ready", label: "Output Ready" },
  { key: "completed", label: "Completed" }
];

export function WorkflowBoard({ tasks, tall = false }: WorkflowBoardProps) {
  return (
    <section className={`pixel-panel p-3 ${tall ? "min-h-[520px]" : "h-52 shrink-0"}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="panel-label">Workflow Board</p>
        <span className="text-xs font-bold uppercase text-studio-teal">
          Mock local task queue
        </span>
      </div>
      <div className="grid h-[calc(100%-32px)] grid-cols-7 gap-2 overflow-hidden">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);
          return (
            <div className="workflow-column" key={column.key}>
              <div className="workflow-column-header">
                <span>{column.label}</span>
                <span>{columnTasks.length}</span>
              </div>
              <div className="space-y-2 overflow-auto p-2">
                {columnTasks.map((task) => (
                  <article className="workflow-task" key={task.id}>
                    <p className="font-black text-white">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-300">{task.taskType}</p>
                    <span className={`priority priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
