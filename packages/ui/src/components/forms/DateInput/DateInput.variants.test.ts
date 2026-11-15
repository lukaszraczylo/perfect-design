import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import DateInput from './DateInput.vue'
import Field from '../Field/Field.vue'
import { cn } from '../../../lib/cn'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { dateInputVariants } from './variants'

/** The input class string rendered before variations existed. */
const DEFAULT_CLASS = cn(fieldSurface, touchTarget, 'h-9 py-1 text-md md:text-sm dark:scheme-dark', 'forced-colors:aria-invalid:border-dashed')

const m = (props: Record<string, unknown> = {}) => mount(DateInput, { props: { modelValue: '2024-05-01', ...props }, attrs: { 'aria-label': 'Date' } })
const input = (props: Record<string, unknown> = {}) => m(props).find('input')

describe('DateInput variations: defaults', () => {
  it('keeps the exact default input class string', () => {
    const w = m()
    expect(w.find('input').attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.attributes('data-slot')).toBe('date-input')
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
    expect(cn(dateInputVariants())).toBe(DEFAULT_CLASS)
  })
})

describe('DateInput variant', () => {
  it('filled has a muted fill', () => {
    const c = input({ variant: 'filled' }).classes()
    expect(c).toContain('bg-muted')
    expect(c).not.toContain('bg-transparent')
  })
  it('underline has a bottom border only and thickens it on focus', () => {
    expect(input({ variant: 'underline' }).classes()).toEqual(expect.arrayContaining(['border-0', 'border-b', 'rounded-none', 'px-0', 'focus-visible:border-b-2', 'forced-colors:border-b-[ButtonText]']))
  })
  it('ghost is borderless until hover and fills on focus', () => {
    expect(input({ variant: 'ghost' }).classes()).toEqual(expect.arrayContaining(['border-transparent', 'hover:border-input', 'focus-visible:bg-background']))
  })
  it('keeps the dark colour scheme for the native picker in every variant', () => {
    for (const variant of ['outline', 'filled', 'underline', 'ghost']) expect(input({ variant }).classes()).toContain('dark:scheme-dark')
  })
  it('unknown variant falls back to outline', () => {
    expect(input({ variant: 'x' }).attributes('class')).toBe(DEFAULT_CLASS)
  })
})

describe('DateInput size', () => {
  it.each([
    ['xs', 'h-7', 'md:text-xs'],
    ['sm', 'h-8', 'md:text-sm'],
    ['md', 'h-9', 'md:text-sm'],
    ['lg', 'h-11', 'text-md'],
  ])('%s is %s with 16px text below md', (size, height, text) => {
    const c = input({ size }).classes()
    expect(c).toEqual(expect.arrayContaining([height, text, 'text-md', 'dark:scheme-dark']))
  })
  it('xs tightens the padding and keeps the touch target', () => {
    expect(input({ size: 'xs' }).classes()).toEqual(expect.arrayContaining(['px-2', 'pointer-coarse:min-h-11']))
  })
  it('unknown size falls back to md', () => {
    expect(input({ size: 'x' }).attributes('class')).toBe(DEFAULT_CLASS)
  })
})

describe('DateInput shape', () => {
  it('pill is fully rounded', () => {
    const c = input({ shape: 'pill' }).classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-full', 'px-4']))
    expect(c).not.toContain('rounded-md')
  })
  it('square has no radius', () => {
    expect(input({ shape: 'square' }).classes()).toContain('rounded-none')
  })
  it('unknown shape falls back to rounded', () => {
    expect(input({ shape: 'x' }).classes()).toContain('rounded-md')
  })
})

describe('DateInput status', () => {
  it.each([
    ['success', 'border-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'Warning'],
  ])('%s: coloured border, an icon after the picker button, linked screen reader text', (status, border, text) => {
    const w = m({ status })
    const i = w.find('input')
    expect(i.classes()).toEqual(expect.arrayContaining([border, 'pe-9']))
    const icon = w.find('[data-slot=field-status]')
    expect(icon.find('svg').attributes('aria-hidden')).toBe('true')
    const sr = icon.find('.sr-only')
    expect(sr.text()).toBe(text)
    expect(i.attributes('aria-describedby')).toContain(sr.attributes('id'))
    expect(i.attributes('aria-invalid')).toBeUndefined()
  })
  it('error sets aria-invalid and has an icon but no extra text', () => {
    const w = m({ status: 'error' })
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(w.find('input').classes()).toContain('border-destructive')
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
    expect(w.find('[data-slot=field-status] .sr-only').exists()).toBe(false)
  })
  it('the icon is inside the input wrapper, not next to the message', () => {
    const w = m({ status: 'success' })
    expect(w.find('span.relative [data-slot=field-status]').exists()).toBe(true)
    expect(w.find('[data-slot=date-input-message]').element.parentElement).toBe(w.element)
  })
  it('statusLabel replaces the screen reader text', () => {
    expect(m({ status: 'warning', statusLabel: 'Achtung' }).find('[data-slot=field-status] .sr-only').text()).toBe('Achtung')
  })
  it('unknown status behaves as default', () => {
    const w = m({ status: 'weird' })
    expect(w.find('input').attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('lists the status id after the Field hint and the range message id', () => {
    const w = mount(Field, { props: { id: 'f', hint: 'Hint' }, slots: { default: () => h(DateInput, { status: 'success', modelValue: '2020-01-01', min: '2024-01-01' }) } })
    expect(w.find('input').attributes('aria-describedby')).toMatch(/^f-hint date-input-msg-.* date-input-.*-status$/)
  })
  it('appends the status id to a caller aria-describedby', () => {
    const own = mount(DateInput, { props: { status: 'warning' }, attrs: { 'aria-label': 'x', 'aria-describedby': 'mine' } }).find('input')
    expect(own.attributes('aria-describedby')).toMatch(/^mine date-input-.*-status$/)
  })
  it('out-of-range still marks the input invalid under a success status', () => {
    const w = m({ status: 'success', modelValue: '2020-01-01', min: '2024-01-01' })
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(w.find('[data-slot=date-input-message]').text()).toContain('2024-01-01')
  })
})

describe('DateInput combinations and class override', () => {
  it('underline and pill: underline wins', () => {
    const c = input({ variant: 'underline', shape: 'pill' }).classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-none', 'px-0']))
    expect(c).not.toContain('rounded-full')
  })
  it('filled, pill and lg compose', () => {
    expect(input({ variant: 'filled', shape: 'pill', size: 'lg' }).classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full', 'h-11']))
  })
  it('success and xs compose', () => {
    expect(input({ status: 'success', size: 'xs' }).classes()).toEqual(expect.arrayContaining(['h-7', 'border-success', 'pe-9']))
  })
  it.each(['time', 'datetime-local', 'month'])('type=%s takes the same looks', (type) => {
    const w = mount(DateInput, { props: { type: type as 'time', variant: 'filled', status: 'warning' }, attrs: { 'aria-label': 'x' } })
    expect(w.find('input').attributes('type')).toBe(type)
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['bg-muted', 'border-warning-foreground']))
  })
  it('the class prop wins over variant classes', () => {
    const c = input({ variant: 'filled', size: 'lg', class: 'bg-card h-20' }).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-card', 'h-20']))
    expect(c).not.toContain('bg-muted')
    expect(c).not.toContain('h-11')
  })
})

describe('DateInput edge cases', () => {
  it('disabled and readonly work with a status', async () => {
    const w = m({ status: 'error', disabled: true, readonly: true })
    expect(w.find('input').attributes('disabled')).toBeDefined()
    expect(w.find('input').attributes('readonly')).toBeDefined()
    await w.find('input').setValue('2025-01-01')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
  it('empty value with a status renders normally', () => {
    const w = m({ modelValue: '', status: 'warning' })
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
  })
  it('changing the date still emits with a variation', async () => {
    const w = m({ shape: 'pill', status: 'success' })
    await w.find('input').setValue('2025-02-02')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['2025-02-02'])
  })
})

describe('DateInput variations keep the contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
  ])('a %s DateInput without a name still throws', async (_n, props) => {
    configureStrictMode('throw')
    await mountTree(() => h(DateInput, props as Record<string, unknown>))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('DateInput: needs an accessible name')
  })
})
