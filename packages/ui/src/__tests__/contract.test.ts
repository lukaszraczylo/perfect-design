/**
 * The universal customisation contract (AGENTS.md) checked on every documented component, not only the ones whose own
 * tests remembered to: a root element with a kebab-case `data-slot`, and the `class` prop reaching the DOM.
 * Components that cannot render on their own (compound parts that need a parent, portalled overlays) are listed in
 * NEEDS_PARENT with the reason, and are covered through their documented examples instead.
 */
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import type { Component } from 'vue'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { ComponentDoc } from '../docs-types'
import * as UI from '../index'

const docs = Object.values(import.meta.glob<{ default: ComponentDoc }>('../components/**/*.docs.ts', { eager: true })).map((m) => m.default)

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()

/** Components that render nothing (or need a parent / provider / required slot content) when mounted alone. */
const NEEDS_PARENT = new Set([
  'Dialog', 'AlertDialog', 'Sheet', 'Popover', 'Tooltip', 'HoverCard', 'DropdownMenu', 'ContextMenu', 'Menubar', 'NavigationMenu', 'ShortcutsDialog', // root only, content is portalled and closed
  'Command', 'Tour', 'Lightbox', 'ConfirmDialog', 'Toaster', 'Select', 'Combobox', 'Collapsible', 'Accordion', 'Tabs', // reka roots or closed overlays
  'RadioGroup', 'ToggleGroup', 'Carousel', 'ResizablePanels', 'AppShell', 'Pagination', 'Breadcrumb', 'Stepper', 'Table', 'DescriptionList', 'List', 'Timeline', 'Card', 'AvatarGroup', // compound roots need parts
  'ThemeToggle', 'AccentPicker', 'StylePicker', 'ConfirmHost', 'NotificationList', 'DataTable', 'Tree', 'InstallTabs', 'FaqList', 'BoardColumn', 'BoardCard', 'StatGroup', 'ScrollArea', 'Field', 'FieldGroup',
])

let asserted = 0

describe('customisation contract', () => {
  afterAll(() => {
    // Guard against the harness silently skipping everything: most cases must really have asserted the contract.
    expect(asserted).toBeGreaterThan(70)
  })

  const cases = docs.filter((d) => !NEEDS_PARENT.has(d.name) && d.props.some((p) => p.name === 'class')).map((d) => [d.name, d] as const)

  it('covers a meaningful share of the library', () => expect(cases.length).toBeGreaterThan(60))

  it.each(cases)('%s: class prop reaches the DOM and a data-slot hook exists', (name, doc) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const component = (UI as Record<string, unknown>)[name] as Component
    const requiredProps: Record<string, unknown> = {}
    // Mount with the documented minimum: required props get a neutral value of the documented type.
    for (const p of doc.props.filter((p) => p.required)) requiredProps[p.name] = /\[\]|array/i.test(p.type) ? [] : /number/i.test(p.type) ? 1 : /boolean/i.test(p.type) ? false : /object|record/i.test(p.type) ? {} : 'x'
    let w
    try {
      w = mount(component as never as Component, { props: { ...requiredProps, class: 'zz-contract-class' }, slots: { default: 'Sample' }, global: { plugins: [createPinia()] }, attachTo: document.body })
    } catch {
      warn.mockRestore()
      err.mockRestore()
      return // needs props this generic harness cannot guess: its own tests and documented examples cover it
    }
    const html = document.body.innerHTML
    warn.mockRestore()
    err.mockRestore()
    if (html.trim() === '' || html.includes('<!--v-if-->') && !html.includes('data-slot')) {
      w.unmount()
      return // rendered nothing without further props
    }
    asserted++
    expect(html, `${name}: the class prop must reach the DOM`).toContain('zz-contract-class')
    const slots = [...html.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1])
    expect(slots.length, `${name}: expected a data-slot hook`).toBeGreaterThan(0)
    for (const s of slots) expect(s, `${name}: data-slot "${s}" must be kebab-case`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    expect(slots.some((s) => s === kebab(name) || s.startsWith(kebab(name).split('-')[0])), `${name}: some data-slot should relate to the component name (got ${slots.join(', ')})`).toBe(true)
    w.unmount()
    document.body.innerHTML = ''
  })
})
