import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatGrid from './StatGrid.vue'
import {
  STAT_GRID_TONES,
  STAT_GRID_VARIANTS,
  resolveStatGridGap,
  resolveStatGridShape,
  resolveStatGridSize,
  resolveStatGridTone,
  statGridItemVariants,
  statGridValueVariants,
  statGridVariants,
} from './variants'

const items = [
  { value: '99.9%', label: 'Sample A' },
  { value: 12, label: 'Sample B', description: 'Sample note' },
]
const m = (props: Record<string, unknown> = {}) => mount(StatGrid, { props: { items, ...props } })
const value = (w: ReturnType<typeof m>) => w.find('[data-slot="stat-grid-value"]')
const item = (w: ReturnType<typeof m>) => w.find('[data-slot="stat-grid-item"]')

describe('StatGrid size, tone, gap and shape', () => {
  it('defaults keep the original class strings and report md settings', () => {
    const w = m()
    expect(w.classes().join(' ')).toBe('grid grid-cols-1 gap-8 text-center sm:grid-cols-2 lg:grid-cols-4')
    expect(item(w).attributes('class')).toBe('flex flex-col-reverse gap-1')
    expect(value(w).attributes('class')).toBe('m-0 font-semibold tracking-tight tabular-nums text-4xl')
    expect([w.attributes('data-size'), w.attributes('data-tone'), w.attributes('data-gap'), w.attributes('data-shape')]).toEqual(['md', 'default', 'md', 'rounded'])
  })
  it.each(STAT_GRID_VARIANTS)('%s: exported cva without the new props equals the md output', (variant) => {
    expect(statGridVariants({ variant })).toBe(statGridVariants({ variant, gap: 'md', shape: 'rounded' }))
    expect(statGridItemVariants({ variant })).toBe(statGridItemVariants({ variant, size: 'md', shape: 'rounded' }))
    expect(statGridValueVariants({ variant })).toBe(statGridValueVariants({ variant, size: 'md', tone: 'default' }))
  })

  describe('size', () => {
    it.each([
      ['plain', 'sm', 'text-2xl'],
      ['plain', 'lg', 'text-5xl'],
      ['cards', 'sm', 'text-2xl'],
      ['divided', 'lg', 'text-5xl'],
      ['with-icons', 'sm', 'text-2xl'],
      ['inline', 'sm', 'text-xl'],
      ['inline', 'lg', 'text-3xl'],
    ] as const)('%s size %s sets the figure to %s', (variant, size, cls) => {
      const w = m({ variant, size })
      expect(w.attributes('data-size')).toBe(size)
      expect(value(w).classes()).toContain(cls)
      expect(value(w).classes().filter((c) => /^text-(xl|2xl|3xl|4xl|5xl)$/.test(c))).toEqual([cls])
      expect(value(w).classes()).toContain('tabular-nums')
    })
    it('boxed variants scale their padding', () => {
      expect(item(m({ variant: 'cards', size: 'sm' })).classes()).toContain('p-4')
      expect(item(m({ variant: 'cards', size: 'lg' })).classes()).toContain('p-8')
      expect(item(m({ variant: 'divided', size: 'sm' })).classes()).toContain('p-4')
      expect(item(m({ variant: 'cards' })).classes()).toContain('p-6')
      expect(item(m({ variant: 'plain', size: 'lg' })).classes().join(' ')).not.toMatch(/\bp-\d/)
    })
    it('unknown size falls back to md', () => {
      expect(value(m({ size: 'x' })).classes()).toContain('text-4xl')
      expect(resolveStatGridSize(null)).toBe('md')
    })
  })

  describe('tone', () => {
    it.each(STAT_GRID_TONES)('%s sets the figure colour', (tone) => {
      const w = m({ tone })
      expect(w.attributes('data-tone')).toBe(tone)
      expect(value(w).classes().includes('text-primary')).toBe(tone === 'primary')
    })
    it('primary keeps the label and description on the muted token', () => {
      const w = m({ tone: 'primary', variant: 'cards' })
      expect(w.find('dt').classes()).toContain('text-muted-foreground')
      expect(w.find('[data-slot="stat-grid-description"]').classes()).toContain('text-muted-foreground')
    })
    it('unknown tone falls back to default', () => {
      expect(value(m({ tone: 'neon' })).classes()).not.toContain('text-primary')
      expect(resolveStatGridTone('x')).toBe('default')
    })
  })

  describe('gap', () => {
    it.each([
      ['plain', 'sm', 'gap-4', 'gap-8'],
      ['plain', 'lg', 'gap-12', 'gap-8'],
      ['with-icons', 'sm', 'gap-4', 'gap-8'],
      ['cards', 'sm', 'gap-2', 'gap-4'],
      ['cards', 'lg', 'gap-6', 'gap-4'],
      ['inline', 'sm', 'gap-x-6', 'gap-x-10'],
      ['inline', 'lg', 'gap-x-16', 'gap-x-10'],
    ] as const)('%s gap %s uses %s instead of %s', (variant, gap, wanted, replaced) => {
      const w = m({ variant, gap })
      expect(w.attributes('data-gap')).toBe(gap)
      expect(w.classes()).toContain(wanted)
      expect(w.classes()).not.toContain(replaced)
    })
    it('divided keeps its 1px cell borders whatever the gap', () => {
      expect(m({ variant: 'divided', gap: 'lg' }).classes()).toEqual(expect.arrayContaining(['gap-px', 'bg-border']))
      expect(m({ variant: 'divided', gap: 'lg' }).classes()).not.toContain('gap-8')
    })
    it('unknown gap falls back, class wins, columns still apply', () => {
      expect(m({ gap: 'x' }).classes()).toContain('gap-8')
      expect(resolveStatGridGap(undefined)).toBe('md')
      expect(m({ gap: 'lg', class: 'gap-1' }).classes()).toContain('gap-1')
      expect(m({ gap: 'lg', class: 'gap-1' }).classes()).not.toContain('gap-12')
      expect(m({ gap: 'sm', columns: 2 }).classes()).toEqual(expect.arrayContaining(['gap-4', 'sm:grid-cols-2']))
    })
  })

  describe('shape', () => {
    it('square removes the radius of cards and of the divided frame', () => {
      const cards = m({ variant: 'cards', shape: 'square' })
      expect(item(cards).classes()).toContain('rounded-none')
      expect(item(cards).classes()).not.toContain('rounded-lg')
      const divided = m({ variant: 'divided', shape: 'square' })
      expect(divided.classes()).toContain('rounded-none')
      expect(divided.classes()).not.toContain('rounded-lg')
      expect(divided.attributes('data-shape')).toBe('square')
    })
    it('rounded keeps rounded-lg; plain has no radius either way; unknown falls back', () => {
      expect(item(m({ variant: 'cards' })).classes()).toContain('rounded-lg')
      expect(m({ variant: 'plain', shape: 'square' }).classes().join(' ')).not.toMatch(/rounded/)
      expect(m({ shape: 'blob' }).attributes('data-shape')).toBe('rounded')
      expect(resolveStatGridShape('x')).toBe('rounded')
    })
  })

  describe('combinations and accessibility', () => {
    it('size, tone, gap and shape together keep one class per property', () => {
      const w = m({ variant: 'cards', size: 'lg', tone: 'primary', gap: 'lg', shape: 'square' })
      expect(w.classes().filter((c) => /^gap-/.test(c))).toEqual(['gap-6'])
      expect(item(w).classes().filter((c) => /^(p-|rounded)/.test(c))).toEqual(['p-8', 'rounded-none'])
      expect(value(w).classes()).toEqual(expect.arrayContaining(['text-5xl', 'text-primary']))
    })
    it.each(STAT_GRID_VARIANTS)('%s keeps the dl, dt and dd structure and reading order with every new prop', (variant) => {
      const w = m({ variant, size: 'sm', tone: 'primary', gap: 'sm', shape: 'square' })
      expect(w.element.tagName).toBe('DL')
      expect(w.findAll('dt').map((d) => d.text())).toEqual(['Sample A', 'Sample B'])
      expect(w.findAll('dd')).toHaveLength(2)
    })
    it('trend text stays available at every size and tone (not colour alone)', () => {
      const w = m({ items: [{ value: 5, label: 'Sample', trend: 'up', change: '+2' }], size: 'lg', tone: 'primary' })
      expect(w.find('[data-slot="stat-grid-trend"] .sr-only').text()).toBe('Up')
      expect(w.find('[data-slot="stat-grid-trend"]').text()).toContain('+2')
    })
    it('empty items still render an empty list for every size', () => {
      expect(m({ items: [], size: 'lg' }).element.children).toHaveLength(0)
    })
  })
})
