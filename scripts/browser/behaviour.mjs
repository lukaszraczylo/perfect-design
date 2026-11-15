/**
 * Real-browser behaviour tests: what jsdom cannot see (real layout, real pointers, real focus, real storage).
 *   node scripts/browser/behaviour.mjs <baseUrl> [--match substr] [--concurrency N] [--no-self-check]
 *
 * Every test drives the docs site, asserts real DOM or computed state, and carries a `sabotage`: a deliberate break of
 * the behaviour under test. The runner executes the test a second time with the sabotage applied and requires it to
 * FAIL; a test that still passes on a broken page proves nothing and fails the run ("SELF-CHECK").
 * Failures print route, test and the selector that was being checked. Exit code 1 on any failure.
 */
import {
  TestFailure, activeInfo, check, exampleSelector, launch, openRoute, sleep, until,
} from './lib.mjs'

const args = process.argv.slice(2)
const base = (args.find((a) => a.startsWith('http')) ?? 'http://localhost:4399').replace(/\/$/, '')
const flag = (name, d) => (args.includes(name) ? args[args.indexOf(name) + 1] : d)
const match = flag('--match', '')
const concurrency = Number(flag('--concurrency', 5))
const selfCheck = !args.includes('--no-self-check')

// ---------------------------------------------------------------------------------------------------------------------
// sabotage building blocks (run in the page; they break behaviour the way a regression would)

/** Swallows these keys before any component sees them. */
const blockKeys = (keys) => (page) =>
  page.evaluate((k) => window.addEventListener('keydown', (e) => { if (k.includes(e.key)) { e.preventDefault(); e.stopImmediatePropagation() } }, true), keys)
/** Swallows pointer and mouse events, so hover, leave, press and drag never reach the components. */
const blockPointer = (types) => (page) =>
  page.evaluate((t) => { for (const type of t) window.addEventListener(type, (e) => e.stopImmediatePropagation(), true) }, types)
const css = (text) => (page) => page.addStyleTag({ content: text })
const POINTER_ALL = ['pointermove', 'pointerleave', 'pointerout', 'mousemove', 'mouseout', 'mouseleave']

// ---------------------------------------------------------------------------------------------------------------------
// assertion helpers

const slotSel = (s) => `[data-slot=${s}]`

/** Keyboard-focus ring check: the focused element must look different from the same element blurred. */
async function expectFocusRing(page, label) {
  const r = await page.evaluate(async () => {
    const el = document.activeElement
    if (!el || el === document.body) return { ok: false, why: 'nothing focused' }
    const snap = () => { const s = getComputedStyle(el); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor].join('|') }
    const wait = () => new Promise((r2) => setTimeout(r2, 260))
    await wait()
    const focused = snap()
    el.blur()
    await wait()
    const blurred = snap()
    el.focus({ focusVisible: true })
    await wait()
    return { ok: focused !== blurred, focused, blurred }
  })
  check(r.ok, `no visible focus ring on ${label}${r.why ? ` (${r.why})` : ''}`, label)
}

const inViewport = (page) =>
  page.evaluate(() => ({ w: document.documentElement.clientWidth, h: window.innerHeight }))

/** Reads the rect of a selector, or null when absent. */
const rectOf = (page, sel) =>
  page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, side: e.dataset.side ?? '' } }, sel)

// ---------------------------------------------------------------------------------------------------------------------
// tests

const tests = []
/** group: tests of a group share one self-check (the sabotage is the same, only the input differs). */
const test = (t) => tests.push({ width: 1280, ...t })

// 1. Tooltip ----------------------------------------------------------------------------------------------------------
test({
  name: 'tooltip opens on hover and closes on pointer leave',
  route: '/components/overlays/tooltip',
  sabotage: { afterOpen: blockPointer(POINTER_ALL) },
  async run({ page, hook }) {
    const trig = `${slotSel('tooltip-trigger')}`
    const content = slotSel('tooltip-content')
    check(!(await page.$(content)), 'tooltip content present before hover', content)
    await page.hover(trig)
    await until(page, 'tooltip content visible after hover', content, (s) => { const e = document.querySelector(s); return !!e && e.getBoundingClientRect().width > 0 && (e.textContent ?? '').trim().length > 0 }, content)
    check((await page.$eval(trig, (e) => e.getAttribute('data-state'))).includes('open'), 'trigger data-state is not open while tooltip shows', trig)
    await hook('afterOpen')
    await page.mouse.move(2, 2)
    await page.mouse.move(6, 790)
    await until(page, 'tooltip content removed after pointer leave', content, (s) => !document.querySelector(s), content)
    check((await page.$eval(trig, (e) => e.getAttribute('data-state'))) === 'closed', 'trigger data-state not closed after leave', trig)
  },
})

test({
  name: 'tooltip opens on focus and closes on Escape',
  route: '/components/overlays/tooltip',
  sabotage: { beforeEscape: blockKeys(['Escape']) },
  async run({ page, hook }) {
    const trig = slotSel('tooltip-trigger')
    const content = slotSel('tooltip-content')
    // Reka closes a tooltip on any scroll that contains its trigger, so bring the trigger into view before focusing it.
    await page.evaluate((t) => document.querySelector(t).scrollIntoView({ block: 'center' }), trig)
    await sleep(300)
    await page.keyboard.press('Shift')
    await page.focus(trig)
    await until(page, 'tooltip content visible after focus', content, (s) => !!document.querySelector(s), content)
    const describedBy = await page.$eval(trig, (e) => e.getAttribute('aria-describedby'))
    check(!!describedBy, 'open tooltip trigger has no aria-describedby', trig)
    check(await page.evaluate((id) => !!document.getElementById(id), describedBy), 'aria-describedby points at nothing', trig)
    await sleep(700)
    check(!!(await page.$(content)), 'tooltip closed by itself while the trigger kept focus', content)
    await hook('beforeEscape')
    await page.keyboard.press('Escape')
    await until(page, 'tooltip content removed after Escape', content, (s) => !document.querySelector(s), content)
    check((await activeInfo(page)).slot === 'tooltip-trigger', 'focus left the trigger after Escape', trig)
  },
})

// 2. Collision handling: content stays inside the viewport near every edge ---------------------------------------------
const EDGES = {
  'top-left': 'left:0;top:0', 'top-right': 'right:0;top:0', 'bottom-left': 'left:0;bottom:0', 'bottom-right': 'right:0;bottom:0',
  'top-centre': 'left:50%;top:0', 'bottom-centre': 'left:50%;bottom:0', 'left-middle': 'left:0;top:45%', 'right-middle': 'right:0;top:45%',
}
async function collisionRun({ page, hook }, { trigger, content, open }) {
  const { w, h } = await inViewport(page)
  for (const [edge, pos] of Object.entries(EDGES)) {
    await page.evaluate((t, p) => { document.querySelector(t).style.cssText = `position:fixed;margin:0;z-index:2147483000;${p}` }, trigger, pos)
    await sleep(60)
    if (open === 'hover') await page.hover(trigger)
    else await page.click(trigger)
    await until(page, `${content} visible near ${edge}`, content, (s) => { const e = document.querySelector(s); return !!e && e.getBoundingClientRect().width > 0 }, content, 4000)
    await sleep(120) // floating-ui settles its first position on the next frame
    await hook('afterOpen')
    const r = await rectOf(page, content)
    const tol = 0.75
    check(r.l >= -tol && r.t >= -tol && r.r <= w + tol && r.b <= h + tol, `${content} leaves the ${w}x${h} viewport near ${edge}: left ${r.l.toFixed(1)}, top ${r.t.toFixed(1)}, right ${r.r.toFixed(1)}, bottom ${r.b.toFixed(1)}`, content)
    check(r.w <= w + tol, `${content} is wider (${r.w.toFixed(0)}px) than the ${w}px viewport`, content)
    await page.keyboard.press('Escape')
    await until(page, `${content} closes on Escape near ${edge}`, content, (s) => !document.querySelector(s), content, 4000)
  }
}
const SHIFT_AWAY = (content) => css(`${content}{translate:100vw 0 !important}`)
for (const width of [320, 1280]) {
  test({
    name: `popover stays inside the viewport near every edge (${width}px)`,
    route: '/components/overlays/popover',
    width,
    group: 'collision-popover',
    sabotage: { afterOpen: SHIFT_AWAY(slotSel('popover-content')) },
    run: (c) => collisionRun(c, { trigger: slotSel('popover-trigger'), content: slotSel('popover-content'), open: 'click' }),
  })
  test({
    name: `hover card stays inside the viewport near every edge (${width}px)`,
    route: '/components/overlays/hover-card',
    width,
    group: 'collision-hover-card',
    sabotage: { afterOpen: SHIFT_AWAY(slotSel('hover-card-content')) },
    run: (c) => collisionRun(c, { trigger: slotSel('hover-card-trigger'), content: slotSel('hover-card-content'), open: 'hover' }),
  })
  test({
    name: `dropdown menu stays inside the viewport near every edge (${width}px)`,
    route: '/components/overlays/dropdown-menu',
    width,
    group: 'collision-dropdown',
    sabotage: { afterOpen: SHIFT_AWAY(slotSel('dropdown-menu-content')) },
    run: (c) => collisionRun(c, { trigger: slotSel('dropdown-menu-trigger'), content: slotSel('dropdown-menu-content'), open: 'click' }),
  })
}

// 3. Keyboard order and roving ---------------------------------------------------------------------------------------
/** Marks the first example root whose item selector yields at least `min` enabled elements and returns their count. */
async function tagRoot(page, rootSel, itemSel, min) {
  const n = await page.evaluate((r, i, m) => {
    document.querySelectorAll('[data-bt]').forEach((e) => e.removeAttribute('data-bt'))
    for (const root of document.querySelectorAll(r)) {
      const all = [...root.querySelectorAll(i)]
      const items = all.filter((e) => !e.disabled && e.getAttribute('aria-disabled') !== 'true' && !e.hasAttribute('data-disabled'))
      if (items.length >= m && items.length === all.length) { root.setAttribute('data-bt', ''); return items.length }
    }
    return 0
  }, rootSel, itemSel, min)
  check(n >= min, `no ${rootSel} with ${min}+ ${itemSel} that are all enabled`, rootSel)
  return n
}
async function expectActive(page, itemSel, i, label) {
  try {
    await page.waitForFunction((s, k) => { const list = [...document.querySelectorAll(`[data-bt] ${s}`)].filter((x) => !x.disabled && x.getAttribute('aria-disabled') !== 'true'); return list[k] === document.activeElement }, { timeout: 2000 }, itemSel, i)
  } catch {
    const got = await activeInfo(page)
    throw new TestFailure(`${label}: focus should be on item ${i} of ${itemSel} but is on <${got?.tag?.toLowerCase()}> "${got?.text}"`, itemSel)
  }
}

test({
  name: 'accordion: Tab order, arrow, Home/End roving, Enter toggles, visible focus ring',
  route: '/components/navigation/accordion',
  sabotage: { beforeKeys: blockKeys(['ArrowDown', 'ArrowUp', 'Home', 'End']) },
  async run({ page, hook }) {
    const item = slotSel('accordion-trigger')
    const n = await tagRoot(page, slotSel('accordion'), item, 2)
    await page.evaluate((s) => document.querySelector(`[data-bt] ${s}`).focus(), item)
    await page.keyboard.press('Shift') // keyboard modality: focus-visible applies
    await expectActive(page, item, 0, 'initial focus')
    await expectFocusRing(page, `${item} (first)`)
    await hook('beforeKeys')
    for (let i = 1; i < n; i++) { await page.keyboard.press('ArrowDown'); await expectActive(page, item, i, `ArrowDown #${i}`) }
    await expectFocusRing(page, `${item} (after ArrowDown)`)
    await page.keyboard.press('ArrowUp'); await expectActive(page, item, n - 2, 'ArrowUp')
    await page.keyboard.press('End'); await expectActive(page, item, n - 1, 'End')
    await page.keyboard.press('Home'); await expectActive(page, item, 0, 'Home')
    const before = await page.evaluate((s) => document.querySelector(`[data-bt] ${s}`).getAttribute('aria-expanded'), item)
    await page.keyboard.press('Enter')
    await until(page, 'Enter flips aria-expanded on the focused trigger', item, ({ s, b }) => document.querySelector(`[data-bt] ${s}`).getAttribute('aria-expanded') !== b, { s: item, b: before })
  },
})

test({
  name: 'tabs: roving focus, arrow/Home/End select and focus the tab, panel follows, visible focus ring',
  route: '/components/navigation/tabs',
  sabotage: { beforeKeys: blockKeys(['ArrowRight', 'ArrowLeft', 'Home', 'End']) },
  async run({ page, hook }) {
    const tab = slotSel('tabs-trigger')
    const n = await tagRoot(page, slotSel('tabs-list'), tab, 3)
    const selected = () => page.evaluate(() => [...document.querySelectorAll('[data-bt] [role=tab]')].map((e) => e.getAttribute('aria-selected')))
    const tabs = () => page.evaluate(() => [...document.querySelectorAll('[data-bt] [role=tab]')].map((e) => e === document.activeElement))
    check((await selected()).filter((x) => x === 'true').length === 1, 'exactly one tab must be aria-selected at start', tab)
    await page.evaluate(() => document.querySelector('[data-bt] [role=tab][aria-selected=true]').focus())
    await page.keyboard.press('Shift')
    await expectFocusRing(page, `${tab} (selected)`)
    // Tab leaves the tablist: the other tabs are not in the tab order (roving tabindex).
    await page.keyboard.press('Tab')
    check(!(await tabs()).some(Boolean), 'Tab moved focus to another tab instead of leaving the tablist', tab)
    await page.evaluate(() => document.querySelector('[data-bt] [role=tab][aria-selected=true]').focus())
    await hook('beforeKeys')
    await page.keyboard.press('ArrowRight')
    await until(page, 'ArrowRight selects and focuses the next tab', tab, () => { const t = [...document.querySelectorAll('[data-bt] [role=tab]')]; return t[1] === document.activeElement && t[1].getAttribute('aria-selected') === 'true' })
    const panel = await page.evaluate(() => { const t = document.querySelectorAll('[data-bt] [role=tab]')[1]; const p = document.getElementById(t.getAttribute('aria-controls')); return p ? { shown: p.getBoundingClientRect().height > 0 && !p.hidden, labelled: p.getAttribute('aria-labelledby') === t.id } : null })
    check(panel?.shown && panel.labelled, 'panel of the selected tab is not shown and labelled by it', '[role=tabpanel]')
    await page.keyboard.press('End')
    await until(page, 'End selects the last tab', tab, (k) => { const t = [...document.querySelectorAll('[data-bt] [role=tab]')]; return t[k] === document.activeElement && t[k].getAttribute('aria-selected') === 'true' }, n - 1)
    await page.keyboard.press('Home')
    await until(page, 'Home selects the first tab', tab, () => { const t = [...document.querySelectorAll('[data-bt] [role=tab]')]; return t[0] === document.activeElement && t[0].getAttribute('aria-selected') === 'true' })
    await page.keyboard.press('End')
    await page.keyboard.press('ArrowLeft')
    await until(page, 'ArrowLeft moves to the previous tab', tab, (k) => { const t = [...document.querySelectorAll('[data-bt] [role=tab]')]; return t[k] === document.activeElement && t[k].getAttribute('aria-selected') === 'true' }, n - 2)
    await expectFocusRing(page, `${tab} (after arrows)`)
  },
})

test({
  name: 'FAQ list: Tab visits every question in order, Enter and Space toggle, visible focus ring',
  route: '/components/marketing/faq-list',
  sabotage: { beforeKeys: (page) => page.evaluate(() => window.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation() } }, true)) },
  async run({ page, hook }) {
    const q = slotSel('faq-question')
    const n = await tagRoot(page, slotSel('faq-list'), q, 3)
    await page.evaluate((s) => document.querySelector(`[data-bt] ${s}`).focus(), q)
    await page.keyboard.press('Shift')
    await expectActive(page, q, 0, 'initial focus')
    await expectFocusRing(page, `${q} (first)`)
    for (let i = 1; i < n; i++) { await page.keyboard.press('Tab'); await expectActive(page, q, i, `Tab #${i}`) }
    for (let i = n - 2; i >= 0; i--) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); await expectActive(page, q, i, `Shift+Tab to ${i}`) }
    await hook('beforeKeys')
    const open = () => page.evaluate(() => document.querySelector('[data-bt] details').open)
    const was = await open()
    await page.keyboard.press('Enter')
    await until(page, 'Enter toggles the answer', q, (b) => document.querySelector('[data-bt] details').open !== b, was)
    await page.keyboard.press('Space')
    await until(page, 'Space toggles the answer back', q, (b) => document.querySelector('[data-bt] details').open === b, was)
  },
})

// 4. Dialog, Sheet, Select -------------------------------------------------------------------------------------------
test({
  name: 'dialog: Tab and Shift+Tab stay trapped inside, page behind is hidden',
  route: '/components/overlays/dialog',
  sabotage: { afterOpen: (page) => page.evaluate(() => window.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); const h = document.querySelector('h1'); h.tabIndex = 0; h.focus() } }, true)) },
  async run({ page, hook }) {
    const trigger = slotSel('dialog-trigger')
    const content = slotSel('dialog-content')
    await page.focus(trigger)
    await page.keyboard.press('Enter')
    await until(page, 'dialog opens on Enter', content, (s) => { const e = document.querySelector(s); return !!e && e.getBoundingClientRect().width > 0 }, content)
    check(await page.$eval(content, (e) => e.getAttribute('role') === 'dialog' && !!(e.getAttribute('aria-labelledby') || e.getAttribute('aria-label'))), 'dialog has no role=dialog and an accessible name', content)
    check(await page.evaluate((s) => document.querySelector(s).contains(document.activeElement), content), 'focus did not move into the dialog on open', content)
    check(await page.$eval(trigger, (e) => !!e.closest('[aria-hidden=true],[inert]')), 'content behind the dialog is not hidden from assistive tech', trigger)
    await hook('afterOpen')
    const seen = new Set()
    const inside = () => page.evaluate((s) => document.querySelector(s).contains(document.activeElement), content)
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab')
      check(await inside(), `Tab #${i + 1} moved focus out of the dialog to <${(await activeInfo(page)).tag.toLowerCase()}>`, content)
      seen.add(await page.evaluate(() => { const a = document.activeElement; return (a.dataset.slot ?? '') + '|' + (a.textContent ?? '').trim() + '|' + a.tagName }))
    }
    check(seen.size >= 3, `focus only visited ${seen.size} element(s) inside the dialog`, content)
    for (let i = 0; i < 9; i++) {
      await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift')
      check(await inside(), `Shift+Tab #${i + 1} moved focus out of the dialog`, content)
    }
  },
})

test({
  name: 'dialog: Escape closes it and focus returns to the trigger',
  route: '/components/overlays/dialog',
  sabotage: { beforeEscape: blockKeys(['Escape']) },
  async run({ page, hook }) {
    const trigger = slotSel('dialog-trigger')
    const content = slotSel('dialog-content')
    await page.focus(trigger)
    await page.keyboard.press('Enter')
    await until(page, 'dialog opens', content, (s) => !!document.querySelector(s), content)
    await hook('beforeEscape')
    await page.keyboard.press('Escape')
    await until(page, 'dialog closes on Escape', content, (s) => !document.querySelector(s), content)
    await until(page, 'focus returns to the dialog trigger', trigger, (s) => document.activeElement === document.querySelector(s), trigger)
    check(await page.evaluate(() => document.body.style.pointerEvents !== 'none'), 'body pointer-events stay disabled after the dialog closed', 'body')
  },
})

async function scrollLockRun({ page, hook }, { trigger, content }) {
  await page.evaluate((t) => document.querySelector(t).scrollIntoView({ block: 'center' }), trigger)
  await sleep(200)
  await page.focus(trigger)
  await page.keyboard.press('Enter')
  await until(page, `${content} opens on Enter`, content, (s) => { const e = document.querySelector(s); return !!e && e.getBoundingClientRect().width > 0 }, content)
  check(await page.evaluate((s) => document.querySelector(s).contains(document.activeElement), content), `focus did not enter ${content}`, content)
  await hook('afterOpen')
  const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow)
  check(overflow === 'hidden', `body overflow is "${overflow}" while ${content} is open (scroll not locked)`, 'body')
  const before = await page.evaluate(() => scrollY)
  await page.mouse.move(Math.round(page.viewport().width * 0.6), 400) // over the page content, not the docs sidebar (which scrolls on its own)
  await page.mouse.wheel({ deltaY: 500 })
  await sleep(250)
  const after = await page.evaluate(() => scrollY)
  check(after === before, `page scrolled from ${before} to ${after} while ${content} is open`, 'body')
  await hook('beforeEscape')
  await page.keyboard.press('Escape')
  await until(page, `${content} closes on Escape`, content, (s) => !document.querySelector(s), content)
  await until(page, 'focus returns to the trigger', trigger, (s) => document.activeElement === document.querySelector(s), trigger)
  check((await page.evaluate(() => getComputedStyle(document.body).overflow)) !== 'hidden', 'body overflow stays hidden after close', 'body')
  await page.mouse.wheel({ deltaY: 300 })
  await sleep(250)
  check((await page.evaluate(() => scrollY)) > after, 'page does not scroll again after close', 'body')
}
const unlockBody = (page) => page.evaluate(() => { document.body.style.setProperty('overflow', 'auto', 'important') })

test({
  name: 'sheet: locks page scroll while open, Escape closes, focus returns, scroll resumes',
  route: '/components/overlays/sheet',
  sabotage: { afterOpen: unlockBody },
  run: (c) => scrollLockRun(c, { trigger: slotSel('sheet-trigger'), content: slotSel('sheet-content') }),
})

test({
  name: 'select: locks page scroll while open, arrows + Enter choose, Escape closes, focus returns',
  route: '/components/forms/select',
  sabotage: { afterOpen: unlockBody },
  async run({ page, hook }) {
    const trigger = slotSel('select-trigger')
    const content = slotSel('select-content')
    await scrollLockRun({ page, hook }, { trigger, content })
    // choose with the keyboard
    await page.focus(trigger)
    await page.keyboard.press('Enter')
    await until(page, 'select reopens', content, (s) => !!document.querySelector(s), content)
    const names = await page.$$eval('[role=option]', (o) => o.map((e) => (e.textContent ?? '').trim()))
    check(names.length >= 2, 'listbox has fewer than 2 options', '[role=option]')
    await sleep(150)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await until(page, 'listbox closes after Enter', content, (s) => !document.querySelector(s), content)
    const label = (await page.$eval(trigger, (e) => (e.textContent ?? '').trim()))
    check(names.includes(label), `trigger shows "${label}", not one of ${JSON.stringify(names)}`, trigger)
    check((await activeInfo(page)).slot === 'select-trigger', 'focus did not return to the select trigger', trigger)
  },
})

// 5. Slider and ResizablePanels: pointer, keyboard, RTL --------------------------------------------------------------
const valueNow = (page, sel) => page.$eval(sel, (e) => Number(e.getAttribute('aria-valuenow')))
for (const rtl of [false, true]) {
  test({
    name: `slider: click, drag and keys change the value${rtl ? ' (RTL page mirrors)' : ''}`,
    route: '/components/forms/slider',
    rtl,
    group: rtl ? 'slider-rtl' : 'slider',
    sabotage: { start: (page) => Promise.all([blockPointer(['pointerdown', 'mousedown'])(page), blockKeys(['ArrowLeft', 'ArrowRight', 'Home', 'End'])(page)]) },
    async run({ page, hook }) {
      const root = slotSel('slider')
      const thumb = '[role=slider]'
      await hook('start')
      await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), root)
      await sleep(100)
      const box = await (await page.$(root)).boundingBox()
      const y = box.y + box.height / 2
      const at = (f) => box.x + box.width * f
      check(await page.evaluate((s) => getComputedStyle(document.querySelector(s)).direction, root) === (rtl ? 'rtl' : 'ltr'), `slider direction is not ${rtl ? 'rtl' : 'ltr'}`, root)
      const start = await valueNow(page, thumb)
      await page.mouse.click(at(0.1), y)
      await until(page, 'click near the left edge changes the value', thumb, (v) => document.querySelector('[role=slider]').getAttribute('aria-valuenow') !== String(v), start)
      const nearLeft = await valueNow(page, thumb)
      await page.mouse.click(at(0.9), y)
      await until(page, 'click near the right edge changes the value', thumb, (v) => document.querySelector('[role=slider]').getAttribute('aria-valuenow') !== String(v), nearLeft)
      const nearRight = await valueNow(page, thumb)
      if (rtl) check(nearLeft > 70 && nearRight < 30, `RTL slider does not mirror: left click ${nearLeft}, right click ${nearRight} (expected high, low)`, thumb)
      else check(nearLeft < 30 && nearRight > 70, `left click ${nearLeft}, right click ${nearRight} (expected low, high)`, thumb)
      // drag the thumb towards the opposite end
      const tb = await (await page.$(thumb)).boundingBox()
      await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2)
      await page.mouse.down()
      await page.mouse.move(at(0.5), y, { steps: 6 })
      await page.mouse.up()
      await sleep(150)
      const dragged = await valueNow(page, thumb)
      check(dragged > 35 && dragged < 65, `dragging the thumb to the middle gave ${dragged}`, thumb)
      // keyboard: the arrow that points to the max end increases
      await page.focus(thumb)
      await page.keyboard.press('Shift')
      await expectFocusRing(page, thumb)
      await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight')
      await sleep(100)
      check((await valueNow(page, thumb)) === dragged + 1, `${rtl ? 'ArrowLeft' : 'ArrowRight'} did not add one step to ${dragged}`, thumb)
      await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft')
      await sleep(100)
      check((await valueNow(page, thumb)) === dragged, 'the opposite arrow did not step back', thumb)
      await page.keyboard.press('End'); await sleep(100)
      check((await valueNow(page, thumb)) === 100, 'End did not reach max', thumb)
      await page.keyboard.press('Home'); await sleep(100)
      check((await valueNow(page, thumb)) === 0, 'Home did not reach min', thumb)
    },
  })
  test({
    name: `resizable panels: drag and arrow keys resize${rtl ? ' (RTL page mirrors)' : ''}`,
    route: '/components/layout/resizable-panels',
    rtl,
    group: rtl ? 'resizable-rtl' : 'resizable',
    sabotage: { start: (page) => Promise.all([blockPointer(['pointerdown', 'mousedown'])(page), blockKeys(['ArrowLeft', 'ArrowRight', 'Home', 'End'])(page)]) },
    async run({ page, hook }) {
      const handle = slotSel('resizable-handle')
      await hook('start')
      await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), handle)
      await sleep(100)
      const first = () => page.evaluate(() => document.querySelector('[data-slot=resizable-panel]').getBoundingClientRect().width)
      const startValue = await valueNow(page, handle)
      const startWidth = await first()
      // The first panel is on the start side: dragging towards the end side grows it, in both directions of text.
      const hb = await (await page.$(handle)).boundingBox()
      const cx = hb.x + hb.width / 2
      const cy = hb.y + hb.height / 2
      check(await page.evaluate(([x, y, s]) => { const e = document.elementFromPoint(x, y); return !!e?.closest(s) }, [cx, cy, handle]), 'the resize handle is not hit-testable at its centre', handle)
      await page.mouse.move(cx, cy)
      await page.mouse.down()
      await page.mouse.move(cx + (rtl ? -60 : 60), cy, { steps: 6 })
      await page.mouse.up()
      await until(page, 'dragging towards the end side widens the first panel', handle, (w) => document.querySelector('[data-slot=resizable-panel]').getBoundingClientRect().width > w + 20, startWidth)
      const afterDrag = await valueNow(page, handle)
      check(afterDrag > startValue, `aria-valuenow did not grow after the drag (${startValue} to ${afterDrag})`, handle)
      await page.focus(handle)
      await page.keyboard.press('Shift')
      await expectFocusRing(page, handle)
      await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight')
      await until(page, 'the arrow towards the end side grows the first panel', handle, (v) => Number(document.querySelector('[data-slot=resizable-handle]').getAttribute('aria-valuenow')) > v, afterDrag)
      const grown = await valueNow(page, handle)
      await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft')
      await until(page, 'the opposite arrow shrinks it again', handle, (v) => Number(document.querySelector('[data-slot=resizable-handle]').getAttribute('aria-valuenow')) < v, grown)
      await page.keyboard.press('End')
      await until(page, 'End reaches aria-valuemax', handle, (s) => { const e = document.querySelector(s); return e.getAttribute('aria-valuenow') === e.getAttribute('aria-valuemax') }, handle)
      await page.keyboard.press('Home')
      await until(page, 'Home reaches aria-valuemin', handle, (s) => { const e = document.querySelector(s); return e.getAttribute('aria-valuenow') === e.getAttribute('aria-valuemin') }, handle)
    },
  })
}

// 6. Combobox --------------------------------------------------------------------------------------------------------
test({
  name: 'combobox: typeahead filters, arrows highlight, Enter selects, no-match state, Escape closes',
  route: '/components/forms/combobox',
  sabotage: { beforeKeys: blockKeys(['ArrowDown', 'Enter']) },
  async run({ page, hook }) {
    const input = slotSel('combobox-input')
    await page.click(input)
    const all = await (async () => { await page.keyboard.press('ArrowDown'); await until(page, 'listbox opens', '[role=listbox]', () => !!document.querySelector('[role=listbox]')); return page.$$eval('[role=option]', (o) => o.length) })()
    check(all >= 3, `only ${all} options in the unfiltered listbox`, '[role=option]')
    await page.keyboard.press('Escape')
    await page.keyboard.type('ty')
    await until(page, 'listbox shows filtered options', '[role=option]', (n) => { const o = [...document.querySelectorAll('[role=option]')]; return o.length > 0 && o.length < n }, all)
    const names = await page.$$eval('[role=option]', (o) => o.map((e) => (e.textContent ?? '').trim()))
    check(names.every((t) => t.toLowerCase().includes('ty')), `typeahead "ty" left non-matching options: ${JSON.stringify(names)}`, '[role=option]')
    check((await page.$eval(input, (e) => e.getAttribute('aria-expanded'))) === 'true', 'aria-expanded is not true while the listbox shows', input)
    await hook('beforeKeys')
    await page.keyboard.press('ArrowDown')
    const ad = await until(page, 'ArrowDown sets aria-activedescendant to a highlighted option', input, (s) => { const id = document.querySelector(s).getAttribute('aria-activedescendant'); const o = id && document.getElementById(id); return o && o.hasAttribute('data-highlighted') ? id : false }, input)
    check(!!ad, 'no active descendant', input)
    await page.keyboard.press('Enter')
    await until(page, 'Enter closes the listbox', '[role=listbox]', () => !document.querySelector('[role=listbox]'))
    const chosen = await page.$eval(input, (e) => e.value)
    check(names.includes(chosen), `input shows "${chosen}", not one of ${JSON.stringify(names)}`, input)
    check((await activeInfo(page)).slot === 'combobox-input', 'focus left the input after choosing', input)
    // no match
    await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control')
    await page.keyboard.press('Backspace')
    await page.keyboard.type('zzzz')
    await until(page, 'no options for a query that matches nothing', '[role=option]', () => !!document.querySelector('[role=listbox]') && document.querySelectorAll('[role=option]').length === 0)
    check(await page.$eval('[role=listbox]', (e) => (e.textContent ?? '').trim().length > 0), 'empty state has no text', '[role=listbox]')
    await page.keyboard.press('Escape')
    await until(page, 'Escape closes the listbox', '[role=listbox]', () => !document.querySelector('[role=listbox]'))
    check((await activeInfo(page)).slot === 'combobox-input', 'focus left the input after Escape', input)
    await expectFocusRing(page, input)
  },
})

// 7. Toasts ----------------------------------------------------------------------------------------------------------
const toastButtons = (page) => page.$$('[data-testid=example-preview] [data-slot=button]')
test({
  name: 'toast: announced in the status region, close button dismisses it',
  route: '/components/feedback/toaster',
  sabotage: { beforeClose: blockPointer(['click', 'pointerdown', 'mousedown', 'pointerup', 'mouseup']) },
  async run({ page, hook }) {
    const toast = slotSel('toast')
    const [success] = await toastButtons(page)
    await success.click()
    await until(page, 'toast appears', toast, (s) => !!document.querySelector(s), toast)
    check((await page.$eval(slotSel('toaster-status'), (e) => (e.textContent ?? '').trim())).length > 0, 'status live region stayed empty', slotSel('toaster-status'))
    const dismiss = `${toast} ${slotSel('toast-dismiss')}`
    check(!!(await page.$eval(dismiss, (e) => e.getAttribute('aria-label'))), 'dismiss button has no accessible name', dismiss)
    const box = await (await page.$(dismiss)).boundingBox()
    check(box.width >= 24 && box.height >= 24, `dismiss button is ${box.width}x${box.height}, under 24px`, dismiss)
    await hook('beforeClose')
    await page.click(dismiss)
    await until(page, 'toast removed after the close button', toast, (s) => !document.querySelector(s), toast)
  },
})

test({
  name: 'toast: keyboard dismiss (close button and Escape) returns focus to where it was',
  route: '/components/feedback/toaster',
  sabotage: { afterFocusIn: (page) => page.evaluate(() => { [...document.querySelectorAll('[data-testid=example-preview] [data-slot=button]')][2].remove() }) },
  async run({ page, hook }) {
    const toast = slotSel('toast')
    const trigger = (await toastButtons(page))[2] // "With action"
    await page.evaluate((el) => { el.dataset.bt = 'trigger' }, trigger)
    await trigger.focus()
    await page.keyboard.press('Enter')
    await until(page, 'toast with an action appears', toast, (s) => !!document.querySelector(s), toast)
    await page.keyboard.press('Tab')
    check((await activeInfo(page)).slot === 'toast-action', `Tab from the trigger should reach the toast action, got ${JSON.stringify(await activeInfo(page))}`, `${toast} ${slotSel('toast-action')}`)
    await page.keyboard.press('Tab')
    check((await activeInfo(page)).slot === 'toast-dismiss', 'second Tab should reach the dismiss button', slotSel('toast-dismiss'))
    await expectFocusRing(page, slotSel('toast-dismiss'))
    await hook('afterFocusIn')
    await page.keyboard.press('Enter')
    await until(page, 'toast removed by keyboard', toast, (s) => !document.querySelector(s), toast)
    await until(page, 'focus returns to the control that was focused before the toast', '[data-bt=trigger]', () => document.activeElement?.getAttribute('data-bt') === 'trigger')
    // Escape on a focused toast
    await page.keyboard.press('Enter')
    await until(page, 'second toast appears', toast, (s) => !!document.querySelector(s), toast)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Escape')
    await until(page, 'Escape dismisses the focused toast', toast, (s) => !document.querySelector(s), toast)
    await until(page, 'focus returns to the trigger after Escape', '[data-bt=trigger]', () => document.activeElement?.getAttribute('data-bt') === 'trigger')
  },
})

// 8. Theme controls: change <html data-*> and survive a reload --------------------------------------------------------
const htmlState = (page) => page.evaluate(() => ({ dark: document.documentElement.classList.contains('dark'), theme: document.documentElement.getAttribute('data-theme'), style: document.documentElement.getAttribute('data-style'), saved: JSON.parse(localStorage.getItem('pd-theme') ?? '{}') }))
const noPersist = (page) => page.evaluate(() => { Storage.prototype.setItem = () => {} })
async function reloadClean(page) {
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForSelector('h1')
  await until(page, 'examples live after reload', '[data-testid=example-preview]', () => [...document.querySelectorAll('[data-testid=example-preview]')].every((e) => e.getAttribute('aria-busy') === 'false'))
}

test({
  name: 'theme toggle: flips class=dark on <html> and persists across a reload',
  route: '/components/navigation/theme-toggle',
  theme: null,
  sabotage: { beforeClick: noPersist },
  async run({ page, hook }) {
    const toggle = slotSel('theme-toggle')
    check(!(await htmlState(page)).dark, '<html> starts dark although the light scheme is emulated', 'html')
    await hook('beforeClick')
    let guard = 0
    while ((await page.$eval(toggle, (e) => e.getAttribute('data-mode'))) !== 'dark' && guard++ < 4) { await page.click(toggle); await sleep(120) }
    check((await htmlState(page)).dark, 'toggle never added class "dark" to <html>', 'html')
    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    await reloadClean(page)
    const after = await htmlState(page)
    check(after.dark, 'class "dark" is gone from <html> after reload', 'html')
    check((await page.$eval(toggle, (e) => e.getAttribute('data-mode'))) === 'dark', 'toggle does not show dark mode after reload', toggle)
    check((await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === before, 'page background differs after reload', 'body')
  },
})

test({
  name: 'style picker: sets <html data-style>, arrow keys rove, choice persists across a reload',
  route: '/components/navigation/style-picker',
  theme: null,
  sabotage: { beforeClick: noPersist },
  async run({ page, hook }) {
    const opt = (s) => `${slotSel('style-picker-option')}[data-style-option=${s}]`
    check((await htmlState(page)).style === null, '<html> already has data-style before any choice', 'html')
    await hook('beforeClick')
    await page.click(opt('terminal'))
    await until(page, '<html data-style=terminal> after the click', 'html', () => document.documentElement.getAttribute('data-style') === 'terminal')
    check((await page.$eval(opt('terminal'), (e) => e.getAttribute('aria-checked'))) === 'true', 'terminal option is not aria-checked', opt('terminal'))
    await page.focus(opt('terminal'))
    await page.keyboard.press('Shift')
    await page.keyboard.press('ArrowLeft')
    await until(page, 'ArrowLeft moves the selection to the previous pack', 'html', () => document.documentElement.getAttribute('data-style') === 'contrast')
    await page.keyboard.press('ArrowRight')
    await until(page, 'ArrowRight moves back to terminal', 'html', () => document.documentElement.getAttribute('data-style') === 'terminal')
    await reloadClean(page)
    check((await htmlState(page)).style === 'terminal', '<html data-style> is not terminal after reload', 'html')
    check((await page.$eval(opt('terminal'), (e) => e.getAttribute('aria-checked'))) === 'true', 'picker does not show terminal after reload', opt('terminal'))
    await page.click(opt('quiet'))
    await until(page, 'choosing quiet removes data-style', 'html', () => !document.documentElement.hasAttribute('data-style'))
  },
})

test({
  name: 'accent picker: sets <html data-theme>, changes the primary colour, persists across a reload',
  route: '/components/navigation/accent-picker',
  theme: null,
  sabotage: { beforeClick: noPersist },
  async run({ page, hook }) {
    const sw = (a) => `${slotSel('accent-picker-swatch')}[data-accent=${a}]`
    check((await htmlState(page)).theme === null, '<html> already has data-theme before any choice', 'html')
    const primary = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim())
    const p0 = await primary()
    await hook('beforeClick')
    await page.click(sw('emerald'))
    await until(page, '<html data-theme=emerald> after the click', 'html', () => document.documentElement.getAttribute('data-theme') === 'emerald')
    check((await primary()) !== p0, `--primary did not change when the accent switched (still ${p0})`, 'html')
    check((await page.$eval(sw('emerald'), (e) => e.getAttribute('aria-checked'))) === 'true', 'emerald swatch is not aria-checked', sw('emerald'))
    await reloadClean(page)
    check((await htmlState(page)).theme === 'emerald', '<html data-theme> is not emerald after reload', 'html')
    check((await page.$eval(sw('emerald'), (e) => e.getAttribute('aria-checked'))) === 'true', 'picker does not show emerald after reload', sw('emerald'))
    await page.click(sw('default'))
    await until(page, 'choosing default removes data-theme', 'html', () => !document.documentElement.hasAttribute('data-theme'))
  },
})

// 9. Button targets in every style pack ------------------------------------------------------------------------------
const PACKS = ['quiet', 'workbench', 'tactile', 'editorial', 'raw', 'contrast', 'terminal']
for (const style of PACKS) {
  test({
    name: `button targets are at least 24px in the "${style}" pack`,
    route: '/components/primitives/button',
    theme: { mode: 'light', accent: 'default', style },
    group: 'button-targets',
    sabotage: { start: css('[data-slot=button]{min-height:0 !important;height:14px !important;padding-block:0 !important;transition:none !important}') },
    async run({ page, hook }) {
      const btn = `${slotSel('button')}`
      const actual = await page.evaluate(() => document.documentElement.getAttribute('data-style'))
      check((style === 'quiet' ? null : style) === actual, `<html data-style> is "${actual}", expected "${style}"`, 'html')
      await hook('start')
      const r = await page.evaluate((s) => {
        const all = [...document.querySelectorAll(`[data-testid=example-preview] ${s}`)].filter((e) => e.getClientRects().length > 0)
        const small = all.filter((e) => { const b = e.getBoundingClientRect(); return b.width < 23.99 || b.height < 23.99 }).map((e) => `"${(e.textContent ?? '').trim().slice(0, 20) || e.getAttribute('aria-label') || '(icon)'}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)} size=${e.dataset.size ?? ''}`)
        return { n: all.length, small }
      }, btn)
      check(r.n >= 10, `only ${r.n} buttons found on the page`, btn)
      check(r.small.length === 0, `${r.small.length} of ${r.n} buttons under 24px: ${r.small.slice(0, 4).join('; ')}`, btn)
    },
  })
}

// ---------------------------------------------------------------------------------------------------------------------
// runner

const selected = tests.filter((t) => (t.route + t.name).includes(match))
const missing = selected.filter((t) => !t.sabotage || !Object.keys(t.sabotage).length)
if (missing.length) {
  console.error(`tests without a sabotage (negative self-check): ${missing.map((t) => t.name).join('; ')}`)
  process.exit(1)
}

const browser = await launch()
async function execute(t, sabotaged) {
  let o
  try {
    o = await openRoute(browser, base, t.route, { width: t.width, rtl: t.rtl, ...(t.theme !== undefined ? { theme: t.theme } : {}) })
  } catch (e) {
    return new TestFailure(`page did not load: ${String(e?.message ?? e).split('\n')[0]}`, 'h1')
  }
  const hook = async (stage) => { if (sabotaged && t.sabotage[stage]) await t.sabotage[stage](o.page) }
  try {
    let timer
    const limit = new Promise((_, rej) => { timer = setTimeout(() => rej(new TestFailure('test exceeded 40s (a step hung)', '')), 40000) })
    try { await Promise.race([t.run({ page: o.page, hook }), limit]) } finally { clearTimeout(timer) }
    return null
  } catch (e) {
    return e instanceof TestFailure ? e : Object.assign(new TestFailure(`unexpected error: ${String(e?.message ?? e).split('\n')[0]}`, ''), { stack: e?.stack })
  } finally {
    await o.close().catch(() => {})
  }
}

const doneGroups = new Set()
const queue = selected.map((t) => ({ t }))
const results = []
async function worker() {
  while (queue.length) {
    const { t } = queue.shift()
    const started = Date.now()
    const label = `${t.name} @${t.width}px${t.rtl ? ' rtl' : ''}`
    let failure = await execute(t, false)
    // One retry for a flaky first load, but never mask a real failure: it must fail twice.
    if (failure) failure = (await execute(t, false)) && failure
    let selfFailure = null
    const needsSelf = selfCheck && !failure && !(t.group && doneGroups.has(t.group))
    if (needsSelf) {
      if (t.group) doneGroups.add(t.group)
      const broken = await execute(t, true)
      if (!broken) selfFailure = new TestFailure('the test still PASSED with its sabotage applied, so it cannot detect this regression', '(self-check)')
    }
    process.stderr.write(`  done ${label}${failure ? ' (FAILED)' : ''}\n`)
    results.push({ t, label, failure, selfFailure, ms: Date.now() - started, selfChecked: needsSelf })
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, worker))
await browser.close()

let failed = 0
for (const r of results.sort((a, b) => a.t.route.localeCompare(b.t.route))) {
  const bad = r.failure ?? r.selfFailure
  if (bad) failed++
  const tag = r.failure ? 'FAIL' : r.selfFailure ? 'SELF-CHECK FAILED' : 'ok'
  console.log(`${tag.padEnd(5)} ${r.t.route} :: ${r.label}${r.selfChecked && !bad ? '  (negative self-check ok)' : ''}  ${(r.ms / 1000).toFixed(1)}s`)
  if (bad) console.log(`        selector: ${bad.selector || '-'}\n        ${bad.message}`)
}
console.log(`\n${results.length - failed}/${results.length} behaviour tests passed${selfCheck ? ' (each proven able to fail)' : ''}.`)
process.exit(failed ? 1 : 0)
