import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ScrollProgress from './ScrollProgress.vue'

let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
  vi.restoreAllMocks()
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})

function layout(scrollHeight: number, clientHeight: number) {
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(scrollHeight)
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(clientHeight)
}
async function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
}
const now = () => Number(w!.attributes('aria-valuenow'))
const bar = () => w!.find('[data-slot="scroll-progress-bar"]').attributes('style')

describe('ScrollProgress target', () => {
  function scroller(scrollHeight: number, clientHeight: number) {
    const el = document.createElement('div')
    el.id = 'sp-target'
    Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true })
    document.body.appendChild(el)
    return el
  }
  afterEach(() => document.getElementById('sp-target')?.remove())
  it.each([['selector', '#sp-target'], ['element', null]])('follows an inner scroll container given as a %s and ignores the page', async (_kind, selector) => {
    const el = scroller(600, 200)
    layout(2000, 1000)
    w = mount(ScrollProgress, { props: { target: selector ?? el } })
    el.scrollTop = 100
    el.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(now()).toBe(25)
    await scrollTo(1000)
    expect(now()).toBe(25)
  })
  it('falls back to the page when the selector matches nothing', async () => {
    layout(2000, 1000)
    w = mount(ScrollProgress, { props: { target: '#nope' } })
    await scrollTo(500)
    expect(now()).toBe(50)
  })
  it('removes the target listener on unmount', () => {
    const el = scroller(600, 200)
    const off = vi.spyOn(el, 'removeEventListener')
    w = mount(ScrollProgress, { props: { target: el } })
    w.unmount()
    w = undefined
    expect(off).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})

describe('ScrollProgress', () => {
  describe('good path', () => {
    it('renders a labelled progressbar at 0', () => {
      layout(2000, 1000)
      w = mount(ScrollProgress)
      expect(w.attributes('data-slot')).toBe('scroll-progress')
      expect(w.attributes('role')).toBe('progressbar')
      expect(w.attributes('aria-label')).toBe('Reading progress')
      expect(w.attributes('aria-valuemin')).toBe('0')
      expect(w.attributes('aria-valuemax')).toBe('100')
      expect(now()).toBe(0)
      expect(bar()).toContain('scaleX(0)')
      expect(w.classes()).toContain('top-0')
    })
    it('tracks scrolling', async () => {
      layout(2000, 1000)
      w = mount(ScrollProgress)
      await scrollTo(500)
      expect(now()).toBe(50)
      expect(bar()).toContain('scaleX(0.5)')
      await scrollTo(1000)
      expect(now()).toBe(100)
    })
    it('position bottom', () => {
      w = mount(ScrollProgress, { props: { position: 'bottom' } })
      expect(w.classes()).toContain('bottom-0')
      expect(w.classes()).not.toContain('top-0')
      expect(w.attributes('data-position')).toBe('bottom')
    })
    it('reacts to resize', async () => {
      layout(2000, 1000)
      w = mount(ScrollProgress)
      await scrollTo(250)
      layout(1500, 1000)
      window.dispatchEvent(new Event('resize'))
      await nextTick()
      expect(now()).toBe(50)
    })
  })
  describe('customisation', () => {
    it('merges class, label, attrs', () => {
      w = mount(ScrollProgress, { props: { class: 'h-2 custom', label: 'Lesefortschritt' }, attrs: { id: 'sp' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('h-2')
      expect(w.classes()).not.toContain('h-1')
      expect(w.attributes('aria-label')).toBe('Lesefortschritt')
      expect(w.attributes('id')).toBe('sp')
    })
  })
  describe('bad path', () => {
    it('a page that does not scroll stays at 0 (no division by zero)', async () => {
      layout(800, 800)
      w = mount(ScrollProgress)
      await scrollTo(100)
      expect(now()).toBe(0)
      expect(bar()).not.toContain('NaN')
      expect(bar()).not.toContain('Infinity')
    })
    it('overscroll and negative scroll are clamped', async () => {
      layout(2000, 1000)
      w = mount(ScrollProgress)
      await scrollTo(99999)
      expect(now()).toBe(100)
      await scrollTo(-300)
      expect(now()).toBe(0)
    })
    it('NaN scroll position is treated as 0', async () => {
      layout(2000, 1000)
      w = mount(ScrollProgress)
      await scrollTo(Number.NaN)
      expect(now()).toBe(0)
    })
  })
  describe('edge cases', () => {
    it('removes its listeners on unmount', async () => {
      const add = vi.spyOn(window, 'addEventListener')
      const remove = vi.spyOn(window, 'removeEventListener')
      layout(2000, 1000)
      w = mount(ScrollProgress)
      expect(add.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['scroll', 'resize']))
      w.unmount()
      w = undefined
      expect(remove.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['scroll', 'resize']))
    })
    it('many rapid scroll events end at the last position', async () => {
      layout(10000, 1000)
      w = mount(ScrollProgress)
      for (let y = 0; y <= 9000; y += 90) await scrollTo(y)
      expect(now()).toBe(100)
    })
    it('exposes aria-valuetext and uses the z-index token without arbitrary syntax', async () => {
      layout(2000, 1000)
      w = mount(ScrollProgress)
      await scrollTo(250)
      expect(w.attributes('aria-valuetext')).toBe('25%')
      expect(w.classes()).toContain('z-(--z-overlay)')
      expect(w.classes().join(' ')).not.toContain('z-[')
    })
    it('draws a visible bar in forced-colors mode and keeps reduced-motion safe transitions', () => {
      w = mount(ScrollProgress)
      const cls = w.find('[data-slot="scroll-progress-bar"]').classes()
      expect(cls).toEqual(expect.arrayContaining(['forced-colors:border-b-4', 'forced-colors:border-current', 'motion-safe:transition-transform']))
      expect(cls).not.toContain('transition-transform')
    })
    it('fills from the start edge in right-to-left pages too', () => {
      w = mount(ScrollProgress)
      expect(w.find('[data-slot="scroll-progress-bar"]').classes()).toEqual(expect.arrayContaining(['origin-left', 'rtl:origin-right']))
    })
    it('is non-interactive', () => {
      w = mount(ScrollProgress)
      expect(w.classes()).toContain('pointer-events-none')
    })
  })
})
