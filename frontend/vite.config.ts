import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    // In development the browser talks to Vite only; Vite forwards /api to FastAPI.
    // scripts/e2e.sh sets VITE_API_PROXY to the API of the browser tests.
    proxy: { '/api': process.env.VITE_API_PROXY ?? 'http://localhost:8000' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // The browser tests in e2e/ run with Playwright (npm run e2e), not with Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
