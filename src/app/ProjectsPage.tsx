import { Link } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'

export function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects)

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <header className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <div className="flex gap-2">
          <Link
            to="/import"
            className="inline-flex min-h-10 items-center rounded-[var(--radius-card)] border border-border px-3 text-xs font-medium text-muted hover:text-text"
          >
            Import
          </Link>
        </div>
      </header>

      <p className="mb-4 text-sm text-muted">
        Phase 0 scaffold — project home UI ships in Phase 1.{' '}
        <span className="text-text">{projects.length}</span> project
        {projects.length === 1 ? '' : 's'} in IndexedDB
        {projects.length > 0 ? ' (includes optional demo seed).' : '.'}
      </p>

      <ul className="flex flex-col gap-2">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              to={`/projects/${p.id}`}
              className="block rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 text-sm hover:bg-surface-raised"
            >
              {p.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
