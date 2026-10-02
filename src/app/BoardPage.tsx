import { Navigate, useParams } from 'react-router-dom'

/** Legacy route — board lives on home with `?p=` filter. */
export function BoardPage() {
  const { id } = useParams()
  if (!id) return <Navigate to="/" replace />
  return <Navigate to={`/?p=${encodeURIComponent(id)}`} replace />
}
