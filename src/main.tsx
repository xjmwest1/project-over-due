import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppBootstrap } from './app/AppBootstrap'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
)
