import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import type { Project, Task } from '../../lib/types'

type TaskLaneCardProps = {
  task: Task
  project?: Project
  onSelect?: () => void
  className?: string
  style?: CSSProperties
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
  children?: ReactNode
}

export const TaskLaneCard = forwardRef<HTMLButtonElement | HTMLElement, TaskLaneCardProps>(
  function TaskLaneCard(
    {
      task,
      project,
      onSelect,
      className = '',
      style,
      dragHandleProps,
      children,
    },
    ref,
  ) {
    const muted = task.status === 'done'
    const accent = project ? PROJECT_COLOR_STYLES[project.color].border : ''
    const baseClass = `w-[168px] shrink-0 snap-start rounded-[10px] border border-border bg-surface px-3 py-3 text-left text-sm font-medium leading-snug tracking-tight touch-manipulation ${
      muted ? 'opacity-55 font-normal' : ''
    } ${project ? `border-l-2 ${accent}` : ''} ${className}`

    const inner = children ?? (
      <>
        {project ? (
          <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
            {project.name}
          </p>
        ) : null}
        <p className="line-clamp-3">{task.title}</p>
      </>
    )

    if (onSelect) {
      return (
        <button
          type="button"
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={onSelect}
          className={`${baseClass} hover:bg-surface-raised`}
          style={style}
          {...dragHandleProps}
        >
          {inner}
        </button>
      )
    }

    return (
      <article
        ref={ref as React.Ref<HTMLElement>}
        className={baseClass}
        style={style}
        {...dragHandleProps}
      >
        {inner}
      </article>
    )
  },
)
