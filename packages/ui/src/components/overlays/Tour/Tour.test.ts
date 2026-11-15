import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Tour from './Tour.vue'
import type { TourStep } from './Tour.vue'
import { tourCardVariants } from './variants'
import { computeTourPosition, isTourPlacement, resolveTourTarget } from './position'

const steps: TourStep[] = [
  { target: '#t-a', title: 'First', description: 'Desc one' },
  { target: '#t-b', title: 'Second', placement: 'top' },
  { target: '#missing', title: 'Third', description: 'No target here' },
]

function rect(el: Element, r: { top: number; left: number; width: number; height: number }) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    ...r,
    x: r.left,
    y: r.top,
    right: r.left + r.width,
    bottom: r.top + r.height,
    toJSON: () => ({}),
  } as DOMRect)
}

let wrappers: VueWrapper[] = []
function make(props: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) {
  const w = mount(Tour, { props: { steps, open: true, teleport: false, ...props }, attachTo: document.body, ...opts })
  wrappers.push(w)
  return w
}
const flush = async () => {
  await nextTick()
  await nextTick()
}

beforeEach(() => {
  document.body.innerHTML = `<button id="opener">open</button><div id="t-a"></div><div id="t-b"></div>`
  rect(document.getElementById('t-a')!, { top: 100, left: 100, width: 80, height: 30 })
  rect(document.getElementById('t-b')!, { top: 400, left: 300, width: 80, height: 30 })
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

const card = (w: VueWrapper) => w.find('[data-slot="tour-card"]')
const click = (w: VueWrapper, part: string) => w.find(`[data-slot="tour-${part}"]`).trigger('click')
const key = (k: string, init: KeyboardEventInit = {}) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }))

describe('Tour good path', () => {
  it('renders nothing when closed (default)', () => {
    const w = mount(Tour, { props: { steps, teleport: false } })
    expect(w.find('[data-slot="tour"]').exists()).toBe(false)
  })

  it('renders step content, dialog semantics and progress', async () => {
    const w = make()
    await flush()
    expect(w.find('[data-slot="tour"]').exists()).toBe(true)
    const c = card(w)
    expect(c.attributes('role')).toBe('dialog')
    expect(c.attributes('aria-modal')).toBe('true')
    expect(w.find('[data-slot="tour-title"]').text()).toBe('First')
    expect(c.attributes('aria-labelledby')).toBe(w.find('[data-slot="tour-title"]').attributes('id'))
    expect(c.attributes('aria-describedby')).toBe(`${w.find('[data-slot="tour-description"]').attributes('id')} ${w.find('[data-slot="tour-progress"]').attributes('id')}`)
    expect(w.find('[data-slot="tour-progress"]').text()).toBe('1 / 3')
    expect(w.find('[data-slot="tour-prev"]').exists()).toBe(false)
    expect(w.find('[data-slot="tour-skip"]').exists()).toBe(true)
  })

  it('positions spotlight from the target rect with padding', async () => {
    const w = make({ padding: 10 })
    await flush()
    const s = w.find('[data-slot="tour-spotlight"]')
    expect(s.attributes('style')).toContain('top: 90px')
    expect(s.attributes('style')).toContain('left: 90px')
    expect(s.attributes('style')).toContain('width: 100px')
    expect(s.attributes('style')).toContain('height: 50px')
  })

  it('places the card below the target by default and uses step placement', async () => {
    const w = make()
    await flush()
    expect(card(w).attributes('data-placement')).toBe('bottom')
    await click(w, 'next')
    await flush()
    expect(card(w).attributes('data-placement')).toBe('top')
  })

  it('next/prev walk steps (uncontrolled) and emit', async () => {
    const w = make({ open: undefined, defaultOpen: true })
    await flush()
    await click(w, 'next')
    await flush()
    expect(w.find('[data-slot="tour-title"]').text()).toBe('Second')
    expect(w.find('[data-slot="tour-progress"]').text()).toBe('2 / 3')
    expect(w.emitted('next')![0]).toEqual([1])
    expect(w.emitted('update:step')![0]).toEqual([1])
    await click(w, 'prev')
    await flush()
    expect(w.find('[data-slot="tour-title"]').text()).toBe('First')
    expect(w.emitted('prev')![0]).toEqual([0])
  })

  it('last step shows Finish; finishing closes and resets step', async () => {
    const w = make({ open: undefined, defaultOpen: true, defaultStep: 2 })
    await flush()
    expect(w.find('[data-slot="tour-next"]').text()).toBe('Finish')
    expect(w.find('[data-slot="tour-skip"]').exists()).toBe(false)
    await click(w, 'next')
    expect(w.emitted('finish')).toHaveLength(1)
    expect(w.emitted('update:open')!.at(-1)).toEqual([false])
    expect(w.emitted('update:step')!.at(-1)).toEqual([0])
    expect(w.find('[data-slot="tour"]').exists()).toBe(false)
  })

  it('skip closes and emits the index it was skipped at', async () => {
    const w = make({ step: 1 })
    await flush()
    await click(w, 'skip')
    expect(w.emitted('skip')![0]).toEqual([1])
    expect(w.emitted('update:open')![0]).toEqual([false])
  })

  it('controlled open/step follow props', async () => {
    const w = make({ open: true, step: 0 })
    await flush()
    await click(w, 'next')
    // still on step 0 until parent updates
    expect(w.find('[data-slot="tour-title"]').text()).toBe('First')
    await w.setProps({ step: 1 })
    await flush()
    expect(w.find('[data-slot="tour-title"]').text()).toBe('Second')
    await w.setProps({ open: false })
    expect(w.find('[data-slot="tour"]').exists()).toBe(false)
  })

  it('start() opens at a given step via exposed API', async () => {
    const w = make({ open: undefined, defaultOpen: false })
    expect(w.find('[data-slot="tour"]').exists()).toBe(false)
    ;(w.vm as unknown as { start: (n?: number) => void }).start(1)
    await flush()
    expect(w.find('[data-slot="tour-title"]').text()).toBe('Second')
    expect(w.emitted('update:open')![0]).toEqual([true])
  })

  it('supports title/description slots with scope and custom labels', async () => {
    const w = make(
      { nextLabel: 'Go', skipLabel: 'Nope', progressFormat: (c: number, t: number) => `step ${c} of ${t}` },
      { slots: { title: '<template #title="{ index, total }">T{{ index }}/{{ total }}</template>', description: '<template #description="{ step }">D {{ step.title }}</template>' } },
    )
    await flush()
    expect(w.find('[data-slot="tour-title"]').text()).toBe('T0/3')
    expect(w.find('[data-slot="tour-description"]').text()).toBe('D First')
    expect(w.find('[data-slot="tour-next"]').text()).toBe('Go')
    expect(w.find('[data-slot="tour-skip"]').text()).toBe('Nope')
    expect(w.find('[data-slot="tour-progress"]').text()).toBe('step 1 of 3')
  })

  it('teleports to body by default', async () => {
    const w = mount(Tour, { props: { steps, open: true }, attachTo: document.body })
    wrappers.push(w)
    await flush()
    expect(document.body.querySelector('[data-slot="tour"]')).not.toBeNull()
    expect(w.find('[data-slot="tour"]').exists()).toBe(false)
  })
})

describe('Tour customisation', () => {
  it('merges class last on root and cardClass on card, passes attrs, data-slot', async () => {
    const w = make({ class: 'custom-root z-10', cardClass: 'custom-card w-40' }, { attrs: { 'data-testid': 'tour-x', id: 'tr' } })
    await flush()
    const root = w.find('[data-slot="tour"]')
    expect(root.classes()).toContain('custom-root')
    expect(root.classes()).toContain('z-10')
    expect(root.classes()).not.toContain('z-(--z-overlay)')
    expect(root.attributes('data-testid')).toBe('tour-x')
    expect(root.attributes('id')).toBe('tr')
    expect(card(w).classes()).toContain('custom-card')
    expect(card(w).classes()).toContain('w-40')
    expect(card(w).classes()).not.toContain('w-80')
  })

  it.each(['sm', 'md', 'lg'] as const)('size %s', async (size) => {
    const w = make({ size })
    await flush()
    expect(card(w).classes().join(' ')).toContain(tourCardVariants({ size }).match(/w-\d+/)![0])
  })

  it('hides progress and skip when disabled', async () => {
    const w = make({ showProgress: false, showSkip: false })
    await flush()
    expect(w.find('[data-slot="tour-progress"]').exists()).toBe(false)
    expect(w.find('[data-slot="tour-skip"]').exists()).toBe(false)
  })

  it('omits description element and aria-describedby when there is none', async () => {
    const w = make({ steps: [{ title: 'Only' }], showProgress: false })
    await flush()
    expect(w.find('[data-slot="tour-description"]').exists()).toBe(false)
    expect(card(w).attributes('aria-describedby')).toBeUndefined()
  })

  it('describes the card with the progress text when there is no description', async () => {
    const w = make({ steps: [{ title: 'Only' }, { title: 'Two' }] })
    await flush()
    expect(card(w).attributes('aria-describedby')).toBe(w.find('[data-slot="tour-progress"]').attributes('id'))
  })

  it('draws the spotlight cut-out from four opaque scrim panels, with no box-shadow or blur', async () => {
    const w = make()
    await flush()
    const doc = document.body
    expect(doc.querySelectorAll('[data-slot="tour-scrim"]').length).toBe(w.find('[data-slot="tour-spotlight"]').exists() ? 4 : 0)
    expect(w.find('[data-slot="tour-spotlight"]').exists() ? w.find('[data-slot="tour-spotlight"]').attributes('class') : '').not.toMatch(/shadow|blur/)
  })

  it('accepts element and getter targets', async () => {
    const el = document.getElementById('t-b')!
    const w = make({ steps: [{ target: el, title: 'El' }, { target: () => document.getElementById('t-a'), title: 'Fn' }] })
    await flush()
    expect(w.find('[data-slot="tour-spotlight"]').exists()).toBe(true)
    await click(w, 'next')
    await flush()
    expect(w.find('[data-slot="tour-spotlight"]').exists()).toBe(true)
  })

  it('closeOnOverlayClick controls backdrop click', async () => {
    const w = make()
    await flush()
    await w.find('[data-slot="tour-backdrop"]').trigger('click')
    expect(w.emitted('skip')).toBeUndefined()
    await w.setProps({ closeOnOverlayClick: true })
    await w.find('[data-slot="tour-backdrop"]').trigger('click')
    expect(w.emitted('skip')).toHaveLength(1)
  })

  it('scrollIntoView can be disabled', async () => {
    const spy = vi.spyOn(document.getElementById('t-a')!, 'scrollIntoView')
    make({ scrollIntoView: false })
    await flush()
    expect(spy).not.toHaveBeenCalled()
  })

  it('reacts to placement/padding changes', async () => {
    const w = make()
    await flush()
    await w.setProps({ padding: 0 })
    await flush()
    expect(w.find('[data-slot="tour-spotlight"]').attributes('style')).toContain('width: 80px')
  })
})

describe('Tour bad path', () => {
  it('renders nothing for empty / invalid steps even when open', async () => {
    for (const s of [[], undefined, null, [null, 5]]) {
      const w = make({ steps: s })
      await flush()
      expect(w.find('[data-slot="tour"]').exists()).toBe(false)
    }
  })

  it('missing target: centred card with scrim, no spotlight', async () => {
    const w = make({ step: 2 })
    await flush()
    expect(w.find('[data-slot="tour-spotlight"]').exists()).toBe(false)
    expect(w.find('[data-slot="tour-backdrop"]').classes()).toContain('bg-scrim')
    expect(card(w).attributes('data-placement')).toBe('center')
  })

  it('invalid selector, throwing getter, detached and zero-size targets are treated as missing', async () => {
    const detached = document.createElement('div')
    const hidden = document.createElement('div')
    document.body.appendChild(hidden)
    const w = make({
      step: 0,
      steps: [{ target: '###bad[', title: 'a' }, { target: () => { throw new Error('x') }, title: 'b' }, { target: detached, title: 'c' }, { target: hidden, title: 'd' }, { target: '  ', title: 'e' }],
    })
    for (let i = 0; i < 5; i++) {
      await w.setProps({ step: i })
      await flush()
      expect(w.find('[data-slot="tour-spotlight"]').exists(), `step ${i}`).toBe(false)
      expect(w.find('[data-slot="tour-card"]').exists()).toBe(true)
    }
  })

  it.each([NaN, -5, 99, 1.9, Infinity])('step %s is clamped into range', async (step) => {
    const w = make({ step })
    await flush()
    const n = Number(w.find('[data-slot="tour-progress"]').text().split(' ')[0])
    expect(n).toBeGreaterThanOrEqual(1)
    expect(n).toBeLessThanOrEqual(3)
  })

  it('invalid placement falls back to bottom; NaN padding/offset do not break', async () => {
    const w = make({ steps: [{ target: '#t-a', title: 'x', placement: 'weird' as never }], padding: NaN, offset: NaN })
    await flush()
    expect(card(w).attributes('data-placement')).toBe('bottom')
    expect(w.find('[data-slot="tour-spotlight"]').attributes('style')).toContain('width: 80px')
  })

  it('actions are no-ops while closed', async () => {
    const w = make({ open: false })
    const api = w.vm as unknown as Record<string, () => void>
    api.next()
    api.prev()
    api.skip()
    api.finish()
    expect(w.emitted()).toEqual({})
  })

  it('prev on first step does nothing', async () => {
    const w = make()
    await flush()
    ;(w.vm as unknown as { prev: () => void }).prev()
    expect(w.emitted('prev')).toBeUndefined()
  })

  it('does not throw when scrollIntoView is unavailable', async () => {
    const el = document.getElementById('t-a') as unknown as { scrollIntoView?: unknown }
    el.scrollIntoView = undefined
    const w = make()
    await flush()
    expect(w.find('[data-slot="tour-spotlight"]').exists()).toBe(true)
  })
})

describe('Tour keyboard and focus', () => {
  it('Esc skips; ArrowRight/ArrowLeft navigate', async () => {
    const w = make({ open: undefined, defaultOpen: true })
    await flush()
    key('ArrowRight')
    await flush()
    expect(w.find('[data-slot="tour-title"]').text()).toBe('Second')
    key('ArrowLeft')
    await flush()
    expect(w.find('[data-slot="tour-title"]').text()).toBe('First')
    key('Escape')
    await flush()
    expect(w.emitted('skip')).toHaveLength(1)
    expect(w.find('[data-slot="tour"]').exists()).toBe(false)
  })

  it('closeOnEscape=false ignores Esc; unrelated keys and prevented events ignored', async () => {
    const w = make({ closeOnEscape: false })
    await flush()
    key('Escape')
    key('a')
    key('ArrowRight', { cancelable: true })
    expect(w.emitted('skip')).toBeUndefined()
    const e = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true })
    e.preventDefault()
    await w.setProps({ closeOnEscape: true })
    document.dispatchEvent(e)
    expect(w.emitted('skip')).toBeUndefined()
  })

  it('moves focus to card and restores it on close', async () => {
    const opener = document.getElementById('opener')!
    opener.focus()
    const w = make({ open: false })
    await w.setProps({ open: true })
    await flush()
    expect(document.activeElement).toBe(card(w).element)
    await w.setProps({ open: false })
    await flush()
    expect(document.activeElement).toBe(opener)
  })

  it('refocuses card on step change', async () => {
    const w = make({ open: undefined, defaultOpen: true })
    await flush()
    ;(w.find('[data-slot="tour-next"]').element as HTMLElement).focus()
    await click(w, 'next')
    await flush()
    expect(document.activeElement).toBe(card(w).element)
  })

  it('does not restore focus to a removed element', async () => {
    const opener = document.getElementById('opener')!
    opener.focus()
    const w = make({ open: false })
    await w.setProps({ open: true })
    await flush()
    opener.remove()
    await w.setProps({ open: false })
    await flush()
    expect(document.activeElement).not.toBe(opener)
  })

  it('traps Tab inside the card', async () => {
    const w = make({ step: 1 })
    await flush()
    const btns = card(w).findAll('button').map((b) => b.element as HTMLElement)
    const first = btns[0]
    const last = btns[btns.length - 1]
    last.focus()
    const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true })
    document.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
    const back = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true, bubbles: true })
    document.dispatchEvent(back)
    expect(back.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
    ;(card(w).element as HTMLElement).focus()
    const fromCard = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true, bubbles: true })
    document.dispatchEvent(fromCard)
    expect(document.activeElement).toBe(last)
    // focus outside the card is pulled in
    ;(document.getElementById('opener') as HTMLElement).focus()
    const out = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true })
    document.dispatchEvent(out)
    expect(document.activeElement).toBe(first)
    // middle button: default Tab behaviour left alone
    btns[1].focus()
    const mid = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true })
    document.dispatchEvent(mid)
    expect(mid.defaultPrevented).toBe(false)
  })

  it('Tab with no focusable element is prevented', async () => {
    const w = make()
    await flush()
    card(w).element.querySelectorAll('button').forEach((b) => b.setAttribute('disabled', ''))
    const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true })
    document.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(true)
  })
})

describe('Tour layout, listeners and cleanup', () => {
  it('scrolls the target into view with smooth/auto depending on reduced motion', async () => {
    const spy = vi.spyOn(document.getElementById('t-a')!, 'scrollIntoView')
    make()
    await flush()
    expect(spy).toHaveBeenCalledWith({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    spy.mockClear()
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    make({ step: 0, open: false }).setProps({ open: true })
    await flush()
    expect(spy).toHaveBeenCalledWith({ block: 'center', inline: 'nearest', behavior: 'auto' })
  })

  it('recomputes on resize and scroll', async () => {
    const w = make()
    await flush()
    const a = document.getElementById('t-a')!
    rect(a, { top: 200, left: 50, width: 80, height: 30 })
    window.dispatchEvent(new Event('resize'))
    await flush()
    expect(w.find('[data-slot="tour-spotlight"]').attributes('style')).toContain('top: 194px')
    rect(a, { top: 10, left: 50, width: 80, height: 30 })
    document.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    await flush()
    expect(w.find('[data-slot="tour-spotlight"]').attributes('style')).toContain('top: 4px')
  })

  it('adds listeners only while open and removes them on close and unmount', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const w = make({ open: false })
    expect(add.mock.calls.filter((c) => c[0] === 'resize')).toHaveLength(0)
    await w.setProps({ open: true })
    await flush()
    expect(add.mock.calls.filter((c) => c[0] === 'resize')).toHaveLength(1)
    expect(add.mock.calls.filter((c) => c[0] === 'scroll')).toHaveLength(1)
    await w.setProps({ open: false })
    await flush()
    expect(remove.mock.calls.filter((c) => c[0] === 'resize')).toHaveLength(1)
    // rapid toggle
    for (let i = 0; i < 5; i++) {
      await w.setProps({ open: true })
      await w.setProps({ open: false })
    }
    await flush()
    expect(add.mock.calls.filter((c) => c[0] === 'resize').length).toBe(remove.mock.calls.filter((c) => c[0] === 'resize').length)
    await w.setProps({ open: true })
    await flush()
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(add.mock.calls.filter((c) => c[0] === 'resize').length).toBe(remove.mock.calls.filter((c) => c[0] === 'resize').length)
    // no handlers fire after unmount
    key('Escape')
  })

  it('leaves no scroll lock or body style behind', async () => {
    const w = make()
    await flush()
    expect(document.body.style.overflow).toBe('')
    w.unmount()
    wrappers = []
    expect(document.body.style.overflow).toBe('')
    expect(document.body.getAttribute('style')).toBeNull()
    expect(document.body.querySelector('[data-slot="tour"]')).toBeNull()
  })

  it('mounting open at once (onMounted path) wires focus and listeners', async () => {
    const w = make()
    await flush()
    expect(document.activeElement).toBe(card(w).element)
  })

  it('handles 10 000 steps', async () => {
    const many = Array.from({ length: 10000 }, (_, i) => ({ title: `S${i}` }))
    const w = make({ steps: many, step: 9999 })
    await flush()
    expect(w.find('[data-slot="tour-progress"]').text()).toBe('10000 / 10000')
    expect(w.find('[data-slot="tour-next"]').text()).toBe('Finish')
  })
})

describe('computeTourPosition / helpers', () => {
  const vp = { width: 1000, height: 800 }
  const card = { width: 200, height: 100 }
  const t = { top: 300, left: 400, width: 100, height: 50 }

  it('places on each side, centred on the cross axis', () => {
    expect(computeTourPosition(t, card, vp, 'bottom', 10)).toEqual({ top: 360, left: 350, placement: 'bottom' })
    expect(computeTourPosition(t, card, vp, 'top', 10)).toEqual({ top: 190, left: 350, placement: 'top' })
    expect(computeTourPosition(t, card, vp, 'left', 10)).toEqual({ top: 275, left: 190, placement: 'left' })
    expect(computeTourPosition(t, card, vp, 'right', 10)).toEqual({ top: 275, left: 510, placement: 'right' })
  })

  it('flips when preferred side overflows and the opposite fits', () => {
    expect(computeTourPosition({ ...t, top: 700 }, card, vp, 'bottom').placement).toBe('top')
    expect(computeTourPosition({ ...t, top: 20 }, card, vp, 'top').placement).toBe('bottom')
    expect(computeTourPosition({ ...t, left: 900 }, card, vp, 'right').placement).toBe('left')
    expect(computeTourPosition({ ...t, left: 10 }, card, vp, 'left').placement).toBe('right')
  })

  it('does not flip when neither side fits, and clamps into the viewport', () => {
    const tiny = { width: 300, height: 300 }
    const p = computeTourPosition({ top: 100, left: 100, width: 50, height: 100 }, { width: 200, height: 400 }, tiny, 'bottom')
    expect(p.placement).toBe('bottom')
    expect(p.top).toBe(8)
    const edge = computeTourPosition({ top: 0, left: 0, width: 10, height: 10 }, card, vp, 'bottom')
    expect(edge.left).toBe(8)
    const far = computeTourPosition({ top: 0, left: 995, width: 10, height: 10 }, card, vp, 'bottom')
    expect(far.left).toBe(1000 - 200 - 8)
  })

  it('centres without a target and survives NaN input', () => {
    expect(computeTourPosition(null, card, vp)).toEqual({ top: 350, left: 400, placement: 'center' })
    const bad = computeTourPosition({ top: NaN, left: NaN, width: NaN, height: NaN }, { width: NaN, height: NaN }, { width: NaN, height: NaN }, 'x' as never)
    expect(Number.isFinite(bad.top) && Number.isFinite(bad.left)).toBe(true)
    expect(bad.placement).toBe('bottom')
  })

  it('isTourPlacement / resolveTourTarget', () => {
    expect(isTourPlacement('top')).toBe(true)
    expect(isTourPlacement('center')).toBe(false)
    expect(resolveTourTarget(null)).toBeNull()
    expect(resolveTourTarget(42)).toBeNull()
    expect(resolveTourTarget('#t-a')).toBe(document.getElementById('t-a'))
    expect(resolveTourTarget(() => document.getElementById('t-b'))).toBe(document.getElementById('t-b'))
  })
})
