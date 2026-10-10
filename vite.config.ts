import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  // Además de VITE_*, se expone SOLO la clave pública de reCAPTCHA con el nombre sin prefijo (Vercel avisa por el prefijo
  // "público"; la clave del sitio es pública por diseño). El prefijo es el nombre exacto: no expone RECAPTCHA_SECRET ni otras.
  envPrefix: ['VITE_', 'RECAPTCHA_SITE_KEY'],
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // Mostramos prompt cuando haya actualización
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'Vestuario',
        short_name: 'Vestuario',
        description: 'Juego de Director Técnico de fútbol. Vos sos el DT.',
        lang: 'es-AR',
        // La app instalada abre directo en el juego; la portada pública queda para la web
        start_url: '/dashboard',
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
        // Archivos para buscadores: siempre desde la red, nunca la app en su lugar
        navigateFallbackDenylist: [/^\/robots\.txt$/, /^\/sitemap\.xml$/],
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
  build: {
    rollupOptions: {
      output: {
        // Las librerías grandes en trozos propios: se cachean aparte y no se vuelven a bajar cuando cambia el código del juego
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('/motion') || id.includes('framer-motion')) return 'motion'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('@radix-ui') || id.includes('vaul')) return 'radix'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router') || id.includes('scheduler') || id.includes('@tanstack')) return 'react'
          return undefined
        }
      }
    }
  },
  server: {
    allowedHosts: true,
  },
})

