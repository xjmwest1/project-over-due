import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TASK_STATUSES } from '../../lib/status-labels'
import type { Task, TaskStatus } from '../../lib/types'
import {
  moveBetweenLanes,
  persistLaneOrder,
  resolveOverId,
} from './applyBoardDrag'
import { LaneSection } from './LaneSection'
import { laneDroppableId, laneTaskIdsByStatus } from './lane-board'
import { TaskLaneCard } from './TaskLaneCard'

type Props = {
  tasks: Task[]
  onTaskSelect: (task: Task) => void
  onTasksMoved: () => Promise<void>
}

function LaneDropZone({
  status,
  taskIds,
  tasksById,
  onTaskSelect,
}: {
  status: TaskStatus
  taskIds: string[]
  tasksById: Map<string, Task>
  onTaskSelect: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: laneDroppableId(status),
  })

  if (taskIds.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className={`mx-4 min-h-[52px] rounded-[10px] border border-dashed px-4 py-3 text-xs text-muted/80 ${
          isOver ? 'border-accent-mint/50 bg-surface' : 'border-border/60'
        }`}
      >
        Drop tasks here
      </div>
    )
  }

  return (
    <SortableContext items={taskIds} strategy={horizontalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`flex min-h-[52px] gap-2.5 overflow-x-auto px-4 pb-1 snap-x snap-mandatory touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isOver ? 'rounded-[10px] ring-1 ring-accent-mint/30' : ''
        }`}
      >
        {taskIds.map((id) => {
          const task = tasksById.get(id)
          if (!task) return null
          return (
            <SortableTaskCard
              key={id}
              task={task}
              onSelect={() => onTaskSelect(task)}
            />
          )
        })}
      </div>
    </SortableContext>
  )
}

function SortableTaskCard({
  task,
  onSelect,
}: {
  task: Task
  onSelect: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { status: task.status },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 1 : undefined,
  }

  return (
    <TaskLaneCard
      ref={setNodeRef}
      task={task}
      onSelect={onSelect}
      style={style}
      className={isDragging ? 'shadow-md ring-1 ring-white/10' : ''}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  )
}

export function DraggableLaneBoard({
  tasks,
  onTaskSelect,
  onTasksMoved,
}: Props) {
  const tasksById = useMemo(
    () => new Map(tasks.map((t) => [t.id, t])),
    [tasks],
  )

  const [lanes, setLanes] = useState(() =>
    laneTaskIdsByStatus(tasks, 'sortOrder'),
  )
  const lanesRef = useRef(lanes)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [persisting, setPersisting] = useState(false)

  useEffect(() => {
    const next = laneTaskIdsByStatus(tasks, 'sortOrder')
    setLanes(next)
    lanesRef.current = next
  }, [tasks])

  useEffect(() => {
    lanesRef.current = lanes
  }, [lanes])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  )

  const activeTask = activeId ? tasksById.get(activeId) : null

  const applyOver = useCallback((active: string, over: string | null) => {
    if (!over || active === over) return
    setLanes((prev) => moveBetweenLanes(prev, active, over) ?? prev)
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    const overId = resolveOverId(event.over)
    applyOver(String(event.active.id), overId)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const active = String(event.active.id)
    const overId = resolveOverId(event.over)
    setActiveId(null)

    if (!overId) return

    const nextLanes =
      moveBetweenLanes(lanesRef.current, active, overId) ?? lanesRef.current
    setLanes(nextLanes)
    lanesRef.current = nextLanes

    const changed = TASK_STATUSES.some((status) => {
      const ids = nextLanes[status]
      return ids.some((id, index) => {
        const task = tasksById.get(id)
        return task && (task.status !== status || task.sortOrder !== index)
      })
    })

    if (!changed) return

    setPersisting(true)
    try {
      await persistLaneOrder(tasks, nextLanes)
      await onTasksMoved()
    } finally {
      setPersisting(false)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setLanes(laneTaskIdsByStatus(tasks, 'sortOrder'))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={(e) => void handleDragEnd(e)}
      onDragCancel={handleDragCancel}
    >
      <div
        className={`flex flex-1 flex-col gap-5 overflow-y-auto px-0 pb-24 pt-3 touch-pan-y ${
          persisting ? 'pointer-events-none opacity-90' : ''
        }`}
      >
        {TASK_STATUSES.map((status) => {
          const taskIds = lanes[status]
          return (
            <LaneSection key={status} status={status} count={taskIds.length}>
              <LaneDropZone
                status={status}
                taskIds={taskIds}
                tasksById={tasksById}
                onTaskSelect={onTaskSelect}
              />
            </LaneSection>
          )
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
        {activeTask ? (
          <TaskLaneCard
            task={activeTask}
            className="scale-[1.02] shadow-lg ring-1 ring-white/15"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
