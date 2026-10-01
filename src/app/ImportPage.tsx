import { Link } from 'react-router-dom'

export function ImportPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <Link to="/" className="mb-4 text-sm text-muted hover:text-text">
        ← Projects
      </Link>
      <h1 className="text-lg font-semibold">Import from AI</h1>
      <p className="mt-2 text-sm text-muted">
        Placeholder route — copy prompt, paste JSON, and preview ship in Phase
        1.
      </p>
    </div>
  )
}
