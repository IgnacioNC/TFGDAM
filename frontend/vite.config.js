import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  const isElectronBuild = process.env.ELECTRON_BUILD === 'true'

  return {
    plugins: [react(), tailwindcss()],

    base: isElectronBuild ? './' : '/',

    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },

    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
