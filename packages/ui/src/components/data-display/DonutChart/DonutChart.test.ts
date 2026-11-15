import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DonutChart from './DonutChart.vue'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  mount(DonutChart, { props: props as never, attrs, slots: slots as never })
const segs = (w: ReturnType<typeof m>) => w.findAll('[data-slot="donut-chart-segment"]')
const lens = (w: ReturnType<typeof m>) => segs(w).map((s) => Number(s.attributes('stroke-dasharray')!.split(' ')[0]))
const items = (w: ReturnType<typeof m>) => w.findAll('[data-slot="donut-chart-legend-item"]')
const data = [
  { label: 'Alpha', value: 50 },
  { label: 'Beta', value: 30 },
  { label: 'Gamma', value: 20, tone: 'success' },
]
const C = 2 * Math.PI * 43

describe('DonutChart: good path', () => {
  it('renders svg role=img with summary label, data-slot and a muted track', () => {
    const w = m({ data })
    expect(w.attributes('data-slot')).toBe('donut-chart')
    const svg = w.find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Donut chart: 3 segments, total 100')
    expect(w.find('[data-slot="donut-chart-track"]').classes()).toContain('stroke-muted')
  })
  it('segments are proportional and titled', () => {
    const w = m({ data })
    const l = lens(w)
    expect(l[0]! / C).toBeCloseTo(0.5, 2)
    expect(l[1]! / C).toBeCloseTo(0.3, 2)
    expect(l[2]! / C).toBeCloseTo(0.2, 2)
    expect(segs(w)[0]!.find('title').text()).toBe('Alpha: 50 (50%)')
    expect(segs(w)[1]!.classes()).toContain('stroke-chart-2')
    expect(segs(w)[2]!.classes()).toContain('stroke-success')
    // each segment starts where the previous one ended
    expect(Number(segs(w)[1]!.attributes('stroke-dashoffset'))).toBeCloseTo(-lens(w)[0]!, 2)
  })
  it('default centre shows the total and centerText caption', () => {
    const w = m({ data, centerText: 'visitors' })
    expect(w.find('[data-slot="donut-chart-total"]').text()).toBe('100')
    expect(w.find('[data-slot="donut-chart-caption"]').text()).toBe('visitors')
    expect(m({ data }).find('[data-slot="donut-chart-caption"]').exists()).toBe(false)
  })
  it('center slot receives the total', () => {
    const w = m({ data }, {}, { center: ({ total }: { total: number }) => `T=${total}` })
    expect(w.find('[data-slot="donut-chart-center"]').text()).toBe('T=100')
    expect(w.find('[data-slot="donut-chart-total"]').exists()).toBe(false)
  })
  it('legend lists swatch, label, formatted value and percentage', () => {
    const w = m({ data: [{ label: 'A', value: 1 }, { label: 'B', value: 2 }], valueFormatter: (n: number) => `$${n}` })
    const rows = items(w)
    expect(rows).toHaveLength(2)
    expect(rows[0]!.find('[data-slot="donut-chart-legend-label"]').text()).toBe('A')
    expect(rows[0]!.find('[data-slot="donut-chart-legend-value"]').text()).toBe('$1')
    expect(rows[0]!.find('[data-slot="donut-chart-legend-percent"]').text()).toBe('33.3%')
    expect(rows[1]!.find('[data-slot="donut-chart-legend-percent"]').text()).toBe('66.7%')
    expect(rows[0]!.find('span').classes()).toContain('bg-chart-1')
    expect(w.find('[data-slot="donut-chart-total"]').text()).toBe('$3')
  })
  it('showLegend=false hides the legend', () => {
    expect(m({ data, showLegend: false }).find('[data-slot="donut-chart-legend"]').exists()).toBe(false)
  })
  it.each([['sm', 'size-28'], ['md', 'size-40'], ['lg', 'size-56']] as const)('size %s → %s', (size, cls) => {
    expect(m({ data, size }).find('[data-slot="donut-chart-figure"]').classes()).toContain(cls)
  })
  it('thickness controls stroke width and radius (clamped)', () => {
    const t = m({ data, thickness: 20 }).find('[data-slot="donut-chart-segment"]')
    expect(t.attributes('stroke-width')).toBe('20')
    expect(t.attributes('r')).toBe('40')
    expect(m({ data, thickness: 999 }).find('[data-slot="donut-chart-segment"]').attributes('stroke-width')).toBe('40')
    expect(m({ data, thickness: 0 }).find('[data-slot="donut-chart-segment"]').attributes('stroke-width')).toBe('2')
    expect(m({ data, thickness: NaN }).find('[data-slot="donut-chart-segment"]').attributes('stroke-width')).toBe('14')
  })
})

describe('DonutChart: customisation', () => {
  it('merges class, attrs fall through, label overrides summary', () => {
    const w = m({ data, class: 'gap-8 flex-col', label: 'Traffic sources' }, { id: 'dc', 'data-t': '1' })
    expect(w.classes()).toContain('gap-8')
    expect(w.classes()).toContain('flex-col')
    expect(w.attributes('id')).toBe('dc')
    expect(w.attributes('data-t')).toBe('1')
    expect(w.find('svg').attributes('aria-label')).toBe('Traffic sources')
  })
  it('unknown size falls back to md', () => {
    expect(m({ data, size: 'xl' }).find('[data-slot="donut-chart-figure"]').classes()).toContain('size-40')
  })
})

describe('DonutChart: bad path and edge cases', () => {
  it('empty / non-array data → empty state', () => {
    for (const d of [[], null, undefined, [null]]) {
      const w = m({ data: d })
      expect(w.attributes('role')).toBe('img')
      expect(w.text()).toBe('No data')
      expect(w.find('svg').exists()).toBe(false)
    }
    const w = m({ data: [], emptyText: 'Nothing', label: 'Plan mix', class: 'h-48' })
    expect(w.text()).toBe('Nothing')
    expect(w.attributes('aria-label')).toBe('Plan mix')
    expect(w.classes()).toContain('h-48')
    expect(m({ data: [] , emptyText: 'Nothing' }).attributes('aria-label')).toBe('Nothing')
  })
  it('negative / NaN / Infinity values are treated as 0', () => {
    const w = m({ data: [{ label: 'a', value: 10 }, { label: 'b', value: -5 }, { label: 'c', value: NaN }, { label: 'd', value: Infinity }, { label: 'e', value: 'x' }] })
    expect(segs(w)).toHaveLength(1)
    expect(items(w)).toHaveLength(5)
    expect(items(w)[1]!.find('[data-slot="donut-chart-legend-percent"]').text()).toBe('0%')
    expect(items(w)[1]!.find('[data-slot="donut-chart-legend-value"]').text()).toBe('0')
    expect(w.find('[data-slot="donut-chart-total"]').text()).toBe('10')
  })
  it('single non-zero segment is a full ring', () => {
    const w = m({ data: [{ label: 'only', value: 7 }, { label: 'zero', value: 0 }] })
    expect(segs(w)).toHaveLength(1)
    expect(segs(w)[0]!.attributes('stroke-dasharray')).toBe(`${Math.round(C * 1000) / 1000} 0`)
    expect(items(w)[0]!.find('[data-slot="donut-chart-legend-percent"]').text()).toBe('100%')
  })
  it('zero total: muted ring only, centre 0 with empty caption, legend keeps labels at 0%', () => {
    const w = m({ data: [{ label: 'a', value: 0 }, { label: 'b', value: -1 }] })
    expect(segs(w)).toHaveLength(0)
    expect(w.find('[data-slot="donut-chart-track"]').exists()).toBe(true)
    expect(w.find('[data-slot="donut-chart-total"]').text()).toBe('0')
    expect(w.find('[data-slot="donut-chart-caption"]').text()).toBe('No data')
    expect(items(w).map((i) => i.find('[data-slot="donut-chart-legend-percent"]').text())).toEqual(['0%', '0%'])
    expect(m({ data: [{ label: 'a', value: 0 }], centerText: 'total' }).find('[data-slot="donut-chart-caption"]').text()).toBe('total')
  })
  it('all-equal values split evenly', () => {
    const w = m({ data: [1, 2, 3, 4].map((i) => ({ label: `s${i}`, value: 5 })) })
    expect(new Set(lens(w)).size).toBe(1)
    expect(items(w)[0]!.find('[data-slot="donut-chart-legend-percent"]').text()).toBe('25%')
  })
  it('more than 5 segments cycle tones', () => {
    const w = m({ data: Array.from({ length: 7 }, (_, i) => ({ label: `s${i}`, value: i + 1 })) })
    const cls = segs(w).map((s) => s.classes().find((c) => c.startsWith('stroke-chart')))
    expect(cls.slice(5)).toEqual(['stroke-chart-1', 'stroke-chart-2'])
  })
  it('huge values do not overflow', () => {
    const w = m({ data: [{ label: 'a', value: 1e308 }, { label: 'b', value: 1e308 }, { label: 'c', value: 1 }] })
    expect(w.html()).not.toMatch(/NaN|Infinity/)
    expect(lens(w)[0]! / C).toBeCloseTo(0.5, 2)
    expect(items(w)[0]!.find('[data-slot="donut-chart-legend-percent"]').text()).toBe('50%')
  })
  it('duplicate labels and missing labels are fine', () => {
    const w = m({ data: [{ label: 'x', value: 1 }, { label: 'x', value: 1 }, { value: 2 }] })
    expect(items(w)).toHaveLength(3)
    expect(segs(w)[2]!.find('title').text()).toBe(': 2 (50%)')
  })
  it('percentages keep at most one decimal', () => {
    const w = m({ data: [{ label: 'a', value: 1 }, { label: 'b', value: 6 }] })
    expect(items(w).map((i) => i.find('[data-slot="donut-chart-legend-percent"]').text())).toEqual(['14.3%', '85.7%'])
  })
  it('hundreds of segments render', () => {
    const w = m({ data: Array.from({ length: 500 }, (_, i) => ({ label: `s${i}`, value: i + 1 })) })
    expect(segs(w)).toHaveLength(500)
  })
})
