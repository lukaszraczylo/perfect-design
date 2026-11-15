import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent, h, nextTick, ref } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'
import ConfirmHost from './ConfirmHost.vue'
import { useConfirmStore } from './useConfirm'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

const q = <T extends Element = HTMLElement>(s: string) => document.body.querySelector<T>(s)
const content = () => q('[data-slot="alert-dialog-content"]')!

function make(props: Record<string, unknown> = {}, onConfirm: () => unknown = () => {}) {
  const open = ref(true)
  wrapper = mount(
    defineComponent({
      setup: () => () => h(ConfirmDialog, { title: 'Delete 3 invoices?', description: 'This cannot be undone.', open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v), onConfirm, ...props }),
    }),
    { attachTo: document.body },
  )
  return { open }
}

describe('ConfirmDialog tone', () => {
  it('neutral is the default: no icon, no data-tone, default confirm button', async () => {
    make()
    await nextTick()
    expect(content().getAttribute('data-tone')).toBeNull()
    expect(q('[data-slot="confirm-dialog-icon"]')).toBeNull()
    expect(q('[data-slot="confirm-dialog-confirm"]')!.className).toContain('bg-primary')
  })

  it.each([
    ['danger', 'border-destructive/50', 'bg-destructive/10'],
    ['warning', 'border-warning', 'bg-warning/20'],
    ['success', 'border-success/50', 'bg-success/15'],
    ['info', 'border-info/50', 'bg-info/15'],
  ] as const)('%s tints the border and adds a decorative status icon', async (tone, border, bubble) => {
    make({ tone })
    await nextTick()
    expect(content().getAttribute('data-tone')).toBe(tone)
    expect(content().className).toContain(border)
    const icon = q('[data-slot="confirm-dialog-icon"]')!
    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(icon.className).toContain(bubble)
    expect(icon.querySelector('svg')).not.toBeNull()
    // the icon sits inside the header, before the title
    expect(icon.parentElement!.getAttribute('data-slot')).toBe('alert-dialog-header')
    expect(icon.nextElementSibling!.getAttribute('data-slot')).toBe('confirm-dialog-title')
  })

  it('danger makes the confirm button destructive, the other tones do not', async () => {
    make({ tone: 'danger' })
    await nextTick()
    expect(q('[data-slot="confirm-dialog-confirm"]')!.className).toContain('bg-destructive')
    wrapper?.unmount()
    make({ tone: 'warning' })
    await nextTick()
    expect(q('[data-slot="confirm-dialog-confirm"]')!.className).not.toContain('bg-destructive')
  })

  it('destructive still works on its own, with any tone', async () => {
    make({ destructive: true, tone: 'info' })
    await nextTick()
    expect(q('[data-slot="confirm-dialog-confirm"]')!.className).toContain('bg-destructive')
  })

  it('an unknown tone falls back to neutral', async () => {
    make({ tone: 'purple' })
    await nextTick()
    expect(content().getAttribute('data-tone')).toBeNull()
    expect(q('[data-slot="confirm-dialog-icon"]')).toBeNull()
  })
})

describe('ConfirmDialog size and variant', () => {
  it.each([
    ['xs', 'sm:max-w-xs'],
    ['sm', 'sm:max-w-sm'],
    ['md', 'sm:max-w-lg'],
    ['lg', 'sm:max-w-2xl'],
  ] as const)('size %s sets the max width', async (size, cls) => {
    make({ size })
    await nextTick()
    expect(content().className).toContain(cls)
  })

  it('defaults to sm and falls back to sm for an unknown size', async () => {
    make()
    await nextTick()
    expect(content().className).toContain('sm:max-w-sm')
    wrapper?.unmount()
    make({ size: 'giant' })
    await nextTick()
    expect(content().className).toContain('sm:max-w-sm')
  })

  it('centered centres text and buttons and centres the tone icon', async () => {
    make({ variant: 'centered', tone: 'info' })
    await nextTick()
    expect(content().className).toContain('text-center')
    expect(content().className).toContain('justify-center')
    expect(q('[data-slot="confirm-dialog-icon"]')!.className).toContain('self-center')
    expect(q('[data-slot="confirm-dialog-icon"]')!.className).not.toContain('sm:self-start')
  })

  it('default variant keeps the icon start-aligned from sm up, and an unknown variant falls back', async () => {
    make({ tone: 'info', variant: 'wide' })
    await nextTick()
    expect(content().className).not.toContain('justify-center')
    expect(q('[data-slot="confirm-dialog-icon"]')!.className).toContain('sm:self-start')
  })

  it('class prop is merged onto the panel and wins over the size', async () => {
    make({ size: 'lg', class: 'sm:max-w-md mine' })
    await nextTick()
    expect(content().className).toContain('mine')
    expect(content().className).toContain('sm:max-w-md')
    expect(content().className).not.toContain('sm:max-w-2xl')
  })
})

describe('ConfirmDialog contract and behaviour in every variation', () => {
  it.each([
    ['danger', 'xs', 'centered'],
    ['warning', 'sm', 'default'],
    ['success', 'md', 'centered'],
    ['info', 'lg', 'default'],
    ['neutral', 'sm', 'default'],
  ] as const)('%s / %s / %s keeps the alertdialog name, description and Cancel first', async (tone, size, variant) => {
    make({ tone, size, variant })
    await flushPromises()
    const c = content()
    expect(c.getAttribute('role')).toBe('alertdialog')
    expect(document.getElementById(c.getAttribute('aria-labelledby')!)!.textContent).toBe('Delete 3 invoices?')
    expect(document.getElementById(c.getAttribute('aria-describedby')!)!.textContent).toBe('This cannot be undone.')
    expect(q('[data-slot="confirm-dialog-cancel"]')).not.toBeNull()
    expect(document.activeElement).toBe(q('[data-slot="confirm-dialog-cancel"]'))
  })

  it('confirming still runs the handler and closes with a tone set', async () => {
    const onConfirm = vi.fn()
    const { open } = make({ tone: 'danger' }, onConfirm)
    await nextTick()
    q('[data-slot="confirm-dialog-confirm"]')!.click()
    await flushPromises()
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(open.value).toBe(false)
  })
})

describe('useConfirm passes tone, size and variant to the dialog', () => {
  it('ConfirmHost renders the request options', async () => {
    const pinia = createPinia()
    wrapper = mount(ConfirmHost, { attachTo: document.body, global: { plugins: [pinia] } })
    const store = useConfirmStore(pinia)
    const answer = store.confirm({ title: 'Reset settings?', tone: 'warning', size: 'xs', variant: 'centered' })
    await flushPromises()
    expect(content().getAttribute('data-tone')).toBe('warning')
    expect(content().className).toContain('sm:max-w-xs')
    expect(content().className).toContain('text-center')
    expect(q('[data-slot="confirm-dialog-icon"]')).not.toBeNull()
    q('[data-slot="confirm-dialog-confirm"]')!.click()
    await flushPromises()
    await expect(answer).resolves.toBe(true)
  })
})
