import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faHouse } from '@fortawesome/free-solid-svg-icons'
import { defineComponent, h } from 'vue'
import NavLink from './NavLink.vue'
import { NAV_IS_ACTIVE_KEY, navLinkVariants } from './index'

const RouterLinkStub = defineComponent({
  props: { to: { type: [String, Object], default: undefined } },
  setup: (p, { slots }) => () => h('a', { href: typeof p.to === 'string' ? p.to : '/obj', 'data-router': '' }, slots.default?.()),
})

const settle = () => new Promise((r) => setTimeout(r, 5))

describe('NavLink', () => {
  describe('good path', () => {
    it('renders an anchor with href, label and data-slot', () => {
      const w = mount(NavLink, { props: { href: '/docs' }, slots: { default: 'Docs' } })
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('href')).toBe('/docs')
      expect(w.attributes('data-slot')).toBe('nav-link')
      expect(w.find('[data-slot="nav-link-label"]').text()).toBe('Docs')
    })

    it('uses a string `to` as href on a plain anchor', () => {
      expect(mount(NavLink, { props: { to: '/x' }, slots: { default: 'X' } }).attributes('href')).toBe('/x')
    })

    it('sets aria-current="page" when active', () => {
      const w = mount(NavLink, { props: { href: '/', active: true }, slots: { default: 'Home' } })
      expect(w.attributes('aria-current')).toBe('page')
      expect(w.attributes('data-active')).toBeDefined()
    })

    it('is not current when active=false even if the injected predicate says yes', () => {
      const w = mount(NavLink, {
        props: { href: '/a', active: false },
        global: { provide: { [NAV_IS_ACTIVE_KEY as symbol]: () => true } },
      })
      expect(w.attributes('aria-current')).toBeUndefined()
    })

    it('resolves active state from the injected isActive predicate', () => {
      const provide = { [NAV_IS_ACTIVE_KEY as symbol]: (t: string) => t === '/here' }
      expect(mount(NavLink, { props: { href: '/here' }, global: { provide } }).attributes('aria-current')).toBe('page')
      expect(mount(NavLink, { props: { to: '/here' }, global: { provide } }).attributes('aria-current')).toBe('page')
      expect(mount(NavLink, { props: { href: '/elsewhere' }, global: { provide } }).attributes('aria-current')).toBeUndefined()
    })

    it('renders icon prop, icon slot, and badge prop/slot', () => {
      const w = mount(NavLink, { props: { href: '/', icon: faHouse, badge: 3 }, slots: { default: 'Home' } })
      expect(w.find('[data-slot="nav-link-icon"] svg').exists()).toBe(true)
      expect(w.find('[data-slot="nav-link-badge"]').text()).toBe('3')
      const s = mount(NavLink, { slots: { default: 'x', icon: '<i class="custom-icon" />', badge: '<b class="custom-badge">new</b>' } })
      expect(s.find('.custom-icon').exists()).toBe(true)
      expect(s.find('.custom-badge').exists()).toBe(true)
      expect(s.find('svg').exists()).toBe(false)
    })

    it('emits click', async () => {
      const w = mount(NavLink, { props: { href: '#' } })
      await settle()
      await w.trigger('click')
      expect(w.emitted('click')).toHaveLength(1)
    })
  })

  describe('customisation', () => {
    it.each(['default', 'pill', 'sidebar', 'underline'] as const)('applies the %s variant', (variant) => {
      const w = mount(NavLink, { props: { variant } })
      expect(w.classes().join(' ')).toContain(navLinkVariants({ variant }).split(' ').find((c) => c.includes('text-'))!)
    })

    it('sidebar variant uses sidebar tokens', () => {
      expect(mount(NavLink, { props: { variant: 'sidebar' } }).classes().join(' ')).toContain('text-sidebar-foreground')
    })

    it('size sm is shorter than md', () => {
      expect(mount(NavLink, { props: { size: 'sm' } }).classes()).toContain('h-8')
      expect(mount(NavLink).classes()).toContain('h-9')
    })

    it('merges class and lets it override', () => {
      const w = mount(NavLink, { props: { class: 'h-12 custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('h-12')
      expect(w.classes()).not.toContain('h-9')
    })

    it('passes attrs through', () => {
      const w = mount(NavLink, { attrs: { 'data-test': 'n', title: 'Tip', target: '_blank' } })
      expect(w.attributes('data-test')).toBe('n')
      expect(w.attributes('title')).toBe('Tip')
      expect(w.attributes('target')).toBe('_blank')
    })

    it('`as` component receives `to` (RouterLink style) and no href', () => {
      const w = mount(NavLink, { props: { as: RouterLinkStub, to: '/r' }, slots: { default: 'R' } })
      expect(w.attributes('data-router')).toBeDefined()
      expect(w.attributes('href')).toBe('/r')
      expect(w.attributes('data-slot')).toBe('nav-link')
    })

    it('`as` component falls back to href as `to` and forwards object targets', () => {
      expect(mount(NavLink, { props: { as: RouterLinkStub, href: '/h' } }).attributes('href')).toBe('/h')
      expect(mount(NavLink, { props: { as: RouterLinkStub, to: { name: 'x' } } }).attributes('href')).toBe('/obj')
    })

    it('asChild applies classes and aria-current to the child', () => {
      const w = mount(NavLink, { props: { asChild: true, active: true }, slots: { default: '<a href="/c">Child</a>' } })
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('href')).toBe('/c')
      expect(w.attributes('aria-current')).toBe('page')
      expect(w.classes()).toContain('inline-flex')
    })

    it('can render as a button', () => {
      const w = mount(NavLink, { props: { as: 'button' }, slots: { default: 'B' } })
      expect(w.element.tagName).toBe('BUTTON')
      expect(w.attributes('href')).toBeUndefined()
    })
  })

  describe('bad path', () => {
    it('disabled removes href, sets aria-disabled and blocks click', async () => {
      let clicked = 0
      const w = mount(NavLink, { props: { href: '/x', disabled: true }, attrs: { onClick: () => clicked++ } })
      await settle()
      expect(w.attributes('href')).toBeUndefined()
      expect(w.attributes('aria-disabled')).toBe('true')
      expect(w.attributes('tabindex')).toBe('-1')
      await w.trigger('click')
      expect(clicked).toBe(0)
    })

    it('inactive without any predicate, target or active', () => {
      expect(mount(NavLink).attributes('aria-current')).toBeUndefined()
      expect(mount(NavLink, { props: { to: { name: 'x' } } }).attributes('aria-current')).toBeUndefined()
    })

    it('a throwing predicate is treated as inactive', () => {
      const provide = {
        [NAV_IS_ACTIVE_KEY as symbol]: () => {
          throw new Error('boom')
        },
      }
      expect(mount(NavLink, { props: { href: '/a' }, global: { provide } }).attributes('aria-current')).toBeUndefined()
    })

    it('empty-string badge is not rendered', () => {
      expect(mount(NavLink, { props: { badge: '' } }).find('[data-slot="nav-link-badge"]').exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('collapsed keeps the label for screen readers and hides the badge', () => {
      const w = mount(NavLink, { props: { collapsed: true, badge: 9, icon: faHouse }, slots: { default: 'Home' } })
      expect(w.find('[data-slot="nav-link-label"]').classes()).toContain('sr-only')
      expect(w.text()).toBe('Home')
      expect(w.find('[data-slot="nav-link-badge"]').exists()).toBe(false)
    })

    it('badge of 0 is shown', () => {
      expect(mount(NavLink, { props: { badge: 0 } }).find('[data-slot="nav-link-badge"]').text()).toBe('0')
    })

    it('very long unicode labels are truncated via class, text intact', () => {
      const long = '日本語'.repeat(200)
      const w = mount(NavLink, { slots: { default: long } })
      expect(w.find('[data-slot="nav-link-label"]').classes()).toContain('truncate')
      expect(w.text()).toBe(long)
    })

    it('works without any slots or provide', () => {
      expect(mount(NavLink).text()).toBe('')
    })

    it('toggling active reactively updates aria-current', async () => {
      const w = mount(NavLink, { props: { active: false } })
      await w.setProps({ active: true })
      expect(w.attributes('aria-current')).toBe('page')
      await w.setProps({ active: false })
      expect(w.attributes('aria-current')).toBeUndefined()
    })
  })
})
