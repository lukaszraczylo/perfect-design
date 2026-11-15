import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, expect, vi } from 'vitest'
import FilterBar from './FilterBar.vue'
import type { FilterField, FilterItem } from './types'

export const FIELDS: FilterField[] = [
  { id: 'status', label: 'Status', type: 'select', options: [{ value: 'booked', label: 'Booked' }, { value: 'transit', label: 'In transit' }, { value: 'held', label: 'Held', disabled: true }] },
  { id: 'reference', label: 'Reference', type: 'text', placeholder: 'KF-1042' },
  { id: 'weight', label: 'Weight', type: 'number', min: 0, max: 1000 },
  { id: 'delivery', label: 'Delivery', type: 'date', min: '2025-01-01', max: '2025-12-31' },
  { id: 'carrier', label: 'Carrier', type: 'multi-select', options: [{ value: 'kestrel', label: 'Kestrel Freight' }, { value: 'orchard', label: 'Orchard Mill' }, { value: 'bright', label: 'Brightwater Co', disabled: true }] },
  { id: 'insured', label: 'Insured', type: 'boolean' },
]

export const ITEMS = (): FilterItem[] => [
  { id: 'a', field: 'status', operator: 'eq', value: 'transit' },
  { id: 'b', field: 'weight', operator: 'gt', value: 120 },
  { id: 'c', field: 'carrier', operator: 'in', value: ['kestrel', 'orchard'] },
]

const mounted: VueWrapper[] = []
// reka-ui restores focus from a zero-delay timer when a popover unmounts; let it fire before the next test opens one.
afterEach(async () => {
  while (mounted.length) mounted.pop()!.unmount()
  await new Promise((r) => setTimeout(r, 15))
  document.body.innerHTML = ''
})

export const tick = async (n = 3) => {
  for (let i = 0; i < n; i++) await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

export function mountBar(props: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) {
  const w = mount(FilterBar, { props: { fields: FIELDS, ...props }, attachTo: document.body, ...opts })
  mounted.push(w)
  // Vue ignores a DOM event created in the same millisecond a listener was attached; a test clicks right after mounting.
  const until = Date.now() + 2
  while (Date.now() <= until);
  return w
}

export const q = <T extends HTMLElement = HTMLElement>(sel: string) => document.body.querySelector<T>(sel)
export const qa = <T extends HTMLElement = HTMLElement>(sel: string) => [...document.body.querySelectorAll<T>(sel)]
export const slot = (name: string) => q(`[data-slot="${name}"]`)

export async function setSelect(el: HTMLSelectElement | null, value: string) {
  el!.value = value
  el!.dispatchEvent(new Event('change', { bubbles: true }))
  await tick()
}
export async function setInput(el: HTMLInputElement | null, value: string) {
  el!.value = value
  el!.dispatchEvent(new Event('input', { bubbles: true }))
  await tick()
}
export async function openPopover() {
  slot('filter-bar-add')!.click()
  await vi.waitFor(() => expect(slot('filter-bar-field')).not.toBeNull(), { timeout: 2000 })
}
export const apply = async () => {
  slot('filter-bar-apply')!.click()
  await tick()
}
export const chips = () => qa('[data-slot="filter-chip"]')
export const chipTexts = () => chips().map((c) => c.querySelector('[data-slot="filter-chip-label"]')!.textContent)
export const live = () => slot('filter-bar-status')!.textContent
