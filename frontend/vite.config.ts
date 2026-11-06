import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In local dev with `netlify dev`, functions are served on port 8888
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/(.*)/, '/.netlify/functions/$1'),
      },
    },
  },
})
