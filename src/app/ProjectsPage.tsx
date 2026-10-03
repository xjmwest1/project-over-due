import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { QuickAddTaskSheet } from '../features/board/QuickAddTaskSheet'
import { DraggableLaneBoard } from '../features/board/DraggableLaneBoard'
import { ProjectStatusStrip } from '../features/home/ProjectStatusStrip'
import { useHomeBoardData } from '../features/home/useHomeBoardData'
import {
  ProjectFormSheet,
  type ProjectFormValues,
} from '../features/projects/ProjectFormSheet'
import {
  TaskDetailSheet,
  type TaskFormValues,
} from '../features/task-detail/TaskDetailSheet'
import { createTask, deleteTask, updateTask } from '../lib/db'
import type { Task } from '../lib/types'
import { useProjectStore } from '../stores/projectStore'

const PROJECT_PARAM = 'p'

export function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects)
  const projectsLoading = useProjectStore((s) => s.loading)
  const addProject = useProjectStore((s) => s.addProject)
  const patchProject = useProjectStore((s) => s.patchProject)
  const archiveProject = useProjectStore((s) => s.archive)
  const refreshProjects = useProjectStore((s) => s.refresh)
  const [searchParams, setSearchParams] = useSearchParams()

  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null)
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const selectedProjectId = searchParams.get(PROJECT_PARAM)
  const validProjectId = useMemo(() => {
    if (!selectedProjectId) return null
    return projects.some((p) => p.id === selectedProjectId)
      ? selectedProjectId
      : null
  }, [projects, selectedProjectId])

  const editProject = useMemo(
    () => projects.find((p) => p.id === editProjectId) ?? null,
    [projects, editProjectId],
  )

  useEffect(() => {
    if (selectedProjectId && !validProjectId) {
      const next = new URLSearchParams(searchParams)
      next.delete(PROJECT_PARAM)
      setSearchParams(next, { replace: true })
    }
  }, [selectedProjectId, validProjectId, searchParams, setSearchParams])

  const {
    tasks,
    metricsByProjectId,
    globalMetrics,
    projectsById,
    loading,
    reload: reloadBoard,
  } = useHomeBoardData(projects)

  const afterTaskChange = useCallback(async () => {
    await refreshProjects()
    await reloadBoard()
  }, [refreshProjects, reloadBoard])

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? null,
    [tasks, activeTaskId],
  )

  const activeTaskProject = useMemo(() => {
    if (!activeTask) return null
    return projectsById.get(activeTask.projectId) ?? null
  }, [activeTask, projectsById])

  const filteredProject = useMemo(
    () => (validProjectId ? projects.find((p) => p.id === validProjectId) : null),
    [projects, validProjectId],
  )

  const filteredTasks = useMemo(() => {
    if (!validProjectId) return tasks
    return tasks.filter((t) => t.projectId === validProjectId)
  }, [tasks, validProjectId])

  const showProjectChrome = validProjectId === null

  const setProjectFilter = (projectId: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (projectId) next.set(PROJECT_PARAM, projectId)
    else next.delete(PROJECT_PARAM)
    setSearchParams(next, { replace: true })
  }

  const openCreate = () => {
    setEditProjectId(null)
    setSheetMode('create')
  }

  const openEdit = (projectId: string) => {
    setEditProjectId(projectId)
    setSheetMode('edit')
  }

  const closeSheet = () => {
    setSheetMode(null)
    setEditProjectId(null)
  }

  const handleSubmit = async (values: ProjectFormValues) => {
    if (sheetMode === 'create') {
      const project = await addProject(values.name, {
        color: values.color,
        note: values.note || undefined,
        links: values.links,
      })
      setProjectFilter(project.id)
      return
    }
    if (sheetMode === 'edit' && editProjectId) {
      await patchProject(editProjectId, {
        name: values.name,
        color: values.color,
        note: values.note || undefined,
        links: values.links,
      })
    }
  }

  const handleArchive = async () => {
    if (!editProjectId) return
    await archiveProject(editProjectId)
    if (validProjectId === editProjectId) {
      setProjectFilter(null)
    }
  }

  const boardLoading = projectsLoading || loading

  const handleSaveTask = async (taskId: string, values: TaskFormValues) => {
    await updateTask(taskId, {
      title: values.title,
      status: values.status,
      note: values.note || undefined,
      links: values.links,
    })
    await afterTaskChange()
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
    setActiveTaskId(null)
    await afterTaskChange()
  }

  const handleCreateTask = async (title: string) => {
    if (!validProjectId) return
    await createTask(validProjectId, title, 'backlog')
    await afterTaskChange()
  }

  const openTask = (task: Task) => setActiveTaskId(task.id)

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
      <header className="shrink-0 bg-bg px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="min-h-10 px-3 text-xs" onClick={openCreate}>
              Add
            </Button>
            <Link
              to="/import"
              className="inline-flex min-h-10 items-center rounded-[var(--radius-card)] border border-border px-3 text-xs font-medium text-muted hover:text-text"
            >
              Import
            </Link>
            <Link
              to="/settings"
              className="inline-flex min-h-10 items-center rounded-[var(--radius-card)] border border-border px-3 text-xs font-medium text-muted hover:text-text"
              aria-label="Settings"
            >
              Settings
            </Link>
          </div>
        </div>
        {projects.length > 0 ? (
          <ProjectStatusStrip
            projects={projects}
            metricsByProjectId={metricsByProjectId}
            globalMetrics={globalMetrics}
            selectedProjectId={validProjectId}
            onSelectProject={setProjectFilter}
            onEditProject={openEdit}
          />
        ) : null}
      </header>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
        {boardLoading ? (
          <p className="px-4 py-8 text-sm text-muted">Loading board…</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted">No projects yet.</p>
            <Button type="button" className="bg-[#fafafa] text-bg hover:bg-white" onClick={openCreate}>
              Add project
            </Button>
            <Link
              to="/import"
              className="text-sm font-medium text-accent-mint hover:underline"
            >
              Plan with AI
            </Link>
          </div>
        ) : (
          <DraggableLaneBoard
            tasks={filteredTasks}
            projectsById={projectsById}
            showProjectChrome={showProjectChrome}
            onTaskSelect={openTask}
            onTasksMoved={afterTaskChange}
          />
        )}
      </main>

      {filteredProject ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="pointer-events-auto min-h-12 shadow-lg bg-[#fafafa] px-6 text-bg hover:bg-white"
            onClick={() => setQuickAddOpen(true)}
          >
            Add task
          </Button>
        </div>
      ) : null}

      <QuickAddTaskSheet
        open={quickAddOpen}
        projectName={filteredProject?.name ?? ''}
        onClose={() => setQuickAddOpen(false)}
        onCreate={handleCreateTask}
      />

      <TaskDetailSheet
        open={activeTaskId !== null}
        task={activeTask}
        project={activeTaskProject}
        onClose={() => setActiveTaskId(null)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <ProjectFormSheet
        key={sheetMode === 'edit' ? editProjectId : 'create'}
        open={sheetMode !== null}
        mode={sheetMode === 'edit' ? 'edit' : 'create'}
        initial={editProject}
        onClose={closeSheet}
        onSubmit={handleSubmit}
        onArchive={sheetMode === 'edit' ? handleArchive : undefined}
      />
    </div>
  )
}
