import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// Vite's static middleware skips dot-directories, so `/.well-known/*` (the agent discovery manifest) fell through to the
// SPA fallback and returned HTML in dev and preview. Serve those files explicitly; production builds copy them as usual.
function serveWellKnown(): Plugin {
  const handler = (req: { url?: string }, res: { setHeader(k: string, v: string): void; end(b: string): void }, next: () => void) => {
    const url = (req.url ?? '').split('?')[0]
    if (!url.startsWith('/.well-known/') || url.includes('..')) return next()
    const file = resolve(process.cwd(), 'public', url.slice(1))
    if (!existsSync(file)) return next()
    res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'text/plain; charset=utf-8')
    res.end(readFileSync(file, 'utf8'))
  }
  return {
    name: 'serve-well-known',
    configureServer: (server) => void server.middlewares.use(handler),
    configurePreviewServer: (server) => void server.middlewares.use(handler),
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), serveWellKnown()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@ui', replacement: fileURLToPath(new URL('../packages/ui/src', import.meta.url)) },
    ],
  },
  define: process.env.DEBUG_HYDRATION ? { __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' } : {},
  ssr: { noExternal: [/^@perfect-design\//] },
  // ngrok (and any other tunnel) proxies the request under a public hostname, which Vite's
  // DNS-rebinding guard rejects. The leading dot allows every ngrok subdomain, since a free
  // tunnel gets a new random name each run.
  server: {
    fs: { allow: ['..'] },
    allowedHosts: ['.ngrok-free.app'],
    // Native file events were not reaching the dev server (edits to docs/src and packages/ui stayed stale until a restart), so
    // poll. Scoped to the source folders and slowed down to keep CPU use low; set PD_NO_POLLING=1 to use native events again.
    watch: process.env.PD_NO_POLLING ? undefined : { usePolling: true, interval: 500, binaryInterval: 3000, ignored: ['**/dist/**', '**/dist-ssr/**', '**/reports/**', '**/node_modules/**', '**/.git/**'] },
  },
  build: { sourcemap: true, chunkSizeWarningLimit: 1000 },
  test: { environment: 'jsdom', globals: true, include: ['src/**/*.test.ts'], setupFiles: ['./vitest.setup.ts'] },
})
