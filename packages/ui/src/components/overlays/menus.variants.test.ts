import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import { cn } from '../../lib/cn'
import {
  menuContent,
  menuContentClass,
  menuDensities,
  menuIndicatorItem,
  menuIndicatorItemClass,
  menuIndicatorSlotClass,
  menuItem,
  menuItemClass,
  menuLabel,
  menuLabelClass,
  menuSeparator,
  menuSeparatorClass,
  menuShortcut,
  menuShortcutClass,
  menuSizes,
  menuSubContent,
  normalizeMenuDensity,
  normalizeMenuSize,
  type MenuLook,
} from './menuStyles'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
} from './DropdownMenu'
import { useCompactMenu } from './DropdownMenu/density'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
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
} from './ContextMenu'

const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean))
const has = (el: Element, ...classes: string[]) => classes.forEach((c) => expect(el.classList.contains(c), `${c} in "${el.className}"`).toBe(true))
const lacks = (el: Element, ...classes: string[]) => classes.forEach((c) => expect(el.classList.contains(c), `${c} not in "${el.className}"`).toBe(false))

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})
const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))
const q = (s: string) => document.body.querySelector(s) as HTMLElement
const qa = (s: string) => [...document.body.querySelectorAll(s)] as HTMLElement[]

describe('menu class helpers', () => {
  const look = (density: MenuLook['density'] = 'default', size: MenuLook['size'] = 'md'): MenuLook => ({ density, size })

  it('exports the value lists', () => {
    expect(menuDensities).toEqual(['default', 'compact', 'comfortable'])
    expect(menuSizes).toEqual(['sm', 'md', 'lg'])
  })

  it('default look adds nothing to the base fragments (default output unchanged)', () => {
    expect(menuContentClass(look())).toBe(menuContent)
    expect(menuContentClass(look(), true)).toBe(menuSubContent)
    expect(menuItemClass(look())).toBe(menuItem)
    expect(menuIndicatorItemClass(look())).toBe(menuIndicatorItem)
    expect(menuLabelClass(look())).toBe(menuLabel)
    expect(menuSeparatorClass(look())).toBe(menuSeparator)
    expect(menuShortcutClass(look())).toBe(menuShortcut)
    expect(set(menuIndicatorSlotClass(look()))).toEqual(set('pointer-events-none absolute left-2 flex size-3.5 items-center justify-center rtl:right-2 rtl:left-auto'))
  })

  it('normalisers fall back for unknown, missing and prototype keys', () => {
    for (const bad of ['wide', '', null, undefined, 3, 'toString', 'constructor']) {
      expect(normalizeMenuDensity(bad)).toBe('default')
      expect(normalizeMenuSize(bad)).toBe('md')
    }
    for (const d of menuDensities) expect(normalizeMenuDensity(d)).toBe(d)
    for (const s of menuSizes) expect(normalizeMenuSize(s)).toBe(s)
  })

  it('comfortable and compact are mutually exclusive on every part', () => {
    const c = look('compact')
    const f = look('comfortable')
    expect(menuItemClass(c)).not.toContain('py-2')
    expect(menuItemClass(f)).not.toContain('text-xs')
    expect(menuContentClass(f)).toContain('p-1.5')
    expect(menuContentClass(c)).toContain('p-0.5')
    expect(menuLabelClass(f, { inset: true })).toContain('pl-9')
    expect(menuLabelClass(c, { inset: true })).toContain('pl-7')
    expect(menuSeparatorClass(f)).toContain('my-1.5')
    expect(menuIndicatorSlotClass(f)).toContain('left-3')
  })

  it('size fragments land after the density fragments so the size wins in cn()', () => {
    const merged = cn(menuItemClass(look('compact', 'lg')))
    expect(merged.split(' ')).toContain('text-base')
    expect(merged.split(' ')).not.toContain('text-xs')
    expect(merged.split(' ')).toContain('py-1')
  })

  it('shortcut size classes', () => {
    expect(menuShortcutClass(look('default', 'sm'))).toContain('text-2xs')
    expect(menuShortcutClass(look('default', 'lg'))).toContain('text-sm')
  })
})

interface Kit {
  Root: Component
  Trigger: Component
  Content: Component
  Item: Component
  Check: Component
  RadioGroup: Component
  Radio: Component
  Label: Component
  Separator: Component
  Shortcut: Component
  Sub: Component
  SubTrigger: Component
  SubContent: Component
  slot: string
  open: () => Promise<void>
}

const kits: Record<'DropdownMenu' | 'ContextMenu', Kit> = {
  DropdownMenu: {
    Root: DropdownMenu,
    Trigger: DropdownMenuTrigger,
    Content: DropdownMenuContent,
    Item: DropdownMenuItem,
    Check: DropdownMenuCheckboxItem,
    RadioGroup: DropdownMenuRadioGroup,
    Radio: DropdownMenuRadioItem,
    Label: DropdownMenuLabel,
    Separator: DropdownMenuSeparator,
    Shortcut: DropdownMenuShortcut,
    Sub: DropdownMenuSub,
    SubTrigger: DropdownMenuSubTrigger,
    SubContent: DropdownMenuSubContent,
    slot: 'dropdown-menu',
    open: async () => {
      q('[data-slot="dropdown-menu-trigger"]').click()
      await nextTick()
      await tick()
    },
  },
  ContextMenu: {
    Root: ContextMenu,
    Trigger: ContextMenuTrigger,
    Content: ContextMenuContent,
    Item: ContextMenuItem,
    Check: ContextMenuCheckboxItem,
    RadioGroup: ContextMenuRadioGroup,
    Radio: ContextMenuRadioItem,
    Label: ContextMenuLabel,
    Separator: ContextMenuSeparator,
    Shortcut: ContextMenuShortcut,
    Sub: ContextMenuSub,
    SubTrigger: ContextMenuSubTrigger,
    SubContent: ContextMenuSubContent,
    slot: 'context-menu',
    open: async () => {
      q('[data-slot="context-menu-trigger"]').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 10, clientY: 10 }))
      await nextTick()
      await tick()
    },
  },
}

async function mountMenu(kit: Kit, root: Record<string, unknown> = {}, content: Record<string, unknown> = {}, itemClass?: string) {
  const checked = ref<boolean | 'indeterminate'>(true)
  const radio = ref('a')
  wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(kit.Root, root, () => [
          h(kit.Trigger, null, () => 'Menu'),
          h(kit.Content, content, () => [
            h(kit.Label, { id: 'label' }, () => 'Label'),
            h(kit.Label, { id: 'label-inset', inset: true }, () => 'Inset label'),
            h(kit.Item, { id: 'item', class: itemClass }, () => ['Item', h(kit.Shortcut, { id: 'shortcut' }, () => 'Ctrl I')]),
            h(kit.Item, { id: 'item-inset', inset: true }, () => 'Inset item'),
            h(kit.Item, { id: 'item-destructive', destructive: true }, () => 'Delete'),
            h(kit.Separator, { id: 'sep' }),
            h(kit.Check, { id: 'check', modelValue: checked.value, 'onUpdate:modelValue': (v: boolean | 'indeterminate') => (checked.value = v) }, () => 'Check'),
            h(kit.RadioGroup, { modelValue: radio.value }, () => h(kit.Radio, { id: 'radio', value: 'a' }, () => 'Radio')),
            h(kit.Sub, null, () => [h(kit.SubTrigger, { id: 'plain-sub' }, () => 'Plain more'), h(kit.SubContent, null, () => h(kit.Item, null, () => 'Plain nested'))]),
            h(kit.Sub, null, () => [
              h(kit.SubTrigger, { inset: true }, () => 'More'),
              h(kit.SubContent, { id: 'sub-content' }, () => h(kit.Item, { id: 'nested' }, () => 'Nested')),
            ]),
          ]),
        ]),
    }),
    { attachTo: document.body },
  )
  await kit.open()
}

const subTrigger = (kit: Kit) => qa(`[data-slot="${kit.slot}-sub-trigger"]`).find((el) => el.hasAttribute('data-inset'))!
const contentOf = (kit: Kit) => q(`[data-slot="${kit.slot}-content"]`)

describe.each(Object.keys(kits) as (keyof typeof kits)[])('%s density and size', (name) => {
  const kit = kits[name]

  it('default: original classes, no data-density or data-size', async () => {
    await mountMenu(kit)
    const c = contentOf(kit)
    expect(c.hasAttribute('data-density')).toBe(false)
    expect(c.hasAttribute('data-size')).toBe(false)
    expect(set(c.className)).toEqual(set(cn(menuContent)))
    expect(set(q('#item').className)).toEqual(set(cn(menuItem)))
    expect(set(q('#label').className)).toEqual(set(cn(menuLabel)))
    expect(set(q('#sep').className)).toEqual(set(cn(menuSeparator)))
    expect(set(q('#shortcut').className)).toEqual(set(cn(menuShortcut)))
    has(q('#item-inset'), 'pl-8')
    has(q('#check'), 'pl-8', 'pr-2')
    expect(q('#check > span').classList.contains('left-2')).toBe(true)
  })

  it('density="default" and size="md" are identical to omitting them', async () => {
    await mountMenu(kit, { density: 'default', size: 'md' })
    expect(set(contentOf(kit).className)).toEqual(set(cn(menuContent)))
    expect(set(q('#item').className)).toEqual(set(cn(menuItem)))
    expect(contentOf(kit).hasAttribute('data-size')).toBe(false)
  })

  describe('comfortable density', () => {
    it('roomier surface and rows for every part, with data-density', async () => {
      await mountMenu(kit, { density: 'comfortable' })
      const c = contentOf(kit)
      expect(c.getAttribute('data-density')).toBe('comfortable')
      has(c, 'p-1.5')
      lacks(c, 'p-1')
      has(q('#item'), 'gap-3', 'px-3', 'py-2')
      lacks(q('#item'), 'px-2', 'py-1.5')
      has(q('#item-inset'), 'pl-9', 'rtl:pr-9', 'rtl:pl-3')
      has(q('#check'), 'pl-9', 'pr-3', 'py-2')
      has(q('#radio'), 'pl-9', 'pr-3', 'py-2')
      has(q('#check > span'), 'left-3', 'rtl:right-3', 'rtl:left-auto')
      lacks(q('#check > span'), 'left-2')
      has(q('#label'), 'px-3', 'py-2')
      has(q('#label-inset'), 'pl-9')
      has(q('#sep'), 'my-1.5', '-mx-1.5')
    })

    it('keeps touch target, highlight and RTL classes', async () => {
      await mountMenu(kit, { density: 'comfortable' })
      const row = q('#item')
      has(row, 'pointer-coarse:min-h-11', 'data-[highlighted]:bg-accent')
      expect(row.className).toContain('forced-colors:data-[highlighted]:bg-[Highlight]')
      expect(q('#check > span').className).toContain('rtl:right-3')
    })

    it('reaches the portalled sub menu', async () => {
      await mountMenu(kit, { density: 'comfortable' })
      subTrigger(kit).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
      await nextTick()
      await tick()
      const sub = q(`[data-slot="${kit.slot}-sub-content"]`)
      expect(sub.getAttribute('data-density')).toBe('comfortable')
      has(q('#nested'), 'py-2', 'px-3')
      has(sub, 'p-1.5', 'shadow-lg')
      has(subTrigger(kit), 'pl-9')
    })
  })

  describe('compact density (unchanged)', () => {
    it('still tightens every part', async () => {
      await mountMenu(kit, { density: 'compact' })
      expect(contentOf(kit).getAttribute('data-density')).toBe('compact')
      has(contentOf(kit), 'p-0.5', 'min-w-36')
      has(q('#item'), 'px-1.5', 'py-1', 'text-xs')
      has(q('#item-inset'), 'pl-7')
      has(q('#check > span'), 'left-1.5', 'size-3')
      has(q('#label'), 'text-2xs')
      has(q('#sep'), 'my-0.5')
    })
  })

  describe('size', () => {
    it.each([
      ['sm', { content: 'min-w-40', item: 'text-xs', label: 'text-2xs', shortcut: 'text-2xs' }],
      ['lg', { content: 'min-w-56', item: 'text-base', label: 'text-sm', shortcut: 'text-sm' }],
    ] as const)('size %s sets minimum width and type scale, with data-size', async (size, expected) => {
      await mountMenu(kit, { size })
      const c = contentOf(kit)
      expect(c.getAttribute('data-size')).toBe(size)
      has(c, expected.content)
      lacks(c, 'min-w-44')
      has(q('#item'), expected.item)
      has(q('#check'), expected.item)
      has(q('#radio'), expected.item)
      has(subTrigger(kit), expected.item)
      has(q('#label'), expected.label)
      has(q('#shortcut'), expected.shortcut)
      expect(q('#item').className).toContain(size === 'sm' ? 'size-3.5' : 'size-5')
    })

    it('size does not change the spacing of the default density', async () => {
      await mountMenu(kit, { size: 'lg' })
      has(q('#item'), 'px-2', 'py-1.5')
      has(contentOf(kit), 'p-1')
      expect(contentOf(kit).hasAttribute('data-density')).toBe(false)
    })

    it('reaches the portalled sub menu', async () => {
      await mountMenu(kit, { size: 'lg' })
      subTrigger(kit).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
      await nextTick()
      await tick()
      const sub = q(`[data-slot="${kit.slot}-sub-content"]`)
      expect(sub.getAttribute('data-size')).toBe('lg')
      has(sub, 'min-w-56')
      has(q('#nested'), 'text-base')
    })
  })

  describe('combinations and precedence', () => {
    it.each([
      ['compact', 'sm'],
      ['compact', 'lg'],
      ['comfortable', 'sm'],
      ['comfortable', 'lg'],
      ['default', 'lg'],
    ] as const)('density %s with size %s applies both dimensions without conflicts', async (density, size) => {
      await mountMenu(kit, { density, size })
      const c = contentOf(kit)
      expect(c.getAttribute('data-size')).toBe(size)
      expect(c.getAttribute('data-density') ?? 'default').toBe(density)
      has(q('#item'), size === 'sm' ? 'text-xs' : 'text-base')
      lacks(q('#item'), size === 'sm' ? 'text-base' : 'text-xs')
      if (density === 'comfortable') has(q('#item'), 'py-2')
      if (density === 'compact') has(q('#item'), 'py-1')
      // exactly one text-size and one vertical padding class per row
      expect([...q('#item').classList].filter((x) => /^(text-(xs|sm|base|lg)|text-2xs)$/.test(x))).toHaveLength(1)
      expect([...q('#item').classList].filter((x) => /^py-/.test(x))).toHaveLength(1)
    })

    it('content density and size override the root, unset ones are inherited', async () => {
      await mountMenu(kit, { density: 'compact', size: 'lg' }, { density: 'comfortable' })
      const c = contentOf(kit)
      expect(c.getAttribute('data-density')).toBe('comfortable')
      expect(c.getAttribute('data-size')).toBe('lg')
      has(q('#item'), 'py-2', 'text-base')
    })

    it('content can reset the root back to the defaults', async () => {
      await mountMenu(kit, { density: 'comfortable', size: 'sm' }, { density: 'default', size: 'md' })
      expect(contentOf(kit).hasAttribute('data-density')).toBe(false)
      expect(contentOf(kit).hasAttribute('data-size')).toBe(false)
      expect(set(q('#item').className)).toEqual(set(cn(menuItem)))
    })

    it('size on the content alone works', async () => {
      await mountMenu(kit, {}, { size: 'sm' })
      expect(contentOf(kit).getAttribute('data-size')).toBe('sm')
      has(q('#item'), 'text-xs')
    })

    it('unknown density and size fall back to default and md, on root and content', async () => {
      await mountMenu(kit, { density: 'huge', size: 'giant' })
      expect(contentOf(kit).hasAttribute('data-density')).toBe(false)
      expect(contentOf(kit).hasAttribute('data-size')).toBe(false)
      expect(set(q('#item').className)).toEqual(set(cn(menuItem)))
      wrapper!.unmount()
      document.body.innerHTML = ''
      await mountMenu(kit, {}, { density: 'huge', size: 'giant' })
      expect(contentOf(kit).hasAttribute('data-density')).toBe(false)
      expect(contentOf(kit).hasAttribute('data-size')).toBe(false)
      expect(set(q('#item').className)).toEqual(set(cn(menuItem)))
    })

    it('consumer classes win over density and size classes', async () => {
      await mountMenu(kit, { density: 'comfortable', size: 'lg' }, { class: 'min-w-80 p-4' }, 'py-0.5 text-sm')
      has(contentOf(kit), 'min-w-80', 'p-4')
      lacks(contentOf(kit), 'min-w-56', 'p-1.5')
      has(q('#item'), 'py-0.5', 'text-sm')
      lacks(q('#item'), 'py-2', 'text-base')
    })

    it('does not leak density or size as DOM attributes of the root or content', async () => {
      await mountMenu(kit, { density: 'compact', size: 'sm' })
      expect(contentOf(kit).hasAttribute('density')).toBe(false)
      expect(contentOf(kit).hasAttribute('size')).toBe(false)
    })
  })

  describe('accessibility is the same in every look', () => {
    it.each([
      [{}],
      [{ density: 'comfortable', size: 'lg' }],
      [{ density: 'compact', size: 'sm' }],
    ])('roles and structure with %j', async (root) => {
      await mountMenu(kit, root)
      expect(contentOf(kit).getAttribute('role')).toBe('menu')
      expect(qa('[role="menuitem"]').length).toBeGreaterThanOrEqual(3)
      expect(q('#check').getAttribute('role')).toBe('menuitemcheckbox')
      expect(q('#radio').getAttribute('role')).toBe('menuitemradio')
      expect(q('#sep').getAttribute('role')).toBe('separator')
      expect(q('#item-destructive').getAttribute('data-variant')).toBe('destructive')
      has(q('#item'), 'pointer-coarse:min-h-11')
      expect(q('#item-destructive').className).toContain('text-destructive')
    })
  })
})

describe('useCompactMenu (kept for existing imports)', () => {
  it('is true only while the nearest menu is compact', () => {
    const seen: boolean[] = []
    const Probe = defineComponent({
      setup() {
        const compact = useCompactMenu()
        return () => h('span', String(compact.value))
      },
    })
    for (const density of ['default', 'compact', 'comfortable'] as const) {
      const w = mount(defineComponent({ setup: () => () => h(DropdownMenu, { density }, () => h(Probe)) }))
      seen.push(w.text() === 'true')
      w.unmount()
    }
    expect(seen).toEqual([false, true, false])
    const bare = mount(Probe)
    expect(bare.text()).toBe('false')
    bare.unmount()
  })
})

describe('menu parts outside a menu root', () => {
  it('fall back to the default look', () => {
    wrapper = mount(
      defineComponent({
        setup: () => () => h('div', [h(DropdownMenuShortcut, { id: 'sc' }, () => 'k'), h(ContextMenuShortcut, { id: 'sc2' }, () => 'k')]),
      }),
      { attachTo: document.body },
    )
    expect(set(document.getElementById('sc')!.className)).toEqual(set(cn(menuShortcut)))
    expect(set(document.getElementById('sc2')!.className)).toEqual(set(cn(menuShortcut)))
  })
})
