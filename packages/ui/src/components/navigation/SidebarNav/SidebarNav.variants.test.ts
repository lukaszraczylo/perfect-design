import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faGear, faHouse } from '@fortawesome/free-solid-svg-icons'
import { cn } from '../../../lib/cn'
import SidebarNav, { type SidebarNavGroup } from './SidebarNav.vue'
import { SIDEBAR_NAV_SIZES, SIDEBAR_NAV_VARIANTS, SIDEBAR_RAIL_TILE, sidebarNavGroupLabelVariants, sidebarNavVariants } from './index'

const groups: SidebarNavGroup[] = [
  { label: 'Main', items: [{ label: 'Home', href: '/', icon: faHouse }, { label: 'Alerts', href: '/alerts', badge: 4 }] },
  { label: 'Admin', items: [{ label: 'Settings', icon: faGear, children: [{ label: 'Profile', href: '/p' }, { label: 'Billing', href: '/b' }] }] },
]
const make = (props: Record<string, unknown> = {}) => mount(SidebarNav, { props: { groups, ...props } })
const links = (w: ReturnType<typeof make>) => w.findAll('[data-slot="nav-link"]')

describe('SidebarNav variations', () => {
  describe('defaults are unchanged', () => {
    it('keeps today\'s surface, width and link sizes', () => {
      const w = make({ current: '/' })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'h-full', 'max-w-full', 'flex-col', 'gap-4', 'overflow-y-auto', 'border-e', 'border-sidebar-border', 'bg-sidebar', 'p-2', 'w-60']))
      expect(sidebarNavVariants()).toContain('w-60')
      expect(links(w)[0].classes()).toContain('h-9')
      expect(w.get('[data-slot="sidebar-nav-group-label"]').classes()).toEqual(expect.arrayContaining(['px-3', 'pb-1', 'text-xs', 'font-semibold']))
    })

    it('sub-items stay one step smaller (32px)', async () => {
      const w = make({ current: '/p' })
      expect(w.findAll('[data-slot="sidebar-nav-children"] [data-slot="nav-link"]')[0].classes()).toContain('h-8')
    })
  })

  describe('variant compact', () => {
    it('is denser and narrower', () => {
      const w = make({ variant: 'compact' })
      expect(w.attributes('data-variant')).toBe('compact')
      expect(w.classes()).toEqual(expect.arrayContaining(['gap-3', 'p-1.5', 'w-52']))
      expect(w.classes()).not.toContain('gap-4')
      expect(w.classes()).not.toContain('p-2')
      expect(w.classes()).not.toContain('w-60')
      expect(w.get('[data-slot="sidebar-nav-group-label"]').classes()).toContain('px-2')
      expect(w.get('[data-slot="sidebar-nav-group-label"]').classes()).not.toContain('px-3')
    })

    it('collapsed still wins and shrinks to the icon strip', () => {
      const w = make({ variant: 'compact', collapsed: true })
      expect(w.classes()).toContain('w-14')
      expect(w.classes()).not.toContain('w-52')
      expect(w.find('[data-slot="sidebar-nav-group-label"]').exists()).toBe(false)
    })
  })

  describe('variant rail', () => {
    it('renders tiles: icon above a centred short label, 80px wide', () => {
      const w = make({ variant: 'rail' })
      expect(w.attributes('data-variant')).toBe('rail')
      expect(w.classes()).toContain('w-20')
      expect(w.classes()).not.toContain('w-60')
      const home = links(w)[0]
      for (const c of SIDEBAR_RAIL_TILE.split(' ')) expect(home.classes(), c).toContain(c)
      expect(home.classes()).not.toContain('h-9')
      expect(home.classes()).not.toContain('px-3')
      expect(home.get('[data-slot="nav-link-label"]').text()).toBe('Home')
      expect(home.attributes('title')).toBe('Home')
      expect(w.get('[data-slot="sidebar-nav-group-label"]').classes()).toContain('text-center')
    })

    it('parent tiles toggle their children below, without the inline-start indent', async () => {
      const w = make({ variant: 'rail' })
      const parent = w.get('[data-slot="sidebar-nav-parent"]')
      expect(parent.attributes('aria-expanded')).toBe('false')
      expect(parent.classes()).toContain('flex-col')
      expect(parent.attributes('title')).toBe('Settings')
      expect(parent.get('svg:last-of-type').classes()).not.toContain('ms-auto')
      await parent.trigger('click')
      expect(parent.attributes('aria-expanded')).toBe('true')
      const list = w.get('[data-slot="sidebar-nav-children"]')
      expect(list.classes()).toContain('border-t')
      expect(list.classes()).not.toContain('ms-4')
      expect(list.findAll('[data-slot="nav-link"]')[0].classes()).toContain('flex-col')
      expect(parent.attributes('aria-controls')).toBe(list.attributes('id'))
    })

    it('collapsed turns the rail into icons only (no tiles, labels screen-reader only)', () => {
      const w = make({ variant: 'rail', collapsed: true })
      expect(w.classes()).toContain('w-14')
      expect(links(w)[0].classes()).not.toContain('flex-col')
      expect(links(w)[0].get('[data-slot="nav-link-label"]').classes()).toContain('sr-only')
    })

    it('the default variant keeps its indented child list', async () => {
      const w = make()
      await w.get('[data-slot="sidebar-nav-parent"]').trigger('click')
      expect(w.get('[data-slot="sidebar-nav-children"]').classes()).toEqual(expect.arrayContaining(['ms-4', 'border-s', 'ps-2']))
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'h-8', 'h-6'],
      ['md', 'h-9', 'h-8'],
      ['lg', 'h-11', 'h-9'],
    ])('%s sets %s links and %s sub-items', async (size, top, child) => {
      const w = make({ size, current: '/p' })
      expect(w.attributes('data-size')).toBe(size)
      expect(links(w)[0].classes()).toContain(top)
      expect(w.get('[data-slot="sidebar-nav-parent"]').classes()).toContain(top)
      expect(w.findAll('[data-slot="sidebar-nav-children"] [data-slot="nav-link"]')[0].classes()).toContain(child)
    })

    it('unknown size and variant fall back to the defaults', () => {
      const w = make({ size: 'huge', variant: 'floating' })
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.classes()).toContain('w-60')
      expect(links(w)[0].classes()).toContain('h-9')
    })

    it('every variant and size renders different markup', () => {
      expect(new Set(SIDEBAR_NAV_VARIANTS.map((variant) => make({ variant }).html())).size).toBe(3)
      expect(new Set(SIDEBAR_NAV_SIZES.map((size) => make({ size }).html())).size).toBe(3)
    })
  })

  describe('combinations and behaviour', () => {
    it.each(SIDEBAR_NAV_VARIANTS)('%s keeps landmark, groups, aria-current and navigate events', async (variant) => {
      const w = make({ variant, size: 'sm', current: '/alerts', label: 'App' })
      expect(w.attributes('aria-label')).toBe('App')
      expect(w.findAll('[role="group"]')).toHaveLength(2)
      expect(links(w).filter((l) => l.attributes('aria-current') === 'page')).toHaveLength(1)
      await links(w)[0].trigger('click')
      expect(w.emitted('navigate')).toHaveLength(1)
    })

    it('collapsed parent click still asks the parent to expand, in every variant', async () => {
      for (const variant of SIDEBAR_NAV_VARIANTS) {
        const w = make({ variant, collapsed: true })
        await w.get('[data-slot="sidebar-nav-parent"]').trigger('click')
        expect(w.emitted('update:collapsed')?.[0]).toEqual([false])
      }
    })

    it('class wins over the variant width', () => {
      const w = make({ variant: 'rail', class: 'w-32 bg-red-500' })
      expect(w.classes()).toContain('w-32')
      expect(w.classes()).not.toContain('w-20')
      expect(w.classes()).toContain('bg-red-500')
    })

    it('exported variants resolve through cn()', () => {
      expect(cn(sidebarNavVariants({ variant: 'compact' }))).not.toContain('gap-4')
      expect(cn(sidebarNavVariants({ variant: 'rail', collapsed: true }))).toContain('w-14')
      expect(cn(sidebarNavGroupLabelVariants({ variant: 'compact' }))).not.toContain('px-3')
    })

    it('handles long labels and badges in the rail without overflow classes missing', () => {
      const long = 'An extremely long destination label '.repeat(4).trim()
      const w = make({ variant: 'rail', groups: [{ items: [{ label: long, href: '/x', badge: 99 }] }] })
      const label = w.get('[data-slot="nav-link-label"]')
      expect(label.classes()).toContain('truncate')
      expect(label.text()).toBe(long)
      expect(w.classes()).toContain('max-w-full')
    })
  })
})
