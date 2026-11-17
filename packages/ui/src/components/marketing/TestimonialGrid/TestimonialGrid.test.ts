import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TestimonialGrid from './TestimonialGrid.vue'
import Testimonial from '../Testimonial/Testimonial.vue'
import { TESTIMONIAL_GRID_LAYOUTS, testimonialGridVariants } from './variants'

const items = [
  { quote: 'One', author: 'Customer name A', role: 'CTO', rating: 5 },
  { quote: 'Two', author: 'Customer name B' },
  { quote: 'Three', author: 'Customer name C' },
]

describe('TestimonialGrid', () => {
  describe('good path', () => {
    it('renders a list of testimonials from items', () => {
      const w = mount(TestimonialGrid, { props: { items } })
      expect(w.attributes('data-slot')).toBe('testimonial-grid')
      const t = w.findAllComponents(Testimonial)
      expect(t).toHaveLength(3)
      expect(t[0].element.tagName).toBe('FIGURE')
      expect(t[0].find('[data-slot="testimonial-rating"]').exists()).toBe(true)
      expect(t[1].text()).toContain('Customer name B')
    })
    it('items mode is a native ul of li (figures inside), slot and empty modes are plain divs', () => {
      const w = mount(TestimonialGrid, { props: { items } })
      expect(w.element.tagName).toBe('UL')
      expect(w.attributes('role')).toBe('list')
      expect(w.findAll(':scope > li[data-slot="testimonial-grid-item"] > figure')).toHaveLength(3)
      const slotted = mount(TestimonialGrid, { slots: { default: '<figure id="f" />' } })
      expect(slotted.element.tagName).toBe('DIV')
      expect(slotted.attributes('role')).toBeUndefined()
      expect(mount(TestimonialGrid).element.tagName).toBe('DIV')
    })
    it('defaults to grid layout, 3 columns, card variant', () => {
      const w = mount(TestimonialGrid, { props: { items } })
      expect(w.attributes('data-layout')).toBe('grid')
      expect(w.attributes('data-columns')).toBe('3')
      expect(w.classes()).toContain('lg:grid-cols-3')
      expect(w.findComponent(Testimonial).attributes('data-variant')).toBe('card')
    })
    it.each([
      [1, 'grid-cols-1'],
      [2, 'sm:grid-cols-2'],
      [3, 'lg:grid-cols-3'],
    ] as const)('grid layout with %s columns', (columns, cls) => {
      expect(mount(TestimonialGrid, { props: { items, columns } }).classes()).toContain(cls)
    })
    it.each([
      [1, 'columns-1'],
      [2, 'sm:columns-2'],
      [3, 'lg:columns-3'],
    ] as const)('masonry layout with %s columns uses CSS columns', (columns, cls) => {
      const w = mount(TestimonialGrid, { props: { items, layout: 'masonry', columns } })
      expect(w.attributes('data-layout')).toBe('masonry')
      expect(w.classes()).toContain(cls)
      expect(w.classes().join(' ')).toContain('break-inside-avoid')
    })
    it('columns layout is a flex row on md and ignores the columns prop', () => {
      const w = mount(TestimonialGrid, { props: { items, layout: 'columns', columns: 2 } })
      expect(w.attributes('data-layout')).toBe('columns')
      expect(w.classes()).toContain('md:flex-row')
      expect(w.classes().join(' ')).not.toContain('grid-cols')
    })
    it.each(['card', 'quote', 'inline', 'with-rating', 'avatar-left', 'featured'] as const)('passes variant %s through', (variant) => {
      const w = mount(TestimonialGrid, { props: { items, variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.findAllComponents(Testimonial).every((t) => t.attributes('data-variant') === variant)).toBe(true)
    })
    it('default slot replaces items', () => {
      const w = mount(TestimonialGrid, { props: { items }, slots: { default: '<div id="custom" />' } })
      expect(w.find('#custom').exists()).toBe(true)
      expect(w.findAllComponents(Testimonial)).toHaveLength(0)
    })
    it('exposes the cva', () => {
      expect(TESTIMONIAL_GRID_LAYOUTS).toEqual(['grid', 'masonry', 'columns'])
      expect(testimonialGridVariants({ layout: 'masonry', columns: 2 })).toContain('sm:columns-2')
    })
  })
  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(TestimonialGrid, { props: { items, class: 'gap-2 custom' }, attrs: { id: 'g', 'aria-label': 'Reviews' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('id')).toBe('g')
      expect(w.attributes('aria-label')).toBe('Reviews')
    })
  })
  describe('bad path', () => {
    it('empty items render an empty list', () => {
      const w = mount(TestimonialGrid, { props: { items: [] } })
      expect(w.findAllComponents(Testimonial)).toHaveLength(0)
      expect(w.element.children).toHaveLength(0)
    })
    it('no props at all renders safely', () => {
      expect(mount(TestimonialGrid).attributes('data-slot')).toBe('testimonial-grid')
    })
    it('unknown layout falls back to grid', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(TestimonialGrid, { props: { items, layout: 'carousel' } })
      expect(w.attributes('data-layout')).toBe('grid')
      expect(w.classes()).toContain('grid')
    })
    it('invalid columns fall back to 3', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(TestimonialGrid, { props: { items, columns: 9 } }).attributes('data-columns')).toBe('3')
    })
    it('unknown variant falls back to card', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(TestimonialGrid, { props: { items, variant: 'nope' } })
      expect(w.attributes('data-variant')).toBe('card')
      expect(w.findComponent(Testimonial).attributes('data-variant')).toBe('card')
    })
    it('out-of-range ratings are clamped per item', () => {
      const w = mount(TestimonialGrid, { props: { items: [{ quote: 'q', rating: 7 }, { quote: 'q', rating: -1 }, { quote: 'q', rating: Number.NaN }] } })
      const labels = w.findAll('[data-slot="testimonial-rating"]').map((r) => r.attributes('aria-label'))
      expect(labels).toEqual(['5 out of 5', '0 out of 5'])
    })
  })
  describe('edge cases', () => {
    it('one item and 100 items', () => {
      expect(mount(TestimonialGrid, { props: { items: [items[0]] } }).findAllComponents(Testimonial)).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ quote: `q${i}`, author: 'Same Name' }))
      expect(mount(TestimonialGrid, { props: { items: many, layout: 'masonry' } }).findAllComponents(Testimonial)).toHaveLength(100)
    })
    it('very long and unicode text', () => {
      const w = mount(TestimonialGrid, { props: { items: [{ quote: '数'.repeat(5000), author: '😀 Émile' }] } })
      expect(w.find('blockquote').text()).toHaveLength(5002)
    })
    it('switching layout and columns repeatedly', async () => {
      const w = mount(TestimonialGrid, { props: { items } })
      for (let n = 0; n < 12; n++) await w.setProps({ layout: TESTIMONIAL_GRID_LAYOUTS[n % 3], columns: ((n % 3) + 1) as 1 | 2 | 3 })
      expect(w.attributes('data-layout')).toBe('columns')
      w.unmount()
    })
  })
})

describe('TestimonialGrid on narrow screens', () => {
  it('gives the grid an explicit shrinkable column below sm, so a long role line cannot widen the card', () => {
    for (const columns of [2, 3] as const) {
      const w = mount(TestimonialGrid, { props: { layout: 'grid', columns, items: [{ quote: 'Sample quote', author: 'Sample author', role: 'Sample role with a long organisation name · 140,000 members' }] } })
      expect(w.classes()).toContain('grid-cols-1')
    }
  })
})
