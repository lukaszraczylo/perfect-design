import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import BarChart from '../BarChart/BarChart.vue'
import LineChart from '../LineChart/LineChart.vue'
import ChartDataTable from './ChartDataTable.vue'
import ChartLegend from './ChartLegend.vue'
import { useMeasuredWidth } from './useMeasuredWidth'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const labels = ['Mon', 'Tue', 'Wed']
const series = [
  { name: 'Series A', data: [1, 2, 3] },
  { name: 'Series B', data: [4, Number.NaN, 6], tone: 'danger' as const },
]

describe('chart text alternative (WCAG 1.1.1)', () => {
  it.each([
    ['BarChart', BarChart],
    ['LineChart', LineChart],
  ] as const)('%s ships a visually hidden data table with every value', (_name, Chart) => {
    const w = mount(Chart as never, { props: { labels, series, label: 'Sample' } as never })
    const table = w.find('[data-slot="chart-data-table"]')
    expect(table.exists()).toBe(true)
    expect(table.classes()).toContain('sr-only')
    expect(table.find('caption').text()).toBe('Sample: data')
    expect(table.findAll('thead th').map((t) => t.text())).toEqual(['Category', 'Series A', 'Series B'])
    const rows = table.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.find('th').attributes('scope')).toBe('row')
    expect(rows[0]!.findAll('td').map((t) => t.text())).toEqual(['1', '4'])
    expect(rows[1]!.findAll('td').map((t) => t.text())).toEqual(['2', 'n/a'])
    // the picture itself stays one labelled image, the table sits outside it
    expect(w.find('svg').attributes('role')).toBe('img')
    expect(w.find('svg').find('table').exists()).toBe(false)
  })

  it('uses a generic caption without a label and honours valueFormatter', () => {
    const w = mount(BarChart, { props: { labels: ['a'], series: [{ name: 's', data: [5] }], valueFormatter: (n: number) => `${n} ms` } })
    expect(w.find('caption').text()).toBe('Bar chart: data')
    expect(w.find('tbody td').text()).toBe('5 ms')
    expect(mount(LineChart, { props: { labels: ['a', 'b'], series: [{ name: 's', data: [5, 6] }] } }).find('caption').text()).toBe('Line chart: data')
  })

  it('empty charts have no data table', () => {
    expect(mount(BarChart, { props: { labels: [], series: [] } }).find('table').exists()).toBe(false)
    expect(mount(LineChart, { props: { labels: [], series: [] } }).find('table').exists()).toBe(false)
  })

  it('cuts the table at 200 rows and says so in the caption', () => {
    const categories = Array.from({ length: 250 }, (_, i) => `c${i}`)
    const w = mount(ChartDataTable, { props: { caption: 'Big', categories, series: [{ name: 's', data: categories.map((_, i) => i) }], format: String } })
    expect(w.findAll('tbody tr')).toHaveLength(200)
    expect(w.find('caption').text()).toBe('Big (first 200 of 250 rows)')
    const small = mount(ChartDataTable, { props: { caption: 'Small', categoryHeader: 'Day', categories: ['x'], series: [{ name: 's', data: [] }], format: String } })
    expect(small.find('caption').text()).toBe('Small')
    expect(small.find('thead th').text()).toBe('Day')
    expect(small.find('tbody td').text()).toBe('n/a')
  })
})

describe('line series are not colour only (WCAG 1.4.1)', () => {
  it('each series gets its own dash pattern; the first is solid', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ name: `s${i}`, data: [i, i + 1, i + 2] }))
    const w = mount(LineChart, { props: { labels, series: many } })
    const dashes = w.findAll('[data-slot="line-chart-line"]').map((l) => l.attributes('stroke-dasharray'))
    expect(dashes[0]).toBeUndefined()
    expect(new Set(dashes.slice(0, 5)).size).toBe(5)
    expect(dashes[5]).toBeUndefined() // cycles
  })

  it('the legend draws the same line sample', () => {
    const w = mount(LineChart, { props: { labels, series } })
    const swatches = w.findAll('[data-slot="line-chart-legend-item"] svg line')
    expect(swatches).toHaveLength(2)
    expect(swatches[0]!.attributes('stroke-dasharray')).toBeUndefined()
    expect(swatches[1]!.attributes('stroke-dasharray')).toBe('6 4')
    expect(swatches[1]!.classes()).toContain('stroke-destructive')
  })

  it('a legend without dash info keeps the square swatch', () => {
    const w = mount(ChartLegend, { props: { dataSlot: 'x', items: [{ name: 'A', bg: 'bg-chart-1' }] } })
    expect(w.find('svg').exists()).toBe(false)
    expect(w.find('span.bg-chart-1').exists()).toBe(true)
  })
})

describe('axis text and responsive width', () => {
  it.each([
    ['BarChart', BarChart],
    ['LineChart', LineChart],
  ] as const)('%s axis labels are 12px tabular text (no arbitrary sizes)', (_n, Chart) => {
    const w = mount(Chart as never, { props: { labels, series } as never })
    const g = w.find('[data-slot$="-axis"]')
    expect(g.classes()).toEqual(expect.arrayContaining(['text-xs', 'tabular-nums']))
    expect(g.classes().join(' ')).not.toMatch(/text-\[/)
  })

  it('titles use a comma, not an em dash', () => {
    const w = mount(BarChart, { props: { labels: ['Jan'], series: [{ name: 'Sales', data: [1] }] } })
    expect(w.find('[data-slot="bar-chart-bar"] title').text()).toBe('Jan, Sales: 1')
  })

  it('the viewBox follows the measured container width so one unit is one CSS pixel', async () => {
    let cb: ResizeObserverCallback = () => {}
    class RO {
      constructor(fn: ResizeObserverCallback) {
        cb = fn
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', RO)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(288)
    const w = mount(BarChart, { props: { labels, series }, attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 288 240')
    cb([{ contentRect: { width: 400 } } as ResizeObserverEntry], {} as ResizeObserver)
    await nextTick()
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 400 240')
    cb([{ contentRect: { width: 0 } } as ResizeObserverEntry], {} as ResizeObserver)
    await nextTick()
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 400 240')
    w.unmount()
  })

  it('falls back to the width prop when nothing can be measured', () => {
    expect(mount(LineChart, { props: { labels, series, width: 320 } }).find('svg').attributes('viewBox')).toBe('0 0 320 240')
  })
})

describe('useMeasuredWidth', () => {
  it('stays 0 without ResizeObserver, re-observes on element change and disconnects on unmount', async () => {
    const disconnect = vi.fn()
    const observe = vi.fn()
    class RO {
      observe = observe
      disconnect = disconnect
    }
    vi.stubGlobal('ResizeObserver', RO)
    let width = ref(0)
    const el = ref<HTMLElement | null>(null)
    const C = defineComponent({
      setup() {
        width = useMeasuredWidth(el)
        return () => h('div', { ref: el })
      },
    })
    const w = mount(C, { attachTo: document.body })
    await nextTick()
    expect(observe).toHaveBeenCalledTimes(1)
    el.value = null
    await nextTick()
    expect(disconnect).toHaveBeenCalled()
    w.unmount()

    vi.stubGlobal('ResizeObserver', undefined)
    const w2 = mount(C, { attachTo: document.body })
    await nextTick()
    expect(width.value).toBe(0)
    w2.unmount()
  })
})
