import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import NumberInput from './NumberInput.vue'
import Field from '../Field/Field.vue'
import { cn } from '../../../lib/cn'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { numberInputVariants } from './variants'

/** The root class string rendered before variations existed. */
const DEFAULT_ROOT = cn(
  fieldSurface,
  touchTarget +
    ' flex h-9 items-stretch overflow-hidden px-0 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-solid data-[invalid]:border-destructive data-[invalid]:ring-destructive/20 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
)
const DEFAULT_INPUT = 'min-w-0 flex-1 bg-transparent px-3 py-1 text-center text-md tabular-nums outline-none md:text-base placeholder:text-muted-foreground disabled:cursor-not-allowed'
const DEFAULT_BUTTON = 'inline-flex w-9 shrink-0 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 pointer-coarse:w-11'

const m = (props: Record<string, unknown> = {}) => mount(NumberInput, { props: { modelValue: 5, ...props }, attrs: { 'aria-label': 'Quantity' } })
const root = (props: Record<string, unknown> = {}) => m(props).find('[data-slot=number-input]')

describe('NumberInput variations: defaults', () => {
  it('keeps the exact default root, input and stepper class strings', () => {
    const w = m()
    expect(w.attributes('class')).toBe(DEFAULT_ROOT)
    expect(w.find('input').attributes('class')).toBe(DEFAULT_INPUT)
    expect(w.find('[data-slot=number-input-decrement]').attributes('class')).toBe(`${DEFAULT_BUTTON} border-e border-input`)
    expect(w.find('[data-slot=number-input-increment]').attributes('class')).toBe(`${DEFAULT_BUTTON} border-s border-input`)
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
    expect(cn(numberInputVariants())).toBe(DEFAULT_ROOT)
  })
})

describe('NumberInput variant', () => {
  it('filled has a muted fill', () => {
    const c = root({ variant: 'filled' }).classes()
    expect(c).toContain('bg-muted')
    expect(c).not.toContain('bg-transparent')
  })
  it('underline has a bottom border only and thickens it while the control has focus', () => {
    const c = root({ variant: 'underline' }).classes()
    expect(c).toEqual(expect.arrayContaining(['border-0', 'border-b', 'rounded-none', 'focus-within:border-b-2', 'focus-within:ring-0', 'forced-colors:border-b-[ButtonText]']))
  })
  it('ghost hides the border until hover and fills while focused', () => {
    expect(root({ variant: 'ghost' }).classes()).toEqual(expect.arrayContaining(['border-transparent', 'hover:border-input', 'focus-within:bg-background']))
  })
  it('every variant keeps the forced-colors focus outline', () => {
    for (const variant of ['outline', 'filled', 'underline', 'ghost']) expect(root({ variant }).classes()).toContain('forced-colors:focus-within:outline-2')
  })
  it('unknown variant falls back to outline', () => {
    expect(root({ variant: 'x' }).attributes('class')).toBe(DEFAULT_ROOT)
  })
})

describe('NumberInput size', () => {
  it.each([
    ['xs', 'h-7', 'w-7', 'md:text-xs'],
    ['sm', 'h-8', 'w-8', 'md:text-sm'],
    ['md', 'h-9', 'w-9', 'md:text-base'],
    ['lg', 'h-11', 'w-11', 'md:text-base'],
  ])('%s sets the height %s, stepper width %s and text %s', (size, height, width, text) => {
    const w = m({ size })
    expect(w.find('[data-slot=number-input]').classes()).toContain(height)
    expect(w.find('[data-slot=number-input-increment]').classes()).toContain(width)
    expect(w.find('[data-slot=number-input-decrement]').classes()).toContain(width)
    expect(w.find('input').classes()).toEqual(expect.arrayContaining([text, 'text-md']))
  })
  it('keeps the coarse pointer sizes for every size', () => {
    const w = m({ size: 'xs' })
    expect(w.find('[data-slot=number-input]').classes()).toContain('pointer-coarse:min-h-11')
    expect(w.find('[data-slot=number-input-increment]').classes()).toContain('pointer-coarse:w-11')
  })
  it('xs tightens the input padding', () => {
    expect(m({ size: 'xs' }).find('input').classes()).toContain('px-2')
  })
  it('unknown size falls back to md', () => {
    expect(root({ size: 'x' }).attributes('class')).toBe(DEFAULT_ROOT)
  })
})

describe('NumberInput shape', () => {
  it('pill is fully rounded and keeps the stepper layout', () => {
    const w = m({ shape: 'pill' })
    expect(w.find('[data-slot=number-input]').classes()).toEqual(expect.arrayContaining(['rounded-full', 'overflow-hidden', 'px-0']))
    expect(w.find('[data-slot=number-input]').classes()).not.toContain('rounded-md')
  })
  it('square has no radius', () => {
    expect(root({ shape: 'square' }).classes()).toContain('rounded-none')
  })
  it('unknown shape falls back to rounded', () => {
    expect(root({ shape: 'x' }).classes()).toContain('rounded-md')
  })
})

describe('NumberInput status', () => {
  it.each([
    ['success', 'border-success', 'focus-within:border-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'focus-within:border-warning-foreground', 'Warning'],
  ])('%s: coloured border at rest and on focus, an icon left of the stepper, linked screen reader text', (status, border, focus, text) => {
    const w = m({ status })
    expect(w.find('[data-slot=number-input]').classes()).toEqual(expect.arrayContaining([border, focus, 'relative']))
    const icon = w.find('[data-slot=field-status]')
    expect(icon.classes()).toEqual(expect.arrayContaining(['end-10', 'pointer-coarse:end-12']))
    expect(icon.find('svg').attributes('aria-hidden')).toBe('true')
    const sr = icon.find('.sr-only')
    expect(sr.text()).toBe(text)
    expect(w.find('input').attributes('aria-describedby')).toContain(sr.attributes('id'))
    expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
    expect(w.find('input').classes()).toContain('pe-6')
  })
  it('error sets aria-invalid and data-invalid, with an icon but no extra text', () => {
    const w = m({ status: 'error' })
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(w.find('[data-slot=number-input]').attributes('data-invalid')).toBeDefined()
    expect(w.find('[data-slot=number-input]').classes()).toContain('border-destructive')
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
    expect(w.find('[data-slot=field-status] .sr-only').exists()).toBe(false)
  })
  it.each([
    ['xs', 'end-8'],
    ['sm', 'end-9'],
    ['md', 'end-10'],
    ['lg', 'end-12'],
  ])('the icon of size %s clears the %s stepper', (size, end) => {
    expect(m({ status: 'success', size }).find('[data-slot=field-status]').classes()).toContain(end)
  })
  it('without steppers the icon sits at the end with more padding', () => {
    const w = m({ status: 'success', showSteppers: false })
    expect(w.find('[data-slot=field-status]').classes()).toContain('end-2.5')
    expect(w.find('input').classes()).toContain('pe-9')
  })
  it('statusLabel replaces the screen reader text', () => {
    expect(m({ status: 'warning', statusLabel: 'Achtung' }).find('[data-slot=field-status] .sr-only').text()).toBe('Achtung')
  })
  it('unknown status behaves as default', () => {
    const w = m({ status: 'weird' })
    expect(w.find('[data-slot=number-input]').attributes('class')).toBe(DEFAULT_ROOT)
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('merges the status id with the Field hint and a caller aria-describedby', () => {
    const inField = mount(Field, { props: { id: 'f', hint: 'Hint' }, slots: { default: () => h(NumberInput, { status: 'success' }) } }).find('input')
    expect(inField.attributes('aria-describedby')).toMatch(/^f-hint number-input-.*-status$/)
    const own = mount(NumberInput, { props: { status: 'warning' }, attrs: { 'aria-label': 'x', 'aria-describedby': 'mine' } }).find('input')
    expect(own.attributes('aria-describedby')).toMatch(/^mine number-input-.*-status$/)
  })
  it('without a status or a hint there is no aria-describedby', () => {
    expect(m().find('input').attributes('aria-describedby')).toBeUndefined()
  })
})

describe('NumberInput combinations and class override', () => {
  it('underline and pill: underline wins', () => {
    const c = root({ variant: 'underline', shape: 'pill' }).classes()
    expect(c).toContain('rounded-none')
    expect(c).not.toContain('rounded-full')
  })
  it('filled, pill and lg compose', () => {
    expect(root({ variant: 'filled', shape: 'pill', size: 'lg' }).classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full', 'h-11']))
  })
  it('success and xs compose', () => {
    expect(root({ status: 'success', size: 'xs' }).classes()).toEqual(expect.arrayContaining(['h-7', 'border-success']))
  })
  it('the class prop wins over variant classes', () => {
    const c = root({ variant: 'filled', size: 'lg', class: 'bg-card h-20' }).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-card', 'h-20']))
    expect(c).not.toContain('bg-muted')
    expect(c).not.toContain('h-11')
  })
})

describe('NumberInput edge cases', () => {
  it('steppers still step and respect min and max in a variation', async () => {
    const w = m({ variant: 'filled', shape: 'pill', status: 'success', min: 5, max: 6 })
    expect(w.find('[data-slot=number-input-decrement]').attributes('disabled')).toBeDefined()
    await w.find('[data-slot=number-input-increment]').trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([6])
    expect(w.find('[data-slot=number-input-increment]').attributes('disabled')).toBeDefined()
  })
  it('disabled disables everything with a status', () => {
    const w = m({ status: 'error', disabled: true })
    expect(w.find('input').attributes('disabled')).toBeDefined()
    expect(w.find('[data-slot=number-input-increment]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-slot=number-input]').attributes('data-disabled')).toBeDefined()
  })
  it('a huge value keeps the input shrinkable', () => {
    const w = m({ modelValue: 1e21, status: 'warning' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['min-w-0', 'flex-1']))
  })
  it('the live region keeps its role next to the status icon', () => {
    const w = m({ status: 'success' })
    expect(w.find('[data-slot=number-input-status]').attributes('role')).toBe('status')
  })
})

describe('NumberInput variations keep the contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
  ])('a %s NumberInput without a name still throws', async (_n, props) => {
    configureStrictMode('throw')
    await mountTree(() => h(NumberInput, props as Record<string, unknown>))
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain('NumberInput: needs an accessible name')
  })
  it('a blank stepper label still throws on a variation', async () => {
    configureStrictMode('throw')
    await mountTree(() => h(NumberInput, { shape: 'pill', incrementLabel: ' ', 'aria-label': 'Quantity' }))
    expect(errors).toHaveLength(1)
  })
})
