import type { GlobalMetrics, Project, ProjectMetrics, Task, TaskStatus } from './types'
import { TASK_STATUSES } from './types'

function emptyByStatus(): Record<TaskStatus, number> {
  return {
    backlog: 0,
    ready: 0,
    doing: 0,
    blocked: 0,
    done: 0,
  }
}

export function computeProjectMetrics(tasks: Task[]): ProjectMetrics {
  const byStatus = emptyByStatus()
  for (const task of tasks) {
    byStatus[task.status] += 1
  }
  const done = byStatus.done
  const remaining = tasks.length - done
  const total = tasks.length
  const progress = total === 0 ? 0 : done / total
  return { done, remaining, total, progress, byStatus }
}

export function computeGlobalMetrics(
  projects: Project[],
  tasksByProject: Map<string, Task[]>,
): GlobalMetrics {
  let remaining = 0
  let done = 0
  let blocked = 0
  for (const project of projects) {
    if (project.archivedAt) continue
    const tasks = tasksByProject.get(project.id) ?? []
    const m = computeProjectMetrics(tasks)
    remaining += m.remaining
    done += m.done
    blocked += m.byStatus.blocked
  }
  return {
    remaining,
    done,
    total: remaining + done,
    blocked,
  }
}

export { TASK_STATUSES }
