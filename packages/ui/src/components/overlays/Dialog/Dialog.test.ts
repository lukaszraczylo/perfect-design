import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ConfigProvider } from '../../layout/ConfigProvider'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  dialogContentVariants,
  dialogSizes,
  dialogVariantNames,
} from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(opts: { open?: boolean; contentProps?: Record<string, unknown> } = {}) {
  const open = ref(opts.open ?? false)
  const Comp = defineComponent({
    setup: () => () =>
      h(Dialog, { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => [
        h(DialogTrigger, null, () => 'Open'),
        h(DialogContent, opts.contentProps ?? {}, () => [
          h(DialogHeader, null, () => [h(DialogTitle, null, () => 'Title'), h(DialogDescription, null, () => 'Desc')]),
          h('p', 'Body'),
          h(DialogFooter, { class: 'custom-footer' }, () => h(DialogClose, null, () => 'Cancel')),
        ]),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { open }
}
const q = (s: string) => document.body.querySelector(s)

describe('Dialog', () => {
  it('is closed by default and renders no content', () => {
    make()
    expect(q('[data-slot="dialog-content"]')).toBeNull()
  })

  it('opens when the trigger is clicked and shows title, description, body', async () => {
    const { open } = make()
    ;(q('[data-slot="dialog-trigger"]') as HTMLElement).click()
    await nextTick()
    expect(open.value).toBe(true)
    expect(q('[data-slot="dialog-content"]')).not.toBeNull()
    expect(q('[data-slot="dialog-title"]')?.textContent).toBe('Title')
    expect(q('[data-slot="dialog-description"]')?.textContent).toBe('Desc')
    expect(q('[data-slot="dialog-overlay"]')).not.toBeNull()
  })

  it('has role=dialog labelled by its title', async () => {
    make({ open: true })
    await nextTick()
    const dlg = q('[role="dialog"]') as HTMLElement
    expect(dlg).not.toBeNull()
    expect(dlg.getAttribute('aria-labelledby')).toBe(q('[data-slot="dialog-title"]')?.id)
  })

  it('closes via the Close part', async () => {
    const { open } = make({ open: true })
    await nextTick()
    ;(q('[data-slot="dialog-close"]') as HTMLElement).click()
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('closes via the built-in X button and it has an accessible name', async () => {
    const { open } = make({ open: true })
    await nextTick()
    const x = q('[data-slot="dialog-close-x"]') as HTMLElement
    expect(x.getAttribute('aria-label')).toBe('Close')
    x.click()
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('names the X button with closeLabel, a ConfigProvider, or the English default', async () => {
    make({ open: true, contentProps: { closeLabel: 'Fermer' } })
    await nextTick()
    expect(q('[data-slot="dialog-close-x"]')!.getAttribute('aria-label')).toBe('Fermer')
    wrapper!.unmount()
    make({ open: true, contentProps: { closeLabel: '  ' } })
    await nextTick()
    expect(q('[data-slot="dialog-close-x"]')!.getAttribute('aria-label')).toBe('Close')
    wrapper!.unmount()
    const open = ref(true)
    wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { labels: { 'dialog.close': 'Schließen' } }, () =>
            h(Dialog, { open: open.value }, () => h(DialogContent, null, () => [h(DialogTitle, null, () => 'Title'), h('p', 'Body')])),
          ),
      }),
      { attachTo: document.body },
    )
    await nextTick()
    expect(q('[data-slot="dialog-close-x"]')!.getAttribute('aria-label')).toBe('Schließen')
  })

  it('closes on Escape', async () => {
    const { open } = make({ open: true })
    await nextTick()
    ;(q('[role="dialog"]') as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('hides the X button with showClose=false', async () => {
    make({ open: true, contentProps: { showClose: false } })
    await nextTick()
    expect(q('[data-slot="dialog-close-x"]')).toBeNull()
  })

  it('applies size presets and falls back to md for unknown sizes', async () => {
    make({ open: true, contentProps: { size: 'xl' } })
    await nextTick()
    expect(q('[data-slot="dialog-content"]')?.className).toContain('sm:max-w-4xl')
  })

  it('unknown size falls back to md', async () => {
    make({ open: true, contentProps: { size: 'nope' } })
    await nextTick()
    expect(q('[data-slot="dialog-content"]')?.className).toContain('sm:max-w-lg')
  })

  it('merges consumer classes on content and footer', async () => {
    make({ open: true, contentProps: { class: 'bg-red-500' } })
    await nextTick()
    const c = q('[data-slot="dialog-content"]') as HTMLElement
    expect(c.className).toContain('bg-red-500')
    expect(c.className).not.toContain('bg-popover')
    expect(q('[data-slot="dialog-footer"]')?.className).toContain('custom-footer')
  })
})

describe('Dialog variations', () => {
  const content = () => q('[data-slot="dialog-content"]') as HTMLElement
  const cls = () => content().className

  describe('sizes', () => {
    it.each([
      ['xs', 'sm:max-w-xs'],
      ['sm', 'sm:max-w-sm'],
      ['md', 'sm:max-w-lg'],
      ['lg', 'sm:max-w-2xl'],
      ['xl', 'sm:max-w-4xl'],
      ['2xl', 'sm:max-w-6xl'],
      ['full', 'sm:max-w-[calc(100vw-2rem)]'],
    ])('size=%s applies %s and only one max-width preset', async (size, expected) => {
      make({ open: true, contentProps: { size } })
      await nextTick()
      expect(cls()).toContain(expected)
      expect(cls().match(/sm:max-w-/g)).toHaveLength(1)
    })

    it('defaults to md', async () => {
      make({ open: true })
      await nextTick()
      expect(cls()).toContain('sm:max-w-lg')
    })
  })

  describe('variants', () => {
    it('default is the centred card (unchanged output)', async () => {
      make({ open: true })
      await nextTick()
      for (const c of ['top-1/2', 'left-1/2', '-translate-x-1/2', 'rounded-lg', 'p-6', 'gap-4', 'bg-popover', 'animate-ds-pop-in']) expect(cls()).toContain(c)
    })

    it('centered-form is roomier with centred text, header and footer', async () => {
      make({ open: true, contentProps: { variant: 'centered-form', size: 'sm' } })
      await nextTick()
      expect(cls()).toContain('p-8')
      expect(cls()).toContain('gap-6')
      expect(cls()).toContain('text-center')
      expect(cls()).toContain('[&_[data-slot=dialog-header]]:text-center')
      expect(cls()).toContain('[&_[data-slot=dialog-footer]]:justify-center')
      expect(cls()).toContain('sm:max-w-sm')
      expect(cls().split(' ')).not.toContain('p-6')
    })

    it('fullscreen covers the viewport and ignores size', async () => {
      make({ open: true, contentProps: { variant: 'fullscreen', size: 'sm' } })
      await nextTick()
      expect(cls()).toContain('inset-0')
      expect(cls()).toContain('h-dvh')
      expect(cls()).toContain('rounded-none')
      expect(cls()).toContain('border-0')
      expect(cls()).toContain('animate-ds-fade-in')
      expect(cls()).not.toContain('sm:max-w-sm')
      expect(cls()).not.toContain('top-1/2')
      expect(cls()).not.toContain('-translate-x-1/2')
    })

    it('drawer-bottom-on-mobile is a bottom sheet on mobile and centred from sm up', async () => {
      make({ open: true, contentProps: { variant: 'drawer-bottom-on-mobile', size: 'lg' } })
      await nextTick()
      for (const c of ['bottom-0', 'inset-x-0', 'rounded-t-xl', 'max-sm:data-[state=open]:animate-ds-slide-in-bottom', 'sm:top-1/2', 'sm:left-1/2', 'sm:-translate-x-1/2', 'sm:rounded-lg', 'sm:max-w-2xl'])
        expect(cls()).toContain(c)
    })

    it('every variant keeps the dialog role, close button and structure', async () => {
      for (const variant of ['default', 'centered-form', 'fullscreen', 'drawer-bottom-on-mobile']) {
        make({ open: true, contentProps: { variant } })
        await nextTick()
        expect(q('[role="dialog"]')).not.toBeNull()
        expect(q('[data-slot="dialog-close-x"]')).not.toBeNull()
        expect(q('[data-slot="dialog-overlay"]')).not.toBeNull()
        wrapper!.unmount()
        wrapper = undefined
        document.body.innerHTML = ''
      }
    })
  })

  describe('customisation', () => {
    it('class override wins over variant classes', async () => {
      make({ open: true, contentProps: { variant: 'centered-form', class: 'p-2 rounded-none' } })
      await nextTick()
      expect(cls()).toContain('p-2')
      expect(cls()).not.toContain('p-8')
      expect(cls()).toContain('rounded-none')
      expect(cls()).not.toContain('rounded-lg')
    })

    it('class override wins over fullscreen geometry', async () => {
      make({ open: true, contentProps: { variant: 'fullscreen', class: 'h-96' } })
      await nextTick()
      expect(cls()).toContain('h-96')
      expect(cls()).not.toContain('h-dvh')
    })

    it('showClose=false works for every variant', async () => {
      make({ open: true, contentProps: { variant: 'fullscreen', showClose: false } })
      await nextTick()
      expect(q('[data-slot="dialog-close-x"]')).toBeNull()
    })
  })

  describe('bad input', () => {
    it('unknown variant falls back to default', async () => {
      make({ open: true, contentProps: { variant: 'wobbly' } })
      await nextTick()
      expect(cls()).toContain('top-1/2')
      expect(cls().split(' ')).toContain('p-6')
    })

    it('unknown size falls back to md for every variant', async () => {
      make({ open: true, contentProps: { variant: 'centered-form', size: 'huge' } })
      await nextTick()
      expect(cls()).toContain('sm:max-w-lg')
    })

    it('prototype keys are not valid variant or size', async () => {
      make({ open: true, contentProps: { variant: 'toString', size: 'constructor' } })
      await nextTick()
      expect(cls()).toContain('top-1/2')
      expect(cls()).toContain('sm:max-w-lg')
    })
  })

  describe('dialogContentVariants', () => {
    it('works standalone with defaults, extra class and unknown values', () => {
      expect(dialogContentVariants()).toContain('sm:max-w-lg')
      expect(dialogContentVariants({ variant: 'fullscreen', size: 'xs' })).not.toContain('sm:max-w-xs')
      expect(dialogContentVariants({ class: 'extra' })).toMatch(/extra$/)
      expect(() => dialogContentVariants({ variant: 'nope' as never, size: 'nope' as never })).not.toThrow()
    })

    it('exports the allowed values', () => {
      expect(dialogVariantNames).toEqual(['default', 'centered-form', 'fullscreen', 'drawer-bottom-on-mobile'])
      expect(dialogSizes).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'])
    })
  })

  describe('responsive and touch behaviour', () => {
    it('scrolls inside itself, contains scroll chaining and is capped to the viewport', async () => {
      make({ open: true })
      await nextTick()
      const cls = (q('[data-slot="dialog-content"]') as HTMLElement).className
      expect(cls).toEqual(expect.stringContaining('overflow-y-auto'))
      expect(cls).toEqual(expect.stringContaining('overscroll-contain'))
      expect(cls).toEqual(expect.stringContaining('max-h-[calc(100dvh-2rem)]'))
      expect(cls).toEqual(expect.stringContaining('max-w-[calc(100%-2rem)]'))
      expect(cls).toEqual(expect.stringContaining('grid-cols-[minmax(0,1fr)]'))
    })

    it('close button uses logical placement and a larger touch target', async () => {
      make({ open: true })
      await nextTick()
      const cls = (q('[data-slot="dialog-close-x"]') as HTMLElement).className
      expect(cls).toEqual(expect.stringContaining('end-4'))
      expect(cls).not.toMatch(/(^| )right-4/)
      expect(cls).toEqual(expect.stringContaining('pointer-coarse:size-10'))
    })

    it('bottom drawer and fullscreen add the safe-area inset', () => {
      expect(dialogContentVariants({ variant: 'drawer-bottom-on-mobile' })).toContain('safe-area-inset-bottom')
      expect(dialogContentVariants({ variant: 'fullscreen' })).toContain('safe-area-inset-bottom')
    })

    it('uses the opaque scrim token with no backdrop blur', async () => {
      make({ open: true })
      await nextTick()
      const cls = (q('[data-slot="dialog-overlay"]') as HTMLElement).className
      expect(cls).toContain('bg-scrim')
      expect(cls).not.toMatch(/blur/)
    })
  })
})

describe('DialogContent attributes', () => {
  it('lands id, data-* and aria-* on the dialog element, so aria-label names it', async () => {
    make({ open: true, contentProps: { id: 'settings', 'data-testid': 'dlg', 'aria-label': 'Settings', 'aria-describedby': 'extra' } })
    await nextTick()
    const el = q('[data-slot="dialog-content"]')!
    expect(el.getAttribute('id')).toBe('settings')
    expect(el.getAttribute('data-testid')).toBe('dlg')
    expect(el.getAttribute('aria-label')).toBe('Settings')
    expect(el.getAttribute('aria-describedby')).toBe('extra')
    expect(el.getAttribute('role')).toBe('dialog')
  })
})
