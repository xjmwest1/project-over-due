import { useMemo, useState } from 'react'
import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import { computeProjectMetrics } from '../../lib/metrics'
import { TASK_STATUS_LABEL, TASK_STATUSES } from '../../lib/status-labels'
import type { ProjectBundleV1 } from '../../lib/bundle-schema'
import type { TaskStatus } from '../../lib/types'

type Props = {
  bundle: ProjectBundleV1
}

export function BundlePreview({ bundle }: Props) {
  const [expanded, setExpanded] = useState(false)
  const color = bundle.project.color ?? 'mint'
  const styles = PROJECT_COLOR_STYLES[color]

  const pseudoTasks = useMemo(
    () =>
      bundle.tasks.map((t, i) => ({
        id: String(i),
        projectId: '',
        title: t.title,
        status: (t.status ?? 'backlog') as TaskStatus,
        links: t.links ?? [],
        sortOrder: i,
        createdAt: '',
        updatedAt: '',
      })),
    [bundle.tasks],
  )

  const metrics = computeProjectMetrics(pseudoTasks)
  const previewTitles = expanded ? bundle.tasks : bundle.tasks.slice(0, 5)

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${styles.dot}`} />
        <h3 className="text-base font-semibold tracking-tight">{bundle.project.name}</h3>
      </div>
      {bundle.project.note ? (
        <p className="mb-3 text-sm text-muted">{bundle.project.note}</p>
      ) : null}
      <p className="mb-3 text-sm text-muted">
        <span className="font-medium text-text">{bundle.tasks.length}</span> tasks
      </p>
      <ul className="mb-4 flex flex-wrap gap-2 text-[11px] text-muted">
        {TASK_STATUSES.map((status) => (
          <li
            key={status}
            className="rounded-full bg-surface-raised px-2 py-1"
          >
            {TASK_STATUS_LABEL[status]} {metrics.byStatus[status]}
          </li>
        ))}
      </ul>
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Tasks</p>
        <ul className="flex flex-col gap-1 text-sm">
          {previewTitles.map((t, i) => (
            <li key={i} className="truncate text-text">
              {t.title}
            </li>
          ))}
        </ul>
        {bundle.tasks.length > 5 ? (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-accent-mint"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'Show less' : `Show all ${bundle.tasks.length} tasks`}
          </button>
        ) : null}
      </div>
    </div>
  )
}
