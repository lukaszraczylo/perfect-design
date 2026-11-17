import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WaterfallChart from './WaterfallChart.vue'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => mount(WaterfallChart, { props: props as never, attrs })
const noBad = (w: ReturnType<typeof m>) => expect(w.html()).not.toMatch(/NaN|Infinity|undefined/)
const bars = (w: ReturnType<typeof m>) => w.findAll('[data-slot="waterfall-chart-bar"]')
const values = (w: ReturnType<typeof m>) => w.findAll('[data-slot="waterfall-chart-value"]').map((t) => t.text())
const items = [{ label: 'Opening', value: 120 }, { label: 'Sales', value: 80 }, { label: 'Refunds', value: -25 }, { label: 'Hosting', value: -40 }, { label: 'Services', value: 35 }, { label: 'Closing', type: 'total' }]
const base = { label: 'Sample', items }
const num = (w: { attributes: (n: string) => string | undefined }, k: string) => Number(w.attributes(k))

describe('WaterfallChart: good path', () => {
  it('renders a figure with a labelled svg and a bar per item with tooltips', () => {
    const w = m(base)
    const svg = w.find('svg')
    expect(w.element.tagName.toLowerCase()).toBe('figure')
    expect(w.attributes('data-slot')).toBe('waterfall-chart')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Sample')
    expect(svg.attributes('viewBox')).toBe('0 0 480 240')
    expect(bars(w)).toHaveLength(6)
    expect(bars(w)[0]!.find('title').text()).toBe('Opening, start: 120')
    expect(bars(w)[1]!.find('title').text()).toBe('Sales, increase: +80 (total 200)')
    expect(bars(w)[2]!.find('title').text()).toBe('Refunds, decrease: −25 (total 175)')
    expect(bars(w)[5]!.find('title').text()).toBe('Closing, total: 170')
    noBad(w)
  })
  it('bars float between the old and the new level and totals start at the baseline', () => {
    const w = m(base)
    const top = (i: number) => num(bars(w)[i]!, 'y')
    const bottom = (i: number) => num(bars(w)[i]!, 'y') + num(bars(w)[i]!, 'height')
    const base0 = Number(w.find('[data-slot="waterfall-chart-baseline"]').attributes('y1'))
    expect(bottom(0)).toBeCloseTo(base0, 1)
    expect(bottom(5)).toBeCloseTo(base0, 1)
    expect(bottom(1)).toBeCloseTo(top(0), 1)
    expect(top(2)).toBeCloseTo(top(1), 1)
    expect(num(bars(w)[1]!, 'height')).toBeGreaterThan(num(bars(w)[2]!, 'height'))
  })
  it('the kind and the tone follow the sign: success, danger, primary by default', () => {
    const w = m(base)
    expect(bars(w).map((b) => b.attributes('data-kind'))).toEqual(['total', 'increase', 'decrease', 'decrease', 'increase', 'total'])
    expect(bars(w)[1]!.classes()).toContain('fill-success')
    expect(bars(w)[0]!.classes()).toContain('fill-primary')
    expect(bars(w)[5]!.classes()).toContain('fill-primary')
    expect(bars(w)[2]!.classes()).toContain('stroke-destructive')
  })
  it('decreases are hatched with a pattern, not just coloured', () => {
    const w = m(base)
    const pattern = w.find('pattern')
    expect(pattern.exists()).toBe(true)
    expect(bars(w)[2]!.attributes('fill')).toBe(`url(#${pattern.attributes('id')})`)
    expect(pattern.find('line').classes()).toContain('stroke-destructive')
    expect(bars(w)[1]!.attributes('fill')).toBeUndefined()
  })
  it('no pattern is defined without a decrease', () => {
    expect(m({ label: 'S', items: [{ label: 'A', value: 5 }, { label: 'B', value: 3 }] }).find('pattern').exists()).toBe(false)
  })
  it('tones can be set per kind', () => {
    const w = m({ ...base, positiveTone: 'info', negativeTone: 'warning', totalTone: 'chart-5' })
    expect(bars(w)[1]!.classes()).toContain('fill-info')
    expect(bars(w)[2]!.classes()).toContain('stroke-warning')
    expect(bars(w)[0]!.classes()).toContain('fill-chart-5')
    expect(m({ ...base, positiveTone: 'nope' }).findAll('[data-slot="waterfall-chart-bar"]')[1]!.classes()).toContain('fill-success')
  })
  it('connectors join the end of a bar to the start of the next at the running total', () => {
    const w = m(base)
    const c = w.findAll('[data-slot="waterfall-chart-connector"]')
    expect(c).toHaveLength(5)
    const y = (i: number) => Number(c[i]!.attributes('d')!.match(/M[\d.]+,([\d.]+)/)![1])
    expect(y(0)).toBeCloseTo(num(bars(w)[0]!, 'y'), 1)
    expect(y(1)).toBeCloseTo(num(bars(w)[1]!, 'y'), 1)
  })
  it('subtotals and totals show the running total; a subtotal does not change it', () => {
    const w = m({ label: 'S', items: [{ label: 'A', value: 100 }, { label: 'B', value: 20 }, { label: 'Sub', type: 'subtotal' }, { label: 'C', value: -50 }, { label: 'End', type: 'total' }] })
    expect(w.findAll('tbody tr').map((r) => r.findAll('td').map((t) => t.text()))).toEqual([['n/a', '100'], ['+20', '120'], ['n/a', '120'], ['−50', '70'], ['n/a', '70']])
  })
  it('valueFormatter applies to ticks, tooltips, values and the table', () => {
    const w = m({ ...base, showValues: true, valueFormatter: (n: number) => `${n}k` })
    expect(w.findAll('[data-slot="waterfall-chart-tick"]').every((t) => t.text().endsWith('k'))).toBe(true)
    expect(bars(w)[1]!.find('title').text()).toBe('Sales, increase: +80k (total 200k)')
    expect(values(w)).toContain('+80k')
    expect(w.findAll('tbody tr')[1]!.findAll('td').map((t) => t.text())).toEqual(['+80k', '200k'])
  })
  it('gridlines and axis can be switched off', () => {
    const w = m({ ...base, showGrid: false, showAxis: false })
    expect(w.find('[data-slot="waterfall-chart-grid"]').exists()).toBe(false)
    expect(w.find('[data-slot="waterfall-chart-axis"]').exists()).toBe(false)
    expect(w.find('[data-slot="waterfall-chart-baseline"]').exists()).toBe(false)
    expect(bars(w)).toHaveLength(6)
    expect(m(base).find('[data-slot="waterfall-chart-grid"]').exists()).toBe(true)
  })
})

describe('WaterfallChart: showValues', () => {
  it('prints signed changes and unsigned totals', () => {
    expect(values(m({ ...base, showValues: true }))).toEqual(['120', '+80', '−25', '−40', '+35', '170'])
  })
  it('is off by default and does not use a hyphen for minus', () => {
    expect(values(m(base))).toEqual([])
    expect(values(m({ ...base, showValues: true })).join('')).not.toContain('-')
  })
  it('puts a rise above its bar and a fall below it', () => {
    const w = m({ ...base, showValues: true })
    const y = (i: number) => num(w.findAll('[data-slot="waterfall-chart-value"]')[i]!, 'y')
    expect(y(1)).toBeLessThan(num(bars(w)[1]!, 'y'))
    expect(y(2)).toBeGreaterThan(num(bars(w)[2]!, 'y') + num(bars(w)[2]!, 'height'))
  })
  it('leaves out labels wider than their bar', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ label: `L${i}`, value: i % 2 ? -1000000 : 2000000 }))
    const w = m({ label: 'S', width: 320, showValues: true, items: many })
    expect(values(w).length).toBeLessThan(40)
  })
  it('missing values read n/a', () => {
    expect(values(m({ label: 'S', showValues: true, items: [{ label: 'A', value: 5 }, { label: 'B', value: Number.NaN }] }))).toEqual(['5', 'n/a'])
  })
  it('makes room at the end of the axis only on the sides that have labels', () => {
    const up = m({ label: 'S', showValues: true, items: [{ label: 'A', value: 5 }, { label: 'B', value: 3 }] })
    const off = m({ label: 'S', items: [{ label: 'A', value: 5 }, { label: 'B', value: 3 }] })
    expect(num(bars(up)[0]!, 'height')).toBeLessThan(num(bars(off)[0]!, 'height'))
  })
})

describe('WaterfallChart: category labels', () => {
  it('wraps a label onto two lines when the bars are narrow and keeps the full text as a tooltip when it is cut', () => {
    const w = m({ label: 'S', width: 320, items: [{ label: 'Net sales', value: 5 }, { label: 'Ad costs for the month of August', value: -3 }, { label: 'Closing', type: 'total' }, { label: 'x', value: 2 }, { label: 'y', value: 2 }, { label: 'z', value: 1 }] })
    const first = w.find('[data-slot="waterfall-chart-category"]')
    expect(first.findAll('tspan').map((t) => t.text())).toEqual(['Net', 'sales'])
    expect(first.find('title').exists()).toBe(false)
    expect(w.findAll('[data-slot="waterfall-chart-category"]')[1]!.find('title').text()).toBe('Ad costs for the month of August')
    expect(Number(first.findAll('tspan')[1]!.attributes('y'))).toBe(Number(first.findAll('tspan')[0]!.attributes('y')) + 14)
  })
  it('turns labels 45 degrees, keeping every word whole, when a single word is wider than its bar', () => {
    const w = m({ label: 'S', width: 320, items })
    const cats = w.findAll('[data-slot="waterfall-chart-category"]')
    expect(cats.length).toBeGreaterThan(1)
    expect(cats[0]!.attributes('transform')).toMatch(/^rotate\(-45 /)
    expect(cats[0]!.attributes('text-anchor')).toBe('end')
    expect(cats[0]!.text()).toBe('Opening')
    const flat = m({ label: 'S', width: 320, items: items.map((i) => ({ ...i, label: i.label.slice(0, 3) })) })
    expect(flat.find('[data-slot="waterfall-chart-category"]').attributes('transform')).toBeUndefined()
    const y = (c: ReturnType<typeof m>) => Number(c.find('[data-slot="waterfall-chart-baseline"]').attributes('y1'))
    expect(y(w)).toBeLessThan(y(flat))
  })
  it('keeps one line and no tooltip for short labels, and gives two lines more room at the bottom', () => {
    const short = m({ label: 'S', items: [{ label: 'A', value: 5 }, { label: 'B', value: 2 }] })
    expect(short.find('[data-slot="waterfall-chart-category"]').findAll('tspan')).toHaveLength(1)
    expect(short.find('[data-slot="waterfall-chart-category"] title').exists()).toBe(false)
    const tall = m({ label: 'S', width: 320, items: Array.from({ length: 6 }, (_, i) => ({ label: `Net sales ${i}`, value: i })) })
    const y = (w: ReturnType<typeof m>) => Number(w.find('[data-slot="waterfall-chart-baseline"]').attributes('y1'))
    expect(y(tall)).toBeLessThan(y(short))
  })
  it('thins labels when the bars are very narrow', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ label: `Item ${i}`, value: i % 3 === 0 ? -2 : 3 }))
    const w = m({ label: 'S', width: 320, items: many })
    expect(w.findAll('[data-slot="waterfall-chart-category"]').length).toBeLessThan(60)
  })
  it('cuts long labels of a horizontal chart', () => {
    const w = m({ label: 'S', orientation: 'horizontal', items: [{ label: 'x'.repeat(40), value: 5 }, { label: 'y', value: 1 }] })
    const first = w.find('[data-slot="waterfall-chart-category"]')
    expect(first.find('tspan').text()).toContain('…')
    expect(first.find('title').text()).toBe('x'.repeat(40))
  })
  it('thins the rows of a horizontal chart with very many items', () => {
    const many = Array.from({ length: 400 }, (_, i) => ({ label: `Item ${i}`, value: 1 }))
    const w = m({ label: 'S', orientation: 'horizontal', items: many })
    expect(w.findAll('[data-slot="waterfall-chart-category"]').length).toBeLessThan(400)
    expect(Number(w.find('svg').attributes('viewBox')!.split(' ')[3])).toBe(960)
  })
})

describe('WaterfallChart: bad path and edge cases', () => {
  it('empty or missing items show the empty state with every option set', () => {
    for (const v of [[], undefined, null, 'x', {}]) {
      const w = m({ label: 'Budget', items: v, variant: 'lollipop', orientation: 'horizontal', showValues: true })
      expect(w.find('[data-slot="waterfall-chart-empty"]').text()).toBe('No data')
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Budget')
      expect(w.find('svg').exists()).toBe(false)
      expect(w.find('table').exists()).toBe(false)
    }
  })
  it('emptyText replaces the message and names the image without a label', () => {
    const w = m({ items: [], emptyText: 'No budget lines' })
    expect(w.text()).toBe('No budget lines')
    expect(w.attributes('aria-label')).toBe('No budget lines')
  })
  it('a single item is a lone bar from the baseline', () => {
    const w = m({ label: 'S', items: [{ label: 'Only', value: 7 }], showValues: true })
    expect(bars(w)).toHaveLength(1)
    expect(w.findAll('[data-slot="waterfall-chart-connector"]')).toHaveLength(0)
    noBad(w)
  })
  it('only deltas starting from zero work, and a negative start hangs below the baseline', () => {
    const w = m({ label: 'S', items: [{ label: 'A', value: -50 }, { label: 'B', value: 20 }, { label: 'C', type: 'total' }] })
    const base0 = Number(w.find('[data-slot="waterfall-chart-baseline"]').attributes('y1'))
    expect(num(bars(w)[0]!, 'y')).toBeCloseTo(base0, 1)
    expect(num(bars(w)[0]!, 'height')).toBeGreaterThan(0)
    noBad(w)
  })
  it('all-zero changes draw bars of minimal height without NaN', () => {
    const w = m({ label: 'S', items: [{ label: 'A', value: 0 }, { label: 'B', value: 0 }, { label: 'C', type: 'total' }] })
    expect(bars(w).every((b) => num(b, 'height') >= 1)).toBe(true)
    noBad(w)
  })
  it('missing values read n/a and draw a thin mark at the running level', () => {
    const w = m({ label: 'S', items: [{ label: 'A', value: 50 }, { label: 'B', value: Number.NaN }, { label: 'C', type: 'total' }] })
    expect(bars(w)[1]!.find('title').text()).toBe('B, change: n/a (total 50)')
    expect(w.findAll('tbody tr')[1]!.findAll('td').map((t) => t.text())).toEqual(['n/a', 'n/a'])
    noBad(w)
  })
  it('huge and tiny values stay finite', () => {
    noBad(m({ label: 'S', showValues: true, items: [{ label: 'A', value: 1e300 }, { label: 'B', value: -5e299 }, { label: 'C', type: 'total' }] }))
    noBad(m({ label: 'S', showValues: true, items: [{ label: 'A', value: 1e308 }, { label: 'B', value: 1e308 }, { label: 'C', type: 'total' }] }))
    noBad(m({ label: 'S', items: [{ label: 'A', value: 0.0001 }, { label: 'B', value: 0.0002 }] }))
  })
  it('duplicate labels are all drawn', () => {
    expect(bars(m({ label: 'S', items: [{ label: 'Same', value: 1 }, { label: 'Same', value: 1 }, { label: 'Same', value: 1 }] }))).toHaveLength(3)
  })
  it('renders 2000 items quickly with the table cut at 200 rows', () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ label: `Item ${i}`, value: Math.sin(i) * 10 }))
    const t0 = performance.now()
    const w = m({ label: 'S', items: many, showValues: true })
    expect(performance.now() - t0).toBeLessThan(5000)
    expect(bars(w)).toHaveLength(2000)
    expect(w.findAll('tbody tr')).toHaveLength(200)
    expect(w.find('caption').text()).toContain('first 200 of 2000 rows')
    noBad(w)
  })
  it('a bad width or height falls back to the defaults and an explicit height wins', () => {
    expect(m({ ...base, width: -1, height: Number.NaN }).find('svg').attributes('viewBox')).toBe('0 0 480 240')
    expect(m({ ...base, width: 320, height: 180 }).find('svg').attributes('viewBox')).toBe('0 0 320 180')
  })
  it('fits a 320px chart: every mark and label stays inside the viewBox', () => {
    for (const orientation of ['vertical', 'horizontal']) {
      const w = m({ ...base, width: 320, orientation, showValues: true })
      for (const b of bars(w)) {
        expect(num(b, 'x') + num(b, 'width')).toBeLessThanOrEqual(320.01)
        expect(num(b, 'x')).toBeGreaterThanOrEqual(0)
      }
      for (const t of w.findAll('text')) {
        expect(num(t, 'x')).toBeGreaterThanOrEqual(0)
        expect(num(t, 'x')).toBeLessThanOrEqual(320)
      }
    }
  })
})

describe('WaterfallChart: legend', () => {
  it('lists the kinds that occur, with the marking of the variant', () => {
    const w = m(base)
    expect(w.findAll('[data-slot="waterfall-chart-legend-item"]').map((l) => l.text())).toEqual(['Increase', 'Decrease', 'Total'])
    expect(w.findAll('[data-slot="waterfall-chart-legend-item"]')[1]!.find('path').exists()).toBe(true)
  })
  it('auto hides it when there is only one kind, true forces it, false hides it', () => {
    const one = { label: 'S', items: [{ label: 'A', value: 5 }] }
    expect(m(one).find('[data-slot="waterfall-chart-legend"]').exists()).toBe(false)
    expect(m({ ...one, showLegend: true }).findAll('[data-slot="waterfall-chart-legend-item"]')).toHaveLength(1)
    expect(m({ ...base, showLegend: false }).find('[data-slot="waterfall-chart-legend"]').exists()).toBe(false)
  })
  it('names a decrease as such even when there are only deltas', () => {
    const w = m({ label: 'S', showLegend: true, items: [{ label: 'A', value: 5, type: 'delta' }, { label: 'B', value: -2 }] })
    expect(w.findAll('[data-slot="waterfall-chart-legend-item"]').map((l) => l.text())).toEqual(['Increase', 'Decrease'])
  })
})

describe('WaterfallChart: customisation and a11y', () => {
  it('class wins and attributes fall through', () => {
    const w = m({ ...base, class: 'max-w-sm gap-6' }, { id: 'wf', 'data-testid': 'w' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).not.toContain('gap-2')
    expect(w.attributes('id')).toBe('wf')
    expect(w.attributes('data-testid')).toBe('w')
  })
  it('names the svg with aria-label or aria-labelledby, not the figure', () => {
    const a = m({ items }, { 'aria-label': 'Balance' })
    expect(a.find('svg').attributes('aria-label')).toBe('Balance')
    expect(a.attributes('aria-label')).toBeUndefined()
    expect(m({ items }, { 'aria-labelledby': 'h' }).find('svg').attributes('aria-labelledby')).toBe('h')
  })
  it('title names the chart, description describes it and the summary is plain text', () => {
    const w = m({ items, title: 'Balance bridge', description: 'Six sample bars' })
    expect(w.find('svg').attributes('aria-label')).toBe('Balance bridge')
    const desc = w.find('[data-slot="waterfall-chart-description"]')
    const ids = w.find('svg').attributes('aria-describedby')!.split(' ')
    expect(ids).toContain(desc.attributes('id'))
    expect(w.find(`#${ids[1]}`).text()).toBe('Waterfall chart: 6 bars, from 120 to 170, 2 increases, 2 decreases')
  })
  it('without a name the summary names the image (strict mode off)', () => {
    expect(m({ items }).find('svg').attributes('aria-label')).toBe('Waterfall chart: 6 bars, from 120 to 170, 2 increases, 2 decreases')
    expect(m({ items: [{ label: 'A', value: 5 }] }).find('svg').attributes('aria-label')).toBe('Waterfall chart: 1 bar, from 5 to 5')
    expect(m({ items: [{ label: 'A', value: 5, type: 'delta' }] }).find('svg').attributes('aria-label')).toBe('Waterfall chart: 1 bar, from 0 to 5, 1 increase')
  })
  it('has a hidden data table naming each bar by kind with signed change and running total', () => {
    const w = m(base)
    const table = w.find('[data-slot="chart-data-table"]')
    expect(table.classes()).toContain('sr-only')
    expect(table.find('caption').text()).toBe('Sample: data')
    expect(table.findAll('thead th').map((t) => t.text())).toEqual(['Bar', 'Change', 'Running total'])
    expect(table.findAll('tbody th').map((t) => t.text())).toEqual(['Opening (start)', 'Sales (increase)', 'Refunds (decrease)', 'Hosting (decrease)', 'Services (increase)', 'Closing (total)'])
    expect(table.findAll('tbody tr')[2]!.findAll('td').map((t) => t.text())).toEqual(['−25', '175'])
    expect(w.find('svg').find('table').exists()).toBe(false)
  })
  it('marks and the hatch have forced-colors fallbacks and no hard-coded colour appears', () => {
    const w = m(base)
    expect(bars(w)[1]!.classes()).toContain('forced-colors:fill-[CanvasText]')
    expect(bars(w)[2]!.classes()).toContain('forced-colors:stroke-[CanvasText]')
    expect(w.find('pattern line').classes()).toContain('forced-colors:stroke-[CanvasText]')
    expect(w.html()).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|hsl\(|gradient/i)
  })
})

describe('WaterfallChart: loading', () => {
  it('shows a busy status region instead of the chart', () => {
    const w = m({ ...base, loading: true, loadingText: 'Fetching' })
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.text()).toBe('Fetching')
    expect(m({ ...base, loading: true }).text()).toBe('Loading chart')
    expect(m({ ...base, loading: true, class: 'min-h-48' }).classes()).toContain('min-h-48')
  })
})
