import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // In production the app talks to its own origin and `api/` forwards to the
  // private backend. `npm run dev` has no functions, so the dev server plays
  // the same role — the app code stays on relative URLs either way, instead of
  // carrying a different base per environment.
  const backend = env.VITE_DEV_BACKEND_ORIGIN || 'http://localhost:8080'

  // The browser drops in-flight requests on every reload and closes sockets when
  // a test ends; http-proxy surfaces both as connection errors. Only the ones
  // that mean something — a backend that is down, say — are worth printing.
  const quietAborts = (proxy) => {
    proxy.on('error', (err) => {
      const code = err && err.code
      if (code === 'ECONNRESET' || code === 'ECONNABORTED' || code === 'EPIPE') {
        return
      }
      console.warn('[dev-proxy]', err && err.message)
    })
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@ui': path.resolve(__dirname, 'src/ui'),
      },
    },
    server: {
      proxy: {
        // Mirrors api/[...path].ts: strip the prefix, forward the rest.
        '/api': {
          target: backend,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
          configure: quietAborts,
        },
        // Mirrors api/ws.ts. No rewrite: `/ws/socket.io` is the backend's real
        // socket.io path, prefix included.
        '/ws': {
          target: backend,
          changeOrigin: true,
          ws: true,
          configure: quietAborts,
        },
      },
    },
  }
})
