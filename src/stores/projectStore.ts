import { create } from 'zustand'
import {
  archiveProject,
  createProject,
  listProjects,
  updateProject,
  type CreateProjectOpts,
} from '../lib/db'
import type { Project } from '../lib/types'

type ProjectState = {
  projects: Project[]
  loading: boolean
  refresh: (options?: { includeArchived?: boolean }) => Promise<void>
  addProject: (name: string, opts?: CreateProjectOpts) => Promise<Project>
  patchProject: (
    id: string,
    patch: Partial<Pick<Project, 'name' | 'color' | 'note' | 'links'>>,
  ) => Promise<void>
  archive: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  loading: false,
  refresh: async (options) => {
    set({ loading: true })
    const projects = await listProjects(options)
    set({ projects, loading: false })
  },
  addProject: async (name, opts) => {
    const project = await createProject(name, opts)
    const projects = await listProjects()
    set({ projects })
    return project
  },
  patchProject: async (id, patch) => {
    await updateProject(id, patch)
    const projects = await listProjects()
    set({ projects })
  },
  archive: async (id) => {
    await archiveProject(id)
    const projects = await listProjects()
    set({ projects })
  },
}))
