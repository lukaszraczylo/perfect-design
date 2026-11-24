/**
 * Accessibility + responsiveness sweep of the built docs site.
 *   node scripts/a11y-sweep.mjs [baseUrl] [--limit N] [--match substr | --routes /a,/b] [--style workbench] [--corner squircle] [--surface glass] [--out file]
 *   --style applies a style pack (data-style) to every page, to audit a pack across the whole site.
 *   --corner and --surface do the same for data-corner and data-surface.
 * For every route × viewport × colour scheme: axe-core (WCAG 2.0/2.1/2.2 A+AA + best-practice) and a horizontal-overflow check.
 * Examples are forced live with ?eager so the live demos are audited, not just the page shell.
 * Writes the JSON report to --out (default reports/a11y-sweep.json; give concurrent runs different files) and prints a grouped summary. Exit code 1 if anything fails.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer-core'

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:4311'
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity
const stylePack = args.includes('--style') ? args[args.indexOf('--style') + 1] : 'quiet'
const corner = args.includes('--corner') ? args[args.indexOf('--corner') + 1] : 'round'
const surface = args.includes('--surface') ? args[args.indexOf('--surface') + 1] : 'solid'
const match = args.includes('--match') ? args[args.indexOf('--match') + 1] : ''
const only = args.includes('--routes') ? args[args.indexOf('--routes') + 1].split(',') : null
const reportFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'reports/a11y-sweep.json'
// The prerender writes sitemap.xml from the router's own lists, so the sweep audits exactly the pages that ship.
const sitemap = await fetch(new URL('/sitemap.xml', base)).then((r) => (r.ok ? r.text() : ''))
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
  .filter((r) => (only ? only.includes(r) : r.includes(match))).slice(0, limit)

const VIEWPORTS = [{ name: 'phone-320', width: 320, height: 640, isMobile: true, hasTouch: true }, { name: 'tablet-768', width: 768, height: 1024 }, { name: 'desktop-1280', width: 1280, height: 800 }]
const SCHEMES = ['light', 'dark']

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] })
const results = []
const queue = []
for (const route of routes) for (const vp of VIEWPORTS) for (const scheme of SCHEMES) queue.push({ route, vp, scheme })

async function worker() {
  // Own context per worker: pages in one context share localStorage, so parallel light and dark runs would overwrite each other's theme.
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const initIds = []
  const consoleErrors = []
  page.on('console', (m) => { if (['error', 'warn', 'warning'].includes(m.type())) consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push(String(e)))
  while (queue.length) {
    const { route, vp, scheme } = queue.shift()
    consoleErrors.length = 0
    try {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: 1 })
      // Leave the previous page first: its theme store can persist its own mode while unloading, after the next page's init script ran.
      await page.goto('about:blank')
      while (initIds.length) await page.removeScriptToEvaluateOnNewDocument(initIds.pop())
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }])
      const init = await page.evaluateOnNewDocument((s, st, co, su) => { if (location.protocol.startsWith('http')) localStorage.setItem('pd-theme', JSON.stringify({ mode: s, accent: 'default', style: st, corner: co, surface: su })) }, scheme, stylePack, corner, surface)
      initIds.push(init.identifier)
      await page.goto(`${base}${route}${route.includes('?') ? '&' : '?'}eager`, { waitUntil: 'networkidle0', timeout: 30000 })
      await page.waitForSelector('h1', { timeout: 10000 })
      await new Promise((r) => setTimeout(r, 250))
      // Colour transitions (150ms) must not run while axe samples colours, or it measures half-way values.
      await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
      await new Promise((r) => setTimeout(r, 100))
      await page.evaluate(axeSource)
      const out = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] })
        const el = document.scrollingElement
        return {
          violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 160), msg: (n.any[0] || n.all[0] || n.none[0] || {}).message })) })),
          overflowX: el.scrollWidth - el.clientWidth,
          wide: [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('[class*="overflow-x-auto"],[class*="overflow-auto"],[class*="overflow-hidden"],pre') }).slice(0, 4).map((e) => (e.tagName + '.' + (e.className?.toString().slice(0, 60) ?? ''))),
        }
      })
      results.push({ route, viewport: vp.name, scheme, ...out, consoleErrors: [...consoleErrors] })
    } catch (e) {
      results.push({ route, viewport: vp.name, scheme, error: String(e).slice(0, 200), violations: [], overflowX: 0, wide: [], consoleErrors: [...consoleErrors] })
    }
  }
  await page.close()
  await context.close()
}
await Promise.all(Array.from({ length: 4 }, worker))
await browser.close()

mkdirSync(dirname(reportFile), { recursive: true })
writeFileSync(reportFile, JSON.stringify(results, null, 2))
const byRule = new Map()
let overflow = 0, errors = 0, consoleIssues = 0
for (const r of results) {
  if (r.error) errors++
  if (r.overflowX > 0) overflow++
  if (r.consoleErrors?.length) consoleIssues++
  for (const v of r.violations) {
    const e = byRule.get(v.id) ?? { help: v.help, impact: v.impact, pages: new Set(), combos: 0, sample: v.sample[0] }
    e.pages.add(r.route); e.combos++
    byRule.set(v.id, e)
  }
}
console.log(`\nChecked ${results.length} page×viewport×scheme combos over ${routes.length} routes.`)
console.log(`Navigation errors: ${errors} · horizontal overflow: ${overflow} · console errors/warnings: ${consoleIssues}`)
for (const [id, e] of [...byRule].sort((a, b) => b[1].combos - a[1].combos)) {
  console.log(`\n✗ ${id} [${e.impact}] ${e.help} — ${e.pages.size} pages, ${e.combos} combos\n    e.g. ${e.sample?.target} :: ${e.sample?.msg?.slice(0, 160)}`)
}
if (!results.length) console.log('\n✗ no route was checked: the sitemap is missing or --match/--routes matched nothing')
process.exit(!results.length || byRule.size || overflow || errors || consoleIssues ? 1 : 0)
