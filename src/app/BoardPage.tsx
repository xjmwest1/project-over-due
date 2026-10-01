import { Link, useParams } from 'react-router-dom'

export function BoardPage() {
  const { id } = useParams()

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <Link to="/" className="mb-4 text-sm text-muted hover:text-text">
        ← Projects
      </Link>
      <h1 className="text-lg font-semibold">Board</h1>
      <p className="mt-2 text-sm text-muted">
        Placeholder for project <code className="text-text">{id}</code>. Swim
        lanes arrive in Phase 2.
      </p>
    </div>
  )
}
