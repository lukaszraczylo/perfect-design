import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useToastStore } from '../../../stores/toast'
import Toaster from './Toaster.vue'

let w: VueWrapper | undefined
function make(props: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  w = mount(Toaster, { props, global: { plugins: [pinia] }, attachTo: document.body })
  return useToastStore()
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  w?.unmount()
  w = undefined
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('Toaster layout and appearance', () => {
  it('defaults leave the region and the toasts as before', async () => {
    const s = make()
    s.push({ title: 'Saved', variant: 'success' })
    await nextTick()
    const root = w!.find('[data-slot="toaster"]')
    expect(root.attributes('data-layout')).toBeUndefined()
    expect(root.attributes('data-appearance')).toBeUndefined()
    const toast = w!.find('[data-slot="toast"]')
    expect(toast.attributes('data-layout')).toBeUndefined()
    expect(toast.classes()).toContain('bg-popover')
  })

  it('passes compact and solid to every toast and marks the region', async () => {
    const s = make({ layout: 'compact', appearance: 'solid' })
    s.push({ title: 'Saved', variant: 'success' })
    s.push({ title: 'Failed', variant: 'danger' })
    await nextTick()
    const root = w!.find('[data-slot="toaster"]')
    expect(root.attributes('data-layout')).toBe('compact')
    expect(root.attributes('data-appearance')).toBe('solid')
    const toasts = w!.findAll('[data-slot="toast"]')
    expect(toasts).toHaveLength(2)
    for (const t of toasts) {
      expect(t.attributes('data-layout')).toBe('compact')
      expect(t.classes()).toEqual(expect.arrayContaining(['p-3', 'text-xs']))
    }
    expect(toasts.map((t) => t.classes().find((c) => c === 'bg-success' || c === 'bg-destructive')).sort()).toEqual(['bg-destructive', 'bg-success'])
  })

  it('inline layout renders the action beside the text, announcing "Actions available"', async () => {
    const s = make({ layout: 'inline' })
    s.push({ title: 'Archived', action: { label: 'Undo', onClick: () => {} } })
    await flushPromises()
    expect(w!.find('[data-slot="toast"] > [data-slot="toast-action"]').text()).toBe('Undo')
    expect(w!.find('[data-slot="toaster-status"]').text()).toContain('Actions available')
  })

  it('unknown values fall back to the defaults', async () => {
    const s = make({ layout: 'wide', appearance: 'glass' })
    s.push({ title: 'Saved' })
    await nextTick()
    const root = w!.find('[data-slot="toaster"]')
    expect(root.attributes('data-layout')).toBeUndefined()
    expect(root.attributes('data-appearance')).toBeUndefined()
    expect(w!.find('[data-slot="toast"]').classes()).toContain('bg-popover')
  })

  it('keeps the region name, live regions and no-announce on items in every combination', async () => {
    const s = make({ layout: 'compact', appearance: 'soft', label: 'Alerts' })
    s.push({ title: 'Saved' })
    await nextTick()
    const root = w!.find('[data-slot="toaster"]')
    expect(root.attributes('aria-label')).toBe('Alerts')
    expect(root.attributes('role')).toBe('region')
    expect(w!.find('[data-slot="toast"]').attributes('role')).toBeUndefined()
  })

  it('class prop still merges onto the region', () => {
    make({ layout: 'compact', class: 'mine' })
    expect(w!.find('[data-slot="toaster"]').classes()).toContain('mine')
  })
})
