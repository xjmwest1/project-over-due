import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { UnifiedLaneBoard } from '../features/board/UnifiedLaneBoard'
import { ProjectStatusStrip } from '../features/home/ProjectStatusStrip'
import { useHomeBoardData } from '../features/home/useHomeBoardData'
import { useProjectStore } from '../stores/projectStore'

const PROJECT_PARAM = 'p'

export function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects)
  const projectsLoading = useProjectStore((s) => s.loading)
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedProjectId = searchParams.get(PROJECT_PARAM)
  const validProjectId = useMemo(() => {
    if (!selectedProjectId) return null
    return projects.some((p) => p.id === selectedProjectId)
      ? selectedProjectId
      : null
  }, [projects, selectedProjectId])

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

  const boardLoading = projectsLoading || loading

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-10 bg-bg/95 px-4 pb-2 pt-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <Link
            to="/import"
            className="inline-flex min-h-10 items-center rounded-[var(--radius-card)] border border-border px-3 text-xs font-medium text-muted hover:text-text"
          >
            Import
          </Link>
        </div>
        {projects.length > 0 ? (
          <ProjectStatusStrip
            projects={projects}
            metricsByProjectId={metricsByProjectId}
            globalMetrics={globalMetrics}
            selectedProjectId={validProjectId}
            onSelectProject={setProjectFilter}
          />
        ) : null}
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {boardLoading ? (
          <p className="px-4 py-8 text-sm text-muted">Loading board…</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted">No projects yet.</p>
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
    </div>
  )
}
