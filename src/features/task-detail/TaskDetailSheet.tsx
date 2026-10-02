import { useEffect, useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import { TASK_STATUS_LABEL, TASK_STATUSES } from '../../lib/status-labels'
import type { Link, Project, Task, TaskStatus } from '../../lib/types'

export type TaskFormValues = {
  title: string
  status: TaskStatus
  note: string
  links: Link[]
}

type Props = {
  open: boolean
  task: Task | null
  project?: Project | null
  onClose: () => void
  onSave: (taskId: string, values: TaskFormValues) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

function valuesFromTask(task: Task): TaskFormValues {
  return {
    title: task.title,
    status: task.status,
    note: task.note ?? '',
    links: task.links ?? [],
  }
}

export function TaskDetailSheet({
  open,
  task,
  project,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [values, setValues] = useState<TaskFormValues | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')

  useEffect(() => {
    if (!open || !task) return
    setValues(valuesFromTask(task))
    setError(null)
    setConfirmDelete(false)
    setLinkUrl('')
    setLinkLabel('')
  }, [open, task?.id])

  if (!task || !values) {
    return null
  }

  const save = async () => {
    setError(null)
    setSaving(true)
    try {
      await onSave(task.id, {
        ...values,
        title: values.title.trim(),
        note: values.note.trim(),
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save task')
    } finally {
      setSaving(false)
    }
  }

  const addLink = () => {
    const url = linkUrl.trim()
    if (!url) return
    setValues((v) =>
      v
        ? {
            ...v,
            links: [...v.links, { url, label: linkLabel.trim() || undefined }],
          }
        : v,
    )
    setLinkUrl('')
    setLinkLabel('')
  }

  const removeLink = (index: number) => {
    setValues((v) =>
      v ? { ...v, links: v.links.filter((_, i) => i !== index) } : v,
    )
  }

  const accent = project ? PROJECT_COLOR_STYLES[project.color].dot : ''

  return (
    <BottomSheet open={open} title="Task" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {project ? (
          <p className="flex items-center gap-2 text-xs text-muted">
            <span className={`h-2 w-2 rounded-full ${accent}`} aria-hidden />
            {project.name}
          </p>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Title</span>
          <input
            value={values.title}
            onChange={(e) =>
              setValues((v) => (v ? { ...v, title: e.target.value } : v))
            }
            className="min-h-11 rounded-[var(--radius-card)] border border-border bg-surface px-3 text-sm outline-none focus:border-white/20"
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {TASK_STATUSES.map((status) => {
              const active = values.status === status
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setValues((v) => (v ? { ...v, status } : v))
                  }
                  className={`min-h-9 rounded-full px-3 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-white/15 text-text'
                      : 'bg-surface text-muted hover:bg-surface-raised hover:text-text'
                  }`}
                >
                  {TASK_STATUS_LABEL[status]}
                </button>
              )
            })}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Note</span>
          <textarea
            value={values.note}
            onChange={(e) =>
              setValues((v) => (v ? { ...v, note: e.target.value } : v))
            }
            rows={4}
            maxLength={2000}
            className="rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-white/20"
            placeholder="Optional details"
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Links (https)</span>
          <ul className="mb-2 flex flex-col gap-1">
            {values.links.map((link, i) => (
              <li
                key={`${link.url}-${i}`}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-card)] border border-border px-3 py-2 text-xs"
              >
                <span className="truncate">{link.label ?? link.url}</span>
                <button
                  type="button"
                  className="shrink-0 text-muted hover:text-text"
                  onClick={() => removeLink(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
              className="min-h-10 rounded-[var(--radius-card)] border border-border bg-surface px-3 text-sm"
            />
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Label (optional)"
              className="min-h-10 rounded-[var(--radius-card)] border border-border bg-surface px-3 text-sm"
            />
            <Button type="button" variant="secondary" className="w-full" onClick={addLink}>
              Add link
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-accent-rose">{error}</p> : null}

        <Button
          type="button"
          className="w-full bg-[#fafafa] text-bg hover:bg-white"
          disabled={saving || !values.title.trim()}
          onClick={() => void save()}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>

        {confirmDelete ? (
          <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-accent-rose/30 bg-accent-rose/5 p-3">
            <p className="text-sm">Delete this task? This cannot be undone.</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 border-accent-rose/40 text-accent-rose"
                onClick={() => void onDelete(task.id).then(onClose)}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="w-full text-accent-rose"
            onClick={() => setConfirmDelete(true)}
          >
            Delete task
          </Button>
        )}
      </div>
    </BottomSheet>
  )
}
