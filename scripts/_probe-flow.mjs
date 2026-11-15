import puppeteer from 'puppeteer-core'
const base = 'http://localhost:4608'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1100, height: 900 })
const errors = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
await page.goto(`${base}/components/data-display/flow-canvas?eager`, { waitUntil: 'networkidle0', timeout: 60000 })
await page.waitForSelector('[data-slot="flow-canvas"]', { timeout: 20000 })
const els = await page.$$('[data-slot="flow-canvas"]')
console.log(els.length)
for (const i of [2, 3, 4, 8, 9]) { await els[i === 4 ? 4 : i].scrollIntoView(); await els[i].screenshot({ path: `/tmp/flowprobe/ex${i}.png` }) }
console.log(errors.slice(0, 10))
await browser.close()
