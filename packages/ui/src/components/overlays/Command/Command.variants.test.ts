import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  commandSizes,
  commandVariantNames,
  commandVariants,
} from './index'
import { commandDialogWidth, commandEmptyVariants, commandHeadingVariants, commandInputVariants, commandInputWrapperVariants, commandItemVariants, commandListVariants, commandShortcutVariants, normalizeCommandSize, normalizeCommandVariant } from './variants'
import { cn } from '../../../lib/cn'
import { menuItem } from '../menuStyles'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean))

function make(rootProps: Record<string, unknown> = {}) {
  wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(Command, rootProps, () => [
          h(CommandInput, { placeholder: 'Search commands' }),
          h(CommandList, null, () => [
            h(CommandEmpty, { id: 'empty' }, () => 'Nothing here'),
            h(CommandGroup, { heading: 'Files' }, () => [
              h(CommandItem, { value: 'open' }, () => ['Open', h(CommandShortcut, null, () => 'Ctrl O')]),
              h(CommandItem, { value: 'save' }, () => 'Save'),
            ]),
            h(CommandSeparator),
          ]),
        ]),
    }),
    { attachTo: document.body },
  )
}
const root = () => q('[data-slot="command"]')!
const cls = (selector: string) => q(selector)!.className.split(' ')

describe('Command variant', () => {
  it('lists the values', () => {
    expect(commandVariantNames).toEqual(['palette', 'inline'])
    expect(commandSizes).toEqual(['sm', 'md', 'lg'])
  })

  it('default is the palette: the original root classes, no border, no data attributes', () => {
    make()
    const original = 'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground'
    expect(set(root().className)).toEqual(set(original))
    expect(root().hasAttribute('data-variant')).toBe(false)
    expect(root().hasAttribute('data-size')).toBe(false)
    expect(commandVariants()).toBe(original)
  })

  it('palette is identical to omitting it', () => {
    make({ variant: 'palette' })
    expect(root().hasAttribute('data-variant')).toBe(false)
    expect(root().classList.contains('border')).toBe(false)
  })

  it('inline adds a border and a light shadow and sets data-variant', () => {
    make({ variant: 'inline' })
    expect(root().getAttribute('data-variant')).toBe('inline')
    expect(root().classList.contains('border')).toBe(true)
    expect(root().classList.contains('shadow-xs')).toBe(true)
    expect(root().classList.contains('bg-popover')).toBe(true)
    expect(root().classList.contains('rounded-md')).toBe(true)
  })

  it('unknown variant falls back to the palette (also prototype keys)', () => {
    for (const bad of ['card', 'toString', '']) {
      make({ variant: bad })
      expect(root().classList.contains('border')).toBe(false)
      expect(root().hasAttribute('data-variant')).toBe(false)
      wrapper!.unmount()
      document.body.innerHTML = ''
    }
    expect(normalizeCommandVariant('x')).toBe('palette')
  })

  it('the class prop wins over the variant classes', () => {
    make({ variant: 'inline', class: 'border-0 shadow-lg rounded-xl' })
    expect(root().classList.contains('border-0')).toBe(true)
    expect(root().classList.contains('border')).toBe(false)
    expect(root().classList.contains('shadow-lg')).toBe(true)
    expect(root().classList.contains('shadow-xs')).toBe(false)
  })

  it('does not leak variant or size as DOM attributes', () => {
    make({ variant: 'inline', size: 'lg' })
    expect(root().hasAttribute('variant')).toBe(false)
    expect(root().hasAttribute('size')).toBe(false)
  })
})

describe('Command size', () => {
  it('md (default) keeps the original classes on every part', () => {
    make()
    expect(set(q('[data-slot="command-input-wrapper"]')!.className)).toEqual(set('flex h-11 items-center gap-2 border-b px-3'))
    expect(set(q('[data-slot="command-input"]')!.className)).toEqual(
      set('h-full w-full rounded-sm bg-transparent text-sm outline-hidden placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 forced-colors:focus-visible:outline-2 forced-colors:focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50'),
    )
    expect(set(q('[data-slot="command-list"]')!.className)).toEqual(set('max-h-80 scroll-py-1 overflow-x-hidden overflow-y-auto p-1'))
    expect(set(q('[data-slot="command-item"]')!.className)).toEqual(set(cn(menuItem, 'data-[disabled]:text-muted-foreground data-[disabled]:opacity-100')))
    expect(set(q('[data-slot="command-group-heading"]')!.className)).toEqual(set('px-2 py-1.5 text-xs font-medium text-muted-foreground'))
    expect(set(q('[data-slot="command-empty"]')!.className)).toEqual(set('py-8 text-center text-sm text-muted-foreground'))
    expect(set(q('[data-slot="command-shortcut"]')!.className)).toEqual(set('ml-auto rtl:mr-auto rtl:ml-0 text-xs tracking-widest text-muted-foreground'))
  })

  it.each([
    ['sm', { wrapper: ['h-9', 'px-2', 'gap-1.5'], list: ['max-h-56', 'p-0.5'], item: ['px-1.5', 'py-1', 'text-xs'], heading: ['px-1.5', 'text-2xs'], empty: ['py-6', 'text-xs'], shortcut: ['text-2xs'], input: ['text-sm'] }],
    ['lg', { wrapper: ['h-14', 'px-4', 'gap-3'], list: ['max-h-96', 'p-1.5'], item: ['px-3', 'py-2', 'text-base'], heading: ['px-3', 'py-2', 'text-sm'], empty: ['py-10', 'text-base'], shortcut: ['text-sm'], input: ['text-base'] }],
  ] as const)('size %s changes every part and sets data-size', (size, e) => {
    make({ size })
    expect(root().getAttribute('data-size')).toBe(size)
    expect(cls('[data-slot="command-input-wrapper"]')).toEqual(expect.arrayContaining([...e.wrapper]))
    expect(cls('[data-slot="command-list"]')).toEqual(expect.arrayContaining([...e.list]))
    expect(cls('[data-slot="command-item"]')).toEqual(expect.arrayContaining([...e.item]))
    expect(cls('[data-slot="command-group-heading"]')).toEqual(expect.arrayContaining([...e.heading]))
    expect(cls('[data-slot="command-shortcut"]')).toEqual(expect.arrayContaining([...e.shortcut]))
    expect(cls('[data-slot="command-input"]')).toEqual(expect.arrayContaining([...e.input]))
  })

  it('the empty message changes with size', async () => {
    for (const [size, expected] of [['sm', 'py-6'], ['md', 'py-8'], ['lg', 'py-10']] as const) {
      wrapper = mount(
        defineComponent({
          setup: () => () => h(Command, { size, search: 'zzz' }, () => [h(CommandInput), h(CommandList, null, () => [h(CommandEmpty, null, () => 'Nothing'), h(CommandItem, { value: 'a' }, () => 'A')])]),
        }),
        { attachTo: document.body },
      )
      await nextTick()
      expect(cls('[data-slot="command-empty"]'), size).toContain(expected)
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  it('unknown size falls back to md', () => {
    make({ size: 'huge' })
    expect(root().hasAttribute('data-size')).toBe(false)
    expect(cls('[data-slot="command-input-wrapper"]')).toContain('h-11')
    expect(normalizeCommandSize('toString')).toBe('md')
    expect(normalizeCommandSize(undefined)).toBe('md')
  })

  it('the item stays 44px high on touch and keeps the highlight styles at every size', () => {
    for (const size of commandSizes) {
      make({ size })
      expect(cls('[data-slot="command-item"]')).toContain('pointer-coarse:min-h-11')
      expect(q('[data-slot="command-item"]')!.className).toContain('data-[highlighted]:bg-accent')
      expect(q('[data-slot="command-item"]')!.className).toContain('forced-colors:data-[highlighted]:bg-[Highlight]')
      wrapper!.unmount()
      document.body.innerHTML = ''
    }
  })

  it('size and variant combine; the cross product keeps the accessible structure', () => {
    for (const size of commandSizes) {
      for (const variant of commandVariantNames) {
        make({ size, variant })
        expect(root().getAttribute('role')).toBeNull()
        expect(q('[data-slot="command-input"]')!.getAttribute('aria-label')).toBe('Search')
        expect(q('[data-slot="command-list"]')!.getAttribute('aria-label')).toBe('Results')
        expect(q('[data-slot="command-list"]')!.getAttribute('role')).toBe('listbox')
        expect(q('[data-slot="command-status"]')!.getAttribute('role')).toBe('status')
        expect(root().classList.contains('border')).toBe(variant === 'inline')
        wrapper!.unmount()
        document.body.innerHTML = ''
      }
    }
  })

  it('consumer classes win on parts', () => {
    wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Command, { size: 'lg' }, () => [
            h(CommandInput, { class: 'text-xs' }),
            h(CommandList, { class: 'max-h-40' }, () => [h(CommandEmpty), h(CommandItem, { value: 'a', class: 'py-0' }, () => 'A')]),
          ]),
      }),
      { attachTo: document.body },
    )
    expect(cls('[data-slot="command-input"]')).toContain('text-xs')
    expect(cls('[data-slot="command-input"]')).not.toContain('text-base')
    expect(cls('[data-slot="command-list"]')).toContain('max-h-40')
    expect(cls('[data-slot="command-list"]')).not.toContain('max-h-96')
    expect(cls('[data-slot="command-item"]')).toContain('py-0')
  })

  it('the parts used outside a Command use the md size', () => {
    wrapper = mount(
      defineComponent({
        setup: () => () => h('div', [h(CommandShortcut, { id: 'sc' }, () => 'k'), h(CommandEmpty, { id: 'em' })]),
      }),
      { attachTo: document.body },
    )
    expect(document.getElementById('sc')!.className).toContain('text-xs')
    expect(document.getElementById('em')!.className).toContain('py-8')
  })

  it('exported cva helpers', () => {
    expect(commandInputWrapperVariants()).toContain('h-11')
    expect(commandInputVariants({ size: 'lg' })).toContain('text-base')
    expect(commandListVariants({ size: 'sm' })).toContain('max-h-56')
    expect(commandItemVariants()).toBe('')
    expect(commandItemVariants({ size: 'lg' })).toContain('text-base')
    expect(commandHeadingVariants({ size: 'sm' })).toContain('text-2xs')
    expect(commandEmptyVariants()).toContain('py-8')
    expect(commandShortcutVariants()).toBe('')
    expect(() => commandVariants({ variant: 'x' as never })).not.toThrow()
  })
})

describe('CommandDialog size', () => {
  function openDialog(props: Record<string, unknown> = {}) {
    const open = ref(true)
    wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(CommandDialog, { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v), title: 'Quick actions', ...props }, () => [
            h(CommandInput),
            h(CommandList, null, () => [h(CommandEmpty), h(CommandItem, { value: 'open' }, () => 'Open')]),
          ]),
      }),
      { attachTo: document.body },
    )
    return open
  }
  const panel = () => q('[data-slot="dialog-content"]')!

  it('default width is sm:max-w-xl and the Command is md', async () => {
    openDialog()
    await nextTick()
    await tick()
    expect(panel().className).toContain('sm:max-w-xl')
    expect(root().hasAttribute('data-size')).toBe(false)
    expect(root().classList.contains('border')).toBe(false)
  })

  it.each([
    ['sm', 'sm:max-w-md'],
    ['md', 'sm:max-w-xl'],
    ['lg', 'sm:max-w-2xl'],
  ] as const)('size %s sets the dialog width %s and the Command size', async (size, width) => {
    openDialog({ size })
    await nextTick()
    await tick()
    expect(panel().classList.contains(width)).toBe(true)
    expect(panel().className.match(/sm:max-w-\S+/g)).toHaveLength(1)
    expect(commandDialogWidth[size]).toBe(width)
    expect(root().getAttribute('data-size') ?? 'md').toBe(size)
  })

  it('unknown size falls back to md and the dialog keeps its accessible name', async () => {
    openDialog({ size: 'huge' })
    await nextTick()
    await tick()
    expect(panel().classList.contains('sm:max-w-xl')).toBe(true)
    expect(panel().getAttribute('role')).toBe('dialog')
    expect(q('[data-slot="dialog-title"]')!.textContent).toBe('Quick actions')
  })

  it('the class prop wins over the width, and size is not leaked as an attribute', async () => {
    openDialog({ size: 'lg', class: 'sm:max-w-sm' })
    await nextTick()
    await tick()
    expect(panel().classList.contains('sm:max-w-sm')).toBe(true)
    expect(panel().classList.contains('sm:max-w-2xl')).toBe(false)
    expect(panel().hasAttribute('size')).toBe(false)
  })
})
