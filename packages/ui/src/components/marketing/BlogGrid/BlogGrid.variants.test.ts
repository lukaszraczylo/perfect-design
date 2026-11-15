import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import BlogCard from '../BlogCard/BlogCard.vue'
import BlogGrid from './BlogGrid.vue'
import { BLOG_GRID_GAPS, blogGridVariants } from './variants'

const items = [
  { title: 'First post', excerpt: 'One', href: '/one', category: 'Guide', author: 'Author name', date: '2024-03-01' },
  { title: 'Second post', excerpt: 'Two', href: '/two' },
]
const grid = (props: Record<string, unknown> = {}) => mount(BlogGrid, { props: { items, ...props } })
const cards = (w: ReturnType<typeof grid>) => w.findAll('[data-slot="blog-card"]')

describe('BlogGrid variations', () => {
  describe('defaults keep the original output', () => {
    it('root keeps `grid gap-6` and the three-column classes', () => {
      expect(grid().classes().sort()).toEqual('grid gap-6 sm:grid-cols-2 lg:grid-cols-3'.split(' ').sort())
      expect(blogGridVariants()).toBe('grid gap-6 sm:grid-cols-2 lg:grid-cols-3')
    })
    it('cards use the card defaults', () => {
      for (const c of cards(grid())) {
        expect(c.attributes('data-size')).toBe('md')
        expect(c.attributes('data-shape')).toBe('rounded')
        expect(c.attributes('data-appearance')).toBe('card')
      }
    })
    it('reports the defaults as data attributes', () => {
      const w = grid()
      expect([w.attributes('data-gap'), w.attributes('data-size'), w.attributes('data-shape'), w.attributes('data-appearance')]).toEqual(['md', 'md', 'rounded', 'card'])
    })
  })

  describe('gap', () => {
    it.each([
      ['sm', 'gap-4'],
      ['md', 'gap-6'],
      ['lg', 'gap-8'],
    ] as const)('%s uses %s', (gap, cls) => {
      const w = grid({ gap })
      expect(w.attributes('data-gap')).toBe(gap)
      expect(w.classes()).toContain(cls)
      expect(w.classes().filter((c) => /^gap-\d/.test(c))).toHaveLength(1)
      expect(blogGridVariants({ gap })).toContain(cls)
    })
    it('unknown values fall back to md', () => {
      for (const gap of ['xl', '', 4, null]) expect(grid({ gap }).classes()).toContain('gap-6')
    })
    it('combines with every column count without dropping the column classes', () => {
      for (const gap of BLOG_GRID_GAPS)
        for (const columns of [1, 2, 3, 4] as const) {
          const w = grid({ gap, columns })
          expect(w.classes()).toContain(columns === 1 ? 'grid-cols-1' : 'sm:grid-cols-2')
          expect(w.classes().filter((c) => /^gap-\d/.test(c))).toHaveLength(1)
        }
    })
    it('the class prop wins', () => {
      expect(grid({ gap: 'lg', class: 'gap-2' }).classes()).toEqual(expect.arrayContaining(['gap-2']))
      expect(grid({ gap: 'lg', class: 'gap-2' }).classes()).not.toContain('gap-8')
    })
  })

  describe('pass-through to generated cards', () => {
    it('size, shape and appearance reach every card', () => {
      const w = grid({ size: 'lg', shape: 'square', appearance: 'filled' })
      expect(cards(w)).toHaveLength(2)
      for (const c of cards(w)) {
        expect(c.attributes('data-size')).toBe('lg')
        expect(c.classes()).toEqual(expect.arrayContaining(['rounded-none', 'bg-secondary']))
        expect(c.find('[data-slot="blog-card-body"]').classes()).toContain('p-6')
      }
    })
    it('a post that sets its own size, shape or appearance wins over the grid', () => {
      const w = grid({
        size: 'sm',
        shape: 'square',
        appearance: 'plain',
        items: [{ ...items[0], appearance: 'filled' }, { ...items[1], size: 'lg', shape: 'rounded' }],
      })
      const [a, b] = cards(w)
      expect(a.attributes('data-appearance')).toBe('filled')
      expect(a.attributes('data-size')).toBe('sm')
      expect(a.attributes('data-shape')).toBe('square')
      expect(b.attributes('data-size')).toBe('lg')
      expect(b.attributes('data-shape')).toBe('rounded')
      expect(b.attributes('data-appearance')).toBe('plain')
    })
    it('unknown grid values fall back to the card defaults', () => {
      const w = grid({ size: 'huge', shape: 'pill', appearance: 'glass' })
      expect([w.attributes('data-size'), w.attributes('data-shape'), w.attributes('data-appearance')]).toEqual(['md', 'rounded', 'card'])
      expect(cards(w)[0].classes()).toContain('rounded-lg')
    })
    it('the featured first card receives the pass-through too', () => {
      const w = grid({ layout: 'featured', size: 'sm', appearance: 'plain' })
      const [first, second] = cards(w)
      expect(first.attributes('data-variant')).toBe('featured')
      expect(first.attributes('data-appearance')).toBe('plain')
      expect(second.attributes('data-size')).toBe('sm')
      expect(first.find('[data-slot="blog-card-body"]').classes()).toContain('lg:p-8')
    })
    it('cards placed in the default slot keep their own props', () => {
      const w = mount(BlogGrid, {
        props: { size: 'lg', appearance: 'filled' },
        slots: { default: () => [h(BlogCard, { title: 'Slot card' })] },
      })
      expect(w.attributes('data-size')).toBe('lg')
      expect(w.find('[data-slot="blog-card"]').attributes('data-appearance')).toBe('card')
    })
  })

  describe('structure and a11y do not depend on the look', () => {
    it('keeps list semantics, one article and one link per post in every combination', () => {
      for (const gap of BLOG_GRID_GAPS)
        for (const appearance of ['card', 'plain', 'filled'] as const) {
          const w = grid({ gap, appearance, shape: 'square', size: 'sm' })
          expect(w.element.tagName).toBe('UL')
          expect(w.attributes('role')).toBe('list')
          expect(w.findAll('li')).toHaveLength(2)
          expect(w.findAll('article')).toHaveLength(2)
          expect(w.findAll('a')).toHaveLength(2)
        }
    })
    it('an empty grid with each gap still renders the empty slot', () => {
      for (const gap of BLOG_GRID_GAPS) {
        const w = mount(BlogGrid, { props: { items: [], gap }, slots: { empty: '<p id="e">No posts</p>' } })
        expect(w.find('#e').exists()).toBe(true)
        expect(w.element.tagName).toBe('DIV')
      }
    })
  })
})
