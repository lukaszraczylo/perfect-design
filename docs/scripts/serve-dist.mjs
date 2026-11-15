// Minimal static server that behaves like a real static host (Cloudflare Pages, GitHub Pages):
// /a/b -> /a/b/index.html, unknown paths -> 404.html with status 404.
//   node scripts/serve-dist.mjs [port] [dir]
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const port = Number(process.argv[2] ?? 4311)
const root = normalize(join(process.cwd(), process.argv[3] ?? 'dist'))
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.map': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.xml': 'application/xml' }

function resolveFile(pathname) {
  const clean = normalize(join(root, decodeURIComponent(pathname)))
  if (!clean.startsWith(root)) return null
  for (const candidate of [clean, join(clean, 'index.html'), `${clean}.html`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://x')
  const file = resolveFile(pathname)
  const target = file ?? join(root, '404.html')
  const headers = { 'content-type': MIME[extname(target)] ?? 'application/octet-stream', 'cache-control': target.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' }
  res.writeHead(file ? 200 : 404, headers).end(readFileSync(target))
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}/`))
