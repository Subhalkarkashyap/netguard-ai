import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api to the FastAPI backend in dev so the browser talks to localhost:5173
// (avoids CORS issues); set VITE_API_BASE to call the backend directly instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
