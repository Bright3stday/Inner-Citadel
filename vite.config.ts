import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Base path matches the GitHub Pages project URL: bright3stday.github.io/Inner-Citadel/
const BASE = '/Inner-Citadel/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Inner Citadel',
        short_name: 'Inner Citadel',
        description:
          'A capability-building practice tool. Log quests, watch your citadel take shape.',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: '#f4f4f2',
        theme_color: '#1a1a1a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
