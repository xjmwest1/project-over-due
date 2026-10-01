import type { TaskStatus } from './types'
import { TASK_STATUSES } from './types'

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  ready: 'Ready',
  doing: 'Doing',
  blocked: 'Blocked',
  done: 'Done',
}

export const TASK_STATUS_LANE_CLASS: Record<TaskStatus, string> = {
  backlog: '',
  ready: '',
  doing: '[&_.lane-name]:text-accent-sky',
  blocked: '[&_.lane-name]:text-accent-rose',
  done: '[&_.lane-name]:text-muted',
}

export { TASK_STATUSES }
