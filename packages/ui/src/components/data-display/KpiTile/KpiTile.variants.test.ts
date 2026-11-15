import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiTile from './KpiTile.vue'
import { KPI_TILE_LAYOUTS, KPI_TILE_SIZES, kpiTileVariants } from './index'

const base = { label: 'Requests', value: 1284, delta: '+8%', trend: 'up', hint: 'vs last week', sparkline: [1, 3, 2, 4], progress: 40 }
const mk = (props: Record<string, unknown> = {}) => mount(KpiTile, { props: { ...base, ...props } as never })
const value = (w: ReturnType<typeof mk>) => w.find('[data-slot="kpi-tile-value"]')

describe('KpiTile size and layout dimensions', () => {
  it('lists the values', () => {
    expect([...KPI_TILE_SIZES]).toEqual(['default', 'compact', 'lg'])
    expect([...KPI_TILE_LAYOUTS]).toEqual(['stacked', 'split', 'centered'])
  })

  it('default stays stacked: no data-layout, no grid, 30px value', () => {
    const w = mk()
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(w.attributes('data-size')).toBeUndefined()
    expect(w.classes()).toEqual(expect.arrayContaining(['gap-2', 'p-4']))
    expect(w.classes()).not.toContain('grid')
    expect(value(w).classes()).toContain('text-3xl')
    expect(kpiTileVariants()).toBe('gap-2 p-4')
  })

  describe('size lg', () => {
    it('gives more padding and a larger value', () => {
      const w = mk({ size: 'lg' })
      expect(w.classes()).toEqual(expect.arrayContaining(['gap-3', 'p-6']))
      expect(w.classes()).not.toContain('p-4')
      expect(value(w).classes()).toContain('text-4xl')
      expect(w.attributes('data-size')).toBe('lg')
    })
    it('compact keeps data-size="compact"', () => {
      const w = mk({ size: 'compact' })
      expect(w.attributes('data-size')).toBe('compact')
      expect(value(w).classes()).toContain('text-xl')
    })
    it('unknown size behaves like default', () => expect(mk({ size: 'giant' }).html()).toBe(mk().html()))
  })

  describe('layout split', () => {
    const w = mk({ layout: 'split' })
    it('is a two-column grid with the label first and the value at the end', () => {
      expect(w.attributes('data-layout')).toBe('split')
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'items-baseline']))
      expect(value(w).classes()).toContain('text-end')
    })
    it('delta row, sparkline and progress span the full width', () => {
      expect(w.find('[data-slot="kpi-tile-delta"]').element.parentElement?.className).toContain('col-span-full')
      expect(w.find('[data-slot="kpi-tile-sparkline"]').classes()).toContain('col-span-full')
      expect(w.find('[data-slot="kpi-tile-progress"]').classes()).toContain('col-span-full')
    })
    it('keeps reading order label, value, delta, sparkline, progress', () => {
      const slots = Array.from((w.element as HTMLElement).querySelectorAll('[data-slot]')).map((e) => e.getAttribute('data-slot'))
      const order = ['kpi-tile-label', 'kpi-tile-value', 'kpi-tile-delta', 'kpi-tile-hint', 'kpi-tile-sparkline', 'kpi-tile-progress']
      const idx = order.map((o) => slots.indexOf(o))
      expect(idx).toEqual([...idx].sort((a, b) => a - b))
      expect(idx.every((i) => i >= 0)).toBe(true)
    })
    it('the loading skeleton spans the width too and aria-busy stays', () => {
      const l = mk({ layout: 'split', loading: true })
      expect(l.find('[data-slot="kpi-tile-skeleton"]').classes()).toContain('col-span-full')
      expect(l.attributes('aria-busy')).toBe('true')
      expect(l.find('[role="status"]').text()).toBe('Loading')
    })
  })

  describe('layout centered', () => {
    const w = mk({ layout: 'centered' })
    it('centres the card and its rows', () => {
      expect(w.attributes('data-layout')).toBe('centered')
      expect(w.classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
      expect(w.find('[data-slot="kpi-tile-label"]').element.parentElement?.className).toContain('justify-center')
      expect(w.find('[data-slot="kpi-tile-delta"]').element.parentElement?.className).toContain('justify-center')
    })
    it('the sparkline keeps the full width', () => expect(w.find('[data-slot="kpi-tile-sparkline"]').classes()).toContain('w-full'))
    it('the loading skeleton is centred', () => expect(mk({ layout: 'centered', loading: true }).find('[data-slot="kpi-tile-skeleton"]').classes()).toContain('items-center'))
  })

  it('unknown layout behaves like stacked', () => expect(mk({ layout: 'diagonal' }).html()).toBe(mk().html()))

  describe('combinations', () => {
    it('split + lg + inverted', () => {
      const w = mk({ layout: 'split', size: 'lg', variant: 'inverted' })
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'p-6', 'bg-foreground', 'text-background']))
      expect(w.attributes('data-tile-variant')).toBe('inverted')
      expect(value(w).classes()).toEqual(expect.arrayContaining(['text-4xl', 'text-end']))
    })
    it('centered + compact', () => {
      const w = mk({ layout: 'centered', size: 'compact' })
      expect(w.classes()).toEqual(expect.arrayContaining(['p-3', 'text-center']))
      expect(value(w).classes()).toContain('text-xl')
    })
    it('class wins', () => {
      const w = mk({ layout: 'centered', size: 'lg', class: 'p-2 text-left' })
      expect(w.classes()).toEqual(expect.arrayContaining(['p-2', 'text-left']))
      expect(w.classes()).not.toContain('p-6')
      expect(w.classes()).not.toContain('text-center')
    })
  })

  it('delta keeps its hidden direction text in every layout', () => {
    for (const layout of KPI_TILE_LAYOUTS) expect(mk({ layout }).find('[data-slot="kpi-tile-delta"] .sr-only').text()).toBe('Increase:')
  })
  it('long label and empty value in a split tile do not throw', () => {
    const w = mk({ layout: 'split', label: 'A very long metric name '.repeat(8), value: null })
    expect(value(w).text()).toBe('–')
  })
})
