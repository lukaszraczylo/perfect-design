/**
 * Build-time prerender: renders every route to HTML in Node with the server bundle (dist-ssr/entry-server.js, built by
 * `vite build --ssr`) and writes dist/<route>/index.html next to the client build. The browser hydrates that HTML in
 * place, so users and crawlers get real content before any JavaScript runs. No browser is needed.
 *   node scripts/prerender.mjs [distDir] [ssrDir]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = process.argv[2] ?? 'dist'
const ssrDir = process.argv[3] ?? 'dist-ssr'
const nav = JSON.parse(readFileSync('src/generated/nav.json', 'utf8'))
const { render, topicRoutes } = await import(pathToFileURL(resolve(ssrDir, 'entry-server.js')).href)

let shell = readFileSync(join(dist, 'index.html'), 'utf8')
// Preload the body font so it is ready before first paint: a late swap re-wraps long text and causes layout shift.
const sans = readdirSync(join(dist, 'assets')).filter((f) => /^ibm-plex-sans-latin-wght-normal-.*\.woff2$/.test(f))
if (sans.length && !shell.includes('rel="preload" as="font"')) {
  const links = sans.map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/${f}" />`).join('\n    ')
  shell = shell.replace('</head>', `    ${links}\n  </head>`)
}
if (!shell.includes('<div id="app"></div>')) throw new Error('dist/index.html is not the empty app shell (run vite build first)')
writeFileSync(join(dist, '404.html'), shell) // the empty shell doubles as the 404 / SPA fallback page

const routes = [
  '/', '/components',
  ...topicRoutes,
  ...[...new Set(nav.map((c) => c.group))].map((g) => `/components/${g}`),
  ...nav.map((c) => `/components/${c.group}/${c.slug}`),
]

// Canonical origin of the published site (GitHub Pages custom domain). Override with SITE_URL for other hosts.
const SITE_URL = (process.env.SITE_URL ?? 'https://perfect-design.raczylo.com').replace(/\/$/, '')
const canonical = (route) => `${SITE_URL}${route === '/' ? '/' : route}`

const TITLE = /<title>[^<]*<\/title>/
const DESCRIPTION = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
let done = 0
const failures = []
for (const route of routes) {
  try {
    const { html, title, description } = await render(route)
    // A page that ships its loading placeholder has no documentation in its static HTML.
    if (html.includes('data-doc-loading')) throw new Error('rendered the loading placeholder instead of the docs')
    if (!TITLE.test(shell) || !DESCRIPTION.test(shell)) throw new Error('index.html has no <title> or <meta name="description"> to replace')
    const page = shell
      .replace('<div id="app"></div>', () => `<div id="app">${html}</div>`)
      .replace(TITLE, () => `<title>${esc(title)}</title>`)
      .replace(DESCRIPTION, () => `<meta name="description" content="${esc(description)}" />`)
      .replace('</head>', () => `    <link rel="canonical" href="${canonical(route)}" />\n  </head>`)
    const out = route === '/' ? join(dist, 'index.html') : join(dist, route, 'index.html')
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, page)
    done++
  } catch (e) {
    failures.push(`${route}: ${String(e).slice(0, 200)}`)
  }
}
// sitemap.xml lists every prerendered route; robots.txt points to it.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>${canonical(r)}</loc></url>`).join('\n')}\n</urlset>\n`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)
const robotsPath = join(dist, 'robots.txt')
const robots = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf8').replace(/\n*Sitemap:.*$/gm, '').trimEnd() : 'User-agent: *\nAllow: /'
writeFileSync(robotsPath, `${robots}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
console.log(`prerender: ${done}/${routes.length} routes written to ${dist}`)
if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
