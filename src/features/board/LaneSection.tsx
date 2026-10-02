import { TASK_STATUS_LABEL } from '../../lib/status-labels'
import type { TaskStatus } from '../../lib/types'
import { LANE_NAME_CLASS } from './lane-board'

type Props = {
  status: TaskStatus
  count: number
  children: React.ReactNode
}

export function LaneSection({ status, count, children }: Props) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-4">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider ${LANE_NAME_CLASS[status]}`}
        >
          {TASK_STATUS_LABEL[status]}
        </span>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">
          {count}
        </span>
      </div>
      {children}
    </section>
  )
}
