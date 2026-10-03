import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // Mostramos prompt cuando haya actualización
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'El Pizarrón: DT Game',
        short_name: 'El Pizarrón',
        description: 'Simulador de Director Técnico de Fútbol',
        theme_color: '#09090b', // bg-zinc-950
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait', // Forzar vista vertical
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Precargar recursos estáticos
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Omitimos source maps del cacheo
        sourcemap: false
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    }
  },
  server: {
    allowedHosts: true,
  },
})

