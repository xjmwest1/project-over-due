import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import { TASK_STATUS_LABEL, TASK_STATUSES } from '../../lib/status-labels'
import type { Project, Task, TaskStatus } from '../../lib/types'

const LANE_NAME_CLASS: Record<TaskStatus, string> = {
  backlog: 'text-lane-label',
  ready: 'text-lane-label',
  doing: 'text-accent-sky',
  blocked: 'text-accent-rose',
  done: 'text-muted',
}

type Props = {
  tasks: Task[]
  projectsById: Map<string, Project>
  showProjectChrome: boolean
}

function tasksForLane(tasks: Task[], status: TaskStatus): Task[] {
  return tasks
    .filter((t) => t.status === status)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
}

export function UnifiedLaneBoard({ tasks, projectsById, showProjectChrome }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-0 pb-24 pt-3">
      {TASK_STATUSES.map((status) => {
        const laneTasks = tasksForLane(tasks, status)
        return (
          <section key={status}>
            <div className="mb-2 flex items-center justify-between px-4">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${LANE_NAME_CLASS[status]}`}
              >
                {TASK_STATUS_LABEL[status]}
              </span>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">
                {laneTasks.length}
              </span>
            </div>
            {laneTasks.length === 0 ? (
              <p className="px-4 text-xs text-muted/80">No tasks</p>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {laneTasks.map((task) => (
                  <TaskLaneCard
                    key={task.id}
                    task={task}
                    project={
                      showProjectChrome
                        ? projectsById.get(task.projectId)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function TaskLaneCard({
  task,
  project,
}: {
  task: Task
  project?: Project
}) {
  const muted = task.status === 'done'
  const accent = project ? PROJECT_COLOR_STYLES[project.color].border : ''

  return (
    <article
      className={`w-[168px] shrink-0 snap-start rounded-[10px] border border-border bg-surface px-3 py-3 text-sm font-medium leading-snug tracking-tight ${
        muted ? 'opacity-55 font-normal' : ''
      } ${project ? `border-l-2 ${accent}` : ''}`}
    >
      {project ? (
        <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
          {project.name}
        </p>
      ) : null}
      <p className="line-clamp-3">{task.title}</p>
    </article>
  )
}
