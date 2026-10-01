import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAppStore } from '../stores/appStore'
import { useProjectStore } from '../stores/projectStore'

export function AppBootstrap() {
  const ready = useAppStore((s) => s.ready)
  const error = useAppStore((s) => s.error)
  const init = useAppStore((s) => s.init)
  const refresh = useProjectStore((s) => s.refresh)

  useEffect(() => {
    void init({ seedDemo: true }).then(() => refresh())
  }, [init, refresh])

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-center">
        <div>
          <p className="font-medium text-text">Could not open local data</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted">
        Loading…
      </div>
    )
  }

  return <RouterProvider router={router} />
}
