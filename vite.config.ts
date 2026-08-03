import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path matches the GitHub Pages project URL: bright3stday.github.io/Inner-Citadel/
export default defineConfig({
  base: '/Inner-Citadel/',
  plugins: [react()],
})
