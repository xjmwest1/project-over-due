import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { newId } from './ids'
import { assertValidLinks, normalizeLinks } from './links'
import { computeGlobalMetrics, computeProjectMetrics } from './metrics'
import { seedDemoProject } from './seed'
import type {
  AppMeta,
  GlobalMetrics,
  Link,
  Project,
  ProjectColor,
  ProjectMetrics,
  Task,
  TaskStatus,
} from './types'
import { PROJECT_COLORS } from './types'

const DB_NAME = 'home-projects'
const DB_VERSION = 1
const META_KEY = 'app'

interface HomeProjectsDB extends DBSchema {
  projects: {
    key: string
    value: Project
    indexes: { byUpdatedAt: string }
  }
  tasks: {
    key: string
    value: Task
    indexes: { byProjectId: string; byProjectStatus: [string, TaskStatus] }
  }
  meta: {
    key: string
    value: AppMeta
  }
}

let dbPromise: Promise<IDBPDatabase<HomeProjectsDB>> | null = null

function nowIso(): string {
  return new Date().toISOString()
}

function defaultColor(color?: ProjectColor): ProjectColor {
  return color && PROJECT_COLORS.includes(color) ? color : 'mint'
}

export function getDb(): Promise<IDBPDatabase<HomeProjectsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HomeProjectsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const projects = db.createObjectStore('projects', { keyPath: 'id' })
        projects.createIndex('byUpdatedAt', 'updatedAt')

        const tasks = db.createObjectStore('tasks', { keyPath: 'id' })
        tasks.createIndex('byProjectId', 'projectId')
        tasks.createIndex('byProjectStatus', ['projectId', 'status'])

        db.createObjectStore('meta')
      },
    })
  }
  return dbPromise
}

async function getMetaRecord(): Promise<AppMeta> {
  const db = await getDb()
  const found = await db.get('meta', META_KEY)
  if (found) return found
  return { schemaVersion: DB_VERSION }
}

async function putMeta(patch: Partial<AppMeta>): Promise<AppMeta> {
  const db = await getDb()
  const current = await getMetaRecord()
  const next: AppMeta = { ...current, ...patch, schemaVersion: DB_VERSION }
  await db.put('meta', next, META_KEY)
  return next
}

/** Open DB, touch lastOpenedAt, optionally seed demo project once. */
export async function initPersistence(options?: { seedDemo?: boolean }): Promise<void> {
  await getDb()
  const meta = await getMetaRecord()
  const seedDemo = options?.seedDemo ?? true
  if (seedDemo && !meta.demoSeeded) {
    await seedDemoProject()
    await putMeta({ demoSeeded: true, lastOpenedAt: nowIso() })
    return
  }
  await putMeta({ lastOpenedAt: nowIso() })
}

export async function listProjects(options?: {
  includeArchived?: boolean
}): Promise<Project[]> {
  const db = await getDb()
  const all = await db.getAll('projects')
  const includeArchived = options?.includeArchived ?? false
  const filtered = includeArchived
    ? all
    : all.filter((p) => !p.archivedAt)
  return filtered.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDb()
  return db.get('projects', id)
}

export type CreateProjectOpts = {
  color?: ProjectColor
  note?: string
  links?: Link[]
}

export async function createProject(
  name: string,
  opts?: CreateProjectOpts,
): Promise<Project> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Project name is required')
  const links = normalizeLinks(opts?.links)
  assertValidLinks(links)
  const ts = nowIso()
  const project: Project = {
    id: newId(),
    name: trimmed,
    color: defaultColor(opts?.color),
    note: opts?.note?.trim() || undefined,
    links,
    createdAt: ts,
    updatedAt: ts,
  }
  const db = await getDb()
  await db.put('projects', project)
  return project
}

export async function updateProject(
  id: string,
  patch: Partial<
    Pick<Project, 'name' | 'color' | 'note' | 'links' | 'archivedAt'>
  >,
): Promise<Project> {
  const db = await getDb()
  const existing = await db.get('projects', id)
  if (!existing) throw new Error('Project not found')
  if (patch.links) {
    const links = normalizeLinks(patch.links)
    assertValidLinks(links)
    patch = { ...patch, links }
  }
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim()
    if (!trimmed) throw new Error('Project name is required')
    patch.name = trimmed
  }
  const updated: Project = {
    ...existing,
    ...patch,
    updatedAt: nowIso(),
  }
  await db.put('projects', updated)
  return updated
}

export async function archiveProject(id: string): Promise<Project> {
  return updateProject(id, { archivedAt: nowIso() })
}

export async function listTasksByProject(projectId: string): Promise<Task[]> {
  const db = await getDb()
  const tasks = await db.getAllFromIndex('tasks', 'byProjectId', projectId)
  return tasks.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function listTasksByStatus(
  projectId: string,
  status: TaskStatus,
): Promise<Task[]> {
  const db = await getDb()
  const tasks = await db.getAllFromIndex('tasks', 'byProjectStatus', [
    projectId,
    status,
  ])
  return tasks.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function createTask(
  projectId: string,
  title: string,
  status: TaskStatus = 'backlog',
): Promise<Task> {
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')
  const trimmed = title.trim()
  if (!trimmed) throw new Error('Task title is required')
  const existing = await listTasksByProject(projectId)
  const maxOrder = existing.reduce((m, t) => Math.max(m, t.sortOrder), -1)
  const ts = nowIso()
  const task: Task = {
    id: newId(),
    projectId,
    title: trimmed,
    status,
    links: [],
    sortOrder: maxOrder + 1,
    createdAt: ts,
    updatedAt: ts,
    completedAt: status === 'done' ? ts : undefined,
  }
  const db = await getDb()
  await db.put('tasks', task)
  await updateProject(projectId, {})
  return task
}

export async function updateTask(
  id: string,
  patch: Partial<
    Pick<Task, 'title' | 'status' | 'note' | 'links' | 'sortOrder'>
  >,
): Promise<Task> {
  const db = await getDb()
  const existing = await db.get('tasks', id)
  if (!existing) throw new Error('Task not found')
  if (patch.links) {
    const links = normalizeLinks(patch.links)
    assertValidLinks(links)
    patch = { ...patch, links }
  }
  if (patch.title !== undefined) {
    const trimmed = patch.title.trim()
    if (!trimmed) throw new Error('Task title is required')
    patch.title = trimmed
  }
  const ts = nowIso()
  let completedAt = existing.completedAt
  if (patch.status !== undefined) {
    completedAt = patch.status === 'done' ? ts : undefined
  }
  const updated: Task = {
    ...existing,
    ...patch,
    completedAt,
    updatedAt: ts,
  }
  await db.put('tasks', updated)
  await updateProject(existing.projectId, {})
  return updated
}

export async function moveTask(
  id: string,
  move: { status: TaskStatus; sortOrder?: number },
): Promise<Task> {
  return updateTask(id, move)
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb()
  const existing = await db.get('tasks', id)
  if (!existing) return
  await db.delete('tasks', id)
  await updateProject(existing.projectId, {})
}

export async function getProjectMetrics(
  projectId: string,
): Promise<ProjectMetrics> {
  const tasks = await listTasksByProject(projectId)
  return computeProjectMetrics(tasks)
}

export async function getGlobalMetrics(): Promise<GlobalMetrics> {
  const projects = await listProjects({ includeArchived: false })
  const tasksByProject = new Map<string, Task[]>()
  for (const p of projects) {
    tasksByProject.set(p.id, await listTasksByProject(p.id))
  }
  return computeGlobalMetrics(projects, tasksByProject)
}
