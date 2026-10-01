import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { UnifiedLaneBoard } from '../features/board/UnifiedLaneBoard'
import { ProjectStatusStrip } from '../features/home/ProjectStatusStrip'
import { useHomeBoardData } from '../features/home/useHomeBoardData'
import {
  ProjectFormSheet,
  type ProjectFormValues,
} from '../features/projects/ProjectFormSheet'
import { useProjectStore } from '../stores/projectStore'

const PROJECT_PARAM = 'p'

export function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects)
  const projectsLoading = useProjectStore((s) => s.loading)
  const addProject = useProjectStore((s) => s.addProject)
  const patchProject = useProjectStore((s) => s.patchProject)
  const archiveProject = useProjectStore((s) => s.archive)
  const [searchParams, setSearchParams] = useSearchParams()

  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null)
  const [editProjectId, setEditProjectId] = useState<string | null>(null)

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

  const { tasks, metricsByProjectId, globalMetrics, projectsById, loading } =
    useHomeBoardData(projects)

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-10 bg-bg/95 px-4 pb-2 pt-4 backdrop-blur-sm">
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

      <main className="flex min-h-0 flex-1 flex-col">
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
          <UnifiedLaneBoard
            tasks={filteredTasks}
            projectsById={projectsById}
            showProjectChrome={showProjectChrome}
          />
        )}
      </main>

      <ProjectFormSheet
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
