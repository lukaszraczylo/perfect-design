import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WaterfallChart from './WaterfallChart.vue'
import { WATERFALL_ROW_HEIGHT, waterfallChartVariants } from './variants'

const m = (props: Record<string, unknown>) => mount(WaterfallChart, { props: props as never })
const bars = (w: ReturnType<typeof m>) => w.findAll('[data-slot="waterfall-chart-bar"]')
const steps = (w: ReturnType<typeof m>) => w.findAll('[data-slot="waterfall-chart-step"]')
const pops = (w: ReturnType<typeof m>) => w.findAll('[data-slot="waterfall-chart-lollipop"]')
const connectors = (w: ReturnType<typeof m>) => w.findAll('[data-slot="waterfall-chart-connector"]')
const num = (w: { attributes: (n: string) => string | undefined }, k: string) => Number(w.attributes(k))

const items = [{ label: 'Open', value: 100 }, { label: 'Up', value: 60 }, { label: 'Down', value: -40 }, { label: 'Sub', type: 'subtotal' }, { label: 'More', value: 25 }, { label: 'End', type: 'total' }]
const base = { label: 'Sample', items }

describe('WaterfallChart variants: defaults are pinned', () => {
  it('keeps the default markup when no variation prop is set', () => {
    const w = m(base)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 240')
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    expect(w.attributes('data-variant')).toBe('bars')
    expect(w.attributes('data-orientation')).toBe('vertical')
    expect(bars(w)).toHaveLength(6)
    expect(connectors(w)).toHaveLength(5)
    expect(w.findAll('[data-slot="waterfall-chart-value"]')).toHaveLength(0)
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ ...base, variant: 'bars', orientation: 'vertical', connectors: true, size: 'md', gap: 'md', showValues: false, showGrid: true, showAxis: true, showLegend: 'auto', positiveTone: 'success', negativeTone: 'danger', totalTone: 'primary' }).html()).toBe(m(base).html())
  })
  it('waterfallChartVariants gives the same classes for plain elements', () => {
    expect(waterfallChartVariants()).toBe('flex w-full min-w-0 flex-col gap-2')
    expect(waterfallChartVariants({ size: 'sm' })).toContain('gap-1.5')
    expect(waterfallChartVariants({ size: 'lg', class: 'x' })).toBe('flex w-full min-w-0 flex-col gap-3 x')
  })
})

describe('WaterfallChart variants: variant', () => {
  it('bars draws a rectangle per item, decreases hatched', () => {
    const w = m({ ...base, variant: 'bars' })
    expect(bars(w).map((b) => b.element.tagName.toLowerCase())).toEqual(Array(6).fill('rect'))
    expect(bars(w)[2]!.attributes('fill')).toMatch(/^url\(#/)
    expect(w.find('pattern').exists()).toBe(true)
    expect(steps(w)).toHaveLength(0)
    expect(pops(w)).toHaveLength(0)
  })
  it('steps draws a riser and a tread per item; decreases are dashed', () => {
    const w = m({ ...base, variant: 'steps' })
    expect(steps(w)).toHaveLength(6)
    expect(bars(w)).toHaveLength(0)
    expect(w.find('pattern').exists()).toBe(false)
    const tread = (i: number) => steps(w)[i]!.find('[data-slot="waterfall-chart-tread"]')
    const riser = (i: number) => steps(w)[i]!.find('[data-slot="waterfall-chart-riser"]')
    expect(tread(1).attributes('stroke-dasharray')).toBeUndefined()
    expect(tread(2).attributes('stroke-dasharray')).toBe('6 3')
    expect(riser(2).attributes('stroke-dasharray')).toBe('4 3')
    expect(steps(w)[2]!.classes()).toContain('stroke-destructive')
    expect(steps(w)[1]!.classes()).toContain('stroke-success')
    expect(tread(1).attributes('d')).toMatch(/^M[\d.]+,([\d.]+) L[\d.]+,\1$/)
  })
  it('steps: the tread is at the new level and the riser starts at the old one', () => {
    const w = m({ ...base, variant: 'steps' })
    const y = (el: { attributes: (n: string) => string | undefined }, n: number) => Number(el.attributes('d')!.match(/[ML]([\d.]+),([\d.]+)/g)![n]!.split(',')[1])
    const riser = steps(w)[1]!.find('[data-slot="waterfall-chart-riser"]')
    const tread = steps(w)[1]!.find('[data-slot="waterfall-chart-tread"]')
    expect(y(riser, 1)).toBeCloseTo(y(tread, 0), 1)
    expect(y(riser, 0)).toBeGreaterThan(y(riser, 1))
    const down = steps(w)[2]!
    expect(y(down.find('[data-slot="waterfall-chart-riser"]'), 0)).toBeLessThan(y(down.find('[data-slot="waterfall-chart-riser"]'), 1))
  })
  it('lollipop draws a stem and a head: filled circle for a rise, hollow for a fall, square for a total', () => {
    const w = m({ ...base, variant: 'lollipop' })
    expect(pops(w)).toHaveLength(6)
    const head = (i: number) => pops(w)[i]!.find('[data-slot="waterfall-chart-head"]')
    expect(head(1).element.tagName.toLowerCase()).toBe('circle')
    expect(head(1).classes()).toContain('fill-success')
    expect(head(2).element.tagName.toLowerCase()).toBe('circle')
    expect(head(2).classes()).toContain('fill-background')
    expect(head(2).classes()).toContain('stroke-destructive')
    expect(head(2).attributes('stroke-width')).toBe('2.5')
    expect(head(0).element.tagName.toLowerCase()).toBe('rect')
    expect(head(5).element.tagName.toLowerCase()).toBe('rect')
    expect(head(0).classes()).toContain('fill-primary')
    expect(pops(w)[1]!.find('[data-slot="waterfall-chart-stem"]').classes()).toContain('stroke-success')
  })
  it('lollipop heads sit at the new level, stems start at the old one', () => {
    const w = m({ ...base, variant: 'lollipop' })
    const stem = pops(w)[1]!.find('[data-slot="waterfall-chart-stem"]').attributes('d')!
    const [, y0, y1] = [...stem.matchAll(/([\d.]+),([\d.]+)/g)].flatMap((x) => [Number(x[1]), Number(x[2])]).filter((_, i) => i !== 2)
    expect(num(pops(w)[1]!.find('[data-slot="waterfall-chart-head"]'), 'cy')).toBeCloseTo(y1!, 1)
    expect(y0!).toBeGreaterThan(y1!)
  })
  it('every variant has a tooltip per item and the same table', () => {
    const all = ['bars', 'steps', 'lollipop'].map((variant) => m({ ...base, variant }))
    for (const w of all) expect(w.findAll('title').length).toBeGreaterThanOrEqual(6)
    expect(new Set(all.map((w) => w.find('table').html())).size).toBe(1)
    expect(new Set(all.map((w) => w.find('[data-slot="waterfall-chart-summary"]').text())).size).toBe(1)
    expect(new Set(all.map((w) => w.html())).size).toBe(3)
  })
  it('the legend repeats the marking of each variant', () => {
    const swatches = (variant: string) => m({ ...base, variant }).findAll('[data-slot="waterfall-chart-legend-item"] svg')
    const bar = swatches('bars')
    expect(bar[1]!.find('path').exists()).toBe(true)
    expect(bar[0]!.find('path').exists()).toBe(false)
    const step = swatches('steps')
    expect(step[1]!.find('line').attributes('stroke-dasharray')).toBe('4 2')
    expect(step[0]!.find('line').attributes('stroke-dasharray')).toBeUndefined()
    const pop = swatches('lollipop')
    expect(pop[0]!.find('circle').attributes('r')).toBe('4.5')
    expect(pop[1]!.find('circle').attributes('stroke-width')).toBe('2.5')
    expect(pop[2]!.find('rect').exists()).toBe(true)
  })
  it('an unknown variant falls back to bars', () => {
    expect(m({ ...base, variant: 'candles' }).html()).toBe(m(base).html())
  })
})

describe('WaterfallChart variants: orientation', () => {
  it('horizontal lays the bars out as rows, first item on top, values growing to the right', () => {
    const w = m({ ...base, orientation: 'horizontal' })
    expect(w.attributes('data-orientation')).toBe('horizontal')
    const y = bars(w).map((b) => num(b, 'y'))
    expect(y).toEqual([...y].sort((a, b) => a - b))
    expect(num(bars(w)[1]!, 'x')).toBeCloseTo(num(bars(w)[0]!, 'x') + num(bars(w)[0]!, 'width'), 1)
    expect(num(bars(w)[1]!, 'width')).toBeGreaterThan(0)
  })
  it('horizontal totals start at the baseline on the left', () => {
    const w = m({ ...base, orientation: 'horizontal' })
    const base0 = Number(w.find('[data-slot="waterfall-chart-baseline"]').attributes('x1'))
    expect(num(bars(w)[0]!, 'x')).toBeCloseTo(base0, 1)
    expect(num(bars(w)[5]!, 'x')).toBeCloseTo(base0, 1)
  })
  it('horizontal labels sit at the start and ticks underneath', () => {
    const w = m({ ...base, orientation: 'horizontal' })
    expect(w.find('[data-slot="waterfall-chart-category"]').attributes('text-anchor')).toBe('end')
    expect(w.find('[data-slot="waterfall-chart-tick"]').attributes('text-anchor')).toBe('middle')
  })
  it('horizontal height grows with the number of items and follows size', () => {
    const h = (opts: Record<string, unknown>) => Number(m({ ...base, orientation: 'horizontal', ...opts }).find('svg').attributes('viewBox')!.split(' ')[3])
    expect(h({})).toBe(28 + 6 * WATERFALL_ROW_HEIGHT.md)
    expect(h({ size: 'sm' })).toBe(28 + 6 * 24)
    expect(h({ size: 'lg' })).toBe(28 + 6 * 40)
    expect(h({ height: 400 })).toBe(400)
  })
  it('steps and lollipop work horizontally too', () => {
    const s = m({ ...base, orientation: 'horizontal', variant: 'steps' })
    expect(steps(s)).toHaveLength(6)
    const tread = s.find('[data-slot="waterfall-chart-tread"]').attributes('d')!
    expect(tread).toMatch(/^M([\d.]+),[\d.]+ L\1,[\d.]+$/)
    const l = m({ ...base, orientation: 'horizontal', variant: 'lollipop' })
    expect(pops(l)).toHaveLength(6)
  })
  it('an unknown orientation falls back to vertical', () => {
    expect(m({ ...base, orientation: 'diagonal' }).html()).toBe(m(base).html())
  })
  it('both orientations list the same data', () => {
    expect(m({ ...base, orientation: 'horizontal' }).find('table').html()).toBe(m(base).find('table').html())
  })
})

describe('WaterfallChart variants: connectors', () => {
  it('on draws one dotted line between each pair of neighbours', () => {
    const w = m({ ...base, connectors: true })
    expect(connectors(w)).toHaveLength(5)
    expect(w.find('[data-slot="waterfall-chart-connectors"]').attributes('stroke-dasharray')).toBe('2 2')
    for (const c of connectors(w)) {
      const [a, b] = [...c.attributes('d')!.matchAll(/([\d.]+),([\d.]+)/g)]
      expect(a![2]).toBe(b![2])
      expect(Number(b![1])).toBeGreaterThan(Number(a![1]))
    }
  })
  it('off draws none, for every variant', () => {
    for (const variant of ['bars', 'steps', 'lollipop']) {
      expect(m({ ...base, variant, connectors: false }).find('[data-slot="waterfall-chart-connectors"]').exists()).toBe(false)
    }
  })
  it('lollipop connectors run from head to head and bars connectors from edge to edge', () => {
    const l = m({ ...base, variant: 'lollipop' })
    const head = (i: number) => {
      const el = pops(l)[i]!.find('[data-slot="waterfall-chart-head"]')
      return el.attributes('cx') !== undefined ? num(el, 'cx') : num(el, 'x') + num(el, 'width') / 2
    }
    const c0 = connectors(l)[0]!.attributes('d')!.match(/([\d.]+),/g)!.map((x) => Number(x.replace(',', '')))
    expect(c0[0]!).toBeGreaterThan(head(0))
    expect(c0[1]!).toBeLessThan(head(1))
    const b = m(base)
    const e = connectors(b)[0]!.attributes('d')!.match(/([\d.]+),/g)!.map((x) => Number(x.replace(',', '')))
    expect(e[0]!).toBeCloseTo(num(bars(b)[0]!, 'x') + num(bars(b)[0]!, 'width'), 1)
    expect(e[1]!).toBeCloseTo(num(bars(b)[1]!, 'x'), 1)
  })
  it('connectors are skipped where there is no room between two marks', () => {
    const w = m({ label: 'S', gap: 'sm', width: 120, items: Array.from({ length: 60 }, (_, i) => ({ label: `i${i}`, value: i % 2 ? -1 : 1 })) })
    expect(connectors(w).length).toBeLessThanOrEqual(59)
    expect(w.html()).not.toMatch(/NaN|Infinity/)
  })
})

describe('WaterfallChart variants: size and gap', () => {
  it.each([
    ['sm', 160],
    ['md', 240],
    ['lg', 320],
  ] as const)('%s sets the height and the figure gap', (size, h) => {
    const w = m({ ...base, size })
    expect(w.find('svg').attributes('viewBox')).toBe(`0 0 480 ${h}`)
    expect(w.classes().find((c) => c.startsWith('gap-'))).toBe({ sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' }[size])
  })
  it.each([
    ['sm', 0.85],
    ['md', 0.7],
    ['lg', 0.5],
  ] as const)('gap %s makes bars %s of their band wide', (gap, fill) => {
    const w = m({ ...base, gap })
    const band = (num(bars(w)[1]!, 'x') - num(bars(w)[0]!, 'x'))
    expect(num(bars(w)[0]!, 'width') / band).toBeCloseTo(fill, 1)
  })
  it('gap changes the lollipop and steps marks too', () => {
    const wide = m({ ...base, variant: 'steps', gap: 'sm' })
    const narrow = m({ ...base, variant: 'steps', gap: 'lg' })
    const len = (w: ReturnType<typeof m>) => {
      const [a, b] = [...w.find('[data-slot="waterfall-chart-tread"]').attributes('d')!.matchAll(/([\d.]+),/g)]
      return Number(b![1]) - Number(a![1])
    }
    expect(len(wide)).toBeGreaterThan(len(narrow))
  })
  it('an explicit height wins and unknown sizes and gaps fall back to md', () => {
    expect(m({ ...base, size: 'sm', height: 222 }).find('svg').attributes('viewBox')).toBe('0 0 480 222')
    expect(m({ ...base, size: 'huge', gap: 'wide' }).html()).toBe(m(base).html())
  })
})

describe('WaterfallChart variants: combinations', () => {
  it.each(['bars', 'steps', 'lollipop'])('%s in both orientations, sizes, gaps and connector states renders without bad numbers', (variant) => {
    for (const orientation of ['vertical', 'horizontal']) {
      for (const size of ['sm', 'md', 'lg']) {
        for (const gap of ['sm', 'md', 'lg']) {
          for (const connectorsOn of [true, false]) {
            const w = m({ ...base, variant, orientation, size, gap, connectors: connectorsOn, showValues: true })
            expect(w.html()).not.toMatch(/NaN|Infinity|undefined/)
            expect(w.findAll('title').length).toBeGreaterThanOrEqual(6)
          }
        }
      }
    }
  })
  it('a lollipop, horizontal, with values, narrow bars and custom tones', () => {
    const w = m({ ...base, variant: 'lollipop', orientation: 'horizontal', showValues: true, gap: 'lg', positiveTone: 'info', negativeTone: 'warning', totalTone: 'chart-4' })
    expect(w.findAll('[data-slot="waterfall-chart-value"]')).toHaveLength(6)
    expect(pops(w)[1]!.find('[data-slot="waterfall-chart-head"]').classes()).toContain('fill-info')
    expect(pops(w)[2]!.find('[data-slot="waterfall-chart-head"]').classes()).toContain('stroke-warning')
    expect(pops(w)[0]!.find('[data-slot="waterfall-chart-head"]').classes()).toContain('fill-chart-4')
  })
  it('steps with a negative running total keeps the treads below the baseline', () => {
    const w = m({ label: 'S', variant: 'steps', items: [{ label: 'A', value: 20 }, { label: 'B', value: -50 }, { label: 'C', type: 'total' }] })
    const base0 = Number(w.find('[data-slot="waterfall-chart-baseline"]').attributes('y1'))
    const yOf = (i: number) => Number(steps(w)[i]!.find('[data-slot="waterfall-chart-tread"]').attributes('d')!.match(/M[\d.]+,([\d.]+)/)![1])
    expect(yOf(1)).toBeGreaterThan(base0)
    expect(yOf(2)).toBeGreaterThan(base0)
    expect(w.html()).not.toMatch(/NaN/)
  })
  it('the class prop is merged last and variants never change the name', () => {
    const w = m({ ...base, variant: 'steps', class: 'max-w-sm gap-6' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).not.toContain('gap-2')
    expect(m({ ...base, variant: 'lollipop', orientation: 'horizontal' }).find('svg').attributes('aria-label')).toBe('Sample')
  })
  it('every variant keeps the empty state', () => {
    for (const variant of ['bars', 'steps', 'lollipop']) {
      expect(m({ label: 'S', items: [], variant, orientation: 'horizontal', connectors: false, size: 'lg' }).find('[data-slot="waterfall-chart-empty"]').exists()).toBe(true)
    }
  })
})
