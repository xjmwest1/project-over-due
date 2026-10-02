import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { downloadBackupJson } from '../lib/backup-export'
import { exportAllData } from '../lib/db'

export function SettingsPage() {
  const { showToast } = useToast()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const backup = await exportAllData()
      downloadBackupJson(backup)
      showToast('Backup downloaded')
    } catch {
      showToast('Export failed — try again')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link
        to="/"
        className="mb-4 inline-flex min-h-11 items-center text-sm text-muted hover:text-text"
      >
        ← Projects
      </Link>
      <h1 className="text-lg font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Backup your data for device migration. Restore is not available in this
        MVP build.
      </p>

      <section className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Data</h2>
        <p className="mt-1 text-sm text-muted">
          Downloads all projects and tasks as JSON (not the AI bundle format).
        </p>
        <Button
          type="button"
          className="mt-4 w-full bg-[#fafafa] text-bg hover:bg-white"
          disabled={exporting}
          onClick={() => void handleExport()}
        >
          {exporting ? 'Preparing…' : 'Export all data'}
        </Button>
      </section>
    </div>
  )
}
