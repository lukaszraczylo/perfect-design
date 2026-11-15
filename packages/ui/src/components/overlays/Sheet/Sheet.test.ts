import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, sheetSides, sheetSizes, sheetVariants } from './index'

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
      h(Sheet, { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => [
        h(SheetTrigger, null, () => 'Open'),
        h(SheetContent, opts.contentProps ?? {}, () => [
          h(SheetHeader, { class: 'custom-header' }, () => [h(SheetTitle, null, () => 'Filters'), h(SheetDescription, null, () => 'Narrow results')]),
          h('p', 'Body'),
          h(SheetFooter, { class: 'custom-footer' }, () => h(SheetClose, null, () => 'Done')),
        ]),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { open }
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const cls = () => q('[data-slot="sheet-content"]')!.className

describe('Sheet', () => {
  it('is closed by default', () => {
    make()
    expect(q('[data-slot="sheet-content"]')).toBeNull()
  })

  it('opens from the trigger and renders all parts', async () => {
    const { open } = make()
    q('[data-slot="sheet-trigger"]')!.click()
    await nextTick()
    expect(open.value).toBe(true)
    expect(q('[data-slot="sheet-title"]')?.textContent).toBe('Filters')
    expect(q('[data-slot="sheet-description"]')?.textContent).toBe('Narrow results')
    expect(q('[data-slot="sheet-overlay"]')).not.toBeNull()
    expect(q('[data-slot="sheet-header"]')).not.toBeNull()
    expect(q('[data-slot="sheet-footer"]')).not.toBeNull()
  })

  it('is a labelled dialog', async () => {
    make({ open: true })
    await nextTick()
    const dlg = q('[role="dialog"]')!
    expect(dlg.getAttribute('aria-labelledby')).toBe(q('[data-slot="sheet-title"]')?.id)
    expect(dlg.getAttribute('aria-describedby')).toBe(q('[data-slot="sheet-description"]')?.id)
  })

  it('closes via Close part, X button (named Close) and Escape', async () => {
    const { open } = make({ open: true })
    await nextTick()
    q('[data-slot="sheet-close"]')!.click()
    await nextTick()
    expect(open.value).toBe(false)

    open.value = true
    await nextTick()
    const x = q('[data-slot="sheet-close-x"]')!
    expect(x.getAttribute('aria-label')).toBe('Close')
    x.click()
    await nextTick()
    expect(open.value).toBe(false)

    open.value = true
    await nextTick()
    q('[role="dialog"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('closes on overlay (outside) pointer down', async () => {
    const { open } = make({ open: true })
    await nextTick()
    await new Promise((r) => setTimeout(r, 5))
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('hides the X with showClose=false', async () => {
    make({ open: true, contentProps: { showClose: false } })
    await nextTick()
    expect(q('[data-slot="sheet-close-x"]')).toBeNull()
  })

  describe('sides and sizes', () => {
    it.each([
      ['right', 'right-0', 'animate-ds-slide-in-right'],
      ['left', 'left-0', 'animate-ds-slide-in-left'],
      ['top', 'top-0', 'animate-ds-slide-in-top'],
      ['bottom', 'bottom-0', 'animate-ds-slide-in-bottom'],
    ])('side=%s positions the panel and picks the matching animation', async (side, pos, anim) => {
      make({ open: true, contentProps: { side } })
      await nextTick()
      expect(q('[data-slot="sheet-content"]')!.getAttribute('data-side')).toBe(side)
      expect(cls()).toContain(pos)
      expect(cls()).toContain(anim)
    })

    it('defaults to the right side', async () => {
      make({ open: true })
      await nextTick()
      expect(q('[data-slot="sheet-content"]')!.getAttribute('data-side')).toBe('right')
      expect(cls()).toContain('sm:max-w-sm')
    })

    it('size presets set width for left/right', async () => {
      make({ open: true, contentProps: { size: 'xl' } })
      await nextTick()
      expect(cls()).toContain('sm:max-w-2xl')
    })

    it('size presets set height for top/bottom', async () => {
      make({ open: true, contentProps: { side: 'bottom', size: 'lg' } })
      await nextTick()
      expect(cls()).toContain('max-h-[75dvh]')
      expect(cls()).not.toContain('sm:max-w')
    })

    it('size=full fills the viewport', async () => {
      make({ open: true, contentProps: { size: 'full' } })
      await nextTick()
      expect(cls()).toContain('sm:max-w-none')
    })

    it('invalid side and size fall back to right / md', async () => {
      make({ open: true, contentProps: { side: 'diagonal', size: 'huge' } })
      await nextTick()
      expect(q('[data-slot="sheet-content"]')!.getAttribute('data-side')).toBe('right')
      expect(cls()).toContain('right-0')
      expect(cls()).toContain('sm:max-w-sm')
    })
  })

  describe('customisation', () => {
    it('merges classes on content, header and footer', async () => {
      make({ open: true, contentProps: { class: 'bg-red-500 p-2' } })
      await nextTick()
      expect(cls()).toContain('bg-red-500')
      expect(cls()).not.toContain('bg-popover')
      expect(cls()).not.toContain('p-6')
      expect(q('[data-slot="sheet-header"]')!.className).toContain('custom-header')
      expect(q('[data-slot="sheet-footer"]')!.className).toContain('custom-footer')
    })

    it('falls through attributes to the content element', async () => {
      make({ open: true, contentProps: { 'data-testid': 'panel' } })
      await nextTick()
      expect(q('[data-slot="sheet-content"]')!.getAttribute('data-testid')).toBe('panel')
    })
  })

  describe('edge cases', () => {
    it('rapid toggling keeps a single panel', async () => {
      const { open } = make()
      for (let i = 0; i < 4; i++) {
        open.value = !open.value
        await nextTick()
      }
      expect(document.body.querySelectorAll('[data-slot="sheet-content"]').length).toBeLessThanOrEqual(1)
    })

    it('unmounting while open removes the portalled content', async () => {
      make({ open: true })
      await nextTick()
      expect(q('[data-slot="sheet-content"]')).not.toBeNull()
      wrapper!.unmount()
      wrapper = undefined
      expect(q('[data-slot="sheet-content"]')).toBeNull()
      expect(q('[data-slot="sheet-overlay"]')).toBeNull()
    })
  })
})

describe('Sheet variations', () => {
  describe('inset (floating) variant', () => {
    it.each([
      ['right', 'right-2', 'inset-y-2'],
      ['left', 'left-2', 'inset-y-2'],
      ['top', 'top-2', 'inset-x-2'],
      ['bottom', 'bottom-2', 'inset-x-2'],
    ])('side=%s keeps a margin and is rounded', async (side, edge, axis) => {
      make({ open: true, contentProps: { side, inset: true } })
      await nextTick()
      const c = q('[data-slot="sheet-content"]')!
      expect(c.className).toContain(edge)
      expect(c.className).toContain(axis)
      expect(c.className).toContain('rounded-xl')
      expect(c.hasAttribute('data-inset')).toBe(true)
      expect(c.className).not.toMatch(/(^| )(right|left|top|bottom)-0( |$)/)
    })

    it('inset keeps the slide animation and size preset', async () => {
      make({ open: true, contentProps: { inset: true, size: 'lg' } })
      await nextTick()
      expect(cls()).toContain('animate-ds-slide-in-right')
      expect(cls()).toContain('sm:max-w-lg')
    })

    it('docked sheet has no data-inset and is not rounded', async () => {
      make({ open: true })
      await nextTick()
      expect(q('[data-slot="sheet-content"]')!.hasAttribute('data-inset')).toBe(false)
      expect(cls()).not.toContain('rounded-xl')
      expect(cls()).toContain('border-l')
    })

    it('class prop still wins over inset classes', async () => {
      make({ open: true, contentProps: { inset: true, class: 'rounded-none inset-y-4' } })
      await nextTick()
      expect(cls()).toContain('rounded-none')
      expect(cls()).not.toContain('rounded-xl')
      expect(cls()).toContain('inset-y-4')
      expect(cls()).not.toContain('inset-y-2')
    })
  })

  describe('sizes', () => {
    it.each([
      ['sm', 'sm:max-w-xs'],
      ['md', 'sm:max-w-sm'],
      ['lg', 'sm:max-w-lg'],
      ['xl', 'sm:max-w-2xl'],
      ['full', 'sm:max-w-none'],
    ])('size=%s on the right sets the width preset %s', async (size, expected) => {
      make({ open: true, contentProps: { size } })
      await nextTick()
      expect(cls()).toContain(expected)
    })

    it.each([
      ['sm', 'max-h-[30dvh]'],
      ['md', 'max-h-[50dvh]'],
      ['lg', 'max-h-[75dvh]'],
      ['xl', 'max-h-[90dvh]'],
      ['full', 'h-dvh'],
    ])('size=%s on top/bottom sets the height preset %s', async (size, expected) => {
      make({ open: true, contentProps: { side: 'top', size } })
      await nextTick()
      expect(cls()).toContain(expected)
    })
  })

  describe('sheetVariants', () => {
    it('is usable standalone and defaults to right / md / docked', () => {
      const out = sheetVariants()
      expect(out).toContain('right-0')
      expect(out).toContain('sm:max-w-sm')
      expect(out).not.toContain('rounded-xl')
    })

    it('appends a trailing class and ignores unknown values without throwing', () => {
      expect(sheetVariants({ class: 'extra' })).toMatch(/extra$/)
      expect(() => sheetVariants({ side: 'nope' as never, size: 'nope' as never })).not.toThrow()
    })

    it('exports the allowed values', () => {
      expect(sheetSides).toEqual(['top', 'right', 'bottom', 'left'])
      expect(sheetSizes).toEqual(['sm', 'md', 'lg', 'xl', 'full'])
    })
  })

  describe('title and description parts', () => {
    it('merge a class and forward attributes', async () => {
      const Comp = defineComponent({
        setup: () => () =>
          h(Sheet, { open: true }, () =>
            h(SheetContent, null, () => [h(SheetTitle, { class: 'text-xl custom-title', 'data-testid': 't' }, () => 'T'), h(SheetDescription, { class: 'custom-desc', 'data-testid': 'd' }, () => 'D')]),
          ),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      await nextTick()
      expect(q('[data-slot="sheet-title"]')!.className).toContain('custom-title')
      expect(q('[data-slot="sheet-title"]')!.className).not.toContain('text-lg')
      expect(q('[data-slot="sheet-title"]')!.getAttribute('data-testid')).toBe('t')
      expect(q('[data-slot="sheet-description"]')!.className).toContain('custom-desc')
      expect(q('[data-slot="sheet-description"]')!.getAttribute('data-testid')).toBe('d')
    })
  })

  describe('bad input', () => {
    it('prototype keys are not treated as valid side/size', async () => {
      make({ open: true, contentProps: { side: 'toString', size: 'constructor' } })
      await nextTick()
      expect(q('[data-slot="sheet-content"]')!.getAttribute('data-side')).toBe('right')
      expect(cls()).toContain('sm:max-w-sm')
    })

    it('inset=false behaves like the default', async () => {
      make({ open: true, contentProps: { inset: false } })
      await nextTick()
      expect(cls()).toContain('right-0')
    })
  })
})
