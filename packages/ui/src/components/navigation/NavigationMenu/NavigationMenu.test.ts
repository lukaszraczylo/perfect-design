import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuLinkVariants,
  navigationMenuTriggerStyle,
} from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
})

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const qa = (s: string) => [...document.body.querySelectorAll(s)] as HTMLElement[]
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
const slot = (s: string) => q(`[data-slot="${s}"]`)

interface Opts {
  value?: string
  controlled?: boolean
  rootProps?: Record<string, unknown>
  contentProps?: Record<string, unknown>
  onSelect?: (e: Event) => void
  withIndicator?: boolean
  linkProps?: Record<string, unknown>
}

function make(opts: Opts = {}) {
  const value = ref(opts.value ?? '')
  const updates: string[] = []
  const Comp = defineComponent({
    setup: () => () =>
      h('div', [
        h('button', { id: 'outside' }, 'outside'),
        h(
          NavigationMenu,
          {
            ...(opts.controlled ? { modelValue: value.value } : {}),
            'onUpdate:modelValue': (v: string) => {
              updates.push(v)
              value.value = v
            },
            class: 'custom-root',
            'aria-label': 'Main',
            ...opts.rootProps,
          },
          () => [
            h(NavigationMenuList, { class: 'custom-list' }, () => [
              h(NavigationMenuItem, { value: 'products', class: 'custom-item' }, () => [
                h(NavigationMenuTrigger, { id: 'products-trigger', class: 'custom-trigger' }, () => 'Products'),
                h(NavigationMenuContent, { class: 'custom-content', 'data-test': 'c', ...opts.contentProps }, () => [
                  h(NavigationMenuLink, { id: 'link-a', href: '#a', class: 'custom-link', onSelect: opts.onSelect, ...opts.linkProps }, () => 'Analytics'),
                  h(NavigationMenuLink, { id: 'link-b', href: '#b', active: true, variant: 'card' }, () => 'Billing'),
                ]),
              ]),
              h(NavigationMenuItem, { value: 'docs' }, () => [
                h(NavigationMenuTrigger, { id: 'docs-trigger', variant: 'ghost', hideChevron: true }, () => 'Docs'),
                h(NavigationMenuContent, null, () => h(NavigationMenuLink, { id: 'link-c', href: '#c', variant: 'plain' }, () => 'Guide')),
              ]),
              h(NavigationMenuItem, null, () => h(NavigationMenuLink, { id: 'top-link', href: '#top', variant: 'trigger' }, () => 'Pricing')),
              h(NavigationMenuItem, { value: 'off' }, () => [
                h(NavigationMenuTrigger, { id: 'off-trigger', disabled: true }, () => 'Disabled'),
                h(NavigationMenuContent, null, () => h(NavigationMenuLink, null, () => 'never')),
              ]),
              ...(opts.withIndicator ? [h(NavigationMenuIndicator, { class: 'custom-indicator' })] : []),
            ]),
          ],
        ),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { value, updates }
}

const trigger = (id = 'products') => q(`#${id}-trigger`)!
const content = () => slot('navigation-menu-content')

async function click(el: HTMLElement) {
  el.click()
  await nextTick()
  await tick()
}

describe('NavigationMenu', () => {
  describe('structure', () => {
    it('renders nav > list > items with data-slot on every part', async () => {
      make({ withIndicator: true })
      await click(trigger())
      expect(slot('navigation-menu')!.tagName).toBe('NAV')
      expect(slot('navigation-menu-list')!.tagName).toBe('UL')
      expect(slot('navigation-menu-item')!.tagName).toBe('LI')
      for (const s of [
        'navigation-menu',
        'navigation-menu-list',
        'navigation-menu-item',
        'navigation-menu-trigger',
        'navigation-menu-trigger-icon',
        'navigation-menu-content',
        'navigation-menu-link',
        'navigation-menu-viewport',
        'navigation-menu-viewport-wrapper',
        'navigation-menu-indicator',
      ])
        expect(slot(s), s).not.toBeNull()
    })

    it('renders closed by default (no content mounted)', () => {
      make()
      expect(content()).toBeNull()
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().getAttribute('data-state')).toBe('closed')
    })

    it('exposes the orientation on root and list', () => {
      make()
      expect(slot('navigation-menu')!.getAttribute('data-orientation')).toBe('horizontal')
      expect(slot('navigation-menu-list')!.getAttribute('data-orientation')).toBe('horizontal')
    })

    it('reflects vertical orientation', async () => {
      make({ rootProps: { orientation: 'vertical' } })
      await click(trigger())
      expect(slot('navigation-menu')!.getAttribute('data-orientation')).toBe('vertical')
      expect(slot('navigation-menu-list')!.getAttribute('data-orientation')).toBe('vertical')
      expect(slot('navigation-menu-list')!.className).toContain('data-[orientation=vertical]:flex-col')
      expect(slot('navigation-menu-viewport')!.getAttribute('data-orientation')).toBe('vertical')
      expect(content()!.getAttribute('data-orientation')).toBe('vertical')
    })
  })

  describe('open / close', () => {
    it('opens on trigger click, labels the content and renders it inside the viewport', async () => {
      const { updates } = make()
      await click(trigger())
      expect(updates).toContain('products')
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(content()).not.toBeNull()
      expect(content()!.getAttribute('aria-labelledby')).toBeTruthy()
      expect(trigger().getAttribute('aria-controls')).toBe(content()!.id)
      expect(slot('navigation-menu-viewport')!.contains(content())).toBe(true)
    })

    it('closes when the trigger is clicked again', async () => {
      const { value } = make({ controlled: true })
      await click(trigger())
      expect(value.value).toBe('products')
      await click(trigger())
      expect(value.value).toBe('')
    })

    it('closes on Escape', async () => {
      const { value } = make({ controlled: true })
      await click(trigger())
      key(content()!, 'Escape')
      await nextTick()
      expect(value.value).toBe('')
    })

    it('closes on outside pointer down', async () => {
      const { value } = make({ controlled: true })
      await click(trigger())
      await tick(10)
      q('#outside')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
      await nextTick()
      expect(value.value).toBe('')
    })

    it('closes when a content link is selected', async () => {
      const onSelect = vi.fn()
      const { value } = make({ controlled: true, onSelect })
      await click(trigger())
      q('#link-a')!.click()
      await nextTick()
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(value.value).toBe('')
    })

    it('stays open when link select is default-prevented', async () => {
      const { value } = make({ controlled: true, onSelect: (e) => e.preventDefault() })
      await click(trigger())
      q('#link-a')!.click()
      await nextTick()
      expect(value.value).toBe('products')
    })

    it('works uncontrolled', async () => {
      make()
      await click(trigger())
      expect(content()).not.toBeNull()
      await click(trigger())
      await tick(20)
      expect(content()).toBeNull()
    })

    it('defaultValue opens an item at mount', async () => {
      make({ rootProps: { defaultValue: 'docs' } })
      await nextTick()
      await tick()
      expect(q('#link-c')).not.toBeNull()
      expect(trigger('docs').getAttribute('data-state')).toBe('open')
    })

    it('supports controlled opening and switching from the parent', async () => {
      const { value } = make({ controlled: true })
      value.value = 'products'
      await nextTick()
      await tick()
      expect(q('#link-a')).not.toBeNull()
      value.value = 'docs'
      await nextTick()
      await tick(20)
      expect(q('#link-c')).not.toBeNull()
    })

    it('an unknown controlled value opens nothing', async () => {
      make({ controlled: true, value: 'nope' })
      await nextTick()
      expect(content()).toBeNull()
    })

    it('opens on hover after the delay and closes on leave', async () => {
      make({ rootProps: { delayDuration: 1, skipDelayDuration: 1 } })
      trigger().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
      trigger().dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', bubbles: true }))
      await tick(30)
      expect(content()).not.toBeNull()
      trigger().dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
      await tick(250)
      await nextTick()
      expect(trigger().getAttribute('data-state')).toBe('closed')
    })

    it('disableHoverTrigger blocks hover opening but click still works', async () => {
      make({ rootProps: { delayDuration: 1, disableHoverTrigger: true } })
      trigger().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
      trigger().dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', bubbles: true }))
      await tick(30)
      expect(content()).toBeNull()
      await click(trigger())
      expect(content()).not.toBeNull()
    })

    it('disableClickTrigger blocks click opening', async () => {
      make({ rootProps: { disableClickTrigger: true } })
      trigger().dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true, pointerType: 'mouse' }))
      await nextTick()
      await tick()
      expect(content()).toBeNull()
    })

    it('does not open from a disabled trigger', async () => {
      make()
      const t = trigger('off')
      expect(t.hasAttribute('disabled')).toBe(true)
      expect(t.hasAttribute('data-disabled')).toBe(true)
      await click(t)
      expect(content()).toBeNull()
    })

    it('moves focus into open content with ArrowDown from the trigger', async () => {
      make()
      await click(trigger())
      trigger().focus()
      key(trigger(), 'ArrowDown')
      await nextTick()
      await tick(20)
      expect(content()!.contains(document.activeElement)).toBe(true)
    })

    it('keeps content mounted but hidden with unmountOnHide=false', async () => {
      make({ rootProps: { unmountOnHide: false } })
      await nextTick()
      await tick()
      expect(q('#link-a')).not.toBeNull()
      expect(content()!.hasAttribute('hidden')).toBe(true)
    })

    it('forceMount on content keeps it mounted while closed', async () => {
      make({ contentProps: { forceMount: true } })
      await nextTick()
      expect(content()).not.toBeNull()
    })

    it('forwards content dismissal events', async () => {
      const onEscape = vi.fn()
      make({ contentProps: { onEscapeKeyDown: onEscape } })
      await click(trigger())
      key(content()!, 'Escape')
      await nextTick()
      expect(onEscape).toHaveBeenCalled()
    })
  })

  describe('viewport option', () => {
    it('renders no viewport and positions content in place when viewport=false', async () => {
      make({ rootProps: { viewport: false } })
      await click(trigger())
      expect(slot('navigation-menu-viewport')).toBeNull()
      expect(slot('navigation-menu')!.getAttribute('data-viewport')).toBe('false')
      expect(content()).not.toBeNull()
      expect(slot('navigation-menu-item')!.contains(content())).toBe(true)
      expect(content()!.className).toContain('group-data-[viewport=false]/navigation-menu:bg-popover')
    })

    it('renders a viewport by default', () => {
      make()
      expect(slot('navigation-menu')!.getAttribute('data-viewport')).toBe('true')
      expect(slot('navigation-menu-viewport-wrapper')).not.toBeNull()
    })

    it('does not leak the viewport prop as an attribute on the nav', () => {
      make()
      expect(slot('navigation-menu')!.hasAttribute('viewport')).toBe(false)
    })

    it('NavigationMenuViewport merges class and forwards props', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(NavigationMenu, { viewport: false, defaultValue: 'a' }, () => [
              h(NavigationMenuList, null, () => h(NavigationMenuItem, { value: 'a' }, () => [h(NavigationMenuTrigger, null, () => 'A'), h(NavigationMenuContent, null, () => 'x')])),
              h(NavigationMenuViewport, { class: 'custom-viewport', forceMount: true }),
            ]),
        }),
        { attachTo: document.body },
      )
      await nextTick()
      expect(slot('navigation-menu-viewport')!.className).toContain('custom-viewport')
    })
  })

  describe('links', () => {
    it('marks the active link with aria-current and data-active', async () => {
      make()
      await click(trigger())
      expect(q('#link-b')!.getAttribute('aria-current')).toBe('page')
      expect(q('#link-b')!.hasAttribute('data-active')).toBe(true)
      expect(q('#link-a')!.hasAttribute('aria-current')).toBe(false)
      expect(q('#link-a')!.hasAttribute('data-active')).toBe(false)
    })

    it('applies content / card / plain / trigger variants', async () => {
      make()
      await click(trigger())
      expect(q('#link-a')!.className).toContain('p-2')
      expect(q('#link-b')!.className).toContain('p-3')
      expect(q('#top-link')!.className).toContain('h-9')
      expect(q('#top-link')!.className).toContain('bg-background')
      await click(trigger('docs'))
      await tick(20)
      expect(q('#link-c')!.className).not.toMatch(/\bp-[23]\b/)
    })

    it('triggerVariant changes the trigger-looking link', () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(NavigationMenu, { viewport: false }, () =>
              h(NavigationMenuList, null, () => h(NavigationMenuItem, null, () => h(NavigationMenuLink, { id: 'g', variant: 'trigger', triggerVariant: 'ghost', href: '#' }, () => 'Ghost'))),
            ),
        }),
        { attachTo: document.body },
      )
      expect(q('#g')!.className).toContain('text-muted-foreground')
    })

    it('renders a custom element with asChild', () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(NavigationMenu, { viewport: false }, () =>
              h(NavigationMenuList, null, () =>
                h(NavigationMenuItem, null, () => h(NavigationMenuLink, { asChild: true, variant: 'trigger' }, () => h('button', { id: 'btn' }, 'Act'))),
              ),
            ),
        }),
        { attachTo: document.body },
      )
      expect(q('#btn')!.tagName).toBe('BUTTON')
      expect(q('#btn')!.getAttribute('data-slot')).toBe('navigation-menu-link')
    })

    it('a top-level link select does not throw without content', async () => {
      make()
      q('#top-link')!.click()
      await nextTick()
      expect(content()).toBeNull()
    })
  })

  describe('trigger', () => {
    it('shows a chevron by default and hides it with hideChevron', () => {
      make()
      expect(trigger().querySelector('svg')).not.toBeNull()
      expect(trigger('docs').querySelector('svg')).toBeNull()
    })

    it('applies trigger variants', () => {
      make()
      expect(trigger().className).toContain('bg-background')
      expect(trigger('docs').className).toContain('bg-transparent')
    })

    it('rotates the chevron through group state classes', () => {
      make()
      expect(trigger().querySelector('svg')!.getAttribute('class')).toContain('group-data-[state=open]/trigger:rotate-180')
    })
  })

  describe('indicator', () => {
    it('is not rendered when not used', async () => {
      make()
      await click(trigger())
      expect(slot('navigation-menu-indicator')).toBeNull()
    })

    it('renders when open, is aria-hidden and merges class', async () => {
      make({ withIndicator: true })
      await click(trigger())
      const ind = slot('navigation-menu-indicator')!
      expect(ind.getAttribute('aria-hidden')).toBe('true')
      expect(ind.getAttribute('data-state')).toBe('visible')
      expect(ind.className).toContain('custom-indicator')
      expect(ind.className).toContain('absolute')
    })
  })

  describe('customisation', () => {
    it('merges class last on every part', async () => {
      make()
      await click(trigger())
      expect(slot('navigation-menu')!.className).toContain('custom-root')
      expect(slot('navigation-menu')!.className).toContain('group/navigation-menu')
      expect(slot('navigation-menu-list')!.className).toContain('custom-list')
      expect(q('.custom-item')!.getAttribute('data-slot')).toBe('navigation-menu-item')
      expect(trigger().className).toContain('custom-trigger')
      expect(content()!.className).toContain('custom-content')
      expect(q('#link-a')!.className).toContain('custom-link')
    })

    it('class override wins over internal conflicting classes', () => {
      make({ rootProps: { class: 'max-w-full' } })
      expect(slot('navigation-menu')!.className).toContain('max-w-full')
      expect(slot('navigation-menu')!.className).not.toContain('max-w-max')
    })

    it('falls attributes through', async () => {
      make()
      await click(trigger())
      expect(slot('navigation-menu')!.getAttribute('aria-label')).toBe('Main')
      expect(content()!.getAttribute('data-test')).toBe('c')
    })

    it('root renders another element via as', () => {
      make({ rootProps: { as: 'div' } })
      expect(slot('navigation-menu')!.tagName).toBe('DIV')
    })
  })

  describe('variants helpers', () => {
    it('navigationMenuTriggerStyle keeps base classes for unknown variants', () => {
      expect(navigationMenuTriggerStyle()).toContain('bg-background')
      expect(navigationMenuTriggerStyle({ variant: 'nope' as never })).toContain('inline-flex')
      expect(navigationMenuTriggerStyle({ variant: 'nope' as never })).not.toContain('bg-background')
      expect(navigationMenuTriggerStyle({ variant: 'outline' })).toContain('border-input')
      expect(navigationMenuTriggerStyle({ variant: 'ghost', class: 'extra' })).toContain('extra')
    })

    it('navigationMenuLinkVariants covers all variants', () => {
      expect(navigationMenuLinkVariants()).toContain('p-2')
      expect(navigationMenuLinkVariants({ variant: 'card' })).toContain('p-3')
      expect(navigationMenuLinkVariants({ variant: 'plain' })).not.toMatch(/\bp-[23]\b/)
    })

    it('can style plain anchors', () => {
      const a = document.createElement('a')
      a.className = navigationMenuTriggerStyle({ variant: 'outline' })
      expect(a.className).toContain('rounded-md')
    })
  })

  describe('edge cases', () => {
    it('renders an empty menu and a single item', () => {
      wrapper = mount(NavigationMenu, { attachTo: document.body })
      expect(slot('navigation-menu')).not.toBeNull()
      wrapper.unmount()
      wrapper = mount(
        defineComponent({ setup: () => () => h(NavigationMenu, null, () => h(NavigationMenuList, null, () => h(NavigationMenuItem, null, () => 'solo'))) }),
        { attachTo: document.body },
      )
      expect(qa('[data-slot="navigation-menu-item"]')).toHaveLength(1)
    })

    it('renders many items', () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(NavigationMenu, null, () =>
              h(NavigationMenuList, null, () =>
                Array.from({ length: 300 }, (_, i) => h(NavigationMenuItem, { value: `v${i}` }, () => [h(NavigationMenuTrigger, null, () => `T${i}`), h(NavigationMenuContent, null, () => 'c')])),
              ),
            ),
        }),
        { attachTo: document.body },
      )
      expect(qa('[data-slot="navigation-menu-trigger"]')).toHaveLength(300)
    })

    it('handles rapid clicks without leaving an inconsistent state', async () => {
      const { value } = make({ controlled: true })
      for (let i = 0; i < 10; i++) {
        trigger().click()
        await nextTick()
      }
      await tick(20)
      expect(value.value).toBe('')
      expect(content()).toBeNull()
    })

    it('switching items while open swaps content', async () => {
      make()
      await click(trigger())
      expect(q('#link-a')).not.toBeNull()
      await click(trigger('docs'))
      await tick(20)
      expect(q('#link-c')).not.toBeNull()
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('unmounting while open removes content and does not throw', async () => {
      make()
      await click(trigger())
      wrapper!.unmount()
      wrapper = undefined
      await tick(20)
      expect(content()).toBeNull()
    })

    it('does not fire pending hover timers after unmount', async () => {
      const { updates } = make({ rootProps: { delayDuration: 30 } })
      trigger().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
      trigger().dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', bubbles: true }))
      wrapper!.unmount()
      wrapper = undefined
      await tick(60)
      expect(updates.filter(Boolean)).toHaveLength(0)
    })

    it('handles unicode, RTL and long trigger text', () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(NavigationMenu, { dir: 'rtl' }, () => h(NavigationMenuList, null, () => h(NavigationMenuItem, { value: 'u' }, () => [h(NavigationMenuTrigger, null, () => '文件 ملف ' + 'x'.repeat(500))]))),
        }),
        { attachTo: document.body },
      )
      expect(slot('navigation-menu')!.getAttribute('dir')).toBe('rtl')
      expect(slot('navigation-menu-trigger')!.textContent).toContain('文件')
    })
  })
})
