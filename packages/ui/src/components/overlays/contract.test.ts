import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref } from 'vue'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
import { configureStrictMode } from '../../lib/contract'
import { VisuallyHidden } from '../primitives/VisuallyHidden'
import { Command, CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from './Command'
import { ContextMenu, ContextMenuTrigger } from './ContextMenu'
import { DropdownMenu, DropdownMenuTrigger } from './DropdownMenu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'
import { SimpleTooltip, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip'
import Tour, { type TourStep } from './Tour/Tour.vue'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from './AlertDialog'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './Dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './Sheet'

/** Required parts are checked when the content mounts; errors surface through Vue's error handling. */
const errors: Error[] = []
let wrapper: VueWrapper | undefined
const open = (root: () => unknown) => {
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
    { attachTo: document.body },
  )
  return settle()
}
beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
})

describe('Dialog contract', () => {
  it('throws when DialogContent has no DialogTitle, naming the fix', async () => {
    await open(() => h(Dialog, { open: true }, () => h(DialogContent, null, () => h('p', 'Body'))))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('DialogContent: requires a DialogTitle')
    expect(errors[0].message).toContain('VisuallyHidden')
  })
  it('is satisfied by a DialogTitle, however deeply nested', async () => {
    await open(() => h(Dialog, { open: true }, () => h(DialogContent, null, () => h('div', null, h('header', null, h(DialogTitle, null, () => 'Edit'))))))
    expect(errors).toEqual([])
  })
  it('is satisfied by a visually hidden title', async () => {
    await open(() => h(Dialog, { open: true }, () => h(DialogContent, null, () => h(VisuallyHidden, { asChild: true }, () => h(DialogTitle, null, () => 'Hidden title')))))
    expect(errors).toEqual([])
  })
  it('is satisfied by aria-label or aria-labelledby on the content, but not by an empty one', async () => {
    await open(() => h(Dialog, { open: true }, () => h(DialogContent, { 'aria-label': 'Settings' })))
    expect(errors).toEqual([])
    wrapper?.unmount()
    await open(() => h(Dialog, { open: true }, () => h(DialogContent, { 'aria-label': '' })))
    expect(errors).toHaveLength(1)
  })
  it('a closed dialog renders nothing and checks nothing', async () => {
    await open(() => h(Dialog, { open: false }, () => h(DialogContent)))
    expect(errors).toEqual([])
  })
  it('warn mode logs the message and does not throw; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await open(() => h(Dialog, { open: true }, () => h(DialogContent)))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('DialogContent: requires a DialogTitle'))).toBe(true)
    spy.mockClear()
    wrapper?.unmount()
    configureStrictMode('off')
    await open(() => h(Dialog, { open: true }, () => h(DialogContent)))
    expect(spy.mock.calls.some((c) => String(c[0]).includes('requires a DialogTitle'))).toBe(false)
    spy.mockRestore()
  })
})

describe('AlertDialog contract', () => {
  const full = () => [h(AlertDialogTitle, null, () => 'Delete?'), h(AlertDialogDescription, null, () => 'This cannot be undone.'), h(AlertDialogCancel, null, () => 'Cancel'), h(AlertDialogAction, null, () => 'Delete')]
  it('passes with a title and a description', async () => {
    await open(() => h(AlertDialog, { open: true }, () => h(AlertDialogContent, null, full)))
    expect(errors).toEqual([])
  })
  it('throws for a missing title and for a missing description', async () => {
    await open(() => h(AlertDialog, { open: true }, () => h(AlertDialogContent, null, () => [h(AlertDialogDescription, null, () => 'Sure?')])))
    expect(errors.map((e) => e.message).join('\n')).toContain('requires a AlertDialogTitle')
    errors.length = 0
    wrapper?.unmount()
    await open(() => h(AlertDialog, { open: true }, () => h(AlertDialogContent, null, () => [h(AlertDialogTitle, null, () => 'Delete?')])))
    expect(errors.map((e) => e.message).join('\n')).toContain('requires a AlertDialogDescription')
  })
})

describe('Sheet contract', () => {
  it('throws without a SheetTitle and passes with one (or an aria-label)', async () => {
    await open(() => h(Sheet, { open: true }, () => h(SheetContent, null, () => h(SheetDescription, null, () => 'Only a description'))))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SheetContent: requires a SheetTitle')
    errors.length = 0
    wrapper?.unmount()
    await open(() => h(Sheet, { open: true }, () => h(SheetContent, null, () => h(SheetTitle, null, () => 'Filters'))))
    expect(errors).toEqual([])
    wrapper?.unmount()
    await open(() => h(Sheet, { open: true }, () => h(SheetContent, { 'aria-label': 'Filters' })))
    expect(errors).toEqual([])
  })
})

const messages = () => errors.map((e) => e.message).join('\n')
/** Unmount whatever is mounted and open a new tree (the error list is reset too). */
const reopen = (root: () => unknown) => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  errors.length = 0
  return open(root)
}
const svg = () => h('svg', { 'aria-hidden': 'true', focusable: 'false' })

describe('Command contract', () => {
  const list = (...items: unknown[]) => () => h(Command, null, () => [h(CommandInput), h(CommandList, null, () => [h(CommandEmpty, null, () => 'Nothing found'), ...(items as never[])])])

  it('throws when a Command renders no CommandEmpty', async () => {
    await open(() => h(Command, null, () => [h(CommandInput), h(CommandList, null, () => h(CommandItem, { value: 'a' }, () => 'A'))]))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Command: requires a CommandEmpty')
  })
  it('is satisfied by a CommandEmpty even while results exist and it renders nothing', async () => {
    await open(list(h(CommandItem, { value: 'a' }, () => 'A')))
    expect(errors).toEqual([])
    expect(document.querySelector('[data-slot="command-empty"]')).toBeNull()
  })

  it('throws for a CommandItem without a value, naming the fix', async () => {
    await open(list(h(CommandItem, { value: '' }, () => 'Blank'), h(CommandItem, { value: '  ' }, () => 'Spaces'), h(CommandItem, null, () => 'Missing')))
    expect(errors).toHaveLength(3)
    expect(errors[0].message).toContain('CommandItem: requires a non-empty `value`')
  })
  it('throws once for a repeated value, on the later item', async () => {
    await open(list(h(CommandItem, { value: 'save' }, () => 'Save'), h(CommandItem, { value: 'save' }, () => 'Save as')))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('CommandItem: shares its value ("save") with another CommandItem')
  })
  it('accepts distinct strings, numbers and objects, and flags the same object twice', async () => {
    const a = { id: 1 }
    await open(list(h(CommandItem, { value: 'a' }, () => 'A'), h(CommandItem, { value: 2 }, () => 'Two'), h(CommandItem, { value: a }, () => 'Obj'), h(CommandItem, { value: { id: 1 } }, () => 'Other')))
    expect(errors).toEqual([])
    await reopen(list(h(CommandItem, { value: a }, () => 'Obj'), h(CommandItem, { value: a }, () => 'Same')))
    expect(messages()).toContain('shares its value (the same object)')
  })

  it('throws when CommandInput has an empty aria-label and passes with the default or a custom one', async () => {
    await open(() => h(Command, null, () => [h(CommandInput, { 'aria-label': '' }), h(CommandList, null, () => h(CommandEmpty))]))
    expect(messages()).toContain('CommandInput: needs an accessible name')
    await reopen(() => h(Command, null, () => [h(CommandInput), h(CommandList, null, () => h(CommandEmpty))]))
    expect(errors).toEqual([])
    await reopen(() => h(Command, null, () => [h(CommandInput, { 'aria-label': 'Find an action' }), h(CommandList, null, () => h(CommandEmpty))]))
    expect(errors).toEqual([])
  })
  it('throws when CommandList label is blank and passes with a label or aria-labelledby', async () => {
    await open(() => h(Command, null, () => [h(CommandInput), h(CommandList, { label: '' }, () => h(CommandEmpty))]))
    expect(messages()).toContain('CommandList: needs an accessible name')
    await reopen(() => h(Command, null, () => [h(CommandInput), h(CommandList, { label: 'Actions' }, () => h(CommandEmpty))]))
    expect(errors).toEqual([])
    await reopen(() => h('div', null, [h('span', { id: 'cmd-heading' }, 'Actions'), h(Command, null, () => [h(CommandInput), h(CommandList, { 'aria-labelledby': 'cmd-heading' }, () => h(CommandEmpty))])]))
    expect(errors).toEqual([])
  })

  it('CommandDialog throws on a blank title and passes with the default and a custom title', async () => {
    const body = () => [h(CommandInput), h(CommandList, null, () => [h(CommandEmpty), h(CommandItem, { value: 'a' }, () => 'A')])]
    await open(() => h(CommandDialog, { open: true, title: '  ' }, body))
    expect(messages()).toContain('CommandDialog: requires a non-empty `title`')
    await reopen(() => h(CommandDialog, { open: true }, body))
    expect(errors).toEqual([])
    await reopen(() => h(CommandDialog, { open: true, title: 'Jump to' }, body))
    expect(errors).toEqual([])
  })

  it('warn mode logs and does not throw; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(() => h(Command, null, () => h(CommandList, null, () => h(CommandItem, { value: '' }, () => 'A'))))
    expect(errors).toEqual([])
    expect(spy.mock.calls.map((c) => String(c[0])).join('\n')).toContain('CommandItem: requires a non-empty `value`')
    spy.mockClear()
    configureStrictMode('off')
    await reopen(() => h(Command, null, () => h(CommandList, null, () => h(CommandItem, { value: '' }, () => 'A'))))
    expect(errors).toEqual([])
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('Tooltip contract', () => {
  const trigger = (child: unknown, props: Record<string, unknown> = { asChild: true }) => h(TooltipTrigger, props, () => child as never)
  const tip = (child: unknown, props?: Record<string, unknown>) => () =>
    h(TooltipProvider, null, () => h(Tooltip, null, () => [trigger(child, props), h(TooltipContent, null, () => 'Hint')]))

  it('throws when a Tooltip has no TooltipProvider, and still renders its trigger', async () => {
    await open(() => h(Tooltip, null, () => [trigger(h('button', null, 'Save')), h(TooltipContent, null, () => 'Hint')]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Tooltip: requires a TooltipProvider')
    expect(errors[0].message).toContain('SimpleTooltip')
    expect(document.querySelector('[data-slot="tooltip-trigger"]')).not.toBeNull()
  })
  it('passes inside a TooltipProvider and with SimpleTooltip', async () => {
    await open(tip(h('button', null, 'Save')))
    expect(errors).toEqual([])
    await reopen(() => h(SimpleTooltip, { content: 'Hint' }, () => h('button', null, 'Save')))
    expect(errors).toEqual([])
  })
  it('throws for a TooltipTrigger or TooltipContent outside a Tooltip', async () => {
    await open(() => h(TooltipProvider, null, () => [h(TooltipTrigger, null, () => 'Hover')]))
    expect(messages()).toContain('TooltipTrigger: requires a Tooltip around it')
    await reopen(() => h(TooltipProvider, null, () => h(TooltipContent, null, () => 'Hint')))
    expect(messages()).toContain('TooltipContent: requires a Tooltip around it')
  })
  it('throws when the trigger is not keyboard focusable', async () => {
    await open(tip(h('span', null, 'Hover me')))
    expect(messages()).toContain('TooltipTrigger: needs a focusable element, but `<span>`')
    await reopen(tip(h('div', { tabindex: '-1' }, 'Hover me')))
    expect(messages()).toContain('needs a focusable element')
  })
  it('accepts a button, a link, an input and a span with tabindex 0', async () => {
    for (const el of [h('button', null, 'Save'), h('a', { href: '/x' }, 'Docs'), h('input', { 'aria-label': 'Name' }), h('span', { tabindex: '0' }, 'Hover me')]) {
      await reopen(tip(el))
      expect(errors).toEqual([])
    }
  })
  it('the default trigger (no asChild) renders a button and passes with text', async () => {
    await open(tip('Hover me', {}))
    expect(errors).toEqual([])
  })
  it('throws for an icon-only trigger and accepts aria-label or a labelled icon', async () => {
    await open(tip(h('button', null, svg())))
    expect(messages()).toContain('TooltipTrigger: needs an accessible name')
    await reopen(tip(h('button', { 'aria-label': 'Help' }, svg())))
    expect(errors).toEqual([])
    await reopen(tip(h('button', null, h('svg', { role: 'img', 'aria-label': 'Help' }))))
    expect(errors).toEqual([])
  })
  it('skips a trigger whose tooltip is disabled (SimpleTooltip without content)', async () => {
    await open(() => h(SimpleTooltip, null, () => h('span', null, 'Plain')))
    expect(errors).toEqual([])
  })
  it('warn and off modes do not throw', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(tip(h('span', null, 'x')))
    expect(errors).toEqual([])
    expect(spy.mock.calls.map((c) => String(c[0])).join('\n')).toContain('needs a focusable element')
    spy.mockClear()
    configureStrictMode('off')
    await reopen(tip(h('span', null, 'x')))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('menu, popover and hover card trigger contract', () => {
  const cases = [
    ['PopoverTrigger', (child: unknown) => () => h(Popover, null, () => [h(PopoverTrigger, { asChild: true }, () => child as never), h(PopoverContent, null, () => 'Body')])],
    ['DropdownMenuTrigger', (child: unknown) => () => h(DropdownMenu, null, () => h(DropdownMenuTrigger, { asChild: true }, () => child as never))],
    ['ContextMenuTrigger', (child: unknown) => () => h(ContextMenu, null, () => h(ContextMenuTrigger, { asChild: true }, () => child as never))],
  ] as const
  it.each(cases)('%s throws without a name, and passes with text, aria-label, aria-labelledby or a labelled icon', async (name, make) => {
    const el = name === 'ContextMenuTrigger' ? 'div' : 'button'
    await open(make(h(el, null, svg())))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain(`${name}: needs an accessible name`)
    for (const child of [h(el, null, 'Options'), h(el, { 'aria-label': 'Options' }, svg()), h(el, null, h('svg', { role: 'img', 'aria-label': 'Options' })), h('div', null, [h('span', { id: 'lbl-' + name }, 'Options'), h(el, { 'aria-labelledby': 'lbl-' + name }, svg())])]) {
      await reopen(make(child))
      expect(errors).toEqual([])
    }
  })
  it('the default trigger element is a button: empty slot throws, text passes', async () => {
    await open(() => h(Popover, null, () => [h(PopoverTrigger), h(PopoverContent, null, () => 'Body')]))
    expect(messages()).toContain('PopoverTrigger: needs an accessible name')
    await reopen(() => h(DropdownMenu, null, () => h(DropdownMenuTrigger, null, () => 'Actions')))
    expect(errors).toEqual([])
  })

  const card = (child: unknown, props: Record<string, unknown> = { asChild: true }) => () =>
    h(HoverCard, null, () => [h(HoverCardTrigger, props, () => child as never), h(HoverCardContent, null, () => 'Preview')])
  it('HoverCardTrigger throws for a link without href and for a non-focusable element', async () => {
    await open(card('@ada', {}))
    expect(messages()).toContain('HoverCardTrigger: needs a focusable element, but `<a>`')
    await reopen(card(h('span', null, '@ada')))
    expect(messages()).toContain('needs a focusable element')
  })
  it('HoverCardTrigger passes with an href link, a button or a tabindex element, and throws for an unnamed link', async () => {
    for (const [child, props] of [['@ada', { href: '/u/ada' }], [h('button', null, '@ada'), undefined], [h('span', { tabindex: '0' }, '@ada'), undefined]] as const) {
      await reopen(card(child, props ?? { asChild: true }))
      expect(errors).toEqual([])
    }
    await reopen(card(h('a', { href: '/u/ada' }, svg())))
    expect(messages()).toContain('HoverCardTrigger: needs an accessible name')
  })
  it('warn and off modes do not throw', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(card('@ada', {}))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalled()
    spy.mockClear()
    configureStrictMode('off')
    await reopen(card('@ada', {}))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('Tour contract', () => {
  // Plain JavaScript callers can leave `target` out, so the steps are typed loosely here.
  const tour = (steps: unknown[], extra: Record<string, unknown> = {}) => () => h(Tour, { open: true, teleport: false, steps: steps as TourStep[], ...extra })
  it('passes with titles and targets (a missing element is allowed) or an explicit null target', async () => {
    await open(tour([{ target: '#nowhere', title: 'One' }, { target: null, title: 'Two' }]))
    expect(errors).toEqual([])
  })
  it('throws for a step without a title', async () => {
    await open(tour([{ target: '#a', title: 'One' }, { target: '#b', title: '  ' }]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Tour: step 2 requires a non-empty `title`')
  })
  it('is satisfied by a title slot', async () => {
    await open(() => h(Tour, { open: true, teleport: false, steps: [{ target: null, title: '' }] }, { title: () => 'Custom title' }))
    expect(errors).toEqual([])
  })
  it('throws for a step without a target, naming the explicit centred form', async () => {
    await open(tour([{ title: 'One' }]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Tour: step 1 requires a `target`')
    expect(errors[0].message).toContain('target: null')
  })
  it('throws when the dialog ends up with no accessible name', async () => {
    await open(() => h(Tour, { open: true, teleport: false, steps: [{ target: null, title: '' }] }, { title: () => '' }))
    expect(messages()).toContain('Tour: needs an accessible name')
  })
  it('a closed tour checks nothing; opening it does', async () => {
    const isOpen = ref(false)
    await open(() => h(Tour, { open: isOpen.value, teleport: false, steps: [{ title: 'No target' }] as unknown as TourStep[] }))
    expect(errors).toEqual([])
    isOpen.value = true
    await settle()
    expect(messages()).toContain('Tour: step 1 requires a `target`')
  })
  it('warn and off modes do not throw', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(tour([{ title: '' }]))
    expect(errors).toEqual([])
    expect(spy.mock.calls.map((c) => String(c[0])).join('\n')).toContain('requires a non-empty `title`')
    spy.mockClear()
    configureStrictMode('off')
    await reopen(tour([{ title: '' }]))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
