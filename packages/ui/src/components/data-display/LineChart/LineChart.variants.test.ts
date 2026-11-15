import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LineChart from './LineChart.vue'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => mount(LineChart, { props: props as never, attrs })
const lineD = (w: ReturnType<typeof m>, i = 0) => w.findAll('[data-slot="line-chart-line"]')[i]!.attributes('d')!
const areaD = (w: ReturnType<typeof m>, i = 0) => w.findAll('[data-slot="line-chart-area"]')[i]?.attributes('d')
const dots = (w: ReturnType<typeof m>) => w.findAll('[data-slot="line-chart-dot"]')
const grid = (w: ReturnType<typeof m>) => w.find('[data-slot="line-chart-grid"]')

const base = { labels: ['A', 'B', 'C', 'D', 'E'], series: [{ name: 'Series', data: [3, 8, 4, 9, 5] }], label: 'Sample' }
const three = {
  labels: ['A', 'B', 'C', 'D'],
  series: [{ name: 'One', data: [3, 8, 4, 9] }, { name: 'Two', data: [6, 5, 7, 2] }, { name: 'Three', data: [1, 3, 2, 4] }, { name: 'Four', data: [2, 2, 3, 1] }, { name: 'Five', data: [5, 6, 5, 6] }],
  label: 'Sample',
}

describe('LineChart variants: defaults are unchanged', () => {
  it('keeps today\'s markup when no variation prop is set', () => {
    const w = m(base)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 240')
    expect(lineD(w)).toMatch(/^M[\d.]+,[\d.]+( L[\d.]+,[\d.]+){4}$/)
    expect(areaD(w)).toBeUndefined()
    expect(dots(w).every((d) => d.element.tagName.toLowerCase() === 'circle')).toBe(true)
    expect(grid(w).attributes('data-grid')).toBeUndefined()
    expect(grid(w).findAll('line')).toHaveLength(w.findAll('[data-slot="line-chart-tick"]').length)
    expect(w.classes()).toEqual(['flex', 'w-full', 'flex-col', 'gap-2'])
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ ...base, variant: 'line', curve: 'linear', size: 'md', markerShape: 'circle', grid: 'horizontal' }).html()).toBe(m(base).html())
  })
})

describe('LineChart variants: curve', () => {
  it('smooth uses cubic segments through every point', () => {
    const d = lineD(m({ ...base, curve: 'smooth' }))
    expect(d.startsWith('M')).toBe(true)
    expect(d.match(/C/g)).toHaveLength(4)
    expect(d).not.toContain('L')
  })
  it('step uses horizontal then vertical moves', () => {
    const d = lineD(m({ ...base, curve: 'step' }))
    expect(d.match(/H/g)).toHaveLength(4)
    expect(d.match(/V/g)).toHaveLength(4)
  })
  it('each curve draws a different line and the dots stay on the data points', () => {
    const lin = m(base)
    const smo = m({ ...base, curve: 'smooth' })
    const stp = m({ ...base, curve: 'step' })
    expect(new Set([lineD(lin), lineD(smo), lineD(stp)]).size).toBe(3)
    expect(dots(smo).map((d) => d.attributes('cx'))).toEqual(dots(lin).map((d) => d.attributes('cx')))
    expect(dots(smo).map((d) => d.attributes('cy'))).toEqual(dots(lin).map((d) => d.attributes('cy')))
  })
  it('an unknown curve falls back to linear', () => {
    expect(m({ ...base, curve: 'wavy' }).html()).toBe(m(base).html())
  })
  it('the area follows the curve', () => {
    const smooth = areaD(m({ ...base, area: true, curve: 'smooth' }))!
    expect(smooth).toContain('C')
    expect(smooth.endsWith('Z')).toBe(true)
    const step = areaD(m({ ...base, variant: 'area', curve: 'step' }))!
    expect(step).toContain('H')
  })
  it('gaps still break smooth and step lines', () => {
    const data = { labels: ['A', 'B', 'C', 'D', 'E', 'F'], series: [{ name: 'S', data: [1, 3, Number.NaN, 4, 2, 5] }], label: 'Sample' }
    expect(lineD(m({ ...data, curve: 'smooth' })).match(/M/g)).toHaveLength(2)
    expect(lineD(m({ ...data, curve: 'step' })).match(/M/g)).toHaveLength(2)
  })
  it('a single point draws a dot and no line for every curve', () => {
    for (const curve of ['linear', 'smooth', 'step']) {
      const w = m({ labels: ['Only'], series: [{ name: 'S', data: [4] }], label: 'Sample', curve })
      expect(w.findAll('[data-slot="line-chart-line"]')).toHaveLength(0)
      expect(dots(w)).toHaveLength(1)
    }
  })
  it('smooth lines stay inside the plot area with large swings', () => {
    const w = m({ labels: ['A', 'B', 'C', 'D', 'E'], series: [{ name: 'S', data: [0, 1000, 1, 1000, 0] }], label: 'Sample', curve: 'smooth' })
    const ys = [...lineD(w).matchAll(/,(-?[\d.]+)/g)].map((x) => Number(x[1]))
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(10)
    expect(Math.max(...ys)).toBeLessThanOrEqual(240 - 22)
  })
})

describe('LineChart variants: variant (line, area)', () => {
  it('area adds a filled path per series and line does not', () => {
    expect(areaD(m({ ...base, variant: 'area' }))).toBeDefined()
    expect(areaD(m({ ...base, variant: 'line' }))).toBeUndefined()
  })
  it('variant area is the same as the area boolean', () => {
    expect(m({ ...base, variant: 'area' }).html()).toBe(m({ ...base, area: true }).html())
  })
  it('variant line wins over area=true', () => {
    expect(m({ ...base, variant: 'line', area: true }).html()).toBe(m(base).html())
  })
  it('an unknown variant follows the area boolean', () => {
    expect(m({ ...base, variant: 'bogus', area: true }).html()).toBe(m({ ...base, area: true }).html())
    expect(m({ ...base, variant: 'bogus' }).html()).toBe(m(base).html())
  })
  it('the area uses the soft tone of each series', () => {
    const w = m({ ...base, variant: 'area' })
    expect(w.find('[data-slot="line-chart-area"]').classes()).toContain('fill-chart-1/15')
  })
})

describe('LineChart variants: size', () => {
  it.each([
    ['sm', '0 0 480 160'],
    ['md', '0 0 480 240'],
    ['lg', '0 0 480 320'],
  ])('%s sets the viewBox height', (size, viewBox) => {
    expect(m({ ...base, size }).find('svg').attributes('viewBox')).toBe(viewBox)
  })
  it('an explicit height wins and unknown sizes fall back to md', () => {
    expect(m({ ...base, size: 'sm', height: 200 }).find('svg').attributes('viewBox')).toBe('0 0 480 200')
    expect(m({ ...base, size: 'giant' }).find('svg').attributes('viewBox')).toBe('0 0 480 240')
  })
})

describe('LineChart variants: markerShape', () => {
  it('circle markers are circles', () => {
    expect(dots(m(base)).every((d) => d.element.tagName.toLowerCase() === 'circle')).toBe(true)
  })
  it.each(['square', 'diamond', 'triangle'])('%s markers are closed paths with the same title', (shape) => {
    const w = m({ ...base, markerShape: shape })
    const ds = dots(w)
    expect(ds).toHaveLength(5)
    expect(ds.every((d) => d.element.tagName.toLowerCase() === 'path' && d.attributes('data-marker') === shape && d.attributes('d')!.endsWith('Z'))).toBe(true)
    expect(ds[0]!.find('title').text()).toBe('A, Series: 3')
    expect(ds[0]!.classes()).toContain('fill-chart-1')
  })
  it('an unknown shape falls back to circles', () => {
    expect(m({ ...base, markerShape: 'star' }).html()).toBe(m(base).html())
  })
  it('series gives each series its own shape and the legend repeats them', () => {
    const w = m({ ...three, markerShape: 'series' })
    const kinds = w.findAll('[data-slot="line-chart-series"]').map((g) => g.find('[data-slot="line-chart-dot"]'))
    expect(kinds.map((k) => k.element.tagName.toLowerCase() === 'circle' ? 'circle' : k.attributes('data-marker'))).toEqual(['circle', 'square', 'diamond', 'triangle', 'circle'])
    const items = w.findAll('[data-slot="line-chart-legend-item"]')
    expect(items).toHaveLength(5)
    expect(items[0]!.find('circle').exists()).toBe(true)
    expect(items[1]!.find('path').attributes('d')).toBeDefined()
  })
  it('series markers are not drawn in the legend when dots are off', () => {
    const w = m({ ...three, markerShape: 'series', showDots: false })
    expect(dots(w)).toHaveLength(0)
    expect(w.find('[data-slot="line-chart-legend-item"] circle').exists()).toBe(false)
  })
  it('isolated points use the marker shape even with showDots off', () => {
    const w = m({ labels: ['A', 'B', 'C'], series: [{ name: 'S', data: [1, Number.NaN, 2] }], label: 'Sample', showDots: false, markerShape: 'diamond' })
    expect(dots(w)).toHaveLength(2)
    expect(dots(w)[0]!.attributes('data-marker')).toBe('diamond')
  })
})

describe('LineChart variants: grid', () => {
  it('none removes the grid even when showGrid is on', () => {
    expect(grid(m({ ...base, grid: 'none' })).exists()).toBe(false)
  })
  it('a style overrides showGrid=false', () => {
    expect(grid(m({ ...base, grid: 'horizontal', showGrid: false })).exists()).toBe(true)
    expect(grid(m({ ...base, showGrid: false })).exists()).toBe(false)
  })
  it('dashed dashes the horizontal lines', () => {
    const g = grid(m({ ...base, grid: 'dashed' }))
    expect(g.attributes('data-grid')).toBe('dashed')
    expect(g.findAll('line').every((l) => l.attributes('stroke-dasharray') === '3 4')).toBe(true)
  })
  it('full adds one vertical line per labelled x position', () => {
    const w = m({ ...base, grid: 'full' })
    const v = grid(w).findAll('[data-slot="line-chart-grid-vertical"]')
    expect(v).toHaveLength(w.findAll('[data-slot="line-chart-category"]').length)
    expect(v[0]!.attributes('x1')).toBe(v[0]!.attributes('x2'))
    expect(v.map((l) => l.attributes('x1'))).toEqual(w.findAll('[data-slot="line-chart-category"]').map((t) => t.attributes('x')))
  })
  it('horizontal draws no vertical lines', () => {
    expect(grid(m(base)).findAll('[data-slot="line-chart-grid-vertical"]')).toHaveLength(0)
  })
  it('an unknown style follows showGrid', () => {
    expect(m({ ...base, grid: 'bogus' }).html()).toBe(m(base).html())
    expect(grid(m({ ...base, grid: 'bogus', showGrid: false })).exists()).toBe(false)
  })
})

describe('LineChart variants: combinations and customisation', () => {
  it('smooth area with series markers, full grid and a large size renders everything', () => {
    const w = m({ ...three, variant: 'area', curve: 'smooth', markerShape: 'series', grid: 'full', size: 'lg' })
    expect(w.findAll('[data-slot="line-chart-series"]')).toHaveLength(5)
    expect(w.findAll('[data-slot="line-chart-area"]')).toHaveLength(5)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 320')
    expect(w.findAll('[data-slot="line-chart-line"]').map((l) => l.attributes('stroke-dasharray'))).toEqual([undefined, '6 4', '2 4', '8 3 2 3', '1 5'])
  })
  it('step curve with square markers and dashed grid', () => {
    const w = m({ ...base, curve: 'step', markerShape: 'square', grid: 'dashed' })
    expect(lineD(w)).toContain('H')
    expect(dots(w)[0]!.attributes('data-marker')).toBe('square')
  })
  it('the class prop is merged last', () => {
    const w = m({ ...base, class: 'max-w-sm gap-6' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).not.toContain('gap-2')
  })
  it('variants never change the name or the hidden table', () => {
    const plain = m(three)
    const styled = m({ ...three, variant: 'area', curve: 'step', markerShape: 'series', grid: 'full', size: 'sm' })
    expect(styled.find('svg').attributes('aria-label')).toBe(plain.find('svg').attributes('aria-label'))
    expect(styled.find('table').html()).toBe(plain.find('table').html())
  })
})

describe('LineChart variants: edge cases', () => {
  it('empty data shows the empty state with every variant set', () => {
    const w = m({ labels: [], series: [], label: 'Sample', variant: 'area', curve: 'smooth', markerShape: 'series', grid: 'full', size: 'lg' })
    expect(w.find('[data-slot="line-chart-empty"]').exists()).toBe(true)
    expect(w.find('svg').exists()).toBe(false)
  })
  it('negative and zero values with every curve', () => {
    for (const curve of ['linear', 'smooth', 'step']) {
      const w = m({ labels: ['A', 'B', 'C'], series: [{ name: 'S', data: [-5, 0, -2] }], label: 'Sample', curve, variant: 'area' })
      expect(lineD(w)).not.toMatch(/NaN|Infinity/)
      expect(areaD(w)).not.toMatch(/NaN|Infinity/)
    }
  })
  it('a long series stays fast and finite with smooth curves', () => {
    const labels = Array.from({ length: 2000 }, (_, i) => String(i))
    const w = m({ labels, series: [{ name: 'S', data: labels.map((_, i) => Math.sin(i / 20) * 100) }], label: 'Sample', curve: 'smooth', grid: 'full' })
    expect(lineD(w)).not.toMatch(/NaN|Infinity/)
    expect(grid(w).findAll('[data-slot="line-chart-grid-vertical"]').length).toBeLessThan(200)
  })
})
