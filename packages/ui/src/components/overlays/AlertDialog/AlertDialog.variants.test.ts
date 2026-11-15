import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { overlayTones } from '../overlayTone'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  alertDialogContentVariants,
  alertDialogSizes,
  alertDialogVariantNames,
} from './index'
import { buttonVariants } from '../../primitives/Button'
import { useAlertDialogTone } from './context'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

async function make(contentProps: Record<string, unknown> = {}, actionProps: Record<string, unknown> = {}) {
  wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(AlertDialog, { open: true }, () =>
          h(AlertDialogContent, contentProps, () => [
            h(AlertDialogHeader, null, () => [h(AlertDialogTitle, null, () => 'Delete the project?'), h(AlertDialogDescription, null, () => 'This removes it for everyone.')]),
            h(AlertDialogFooter, null, () => [h(AlertDialogCancel, null, () => 'Keep'), h(AlertDialogAction, actionProps, () => 'Delete')]),
          ]),
        ),
    }),
    { attachTo: document.body },
  )
  await nextTick()
  return document.body.querySelector('[data-slot="alert-dialog-content"]') as HTMLElement
}
const action = () => document.body.querySelector('[data-slot="alert-dialog-action"]') as HTMLElement
const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean))

describe('AlertDialog size', () => {
  it('lists the sizes', () => expect(alertDialogSizes).toEqual(['xs', 'sm', 'md', 'lg']))

  it('default is md: sm:max-w-lg and the original panel classes, no data attributes', async () => {
    const c = await make()
    for (const cls of ['fixed', 'top-1/2', 'left-1/2', 'z-(--z-modal)', 'max-h-[calc(100dvh-2rem)]', 'w-full', 'max-w-[calc(100%-2rem)]', 'rounded-lg', 'border', 'bg-popover', 'p-6', 'shadow-lg', 'sm:max-w-lg'])
      expect(c.classList.contains(cls), cls).toBe(true)
    expect(c.hasAttribute('data-tone')).toBe(false)
    expect(set(alertDialogContentVariants())).toEqual(set(alertDialogContentVariants({ size: 'md', variant: 'default', tone: 'neutral' })))
  })

  it.each([
    ['xs', 'sm:max-w-xs'],
    ['sm', 'sm:max-w-sm'],
    ['md', 'sm:max-w-lg'],
    ['lg', 'sm:max-w-2xl'],
  ] as const)('size %s sets %s', async (size, cls) => {
    const c = await make({ size })
    expect(c.classList.contains(cls)).toBe(true)
    expect(c.className.match(/sm:max-w-\S+/g)).toHaveLength(1)
  })

  it('unknown size falls back to md', async () => {
    const c = await make({ size: 'huge' })
    expect(c.classList.contains('sm:max-w-lg')).toBe(true)
  })
})

describe('AlertDialog variant', () => {
  it('lists the variants', () => expect(alertDialogVariantNames).toEqual(['default', 'centered']))

  it('centered centres the text and the footer buttons; default does not', async () => {
    const a = await make()
    expect(a.classList.contains('text-center')).toBe(false)
    wrapper!.unmount()
    document.body.innerHTML = ''
    const c = await make({ variant: 'centered' })
    expect(c.classList.contains('text-center')).toBe(true)
    expect(c.className).toContain('[&_[data-slot=alert-dialog-header]]:text-center')
    expect(c.className).toContain('sm:[&_[data-slot=alert-dialog-header]]:text-center')
    expect(c.className).toContain('[&_[data-slot=alert-dialog-footer]]:justify-center')
    expect(c.className).toContain('sm:[&_[data-slot=alert-dialog-footer]]:justify-center')
  })

  it('unknown variant falls back to default', async () => {
    const c = await make({ variant: 'wide' })
    expect(c.classList.contains('text-center')).toBe(false)
  })
})

describe('AlertDialog tone', () => {
  it.each([
    ['warning', 'border-warning'],
    ['success', 'border-success/50'],
    ['info', 'border-info/50'],
    ['danger', 'border-destructive/50'],
  ] as const)('tone %s sets the border and data-tone', async (tone, border) => {
    const c = await make({ tone })
    expect(c.getAttribute('data-tone')).toBe(tone)
    expect(c.classList.contains(border)).toBe(true)
  })

  it('only danger makes the action destructive by default', async () => {
    for (const tone of overlayTones) {
      await make({ tone })
      const destructive = buttonVariants({ variant: 'destructive' }).split(' ')[0]
      const primary = buttonVariants({ variant: 'default' })
      const isDanger = tone === 'danger'
      expect(action().classList.contains('bg-destructive'), tone).toBe(isDanger)
      expect(action().classList.contains('bg-primary'), tone).toBe(!isDanger)
      expect(destructive.length).toBeGreaterThan(0)
      expect(primary).toContain('bg-primary')
      wrapper!.unmount()
      document.body.innerHTML = ''
    }
  })

  it('an explicit action variant wins in a danger dialog', async () => {
    await make({ tone: 'danger' }, { variant: 'outline' })
    expect(action().classList.contains('bg-destructive')).toBe(false)
    expect(action().className).toContain('border')
  })

  it('unknown tone falls back to neutral (no border, no destructive action)', async () => {
    const c = await make({ tone: 'critical' })
    expect(c.hasAttribute('data-tone')).toBe(false)
    expect(action().classList.contains('bg-primary')).toBe(true)
  })

  it('a danger dialog keeps the alertdialog semantics and Cancel stays the safe, outlined action', async () => {
    const c = await make({ tone: 'danger', variant: 'centered', size: 'xs' })
    expect(c.getAttribute('role')).toBe('alertdialog')
    expect(c.getAttribute('aria-labelledby')).toBe(document.body.querySelector('[data-slot="alert-dialog-title"]')!.id)
    expect(c.getAttribute('aria-describedby')).toBe(document.body.querySelector('[data-slot="alert-dialog-description"]')!.id)
    expect(document.body.querySelector('[data-slot="alert-dialog-cancel"]')!.className).toContain('border')
    expect(document.body.querySelector('[data-slot="alert-dialog-close-x"]')).toBeNull()
  })

  it('cross product of size, variant and tone keeps one max-width class and the surface', async () => {
    for (const size of alertDialogSizes) {
      for (const variant of alertDialogVariantNames) {
        const c = await make({ size, variant, tone: 'warning' })
        expect(c.className.match(/sm:max-w-\S+/g)).toHaveLength(1)
        expect(c.classList.contains('border-warning')).toBe(true)
        expect(c.classList.contains('bg-popover')).toBe(true)
        wrapper!.unmount()
        document.body.innerHTML = ''
      }
    }
  })

  it('class prop wins; props do not leak as DOM attributes', async () => {
    const c = await make({ size: 'lg', tone: 'danger', variant: 'centered', class: 'sm:max-w-md border-primary' })
    expect(c.classList.contains('sm:max-w-md')).toBe(true)
    expect(c.classList.contains('sm:max-w-2xl')).toBe(false)
    expect(c.classList.contains('border-primary')).toBe(true)
    expect(c.classList.contains('border-destructive/50')).toBe(false)
    for (const attr of ['size', 'variant', 'tone']) expect(c.hasAttribute(attr)).toBe(false)
  })

  it('the tone lookup falls back to neutral outside an AlertDialogContent', () => {
    let tone = ''
    wrapper = mount(
      defineComponent({
        setup() {
          tone = useAlertDialogTone()
          return () => h('div')
        },
      }),
    )
    expect(tone).toBe('neutral')
  })
})
