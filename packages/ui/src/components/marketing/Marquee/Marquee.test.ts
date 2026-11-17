import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockMatchMedia } from '../shared/testing'
import Marquee from './Marquee.vue'
import { MARQUEE_DIRECTIONS, MARQUEE_SIZES, MARQUEE_SPEEDS, marqueeCopyVariants, marqueeItemVariants, marqueeTrackVariants, marqueeVariants, marqueeViewportVariants } from './variants'

const items = ['Alpha', 'Beta', 'Gamma']

afterEach(() => vi.unstubAllGlobals())

describe('Marquee pause control (WCAG 2.2.2) and reduced motion', () => {
  const toggle = (w: ReturnType<typeof mount>) => w.find('[data-slot="marquee-toggle"]')
  it('renders a real button outside the faded viewport, hidden under reduced motion', () => {
    const w = mount(Marquee, { props: { items } })
    const btn = toggle(w)
    expect(btn.element.tagName).toBe('BUTTON')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.text()).toBe('Pause scrolling')
    expect(w.find('[data-slot="marquee-viewport"]').element.contains(btn.element)).toBe(false)
    expect(w.find('[data-slot="marquee-controls"]').classes()).toContain('motion-reduce:hidden')
    expect(btn.classes()).toEqual(expect.arrayContaining(['pointer-coarse:min-h-11', 'min-h-6']))
  })
  it('toggles the animation: inline animation-play-state, data-paused, label and emit', async () => {
    const w = mount(Marquee, { props: { items } })
    expect(w.find('[data-slot="marquee-track"]').attributes('style') ?? '').not.toContain('paused')
    await toggle(w).trigger('click')
    expect(w.attributes('data-paused')).toBeDefined()
    expect(w.find('[data-slot="marquee-track"]').attributes('style')).toContain('animation-play-state: paused')
    expect(toggle(w).text()).toBe('Resume scrolling')
    expect(w.emitted('update:paused')![0]).toEqual([true])
    await toggle(w).trigger('click')
    expect(w.attributes('data-paused')).toBeUndefined()
    expect(w.emitted('update:paused')![1]).toEqual([false])
  })
  it('paused prop controls the state; labels are customisable; pausable=false removes the button', async () => {
    const w = mount(Marquee, { props: { items, paused: true, pauseLabel: 'Stopp', playLabel: 'Weiter' } })
    expect(w.attributes('data-paused')).toBeDefined()
    expect(toggle(w).text()).toBe('Weiter')
    await w.setProps({ paused: false })
    expect(toggle(w).text()).toBe('Stopp')
    expect(mount(Marquee, { props: { items, pausable: false } }).find('[data-slot="marquee-toggle"]').exists()).toBe(false)
  })
  it('the strip is not focusable when motion is allowed', () => {
    mockMatchMedia(false)
    const vp = mount(Marquee, { props: { items } }).find('[data-slot="marquee-viewport"]')
    expect(vp.attributes('tabindex')).toBeUndefined()
    expect(vp.attributes('role')).toBeUndefined()
  })
  it('with prefers-reduced-motion the scrollable strip is focusable and named', async () => {
    mockMatchMedia(true)
    const w = mount(Marquee, { props: { items, scrollLabel: 'Technologies' } })
    await w.vm.$nextTick()
    const vp = w.find('[data-slot="marquee-viewport"]')
    expect(vp.attributes('tabindex')).toBe('0')
    expect(vp.attributes('role')).toBe('group')
    expect(vp.attributes('aria-label')).toBe('Technologies')
    expect(vp.classes()).toContain('motion-reduce:overflow-x-auto')
    const v = mount(Marquee, { props: { items, direction: 'up' } })
    expect(v.find('[data-slot="marquee-viewport"]').classes()).toContain('motion-reduce:overflow-y-auto')
  })
  it('reacts to the reduced-motion preference changing and cleans up the listener', async () => {
    let handler: (() => void) | undefined
    const mql = { matches: false, addEventListener: vi.fn((_: string, h: () => void) => (handler = h)), removeEventListener: vi.fn() }
    vi.stubGlobal('matchMedia', () => mql)
    const w = mount(Marquee, { props: { items } })
    expect(w.find('[data-slot="marquee-viewport"]').attributes('tabindex')).toBeUndefined()
    mql.matches = true
    handler!()
    await w.vm.$nextTick()
    expect(w.find('[data-slot="marquee-viewport"]').attributes('tabindex')).toBe('0')
    w.unmount()
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', handler)
  })
  it('works without matchMedia (SSR-like environments)', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(mount(Marquee, { props: { items } }).find('[data-slot="marquee-viewport"]').attributes('tabindex')).toBeUndefined()
  })
})

describe('Marquee', () => {
  describe('good path', () => {
    it('renders items twice for a seamless loop; the clone is aria-hidden', () => {
      const w = mount(Marquee, { props: { items } })
      expect(w.attributes('data-slot')).toBe('marquee')
      const content = w.find('[data-slot="marquee-content"]')
      const clone = w.find('[data-slot="marquee-clone"]')
      expect(content.findAll('span').map((s) => s.text())).toEqual(items)
      expect(clone.findAll('span').map((s) => s.text())).toEqual(items)
      expect(clone.attributes('aria-hidden')).toBe('true')
      expect(content.attributes('aria-hidden')).toBeUndefined()
    })
    it('slot content is rendered in both copies', () => {
      const w = mount(Marquee, { slots: { default: '<img alt="logo" src="/l.svg">' } })
      expect(w.findAll('img')).toHaveLength(2)
    })
    it('duration and gap become CSS variables', () => {
      const w = mount(Marquee, { props: { items, duration: 12, gap: 'lg' } })
      expect(w.attributes('style')).toContain('--pd-marquee-duration: 12s')
      expect(w.attributes('style')).toContain('--pd-marquee-gap: 3rem')
    })
    it('pause on hover is on by default and can be disabled; direction right reverses', () => {
      expect(mount(Marquee, { props: { items } }).attributes('data-pause-on-hover')).toBeDefined()
      const w = mount(Marquee, { props: { items, pauseOnHover: false, direction: 'right' } })
      expect(w.attributes('data-pause-on-hover')).toBeUndefined()
      expect(w.attributes('data-reverse')).toBeDefined()
      expect(mount(Marquee, { props: { items } }).attributes('data-reverse')).toBeUndefined()
    })
  })
  describe('direction, speed, gap, fade and size', () => {
    const style = (w: ReturnType<typeof mount>) => w.attributes('style') ?? ''
    it('left is the default: horizontal, not reversed, mask on, md text', () => {
      const w = mount(Marquee, { props: { items } })
      expect(w.attributes('data-direction')).toBe('left')
      expect(w.attributes('data-vertical')).toBeUndefined()
      expect(w.attributes('data-reverse')).toBeUndefined()
      expect(w.attributes('data-fade')).toBeDefined()
      expect(w.find('[data-slot="marquee-viewport"]').classes().join(' ')).toContain('to_right')
      expect(w.find('[data-slot="marquee-track"]').classes()).toContain('w-max')
      expect(w.find('span').classes()).toContain('text-lg')
    })
    it('right is horizontal and reversed', () => {
      const w = mount(Marquee, { props: { items, direction: 'right' } })
      expect(w.attributes('data-direction')).toBe('right')
      expect(w.attributes('data-reverse')).toBeDefined()
      expect(w.attributes('data-vertical')).toBeUndefined()
    })
    it.each([
      ['up', false],
      ['down', true],
    ] as const)('%s scrolls vertically (reverse=%s) with a column track, bottom padding and vertical fade', (direction, reverse) => {
      const w = mount(Marquee, { props: { items, direction } })
      expect(w.attributes('data-vertical')).toBeDefined()
      expect(w.attributes('data-reverse') !== undefined).toBe(reverse)
      expect(w.classes()).toEqual(expect.arrayContaining(['h-64', 'flex-col']))
      expect(w.find('[data-slot="marquee-viewport"]').classes().join(' ')).toContain('to_bottom')
      expect(w.find('[data-slot="marquee-track"]').classes()).toEqual(expect.arrayContaining(['h-max', 'flex-col']))
      expect(w.find('[data-slot="marquee-content"]').classes()).toContain('flex-col')
      const s = w.find('[data-slot="marquee-content"]').attributes('style')!
      expect(s).toContain('padding-block-end: var(--pd-marquee-gap)')
      expect(s).not.toContain('padding-right')
      expect(s).not.toContain('padding-inline')
      expect(w.find('[data-slot="marquee-clone"]').attributes('aria-hidden')).toBe('true')
      expect(w.find('[data-slot="marquee-clone"]').classes()).toContain('pd-marquee-clone')
    })
    it('horizontal copies pad on the inline end (logical, RTL-safe)', () => {
      const s = mount(Marquee, { props: { items } }).find('[data-slot="marquee-content"]').attributes('style')!
      expect(s).toContain('padding-inline-end: var(--pd-marquee-gap)')
      expect(s).not.toContain('padding-right')
    })
    it('vertical height can be overridden with class', () => {
      const w = mount(Marquee, { props: { items, direction: 'up', class: 'h-96' } })
      expect(w.classes()).toContain('h-96')
      expect(w.classes()).not.toContain('h-64')
    })
    it.each([
      ['slow', 60],
      ['normal', 30],
      ['fast', 15],
    ] as const)('speed %s maps to %ss per loop', (speed, secs) => {
      expect(style(mount(Marquee, { props: { items, speed } }))).toContain(`--pd-marquee-duration: ${secs}s`)
      expect(MARQUEE_SPEEDS[speed]).toBe(secs)
    })
    it('an explicit valid duration wins over speed; an invalid one falls back to speed', () => {
      expect(style(mount(Marquee, { props: { items, speed: 'fast', duration: 8 } }))).toContain('--pd-marquee-duration: 8s')
      expect(style(mount(Marquee, { props: { items, speed: 'fast', duration: -1 } }))).toContain('--pd-marquee-duration: 15s')
    })
    it.each([
      ['none', '0rem'],
      ['sm', '1rem'],
      ['md', '2rem'],
      ['lg', '3rem'],
    ] as const)('gap %s', (gap, rem) => {
      expect(style(mount(Marquee, { props: { items, gap } }))).toContain(`--pd-marquee-gap: ${rem}`)
    })
    it('fade=false removes the edge mask', () => {
      const w = mount(Marquee, { props: { items, fade: false } })
      expect(w.attributes('data-fade')).toBeUndefined()
      expect(w.find('[data-slot="marquee-viewport"]').classes().join(' ')).not.toContain('mask-image')
      const v = mount(Marquee, { props: { items, fade: false, direction: 'up' } })
      expect(v.find('[data-slot="marquee-viewport"]').classes().join(' ')).not.toContain('mask-image')
    })
    it.each([
      ['sm', 'text-sm'],
      ['md', 'text-lg'],
      ['lg', 'text-2xl'],
    ] as const)('size %s sets the item text size', (size, cls) => {
      expect(mount(Marquee, { props: { items, size } }).find('span').classes()).toContain(cls)
    })
    it('size does not affect slot content', () => {
      const w = mount(Marquee, { props: { size: 'lg' }, slots: { default: '<b class="x">a</b>' } })
      expect(w.find('b').classes()).toEqual(['x'])
    })
    it.each(MARQUEE_DIRECTIONS)('%s: class merges last, attrs fall through, pauseOnHover and label work', (direction) => {
      const w = mount(Marquee, { props: { items, direction, class: 'w-1/2 custom', label: 'Strip', pauseOnHover: false }, attrs: { id: 'm', 'data-x': '1' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('w-1/2')
      expect(w.classes()).not.toContain('w-full')
      expect(w.attributes('id')).toBe('m')
      expect(w.attributes('data-x')).toBe('1')
      expect(w.attributes('role')).toBe('group')
      expect(w.attributes('data-pause-on-hover')).toBeUndefined()
    })
    it.each(MARQUEE_DIRECTIONS)('%s: slot content is duplicated and the clone is aria-hidden', (direction) => {
      const w = mount(Marquee, { props: { direction }, slots: { default: '<a href="#">x</a>' } })
      expect(w.findAll('a')).toHaveLength(2)
      expect(w.find('[data-slot="marquee-clone"]').attributes('aria-hidden')).toBe('true')
    })
    it('exposes class helpers', () => {
      expect(marqueeVariants({ axis: 'vertical' })).toContain('h-64')
      expect(marqueeViewportVariants()).toContain('to_right')
      expect(marqueeTrackVariants({ axis: 'vertical' })).toContain('h-max')
      expect(marqueeCopyVariants()).toContain('flex')
      expect(marqueeItemVariants({ size: 'lg' })).toContain('text-2xl')
      expect(MARQUEE_SIZES).toHaveLength(3)
    })
  })
  describe('customisation', () => {
    it('merges class and attrs; label makes it a named group', () => {
      const w = mount(Marquee, { props: { items, class: 'w-1/2 custom', label: 'Partners' }, attrs: { id: 'm' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('w-1/2')
      expect(w.classes()).not.toContain('w-full')
      expect(w.attributes('id')).toBe('m')
      expect(w.attributes('role')).toBe('group')
      expect(w.attributes('aria-label')).toBe('Partners')
    })
    it('no role without a label', () => {
      expect(mount(Marquee, { props: { items } }).attributes('role')).toBeUndefined()
    })
  })
  describe('bad path', () => {
    it('unknown direction falls back to left; null props are treated as unset', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Marquee, { props: { items, direction: 'diagonal' } })
      expect(w.attributes('data-direction')).toBe('left')
      expect(w.attributes('data-vertical')).toBeUndefined()
      // @ts-expect-error deliberately invalid
      const n = mount(Marquee, { props: { items, direction: null, size: null, gap: null, speed: null, fade: null } })
      expect(n.attributes('data-direction')).toBe('left')
      expect(n.attributes('style')).toContain('--pd-marquee-gap: 2rem')
      expect(n.attributes('style')).toContain('--pd-marquee-duration: 30s')
    })
    it('unknown speed, size and prototype-key values fall back', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Marquee, { props: { items, speed: 'warp', size: 'huge', gap: 'constructor' } })
      expect(w.attributes('style')).toContain('--pd-marquee-duration: 30s')
      expect(w.attributes('style')).toContain('--pd-marquee-gap: 2rem')
      expect(w.find('span').classes()).toContain('text-lg')
      // @ts-expect-error deliberately invalid
      expect(mount(Marquee, { props: { items, speed: 'toString' } }).attributes('style')).toContain('--pd-marquee-duration: 30s')
    })
    it.each(MARQUEE_DIRECTIONS)('%s with empty items renders empty copies', (direction) => {
      const w = mount(Marquee, { props: { items: [], direction } })
      expect(w.findAll('span')).toHaveLength(0)
      expect(w.find('[data-slot="marquee-clone"]').exists()).toBe(true)
    })
    it('non-numeric duration values are ignored', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(Marquee, { props: { items, duration: '12' } }).attributes('style')).toContain('--pd-marquee-duration: 30s')
    })
    it('empty items render empty copies without errors', () => {
      const w = mount(Marquee, { props: { items: [] } })
      expect(w.findAll('span')).toHaveLength(0)
    })
    it.each([0, -5, Number.NaN, Infinity])('invalid duration %s falls back to 30s', (duration) => {
      expect(mount(Marquee, { props: { items, duration } }).attributes('style')).toContain('--pd-marquee-duration: 30s')
    })
    it('unknown gap falls back to md', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(Marquee, { props: { items, gap: 'xl' } }).attributes('style')).toContain('--pd-marquee-gap: 2rem')
    })
  })
  describe('edge cases', () => {
    it.each(MARQUEE_DIRECTIONS)('%s: 100 items and long unicode text', (direction) => {
      const many = Array.from({ length: 100 }, (_, i) => `I${i}`)
      expect(mount(Marquee, { props: { items: many, direction } }).findAll('span')).toHaveLength(200)
      expect(mount(Marquee, { props: { items: ['日本語'.repeat(500)], direction } }).find('span').text()).toHaveLength(1500)
    })
    it('rapid prop toggling re-renders cleanly and unmounts', async () => {
      const w = mount(Marquee, { props: { items } })
      for (let i = 0; i < 40; i++) await w.setProps({ direction: MARQUEE_DIRECTIONS[i % 4], fade: i % 2 === 0, pauseOnHover: i % 3 === 0 })
      expect(w.findAll('span')).toHaveLength(6)
      w.unmount()
    })
    it('one item and 100 items; long unicode text', () => {
      expect(mount(Marquee, { props: { items: ['x'] } }).findAll('span')).toHaveLength(2)
      const many = Array.from({ length: 100 }, (_, i) => `I${i}`)
      expect(mount(Marquee, { props: { items: many } }).findAll('span')).toHaveLength(200)
      expect(mount(Marquee, { props: { items: ['日本語'.repeat(500)] } }).find('span').text()).toHaveLength(1500)
    })
    it('very small and very large durations are clamped to sane values', () => {
      expect(mount(Marquee, { props: { items, duration: 0.001 } }).attributes('style')).toContain('--pd-marquee-duration: 0.1s')
      expect(mount(Marquee, { props: { items, duration: 1e9 } }).attributes('style')).toContain('--pd-marquee-duration: 86400s')
    })
  })
})

describe('Marquee vertical alignment', () => {
  it('vertical copies align items to a common start edge; horizontal copies keep centring', () => {
    const v = mount(Marquee, { props: { items, direction: 'up' } })
    const copy = v.find('[data-slot="marquee-content"]').classes()
    expect(copy).toContain('items-start')
    expect(copy).not.toContain('items-center')
    expect(mount(Marquee, { props: { items } }).find('[data-slot="marquee-content"]').classes()).toContain('items-center')
  })
})
