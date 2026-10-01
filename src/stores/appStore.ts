import { create } from 'zustand'
import { initPersistence } from '../lib/db'

type AppState = {
  ready: boolean
  error: string | null
  init: (options?: { seedDemo?: boolean }) => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  error: null,
  init: async (options) => {
    try {
      await initPersistence(options)
      set({ ready: true, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open database'
      set({ ready: false, error: message })
    }
  },
}))
