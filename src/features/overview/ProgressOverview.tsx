import { ProgressBar } from '../../components/ProgressBar'
import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import type { Project, ProjectMetrics } from '../../lib/types'

type Props = {
  projects: Project[]
  metricsByProjectId: Map<string, ProjectMetrics>
  globalMetrics: {
    done: number
    remaining: number
    total: number
    progress: number
  }
  onSelectProject: (projectId: string) => void
}

export function ProgressOverview({
  projects,
  metricsByProjectId,
  globalMetrics,
  onSelectProject,
}: Props) {
  const rows = projects
    .map((project) => ({
      project,
      metrics: metricsByProjectId.get(project.id),
    }))
    .sort((a, b) => {
      const remA = a.metrics?.remaining ?? 0
      const remB = b.metrics?.remaining ?? 0
      if (remB !== remA) return remB - remA
      return a.project.name.localeCompare(b.project.name)
    })

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4">
      <section
        className="rounded-[var(--radius-card)] border border-border bg-surface px-4 py-4"
        aria-labelledby="overview-global-heading"
      >
        <h2
          id="overview-global-heading"
          className="text-sm font-medium text-muted"
        >
          All projects
        </h2>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
          {globalMetrics.remaining}
          <span className="ml-2 text-base font-normal text-muted">
            {globalMetrics.remaining === 1 ? 'task' : 'tasks'} left
          </span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {globalMetrics.total === 0
            ? 'No tasks yet'
            : `${globalMetrics.done} of ${globalMetrics.total} done`}
        </p>
        {globalMetrics.total > 0 ? (
          <ProgressBar
            className="mt-4 h-1.5"
            progress={globalMetrics.progress}
            fillClassName="bg-accent-mint"
          />
        ) : null}
      </section>

      <section aria-labelledby="overview-projects-heading">
        <h2
          id="overview-projects-heading"
          className="mb-3 text-sm font-medium text-muted"
        >
          By project
          <span className="font-normal"> · most remaining first</span>
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No active projects.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map(({ project, metrics }) => {
              const m = metrics ?? {
                done: 0,
                remaining: 0,
                total: 0,
                progress: 0,
              }
              const styles = PROJECT_COLOR_STYLES[project.color]
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => onSelectProject(project.id)}
                    className="flex w-full flex-col rounded-[var(--radius-card)] border border-border bg-surface px-3 py-3 text-left transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium">
                        {project.name}
                      </span>
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-muted">
                        {m.remaining} left
                      </span>
                    </div>
                    <p className="mb-2 text-[11px] text-muted">
                      {m.total === 0
                        ? 'No tasks'
                        : `${m.done} of ${m.total} done`}
                    </p>
                    <ProgressBar
                      progress={m.progress}
                      fillClassName={styles.dot}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
