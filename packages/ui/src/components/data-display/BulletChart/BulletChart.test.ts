import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import BulletChart from './BulletChart.vue'

const m = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => mount(BulletChart, { props: props as never, attrs })
const one = [{ label: 'Orders', value: 70, target: 80, ranges: [50, 75, 100] }]
const two = [
  { label: 'Orders', value: 70, target: 80, ranges: [50, 75, 100], unit: 'k' },
  { label: 'Returns', value: 40, target: 60, ranges: [50, 75, 100], unit: 'k' },
]
const base = { label: 'Sample', bullets: one }
const num = (el: { attributes: (k: string) => string | undefined }, k: string) => Number(el.attributes(k))
const slot = (w: ReturnType<typeof m>, s: string) => w.findAll(`[data-slot="${s}"]`)

/** No attribute of the chart may carry NaN, Infinity or undefined. */
function expectClean(w: ReturnType<typeof m>) {
  const bad: string[] = []
  const root = w.element as unknown as Element
  const els: Element[] = [root, ...Array.from(root.querySelectorAll('*'))]
  for (const el of els) {
    for (const a of Array.from(el.attributes)) if (/NaN|Infinity|undefined/.test(a.value)) bad.push(`${el.tagName} ${a.name}=${a.value}`)
  }
  expect(bad).toEqual([])
  expect(w.text()).not.toMatch(/NaN|Infinity|undefined/)
}

afterEach(() => vi.restoreAllMocks())

describe('BulletChart: good path', () => {
  it('renders the root, an image SVG named by label, and the table alternative', () => {
    const w = m({ ...base, bullets: two })
    expect(w.attributes('data-slot')).toBe('bullet-chart')
    const svg = w.find('[data-slot="bullet-chart-svg"]')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Sample')
    expect(slot(w, 'bullet-chart-row')).toHaveLength(2)
    expect(w.find('[data-slot="bullet-chart-table"]').classes()).toContain('sr-only')
  })
  it('names the chart by its title when there is no label, and by an auto summary otherwise', () => {
    expect(m({ title: 'Warehouse', bullets: one }).find('svg').attributes('aria-label')).toBe('Warehouse')
    expect(m({ bullets: two }).find('svg').attributes('aria-label')).toBe('Bullet chart: 2 measures')
    expect(m({ bullets: one }).find('svg').attributes('aria-label')).toBe('Bullet chart: 1 measure')
    expect(m({ label: 'Own', title: 'Warehouse', bullets: one }).find('svg').attributes('aria-label')).toBe('Own')
  })
  it('honours aria-label and aria-labelledby and keeps them off the wrapper', () => {
    const w = m({ bullets: one }, { 'aria-label': 'From attrs', id: 'chart-a', 'data-test': 'x' })
    expect(w.find('svg').attributes('aria-label')).toBe('From attrs')
    expect(w.attributes('aria-label')).toBeUndefined()
    expect(w.attributes('id')).toBe('chart-a')
    expect(w.attributes('data-test')).toBe('x')
    const by = m({ bullets: one }, { 'aria-labelledby': 'heading-1' })
    expect(by.find('svg').attributes('aria-labelledby')).toBe('heading-1')
    expect(by.attributes('aria-labelledby')).toBeUndefined()
  })
  it('renders title and description as plain text and omits the header without them', () => {
    const w = m({ ...base, title: 'Warehouse', description: 'Sample data' })
    expect(w.find('[data-slot="bullet-chart-title"]').text()).toBe('Warehouse')
    expect(w.find('[data-slot="bullet-chart-description"]').text()).toBe('Sample data')
    expect(w.find('h1,h2,h3,h4').exists()).toBe(false)
    expect(m(base).find('[data-slot="bullet-chart-header"]').exists()).toBe(false)
    expect(m({ ...base, description: 'Only text' }).find('[data-slot="bullet-chart-title"]').exists()).toBe(false)
  })
  it('draws one band per range, widths following the bounds, hatching the two darkest', () => {
    const w = m(base)
    const bands = slot(w, 'bullet-chart-range')
    expect(bands).toHaveLength(3)
    expect(bands.map((b) => b.classes().find((c) => c.startsWith('fill-')))).toEqual(['fill-muted-foreground/30', 'fill-muted-foreground/20', 'fill-muted-foreground/10'])
    const widths = bands.map((b) => num(b, 'width'))
    expect(widths[0]).toBeCloseTo(widths[1]! * 2, 0) // 0..50 vs 50..75
    expect(slot(w, 'bullet-chart-hatch').map((h) => h.attributes('data-hatch'))).toEqual(['dense', 'sparse'])
    expect(slot(w, 'bullet-chart-hatch')[0]!.attributes('fill')).toMatch(/^url\(#.+-dense\)$/)
    expect(w.find('pattern').exists()).toBe(true)
  })
  it('contiguous bands cover the whole scale', () => {
    const bands = slot(m(base), 'bullet-chart-range')
    for (let i = 1; i < bands.length; i++) expect(num(bands[i]!, 'x')).toBeCloseTo(num(bands[i - 1]!, 'x') + num(bands[i - 1]!, 'width'), 0)
  })
  it('draws the measure bar from zero to the value, thinner than the bands', () => {
    const w = m(base)
    const bar = w.find('[data-slot="bullet-chart-measure"]')
    const band = slot(w, 'bullet-chart-range')[0]!
    const first = num(band, 'x')
    const total = slot(w, 'bullet-chart-range').reduce((a, b) => a + num(b, 'width'), 0)
    expect(num(bar, 'x')).toBeCloseTo(first, 0)
    expect(num(bar, 'width')).toBeCloseTo(total * 0.7, 0)
    expect(num(bar, 'height')).toBeLessThan(num(band, 'height'))
    expect(bar.classes()).toContain('fill-chart-1')
  })
  it('draws the target as a tick plus a diamond cap, with a tooltip', () => {
    const w = m(base)
    const target = w.find('[data-slot="bullet-chart-target"]')
    const line = target.find('line')
    expect(line.attributes('x1')).toBe(line.attributes('x2'))
    expect(target.find('[data-slot="bullet-chart-target-cap"]').attributes('d')).toMatch(/^M[\d.]+,[\d.-]+ L.* Z$/)
    expect(target.find('title').text()).toBe('Orders target: 80')
    expect(line.classes()).toContain('stroke-foreground')
  })
  it('prints the value with its unit and applies valueFormatter everywhere', () => {
    const w = m({ ...base, bullets: two })
    expect(slot(w, 'bullet-chart-value').map((v) => v.text())).toEqual(['70 k', '40 k'])
    const f = m({ ...base, bullets: two, valueFormatter: (n: number) => `${n} pts` })
    expect(slot(f, 'bullet-chart-value').map((v) => v.text())).toEqual(['70 pts k', '40 pts k'])
    expect(slot(f, 'bullet-chart-tick').every((t) => t.text().endsWith(' pts'))).toBe(true)
    expect(f.find('[data-slot="bullet-chart-target"] title').text()).toBe('Orders target: 80 pts')
  })
  it('draws the axis with ticks on a shared scale and hides it on request', () => {
    const w = m({ ...base, bullets: two })
    expect(slot(w, 'bullet-chart-tick').map((t) => t.text())).toEqual(['0', '20', '40', '60', '80', '100'])
    expect(w.find('[data-slot="bullet-chart-grid"]').findAll('line')).toHaveLength(6)
    expect(m({ ...base, showAxis: false }).find('[data-slot="bullet-chart-axis"]').exists()).toBe(false)
  })
  it('shows a legend only when asked, listing measure, target and ranges', () => {
    expect(m(base).find('[data-slot="bullet-chart-legend"]').exists()).toBe(false)
    const w = m({ ...base, showLegend: true })
    expect(w.findAll('[data-slot="bullet-chart-legend-item"]').map((i) => i.text())).toEqual(['Measure', 'Target', 'Ranges, darker is lower'])
    const bare = m({ label: 'Sample', bullets: [{ label: 'A', value: 5 }], showLegend: true })
    expect(bare.findAll('[data-slot="bullet-chart-legend-item"]').map((i) => i.text())).toEqual(['Measure'])
    expect(m({ ...base, showLegend: true, showTarget: false }).findAll('[data-slot="bullet-chart-legend-item"]')).toHaveLength(2)
  })
  it('prints range bounds when asked, without overlapping labels', () => {
    const w = m({ ...base, showRangeLabels: true })
    expect(slot(w, 'bullet-chart-range-label').map((t) => t.text())).toEqual(['50', '75', '100'])
    const crowded = m({ label: 'Sample', width: 120, showRangeLabels: true, bullets: [{ label: 'A', value: 5, ranges: [10, 11, 12, 100] }] })
    expect(slot(crowded, 'bullet-chart-range-label').length).toBeLessThan(4)
    expect(m(base).find('[data-slot="bullet-chart-range-label"]').exists()).toBe(false)
  })
  it('lists every measure in the table alternative', () => {
    const w = m({ ...base, bullets: [...two, { label: 'No target', value: 5 }] })
    const rows = w.findAll('[data-slot="bullet-chart-table"] tbody tr').map((r) => [r.find('th').text(), ...r.findAll('td').map((c) => c.text())])
    expect(rows).toEqual([
      ['Orders', '70 k', '80 k', 'up to 50, up to 75, up to 100'],
      ['Returns', '40 k', '60 k', 'up to 50, up to 75, up to 100'],
      ['No target', '5', 'none', 'none'],
    ])
    expect(w.find('[data-slot="bullet-chart-table"] caption').text()).toBe('Sample: data')
    expect(w.findAll('[data-slot="bullet-chart-table"] thead th').map((t) => t.text())).toEqual(['Measure', 'Value', 'Target', 'Ranges'])
    expect(m(one.length ? { bullets: one } : {}).find('caption').text()).toBe('Bullet chart: data')
  })
  it('colours a measure by its own tone before the tone prop', () => {
    const w = m({ label: 'Sample', tone: 'info', bullets: [{ label: 'A', value: 5, tone: 'success' }, { label: 'B', value: 5 }] })
    const bars = slot(w, 'bullet-chart-measure')
    expect(bars[0]!.classes()).toContain('fill-success')
    expect(bars[1]!.classes()).toContain('fill-info')
  })
  it('draws a neutral track for a measure without ranges', () => {
    const w = m({ label: 'Sample', bullets: [{ label: 'A', value: 5 }] })
    expect(w.find('[data-slot="bullet-chart-track"]').exists()).toBe(true)
    expect(slot(w, 'bullet-chart-range')).toHaveLength(0)
    expect(slot(w, 'bullet-chart-hatch')).toHaveLength(0)
  })
  it('is deterministic and gives each instance its own pattern ids', () => {
    expect(m(base).html()).toBe(m(base).html())
    const both = mount(defineComponent({ render: () => h('div', [h(BulletChart, base), h(BulletChart, base)]) }))
    const ids = both.findAll('pattern').map((p) => p.attributes('id'))
    expect(new Set(ids).size).toBe(4)
    expect(ids.every(Boolean)).toBe(true)
  })
  it('keeps a measure and its drawing in order with several bullets stacked', () => {
    const w = m({ ...base, bullets: two })
    const ys = slot(w, 'bullet-chart-measure').map((b) => num(b, 'y'))
    expect(ys[1]!).toBeGreaterThan(ys[0]!)
    expect(slot(w, 'bullet-chart-label').map((l) => l.text())).toEqual(['Orders', 'Returns'])
  })
})

describe('BulletChart: customisation', () => {
  it('merges class last and lets it win', () => {
    const w = m({ ...base, class: 'gap-8 max-w-xs' })
    expect(w.classes()).toContain('max-w-xs')
    expect(w.classes()).toContain('gap-8')
    expect(w.classes()).not.toContain('gap-2')
  })
  it('puts class on the empty state too', () => {
    expect(m({ label: 'Sample', bullets: [], class: 'max-w-xs' }).classes()).toContain('max-w-xs')
  })
})

describe('BulletChart: bad and edge input', () => {
  it('shows the empty state for an empty array, for non-arrays and for entries that are not measures', () => {
    for (const bullets of [[], undefined, null, 'x', [null, 3]]) {
      const w = m({ label: 'Sample', bullets })
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Sample')
      expect(w.find('[data-slot="bullet-chart-empty"]').text()).toBe('No data')
      expect(w.find('svg').exists()).toBe(false)
    }
    expect(m({ bullets: [], emptyText: 'No measures yet' }).attributes('aria-label')).toBe('No measures yet')
    expect(m({ title: 'Named', bullets: [] }).attributes('aria-label')).toBe('Named')
    expect(m({ bullets: [] }, { 'aria-labelledby': 'h' }).attributes('aria-labelledby')).toBe('h')
  })
  it('handles NaN, Infinity, negative and zero values without NaN in the SVG', () => {
    const cases = [
      [{ label: 'A', value: Number.NaN, target: 5, ranges: [10] }],
      [{ label: 'A', value: Infinity, target: -Infinity, ranges: [Number.NaN] }],
      [{ label: 'A', value: -40, target: -10, ranges: [-50, 20] }],
      [{ label: 'A', value: 0, target: 0, ranges: [0, 0] }],
      [{ label: 'A', value: 0, max: 0 }],
      [{ label: 'A', value: 1e300, target: 1e308, ranges: [1e307], max: 1e308 }],
      [{ label: 'A', value: 5, max: -3 }],
      [{ label: 'A', value: 5, ranges: [5, 5, 5] }],
    ]
    for (const bullets of cases) {
      for (const variant of ['horizontal', 'vertical']) {
        for (const sharedScale of [true, false]) expectClean(m({ label: 'Sample', bullets, variant, sharedScale, showRangeLabels: true, showLegend: true }))
      }
    }
  })
  it('lists a measure without a valid value as n/a and says so inline', () => {
    const w = m({ label: 'Sample', bullets: [{ label: 'A', value: Number.NaN, ranges: [10] }, { label: 'B', value: 3 }] })
    expect(w.find('[data-slot="bullet-chart-table"] tbody tr').findAll('td')[0]!.text()).toBe('n/a')
    expect(slot(w, 'bullet-chart-measure')).toHaveLength(1)
    expect(w.find('[data-slot="bullet-chart-message"]').text()).toBe('1 measure without a valid value is drawn without a bar.')
    const both = m({ label: 'Sample', bullets: [{ label: 'A', value: Number.NaN }, { label: 'B', value: Number.NaN }] })
    expect(both.find('[data-slot="bullet-chart-message"]').text()).toBe('2 measures without a valid value are drawn without a bar.')
  })
  it('clamps a value beyond an explicit max and marks it', () => {
    const w = m({ label: 'Sample', bullets: [{ label: 'A', value: 140, target: 120, max: 100, ranges: [50, 100] }] })
    const total = slot(w, 'bullet-chart-range').reduce((a, b) => a + num(b, 'width'), 0)
    expect(num(w.find('[data-slot="bullet-chart-measure"]'), 'width')).toBeCloseTo(total, 0)
    expect(w.find('[data-slot="bullet-chart-overflow"]').exists()).toBe(true)
    expect(m(base).find('[data-slot="bullet-chart-overflow"]').exists()).toBe(false)
    // the real value is still printed and tabulated
    expect(w.find('[data-slot="bullet-chart-value"]').text()).toBe('140')
    expect(w.find('[data-slot="bullet-chart-table"] tbody td').text()).toBe('140')
    const v = m({ label: 'Sample', variant: 'vertical', bullets: [{ label: 'A', value: 140, max: 100 }] })
    expect(v.find('[data-slot="bullet-chart-overflow"]').exists()).toBe(true)
  })
  it('ranges beyond an explicit max are cut at the end of the scale', () => {
    const w = m({ label: 'Sample', bullets: [{ label: 'A', value: 5, max: 60, ranges: [30, 80, 120] }] })
    expect(slot(w, 'bullet-chart-range')).toHaveLength(2)
    expectClean(w)
  })
  it('sorts unsorted ranges before drawing them', () => {
    const a = m({ label: 'Sample', bullets: [{ label: 'A', value: 5, ranges: [100, 50, 75] }] })
    const b = m({ label: 'Sample', bullets: [{ label: 'A', value: 5, ranges: [50, 75, 100] }] })
    expect(slot(a, 'bullet-chart-range').map((r) => r.attributes('width'))).toEqual(slot(b, 'bullet-chart-range').map((r) => r.attributes('width')))
  })
  it('works with a single measure without target or value text', () => {
    const w = m({ label: 'Sample', showTarget: false, showValues: false, bullets: [{ label: 'Only', value: 3, ranges: [10] }] })
    expect(w.find('[data-slot="bullet-chart-target"]').exists()).toBe(false)
    expect(w.find('[data-slot="bullet-chart-value"]').exists()).toBe(false)
    expectClean(w)
  })
  it('keeps duplicate labels as separate rows', () => {
    const w = m({ label: 'Sample', bullets: [{ label: 'Same', value: 1 }, { label: 'Same', value: 2 }] })
    expect(slot(w, 'bullet-chart-row')).toHaveLength(2)
    expect(w.findAll('[data-slot="bullet-chart-table"] tbody th').map((t) => t.text())).toEqual(['Same', 'Same'])
  })
  it('names an unlabelled measure by position in the table', () => {
    const w = m({ label: 'Sample', bullets: [{ value: 1 }] })
    expect(w.find('[data-slot="bullet-chart-table"] tbody th').text()).toBe('Measure 1')
  })
  it('truncates long labels and keeps the full text as a tooltip; unicode and RTL pass through', () => {
    const long = 'A very long measure name that cannot fit the label column'
    const w = m({ label: 'Sample', width: 320, bullets: [{ label: long, value: 1 }, { label: 'Zażółć gęślą jaźń', value: 2 }, { label: 'مقياس الطلبات', value: 3 }] })
    const labels = slot(w, 'bullet-chart-label')
    expect(labels[0]!.element.childNodes[0]!.textContent!.endsWith('…')).toBe(true)
    expect(labels[0]!.find('title').text()).toBe(long)
    expect(labels[1]!.element.childNodes[0]!.textContent).toBe('Zażółć gęślą jaźń')
    expect(labels[2]!.element.childNodes[0]!.textContent).toBe('مقياس الطلبات')
    expect(w.findAll('[data-slot="bullet-chart-table"] tbody th')[0]!.text()).toBe(long)
  })
  it('draws at most 60 measures, says so, and stays fast with 2000', () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ label: `Measure ${i}`, value: i % 100, target: 60, ranges: [30, 60, 100] }))
    const t0 = performance.now()
    const w = m({ label: 'Sample', bullets: many })
    expect(performance.now() - t0).toBeLessThan(1500)
    expect(slot(w, 'bullet-chart-row')).toHaveLength(60)
    expect(w.find('[data-slot="bullet-chart-message"]').text()).toBe('Showing the first 60 of 2000 measures.')
    expect(w.findAll('[data-slot="bullet-chart-table"] tbody tr')).toHaveLength(60)
    expectClean(w)
  })
  it('uses the explicit height for the whole chart', () => {
    const w = m({ ...base, bullets: two, height: 200 })
    const [, , , h] = w.find('svg').attributes('viewBox')!.split(' ').map(Number)
    expect(h).toBeGreaterThan(180)
    expect(h).toBeLessThanOrEqual(200)
    expect(m({ ...base, bullets: two, variant: 'vertical', height: 300 }).find('svg').attributes('viewBox')).toMatch(/ 300$/)
  })
  it('ignores a width or height that is not a positive number', () => {
    expect(m({ ...base, width: -5, height: Number.NaN }).find('svg').attributes('viewBox')).toBe(m(base).find('svg').attributes('viewBox'))
  })
})

describe('BulletChart: responsive layout', () => {
  const fits = (w: ReturnType<typeof m>) => {
    const [, , vw] = w.find('svg').attributes('viewBox')!.split(' ').map(Number)
    for (const r of w.findAll('rect')) expect(num(r, 'x') + num(r, 'width')).toBeLessThanOrEqual(vw! + 0.5)
    return vw!
  }
  it('keeps horizontal bullets inside the viewBox at 320px', () => {
    const w = m({ ...base, width: 320, showRangeLabels: true, bullets: [{ label: 'A rather long measure name', value: 7000000, target: 8000000, ranges: [5e6, 7.5e6, 1e7], unit: 'dollars' }] })
    expect(fits(w)).toBe(320)
    expect(w.find('[data-slot="bullet-chart-scroll"]').attributes('role')).toBeUndefined()
  })
  it('lets many vertical columns scroll inside a named, focusable region instead of squeezing', () => {
    const bullets = Array.from({ length: 30 }, (_, i) => ({ label: `M${i}`, value: i, ranges: [10, 20, 30] }))
    const w = m({ label: 'Sample', variant: 'vertical', width: 320, bullets })
    const scroll = w.find('[data-slot="bullet-chart-scroll"]')
    expect(scroll.attributes('role')).toBe('region')
    expect(scroll.attributes('tabindex')).toBe('0')
    expect(scroll.attributes('aria-label')).toBe('Sample, scrollable')
    expect(scroll.classes()).toContain('overflow-x-auto')
    expect(num(w.find('svg'), 'width')).toBeGreaterThan(320)
    expectClean(w)
  })
  it('does not make a few vertical columns scrollable', () => {
    const w = m({ ...base, variant: 'vertical', bullets: two, width: 480 })
    expect(w.find('[data-slot="bullet-chart-scroll"]').attributes('role')).toBeUndefined()
    expect(w.find('svg').attributes('width')).toBeUndefined()
    expect(w.find('svg').classes()).toContain('w-full')
  })
})

describe('BulletChart: separate scales', () => {
  it('fills each measure on its own scale and draws no axis', () => {
    const w = m({ label: 'Sample', sharedScale: false, bullets: [{ label: 'Small', value: 5, ranges: [10] }, { label: 'Large', value: 500, ranges: [1000] }] })
    expect(w.find('[data-slot="bullet-chart-axis"]').exists()).toBe(false)
    const bars = slot(w, 'bullet-chart-measure').map((b) => num(b, 'width'))
    expect(bars[0]).toBeGreaterThan(0)
    // on a shared scale the small one would be a sliver
    const shared = m({ label: 'Sample', bullets: [{ label: 'Small', value: 5, ranges: [10] }, { label: 'Large', value: 500, ranges: [1000] }] })
    expect(num(slot(shared, 'bullet-chart-measure')[0]!, 'width')).toBeLessThan(bars[0]! / 5)
  })
})
