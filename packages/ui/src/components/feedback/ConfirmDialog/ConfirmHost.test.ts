import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ConfirmHost from './ConfirmHost.vue'
import { useConfirm, useConfirmStore } from './useConfirm'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make() {
  const pinia = createPinia()
  setActivePinia(pinia)
  wrapper = mount(ConfirmHost, { global: { plugins: [pinia] }, attachTo: document.body })
  return { ...useConfirm(), store: useConfirmStore() }
}
const q = (s: string) => document.body.querySelector<HTMLElement>(s)
const click = async (s: string) => {
  q(s)!.click()
  await flushPromises()
}

describe('ConfirmHost', () => {
  it('renders nothing until a confirmation is requested', () => {
    make()
    expect(q('[data-slot="alert-dialog-content"]')).toBeNull()
  })

  it('shows the request and resolves true when confirmed', async () => {
    const { confirm, store } = make()
    const p = confirm({ title: 'Delete?', description: 'Gone forever', confirmLabel: 'Delete', cancelLabel: 'Keep', destructive: true })
    await nextTick()
    expect(q('[data-slot="confirm-dialog-title"]')!.textContent).toBe('Delete?')
    expect(q('[data-slot="confirm-dialog-description"]')!.textContent).toBe('Gone forever')
    expect(q('[data-slot="confirm-dialog-confirm"]')!.textContent!.trim()).toBe('Delete')
    expect(q('[data-slot="confirm-dialog-cancel"]')!.textContent!.trim()).toBe('Keep')
    expect(q('[data-slot="confirm-dialog-confirm"]')!.className).toContain('bg-destructive')
    await click('[data-slot="confirm-dialog-confirm"]')
    await expect(p).resolves.toBe(true)
    expect(store.current).toBeNull()
  })

  it('resolves false on cancel', async () => {
    const { confirm } = make()
    const p = confirm({ title: 'x' })
    await nextTick()
    await click('[data-slot="confirm-dialog-cancel"]')
    await expect(p).resolves.toBe(false)
  })

  it('resolves false on Escape', async () => {
    const { confirm } = make()
    const p = confirm({ title: 'x' })
    await nextTick()
    q('[data-slot="alert-dialog-content"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    await expect(p).resolves.toBe(false)
  })

  it('queued requests are answered one at a time with the right outcome each', async () => {
    const { confirm } = make()
    const a = confirm({ title: 'First' })
    const b = confirm({ title: 'Second' })
    await nextTick()
    expect(q('[data-slot="confirm-dialog-title"]')!.textContent).toBe('First')
    await click('[data-slot="confirm-dialog-confirm"]')
    await expect(a).resolves.toBe(true)
    await nextTick()
    // the confirmed first request must not cancel the second one
    expect(q('[data-slot="confirm-dialog-title"]')!.textContent).toBe('Second')
    await click('[data-slot="confirm-dialog-cancel"]')
    await expect(b).resolves.toBe(false)
  })

  it('a fresh request after closing works again (state does not leak)', async () => {
    const { confirm } = make()
    const a = confirm({ title: 'one' })
    await nextTick()
    await click('[data-slot="confirm-dialog-confirm"]')
    await a
    const b = confirm({ title: 'two' })
    await nextTick()
    expect(q('[data-slot="confirm-dialog-title"]')!.textContent).toBe('two')
    await click('[data-slot="confirm-dialog-cancel"]')
    await expect(b).resolves.toBe(false)
  })

  it('blank title falls back to a generic question', async () => {
    const { confirm, store } = make()
    void confirm({ title: '' })
    await nextTick()
    expect(q('[data-slot="confirm-dialog-title"]')!.textContent).toBe('Are you sure?')
    store.clear()
  })

  it('store.clear() closes the dialog and resolves everything false', async () => {
    const { confirm, store } = make()
    const p = confirm({ title: 'x' })
    await nextTick()
    store.clear()
    await expect(p).resolves.toBe(false)
  })
})
