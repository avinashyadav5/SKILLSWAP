import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Production-safe config for Vercel
export default defineConfig({
  plugins: [react()],
  base: '/', // important for routing
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    open: true,
  },
})
