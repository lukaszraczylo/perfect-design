/**
 * Shared helpers for the real-browser behaviour suite (scripts/browser/behaviour.mjs).
 * Plain puppeteer-core driving /Applications/Google Chrome.app, like scripts/a11y-sweep.mjs.
 */
import puppeteer from 'puppeteer-core'

export const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** A failed assertion: carries the selector so the report says where to look. */
export class TestFailure extends Error {
  constructor(message, selector) {
    super(message)
    this.selector = selector
  }
}

export function check(cond, message, selector = '') {
  if (!cond) throw new TestFailure(message, selector)
}

export const launch = () => puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })

/**
 * Opens a docs route in a fresh browser context (own localStorage) and waits until every live example is mounted.
 * theme: object persisted as `pd-theme` on every navigation, or null to leave storage alone (persistence tests).
 */
export async function openRoute(browser, base, route, o = {}) {
  const { width = 1280, height = 800, theme = { mode: 'light', accent: 'default', style: 'quiet' }, rtl = false, touch = false, reducedMotion = false } = o
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  // Parallel pages in a headless browser are not "focused" windows: without this, focus events never fire.
  await (await page.createCDPSession()).send('Emulation.setFocusEmulationEnabled', { enabled: true })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (['error', 'warn', 'warning'].includes(m.type())) errors.push(m.text()) })
  await page.setViewport({ width, height, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 })
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: theme?.mode === 'dark' ? 'dark' : 'light' },
    { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
  ])
  if (theme) await page.evaluateOnNewDocument((t) => { if (location.protocol.startsWith('http')) localStorage.setItem('pd-theme', JSON.stringify(t)) }, theme)
  if (rtl) await page.evaluateOnNewDocument(() => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.dir = 'rtl' }) })
  await page.goto(`${base}${route}${route.includes('?') ? '&' : '?'}eager`, { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('h1', { timeout: 10000 })
  await waitLive(page)
  // Smooth scrolling animates focus and scrollIntoView, so positions read right after are mid-flight.
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' })
  if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl' })
  return { page, context, errors, close: () => context.close() }
}

/** Waits until at least one example is live and none is still loading. */
export async function waitLive(page) {
  await page.waitForFunction(() => {
    const p = [...document.querySelectorAll('[data-testid=example-preview]')]
    return p.length > 0 && p.every((e) => e.getAttribute('aria-busy') === 'false')
  }, { timeout: 15000 })
  await sleep(150)
}

/**
 * Polls `fn` (runs in the page) until it returns a truthy value, else fails with `what` and the selector.
 * Returns the value.
 */
export async function until(page, what, selector, fn, arg, timeout = 3000) {
  try {
    const h = await page.waitForFunction(fn, { timeout, polling: 'raf' }, arg)
    return await h.jsonValue()
  } catch {
    throw new TestFailure(`timed out waiting for: ${what}`, selector)
  }
}

/** True when the selector matches nothing for `ms`; used to prove something stays closed. */
export async function stays(page, ms, fn, arg) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (await page.evaluate(fn, arg)) return false
    await sleep(50)
  }
  return true
}

/** Tags the preview of the example whose title starts with `titleStart` with data-bt and returns its selector. */
export async function exampleSelector(page, titleStart) {
  const found = await page.evaluate((t) => {
    const f = [...document.querySelectorAll('figure[data-testid=example]')].find((x) => x.querySelector('h3')?.textContent?.trim().toLowerCase().startsWith(t.toLowerCase()))
    document.querySelectorAll('[data-bt]').forEach((e) => e.removeAttribute('data-bt'))
    f?.querySelector('[data-testid=example-preview]')?.setAttribute('data-bt', '')
    return !!f
  }, titleStart)
  check(found, `no example titled "${titleStart}"`, 'figure[data-testid=example] h3')
  return '[data-bt]'
}

/** Describes the active element: tag, slot, text. Reads through open shadow roots is not needed here. */
export const activeInfo = (page) =>
  page.evaluate(() => {
    const a = document.activeElement
    return a ? { tag: a.tagName, slot: a.dataset?.slot ?? '', role: a.getAttribute('role') ?? '', text: (a.textContent ?? '').trim().slice(0, 40), id: a.id } : null
  })

/** True when the focused element draws a visible indicator: outline, or a box-shadow ring (focus-visible after keyboard). */
export const focusRingVisible = (page) =>
  page.evaluate(() => {
    const a = document.activeElement
    if (!a || a === document.body) return false
    const s = getComputedStyle(a)
    const outline = parseFloat(s.outlineWidth) > 0 && s.outlineStyle !== 'none'
    const ring = s.boxShadow && s.boxShadow !== 'none'
    return outline || !!ring
  })
