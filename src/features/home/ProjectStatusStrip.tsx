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
  selectedProjectId: string | null
  onSelectProject: (projectId: string | null) => void
  onEditProject?: (projectId: string) => void
}

export function ProjectStatusStrip({
  projects,
  metricsByProjectId,
  globalMetrics,
  selectedProjectId,
  onSelectProject,
  onEditProject,
}: Props) {
  const isFiltered = selectedProjectId != null

  return (
    <div className="border-b border-border pb-3">
      <div
        className={`flex items-stretch gap-2 px-4 ${
          isFiltered ? 'overflow-hidden' : 'overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        }`}
      >
        <ProjectStatusCard
          name="All projects"
          selected={selectedProjectId === null}
          collapsed={!isFiltered}
          hidden={isFiltered}
          done={globalMetrics.done}
          remaining={globalMetrics.remaining}
          total={globalMetrics.total}
          progress={globalMetrics.progress}
          onSelect={() => onSelectProject(null)}
        />
        {projects.map((project) => {
          const m = metricsByProjectId.get(project.id)
          const styles = PROJECT_COLOR_STYLES[project.color]
          const selected = selectedProjectId === project.id
          return (
            <ProjectStatusCard
              key={project.id}
              name={project.name}
              selected={selected}
              collapsed={!isFiltered}
              expanded={isFiltered && selected}
              hidden={isFiltered && !selected}
              done={m?.done ?? 0}
              remaining={m?.remaining ?? 0}
              total={m?.total ?? 0}
              progress={m?.progress ?? 0}
              dotClassName={styles.dot}
              fillClassName={styles.dot}
              blocked={m?.byStatus.blocked ?? 0}
              onSelect={() => onSelectProject(project.id)}
              onEdit={
                onEditProject ? () => onEditProject(project.id) : undefined
              }
            />
          )
        })}
        <button
          type="button"
          aria-label="Show all projects"
          onClick={() => onSelectProject(null)}
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface text-lg text-muted transition-all duration-300 ease-out motion-reduce:transition-none hover:bg-surface-raised hover:text-text ${
            isFiltered
              ? 'min-h-11 w-11 min-w-11 opacity-100'
              : 'pointer-events-none min-h-11 w-0 min-w-0 border-0 opacity-0'
          }`}
        >
          ×
        </button>
      </div>
    </div>
  )
}

type CardProps = {
  name: string
  selected: boolean
  collapsed: boolean
  expanded?: boolean
  hidden?: boolean
  done: number
  remaining: number
  total: number
  progress: number
  dotClassName?: string
  fillClassName?: string
  blocked?: number
  onSelect: () => void
  onEdit?: () => void
}

function ProjectStatusCard({
  name,
  selected,
  collapsed,
  expanded = false,
  hidden = false,
  done,
  remaining,
  total,
  progress,
  dotClassName = 'bg-accent-mint',
  fillClassName = 'bg-accent-mint',
  blocked = 0,
  onSelect,
  onEdit,
}: CardProps) {
  const layoutClass = hidden
    ? 'w-0 min-w-0 shrink basis-0 overflow-hidden border-transparent px-0 py-0 opacity-0 pointer-events-none'
    : expanded
      ? 'min-w-0 flex-1 basis-0 opacity-100'
      : collapsed
        ? 'w-[168px] shrink-0 snap-start opacity-100'
        : 'min-w-0 flex-1 basis-0 opacity-100'

  return (
    <div
      className={`relative flex flex-col rounded-[var(--radius-card)] border px-3 py-2.5 text-left transition-all duration-300 ease-out motion-reduce:transition-none ${layoutClass} ${
        selected
          ? 'border-white/20 bg-surface-raised ring-1 ring-white/10'
          : 'border-border bg-surface hover:bg-surface-raised'
      }`}
    >
      {onEdit ? (
        <button
          type="button"
          aria-label="Edit project"
          className="absolute right-1.5 top-1.5 min-h-8 min-w-8 rounded-md text-sm text-muted hover:bg-white/5 hover:text-text"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          ⋯
        </button>
      ) : null}
      <button type="button" onClick={onSelect} className="w-full min-w-[140px] text-left">
        <div className="mb-1 flex items-center gap-2 pr-6">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${dotClassName}`}
            aria-hidden
          />
          <span
            className={`font-medium tracking-tight text-sm ${expanded ? '' : 'truncate'}`}
          >
            {name}
          </span>
          {blocked > 0 ? (
            <span className="ml-auto shrink-0 rounded-full bg-accent-rose/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent-rose">
              {blocked}
            </span>
          ) : null}
        </div>
        <p className="mb-2 text-[11px] text-muted">
          {total === 0 ? (
            'No tasks'
          ) : (
            <>
              {done} of {total} done ·{' '}
              <span className="font-medium text-text">{remaining} left</span>
            </>
          )}
        </p>
        <ProgressBar progress={progress} fillClassName={fillClassName} />
      </button>
    </div>
  )
}
