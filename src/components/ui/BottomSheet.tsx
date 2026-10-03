import { useEffect, useRef, useState, type ReactNode } from 'react'

const EXIT_DURATION_MS = 300

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Slide/fade enter and exit (panel + backdrop). Defaults on. */
  animated?: boolean
  /** Fired after exit animation finishes when `animated` is true. */
  onClosed?: () => void
  /** Fired after enter animation finishes when `animated` is true (or immediately when not). */
  onOpened?: () => void
}

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  footer,
  animated = true,
  onClosed,
  onOpened,
}: Props) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const onClosedRef = useRef(onClosed)
  const onOpenedRef = useRef(onOpened)
  const visibleRef = useRef(false)
  const finishedCloseRef = useRef(false)
  const openedFiredRef = useRef(false)

  useEffect(() => {
    onClosedRef.current = onClosed
    onOpenedRef.current = onOpened
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!animated) {
      if (open) {
        openedFiredRef.current = true
        onOpenedRef.current?.()
      } else {
        openedFiredRef.current = false
        onClosedRef.current?.()
      }
      return
    }

    if (open) {
      finishedCloseRef.current = false
      openedFiredRef.current = false
      setMounted(true)
      let innerFrame = 0
      let openedFallback = 0
      const outerFrame = requestAnimationFrame(() => {
        innerFrame = requestAnimationFrame(() => {
          visibleRef.current = true
          setVisible(true)
          const reduceMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
          // Fallback if transitionend does not fire (reduced motion / no transform change).
          openedFallback = window.setTimeout(
            () => {
              if (openedFiredRef.current) return
              openedFiredRef.current = true
              onOpenedRef.current?.()
            },
            reduceMotion ? 0 : EXIT_DURATION_MS,
          )
        })
      })
      return () => {
        cancelAnimationFrame(outerFrame)
        cancelAnimationFrame(innerFrame)
        window.clearTimeout(openedFallback)
      }
    }

    const shouldAnimateExit = visibleRef.current
    visibleRef.current = false
    setVisible(false)
    openedFiredRef.current = false

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const delay =
      reduceMotion || !shouldAnimateExit ? 0 : EXIT_DURATION_MS

    const finishClose = () => {
      if (finishedCloseRef.current) return
      finishedCloseRef.current = true
      setMounted(false)
      onClosedRef.current?.()
    }

    const timeout = window.setTimeout(finishClose, delay)
    return () => window.clearTimeout(timeout)
  }, [open, animated])

  const handlePanelTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    // Tailwind v4 animates the individual `translate` property (not `transform`).
    if (!animated || (e.propertyName !== 'translate' && e.propertyName !== 'transform')) {
      return
    }
    if (open) {
      if (openedFiredRef.current) return
      openedFiredRef.current = true
      onOpenedRef.current?.()
      return
    }
    if (finishedCloseRef.current) return
    finishedCloseRef.current = true
    setMounted(false)
    onClosedRef.current?.()
  }

  if (!animated) {
    if (!open) return null

    return (
      <div className="fixed inset-0 z-40 flex flex-col justify-end">
        <button
          type="button"
          className="absolute inset-0 bg-black/60"
          aria-label="Close"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal
          aria-labelledby="sheet-title"
          className="relative max-h-[min(90dvh,640px)] w-full max-w-lg self-center overflow-hidden rounded-t-[var(--radius-sheet)] border border-border bg-bg pb-[env(safe-area-inset-bottom)] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 id="sheet-title" className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 min-w-10 rounded-[var(--radius-card)] text-sm text-muted hover:text-text"
            >
              Done
            </button>
          </div>
          <div className="max-h-[min(70dvh,520px)] overflow-y-auto px-4 py-4">
            {children}
          </div>
          {footer ? (
            <div className="border-t border-border px-4 py-3">{footer}</div>
          ) : null}
        </div>
      </div>
    )
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="sheet-title"
        onTransitionEnd={handlePanelTransitionEnd}
        className={`relative max-h-[min(90dvh,640px)] w-full max-w-lg self-center overflow-hidden rounded-t-[var(--radius-sheet)] border border-border bg-bg pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          /* translate:none when open — translate-y-0 still creates a containing
             block that can trigger iOS Safari focus zoom. */
          visible ? '[translate:none]' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="sheet-title" className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 min-w-10 rounded-[var(--radius-card)] text-sm text-muted hover:text-text"
          >
            Done
          </button>
        </div>
        <div className="max-h-[min(70dvh,520px)] overflow-y-auto px-4 py-4">
          {children}
        </div>
        {footer ? (
          <div className="border-t border-border px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}
