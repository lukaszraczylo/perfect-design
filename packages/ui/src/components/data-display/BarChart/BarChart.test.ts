import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BarChart from './BarChart.vue'
import { estimateTextWidth, LABEL_GAP, LABEL_SAFETY } from '../_chart/chartKit'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => mount(BarChart, { props: props as never, attrs })
const bars = (w: ReturnType<typeof m>) => w.findAll('[data-slot="bar-chart-bar"]')
const titles = (w: ReturnType<typeof m>) => bars(w).map((b) => b.find('title').text())
const base = { labels: ['Jan', 'Feb', 'Mar'], series: [{ name: 'Sales', data: [10, 20, 30] }] }

describe('BarChart: good path', () => {
  it('renders svg role=img, data-slot, viewBox and summary label', () => {
    const w = m(base)
    const svg = w.find('svg')
    expect(w.attributes('data-slot')).toBe('bar-chart')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('viewBox')).toBe('0 0 480 240')
    expect(svg.attributes('aria-label')).toBe('Bar chart: 3 categories, 1 series, values from 10 to 30')
    expect(bars(w)).toHaveLength(3)
  })
  it('bar titles use "label, series: value" and taller bars for bigger values', () => {
    const w = m(base)
    expect(titles(w)).toEqual(['Jan, Sales: 10', 'Feb, Sales: 20', 'Mar, Sales: 30'])
    const hs = bars(w).map((b) => Number(b.attributes('height')))
    expect(hs[0]!).toBeLessThan(hs[1]!)
    expect(hs[1]!).toBeLessThan(hs[2]!)
  })
  it('uses valueFormatter for titles and ticks', () => {
    const w = m({ ...base, valueFormatter: (n: number) => `$${n}` })
    expect(titles(w)[0]).toBe('Jan, Sales: $10')
    expect(w.findAll('[data-slot="bar-chart-tick"]').every((t) => t.text().startsWith('$'))).toBe(true)
  })
  it('grouped multi-series: rect per series x category, legend auto-shown', () => {
    const w = m({ labels: ['A', 'B'], series: [{ name: 'x', data: [1, 2] }, { name: 'y', data: [3, 4], tone: 'success' }] })
    expect(bars(w)).toHaveLength(4)
    expect(w.find('[data-slot="bar-chart-legend"]').exists()).toBe(true)
    expect(w.findAll('[data-slot="bar-chart-legend-item"]')).toHaveLength(2)
    expect(bars(w)[0]!.classes()).toContain('fill-chart-1')
    expect(bars(w)[1]!.classes()).toContain('fill-success')
  })
  it('single series hides legend by default, showLegend forces it; false hides', () => {
    expect(m(base).find('[data-slot="bar-chart-legend"]').exists()).toBe(false)
    expect(m({ ...base, showLegend: true }).find('[data-slot="bar-chart-legend"]').exists()).toBe(true)
    const two = { labels: ['A'], series: [{ name: 'x', data: [1] }, { name: 'y', data: [2] }] }
    expect(m({ ...two, showLegend: false }).find('[data-slot="bar-chart-legend"]').exists()).toBe(false)
  })
  it('grid and axis toggles', () => {
    expect(m(base).find('[data-slot="bar-chart-grid"]').exists()).toBe(true)
    expect(m(base).find('[data-slot="bar-chart-axis"]').exists()).toBe(true)
    const w = m({ ...base, showGrid: false, showAxis: false })
    expect(w.find('[data-slot="bar-chart-grid"]').exists()).toBe(false)
    expect(w.find('[data-slot="bar-chart-axis"]').exists()).toBe(false)
    expect(w.find('[data-slot="bar-chart-baseline"]').exists()).toBe(false)
    expect(bars(w)).toHaveLength(3)
  })
  it('horizontal orientation: bars grow in width, all labels listed', () => {
    const w = m({ ...base, orientation: 'horizontal' })
    const ws = bars(w).map((b) => Number(b.attributes('width')))
    expect(ws[0]!).toBeLessThan(ws[2]!)
    expect(w.findAll('[data-slot="bar-chart-category"]').map((c) => c.text())).toEqual(['Jan', 'Feb', 'Mar'])
  })
  it('stacked vertical: segments of a category sit on each other', () => {
    const w = m({ labels: ['A'], series: [{ name: 'x', data: [10] }, { name: 'y', data: [5] }], stacked: true })
    const [a, b] = bars(w)
    const yA = Number(a!.attributes('y'))
    const hB = Number(b!.attributes('height'))
    expect(Number(b!.attributes('y')) + hB).toBeCloseTo(yA, 1)
    expect(a!.attributes('x')).toBe(b!.attributes('x'))
  })
  it('stacked horizontal works too', () => {
    const w = m({ labels: ['A'], series: [{ name: 'x', data: [10] }, { name: 'y', data: [5] }], stacked: true, orientation: 'horizontal' })
    const [a, b] = bars(w)
    expect(Number(a!.attributes('x')) + Number(a!.attributes('width'))).toBeCloseTo(Number(b!.attributes('x')), 1)
  })
})

describe('BarChart: customisation', () => {
  it('merges class last and passes attrs / label through', () => {
    const w = m({ ...base, class: 'max-w-sm w-1/2', label: 'Monthly sales' }, { id: 'c1', 'data-x': 'y' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).toContain('w-1/2')
    expect(w.classes()).not.toContain('w-full')
    expect(w.attributes('id')).toBe('c1')
    expect(w.attributes('data-x')).toBe('y')
    expect(w.find('svg').attributes('aria-label')).toBe('Monthly sales')
  })
  it('custom dimensions set the viewBox', () => {
    expect(m({ ...base, width: 300, height: 100 }).find('svg').attributes('viewBox')).toBe('0 0 300 100')
    expect(m({ ...base, width: -1, height: 0 }).find('svg').attributes('viewBox')).toBe('0 0 480 240')
  })
})

describe('BarChart: empty / bad input', () => {
  it.each([
    ['no labels or series', { labels: [], series: [] }],
    ['series without data', { labels: [], series: [{ name: 'x', data: [] }] }],
    ['all non-finite', { labels: ['a', 'b'], series: [{ name: 'x', data: [NaN, Infinity] }] }],
    ['garbage props', { labels: null, series: 'nope' }],
  ])('%s → empty state', (_n, p) => {
    const w = m(p)
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('No data')
    expect(w.text()).toBe('No data')
    expect(w.find('svg').exists()).toBe(false)
  })
  it('emptyText and label customise the empty state; class merged', () => {
    const w = m({ labels: [], series: [], emptyText: 'Nothing yet', class: 'h-64' })
    expect(w.text()).toBe('Nothing yet')
    expect(w.attributes('aria-label')).toBe('Nothing yet')
    expect(w.classes()).toContain('h-64')
    expect(m({ labels: [], series: [], label: 'Revenue' }).attributes('aria-label')).toBe('Revenue')
  })
})

describe('BarChart: edge cases', () => {
  it('non-finite values render no bar but an n/a hit area with title', () => {
    const w = m({ labels: ['a', 'b', 'c'], series: [{ name: 's', data: [1, NaN, -Infinity] }] })
    expect(bars(w)).toHaveLength(1)
    const na = w.findAll('[data-slot="bar-chart-bar-empty"]')
    expect(na.map((n) => n.find('title').text())).toEqual(['b, s: n/a', 'c, s: n/a'])
    expect(na[0]!.classes()).toContain('fill-transparent')
  })
  it('negative values extend below the zero line (vertical)', () => {
    const w = m({ labels: ['a', 'b'], series: [{ name: 's', data: [10, -10] }] })
    const [pos, neg] = bars(w)
    const zero = Number(w.find('[data-slot="bar-chart-baseline"]').attributes('y1'))
    expect(Number(pos!.attributes('y')) + Number(pos!.attributes('height'))).toBeCloseTo(zero, 1)
    expect(Number(neg!.attributes('y'))).toBeCloseTo(zero, 1)
  })
  it('negative values extend left of zero (horizontal)', () => {
    const w = m({ labels: ['a', 'b'], series: [{ name: 's', data: [10, -10] }], orientation: 'horizontal' })
    const [pos, neg] = bars(w)
    const zero = Number(w.find('[data-slot="bar-chart-baseline"]').attributes('x1'))
    expect(Number(pos!.attributes('x'))).toBeCloseTo(zero, 1)
    expect(Number(neg!.attributes('x')) + Number(neg!.attributes('width'))).toBeCloseTo(zero, 1)
  })
  it('stacked: positives go up and negatives go down separately', () => {
    const w = m({
      labels: ['A'], stacked: true,
      series: [{ name: 'p1', data: [10] }, { name: 'n1', data: [-4] }, { name: 'p2', data: [5] }, { name: 'n2', data: [-2] }, { name: 'z', data: [0] }],
    })
    const r = bars(w).map((b) => ({ y: Number(b.attributes('y')), h: Number(b.attributes('height')) }))
    const zero = Number(w.find('[data-slot="bar-chart-baseline"]').attributes('y1'))
    expect(r[0]!.y + r[0]!.h).toBeCloseTo(zero, 1) // p1 sits on zero
    expect(r[1]!.y).toBeCloseTo(zero, 1) // n1 hangs from zero
    expect(r[2]!.y + r[2]!.h).toBeCloseTo(r[0]!.y, 1) // p2 on top of p1
    expect(r[3]!.y).toBeCloseTo(r[1]!.y + r[1]!.h, 1) // n2 below n1
    expect(r[4]!.h).toBe(0)
  })
  it('stacked overflow (1e308 + 1e308) becomes n/a instead of broken geometry', () => {
    const w = m({ labels: ['A'], stacked: true, series: [{ name: 'x', data: [1e308] }, { name: 'y', data: [1e308] }, { name: 'z', data: [-1e308] }, { name: 'w', data: [-1e308] }] })
    expect(w.html()).not.toMatch(/NaN|Infinity/)
    expect(w.findAll('[data-slot="bar-chart-bar-empty"]').length).toBe(2)
  })
  it('huge values keep finite geometry', () => {
    const w = m({ labels: ['a', 'b'], series: [{ name: 's', data: [1e308, -1e308] }] })
    expect(w.html()).not.toMatch(/NaN|Infinity/)
    expect(bars(w)).toHaveLength(2)
    const h = m({ labels: ['a', 'b'], series: [{ name: 's', data: [1e308, 1] }], orientation: 'horizontal' })
    expect(h.html()).not.toMatch(/NaN|Infinity/)
  })
  it('all zeros and all-equal data still draw with a sane axis', () => {
    const z = m({ labels: ['a', 'b'], series: [{ name: 's', data: [0, 0] }] })
    expect(bars(z)).toHaveLength(2)
    expect(bars(z).every((b) => b.attributes('height') === '0')).toBe(true)
    expect(z.findAll('[data-slot="bar-chart-tick"]').length).toBeGreaterThan(1)
    const e = m({ labels: ['a', 'b'], series: [{ name: 's', data: [7, 7] }] })
    expect(new Set(bars(e).map((b) => b.attributes('height'))).size).toBe(1)
  })
  it('mismatched lengths: count = max(labels, longest series), missing label is empty', () => {
    const w = m({ labels: ['a'], series: [{ name: 'x', data: [1, 2, 3] }, { name: 'y', data: [4] }] })
    expect(bars(w)).toHaveLength(4) // x: 3 bars, y: 1 bar; the 2 missing y cells are n/a
    expect(w.findAll('[data-slot="bar-chart-bar-empty"]')).toHaveLength(2)
    expect(bars(w)[2]!.find('title').element.textContent).toBe(', x: 2')
    const more = m({ labels: ['a', 'b', 'c'], series: [{ name: 'x', data: [1] }] })
    expect(bars(more)).toHaveLength(1)
    expect(more.find('svg').attributes('aria-label')).toContain('3 categories')
  })
  it('duplicate labels are fine', () => {
    const w = m({ labels: ['a', 'a', 'a'], series: [{ name: 's', data: [1, 2, 3] }] })
    expect(bars(w)).toHaveLength(3)
    expect(w.findAll('[data-slot="bar-chart-category"]')).toHaveLength(3)
  })
  it('more than 5 series cycle tones', () => {
    const series = Array.from({ length: 7 }, (_, i) => ({ name: `s${i}`, data: [i + 1] }))
    const w = m({ labels: ['a'], series })
    const cls = bars(w).map((b) => b.classes().find((c) => c.startsWith('fill-chart')))
    expect(cls).toEqual(['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5', 'fill-chart-1', 'fill-chart-2'])
    expect(w.findAll('[data-slot="bar-chart-legend-item"]')).toHaveLength(7)
  })
  it('unnamed series get a fallback name', () => {
    const w = m({ labels: ['a'], series: [{ data: [1] }] })
    expect(titles(w)[0]).toBe('a, Series 1: 1')
  })
  it('thins crowded x labels and truncates long ones with the full text in <title>', () => {
    const labels = Array.from({ length: 60 }, (_, i) => `Category number ${i}`)
    const w = m({ labels, series: [{ name: 's', data: labels.map((_, i) => i) }] })
    const cats = w.findAll('[data-slot="bar-chart-category"]')
    expect(cats.length).toBeLessThan(60)
    expect(cats.length).toBeGreaterThan(0)
    expect(cats.some((c) => c.text().includes('…'))).toBe(true)
    const t = cats.find((c) => c.find('title').exists())!
    expect(t.find('title').text()).toMatch(/^Category number/)
    expect(bars(w)).toHaveLength(60)
  })
  it('horizontal truncates long labels at 14 chars and thins when crowded', () => {
    const labels = ['An extraordinarily long category name', 'short', ...Array.from({ length: 40 }, (_, i) => `c${i}`)]
    const w = m({ labels, orientation: 'horizontal', series: [{ name: 's', data: labels.map(() => 1) }], height: 120 })
    const cats = w.findAll('[data-slot="bar-chart-category"]')
    const first = cats[0]!.element.firstChild!.textContent!
    expect(first).toHaveLength(14)
    expect(first.endsWith('…')).toBe(true)
    expect(cats[0]!.find('title').text()).toBe('An extraordinarily long category name')
    expect(cats.length).toBeLessThan(labels.length)
  })
  describe('horizontal category gutter', () => {
    const run = (labels: string[], width: number) => m({ labels, width, orientation: 'horizontal', series: [{ name: 's', data: labels.map((_, i) => i + 1) }] })
    const cats = (w: ReturnType<typeof m>) => w.findAll('[data-slot="bar-chart-category"]').map((c) => ({ text: c.element.firstChild!.textContent!, x: Number(c.attributes('x')) }))
    const plotLeft = (w: ReturnType<typeof m>) => Number(w.find('[data-slot="bar-chart-baseline"]').attributes('x1'))
    const WIDE = ['Warehouse Maintenance', 'MMMMWWWW', 'mmmmmmmmmm', 'WWWWWWWWWWWWWW', 'Quarterly Review', 'iiiiiiiiiiiiii', 'Shipping & Handling @ 100%']

    it.each([320, 768, 1280])('no label starts left of the safety margin at %ipx wide', (width) => {
      const w = run(WIDE, width)
      for (const c of cats(w)) {
        const start = c.x - estimateTextWidth(c.text, 12)
        expect(start, `${c.text} at ${width}px starts at ${start}`).toBeGreaterThanOrEqual(LABEL_SAFETY)
      }
    })
    it.each([320, 768, 1280])('the plot starts a label gap right of the widest label and never past 40% of the chart at %ipx', (width) => {
      const w = run(WIDE, width)
      const widest = Math.max(...cats(w).map((c) => estimateTextWidth(c.text, 12)))
      expect(plotLeft(w)).toBeGreaterThanOrEqual(widest + LABEL_GAP + LABEL_SAFETY - 1)
      expect(plotLeft(w)).toBeLessThanOrEqual(width * 0.4 + 0.5)
      for (const c of cats(w)) expect(c.x).toBe(plotLeft(w) - LABEL_GAP)
    })
    it.each([320, 768, 1280])('keeps the last value tick label inside the chart at %ipx', (width) => {
      const w = m({ labels: ['a', 'b'], width, orientation: 'horizontal', valueFormatter: (n: number) => `${n}%`, series: [{ name: 's', data: [50, 100] }] })
      const ticks = w.findAll('[data-slot="bar-chart-tick"]')
      const last = ticks[ticks.length - 1]!
      expect(Number(last.attributes('x')) + estimateTextWidth(last.text(), 12) / 2).toBeLessThanOrEqual(width - LABEL_SAFETY + 0.5)
    })
    it('wide letters get a wider gutter than the same number of narrow ones', () => {
      const wide = plotLeft(run(['MMMMWWWW', 'WWWW'], 480))
      const narrow = plotLeft(run(['iiiiiiii', 'iiii'], 480))
      expect(wide).toBeGreaterThan(narrow + 30)
      // The flat 0.58em estimate gave 8 * 12 * 0.58 + 8 = 63.7 for any 8-glyph label.
      expect(wide).toBeGreaterThan(8 * 12 * 0.58 + 8 + 20)
    })
    it('cuts a label that does not fit the 40% budget with an ellipsis and keeps the full text in <title>', () => {
      const w = run(['WWWWWWWWWWWWWW', 'ok'], 320)
      const first = cats(w)[0]!
      expect(first.text.endsWith('…')).toBe(true)
      expect(first.text.length).toBeLessThan(14)
      expect(w.findAll('[data-slot="bar-chart-category"]')[0]!.find('title').text()).toBe('WWWWWWWWWWWWWW')
      expect(cats(w)[1]!.text).toBe('ok')
    })
    it('does not cut a label that fits and gives it no title', () => {
      const w = run(['MMMMWWWW'], 480)
      expect(cats(w)[0]!.text).toBe('MMMMWWWW')
      expect(w.find('[data-slot="bar-chart-category"] title').exists()).toBe(false)
    })
    it('keeps the bars inside the plot for wide labels on a tiny chart', () => {
      const w = run(['WWWWWWWWWWWWWW'], 40)
      expect(w.html()).not.toMatch(/NaN|Infinity/)
      for (const b of bars(w)) expect(Number(b.attributes('x'))).toBeGreaterThanOrEqual(0)
    })
    it('handles CJK, emoji and empty labels', () => {
      const w = run(['日本語のカテゴリ', '😀😀😀', ''], 320)
      for (const c of cats(w)) expect(c.x - estimateTextWidth(c.text, 12)).toBeGreaterThanOrEqual(LABEL_SAFETY)
      expect(w.html()).not.toMatch(/NaN|Infinity/)
    })
    it('RTL page: labels stay anchored to the end of the left gutter', () => {
      const w = mount(BarChart, { props: { labels: ['Warehouse Maintenance'], series: [{ name: 's', data: [1] }], orientation: 'horizontal' } as never, attrs: { dir: 'rtl' } })
      const c = w.find('[data-slot="bar-chart-category"]')
      expect(c.attributes('text-anchor')).toBe('end')
      // `text-anchor: end` flips with the inherited direction, so the svg pins the drawing to ltr (checked in a real browser at 320, 768, 1280).
      expect(w.find('svg').classes()).toContain('[direction:ltr]')
    })
    it('vertical charts keep centred category labels', () => {
      const w = m({ ...base, width: 480 })
      expect(w.find('[data-slot="bar-chart-category"]').attributes('text-anchor')).toBe('middle')
    })
  })
  it('axis-less chart with tiny viewBox stays finite', () => {
    const w = m({ ...base, width: 10, height: 10, showAxis: false })
    expect(w.html()).not.toMatch(/NaN|Infinity/)
    const a = m({ ...base, width: 10, height: 10, orientation: 'horizontal' })
    expect(a.html()).not.toMatch(/NaN|Infinity/)
  })
  it('1000 categories x 3 series smoke', () => {
    const labels = Array.from({ length: 1000 }, (_, i) => `d${i}`)
    const series = [0, 1, 2].map((k) => ({ name: `s${k}`, data: labels.map((_, i) => (i * (k + 1)) % 97) }))
    const t = performance.now()
    const w = m({ labels, series })
    expect(bars(w)).toHaveLength(3000)
    expect(performance.now() - t).toBeLessThan(3000)
  })
})
