import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Gauge from './Gauge.vue'
import { gaugeVariants } from './variants'

const make = (props: Record<string, unknown> = {}, slots?: Record<string, unknown>) => mount(Gauge, { props: { value: 42, label: 'CPU', animated: false, ...props } as never, slots: slots as never })
const part = (w: ReturnType<typeof make>, name: string) => w.find(`[data-slot="gauge-${name}"]`)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Gauge variants: defaults are unchanged', () => {
  it('keeps today\'s classes, viewBox, path and content position', () => {
    const w = make()
    expect(w.classes()).toEqual(['relative', 'inline-block', 'text-foreground', 'w-40', 'text-xl'])
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(part(w, 'svg').attributes('viewBox')).toBe('0 0 100 52')
    expect(part(w, 'track').attributes('d')).toBe('M 10 50 A 40 40 0 0 1 90 50')
    expect(part(w, 'track').attributes('stroke-width')).toBe('10')
    expect(part(w, 'svg').attributes('class')).toBe('block w-full')
    expect(part(w, 'content').attributes('class')).toBe('absolute flex flex-col items-center leading-none inset-x-0 bottom-0')
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(make({ variant: 'semicircle', size: 'md' }).html()).toBe(make().html())
  })
  it('the cva helper keeps the default string for plain elements', () => {
    expect(gaugeVariants()).toBe('relative inline-block text-foreground w-40 text-xl')
  })
})

describe('Gauge variants: arc', () => {
  it('draws a three-quarter dial in a square viewBox with the value centred', () => {
    const w = make({ variant: 'arc' })
    expect(w.attributes('data-variant')).toBe('arc')
    expect(part(w, 'svg').attributes('viewBox')).toBe('0 0 100 100')
    expect(part(w, 'track').attributes('d')).toBe('M 21.72 78.28 A 40 40 0 1 1 78.28 78.28')
    expect(part(w, 'arc').attributes('d')).toBe(part(w, 'track').attributes('d'))
    expect(part(w, 'arc').attributes('stroke-dasharray')).toBe('42 100')
    expect(part(w, 'content').classes()).toEqual(expect.arrayContaining(['inset-0', 'justify-center']))
    expect(part(w, 'value').text()).toBe('42')
    expect(part(w, 'label').text()).toBe('CPU')
  })
  it('keeps the width and text size of the chosen size', () => {
    expect(make({ variant: 'arc', size: 'lg' }).classes()).toEqual(expect.arrayContaining(['w-56', 'text-3xl']))
    expect(make({ variant: 'arc', size: 'sm' }).classes()).toEqual(expect.arrayContaining(['w-24', 'text-sm']))
  })
})

describe('Gauge variants: linear', () => {
  it('draws a horizontal bar with the caption left and the value right', () => {
    const w = make({ variant: 'linear' })
    expect(w.attributes('data-variant')).toBe('linear')
    expect(part(w, 'svg').attributes('viewBox')).toBe('0 0 100 8')
    expect(part(w, 'svg').classes()).toEqual(expect.arrayContaining(['overflow-hidden', 'rounded-full']))
    expect(part(w, 'track').attributes('d')).toBe('M 0 4 H 100')
    expect(part(w, 'track').attributes('stroke-width')).toBe('8')
    expect(part(w, 'arc').attributes('stroke-dasharray')).toBe('42 100')
    const content = part(w, 'content')
    expect(content.classes()).not.toContain('absolute')
    expect(content.element.nextElementSibling?.tagName.toLowerCase()).toBe('svg')
    expect(content.element.firstElementChild?.getAttribute('data-slot')).toBe('gauge-label')
    expect(part(w, 'value').text()).toBe('42')
    expect(part(w, 'value').classes()).toContain('ms-auto')
  })
  it('the value text is smaller than the dial value of the same size', () => {
    expect(part(make({ variant: 'linear', size: 'sm' }), 'value').classes()).toContain('text-sm')
    expect(part(make({ variant: 'linear', size: 'md' }), 'value').classes()).toContain('text-base')
    expect(part(make({ variant: 'linear', size: 'lg' }), 'value').classes()).toContain('text-xl')
  })
  it('the fill follows value, range and threshold tones', () => {
    const w = make({ variant: 'linear', value: 3, min: 0, max: 4, thresholds: [{ value: 0, tone: 'success' }, { value: 2, tone: 'warning' }] })
    expect(part(w, 'arc').attributes('stroke-dasharray')).toBe('75 100')
    expect(part(w, 'arc').classes()).toContain('stroke-warning')
    expect(w.attributes('data-tone')).toBe('warning')
  })
  it('works without a caption and with slots', () => {
    const noLabel = mount(Gauge, { props: { value: 10, 'aria-label': 'Load', animated: false, variant: 'linear' } as never })
    expect(part(noLabel, 'label').exists()).toBe(false)
    expect(part(noLabel, 'value').text()).toBe('10')
    const slotted = make({ variant: 'linear', value: 72 }, { default: '<template #default="{ value }">{{ value }}%</template>', label: 'Battery' })
    expect(part(slotted, 'value').text()).toBe('72%')
    expect(part(slotted, 'label').text()).toBe('Battery')
  })
  it('long captions truncate instead of pushing the value away', () => {
    const w = make({ variant: 'linear', label: 'A very long caption for a small gauge on a narrow phone screen' })
    expect(part(w, 'label').classes()).toEqual(expect.arrayContaining(['min-w-0', 'truncate']))
  })
  it('class overrides the width', () => {
    const w = make({ variant: 'linear', class: 'w-full' })
    expect(w.classes()).toContain('w-full')
    expect(w.classes()).not.toContain('w-40')
  })
})

describe('Gauge variants: semantics are the same in every variant', () => {
  it.each(['semicircle', 'arc', 'linear'])('%s is a named meter with value text', (variant) => {
    const w = make({ variant, value: 3.2, min: 0, max: 4, label: 'Storage', valueText: '3.2 of 4 GB' })
    expect(w.attributes('role')).toBe('meter')
    expect(w.attributes('aria-label')).toBe('Storage')
    expect(w.attributes('aria-valuenow')).toBe('3.2')
    expect(w.attributes('aria-valuemin')).toBe('0')
    expect(w.attributes('aria-valuemax')).toBe('4')
    expect(w.attributes('aria-valuetext')).toBe('3.2 of 4 GB')
    expect(part(w, 'value').text()).toBe('3.2 of 4 GB')
    expect(part(w, 'svg').attributes('aria-hidden')).toBe('true')
  })
  it.each(['semicircle', 'arc', 'linear'])('%s without data is a labelled image with no arc', (variant) => {
    const w = make({ variant, value: null, label: 'Throughput' })
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('Throughput: No data')
    expect(w.attributes('aria-valuenow')).toBeUndefined()
    expect(w.attributes('data-state')).toBe('empty')
    expect(part(w, 'arc').exists()).toBe(false)
    expect(part(w, 'value').text()).toBe('–')
  })
  it.each(['semicircle', 'arc', 'linear'])('%s clamps values and swaps a reversed range', (variant) => {
    const over = make({ variant, value: 500 })
    expect(over.attributes('aria-valuenow')).toBe('100')
    expect(part(over, 'arc').attributes('stroke-dasharray')).toBe('100 100')
    const rev = make({ variant, value: 25, min: 100, max: 0 })
    expect(rev.attributes('aria-valuemin')).toBe('0')
    expect(rev.attributes('aria-valuemax')).toBe('100')
  })
  it.each(['semicircle', 'arc', 'linear'])('%s sweeps in under normal motion and not under reduced motion', async (variant) => {
    const raf: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => raf.push(cb))
    const w = mount(Gauge, { props: { value: 60, label: 'Load', variant } as never })
    await w.vm.$nextTick()
    expect(part(w, 'arc').exists()).toBe(false)
    raf.forEach((cb) => cb(0))
    await w.vm.$nextTick()
    expect(part(w, 'arc').attributes('stroke-dasharray')).toBe('60 100')
    expect(part(w, 'arc').classes()).toContain('motion-reduce:transition-none')
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    const still = mount(Gauge, { props: { value: 60, label: 'Load', variant } as never })
    await still.vm.$nextTick()
    expect(part(still, 'arc').attributes('stroke-dasharray')).toBe('60 100')
    expect(part(still, 'arc').classes()).not.toContain('transition-[stroke-dasharray]')
  })
})

describe('Gauge variants: fallbacks and combinations', () => {
  it('an unknown variant or size falls back to the default look', () => {
    expect(make({ variant: 'radial' }).html()).toBe(make().html())
    expect(make({ size: 'huge' }).classes()).toEqual(expect.arrayContaining(['w-40', 'text-xl']))
  })
  it('every variant at every size keeps its width class', () => {
    for (const variant of ['semicircle', 'arc', 'linear']) {
      for (const [size, cls] of [['sm', 'w-24'], ['md', 'w-40'], ['lg', 'w-56']] as const) expect(make({ variant, size }).classes()).toContain(cls)
    }
  })
  it('tone and threshold colours apply to the arc of every variant', () => {
    for (const variant of ['semicircle', 'arc', 'linear']) {
      expect(part(make({ variant, tone: 'info' }), 'arc').classes()).toContain('stroke-info')
      expect(part(make({ variant, value: 95, thresholds: [{ value: 0, tone: 'success' }, { value: 90, tone: 'danger' }] }), 'arc').classes()).toContain('stroke-destructive')
    }
  })
  it('a zero value draws no arc in any variant', () => {
    for (const variant of ['semicircle', 'arc', 'linear']) expect(part(make({ variant, value: 0 }), 'arc').exists()).toBe(false)
  })
})
