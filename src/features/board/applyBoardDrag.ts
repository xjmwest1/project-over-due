import { moveTask } from '../../lib/db'
import { TASK_STATUSES } from '../../lib/status-labels'
import type { Task, TaskStatus } from '../../lib/types'
import {
  findLaneForTaskId,
  laneDroppableId,
  parseLaneDroppableId,
} from './lane-board'

export function moveBetweenLanes(
  lanes: Record<TaskStatus, string[]>,
  activeId: string,
  overId: string,
): Record<TaskStatus, string[]> | null {
  const activeLane = findLaneForTaskId(lanes, activeId)
  if (!activeLane) return null

  const overLane =
    parseLaneDroppableId(overId) ?? findLaneForTaskId(lanes, overId)
  if (!overLane) return null

  if (activeLane === overLane && !parseLaneDroppableId(overId)) {
    const laneItems = [...lanes[activeLane]]
    const oldIndex = laneItems.indexOf(activeId)
    const newIndex = laneItems.indexOf(overId)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null
    laneItems.splice(oldIndex, 1)
    laneItems.splice(newIndex, 0, activeId)
    return { ...lanes, [activeLane]: laneItems }
  }

  const next = { ...lanes }
  next[activeLane] = next[activeLane].filter((id) => id !== activeId)

  const dest = [...next[overLane]]
  const overIsLane = parseLaneDroppableId(overId) !== null
  if (overIsLane) {
    dest.push(activeId)
  } else {
    const insertAt = dest.indexOf(overId)
    if (insertAt === -1) dest.push(activeId)
    else dest.splice(insertAt, 0, activeId)
  }
  next[overLane] = dest
  return next
}

export async function persistLaneOrder(
  tasks: Task[],
  lanes: Record<TaskStatus, string[]>,
): Promise<void> {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const updates: Promise<unknown>[] = []

  for (const status of TASK_STATUSES) {
    lanes[status].forEach((id, sortOrder) => {
      const task = byId.get(id)
      if (!task) return
      if (task.status !== status || task.sortOrder !== sortOrder) {
        updates.push(moveTask(id, { status, sortOrder }))
      }
    })
  }

  await Promise.all(updates)
}

export function resolveOverId(over: { id: string | number } | null): string | null {
  if (!over) return null
  return String(over.id)
}

export { laneDroppableId }
