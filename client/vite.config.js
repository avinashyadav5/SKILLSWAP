import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Production-safe Vite config for Vercel
export default defineConfig({
  plugins: [react()],
  base: '', // 👈 important for correct routing on Vercel
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000 // (optional) suppress big bundle warning
  },
  server: {
    port: 5173,
    open: true,
  },
})
