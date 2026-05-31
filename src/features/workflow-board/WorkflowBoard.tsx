import type {
  Agent,
  Project,
  SourceItem,
  WorkflowStatus,
  WorkflowTask
} from "../../types/domain";

interface WorkflowBoardProps {
  agents: Agent[];
  projects: Project[];
  sourceItems: SourceItem[];
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

const statusLabels: Record<WorkflowStatus, string> = {
  inbox: "Inbox",
  analyzing: "Analyzing",
  synthesizing: "Synthesizing",
  writing: "Writing",
  review: "Review",
  output_ready: "Output Ready",
  completed: "Completed"
};

export function WorkflowBoard({
  agents,
  projects,
  sourceItems,
  tasks,
  tall = false
}: WorkflowBoardProps) {
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const sourceById = new Map(sourceItems.map((source) => [source.id, source]));

  return (
    <section className={`pixel-panel p-3 ${tall ? "min-h-[560px]" : "h-64 shrink-0"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="panel-label">Workflow Board</p>
        <span className="mock-badge">
          Mock local task queue
        </span>
      </div>
      <div className="grid h-[calc(100%-36px)] grid-cols-7 gap-2 overflow-hidden">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);
          return (
            <div className="workflow-column" key={column.key}>
              <div className="workflow-column-header">
                <span>{column.label}</span>
                <span>{columnTasks.length}</span>
              </div>
              <div className="space-y-2 overflow-auto p-2">
                {columnTasks.map((task) => {
                  const assignedAgent = agentById.get(task.agentId);
                  const source = task.sourceId ? sourceById.get(task.sourceId) : undefined;
                  const project = projectById.get(task.projectId);

                  return (
                    <article className="workflow-task" key={task.id}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-black leading-5 text-white">{task.title}</p>
                        <span className={`priority priority-${task.priority}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs leading-5 text-slate-300">
                        <TaskMeta label="Source" value={source?.type ?? "synthesis"} />
                        <TaskMeta label="Project" value={project?.name ?? task.projectId} />
                        <TaskMeta label="Status" value={statusLabels[task.status]} />
                        <TaskMeta label="Agent" value={assignedAgent?.name ?? task.agentId} />
                      </div>
                      <p className="mt-2 border-t border-studio-line/70 pt-2 text-xs leading-5 text-studio-teal">
                        Next: {task.nextStep}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TaskMeta({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-black uppercase text-slate-500">{label}: </span>
      <span>{value}</span>
    </p>
  );
}
