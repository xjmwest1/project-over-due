import { createBrowserRouter } from 'react-router-dom'
import { BoardPage } from './BoardPage'
import { ImportPage } from './ImportPage'
import { NotFoundPage } from './NotFoundPage'
import { ProjectsPage } from './ProjectsPage'
import { RootLayout } from './RootLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <ProjectsPage /> },
      { path: 'projects/:id', element: <BoardPage /> },
      { path: 'import', element: <ImportPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
