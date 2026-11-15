import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ScatterChart from './ScatterChart.vue'
import { BUBBLE_RADIUS, SCATTER_HEIGHTS, SCATTER_RADIUS, scatterChartVariants } from './variants'

const m = (props: Record<string, unknown>) => mount(ScatterChart, { props: props as never })
const pts = (w: ReturnType<typeof m>) => w.findAll('[data-slot="scatter-chart-point"]')
const radii = (w: ReturnType<typeof m>) => pts(w).map((p) => Number(p.attributes('r')))
const grid = (w: ReturnType<typeof m>) => w.find('[data-slot="scatter-chart-grid"]')
const hLines = (w: ReturnType<typeof m>) => w.findAll('[data-slot="scatter-chart-grid-horizontal"]')
const vLines = (w: ReturnType<typeof m>) => w.findAll('[data-slot="scatter-chart-grid-vertical"]')

const base = { label: 'Sample', points: [{ x: 1, y: 3, size: 4 }, { x: 2, y: 5, size: 9 }, { x: 4, y: 4, size: 2 }, { x: 5, y: 8, size: 16 }] }
const series = {
  label: 'Sample',
  points: [
    { x: 1, y: 2, series: 'A' }, { x: 2, y: 3, series: 'A' }, { x: 3, y: 5, series: 'A' },
    { x: 1, y: 4, series: 'B' }, { x: 2, y: 6, series: 'B' },
    { x: 4, y: 1, series: 'C' }, { x: 5, y: 2, series: 'C' },
    { x: 6, y: 7, series: 'D' }, { x: 7, y: 8, series: 'D' },
    { x: 8, y: 3, series: 'E' }, { x: 9, y: 4, series: 'E' },
  ],
}

describe('ScatterChart variants: defaults are pinned', () => {
  it('keeps the default markup when no variation prop is set', () => {
    const w = m(base)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 280')
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    expect(w.attributes('data-variant')).toBe('scatter')
    expect(radii(w).every((r) => r === SCATTER_RADIUS.md)).toBe(true)
    expect(grid(w).attributes('data-grid')).toBeUndefined()
    expect(hLines(w).length).toBeGreaterThan(1)
    expect(vLines(w).length).toBeGreaterThan(1)
    expect(w.findAll('[data-slot="scatter-chart-line"]')).toHaveLength(0)
    expect(w.findAll('[data-slot="scatter-chart-trend"]')).toHaveLength(0)
    expect(pts(w).every((p) => p.element.tagName.toLowerCase() === 'circle')).toBe(true)
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ ...base, variant: 'scatter', markerShape: 'series', size: 'md', grid: 'full', trend: false, showValues: false }).html()).toBe(m(base).html())
  })
  it('scatterChartVariants gives the same classes for plain elements', () => {
    expect(scatterChartVariants()).toBe('flex w-full min-w-0 flex-col gap-2')
    expect(scatterChartVariants({ size: 'sm' })).toContain('gap-1.5')
    expect(scatterChartVariants({ size: 'lg' })).toContain('gap-3')
    expect(scatterChartVariants({ size: 'lg', class: 'extra' })).toContain('extra')
  })
})

describe('ScatterChart variants: variant', () => {
  it('scatter draws equal markers and no lines', () => {
    const w = m({ ...base, variant: 'scatter' })
    expect(new Set(radii(w)).size).toBe(1)
    expect(w.findAll('[data-slot="scatter-chart-line"]')).toHaveLength(0)
    expect(pts(w)[0]!.attributes('fill-opacity')).toBeUndefined()
  })
  it('bubble scales the radius with the area of size, between the bounds', () => {
    const w = m({ ...base, variant: 'bubble' })
    const [min, max] = BUBBLE_RADIUS.md
    const bySize = new Map(w.findAll('[data-slot="scatter-chart-point"]').map((p) => [p.find('title').text().match(/size (\d+)/)![1], Number(p.attributes('r'))]))
    expect(bySize.get('16')).toBe(max)
    expect(bySize.get('9')).toBeCloseTo(max * Math.sqrt(9 / 16), 1)
    expect(bySize.get('2')).toBeGreaterThanOrEqual(min)
    expect(bySize.get('2')!).toBeLessThan(bySize.get('4')!)
    expect(w.attributes('data-variant')).toBe('bubble')
    expect(pts(w).every((p) => p.attributes('fill-opacity') === '0.7')).toBe(true)
  })
  it('bubble draws the largest bubbles first so small ones stay on top', () => {
    const r = radii(m({ ...base, variant: 'bubble' }))
    expect(r).toEqual([...r].sort((a, b) => b - a))
  })
  it('bubble gives points without a size the smallest radius', () => {
    const w = m({ label: 'S', variant: 'bubble', points: [{ x: 1, y: 1, size: 10 }, { x: 2, y: 2 }] })
    expect(radii(w).sort((a, b) => a - b)[0]).toBe(BUBBLE_RADIUS.md[0])
  })
  it('bubble keeps the size column in the table; scatter does not', () => {
    expect(m({ ...base, variant: 'bubble' }).findAll('thead th').map((t) => t.text())).toContain('Size')
    expect(m({ label: 'S', points: [{ x: 1, y: 2 }] }).findAll('thead th').map((t) => t.text())).not.toContain('Size')
  })
  it('connected adds one line per series in data order', () => {
    const w = m({ ...series, variant: 'connected' })
    const lines = w.findAll('[data-slot="scatter-chart-line"]')
    expect(lines).toHaveLength(5)
    expect(lines[0]!.attributes('d')).toMatch(/^M[\d.]+,[\d.]+ L[\d.]+,[\d.]+ L[\d.]+,[\d.]+$/)
    expect(lines.map((l) => l.attributes('stroke-dasharray'))).toEqual([undefined, '6 4', '2 4', '8 3 2 3', '1 5'])
    expect(lines[0]!.classes()).toContain('stroke-chart-1')
    expect(w.attributes('data-variant')).toBe('connected')
  })
  it('connected follows the order of the data, not the order of x', () => {
    const w = m({ label: 'S', variant: 'connected', points: [{ x: 5, y: 1 }, { x: 1, y: 5 }, { x: 3, y: 3 }] })
    const xs = [...w.find('[data-slot="scatter-chart-line"]').attributes('d')!.matchAll(/[ML]([\d.]+),/g)].map((x) => Number(x[1]))
    expect(xs[0]!).toBeGreaterThan(xs[1]!)
    expect(xs[2]!).toBeGreaterThan(xs[1]!)
  })
  it('connected draws no line for a series with one point', () => {
    const w = m({ label: 'S', variant: 'connected', points: [{ x: 1, y: 1, series: 'A' }, { x: 2, y: 2, series: 'B' }, { x: 3, y: 3, series: 'B' }] })
    expect(w.findAll('[data-slot="scatter-chart-line"]')).toHaveLength(1)
  })
  it('an unknown variant falls back to scatter', () => {
    expect(m({ ...base, variant: 'hexbin' }).html()).toBe(m(base).html())
  })
  it('the three variants differ', () => {
    expect(new Set(['scatter', 'bubble', 'connected'].map((variant) => m({ ...base, variant }).html())).size).toBe(3)
  })
  it('the name, the summary kind and the table follow the variant without changing the data', () => {
    const summaries = ['scatter', 'bubble', 'connected'].map((variant) => m({ ...base, variant }).find('[data-slot="scatter-chart-summary"]').text())
    expect(summaries.map((s) => s.split(':')[0])).toEqual(['Scatter chart', 'Bubble chart', 'Connected scatter chart'])
    expect(m({ ...base, variant: 'bubble' }).find('table').html()).toBe(m({ ...base, variant: 'connected' }).find('table').html())
  })
})

describe('ScatterChart variants: markerShape', () => {
  it('series gives each series its own shape and cycles after four', () => {
    const w = m(series)
    const first = (i: number) => w.find(`[data-slot="scatter-chart-point"][data-series="${i}"]`)
    const shape = (i: number) => (first(i).element.tagName.toLowerCase() === 'circle' ? 'circle' : first(i).attributes('data-marker'))
    expect([0, 1, 2, 3, 4].map(shape)).toEqual(['circle', 'square', 'diamond', 'triangle', 'circle'])
  })
  it('a single series is drawn with circles under the default', () => {
    expect(pts(m(base)).every((p) => p.element.tagName.toLowerCase() === 'circle')).toBe(true)
  })
  it.each(['square', 'diamond', 'triangle'])('%s applies to every series as a closed path', (shape) => {
    const w = m({ ...series, markerShape: shape })
    expect(pts(w).every((p) => p.element.tagName.toLowerCase() === 'path' && p.attributes('data-marker') === shape && p.attributes('d')!.endsWith('Z'))).toBe(true)
    expect(pts(w)[0]!.find('title').text()).toBe('A: x 1, y 2')
  })
  it('circle applies to every series', () => {
    expect(pts(m({ ...series, markerShape: 'circle' })).every((p) => p.element.tagName.toLowerCase() === 'circle')).toBe(true)
  })
  it('an unknown shape behaves like series', () => {
    expect(m({ ...series, markerShape: 'star' }).html()).toBe(m(series).html())
  })
  it('the legend repeats the shapes of the series', () => {
    const items = m(series).findAll('[data-slot="scatter-chart-legend-item"]')
    expect(items).toHaveLength(5)
    expect(items[0]!.find('circle').exists()).toBe(true)
    expect(items[1]!.find('path').attributes('d')).toBe('M2.4,2.4 h7.2 v7.2 h-7.2 Z')
    const fixed = m({ ...series, markerShape: 'triangle', showLegend: true }).findAll('[data-slot="scatter-chart-legend-item"]')
    expect(fixed.every((i) => i.find('path').exists())).toBe(true)
  })
  it('bubble markers keep the shape of their series', () => {
    const w = m({ label: 'S', variant: 'bubble', points: [{ x: 1, y: 1, size: 3, series: 'A' }, { x: 2, y: 2, size: 5, series: 'B' }] })
    expect(pts(w).map((p) => p.attributes('data-marker'))).toEqual(['square', undefined])
  })
})

describe('ScatterChart variants: size', () => {
  it.each([
    ['sm', 200, 3.5],
    ['md', 280, 4.5],
    ['lg', 360, 6],
  ] as const)('%s sets the height, the marker and the gap', (size, h, r) => {
    const w = m({ ...base, size })
    expect(w.find('svg').attributes('viewBox')).toBe(`0 0 480 ${h}`)
    expect(SCATTER_HEIGHTS[size]).toBe(h)
    expect(radii(w).every((x) => x === r)).toBe(true)
    expect(w.classes().find((c) => c.startsWith('gap-'))).toBe({ sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' }[size])
  })
  it('bubble radii follow the size bounds', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const r = radii(m({ ...base, variant: 'bubble', size }))
      expect(Math.max(...r)).toBe(BUBBLE_RADIUS[size][1])
      expect(Math.min(...r)).toBeGreaterThanOrEqual(BUBBLE_RADIUS[size][0])
    }
  })
  it('an explicit height wins and unknown sizes fall back to md', () => {
    expect(m({ ...base, size: 'sm', height: 222 }).find('svg').attributes('viewBox')).toBe('0 0 480 222')
    expect(m({ ...base, size: 'giant' }).html()).toBe(m(base).html())
  })
})

describe('ScatterChart variants: grid', () => {
  it('none draws no gridlines at all', () => {
    expect(grid(m({ ...base, grid: 'none' })).exists()).toBe(false)
  })
  it('horizontal draws lines at the y ticks only', () => {
    const w = m({ ...base, grid: 'horizontal' })
    expect(hLines(w).length).toBe(w.findAll('[data-slot="scatter-chart-tick-y"]').length)
    expect(vLines(w)).toHaveLength(0)
    expect(grid(w).attributes('data-grid')).toBe('horizontal')
    expect(hLines(w)[0]!.attributes('x1')).not.toBe(hLines(w)[0]!.attributes('x2'))
    expect(hLines(w)[0]!.attributes('y1')).toBe(hLines(w)[0]!.attributes('y2'))
  })
  it('vertical draws lines at the x ticks only', () => {
    const w = m({ ...base, grid: 'vertical' })
    expect(vLines(w).length).toBeGreaterThan(1)
    expect(hLines(w)).toHaveLength(0)
    expect(vLines(w)[0]!.attributes('x1')).toBe(vLines(w)[0]!.attributes('x2'))
  })
  it('full draws both, solid', () => {
    const w = m({ ...base, grid: 'full' })
    expect(hLines(w).length).toBeGreaterThan(1)
    expect(vLines(w).length).toBeGreaterThan(1)
    expect([...hLines(w), ...vLines(w)].every((l) => l.attributes('stroke-dasharray') === undefined)).toBe(true)
  })
  it('dashed draws both, dashed', () => {
    const w = m({ ...base, grid: 'dashed' })
    expect(grid(w).attributes('data-grid')).toBe('dashed')
    expect([...hLines(w), ...vLines(w)].every((l) => l.attributes('stroke-dasharray') === '3 4')).toBe(true)
  })
  it('an unknown style falls back to full', () => {
    expect(m({ ...base, grid: 'dotted' }).html()).toBe(m(base).html())
  })
  it('gridlines are decoration inside the labelled image: they carry no text', () => {
    expect(grid(m(base)).text()).toBe('')
  })
})

describe('ScatterChart variants: combinations and customisation', () => {
  it('bubble with series shapes, trend, dashed grid, titles and a large size renders everything', () => {
    const w = m({ ...series, variant: 'bubble', trend: true, grid: 'dashed', size: 'lg', xTitle: 'X', yTitle: 'Y', showValues: true })
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 360')
    expect(pts(w)).toHaveLength(11)
    expect(w.findAll('[data-slot="scatter-chart-trend"]').length).toBeGreaterThan(0)
    expect(w.findAll('[data-slot="scatter-chart-legend-item"]').length).toBe(6)
    expect(w.html()).not.toMatch(/NaN|Infinity/)
  })
  it('connected with square markers, no grid and a small size', () => {
    const w = m({ ...series, variant: 'connected', markerShape: 'square', grid: 'none', size: 'sm' })
    expect(w.findAll('[data-slot="scatter-chart-line"]')).toHaveLength(5)
    expect(pts(w)[0]!.attributes('data-marker')).toBe('square')
    expect(grid(w).exists()).toBe(false)
  })
  it.each(['scatter', 'bubble', 'connected'])('%s in every size and grid renders without bad numbers', (variant) => {
    for (const size of ['sm', 'md', 'lg']) {
      for (const g of ['none', 'horizontal', 'vertical', 'full', 'dashed']) {
        expect(m({ ...base, variant, size, grid: g, trend: true, showValues: true }).html()).not.toMatch(/NaN|Infinity/)
      }
    }
  })
  it('the class prop is merged last and variants never change the name or the table', () => {
    const w = m({ ...series, variant: 'bubble', class: 'max-w-sm gap-6' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).not.toContain('gap-2')
    const plain = m(series)
    const styled = m({ ...series, variant: 'connected', markerShape: 'diamond', grid: 'none', size: 'sm', trend: true })
    expect(styled.find('svg').attributes('aria-label')).toBe(plain.find('svg').attributes('aria-label'))
    expect(styled.find('table').html()).toBe(plain.find('table').html())
  })
  it('every variant keeps the same empty state', () => {
    for (const variant of ['scatter', 'bubble', 'connected']) {
      expect(m({ label: 'S', points: [], variant, markerShape: 'square', grid: 'dashed', size: 'lg' }).find('[data-slot="scatter-chart-empty"]').exists()).toBe(true)
    }
  })
})
