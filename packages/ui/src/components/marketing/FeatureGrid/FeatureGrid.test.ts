import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faBolt } from '@fortawesome/free-solid-svg-icons'
import FeatureGrid from './FeatureGrid.vue'
import {
  FEATURE_GRID_LAYOUTS,
  bentoSpanClass,
  featureGridRowVariants,
  featureGridVariants,
  resolveFeatureGridAlign,
  resolveFeatureGridLayout,
} from './variants'

const items = [
  { icon: faBolt, title: 'One', description: 'a' },
  { title: 'Two', href: '/two' },
  { title: 'Three', href: 'https://x.dev', external: true },
]

describe('FeatureGrid', () => {
  describe('good path', () => {
    it('renders a card per item', () => {
      const w = mount(FeatureGrid, { props: { items } })
      expect(w.attributes('data-slot')).toBe('feature-grid')
      expect(w.element.tagName).toBe('UL')
      expect(w.attributes('role')).toBe('list')
      expect(w.findAll('[data-slot="feature-card"]')).toHaveLength(3)
      expect(w.findAll(':scope > li')).toHaveLength(3)
      expect(w.findAll('a')).toHaveLength(2)
    })
    it('is a native list: li children, no ARIA roles on cards (axe aria-required-children / aria-allowed-role regression)', () => {
      const w = mount(FeatureGrid, { props: { items } })
      expect([...w.element.children].every((c) => c.tagName === 'LI')).toBe(true)
      expect(w.findAll('[role="listitem"]')).toHaveLength(0)
      expect(w.findAll('li > [data-slot="feature-card"]')).toHaveLength(3)
      expect(w.find('[data-slot="feature-card"]').attributes('role')).toBeUndefined()
    })
    it('custom slot content renders in a plain grid div with no list role (children cannot be guaranteed listitems)', () => {
      const w = mount(FeatureGrid, { slots: { default: '<div id="mine" />' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('role')).toBeUndefined()
      expect(w.attributes('data-slot')).toBe('feature-grid')
    })
    it.each([
      [2, 'sm:grid-cols-2'],
      [3, 'lg:grid-cols-3'],
      [4, 'lg:grid-cols-4'],
    ] as const)('columns %s', (columns, cls) => {
      expect(mount(FeatureGrid, { props: { columns } }).classes()).toContain(cls)
      expect(featureGridVariants({ columns })).toContain(cls)
    })
    it('slot content replaces generated cards', () => {
      const w = mount(FeatureGrid, { props: { items }, slots: { default: '<div id="mine" />' } })
      expect(w.find('#mine').exists()).toBe(true)
      expect(w.findAll('[data-slot="feature-card"]')).toHaveLength(0)
    })
    it('passes level to cards', () => {
      expect(mount(FeatureGrid, { props: { items, level: 4 } }).findAll('h4')).toHaveLength(3)
    })
  })
  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(FeatureGrid, { props: { class: 'gap-2 custom' }, attrs: { id: 'g' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('gap-2')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('id')).toBe('g')
    })
  })
  describe('bad path', () => {
    it('empty items renders an empty grid', () => {
      expect(mount(FeatureGrid, { props: { items: [] } }).element.children).toHaveLength(0)
    })
    it('invalid columns fall back to 3', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(FeatureGrid, { props: { columns: 9 } })
      expect(w.attributes('data-columns')).toBe('3')
    })
  })
  describe('edge cases', () => {
    it('handles one item and 100 items', () => {
      expect(mount(FeatureGrid, { props: { items: [items[0]] } }).findAll('[data-slot="feature-card"]')).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ title: `T${i}` }))
      expect(mount(FeatureGrid, { props: { items: many } }).findAll('[data-slot="feature-card"]')).toHaveLength(100)
    })
    it('handles duplicate titles without key warnings', () => {
      const w = mount(FeatureGrid, { props: { items: [{ title: 'Same' }, { title: 'Same' }] } })
      expect(w.findAll('[data-slot="feature-card"]')).toHaveLength(2)
    })
  })

  describe('layout: grid (default)', () => {
    it('is the default and exposes data-layout', () => {
      const w = mount(FeatureGrid, { props: { items } })
      expect(w.attributes('data-layout')).toBe('grid')
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'gap-6']))
      expect(w.find('[data-slot="feature-card"]').attributes('data-variant')).toBe('card')
    })
    it('passes the card variant and align through', () => {
      const w = mount(FeatureGrid, { props: { items, variant: 'flat', align: 'center' } })
      const cards = w.findAll('[data-slot="feature-card"]')
      expect(cards.map((c) => c.attributes('data-variant'))).toEqual(['flat', 'flat', 'flat'])
      expect(cards.map((c) => c.attributes('data-align'))).toEqual(['center', 'center', 'center'])
    })
    it('per-item variant wins over the grid variant', () => {
      const w = mount(FeatureGrid, { props: { variant: 'flat', items: [{ title: 'a', variant: 'highlight' }, { title: 'b' }] } })
      expect(w.findAll('[data-slot="feature-card"]').map((c) => c.attributes('data-variant'))).toEqual(['highlight', 'flat'])
    })
    it('does not leak span/image props to the DOM', () => {
      const w = mount(FeatureGrid, { props: { items: [{ title: 'a', span: 2, image: '/i.png', imageAlt: 'x' }] } })
      expect(w.find('[data-slot="feature-card"]').attributes('image')).toBeUndefined()
      expect(w.find('[data-slot="feature-card"]').attributes('span')).toBeUndefined()
      expect(w.find('img').exists()).toBe(false)
    })
  })
  describe('layout: list', () => {
    it('stacks icon-left rows in a single column', () => {
      const w = mount(FeatureGrid, { props: { layout: 'list', items } })
      expect(w.attributes('data-layout')).toBe('list')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col']))
      expect(w.classes().some((c) => c.includes('grid-cols'))).toBe(false)
      expect(w.findAll('[data-slot="feature-card"]').every((c) => c.attributes('data-variant') === 'icon-left')).toBe(true)
      expect(w.findAll('li')).toHaveLength(3)
    })
    it('an explicit variant overrides the layout default', () => {
      const w = mount(FeatureGrid, { props: { layout: 'list', variant: 'minimal', items } })
      expect(w.find('[data-slot="feature-card"]').attributes('data-variant')).toBe('minimal')
    })
  })
  describe('layout: alternating', () => {
    const rows = [
      { title: 'One', description: 'a', image: '/a.png', imageAlt: 'Alpha' },
      { title: 'Two', image: '/b.png' },
      { title: 'Three', image: '/c.png', imageAlt: 'Gamma' },
      { title: 'No media' },
    ]
    it('renders rows with media that alternate sides', () => {
      const w = mount(FeatureGrid, { props: { layout: 'alternating', items: rows } })
      const r = w.findAll('[data-slot="feature-grid-row"]')
      expect(r).toHaveLength(4)
      expect(r.every((x) => x.element.tagName === 'LI')).toBe(true)
      expect(r.map((x) => x.attributes('data-reversed') !== undefined)).toEqual([false, true, false, true])
      const media = w.findAll('[data-slot="feature-grid-media"]')
      expect(media).toHaveLength(3)
      expect(media[0].classes()).toContain('rounded-lg')
      expect(media[0].classes()).not.toContain('md:order-first')
      expect(media[1].classes()).toContain('md:order-first')
      expect(w.findAll('img').map((i) => i.attributes('src'))).toEqual(['/a.png', '/b.png', '/c.png'])
      expect(w.findAll('img').map((i) => i.attributes('alt'))).toEqual(['Alpha', '', 'Gamma'])
      expect(w.findAll('img')[0].attributes('loading')).toBe('lazy')
    })
    it('rows without media use a single column', () => {
      const w = mount(FeatureGrid, { props: { layout: 'alternating', items: rows } })
      const r = w.findAll('[data-slot="feature-grid-row"]')
      expect(r[0].classes()).toContain('md:grid-cols-2')
      expect(r[3].classes()).not.toContain('md:grid-cols-2')
      expect(featureGridRowVariants({ media: true })).toContain('md:grid-cols-2')
      expect(featureGridRowVariants()).not.toContain('md:grid-cols-2')
    })
    it('uses text-only minimal cards by default', () => {
      const w = mount(FeatureGrid, { props: { layout: 'alternating', items: rows } })
      expect(w.find('[data-slot="feature-card"]').attributes('data-variant')).toBe('minimal')
      expect(w.find('[data-slot="feature-card"]').attributes('role')).toBeUndefined()
    })
    it('media slot gets item and index and applies to every row', () => {
      const w = mount(FeatureGrid, {
        props: { layout: 'alternating', items: [{ title: 'A' }, { title: 'B' }] },
        slots: { media: '<template #media="{ item, index }"><em class="m">{{ index }}-{{ item.title }}</em></template>' },
      })
      expect(w.findAll('em.m').map((e) => e.text())).toEqual(['0-A', '1-B'])
      expect(w.findAll('img')).toHaveLength(0)
      expect(w.findAll('[data-slot="feature-grid-media"]')).toHaveLength(2)
    })
    it('ignores a non-string image', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(FeatureGrid, { props: { layout: 'alternating', items: [{ title: 'x', image: 5 }, { title: 'y', image: '' }] } })
      expect(w.findAll('img')).toHaveLength(0)
    })
  })
  describe('layout: bento', () => {
    it('applies span classes per tile and stretches tiles', () => {
      const w = mount(FeatureGrid, {
        props: { layout: 'bento', columns: 3, items: [{ title: 'a', span: 2 }, { title: 'b' }, { title: 'c', span: 3 }, { title: 'd', span: 4 }] },
      })
      expect(w.attributes('data-layout')).toBe('bento')
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'auto-rows-fr', 'lg:grid-cols-3']))
      const tiles = w.findAll('[data-slot="feature-grid-item"]')
      expect(tiles[0].classes()).toEqual(expect.arrayContaining(['flex', 'sm:col-span-2']))
      expect(tiles[0].find('[data-slot="feature-card"]').classes()).toContain('w-full')
      expect(tiles[1].classes().some((c) => c.includes('col-span'))).toBe(false)
      expect(tiles[2].classes()).toContain('lg:col-span-3')
      expect(tiles[3].classes()).toContain('lg:col-span-3') // 4 clamped to 3 columns
    })
    it('span clamps to columns and rejects junk', () => {
      expect(bentoSpanClass(4, 4)).toBe('sm:col-span-2 lg:col-span-4')
      expect(bentoSpanClass(3, 2)).toBe('sm:col-span-2')
      expect(bentoSpanClass(2, 2)).toBe('sm:col-span-2')
      for (const bad of [0, -3, NaN, 1.5, '2', null, undefined, Infinity]) expect(bentoSpanClass(bad, 4)).toBe('')
      expect(bentoSpanClass(99, 4)).toBe('sm:col-span-2 lg:col-span-4')
    })
    it('columns apply to bento too', () => {
      expect(mount(FeatureGrid, { props: { layout: 'bento', columns: 4 } }).classes()).toContain('lg:grid-cols-4')
    })
  })
  describe('layout: centered', () => {
    it('forces centred minimal cards (the tinted icon-badge tile is no longer the default)', () => {
      const w = mount(FeatureGrid, { props: { layout: 'centered', items, align: 'left' } })
      const cards = w.findAll('[data-slot="feature-card"]')
      expect(cards.every((c) => c.attributes('data-align') === 'center' && c.attributes('data-variant') === 'minimal')).toBe(true)
      expect(w.classes()).toContain('lg:grid-cols-3')
    })
  })
  describe('layout: with-heading', () => {
    it('wraps a SectionHeading and the items list', () => {
      const w = mount(FeatureGrid, { props: { layout: 'with-heading', eyebrow: 'Why', title: 'Everything', description: 'All of it', items } })
      expect(w.attributes('data-slot')).toBe('feature-grid')
      expect(w.attributes('role')).toBeUndefined()
      expect(w.attributes('data-layout')).toBe('with-heading')
      expect(w.find('[data-slot="section-heading-eyebrow"]').text()).toBe('Why')
      expect(w.find('h2[data-slot="section-heading-title"]').text()).toBe('Everything')
      expect(w.find('[data-slot="section-heading-description"]').text()).toBe('All of it')
      const list = w.find('[data-slot="feature-grid-items"]')
      expect(list.element.tagName).toBe('UL')
      expect(list.attributes('role')).toBe('list')
      expect(list.findAll('[data-slot="feature-card"]')).toHaveLength(3)
      expect(list.classes()).toContain('lg:grid-cols-3')
    })
    it('heading align, heading level and item level are independent', () => {
      const w = mount(FeatureGrid, { props: { title: 'T', align: 'center', headingLevel: 1, level: 4, items } })
      expect(w.find('h1').exists()).toBe(true)
      expect(w.find('[data-slot="section-heading"]').classes()).toContain('text-center')
      expect(w.findAll('h4')).toHaveLength(3)
    })
    it('any heading prop wraps other layouts too', () => {
      const w = mount(FeatureGrid, { props: { layout: 'list', title: 'T', items } })
      expect(w.find('[data-slot="section-heading"]').exists()).toBe(true)
      expect(w.find('[data-slot="feature-grid-items"]').classes()).toContain('flex-col')
    })
    it('heading slot replaces the built-in heading', () => {
      const w = mount(FeatureGrid, { props: { items }, slots: { heading: '<h2 id="mine">Mine</h2>' } })
      expect(w.find('#mine').exists()).toBe(true)
      expect(w.find('[data-slot="section-heading"]').exists()).toBe(false)
    })
    it('with-heading without heading props renders just the list inside the wrapper', () => {
      const w = mount(FeatureGrid, { props: { layout: 'with-heading', items } })
      expect(w.find('[data-slot="section-heading"]').exists()).toBe(false)
      expect(w.findAll('[data-slot="feature-card"]')).toHaveLength(3)
    })
    it('default slot still works under a heading; class and attrs land on the wrapper', () => {
      const w = mount(FeatureGrid, { props: { title: 'T', class: 'gap-2 custom' }, attrs: { id: 'wrap' }, slots: { default: '<div id="mine"/>' } })
      expect(w.find('#mine').exists()).toBe(true)
      expect(w.attributes('id')).toBe('wrap')
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-10')
    })
  })
  describe('layouts: bad path and edge cases', () => {
    it('unknown layout and align fall back', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(FeatureGrid, { props: { layout: 'masonry', align: 'diagonal', items } })
      expect(w.attributes('data-layout')).toBe('grid')
      expect(w.find('[data-slot="feature-card"]').attributes('data-align')).toBe('left')
      expect(resolveFeatureGridLayout(null)).toBe('grid')
      expect(resolveFeatureGridAlign('right')).toBe('left')
      expect(resolveFeatureGridAlign('center')).toBe('center')
    })
    it('unknown card variant falls back to card', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(FeatureGrid, { props: { variant: 'neon', items } })
      expect(w.find('[data-slot="feature-card"]').attributes('data-variant')).toBe('card')
    })
    it.each(FEATURE_GRID_LAYOUTS)('layout %s: empty items render safely', (layout) => {
      const w = mount(FeatureGrid, { props: { layout, items: [] } })
      expect(w.findAll('[data-slot="feature-card"]')).toHaveLength(0)
      expect(w.find('[data-slot="feature-grid-row"]').exists()).toBe(false)
    })
    it.each(FEATURE_GRID_LAYOUTS)('layout %s: one item and 100 items', (layout) => {
      const one = mount(FeatureGrid, { props: { layout, items: [{ title: 'a' }] } })
      expect(one.findAll('[data-slot="feature-card"]')).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ title: `T${i}`, image: `/${i}.png`, span: ((i % 4) + 1) as 1 }))
      expect(mount(FeatureGrid, { props: { layout, items: many } }).findAll('[data-slot="feature-card"]')).toHaveLength(100)
    })
    it('skips null items in the array', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(FeatureGrid, { props: { items: [null, { title: 'ok' }] } })
      expect(w.findAll('[data-slot="feature-card"]')).toHaveLength(1)
    })
    it('long and unicode titles in every layout', () => {
      for (const layout of FEATURE_GRID_LAYOUTS) {
        const w = mount(FeatureGrid, { props: { layout, items: [{ title: '名'.repeat(1000), description: '🎉 مرحبا', image: '/x.png' }] } })
        expect(w.find('h3').text()).toHaveLength(1000)
        expect(w.text()).toContain('🎉')
      }
    })
    it('switching layout reactively and unmounting are safe', async () => {
      const w = mount(FeatureGrid, { props: { items, layout: 'grid' } })
      for (const layout of ['alternating', 'bento', 'list', 'centered', 'with-heading', 'grid'] as const) {
        await w.setProps({ layout })
        expect(w.attributes('data-layout')).toBe(layout)
      }
      expect(() => w.unmount()).not.toThrow()
    })
    it('layout classes can be overridden via class', () => {
      const w = mount(FeatureGrid, { props: { layout: 'list', class: 'gap-1 flex-row' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['gap-1', 'flex-row']))
      expect(w.classes()).not.toContain('flex-col')
      expect(featureGridVariants({ layout: 'list', class: 'x' })).toContain('x')
    })
  })
})
