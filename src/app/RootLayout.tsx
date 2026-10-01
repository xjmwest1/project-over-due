import { Outlet } from 'react-router-dom'

export function RootLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-1 flex-col bg-bg">
      <Outlet />
    </div>
  )
}
