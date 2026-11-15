import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import NativeSelect from './NativeSelect.vue'
import Field from '../Field/Field.vue'
import { cn } from '../../../lib/cn'
import { fieldSurface } from '../../../lib/styles'
import { configureStrictMode } from '../../../lib/contract'
import { CONTROL_SIZES, forcedInvalid } from '../Field/field-styles'
import { useStrictHarness } from '../testing'
import { nativeSelectVariants } from './variants'

/** The select class string rendered before variations existed. */
const DEFAULT_CLASS = cn(
  fieldSurface,
  'appearance-none py-1 pe-9 [&_option]:bg-popover [&_option]:text-popover-foreground [&_optgroup]:bg-popover [&_optgroup]:text-popover-foreground',
  CONTROL_SIZES.md,
  forcedInvalid,
)
const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]

const m = (props: Record<string, unknown> = {}) => mount(NativeSelect, { props: { options, ...props }, attrs: { 'aria-label': 'Choice' } })
const sel = (props: Record<string, unknown> = {}) => m(props).find('select')

describe('NativeSelect variations: defaults', () => {
  it('keeps the exact default select class string, chevron offset and wrapper', () => {
    const w = m()
    expect(w.find('select').attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.attributes('data-slot')).toBe('native-select-wrapper')
    expect(w.find('[data-slot=native-select-icon]').classes()).toEqual(expect.arrayContaining(['end-3', 'pointer-events-none', 'absolute']))
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
    expect(cn(nativeSelectVariants())).toBe(DEFAULT_CLASS)
  })
})

describe('NativeSelect variant', () => {
  it('filled has a muted fill', () => {
    const c = sel({ variant: 'filled' }).classes()
    expect(c).toContain('bg-muted')
    expect(c).not.toContain('bg-transparent')
  })
  it('underline has a bottom border only, keeps the chevron room and moves the chevron flush', () => {
    const w = m({ variant: 'underline' })
    expect(w.find('select').classes()).toEqual(expect.arrayContaining(['border-0', 'border-b', 'rounded-none', 'focus-visible:border-b-2', 'pe-9', 'forced-colors:border-b-[ButtonText]']))
    expect(w.find('[data-slot=native-select-icon]').classes()).toContain('end-0')
  })
  it('ghost is borderless until hover and fills on focus', () => {
    expect(sel({ variant: 'ghost' }).classes()).toEqual(expect.arrayContaining(['border-transparent', 'hover:border-input', 'focus-visible:bg-background']))
  })
  it('unknown variant falls back to outline', () => {
    expect(sel({ variant: 'x' }).attributes('class')).toBe(DEFAULT_CLASS)
  })
  it('keeps the option colours so the list stays readable in dark mode', () => {
    expect(sel({ variant: 'filled' }).classes()).toContain('[&_option]:bg-popover')
  })
})

describe('NativeSelect size', () => {
  it.each([
    ['xs', 'h-7'],
    ['sm', 'h-8'],
    ['md', 'h-9'],
    ['lg', 'h-11'],
  ])('%s is %s with 16px text below md', (size, height) => {
    const c = sel({ size }).classes()
    expect(c).toContain(height)
    expect(c).toContain('text-md')
  })
  it('xs keeps the touch target and the chevron room', () => {
    expect(sel({ size: 'xs' }).classes()).toEqual(expect.arrayContaining(['pointer-coarse:min-h-11', 'pe-9']))
  })
  it('unknown size falls back to md', () => {
    expect(sel({ size: 'x' }).classes()).toContain('h-9')
  })
})

describe('NativeSelect shape', () => {
  it('pill is fully rounded and moves the chevron in', () => {
    const w = m({ shape: 'pill' })
    expect(w.find('select').classes()).toEqual(expect.arrayContaining(['rounded-full', 'px-4', 'pe-9']))
    expect(w.find('[data-slot=native-select-icon]').classes()).toContain('end-4')
  })
  it('square has no radius', () => {
    expect(sel({ shape: 'square' }).classes()).toContain('rounded-none')
  })
  it('unknown shape falls back to rounded', () => {
    expect(sel({ shape: 'x' }).classes()).toContain('rounded-md')
  })
})

describe('NativeSelect status', () => {
  it.each([
    ['success', 'border-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'Warning'],
  ])('%s: coloured border, an icon left of the chevron, linked screen reader text', (status, border, text) => {
    const w = m({ status })
    const s = w.find('select')
    expect(s.classes()).toEqual(expect.arrayContaining([border, 'pe-16']))
    const icon = w.find('[data-slot=field-status]')
    expect(icon.classes()).toContain('end-9')
    expect(icon.find('svg').attributes('aria-hidden')).toBe('true')
    const sr = icon.find('.sr-only')
    expect(sr.text()).toBe(text)
    expect(s.attributes('aria-describedby')).toContain(sr.attributes('id'))
    expect(s.attributes('aria-invalid')).toBeUndefined()
  })
  it('error sets aria-invalid and has an icon but no extra text', () => {
    const w = m({ status: 'error' })
    expect(w.find('select').attributes('aria-invalid')).toBe('true')
    expect(w.find('select').classes()).toContain('border-destructive')
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
    expect(w.find('[data-slot=field-status] .sr-only').exists()).toBe(false)
  })
  it('the icon follows the underline and pill chevron positions', () => {
    expect(m({ status: 'success', variant: 'underline' }).find('[data-slot=field-status]').classes()).toContain('end-6')
    expect(m({ status: 'success', shape: 'pill' }).find('[data-slot=field-status]').classes()).toContain('end-10')
  })
  it('statusLabel replaces the screen reader text', () => {
    expect(m({ status: 'success', statusLabel: 'Gueltig' }).find('[data-slot=field-status] .sr-only').text()).toBe('Gueltig')
  })
  it('unknown status behaves as default', () => {
    const w = m({ status: 'weird' })
    expect(w.find('select').attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('merges the status id with the Field hint and a caller aria-describedby', () => {
    const inField = mount(Field, { props: { id: 'f', hint: 'Hint' }, slots: { default: () => h(NativeSelect, { options, status: 'success' }) } }).find('select')
    expect(inField.attributes('aria-describedby')).toMatch(/^f-hint native-select-.*-status$/)
    const own = mount(NativeSelect, { props: { options, status: 'warning' }, attrs: { 'aria-label': 'x', 'aria-describedby': 'mine' } }).find('select')
    expect(own.attributes('aria-describedby')).toMatch(/^mine native-select-.*-status$/)
  })
  it('without a status or a hint there is no aria-describedby', () => {
    expect(sel().attributes('aria-describedby')).toBeUndefined()
  })
})

describe('NativeSelect combinations and class override', () => {
  it('underline and pill: underline wins', () => {
    const w = m({ variant: 'underline', shape: 'pill' })
    const c = w.find('select').classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-none', 'px-0', 'pe-9']))
    expect(c).not.toContain('rounded-full')
    expect(w.find('[data-slot=native-select-icon]').classes()).toContain('end-0')
  })
  it('filled, pill and lg compose', () => {
    expect(sel({ variant: 'filled', shape: 'pill', size: 'lg' }).classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full', 'h-11']))
  })
  it('success and xs compose', () => {
    expect(sel({ status: 'success', size: 'xs' }).classes()).toEqual(expect.arrayContaining(['h-7', 'border-success', 'pe-16']))
  })
  it('the class prop still styles the wrapper only', () => {
    const w = m({ variant: 'filled', class: 'max-w-xs' })
    expect(w.classes()).toContain('max-w-xs')
    expect(w.find('select').classes()).not.toContain('max-w-xs')
  })
  it('a muted placeholder colour wins over a status', () => {
    const c = sel({ placeholder: 'Pick one', status: 'success' }).classes()
    expect(c).toContain('text-muted-foreground')
  })
})

describe('NativeSelect edge cases', () => {
  it('disabled stays disabled with a status', () => {
    const w = m({ status: 'error', disabled: true })
    expect(w.find('select').attributes('disabled')).toBeDefined()
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
  })
  it('selecting still emits with a variation', async () => {
    const w = m({ shape: 'pill', status: 'success', modelValue: 'a' })
    await w.find('select').setValue('b')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })
  it('long option labels do not widen the control', () => {
    const w = m({ options: [{ value: 'x', label: 'L'.repeat(300) }], status: 'warning' })
    expect(w.find('select').classes()).toEqual(expect.arrayContaining(['w-full', 'min-w-0']))
    expect(w.classes()).toContain('w-full')
  })
})

describe('NativeSelect variations keep the contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
  ])('a %s NativeSelect without a name still throws', async (_n, props) => {
    configureStrictMode('throw')
    await mountTree(() => h(NativeSelect, { options, ...(props as Record<string, unknown>) }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('NativeSelect: needs an accessible name')
  })
})
