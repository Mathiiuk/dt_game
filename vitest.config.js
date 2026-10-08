import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Configuración de tests independiente de vite.config.ts (no carga PWA ni el plugin SWC):
// así los tests corren en cualquier entorno y de forma rápida.
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { alias: { 'virtual:pwa-register/react': fileURLToPath(new URL('./tests/stubs/pwa-register-react.js', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    css: false
  }
})
