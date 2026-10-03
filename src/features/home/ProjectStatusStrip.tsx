import { useLayoutEffect, useRef, useState } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import type { Project, ProjectMetrics } from '../../lib/types'

const CARD_WIDTH = 168
const CARD_GAP = 8 // gap-2
const CLOSE_BTN = 44 // w-11
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
  const wasFilteredRef = useRef(false)
  const lastTrackIndexRef = useRef(0)
  const expandedIdRef = useRef<string | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Shift / width are driven explicitly so we can FLIP from the card's
  // on-screen position instead of jumping it to the viewport edge.
  const [shift, setShift] = useState(0)
  const [selectedWidth, setSelectedWidth] = useState(CARD_WIDTH)
  const [animate, setAnimate] = useState(false)
  const [clipped, setClipped] = useState(false)
  // Keep rendering the expanding card during exit after selection clears.
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }

    const targetWidth = Math.max(CARD_WIDTH, viewport.clientWidth)

    if (isFiltered && selectedTrackIndex >= 0 && selectedProjectId) {
      const cardOffset = selectedTrackIndex * (CARD_WIDTH + CARD_GAP)
      lastTrackIndexRef.current = selectedTrackIndex
      expandedIdRef.current = selectedProjectId
      setExpandedId(selectedProjectId)

      if (!wasFilteredRef.current) {
        // Entering filter: lock the current scroll-derived view (no transition),
        // then animate width + shift so the card grows from its original spot.
        const scrollLeft = viewport.scrollLeft
        wasFilteredRef.current = true
        setAnimate(false)
        setClipped(true)
        viewport.scrollLeft = 0
        setShift(-scrollLeft)
        setSelectedWidth(CARD_WIDTH)

        let raf2 = 0
        const raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => {
            setAnimate(true)
            setShift(-cardOffset)
            setSelectedWidth(targetWidth)
          })
        })
        return () => {
          cancelAnimationFrame(raf1)
          cancelAnimationFrame(raf2)
        }
      }

      // Already filtered (e.g. resize): keep selected card pinned and sized.
      setClipped(true)
      setAnimate(true)
      setShift(-cardOffset)
      setSelectedWidth(targetWidth)
      return
    }

    if (!isFiltered && wasFilteredRef.current) {
      // Leaving filter: shrink in place, then restore normal scrolling.
      const cardOffset = lastTrackIndexRef.current * (CARD_WIDTH + CARD_GAP)
      setExpandedId(expandedIdRef.current)
      setAnimate(true)
      setClipped(true)
      setSelectedWidth(CARD_WIDTH)
      setShift(-cardOffset)

      exitTimerRef.current = setTimeout(() => {
        wasFilteredRef.current = false
        expandedIdRef.current = null
        setExpandedId(null)
        setAnimate(false)
        setClipped(false)
        setShift(0)
        if (viewportRef.current) {
          viewportRef.current.scrollLeft = cardOffset
        }
        exitTimerRef.current = null
      }, ANIMATION_MS)

      return () => {
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current)
          exitTimerRef.current = null
        }
      }
    }
  }, [isFiltered, selectedTrackIndex, selectedProjectId])

  // Keep expanded width in sync with viewport while filtered.
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !wasFilteredRef.current || !isFiltered) return
    const ro = new ResizeObserver(() => {
      setSelectedWidth(Math.max(CARD_WIDTH, viewport.clientWidth))
    })
    ro.observe(viewport)
    return () => ro.disconnect()
  }, [isFiltered])

  const widthTransition = animate
    ? `width ${ANIMATION_MS}ms ease-out`
    : 'none'
  const filtering = clipped || isFiltered

  return (
    <div className="border-b border-border pb-3">
      <div className="flex items-stretch gap-2 px-4">
        <div
          ref={viewportRef}
          className={`min-w-0 flex-1 ${
            clipped
              ? 'overflow-hidden'
              : 'overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          }`}
        >
          <div
            className="flex items-stretch gap-2 motion-reduce:!transition-none"
            style={{
              transform: `translateX(${shift}px)`,
              transition: animate
                ? `transform ${ANIMATION_MS}ms ease-out`
                : 'none',
            }}
          >
            <ProjectStatusCard
              name="All projects"
              selected={selectedProjectId === null && !filtering}
              width={CARD_WIDTH}
              offscreen={filtering}
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
              const selected =
                selectedProjectId === project.id ||
                (filtering && isExpandedCard)
              return (
                <ProjectStatusCard
                  key={project.id}
                  name={project.name}
                  selected={selected}
                  width={isExpandedCard ? selectedWidth : CARD_WIDTH}
                  expanded={isExpandedCard && selectedWidth > CARD_WIDTH}
                  offscreen={filtering && !isExpandedCard}
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
                />
              )
            })}
          </div>
        </div>
        {/* Always reserve space so revealing × doesn't shift the strip. */}
        <button
          type="button"
          aria-label="Show all projects"
          onClick={() => onSelectProject(null)}
          className={`flex shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface text-lg text-muted transition-opacity duration-300 ease-out motion-reduce:transition-none hover:bg-surface-raised hover:text-text ${
            isFiltered
              ? 'opacity-100'
              : 'pointer-events-none border-transparent opacity-0'
          }`}
          style={{ width: CLOSE_BTN, minWidth: CLOSE_BTN, minHeight: CLOSE_BTN }}
          tabIndex={isFiltered ? undefined : -1}
          aria-hidden={!isFiltered}
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
}

function ProjectStatusCard({
  name,
  selected,
  width,
  expanded = false,
  offscreen = false,
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
}: CardProps) {
  return (
    <div
      className={`relative flex shrink-0 flex-col rounded-[var(--radius-card)] border px-3 py-2.5 text-left motion-reduce:!transition-none ${
        selected
          ? 'border-white/20 bg-surface-raised ring-1 ring-white/10'
          : 'border-border bg-surface hover:bg-surface-raised'
      } ${offscreen ? 'pointer-events-none' : ''}`}
      style={{ width, transition: widthTransition }}
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
