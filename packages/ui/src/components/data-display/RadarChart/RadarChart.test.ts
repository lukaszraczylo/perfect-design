import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RadarChart from './RadarChart.vue'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => mount(RadarChart, { props: props as never, attrs })
const noBad = (w: ReturnType<typeof m>) => expect(w.html()).not.toMatch(/NaN|Infinity|undefined/)
const dots = (w: ReturnType<typeof m>) => w.findAll('[data-slot="radar-chart-dot"]')
const lines = (w: ReturnType<typeof m>) => w.findAll('[data-slot="radar-chart-line"]')
const base = { label: 'Sample', axes: ['Speed', 'Range', 'Cost', 'Comfort', 'Safety'], series: [{ name: 'Model A', data: [7, 5, 8, 6, 9] }] }
const two = { ...base, series: [{ name: 'Model A', data: [7, 5, 8, 6, 9] }, { name: 'Model B', data: [4, 8, 5, 9, 6], tone: 'danger' }] }

describe('RadarChart: good path', () => {
  it('renders a figure with a labelled svg, rings, spokes, axis labels and a polygon per series', () => {
    const w = m(base)
    const svg = w.find('svg')
    expect(w.element.tagName.toLowerCase()).toBe('figure')
    expect(w.attributes('data-slot')).toBe('radar-chart')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Sample')
    expect(svg.attributes('viewBox')).toBe('0 0 480 300')
    expect(w.findAll('[data-slot="radar-chart-ring"]')).toHaveLength(4)
    expect(w.findAll('[data-slot="radar-chart-spoke"]')).toHaveLength(5)
    expect(w.findAll('[data-slot="radar-chart-axis"]').map((a) => a.text())).toEqual(base.axes)
    expect(lines(w)).toHaveLength(1)
    expect(lines(w)[0]!.attributes('d')).toMatch(/^M[\d.]+,[\d.]+( L[\d.]+,[\d.]+){4} Z$/)
    expect(lines(w)[0]!.classes()).toContain('stroke-chart-1')
    expect(dots(w)).toHaveLength(5)
    expect(dots(w)[0]!.find('title').text()).toBe('Speed, Model A: 7')
    noBad(w)
  })
  it('a larger value sits further from the centre, and the first axis points up', () => {
    const w = m({ label: 'S', axes: ['A', 'B', 'C'], series: [{ name: 's', data: [10, 5, 0] }], min: 0, max: 10 })
    const [a, b, c] = dots(w)
    const cy = 150
    expect(Number(a!.attributes('cy'))).toBeLessThan(cy)
    expect(Math.abs(Number(a!.attributes('cy')) - cy)).toBeGreaterThan(Math.hypot(Number(b!.attributes('cx')) - 240, Number(b!.attributes('cy')) - cy))
    expect(Number(c!.attributes('cx'))).toBeCloseTo(240, 0)
    expect(Number(c!.attributes('cy'))).toBeCloseTo(cy, 0)
  })
  it('the outermost ring carries the maximum and the rings are round numbers', () => {
    const w = m(base)
    expect(w.findAll('[data-slot="radar-chart-ring-label"]').map((t) => t.text())).toEqual(['2.5', '5', '7.5', '10'])
  })
  it('keeps everything inside the viewBox', () => {
    const w = m({ ...base, width: 320 })
    for (const d of dots(w)) {
      expect(Number(d.attributes('cx') ?? 100)).toBeGreaterThan(0)
      expect(Number(d.attributes('cx') ?? 100)).toBeLessThan(320)
    }
    for (const a of w.findAll('[data-slot="radar-chart-axis"]')) {
      expect(Number(a.attributes('x'))).toBeGreaterThan(0)
      expect(Number(a.attributes('x'))).toBeLessThan(320)
    }
  })
  it('multi-series: a shape per series, dash patterns, tones, legend', () => {
    const w = m(two)
    expect(lines(w)).toHaveLength(2)
    expect(lines(w).map((l) => l.attributes('stroke-dasharray'))).toEqual([undefined, '6 4'])
    expect(lines(w)[1]!.classes()).toContain('stroke-destructive')
    expect(w.findAll('[data-slot="radar-chart-legend-item"]').map((l) => l.text())).toEqual(['Model A', 'Model B'])
    expect(m(base).find('[data-slot="radar-chart-legend"]').exists()).toBe(false)
    expect(m({ ...base, showLegend: true }).find('[data-slot="radar-chart-legend"]').exists()).toBe(true)
    expect(m({ ...two, showLegend: false }).find('[data-slot="radar-chart-legend"]').exists()).toBe(false)
  })
  it('marker shapes differ per series and the legend repeats them', () => {
    const w = m({ ...two, series: [...two.series, { name: 'C', data: [1, 2, 3, 4, 5] }, { name: 'D', data: [5, 4, 3, 2, 1] }] })
    const first = (i: number) => w.find(`[data-slot="radar-chart-series"][data-series="${i}"] [data-slot="radar-chart-dot"]`)
    expect(first(0).element.tagName.toLowerCase()).toBe('circle')
    expect([1, 2, 3].map((i) => first(i).attributes('data-marker'))).toEqual(['square', 'diamond', 'triangle'])
    const items = w.findAll('[data-slot="radar-chart-legend-item"]')
    expect(items[1]!.find('path').exists()).toBe(true)
    expect(items[1]!.find('line').attributes('stroke-dasharray')).toBe('6 4')
  })
  it('valueFormatter applies to ring labels, tooltips, values and the table', () => {
    const w = m({ ...base, showValues: true, valueFormatter: (n: number) => `${n}pt` })
    expect(w.findAll('[data-slot="radar-chart-ring-label"]').every((t) => t.text().endsWith('pt'))).toBe(true)
    expect(dots(w)[0]!.find('title').text()).toBe('Speed, Model A: 7pt')
    expect(w.find('tbody td').text()).toBe('7pt')
    expect(w.find('[data-slot="radar-chart-value"]').text()).toMatch(/pt$/)
  })
  it('showScale off removes the ring labels', () => {
    expect(m({ ...base, showScale: false }).find('[data-slot="radar-chart-scale"]').exists()).toBe(false)
    expect(m(base).find('[data-slot="radar-chart-scale"]').exists()).toBe(true)
  })
  it('thins ring labels when the rings are close together', () => {
    const w = m({ ...base, levels: 6, height: 120, width: 200 })
    expect(w.findAll('[data-slot="radar-chart-ring-label"]').length).toBeLessThan(6)
  })
  it('a given scale moves the points', () => {
    const wide = dots(m({ ...base, max: 100 }))[0]!
    const tight = dots(m({ ...base, max: 10 }))[0]!
    expect(Number(wide.attributes('cy'))).toBeGreaterThan(Number(tight.attributes('cy')))
  })
})

describe('RadarChart: axis labels', () => {
  it('wraps a long name onto two lines and keeps the full text as a tooltip', () => {
    const w = m({ label: 'S', width: 320, axes: ['Customer satisfaction', 'B', 'C', 'D'], series: [{ name: 's', data: [1, 2, 3, 4] }] })
    const first = w.find('[data-slot="radar-chart-axis"]')
    expect(first.findAll('tspan')).toHaveLength(2)
    expect(first.find('title').text()).toBe('Customer satisfaction')
    expect(first.findAll('tspan')[0]!.text()).toBe('Customer')
  })
  it('cuts a name that does not fit on two lines', () => {
    const w = m({ label: 'S', width: 320, axes: ['Customer satisfaction survey results of the quarter', 'B', 'C'], series: [{ name: 's', data: [1, 2, 3] }] })
    const spans = w.find('[data-slot="radar-chart-axis"]').findAll('tspan')
    expect(spans[spans.length - 1]!.text()).toContain('…')
  })
  it('short names stay on one line without a tooltip', () => {
    const first = m(base).find('[data-slot="radar-chart-axis"]')
    expect(first.findAll('tspan')).toHaveLength(1)
    expect(first.find('title').exists()).toBe(false)
  })
  it('labels never leave the viewBox, even with twelve long names at 320px', () => {
    const axes = Array.from({ length: 12 }, (_, i) => `Measure number ${i + 1} of the survey`)
    const w = m({ label: 'S', width: 320, axes, series: [{ name: 's', data: axes.map((_, i) => i) }] })
    for (const a of w.findAll('[data-slot="radar-chart-axis"]')) {
      const x = Number(a.attributes('x'))
      const y = Number(a.attributes('y'))
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(320)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(300)
    }
  })
  it('puts labels of the right side after their anchor and of the left side before it', () => {
    const anchors = m(base).findAll('[data-slot="radar-chart-axis"]').map((a) => a.attributes('text-anchor'))
    expect(anchors).toEqual(['middle', 'start', 'start', 'end', 'end'])
  })
})

describe('RadarChart: showValues', () => {
  it('prints a value per point', () => {
    const w = m({ ...base, showValues: true })
    expect(w.findAll('[data-slot="radar-chart-value"]').map((t) => t.text())).toEqual(['7', '5', '8', '6', '9'])
  })
  it('keeps values clear of axis names and ring labels and drops those that do not fit', () => {
    const w = m({ ...two, showValues: true, width: 240, height: 200 })
    const values = w.findAll('[data-slot="radar-chart-value"]')
    expect(values.length).toBeLessThanOrEqual(10)
    expect(w.html()).not.toMatch(/NaN/)
  })
  it('draws no values beyond 48 points', () => {
    const axes = Array.from({ length: 10 }, (_, i) => `A${i}`)
    const series = Array.from({ length: 5 }, (_, s) => ({ name: `S${s}`, data: axes.map((_, i) => i + s) }))
    expect(m({ label: 'S', axes, series, showValues: true }).find('[data-slot="radar-chart-values"]').exists()).toBe(false)
  })
  it('is off by default', () => {
    expect(m(base).find('[data-slot="radar-chart-values"]').exists()).toBe(false)
  })
})

describe('RadarChart: bad path and edge cases', () => {
  it('empty axes or series show the empty state', () => {
    for (const props of [{ axes: [], series: [] }, { axes: ['A', 'B', 'C'], series: [] }, { axes: undefined, series: undefined }, { axes: 'x', series: 'y' }]) {
      const w = m({ label: 'Skills', ...props })
      expect(w.find('[data-slot="radar-chart-empty"]').text()).toBe('No data')
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Skills')
      expect(w.find('svg').exists()).toBe(false)
    }
  })
  it('one or two axes cannot draw a shape: the empty state, with the message of emptyText', () => {
    const w = m({ label: 'S', axes: ['A', 'B'], series: [{ name: 's', data: [1, 2] }], emptyText: 'Add more axes' })
    expect(w.text()).toBe('Add more axes')
  })
  it('series with no finite value are the empty state', () => {
    expect(m({ label: 'S', axes: ['A', 'B', 'C'], series: [{ name: 's', data: [Number.NaN, null, 'x'] }] }).find('[data-slot="radar-chart-empty"]').exists()).toBe(true)
  })
  it('a missing value sits at the centre, has no marker and reads n/a in the table', () => {
    const w = m({ label: 'S', axes: ['A', 'B', 'C', 'D'], series: [{ name: 's', data: [5, Number.NaN, 7, 4] }] })
    expect(dots(w)).toHaveLength(3)
    expect(w.findAll('tbody td').map((t) => t.text())).toEqual(['5', 'n/a', '7', '4'])
    noBad(w)
  })
  it('values below the scale sit at the centre and above it on the rim', () => {
    const w = m({ label: 'S', axes: ['A', 'B', 'C'], series: [{ name: 's', data: [-100, 50, 1000] }], min: 0, max: 100 })
    const [a, , c] = dots(w)
    expect(Number(a!.attributes('cy'))).toBeCloseTo(150, 0)
    expect(Number(c!.attributes('cx') ?? 240)).toBeLessThan(480)
    noBad(w)
  })
  it('a single series with all values equal and all zero', () => {
    noBad(m({ label: 'S', axes: ['A', 'B', 'C'], series: [{ name: 's', data: [5, 5, 5] }] }))
    const zero = m({ label: 'S', axes: ['A', 'B', 'C'], series: [{ name: 's', data: [0, 0, 0] }] })
    expect(dots(zero)).toHaveLength(3)
    noBad(zero)
  })
  it('negative values start the scale below zero', () => {
    const w = m({ label: 'S', axes: ['A', 'B', 'C', 'D'], series: [{ name: 's', data: [-3, 2, -1, 4] }] })
    expect(Number(w.find('[data-slot="radar-chart-ring-label"]').text())).toBeLessThan(0)
    noBad(w)
  })
  it('huge values and huge series counts stay finite', () => {
    noBad(m({ label: 'S', axes: ['A', 'B', 'C'], series: [{ name: 's', data: [1e308, -1e308, 5] }] }))
    noBad(m({ label: 'S', axes: ['A', 'B', 'C'], series: [{ name: 's', data: [1e300, 2e300, 3e300] }] }))
    const many = Array.from({ length: 30 }, (_, i) => ({ name: `S${i}`, data: [i, 30 - i, 15] }))
    const w = m({ label: 'S', axes: ['A', 'B', 'C'], series: many })
    expect(lines(w)).toHaveLength(30)
    expect(w.find('tbody tr').findAll('td')).toHaveLength(30)
  })
  it('series data longer than the axes is cut and shorter data is padded with n/a', () => {
    const w = m({ label: 'S', axes: ['A', 'B', 'C'], series: [{ name: 'long', data: [1, 2, 3, 4, 5] }, { name: 'short', data: [1] }] })
    expect(w.findAll('tbody tr')).toHaveLength(3)
    expect(w.findAll('tbody tr')[2]!.findAll('td').map((t) => t.text())).toEqual(['3', 'n/a'])
  })
  it('unnamed series and axes get names', () => {
    const w = m({ label: 'S', axes: ['A', null, 'C'], series: [{ data: [1, 2, 3] }] })
    expect(w.findAll('thead th').map((t) => t.text())).toEqual(['Axis', 'Series 1'])
    expect(w.find('tbody th').text()).toBe('A')
  })
  it('renders many axes (40 and 200) without trouble', () => {
    for (const n of [40, 200]) {
      const axes = Array.from({ length: n }, (_, i) => `Axis ${i}`)
      const w = m({ label: 'S', axes, series: [{ name: 's', data: axes.map((_, i) => i % 9) }], showValues: true })
      expect(w.findAll('[data-slot="radar-chart-spoke"]')).toHaveLength(n)
      noBad(w)
    }
  })
  it('a bad width or height falls back to the defaults', () => {
    expect(m({ ...base, width: -1, height: Number.NaN }).find('svg').attributes('viewBox')).toBe('0 0 480 300')
    expect(m({ ...base, width: 320, height: 260 }).find('svg').attributes('viewBox')).toBe('0 0 320 260')
  })
})

describe('RadarChart: customisation and a11y', () => {
  it('class wins and attributes fall through', () => {
    const w = m({ ...base, class: 'max-w-sm gap-6' }, { id: 'radar', 'data-testid': 'r' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).not.toContain('gap-2')
    expect(w.attributes('id')).toBe('radar')
    expect(w.attributes('data-testid')).toBe('r')
  })
  it('names the svg with aria-label or aria-labelledby, not the figure', () => {
    const a = m({ axes: base.axes, series: base.series }, { 'aria-label': 'Models' })
    expect(a.find('svg').attributes('aria-label')).toBe('Models')
    expect(a.attributes('aria-label')).toBeUndefined()
    const b = m({ axes: base.axes, series: base.series }, { 'aria-labelledby': 'h' })
    expect(b.find('svg').attributes('aria-labelledby')).toBe('h')
    expect(b.attributes('aria-labelledby')).toBeUndefined()
  })
  it('title names the chart, description describes it, and the summary is plain text', () => {
    const w = m({ axes: base.axes, series: base.series, title: 'Models', description: 'Two sample models' })
    expect(w.find('svg').attributes('aria-label')).toBe('Models')
    const desc = w.find('[data-slot="radar-chart-description"]')
    expect(desc.text()).toBe('Two sample models')
    const ids = w.find('svg').attributes('aria-describedby')!.split(' ')
    expect(ids).toContain(desc.attributes('id'))
    expect(w.find(`#${ids[1]}`).text()).toBe('Radar chart: 5 axes, 1 series, values from 5 to 9, scale 0 to 10')
  })
  it('without a name the summary names the image (strict mode off)', () => {
    expect(m({ axes: base.axes, series: base.series }).find('svg').attributes('aria-label')).toBe('Radar chart: 5 axes, 1 series, values from 5 to 9, scale 0 to 10')
  })
  it('has a hidden data table: axes as rows, one column per series', () => {
    const w = m(two)
    const table = w.find('[data-slot="chart-data-table"]')
    expect(table.classes()).toContain('sr-only')
    expect(table.find('caption').text()).toBe('Sample: data')
    expect(table.findAll('thead th').map((t) => t.text())).toEqual(['Axis', 'Model A', 'Model B'])
    expect(table.findAll('tbody tr')).toHaveLength(5)
    expect(table.findAll('tbody tr')[1]!.findAll('td').map((t) => t.text())).toEqual(['5', '8'])
    expect(w.find('svg').find('table').exists()).toBe(false)
  })
  it('lines, markers and the area have forced-colors fallbacks', () => {
    const w = m({ ...two, variant: 'area' })
    expect(lines(w)[0]!.classes()).toContain('forced-colors:stroke-[CanvasText]')
    expect(dots(w)[0]!.classes()).toContain('forced-colors:fill-[CanvasText]')
    expect(w.find('[data-slot="radar-chart-area"]').classes()).toContain('forced-colors:fill-transparent')
  })
  it('uses tokens only', () => {
    expect(m({ ...two, variant: 'area', shape: 'circle' }).html()).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|hsl\(|gradient/i)
  })
  it('the rings and spokes are decoration: they have no text', () => {
    expect(m(base).find('[data-slot="radar-chart-grid"]').text()).toBe('')
  })
})

describe('RadarChart: loading', () => {
  it('shows a busy status region instead of the chart', () => {
    const w = m({ ...base, loading: true, loadingText: 'Fetching' })
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.text()).toBe('Fetching')
    expect(m({ ...base, loading: true }).text()).toBe('Loading chart')
    expect(w.find('svg').exists()).toBe(false)
  })

  it('keeps the outer ring label clear of the top axis label', () => {
    const w = m(base)
    const axisY = Number(w.find('[data-slot="radar-chart-axis"]').attributes('y'))
    const outer = w.findAll('[data-slot="radar-chart-ring-label"]').at(-1)!
    expect(Number(outer.attributes('y')) - axisY).toBeGreaterThanOrEqual(18)
  })

  it('keeps value labels off the ring labels (no overlap, with a margin)', () => {
    const w = m({ label: 'S', axes: ['Plan', 'Build', 'Test', 'Ship', 'Run'], series: [{ name: 'Team', data: [72, 55, 88, 64, 91] }], showValues: true, showScale: true, min: 0, max: 100, levels: 5, valueFormatter: (n: number) => `${n}%` })
    const box = (el: ReturnType<typeof w.find>, anchor: string) => {
      const x = Number(el.attributes('x'))
      const y = Number(el.attributes('y'))
      const wd = el.text().length * 7
      const x0 = anchor === 'end' ? x - wd : anchor === 'middle' ? x - wd / 2 : x
      return { x0, x1: x0 + wd, y0: y - 6, y1: y + 6 }
    }
    const rings = w.findAll('[data-slot="radar-chart-ring-label"]').map((r) => box(r, 'start'))
    for (const v of w.findAll('[data-slot="radar-chart-value"]')) {
      const b = box(v, v.attributes('text-anchor') ?? 'start')
      for (const r of rings) expect(b.x1 <= r.x0 || b.x0 >= r.x1 || b.y1 <= r.y0 || b.y0 >= r.y1).toBe(true)
    }
  })
})