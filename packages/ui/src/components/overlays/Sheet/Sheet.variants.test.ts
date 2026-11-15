import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { overlayTones } from '../overlayTone'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, sheetSides, sheetSizes, sheetVariantNames, sheetVariants } from './index'
import { cn } from '../../../lib/cn'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

async function make(contentProps: Record<string, unknown> = {}) {
  wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(Sheet, { open: true }, () =>
          h(SheetContent, contentProps, () => h(SheetHeader, null, () => [h(SheetTitle, null, () => 'Filters'), h(SheetDescription, null, () => 'Narrow the results')])),
        ),
    }),
    { attachTo: document.body },
  )
  await nextTick()
  return document.body.querySelector('[data-slot="sheet-content"]') as HTMLElement
}
const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean))

describe('Sheet variant (padding)', () => {
  it('lists the variants', () => expect(sheetVariantNames).toEqual(['default', 'flush']))

  it('default keeps the padded panel: p-6, gap-4, no data-variant (default output unchanged)', async () => {
    const c = await make()
    expect(c.classList.contains('p-6')).toBe(true)
    expect(c.classList.contains('gap-4')).toBe(true)
    expect(c.hasAttribute('data-variant')).toBe(false)
    expect(set(sheetVariants())).toEqual(set(sheetVariants({ variant: 'default', tone: 'neutral' })))
    expect(sheetVariants()).not.toContain('p-0')
  })

  it('flush removes the padding and gap and sets data-variant, keeping the docked-edge safe-area padding', async () => {
    const c = await make({ variant: 'flush' })
    expect(c.getAttribute('data-variant')).toBe('flush')
    expect(c.classList.contains('p-0')).toBe(true)
    expect(c.classList.contains('gap-0')).toBe(true)
    expect(c.classList.contains('p-6')).toBe(false)
    expect(c.classList.contains('gap-4')).toBe(false)
    expect(c.className).toContain('pr-[max(1.5rem,env(safe-area-inset-right))]')
  })

  it.each(sheetSides)('flush on side %s keeps the safe-area padding of its edge', async (side) => {
    const c = await make({ variant: 'flush', side })
    const safe = { right: 'pr-[max', left: 'pl-[max', bottom: 'pb-[max', top: '' }[side]
    expect(c.classList.contains('p-0')).toBe(true)
    if (safe) expect(c.className).toContain(safe)
  })

  it('unknown variant falls back to default', async () => {
    const c = await make({ variant: 'bleed' })
    expect(c.classList.contains('p-6')).toBe(true)
    expect(c.hasAttribute('data-variant')).toBe(false)
  })

  it('flush keeps the close button, its name and the dialog semantics', async () => {
    const c = await make({ variant: 'flush', tone: 'danger' })
    expect(c.getAttribute('role')).toBe('dialog')
    const x = document.body.querySelector('[data-slot="sheet-close-x"]')!
    expect(x.getAttribute('aria-label')).toBe('Close')
    expect(x.className).toContain('end-4')
  })

  it('flush with inset and every size keeps one size preset', async () => {
    for (const size of sheetSizes) {
      const c = await make({ variant: 'flush', inset: true, size })
      expect(c.hasAttribute('data-inset')).toBe(true)
      expect(c.classList.contains('p-0')).toBe(true)
      expect(c.classList.contains('rounded-xl')).toBe(true)
      wrapper!.unmount()
      document.body.innerHTML = ''
    }
  })

  it('class prop wins over flush', async () => {
    const c = await make({ variant: 'flush', class: 'p-2' })
    expect(c.classList.contains('p-2')).toBe(true)
    expect(c.classList.contains('p-0')).toBe(false)
  })
})

describe('Sheet tone', () => {
  it('neutral and default add no tone classes or data-tone', async () => {
    const c = await make()
    expect(c.hasAttribute('data-tone')).toBe(false)
    expect(c.className).not.toMatch(/border-(destructive|warning|success|info)/)
    wrapper!.unmount()
    document.body.innerHTML = ''
    const d = await make({ tone: 'neutral' })
    expect(d.className).toBe(c.className)
  })

  it.each([
    ['danger', 'border-destructive/50'],
    ['warning', 'border-warning'],
    ['success', 'border-success/50'],
    ['info', 'border-info/50'],
  ] as const)('tone %s sets %s and data-tone', async (tone, cls) => {
    const c = await make({ tone })
    expect(c.getAttribute('data-tone')).toBe(tone)
    expect(c.classList.contains(cls)).toBe(true)
    expect(cn(sheetVariants({ tone }))).toContain(cls)
  })

  it('unknown tone falls back to neutral', async () => {
    const c = await make({ tone: 'loud' })
    expect(c.hasAttribute('data-tone')).toBe(false)
  })

  it('every side and tone combination keeps the edge border and the tone colour', async () => {
    for (const side of sheetSides) {
      for (const tone of overlayTones) {
        const c = await make({ side, tone })
        expect(c.getAttribute('data-side')).toBe(side)
        expect(c.className).toMatch(/\bborder-(l|r|t|b)\b/)
        if (tone !== 'neutral') expect(c.getAttribute('data-tone')).toBe(tone)
        wrapper!.unmount()
        document.body.innerHTML = ''
      }
    }
  })

  it('tone and variant do not leak as DOM attributes and the class prop wins', async () => {
    const c = await make({ tone: 'info', variant: 'flush', class: 'border-primary' })
    expect(c.hasAttribute('tone')).toBe(false)
    expect(c.hasAttribute('variant')).toBe(false)
    expect(c.classList.contains('border-primary')).toBe(true)
    expect(c.classList.contains('border-info/50')).toBe(false)
  })
})
