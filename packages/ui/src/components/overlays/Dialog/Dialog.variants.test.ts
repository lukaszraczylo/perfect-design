import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, dialogContentVariants, dialogSizes, dialogVariantNames, overlayTones } from './index'
import { overlayToneBorder, normalizeOverlayTone } from '../overlayTone'

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
        h(Dialog, { open: true }, () =>
          h(DialogContent, contentProps, () => h(DialogHeader, null, () => [h(DialogTitle, null, () => 'Remove the draft'), h(DialogDescription, null, () => 'Removes the draft for everyone.')])),
        ),
    }),
    { attachTo: document.body },
  )
  await nextTick()
  return document.body.querySelector('[data-slot="dialog-content"]') as HTMLElement
}

describe('Dialog tone', () => {
  it('lists the tones', () => {
    expect(overlayTones).toEqual(['neutral', 'danger', 'warning', 'success', 'info'])
  })

  it('default and tone="neutral": no tone classes and no data-tone (default output unchanged)', async () => {
    const a = await make()
    const defaultClasses = a.className
    expect(a.hasAttribute('data-tone')).toBe(false)
    expect(a.className).not.toMatch(/border-(destructive|warning|success|info)/)
    wrapper!.unmount()
    document.body.innerHTML = ''
    const b = await make({ tone: 'neutral' })
    expect(b.className).toBe(defaultClasses)
    expect(dialogContentVariants()).toBe(dialogContentVariants({ tone: 'neutral' }))
  })

  it.each([
    ['danger', 'border-destructive/50'],
    ['warning', 'border-warning'],
    ['success', 'border-success/50'],
    ['info', 'border-info/50'],
  ] as const)('tone %s sets %s and data-tone', async (tone, border) => {
    const c = await make({ tone })
    expect(c.getAttribute('data-tone')).toBe(tone)
    expect(c.classList.contains(border)).toBe(true)
    expect(c.classList.contains('border')).toBe(true)
  })

  it('tone never changes the accessible structure: role, name and description stay', async () => {
    for (const tone of overlayTones) {
      const c = await make({ tone })
      expect(c.getAttribute('role')).toBe('dialog')
      expect(c.getAttribute('aria-labelledby')).toBe(document.body.querySelector('[data-slot="dialog-title"]')!.id)
      expect(c.getAttribute('aria-describedby')).toBe(document.body.querySelector('[data-slot="dialog-description"]')!.id)
      expect(document.body.querySelector('[data-slot="dialog-close-x"]')!.getAttribute('aria-label')).toBe('Close')
      wrapper!.unmount()
      document.body.innerHTML = ''
    }
  })

  it('unknown tone (also prototype keys) falls back to neutral', async () => {
    for (const bad of ['loud', 'toString', '']) {
      const c = await make({ tone: bad })
      expect(c.hasAttribute('data-tone')).toBe(false)
      expect(c.className).not.toMatch(/border-(destructive|warning|success|info)/)
      wrapper!.unmount()
      document.body.innerHTML = ''
    }
    expect(normalizeOverlayTone('nope')).toBe('neutral')
  })

  it('tone combines with every variant and size, keeping the layout classes', async () => {
    for (const variant of dialogVariantNames) {
      for (const size of dialogSizes) {
        const c = await make({ tone: 'danger', variant, size })
        expect(c.getAttribute('data-tone')).toBe('danger')
        expect(c.classList.contains('border-destructive/50'), `${variant}/${size}`).toBe(true)
        expect(c.classList.contains('fixed')).toBe(true)
        expect(c.classList.contains('bg-popover')).toBe(true)
        wrapper!.unmount()
        document.body.innerHTML = ''
      }
    }
  })

  it('class prop wins over the tone border', async () => {
    const c = await make({ tone: 'danger', class: 'border-primary' })
    expect(c.classList.contains('border-primary')).toBe(true)
    expect(c.classList.contains('border-destructive/50')).toBe(false)
  })

  it('does not leak tone as a DOM attribute and the shared helper is exported', async () => {
    const c = await make({ tone: 'info' })
    expect(c.hasAttribute('tone')).toBe(false)
    expect(Object.keys(overlayToneBorder)).toEqual([...overlayTones])
    expect(overlayToneBorder.neutral).toBe('')
  })

  it('tone does not disturb forced-colors close button or logical positioning', async () => {
    await make({ tone: 'warning' })
    const x = document.body.querySelector('[data-slot="dialog-close-x"]')!
    expect(x.className).toContain('end-4')
    expect(x.className).toContain('forced-colors:opacity-100')
  })
})
