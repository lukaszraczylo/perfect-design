import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FeatureGrid from './FeatureGrid.vue'
import { FEATURE_GRID_LAYOUTS, featureGridVariants, resolveFeatureGridGap } from './variants'

const items = [
  { title: 'One', description: 'a' },
  { title: 'Two', description: 'b', image: 'data:,', imageAlt: 'Sample' },
]
const cards = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="feature-card"]')

describe('FeatureGrid gap, size, tone, shape and data hooks', () => {
  describe('defaults keep the original output', () => {
    it('grid default is `grid gap-6` plus 3 columns and md card props', () => {
      const w = mount(FeatureGrid, { props: { items } })
      expect(w.classes().join(' ')).toBe('grid gap-6 sm:grid-cols-2 lg:grid-cols-3')
      expect(w.attributes('data-gap')).toBe('md')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-tone')).toBe('default')
      expect(w.attributes('data-shape')).toBe('rounded')
      expect(cards(w).map((c) => c.attributes('data-size'))).toEqual(['md', 'md'])
    })
    it.each(FEATURE_GRID_LAYOUTS)('layout %s: the exported cva default has no size or gap override', (layout) => {
      expect(featureGridVariants({ layout })).toBe(featureGridVariants({ layout, gap: 'md' }))
    })
  })

  describe('gap', () => {
    it.each([
      ['grid', 'sm', 'gap-4', 'gap-6'],
      ['grid', 'lg', 'gap-8', 'gap-6'],
      ['with-heading', 'sm', 'gap-4', 'gap-6'],
      ['list', 'sm', 'gap-2', 'gap-4'],
      ['list', 'lg', 'gap-6', 'gap-4'],
      ['bento', 'sm', 'gap-3', 'gap-4'],
      ['bento', 'lg', 'gap-6', 'gap-4'],
      ['centered', 'sm', 'gap-6', 'gap-8'],
      ['centered', 'lg', 'gap-12', 'gap-8'],
      ['alternating', 'sm', 'gap-10', 'gap-16'],
      ['alternating', 'lg', 'gap-20', 'gap-16'],
    ] as const)('layout %s gap %s uses %s instead of %s', (layout, gap, wanted, replaced) => {
      const w = mount(FeatureGrid, { props: { items, layout, gap } })
      const target = layout === 'with-heading' ? w.find('[data-slot="feature-grid-items"]') : w
      expect(w.attributes('data-gap')).toBe(gap)
      expect(target.classes()).toContain(wanted)
      expect(target.classes()).not.toContain(replaced)
    })
    it('responsive gap of alternating and bento scales together', () => {
      expect(mount(FeatureGrid, { props: { items, layout: 'alternating', gap: 'lg' } }).classes()).toEqual(expect.arrayContaining(['gap-20', 'md:gap-32']))
      expect(mount(FeatureGrid, { props: { items, layout: 'bento', gap: 'sm' } }).classes()).toEqual(expect.arrayContaining(['gap-3', 'md:gap-4']))
    })
    it('unknown gap falls back to md', () => {
      const w = mount(FeatureGrid, { props: { items, gap: 'huge' as 'md' } })
      expect(w.attributes('data-gap')).toBe('md')
      expect(w.classes()).toContain('gap-6')
      expect(resolveFeatureGridGap(undefined)).toBe('md')
    })
    it('class wins over gap', () => {
      const w = mount(FeatureGrid, { props: { items, gap: 'lg', class: 'gap-1' } })
      expect(w.classes()).toContain('gap-1')
      expect(w.classes()).not.toContain('gap-8')
    })
  })

  describe('size, tone and shape reach the generated cards', () => {
    it('are passed to every card and exposed on the root', () => {
      const w = mount(FeatureGrid, { props: { items, size: 'lg', tone: 'muted', shape: 'square' } })
      expect(w.attributes('data-size')).toBe('lg')
      expect(w.attributes('data-tone')).toBe('muted')
      expect(w.attributes('data-shape')).toBe('square')
      for (const card of cards(w)) {
        expect(card.attributes('data-size')).toBe('lg')
        expect(card.attributes('data-tone')).toBe('muted')
        expect(card.attributes('data-shape')).toBe('square')
        expect(card.classes()).toEqual(expect.arrayContaining(['p-8', 'bg-muted', 'rounded-none']))
      }
    })
    it('work in the alternating layout (cards sit beside the media)', () => {
      const w = mount(FeatureGrid, { props: { items, layout: 'alternating', size: 'sm', tone: 'primary' } })
      expect(cards(w).map((c) => c.attributes('data-tone'))).toEqual(['primary', 'primary'])
      expect(w.findAll('img')).toHaveLength(1)
      expect(w.find('img').attributes('alt')).toBe('Sample')
    })
    it('are exposed on the wrapper when a heading is shown', () => {
      const w = mount(FeatureGrid, { props: { items, title: 'Heading', tone: 'inverted', size: 'sm' } })
      expect(w.attributes('data-tone')).toBe('inverted')
      expect(w.attributes('data-size')).toBe('sm')
      expect(w.attributes('data-variant')).toBe('card')
    })
    it('unknown values fall back on the cards', () => {
      const w = mount(FeatureGrid, { props: { items, size: 'x' as 'sm', tone: 'x' as 'muted', shape: 'x' as 'square' } })
      expect(cards(w).map((c) => [c.attributes('data-size'), c.attributes('data-tone'), c.attributes('data-shape')])).toEqual([
        ['md', 'default', 'rounded'],
        ['md', 'default', 'rounded'],
      ])
    })
    it('a card slotted in by hand keeps its own props, the root still reports the grid settings', () => {
      const w = mount(FeatureGrid, { props: { size: 'lg' }, slots: { default: '<div data-slot="feature-card" data-size="sm">own</div>' } })
      expect(w.attributes('data-size')).toBe('lg')
      expect(w.find('[data-slot="feature-card"]').attributes('data-size')).toBe('sm')
    })
  })

  describe('variant is exposed as data-variant on the root', () => {
    it('reports the resolved card variant (layout default when omitted), also for slot content', () => {
      expect(mount(FeatureGrid, { props: { items } }).attributes('data-variant')).toBe('card')
      expect(mount(FeatureGrid, { props: { items, layout: 'list' } }).attributes('data-variant')).toBe('icon-left')
      expect(mount(FeatureGrid, { props: { items, variant: 'flat' } }).attributes('data-variant')).toBe('flat')
      expect(mount(FeatureGrid, { props: { variant: 'highlight' }, slots: { default: '<div>x</div>' } }).attributes('data-variant')).toBe('highlight')
      expect(mount(FeatureGrid, { props: { items, variant: 'nope' as 'flat' } }).attributes('data-variant')).toBe('card')
    })
  })

  describe('combinations', () => {
    it('gap with columns and layout do not conflict', () => {
      const w = mount(FeatureGrid, { props: { items, layout: 'bento', columns: 4, gap: 'lg' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'auto-rows-fr', 'gap-6', 'md:gap-8', 'sm:grid-cols-2', 'lg:grid-cols-4']))
      expect(w.classes().filter((c) => /^gap-/.test(c))).toEqual(['gap-6'])
    })
    it('keeps the list semantics and the card heading in every combination', () => {
      const w = mount(FeatureGrid, { props: { items, size: 'sm', tone: 'primary', shape: 'square', gap: 'sm' } })
      expect(w.element.tagName).toBe('UL')
      expect(w.findAll('li')).toHaveLength(2)
      expect(w.findAll('h3').map((h) => h.text())).toEqual(['One', 'Two'])
    })
  })
})
