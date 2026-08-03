import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { seedAppState } from './model/factories'
import * as storage from './storage/storage'
import './ui/styles.css'

// Throwaway seed data so first run isn't a blank screen — not
// onboarding. See model/factories.ts.
if (!storage.hasStoredState()) {
  storage.save(seedAppState())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
