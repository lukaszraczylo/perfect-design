import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RadarChart from './RadarChart.vue'
import { RADAR_HEIGHTS, radarChartVariants } from './variants'

const m = (props: Record<string, unknown>) => mount(RadarChart, { props: props as never })
const rings = (w: ReturnType<typeof m>) => w.findAll('[data-slot="radar-chart-ring"]')
const lines = (w: ReturnType<typeof m>) => w.findAll('[data-slot="radar-chart-line"]')
const areas = (w: ReturnType<typeof m>) => w.findAll('[data-slot="radar-chart-area"]')
const dots = (w: ReturnType<typeof m>) => w.findAll('[data-slot="radar-chart-dot"]')

const base = { label: 'Sample', axes: ['A', 'B', 'C', 'D', 'E'], series: [{ name: 'One', data: [3, 8, 5, 9, 6] }, { name: 'Two', data: [6, 2, 7, 4, 8] }] }

describe('RadarChart variants: defaults are pinned', () => {
  it('keeps the default markup when no variation prop is set', () => {
    const w = m(base)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 300')
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    expect(w.attributes('data-variant')).toBe('line')
    expect(w.attributes('data-shape')).toBe('polygon')
    expect(rings(w)).toHaveLength(4)
    expect(rings(w).every((r) => r.element.tagName.toLowerCase() === 'path')).toBe(true)
    expect(lines(w)).toHaveLength(2)
    expect(areas(w)).toHaveLength(0)
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ ...base, variant: 'line', shape: 'polygon', levels: 4, size: 'md', showValues: false, showScale: true }).html()).toBe(m(base).html())
  })
  it('radarChartVariants gives the same classes for plain elements', () => {
    expect(radarChartVariants()).toBe('flex w-full min-w-0 flex-col gap-2')
    expect(radarChartVariants({ size: 'sm' })).toContain('gap-1.5')
    expect(radarChartVariants({ size: 'lg', class: 'x' })).toBe('flex w-full min-w-0 flex-col gap-3 x')
  })
})

describe('RadarChart variants: variant', () => {
  it('line outlines each series without a fill', () => {
    const w = m({ ...base, variant: 'line' })
    expect(lines(w)).toHaveLength(2)
    expect(areas(w)).toHaveLength(0)
    expect(dots(w)).toHaveLength(10)
  })
  it('area adds a soft fill under each outline', () => {
    const w = m({ ...base, variant: 'area' })
    expect(areas(w)).toHaveLength(2)
    expect(areas(w)[0]!.classes()).toContain('fill-chart-1/15')
    expect(areas(w)[0]!.attributes('d')).toBe(lines(w)[0]!.attributes('d'))
    expect(lines(w)).toHaveLength(2)
  })
  it('dots draws markers only, a little larger, with no outline and no fill', () => {
    const w = m({ ...base, variant: 'dots' })
    expect(lines(w)).toHaveLength(0)
    expect(areas(w)).toHaveLength(0)
    expect(dots(w)).toHaveLength(10)
    expect(Number(dots(w)[0]!.attributes('r'))).toBe(4.5)
    expect(Number(m(base).findAll('[data-slot="radar-chart-dot"]')[0]!.attributes('r'))).toBe(3)
  })
  it('the legend shows a line sample for line and area, and the marker alone for dots', () => {
    expect(m({ ...base, variant: 'area' }).find('[data-slot="radar-chart-legend-item"] line').exists()).toBe(true)
    const dotsLegend = m({ ...base, variant: 'dots' }).find('[data-slot="radar-chart-legend-item"]')
    expect(dotsLegend.find('line').exists()).toBe(false)
    expect(dotsLegend.find('circle').exists()).toBe(true)
  })
  it('series keep their marker shape in every variant', () => {
    for (const variant of ['line', 'area', 'dots']) {
      const w = m({ ...base, variant })
      expect(w.find('[data-slot="radar-chart-series"][data-series="1"] [data-slot="radar-chart-dot"]').attributes('data-marker')).toBe('square')
    }
  })
  it('an unknown variant falls back to line', () => {
    expect(m({ ...base, variant: 'filled' }).html()).toBe(m(base).html())
  })
  it('the three variants differ and share name, summary and table', () => {
    const all = ['line', 'area', 'dots'].map((variant) => m({ ...base, variant }))
    expect(new Set(all.map((w) => w.html())).size).toBe(3)
    expect(new Set(all.map((w) => w.find('table').html())).size).toBe(1)
    expect(new Set(all.map((w) => w.find('[data-slot="radar-chart-summary"]').text())).size).toBe(1)
  })
})

describe('RadarChart variants: shape', () => {
  it('polygon draws the rings as closed paths through the axes', () => {
    const w = m({ ...base, shape: 'polygon' })
    expect(rings(w).every((r) => /^M[\d.]+,[\d.]+( L[\d.]+,[\d.]+){4} Z$/.test(r.attributes('d')!))).toBe(true)
  })
  it('circle draws the rings as circles with growing radii around the centre', () => {
    const w = m({ ...base, shape: 'circle' })
    expect(rings(w).every((r) => r.element.tagName.toLowerCase() === 'circle')).toBe(true)
    const r = rings(w).map((c) => Number(c.attributes('r')))
    expect(r).toEqual([...r].sort((a, b) => a - b))
    expect(new Set(rings(w).map((c) => c.attributes('cx'))).size).toBe(1)
    expect(w.attributes('data-shape')).toBe('circle')
  })
  it('the spokes and the series outline do not change with the shape', () => {
    const a = m({ ...base, shape: 'polygon' })
    const b = m({ ...base, shape: 'circle' })
    expect(b.findAll('[data-slot="radar-chart-spoke"]')).toHaveLength(5)
    expect(lines(b)[0]!.attributes('d')).toBe(lines(a)[0]!.attributes('d'))
  })
  it('an unknown shape falls back to polygon', () => {
    expect(m({ ...base, shape: 'star' }).html()).toBe(m(base).html())
  })
})

describe('RadarChart variants: levels', () => {
  it.each([3, 4, 5, 6])('%s levels draw that many rings and ring labels', (levels) => {
    const w = m({ ...base, levels })
    expect(rings(w)).toHaveLength(levels)
    expect(w.findAll('[data-slot="radar-chart-ring-label"]')).toHaveLength(levels)
  })
  it('the outer ring is the same maximum value covering the data', () => {
    for (const levels of [3, 4, 5, 6]) {
      const labels = m({ ...base, levels }).findAll('[data-slot="radar-chart-ring-label"]').map((t) => Number(t.text()))
      expect(labels[labels.length - 1]).toBeGreaterThanOrEqual(9)
    }
  })
  it('other numbers are rounded and clamped to 3..6, junk falls back to 4', () => {
    expect(rings(m({ ...base, levels: 1 }))).toHaveLength(3)
    expect(rings(m({ ...base, levels: 9 }))).toHaveLength(6)
    expect(rings(m({ ...base, levels: 4.6 }))).toHaveLength(5)
    expect(m({ ...base, levels: Number.NaN }).html()).toBe(m(base).html())
    expect(m({ ...base, levels: 'x' }).html()).toBe(m(base).html())
  })
})

describe('RadarChart variants: size', () => {
  it.each([
    ['sm', 220],
    ['md', 300],
    ['lg', 380],
  ] as const)('%s sets the height and the gap', (size, h) => {
    const w = m({ ...base, size })
    expect(w.find('svg').attributes('viewBox')).toBe(`0 0 480 ${h}`)
    expect(RADAR_HEIGHTS[size]).toBe(h)
    expect(w.classes().find((c) => c.startsWith('gap-'))).toBe({ sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' }[size])
  })
  it('a taller chart has a larger radius when the width allows it', () => {
    const rim = (size: string) => {
      const w = m({ ...base, size, width: 900 })
      return Number(w.findAll('[data-slot="radar-chart-spoke"]')[2]!.attributes('y2')) - Number(w.findAll('[data-slot="radar-chart-spoke"]')[0]!.attributes('y2'))
    }
    expect(rim('sm')).toBeLessThan(rim('md'))
    expect(rim('md')).toBeLessThan(rim('lg'))
  })
  it('an explicit height wins and unknown sizes fall back to md', () => {
    expect(m({ ...base, size: 'sm', height: 250 }).find('svg').attributes('viewBox')).toBe('0 0 480 250')
    expect(m({ ...base, size: 'giant' }).html()).toBe(m(base).html())
  })
})

describe('RadarChart variants: min and max', () => {
  it('a fixed scale changes the ring values and the data position', () => {
    const w = m({ ...base, min: 0, max: 100 })
    expect(w.findAll('[data-slot="radar-chart-ring-label"]').map((t) => t.text())).toEqual(['25', '50', '75', '100'])
    expect(w.find('[data-slot="radar-chart-summary"]').text()).toContain('scale 0 to 100')
  })
  it('a reversed pair is repaired and a single bound is honoured', () => {
    expect(m({ ...base, min: 100, max: 0 }).html()).toBe(m({ ...base, min: 0, max: 100 }).html())
    expect(m({ ...base, min: 2 }).find('[data-slot="radar-chart-summary"]').text()).toContain('scale 2 to ')
  })
})

describe('RadarChart variants: combinations', () => {
  it.each(['line', 'area', 'dots'])('%s with every shape, level and size renders without bad numbers', (variant) => {
    for (const shape of ['polygon', 'circle']) {
      for (const levels of [3, 4, 5, 6]) {
        for (const size of ['sm', 'md', 'lg']) {
          expect(m({ ...base, variant, shape, levels, size, showValues: true }).html()).not.toMatch(/NaN|Infinity/)
        }
      }
    }
  })
  it('area with circle rings, six levels, a large size and a fixed scale', () => {
    const w = m({ ...base, variant: 'area', shape: 'circle', levels: 6, size: 'lg', min: 0, max: 12 })
    expect(areas(w)).toHaveLength(2)
    expect(rings(w)).toHaveLength(6)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 380')
  })
  it('the class prop is merged last and variants never change the name or the table', () => {
    const w = m({ ...base, variant: 'dots', class: 'max-w-sm gap-6' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).not.toContain('gap-2')
    const styled = m({ ...base, variant: 'area', shape: 'circle', levels: 6, size: 'sm' })
    expect(styled.find('svg').attributes('aria-label')).toBe(m(base).find('svg').attributes('aria-label'))
    expect(styled.find('table').html()).toBe(m(base).find('table').html())
  })
  it('every variant keeps the empty state', () => {
    for (const variant of ['line', 'area', 'dots']) {
      expect(m({ label: 'S', axes: [], series: [], variant, shape: 'circle', levels: 6, size: 'lg' }).find('[data-slot="radar-chart-empty"]').exists()).toBe(true)
    }
  })
})
