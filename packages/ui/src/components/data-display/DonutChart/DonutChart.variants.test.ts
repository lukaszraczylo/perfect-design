import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DonutChart from './DonutChart.vue'
import { donutChartVariants, donutFigureVariants, donutLegendVariants } from './variants'

const data = [{ label: 'One', value: 60 }, { label: 'Two', value: 30 }, { label: 'Three', value: 10 }]
const m = (props: Record<string, unknown> = {}, slots?: Record<string, unknown>) => mount(DonutChart, { props: { data, label: 'Sample', ...props } as never, slots: slots as never })
const fig = (w: ReturnType<typeof m>) => w.find('[data-slot="donut-chart-figure"]')
const segs = (w: ReturnType<typeof m>) => w.findAll('[data-slot="donut-chart-segment"]')

describe('DonutChart variants: defaults are unchanged', () => {
  it('keeps today\'s classes and markup', () => {
    const w = m()
    expect(w.classes()).toEqual(['flex', 'flex-wrap', 'items-center', 'gap-4'])
    expect(fig(w).classes()).toEqual(['relative', 'shrink-0', 'size-40'])
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 100 100')
    expect(segs(w).every((s) => s.element.tagName.toLowerCase() === 'circle')).toBe(true)
    expect(w.find('[data-slot="donut-chart-track"]').element.tagName.toLowerCase()).toBe('circle')
    expect(w.find('[data-slot="donut-chart-center"]').classes()).toEqual(['pointer-events-none', 'absolute', 'inset-0', 'flex', 'flex-col', 'items-center', 'justify-center', 'text-center'])
    expect(w.find('[data-slot="donut-chart-legend"]').classes()).toEqual(['grid', 'gap-1.5', 'text-sm'])
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ variant: 'full', layout: 'auto', size: 'md' }).html()).toBe(m().html())
  })
  it('the cva helpers keep the same default strings for plain elements', () => {
    expect(donutChartVariants()).toBe('flex flex-wrap items-center gap-4')
    expect(donutFigureVariants()).toBe('relative shrink-0 size-40')
    expect(donutLegendVariants()).toBe('grid gap-1.5 text-sm')
  })
})

describe('DonutChart variants: variant', () => {
  it.each([
    ['sm', 'h-14', 'w-28'],
    ['md', 'h-20', 'w-40'],
    ['lg', 'h-28', 'w-56'],
  ])('half at size %s is %s by %s and half as high as it is wide', (size, h, wd) => {
    const w = m({ variant: 'half', size })
    expect(fig(w).classes()).toEqual(expect.arrayContaining(['relative', 'shrink-0', h, wd]))
    expect(fig(w).classes().some((c) => c.startsWith('size-'))).toBe(false)
  })
  it('half draws a semicircle track and one dashed path per segment with a 100x50 viewBox', () => {
    const w = m({ variant: 'half' })
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 100 50')
    const track = w.find('[data-slot="donut-chart-track"]')
    expect(track.element.tagName.toLowerCase()).toBe('path')
    expect(track.attributes('d')).toBe('M 7 50 A 43 43 0 0 1 93 50')
    expect(track.attributes('pathLength')).toBe('100')
    expect(segs(w)).toHaveLength(3)
    expect(segs(w).map((s) => s.attributes('stroke-dasharray'))).toEqual(['60 40', '30 70', '10 90'])
    expect(segs(w).map((s) => s.attributes('stroke-dashoffset'))).toEqual(['0', '-60', '-90'])
    expect(segs(w).map((s) => s.classes()[0])).toEqual(['stroke-chart-1', 'stroke-chart-2', 'stroke-chart-3'])
  })
  it('half follows the thickness', () => {
    const w = m({ variant: 'half', thickness: 30 })
    expect(w.find('[data-slot="donut-chart-track"]').attributes('d')).toBe('M 15 50 A 35 35 0 0 1 85 50')
    expect(w.find('[data-slot="donut-chart-track"]').attributes('stroke-width')).toBe('30')
  })
  it('half puts the centre text at the foot of the hollow', () => {
    const c = m({ variant: 'half', centerText: 'items' }).find('[data-slot="donut-chart-center"]')
    expect(c.classes()).toEqual(expect.arrayContaining(['inset-x-0', 'bottom-0', 'justify-end']))
    expect(c.classes()).not.toContain('inset-0')
    expect(c.find('[data-slot="donut-chart-total"]').text()).toBe('100')
    expect(c.find('[data-slot="donut-chart-caption"]').text()).toBe('items')
  })
  it('half keeps the segment tooltips, the name and the legend text', () => {
    const full = m()
    const half = m({ variant: 'half' })
    expect(segs(half).map((s) => s.find('title').text())).toEqual(segs(full).map((s) => s.find('title').text()))
    expect(half.find('svg').attributes('role')).toBe('img')
    expect(half.find('svg').attributes('aria-label')).toBe(full.find('svg').attributes('aria-label'))
    expect(half.find('[data-slot="donut-chart-legend"]').text()).toBe(full.find('[data-slot="donut-chart-legend"]').text())
  })
  it('half with one segment is a full semicircle and zero-share segments are not drawn', () => {
    const one = m({ variant: 'half', data: [{ label: 'Only', value: 5 }] })
    expect(segs(one).map((s) => s.attributes('stroke-dasharray'))).toEqual(['100 0'])
    const zero = m({ variant: 'half', data: [{ label: 'A', value: 0 }, { label: 'B', value: 3 }] })
    expect(segs(zero)).toHaveLength(1)
  })
  it('half with a zero total shows the track and the empty caption', () => {
    const w = m({ variant: 'half', data: [{ label: 'A', value: 0 }] })
    expect(segs(w)).toHaveLength(0)
    expect(w.find('[data-slot="donut-chart-track"]').exists()).toBe(true)
    expect(w.find('[data-slot="donut-chart-caption"]').text()).toBe('No data')
  })
  it('an unknown variant is a full ring', () => {
    expect(m({ variant: 'third' }).html()).toBe(m().html())
  })
  it('the center slot still replaces the text in the half variant', () => {
    const w = m({ variant: 'half' }, { center: '<b data-test="c">custom</b>' })
    expect(w.find('[data-test="c"]').exists()).toBe(true)
    expect(w.find('[data-slot="donut-chart-total"]').exists()).toBe(false)
  })
})

describe('DonutChart variants: layout', () => {
  it('inline never wraps the legend and lets it shrink', () => {
    const w = m({ layout: 'inline' })
    expect(w.classes()).toEqual(['flex', 'min-w-0', 'flex-nowrap', 'items-center', 'gap-4'])
    expect(w.find('[data-slot="donut-chart-legend"]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'flex-1', 'grid-cols-1']))
  })
  it('stacked puts the legend under the ring at full width', () => {
    const w = m({ layout: 'stacked' })
    expect(w.classes()).toEqual(expect.arrayContaining(['min-w-0', 'flex-col', 'items-start']))
    expect(w.classes()).not.toContain('flex-wrap')
    expect(w.find('[data-slot="donut-chart-legend"]').classes()).toEqual(expect.arrayContaining(['w-full', 'grid-cols-1']))
  })
  it('an unknown layout falls back to auto', () => {
    expect(m({ layout: 'sideways' }).html()).toBe(m().html())
  })
  it('showLegend false removes the legend in every layout', () => {
    for (const layout of ['auto', 'inline', 'stacked']) expect(m({ layout, showLegend: false }).find('[data-slot="donut-chart-legend"]').exists()).toBe(false)
  })
  it('the legend lists every value and percentage in every layout', () => {
    for (const layout of ['auto', 'inline', 'stacked']) {
      const items = m({ layout }).findAll('[data-slot="donut-chart-legend-item"]')
      expect(items.map((i) => i.find('[data-slot="donut-chart-legend-percent"]').text())).toEqual(['60%', '30%', '10%'])
    }
  })
  it('long labels truncate inside the legend', () => {
    const w = m({ layout: 'inline', data: [{ label: 'A very long legend label that would not fit beside a small ring', value: 3 }] })
    expect(w.find('[data-slot="donut-chart-legend-label"]').classes()).toContain('truncate')
  })
})

describe('DonutChart variants: size and combinations', () => {
  it.each([
    ['sm', 'size-28'],
    ['md', 'size-40'],
    ['lg', 'size-56'],
  ])('full %s is %s', (size, cls) => {
    expect(fig(m({ size })).classes()).toContain(cls)
  })
  it('an unknown size falls back to md', () => {
    expect(fig(m({ size: 'xl' })).classes()).toContain('size-40')
    expect(fig(m({ size: 'xl', variant: 'half' })).classes()).toEqual(expect.arrayContaining(['h-20', 'w-40']))
  })
  it('half, stacked, large and thick together', () => {
    const w = m({ variant: 'half', layout: 'stacked', size: 'lg', thickness: 24 })
    expect(fig(w).classes()).toEqual(expect.arrayContaining(['h-28', 'w-56']))
    expect(w.classes()).toContain('flex-col')
    expect(w.find('[data-slot="donut-chart-track"]').attributes('stroke-width')).toBe('24')
  })
  it('the class prop is merged last', () => {
    const w = m({ layout: 'stacked', class: 'gap-8 items-center' })
    expect(w.classes()).toContain('gap-8')
    expect(w.classes()).not.toContain('gap-4')
    expect(w.classes()).toContain('items-center')
    expect(w.classes()).not.toContain('items-start')
  })
  it('empty data shows the empty state in every variant', () => {
    const w = m({ data: [], variant: 'half', layout: 'stacked' })
    expect(w.find('[data-slot="donut-chart-empty"]').exists()).toBe(true)
    expect(w.find('svg').exists()).toBe(false)
  })
})
