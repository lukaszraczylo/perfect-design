import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

const q = <T extends Element = HTMLElement>(s: string) => document.body.querySelector<T>(s)
const click = async (s: string) => {
  q(s)!.click()
  await flushPromises()
}

interface Opts {
  open?: boolean
  props?: Record<string, unknown>
  onConfirm?: () => unknown
  slot?: string
}
function make(opts: Opts = {}) {
  const open = ref(opts.open ?? true)
  const onCancel = vi.fn()
  const onError = vi.fn()
  const Comp = defineComponent({
    setup: () => () =>
      h(
        ConfirmDialog,
        {
          title: 'Delete item?',
          description: 'This cannot be undone.',
          open: open.value,
          'onUpdate:open': (v: boolean) => (open.value = v),
          onConfirm: opts.onConfirm,
          onCancel,
          onError,
          ...opts.props,
        },
        opts.slot ? () => h('div', { id: 'extra' }, opts.slot) : undefined,
      ),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { open, onCancel, onError }
}

describe('ConfirmDialog', () => {
  describe('good path', () => {
    it('renders nothing while closed', () => {
      make({ open: false })
      expect(q('[data-slot="alert-dialog-content"]')).toBeNull()
    })

    it('renders title, description and default labels without a close X', async () => {
      make()
      await nextTick()
      const content = q('[data-slot="alert-dialog-content"]')!
      expect(content.getAttribute('role')).toBe('alertdialog')
      expect(q('[data-slot="confirm-dialog-title"]')!.textContent).toBe('Delete item?')
      expect(q('[data-slot="confirm-dialog-description"]')!.textContent).toBe('This cannot be undone.')
      expect(q('[data-slot="confirm-dialog-confirm"]')!.textContent!.trim()).toBe('Confirm')
      expect(q('[data-slot="confirm-dialog-cancel"]')!.textContent!.trim()).toBe('Cancel')
      expect(q('[data-slot="dialog-close-x"], [data-slot="alert-dialog-close-x"]')).toBeNull()
    })

    it('custom labels and default slot', async () => {
      make({ props: { confirmLabel: 'Delete', cancelLabel: 'Keep' }, slot: 'extra body' })
      await nextTick()
      expect(q('[data-slot="confirm-dialog-confirm"]')!.textContent!.trim()).toBe('Delete')
      expect(q('[data-slot="confirm-dialog-cancel"]')!.textContent!.trim()).toBe('Keep')
      expect(q('#extra')!.textContent).toBe('extra body')
    })

    it('confirm without a handler closes the dialog', async () => {
      const { open } = make()
      await nextTick()
      await click('[data-slot="confirm-dialog-confirm"]')
      expect(open.value).toBe(false)
    })

    it('confirm runs the sync handler then closes', async () => {
      const onConfirm = vi.fn()
      const { open, onCancel } = make({ onConfirm })
      await nextTick()
      await click('[data-slot="confirm-dialog-confirm"]')
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(open.value).toBe(false)
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('cancel closes and emits cancel without running confirm', async () => {
      const onConfirm = vi.fn()
      const { open, onCancel } = make({ onConfirm })
      await nextTick()
      await click('[data-slot="confirm-dialog-cancel"]')
      expect(open.value).toBe(false)
      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('Escape cancels', async () => {
      const { open, onCancel } = make()
      await nextTick()
      q('[data-slot="alert-dialog-content"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flushPromises()
      expect(open.value).toBe(false)
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('works uncontrolled-style via v-model:open (no parent handler)', async () => {
      wrapper = mount(ConfirmDialog, { props: { title: 'T', open: true }, attachTo: document.body })
      await nextTick()
      expect(q('[data-slot="alert-dialog-content"]')).not.toBeNull()
    })
  })

  describe('async confirm', () => {
    it('stays open and busy until the promise resolves, then closes', async () => {
      let resolve!: () => void
      const onConfirm = vi.fn(() => new Promise<void>((r) => (resolve = r)))
      const { open } = make({ onConfirm })
      await nextTick()
      await click('[data-slot="confirm-dialog-confirm"]')
      expect(open.value).toBe(true)
      expect(q('[data-slot="confirm-dialog-confirm"]')!.getAttribute('aria-busy')).toBe('true')
      expect((q('[data-slot="confirm-dialog-cancel"]') as HTMLButtonElement).disabled).toBe(true)
      resolve()
      await flushPromises()
      expect(open.value).toBe(false)
    })

    it('double click while pending calls the handler once', async () => {
      const onConfirm = vi.fn(() => new Promise<void>(() => {}))
      make({ onConfirm })
      await nextTick()
      const btn = q('[data-slot="confirm-dialog-confirm"]')!
      btn.click()
      btn.click()
      btn.click()
      await flushPromises()
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('failing handler keeps the dialog open, shows the message and emits error', async () => {
      const boom = new Error('Server said no')
      const { open, onError } = make({ onConfirm: () => Promise.reject(boom) })
      await nextTick()
      await click('[data-slot="confirm-dialog-confirm"]')
      expect(open.value).toBe(true)
      expect(onError).toHaveBeenCalledWith(boom)
      expect(q('[data-slot="confirm-dialog-error"]')!.textContent).toBe('Server said no')
      expect(q('[data-slot="confirm-dialog-error"]')!.getAttribute('role')).toBe('alert')
      expect(q('[data-slot="confirm-dialog-confirm"]')!.getAttribute('aria-busy')).toBeNull()
    })

    it('uses a generic message for non-Error / empty-message rejections', async () => {
      make({ onConfirm: () => Promise.reject('nope') })
      await nextTick()
      await click('[data-slot="confirm-dialog-confirm"]')
      expect(q('[data-slot="confirm-dialog-error"]')!.textContent).toBe('Something went wrong. Please try again.')
    })

    it('a sync throw is handled the same way', async () => {
      const { onError } = make({
        onConfirm: () => {
          throw new Error('sync fail')
        },
      })
      await nextTick()
      await click('[data-slot="confirm-dialog-confirm"]')
      expect(onError).toHaveBeenCalledTimes(1)
      expect(q('[data-slot="confirm-dialog-error"]')!.textContent).toBe('sync fail')
    })

    it('retry after a failure clears the error and can then succeed', async () => {
      const onConfirm = vi.fn().mockRejectedValueOnce(new Error('first')).mockResolvedValueOnce(undefined)
      const { open } = make({ onConfirm })
      await nextTick()
      await click('[data-slot="confirm-dialog-confirm"]')
      expect(q('[data-slot="confirm-dialog-error"]')).not.toBeNull()
      await click('[data-slot="confirm-dialog-confirm"]')
      expect(onConfirm).toHaveBeenCalledTimes(2)
      expect(open.value).toBe(false)
    })

    it('cannot be cancelled or dismissed while the handler is pending', async () => {
      const { open, onCancel } = make({ onConfirm: () => new Promise<void>(() => {}) })
      await nextTick()
      await click('[data-slot="confirm-dialog-confirm"]')
      q('[data-slot="confirm-dialog-cancel"]')!.click()
      q('[data-slot="alert-dialog-content"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flushPromises()
      expect(open.value).toBe(true)
      expect(onCancel).not.toHaveBeenCalled()
    })
  })

  describe('loading prop', () => {
    it('blocks confirm and cancel and shows busy state', async () => {
      const onConfirm = vi.fn()
      const { open, onCancel } = make({ onConfirm, props: { loading: true } })
      await nextTick()
      expect(q('[data-slot="confirm-dialog-confirm"]')!.getAttribute('aria-busy')).toBe('true')
      q('[data-slot="confirm-dialog-confirm"]')!.click()
      q('[data-slot="confirm-dialog-cancel"]')!.click()
      await flushPromises()
      expect(onConfirm).not.toHaveBeenCalled()
      expect(onCancel).not.toHaveBeenCalled()
      expect(open.value).toBe(true)
    })
  })

  describe('customisation', () => {
    it('destructive styles the confirm button', async () => {
      make({ props: { destructive: true } })
      await nextTick()
      expect(q('[data-slot="confirm-dialog-confirm"]')!.className).toContain('bg-destructive')
    })

    it('non-destructive uses the primary style', async () => {
      make()
      await nextTick()
      expect(q('[data-slot="confirm-dialog-confirm"]')!.className).toContain('bg-primary')
    })

    it('merges class on the dialog content', async () => {
      make({ props: { class: 'max-w-xs mine' } })
      await nextTick()
      const c = q('[data-slot="alert-dialog-content"]')!
      expect(c.className).toContain('mine')
    })
  })

  describe('bad path / edge cases', () => {
    it('empty or blank title falls back to a generic question', async () => {
      make({ props: { title: '   ' } })
      await nextTick()
      expect(q('[data-slot="confirm-dialog-title"]')!.textContent).toBe('Are you sure?')
    })

    it('without a description an sr-only description keeps the dialog described (no warnings)', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      make({ props: { description: undefined } })
      await nextTick()
      expect(q('[data-slot="confirm-dialog-description"]')).toBeNull()
      expect(q('[data-slot="alert-dialog-description"].sr-only')).not.toBeNull()
      expect(warn).not.toHaveBeenCalled()
    })

    it('very long unicode title and description', async () => {
      make({ props: { title: 'ü'.repeat(3000) + ' 🗑', description: 'مرحبا 日本語 ' + 'x'.repeat(3000) } })
      await nextTick()
      expect(q('[data-slot="confirm-dialog-title"]')!.textContent).toContain('🗑')
      expect(q('[data-slot="confirm-dialog-description"]')!.textContent).toContain('مرحبا')
    })

    it('rapid open/close toggles do not leave stale pending state', async () => {
      const { open } = make({ open: false })
      for (let i = 0; i < 5; i++) {
        open.value = true
        await nextTick()
        open.value = false
        await nextTick()
      }
      open.value = true
      await nextTick()
      expect((q('[data-slot="confirm-dialog-confirm"]') as HTMLButtonElement).disabled).toBe(false)
    })

    it('opening via reka update:open(true) keeps it open', async () => {
      const { open } = make({ open: false })
      open.value = true
      await nextTick()
      expect(q('[data-slot="alert-dialog-content"]')).not.toBeNull()
    })

    it('clears a previous error when cancelled and reopened', async () => {
      const { open } = make({ onConfirm: () => Promise.reject(new Error('x')) })
      await nextTick()
      await click('[data-slot="confirm-dialog-confirm"]')
      await click('[data-slot="confirm-dialog-cancel"]')
      expect(open.value).toBe(false)
      open.value = true
      await nextTick()
      expect(q('[data-slot="confirm-dialog-error"]')).toBeNull()
    })
  })
})
