import type { ProjectColor } from './types'

/** Accent presets for project chrome (card border, board header). */
export const PROJECT_COLOR_STYLES: Record<
  ProjectColor,
  { dot: string; border: string; text: string }
> = {
  mint: {
    dot: 'bg-accent-mint',
    border: 'border-l-accent-mint',
    text: 'text-accent-mint',
  },
  sky: {
    dot: 'bg-accent-sky',
    border: 'border-l-accent-sky',
    text: 'text-accent-sky',
  },
  violet: {
    dot: 'bg-accent-violet',
    border: 'border-l-accent-violet',
    text: 'text-accent-violet',
  },
  amber: {
    dot: 'bg-accent-amber',
    border: 'border-l-accent-amber',
    text: 'text-accent-amber',
  },
  rose: {
    dot: 'bg-accent-rose',
    border: 'border-l-accent-rose',
    text: 'text-accent-rose',
  },
  slate: {
    dot: 'bg-accent-slate',
    border: 'border-l-accent-slate',
    text: 'text-accent-slate',
  },
}

export function isProjectColor(value: string): value is ProjectColor {
  return value in PROJECT_COLOR_STYLES
}
