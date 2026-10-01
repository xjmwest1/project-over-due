import type { TaskStatus } from './types'
import { TASK_STATUSES } from './types'

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  ready: 'Ready',
  doing: 'Doing',
  blocked: 'Blocked',
  done: 'Done',
}

export { TASK_STATUSES }
