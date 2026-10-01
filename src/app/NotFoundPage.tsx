import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-start justify-center px-4 py-12">
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-muted">This route does not exist.</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-muted hover:text-text"
      >
        Back to projects
      </Link>
    </div>
  )
}
