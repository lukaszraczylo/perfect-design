import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import AppShell from './AppShell.vue'
import { appShellSidebarClasses } from './variants'

const slots = {
  header: '<span id="h">Header</span>',
  sidebar: '<nav id="n">Nav</nav>',
  default: '<p id="m">Main</p>',
  footer: '<span id="f">Footer</span>',
}

const mounted: Array<{ unmount: () => void }> = []
function make(options: Record<string, unknown>) {
  const w = mount(AppShell, { attachTo: document.body, ...options } as never)
  mounted.push(w)
  return w
}

function mockDesktop(matches: boolean) {
  const original = window.matchMedia
  window.matchMedia = ((q: string) => ({ matches, media: q, addEventListener() {}, removeEventListener() {} })) as never
  return () => {
    window.matchMedia = original
  }
}

/** matchMedia mock that records queries and lets tests fire `change` events. */
function mockMedia(matches: boolean) {
  const original = window.matchMedia
  const queries: string[] = []
  const listeners: Array<(e: { matches: boolean }) => void> = []
  const removed: unknown[] = []
  window.matchMedia = ((q: string) => {
    queries.push(q)
    return {
      matches,
      media: q,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.push(fn),
      removeEventListener: (_: string, fn: unknown) => removed.push(fn),
    }
  }) as never
  return {
    queries,
    listeners,
    removed,
    fire: (m: boolean) => listeners.forEach((fn) => fn({ matches: m })),
    restore: () => {
      window.matchMedia = original
    },
  }
}

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('AppShell', () => {
  describe('good path', () => {
    it('renders header, sidebar, main (default slot) and footer', () => {
      const w = make({ slots })
      expect(w.attributes('data-slot')).toBe('app-shell')
      expect(w.find('header #h').exists()).toBe(true)
      expect(w.find('[data-slot="app-shell-sidebar"] #n').exists()).toBe(true)
      expect(w.find('main #m').text()).toBe('Main')
      expect(w.find('footer #f').exists()).toBe(true)
    })

    it('main has id and is focusable target; sidebar is an aside with aria-label', () => {
      const w = make({ slots, props: { mainId: 'content', sidebarLabel: 'Primary' } })
      const main = w.find('main')
      expect(main.attributes('id')).toBe('content')
      expect(main.attributes('tabindex')).toBe('-1')
      const aside = w.find('[data-slot="app-shell-sidebar"]')
      expect(aside.element.tagName).toBe('ASIDE')
      expect(aside.attributes('aria-label')).toBe('Primary')
    })

    it('defaults: main-content id and Sidebar label', () => {
      const w = make({ slots })
      expect(w.find('main').attributes('id')).toBe('main-content')
      expect(w.find('[data-slot="app-shell-sidebar"]').attributes('aria-label')).toBe('Sidebar')
    })

    it('uses sidebar tokens and is hidden below md by default', () => {
      const aside = make({ slots }).find('[data-slot="app-shell-sidebar"]')
      expect(aside.classes()).toEqual(expect.arrayContaining(['bg-sidebar', 'text-sidebar-foreground', 'border-sidebar-border', 'hidden', 'md:flex', 'md:w-64']))
      expect(aside.classes()).not.toContain('fixed')
    })

    it('collapsed shrinks the desktop sidebar to w-14 and sets data-collapsed', () => {
      const w = make({ slots, props: { collapsed: true } })
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toContain('md:w-14')
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).not.toContain('md:w-64')
      expect(w.attributes('data-collapsed')).toBeDefined()
      expect(w.find('[data-slot="app-shell-sidebar"]').attributes('data-collapsed')).toBeDefined()
    })

    it('open shows the sidebar as a fixed drawer with a backdrop', () => {
      const w = make({ slots, props: { open: true } })
      expect(w.attributes('data-open')).toBeDefined()
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toEqual(expect.arrayContaining(['fixed', 'inset-y-0', 'flex', 'w-64']))
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).not.toContain('hidden')
      expect(w.find('[data-slot="app-shell-backdrop"]').exists()).toBe(true)
      expect(w.find('[data-slot="app-shell-backdrop"]').classes()).toContain('md:hidden')
    })

    it('no backdrop when closed', () => {
      expect(make({ slots }).find('[data-slot="app-shell-backdrop"]').exists()).toBe(false)
      expect(make({ slots }).attributes('data-open')).toBeUndefined()
    })

    it('backdrop click closes (emits update:open false)', async () => {
      const w = make({ slots, props: { open: true } })
      await w.find('[data-slot="app-shell-backdrop"]').trigger('click')
      expect(w.emitted('update:open')?.at(-1)).toEqual([false])
    })

    it('Escape closes while open', async () => {
      const w = make({ slots, props: { open: true } })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await w.vm.$nextTick()
      expect(w.emitted('update:open')?.at(-1)).toEqual([false])
    })

    it('other keys do not close', () => {
      const w = make({ slots, props: { open: true } })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      expect(w.emitted('update:open')).toBeUndefined()
    })

    it('Escape does nothing when closed (no listener)', () => {
      const w = make({ slots })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(w.emitted('update:open')).toBeUndefined()
    })

    it('removes the Escape listener when open turns false and on unmount', async () => {
      const spy = vi.spyOn(document, 'removeEventListener')
      const w = make({ slots, props: { open: true } })
      await w.setProps({ open: false })
      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function))
      await w.setProps({ open: true })
      w.unmount()
      mounted.pop()
      const calls = spy.mock.calls.filter((c) => c[0] === 'keydown').length
      expect(calls).toBeGreaterThanOrEqual(2)
      spy.mockRestore()
    })

    it('works uncontrolled (internal state) via slot toggle on mobile', async () => {
      const w = make({
        slots: {
          sidebar: '<nav>Nav</nav>',
          default: `<template #default="{ toggle, open, collapsed }"><button id="t" @click="toggle">{{ open }}-{{ collapsed }}</button></template>`,
        },
      })
      expect(w.find('#t').text()).toBe('false-false')
      await w.find('#t').trigger('click')
      expect(w.find('#t').text()).toBe('true-false')
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toContain('fixed')
    })

    it('toggle collapses on desktop', async () => {
      const restore = mockDesktop(true)
      const w = make({
        slots: { sidebar: 'S', header: `<template #header="{ toggle }"><button id="t" @click="toggle">x</button></template>` },
      })
      await w.find('#t').trigger('click')
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toContain('md:w-14')
      expect(w.emitted('update:open')).toBeUndefined()
      await w.find('#t').trigger('click')
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toContain('md:w-64')
      restore()
    })

    it('slot props reach sidebar, footer and header', () => {
      const w = make({
        props: { collapsed: true, open: true },
        slots: {
          header: `<template #header="{ collapsed, open }">H{{ collapsed }}{{ open }}</template>`,
          sidebar: `<template #sidebar="{ collapsed, open }">S{{ collapsed }}{{ open }}</template>`,
          footer: `<template #footer="{ collapsed, open }">F{{ collapsed }}{{ open }}</template>`,
        },
      })
      expect(w.find('header').text()).toBe('Htruetrue')
      expect(w.find('[data-slot="app-shell-sidebar"]').text()).toBe('Struetrue')
      expect(w.find('footer').text()).toBe('Ftruetrue')
    })

    it('skip link targets main', () => {
      const w = make({ slots, props: { skipLink: true, mainId: 'content' } })
      const a = w.find('[data-slot="app-shell-skip-link"]')
      expect(a.attributes('href')).toBe('#content')
      expect(a.text()).toBe('Skip to main content')
      expect(a.classes()).toContain('sr-only')
      expect(make({ slots, props: { skipLink: true, skipLinkLabel: 'Ir al contenido' } }).find('a').text()).toBe('Ir al contenido')
    })

    it('header is sticky with z-sticky', () => {
      const h = make({ slots }).find('header')
      expect(h.classes()).toContain('sticky')
      expect(h.classes().join(' ')).toContain('z-(--z-sticky)')
    })
  })

  describe('customisation', () => {
    it('class wins and attrs pass through', () => {
      const w = make({ slots, props: { class: 'bg-muted custom' }, attrs: { id: 'shell', 'data-x': '1' } })
      expect(w.classes()).toContain('bg-muted')
      expect(w.classes()).not.toContain('bg-background')
      expect(w.classes()).toContain('custom')
      expect(w.attributes('id')).toBe('shell')
    })

    it('as', () => {
      expect(make({ slots, props: { as: 'section' } }).element.tagName).toBe('SECTION')
    })
  })

  describe('bad path', () => {
    it('without sidebar slot: no aside and no backdrop even if open', () => {
      const w = make({ props: { open: true }, slots: { default: 'x' } })
      expect(w.find('[data-slot="app-shell-sidebar"]').exists()).toBe(false)
      expect(w.find('[data-slot="app-shell-backdrop"]').exists()).toBe(false)
    })

    it('without header/footer slots: neither is rendered', () => {
      const w = make({ slots: { default: 'x' } })
      expect(w.find('header').exists()).toBe(false)
      expect(w.find('footer').exists()).toBe(false)
      expect(w.find('main').text()).toBe('x')
    })

    it('no skip link by default', () => {
      expect(make({ slots }).find('[data-slot="app-shell-skip-link"]').exists()).toBe(false)
    })

    it('toggle tolerates missing matchMedia (treated as mobile)', async () => {
      const original = window.matchMedia
      // @ts-expect-error simulate old environment
      window.matchMedia = undefined
      const w = make({ slots: { sidebar: 'S', default: `<template #default="{ toggle }"><button id="t" @click="toggle">x</button></template>` } })
      await w.find('#t').trigger('click')
      expect(w.emitted('update:open')?.at(-1)).toEqual([true])
      window.matchMedia = original
    })
  })

  describe('edge cases', () => {
    it('rapid open/close toggles end in a consistent state with a single listener', async () => {
      const w = make({ slots, props: { open: false } })
      for (let i = 0; i < 10; i++) await w.setProps({ open: i % 2 === 0 })
      await w.setProps({ open: false })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(w.emitted('update:open')).toBeUndefined()
    })

    it('empty shell renders main only', () => {
      const w = make({})
      expect(w.find('main').exists()).toBe(true)
      expect(w.find('main').text()).toBe('')
    })

    it('collapsed and open together keep drawer at w-64 on mobile, w-14 on desktop', () => {
      const aside = make({ slots, props: { collapsed: true, open: true } }).find('[data-slot="app-shell-sidebar"]')
      expect(aside.classes()).toContain('w-64')
      expect(aside.classes()).toContain('md:w-14')
    })
  })
})

describe('AppShell variations', () => {
  const dual = { ...slots, 'sidebar-end': '<div id="se">End nav</div>' }

  describe('layouts', () => {
    it('default layout is top-nav-sidebar: header outside the body, no data-layout, sidebar not full-height', () => {
      const w = make({ slots })
      expect(w.attributes('data-layout')).toBeUndefined()
      expect(w.find('[data-slot="app-shell-body"]').find('header').exists()).toBe(false)
      expect(w.find('[data-slot="app-shell"] > header').exists()).toBe(true)
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).not.toContain('md:sticky')
    })

    it('top-nav-sidebar explicit equals the default', () => {
      const w = make({ slots, props: { layout: 'top-nav-sidebar' } })
      expect(w.attributes('data-layout')).toBeUndefined()
    })

    it.each(['sidebar-left', 'sidebar-right', 'dual-sidebar'] as const)('%s: header lives in the content column; sidebar is full height', (layout) => {
      const w = make({ slots: dual, props: { layout } })
      expect(w.attributes('data-layout')).toBe(layout)
      expect(w.find('[data-slot="app-shell-content"] > header').exists()).toBe(true)
      expect(w.find('[data-slot="app-shell"] > header').exists()).toBe(false)
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toEqual(expect.arrayContaining(['md:sticky', 'md:top-0', 'md:h-dvh']))
    })

    it('sidebar-left: sidebar before content in DOM, border on the end edge', () => {
      const w = make({ slots, props: { layout: 'sidebar-left' } })
      const html = w.html()
      expect(html.indexOf('app-shell-sidebar')).toBeLessThan(html.indexOf('app-shell-content'))
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toContain('border-e')
      expect(w.find('[data-slot="app-shell-sidebar"]').attributes('data-side')).toBeUndefined()
    })

    it('sidebar-right: sidebar after content in DOM, border on the start edge, data-side=end', () => {
      const w = make({ slots, props: { layout: 'sidebar-right' } })
      const html = w.html()
      expect(html.indexOf('app-shell-content')).toBeLessThan(html.indexOf('app-shell-sidebar'))
      const aside = w.find('[data-slot="app-shell-sidebar"]')
      expect(aside.classes()).toContain('border-s')
      expect(aside.classes()).not.toContain('border-e')
      expect(aside.attributes('data-side')).toBe('end')
      expect(aside.find('#n').exists()).toBe(true)
    })

    it('sidebar-right drawer opens from the end edge and uses the primary open state', () => {
      const w = make({ slots, props: { layout: 'sidebar-right', open: true } })
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toEqual(expect.arrayContaining(['fixed', 'end-0']))
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).not.toContain('start-0')
    })

    it('top-nav: header and content only, sidebar slot ignored (no aside, no backdrop)', () => {
      const w = make({ slots, props: { layout: 'top-nav', open: true } })
      expect(w.attributes('data-layout')).toBe('top-nav')
      expect(w.find('[data-slot="app-shell-sidebar"]').exists()).toBe(false)
      expect(w.find('[data-slot="app-shell-backdrop"]').exists()).toBe(false)
      expect(w.find('[data-slot="app-shell"] > header').exists()).toBe(true)
      expect(w.find('main #m').exists()).toBe(true)
    })

    it('dual-sidebar renders both asides with their own labels and slot content', () => {
      const w = make({ slots: dual, props: { layout: 'dual-sidebar', sidebarLabel: 'Main', sidebarEndLabel: 'Details' } })
      const asides = w.findAll('[data-slot="app-shell-sidebar"]')
      expect(asides).toHaveLength(2)
      expect(asides[0].attributes('aria-label')).toBe('Main')
      expect(asides[0].find('#n').exists()).toBe(true)
      expect(asides[1].attributes('aria-label')).toBe('Details')
      expect(asides[1].find('#se').exists()).toBe(true)
      expect(asides[1].attributes('data-side')).toBe('end')
      expect(asides[1].classes()).toContain('border-s')
      const html = w.html()
      expect(html.indexOf('id="n"')).toBeLessThan(html.indexOf('app-shell-content'))
      expect(html.indexOf('app-shell-content')).toBeLessThan(html.indexOf('id="se"'))
    })

    it('dual-sidebar default end label', () => {
      expect(make({ slots: dual, props: { layout: 'dual-sidebar' } }).findAll('[data-slot="app-shell-sidebar"]')[1].attributes('aria-label')).toBe('Secondary sidebar')
    })

    it('sidebar-end slot is ignored outside dual-sidebar', () => {
      expect(make({ slots: dual, props: { layout: 'sidebar-left' } }).findAll('[data-slot="app-shell-sidebar"]')).toHaveLength(1)
      expect(make({ slots: dual }).findAll('[data-slot="app-shell-sidebar"]')).toHaveLength(1)
    })

    it('dual-sidebar with only the end slot renders just the end sidebar', () => {
      const w = make({ slots: { 'sidebar-end': 'E', default: 'x' }, props: { layout: 'dual-sidebar' } })
      expect(w.findAll('[data-slot="app-shell-sidebar"]')).toHaveLength(1)
      expect(w.find('[data-slot="app-shell-sidebar"]').attributes('data-side')).toBe('end')
    })

    it('unknown layout falls back to top-nav-sidebar', () => {
      const w = make({ slots, props: { layout: 'wat' as never } })
      expect(w.attributes('data-layout')).toBeUndefined()
      expect(w.find('[data-slot="app-shell"] > header').exists()).toBe(true)
      expect(make({ slots, props: { layout: 'toString' as never } }).attributes('data-layout')).toBeUndefined()
    })
  })

  describe('end sidebar state', () => {
    it('collapsedEnd shrinks only the end sidebar', () => {
      const w = make({ slots: dual, props: { layout: 'dual-sidebar', collapsedEnd: true } })
      const [start, end] = w.findAll('[data-slot="app-shell-sidebar"]')
      expect(end.classes()).toContain('md:w-14')
      expect(end.attributes('data-collapsed')).toBeDefined()
      expect(start.classes()).toContain('md:w-64')
      expect(start.attributes('data-collapsed')).toBeUndefined()
    })

    it('openEnd shows the end drawer and a backdrop; start stays closed', () => {
      const w = make({ slots: dual, props: { layout: 'dual-sidebar', openEnd: true } })
      const [start, end] = w.findAll('[data-slot="app-shell-sidebar"]')
      expect(end.classes()).toEqual(expect.arrayContaining(['fixed', 'end-0', 'flex']))
      expect(start.classes()).toContain('hidden')
      expect(w.find('[data-slot="app-shell-backdrop"]').exists()).toBe(true)
    })

    it('slot props expose collapsedEnd/openEnd/toggleEnd; toggleEnd opens the end drawer on mobile', async () => {
      const w = make({
        props: { layout: 'dual-sidebar' },
        slots: {
          'sidebar-end': 'E',
          default: `<template #default="{ toggleEnd, openEnd, collapsedEnd }"><button id="t" @click="toggleEnd">{{ openEnd }}-{{ collapsedEnd }}</button></template>`,
        },
      })
      expect(w.find('#t').text()).toBe('false-false')
      await w.find('#t').trigger('click')
      expect(w.find('#t').text()).toBe('true-false')
      expect(w.emitted('update:openEnd')?.at(-1)).toEqual([true])
      expect(w.emitted('update:open')).toBeUndefined()
    })

    it('toggleEnd collapses the end sidebar on desktop', async () => {
      const m = mockMedia(true)
      const w = make({
        props: { layout: 'dual-sidebar' },
        slots: { 'sidebar-end': 'E', default: `<template #default="{ toggleEnd }"><button id="t" @click="toggleEnd">x</button></template>` },
      })
      await w.find('#t').trigger('click')
      expect(w.emitted('update:collapsedEnd')?.at(-1)).toEqual([true])
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toContain('md:w-14')
      m.restore()
    })

    it('backdrop click and Escape close both drawers', async () => {
      const w = make({ slots: dual, props: { layout: 'dual-sidebar', open: true, openEnd: true } })
      await w.find('[data-slot="app-shell-backdrop"]').trigger('click')
      expect(w.emitted('update:open')?.at(-1)).toEqual([false])
      expect(w.emitted('update:openEnd')?.at(-1)).toEqual([false])
      const w2 = make({ slots: dual, props: { layout: 'dual-sidebar', openEnd: true } })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()
      expect(w2.emitted('update:openEnd')?.at(-1)).toEqual([false])
    })
  })

  describe('sidebar sizing and collapse mode', () => {
    it.each([
      ['sm', 'md:w-56', 'w-56'],
      ['md', 'md:w-64', 'w-64'],
      ['lg', 'md:w-72', 'w-72'],
    ] as const)('sidebarWidth %s', (sidebarWidth, desktop, drawer) => {
      expect(make({ slots, props: { sidebarWidth } }).find('[data-slot="app-shell-sidebar"]').classes()).toContain(desktop)
      expect(make({ slots, props: { sidebarWidth, open: true } }).find('[data-slot="app-shell-sidebar"]').classes()).toEqual(expect.arrayContaining([drawer, desktop]))
    })

    it.each([
      ['sm', 'md:w-12'],
      ['md', 'md:w-14'],
      ['lg', 'md:w-16'],
    ] as const)('railWidth %s applies when collapsed', (railWidth, cls) => {
      const aside = make({ slots, props: { railWidth, collapsed: true } }).find('[data-slot="app-shell-sidebar"]')
      expect(aside.classes()).toContain(cls)
      expect(aside.classes()).not.toContain('md:w-64')
    })

    it('railWidth is irrelevant while expanded', () => {
      const aside = make({ slots, props: { railWidth: 'lg' } }).find('[data-slot="app-shell-sidebar"]')
      expect(aside.classes()).toContain('md:w-64')
      expect(aside.classes()).not.toContain('md:w-16')
    })

    it('collapseMode hidden removes the sidebar on desktop when collapsed', () => {
      const aside = make({ slots, props: { collapseMode: 'hidden', collapsed: true } }).find('[data-slot="app-shell-sidebar"]')
      expect(aside.classes()).toContain('md:hidden')
      expect(aside.classes()).not.toContain('md:flex')
      expect(aside.classes()).not.toContain('md:w-14')
      expect(make({ slots, props: { collapseMode: 'hidden' } }).find('[data-slot="app-shell-sidebar"]').classes()).toContain('md:flex')
    })

    it('unknown sizes and modes fall back to defaults', () => {
      const aside = make({ slots, props: { sidebarWidth: 'xl' as never, railWidth: 'toString' as never, collapseMode: 'fold' as never, collapsed: true } }).find('[data-slot="app-shell-sidebar"]')
      expect(aside.classes()).toContain('md:w-14')
      expect(make({ slots, props: { sidebarWidth: 'xl' as never } }).find('[data-slot="app-shell-sidebar"]').classes()).toContain('md:w-64')
    })

    it('appShellSidebarClasses is exported and pure', () => {
      const cls = appShellSidebarClasses({ side: 'end', open: false, collapsed: false, breakpoint: 'lg', width: 'lg', rail: 'sm', collapseMode: 'rail', fullHeight: true })
      expect(cls).toEqual(expect.stringContaining('lg:w-72'))
      expect(cls).toEqual(expect.stringContaining('lg:sticky'))
      expect(cls).toEqual(expect.stringContaining('border-s'))
    })
  })

  describe('drawer breakpoint', () => {
    it('lg: sidebar hidden below lg, drawer static from lg, backdrop lg:hidden', () => {
      const closed = make({ slots, props: { drawerBreakpoint: 'lg' } }).find('[data-slot="app-shell-sidebar"]')
      expect(closed.classes()).toEqual(expect.arrayContaining(['hidden', 'lg:flex', 'lg:w-64', 'lg:shrink-0']))
      expect(closed.classes()).not.toContain('md:flex')
      const w = make({ slots, props: { drawerBreakpoint: 'lg', open: true, collapsed: true, layout: 'sidebar-left' } })
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toEqual(expect.arrayContaining(['fixed', 'lg:z-auto', 'lg:w-14', 'lg:sticky', 'lg:h-dvh']))
      expect(w.find('[data-slot="app-shell-backdrop"]').classes()).toContain('lg:hidden')
      expect(w.find('[data-slot="app-shell-backdrop"]').classes()).not.toContain('md:hidden')
    })

    it('toggle uses the matching media query', async () => {
      const m = mockMedia(true)
      const w = make({ slots: { sidebar: 'S', default: `<template #default="{ toggle }"><button id="t" @click="toggle">x</button></template>` }, props: { drawerBreakpoint: 'lg' } })
      await w.find('#t').trigger('click')
      expect(m.queries).toContain('(min-width: 1024px)')
      expect(w.emitted('update:collapsed')?.at(-1)).toEqual([true])
      m.restore()
    })

    it('unknown breakpoint falls back to md', () => {
      expect(make({ slots, props: { drawerBreakpoint: 'xl' as never } }).find('[data-slot="app-shell-sidebar"]').classes()).toContain('md:flex')
    })

    it('changing the breakpoint re-subscribes to the new media query', async () => {
      const m = mockMedia(false)
      const w = make({ slots })
      expect(m.queries).toContain('(min-width: 768px)')
      await w.setProps({ drawerBreakpoint: 'lg' })
      expect(m.queries).toContain('(min-width: 1024px)')
      expect(m.removed.length).toBeGreaterThanOrEqual(1)
      m.restore()
    })

    it('a drawer left open closes when the viewport grows to desktop', async () => {
      const m = mockMedia(false)
      const w = make({ slots: dual, props: { layout: 'dual-sidebar', open: true, openEnd: true } })
      m.fire(false)
      expect(w.emitted('update:open')).toBeUndefined()
      m.fire(true)
      expect(w.emitted('update:open')?.at(-1)).toEqual([false])
      expect(w.emitted('update:openEnd')?.at(-1)).toEqual([false])
      m.restore()
    })

    it('unsubscribes from the media query on unmount', () => {
      const m = mockMedia(false)
      const w = make({ slots })
      w.unmount()
      mounted.pop()
      expect(m.removed.length).toBeGreaterThanOrEqual(1)
      m.restore()
    })

    it('works without matchMedia at all', () => {
      const original = window.matchMedia
      // @ts-expect-error simulate old environment
      window.matchMedia = undefined
      expect(() => make({ slots })).not.toThrow()
      window.matchMedia = original
    })
  })

  describe('drawer behaviour', () => {
    it('open drawer on mobile: aside is focusable and receives focus, then focus returns on close', async () => {
      const trigger = document.createElement('button')
      document.body.appendChild(trigger)
      trigger.focus()
      const w = make({ slots, props: { open: false } })
      await w.setProps({ open: true })
      await nextTick()
      await nextTick()
      const aside = w.find('[data-slot="app-shell-sidebar"]')
      expect(aside.attributes('tabindex')).toBe('-1')
      expect(aside.classes()).toContain('outline-hidden')
      expect(document.activeElement).toBe(aside.element)
      await w.setProps({ open: false })
      expect(document.activeElement).toBe(trigger)
      expect(w.find('[data-slot="app-shell-sidebar"]').attributes('tabindex')).toBeUndefined()
    })

    it('close without a previously focused element does not throw', async () => {
      const w = make({ slots, props: { open: false } })
      ;(document.activeElement as HTMLElement | null)?.blur()
      await w.setProps({ open: true })
      await w.setProps({ open: false })
      expect(w.find('[data-slot="app-shell-sidebar"]').classes()).toContain('hidden')
    })

    it('locks page scroll while a drawer is open and restores the previous value', async () => {
      document.body.style.overflow = 'scroll'
      const w = make({ slots, props: { open: false } })
      await w.setProps({ open: true })
      expect(document.body.style.overflow).toBe('hidden')
      await w.setProps({ open: false })
      expect(document.body.style.overflow).toBe('scroll')
    })

    it('does not lock twice and unlocks on unmount', async () => {
      const w = make({ slots: dual, props: { layout: 'dual-sidebar', open: true } })
      await nextTick()
      expect(document.body.style.overflow).toBe('hidden')
      await w.setProps({ openEnd: true })
      w.unmount()
      mounted.pop()
      expect(document.body.style.overflow).toBe('')
    })

    it('lockScroll=false leaves the page scrollable', async () => {
      const w = make({ slots, props: { lockScroll: false } })
      await w.setProps({ open: true })
      expect(document.body.style.overflow).toBe('')
    })

    it('desktop never locks the scroll', async () => {
      const m = mockMedia(true)
      const w = make({ slots })
      await w.setProps({ open: true })
      expect(document.body.style.overflow).toBe('')
      m.restore()
    })
  })

  describe('content max width', () => {
    it('is off by default: slot rendered straight in main', () => {
      const w = make({ slots })
      expect(w.find('[data-slot="app-shell-container"]').exists()).toBe(false)
      expect(w.find('main').element.children[0].id).toBe('m')
    })

    it.each(['3xl', '5xl', '7xl', 'prose', 'full'] as const)('contentMaxWidth %s wraps the content in a centred container', (size) => {
      const w = make({ slots, props: { contentMaxWidth: size } })
      const c = w.find('main [data-slot="app-shell-container"]')
      expect(c.classes()).toEqual(expect.arrayContaining(['w-full', `max-w-${size}`, 'mx-auto', 'px-4', 'lg:px-8']))
      expect(c.find('#m').exists()).toBe(true)
    })

    it('contentPadded=false drops the padding', () => {
      const c = make({ slots, props: { contentMaxWidth: '4xl', contentPadded: false } }).find('[data-slot="app-shell-container"]')
      expect(c.classes()).not.toContain('px-4')
      expect(c.classes()).toContain('max-w-4xl')
    })

    it('unknown contentMaxWidth is ignored', () => {
      expect(make({ slots, props: { contentMaxWidth: 'huge' as never } }).find('[data-slot="app-shell-container"]').exists()).toBe(false)
      expect(make({ slots, props: { contentMaxWidth: 'toString' as never } }).find('[data-slot="app-shell-container"]').exists()).toBe(false)
    })

    it('slot props reach the wrapped content', () => {
      const w = make({ props: { contentMaxWidth: 'xl', collapsed: true }, slots: { default: `<template #default="{ collapsed }">C{{ collapsed }}</template>` } })
      expect(w.find('[data-slot="app-shell-container"]').text()).toBe('Ctrue')
    })
  })

  describe('edge cases', () => {
    it('header in the content column is omitted without a header slot', () => {
      const w = make({ slots: { sidebar: 'S', default: 'x' }, props: { layout: 'sidebar-left' } })
      expect(w.find('header').exists()).toBe(false)
    })

    it('every layout renders without a sidebar slot', () => {
      for (const layout of ['top-nav-sidebar', 'sidebar-left', 'sidebar-right', 'top-nav', 'dual-sidebar'] as const) {
        const w = make({ slots: { default: 'x' }, props: { layout } })
        expect(w.find('[data-slot="app-shell-sidebar"]').exists()).toBe(false)
        expect(w.find('main').text()).toBe('x')
      }
    })

    it('class override and attrs still work in a non-default layout', () => {
      const w = make({ slots, props: { layout: 'sidebar-left', class: 'bg-muted' }, attrs: { id: 'shell' } })
      expect(w.classes()).toContain('bg-muted')
      expect(w.classes()).not.toContain('bg-background')
      expect(w.attributes('id')).toBe('shell')
    })

    it('late-added sidebar slot appears after an update', async () => {
      const { defineComponent } = await import('vue')
      const Host = defineComponent({
        components: { AppShell },
        props: { show: Boolean },
        template: `<AppShell><template v-if="show" #sidebar>S</template>body</AppShell>`,
      })
      const w = mount(Host, { attachTo: document.body })
      mounted.push(w)
      expect(w.find('[data-slot="app-shell-sidebar"]').exists()).toBe(false)
      await w.setProps({ show: true })
      expect(w.find('[data-slot="app-shell-sidebar"]').text()).toBe('S')
    })
  })
})

describe('AppShell accessibility (drawer as modal dialog, landmarks)', () => {
  const slotsWithTrigger = {
    header: '<template #header="{ triggerProps, toggle }"><button id="menu" v-bind="triggerProps" @click="toggle">Menu</button></template>',
    sidebar: '<nav id="n"><a id="link" href="/x">Link</a></nav>',
    default: '<p id="m">Main</p>',
    footer: '<span id="f">Footer</span>',
  }

  it('closed: the sidebar is an aside landmark, nothing is inert', () => {
    const w = make({ slots: slotsWithTrigger })
    const aside = w.find('[data-slot="app-shell-sidebar"]')
    expect(aside.element.tagName).toBe('ASIDE')
    expect(aside.attributes('role')).toBeUndefined()
    expect(aside.attributes('aria-modal')).toBeUndefined()
    expect(w.find('[data-slot="app-shell-content"]').attributes('inert')).toBeUndefined()
    expect(w.find('[data-slot="app-shell-header"]').attributes('inert')).toBeUndefined()
  })

  it('open on mobile: the sidebar is a labelled modal dialog and the header and content are inert, so Tab cannot leave the drawer', async () => {
    const w = make({ slots: slotsWithTrigger, props: { open: true, sidebarLabel: 'Site navigation' } })
    await nextTick()
    const aside = w.find('[data-slot="app-shell-sidebar"]')
    expect(aside.element.tagName).toBe('DIV') // aside may not take role=dialog
    expect(aside.attributes('role')).toBe('dialog')
    expect(aside.attributes('aria-modal')).toBe('true')
    expect(aside.attributes('aria-label')).toBe('Site navigation')
    expect(aside.attributes('inert')).toBeUndefined()
    expect(w.find('[data-slot="app-shell-content"]').attributes('inert')).toBeDefined()
    expect(w.find('[data-slot="app-shell-header"]').attributes('inert')).toBeDefined()
  })

  it('open end drawer in dual-sidebar: the other sidebar is inert', async () => {
    const dualSlots = { sidebar: '<nav>A</nav>', 'sidebar-end': '<nav>B</nav>', default: 'M' }
    const w = make({ slots: dualSlots, props: { layout: 'dual-sidebar', openEnd: true } })
    await nextTick()
    const [start, end] = w.findAll('[data-slot="app-shell-sidebar"]')
    expect(end!.attributes('role')).toBe('dialog')
    expect(start!.attributes('inert')).toBeDefined()
    expect(start!.attributes('role')).toBeUndefined()
  })

  it('at the desktop breakpoint an open flag does not make anything modal or inert', async () => {
    const restore = mockDesktop(true)
    const w = make({ slots: slotsWithTrigger, props: { open: true } })
    await nextTick()
    expect(w.find('[data-slot="app-shell-sidebar"]').attributes('role')).toBeUndefined()
    expect(w.find('[data-slot="app-shell-content"]').attributes('inert')).toBeUndefined()
    restore()
  })

  it('growing to the desktop breakpoint leaves modal mode and closes the drawer', async () => {
    const m = mockMedia(false)
    const w = make({ slots: slotsWithTrigger, props: { open: true } })
    await nextTick()
    expect(w.find('[data-slot="app-shell-sidebar"]').attributes('role')).toBe('dialog')
    m.fire(true)
    await nextTick()
    expect(w.emitted('update:open')?.at(-1)).toEqual([false])
    expect(w.find('[data-slot="app-shell-sidebar"]').attributes('role')).toBeUndefined()
    m.restore()
  })

  it('triggerProps wire aria-controls to the sidebar id and aria-expanded to the state', async () => {
    const m = mockMedia(false)
    const w = make({ slots: slotsWithTrigger })
    const btn = w.find('#menu')
    const sidebarId = w.find('[data-slot="app-shell-sidebar"]').attributes('id')
    expect(sidebarId).toBeTruthy()
    expect(btn.attributes('aria-controls')).toBe(sidebarId)
    expect(btn.attributes('aria-expanded')).toBe('false')
    await btn.trigger('click')
    expect(w.emitted('update:open')?.at(-1)).toEqual([true])
    m.restore()
    // Desktop: expanded means "not collapsed".
    const restore = mockDesktop(true)
    const d = make({ slots: slotsWithTrigger })
    await nextTick()
    expect(d.find('#menu').attributes('aria-expanded')).toBe('true')
    await d.find('#menu').trigger('click')
    expect(d.find('#menu').attributes('aria-expanded')).toBe('false')
    restore()
  })

  it('exposes sidebarId and expanded to every slot', () => {
    const w = make({ slots: { default: '<template #default="{ sidebarId, expanded }"><i id="s">{{ sidebarId }}|{{ expanded }}</i></template>', sidebar: 'S' } })
    expect(w.find('#s').text()).toMatch(/\|(true|false)$/)
  })

  it('main=false renders the page region as a div (no nested main landmark in embedded demos)', () => {
    const w = make({ slots, props: { main: false, mainId: 'region' } })
    expect(w.find('main').exists()).toBe(false)
    const region = w.find('[data-slot="app-shell-main"]')
    expect(region.element.tagName).toBe('DIV')
    expect(region.attributes('id')).toBe('region')
    expect(make({ slots }).find('main[data-slot="app-shell-main"]').exists()).toBe(true)
  })

  it('the drawer never exceeds the viewport width (max-w-full), z-index uses the token shorthand', () => {
    const c = appShellSidebarClasses({ side: 'start', open: true, collapsed: false, breakpoint: 'md', width: 'lg', rail: 'md', collapseMode: 'rail', fullHeight: false })
    expect(c).toContain('max-w-full')
    expect(c).toContain('z-(--z-modal)')
    expect(c).not.toContain('z-[')
  })
})
