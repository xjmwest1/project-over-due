type HomeView = 'board' | 'overview'

type Props = {
  value: HomeView
  onChange: (view: HomeView) => void
}

const options: { value: HomeView; label: string }[] = [
  { value: 'board', label: 'Board' },
  { value: 'overview', label: 'Overview' },
]

export function HomeViewToggle({ value, onChange }: Props) {
  return (
    <div
      className="mb-3 flex rounded-[var(--radius-card)] border border-border bg-surface p-0.5"
      role="tablist"
      aria-label="Home view"
    >
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={`min-h-10 flex-1 rounded-[calc(var(--radius-card)-2px)] text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/30 ${
              selected
                ? 'bg-surface-raised text-text shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export type { HomeView }
