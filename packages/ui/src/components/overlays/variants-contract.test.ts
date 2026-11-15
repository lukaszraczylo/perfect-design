/**
 * The required parts of the overlays stay enforced in every look: size, variant, tone, density, arrow and width presets
 * change classes only, never the contract (see contract.test.ts for the rules themselves).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../lib/contract'
import { Command, CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList, commandSizes, commandVariantNames } from './Command'
import { ContextMenu, ContextMenuTrigger } from './ContextMenu'
import { DropdownMenu, DropdownMenuTrigger } from './DropdownMenu'
import { HoverCard, HoverCardContent, HoverCardTrigger, hoverCardSizes, hoverCardVariantNames } from './HoverCard'
import { Popover, PopoverContent, PopoverTrigger, popoverSizes, popoverVariantNames } from './Popover'
import { SimpleTooltip, tooltipSizes, tooltipVariantNames } from './Tooltip'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, alertDialogSizes, alertDialogVariantNames } from './AlertDialog'
import { Dialog, DialogContent, DialogDescription, DialogTitle, dialogSizes, dialogVariantNames, overlayTones } from './Dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle, sheetSides, sheetVariantNames } from './Sheet'
import Tour, { type TourStep } from './Tour/Tour.vue'
import { tourVariantNames } from './Tour'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

const errors: Error[] = []
let wrapper: VueWrapper | undefined
const open = async (root: () => unknown) => {
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
  await settle()
}
const reset = () => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  errors.length = 0
}
beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
})
afterEach(() => {
  reset()
  configureStrictMode('off')
})

describe('Dialog keeps its required title in every variant, size and tone', () => {
  it('throws without a title and passes with one', async () => {
    for (const variant of dialogVariantNames) {
      for (const tone of overlayTones) {
        await open(() => h(Dialog, { open: true }, () => h(DialogContent, { variant, tone, size: 'sm' }, () => h('p', 'Body'))))
        expect(errors, `${variant}/${tone}`).toHaveLength(1)
        expect(errors[0].message).toContain('DialogContent: requires a DialogTitle')
        reset()
        await open(() => h(Dialog, { open: true }, () => h(DialogContent, { variant, tone, size: 'sm' }, () => h(DialogTitle, null, () => 'Title'))))
        expect(errors, `${variant}/${tone}`).toEqual([])
        reset()
      }
    }
    for (const size of dialogSizes) {
      await open(() => h(Dialog, { open: true }, () => h(DialogContent, { size }, () => h('p', 'Body'))))
      expect(errors).toHaveLength(1)
      reset()
    }
  })

  it('aria-label satisfies it in a toned dialog', async () => {
    await open(() => h(Dialog, { open: true }, () => h(DialogContent, { tone: 'danger', 'aria-label': 'Remove' }, () => h(DialogDescription, null, () => 'x'))))
    expect(errors).toEqual([])
  })
})

describe('AlertDialog keeps its required title and description in every look', () => {
  it('throws for each missing part across size, variant and tone', async () => {
    for (const size of alertDialogSizes) {
      for (const variant of alertDialogVariantNames) {
        for (const tone of ['neutral', 'danger'] as const) {
          await open(() => h(AlertDialog, { open: true }, () => h(AlertDialogContent, { size, variant, tone }, () => [h(AlertDialogDescription, null, () => 'Desc'), h(AlertDialogCancel, null, () => 'No')])))
          expect(errors.map((e) => e.message).join('\n'), `${size}/${variant}/${tone}`).toContain('AlertDialogTitle')
          reset()
          await open(() => h(AlertDialog, { open: true }, () => h(AlertDialogContent, { size, variant, tone }, () => [h(AlertDialogTitle, null, () => 'Title'), h(AlertDialogCancel, null, () => 'No')])))
          expect(errors.map((e) => e.message).join('\n'), `${size}/${variant}/${tone}`).toContain('AlertDialogDescription')
          reset()
          await open(() =>
            h(AlertDialog, { open: true }, () =>
              h(AlertDialogContent, { size, variant, tone }, () => [h(AlertDialogTitle, null, () => 'Title'), h(AlertDialogDescription, null, () => 'Desc'), h(AlertDialogCancel, null, () => 'No'), h(AlertDialogAction, null, () => 'Yes')]),
            ),
          )
          expect(errors, `${size}/${variant}/${tone}`).toEqual([])
          reset()
        }
      }
    }
  })
})

describe('Sheet keeps its required title in every look', () => {
  it('throws without a title and passes with one across side, variant and tone', async () => {
    for (const side of sheetSides) {
      for (const variant of sheetVariantNames) {
        await open(() => h(Sheet, { open: true }, () => h(SheetContent, { side, variant, tone: 'info' }, () => h(SheetDescription, null, () => 'Desc'))))
        expect(errors, `${side}/${variant}`).toHaveLength(1)
        expect(errors[0].message).toContain('SheetContent: requires a SheetTitle')
        reset()
        await open(() => h(Sheet, { open: true }, () => h(SheetContent, { side, variant, tone: 'info' }, () => h(SheetTitle, null, () => 'Title'))))
        expect(errors, `${side}/${variant}`).toEqual([])
        reset()
      }
    }
  })
})

describe('Command keeps its names, empty state and CommandDialog title in every look', () => {
  it('requires CommandEmpty in every size and variant', async () => {
    for (const size of commandSizes) {
      for (const variant of commandVariantNames) {
        await open(() => h(Command, { size, variant }, () => [h(CommandInput), h(CommandList, null, () => h(CommandItem, { value: 'a' }, () => 'A'))]))
        expect(errors.map((e) => e.message).join('\n'), `${size}/${variant}`).toContain('CommandEmpty')
        reset()
        await open(() => h(Command, { size, variant }, () => [h(CommandInput), h(CommandList, null, () => [h(CommandEmpty), h(CommandItem, { value: 'a' }, () => 'A')])]))
        expect(errors, `${size}/${variant}`).toEqual([])
        reset()
      }
    }
  })

  it('still requires unique item values and the input and list names at lg', async () => {
    await open(() => h(Command, { size: 'lg' }, () => [h(CommandInput), h(CommandList, null, () => [h(CommandEmpty), h(CommandItem, { value: 'a' }, () => 'A'), h(CommandItem, { value: 'a' }, () => 'B')])]))
    expect(errors.some((e) => e.message.includes('shares its value'))).toBe(true)
    reset()
    await open(() => h(Command, { size: 'lg' }, () => [h(CommandInput, { 'aria-label': '' }), h(CommandList, null, () => [h(CommandEmpty), h(CommandItem, { value: 'a' }, () => 'A')])]))
    expect(errors.some((e) => e.message.includes('CommandInput'))).toBe(true)
  })

  it('CommandDialog requires a title at every size', async () => {
    for (const size of commandSizes) {
      await open(() => h(CommandDialog, { open: true, title: '', size }, () => [h(CommandInput), h(CommandList, null, () => [h(CommandEmpty), h(CommandItem, { value: 'a' }, () => 'A')])]))
      expect(errors.map((e) => e.message).join('\n'), size).toContain('CommandDialog')
      reset()
      await open(() => h(CommandDialog, { open: true, title: 'Actions', size }, () => [h(CommandInput), h(CommandList, null, () => [h(CommandEmpty), h(CommandItem, { value: 'a' }, () => 'A')])]))
      expect(errors, size).toEqual([])
      reset()
    }
  })
})

describe('Triggers keep their name and focus rules with variant props on the content', () => {
  it('Popover: an unnamed icon trigger throws, a named one passes, for every variant and size', async () => {
    const icon = () => h('svg', { 'aria-hidden': 'true' })
    for (const variant of popoverVariantNames) {
      for (const size of popoverSizes) {
        await open(() => h(Popover, null, () => [h(PopoverTrigger, null, icon), h(PopoverContent, { variant, size, showArrow: true }, () => 'x')]))
        expect(errors, `${variant}/${size}`).toHaveLength(1)
        reset()
      }
      await open(() => h(Popover, null, () => [h(PopoverTrigger, { 'aria-label': 'More' }, icon), h(PopoverContent, { variant, showArrow: true }, () => 'x')]))
      expect(errors).toEqual([])
      reset()
    }
  })

  it('HoverCard: a link without href is not keyboard focusable and throws, whatever the size and variant', async () => {
    for (const variant of hoverCardVariantNames) {
      for (const size of hoverCardSizes) {
        await open(() => h(HoverCard, null, () => [h(HoverCardTrigger, null, () => 'Ada'), h(HoverCardContent, { variant, size, showArrow: true }, () => 'x')]))
        expect(errors, `${variant}/${size}`).toHaveLength(1)
        reset()
        await open(() => h(HoverCard, null, () => [h(HoverCardTrigger, { href: '#ada' }, () => 'Ada'), h(HoverCardContent, { variant, size }, () => 'x')]))
        expect(errors).toEqual([])
        reset()
      }
    }
  })

  it('DropdownMenu and ContextMenu: density and size on the root do not relax the trigger name rule', async () => {
    const icon = () => h('svg', { 'aria-hidden': 'true' })
    await open(() => h(DropdownMenu, { density: 'comfortable', size: 'lg' }, () => h(DropdownMenuTrigger, null, icon)))
    expect(errors).toHaveLength(1)
    reset()
    await open(() => h(DropdownMenu, { density: 'comfortable', size: 'lg' }, () => h(DropdownMenuTrigger, null, () => 'Actions')))
    expect(errors).toEqual([])
    reset()
    await open(() => h(ContextMenu, { density: 'compact', size: 'sm' }, () => h(ContextMenuTrigger, null, icon)))
    expect(errors).toHaveLength(1)
    reset()
    await open(() => h(ContextMenu, { density: 'compact', size: 'sm' }, () => h(ContextMenuTrigger, null, () => 'Right click')))
    expect(errors).toEqual([])
  })

  it('SimpleTooltip in every variant, size and arrow setting satisfies the contract with a named trigger', async () => {
    for (const variant of tooltipVariantNames) {
      for (const size of tooltipSizes) {
        await open(() => h(SimpleTooltip, { content: 'Hint', variant, size, showArrow: false }, () => h('button', null, 'Target')))
        expect(errors, `${variant}/${size}`).toEqual([])
        reset()
      }
    }
  })
})

describe('Tour keeps its title and target rules in every variant', () => {
  it('throws for a step without a title and passes for a complete step', async () => {
    for (const variant of tourVariantNames) {
      const bad = [{ target: null }] as unknown as TourStep[]
      await open(() => h(Tour, { open: true, teleport: false, steps: bad, variant }))
      expect(errors.length, variant).toBeGreaterThan(0)
      reset()
      await open(() => h(Tour, { open: true, teleport: false, steps: [{ target: null, title: 'Welcome' }], variant }))
      expect(errors, variant).toEqual([])
      reset()
    }
  })
})
