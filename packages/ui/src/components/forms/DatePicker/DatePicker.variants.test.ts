import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import Field from '../Field/Field.vue'
import DatePicker from './DatePicker.vue'
import { DATE_PICKER_SIZES, datePickerVariants } from './variants'
import * as barrel from './index'

let wrappers: VueWrapper[] = []
function mountPicker(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(DatePicker, { props: { locale: 'en-US', ...props }, attrs: { 'aria-label': 'Date', ...attrs }, attachTo: document.body })
  wrappers.push(w)
  return w
}
const trigger = (w: VueWrapper) => w.find('[data-slot="date-picker-trigger"]')
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
})

// `cn` (tailwind-merge) drops `text-base` in favour of the later `text-md`, so the rendered string differs from the raw cva output by that class.
const RAW_DEFAULT =
  'w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 pointer-coarse:min-h-11 flex cursor-pointer items-center justify-between gap-2 py-1 text-start whitespace-nowrap select-none data-[placeholder]:text-muted-foreground h-9 text-md md:text-sm'
const DEFAULT_TRIGGER = RAW_DEFAULT.replace(' text-base', '')

describe('DatePicker variations: defaults', () => {
  it('keeps the default trigger class string and adds no status icon', () => {
    expect(datePickerVariants()).toBe(RAW_DEFAULT)
    const w = mountPicker()
    expect(trigger(w).attributes('class')).toBe(DEFAULT_TRIGGER)
    expect(w.find('[data-slot="field-status"]').exists()).toBe(false)
    expect(trigger(w).attributes('aria-invalid')).toBeUndefined()
  })
  it('exports the sizes including xs', () => {
    expect(DATE_PICKER_SIZES).toEqual(['xs', 'sm', 'md', 'lg'])
    expect(Object.keys(barrel)).toEqual(expect.arrayContaining(['DatePicker', 'datePickerVariants']))
  })
})

describe('DatePicker variations: size, variant, shape', () => {
  it('size xs is 28px tall with 12px text from md', () => {
    const c = trigger(mountPicker({ size: 'xs' })).classes()
    expect(c).toEqual(expect.arrayContaining(['h-7', 'px-2', 'md:text-xs']))
    expect(c).not.toContain('h-9')
  })
  it.each([
    ['filled', ['bg-muted', 'dark:bg-card', 'shadow-none']],
    ['underline', ['rounded-none', 'border-0', 'border-b', 'focus-visible:border-b-2', 'forced-colors:border-b-[ButtonText]']],
    ['ghost', ['border-transparent', 'bg-transparent', 'hover:border-input', 'forced-colors:border-[ButtonText]']],
  ])('variant %s adds its classes and keeps the focus indicator', (variant, expected) => {
    const c = trigger(mountPicker({ variant })).classes()
    expect(c).toEqual(expect.arrayContaining(expected))
    expect(c.some((x) => x.startsWith('focus-visible:'))).toBe(true)
  })
  it.each([
    ['pill', 'rounded-full'],
    ['square', 'rounded-none'],
  ])('shape %s', (shape, cls) => {
    const c = trigger(mountPicker({ shape })).classes()
    expect(c).toContain(cls)
    expect(c).not.toContain('rounded-md')
  })
  it('unknown variant, shape, status and size fall back to the defaults', () => {
    const w = mountPicker({ variant: 'neon', shape: 'blob', status: 'maybe', size: 'huge' })
    expect(trigger(w).attributes('class')).toBe(DEFAULT_TRIGGER)
    expect(w.find('[data-slot="field-status"]').exists()).toBe(false)
  })
  it('class wins over variant classes', () => {
    const c = trigger(mountPicker({ variant: 'filled', shape: 'pill', class: 'bg-card rounded-sm' })).classes()
    expect(c).toContain('bg-card')
    expect(c).toContain('rounded-sm')
    expect(c).not.toContain('bg-muted')
    expect(c).not.toContain('rounded-full')
  })
  it('underline wins over pill and square shape (no radius, no side padding)', () => {
    const c = trigger(mountPicker({ variant: 'underline', shape: 'pill' })).classes()
    expect(c).toContain('rounded-none')
    expect(c).toContain('px-0')
    expect(c).not.toContain('rounded-full')
  })
  it('size xs reaches the calendar when open', async () => {
    const w = mountPicker({ size: 'xs', open: true })
    await flushPromises()
    expect(w.find('[data-slot="calendar"]').attributes('data-size')).toBe('xs')
  })
})

describe('DatePicker variations: status', () => {
  it.each([
    ['success', 'border-success'],
    ['warning', 'border-warning-foreground'],
    ['error', 'border-destructive'],
  ])('status %s colours the border and shows an icon', (status, border) => {
    const w = mountPicker({ status })
    expect(trigger(w).classes()).toContain(border)
    const icon = w.find('[data-slot="field-status"]')
    expect(icon.attributes('data-status')).toBe(status)
    expect(icon.find('svg').attributes('aria-hidden')).toBe('true')
    expect(trigger(w).classes()).toContain('pe-9')
  })
  it('success and warning add hidden text that the trigger is described by', () => {
    const w = mountPicker({ status: 'success' })
    const text = w.find('[data-slot="field-status"] .sr-only')
    expect(text.text()).toBe('Valid')
    expect(trigger(w).attributes('aria-describedby')).toContain(text.attributes('id'))
    const warn = mountPicker({ status: 'warning', statusLabel: 'Pruefen' })
    expect(warn.find('[data-slot="field-status"] .sr-only').text()).toBe('Pruefen')
  })
  it('error sets aria-invalid and adds no hidden text (the linked error says it)', () => {
    const w = mountPicker({ status: 'error' })
    expect(trigger(w).attributes('aria-invalid')).toBe('true')
    expect(w.find('[data-slot="field-status"] .sr-only').exists()).toBe(false)
  })
  it('keeps the Field description alongside the status text', () => {
    const w = mount(Field, { props: { label: 'Due', hint: 'Weekdays only.' }, slots: { default: () => h(DatePicker, { status: 'success' }) }, attachTo: document.body })
    wrappers.push(w)
    const by = trigger(w).attributes('aria-describedby')!.split(' ')
    expect(by).toHaveLength(2)
    expect(by.every((id) => document.getElementById(id))).toBe(true)
  })
  it('with clearable and a value the status icon sits clear of the clear button (pe-16 stays)', () => {
    const w = mountPicker({ status: 'success', clearable: true, modelValue: new Date(2024, 4, 1) })
    expect(trigger(w).classes()).toContain('pe-16')
    expect(w.find('[data-slot="date-picker-clear"]').exists()).toBe(true)
  })
  it('disabled and readonly keep the status visible', () => {
    expect(mountPicker({ status: 'warning', disabled: true }).find('[data-slot="field-status"]').exists()).toBe(true)
    expect(mountPicker({ status: 'warning', readonly: true }).find('[data-slot="field-status"]').exists()).toBe(true)
  })
})

describe('DatePicker variations: combinations and contract', () => {
  it('filled + pill + xs + error do not conflict', () => {
    const c = trigger(mountPicker({ variant: 'filled', shape: 'pill', size: 'xs', status: 'error' })).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full', 'h-7', 'border-destructive']))
  })
  it('ghost + square + lg + success', () => {
    const c = trigger(mountPicker({ variant: 'ghost', shape: 'square', size: 'lg', status: 'success' })).classes()
    // the status colour wins over the ghost's transparent border so the status stays visible
    expect(c).toEqual(expect.arrayContaining(['border-success', 'rounded-none', 'h-11', 'bg-transparent']))
    expect(c).not.toContain('border-transparent')
  })
  it('still opens, picks a day and closes in a pill status variation', async () => {
    const w = mountPicker({ shape: 'pill', status: 'success', variant: 'filled' })
    await trigger(w).trigger('click')
    await flushPromises()
    expect(w.attributes('data-state')).toBe('open')
    await w.find('[data-slot="calendar-day"]').trigger('click')
    expect(w.emitted('update:modelValue')).toHaveLength(1)
    expect(w.attributes('data-state')).toBe('closed')
  })
})

describe('DatePicker variations: strict mode', () => {
  const { errors, mountTree } = useStrictHarness()
  afterEach(() => configureStrictMode('off'))
  it('a pill, filled, status picker still needs a name', async () => {
    await mountTree(() => h(DatePicker, { shape: 'pill', variant: 'filled', status: 'success' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('DatePicker: needs an accessible name')
  })
  it('is satisfied by aria-label in every look', async () => {
    await mountTree(() => h(DatePicker, { shape: 'pill', variant: 'underline', status: 'error', size: 'xs', 'aria-label': 'Due' }))
    expect(errors).toEqual([])
  })
})
