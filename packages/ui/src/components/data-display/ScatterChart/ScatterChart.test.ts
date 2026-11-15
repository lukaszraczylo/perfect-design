import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ScatterChart from './ScatterChart.vue'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => mount(ScatterChart, { props: props as never, attrs })
const pts = (w: ReturnType<typeof m>) => w.findAll('[data-slot="scatter-chart-point"]')
const noBad = (w: ReturnType<typeof m>) => expect(w.html()).not.toMatch(/NaN|Infinity|undefined/)
const base = { label: 'Sample', points: [{ x: 1, y: 2, label: 'A' }, { x: 3, y: 6, label: 'B' }, { x: 5, y: 4, label: 'C' }, { x: 8, y: 9, label: 'D' }] }
const two = {
  label: 'Sample',
  points: [{ x: 1, y: 2, series: 'One' }, { x: 3, y: 6, series: 'One' }, { x: 2, y: 8, series: 'Two' }, { x: 6, y: 3, series: 'Two' }, { x: 7, y: 5, series: 'Three' }],
}

describe('ScatterChart: good path', () => {
  it('renders a figure with a labelled svg image, a mark per point and tooltips', () => {
    const w = m(base)
    const svg = w.find('svg')
    expect(w.element.tagName.toLowerCase()).toBe('figure')
    expect(w.attributes('data-slot')).toBe('scatter-chart')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Sample')
    expect(svg.attributes('viewBox')).toBe('0 0 480 280')
    expect(pts(w)).toHaveLength(4)
    expect(pts(w)[0]!.find('title').text()).toBe('A, Points: x 1, y 2')
    expect(pts(w)[0]!.classes()).toContain('fill-chart-1')
    noBad(w)
  })
  it('places higher y higher up and higher x further right', () => {
    const [a, b] = pts(m({ label: 'S', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] }))
    expect(Number(b!.attributes('cx'))).toBeGreaterThan(Number(a!.attributes('cx')))
    expect(Number(b!.attributes('cy'))).toBeLessThan(Number(a!.attributes('cy')))
  })
  it('draws nice numeric ticks on both axes and keeps the points inside the plot', () => {
    const w = m(base)
    const xs = w.findAll('[data-slot="scatter-chart-tick-x"]').map((t) => Number(t.text()))
    const ys = w.findAll('[data-slot="scatter-chart-tick-y"]').map((t) => Number(t.text()))
    expect(xs[0]).toBeLessThanOrEqual(1)
    expect(xs[xs.length - 1]).toBeGreaterThanOrEqual(8)
    expect(ys[0]).toBeLessThanOrEqual(2)
    expect(ys[ys.length - 1]).toBeGreaterThanOrEqual(9)
    for (const p of pts(w)) {
      expect(Number(p.attributes('cx'))).toBeGreaterThan(0)
      expect(Number(p.attributes('cx'))).toBeLessThan(480)
      expect(Number(p.attributes('cy'))).toBeGreaterThan(0)
      expect(Number(p.attributes('cy'))).toBeLessThan(280)
    }
  })
  it('groups series: a marker shape each, a legend that repeats them, tones cycling', () => {
    const w = m(two)
    const bySeries = (i: number) => w.findAll(`[data-slot="scatter-chart-point"][data-series="${i}"]`)
    expect(bySeries(0)).toHaveLength(2)
    expect(bySeries(0)[0]!.element.tagName.toLowerCase()).toBe('circle')
    expect(bySeries(1)[0]!.attributes('data-marker')).toBe('square')
    expect(bySeries(2)[0]!.attributes('data-marker')).toBe('diamond')
    expect(bySeries(1)[0]!.classes()).toContain('fill-chart-2')
    const legend = w.findAll('[data-slot="scatter-chart-legend-item"]')
    expect(legend.map((l) => l.text())).toEqual(['One', 'Two', 'Three'])
    expect(legend[1]!.find('path').exists()).toBe(true)
  })
  it('legend is hidden for one series unless forced, and hidden when off', () => {
    expect(m(base).find('[data-slot="scatter-chart-legend"]').exists()).toBe(false)
    expect(m({ ...base, showLegend: true }).find('[data-slot="scatter-chart-legend"]').exists()).toBe(true)
    expect(m({ ...two, showLegend: false }).find('[data-slot="scatter-chart-legend"]').exists()).toBe(false)
  })
  it('a tone map colours a series by name', () => {
    const w = m({ ...two, tones: { Two: 'danger' } })
    expect(w.find('[data-series="1"]').classes()).toContain('fill-destructive')
  })
  it('formatters apply to ticks, tooltips and the table', () => {
    const w = m({ ...base, valueFormatter: (n: number) => `${n}y`, xFormatter: (n: number) => `${n}x` })
    expect(pts(w)[0]!.find('title').text()).toBe('A, Points: x 1x, y 2y')
    expect(w.findAll('[data-slot="scatter-chart-tick-x"]').every((t) => t.text().endsWith('x'))).toBe(true)
    expect(w.findAll('[data-slot="scatter-chart-tick-y"]').every((t) => t.text().endsWith('y'))).toBe(true)
    expect(w.find('tbody tr').findAll('td').map((t) => t.text())).toEqual(['1x', '2y'])
  })
  it('valueFormatter also formats x when xFormatter is not set', () => {
    const w = m({ ...base, valueFormatter: (n: number) => `#${n}` })
    expect(pts(w)[0]!.find('title').text()).toBe('A, Points: x #1, y #2')
  })
  it('axis and zero lines: shown with the axis, none without it', () => {
    const w = m({ label: 'S', points: [{ x: -3, y: -4 }, { x: 5, y: 6 }] })
    expect(w.find('[data-slot="scatter-chart-zero-x"]').exists()).toBe(true)
    expect(w.find('[data-slot="scatter-chart-zero-y"]').exists()).toBe(true)
    const off = m({ label: 'S', points: [{ x: -3, y: -4 }, { x: 5, y: 6 }], showAxis: false })
    expect(off.find('[data-slot="scatter-chart-axis"]').exists()).toBe(false)
    expect(off.find('[data-slot="scatter-chart-axis-lines"]').exists()).toBe(false)
    expect(m(base).find('[data-slot="scatter-chart-zero-x"]').exists()).toBe(false)
  })
  it('axis titles are printed, rotated for y, and cut with a tooltip when long', () => {
    const w = m({ ...base, xTitle: 'Hours', yTitle: 'Score' })
    expect(w.find('[data-slot="scatter-chart-title-x"]').text()).toBe('Hours')
    const y = w.find('[data-slot="scatter-chart-title-y"]')
    expect(y.text()).toBe('Score')
    expect(y.attributes('transform')).toMatch(/^rotate\(-90 12 /)
    const long = m({ ...base, width: 200, xTitle: 'A very long title of the horizontal axis that cannot fit', yTitle: 'A very long vertical title that cannot fit either, really' })
    expect(long.find('[data-slot="scatter-chart-title-x"]').text()).toContain('…')
    expect(long.find('[data-slot="scatter-chart-title-x"] title').text()).toBe('A very long title of the horizontal axis that cannot fit')
    expect(long.find('[data-slot="scatter-chart-title-y"] title').exists()).toBe(true)
  })
  it('titles take room: the plot starts further right and ends higher', () => {
    const plain = m(base)
    const titled = m({ ...base, xTitle: 'X', yTitle: 'Y' })
    expect(Number(titled.find('[data-slot="scatter-chart-grid-horizontal"]').attributes('x1'))).toBeGreaterThan(Number(plain.find('[data-slot="scatter-chart-grid-horizontal"]').attributes('x1')))
    expect(Number(titled.find('[data-slot="scatter-chart-grid-vertical"]').attributes('y2'))).toBeLessThan(Number(plain.find('[data-slot="scatter-chart-grid-vertical"]').attributes('y2')))
  })
})

describe('ScatterChart: trend', () => {
  const line = { label: 'S', trend: true, points: [{ x: 0, y: 0 }, { x: 2, y: 4 }, { x: 4, y: 8 }, { x: 6, y: 12 }] }
  it('draws one dotted line per series with an equation tooltip and a legend entry', () => {
    const w = m({ ...line, points: [...line.points, { x: 0, y: 12, series: 'Down' }, { x: 6, y: 0, series: 'Down' }] })
    const t = w.findAll('[data-slot="scatter-chart-trend"]')
    expect(t).toHaveLength(2)
    expect(t[0]!.attributes('stroke-dasharray')).toBe('1 5')
    expect(t[0]!.find('title').text()).toContain('y = 2x + 0')
    expect(t[1]!.find('title').text()).toContain('Down: y = -2x + 12')
    expect(w.findAll('[data-slot="scatter-chart-legend-item"]').map((l) => l.text())).toContain('Linear trend')
  })
  it('states the equation in the text summary', () => {
    const w = m(line)
    expect(w.find('[data-slot="scatter-chart-summary"]').text()).toContain('Linear trend y = 2x + 0 (R squared 1)')
  })
  it('is off by default and skips a series without a slope', () => {
    expect(m({ ...line, trend: false }).find('[data-slot="scatter-chart-trend"]').exists()).toBe(false)
    expect(m({ label: 'S', trend: true, points: [{ x: 3, y: 1 }, { x: 3, y: 9 }] }).find('[data-slot="scatter-chart-trend"]').exists()).toBe(false)
    expect(m({ label: 'S', trend: true, points: [{ x: 3, y: 1 }] }).find('[data-slot="scatter-chart-trend"]').exists()).toBe(false)
  })
  it('keeps the trend inside the plot', () => {
    const w = m({ label: 'S', trend: true, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 100 }] })
    const t = w.find('[data-slot="scatter-chart-trend"]')
    for (const k of ['y1', 'y2']) {
      expect(Number(t.attributes(k))).toBeGreaterThanOrEqual(0)
      expect(Number(t.attributes(k))).toBeLessThanOrEqual(280)
    }
  })
})

describe('ScatterChart: showValues', () => {
  it('prints the label of a point, or x and y without one', () => {
    const w = m({ label: 'S', showValues: true, points: [{ x: 1, y: 2, label: 'Named' }, { x: 9, y: 9 }] })
    expect(w.findAll('[data-slot="scatter-chart-value"]').map((t) => t.text())).toEqual(['Named', '9, 9'])
  })
  it('leaves out labels that would overlap', () => {
    const w = m({ label: 'S', showValues: true, points: [{ x: 1, y: 1, label: 'First label' }, { x: 1.01, y: 1.01, label: 'Second label' }, { x: 9, y: 9, label: 'Far' }] })
    const texts = w.findAll('[data-slot="scatter-chart-value"]').map((t) => t.text())
    expect(texts).toContain('First label')
    expect(texts).not.toContain('Second label')
    expect(texts).toContain('Far')
  })
  it('flips a label to the left of a point near the right edge', () => {
    const w = m({ label: 'S', showValues: true, width: 200, points: [{ x: 0, y: 0, label: 'Left' }, { x: 10, y: 10, label: 'A label at the edge' }] })
    const edge = w.findAll('[data-slot="scatter-chart-value"]').find((t) => t.text().startsWith('A label'))!
    expect(edge.attributes('text-anchor')).toBe('end')
  })
  it('draws no labels beyond 60 points', () => {
    const points = Array.from({ length: 61 }, (_, i) => ({ x: i, y: i }))
    expect(m({ label: 'S', showValues: true, points }).find('[data-slot="scatter-chart-values"]').exists()).toBe(false)
    expect(m({ label: 'S', showValues: true, points: points.slice(0, 60) }).find('[data-slot="scatter-chart-values"]').exists()).toBe(true)
  })
  it('long labels are cut', () => {
    const w = m({ label: 'S', showValues: true, points: [{ x: 1, y: 1, label: 'x'.repeat(60) }, { x: 2, y: 5 }] })
    expect(w.find('[data-slot="scatter-chart-value"]').text().length).toBe(24)
  })
})

describe('ScatterChart: bad path and edge cases', () => {
  it('empty or missing points show the empty state (labelled image) with every option set', () => {
    for (const points of [[], undefined, null, 'x']) {
      const w = m({ label: 'Orders', points, trend: true, showValues: true, variant: 'bubble', xTitle: 'X' })
      expect(w.find('[data-slot="scatter-chart-empty"]').text()).toBe('No data')
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Orders')
      expect(w.find('svg').exists()).toBe(false)
      expect(w.find('table').exists()).toBe(false)
    }
  })
  it('emptyText replaces the message and names the image when there is no label', () => {
    const w = m({ points: [], emptyText: 'No orders yet' })
    expect(w.text()).toBe('No orders yet')
    expect(w.attributes('aria-label')).toBe('No orders yet')
  })
  it('only unusable points also show the empty state', () => {
    const w = m({ label: 'S', points: [{ x: Number.NaN, y: 1 }, null, { x: 1, y: Number.POSITIVE_INFINITY }] })
    expect(w.find('[data-slot="scatter-chart-empty"]').exists()).toBe(true)
  })
  it('skips non-finite points, draws the rest and counts them in the summary', () => {
    const w = m({ label: 'S', points: [{ x: 1, y: 2 }, { x: Number.NaN, y: 3 }, { x: 4, y: 5 }, { x: 6, y: Number.NEGATIVE_INFINITY }] })
    expect(pts(w)).toHaveLength(2)
    expect(w.find('[data-slot="scatter-chart-summary"]').text()).toContain('2 points skipped')
    noBad(w)
  })
  it('a single point is drawn without NaN', () => {
    const w = m({ label: 'S', points: [{ x: 4, y: 4 }], trend: true, variant: 'connected' })
    expect(pts(w)).toHaveLength(1)
    expect(w.findAll('[data-slot="scatter-chart-line"]')).toHaveLength(0)
    expect(w.findAll('[data-slot="scatter-chart-trend"]')).toHaveLength(0)
    noBad(w)
  })
  it('duplicate points are all drawn', () => {
    const w = m({ label: 'S', points: [{ x: 2, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 2 }] })
    expect(pts(w)).toHaveLength(3)
    expect(new Set(pts(w).map((p) => p.attributes('cx'))).size).toBe(1)
    noBad(w)
  })
  it('all-zero data is drawn with sane ticks', () => {
    const w = m({ label: 'S', points: [{ x: 0, y: 0 }, { x: 0, y: 0 }] })
    expect(pts(w)).toHaveLength(2)
    expect(w.findAll('[data-slot="scatter-chart-tick-x"]').length).toBeGreaterThan(1)
    noBad(w)
  })
  it('negative values stay inside the plot', () => {
    const w = m({ label: 'S', points: [{ x: -50, y: -9 }, { x: -10, y: -1 }, { x: 5, y: 3 }] })
    for (const p of pts(w)) {
      expect(Number(p.attributes('cx'))).toBeGreaterThan(0)
      expect(Number(p.attributes('cy'))).toBeLessThan(280)
    }
    noBad(w)
  })
  it('huge values do not produce NaN or Infinity', () => {
    for (const v of [1e15, 1e300, 1e308]) {
      const w = m({ label: 'S', trend: true, variant: 'connected', points: [{ x: -v, y: -v }, { x: v, y: v }, { x: 0, y: 1 }] })
      noBad(w)
    }
    noBad(m({ label: 'S', variant: 'bubble', points: [{ x: 1, y: 1, size: 1e308 }, { x: 2, y: 2, size: 1 }] }))
  })
  it('tiny values and decimals keep readable ticks', () => {
    const w = m({ label: 'S', points: [{ x: 0.001, y: 0.0002 }, { x: 0.004, y: 0.0009 }] })
    noBad(w)
    expect(w.findAll('[data-slot="scatter-chart-tick-x"]').length).toBeGreaterThan(1)
  })
  it('long point and series names are kept whole in tooltips and the table', () => {
    const name = 'A very long series name '.repeat(5)
    const w = m({ label: 'S', points: [{ x: 1, y: 1, series: name, label: name }, { x: 2, y: 2, series: 'b' }] })
    expect(pts(w)[0]!.find('title').text()).toContain(name)
    expect(w.find('tbody th').text()).toContain(name.trim())
  })
  it('renders 2000 points quickly and cuts the table at 200 rows', () => {
    const points = Array.from({ length: 2000 }, (_, i) => ({ x: i, y: Math.sin(i / 30) * 100, series: `s${i % 4}` }))
    const t0 = performance.now()
    const w = m({ label: 'S', points, trend: true, variant: 'connected' })
    expect(performance.now() - t0).toBeLessThan(5000)
    expect(pts(w)).toHaveLength(2000)
    expect(w.findAll('tbody tr')).toHaveLength(200)
    expect(w.find('caption').text()).toContain('first 200 of 2000 rows')
    noBad(w)
  })
  it('a bad width or height falls back to the defaults', () => {
    expect(m({ ...base, width: -5, height: Number.NaN }).find('svg').attributes('viewBox')).toBe('0 0 480 280')
    expect(m({ ...base, width: 320, height: 150 }).find('svg').attributes('viewBox')).toBe('0 0 320 150')
  })
  it('fits a 320px wide chart: nothing is drawn outside the viewBox', () => {
    const w = m({ ...two, width: 320, xTitle: 'Horizontal', yTitle: 'Vertical', showValues: true, trend: true })
    for (const t of w.findAll('[data-slot="scatter-chart-tick-x"]')) {
      const x = Number(t.attributes('x'))
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(320)
    }
    for (const p of pts(w).filter((k) => k.element.tagName.toLowerCase() === 'circle')) {
      expect(Number(p.attributes('cx'))).toBeGreaterThan(0)
      expect(Number(p.attributes('cx'))).toBeLessThan(320)
    }
  })
  it('thins x tick labels when the chart is narrow and the numbers are long', () => {
    const w = m({ label: 'S', points: [{ x: 0, y: 1 }, { x: 5000000, y: 2 }], xFormatter: (n: number) => `${n.toLocaleString('en')} units` })
    const labels = w.findAll('[data-slot="scatter-chart-tick-x"]').length
    const ticks = w.findAll('[data-slot="scatter-chart-grid-vertical"]').length
    expect(labels).toBeLessThan(ticks)
  })
})

describe('ScatterChart: customisation and a11y', () => {
  it('class wins over the internal classes and attributes fall through', () => {
    const w = m({ ...base, class: 'max-w-sm gap-6' }, { id: 'chart-1', 'data-testid': 'x' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).not.toContain('gap-2')
    expect(w.attributes('id')).toBe('chart-1')
    expect(w.attributes('data-testid')).toBe('x')
  })
  it('aria-label names the svg and is not repeated on the figure', () => {
    const w = m({ points: base.points }, { 'aria-label': 'Orders' })
    expect(w.find('svg').attributes('aria-label')).toBe('Orders')
    expect(w.attributes('aria-label')).toBeUndefined()
  })
  it('aria-labelledby names the svg by reference', () => {
    const w = m({ points: base.points }, { 'aria-labelledby': 'heading' })
    expect(w.find('svg').attributes('aria-labelledby')).toBe('heading')
    expect(w.attributes('aria-labelledby')).toBeUndefined()
  })
  it('title names the chart when there is no label and shows as a caption', () => {
    const w = m({ points: base.points, title: 'Score by hours', description: 'Eight sample items' })
    expect(w.find('svg').attributes('aria-label')).toBe('Score by hours')
    expect(w.find('[data-slot="scatter-chart-title"]').text()).toBe('Score by hours')
    const desc = w.find('[data-slot="scatter-chart-description"]')
    expect(desc.text()).toBe('Eight sample items')
    expect(w.find('svg').attributes('aria-describedby')).toContain(desc.attributes('id'))
  })
  it('without any name the generated summary names the image (strict mode off)', () => {
    const w = m({ points: base.points })
    expect(w.find('svg').attributes('aria-label')).toBe('Scatter chart: 4 points, 1 series, x from 1 to 8, y from 2 to 9')
  })
  it('the image is described by the summary, which is plain text', () => {
    const w = m(base)
    const id = w.find('svg').attributes('aria-describedby')!
    expect(w.find(`#${id}`).text()).toBe('Scatter chart: 4 points, 1 series, x from 1 to 8, y from 2 to 9')
  })
  it('has a hidden data table with one row per point and the size column only when sizes exist', () => {
    const w = m({ label: 'Sample', points: [{ x: 1, y: 2, label: 'A', size: 5 }, { x: 3, y: 4, series: 'S2' }] })
    const table = w.find('[data-slot="chart-data-table"]')
    expect(table.classes()).toContain('sr-only')
    expect(table.find('caption').text()).toBe('Sample: data')
    expect(table.findAll('thead th').map((t) => t.text())).toEqual(['Point', 'X', 'Y', 'Size'])
    const rows = table.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.find('th').text()).toBe('Points: A')
    expect(rows[0]!.findAll('td').map((t) => t.text())).toEqual(['1', '2', '5'])
    expect(rows[1]!.findAll('td').map((t) => t.text())).toEqual(['3', '4', 'n/a'])
    expect(m(base).findAll('thead th').map((t) => t.text())).toEqual(['Point', 'X', 'Y'])
  })
  it('the svg holds the marks only; the table sits outside it', () => {
    const w = m(base)
    expect(w.find('svg').find('table').exists()).toBe(false)
    expect(w.find('svg').findAll('title').length).toBeGreaterThan(0)
  })
  it('marks and lines have forced-colors fallbacks', () => {
    const w = m({ ...two, variant: 'connected', trend: true })
    expect(pts(w)[0]!.classes()).toContain('forced-colors:fill-[CanvasText]')
    expect(pts(w)[0]!.classes()).toContain('forced-colors:stroke-[Canvas]')
    expect(w.find('[data-slot="scatter-chart-line"]').classes()).toContain('forced-colors:stroke-[CanvasText]')
    expect(w.find('[data-slot="scatter-chart-trend"]').classes()).toContain('forced-colors:stroke-[CanvasText]')
  })
  it('uses tokens only: no hard-coded colours in the markup', () => {
    expect(m({ ...two, trend: true, variant: 'bubble', xTitle: 'X' }).html()).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|hsl\(|gradient/i)
  })
})

describe('ScatterChart: loading', () => {
  it('shows a busy status region instead of the chart', () => {
    const w = m({ ...base, loading: true, loadingText: 'Fetching points' })
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.text()).toBe('Fetching points')
    expect(w.find('svg').exists()).toBe(false)
  })
  it('uses the default message and honours class', () => {
    const w = m({ ...base, loading: true, class: 'min-h-48' })
    expect(w.text()).toBe('Loading chart')
    expect(w.classes()).toContain('min-h-48')
  })
})
