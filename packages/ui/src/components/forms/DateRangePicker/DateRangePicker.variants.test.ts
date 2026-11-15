import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { createDate } from '../Calendar/dateMath'
import DateRangePicker from './DateRangePicker.vue'
import * as barrel from './index'

const d = (y: number, m: number, day: number) => createDate(y, m - 1, day)
let wrappers: VueWrapper[] = []
function mountPicker(props: Record<string, unknown> = {}) {
  const w = mount(DateRangePicker, { props: { locale: 'en-US', weekStart: 0, ...props }, attrs: { 'aria-label': 'Range' }, attachTo: document.body })
  wrappers.push(w)
  return w
}
const trigger = (w: VueWrapper) => w.find('[data-slot="date-range-picker-trigger"]')
const presetBtns = (w: VueWrapper) => w.findAll('[data-slot="date-range-picker-preset"]')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2024, 1, 15, 10, 30))
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('DateRangePicker variations: trigger look', () => {
  it('default trigger has no status icon and the default classes', () => {
    const w = mountPicker()
    expect(w.find('[data-slot="field-status"]').exists()).toBe(false)
    expect(trigger(w).classes()).toEqual(expect.arrayContaining(['rounded-md', 'border', 'h-9']))
    expect(trigger(w).classes()).not.toContain('bg-muted')
  })
  it('exports the shared trigger variants under its own name', () => {
    expect(typeof barrel.dateRangePickerVariants).toBe('function')
    expect(barrel.dateRangePickerVariants({ variant: 'filled' })).toContain('bg-muted')
  })
  it.each([
    ['filled', 'bg-muted'],
    ['underline', 'border-b'],
    ['ghost', 'border-transparent'],
  ])('variant %s', (variant, cls) => expect(trigger(mountPicker({ variant })).classes()).toContain(cls))
  it.each([
    ['pill', 'rounded-full'],
    ['square', 'rounded-none'],
  ])('shape %s', (shape, cls) => expect(trigger(mountPicker({ shape })).classes()).toContain(cls))
  it('size xs', () => expect(trigger(mountPicker({ size: 'xs' })).classes()).toContain('h-7'))
  it('unknown values fall back', () => {
    const c = trigger(mountPicker({ variant: 'x', shape: 'y', status: 'z', size: 'q' })).classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-md', 'h-9']))
  })
  it.each([
    ['success', 'Valid'],
    ['warning', 'Warning'],
  ])('status %s has icon, hidden text and describedby', (status, text) => {
    const w = mountPicker({ status })
    expect(w.find('[data-slot="field-status"] svg').attributes('aria-hidden')).toBe('true')
    const hidden = w.find('[data-slot="field-status"] .sr-only')
    expect(hidden.text()).toBe(text)
    expect(trigger(w).attributes('aria-describedby')).toContain(hidden.attributes('id'))
  })
  it('status error is invalid', () => {
    const w = mountPicker({ status: 'error' })
    expect(trigger(w).attributes('aria-invalid')).toBe('true')
    expect(trigger(w).classes()).toContain('border-destructive')
  })
  it('class wins; combinations hold', () => {
    const c = trigger(mountPicker({ variant: 'filled', shape: 'pill', status: 'success', size: 'xs', class: 'bg-card' })).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-card', 'rounded-full', 'border-success', 'h-7']))
    expect(c).not.toContain('bg-muted')
  })
})

describe('DateRangePicker variations: three months', () => {
  it('numberOfMonths 3 renders three grids in the dropdown', async () => {
    const w = mountPicker({ numberOfMonths: 3, open: true })
    await flushPromises()
    expect(w.findAll('[role="grid"]')).toHaveLength(3)
  })
})

describe('DateRangePicker presets', () => {
  const presets = [
    { label: 'First week', range: { start: d(2024, 2, 1), end: d(2024, 2, 7) } },
    { label: 'Second week', range: { start: d(2024, 2, 8), end: d(2024, 2, 14) } },
    { label: 'February', range: { start: d(2024, 2, 1), end: d(2024, 2, 29) } },
  ]
  async function open(w: VueWrapper) {
    await trigger(w).trigger('click')
    await flushPromises()
  }

  it('renders nothing extra without presets', async () => {
    const w = mountPicker()
    await open(w)
    expect(w.find('[data-slot="date-range-picker-presets"]').exists()).toBe(false)
  })
  it('renders a named group of buttons beside the calendar when open', async () => {
    const w = mountPicker({ presets })
    expect(presetBtns(w)).toHaveLength(0)
    await open(w)
    const group = w.find('[data-slot="date-range-picker-presets"]')
    expect(group.attributes('role')).toBe('group')
    expect(group.attributes('aria-label')).toBe('Presets')
    expect(presetBtns(w).map((b) => b.text())).toEqual(['First week', 'Second week', 'February'])
    expect(presetBtns(w).every((b) => b.attributes('type') === 'button')).toBe(true)
    expect(w.find('[data-slot="calendar"]').exists()).toBe(true)
    expect(group.classes()).toEqual(expect.arrayContaining(['flex', 'flex-wrap', 'sm:flex-col', 'sm:border-e']))
    expect(presetBtns(w)[0].classes()).toEqual(expect.arrayContaining(['pointer-coarse:min-h-11', 'forced-colors:aria-pressed:border-2']))
  })
  it('presetsLabel names the group', async () => {
    const w = mountPicker({ presets, presetsLabel: 'Zeitraeume' })
    await open(w)
    expect(w.find('[data-slot="date-range-picker-presets"]').attributes('aria-label')).toBe('Zeitraeume')
  })
  it('choosing a preset sets the range, closes and returns focus to the trigger', async () => {
    const w = mountPicker({ presets })
    await open(w)
    await presetBtns(w)[1].trigger('click')
    await flushPromises()
    expect(w.emitted('update:modelValue')?.at(-1)?.[0]).toEqual({ start: d(2024, 2, 8), end: d(2024, 2, 14) })
    expect(w.attributes('data-state')).toBe('closed')
    expect(document.activeElement).toBe(trigger(w).element)
    expect(trigger(w).text()).toBe('Feb 8, 2024 – Feb 14, 2024')
  })
  it('marks the preset equal to the value as pressed', async () => {
    const w = mountPicker({ presets, modelValue: presets[2].range })
    await open(w)
    expect(presetBtns(w).map((b) => b.attributes('aria-pressed'))).toEqual(['false', 'false', 'true'])
  })
  it('disables presets outside min and max', async () => {
    const w = mountPicker({ presets, min: d(2024, 2, 5), max: d(2024, 2, 20) })
    await open(w)
    expect(presetBtns(w).map((b) => b.attributes('disabled') !== undefined)).toEqual([true, false, true])
    await presetBtns(w)[0].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
  it('skips entries with a blank label or a broken range (the contract reports them in strict mode)', async () => {
    const w = mountPicker({
      presets: [{ label: ' ', range: presets[0].range }, { label: 'Broken', range: { start: new Date('x'), end: new Date('y') } }, { label: 'Good', range: presets[0].range }, null],
    })
    await open(w)
    expect(presetBtns(w).map((b) => b.text())).toEqual(['Good'])
  })
  it('a non-array presets value behaves as none', async () => {
    const w = mountPicker({ presets: 'nope' })
    await open(w)
    expect(w.find('[data-slot="date-range-picker-presets"]').exists()).toBe(false)
  })
  it('long preset labels wrap inside the narrow dropdown instead of overflowing', async () => {
    const w = mountPicker({ presets: [{ label: 'A very long preset label that keeps going and going', range: presets[0].range }] })
    await open(w)
    expect(presetBtns(w)[0].classes()).toContain('shrink-0')
    expect(w.find('[data-slot="date-range-picker-presets"]').classes()).toContain('flex-wrap')
  })
  it('is keyboard operable: Escape closes from a preset and returns focus', async () => {
    const w = mountPicker({ presets })
    await open(w)
    ;(presetBtns(w)[0].element as HTMLElement).focus()
    await presetBtns(w)[0].trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(w.attributes('data-state')).toBe('closed')
    expect(document.activeElement).toBe(trigger(w).element)
  })
})

describe('DateRangePicker variations: strict mode', () => {
  const { errors, mountTree } = useStrictHarness()
  afterEach(() => configureStrictMode('off'))
  const range = { start: d(2024, 2, 1), end: d(2024, 2, 7) }

  it('a pill, status picker still needs a name', async () => {
    await mountTree(() => h(DateRangePicker, { shape: 'pill', status: 'warning' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('DateRangePicker: needs an accessible name')
  })
  it('throws for a preset with a blank label or an invalid range, and accepts good presets', async () => {
    await mountTree(() => h(DateRangePicker, { 'aria-label': 'Range', presets: [{ label: '', range }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('DateRangePicker: requires every entry of `presets`')
    await mountTree(() => h(DateRangePicker, { 'aria-label': 'Range', presets: [{ label: 'Bad', range: { start: new Date('x'), end: range.end } }] }))
    expect(errors).toHaveLength(1)
    await mountTree(() => h(DateRangePicker, { 'aria-label': 'Range', open: true, presets: [{ label: 'Week', range }] }))
    expect(errors).toEqual([])
  })
  it('no presets means no check', async () => {
    await mountTree(() => h(DateRangePicker, { 'aria-label': 'Range', presets: [] }))
    expect(errors).toEqual([])
  })
})
