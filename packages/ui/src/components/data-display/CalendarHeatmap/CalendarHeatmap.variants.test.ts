import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CalendarHeatmap from './CalendarHeatmap.vue'
import { CALENDAR_GAPS, CALENDAR_SHAPES, CALENDAR_SIZES, CELL_GAP, CELL_SIZE, calendarHeatmapVariants } from './variants'
import { CALENDAR_RAMP } from './calendarRamp'

const m = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => mount(CalendarHeatmap, { props: props as never, attrs })
const data = [
  { date: '2025-03-03', value: 2 },
  { date: '2025-03-05', value: 6 },
  { date: '2025-03-12', value: 0 },
  { date: '2025-03-18', value: 10 },
]
const base = { label: 'Sample', data, start: '2025-03-03', end: '2025-03-23' }
const slot = (w: ReturnType<typeof m>, s: string) => w.findAll(`[data-slot="${s}"]`)
const num = (el: { attributes: (k: string) => string | undefined }, k: string) => Number(el.attributes(k))
const box = (w: ReturnType<typeof m>) => w.find('svg').attributes('viewBox')!.split(' ').map(Number) as [number, number, number, number]
const clean = (w: ReturnType<typeof m>) => !/NaN|Infinity|undefined/.test(w.html().replace(/<!--.*?-->/g, ''))

describe('CalendarHeatmap variants: defaults are unchanged', () => {
  it('pins the root classes, the cell geometry and the viewBox', () => {
    const w = m(base)
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    expect(w.attributes('data-shape')).toBe('square')
    expect(w.attributes('data-gap')).toBe('md')
    const cell = slot(w, 'calendar-heatmap-day')[0]!
    expect(cell.attributes('width')).toBe('12')
    expect(cell.attributes('height')).toBe('12')
    expect(cell.attributes('rx')).toBe('2')
    expect(box(w)).toEqual([0, 0, 177, 136])
    expect(w.find('svg').attributes('width')).toBe('177')
    expect(w.find('svg').attributes('height')).toBe('136')
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ ...base, weekStart: 'sun', size: 'md', shape: 'square', gap: 'md', levels: 5, tone: 'chart-1', showLegend: true, showMonthLabels: true, showWeekdayLabels: true }).html()).toBe(m(base).html())
  })
  it('the cva helper keeps the default string for plain elements', () => {
    expect(calendarHeatmapVariants()).toBe('flex w-full min-w-0 flex-col gap-2')
    expect(calendarHeatmapVariants({ size: 'sm' })).toBe('flex w-full min-w-0 flex-col gap-1.5')
    expect(calendarHeatmapVariants({ size: 'lg', shape: 'circle', gap: 'lg' })).toBe('flex w-full min-w-0 flex-col gap-3')
  })
})

describe('CalendarHeatmap variants: size', () => {
  it.each([
    ['sm', 10, 1.5],
    ['md', 12, 2],
    ['lg', 16, 2],
  ])('%s draws %i px cells with a %s radius', (size, px, rx) => {
    const w = m({ ...base, size })
    for (const c of slot(w, 'calendar-heatmap-day')) {
      expect(num(c, 'width')).toBe(px)
      expect(num(c, 'height')).toBe(px)
      expect(num(c, 'rx')).toBe(rx)
    }
    expect(slot(w, 'calendar-heatmap-legend-swatch').every((c) => num(c, 'width') === px)).toBe(true)
    expect(CELL_SIZE[size as 'sm']).toBe(px)
  })
  it('the step between cells follows the size', () => {
    const step = (size: string) => {
      const w = m({ ...base, size })
      return num(w.find('[data-date="2025-03-09"]'), 'x') - num(w.find('[data-date="2025-03-03"]'), 'x')
    }
    expect([step('sm'), step('md'), step('lg')]).toEqual([12, 14, 18])
  })
  it('the chart grows with the size and the root gap follows it', () => {
    expect(box(m({ ...base, size: 'sm' }))[3]).toBeLessThan(box(m(base))[3])
    expect(box(m({ ...base, size: 'lg' }))[3]).toBeGreaterThan(box(m(base))[3])
    expect(m({ ...base, size: 'sm' }).classes()).toContain('gap-1.5')
    expect(m({ ...base, size: 'lg' }).classes()).toContain('gap-3')
  })
  it('an unknown size falls back to md', () => {
    expect(m({ ...base, size: 'huge' }).html()).toBe(m(base).html())
    expect(CALENDAR_SIZES).toEqual(['sm', 'md', 'lg'])
  })
})

describe('CalendarHeatmap variants: shape', () => {
  it('circle draws circles with a radius of half the cell, in the legend too', () => {
    const w = m({ ...base, shape: 'circle' })
    const cells = slot(w, 'calendar-heatmap-day')
    expect(cells).toHaveLength(21)
    expect(cells.every((c) => c.element.tagName === 'circle' && num(c, 'r') === 6)).toBe(true)
    expect(slot(w, 'calendar-heatmap-legend-swatch').every((c) => c.element.tagName === 'circle')).toBe(true)
    expect(w.find('rect').exists()).toBe(false)
    expect(w.attributes('data-shape')).toBe('circle')
  })
  it('a circle sits in the middle of the cell a square would fill', () => {
    const sq = m(base).find('[data-date="2025-03-05"]')
    const ci = m({ ...base, shape: 'circle' }).find('[data-date="2025-03-05"]')
    expect(num(ci, 'cx')).toBe(num(sq, 'x') + 6)
    expect(num(ci, 'cy')).toBe(num(sq, 'y') + 6)
  })
  it('the table, tooltips and fills are the same for both shapes', () => {
    const a = m(base)
    const b = m({ ...base, shape: 'circle' })
    expect(b.find('[data-slot="chart-data-table"]').html()).toBe(a.find('[data-slot="chart-data-table"]').html())
    expect(slot(b, 'calendar-heatmap-day').map((c) => [c.find('title').text(), c.classes().join(' ')])).toEqual(slot(a, 'calendar-heatmap-day').map((c) => [c.find('title').text(), c.classes().join(' ')]))
  })
  it('an unknown shape falls back to square', () => {
    expect(m({ ...base, shape: 'hexagon' }).html()).toBe(m(base).html())
    expect(CALENDAR_SHAPES).toEqual(['square', 'circle'])
  })
})

describe('CalendarHeatmap variants: gap', () => {
  it.each([
    ['sm', 1],
    ['md', 2],
    ['lg', 4],
  ])('%s leaves %i px between cells', (gap, px) => {
    const w = m({ ...base, gap })
    expect(num(w.find('[data-date="2025-03-09"]'), 'x') - num(w.find('[data-date="2025-03-03"]'), 'x')).toBe(12 + px)
    expect(CELL_GAP[gap as 'sm']).toBe(px)
    expect(w.attributes('data-gap')).toBe(gap)
  })
  it('a wider gap makes the chart larger', () => {
    expect(box(m({ ...base, gap: 'lg' }))[3]).toBeGreaterThan(box(m({ ...base, gap: 'sm' }))[3])
  })
  it('an unknown gap falls back to md', () => {
    expect(m({ ...base, gap: 'wide' }).html()).toBe(m(base).html())
    expect(CALENDAR_GAPS).toEqual(['sm', 'md', 'lg'])
  })
})

describe('CalendarHeatmap variants: tone', () => {
  it.each([
    ['chart-1', 'fill-chart-1'], ['chart-2', 'fill-chart-2'], ['chart-3', 'fill-chart-3'], ['chart-4', 'fill-chart-4'], ['chart-5', 'fill-chart-5'],
    ['primary', 'fill-primary'], ['success', 'fill-success'], ['warning', 'fill-warning'], ['danger', 'fill-destructive'], ['info', 'fill-info'], ['muted', 'fill-muted-foreground'],
  ])('%s fills the strongest cell with %s', (tone, cls) => {
    const w = m({ ...base, tone })
    expect(slot(w, 'calendar-heatmap-day').find((c) => c.attributes('data-date') === '2025-03-18')!.classes()).toContain(cls)
    expect(slot(w, 'calendar-heatmap-legend-swatch')[5]!.classes()).toContain(cls)
  })
  it('an unknown tone falls back to chart-1', () => {
    expect(m({ ...base, tone: 'pink' }).html()).toBe(m(base).html())
  })
})

describe('CalendarHeatmap variants: levels', () => {
  it.each([3, 4, 5, 6, 7])('%i levels give %i distinct fills and a legend of %i swatches', (levels) => {
    const many = Array.from({ length: 70 }, (_, i) => ({ date: new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10), value: i + 1 }))
    const w = m({ label: 'Sample', data: many, levels })
    expect(new Set(slot(w, 'calendar-heatmap-day').map((c) => c.classes().find((k) => k.startsWith('fill-')))).size).toBe(levels)
    expect(slot(w, 'calendar-heatmap-legend-swatch')).toHaveLength(levels + 1)
  })
  it('every level count starts at the faintest step and ends at full colour', () => {
    for (let n = 3; n <= 7; n++) {
      const legend = slot(m({ ...base, levels: n }), 'calendar-heatmap-legend-swatch').map((c) => c.classes().find((k) => k.startsWith('fill-')))
      expect(legend[1]).toBe(CALENDAR_RAMP['chart-1'][0])
      expect(legend[n]).toBe(CALENDAR_RAMP['chart-1'][6])
    }
  })
  it('a wider legend makes the chart wider', () => {
    expect(box(m({ ...base, levels: 7 }))[2]).toBeGreaterThan(box(m({ ...base, levels: 3 }))[2])
  })
})

describe('CalendarHeatmap variants: weekStart', () => {
  it('mon and sun give different grids for the same data', () => {
    expect(m({ ...base, weekStart: 'mon' }).html()).not.toBe(m(base).html())
    expect(m({ ...base, weekStart: 'mon' }).findAll('[data-slot="calendar-heatmap-day"]')).toHaveLength(21)
  })
  it('mon needs fewer columns for Monday-to-Sunday weeks than sun', () => {
    const lastX = (weekStart: string) => num(m({ ...base, weekStart }).find('[data-date="2025-03-23"]'), 'x')
    expect(lastX('mon')).toBe(30 + 2 * 14)
    expect(lastX('sun')).toBe(30 + 3 * 14)
  })
  it('an unknown weekStart falls back to sun', () => {
    expect(m({ ...base, weekStart: 'fri' }).html()).toBe(m(base).html())
  })
  it('the table alternative does not depend on the week start', () => {
    expect(m({ ...base, weekStart: 'mon' }).find('[data-slot="chart-data-table"]').html()).toBe(m(base).find('[data-slot="chart-data-table"]').html())
  })
})

describe('CalendarHeatmap variants: combinations', () => {
  it('every size x shape x gap x weekStart renders clean markup with a cell per day', () => {
    for (const size of CALENDAR_SIZES) {
      for (const shape of CALENDAR_SHAPES) {
        for (const gap of CALENDAR_GAPS) {
          for (const weekStart of ['sun', 'mon']) {
            const w = m({ ...base, size, shape, gap, weekStart, levels: 4, tone: 'info' })
            expect(clean(w)).toBe(true)
            expect(slot(w, 'calendar-heatmap-day')).toHaveLength(21)
            expect(slot(w, 'calendar-heatmap-legend-swatch')).toHaveLength(5)
          }
        }
      }
    }
  })
  it('class wins over the variant gap', () => {
    const w = m({ ...base, size: 'lg', class: 'gap-1' })
    expect(w.classes()).toContain('gap-1')
    expect(w.classes()).not.toContain('gap-3')
  })
  it('is deterministic for every combination', () => {
    for (const size of CALENDAR_SIZES) for (const shape of CALENDAR_SHAPES) expect(m({ ...base, size, shape }).html()).toBe(m({ ...base, size, shape }).html())
  })
})
