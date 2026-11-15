import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TestimonialGrid from './TestimonialGrid.vue'
import { TESTIMONIAL_GRID_LAYOUTS, resolveTestimonialGridGap, testimonialGridVariants } from './variants'

const items = [
  { quote: 'Sample one.', author: 'Customer one' },
  { quote: 'Sample two.', author: 'Customer two' },
]
const m = (props: Record<string, unknown> = {}) => mount(TestimonialGrid, { props: { items, ...props } })
const cards = (w: ReturnType<typeof m>) => w.findAll('[data-slot="testimonial"]')

describe('TestimonialGrid gap, size, tone and shape', () => {
  it('defaults keep the original classes and report md settings', () => {
    const w = m()
    expect(w.classes().join(' ')).toBe('grid gap-6 [&>*]:h-full sm:grid-cols-2 lg:grid-cols-3')
    expect(m({ layout: 'masonry' }).classes().join(' ')).toBe('gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid columns-1 sm:columns-2 lg:columns-3')
    expect(m({ layout: 'columns' }).classes().join(' ')).toBe('flex flex-col gap-6 md:flex-row md:[&>*]:flex-1')
    expect([w.attributes('data-gap'), w.attributes('data-size'), w.attributes('data-tone'), w.attributes('data-shape')]).toEqual(['md', 'md', 'default', 'rounded'])
  })
  it.each(TESTIMONIAL_GRID_LAYOUTS)('layout %s: the cva default equals gap md', (layout) => {
    expect(testimonialGridVariants({ layout })).toBe(testimonialGridVariants({ layout, gap: 'md' }))
  })
  describe('gap', () => {
    it.each([
      ['grid', 'sm', 'gap-4'],
      ['grid', 'lg', 'gap-8'],
      ['columns', 'sm', 'gap-4'],
      ['columns', 'lg', 'gap-8'],
    ] as const)('layout %s gap %s uses %s and drops gap-6', (layout, gap, cls) => {
      const w = m({ layout, gap })
      expect(w.attributes('data-gap')).toBe(gap)
      expect(w.classes()).toContain(cls)
      expect(w.classes()).not.toContain('gap-6')
    })
    it('masonry scales the column gap and the row margin together', () => {
      expect(m({ layout: 'masonry', gap: 'sm' }).classes()).toEqual(expect.arrayContaining(['gap-4', '[&>*]:mb-4', '[&>*]:break-inside-avoid']))
      expect(m({ layout: 'masonry', gap: 'sm' }).classes()).not.toContain('[&>*]:mb-6')
      expect(m({ layout: 'masonry', gap: 'lg' }).classes()).toEqual(expect.arrayContaining(['gap-8', '[&>*]:mb-8']))
    })
    it('unknown gap falls back to md; class wins; columns still apply', () => {
      expect(m({ gap: 'huge' }).classes()).toContain('gap-6')
      expect(resolveTestimonialGridGap(3)).toBe('md')
      expect(m({ gap: 'lg', class: 'gap-1' }).classes()).toEqual(expect.arrayContaining(['gap-1']))
      expect(m({ gap: 'lg', class: 'gap-1' }).classes()).not.toContain('gap-8')
      expect(m({ gap: 'lg', columns: 2 }).classes()).toEqual(expect.arrayContaining(['gap-8', 'sm:grid-cols-2']))
    })
  })
  describe('size, tone and shape reach the generated testimonials', () => {
    it('are passed to every item and exposed on the root', () => {
      const w = m({ size: 'lg', tone: 'muted', shape: 'square' })
      expect([w.attributes('data-size'), w.attributes('data-tone'), w.attributes('data-shape')]).toEqual(['lg', 'muted', 'square'])
      for (const c of cards(w)) {
        expect(c.attributes('data-size')).toBe('lg')
        expect(c.classes()).toEqual(expect.arrayContaining(['p-8', 'bg-muted', 'rounded-none']))
      }
    })
    it('unknown values fall back on the items; slot testimonials keep their own props', () => {
      const w = m({ size: 'x', tone: 'x', shape: 'x' })
      expect(cards(w).map((c) => [c.attributes('data-size'), c.attributes('data-tone'), c.attributes('data-shape')])).toEqual([
        ['md', 'default', 'rounded'],
        ['md', 'default', 'rounded'],
      ])
      const slotted = mount(TestimonialGrid, { props: { tone: 'primary' }, slots: { default: '<div data-slot="testimonial" data-tone="muted">x</div>' } })
      expect(slotted.attributes('data-tone')).toBe('primary')
      expect(slotted.find('[data-slot="testimonial"]').attributes('data-tone')).toBe('muted')
    })
    it('keeps list semantics and attribution in every combination', () => {
      const w = m({ size: 'sm', tone: 'inverted', shape: 'square', gap: 'sm', layout: 'masonry', variant: 'with-rating' })
      expect(w.element.tagName).toBe('UL')
      expect(w.findAll('li')).toHaveLength(2)
      expect(w.findAll('[data-slot="testimonial-name"]').map((n) => n.text())).toEqual(['Customer one', 'Customer two'])
    })
  })
})
