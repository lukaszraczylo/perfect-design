/**
 * Contract tests for the navigation group: required parts, names, values, wiring. Strict mode is on ('throw') here;
 * the component unit tests run with it off so they can mount partial trees.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, nextTick, onErrorCaptured, type Component, type VNode } from 'vue'
import { configureStrictMode } from '../../lib/contract'
import { AccentPicker } from './AccentPicker'
import { StylePicker } from './StylePicker'
import { FontPicker } from './FontPicker'
import { CornerPicker } from './CornerPicker'
import { PalettePicker } from './PalettePicker'
import { CodeThemePicker } from './CodeThemePicker'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion'
import { AppHeader } from './AppHeader'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from './Breadcrumb'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible'
import { DocsSidebar } from './DocsSidebar'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from './Menubar'
import { MobileNav } from './MobileNav'
import { NavLink } from './NavLink'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './NavigationMenu'
import { Pagination } from './Pagination'
import { SidebarNav } from './SidebarNav'
import { SkipLink } from './SkipLink'
import { Stepper } from './Stepper'
import { TableOfContents } from './TableOfContents'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs'
import { ThemeToggle } from './ThemeToggle'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

/** Looser `h` so the tests can pass partial props and children without fighting the generated prop types. */
const el = (component: unknown, props?: Record<string, unknown> | null, children?: unknown): VNode => h(component as Component, props ?? null, children as never)
const text = (s: string) => () => s

const errors: Error[] = []
let wrapper: VueWrapper | undefined
const open = (root: () => unknown, pinia = true) => {
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return root
      },
    }),
    { attachTo: document.body, global: { plugins: pinia ? [createPinia()] : [] } },
  )
  return settle()
}
/** Unmount whatever is mounted and open a new tree (the error list is reset too). */
const reopen = (root: () => unknown, pinia = true) => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  errors.length = 0
  return open(root, pinia)
}
const messages = () => errors.map((e) => e.message).join('\n')

beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
  localStorage.clear()
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
  vi.restoreAllMocks()
})

/* ---------------------------------------------------------------------------------------------- Tabs */

const tab = (value: string | number, label = String(value)) => el(TabsTrigger, { value }, text(label))
const panel = (value: string | number) => el(TabsContent, { value }, text(`Panel ${value}`))
const tabs = (triggers: VNode[], contents: VNode[], listProps: Record<string, unknown> | null = { 'aria-label': 'Sample sections' }, rootProps: Record<string, unknown> = {}) => () =>
  el(Tabs, { defaultValue: 'a', ...rootProps }, () => [el(TabsList, listProps, () => triggers), ...contents])

describe('Tabs contract', () => {
  it('passes for matching triggers and contents, including numbers', async () => {
    await open(tabs([tab('a'), tab('b')], [panel('a'), panel('b')]))
    expect(errors).toEqual([])
    await reopen(tabs([tab(1), tab(2)], [panel(1), panel(2)], undefined, { defaultValue: 1 }))
    expect(errors).toEqual([])
  })
  it('throws when a TabsTrigger has no TabsContent, naming the value', async () => {
    await open(tabs([tab('a'), tab('b')], [panel('a')]))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Tabs: requires every TabsTrigger value to have exactly one TabsContent')
    expect(errors[0].message).toContain('TabsTrigger "b" has no TabsContent')
  })
  it('throws when a TabsContent has no TabsTrigger', async () => {
    await open(tabs([tab('a')], [panel('a'), panel('ghost')]))
    expect(messages()).toContain('TabsContent "ghost" has no TabsTrigger')
  })
  it('throws when a value is used twice', async () => {
    await open(tabs([tab('a'), tab('a', 'Again')], [panel('a')]))
    expect(messages()).toContain('TabsTrigger value "a" is used more than once')
    await reopen(tabs([tab('a')], [panel('a'), panel('a')]))
    expect(messages()).toContain('TabsContent value "a" is used more than once')
  })
  it('throws for a blank value', async () => {
    await open(tabs([tab('')], [panel('')]))
    expect(messages()).toContain('Tabs: requires a non-empty `value` on every TabsTrigger and TabsContent')
  })
  it('throws when there is no TabsTrigger at all', async () => {
    await open(tabs([], []))
    expect(messages()).toContain('Tabs: requires a TabsList with at least one TabsTrigger')
  })
  it('throws when TabsList has no accessible name and passes with aria-label or aria-labelledby', async () => {
    await open(tabs([tab('a')], [panel('a')], null))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TabsList: needs an accessible name')
    expect(errors[0].message).toContain('aria-label')
    await reopen(tabs([tab('a')], [panel('a')], { 'aria-label': '  ' }))
    expect(messages()).toContain('TabsList: needs an accessible name')
    await reopen(() => h('div', null, [h('h2', { id: 'tabs-heading' }, 'Settings'), el(Tabs, { defaultValue: 'a' }, () => [el(TabsList, { 'aria-labelledby': 'tabs-heading' }, () => [tab('a')]), panel('a')])]))
    expect(errors).toEqual([])
  })
  it('throws for an icon-only TabsTrigger without a name and passes with aria-label', async () => {
    const icon = () => h('svg', { 'aria-hidden': 'true' })
    await open(tabs([el(TabsTrigger, { value: 'a' }, icon)], [panel('a')]))
    expect(messages()).toContain('TabsTrigger: needs an accessible name')
    await reopen(tabs([el(TabsTrigger, { value: 'a', 'aria-label': 'Overview' }, icon)], [panel('a')]))
    expect(errors).toEqual([])
  })
  it('a trigger outside a Tabs root is not checked by the registry', async () => {
    await open(() => el(TabsContent, { value: 'a' }, text('x')))
    expect(messages()).not.toContain('requires every TabsTrigger')
  })
  it('an unmounted Tabs is not checked', async () => {
    wrapper = mount(defineComponent({ setup: () => tabs([tab('a'), tab('b')], [panel('a')]) }), { attachTo: document.body })
    wrapper.unmount()
    wrapper = undefined
    await settle()
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------------------------------------------ Accordion */

const item = (value: string, parts: VNode[] | null = null) =>
  el(AccordionItem, { value }, () => parts ?? [el(AccordionTrigger, null, text(`Question ${value}`)), el(AccordionContent, null, text(`Answer ${value}`))])
const accordion = (...items: VNode[]) => () => el(Accordion, { type: 'single' }, () => items)

describe('Accordion contract', () => {
  it('passes for unique values with a trigger and content in every item', async () => {
    await open(accordion(item('a'), item('b')))
    expect(errors).toEqual([])
  })
  it('throws for a duplicate value, naming it', async () => {
    await open(accordion(item('a'), item('a')))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Accordion: requires a unique `value` on every AccordionItem (duplicate: "a")')
  })
  it('throws for a blank value', async () => {
    await open(accordion(item('')))
    expect(messages()).toContain('Accordion: requires a non-empty `value` on every AccordionItem')
  })
  it('throws when an item has no trigger or no content', async () => {
    await open(accordion(item('a', [el(AccordionContent, null, text('Only content'))])))
    expect(messages()).toContain('AccordionItem: requires a AccordionTrigger')
    await reopen(accordion(item('a', [el(AccordionTrigger, null, text('Only trigger'))])))
    expect(messages()).toContain('AccordionItem: requires a AccordionContent')
  })
  it('finds the trigger however deeply it is nested', async () => {
    await open(accordion(item('a', [h('div', null, [el(AccordionTrigger, null, text('Nested'))]), el(AccordionContent, null, text('Body'))])))
    expect(errors).toEqual([])
  })
  it('throws for an icon-only trigger without a name and passes with aria-label', async () => {
    await open(accordion(item('a', [el(AccordionTrigger, null, { default: () => h('svg', { 'aria-hidden': 'true' }), icon: () => h('svg', { 'aria-hidden': 'true' }) }), el(AccordionContent, null, text('Body'))])))
    expect(messages()).toContain('AccordionTrigger: needs an accessible name')
    await reopen(accordion(item('a', [el(AccordionTrigger, { 'aria-label': 'Details' }, { default: () => h('svg', { 'aria-hidden': 'true' }) }), el(AccordionContent, null, text('Body'))])))
    expect(errors).toEqual([])
  })
})

/* ---------------------------------------------------------------------------------------- Collapsible */

describe('Collapsible contract', () => {
  const collapsible = (...parts: VNode[]) => () => el(Collapsible, null, () => parts)
  it('passes with a trigger and content', async () => {
    await open(collapsible(el(CollapsibleTrigger, null, text('Show')), el(CollapsibleContent, null, text('More'))))
    expect(errors).toEqual([])
  })
  it('throws when the trigger or the content is missing', async () => {
    await open(collapsible(el(CollapsibleContent, null, text('More'))))
    expect(messages()).toContain('Collapsible: requires a CollapsibleTrigger')
    await reopen(collapsible(el(CollapsibleTrigger, null, text('Show'))))
    expect(messages()).toContain('Collapsible: requires a CollapsibleContent')
  })
  it('throws for an icon-only trigger without a name, passes with aria-label, and ignores a custom as-child element', async () => {
    const icon = () => h('svg', { 'aria-hidden': 'true' })
    await open(collapsible(el(CollapsibleTrigger, null, icon), el(CollapsibleContent, null, text('More'))))
    expect(messages()).toContain('CollapsibleTrigger: needs an accessible name')
    await reopen(collapsible(el(CollapsibleTrigger, { 'aria-label': 'Toggle details' }, icon), el(CollapsibleContent, null, text('More'))))
    expect(errors).toEqual([])
    await reopen(collapsible(el(CollapsibleTrigger, { asChild: true }, () => h('div', { tabindex: 0 }, [icon()])), el(CollapsibleContent, null, text('More'))))
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------------------------------------------ Breadcrumb */

describe('Breadcrumb contract', () => {
  const items = [{ label: 'Home', href: '/' }, { label: 'Parent', href: '/parent' }, { label: 'Current' }]
  it('passes in items mode, where the last item is the current page', async () => {
    await open(() => el(Breadcrumb, { items }))
    expect(errors).toEqual([])
  })
  it('throws for an empty or fully malformed items list (no current page)', async () => {
    await open(() => el(Breadcrumb, { items: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Breadcrumb: requires a BreadcrumbPage')
    await reopen(() => el(Breadcrumb, { items: [{ nope: true }] }))
    expect(messages()).toContain('Breadcrumb: requires a BreadcrumbPage')
  })
  it('throws for a blank label and passes with a custom one', async () => {
    await open(() => el(Breadcrumb, { items, label: '' }))
    expect(messages()).toContain('Breadcrumb: requires a non-empty `label`')
    await reopen(() => el(Breadcrumb, { items, label: 'Trail' }))
    expect(errors).toEqual([])
  })
  it('compound mode needs a BreadcrumbPage', async () => {
    const compound = (...children: VNode[]) => () => el(Breadcrumb, null, () => el(BreadcrumbList, null, () => children))
    await open(compound(el(BreadcrumbItem, null, () => el(BreadcrumbLink, { href: '/' }, text('Home')))))
    expect(messages()).toContain('Breadcrumb: requires a BreadcrumbPage')
    await reopen(compound(el(BreadcrumbItem, null, () => el(BreadcrumbLink, { href: '/' }, text('Home'))), el(BreadcrumbItem, null, () => el(BreadcrumbPage, null, text('Now')))))
    expect(errors).toEqual([])
  })
  it('throws for a link without a target in items mode', async () => {
    await open(() => el(Breadcrumb, { items: [{ label: 'Home' }, { label: 'Current' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('BreadcrumbLink: requires `href` or `to`')
  })
  it('BreadcrumbLink accepts href, to, as-child and a button, and rejects an empty target', async () => {
    const page = () => el(BreadcrumbPage, null, text('Now'))
    const crumb = (link: VNode) => () => el(Breadcrumb, null, () => el(BreadcrumbList, null, () => [el(BreadcrumbItem, null, () => link), el(BreadcrumbItem, null, page)]))
    await open(crumb(el(BreadcrumbLink, { href: '/a' }, text('A'))))
    expect(errors).toEqual([])
    await reopen(crumb(el(BreadcrumbLink, { to: '/a' }, text('A'))))
    expect(errors).toEqual([])
    await reopen(crumb(el(BreadcrumbLink, { asChild: true }, () => h('a', { href: '/a' }, 'A'))))
    expect(errors).toEqual([])
    await reopen(crumb(el(BreadcrumbLink, { as: 'button' }, text('A'))))
    expect(errors).toEqual([])
    await reopen(crumb(el(BreadcrumbLink, { href: '' }, text('A'))))
    expect(messages()).toContain('BreadcrumbLink: requires `href` or `to`')
    const Router = defineComponent({ props: { to: { type: [String, Object], default: undefined } }, setup: (p, { slots }) => () => h('a', { href: typeof p.to === 'string' ? p.to : '/x' }, slots.default?.()) })
    await reopen(crumb(el(BreadcrumbLink, { as: Router, to: '/a' }, text('A'))))
    expect(errors).toEqual([])
    await reopen(crumb(el(BreadcrumbLink, { as: Router }, text('A'))))
    expect(messages()).toContain('BreadcrumbLink: requires `href` or `to`')
  })
  it('throws for an icon-only link without a name and passes with aria-label', async () => {
    const icon = () => h('svg', { 'aria-hidden': 'true' })
    const crumb = (link: VNode) => () => el(Breadcrumb, null, () => el(BreadcrumbList, null, () => [el(BreadcrumbItem, null, () => link), el(BreadcrumbItem, null, () => el(BreadcrumbPage, null, text('Now')))]))
    await open(crumb(el(BreadcrumbLink, { href: '/' }, icon)))
    expect(messages()).toContain('BreadcrumbLink: needs an accessible name')
    await reopen(crumb(el(BreadcrumbLink, { href: '/', 'aria-label': 'Home' }, icon)))
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------------------------------------------ Pagination */

describe('Pagination contract', () => {
  it('passes with the defaults and with a full custom label set', async () => {
    await open(() => el(Pagination, { total: 100 }))
    expect(errors).toEqual([])
    await reopen(() => el(Pagination, { total: 100, labels: { nav: 'Pages', first: 'Premiere', previous: 'Avant', next: 'Apres', last: 'Derniere', page: 'Page' } }))
    expect(errors).toEqual([])
  })
  it('throws when a label is blank, naming it', async () => {
    await open(() => el(Pagination, { total: 100, labels: { nav: '' } }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Pagination: requires a non-empty `labels.nav`')
    await reopen(() => el(Pagination, { total: 100, labels: { next: '  ' } }))
    expect(messages()).toContain('`labels.next`')
    await reopen(() => el(Pagination, { total: 100, labels: { last: '' } }))
    expect(messages()).toContain('`labels.last`')
    await reopen(() => el(Pagination, { total: 100, labels: { previous: undefined } }))
    expect(messages()).toContain('`labels.previous`')
  })
  it('the first and last labels only matter while the edge buttons are shown', async () => {
    await open(() => el(Pagination, { total: 100, showEdges: false, labels: { first: '', last: '' } }))
    expect(errors).toEqual([])
  })
  it('still clamps invalid page, total and pageSize without throwing', async () => {
    await open(() => el(Pagination, { total: -5, pageSize: 0, page: 99 }))
    expect(errors).toEqual([])
    await reopen(() => el(Pagination, { total: Number.NaN, pageSize: Number.NaN, defaultPage: -3 }))
    expect(errors).toEqual([])
  })
})

/* -------------------------------------------------------------------------------------------- Stepper */

describe('Stepper contract', () => {
  const steps = [{ title: 'Account' }, { title: 'Plan' }]
  it('passes with titled steps', async () => {
    await open(() => el(Stepper, { steps }))
    expect(errors).toEqual([])
  })
  it('throws for empty or non-array steps', async () => {
    await open(() => el(Stepper, { steps: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Stepper: requires `steps` with at least one step')
    await reopen(() => el(Stepper, { steps: undefined }))
    expect(messages()).toContain('Stepper: requires `steps`')
  })
  it('throws for a step that is not an object', async () => {
    await open(() => el(Stepper, { steps: [{ title: 'One' }, null] }))
    expect(messages()).toContain('Stepper: requires every step to be an object')
    expect(messages()).toContain('step 2')
  })
  it('throws for a step without a title, unless the step slot draws it', async () => {
    await open(() => el(Stepper, { steps: [{ title: 'One' }, { description: 'No title' }] }))
    expect(messages()).toContain('Stepper: requires a non-empty `title` on every step (step 2 has none)')
    await reopen(() => el(Stepper, { steps: [{ title: '  ' }] }))
    expect(messages()).toContain('step 1 has none')
    await reopen(() => el(Stepper, { steps: [{ title: '' }] }, { step: () => 'Custom' }))
    expect(errors).toEqual([])
  })
  it('throws for a blank label', async () => {
    await open(() => el(Stepper, { steps, label: '' }))
    expect(messages()).toContain('Stepper: requires a non-empty `label`')
  })
})

/* ------------------------------------------------------------------------------------------ SidebarNav */

describe('SidebarNav contract', () => {
  const groups = [{ label: 'Project', items: [{ label: 'Overview', href: '/' }, { label: 'Settings', to: '/settings' }, { label: 'Admin', children: [{ label: 'Users', href: '/users' }] }] }]
  it('passes for the documented usage', async () => {
    await open(() => el(SidebarNav, { groups }))
    expect(errors).toEqual([])
  })
  it('throws for empty or missing groups, and for a group without items', async () => {
    await open(() => el(SidebarNav, { groups: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SidebarNav: requires `groups` with at least one group')
    await reopen(() => el(SidebarNav, { groups: undefined }))
    expect(messages()).toContain('SidebarNav: requires `groups`')
    await reopen(() => el(SidebarNav, { groups: [{ label: 'Empty', items: [] }] }))
    expect(messages()).toContain('requires every group to have an `items` array')
    await reopen(() => el(SidebarNav, { groups: [null] }))
    expect(messages()).toContain('requires every group to have an `items` array')
  })
  it('throws for an item without a label, including nested children', async () => {
    await open(() => el(SidebarNav, { groups: [{ items: [{ label: '', href: '/' }] }] }))
    expect(messages()).toContain('SidebarNav: requires a non-empty `label` on every item (group 1 item 1 has none)')
    await reopen(() => el(SidebarNav, { groups: [{ items: [{ label: 'Parent', children: [{ href: '/x' }] }] }] }))
    expect(messages()).toContain('group 1 item 1 ("Parent") child item 1')
  })
  it('throws for a non-object item', async () => {
    await open(() => el(SidebarNav, { groups: [{ items: [null] }] }))
    expect(messages()).toContain('SidebarNav: requires every item to be an object')
  })
  it('throws for an item with neither a target nor an action, and accepts @navigate, disabled, href, to and children', async () => {
    await open(() => el(SidebarNav, { groups: [{ items: [{ label: 'Nowhere' }] }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires `href` or `to` on group 1 item 1 ("Nowhere")')
    await reopen(() => el(SidebarNav, { groups: [{ items: [{ label: 'Run it' }] }], onNavigate: () => {} }))
    expect(errors).toEqual([])
    expect(document.querySelector('[data-slot="nav-link"]')?.tagName).toBe('BUTTON')
    await reopen(() => el(SidebarNav, { groups: [{ items: [{ label: 'Off', disabled: true }, { label: 'Router', to: { name: 'home' }, as: 'a' }] }] }))
    expect(errors).toEqual([])
  })
  it('renders an action item nested under a parent as a button too', async () => {
    await open(() => el(SidebarNav, { groups: [{ items: [{ label: 'Parent', children: [{ label: 'Act' }] }] }], current: '/', onNavigate: () => {} }))
    expect(errors).toEqual([])
  })
  it('throws for a blank label', async () => {
    await open(() => el(SidebarNav, { groups, label: '' }))
    expect(messages()).toContain('SidebarNav: requires a non-empty `label`')
  })
})

/* ----------------------------------------------------------------------------------------- DocsSidebar */

describe('DocsSidebar contract', () => {
  const sections = [{ title: 'Guides', items: [{ label: 'Start', href: '/start' }, { label: 'Router', to: '/router' }] }]
  it('passes for the documented usage', async () => {
    await open(() => el(DocsSidebar, { sections }))
    expect(errors).toEqual([])
  })
  it('throws for empty sections, a section without items or a title, and a bad link', async () => {
    await open(() => el(DocsSidebar, { sections: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('DocsSidebar: requires `sections` with at least one section')
    await reopen(() => el(DocsSidebar, { sections: undefined }))
    expect(messages()).toContain('DocsSidebar: requires `sections`')
    await reopen(() => el(DocsSidebar, { sections: [{ title: 'Empty', items: [] }] }))
    expect(messages()).toContain('requires every section to have an `items` array')
    await reopen(() => el(DocsSidebar, { sections: [{ title: ' ', items: [{ label: 'A', href: '/a' }] }] }))
    expect(messages()).toContain('DocsSidebar: requires a non-empty `title` on every section')
    await reopen(() => el(DocsSidebar, { sections: [{ title: 'Guides', items: [{ label: '', href: '/a' }] }] }))
    expect(messages()).toContain('DocsSidebar: requires a non-empty `label` on every item')
    await reopen(() => el(DocsSidebar, { sections: [{ title: 'Guides', items: [{ label: 'No target' }] }] }))
    expect(messages()).toContain('DocsSidebar: requires `href` or `to` on section "Guides" item 1 ("No target")')
  })
  it('accepts an @navigate action and renders it as a button', async () => {
    await open(() => el(DocsSidebar, { sections: [{ title: 'Guides', items: [{ label: 'Run' }] }], onNavigate: () => {} }))
    expect(errors).toEqual([])
    expect(document.querySelector('[data-slot="nav-link"]')?.tagName).toBe('BUTTON')
  })
  it('throws for a blank label', async () => {
    await open(() => el(DocsSidebar, { sections, label: '' }))
    expect(messages()).toContain('DocsSidebar: requires a non-empty `label`')
  })
})

/* ------------------------------------------------------------------------------------------ AppHeader */

describe('AppHeader contract', () => {
  const nav = () => h('a', { href: '/components' }, 'Components')
  const mobile = () => h('a', { href: '/components' }, 'Components')
  it('passes with nav and mobile slots, or with neither', async () => {
    await open(() => el(AppHeader, null, { brand: () => 'Sample', nav, mobile }))
    expect(errors).toEqual([])
    await reopen(() => el(AppHeader, null, { brand: () => 'Sample' }))
    expect(errors).toEqual([])
    await reopen(() => el(AppHeader, null, { mobile }))
    expect(errors).toEqual([])
  })
  it('throws when a nav slot is given without a mobile slot', async () => {
    await open(() => el(AppHeader, null, { nav }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('AppHeader: requires a `mobile` slot when a `nav` slot is given')
  })
  it('throws for a blank menuLabel (with a mobile slot) and a blank navLabel (with a nav slot)', async () => {
    await open(() => el(AppHeader, { menuLabel: '' }, { mobile }))
    expect(messages()).toContain('AppHeader: requires a non-empty `menuLabel`')
    await reopen(() => el(AppHeader, { navLabel: ' ' }, { nav, mobile }))
    expect(messages()).toContain('AppHeader: requires a non-empty `navLabel`')
  })
  it('does not check a label whose element is not rendered', async () => {
    await open(() => el(AppHeader, { menuLabel: '', navLabel: '' }, { brand: () => 'Sample' }))
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------------------------------------------ MobileNav */

describe('MobileNav contract', () => {
  it('passes when it is controlled or starts open', async () => {
    await open(() => el(MobileNav, { open: false, 'onUpdate:open': () => {} }))
    expect(errors).toEqual([])
    await reopen(() => el(MobileNav, { defaultOpen: true }))
    expect(errors).toEqual([])
  })
  it('throws when nothing can open it, naming the fix', async () => {
    await open(() => el(MobileNav))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('MobileNav: requires `v-model:open`')
    expect(errors[0].message).toContain('AppHeader')
  })
  it('throws for a blank label and passes with its own', async () => {
    await open(() => el(MobileNav, { open: false, label: '' }))
    expect(messages()).toContain('MobileNav: requires a non-empty `label`')
    await reopen(() => el(MobileNav, { open: false, label: 'Site menu' }))
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------------------------------------------ SkipLink */

describe('SkipLink contract', () => {
  it('passes when the target exists in the document, in the same tree or elsewhere', async () => {
    await open(() => h('div', null, [el(SkipLink), h('main', { id: 'main-content' }, 'Body')]))
    expect(errors).toEqual([])
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = '<div id="elsewhere"></div>'
    await open(() => el(SkipLink, { href: '#elsewhere' }))
    expect(errors).toEqual([])
  })
  it('throws when the fragment target is missing, naming the id', async () => {
    await open(() => el(SkipLink))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SkipLink: requires an element with id="main-content"')
    await reopen(() => el(SkipLink, { href: '#a%20b' }))
    expect(messages()).toContain('id="a b"')
  })
  it('looks the id up as written when it has a malformed escape', async () => {
    await open(() => el(SkipLink, { href: '#100%' }))
    expect(messages()).toContain('id="100%"')
  })
  it('does not check a link to another page or a bare hash', async () => {
    await open(() => el(SkipLink, { href: '/other#main' }))
    expect(errors).toEqual([])
    await reopen(() => el(SkipLink, { href: '#' }))
    expect(errors).toEqual([])
  })
  it('throws for a blank href', async () => {
    await open(() => el(SkipLink, { href: '' }))
    expect(messages()).toContain('SkipLink: requires a non-empty `href`')
  })
  it('throws for an empty link text and passes with a slot or aria-label', async () => {
    const target = () => h('main', { id: 'main-content' })
    await open(() => [el(SkipLink, null, text('')), target()])
    expect(messages()).toContain('SkipLink: needs an accessible name')
    await reopen(() => [el(SkipLink, null, text('Skip to content')), target()])
    expect(errors).toEqual([])
    await reopen(() => [el(SkipLink, { 'aria-label': 'Skip' }, text('')), target()])
    expect(errors).toEqual([])
  })
})

/* ---------------------------------------------------------------------------------------- TableOfContents */

describe('TableOfContents contract', () => {
  const items = [{ id: 'intro', label: 'Introduction' }, { id: 'usage', label: 'Usage', level: 2 }]
  it('passes without the ids existing in the page', async () => {
    await open(() => el(TableOfContents, { items }))
    expect(errors).toEqual([])
  })
  it('throws for empty or missing items', async () => {
    await open(() => el(TableOfContents, { items: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TableOfContents: requires `items` with at least one entry')
    await reopen(() => el(TableOfContents, { items: undefined }))
    expect(messages()).toContain('TableOfContents: requires `items`')
  })
  it('throws for an item without an id or label, and for duplicate ids', async () => {
    await open(() => el(TableOfContents, { items: [{ id: 'a', label: 'A' }, { id: '', label: 'B' }] }))
    expect(messages()).toContain('TableOfContents: requires a non-empty `id` and `label` on every item (item 2 lacks one)')
    await reopen(() => el(TableOfContents, { items: [{ id: 'a', label: ' ' }] }))
    expect(messages()).toContain('item 1 lacks one')
    await reopen(() => el(TableOfContents, { items: [null] }))
    expect(messages()).toContain('item 1 lacks one')
    await reopen(() => el(TableOfContents, { items: [{ id: 'a', label: 'A' }, { id: 'a', label: 'Again' }] }))
    expect(messages()).toContain('TableOfContents: requires a unique `id` per item (duplicate: "a")')
  })
})

/* ------------------------------------------------------------------------------------------ Menubar */

describe('Menubar contract', () => {
  const menu = (value: string | undefined, parts?: VNode[]) =>
    el(MenubarMenu, value === undefined ? null : { value }, () => parts ?? [el(MenubarTrigger, null, text(`Menu ${value}`)), el(MenubarContent, null, () => el(MenubarItem, null, text('Open')))])
  const bar = (menus: VNode[], props: Record<string, unknown> | null = { 'aria-label': 'Application menu' }) => () => el(Menubar, props, () => menus)

  it('passes for the documented usage', async () => {
    await open(bar([menu('file'), menu('edit')]))
    expect(errors).toEqual([])
  })
  it('throws when the bar has no name and passes with aria-label or aria-labelledby', async () => {
    await open(bar([menu('file')], null))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Menubar: needs an accessible name')
    await reopen(() => h('div', null, [h('h2', { id: 'bar-name' }, 'Actions'), el(Menubar, { 'aria-labelledby': 'bar-name' }, () => [menu('file')])]))
    expect(errors).toEqual([])
  })
  it('throws for a duplicate or blank menu value', async () => {
    await open(bar([menu('file'), menu('file')]))
    expect(messages()).toContain('Menubar: requires a unique `value` on every MenubarMenu (duplicate: "file")')
    await reopen(bar([menu(undefined)]))
    expect(messages()).toContain('Menubar: requires a non-empty `value` on every MenubarMenu')
  })
  it('throws when a menu has no trigger or no content', async () => {
    await open(bar([menu('file', [el(MenubarContent, null, () => el(MenubarItem, null, text('Open')))])]))
    expect(messages()).toContain('MenubarMenu: requires a MenubarTrigger')
    await reopen(bar([menu('file', [el(MenubarTrigger, null, text('File'))])]))
    expect(messages()).toContain('MenubarMenu: requires a MenubarContent')
  })
  it('throws for an icon-only trigger without a name and passes with aria-label', async () => {
    const icon = () => h('svg', { 'aria-hidden': 'true' })
    const withTrigger = (trigger: VNode) => bar([menu('file', [trigger, el(MenubarContent, null, () => el(MenubarItem, null, text('Open')))])])
    await open(withTrigger(el(MenubarTrigger, null, icon)))
    expect(messages()).toContain('MenubarTrigger: needs an accessible name')
    await reopen(withTrigger(el(MenubarTrigger, { 'aria-label': 'File' }, icon)))
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------------------------------------ NavigationMenu */

describe('NavigationMenu contract', () => {
  const link = (label = 'Guides', href = '/guides') => el(NavigationMenuLink, { href }, text(label))
  const pair = (value?: string) =>
    el(NavigationMenuItem, value === undefined ? null : { value }, () => [el(NavigationMenuTrigger, null, text('Components')), el(NavigationMenuContent, null, () => link('Button', '/button'))])
  const menu = (...items: VNode[]) => () => el(NavigationMenu, null, () => el(NavigationMenuList, null, () => items))

  it('passes for triggers with content and plain links', async () => {
    await open(menu(pair('components'), el(NavigationMenuItem, null, () => link())))
    expect(errors).toEqual([])
  })
  it('throws for an item outside a NavigationMenuList', async () => {
    await open(() => el(NavigationMenu, null, () => el(NavigationMenuItem, null, () => link())))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('NavigationMenuItem: requires a parent NavigationMenuList')
  })
  it('throws for a trigger without content and for content without a trigger', async () => {
    await open(menu(el(NavigationMenuItem, { value: 'a' }, () => el(NavigationMenuTrigger, null, text('Components')))))
    expect(messages()).toContain('NavigationMenuItem: requires a NavigationMenuTrigger and a NavigationMenuContent together (this item has a trigger but no content)')
    await reopen(menu(el(NavigationMenuItem, { value: 'a' }, () => el(NavigationMenuContent, null, () => link()))))
    expect(messages()).toContain('this item has content but no trigger')
  })
  it('throws when a trigger and content pair has no value, or two items share one', async () => {
    await open(menu(pair()))
    expect(messages()).toContain('NavigationMenuItem: requires a unique `value`')
    await reopen(menu(pair('same'), pair('same')))
    expect(messages()).toContain('NavigationMenuList: requires a unique `value` on every NavigationMenuItem (duplicate: "same")')
  })
  it('throws for an icon-only trigger or link without a name and passes with aria-label', async () => {
    const icon = () => h('svg', { 'aria-hidden': 'true' })
    const item = (trigger: VNode) => el(NavigationMenuItem, { value: 'a' }, () => [trigger, el(NavigationMenuContent, null, () => link())])
    await open(menu(item(el(NavigationMenuTrigger, null, icon))))
    expect(messages()).toContain('NavigationMenuTrigger: needs an accessible name')
    await reopen(menu(item(el(NavigationMenuTrigger, { 'aria-label': 'Components' }, icon))))
    expect(errors).toEqual([])
    await reopen(menu(el(NavigationMenuItem, null, () => el(NavigationMenuLink, { href: '/x' }, icon))))
    expect(messages()).toContain('NavigationMenuLink: needs an accessible name')
    await reopen(menu(el(NavigationMenuItem, null, () => el(NavigationMenuLink, { href: '/x', 'aria-label': 'Home' }, icon))))
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------------------------------------------ NavLink */

describe('NavLink contract', () => {
  const Router = defineComponent({ props: { to: { type: [String, Object], default: undefined } }, setup: (p, { slots }) => () => h('a', { href: typeof p.to === 'string' ? p.to : '/x' }, slots.default?.()) })
  it('passes with href, to, a router component, as-child, a button, or disabled', async () => {
    await open(() => el(NavLink, { href: '/a' }, text('A')))
    expect(errors).toEqual([])
    await reopen(() => el(NavLink, { to: '/a' }, text('A')))
    expect(errors).toEqual([])
    await reopen(() => el(NavLink, { as: Router, to: '/a' }, text('A')))
    expect(errors).toEqual([])
    await reopen(() => el(NavLink, { asChild: true }, () => h('a', { href: '/a' }, 'A')))
    expect(errors).toEqual([])
    await reopen(() => el(NavLink, { as: 'button' }, text('Run')))
    expect(errors).toEqual([])
    await reopen(() => el(NavLink, { disabled: true }, text('Off')))
    expect(errors).toEqual([])
  })
  it('throws without href or to, naming the fix', async () => {
    await open(() => el(NavLink, null, text('Nowhere')))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('NavLink: requires `href` or `to`')
    expect(errors[0].message).toContain('as="button"')
    await reopen(() => el(NavLink, { as: Router }, text('Nowhere')))
    expect(messages()).toContain('NavLink: requires `href` or `to`')
  })
  it('throws for a link with no text and passes with aria-label or a collapsed label', async () => {
    const icon = () => h('svg', { 'aria-hidden': 'true' })
    await open(() => el(NavLink, { href: '/a' }, icon))
    expect(messages()).toContain('NavLink: needs an accessible name')
    await reopen(() => el(NavLink, { href: '/a', 'aria-label': 'Home' }, icon))
    expect(errors).toEqual([])
    await reopen(() => el(NavLink, { href: '/a', collapsed: true }, text('Home')))
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------------------------- ThemeToggle, AccentPicker */

describe('Pinia requirement', () => {
  beforeEach(() => setActivePinia(undefined))
  afterEach(() => setActivePinia(undefined))

  it('ThemeToggle throws a ContractError when Pinia is missing, naming the fix', async () => {
    await open(() => el(ThemeToggle), false)
    // Vue still renders after a failed setup and reports a follow-up error; the first one is the contract.
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('ThemeToggle: requires an active Pinia instance')
    expect(errors[0].message).toContain('createPinia')
  })
  it('AccentPicker throws a ContractError when Pinia is missing', async () => {
    await open(() => el(AccentPicker), false)
    expect(errors[0]?.name).toBe('ContractError')
    expect(errors[0].message).toContain('AccentPicker: requires an active Pinia instance')
  })
  it('StylePicker throws a ContractError when Pinia is missing', async () => {
    await open(() => el(StylePicker), false)
    expect(errors[0]?.name).toBe('ContractError')
    expect(errors[0].message).toContain('StylePicker: requires an active Pinia instance')
  })
  it('StylePicker throws for a blank label and for no known style', async () => {
    await open(() => el(StylePicker, { label: '' }))
    expect(messages()).toContain('StylePicker: requires a non-empty `label`')
    await reopen(() => el(StylePicker, { styles: ['neon'] }))
    expect(messages()).toContain('StylePicker: requires at least one known style')
    await reopen(() => el(StylePicker, { styles: ['raw', 'neon'] }))
    expect(errors).toEqual([])
  })
  it('FontPicker throws a ContractError when Pinia is missing', async () => {
    await open(() => el(FontPicker), false)
    expect(errors[0]?.name).toBe('ContractError')
    expect(errors[0].message).toContain('FontPicker: requires an active Pinia instance')
  })
  it('FontPicker throws for a blank label and for no known font', async () => {
    await open(() => el(FontPicker, { label: '' }))
    expect(messages()).toContain('FontPicker: requires a non-empty `label`')
    await reopen(() => el(FontPicker, { fonts: ['comic'] }))
    expect(messages()).toContain('FontPicker: requires at least one known font')
    await reopen(() => el(FontPicker, { fonts: ['serif', 'comic'] }))
    expect(errors).toEqual([])
  })
  it('CornerPicker throws a ContractError when Pinia is missing', async () => {
    await open(() => el(CornerPicker), false)
    expect(errors[0]?.name).toBe('ContractError')
    expect(errors[0].message).toContain('CornerPicker: requires an active Pinia instance')
  })
  it('CornerPicker throws for a blank label and for no known corner shape', async () => {
    await open(() => el(CornerPicker, { label: '' }))
    expect(messages()).toContain('CornerPicker: requires a non-empty `label`')
    await reopen(() => el(CornerPicker, { corners: ['blob'] }))
    expect(messages()).toContain('CornerPicker: requires at least one known corner shape')
    await reopen(() => el(CornerPicker, { corners: ['squircle', 'blob'] }))
    expect(errors).toEqual([])
  })
  it('PalettePicker throws a ContractError when Pinia is missing', async () => {
    await open(() => el(PalettePicker), false)
    expect(errors[0]?.name).toBe('ContractError')
    expect(errors[0].message).toContain('PalettePicker: requires an active Pinia instance')
  })
  it('PalettePicker throws for a blank label and for no known palette', async () => {
    await open(() => el(PalettePicker, { label: '' }))
    expect(messages()).toContain('PalettePicker: requires a non-empty `label`')
    await reopen(() => el(PalettePicker, { palettes: ['neon'] }))
    expect(messages()).toContain('PalettePicker: requires at least one known palette')
    await reopen(() => el(PalettePicker, { palettes: ['harbor', 'neon'] }))
    expect(errors).toEqual([])
  })
  it('CodeThemePicker throws a ContractError when Pinia is missing', async () => {
    await open(() => el(CodeThemePicker), false)
    expect(errors[0]?.name).toBe('ContractError')
    expect(errors[0].message).toContain('CodeThemePicker: requires an active Pinia instance')
  })
  it('CodeThemePicker throws for a blank label and for no known theme', async () => {
    await open(() => el(CodeThemePicker, { label: '' }))
    expect(messages()).toContain('CodeThemePicker: requires a non-empty `label`')
    await reopen(() => el(CodeThemePicker, { themes: ['neon'] }))
    expect(messages()).toContain('CodeThemePicker: requires at least one known theme')
    await reopen(() => el(CodeThemePicker, { themes: ['mist', 'neon'] }))
    expect(errors).toEqual([])
  })
  it('both pass with Pinia installed on the app or active globally', async () => {
    await open(() => [el(ThemeToggle), el(AccentPicker)])
    expect(errors).toEqual([])
    setActivePinia(createPinia())
    await reopen(() => [el(ThemeToggle), el(AccentPicker)], false)
    expect(errors).toEqual([])
  })
  it('AccentPicker throws for a blank label and for no known accent', async () => {
    await open(() => el(AccentPicker, { label: '' }))
    expect(messages()).toContain('AccentPicker: requires a non-empty `label`')
    await reopen(() => el(AccentPicker, { accents: ['neon'] }))
    expect(messages()).toContain('AccentPicker: requires at least one known accent')
    await reopen(() => el(AccentPicker, { accents: ['rose', 'neon'] }))
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------------------------------------ modes: warn, off */

describe('strict modes', () => {
  const broken: [string, () => unknown, string][] = [
    ['Tabs', tabs([tab('a'), tab('b')], [panel('a')]), 'Tabs: requires every TabsTrigger'],
    ['Accordion', accordion(item('a'), item('a')), 'Accordion: requires a unique'],
    ['Collapsible', () => el(Collapsible, null, () => el(CollapsibleTrigger, null, text('Show'))), 'Collapsible: requires a CollapsibleContent'],
    ['Breadcrumb', () => el(Breadcrumb, { items: [] }), 'Breadcrumb: requires a BreadcrumbPage'],
    ['Pagination', () => el(Pagination, { labels: { nav: '' } }), 'Pagination: requires a non-empty'],
    ['Stepper', () => el(Stepper, { steps: [] }), 'Stepper: requires `steps`'],
    ['SidebarNav', () => el(SidebarNav, { groups: [] }), 'SidebarNav: requires `groups`'],
    ['DocsSidebar', () => el(DocsSidebar, { sections: [] }), 'DocsSidebar: requires `sections`'],
    ['AppHeader', () => el(AppHeader, null, { nav: () => 'Nav' }), 'AppHeader: requires a `mobile` slot'],
    ['MobileNav', () => el(MobileNav), 'MobileNav: requires `v-model:open`'],
    ['SkipLink', () => el(SkipLink), 'SkipLink: requires an element with id'],
    ['TableOfContents', () => el(TableOfContents, { items: [] }), 'TableOfContents: requires `items`'],
    ['Menubar', () => el(Menubar, null, () => el(MenubarMenu, { value: 'a' }, () => [el(MenubarTrigger, null, text('A')), el(MenubarContent)])), 'Menubar: needs an accessible name'],
    ['NavigationMenu', () => el(NavigationMenu, null, () => el(NavigationMenuItem)), 'NavigationMenuItem: requires a parent NavigationMenuList'],
    ['NavLink', () => el(NavLink, null, text('Nowhere')), 'NavLink: requires `href` or `to`'],
    ['AccentPicker', () => el(AccentPicker, { accents: [] }), 'AccentPicker: requires at least one known accent'],
    ['StylePicker', () => el(StylePicker, { styles: [] }), 'StylePicker: requires at least one known style'],
  ]

  it.each(broken)('%s throws in throw mode', async (_name, render, message) => {
    await open(render)
    expect(messages()).toContain(message)
  })
  it.each(broken)('%s logs without throwing in warn mode', async (_name, render, message) => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await open(render)
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes(message))).toBe(true)
  })
  it.each(broken)('%s is silent in off mode', async (_name, render) => {
    configureStrictMode('off')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await open(render)
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('[perfect-design]'))).toBe(false)
  })
})
