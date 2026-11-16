// Usage: node scripts/lighthouse.mjs <baseUrl> [path ...]   (mobile + desktop, prints category scores + failing audits)
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'

const base = process.argv[2] ?? 'http://localhost:4311'
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ['/']
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = await launch({ chromePath: CHROME, chromeFlags: ['--headless=new', '--no-sandbox'] })
let failures = 0
for (const form of ['mobile', 'desktop']) {
  for (const p of paths) {
    const flags = { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'agentic-browsing'] }
    const config = form === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined
    const r = await lighthouse(base + p, flags, config)
    const cats = r.lhr.categories
    const scores = Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]))
    const bad = Object.values(r.lhr.audits).filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual')
    const perfMetrics = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map((k) => `${k.replace(/-/g, '')}=${r.lhr.audits[k]?.displayValue}`).join(' ')
    console.log(`\n[${form}] ${p}  ${JSON.stringify(scores)}\n  ${perfMetrics}`)
    for (const a of bad) console.log(`  ✗ ${a.id} (${a.score}) ${a.title}${a.displayValue ? ' — ' + a.displayValue : ''}`)
    if (Object.values(scores).some((s) => s < 100)) failures++
  }
}
await chrome.kill()
process.exit(failures ? 1 : 0)
