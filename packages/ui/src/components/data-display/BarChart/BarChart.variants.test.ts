import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BarChart from './BarChart.vue'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => mount(BarChart, { props: props as never, attrs })
const bars = (w: ReturnType<typeof m>) => w.findAll('[data-slot="bar-chart-bar"]')
const num = (el: { attributes: (k: string) => string | undefined }, k: string) => Number(el.attributes(k))
const values = (w: ReturnType<typeof m>) => w.findAll('[data-slot="bar-chart-value"]')

const base = { labels: ['A', 'B', 'C'], series: [{ name: 'Series', data: [3, 5, 2] }], label: 'Sample' }
const two = {
  labels: ['Q1', 'Q2', 'Q3'],
  series: [{ name: 'One', data: [4, 6, 3] }, { name: 'Two', data: [2, 3, 5], tone: 'chart-2' }],
  label: 'Sample',
}

describe('BarChart variants: defaults are unchanged', () => {
  it('keeps today\'s markup when no variation prop is set', () => {
    const w = m(base)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 240')
    expect(bars(w).every((b) => b.attributes('rx') === '2')).toBe(true)
    expect(w.find('[data-slot="bar-chart-grid"]').attributes('data-grid')).toBeUndefined()
    expect(w.find('[data-slot="bar-chart-grid"]').findAll('line')).toHaveLength(w.findAll('[data-slot="bar-chart-tick"]').length)
    expect(w.find('[data-slot="bar-chart-grid"] line').attributes('stroke-dasharray')).toBeUndefined()
    expect(w.find('[data-slot="bar-chart-values"]').exists()).toBe(false)
    expect(w.classes()).toEqual(['flex', 'w-full', 'flex-col', 'gap-2'])
  })
  it('explicit default values render exactly like omitted ones', () => {
    const plain = m(two).html()
    expect(m({ ...two, variant: 'grouped', rounded: 'auto', gap: 'md', size: 'md', grid: 'value', showValues: false }).html()).toBe(plain)
  })
  it('stacked segments stay square by default', () => {
    const w = m({ ...two, stacked: true })
    expect(bars(w).every((b) => b.attributes('rx') === '0')).toBe(true)
  })
})

describe('BarChart variants: variant', () => {
  it('stacked draws the same output as the stacked boolean', () => {
    expect(m({ ...two, variant: 'stacked' }).html()).toBe(m({ ...two, stacked: true }).html())
  })
  it('stacked bars share one x per category, grouped bars do not', () => {
    const stacked = bars(m({ ...two, variant: 'stacked' }))
    expect(stacked[0]!.attributes('x')).toBe(stacked[1]!.attributes('x'))
    const grouped = bars(m({ ...two, variant: 'grouped' }))
    expect(grouped[0]!.attributes('x')).not.toBe(grouped[1]!.attributes('x'))
  })
  it('grouped wins over the stacked boolean', () => {
    expect(m({ ...two, variant: 'grouped', stacked: true }).html()).toBe(m(two).html())
  })
  it('an unknown value falls back to the stacked boolean', () => {
    expect(m({ ...two, variant: 'bogus' }).html()).toBe(m(two).html())
    expect(m({ ...two, variant: 'bogus', stacked: true }).html()).toBe(m({ ...two, stacked: true }).html())
  })
})

describe('BarChart variants: rounded', () => {
  const rx = (v: string | undefined, extra: Record<string, unknown> = {}) => bars(m({ ...base, ...(v ? { rounded: v } : {}), ...extra })).map((b) => b.attributes('rx'))
  it.each([
    ['none', '0'],
    ['sm', '2'],
    ['md', '4'],
  ])('%s sets rx %s', (value, expected) => {
    expect(rx(value)).toEqual([expected, expected, expected])
  })
  it('full is a pill: half of the bar width', () => {
    const w = m({ ...base, rounded: 'full' })
    bars(w).forEach((b) => expect(num(b, 'rx')).toBeCloseTo(Math.min(num(b, 'width'), num(b, 'height')) / 2, 1))
  })
  it('auto and unknown values look like the default', () => {
    expect(rx('auto')).toEqual(rx(undefined))
    expect(rx('bogus')).toEqual(rx(undefined))
  })
  it('applies to stacked segments too and to horizontal bars', () => {
    expect(bars(m({ ...two, variant: 'stacked', rounded: 'md' })).every((b) => b.attributes('rx') === '4')).toBe(true)
    expect(rx('md', { orientation: 'horizontal' })).toEqual(['4', '4', '4'])
  })
  it('never exceeds half of a tiny bar', () => {
    const w = m({ labels: ['A', 'B'], series: [{ name: 'S', data: [0.001, 1000] }], label: 'Sample', rounded: 'md' })
    const tiny = bars(w)[0]!
    expect(num(tiny, 'rx')).toBeLessThanOrEqual(num(tiny, 'height') / 2 + 0.01)
  })
})

describe('BarChart variants: gap', () => {
  const width = (gap?: string) => num(bars(m({ ...base, ...(gap ? { gap } : {}) }))[0]!, 'width')
  it('sm gives wider bars than md, lg narrower', () => {
    expect(width('sm')).toBeGreaterThan(width('md'))
    expect(width('md')).toBeGreaterThan(width('lg'))
  })
  it('md is the default and unknown falls back to it', () => {
    expect(width('md')).toBe(width())
    expect(width('bogus')).toBe(width())
  })
  it('keeps bars centred in their band', () => {
    const lg = bars(m({ ...base, gap: 'lg' }))
    const md = bars(m(base))
    const mid = (b: (typeof lg)[number]) => num(b, 'x') + num(b, 'width') / 2
    expect(mid(lg[0]!)).toBeCloseTo(mid(md[0]!), 1)
  })
})

describe('BarChart variants: size', () => {
  it.each([
    ['sm', '0 0 480 160'],
    ['md', '0 0 480 240'],
    ['lg', '0 0 480 320'],
  ])('%s sets the viewBox height', (size, viewBox) => {
    expect(m({ ...base, size }).find('svg').attributes('viewBox')).toBe(viewBox)
  })
  it('an explicit height wins over size', () => {
    expect(m({ ...base, size: 'lg', height: 100 }).find('svg').attributes('viewBox')).toBe('0 0 480 100')
  })
  it('unknown sizes fall back to md', () => {
    expect(m({ ...base, size: 'huge' }).find('svg').attributes('viewBox')).toBe('0 0 480 240')
  })
})

describe('BarChart variants: showValues', () => {
  it('prints one label per bar with the compact formatter', () => {
    const w = m({ ...base, showValues: true })
    expect(w.find('[data-slot="bar-chart-values"]').exists()).toBe(true)
    expect(values(w).map((v) => v.text())).toEqual(['3', '5', '2'])
    expect(m({ ...base, showValues: true, series: [{ name: 'S', data: [1200, 5000, 900] }] }).findAll('[data-slot="bar-chart-value"]').map((v) => v.text())).toEqual(['1.2K', '5K', '900'])
  })
  it('uses the value formatter', () => {
    const w = m({ ...base, showValues: true, valueFormatter: (n: number) => `${n} u` })
    expect(values(w).map((v) => v.text())).toEqual(['3 u', '5 u', '2 u'])
  })
  it('puts positive labels above the bar and negative labels below it', () => {
    const w = m({ labels: ['A', 'B'], series: [{ name: 'S', data: [5, -4] }], label: 'Sample', showValues: true })
    const [pos, neg] = bars(w)
    const [lp, ln] = values(w)
    expect(num(lp!, 'y')).toBeLessThan(num(pos!, 'y'))
    expect(num(ln!, 'y')).toBeGreaterThan(num(neg!, 'y') + num(neg!, 'height'))
    expect(lp!.attributes('text-anchor')).toBe('middle')
  })
  it('reserves room so the labels stay inside the image', () => {
    const w = m({ labels: ['A', 'B'], series: [{ name: 'S', data: [5, -4] }], label: 'Sample', showValues: true })
    const ys = values(w).map((v) => num(v, 'y'))
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(6)
    expect(Math.max(...ys)).toBeLessThanOrEqual(240 - 6)
  })
  it('shortens bars a little to make room, and only when labels are on', () => {
    const off = Math.max(...bars(m(base)).map((b) => num(b, 'height')))
    const on = Math.max(...bars(m({ ...base, showValues: true })).map((b) => num(b, 'height')))
    expect(on).toBeLessThan(off)
  })
  it('horizontal labels sit at the bar end and are anchored away from it', () => {
    const w = m({ labels: ['A', 'B'], series: [{ name: 'S', data: [5, -4] }], label: 'Sample', showValues: true, orientation: 'horizontal' })
    const [pos, neg] = bars(w)
    const [lp, ln] = values(w)
    expect(lp!.attributes('text-anchor')).toBe('start')
    expect(num(lp!, 'x')).toBeGreaterThan(num(pos!, 'x') + num(pos!, 'width'))
    expect(ln!.attributes('text-anchor')).toBe('end')
    expect(num(ln!, 'x')).toBeLessThan(num(neg!, 'x'))
  })
  it('horizontal labels reach the bar end of the longest bar without leaving the image', () => {
    const w = m({ labels: ['A'], series: [{ name: 'S', data: [1234567] }], label: 'Sample', showValues: true, orientation: 'horizontal' })
    const v = values(w)[0]!
    expect(v.text()).toBe('1.2M')
    expect(num(v, 'x') + 4 * 0.58 * 12).toBeLessThanOrEqual(480)
  })
  it('labels the category total of stacked bars, once per category', () => {
    const w = m({ ...two, variant: 'stacked', showValues: true })
    expect(values(w).map((v) => v.text())).toEqual(['6', '9', '8'])
    const stackTop = Math.min(...bars(w).filter((b) => b.attributes('data-index') === '0').map((b) => num(b, 'y')))
    expect(num(values(w)[0]!, 'y')).toBeLessThan(stackTop)
  })
  it('stacked totals with negatives sit past the longer side', () => {
    const w = m({ labels: ['A'], series: [{ name: 'S', data: [2] }, { name: 'T', data: [-6] }], label: 'Sample', variant: 'stacked', showValues: true })
    expect(values(w).map((v) => v.text())).toEqual(['-4'])
    const lowest = Math.max(...bars(w).map((b) => num(b, 'y') + num(b, 'height')))
    expect(num(values(w)[0]!, 'y')).toBeGreaterThan(lowest)
  })
  it('skips categories without values and missing cells', () => {
    const w = m({ labels: ['A', 'B', 'C'], series: [{ name: 'S', data: [1, Number.NaN, 3] }], label: 'Sample', showValues: true })
    expect(values(w).map((v) => v.text())).toEqual(['1', '3'])
    const s = m({ labels: ['A', 'B'], series: [{ name: 'S', data: [1, Number.NaN] }], label: 'Sample', variant: 'stacked', showValues: true })
    expect(values(s).map((v) => v.text())).toEqual(['1'])
    const none = m({ labels: ['A', 'B'], series: [{ name: 'S', data: [Number.NaN, 2] }, { name: 'T', data: [Number.NaN, 1] }], label: 'Sample', variant: 'stacked', showValues: true })
    expect(values(none).map((v) => v.text())).toEqual(['3'])
  })
  it('leaves out labels that do not fit their bar', () => {
    const labels = Array.from({ length: 40 }, (_, i) => `C${i}`)
    const w = m({ labels, series: [{ name: 'S', data: labels.map((_, i) => 1000 + i) }], label: 'Sample', showValues: true })
    expect(values(w)).toHaveLength(0)
    expect(w.find('[data-slot="bar-chart-values"]').exists()).toBe(false)
    expect(bars(w)).toHaveLength(40)
    const h = m({ labels, series: [{ name: 'S', data: labels.map((_, i) => i) }], label: 'Sample', showValues: true, orientation: 'horizontal', height: 120 })
    expect(values(h)).toHaveLength(0)
  })
  it('does not change the text alternatives', () => {
    const off = m({ ...two, label: 'Sample' })
    const on = m({ ...two, label: 'Sample', showValues: true })
    expect(on.find('[data-slot="chart-data-table"]').html()).toBe(off.find('[data-slot="chart-data-table"]').html())
    expect(on.find('svg').attributes('aria-label')).toBe(off.find('svg').attributes('aria-label'))
    expect(on.find('svg').attributes('role')).toBe('img')
  })
})

describe('BarChart variants: grid', () => {
  const gridOf = (w: ReturnType<typeof m>) => w.find('[data-slot="bar-chart-grid"]')
  it('none removes the grid even when showGrid is on', () => {
    expect(gridOf(m({ ...base, grid: 'none' })).exists()).toBe(false)
  })
  it('a grid style overrides showGrid=false', () => {
    expect(gridOf(m({ ...base, grid: 'value', showGrid: false })).exists()).toBe(true)
    expect(gridOf(m({ ...base, showGrid: false })).exists()).toBe(false)
  })
  it('dashed dashes every value line', () => {
    const g = gridOf(m({ ...base, grid: 'dashed' }))
    expect(g.attributes('data-grid')).toBe('dashed')
    const lines = g.findAll('line')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every((l) => l.attributes('stroke-dasharray') === '3 4')).toBe(true)
  })
  it('full adds a separator between categories (count + 1 lines)', () => {
    const g = gridOf(m({ ...base, grid: 'full' }))
    expect(g.attributes('data-grid')).toBe('full')
    const bands = g.findAll('[data-slot="bar-chart-grid-band"]')
    expect(bands).toHaveLength(4)
    expect(bands[0]!.attributes('y1')).toBeDefined()
    expect(bands[0]!.attributes('x1')).toBe(bands[0]!.attributes('x2'))
  })
  it('full on horizontal bars draws horizontal separators', () => {
    const bands = gridOf(m({ ...base, grid: 'full', orientation: 'horizontal' })).findAll('[data-slot="bar-chart-grid-band"]')
    expect(bands).toHaveLength(4)
    expect(bands[0]!.attributes('y1')).toBe(bands[0]!.attributes('y2'))
  })
  it('thins separators beyond 60 categories', () => {
    const labels = Array.from({ length: 200 }, (_, i) => `C${i}`)
    const bands = gridOf(m({ labels, series: [{ name: 'S', data: labels.map((_, i) => i) }], label: 'Sample', grid: 'full' })).findAll('[data-slot="bar-chart-grid-band"]')
    expect(bands.length).toBeLessThanOrEqual(101)
    expect(bands.length).toBeGreaterThan(20)
  })
  it('an unknown style follows showGrid', () => {
    expect(m({ ...base, grid: 'bogus' }).html()).toBe(m(base).html())
    expect(gridOf(m({ ...base, grid: 'bogus', showGrid: false })).exists()).toBe(false)
  })
  it('the other styles draw no separators', () => {
    expect(m({ ...base, grid: 'value' }).findAll('[data-slot="bar-chart-grid-band"]')).toHaveLength(0)
  })
})

describe('BarChart variants: combinations and customisation', () => {
  it('horizontal stacked with values, pill radius, wide gap and full grid renders every part', () => {
    const w = m({ ...two, orientation: 'horizontal', variant: 'stacked', showValues: true, rounded: 'full', gap: 'lg', grid: 'dashed', size: 'lg' })
    expect(bars(w)).toHaveLength(6)
    expect(values(w)).toHaveLength(3)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 320')
    expect(w.find('[data-slot="bar-chart-legend"]').exists()).toBe(true)
    expect(bars(w).every((b) => num(b, 'rx') > 0)).toBe(true)
  })
  it('grouped multi-series with values labels every bar', () => {
    const w = m({ ...two, showValues: true, rounded: 'sm', gap: 'sm' })
    expect(values(w)).toHaveLength(6)
  })
  it('the class prop is merged last', () => {
    const w = m({ ...base, class: 'max-w-xs gap-6' })
    expect(w.classes()).toContain('max-w-xs')
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).not.toContain('gap-2')
  })
  it('variants never change the name or the hidden table', () => {
    const plain = m(two)
    const styled = m({ ...two, variant: 'stacked', rounded: 'full', gap: 'lg', size: 'sm', grid: 'full', showValues: true })
    expect(styled.find('svg').attributes('aria-label')).toBe(plain.find('svg').attributes('aria-label'))
    expect(styled.find('table').html()).toBe(plain.find('table').html())
  })
})

describe('BarChart variants: edge cases', () => {
  it('empty data still shows the empty state with every variant set', () => {
    const w = m({ labels: [], series: [], label: 'Sample', variant: 'stacked', showValues: true, grid: 'full', rounded: 'full', size: 'lg' })
    expect(w.find('[data-slot="bar-chart-empty"]').exists()).toBe(true)
    expect(w.find('svg').exists()).toBe(false)
  })
  it('a single bar with values, zeros and negatives', () => {
    const w = m({ labels: ['Only'], series: [{ name: 'S', data: [0] }], label: 'Sample', showValues: true, grid: 'full' })
    expect(values(w).map((v) => v.text())).toEqual(['0'])
    const neg = m({ labels: ['A', 'B'], series: [{ name: 'S', data: [-3, -8] }], label: 'Sample', showValues: true, rounded: 'full' })
    expect(values(neg).map((v) => v.text())).toEqual(['-3', '-8'])
  })
  it('long category labels stay truncated with values on', () => {
    const w = m({ labels: ['A category with a very long name indeed'], series: [{ name: 'S', data: [3] }], label: 'Sample', orientation: 'horizontal', showValues: true })
    expect(w.find('[data-slot="bar-chart-category"]').text()).toContain('…')
    expect(values(w)).toHaveLength(1)
  })
})
