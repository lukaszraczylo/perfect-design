import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  menuDensities,
} from './index'
import { normalizeDensity } from './density'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))
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
          DropdownMenu,
          opts.controlled === false ? {} : { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) },
          () => [
            h(DropdownMenuTrigger, null, () => 'Menu'),
            h(DropdownMenuContent, opts.contentProps ?? {}, () => [
              h(DropdownMenuLabel, { class: 'custom-label' }, () => 'Account'),
              h(DropdownMenuSeparator, { class: 'custom-sep' }),
              h(DropdownMenuGroup, null, () => [
                h(DropdownMenuItem, { id: 'profile', onSelect: opts.onSelect }, () => ['Profile', h(DropdownMenuShortcut, { class: 'custom-short' }, () => '⌘P')]),
                h(DropdownMenuItem, { id: 'settings', inset: true }, () => 'Settings'),
                h(DropdownMenuItem, { id: 'disabled', disabled: true, onSelect: opts.onSelect }, () => 'Disabled'),
                h(DropdownMenuItem, { id: 'delete', destructive: true, class: 'custom-item', onSelect: opts.onDelete }, () => 'Delete'),
              ]),
              h(DropdownMenuSeparator),
              h(DropdownMenuCheckboxItem, { id: 'check', modelValue: checked.value, 'onUpdate:modelValue': (v: boolean | 'indeterminate') => (checked.value = v) }, () => 'Show toolbar'),
              h(DropdownMenuRadioGroup, { modelValue: radio.value, 'onUpdate:modelValue': (v: unknown) => (radio.value = v as string) }, () => [
                h(DropdownMenuRadioItem, { id: 'ra', value: 'a' }, () => 'Alpha'),
                h(DropdownMenuRadioItem, { id: 'rb', value: 'b' }, () => 'Beta'),
              ]),
              h(DropdownMenuSub, null, () => [
                h(DropdownMenuSubTrigger, { id: 'sub', inset: true }, () => 'More'),
                h(DropdownMenuSubContent, { class: 'custom-sub' }, () => h(DropdownMenuItem, { id: 'nested' }, () => 'Nested')),
              ]),
            ]),
          ],
        ),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { open, checked, radio }
}
const trigger = () => q('[data-slot="dropdown-menu-trigger"]')!
const content = () => q('[data-slot="dropdown-menu-content"]')

async function openMenu() {
  trigger().click()
  await nextTick()
  await tick()
}

describe('DropdownMenu', () => {
  describe('open / close', () => {
    it('renders no content while closed', () => {
      make()
      expect(content()).toBeNull()
      expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('opens on trigger click and exposes role=menu', async () => {
      const { open } = make()
      await openMenu()
      expect(open.value).toBe(true)
      expect(content()!.getAttribute('role')).toBe('menu')
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
    })

    it.each(['Enter', ' ', 'ArrowDown'])('opens with keyboard (%s) on the trigger', async (k) => {
      const { open } = make()
      key(trigger(), k)
      await nextTick()
      expect(open.value).toBe(true)
    })

    it('ignores non-primary buttons / ctrl-click', async () => {
      const { open } = make()
      trigger().dispatchEvent(new MouseEvent('click', { bubbles: true, button: 2 }))
      await nextTick()
      expect(open.value).toBe(false)
    })

    it('does not open from a disabled trigger', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () => h(DropdownMenu, null, () => [h(DropdownMenuTrigger, { disabled: true }, () => 'Menu'), h(DropdownMenuContent, null, () => h(DropdownMenuItem, null, () => 'x'))]),
        }),
        { attachTo: document.body },
      )
      trigger().click()
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
      const s = q('[data-slot="dropdown-menu-shortcut"]')!
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
      expect(q('#check [data-slot="dropdown-menu-item-indicator"]')).toBeNull()
      item.click()
      await nextTick()
      expect(checked.value).toBe(true)
    })

    it('shows the check indicator when checked', async () => {
      const { checked } = make()
      checked.value = true
      await openMenu()
      expect(q('#check')!.getAttribute('aria-checked')).toBe('true')
      expect(q('#check [data-slot="dropdown-menu-item-indicator"]')).not.toBeNull()
    })

    it('selects a radio item and updates the group', async () => {
      const { radio } = make()
      await openMenu()
      expect(q('#ra')!.getAttribute('role')).toBe('menuitemradio')
      expect(q('#ra')!.getAttribute('aria-checked')).toBe('true')
      expect(q('#rb')!.getAttribute('aria-checked')).toBe('false')
      expect(q('#ra [data-slot="dropdown-menu-item-indicator"]')).not.toBeNull()
      q('#rb')!.click()
      await nextTick()
      expect(radio.value).toBe('b')
    })

    it('radio group part carries role=group', async () => {
      make()
      await openMenu()
      expect(q('[data-slot="dropdown-menu-radio-group"]')!.getAttribute('role')).toBe('group')
    })
  })

  describe('structure parts', () => {
    it('renders label, separators and group with merged classes', async () => {
      make()
      await openMenu()
      expect(q('[data-slot="dropdown-menu-label"]')!.className).toContain('custom-label')
      expect(q('[data-slot="dropdown-menu-label"]')!.textContent).toBe('Account')
      const seps = qa('[data-slot="dropdown-menu-separator"]')
      expect(seps).toHaveLength(2)
      expect(seps[0].className).toContain('custom-sep')
      expect(seps[0].getAttribute('role')).toBe('separator')
      expect(q('[data-slot="dropdown-menu-group"]')!.getAttribute('role')).toBe('group')
    })

    it('Label supports inset', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(DropdownMenu, { open: true }, () => h(DropdownMenuContent, null, () => h(DropdownMenuLabel, { inset: true }, () => 'Inset'))),
        }),
        { attachTo: document.body },
      )
      await nextTick()
      const l = q('[data-slot="dropdown-menu-label"]')!
      expect(l.className).toContain('pl-8')
      expect(l.hasAttribute('data-inset')).toBe(true)
    })
  })

  describe('sub menus', () => {
    it('opens the sub menu with ArrowRight and closes it with ArrowLeft', async () => {
      make()
      await openMenu()
      const sub = q('[data-slot="dropdown-menu-sub-trigger"]')!
      expect(sub.getAttribute('aria-haspopup')).toBe('menu')
      expect(sub.getAttribute('aria-expanded')).toBe('false')
      expect(sub.className).toContain('pl-8')
      sub.focus()
      key(sub, 'ArrowRight')
      await nextTick()
      await tick()
      const subContent = q('[data-slot="dropdown-menu-sub-content"]')!
      expect(subContent).not.toBeNull()
      expect(subContent.className).toContain('custom-sub')
      expect(q('#nested')).not.toBeNull()
      key(subContent, 'ArrowLeft')
      await nextTick()
      await tick()
      expect(q('[data-slot="dropdown-menu-sub-content"]')).toBeNull()
    })

    it('selecting a nested item closes the whole menu', async () => {
      const { open } = make()
      await openMenu()
      const sub = q('[data-slot="dropdown-menu-sub-trigger"]')!
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
      const items = qa('[data-slot^="dropdown-menu-"][role^="menuitem"]').filter((i) => !i.hasAttribute('data-disabled'))
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
    it('defaults to side=bottom align=start with sideOffset 4', async () => {
      make()
      await openMenu()
      expect(content()!.getAttribute('data-side')).toBe('bottom')
      expect(content()!.getAttribute('data-align')).toBe('start')
    })

    it('honours side and align props', async () => {
      make({ contentProps: { side: 'top', align: 'end' } })
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
        defineComponent({ setup: () => () => h(DropdownMenu, { open: true }, () => h(DropdownMenuContent)) }),
        { attachTo: document.body },
      )
      await nextTick()
      expect(content()).not.toBeNull()
      expect(qa('[role^="menuitem"]')).toHaveLength(0)
    })

    it('handles long unicode / RTL labels', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () => h(DropdownMenu, { open: true }, () => h(DropdownMenuContent, null, () => h(DropdownMenuItem, null, () => 'مرحبا 你好 ' + 'x'.repeat(300)))),
        }),
        { attachTo: document.body },
      )
      await nextTick()
      expect(q('[data-slot="dropdown-menu-item"]')!.textContent).toContain('مرحبا 你好')
    })

    it('rapid toggling ends consistent', async () => {
      const { open } = make()
      for (let i = 0; i < 5; i++) {
        trigger().click()
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
})

describe('DropdownMenu compact density', () => {
  function makeDensity(opts: { root?: unknown; content?: unknown; sub?: boolean } = {}) {
    const checked = ref<boolean | 'indeterminate'>(true)
    const radio = ref('a')
    wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(DropdownMenu, opts.root === undefined ? {} : { density: opts.root as never }, () => [
            h(DropdownMenuTrigger, null, () => 'Menu'),
            h(DropdownMenuContent, opts.content === undefined ? {} : { density: opts.content as never }, () => [
              h(DropdownMenuLabel, { id: 'label' }, () => 'Label'),
              h(DropdownMenuLabel, { id: 'label-inset', inset: true }, () => 'Inset label'),
              h(DropdownMenuItem, { id: 'item' }, () => 'Item'),
              h(DropdownMenuItem, { id: 'item-inset', inset: true }, () => 'Inset item'),
              h(DropdownMenuItem, { id: 'item-destructive', destructive: true }, () => 'Delete'),
              h(DropdownMenuSeparator, { id: 'sep' }),
              h(DropdownMenuCheckboxItem, { id: 'check', modelValue: checked.value, 'onUpdate:modelValue': (v: boolean | 'indeterminate') => (checked.value = v) }, () => 'Check'),
              h(DropdownMenuRadioGroup, { modelValue: radio.value }, () => h(DropdownMenuRadioItem, { id: 'radio', value: 'a' }, () => 'Radio')),
              h(DropdownMenuSub, null, () => [
                h(DropdownMenuSubTrigger, { class: 't-sub' }, () => 'More'),
                h(DropdownMenuSubContent, null, () => h(DropdownMenuItem, { id: 'nested' }, () => 'Nested')),
              ]),
              h(DropdownMenuSub, null, () => [
                h(DropdownMenuSubTrigger, { class: 't-sub-inset', inset: true }, () => 'More inset'),
                h(DropdownMenuSubContent, null, () => h(DropdownMenuItem, null, () => 'Nested 2')),
              ]),
            ]),
          ]),
      }),
      { attachTo: document.body },
    )
  }
  const cls = (id: string) => (q(id.startsWith('t-') ? `.${id}` : `#${id}`)!.getAttribute('class') ?? '').split(' ')
  const open = async () => {
    trigger().click()
    await nextTick()
    await tick()
  }

  it('default density keeps the original row classes and no data-density', async () => {
    makeDensity()
    await open()
    expect(content()!.hasAttribute('data-density')).toBe(false)
    expect(cls('item')).toEqual(expect.arrayContaining(['px-2', 'py-1.5', 'text-sm', 'gap-2']))
    expect(cls('item-inset')).toContain('pl-8')
    expect(cls('check')).toEqual(expect.arrayContaining(['pl-8', 'pr-2', 'py-1.5']))
    expect(cls('label')).toContain('px-2')
    expect(cls('sep')).toContain('my-1')
    expect(content()!.className.split(' ')).toContain('p-1')
    expect(content()!.className.split(' ')).toContain('min-w-44')
  })

  it('density="default" is identical to omitting it', async () => {
    makeDensity({ root: 'default' })
    await open()
    expect(content()!.hasAttribute('data-density')).toBe(false)
    expect(cls('item')).toContain('py-1.5')
  })

  it('compact on the root tightens every row type', async () => {
    makeDensity({ root: 'compact' })
    await open()
    expect(content()!.getAttribute('data-density')).toBe('compact')
    expect(content()!.className.split(' ')).toEqual(expect.arrayContaining(['p-0.5', 'min-w-36']))
    expect(content()!.className.split(' ')).not.toContain('p-1')
    expect(cls('item')).toEqual(expect.arrayContaining(['px-1.5', 'py-1', 'text-xs', 'gap-1.5']))
    expect(cls('item')).not.toContain('py-1.5')
    expect(cls('item-inset')).toContain('pl-7')
    expect(cls('item-inset')).not.toContain('pl-8')
    expect(cls('item-destructive')).toContain('text-destructive')
    expect(cls('label')).toEqual(expect.arrayContaining(['px-1.5', 'py-1', 'text-2xs']))
    expect(cls('label-inset')).toContain('pl-7')
    expect(cls('sep')).toContain('my-0.5')
    expect(cls('sep')).not.toContain('my-1')
    expect(cls('check')).toEqual(expect.arrayContaining(['pl-7', 'pr-1.5', 'py-1', 'text-xs']))
    expect(cls('radio')).toEqual(expect.arrayContaining(['pl-7', 'pr-1.5', 'py-1']))
    expect(cls('t-sub')).toEqual(expect.arrayContaining(['py-1', 'text-xs']))
    expect(cls('t-sub-inset')).toContain('pl-7')
  })

  it('compact keeps the touch target and highlight styles', async () => {
    makeDensity({ root: 'compact' })
    await open()
    expect(cls('item')).toContain('pointer-coarse:min-h-11')
    expect(cls('item').some((c) => c.startsWith('data-[highlighted]:bg-accent'))).toBe(true)
  })

  it('compact indicator slot is moved and shrunk', async () => {
    makeDensity({ root: 'compact' })
    await open()
    const slot = q('#check > span')!
    expect(slot.className.split(' ')).toEqual(expect.arrayContaining(['left-1.5', 'size-3']))
    expect(slot.className.split(' ')).not.toContain('left-2')
  })

  it('compact reaches the portalled sub menu through provide/inject', async () => {
    makeDensity({ root: 'compact' })
    await open()
    const sub = q('.t-sub')!
    sub.focus()
    key(sub, 'ArrowRight')
    await nextTick()
    await tick()
    const subContent = q('[data-slot="dropdown-menu-sub-content"]')!
    expect(subContent.getAttribute('data-density')).toBe('compact')
    expect(subContent.className.split(' ')).toContain('p-0.5')
    expect(cls('nested')).toContain('py-1')
  })

  it('default sub menu stays default', async () => {
    makeDensity()
    await open()
    const sub = q('.t-sub')!
    sub.focus()
    key(sub, 'ArrowRight')
    await nextTick()
    await tick()
    const subContent = q('[data-slot="dropdown-menu-sub-content"]')!
    expect(subContent.hasAttribute('data-density')).toBe(false)
    expect(cls('nested')).toContain('py-1.5')
  })

  it('compact can be set on the content alone', async () => {
    makeDensity({ content: 'compact' })
    await open()
    expect(content()!.getAttribute('data-density')).toBe('compact')
    expect(cls('item')).toContain('py-1')
  })

  it('content density overrides the root density in both directions', async () => {
    makeDensity({ root: 'compact', content: 'default' })
    await open()
    expect(content()!.hasAttribute('data-density')).toBe(false)
    expect(cls('item')).toContain('py-1.5')
    wrapper!.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
    makeDensity({ root: 'default', content: 'compact' })
    await open()
    expect(cls('item')).toContain('py-1')
  })

  it('unknown density falls back to default, on root and content', async () => {
    makeDensity({ root: 'tiny' })
    await open()
    expect(content()!.hasAttribute('data-density')).toBe(false)
    expect(cls('item')).toContain('py-1.5')
    wrapper!.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
    makeDensity({ root: 'compact', content: 'weird' })
    await open()
    expect(content()!.hasAttribute('data-density')).toBe(false)
    expect(cls('item')).toContain('py-1.5')
  })

  it('consumer classes still win over compact classes', async () => {
    wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(DropdownMenu, { density: 'compact' }, () => [
            h(DropdownMenuTrigger, null, () => 'Menu'),
            h(DropdownMenuContent, { class: 'p-3' }, () => h(DropdownMenuItem, { id: 'x', class: 'py-3 text-base' }, () => 'X')),
          ]),
      }),
      { attachTo: document.body },
    )
    await open()
    expect(content()!.className.split(' ')).toContain('p-3')
    expect(content()!.className.split(' ')).not.toContain('p-0.5')
    expect(cls('x')).toEqual(expect.arrayContaining(['py-3', 'text-base']))
    expect(cls('x')).not.toContain('py-1')
  })

  it('does not leak density as a DOM attribute on root-level props and keeps the menu working', async () => {
    const onSelect = vi.fn()
    wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(DropdownMenu, { density: 'compact' }, () => [
            h(DropdownMenuTrigger, null, () => 'Menu'),
            h(DropdownMenuContent, null, () => h(DropdownMenuItem, { id: 'go', onSelect }, () => 'Go')),
          ]),
      }),
      { attachTo: document.body },
    )
    await open()
    expect(content()!.hasAttribute('density')).toBe(false)
    q('#go')!.click()
    await nextTick()
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('menu parts used outside a DropdownMenu fall back to default density', () => {
    wrapper = mount(DropdownMenuSeparator, { attachTo: document.body })
    expect(wrapper.classes()).toContain('my-1')
  })

  it('helpers normalise and export densities', () => {
    expect(menuDensities).toEqual(['default', 'compact', 'comfortable'])
    expect(normalizeDensity('compact')).toBe('compact')
    expect(normalizeDensity(undefined)).toBe('default')
    expect(normalizeDensity('x')).toBe('default')
  })

describe('DropdownMenu viewport and forced-colors behaviour', () => {
  it('content stays inside the viewport: capped height and width, scrolls, contains scroll chaining', async () => {
    make({ open: true })
    await nextTick()
    const cls = q('[data-slot="dropdown-menu-content"]')!.className
    expect(cls).toContain('max-h-(--reka-popper-available-height)')
    expect(cls).toContain('max-w-[calc(100vw-1rem)]')
    expect(cls).toContain('overflow-y-auto')
    expect(cls).toContain('overscroll-contain')
  })

  it('rows highlight with system colours in forced-colors mode and mirror indicators in RTL', async () => {
    make({ open: true })
    await nextTick()
    const item = q('#profile')!.className
    expect(item).toContain('forced-colors:data-[highlighted]:bg-[Highlight]')
    expect(item).toContain('pointer-coarse:min-h-11')
    expect(q('[data-slot="dropdown-menu-sub-trigger"] svg')?.getAttribute('class') ?? '').toContain('rtl:rotate-180')
  })
})
})
