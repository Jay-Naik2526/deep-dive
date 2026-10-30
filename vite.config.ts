import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handle } from './worker/ask.mjs'
import react from '@vitejs/plugin-react'

/** Dev only: serves the Ask-the-diver worker at /api/ask so the AI can be tried locally with GROQ_API_KEY from .env.local (never bundled). */
const devAsk = (key: string): Plugin => ({
  name: 'dev-ask',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/api/ask', async (req, res) => {
      const chunks: Buffer[] = []
      for await (const c of req) chunks.push(c as Buffer)
      const origin = req.headers.origin ?? `http://${req.headers.host}`
      const r = await handle(
        new Request('http://dev/api/ask', { method: req.method, headers: { origin, 'content-type': 'application/json' }, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined }),
        { GROQ_API_KEY: key, ALLOWED_ORIGINS: '' },
      )
      res.statusCode = r.status
      r.headers.forEach((v: string, k: string) => res.setHeader(k, v))
      res.end(await r.text())
    })
  },
})

export default defineConfig(({ mode }) => ({
  plugins: [react(), devAsk(loadEnv(mode, '.', '').GROQ_API_KEY ?? '')],
  build: {
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        // stable vendor chunks cache across deploys and keep the app chunk small
        advancedChunks: {
          groups: [
            { name: 'three', test: /node_modules[\\/](three|@react-three)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
}))
