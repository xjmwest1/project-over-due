type Props = {
  progress: number
  className?: string
  /** Tailwind background class for the fill */
  fillClassName?: string
}

export function ProgressBar({
  progress,
  className = '',
  fillClassName = 'bg-accent-mint',
}: Props) {
  const pct = Math.min(100, Math.max(0, progress * 100))
  return (
    <div
      className={`h-1 overflow-hidden rounded-sm bg-surface ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-sm transition-[width] duration-200 ${fillClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
