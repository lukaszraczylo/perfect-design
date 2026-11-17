/**
 * Unstyled-class check of the built docs site: every class on every element of every page (live examples mounted with
 * ?eager) must have a CSS rule. A class without one means Tailwind never generated it, usually because the class name is
 * built at runtime or the stylesheet does not @source the folder the component lives in.
 *   node scripts/unstyled-check.mjs [baseUrl] [--match substr] [--sabotage]
 * --sabotage adds an element with an unknown class to every page; the check must then fail (used by browser-tests.mjs).
 */
import puppeteer from 'puppeteer-core'

const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:4311'
const match = args.includes('--match') ? args[args.indexOf('--match') + 1] : ''
const sabotage = args.includes('--sabotage')
// Classes that are hooks for code, not styles: Vue Router's link state, code languages, and the Marquee copy wrapper.
const HOOKS = /^(group|peer|dark|not-prose)(\/.*)?$|^router-link-(exact-)?active$|^language-[a-z0-9]+$|^pd-marquee-copy$/

const sitemap = await fetch(new URL('/sitemap.xml', base)).then((r) => (r.ok ? r.text() : ''))
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((r) => r.includes(match))
if (!routes.length) {
  console.log('✗ no route was checked: the sitemap is missing or --match matched nothing')
  process.exit(1)
}

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] })
const missing = new Map()
const queue = [...routes]
async function worker() {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  while (queue.length) {
    const route = queue.shift()
    await page.goto(`${base}${route}?eager`, { waitUntil: 'networkidle0', timeout: 45000 })
    await page.waitForSelector('[data-testid=example-preview] *', { timeout: 8000 }).catch(() => {})
    if (sabotage) await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<div class="pd-sabotage-unstyled"></div>'))
    const found = await page.evaluate((hooks) => {
      const hook = new RegExp(hooks)
      const defined = new Set()
      const unescape = (s) => s.replace(/\\([0-9a-fA-F]{1,6}) ?/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1')
      const walk = (rules) => {
        for (const r of rules) {
          if (r.selectorText) for (const m of r.selectorText.matchAll(/\.((?:\\[0-9a-fA-F]{1,6} ?|\\.|[A-Za-z0-9_-])+)/g)) defined.add(unescape(m[1]))
          if (r.cssRules) walk(r.cssRules)
        }
      }
      for (const sheet of document.styleSheets) {
        try {
          walk(sheet.cssRules)
        } catch {
          /* cross-origin sheet: none on this site */
        }
      }
      const out = new Set()
      for (const el of document.querySelectorAll('[class]')) {
        const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') ?? '')
        for (const c of cls.split(/\s+/)) if (c && !hook.test(c) && !defined.has(c)) out.add(c)
      }
      return [...out]
    }, HOOKS.source)
    for (const c of found) missing.set(c, [...(missing.get(c) ?? []), route])
  }
  await context.close()
}
await Promise.all(Array.from({ length: 5 }, worker))
await browser.close()

console.log(`Checked ${routes.length} routes. Classes without a CSS rule: ${missing.size}`)
for (const [c, rs] of [...missing].sort((a, b) => b[1].length - a[1].length)) console.log(`✗ ${c}  (${rs.length} pages, e.g. ${rs.slice(0, 3).join(', ')})`)
process.exit(missing.size ? 1 : 0)
