import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    historyApiFallback: true,  // Fix: SPA routes work on browser refresh
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 4173,
    historyApiFallback: true,  // Fix: applies to vite preview too
  },
  build: {
    outDir: 'dist',
    sourcemap: false,          // Disable sourcemaps in prod — reduces bundle size
    chunkSizeWarningLimit: 1000,
  }
})
