import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { cn } from '../../../lib/cn'
import { MENUBAR_SIZES, Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger, menubarTriggerVariants, menubarVariants } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})
const tick = () => new Promise((r) => setTimeout(r, 5))

function make(rootProps: Record<string, unknown> = {}, triggerClass?: string) {
  const Comp = defineComponent({
    setup: () => () =>
      h(Menubar, { 'aria-label': 'App', ...rootProps }, () => [
        h(MenubarMenu, { value: 'file' }, () => [h(MenubarTrigger, { class: triggerClass }, () => 'File'), h(MenubarContent, null, () => h(MenubarItem, null, () => 'Open'))]),
        h(MenubarMenu, { value: 'edit' }, () => [h(MenubarTrigger, null, () => 'Edit'), h(MenubarContent, null, () => h(MenubarItem, null, () => 'Undo'))]),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return wrapper
}
const bar = () => document.body.querySelector<HTMLElement>('[data-slot="menubar"]')!
const triggers = () => [...document.body.querySelectorAll<HTMLElement>('[data-slot="menubar-trigger"]')]

describe('Menubar size', () => {
  it('md is the default and keeps today\'s classes', () => {
    make()
    expect(bar().dataset.size).toBe('md')
    expect(bar().className).toBe('flex h-9 max-w-full items-center gap-1 overflow-x-auto rounded-md border bg-background p-1 text-foreground shadow-xs')
    expect(menubarVariants()).toBe(bar().className)
    expect(triggers()[0].className).toContain('px-2 py-1 text-sm')
    expect(menubarTriggerVariants({ size: 'md' })).toBe(menubarTriggerVariants())
  })

  it('sm: a 32px bar and compact triggers that still reach 24px', () => {
    make({ size: 'sm' })
    expect(bar().dataset.size).toBe('sm')
    expect(bar().className).toContain('h-8')
    expect(bar().className).not.toContain('h-9')
    for (const t of triggers()) {
      expect(t.className).toContain('text-xs')
      expect(t.className).toContain('px-1.5')
      expect(t.className).toContain('py-1')
      expect(t.className).not.toMatch(/\btext-sm\b/)
      expect(t.className).toContain('pointer-coarse:min-h-11')
    }
  })

  it('lg: a 44px bar and roomier triggers', () => {
    make({ size: 'lg' })
    expect(bar().className).toContain('h-11')
    expect(triggers()[0].className).toContain('text-base')
    expect(triggers()[0].className).toContain('px-3')
    expect(triggers()[0].className).toContain('py-1.5')
    expect(triggers()[0].className).not.toContain('px-2')
  })

  it('unknown size falls back to md; every size is different', () => {
    make({ size: 'giant' })
    expect(bar().dataset.size).toBe('md')
    expect(bar().className).toContain('h-9')
    wrapper?.unmount()
    document.body.innerHTML = ''
    const seen = new Set<string>()
    for (const size of MENUBAR_SIZES) {
      make({ size })
      seen.add(`${bar().className}|${triggers()[0].className}`)
      wrapper?.unmount()
      document.body.innerHTML = ''
    }
    expect(seen.size).toBe(3)
  })

  it('class on the bar and on a trigger wins over the size', () => {
    make({ size: 'lg', class: 'h-14 bg-red-500' }, 'px-9')
    expect(bar().className).toContain('h-14')
    expect(bar().className).not.toContain('h-11')
    expect(bar().className).toContain('bg-red-500')
    expect(triggers()[0].className).toContain('px-9')
    expect(triggers()[0].className).not.toContain('px-3')
  })

  it('keeps roles, names, focus ring and opening in every size', async () => {
    for (const size of MENUBAR_SIZES) {
      make({ size })
      expect(bar().getAttribute('role')).toBe('menubar')
      expect(bar().getAttribute('aria-label')).toBe('App')
      expect(triggers()[0].className, size).toContain('focus-visible:ring-3')
      triggers()[0].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse' }))
      await tick()
      expect(triggers()[0].getAttribute('aria-expanded'), size).toBe('true')
      expect(document.body.querySelector('[role="menu"]')).not.toBeNull()
      wrapper?.unmount()
      document.body.innerHTML = ''
    }
  })

  it('exported variants merge through cn()', () => {
    expect(cn(menubarVariants({ size: 'sm' }))).not.toContain('h-9')
    expect(cn(menubarTriggerVariants({ size: 'lg' }))).not.toContain('px-2')
    expect(cn(menubarTriggerVariants({ size: 'lg' }))).toContain('text-base')
  })
})
