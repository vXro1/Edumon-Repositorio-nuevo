// RUTA EDUMON WEB/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://backend-edumon.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor.react';
            return 'vendor';
          }
          // cursos + foros comparten contexto (CursoContext, ForosTab) — un solo chunk evita el ciclo
          if (id.includes('src/features/cursos') || id.includes('src/features/foros')) return 'feature.cursos';
          if (id.includes('src/features/tareas')) return 'feature.tareas';
        }
      }
    }
  }
})