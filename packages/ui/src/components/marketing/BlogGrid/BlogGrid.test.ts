import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import BlogGrid from './BlogGrid.vue'
import BlogCard from '../BlogCard/BlogCard.vue'
import { blogGridVariants } from './variants'

const items = [
  { title: 'One', excerpt: 'a', href: '/1', date: '2024-03-01', author: 'Ada' },
  { title: 'Two', href: '/2', category: 'News' },
  { title: 'Three' },
]
const cards = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="blog-card"]')

describe('BlogGrid', () => {
  describe('good path', () => {
    it('imageless posts hug their content instead of stretching to an image card row', () => {
      const w = mount(BlogGrid, { props: { items: [{ title: 'A', image: 'data:image/svg+xml;utf8,x', imageAlt: '' }, { title: 'B' }] } })
      const li = w.findAll('[data-slot="blog-grid-item"]')
      expect(li[0].classes()).not.toContain('self-start')
      expect(li[1].classes()).toContain('self-start')
    })
    it('renders a card per post inside a list', () => {
      const w = mount(BlogGrid, { props: { items } })
      expect(w.attributes('data-slot')).toBe('blog-grid')
      expect(w.attributes('role')).toBe('list')
      expect(cards(w)).toHaveLength(3)
      // regression: native ul/li instead of div[role=list] > div[role=listitem]
      expect(w.element.tagName).toBe('UL')
      expect(w.findAll(':scope > li[data-slot="blog-grid-item"]')).toHaveLength(3)
      expect(w.find('[role="listitem"]').exists()).toBe(false)
      expect(w.findAll('article')).toHaveLength(3)
      expect(w.findAll('h3').map((h) => h.text())).toEqual(['One', 'Two', 'Three'])
    })
    it.each([
      [1, 'grid-cols-1'],
      [2, 'sm:grid-cols-2'],
      [3, 'lg:grid-cols-3'],
      [4, 'lg:grid-cols-4'],
    ] as const)('columns %s', (columns, cls) => {
      const w = mount(BlogGrid, { props: { columns } })
      expect(w.classes()).toContain(cls)
      expect(w.attributes('data-columns')).toBe(String(columns))
      expect(blogGridVariants({ columns })).toContain(cls)
    })
    it.each(['vertical', 'horizontal', 'featured'] as const)('variant %s is forwarded to every card', (variant) => {
      const w = mount(BlogGrid, { props: { items, variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      for (const c of cards(w)) expect(c.attributes('data-variant')).toBe(variant)
    })
    it('grid layout (default): no item spans the full width', () => {
      const w = mount(BlogGrid, { props: { items } })
      expect(w.attributes('data-layout')).toBe('grid')
      expect(w.findAll('.col-span-full')).toHaveLength(0)
    })
    it('featured layout: first card is featured and full width, the rest use `variant`', () => {
      const w = mount(BlogGrid, { props: { items, layout: 'featured', variant: 'horizontal' } })
      expect(w.attributes('data-layout')).toBe('featured')
      const c = cards(w)
      expect(c.map((x) => x.attributes('data-variant'))).toEqual(['featured', 'horizontal', 'horizontal'])
      const wrappers = w.findAll('[data-slot="blog-grid-item"]')
      expect(wrappers[0].classes()).toContain('col-span-full')
      expect(wrappers[1].classes()).not.toContain('col-span-full')
    })
    it('featured layout with a single post', () => {
      const w = mount(BlogGrid, { props: { items: [items[0]], layout: 'featured' } })
      expect(cards(w).map((x) => x.attributes('data-variant'))).toEqual(['featured'])
    })
    it('passes level and locale to cards', () => {
      const w = mount(BlogGrid, { props: { items, level: 2, locale: 'de-DE' } })
      expect(w.findAll('h2')).toHaveLength(3)
      expect(w.find('time').text()).not.toBe('Mar 1, 2024')
    })
    it('slot content replaces generated cards and drops the list role', () => {
      const w = mount(BlogGrid, { props: { items }, slots: { default: '<div id="mine" />' } })
      expect(w.find('#mine').exists()).toBe(true)
      expect(cards(w)).toHaveLength(0)
      expect(w.attributes('role')).toBeUndefined()
      expect(w.element.tagName).toBe('DIV')
    })
    it('renders BlogCards passed through the slot', () => {
      const w = mount(BlogGrid, { slots: { default: () => [h(BlogCard, { title: 'Slotted' }), h(BlogCard, { title: 'Two' })] } })
      expect(cards(w)).toHaveLength(2)
      expect(w.find('h3').text()).toBe('Slotted')
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(BlogGrid, { props: { class: 'gap-2 custom' }, attrs: { id: 'g', 'data-x': '1', 'aria-label': 'Posts' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('gap-2')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('id')).toBe('g')
      expect(w.attributes('data-x')).toBe('1')
      expect(w.attributes('aria-label')).toBe('Posts')
    })
  })

  describe('bad path', () => {
    it('empty items renders an empty grid without a list role', () => {
      const w = mount(BlogGrid, { props: { items: [] } })
      expect(w.element.children).toHaveLength(0)
      expect(w.attributes('role')).toBeUndefined()
    })
    it('empty slot shows only when there are no items', () => {
      const empty = mount(BlogGrid, { props: { items: [] }, slots: { empty: '<p id="e">Nothing yet</p>' } })
      expect(empty.find('[data-slot="blog-grid-empty"] #e').exists()).toBe(true)
      const full = mount(BlogGrid, { props: { items }, slots: { empty: '<p id="e">Nothing yet</p>' } })
      expect(full.find('#e').exists()).toBe(false)
    })
    it('non-array items and null entries are ignored', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(BlogGrid, { props: { items: null } }).element.children).toHaveLength(0)
      // @ts-expect-error deliberately invalid
      expect(cards(mount(BlogGrid, { props: { items: [null, items[2]] } }))).toHaveLength(1)
    })
    it('out-of-range / wrong-type columns fall back to 3', () => {
      for (const columns of [0, 5, -1, 2.5, '2', null]) {
        // @ts-expect-error deliberately invalid
        const w = mount(BlogGrid, { props: { columns } })
        expect(w.attributes('data-columns')).toBe('3')
        expect(w.classes()).toContain('lg:grid-cols-3')
      }
    })
    it('unknown variant falls back to vertical, unknown layout to grid', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(BlogGrid, { props: { items, variant: 'x', layout: 'masonry' } })
      expect(w.attributes('data-variant')).toBe('vertical')
      expect(w.attributes('data-layout')).toBe('grid')
      expect(cards(w).every((c) => c.attributes('data-variant') === 'vertical')).toBe(true)
    })
    it('posts with invalid dates still render', () => {
      const w = mount(BlogGrid, { props: { items: [{ title: 'A', date: 'soon' }] } })
      expect(w.find('time').exists()).toBe(false)
      expect(w.find('[data-slot="blog-card-date"]').text()).toBe('soon')
    })
  })

  describe('edge cases', () => {
    it('handles one post and 100 posts', () => {
      expect(cards(mount(BlogGrid, { props: { items: [items[2]] } }))).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ title: `Post ${i}`, href: `/p/${i}` }))
      expect(cards(mount(BlogGrid, { props: { items: many, layout: 'featured' } }))).toHaveLength(100)
    })
    it('handles duplicate titles without key warnings', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const w = mount(BlogGrid, { props: { items: [{ title: 'Same' }, { title: 'Same' }] } })
      expect(cards(w)).toHaveLength(2)
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })
    it('handles very long and unicode text', () => {
      const long = 'x'.repeat(4000)
      const w = mount(BlogGrid, { props: { items: [{ title: long, excerpt: long }, { title: '日本語のタイトル 😀', author: 'مرحبا' }] } })
      expect(w.findAll('h3')[0].text()).toHaveLength(4000)
      expect(w.findAll('h3')[1].text()).toBe('日本語のタイトル 😀')
    })
    it('reacts when items, layout and columns change, then unmounts', async () => {
      const w = mount(BlogGrid, { props: { items, layout: 'grid' as const } })
      await w.setProps({ layout: 'featured', columns: 2, items: [items[0], items[1]] })
      expect(cards(w).map((c) => c.attributes('data-variant'))).toEqual(['featured', 'vertical'])
      await w.setProps({ items: [] })
      expect(cards(w)).toHaveLength(0)
      expect(() => w.unmount()).not.toThrow()
    })
  })
})
