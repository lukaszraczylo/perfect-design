import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faHouse } from '@fortawesome/free-solid-svg-icons'
import { defineComponent, h } from 'vue'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './index'

const RouterLinkStub = defineComponent({
  props: { to: { type: [String, Object], default: undefined } },
  setup: (p, { slots }) => () => h('a', { href: typeof p.to === 'string' ? p.to : '/obj', 'data-router': '' }, slots.default?.()),
})

const items = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Guide', href: '/docs/guide' },
  { label: 'Install' },
]
const many = Array.from({ length: 8 }, (_, i) => ({ label: `L${i}`, href: `/${i}` }))

describe('Breadcrumb', () => {
  describe('good path (items API)', () => {
    it('renders a labelled nav with an ordered list', () => {
      const w = mount(Breadcrumb, { props: { items } })
      expect(w.element.tagName).toBe('NAV')
      expect(w.attributes('aria-label')).toBe('Breadcrumb')
      expect(w.attributes('data-slot')).toBe('breadcrumb')
      expect(w.find('ol[data-slot="breadcrumb-list"]').exists()).toBe(true)
      expect(w.findAll('[data-slot="breadcrumb-item"]')).toHaveLength(4)
    })

    it('links all but the last item, which is the current page', () => {
      const w = mount(Breadcrumb, { props: { items } })
      const links = w.findAll('a[data-slot="breadcrumb-link"]')
      expect(links.map((l) => l.attributes('href'))).toEqual(['/', '/docs', '/docs/guide'])
      const page = w.find('[data-slot="breadcrumb-page"]')
      expect(page.text()).toBe('Install')
      expect(page.attributes('aria-current')).toBe('page')
    })

    it('puts decorative separators between items only', () => {
      const w = mount(Breadcrumb, { props: { items } })
      const seps = w.findAll('[data-slot="breadcrumb-separator"]')
      expect(seps).toHaveLength(3)
      expect(seps[0].attributes('aria-hidden')).toBe('true')
      expect(seps[0].attributes('role')).toBe('presentation')
      expect(seps[0].find('svg').exists()).toBe(true)
    })

    it('renders item icons', () => {
      const w = mount(Breadcrumb, { props: { items: [{ label: 'Home', href: '/', icon: faHouse }, { label: 'Now' }] } })
      expect(w.find('[data-slot="breadcrumb-link"] svg').exists()).toBe(true)
    })

    it('custom separator slot', () => {
      const w = mount(Breadcrumb, { props: { items }, slots: { separator: '<span class="sep">/</span>' } })
      expect(w.findAll('.sep')).toHaveLength(3)
    })
  })

  describe('good path (compound API)', () => {
    it('renders parts from the default slot', () => {
      const w = mount(Breadcrumb, {
        slots: {
          default: () =>
            h(BreadcrumbList, null, () => [
              h(BreadcrumbItem, null, () => h(BreadcrumbLink, { href: '/' }, () => 'Home')),
              h(BreadcrumbSeparator),
              h(BreadcrumbItem, null, () => h(BreadcrumbPage, null, () => 'Here')),
            ]),
        },
      })
      expect(w.find('[data-slot="breadcrumb-link"]').attributes('href')).toBe('/')
      expect(w.find('[data-slot="breadcrumb-page"]').text()).toBe('Here')
      expect(w.find('[data-slot="breadcrumb-ellipsis"]').exists()).toBe(false)
    })

    it('BreadcrumbEllipsis is a labelled button', () => {
      const w = mount(BreadcrumbEllipsis)
      expect(w.element.tagName).toBe('BUTTON')
      expect(w.attributes('aria-label')).toBe('Show hidden items')
      expect(mount(BreadcrumbEllipsis, { props: { label: 'More' } }).attributes('aria-label')).toBe('More')
    })
  })

  describe('truncation', () => {
    it('collapses middle items into an ellipsis button', () => {
      const w = mount(Breadcrumb, { props: { items: many, maxItems: 4 } })
      const text = w.findAll('[data-slot="breadcrumb-item"]').map((i) => i.text())
      expect(text).toEqual(['L0', '', 'L5', 'L6', 'L7'])
      const btn = w.find('[data-slot="breadcrumb-ellipsis"]')
      expect(btn.attributes('aria-label')).toBe('Show 4 hidden items')
    })

    it('clicking the ellipsis reveals all items', async () => {
      const w = mount(Breadcrumb, { props: { items: many, maxItems: 4 } })
      await w.find('[data-slot="breadcrumb-ellipsis"]').trigger('click')
      expect(w.find('[data-slot="breadcrumb-ellipsis"]').exists()).toBe(false)
      expect(w.findAll('[data-slot="breadcrumb-item"]')).toHaveLength(8)
    })

    it('singular label when exactly one item is hidden', () => {
      const w = mount(Breadcrumb, { props: { items: many.slice(0, 5), maxItems: 4 } })
      expect(w.find('[data-slot="breadcrumb-ellipsis"]').attributes('aria-label')).toBe('Show 1 hidden item')
    })

    it('does not collapse when items fit, or maxItems is 0/negative/NaN', () => {
      for (const maxItems of [0, -3, Number.NaN, 8, 20]) {
        expect(mount(Breadcrumb, { props: { items: many, maxItems } }).find('[data-slot="breadcrumb-ellipsis"]').exists()).toBe(false)
      }
    })

    it('maxItems of 1 is raised to 2 (first + last)', () => {
      const w = mount(Breadcrumb, { props: { items: many, maxItems: 1 } })
      expect(w.findAll('[data-slot="breadcrumb-item"]').map((i) => i.text())).toEqual(['L0', '', 'L7'])
    })

    it('collapses again when the item count changes', async () => {
      const w = mount(Breadcrumb, { props: { items: many, maxItems: 3 } })
      await w.find('[data-slot="breadcrumb-ellipsis"]').trigger('click')
      await w.setProps({ items: [...many, { label: 'L8' }] })
      expect(w.find('[data-slot="breadcrumb-ellipsis"]').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class on every part', () => {
      const w = mount(Breadcrumb, { props: { items, class: 'root-x' } })
      expect(w.classes()).toContain('root-x')
      const parts = mount(BreadcrumbList, { props: { class: 'gap-9' } })
      expect(parts.classes()).toContain('gap-9')
      expect(parts.classes()).not.toContain('gap-1.5')
      expect(mount(BreadcrumbItem, { props: { class: 'i-x' } }).classes()).toContain('i-x')
      expect(mount(BreadcrumbPage, { props: { class: 'p-x' } }).classes()).toContain('p-x')
      expect(mount(BreadcrumbSeparator, { props: { class: 's-x' } }).classes()).toContain('s-x')
      expect(mount(BreadcrumbEllipsis, { props: { class: 'e-x' } }).classes()).toContain('e-x')
      expect(mount(BreadcrumbLink, { props: { class: 'l-x text-red-500' } }).classes()).toContain('l-x')
    })

    it('custom aria label via `label`', () => {
      expect(mount(Breadcrumb, { props: { items, label: 'Trail' } }).attributes('aria-label')).toBe('Trail')
    })

    it('linkAs=RouterLink forwards `to`', () => {
      const w = mount(Breadcrumb, {
        props: { items: [{ label: 'A', to: '/a' }, { label: 'B', to: { name: 'b' } }, { label: 'C' }], linkAs: RouterLinkStub },
      })
      const links = w.findAll('[data-router]')
      expect(links.map((l) => l.attributes('href'))).toEqual(['/a', '/obj'])
      expect(links[0].attributes('data-slot')).toBe('breadcrumb-link')
    })

    it('BreadcrumbLink as RouterLink falls back to href; asChild and plain `to` string work', () => {
      expect(mount(BreadcrumbLink, { props: { as: RouterLinkStub, href: '/h' } }).attributes('href')).toBe('/h')
      expect(mount(BreadcrumbLink, { props: { to: '/t' } }).attributes('href')).toBe('/t')
      const w = mount(BreadcrumbLink, { props: { asChild: true }, slots: { default: '<a href="/c">C</a>' } })
      expect(w.attributes('href')).toBe('/c')
      expect(w.attributes('data-slot')).toBe('breadcrumb-link')
      expect(mount(BreadcrumbLink, { props: { as: 'span' } }).attributes('href')).toBeUndefined()
    })

    it('link slot lets the consumer render links', () => {
      const w = mount(Breadcrumb, {
        props: { items },
        slots: { link: '<template #link="{ item }"><a class="mine">{{ item.label }}</a></template>' },
      })
      expect(w.findAll('.mine')).toHaveLength(3)
    })

    it('attrs fall through to the nav', () => {
      expect(mount(Breadcrumb, { props: { items }, attrs: { id: 'bc', 'data-x': '1' } }).attributes('id')).toBe('bc')
    })
  })

  describe('bad path', () => {
    it('empty or missing items render an empty nav without a list', () => {
      expect(mount(Breadcrumb, { props: { items: [] } }).find('ol').exists()).toBe(false)
      expect(mount(Breadcrumb).find('ol').exists()).toBe(false)
    })

    it('ignores malformed entries', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Breadcrumb, { props: { items: [null, { label: 5 }, { label: 'Ok' }] } })
      expect(w.findAll('[data-slot="breadcrumb-item"]')).toHaveLength(1)
      expect(w.find('[data-slot="breadcrumb-page"]').text()).toBe('Ok')
    })

    it('non-array items fall back to the slot', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Breadcrumb, { props: { items: 'nope' }, slots: { default: '<p class="fallback">slot</p>' } })
      expect(w.find('.fallback').exists()).toBe(true)
    })

    it('a link item without href/to renders an anchor with no href', () => {
      const w = mount(Breadcrumb, { props: { items: [{ label: 'X' }, { label: 'Y' }] } })
      expect(w.find('[data-slot="breadcrumb-link"]').attributes('href')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('a single item is just the current page, no separator', () => {
      const w = mount(Breadcrumb, { props: { items: [{ label: 'Only' }] } })
      expect(w.find('[data-slot="breadcrumb-page"]').text()).toBe('Only')
      expect(w.find('[data-slot="breadcrumb-separator"]').exists()).toBe(false)
      expect(w.find('[data-slot="breadcrumb-link"]').exists()).toBe(false)
    })

    it('very long and unicode labels render intact', () => {
      const long = 'ж'.repeat(400)
      const w = mount(Breadcrumb, { props: { items: [{ label: long, href: '/' }, { label: 'שלום' }] } })
      expect(w.find('[data-slot="breadcrumb-link"]').text()).toBe(long)
      expect(w.find('[data-slot="breadcrumb-page"]').text()).toBe('שלום')
    })

    it('1000 items with truncation stay cheap and correct', () => {
      const lots = Array.from({ length: 1000 }, (_, i) => ({ label: `n${i}`, href: `/${i}` }))
      const w = mount(Breadcrumb, { props: { items: lots, maxItems: 5 } })
      expect(w.findAll('[data-slot="breadcrumb-item"]')).toHaveLength(6)
      expect(w.find('[data-slot="breadcrumb-ellipsis"]').attributes('aria-label')).toBe('Show 995 hidden items')
    })

    it('rapid ellipsis clicks are harmless', async () => {
      const w = mount(Breadcrumb, { props: { items: many, maxItems: 4 } })
      const btn = w.find('[data-slot="breadcrumb-ellipsis"]')
      await btn.trigger('click')
      expect(w.findAll('[data-slot="breadcrumb-item"]')).toHaveLength(8)
    })
  })
})
