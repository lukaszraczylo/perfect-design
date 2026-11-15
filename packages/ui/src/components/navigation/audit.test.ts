/**
 * Regression tests for the navigation accessibility / responsiveness / slop audit.
 * Each block pins one fix so it cannot silently return.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { THEME_ACCENTS, useThemeStore } from '../../stores/theme'
import AccentPicker from './AccentPicker/AccentPicker.vue'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion'
import AppHeader from './AppHeader/AppHeader.vue'
import BackToTop from './BackToTop/BackToTop.vue'
import { Breadcrumb } from './Breadcrumb'
import DocsSidebar from './DocsSidebar/DocsSidebar.vue'
import { Menubar } from './Menubar'
import MobileNav from './MobileNav/MobileNav.vue'
import { NavigationMenu, NavigationMenuList, NavigationMenuViewport } from './NavigationMenu'
import NavLink from './NavLink/NavLink.vue'
import { navLinkVariants } from './NavLink/variants'
import Pagination from './Pagination/Pagination.vue'
import SidebarNav from './SidebarNav/SidebarNav.vue'
import SkipLink from './SkipLink/SkipLink.vue'
import Stepper from './Stepper/Stepper.vue'
import TableOfContents from './TableOfContents/TableOfContents.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants, tabsTriggerVariants } from './Tabs'
import ThemeToggle from './ThemeToggle/ThemeToggle.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})
beforeEach(() => localStorage.clear())
const settle = () => new Promise((r) => setTimeout(r, 5))

describe('SidebarNav', () => {
  const groups = [{ label: 'Group', items: [{ label: 'One', href: '/one' }, { label: 'Parent', children: [{ label: 'Child', href: '/c' }] }] }]

  it('group label uses a passing token pair and is not a tracked all-caps label', () => {
    wrapper = mount(SidebarNav, { props: { groups, current: '/c' } })
    const cls = wrapper.get('[data-slot="sidebar-nav-group-label"]').classes()
    expect(cls).toContain('text-sidebar-foreground')
    expect(cls.join(' ')).not.toMatch(/\/60|uppercase|tracking/)
  })

  it('uses logical properties and never forces horizontal overflow', () => {
    wrapper = mount(SidebarNav, { props: { groups, current: '/c' } })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['border-e', 'max-w-full']))
    expect(wrapper.classes()).not.toContain('border-r')
    const children = wrapper.get('[data-slot="sidebar-nav-children"]').classes()
    expect(children).toEqual(expect.arrayContaining(['ms-4', 'border-s', 'ps-2']))
    expect(children).not.toContain('ml-4')
    expect(wrapper.get('[data-slot="sidebar-nav-parent"] span.flex-1').classes()).toContain('text-start')
  })
})

describe('NavLink', () => {
  it('badge sits at the inline end and the current page is underlined in forced-colors mode', () => {
    wrapper = mount(NavLink, { props: { href: '/a', badge: 3 } })
    expect(wrapper.get('[data-slot="nav-link-badge"]').classes()).toContain('ms-auto')
    expect(navLinkVariants()).toContain('forced-colors:aria-[current=page]:underline')
  })
})

describe('DocsSidebar', () => {
  it('section titles are plain text, so the sidebar cannot break the heading order', () => {
    wrapper = mount(DocsSidebar, { props: { sections: [{ title: 'Guides', items: [{ label: 'A', href: '/a' }] }] } })
    expect(wrapper.find('h1,h2,h3,h4,h5,h6').exists()).toBe(false)
    expect(wrapper.find('section').exists()).toBe(false)
    const title = wrapper.get('[data-slot="docs-sidebar-title"]')
    expect(title.element.tagName).toBe('P')
    expect(title.classes().join(' ')).not.toMatch(/uppercase|tracking/)
    expect(wrapper.get('ul').attributes('aria-labelledby')).toBe(title.attributes('id'))
  })
})

describe('Tabs', () => {
  it('the list scrolls inside itself and triggers keep their size', () => {
    expect(tabsListVariants()).toContain('overflow-x-auto')
    expect(tabsListVariants()).toContain('max-w-full')
    expect(tabsTriggerVariants()).toContain('shrink-0')
  })

  it('uses logical borders for vertical lists and an underline for the active tab in forced colors', () => {
    expect(tabsListVariants({ variant: 'line' })).toContain('data-[orientation=vertical]:border-e')
    expect(tabsListVariants({ variant: 'line' })).not.toContain('border-r')
    expect(tabsTriggerVariants({ variant: 'line' })).toContain('data-[orientation=vertical]:border-e-2')
    expect(tabsTriggerVariants({ variant: 'line' })).not.toMatch(/-mr-px|\bborder-r\b/)
    expect(tabsTriggerVariants({ variant: 'pill' })).toContain('forced-colors:data-[state=active]:underline')
  })

  it('renders the scrollable list with a labelled tablist', () => {
    wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Tabs, { defaultValue: 'a' }, () => [
            h(TabsList, { 'aria-label': 'Sections' }, () => [h(TabsTrigger, { value: 'a' }, () => 'A')]),
            h(TabsContent, { value: 'a' }, () => 'Panel'),
          ]),
      }),
      { attachTo: document.body },
    )
    const list = document.body.querySelector('[role="tablist"]')!
    expect(list.getAttribute('aria-label')).toBe('Sections')
    expect(list.className).toContain('overflow-x-auto')
  })
})

describe('Accordion', () => {
  const make = (triggerProps: Record<string, unknown> = {}) =>
    mount(
      defineComponent({
        setup: () => () =>
          h(Accordion, { type: 'single', defaultValue: 'a' }, () => [
            h(AccordionItem, { value: 'a' }, () => [h(AccordionTrigger, triggerProps, () => 'Title'), h(AccordionContent, null, () => 'Body')]),
          ]),
      }),
      { attachTo: document.body },
    )

  it('wraps the trigger in an h3 by default and honours headingLevel', () => {
    wrapper = make()
    expect(document.body.querySelector('[data-slot="accordion-header"]')!.tagName).toBe('H3')
    wrapper.unmount()
    wrapper = make({ headingLevel: 2 })
    expect(document.body.querySelector('[data-slot="accordion-header"]')!.tagName).toBe('H2')
  })

  it('falls back to h3 for an invalid heading level', () => {
    wrapper = make({ headingLevel: 9 })
    expect(document.body.querySelector('[data-slot="accordion-header"]')!.tagName).toBe('H3')
  })

  it('aligns trigger text to the start edge and turns the animation off for reduced motion', () => {
    wrapper = make()
    const trigger = document.body.querySelector('[data-slot="accordion-trigger"]')!
    expect(trigger.className).toContain('text-start')
    expect(trigger.className).not.toContain('text-left')
    expect(document.body.querySelector('[data-slot="accordion-content"]')!.className).toContain('motion-reduce:animate-none')
  })
})

describe('Breadcrumb', () => {
  it('ellipsis stays a 24px target and grows on coarse pointers', async () => {
    wrapper = mount(Breadcrumb, { props: { maxItems: 2, items: [{ label: 'A', href: '/a' }, { label: 'B', href: '/b' }, { label: 'C' }] } })
    const btn = wrapper.get('[data-slot="breadcrumb-ellipsis"]')
    expect(btn.classes()).toEqual(expect.arrayContaining(['size-6', 'pointer-coarse:size-10']))
    expect(btn.attributes('aria-label')).toBe('Show 1 hidden item')
  })
})

describe('Pagination', () => {
  const mk = (props: Record<string, unknown>) => {
    wrapper = mount(Pagination, { props, attachTo: document.body })
    return wrapper
  }

  it('moves focus off a Next button that just became disabled', async () => {
    const w = mk({ total: 30, pageSize: 10, defaultPage: 2 })
    const next = w.get('[data-slot="pagination-next"]')
    ;(next.element as HTMLElement).focus()
    await next.trigger('click')
    await flushPromises()
    expect(w.get('[data-slot="pagination-next"]').attributes('disabled')).toBeDefined()
    expect(document.activeElement).toBe(w.get('[data-slot="pagination-prev"]').element)
  })

  it('moves focus to Next when Previous becomes disabled on page one', async () => {
    const w = mk({ total: 30, pageSize: 10, defaultPage: 2 })
    const prev = w.get('[data-slot="pagination-prev"]')
    ;(prev.element as HTMLElement).focus()
    await prev.trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(w.get('[data-slot="pagination-next"]').element)
  })

  it('leaves focus alone when the pressed button stays enabled', async () => {
    const w = mk({ total: 50, pageSize: 10, defaultPage: 2 })
    const next = w.get('[data-slot="pagination-next"]')
    ;(next.element as HTMLElement).focus()
    await next.trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(next.element)
  })

  it('page numbers are tabular, the row wraps and labels can name the landmark', () => {
    const w = mk({ total: 100, labels: { nav: 'Results pages' } })
    expect(w.attributes('aria-label')).toBe('Results pages')
    expect(w.classes()).toContain('flex-wrap')
    expect(w.get('[data-slot="pagination-page"]').classes()).toContain('tabular-nums')
    expect(w.get('[data-slot="pagination-summary"]').classes()).toContain('tabular-nums')
  })
})

describe('Stepper', () => {
  const steps = [{ title: 'One' }, { title: 'Two' }, { title: 'Three' }]

  it('horizontal: only the current title is visible on narrow screens, the rest stay readable by assistive tech', () => {
    wrapper = mount(Stepper, { props: { steps, current: 1 } })
    const texts = wrapper.findAll('[data-slot="stepper-text"]')
    expect(texts[0].classes()).toContain('max-sm:sr-only')
    expect(texts[1].classes()).not.toContain('max-sm:sr-only')
    expect(texts[2].classes()).toContain('max-sm:sr-only')
    expect(texts[0].text()).toContain('One')
  })

  it('vertical keeps every title visible and uses a logical connector offset', () => {
    wrapper = mount(Stepper, { props: { steps, current: 1, orientation: 'vertical' } })
    for (const t of wrapper.findAll('[data-slot="stepper-text"]')) expect(t.classes()).not.toContain('max-sm:sr-only')
    const sep = wrapper.get('[data-slot="stepper-separator"]').classes()
    expect(sep).toContain('ms-3.75')
    expect(sep.join(' ')).not.toMatch(/ml-\[/)
  })

  it('clickable steps align text to the start edge', () => {
    wrapper = mount(Stepper, { props: { steps, current: 0, clickable: true } })
    expect(wrapper.get('[data-slot="stepper-trigger"]').classes()).toContain('text-start')
  })
})

describe('TableOfContents', () => {
  it('uses logical borders and padding and no tracked all-caps title', () => {
    wrapper = mount(TableOfContents, { props: { items: [{ id: 'a', label: 'A', level: 2 }, { id: 'b', label: 'B', level: 3 }] } })
    const link = wrapper.findAll('[data-slot="table-of-contents-link"]')
    expect(link[0].classes()).toEqual(expect.arrayContaining(['border-s-2', 'pe-2', 'ps-3', '-ms-px']))
    expect(link[1].classes()).toContain('ps-6')
    expect(link[0].classes().join(' ')).not.toMatch(/\bpl-|\bpr-|border-l/)
    expect(wrapper.get('ul').classes()).toContain('border-s')
    expect(wrapper.get('[data-slot="table-of-contents-title"]').classes().join(' ')).not.toMatch(/uppercase|tracking/)
  })
})

describe('SkipLink and BackToTop', () => {
  it('SkipLink appears at the start edge', () => {
    wrapper = mount(SkipLink)
    expect(wrapper.classes()).toContain('focus:start-3')
    expect(wrapper.classes()).not.toContain('focus:left-3')
  })

  it('BackToTop is anchored to the end corner and its fade respects reduced motion', async () => {
    Object.defineProperty(window, 'scrollY', { value: 1000, configurable: true })
    wrapper = mount(BackToTop, { props: { threshold: 10 }, attachTo: document.body })
    window.dispatchEvent(new Event('scroll'))
    await flushPromises()
    const btn = wrapper.get('[data-slot="back-to-top"]')
    expect(btn.classes()).toEqual(expect.arrayContaining(['end-6', 'motion-reduce:animate-none']))
    expect(btn.classes()).not.toContain('right-6')
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })
})

describe('ThemeToggle', () => {
  it('the accessible name contains the visible mode text (WCAG 2.5.3)', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    for (const mode of ['light', 'dark', 'system'] as const) {
      useThemeStore().setMode(mode)
      wrapper = mount(ThemeToggle, { props: { variant: 'button' }, global: { plugins: [pinia] } })
      const visible = wrapper.get('[data-slot="theme-toggle-label"]').text()
      expect(wrapper.attributes('aria-label')!.toLowerCase()).toContain(visible.toLowerCase())
      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
      wrapper.unmount()
    }
    wrapper = undefined
  })
})

describe('AccentPicker', () => {
  const make = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => {
    const pinia = createPinia()
    setActivePinia(pinia)
    wrapper = mount(AccentPicker, { props, attrs, global: { plugins: [pinia] }, attachTo: document.body })
    return { w: wrapper, store: useThemeStore() }
  }

  it('every offered accent gets a name and a swatch class without hard-coding the list', () => {
    const { w } = make()
    const swatches = w.findAll('[data-slot="accent-picker-swatch"]')
    expect(swatches).toHaveLength(THEME_ACCENTS.length)
    for (const s of swatches) {
      expect(s.attributes('aria-label')).toBeTruthy()
      expect(s.classes().some((c) => c.startsWith('bg-'))).toBe(true)
      expect(s.classes()).toContain('forced-color-adjust-none')
    }
  })

  it('Left and Right follow the reading direction', async () => {
    const { w, store } = make({}, { style: 'direction: rtl' })
    const first = THEME_ACCENTS[0]
    store.setAccent(first)
    await w.get('[data-slot="accent-picker-swatch"]').trigger('keydown', { key: 'ArrowLeft' })
    await settle()
    expect(store.accent).toBe(THEME_ACCENTS[1])
    await w.findAll('[data-slot="accent-picker-swatch"]')[1].trigger('keydown', { key: 'ArrowRight' })
    expect(store.accent).toBe(first)
  })

  it('Left and Right keep their LTR meaning without rtl', async () => {
    const { w, store } = make()
    store.setAccent(THEME_ACCENTS[0])
    await w.get('[data-slot="accent-picker-swatch"]').trigger('keydown', { key: 'ArrowRight' })
    expect(store.accent).toBe(THEME_ACCENTS[1])
  })
})

describe('AppHeader and MobileNav', () => {
  const slots = { brand: '<b>Brand</b>', nav: '<a href="/a">A</a>', actions: '<button>Go</button>', mobile: '<a href="/a" class="m-a">A</a>' }

  it('has an opaque surface with a border and no backdrop blur', () => {
    wrapper = mount(AppHeader, { slots })
    const cls = wrapper.classes().join(' ')
    expect(cls).toContain('bg-background')
    expect(cls).toContain('border-b')
    expect(cls).not.toMatch(/blur|\/90|\/70|supports-/)
  })

  it('the menu button keeps one name while aria-expanded carries the state', async () => {
    wrapper = mount(AppHeader, { slots, attachTo: document.body })
    const btn = () => document.body.querySelector<HTMLElement>('[data-slot="app-header-menu-button"]')!
    expect(btn().getAttribute('aria-label')).toBe('Menu')
    await settle()
    btn().click()
    await flushPromises()
    expect(btn().getAttribute('aria-label')).toBe('Menu')
    expect(btn().getAttribute('aria-expanded')).toBe('true')
  })

  it('menuLabel overrides the button name and the actions slot uses ms-auto', () => {
    wrapper = mount(AppHeader, { props: { menuLabel: 'Site menu' }, slots })
    expect(wrapper.get('[data-slot="app-header-menu-button"]').attributes('aria-label')).toBe('Site menu')
    expect(wrapper.get('[data-slot="app-header-actions"]').classes()).toContain('ms-auto')
  })

  it('closes the mobile panel when the viewport grows to the desktop breakpoint', async () => {
    let handler: ((e: { matches: boolean }) => void) | undefined
    const removeEventListener = vi.fn()
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: (_: string, fn: typeof handler) => (handler = fn),
      removeEventListener,
    }) as never
    wrapper = mount(AppHeader, { props: { mobileOpen: undefined }, slots, attachTo: document.body })
    await settle()
    document.body.querySelector<HTMLElement>('[data-slot="app-header-menu-button"]')!.click()
    await flushPromises()
    expect(document.body.querySelector('[data-slot="mobile-nav"]')).not.toBeNull()
    handler?.({ matches: false })
    await flushPromises()
    expect(document.body.querySelector('[data-slot="mobile-nav"]')).not.toBeNull()
    handler?.({ matches: true })
    await flushPromises()
    expect(document.body.querySelector('[data-slot="mobile-nav"]')).toBeNull()
    wrapper.unmount()
    wrapper = undefined
    expect(removeEventListener).toHaveBeenCalled()
    // @ts-expect-error restore the jsdom default (no matchMedia)
    delete window.matchMedia
  })

  it('a panel that renders already open does not take focus, but still closes on Escape', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    wrapper = mount(MobileNav, { props: { defaultOpen: true }, slots: { default: '<a href="/a">A</a>' }, attachTo: document.body })
    await flushPromises()
    expect(document.activeElement).toBe(outside)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(document.body.querySelector('[data-slot="mobile-nav"]')).toBeNull()
  })

  it('later opens still move focus in', async () => {
    wrapper = mount(MobileNav, { props: { open: false }, slots: { default: '<a href="/a" class="first">A</a>' }, attachTo: document.body })
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(document.activeElement).toBe(document.body.querySelector('.first'))
  })

  it('sheet and dropdown use logical edges, scroll containment and reduced motion', async () => {
    wrapper = mount(MobileNav, { props: { open: true, variant: 'sheet' }, attachTo: document.body })
    await flushPromises()
    const sheet = document.body.querySelector<HTMLElement>('[data-slot="mobile-nav"]')!.className
    expect(sheet).toContain('start-0')
    expect(sheet).toContain('border-e')
    expect(sheet).toContain('rtl:animate-ds-slide-in-right')
    expect(sheet).toContain('overscroll-contain')
    expect(sheet).toContain('motion-reduce:animate-none')
    expect(sheet).not.toMatch(/\bleft-0|border-r|85vw/)
    expect(document.body.querySelector('[data-slot="mobile-nav-overlay"]')!.className).toContain('motion-reduce:animate-none')
    await wrapper.setProps({ variant: 'dropdown' })
    expect(document.body.querySelector<HTMLElement>('[data-slot="mobile-nav"]')!.className).toContain('overscroll-contain')
  })
})

describe('NavigationMenu and Menubar', () => {
  it('the list wraps instead of overflowing and the viewport anchors to the start edge', () => {
    wrapper = mount(NavigationMenu, { slots: { default: () => h(NavigationMenuList) }, attrs: { 'aria-label': 'Test' }, attachTo: document.body })
    expect(document.body.querySelector('[data-slot="navigation-menu-list"]')!.className).toContain('flex-wrap')
    const viewport = document.body.querySelector('[data-slot="navigation-menu-viewport-wrapper"]')!.className
    expect(viewport).toContain('start-0')
    expect(viewport).not.toMatch(/\bleft-/)
  })

  it('the standalone viewport part renders', () => {
    wrapper = mount(defineComponent({ setup: () => () => h(NavigationMenu, { viewport: false }, () => [h(NavigationMenuList), h(NavigationMenuViewport)]) }), { attachTo: document.body })
    expect(document.body.querySelector('[data-slot="navigation-menu-viewport-wrapper"]')).not.toBeNull()
  })

  it('Menubar scrolls inside itself on narrow screens', () => {
    wrapper = mount(Menubar, { attrs: { 'aria-label': 'Bar' } })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['max-w-full', 'overflow-x-auto']))
  })
})
