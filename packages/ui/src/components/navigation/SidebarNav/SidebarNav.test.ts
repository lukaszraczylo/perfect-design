import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faGear, faHouse } from '@fortawesome/free-solid-svg-icons'
import { defineComponent, h } from 'vue'
import SidebarNav, { type SidebarNavGroup } from './SidebarNav.vue'
import { NAV_IS_ACTIVE_KEY } from '../NavLink'

const RouterLinkStub = defineComponent({
  props: { to: { type: [String, Object], default: undefined } },
  setup: (p, { slots }) => () => h('a', { href: typeof p.to === 'string' ? p.to : '/obj', 'data-router': '' }, slots.default?.()),
})

const groups: SidebarNavGroup[] = [
  {
    label: 'Main',
    items: [
      { label: 'Home', href: '/', icon: faHouse },
      { label: 'Alerts', href: '/alerts', badge: 4 },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        label: 'Settings',
        icon: faGear,
        children: [
          { label: 'Profile', href: '/settings/profile' },
          { label: 'Billing', href: '/settings/billing' },
        ],
      },
    ],
  },
]
const links = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="nav-link"]')

describe('SidebarNav', () => {
  describe('good path', () => {
    it('renders a labelled nav with groups and items', () => {
      const w = mount(SidebarNav, { props: { groups } })
      expect(w.element.tagName).toBe('NAV')
      expect(w.attributes('aria-label')).toBe('Sidebar')
      expect(w.attributes('data-slot')).toBe('sidebar-nav')
      expect(w.findAll('[data-slot="sidebar-nav-group"]')).toHaveLength(2)
      expect(w.findAll('[data-slot="sidebar-nav-group-label"]').map((l) => l.text())).toEqual(['Main', 'Admin'])
      expect(links(w)).toHaveLength(2)
      expect(w.find('[data-slot="sidebar-nav-group"]').attributes('role')).toBe('group')
    })

    it('uses sidebar tokens', () => {
      const w = mount(SidebarNav, { props: { groups } })
      expect(w.classes()).toContain('bg-sidebar')
      expect(links(w)[0].classes().join(' ')).toContain('text-sidebar-foreground')
    })

    it('renders icons and badges', () => {
      const w = mount(SidebarNav, { props: { groups } })
      expect(links(w)[0].find('svg').exists()).toBe(true)
      expect(links(w)[1].find('[data-slot="nav-link-badge"]').text()).toBe('4')
    })

    it('marks the item matching `current` with aria-current', () => {
      const w = mount(SidebarNav, { props: { groups, current: '/alerts' } })
      expect(links(w).map((l) => l.attributes('aria-current'))).toEqual([undefined, 'page'])
    })

    it('an item `active` flag beats `current`; the injected predicate is the fallback', () => {
      const flagged: SidebarNavGroup[] = [{ items: [{ label: 'A', href: '/a', active: true }, { label: 'B', href: '/b' }] }]
      const w = mount(SidebarNav, { props: { groups: flagged, current: '/b' } })
      expect(links(w).map((l) => l.attributes('aria-current'))).toEqual(['page', 'page'])
      const p = mount(SidebarNav, { props: { groups: flagged.map((g) => ({ ...g, items: [{ label: 'B', href: '/b' }] })) }, global: { provide: { [NAV_IS_ACTIVE_KEY as symbol]: (t: string) => t === '/b' } } })
      expect(links(p)[0].attributes('aria-current')).toBe('page')
    })

    it('emits navigate with the item and the click event', async () => {
      const w = mount(SidebarNav, { props: { groups } })
      await links(w)[1].trigger('click')
      const [item, ev] = w.emitted('navigate')![0] as [{ label: string }, MouseEvent]
      expect(item.label).toBe('Alerts')
      expect(ev).toBeInstanceOf(MouseEvent)
    })

    it('renders header and footer slots with the collapsed flag', () => {
      const w = mount(SidebarNav, {
        props: { groups, collapsed: true },
        slots: { header: '<template #header="{ collapsed }"><i class="h">{{ collapsed }}</i></template>', footer: '<b class="f">foot</b>' },
      })
      expect(w.find('.h').text()).toBe('true')
      expect(w.find('.f').exists()).toBe(true)
    })

    it('linkAs=RouterLink forwards `to`', () => {
      const w = mount(SidebarNav, { props: { groups: [{ items: [{ label: 'R', to: '/r' }] }], linkAs: RouterLinkStub } })
      expect(w.find('[data-router]').attributes('href')).toBe('/r')
    })
  })

  describe('children', () => {
    it('renders a parent button, closed by default, toggling aria-expanded', async () => {
      const w = mount(SidebarNav, { props: { groups } })
      const parent = w.find('[data-slot="sidebar-nav-parent"]')
      expect(parent.attributes('aria-expanded')).toBe('false')
      expect(w.find('[data-slot="sidebar-nav-children"]').exists()).toBe(false)
      await parent.trigger('click')
      expect(parent.attributes('aria-expanded')).toBe('true')
      expect(parent.attributes('aria-controls')).toBe(w.find('[data-slot="sidebar-nav-children"]').attributes('id'))
      expect(links(w).map((l) => l.text())).toContain('Billing')
      await parent.trigger('click')
      expect(w.find('[data-slot="sidebar-nav-children"]').exists()).toBe(false)
    })

    it('starts open when a child is active', () => {
      const w = mount(SidebarNav, { props: { groups, current: '/settings/billing' } })
      expect(w.find('[data-slot="sidebar-nav-parent"]').attributes('aria-expanded')).toBe('true')
      expect(links(w).find((l) => l.text() === 'Billing')!.attributes('aria-current')).toBe('page')
    })

    it('an explicit user toggle beats the active-child default', async () => {
      const w = mount(SidebarNav, { props: { groups, current: '/settings/billing' } })
      await w.find('[data-slot="sidebar-nav-parent"]').trigger('click')
      expect(w.find('[data-slot="sidebar-nav-children"]').exists()).toBe(false)
    })

    it('emits navigate for children', async () => {
      const w = mount(SidebarNav, { props: { groups, current: '/settings/billing' } })
      await links(w).find((l) => l.text() === 'Profile')!.trigger('click')
      expect((w.emitted('navigate')![0][0] as { label: string }).label).toBe('Profile')
    })
  })

  describe('collapsed', () => {
    it('shows icon-only links with title tooltips and keeps labels for screen readers', () => {
      const w = mount(SidebarNav, { props: { groups, collapsed: true } })
      expect(w.attributes('data-collapsed')).toBeDefined()
      expect(w.classes()).toContain('w-14')
      expect(links(w)[0].attributes('title')).toBe('Home')
      expect(links(w)[0].find('[data-slot="nav-link-label"]').classes()).toContain('sr-only')
      expect(w.find('[data-slot="sidebar-nav-group-label"]').exists()).toBe(false)
      expect(links(w)[1].find('[data-slot="nav-link-badge"]').exists()).toBe(false)
    })

    it('a parent with children asks to expand instead of opening a sub-list', async () => {
      const w = mount(SidebarNav, { props: { groups, collapsed: true } })
      const parent = w.find('[data-slot="sidebar-nav-parent"]')
      expect(parent.attributes('title')).toBe('Settings')
      expect(parent.attributes('aria-expanded')).toBeUndefined()
      await parent.trigger('click')
      expect(w.emitted('update:collapsed')![0]).toEqual([false])
      expect(w.find('[data-slot="sidebar-nav-children"]').exists()).toBe(false)
      await w.setProps({ collapsed: false })
      expect(w.find('[data-slot="sidebar-nav-children"]').exists()).toBe(true)
    })

    it('expanded width is w-60', () => {
      expect(mount(SidebarNav, { props: { groups } }).classes()).toContain('w-60')
    })
  })

  describe('customisation', () => {
    it('merges class and lets it override width', () => {
      const w = mount(SidebarNav, { props: { groups, class: 'w-80 custom-x' } })
      expect(w.classes()).toContain('w-80')
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).not.toContain('w-60')
    })

    it('custom aria label and attrs', () => {
      const w = mount(SidebarNav, { props: { groups, label: 'Primary' }, attrs: { id: 'sb' } })
      expect(w.attributes('aria-label')).toBe('Primary')
      expect(w.attributes('id')).toBe('sb')
    })
  })

  describe('bad path', () => {
    it('empty, null or non-array groups render an empty nav', () => {
      expect(links(mount(SidebarNav, { props: { groups: [] } }))).toHaveLength(0)
      // @ts-expect-error deliberately invalid
      expect(links(mount(SidebarNav, { props: { groups: null } }))).toHaveLength(0)
    })

    it('skips malformed groups and items', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SidebarNav, { props: { groups: [null, { label: 'x' }, { items: [null, { label: 3 }, { label: 'Ok', href: '/ok' }] }] } })
      expect(links(w)).toHaveLength(1)
      expect(links(w)[0].text()).toBe('Ok')
    })

    it('items without ids are keyed by label; missing href renders an anchor without href', () => {
      const w = mount(SidebarNav, { props: { groups: [{ items: [{ label: 'No target' }] }] } })
      expect(links(w)[0].attributes('href')).toBeUndefined()
    })

    it('disabled items are inert', async () => {
      const w = mount(SidebarNav, { props: { groups: [{ items: [{ label: 'Off', href: '/x', disabled: true }, { label: 'P', disabled: true, children: [{ label: 'C' }] }] }] } })
      await links(w)[0].trigger('click')
      expect(w.emitted('navigate')).toBeUndefined()
      expect(links(w)[0].attributes('aria-disabled')).toBe('true')
      expect(w.find('[data-slot="sidebar-nav-parent"]').attributes('disabled')).toBeDefined()
    })

    it('a group without a label has no heading and no aria-label', () => {
      const w = mount(SidebarNav, { props: { groups: [{ items: [{ label: 'A', href: '/' }] }] } })
      expect(w.find('[data-slot="sidebar-nav-group-label"]').exists()).toBe(false)
      expect(w.find('[data-slot="sidebar-nav-group"]').attributes('aria-label')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('very long labels are truncated by class, text intact', () => {
      const long = 'Ж'.repeat(300)
      const w = mount(SidebarNav, { props: { groups: [{ items: [{ label: long, href: '/' }] }] } })
      expect(links(w)[0].find('[data-slot="nav-link-label"]').classes()).toContain('truncate')
      expect(links(w)[0].text()).toBe(long)
    })

    it('1000 items render', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({ label: `Item ${i}`, href: `/${i}` }))
      expect(links(mount(SidebarNav, { props: { groups: [{ items }] } }))).toHaveLength(1000)
    })

    it('rapid toggles of a parent end in the expected state', async () => {
      const w = mount(SidebarNav, { props: { groups } })
      const parent = w.find('[data-slot="sidebar-nav-parent"]')
      for (let i = 0; i < 5; i++) await parent.trigger('click')
      expect(parent.attributes('aria-expanded')).toBe('true')
    })

    it('collapsed toggling is reactive both ways', async () => {
      const w = mount(SidebarNav, { props: { groups } })
      await w.setProps({ collapsed: true })
      expect(w.classes()).toContain('w-14')
      await w.setProps({ collapsed: false })
      expect(w.classes()).toContain('w-60')
    })

    it('a collapsed rail shows a separator instead of a label for later groups', () => {
      const w = mount(SidebarNav, { props: { groups, collapsed: true } })
      expect(w.findAll('[data-slot="sidebar-nav-group"]')[1].classes()).toContain('border-t')
    })
  })
})
