import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { menuContent } from '../menuStyles'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))
const rightClick = (el: Element) => el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 10, clientY: 10 }))
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const qa = (s: string) => [...document.body.querySelectorAll(s)] as HTMLElement[]
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

interface Opts {
  open?: boolean
  controlled?: boolean
  contentProps?: Record<string, unknown>
  onSelect?: (e: Event) => void
  onDelete?: (e: Event) => void
}

function make(opts: Opts = {}) {
  const open = ref(opts.open ?? false)
  const checked = ref<boolean | 'indeterminate'>(false)
  const radio = ref('a')
  const Comp = defineComponent({
    setup: () => () =>
      h('div', [
        h('button', { id: 'outside' }, 'outside'),
        h(
          ContextMenu,
          opts.controlled === false ? {} : { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) },
          () => [
            h(ContextMenuTrigger, null, () => 'Menu'),
            h(ContextMenuContent, opts.contentProps ?? {}, () => [
              h(ContextMenuLabel, { class: 'custom-label' }, () => 'Account'),
              h(ContextMenuSeparator, { class: 'custom-sep' }),
              h(ContextMenuGroup, null, () => [
                h(ContextMenuItem, { id: 'profile', onSelect: opts.onSelect }, () => ['Profile', h(ContextMenuShortcut, { class: 'custom-short' }, () => '⌘P')]),
                h(ContextMenuItem, { id: 'settings', inset: true }, () => 'Settings'),
                h(ContextMenuItem, { id: 'disabled', disabled: true, onSelect: opts.onSelect }, () => 'Disabled'),
                h(ContextMenuItem, { id: 'delete', destructive: true, class: 'custom-item', onSelect: opts.onDelete }, () => 'Delete'),
              ]),
              h(ContextMenuSeparator),
              h(ContextMenuCheckboxItem, { id: 'check', modelValue: checked.value, 'onUpdate:modelValue': (v: boolean | 'indeterminate') => (checked.value = v) }, () => 'Show toolbar'),
              h(ContextMenuRadioGroup, { modelValue: radio.value, 'onUpdate:modelValue': (v: unknown) => (radio.value = v as string) }, () => [
                h(ContextMenuRadioItem, { id: 'ra', value: 'a' }, () => 'Alpha'),
                h(ContextMenuRadioItem, { id: 'rb', value: 'b' }, () => 'Beta'),
              ]),
              h(ContextMenuSub, null, () => [
                h(ContextMenuSubTrigger, { id: 'sub', inset: true }, () => 'More'),
                h(ContextMenuSubContent, { class: 'custom-sub' }, () => h(ContextMenuItem, { id: 'nested' }, () => 'Nested')),
              ]),
            ]),
          ],
        ),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { open, checked, radio }
}
const trigger = () => q('[data-slot="context-menu-trigger"]')!
const content = () => q('[data-slot="context-menu-content"]')

async function openMenu() {
  rightClick(trigger())
  await nextTick()
  await tick()
}

describe('ContextMenu', () => {
  describe('open / close', () => {
    it('renders no content while closed', () => {
      make()
      expect(content()).toBeNull()
      expect(trigger().getAttribute('data-state')).toBe('closed')
    })

    it('opens on right click and exposes role=menu', async () => {
      const { open } = make()
      await openMenu()
      expect(open.value).toBe(true)
      expect(content()!.getAttribute('role')).toBe('menu')
      expect(trigger().getAttribute('data-state')).toBe('open')
    })

    it('does not open on a plain left click', async () => {
      const { open } = make()
      trigger().click()
      await nextTick()
      expect(open.value).toBe(false)
    })

    it('prevents the native context menu when opening', async () => {
      make()
      const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 })
      trigger().dispatchEvent(ev)
      await nextTick()
      expect(ev.defaultPrevented).toBe(true)
    })

    it('does not open from a disabled trigger', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () => h(ContextMenu, null, () => [h(ContextMenuTrigger, { disabled: true }, () => 'Area'), h(ContextMenuContent, null, () => h(ContextMenuItem, null, () => 'x'))]),
        }),
        { attachTo: document.body },
      )
      rightClick(trigger())
      await nextTick()
      expect(content()).toBeNull()
    })

    it('closes on Escape', async () => {
      const { open } = make()
      await openMenu()
      key(content()!, 'Escape')
      await nextTick()
      expect(open.value).toBe(false)
    })

    it('closes on outside pointer down', async () => {
      const { open } = make()
      await openMenu()
      q('#outside')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
      await nextTick()
      expect(open.value).toBe(false)
    })

    it('works uncontrolled', async () => {
      make({ controlled: false })
      await openMenu()
      expect(content()).not.toBeNull()
      key(content()!, 'Escape')
      await nextTick()
      await tick()
      expect(content()).toBeNull()
    })

    it('supports controlled opening from the parent', async () => {
      const { open } = make()
      open.value = true
      await nextTick()
      await tick()
      expect(content()).not.toBeNull()
    })
  })

  describe('items', () => {
    it('fires select and closes the menu when an item is clicked', async () => {
      const onSelect = vi.fn()
      const { open } = make({ onSelect })
      await openMenu()
      q('#profile')!.click()
      await nextTick()
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(open.value).toBe(false)
    })

    it('stays open when select is default-prevented', async () => {
      const { open } = make({ onSelect: (e) => e.preventDefault() })
      await openMenu()
      q('#profile')!.click()
      await nextTick()
      expect(open.value).toBe(true)
    })

    it('activates the focused item with Enter', async () => {
      const onSelect = vi.fn()
      make({ onSelect })
      await openMenu()
      const item = q('#profile')!
      item.focus()
      key(item, 'Enter')
      await nextTick()
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('does not fire select for a disabled item and keeps the menu open', async () => {
      const onSelect = vi.fn()
      const { open } = make({ onSelect })
      await openMenu()
      const d = q('#disabled')!
      expect(d.getAttribute('aria-disabled')).toBe('true')
      expect(d.hasAttribute('data-disabled')).toBe(true)
      d.click()
      key(d, 'Enter')
      await nextTick()
      expect(onSelect).not.toHaveBeenCalled()
      expect(open.value).toBe(true)
    })

    it('destructive items get the destructive style and data-variant', async () => {
      make()
      await openMenu()
      const d = q('#delete')!
      expect(d.getAttribute('data-variant')).toBe('destructive')
      expect(d.className).toContain('text-destructive')
      expect(q('#profile')!.getAttribute('data-variant')).toBeNull()
    })

    it('inset items align with indicator rows', async () => {
      make()
      await openMenu()
      expect(q('#settings')!.className).toContain('pl-8')
      expect(q('#settings')!.hasAttribute('data-inset')).toBe(true)
      expect(q('#profile')!.className).not.toContain('pl-8')
    })

    it('item class merges and wins over defaults', async () => {
      make()
      await openMenu()
      expect(q('#delete')!.className).toContain('custom-item')
    })

    it('renders the shortcut part', async () => {
      make()
      await openMenu()
      const s = q('[data-slot="context-menu-shortcut"]')!
      expect(s.textContent).toBe('⌘P')
      expect(s.className).toContain('custom-short')
      expect(s.className).toContain('ml-auto')
    })
  })

  describe('checkbox and radio items', () => {
    it('toggles a checkbox item and shows the indicator only when checked', async () => {
      const { checked } = make()
      await openMenu()
      const item = q('#check')!
      expect(item.getAttribute('role')).toBe('menuitemcheckbox')
      expect(item.getAttribute('aria-checked')).toBe('false')
      expect(q('#check [data-slot="context-menu-item-indicator"]')).toBeNull()
      item.click()
      await nextTick()
      expect(checked.value).toBe(true)
    })

    it('shows the check indicator when checked', async () => {
      const { checked } = make()
      checked.value = true
      await openMenu()
      expect(q('#check')!.getAttribute('aria-checked')).toBe('true')
      expect(q('#check [data-slot="context-menu-item-indicator"]')).not.toBeNull()
    })

    it('selects a radio item and updates the group', async () => {
      const { radio } = make()
      await openMenu()
      expect(q('#ra')!.getAttribute('role')).toBe('menuitemradio')
      expect(q('#ra')!.getAttribute('aria-checked')).toBe('true')
      expect(q('#rb')!.getAttribute('aria-checked')).toBe('false')
      expect(q('#ra [data-slot="context-menu-item-indicator"]')).not.toBeNull()
      q('#rb')!.click()
      await nextTick()
      expect(radio.value).toBe('b')
    })

    it('radio group part carries role=group', async () => {
      make()
      await openMenu()
      expect(q('[data-slot="context-menu-radio-group"]')!.getAttribute('role')).toBe('group')
    })
  })

  describe('structure parts', () => {
    it('renders label, separators and group with merged classes', async () => {
      make()
      await openMenu()
      expect(q('[data-slot="context-menu-label"]')!.className).toContain('custom-label')
      expect(q('[data-slot="context-menu-label"]')!.textContent).toBe('Account')
      const seps = qa('[data-slot="context-menu-separator"]')
      expect(seps).toHaveLength(2)
      expect(seps[0].className).toContain('custom-sep')
      expect(seps[0].getAttribute('role')).toBe('separator')
      expect(q('[data-slot="context-menu-group"]')!.getAttribute('role')).toBe('group')
    })

    it('Label supports inset', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(ContextMenu, { open: true }, () => h(ContextMenuContent, null, () => h(ContextMenuLabel, { inset: true }, () => 'Inset'))),
        }),
        { attachTo: document.body },
      )
      await nextTick()
      const l = q('[data-slot="context-menu-label"]')!
      expect(l.className).toContain('pl-8')
      expect(l.hasAttribute('data-inset')).toBe(true)
    })
  })

  describe('sub menus', () => {
    it('opens the sub menu with ArrowRight and closes it with ArrowLeft', async () => {
      make()
      await openMenu()
      const sub = q('[data-slot="context-menu-sub-trigger"]')!
      expect(sub.getAttribute('aria-haspopup')).toBe('menu')
      expect(sub.getAttribute('aria-expanded')).toBe('false')
      expect(sub.className).toContain('pl-8')
      sub.focus()
      key(sub, 'ArrowRight')
      await nextTick()
      await tick()
      const subContent = q('[data-slot="context-menu-sub-content"]')!
      expect(subContent).not.toBeNull()
      expect(subContent.className).toContain('custom-sub')
      expect(q('#nested')).not.toBeNull()
      key(subContent, 'ArrowLeft')
      await nextTick()
      await tick()
      expect(q('[data-slot="context-menu-sub-content"]')).toBeNull()
    })

    it('selecting a nested item closes the whole menu', async () => {
      const { open } = make()
      await openMenu()
      const sub = q('[data-slot="context-menu-sub-trigger"]')!
      sub.focus()
      key(sub, 'ArrowRight')
      await nextTick()
      await tick()
      q('#nested')!.click()
      await nextTick()
      expect(open.value).toBe(false)
    })
  })

  describe('keyboard navigation', () => {
    it('ArrowDown / ArrowUp / Home / End move focus between enabled items and skip disabled ones', async () => {
      make()
      await openMenu()
      const c = content()!
      const items = qa('[data-slot^="context-menu-"][role^="menuitem"]').filter((i) => !i.hasAttribute('data-disabled'))
      expect(items.length).toBeGreaterThan(3)
      items[0].focus()
      key(c, 'ArrowDown')
      expect(document.activeElement).toBe(items[1])
      key(c, 'ArrowDown')
      expect(document.activeElement).toBe(items[2]) // skipped #disabled
      expect(document.activeElement!.id).toBe('delete')
      key(c, 'ArrowUp')
      expect(document.activeElement).toBe(items[1])
      key(c, 'End')
      expect(document.activeElement).toBe(items[items.length - 1])
      key(c, 'Home')
      expect(document.activeElement).toBe(items[0])
    })

    it('highlights the focused item via data-highlighted', async () => {
      make()
      await openMenu()
      const item = q('#settings')!
      item.focus()
      await nextTick()
      await tick()
      expect(item.hasAttribute('data-highlighted')).toBe(true)
    })
  })

  describe('placement', () => {
    it('passes side / align / sideOffset to the popper', async () => {
      make({ contentProps: { side: 'top', align: 'end', sideOffset: 8 } })
      await openMenu()
      expect(content()!.getAttribute('data-side')).toBe('top')
      expect(content()!.getAttribute('data-align')).toBe('end')
    })
  })

  describe('customisation', () => {
    it('merges class on content and keeps the floating surface', async () => {
      make({ contentProps: { class: 'min-w-80 bg-red-500' } })
      await openMenu()
      const cls = content()!.className
      expect(cls).toContain('min-w-80')
      expect(cls).not.toContain('min-w-44')
      expect(cls).toContain('bg-red-500')
      expect(cls).not.toContain('bg-popover')
      expect(cls).toContain('border')
    })

    it('falls through attributes to the content element', async () => {
      make({ contentProps: { 'data-testid': 'menu', 'aria-label': 'Account menu' } })
      await openMenu()
      expect(content()!.getAttribute('data-testid')).toBe('menu')
      expect(content()!.getAttribute('aria-label')).toBe('Account menu')
    })
  })

  describe('edge cases', () => {
    it('renders an empty menu without errors', async () => {
      wrapper = mount(
        defineComponent({ setup: () => () => h(ContextMenu, { open: true }, () => h(ContextMenuContent)) }),
        { attachTo: document.body },
      )
      await nextTick()
      expect(content()).not.toBeNull()
      expect(qa('[role^="menuitem"]')).toHaveLength(0)
    })

    it('handles long unicode / RTL labels', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () => h(ContextMenu, { open: true }, () => h(ContextMenuContent, null, () => h(ContextMenuItem, null, () => 'مرحبا 你好 ' + 'x'.repeat(300)))),
        }),
        { attachTo: document.body },
      )
      await nextTick()
      expect(q('[data-slot="context-menu-item"]')!.textContent).toContain('مرحبا 你好')
    })

    it('repeated right clicks keep the menu open', async () => {
      const { open } = make()
      for (let i = 0; i < 5; i++) {
        rightClick(trigger())
        await nextTick()
      }
      expect(open.value).toBe(true)
    })

    it('removes portalled content when unmounted while open', async () => {
      make({ open: true })
      await nextTick()
      await tick()
      expect(content()).not.toBeNull()
      wrapper!.unmount()
      wrapper = undefined
      expect(content()).toBeNull()
    })
  })

describe('ContextMenu viewport behaviour', () => {
  it('menu surface is capped to the available height and the viewport width', () => {
    expect(menuContent).toContain('max-h-(--reka-popper-available-height)')
    expect(menuContent).toContain('max-w-[calc(100vw-1rem)]')
  })
})
})
