import type { AppMeta, Project, Task } from './types'

export const BACKUP_VERSION = 1

export type AppBackupV1 = {
  version: typeof BACKUP_VERSION
  exportedAt: string
  meta: AppMeta
  projects: Project[]
  tasks: Task[]
}

export function backupFilename(exportedAt: string): string {
  const day = exportedAt.slice(0, 10)
  return `home-projects-backup-${day}.json`
}

export function downloadBackupJson(backup: AppBackupV1): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = backupFilename(backup.exportedAt)
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
