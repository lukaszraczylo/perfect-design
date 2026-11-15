import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { cn } from '../../../lib/cn'
import {
  NAVIGATION_MENU_SIZES,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(rootProps: Record<string, unknown> = {}, triggerProps: Record<string, unknown> = {}) {
  const Comp = defineComponent({
    setup: () => () =>
      h(NavigationMenu, { 'aria-label': 'Main', viewport: false, ...rootProps }, () =>
        h(NavigationMenuList, null, () => [
          h(NavigationMenuItem, { value: 'a' }, () => [h(NavigationMenuTrigger, triggerProps, () => 'Panel'), h(NavigationMenuContent, null, () => h(NavigationMenuLink, { href: '/c' }, () => 'Inside'))]),
          h(NavigationMenuItem, null, () => h(NavigationMenuLink, { href: '/x', variant: 'trigger' }, () => 'Link')),
        ]),
      ),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return wrapper
}
const trigger = () => document.body.querySelector<HTMLElement>('[data-slot="navigation-menu-trigger"]')!
const link = () => document.body.querySelector<HTMLElement>('[data-slot="navigation-menu-link"]')!
const root = () => document.body.querySelector<HTMLElement>('[data-slot="navigation-menu"]')!
const reset = () => {
  wrapper?.unmount()
  document.body.innerHTML = ''
}

describe('NavigationMenu size', () => {
  it('md is the default and keeps today\'s trigger and link classes', () => {
    make()
    expect(root().dataset.size).toBe('md')
    for (const el of [trigger(), link()]) {
      expect(el.className).toContain('h-9')
      expect(el.className).toContain('px-4')
      expect(el.className).toContain('text-sm')
    }
    expect(navigationMenuTriggerStyle({ size: 'md' })).toBe(navigationMenuTriggerStyle())
  })

  it.each([
    ['sm', 'h-8', 'px-3', 'text-xs', 'h-9'],
    ['lg', 'h-11', 'px-5', 'text-base', 'h-9'],
  ])('%s scales triggers and top-level links (%s %s %s)', (size, h, px, text, old) => {
    make({ size })
    expect(root().dataset.size).toBe(size)
    for (const el of [trigger(), link()]) {
      expect(el.className).toContain(h)
      expect(el.className).toContain(px)
      expect(el.className).toContain(text)
      expect(el.className).not.toContain(old)
      expect(el.className).not.toMatch(/\btext-sm\b/)
      expect(el.className).toContain('pointer-coarse:min-h-11')
    }
  })

  it('does not resize panel rows (variant content keeps its own spacing)', async () => {
    make({ size: 'lg' })
    trigger().click()
    await new Promise((r) => setTimeout(r, 10))
    const row = [...document.body.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-link"]')].find((l) => l.textContent === 'Inside')
    expect(row?.className ?? 'p-2').toContain('p-2')
    expect(row?.className ?? '').not.toContain('h-11')
  })

  it('unknown size falls back to md; every size is different', () => {
    make({ size: 'giant' })
    expect(root().dataset.size).toBe('md')
    expect(trigger().className).toContain('h-9')
    reset()
    const seen = new Set<string>()
    for (const size of NAVIGATION_MENU_SIZES) {
      make({ size })
      seen.add(`${trigger().className}|${link().className}`)
      reset()
    }
    expect(seen.size).toBe(3)
  })

  it('combines with the trigger variants and a class override', () => {
    make({ size: 'sm' }, { variant: 'outline', class: 'h-12' })
    expect(trigger().className).toContain('border-input')
    expect(trigger().className).toContain('h-12')
    expect(trigger().className).not.toContain('h-8')
    expect(trigger().className).toContain('text-xs')
  })

  it('keeps aria wiring and the focus ring in every size', () => {
    for (const size of NAVIGATION_MENU_SIZES) {
      make({ size })
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().className).toContain('focus-visible:ring-3')
      expect(root().tagName).toBe('NAV')
      reset()
    }
  })

  it('exported style works on plain anchors through cn()', () => {
    expect(cn(navigationMenuTriggerStyle({ size: 'sm' }))).not.toContain('h-9')
    expect(cn(navigationMenuTriggerStyle({ size: 'lg', variant: 'ghost' }))).toContain('h-11')
    expect(cn(navigationMenuTriggerStyle({ size: 'lg', variant: 'ghost' }))).toContain('bg-transparent')
  })

  it('a trigger used without a NavigationMenu root keeps the default size', () => {
    expect(navigationMenuTriggerStyle()).toContain('h-9')
    expect(navigationMenuTriggerStyle({ size: 'sm' })).toContain('h-8')
  })
})
