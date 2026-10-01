export const PROJECT_COLORS = [
  'mint',
  'sky',
  'violet',
  'amber',
  'rose',
  'slate',
] as const

export type ProjectColor = (typeof PROJECT_COLORS)[number]

export const TASK_STATUSES = [
  'backlog',
  'ready',
  'doing',
  'blocked',
  'done',
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export type Link = {
  url: string
  label?: string
}

export type Project = {
  id: string
  name: string
  color: ProjectColor
  note?: string
  links: Link[]
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

export type Task = {
  id: string
  projectId: string
  title: string
  status: TaskStatus
  note?: string
  links: Link[]
  sortOrder: number
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type AppMeta = {
  schemaVersion: number
  lastOpenedAt?: string
  demoSeeded?: boolean
}

export type ProjectMetrics = {
  done: number
  remaining: number
  total: number
  progress: number
  byStatus: Record<TaskStatus, number>
}

export type GlobalMetrics = {
  remaining: number
  done: number
  total: number
  blocked: number
}
