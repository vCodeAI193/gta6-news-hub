/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'GTA 6 News Hub',
        short_name: 'GTA6 Hub',
        description: 'Offizielle News, Trailer, Leaks und Release-Infos zu GTA 6.',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        lang: 'de',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Offline-Lesemodus: App-Shell + zuletzt geladene Bilder cachen.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'picsum.photos',
            handler: 'CacheFirst',
            options: {
              cacheName: 'article-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
    // Bundle-Analyse nur bei `ANALYZE=true npm run build`.
    process.env.ANALYZE === 'true' &&
      visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    // E2E-Tests laufen über Playwright, nicht Vitest.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/services/**'],
      thresholds: {
        statements: 50,
        branches: 60,
        functions: 50,
        lines: 50,
      },
    },
  },
})
