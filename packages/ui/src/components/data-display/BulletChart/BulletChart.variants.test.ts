import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BulletChart from './BulletChart.vue'
import { BULLET_METRICS, BULLET_SIZES, BULLET_VARIANTS, bulletChartVariants } from './variants'

const m = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => mount(BulletChart, { props: props as never, attrs })
const bullets = [
  { label: 'Orders', value: 70, target: 80, ranges: [50, 75, 100] },
  { label: 'Returns', value: 40, target: 60, ranges: [50, 75, 100] },
]
const base = { label: 'Sample', bullets }
const slot = (w: ReturnType<typeof m>, s: string) => w.findAll(`[data-slot="${s}"]`)
const box = (w: ReturnType<typeof m>) => w.find('svg').attributes('viewBox')!.split(' ').map(Number) as [number, number, number, number]
const num = (el: { attributes: (k: string) => string | undefined }, k: string) => Number(el.attributes(k))
const clean = (w: ReturnType<typeof m>) => !/NaN|Infinity|undefined/.test(w.html().replace(/<!--.*?-->/g, ''))

describe('BulletChart variants: defaults are unchanged', () => {
  it('pins the root classes and the default geometry', () => {
    const w = m(base)
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    expect(w.attributes('data-variant')).toBe('horizontal')
    expect(w.attributes('data-size')).toBe('md')
    expect(box(w)).toEqual([0, 0, 480, 94])
    expect(slot(w, 'bullet-chart-measure')[0]!.classes()).toContain('fill-chart-1')
    expect(w.find('svg').classes()).toEqual(['h-auto', 'w-full'])
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ ...base, variant: 'horizontal', size: 'md', tone: 'chart-1', showTarget: true, showValues: true, showAxis: true, showRangeLabels: false, showLegend: false, sharedScale: true, width: 480 }).html()).toBe(m(base).html())
  })
  it('the cva helper keeps the default string for plain elements', () => {
    expect(bulletChartVariants()).toBe('flex w-full min-w-0 flex-col gap-2')
    expect(bulletChartVariants({ size: 'lg' })).toBe('flex w-full min-w-0 flex-col gap-3')
    expect(bulletChartVariants({ size: 'sm', variant: 'vertical' })).toBe('flex w-full min-w-0 flex-col gap-1.5')
  })
})

describe('BulletChart variants: variant', () => {
  it('horizontal stacks rows, vertical places columns side by side', () => {
    const h = slot(m({ ...base, variant: 'horizontal' }), 'bullet-chart-measure')
    expect(num(h[0]!, 'x')).toBe(num(h[1]!, 'x'))
    expect(num(h[0]!, 'y')).toBeLessThan(num(h[1]!, 'y'))
    const v = slot(m({ ...base, variant: 'vertical' }), 'bullet-chart-measure')
    expect(num(v[0]!, 'y') + num(v[0]!, 'height')).toBeCloseTo(num(v[1]!, 'y') + num(v[1]!, 'height'), 0) // both start at zero
    expect(num(v[0]!, 'x')).toBeLessThan(num(v[1]!, 'x'))
  })
  it('vertical bars grow upward from the baseline and columns are thinner than tall', () => {
    const w = m({ ...base, variant: 'vertical' })
    const bar = slot(w, 'bullet-chart-measure')[0]!
    const bands = slot(w, 'bullet-chart-range').slice(0, 3)
    expect(num(bar, 'height')).toBeGreaterThan(num(bar, 'width'))
    expect(num(bands[0]!, 'y')).toBeGreaterThan(num(bands[1]!, 'y')) // the lowest band is at the bottom
    expect(w.attributes('data-variant')).toBe('vertical')
  })
  it('vertical target is a horizontal tick with the cap on its left', () => {
    const t = m({ ...base, variant: 'vertical' }).find('[data-slot="bullet-chart-target"] line')
    expect(t.attributes('y1')).toBe(t.attributes('y2'))
    expect(num(t, 'x1')).toBeLessThan(num(t, 'x2'))
  })
  it('vertical axis ticks sit left of the plot, labels below the columns', () => {
    const w = m({ ...base, variant: 'vertical' })
    expect(slot(w, 'bullet-chart-tick')[0]!.attributes('text-anchor')).toBe('end')
    expect(slot(w, 'bullet-chart-label')[0]!.attributes('text-anchor')).toBe('middle')
    expect(slot(w, 'bullet-chart-value')[0]!.text()).toBe('70')
  })
  it('an unknown variant falls back to horizontal', () => {
    expect(m({ ...base, variant: 'diagonal' }).html()).toBe(m(base).html())
    expect(BULLET_VARIANTS).toEqual(['horizontal', 'vertical'])
  })
})

describe('BulletChart variants: size', () => {
  it.each([
    ['sm', 16, 28],
    ['md', 24, 40],
    ['lg', 32, 52],
  ])('%s: bands of %i px, rows %i px apart', (size, band, pitch) => {
    const w = m({ ...base, size })
    const ranges = slot(w, 'bullet-chart-range')
    expect(num(ranges[0]!, 'height')).toBe(band)
    expect(num(slot(w, 'bullet-chart-range')[3]!, 'y') - num(ranges[0]!, 'y')).toBe(pitch)
    expect(w.attributes('data-size')).toBe(size)
    expect(box(w)[3]).toBe(8 + pitch + band + 22) // top + one pitch + last band + axis
  })
  it('the measure bar thickens with the band', () => {
    const h = (size: string) => num(slot(m({ ...base, size }), 'bullet-chart-measure')[0]!, 'height')
    expect(h('sm')).toBeLessThan(h('md'))
    expect(h('md')).toBeLessThan(h('lg'))
  })
  it.each([
    ['sm', 120, 18],
    ['md', 180, 26],
    ['lg', 240, 35],
  ])('vertical %s: plot %i px tall, columns %i px wide', (size, plot, band) => {
    const w = m({ ...base, size, variant: 'vertical' })
    expect(num(slot(w, 'bullet-chart-range')[0]!, 'width')).toBe(band)
    expect(box(w)[3]).toBe(22 + plot + 22)
  })
  it('the root gap follows the size', () => {
    expect(m({ ...base, size: 'sm' }).classes()).toContain('gap-1.5')
    expect(m({ ...base, size: 'lg' }).classes()).toContain('gap-3')
  })
  it('an unknown size falls back to md', () => {
    expect(m({ ...base, size: 'huge' }).html()).toBe(m(base).html())
    expect(BULLET_SIZES.map((s) => BULLET_METRICS[s].band)).toEqual([16, 24, 32])
  })
})

describe('BulletChart variants: tone', () => {
  it.each([
    ['chart-1', 'fill-chart-1'], ['chart-2', 'fill-chart-2'], ['chart-3', 'fill-chart-3'], ['chart-4', 'fill-chart-4'], ['chart-5', 'fill-chart-5'],
    ['primary', 'fill-primary'], ['success', 'fill-success'], ['warning', 'fill-warning'], ['danger', 'fill-destructive'], ['info', 'fill-info'], ['muted', 'fill-muted-foreground'],
  ])('%s fills the bar with %s', (tone, cls) => {
    const w = m({ ...base, tone })
    expect(slot(w, 'bullet-chart-measure').every((b) => b.classes().includes(cls))).toBe(true)
  })
  it('an unknown tone falls back to chart-1', () => {
    expect(m({ ...base, tone: 'pink' }).html()).toBe(m(base).html())
  })
  it('legend swatch follows the tone', () => {
    expect(m({ ...base, tone: 'success', showLegend: true }).find('[data-slot="bullet-chart-legend-item"] span').classes()).toContain('bg-success')
  })
})

describe('BulletChart variants: show flags', () => {
  it('showTarget off removes the markers but the table keeps the target', () => {
    const w = m({ ...base, showTarget: false })
    expect(slot(w, 'bullet-chart-target')).toHaveLength(0)
    expect(w.find('[data-slot="bullet-chart-table"]').text()).toContain('80')
  })
  it('showValues off removes the value column and widens the plot', () => {
    const on = slot(m(base), 'bullet-chart-range')[2]!
    const off = m({ ...base, showValues: false })
    expect(slot(off, 'bullet-chart-value')).toHaveLength(0)
    expect(num(slot(off, 'bullet-chart-range')[2]!, 'x') + num(slot(off, 'bullet-chart-range')[2]!, 'width')).toBeGreaterThan(num(on, 'x') + num(on, 'width'))
  })
  it('showRangeLabels spaces the rows further apart', () => {
    const y = (w: ReturnType<typeof m>) => num(slot(w, 'bullet-chart-range')[3]!, 'y') - num(slot(w, 'bullet-chart-range')[0]!, 'y')
    expect(y(m({ ...base, showRangeLabels: true }))).toBe(y(m(base)) + 14)
    const v = m({ ...base, variant: 'vertical', showRangeLabels: true })
    expect(slot(v, 'bullet-chart-range-label')[0]!.attributes('text-anchor')).toBe('start')
  })
  it('showAxis off drops ticks and grid and shortens the chart', () => {
    const w = m({ ...base, showAxis: false })
    expect(slot(w, 'bullet-chart-tick')).toHaveLength(0)
    expect(box(w)[3]).toBeLessThan(box(m(base))[3])
  })
})

describe('BulletChart variants: combinations', () => {
  it('every variant x size x tone renders clean markup with the right structure', () => {
    for (const variant of BULLET_VARIANTS) {
      for (const size of BULLET_SIZES) {
        for (const tone of ['chart-2', 'danger']) {
          const w = m({ ...base, variant, size, tone, showRangeLabels: true, showLegend: true })
          expect(clean(w)).toBe(true)
          expect(slot(w, 'bullet-chart-row')).toHaveLength(2)
          expect(slot(w, 'bullet-chart-range')).toHaveLength(6)
          expect(slot(w, 'bullet-chart-target')).toHaveLength(2)
        }
      }
    }
  })
  it('tone and size and class together: class still wins', () => {
    const w = m({ ...base, size: 'lg', tone: 'info', variant: 'vertical', class: 'gap-1' })
    expect(w.classes()).toContain('gap-1')
    expect(w.classes()).not.toContain('gap-3')
    expect(slot(w, 'bullet-chart-measure')[0]!.classes()).toContain('fill-info')
  })
  it('separate scales work in both variants', () => {
    for (const variant of BULLET_VARIANTS) {
      const w = m({ ...base, variant, sharedScale: false })
      expect(clean(w)).toBe(true)
      expect(slot(w, 'bullet-chart-axis')).toHaveLength(0)
    }
  })
  it('is deterministic for every combination', () => {
    for (const variant of BULLET_VARIANTS) for (const size of BULLET_SIZES) expect(m({ ...base, variant, size }).html()).toBe(m({ ...base, variant, size }).html())
  })
})
