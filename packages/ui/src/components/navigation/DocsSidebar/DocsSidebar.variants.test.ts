import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import DocsSidebar, { type DocsSidebarSection } from './DocsSidebar.vue'
import { DOCS_SIDEBAR_RAIL_LINK, DOCS_SIDEBAR_SIZES, DOCS_SIDEBAR_VARIANTS, docsSidebarListVariants, docsSidebarTitleVariants, docsSidebarVariants } from './index'

const sections: DocsSidebarSection[] = [
  { title: 'Start', items: [{ label: 'Intro', href: '/docs/intro' }, { label: 'Install', href: '/docs/install', badge: 'new' }] },
  { title: 'Guides', items: [{ label: 'Theming', href: '/docs/theming' }] },
]
const make = (props: Record<string, unknown> = {}) => mount(DocsSidebar, { props: { sections, ...props } })
const links = (w: ReturnType<typeof make>) => w.findAll('[data-slot="nav-link"]')

describe('DocsSidebar variations', () => {
  it('default output is unchanged: pill links, sm height, w-full, gap-6', () => {
    const w = make({ current: '/docs/intro' })
    expect(w.attributes('data-variant')).toBe('default')
    expect(w.attributes('data-size')).toBe('md')
    expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'gap-6', 'text-sm']))
    expect(docsSidebarVariants()).toBe('flex flex-col gap-6 text-sm')
    expect(docsSidebarTitleVariants()).toBe('mb-2 px-2 text-sm font-semibold text-muted-foreground')
    expect(docsSidebarListVariants()).toBe('flex flex-col gap-0.5')
    expect(links(w)[0].classes()).toEqual(expect.arrayContaining(['h-8', 'w-full', 'hover:bg-accent', 'aria-[current=page]:bg-accent']))
    expect(w.get('ul').classes()).toContain('gap-0.5')
  })

  it('compact tightens section, title and list spacing', () => {
    const w = make({ variant: 'compact' })
    expect(w.classes()).toContain('gap-4')
    expect(w.classes()).not.toContain('gap-6')
    expect(w.get('[data-slot="docs-sidebar-title"]').classes()).toContain('mb-1')
    expect(w.get('[data-slot="docs-sidebar-title"]').classes()).not.toContain('mb-2')
    expect(w.get('ul').classes()).toContain('gap-0')
    expect(links(w)[0].classes()).toContain('hover:bg-accent')
  })

  it('rail puts plain links on a vertical rule with a current-page marker', () => {
    const w = make({ variant: 'rail', current: '/docs/install' })
    expect(w.attributes('data-variant')).toBe('rail')
    expect(w.get('ul').classes()).toContain('border-s')
    const link = links(w)[1]
    for (const c of DOCS_SIDEBAR_RAIL_LINK.split(' ')) expect(link.classes(), c).toContain(c)
    expect(link.classes()).not.toContain('hover:bg-accent')
    expect(link.classes()).toContain('rounded-s-none')
    expect(link.classes()).toContain('forced-colors:aria-[current=page]:underline')
    expect(link.attributes('aria-current')).toBe('page')
  })

  it.each([
    ['sm', 'h-6'],
    ['md', 'h-8'],
    ['lg', 'h-9'],
  ])('size %s uses %s links', (size, height) => {
    const w = make({ size })
    expect(w.attributes('data-size')).toBe(size)
    for (const l of links(w)) expect(l.classes()).toContain(height)
  })

  it('unknown variant and size fall back to the defaults', () => {
    const w = make({ variant: 'boxed', size: 'xxl' })
    expect(w.html()).toBe(make().html())
  })

  it('every variant and size renders different markup', () => {
    expect(new Set(DOCS_SIDEBAR_VARIANTS.map((variant) => make({ variant }).html())).size).toBe(3)
    expect(new Set(DOCS_SIDEBAR_SIZES.map((size) => make({ size }).html())).size).toBe(3)
  })

  it.each(DOCS_SIDEBAR_VARIANTS)('%s keeps the landmark, list names, badges and navigate events', async (variant) => {
    const w = make({ variant, size: 'sm', label: 'Guides' })
    expect(w.attributes('aria-label')).toBe('Guides')
    const title = w.get('[data-slot="docs-sidebar-title"]')
    expect(w.get('ul').attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(w.text()).toContain('new')
    await links(w)[0].trigger('click')
    expect(w.emitted('navigate')).toHaveLength(1)
  })

  it('class on the nav wins and exported variants merge through cn()', () => {
    expect(make({ variant: 'compact', class: 'gap-10' }).classes()).toContain('gap-10')
    expect(cn(docsSidebarVariants({ variant: 'compact' }))).not.toContain('gap-6')
    expect(cn(docsSidebarListVariants({ variant: 'rail' }))).toContain('border-s')
  })

  it('handles an empty-looking section list and long labels', () => {
    const long = 'A very long documentation page title '.repeat(6).trim()
    const w = make({ variant: 'rail', sections: [{ title: 'Long', items: [{ label: long, href: '/l' }] }] })
    expect(links(w)[0].text()).toBe(long)
    expect(links(w)[0].get('[data-slot="nav-link-label"]').classes()).toContain('truncate')
  })
})
