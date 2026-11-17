import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import TimeRangePicker from './TimeRangePicker.vue'

const CUSTOM = { from: '2024-04-20T00:00:00.000Z', to: '2024-05-02T00:00:00.000Z' }
const wrappers: VueWrapper[] = []
const make = (props: Record<string, unknown>) => {
  const w = mount(TimeRangePicker, { props: { locale: 'en-US', now: '2024-05-15T12:30:00Z', ...props }, attrs: { 'aria-label': 'Range' }, attachTo: document.body })
  wrappers.push(w)
  return w
}
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))

describe('TimeRangePicker layout', () => {
  it('centres the status icon on the trigger, not on the whole root that also holds the message', () => {
    const w = make({ modelValue: { from: '2024-05-02T12:00:00.000Z', to: '2024-05-02T09:00:00.000Z' } })
    const status = w.get('[data-slot="field-status"]').element
    const trig = w.get('[data-slot="time-range-picker-trigger"]').element
    expect(status.parentElement).toBe(trig.parentElement)
    expect(trig.parentElement!.className).toContain('relative')
    expect(trig.parentElement).not.toBe(w.element)
  })

  it('keeps the clear button in the same positioned wrapper as the trigger', () => {
    const w = make({ modelValue: CUSTOM, clearable: true })
    const clear = w.get('[data-slot="time-range-picker-clear"]').element
    expect(clear.parentElement).toBe(w.get('[data-slot="time-range-picker-trigger"]').element.parentElement)
  })

  it('lays the inline panel out by its own width so the calendar stays inside the border', () => {
    const w = make({ variant: 'inline', modelValue: CUSTOM, status: 'error' })
    const panel = w.get('[data-slot="time-range-picker-content"]')
    expect(panel.classes()).toContain('@container')
    const row = panel.get('div')
    expect(row.classes()).toContain('@lg:flex-row')
    expect(row.classes()).not.toContain('sm:flex-row')
    const presets = w.get('[data-slot="time-range-picker-presets"]')
    expect(presets.classes()).toContain('@lg:flex-col')
    expect(presets.classes()).not.toContain('sm:flex-col')
  })
})
