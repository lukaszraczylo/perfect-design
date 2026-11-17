import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LineChart from './LineChart.vue'
import { estimateTextWidth } from '../_chart/chartKit'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => mount(LineChart, { props: props as never, attrs })
const lines = (w: ReturnType<typeof m>) => w.findAll('[data-slot="line-chart-line"]')
const dots = (w: ReturnType<typeof m>) => w.findAll('[data-slot="line-chart-dot"]')
const base = { labels: ['Mon', 'Tue', 'Wed', 'Thu'], series: [{ name: 'Visits', data: [5, 9, 3, 12] }] }
const noBad = (w: ReturnType<typeof m>) => expect(w.html()).not.toMatch(/NaN|Infinity/)

describe('LineChart: good path', () => {
  it('renders svg role=img, data-slot, viewBox, summary label, path and titled dots', () => {
    const w = m(base)
    const svg = w.find('svg')
    expect(w.attributes('data-slot')).toBe('line-chart')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('viewBox')).toBe('0 0 480 240')
    expect(svg.attributes('aria-label')).toBe('Line chart: 4 points per series, 1 series, values from 3 to 12')
    expect(lines(w)).toHaveLength(1)
    expect(lines(w)[0]!.attributes('d')).toMatch(/^M[\d.]+,[\d.]+ L/)
    expect(lines(w)[0]!.classes()).toContain('stroke-chart-1')
    expect(dots(w)).toHaveLength(4)
    expect(dots(w)[1]!.find('title').text()).toBe('Tue, Visits: 9')
  })
  it('y axis uses nice ticks and gridlines', () => {
    const w = m(base)
    const ticks = w.findAll('[data-slot="line-chart-tick"]').map((t) => t.text())
    expect(ticks.length).toBeGreaterThan(2)
    expect(w.findAll('[data-slot="line-chart-grid"] line')).toHaveLength(ticks.length)
    expect(w.findAll('[data-slot="line-chart-category"]').map((c) => c.text())).toEqual(['Mon', 'Tue', 'Wed', 'Thu'])
  })
  it('higher values have smaller y (up is bigger)', () => {
    const w = m({ labels: ['a', 'b'], series: [{ name: 's', data: [0, 10] }] })
    const [d0, d1] = dots(w)
    expect(Number(d1!.attributes('cy'))).toBeLessThan(Number(d0!.attributes('cy')))
  })
  it('multi-series: a line per series, legend auto, tones cycle', () => {
    const w = m({ labels: ['a', 'b'], series: [{ name: 'x', data: [1, 2] }, { name: 'y', data: [2, 1], tone: 'danger' }] })
    expect(lines(w)).toHaveLength(2)
    expect(lines(w)[1]!.classes()).toContain('stroke-destructive')
    expect(w.findAll('[data-slot="line-chart-legend-item"]')).toHaveLength(2)
    expect(m(base).find('[data-slot="line-chart-legend"]').exists()).toBe(false)
    expect(m({ ...base, showLegend: true }).find('[data-slot="line-chart-legend"]').exists()).toBe(true)
  })
  it('area adds soft fill under each line', () => {
    expect(m(base).find('[data-slot="line-chart-area"]').exists()).toBe(false)
    const a = m({ ...base, area: true }).find('[data-slot="line-chart-area"]')
    expect(a.attributes('d')).toMatch(/Z$/)
    expect(a.classes()).toContain('fill-chart-1/15')
  })
  it('valueFormatter applies to ticks and dot titles', () => {
    const w = m({ ...base, valueFormatter: (n: number) => `${n}ms` })
    expect(dots(w)[0]!.find('title').text()).toBe('Mon, Visits: 5ms')
    expect(w.findAll('[data-slot="line-chart-tick"]').every((t) => t.text().endsWith('ms'))).toBe(true)
  })
  it('grid/axis toggles', () => {
    const w = m({ ...base, showGrid: false, showAxis: false })
    expect(w.find('[data-slot="line-chart-grid"]').exists()).toBe(false)
    expect(w.find('[data-slot="line-chart-axis"]').exists()).toBe(false)
    expect(lines(w)).toHaveLength(1)
    noBad(w)
  })
})

describe('LineChart: dots', () => {
  const many = (n: number) => ({ labels: Array.from({ length: n }, (_, i) => `p${i}`), series: [{ name: 's', data: Array.from({ length: n }, (_, i) => i) }] })
  it('auto: on up to 60 points, off beyond', () => {
    expect(dots(m(many(60)))).toHaveLength(60)
    expect(dots(m(many(61)))).toHaveLength(0)
  })
  it('true/false override auto', () => {
    expect(dots(m({ ...many(61), showDots: true }))).toHaveLength(61)
    expect(dots(m({ ...many(5), showDots: false }))).toHaveLength(0)
  })
  it('single point per series draws a dot even when showDots=false, and no line', () => {
    const w = m({ labels: ['only'], series: [{ name: 's', data: [3] }], showDots: false })
    expect(dots(w)).toHaveLength(1)
    expect(lines(w)).toHaveLength(0)
    expect(dots(w)[0]!.find('title').text()).toBe('only, s: 3')
    noBad(w)
  })
  it('isolated point between gaps is drawn as a dot with showDots=false', () => {
    const w = m({ labels: ['a', 'b', 'c', 'd', 'e', 'f'], series: [{ name: 's', data: [1, 2, NaN, 5, NaN, 7] }], showDots: false })
    expect(dots(w)).toHaveLength(2)
    expect(lines(w)[0]!.attributes('d')!.match(/M/g)!.length).toBeGreaterThanOrEqual(1)
  })
})

describe('LineChart: customisation', () => {
  it('merges class, passes attrs, label overrides summary', () => {
    const w = m({ ...base, class: 'max-w-md w-1/2', label: 'Traffic' }, { id: 'lc', 'data-q': '1' })
    expect(w.classes()).toContain('max-w-md')
    expect(w.classes()).toContain('w-1/2')
    expect(w.classes()).not.toContain('w-full')
    expect(w.attributes('id')).toBe('lc')
    expect(w.attributes('data-q')).toBe('1')
    expect(w.find('svg').attributes('aria-label')).toBe('Traffic')
  })
  it('dimensions with fallback', () => {
    expect(m({ ...base, width: 320, height: 120 }).find('svg').attributes('viewBox')).toBe('0 0 320 120')
    expect(m({ ...base, width: NaN, height: -3 }).find('svg').attributes('viewBox')).toBe('0 0 480 240')
  })
})

describe('LineChart: empty and bad input', () => {
  it.each([
    ['empty arrays', { labels: [], series: [] }],
    ['no data points', { labels: ['a'], series: [{ name: 'x', data: [] }] }],
    ['all NaN', { labels: ['a', 'b'], series: [{ name: 'x', data: [NaN, Infinity] }] }],
    ['garbage', { labels: undefined, series: 7 }],
  ])('%s → empty state', (_n, p) => {
    const w = m(p)
    expect(w.attributes('role')).toBe('img')
    expect(w.text()).toBe('No data')
    expect(w.attributes('aria-label')).toBe('No data')
    expect(w.find('svg').exists()).toBe(false)
  })
  it('emptyText / label / class on empty state', () => {
    const w = m({ labels: [], series: [], emptyText: 'Nothing', label: 'CPU', class: 'h-40' })
    expect(w.text()).toBe('Nothing')
    expect(w.attributes('aria-label')).toBe('CPU')
    expect(w.classes()).toContain('h-40')
    expect(m({ labels: [], series: [], emptyText: 'Nothing' }).attributes('aria-label')).toBe('Nothing')
  })
})

describe('LineChart: edge cases', () => {
  it('NaN gap breaks the line into two sub-paths and drops the dot title value', () => {
    const w = m({ labels: ['a', 'b', 'c', 'd', 'e'], series: [{ name: 's', data: [1, 2, NaN, 4, 5] }] })
    expect(lines(w)[0]!.attributes('d')!.match(/M/g)).toHaveLength(2)
    expect(dots(w)).toHaveLength(4)
  })
  it('Infinity / -Infinity are gaps too', () => {
    const w = m({ labels: ['a', 'b', 'c', 'd', 'e'], series: [{ name: 's', data: [1, Infinity, 3, -Infinity, 5] }] })
    expect(dots(w)).toHaveLength(3)
    expect(lines(w)).toHaveLength(0)
    noBad(w)
  })
  it('flat and all-zero series render finite geometry', () => {
    for (const v of [5, 0, -3]) {
      const w = m({ labels: ['a', 'b', 'c'], series: [{ name: 's', data: [v, v, v] }] })
      noBad(w)
      expect(lines(w)).toHaveLength(1)
      const ys = new Set(dots(w).map((d) => d.attributes('cy')))
      expect(ys.size).toBe(1)
    }
  })
  it('negative values and mixed sign', () => {
    const w = m({ labels: ['a', 'b', 'c'], series: [{ name: 's', data: [-10, 5, -20] }], area: true })
    noBad(w)
    expect(w.findAll('[data-slot="line-chart-tick"]').some((t) => t.text().startsWith('-'))).toBe(true)
    expect(w.find('[data-slot="line-chart-area"]').exists()).toBe(true)
  })
  it('area baseline clamps into the plot when 0 is outside the domain', () => {
    const w = m({ labels: ['a', 'b'], series: [{ name: 's', data: [100, 200] }], area: true })
    noBad(w)
    expect(w.find('[data-slot="line-chart-area"]').attributes('d')).toMatch(/Z$/)
  })
  it('huge values', () => {
    noBad(m({ labels: ['a', 'b', 'c'], series: [{ name: 's', data: [1e308, -1e308, 0] }], area: true }))
    noBad(m({ labels: ['a', 'b'], series: [{ name: 's', data: [1e308, 1e308] }] }))
  })
  it('duplicate labels are fine', () => {
    const w = m({ labels: ['x', 'x', 'x'], series: [{ name: 's', data: [1, 2, 3] }] })
    expect(dots(w)).toHaveLength(3)
  })
  it('mismatched lengths tolerated', () => {
    const w = m({ labels: ['a', 'b'], series: [{ name: 'x', data: [1, 2, 3, 4] }, { name: 'y', data: [1] }] })
    expect(w.find('svg').attributes('aria-label')).toContain('4 points')
    expect(dots(w)).toHaveLength(5)
    expect(dots(w).find((d) => d.find('title').element.textContent === ', x: 3')).toBeTruthy()
    noBad(w)
  })
  it('more than 5 series cycle tones', () => {
    const series = Array.from({ length: 7 }, (_, i) => ({ name: `s${i}`, data: [i, i + 1] }))
    const w = m({ labels: ['a', 'b'], series })
    const cls = lines(w).map((l) => l.classes().find((c) => c.startsWith('stroke-chart')))
    expect(cls.slice(5)).toEqual(['stroke-chart-1', 'stroke-chart-2'])
    expect(w.findAll('[data-slot="line-chart-legend-item"]')).toHaveLength(7)
  })
  it('thins crowded x labels, truncating long ones with the full text in <title>', () => {
    const labels = Array.from({ length: 100 }, (_, i) => `2026-01-${i} a very long label`)
    const w = m({ labels, series: [{ name: 's', data: labels.map((_, i) => i) }] })
    const cats = w.findAll('[data-slot="line-chart-category"]')
    expect(cats.length).toBeLessThan(100)
    expect(cats.some((c) => c.find('title').exists())).toBe(true)
  })
  it('single category tiny viewBox stays finite', () => {
    noBad(m({ labels: ['a'], series: [{ name: 's', data: [1] }], width: 10, height: 10 }))
    noBad(m({ ...base, width: 12, height: 12, showAxis: false }))
  })
  it('10k-point smoke finishes quickly', () => {
    const n = 10_000
    const data = Array.from({ length: n }, (_, i) => Math.sin(i / 100) * 1000)
    const t = performance.now()
    const w = m({ labels: data.map((_, i) => `p${i}`), series: [{ name: 's', data }], area: true })
    expect(performance.now() - t).toBeLessThan(3000)
    expect(lines(w)[0]!.attributes('d')!.length).toBeGreaterThan(n)
    expect(dots(w)).toHaveLength(0)
    expect(w.findAll('[data-slot="line-chart-category"]').length).toBeLessThan(100)
  })
  it('10k points with forced dots stays linear', () => {
    const n = 10_000
    const t = performance.now()
    const w = m({ labels: [], series: [{ name: 's', data: Array.from({ length: n }, (_, i) => i) }], showDots: true })
    expect(performance.now() - t).toBeLessThan(5000)
    expect(dots(w)).toHaveLength(n)
  })
})

const textBox = (el: { attributes: (n: string) => string | undefined; text: () => string }, font = 12) => {
  const x = Number(el.attributes('x'))
  const w = estimateTextWidth(el.text(), font)
  const a = el.attributes('text-anchor')
  return a === 'end' ? [x - w, x] : a === 'start' ? [x, x + w] : [x - w / 2, x + w / 2]
}

describe('LineChart: edge tick labels stay inside the viewBox', () => {
  const clock = { labels: ['13:00:00', '13:00:05', '13:00:10'], series: [{ name: 'Load', data: [1, 3, 2] }] }
  it('a centred last label would cross the right edge, so it is end-anchored and fits', () => {
    const w = m(clock)
    const cats = w.findAll('[data-slot="line-chart-category"]')
    const last = cats[cats.length - 1]!
    const x = Number(last.attributes('x'))
    expect(x + estimateTextWidth(last.text(), 12) / 2).toBeGreaterThan(480)
    expect(last.attributes('text-anchor')).toBe('end')
    for (const c of cats) {
      const [l, r] = textBox(c)
      expect(l).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(480)
    }
  })
  it('keeps middle anchors for inner labels and fits at other widths', () => {
    for (const width of [200, 320, 480, 900]) {
      const w = m({ ...clock, width })
      const cats = w.findAll('[data-slot="line-chart-category"]')
      expect(cats[1] === undefined || cats.length < 3 || cats[1]!.attributes('text-anchor') === 'middle').toBe(true)
      for (const c of cats) {
        const [l, r] = textBox(c)
        expect(l).toBeGreaterThanOrEqual(0)
        expect(r).toBeLessThanOrEqual(width)
      }
    }
  })
  it('short labels keep the original middle anchor', () => {
    const w = m(base)
    expect(w.findAll('[data-slot="line-chart-category"]').every((c) => c.attributes('text-anchor') === 'middle')).toBe(true)
  })
})

describe('LineChart: integer ticks', () => {
  const ticks = (w: ReturnType<typeof m>) => w.findAll('[data-slot="line-chart-tick"]').map((t) => Number(t.text()))
  const counts = { labels: ['a', 'b', 'c'], series: [{ name: 'n', data: [0, 1, 2] }] }
  it('auto: integer data gets whole-number ticks only', () => {
    const t = ticks(m(counts))
    expect(t.length).toBeGreaterThan(1)
    expect(t.every(Number.isInteger)).toBe(true)
  })
  it('auto: fractional data keeps fractional ticks', () => {
    expect(ticks(m({ ...counts, series: [{ name: 'n', data: [0, 0.5, 1] }] })).some((n) => !Number.isInteger(n))).toBe(true)
  })
  it('integerTicks=true forces whole ticks on fractional data, false allows fractions on integer data', () => {
    expect(ticks(m({ ...counts, integerTicks: true, series: [{ name: 'n', data: [0, 0.5, 1] }] })).every(Number.isInteger)).toBe(true)
    expect(ticks(m({ ...counts, integerTicks: false })).some((n) => !Number.isInteger(n))).toBe(true)
  })
})

describe('LineChart: y domain', () => {
  const flat = { labels: ['a', 'b', 'c'], series: [{ name: 'n', data: [172.0, 172.6, 172.3] }] }
  const ys = (w: ReturnType<typeof m>) => w.findAll('[data-slot="line-chart-tick"]').map((t) => Number(t.attributes('y')))
  const tickVals = (w: ReturnType<typeof m>) => w.findAll('[data-slot="line-chart-tick"]').map((t) => Number(t.text()))
  it('yMin / yMax widen the axis so a small series is not a dramatic swing', () => {
    const auto = m(flat)
    const wide = m({ ...flat, yMin: 0, yMax: 200 })
    const span = (w: ReturnType<typeof m>) => { const v = ys(w); return Math.max(...v) - Math.min(...v) }
    expect(Math.min(...tickVals(wide))).toBeLessThanOrEqual(0)
    expect(Math.max(...tickVals(wide))).toBeGreaterThanOrEqual(200)
    const lineYs = (w: ReturnType<typeof m>) => [...(w.find('[data-slot="line-chart-line"]').attributes('d') ?? '').matchAll(/,([\d.]+)/g)].map((x) => Number(x[1]))
    const rangeOf = (a: number[]) => Math.max(...a) - Math.min(...a)
    expect(rangeOf(lineYs(wide))).toBeLessThan(rangeOf(lineYs(auto)) / 10)
    expect(span(wide)).toBeGreaterThan(0)
  })
  it('data outside the domain is clamped to the plot edge, never NaN', () => {
    const w = m({ labels: ['a', 'b', 'c'], series: [{ name: 'n', data: [-50, 100, 400] }], yMin: 0, yMax: 200 })
    const d = w.find('[data-slot="line-chart-line"]').attributes('d')!
    const all = [...d.matchAll(/,([\d.]+)/g)].map((x) => Number(x[1]))
    const tickYs = ys(w)
    expect(Math.min(...all)).toBeGreaterThanOrEqual(Math.min(...tickYs) - 0.01)
    expect(Math.max(...all)).toBeLessThanOrEqual(Math.max(...tickYs) + 0.01)
    noBad(w)
  })
  it('only yMin or only yMax works; non-finite values are ignored', () => {
    expect(Math.min(...tickVals(m({ ...flat, yMin: 100 })))).toBeLessThanOrEqual(100)
    expect(Math.max(...tickVals(m({ ...flat, yMax: 300 })))).toBeGreaterThanOrEqual(300)
    const auto = tickVals(m(flat))
    expect(tickVals(m({ ...flat, yMin: Number.NaN, yMax: Infinity }))).toEqual(auto)
  })
  it('inverted bounds do not break the chart', () => noBad(m({ ...flat, yMin: 300, yMax: 100 })))
})
