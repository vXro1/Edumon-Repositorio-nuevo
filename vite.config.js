import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // /api, /uploads (archivos subidos) y /static (avatares) los sirve el backend
      '/api': {
        target: 'https://edumon.uniautonoma.edu.co',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://edumon.uniautonoma.edu.co',
        changeOrigin: true,
        secure: true,
      },
      '/static': {
        target: 'https://edumon.uniautonoma.edu.co',
        changeOrigin: true,
        secure: true,
      },
      // socket.io (notificaciones en tiempo real): en producción nginx lo
      // reenvía solo, pero en dev el server de Vite necesita esta entrada
      // (con ws:true) o el cliente intenta conectar contra sí mismo y las
      // notificaciones en vivo nunca llegan, aunque la API REST sí funcione.
      '/socket.io': {
        target: 'https://edumon.uniautonoma.edu.co',
        changeOrigin: true,
        secure: true,
        ws: true,
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