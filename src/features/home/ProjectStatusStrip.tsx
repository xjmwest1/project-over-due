import { useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ProgressBar } from '../../components/ProgressBar'
import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import type { Project, ProjectMetrics } from '../../lib/types'

const CARD_WIDTH = 168
const CARD_GAP = 8 // gap-2
const ANIMATION_MS = 300
/** Shared easing so width + track slide stay locked together. */
const ANIMATION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

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
  // Scroll offset captured when entering filter; leave animates back to it.
  const enterScrollRef = useRef(0)
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
      enterScrollRef.current = scrollLeft
      // Commit selection immediately so a later clear can detect "leaving".
      // Do not rewind this in cleanup — that made unfilter a no-op after enter.
      prevSelectedRef.current = selectedProjectId
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

      return () => {
        cancelled = true
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }

    if (leaving) {
      const leaveOffset = lastTrackIndexRef.current * (CARD_WIDTH + CARD_GAP)
      const restoreScroll = enterScrollRef.current
      const leaveFromId = prev
      const expandedWidth = measureExpandedWidth()
      // Hold the expanded React pose; WAAPI drives shrink + slide in lockstep
      // so neighbors slide in with the width change (no post-shrink snap).
      setHeldExpandedId(leaveFromId)
      setClipped(true)
      setTransitionsOn(false)
      setShift(-leaveOffset)
      setSelectedWidth(expandedWidth)

      let raf2 = 0
      let shiftAnim: Animation | null = null
      let widthAnim: Animation | null = null
      let finalized = false

      const finalize = () => {
        if (cancelled || finalized) return
        finalized = true
        const card = track.querySelector(
          `[data-strip-card="${leaveFromId}"]`,
        ) as HTMLElement | null
        // Drop WAAPI and write the resting pose onto the DOM in one turn so
        // scrollLeft + transform swap without a paint of the pre-leave React
        // width/shift (which would look like a post-shrink sideways snap).
        shiftAnim?.cancel()
        widthAnim?.cancel()
        track.style.transition = 'none'
        track.style.transform = 'translateX(0px)'
        if (card) {
          card.style.transition = 'none'
          card.style.width = `${CARD_WIDTH}px`
        }
        if (viewportRef.current) {
          viewportRef.current.scrollLeft = restoreScroll
        }
        flushSync(() => {
          prevSelectedRef.current = null
          setHeldExpandedId(null)
          setTransitionsOn(false)
          setClipped(false)
          setShift(0)
          setSelectedWidth(CARD_WIDTH)
        })
        track.style.transform = ''
        track.style.transition = ''
        if (card) {
          card.style.width = ''
          card.style.transition = ''
        }
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current)
          exitTimerRef.current = null
        }
      }

      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (cancelled) return
          const card = track.querySelector(
            `[data-strip-card="${leaveFromId}"]`,
          ) as HTMLElement | null
          const timing: KeyframeAnimationOptions = {
            duration: ANIMATION_MS,
            easing: ANIMATION_EASING,
            fill: 'forwards',
          }
          shiftAnim = track.animate(
            [
              { transform: `translateX(${-leaveOffset}px)` },
              { transform: `translateX(${-restoreScroll}px)` },
            ],
            timing,
          )
          if (card) {
            widthAnim = card.animate(
              [
                { width: `${expandedWidth}px` },
                { width: `${CARD_WIDTH}px` },
              ],
              timing,
            )
          }
          void Promise.all([
            shiftAnim.finished.catch(() => {}),
            widthAnim?.finished.catch(() => {}) ?? Promise.resolve(),
          ]).then(finalize)
          exitTimerRef.current = setTimeout(finalize, ANIMATION_MS + 100)
        })
      })

      return () => {
        cancelled = true
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
        shiftAnim?.cancel()
        widthAnim?.cancel()
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current)
          exitTimerRef.current = null
        }
        // Restore so React Strict Mode's leave re-run still sees "leaving".
        prevSelectedRef.current = leaveFromId
      }
    }

    if (isFiltered && selectedTrackIndex >= 0) {
      // Still filtered after enter committed (e.g. Strict Mode re-run or resize).
      lastTrackIndexRef.current = selectedTrackIndex
      prevSelectedRef.current = selectedProjectId
      setHeldExpandedId(selectedProjectId)
      setClipped(true)
      setShift(-cardOffset)
      setSelectedWidth(measureExpandedWidth())
      return
    }

    prevSelectedRef.current = selectedProjectId
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
    ? `transform ${ANIMATION_MS}ms ${ANIMATION_EASING}`
    : 'none'
  const widthTransition = transitionsOn
    ? `width ${ANIMATION_MS}ms ${ANIMATION_EASING}`
    : 'none'

  return (
    <div className="border-b border-border pb-3">
      <div
        ref={viewportRef}
        className={`min-w-0 w-full px-4 pb-1 ${
          clipped
            ? 'overflow-hidden'
            : 'overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
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
                cardId={project.id}
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
                  isExpandedCard && isFiltered
                    ? () => onSelectProject(null)
                    : undefined
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
  cardId?: string
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
  cardId,
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
      data-strip-card={cardId}
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
