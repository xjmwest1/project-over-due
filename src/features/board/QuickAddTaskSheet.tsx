import { useEffect, useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'

type Props = {
  open: boolean
  projectName: string
  onClose: () => void
  onCreate: (title: string) => Promise<void>
}

export function QuickAddTaskSheet({
  open,
  projectName,
  onClose,
  onCreate,
}: Props) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setError(null)
    setSaving(false)
  }, [open])

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setError(null)
    setSaving(true)
    try {
      await onCreate(trimmed)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} title="Add task" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted">
          Adds to <span className="font-medium text-text">{projectName}</span> ·
          Backlog
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="min-h-11 rounded-[var(--radius-card)] border border-border bg-surface px-3 text-base outline-none focus:border-white/20"
            placeholder="What needs doing?"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
          />
        </label>
        {error ? <p className="text-sm text-accent-rose">{error}</p> : null}
        <Button
          type="button"
          className="w-full bg-[#fafafa] text-bg hover:bg-white"
          disabled={saving || !title.trim()}
          onClick={() => void submit()}
        >
          {saving ? 'Adding…' : 'Add to Backlog'}
        </Button>
      </div>
    </BottomSheet>
  )
}
