import { Link } from 'react-router-dom'
import { ImportFlow } from '../features/import/ImportFlow'

export function ImportPage() {
  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Link to="/" className="mb-4 text-sm text-muted hover:text-text">
        ← Projects
      </Link>
      <h1 className="text-lg font-semibold">Import from AI</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Bootstrap a project with many tasks in one step.
      </p>
      <ImportFlow />
    </div>
  )
}
