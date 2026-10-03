import { Outlet } from 'react-router-dom'
import { ToastProvider } from '../components/ui/Toast'

export function RootLayout() {
  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-1 flex-col overflow-x-hidden bg-bg">
        <Outlet />
      </div>
    </ToastProvider>
  )
}
