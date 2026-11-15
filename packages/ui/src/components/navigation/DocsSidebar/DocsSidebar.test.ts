import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import DocsSidebar, { type DocsSidebarSection } from './DocsSidebar.vue'

const RouterLinkStub = defineComponent({
  props: { to: { type: [String, Object], default: undefined } },
  setup: (p, { slots }) => () => h('a', { href: typeof p.to === 'string' ? p.to : '/obj', 'data-router': '' }, slots.default?.()),
})

const sections: DocsSidebarSection[] = [
  { title: 'Start', items: [{ label: 'Intro', href: '/docs/intro' }, { label: 'Install', href: '/docs/install', badge: 'new' }] },
  { title: 'Guides', items: [{ label: 'Theming', href: '/docs/theming' }] },
]
const links = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="nav-link"]')

describe('DocsSidebar', () => {
  describe('good path', () => {
    it('renders a nav with titled sections and link lists', () => {
      const w = mount(DocsSidebar, { props: { sections } })
      expect(w.element.tagName).toBe('NAV')
      expect(w.attributes('aria-label')).toBe('Documentation')
      expect(w.attributes('data-slot')).toBe('docs-sidebar')
      expect(w.findAll('[data-slot="docs-sidebar-title"]').map((t) => t.text())).toEqual(['Start', 'Guides'])
      expect(links(w)).toHaveLength(3)
    })

    it('each list is labelled by its section title', () => {
      const w = mount(DocsSidebar, { props: { sections } })
      const title = w.find('[data-slot="docs-sidebar-title"]')
      expect(w.find('ul').attributes('aria-labelledby')).toBe(title.attributes('id'))
    })

    it('marks the link matching `current`', () => {
      const w = mount(DocsSidebar, { props: { sections, current: '/docs/install' } })
      expect(links(w).map((l) => l.attributes('aria-current'))).toEqual([undefined, 'page', undefined])
    })

    it('explicit `active` wins over `current`', () => {
      const w = mount(DocsSidebar, { props: { sections: [{ title: 'T', items: [{ label: 'A', href: '/a', active: true }] }], current: '/zzz' } })
      expect(links(w)[0].attributes('aria-current')).toBe('page')
    })

    it('renders badges and emits navigate', async () => {
      const w = mount(DocsSidebar, { props: { sections } })
      expect(links(w)[1].find('[data-slot="nav-link-badge"]').text()).toBe('new')
      await links(w)[2].trigger('click')
      expect((w.emitted('navigate')![0][0] as { label: string }).label).toBe('Theming')
    })

    it('linkAs=RouterLink forwards `to`', () => {
      const w = mount(DocsSidebar, { props: { sections: [{ title: 'T', items: [{ label: 'R', to: '/r' }] }], linkAs: RouterLinkStub, current: '/r' } })
      expect(w.find('[data-router]').attributes('href')).toBe('/r')
      expect(w.find('[data-router]').attributes('aria-current')).toBe('page')
    })
  })

  describe('customisation', () => {
    it('merges class, label and attrs', () => {
      const w = mount(DocsSidebar, { props: { sections, class: 'gap-2 custom-x', label: 'Guide' }, attrs: { id: 'ds' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('gap-2')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('aria-label')).toBe('Guide')
      expect(w.attributes('id')).toBe('ds')
    })
  })

  describe('bad path', () => {
    it('empty or invalid sections render an empty nav', () => {
      expect(mount(DocsSidebar, { props: { sections: [] } }).findAll('section')).toHaveLength(0)
      // @ts-expect-error deliberately invalid
      expect(mount(DocsSidebar, { props: { sections: undefined } }).findAll('section')).toHaveLength(0)
    })

    it('skips malformed sections and links', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(DocsSidebar, { props: { sections: [null, { title: 'x' }, { title: 'Y', items: [null, { label: 1 }, { label: 'Ok', href: '/' }] }] } })
      expect(links(w)).toHaveLength(1)
    })

    it('links with no target are inactive anchors without href', () => {
      const w = mount(DocsSidebar, { props: { sections: [{ title: 'T', items: [{ label: 'Plain' }] }], current: '/x' } })
      expect(links(w)[0].attributes('href')).toBeUndefined()
      expect(links(w)[0].attributes('aria-current')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('duplicate labels and missing ids still render', () => {
      const w = mount(DocsSidebar, { props: { sections: [{ title: 'T', items: [{ label: 'Same', href: '/1' }, { label: 'Same', href: '/2' }] }] } })
      expect(links(w)).toHaveLength(2)
    })

    it('very long unicode titles/labels render intact', () => {
      const long = '界'.repeat(300)
      const w = mount(DocsSidebar, { props: { sections: [{ title: long, items: [{ label: long, href: '/' }] }] } })
      expect(w.find('[data-slot="docs-sidebar-title"]').text()).toBe(long)
      expect(links(w)[0].text()).toBe(long)
    })

    it('current changes update the active link reactively', async () => {
      const w = mount(DocsSidebar, { props: { sections, current: '/docs/intro' } })
      await w.setProps({ current: '/docs/theming' })
      expect(links(w).map((l) => l.attributes('aria-current'))).toEqual([undefined, undefined, 'page'])
    })
  })
})
