/**
 * Real-browser behaviour check ("is it broken by definition?"). jsdom cannot see stylesheets, so a control can toggle
 * perfectly in unit tests and still render identical pixels in one theme. For every live example, in light AND dark:
 *   1. Toggle controls (checkbox, switch, radio, tab, pressed button, native checkbox/radio): the state attribute must
 *      change AND the control's rendered styles must change (state is visible).
 *   2. Focus: Tab-focusing an interactive element must produce a visible indicator (outline or ring).
 *   3. Disabled controls must not toggle.
 *   node scripts/state-check.mjs [baseUrl] [--match /components/forms/] [--routes /a,/b]
 */
import { readFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:4311'
const match = args.includes('--match') ? args[args.indexOf('--match') + 1] : ''
// --inject <css>: extra CSS applied to every page. Used by the self test to prove the check fails when state is not visible.
const inject = args.includes('--inject') ? args[args.indexOf('--inject') + 1] : ''
const only = args.includes('--routes') ? args[args.indexOf('--routes') + 1].split(',') : null
const nav = JSON.parse(readFileSync('docs/src/generated/nav.json', 'utf8'))
const routes = nav.map((c) => `/components/${c.group}/${c.slug}`).filter((r) => (only ? only.includes(r) : r.includes(match)))

const TOGGLES = ['[role=checkbox]', '[role=switch]', '[role=radio]', '[role=tab]', '[role=menuitemcheckbox]', 'button[aria-pressed]', 'input[type=checkbox]', 'input[type=radio]'].join(',')
const MAX_TOGGLES = 4
const MAX_FOCUS = 8

/** Runs in the page: snapshot of everything that can show state, for an element and its subtree (plus pseudo-elements). */
const snapshotFn = () => {
  const PROPS = ['backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'boxShadow', 'outlineStyle', 'outlineColor', 'opacity', 'transform', 'display', 'visibility', 'width', 'height', 'backgroundImage', 'fill', 'stroke', 'textDecorationLine', 'fontWeight']
  return (target) => {
    // Visually hidden native inputs (checkbox/radio cards) show their state on the enclosing label, so snapshot that.
    // A control whose state shows on its component root (`data-selected` ring on Chip) needs that root in the snapshot too.
    const r0 = target.getBoundingClientRect()
    const root = target.closest('[data-slot]')
    const els = [r0.width <= 2 || r0.height <= 2 ? target.closest('label') ?? target.parentElement ?? target : target]
    // `closest` can return the target itself (it may carry data-slot); walk to the component ROOT above it.
    const rootEl = root && root !== els[0] && !els[0].contains(root) ? root : root?.parentElement?.closest('[data-slot]')
    if (rootEl && !els[0].contains(rootEl) && rootEl !== els[0]) els.push(rootEl)
    const parts = []
    const nodes = [...new Set(els.flatMap((el) => [el, ...el.querySelectorAll('*')]))].slice(0, 60)
    for (const n of nodes) {
      const own = getComputedStyle(n)
      const rect = n.getBoundingClientRect()
      // Markup that CSS hides or collapses is not a visible change.
      if (own.display === 'none' || own.visibility === 'hidden' || (n !== els[0] && rect.width === 0 && rect.height === 0)) continue
      parts.push((n.localName === 'path' ? n.getAttribute('d') : '') + '@' + Math.round(rect.width) + 'x' + Math.round(rect.height))
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(n, pseudo)
        parts.push(PROPS.map((p) => cs[p]).join('|'))
      }
    }
    parts.push(`${Math.round(els[0].getBoundingClientRect().width)}x${Math.round(els[0].getBoundingClientRect().height)}`)
    return parts.join('\n')
  }
}

const stateOf = (el) =>
  JSON.stringify({
    checked: el.checked ?? null,
    ac: el.getAttribute('aria-checked'),
    ap: el.getAttribute('aria-pressed'),
    as: el.getAttribute('aria-selected'),
    ds: el.getAttribute('data-state'),
  })

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] })
const failures = []
let toggled = 0
let focused = 0
const queue = []
for (const route of routes) for (const scheme of ['light', 'dark']) queue.push({ route, scheme })

async function worker() {
  // Own context per worker: pages in one context share localStorage, so parallel light and dark runs would overwrite each other's theme.
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const initIds = []
  await page.setViewport({ width: 1280, height: 900 })
  while (queue.length) {
    const { route, scheme } = queue.shift()
    try {
      // Leave the previous page first: its theme store can persist its own mode while unloading, after the next page's init script ran.
      await page.goto('about:blank')
      while (initIds.length) await page.removeScriptToEvaluateOnNewDocument(initIds.pop())
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }])
      const init = await page.evaluateOnNewDocument((s) => { if (location.protocol.startsWith('http')) localStorage.setItem('pd-theme', JSON.stringify({ mode: s, accent: 'default' })) }, scheme)
      initIds.push(init.identifier)
      await page.goto(`${base}${route}?eager`, { waitUntil: 'networkidle0', timeout: 30000 })
      await page.waitForSelector('[data-testid=example-preview] *', { timeout: 10000 }).catch(() => {})
      await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' + inject })
      await page.evaluate(`window.__snap = (${snapshotFn.toString()})(); window.__state = ${stateOf.toString()}`)
      let dark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      if (dark !== (scheme === 'dark')) {
        // Hydration of heavy pages can take seconds on a loaded machine: wait for the theme store to apply the class.
        await page.waitForFunction((want) => document.documentElement.classList.contains('dark') === want, { timeout: 25000 }, scheme === 'dark').catch(() => {})
        dark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      }
      if (dark !== (scheme === 'dark')) failures.push(`${route} [${scheme}] theme did not apply (html.dark=${dark}, stored=${await page.evaluate(() => localStorage.getItem('pd-theme'))}, scheme=${await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)})`)

      // 1. toggles
      const count = await page.$$eval(`[data-testid=example-preview] :is(${TOGGLES})`, (els) => els.length)
      let done = 0
      for (let i = 0; i < count && done < MAX_TOGGLES; i++) {
        const handles = await page.$$(`[data-testid=example-preview] :is(${TOGGLES})`)
        const h = handles[i]
        if (!h) break
        const info = await h.evaluate((el) => ({ disabled: el.disabled || el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('data-disabled'), role: el.getAttribute('role') || el.tagName.toLowerCase(), visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) }))
        if (!info.visible) continue
        const before = await h.evaluate((el) => ({ s: window.__state(el), snap: window.__snap(el) }))
        // an already-active tab/radio cannot toggle by click: skip those
        if (['tab', 'radio'].includes(info.role) && /"(ac|as|ds)":"(true|checked|active|on)"/.test(before.s)) continue
        await h.click({ delay: 10 }).catch(() => {})
        await new Promise((r) => setTimeout(r, 120))
        const after = await h.evaluate((el) => ({ s: window.__state(el), snap: window.__snap(el) })).catch(() => null)
        if (!after) continue // element re-rendered away
        done++
        toggled++
        const id = `${route} [${scheme}] ${info.role}#${i}`
        if (info.disabled) {
          if (before.s !== after.s) failures.push(`${id}: disabled control changed state on click`)
          continue
        }
        if (before.s === after.s) failures.push(`${id}: click did not change state (${before.s})`)
        else if (before.snap === after.snap) failures.push(`${id}: state changed (${before.s} to ${after.s}) but nothing visible changed`)
      }

      // 2. focus indicator: after one Tab (keyboard modality) focus each interactive element and compare against blurred
      const FOCUSABLE = 'a[href],button,input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"]),[role=checkbox],[role=switch],[role=radio],[role=tab],[role=slider],[role=combobox],[role=menuitem]'
      const n = await page.$$eval(`[data-testid=example-preview] :is(${FOCUSABLE})`, (els) => els.length)
      await page.keyboard.press('Tab')
      const step = Math.max(1, Math.floor(n / MAX_FOCUS))
      for (let i = 0; i < n; i += step) {
        const res = await page.evaluate((sel, idx) => {
          const el = [...document.querySelectorAll(`[data-testid=example-preview] :is(${sel})`)][idx]
          if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || !(el.offsetWidth || el.offsetHeight)) return null
          const target = el.matches('input') && el.getBoundingClientRect().width <= 2 ? el.closest('label') ?? el.parentElement : el
          const read = (n) => { const cs = getComputedStyle(n); return { out: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.outlineColor), shadow: cs.boxShadow, bg: cs.backgroundColor, border: cs.borderTopColor, td: cs.textDecorationLine } }
          // The indicator may sit on the control or, for wrapped fields (`focus-within` ring), on one of its three nearest ancestors.
          const chain = [target]
          for (let p = target.parentElement, k = 0; p && k < 3; p = p.parentElement, k++) chain.push(p)
          el.blur()
          const bs = chain.map(read)
          el.focus()
          const fs = chain.map(read)
          const b = bs[0]
          let f = fs[0]
          const ancestor = chain.findIndex((_, i) => fs[i].out || fs[i].shadow !== bs[i].shadow || fs[i].border !== bs[i].border)
          if (!f.out && f.shadow === b.shadow && f.bg === b.bg && f.border === b.border && f.td === b.td && ancestor > 0) f = { ...f, out: true }
          const fv = el.matches(':focus-visible')
          const tag = el.tagName.toLowerCase() + (el.getAttribute('data-slot') ? `[${el.getAttribute('data-slot')}]` : '')
          return { b, f, fv, tag }
        }, FOCUSABLE, i)
        if (!res) continue
        focused++
        const changed = res.f.out || res.f.shadow !== res.b.shadow || res.f.bg !== res.b.bg || res.f.border !== res.b.border || res.f.td !== res.b.td
        if (!changed && res.fv) failures.push(`${route} [${scheme}] no visible focus indicator on ${res.tag}`)
      }
    } catch (e) {
      failures.push(`${route} [${scheme}] check crashed: ${String(e).slice(0, 120)}`)
    }
  }
  await page.close()
  await context.close()
}
await Promise.all(Array.from({ length: 3 }, worker))
await browser.close()

console.log(`Checked ${routes.length} routes x 2 themes. Toggled ${toggled} controls, tested focus on ${focused} elements.`)
const unique = [...new Set(failures)]
if (unique.length) {
  console.log(`\n${unique.length} problem(s):`)
  for (const f of unique) console.log(' - ' + f)
  process.exit(1)
}
console.log('No problems found.')
