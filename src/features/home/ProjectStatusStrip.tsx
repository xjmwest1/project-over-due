import { useLayoutEffect, useRef, useState } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import type { Project, ProjectMetrics } from '../../lib/types'

const CARD_WIDTH = 168
const CARD_GAP = 8 // gap-2
const ANIMATION_MS = 300

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

/**
 * Horizontal project metrics strip.
 *
 * Cards are always mounted (stable keys). Filtering does not remove them —
 * the track translates and the selected card grows so neighbors slide off
 * the clipped viewport.
 */
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
  const selectedTrackIndex =
    isFiltered && selectedIndex >= 0 ? selectedIndex + 1 : -1

  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const prevSelectedRef = useRef<string | null>(null)
  const lastTrackIndexRef = useRef(0)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Preserve the expanded card id briefly while the exit animation runs.
  const [heldExpandedId, setHeldExpandedId] = useState<string | null>(null)
  const [shift, setShift] = useState(0)
  const [selectedWidth, setSelectedWidth] = useState(CARD_WIDTH)
  const [transitionsOn, setTransitionsOn] = useState(false)
  const [clipped, setClipped] = useState(false)

  const expandedId = selectedProjectId ?? heldExpandedId
  const filtering = clipped || isFiltered

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }

    const prev = prevSelectedRef.current
    let cancelled = false

    const cardOffset =
      selectedTrackIndex >= 0
        ? selectedTrackIndex * (CARD_WIDTH + CARD_GAP)
        : 0

    const measureExpandedWidth = () => {
      const styles = getComputedStyle(viewport)
      const padX =
        (parseFloat(styles.paddingLeft) || 0) +
        (parseFloat(styles.paddingRight) || 0)
      return Math.max(CARD_WIDTH, viewport.clientWidth - padX)
    }

    const entering = prev == null && selectedProjectId != null
    const leaving = prev != null && selectedProjectId == null

    if (entering && selectedTrackIndex >= 0) {
      // FLIP: lock the scrolled view, then animate grow + slide from there.
      // Cards stay mounted; only transform/width change.
      const scrollLeft = viewport.scrollLeft
      lastTrackIndexRef.current = selectedTrackIndex
      setHeldExpandedId(selectedProjectId)
      setClipped(true)
      setTransitionsOn(false)
      viewport.scrollLeft = 0
      setShift(-scrollLeft)
      setSelectedWidth(CARD_WIDTH)

      // Force style flush so the next update can transition from this pose.
      void track.offsetWidth

      const play = () => {
        if (cancelled) return
        setTransitionsOn(true)
        setShift(-cardOffset)
        setSelectedWidth(measureExpandedWidth())
      }

      // Double rAF: first frame commits the locked pose; second starts tween.
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(play)
      })

      prevSelectedRef.current = selectedProjectId
      return () => {
        cancelled = true
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
        // Restore so React Strict Mode's re-run still sees "entering".
        prevSelectedRef.current = prev
      }
    }

    if (leaving) {
      const leaveOffset = lastTrackIndexRef.current * (CARD_WIDTH + CARD_GAP)
      // Keep expanding the same card while it shrinks back.
      setHeldExpandedId(prev)
      setClipped(true)
      setTransitionsOn(true)
      setSelectedWidth(CARD_WIDTH)
      setShift(-leaveOffset)

      exitTimerRef.current = setTimeout(() => {
        if (cancelled) return
        setHeldExpandedId(null)
        setTransitionsOn(false)
        setClipped(false)
        setShift(0)
        setSelectedWidth(CARD_WIDTH)
        if (viewportRef.current && leaveOffset > 0) {
          viewportRef.current.scrollLeft = leaveOffset
        }
        exitTimerRef.current = null
      }, ANIMATION_MS)

      prevSelectedRef.current = selectedProjectId
      return () => {
        cancelled = true
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current)
          exitTimerRef.current = null
        }
        prevSelectedRef.current = prev
      }
    }

    if (isFiltered && selectedTrackIndex >= 0) {
      // Still filtered after enter committed (e.g. resize observer target).
      lastTrackIndexRef.current = selectedTrackIndex
      setHeldExpandedId(selectedProjectId)
      setClipped(true)
      setShift(-cardOffset)
      setSelectedWidth(measureExpandedWidth())
    }

    prevSelectedRef.current = selectedProjectId
    return () => {
      prevSelectedRef.current = prev
    }
  }, [isFiltered, selectedProjectId, selectedTrackIndex])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !filtering) return
    const measure = () => {
      const styles = getComputedStyle(viewport)
      const padX =
        (parseFloat(styles.paddingLeft) || 0) +
        (parseFloat(styles.paddingRight) || 0)
      return Math.max(CARD_WIDTH, viewport.clientWidth - padX)
    }
    const ro = new ResizeObserver(() => {
      if (selectedProjectId != null) {
        setSelectedWidth(measure())
      }
    })
    ro.observe(viewport)
    return () => ro.disconnect()
  }, [filtering, selectedProjectId])

  const trackTransition = transitionsOn
    ? `transform ${ANIMATION_MS}ms ease-out`
    : 'none'
  const widthTransition = transitionsOn
    ? `width ${ANIMATION_MS}ms ease-out`
    : 'none'

  return (
    <div className="border-b border-border pb-3">
      <div
        ref={viewportRef}
        className={`min-w-0 w-full px-4 ${
          clipped
            ? 'overflow-hidden'
            : 'overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        }`}
      >
        <div
          ref={trackRef}
          className="flex items-stretch gap-2 motion-reduce:!transition-none"
          style={{
            transform: `translateX(${shift}px)`,
            transition: trackTransition,
          }}
        >
          <ProjectStatusCard
            name="All projects"
            selected={selectedProjectId === null && !filtering}
            width={CARD_WIDTH}
            inert={filtering}
            done={globalMetrics.done}
            remaining={globalMetrics.remaining}
            total={globalMetrics.total}
            progress={globalMetrics.progress}
            onSelect={() => onSelectProject(null)}
          />
          {projects.map((project) => {
            const m = metricsByProjectId.get(project.id)
            const styles = PROJECT_COLOR_STYLES[project.color]
            const isExpandedCard = expandedId === project.id
            return (
              <ProjectStatusCard
                key={project.id}
                name={project.name}
                selected={
                  selectedProjectId === project.id ||
                  (filtering && isExpandedCard)
                }
                width={isExpandedCard ? selectedWidth : CARD_WIDTH}
                expanded={isExpandedCard && selectedWidth > CARD_WIDTH}
                inert={filtering && !isExpandedCard}
                widthTransition={isExpandedCard ? widthTransition : 'none'}
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
                onClearFilter={
                  isExpandedCard ? () => onSelectProject(null) : undefined
                }
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

type CardProps = {
  name: string
  selected: boolean
  width: number
  expanded?: boolean
  /** Visually off-viewport / non-interactive, but still mounted. */
  inert?: boolean
  widthTransition?: string
  done: number
  remaining: number
  total: number
  progress: number
  dotClassName?: string
  fillClassName?: string
  blocked?: number
  onSelect: () => void
  onEdit?: () => void
  onClearFilter?: () => void
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1.5 1.5 0 0 1 2.122 2.122l-11.25 11.25L4 18l.996-3.248z" />
    </svg>
  )
}

function ProjectStatusCard({
  name,
  selected,
  width,
  expanded = false,
  inert = false,
  widthTransition = 'none',
  done,
  remaining,
  total,
  progress,
  dotClassName = 'bg-accent-mint',
  fillClassName = 'bg-accent-mint',
  blocked = 0,
  onSelect,
  onEdit,
  onClearFilter,
}: CardProps) {
  const showActions = Boolean(onEdit || onClearFilter)

  return (
    <div
      className={`relative flex shrink-0 flex-col rounded-[var(--radius-card)] border px-3 py-2.5 text-left motion-reduce:!transition-none ${
        selected || expanded
          ? 'border-white/20 bg-surface-raised ring-1 ring-white/10'
          : 'border-border bg-surface hover:bg-surface-raised'
      } ${inert ? 'pointer-events-none' : ''}`}
      style={{ width, transition: widthTransition }}
      aria-hidden={inert || undefined}
    >
      {showActions ? (
        <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
          {onEdit ? (
            <button
              type="button"
              aria-label="Edit project"
              tabIndex={inert ? -1 : undefined}
              className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-muted hover:bg-white/5 hover:text-text"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          ) : null}
          {onClearFilter ? (
            <button
              type="button"
              aria-label="Show all projects"
              tabIndex={inert ? -1 : undefined}
              className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-lg leading-none text-muted hover:bg-white/5 hover:text-text"
              onClick={(e) => {
                e.stopPropagation()
                onClearFilter()
              }}
            >
              ×
            </button>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left ${expanded ? '' : 'min-w-[140px]'}`}
        tabIndex={inert ? -1 : undefined}
      >
        <div
          className={`mb-1 flex items-center gap-2 ${
            showActions ? (onClearFilter ? 'pr-16' : 'pr-8') : ''
          }`}
        >
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
