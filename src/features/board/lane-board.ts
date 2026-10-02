import { TASK_STATUSES } from '../../lib/status-labels'
import type { Task, TaskStatus } from '../../lib/types'

export const LANE_NAME_CLASS: Record<TaskStatus, string> = {
  backlog: 'text-lane-label',
  ready: 'text-lane-label',
  doing: 'text-accent-sky',
  blocked: 'text-accent-rose',
  done: 'text-muted',
}

export type LaneSort = 'sortOrder' | 'updatedAt'

export function tasksForLane(
  tasks: Task[],
  status: TaskStatus,
  sort: LaneSort,
): Task[] {
  const lane = tasks.filter((t) => t.status === status)
  if (sort === 'sortOrder') {
    return lane.sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return lane.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function laneTaskIdsByStatus(
  tasks: Task[],
  sort: LaneSort,
): Record<TaskStatus, string[]> {
  const out = {} as Record<TaskStatus, string[]>
  for (const status of TASK_STATUSES) {
    out[status] = tasksForLane(tasks, status, sort).map((t) => t.id)
  }
  return out
}

export function laneDroppableId(status: TaskStatus): string {
  return `lane:${status}`
}

export function parseLaneDroppableId(id: string): TaskStatus | null {
  if (!id.startsWith('lane:')) return null
  const status = id.slice('lane:'.length) as TaskStatus
  return TASK_STATUSES.includes(status) ? status : null
}

export function findLaneForTaskId(
  lanes: Record<TaskStatus, string[]>,
  taskId: string,
): TaskStatus | null {
  for (const status of TASK_STATUSES) {
    if (lanes[status].includes(taskId)) return status
  }
  return null
}
