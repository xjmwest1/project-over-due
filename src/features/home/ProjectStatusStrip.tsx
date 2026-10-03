import { useEffect, useRef, useState } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import type { Project, ProjectMetrics } from '../../lib/types'

const CARD_WIDTH = 168
const CARD_GAP = 8 // gap-2

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
  const selectedIndex = isFiltered
    ? projects.findIndex((p) => p.id === selectedProjectId)
    : -1
  // Track index includes the leading "All projects" card at 0.
  const selectedTrackIndex = isFiltered && selectedIndex >= 0 ? selectedIndex + 1 : 0

  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(0)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => setViewportWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Keep every card in the DOM at full size; shift the track so the selected
  // card sits at the left edge, then expand it to fill the visible viewport.
  const translateX =
    isFiltered && selectedIndex >= 0
      ? -(selectedTrackIndex * (CARD_WIDTH + CARD_GAP))
      : 0
  const expandedWidth = isFiltered ? Math.max(CARD_WIDTH, viewportWidth) : CARD_WIDTH

  return (
    <div className="border-b border-border pb-3">
      <div className="flex items-stretch gap-2 px-4">
        <div
          ref={viewportRef}
          className={`min-w-0 flex-1 ${
            isFiltered
              ? 'overflow-hidden'
              : 'overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          }`}
        >
          <div
            className="flex items-stretch gap-2 transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(${translateX}px)` }}
          >
            <ProjectStatusCard
              name="All projects"
              selected={selectedProjectId === null}
              width={CARD_WIDTH}
              offscreen={isFiltered}
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
                  width={selected && isFiltered ? expandedWidth : CARD_WIDTH}
                  expanded={selected && isFiltered}
                  offscreen={isFiltered && !selected}
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
          </div>
        </div>
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
  width: number
  expanded?: boolean
  offscreen?: boolean
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
  width,
  expanded = false,
  offscreen = false,
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
  return (
    <div
      className={`relative flex shrink-0 flex-col rounded-[var(--radius-card)] border px-3 py-2.5 text-left transition-[width] duration-300 ease-out motion-reduce:transition-none ${
        selected
          ? 'border-white/20 bg-surface-raised ring-1 ring-white/10'
          : 'border-border bg-surface hover:bg-surface-raised'
      } ${offscreen ? 'pointer-events-none' : ''}`}
      style={{ width }}
      aria-hidden={offscreen || undefined}
    >
      {onEdit ? (
        <button
          type="button"
          aria-label="Edit project"
          tabIndex={offscreen ? -1 : undefined}
          className="absolute right-1.5 top-1.5 min-h-8 min-w-8 rounded-md text-sm text-muted hover:bg-white/5 hover:text-text"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          ⋯
        </button>
      ) : null}
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left ${expanded ? '' : 'min-w-[140px]'}`}
        tabIndex={offscreen ? -1 : undefined}
      >
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
