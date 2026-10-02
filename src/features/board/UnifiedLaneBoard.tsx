import type { Project, Task } from '../../lib/types'
import { TASK_STATUSES } from '../../lib/status-labels'
import { LaneSection } from './LaneSection'
import { tasksForLane } from './lane-board'
import { TaskLaneCard } from './TaskLaneCard'

type Props = {
  tasks: Task[]
  projectsById: Map<string, Project>
  showProjectChrome: boolean
  onTaskSelect?: (task: Task) => void
}

export function UnifiedLaneBoard({
  tasks,
  projectsById,
  showProjectChrome,
  onTaskSelect,
}: Props) {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-0 pb-24 pt-3">
      {TASK_STATUSES.map((status) => {
        const laneTasks = tasksForLane(tasks, status, 'updatedAt')
        return (
          <LaneSection key={status} status={status} count={laneTasks.length}>
            {laneTasks.length === 0 ? (
              <p className="px-4 text-xs text-muted/80">No tasks</p>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 snap-x snap-mandatory touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {laneTasks.map((task) => (
                  <TaskLaneCard
                    key={task.id}
                    task={task}
                    project={
                      showProjectChrome
                        ? projectsById.get(task.projectId)
                        : undefined
                    }
                    onSelect={onTaskSelect ? () => onTaskSelect(task) : undefined}
                  />
                ))}
              </div>
            )}
          </LaneSection>
        )
      })}
    </div>
  )
}
