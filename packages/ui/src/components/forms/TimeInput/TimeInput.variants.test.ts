import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import TimeInput from './TimeInput.vue'
import Field from '../Field/Field.vue'
import { cn } from '../../../lib/cn'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { FIELD_WITHIN_STATUS_CLASSES, FIELD_WITHIN_VARIANT_CLASSES, timeInputVariants } from './variants'

const m = (props: Record<string, unknown> = {}) => mount(TimeInput, { props, attrs: { 'aria-label': 'Start' } })
const root = (props: Record<string, unknown> = {}) => m(props).find('[data-slot=time-input]')

describe('TimeInput variations: defaults', () => {
  it('default root classes equal the size-only output and carry no status icon', () => {
    const w = m()
    expect(w.attributes('class')).toBe(cn(timeInputVariants({ size: 'md' })))
    expect(w.classes()).toEqual(expect.arrayContaining(['h-9', 'rounded-md', 'inline-flex', 'focus-within:ring-3', 'pointer-coarse:min-h-11']))
    expect(w.classes()).not.toContain('relative')
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('timeInputVariants() with no arguments is the default look', () => {
    expect(timeInputVariants()).toBe(timeInputVariants({ size: 'md', variant: 'outline', shape: 'rounded', status: 'default' }))
  })
})

describe('TimeInput variant', () => {
  it('filled has a muted fill', () => {
    const c = root({ variant: 'filled' }).classes()
    expect(c).toContain('bg-muted')
    expect(c).toContain('dark:bg-card')
    expect(c).not.toContain('dark:bg-muted')
    expect(c).not.toContain('bg-transparent')
  })
  it('underline has a bottom border only and thickens it while a segment has focus', () => {
    const c = root({ variant: 'underline' }).classes()
    expect(c).toEqual(expect.arrayContaining(['border-0', 'border-b', 'rounded-none', 'px-0', 'focus-within:border-b-2', 'focus-within:ring-0', 'forced-colors:border-b-[ButtonText]']))
  })
  it('ghost hides the border until hover and fills while focused', () => {
    expect(root({ variant: 'ghost' }).classes()).toEqual(expect.arrayContaining(['border-transparent', 'hover:border-input', 'focus-within:bg-background']))
  })
  it('every variant keeps the forced-colors focus outline', () => {
    for (const variant of Object.keys(FIELD_WITHIN_VARIANT_CLASSES)) expect(root({ variant }).classes()).toContain('forced-colors:focus-within:outline-2')
  })
  it('unknown variant falls back to outline', () => {
    expect(root({ variant: 'x' }).attributes('class')).toBe(root().attributes('class'))
  })
})

describe('TimeInput size', () => {
  it.each([
    ['xs', 'h-7', 'md:text-xs'],
    ['sm', 'h-8', 'md:text-sm'],
    ['md', 'h-9', 'md:text-base'],
    ['lg', 'h-11', 'text-md'],
  ])('%s is %s with 16px text below md', (size, height, text) => {
    const c = root({ size }).classes()
    expect(c).toEqual(expect.arrayContaining([height, text, 'text-md']))
  })
  it('xs keeps a 24px segment and the 44px touch target', () => {
    const w = m({ size: 'xs' })
    expect(w.find('[data-slot=time-input]').classes()).toContain('pointer-coarse:min-h-11')
    expect(w.find('[data-segment=hour]').classes()).toEqual(expect.arrayContaining(['min-h-6', 'min-w-6']))
  })
  it('unknown size falls back to md', () => {
    expect(root({ size: 'x' }).classes()).toContain('h-9')
  })
})

describe('TimeInput shape', () => {
  it('pill is fully rounded', () => {
    const c = root({ shape: 'pill' }).classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-full', 'px-4']))
    expect(c).not.toContain('rounded-md')
  })
  it('square has no radius', () => {
    expect(root({ shape: 'square' }).classes()).toContain('rounded-none')
  })
  it('unknown shape falls back to rounded', () => {
    expect(root({ shape: 'x' }).classes()).toContain('rounded-md')
  })
})

describe('TimeInput status', () => {
  it.each([
    ['success', 'border-success', 'focus-within:border-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'focus-within:border-warning-foreground', 'Warning'],
  ])('%s: coloured border at rest and on focus, an icon, linked screen reader text', (status, border, focus, text) => {
    const w = m({ status })
    const r = w.find('[data-slot=time-input]')
    expect(r.classes()).toEqual(expect.arrayContaining([border, focus, 'relative', 'pe-9']))
    const icon = w.find('[data-slot=field-status]')
    expect(icon.find('svg').attributes('aria-hidden')).toBe('true')
    const sr = icon.find('.sr-only')
    expect(sr.text()).toBe(text)
    expect(r.attributes('aria-describedby')).toContain(sr.attributes('id'))
    expect(r.find('[data-segment=hour]').attributes('aria-invalid')).toBeUndefined()
  })
  it('error marks every segment invalid, has an icon but no extra text', () => {
    const w = m({ status: 'error' })
    expect(w.find('[data-slot=time-input]').classes()).toContain('border-destructive')
    expect(w.find('[data-segment=hour]').attributes('aria-invalid')).toBe('true')
    expect(w.find('[data-segment=minute]').attributes('aria-invalid')).toBe('true')
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
    expect(w.find('[data-slot=field-status] .sr-only').exists()).toBe(false)
    expect(w.attributes('data-invalid')).toBeDefined()
  })
  it('statusLabel replaces the screen reader text', () => {
    expect(m({ status: 'success', statusLabel: 'Gueltig' }).find('[data-slot=field-status] .sr-only').text()).toBe('Gueltig')
  })
  it('unknown status behaves as default', () => {
    const w = m({ status: 'weird' })
    expect(w.find('[data-slot=time-input]').attributes('class')).toBe(root().attributes('class'))
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('merges the status id with the Field hint', () => {
    const w = mount(Field, { props: { id: 'f', hint: 'Hint' }, slots: { default: () => h(TimeInput, { status: 'warning' }) } })
    expect(w.find('[data-slot=time-input]').attributes('aria-describedby')).toMatch(/^f-hint time-input-.*-status$/)
  })
  it('every status class set uses border and focus classes, never colour alone', () => {
    for (const [key, cls] of Object.entries(FIELD_WITHIN_STATUS_CLASSES)) if (key !== 'default') expect(cls).toMatch(/border-.*focus-within:border-/)
  })
  it('does not change the hidden form input or the live region', () => {
    const w = m({ status: 'success', name: 'start', modelValue: '09:05' })
    expect((w.find('input[type=hidden]').element as HTMLInputElement).value).toBe('09:05')
    expect(w.find('[data-slot=time-input-status]').attributes('role')).toBe('status')
  })
})

describe('TimeInput combinations and class override', () => {
  it('underline and pill: underline wins', () => {
    const c = root({ variant: 'underline', shape: 'pill' }).classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-none', 'px-0']))
    expect(c).not.toContain('rounded-full')
  })
  it('filled, pill and lg compose', () => {
    expect(root({ variant: 'filled', shape: 'pill', size: 'lg' }).classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full', 'h-11']))
  })
  it('underline and error keep the end padding for the icon', () => {
    expect(root({ variant: 'underline', status: 'error', size: 'xs' }).classes()).toEqual(expect.arrayContaining(['pe-9', 'border-destructive', 'h-7']))
  })
  it('the class prop wins over variant classes', () => {
    const c = root({ variant: 'filled', size: 'lg', class: 'bg-card h-20' }).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-card', 'h-20']))
    expect(c).not.toContain('bg-muted')
    expect(c).not.toContain('h-11')
  })
})

describe('TimeInput edge cases', () => {
  it('disabled stays disabled with a status', () => {
    const w = m({ status: 'success', disabled: true })
    expect(w.find('[data-segment=hour]').attributes('aria-disabled')).toBe('true')
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
  })
  it('12 hour mode with a status still renders the period segment', () => {
    const w = m({ hour12: true, status: 'warning', modelValue: '15:30' })
    expect(w.find('[data-segment=period]').text()).toBe('PM')
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
  })
  it('keyboard editing works inside a status variation', async () => {
    const w = m({ status: 'success', modelValue: '09:00' })
    await w.find('[data-segment=hour]').trigger('keydown', { key: 'ArrowUp' })
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['10:00'])
  })
})

describe('TimeInput variations keep the contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status warning', { status: 'warning' }],
  ])('a %s TimeInput without a name still throws', async (_n, props) => {
    configureStrictMode('throw')
    await mountTree(() => h(TimeInput, props as Record<string, unknown>))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TimeInput: needs an accessible name')
  })
  it('a blank hourLabel still throws on a variation', async () => {
    configureStrictMode('throw')
    await mountTree(() => h(TimeInput, { shape: 'pill', hourLabel: ' ', 'aria-label': 'Start' }))
    expect(errors).toHaveLength(1)
  })
})
