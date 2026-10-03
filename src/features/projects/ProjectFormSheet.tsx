import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { PROJECT_COLOR_STYLES } from '../../lib/colors'
import type { Link as ProjectLink, Project, ProjectColor } from '../../lib/types'
import { PROJECT_COLORS } from '../../lib/types'

export type ProjectFormValues = {
  name: string
  color: ProjectColor
  note: string
  links: ProjectLink[]
}

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Project | null
  onClose: () => void
  onSubmit: (values: ProjectFormValues) => Promise<void>
  onArchive?: () => Promise<void>
}

const emptyForm: ProjectFormValues = {
  name: '',
  color: 'mint',
  note: '',
  links: [],
}

function valuesFromProject(project: Project): ProjectFormValues {
  return {
    name: project.name,
    color: project.color,
    note: project.note ?? '',
    links: project.links ?? [],
  }
}

export function ProjectFormSheet({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  onArchive,
}: Props) {
  const [values, setValues] = useState<ProjectFormValues>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')

  useEffect(() => {
    if (!open) return
    setValues(mode === 'edit' && initial ? valuesFromProject(initial) : emptyForm)
    setError(null)
    setConfirmArchive(false)
    setLinkUrl('')
    setLinkLabel('')
  }, [open, mode, initial?.id])

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        note: values.note.trim(),
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save project')
    } finally {
      setSaving(false)
    }
  }

  const addLink = () => {
    const url = linkUrl.trim()
    if (!url) return
    setValues((v) => ({
      ...v,
      links: [...v.links, { url, label: linkLabel.trim() || undefined }],
    }))
    setLinkUrl('')
    setLinkLabel('')
  }

  const removeLink = (index: number) => {
    setValues((v) => ({
      ...v,
      links: v.links.filter((_, i) => i !== index),
    }))
  }

  const title = mode === 'create' ? 'New project' : 'Edit project'

  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Name</span>
          <input
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="min-h-11 rounded-[var(--radius-card)] border border-border bg-surface px-3 text-base outline-none focus:border-white/20"
            placeholder="Kitchen reno"
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Accent</span>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((color) => {
              const styles = PROJECT_COLOR_STYLES[color]
              const selected = values.color === color
              return (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => setValues((v) => ({ ...v, color }))}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-white/40' : 'border-transparent'
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full ${styles.dot}`} />
                </button>
              )
            })}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Note</span>
          <textarea
            value={values.note}
            onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
            rows={3}
            className="rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2 text-base outline-none focus:border-white/20"
            placeholder="Optional summary"
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
              className="min-h-10 rounded-[var(--radius-card)] border border-border bg-surface px-3 text-base"
            />
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Label (optional)"
              className="min-h-10 rounded-[var(--radius-card)] border border-border bg-surface px-3 text-base"
            />
            <Button type="button" variant="secondary" className="w-full" onClick={addLink}>
              Add link
            </Button>
          </div>
        </div>

        {mode === 'create' ? (
          <p className="text-xs text-muted">
            Or{' '}
            <Link to="/import" className="text-accent-mint hover:underline" onClick={onClose}>
              import many tasks from AI
            </Link>
          </p>
        ) : null}

        {error ? <p className="text-sm text-accent-rose">{error}</p> : null}

        <Button
          type="button"
          className="w-full bg-[#fafafa] text-bg hover:bg-white"
          disabled={saving || !values.name.trim()}
          onClick={() => void submit()}
        >
          {saving ? 'Saving…' : mode === 'create' ? 'Create project' : 'Save changes'}
        </Button>

        {mode === 'edit' && onArchive ? (
          confirmArchive ? (
            <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-accent-rose/30 bg-accent-rose/5 p-3">
              <p className="text-sm">Archive this project? Tasks stay in local data.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmArchive(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 border-accent-rose/40 text-accent-rose"
                  onClick={() => void onArchive().then(onClose)}
                >
                  Archive
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-accent-rose"
              onClick={() => setConfirmArchive(true)}
            >
              Archive project
            </Button>
          )
        ) : null}
      </div>
    </BottomSheet>
  )
}
