import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo.png'],
      manifest: {
        name: 'Ol Kalou DCP Get Out The Voting Network',
        short_name: 'DCP Ol Kalou',
        description: 'Democracy for Citizens Party – Ol Kalou Constituency mobilization platform.',
        theme_color: '#00843D',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // Cache all JS/CSS/HTML/images for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        // Runtime caching: cache API calls with network-first strategy
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api') || url.pathname.startsWith('/auth'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dcp-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 24hrs
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Enable service worker in dev mode for testing
      }
    })
  ],
})
