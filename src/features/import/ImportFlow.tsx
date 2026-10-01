import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { AI_IMPORT_PROMPT } from '../../lib/ai-import-prompt'
import { importProjectBundle, parseProjectBundleJson } from '../../lib/db'
import type { ProjectBundleV1 } from '../../lib/bundle-schema'
import { useProjectStore } from '../../stores/projectStore'
import { BundlePreview } from './BundlePreview'

export function ImportFlow() {
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState<ProjectBundleV1 | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()
  const refreshProjects = useProjectStore((s) => s.refresh)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_IMPORT_PROMPT)
      showToast('Prompt copied')
    } catch {
      showToast('Could not copy — select and copy manually')
    }
  }

  const parsePreview = () => {
    setParseError(null)
    setPreview(null)
    try {
      const bundle = parseProjectBundleJson(raw)
      setPreview(bundle)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid bundle')
    }
  }

  const createProject = async () => {
    if (!preview) return
    setImporting(true)
    try {
      const { projectId } = await importProjectBundle(preview)
      await refreshProjects()
      showToast('Project created')
      navigate(`/?p=${projectId}`, { replace: true })
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-2 text-sm font-semibold">1 · Prepare</h2>
        <p className="mb-3 text-sm text-muted">
          Copy the prompt, paste it into ChatGPT, Claude, or any chat model, then describe
          your home project. Ask for JSON only.
        </p>
        <Button type="button" onClick={() => void copyPrompt()}>
          Copy prompt
        </Button>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">2 · Import</h2>
        <p className="mb-3 text-sm text-muted">
          Paste the JSON response below (markdown fences are OK).
        </p>
        <textarea
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value)
            setPreview(null)
            setParseError(null)
          }}
          rows={10}
          placeholder='{"version":1,"project":{...},"tasks":[...]}'
          className="w-full rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-white/20"
        />
        {parseError ? (
          <p className="mt-2 text-sm text-accent-rose">{parseError}</p>
        ) : null}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="secondary" onClick={parsePreview}>
            Parse &amp; preview
          </Button>
          <Button
            type="button"
            className="bg-[#fafafa] text-bg hover:bg-white"
            disabled={!preview || importing}
            onClick={() => void createProject()}
          >
            {importing ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </section>

      {preview ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Preview</h2>
          <BundlePreview bundle={preview} />
        </section>
      ) : null}
    </div>
  )
}
