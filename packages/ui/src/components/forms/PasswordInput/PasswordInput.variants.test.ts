import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import PasswordInput from './PasswordInput.vue'
import Field from '../Field/Field.vue'
import { cn } from '../../../lib/cn'
import { fieldSurface } from '../../../lib/styles'
import { configureStrictMode } from '../../../lib/contract'
import { CONTROL_SIZES, forcedInvalid } from '../Field/field-styles'
import { useStrictHarness } from '../testing'
import { passwordInputVariants } from './variants'

/** The class string the input rendered before variations existed. */
const DEFAULT_CLASS = cn(fieldSurface, 'py-1 pe-10 pointer-coarse:pe-12', CONTROL_SIZES.md, forcedInvalid)

const m = (props: Record<string, unknown> = {}) => mount(PasswordInput, { props, attrs: { 'aria-label': 'Password' } })
const input = (props: Record<string, unknown> = {}) => m(props).find('input')

describe('PasswordInput variations: defaults', () => {
  it('keeps the exact default input class string and the wrapper', () => {
    const w = m()
    expect(w.find('input').attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.attributes('data-slot')).toBe('password-input')
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
    expect(cn(passwordInputVariants())).toBe(DEFAULT_CLASS)
  })
})

describe('PasswordInput variant', () => {
  it('filled has a muted fill', () => {
    const c = input({ variant: 'filled' }).classes()
    expect(c).toContain('bg-muted')
    expect(c).not.toContain('bg-transparent')
  })
  it('underline has a bottom border only and a thicker one on focus', () => {
    expect(input({ variant: 'underline' }).classes()).toEqual(expect.arrayContaining(['border-0', 'border-b', 'rounded-none', 'focus-visible:border-b-2', 'forced-colors:border-b-[ButtonText]']))
  })
  it('ghost is borderless until hover and fills on focus', () => {
    expect(input({ variant: 'ghost' }).classes()).toEqual(expect.arrayContaining(['border-transparent', 'hover:border-input', 'focus-visible:bg-background']))
  })
  it('keeps the toggle room in every variant', () => {
    for (const variant of ['outline', 'filled', 'underline', 'ghost']) expect(input({ variant }).classes()).toContain('pe-10')
  })
  it('unknown variant falls back to outline', () => {
    expect(input({ variant: 'x' }).attributes('class')).toBe(DEFAULT_CLASS)
  })
})

describe('PasswordInput size', () => {
  it.each([
    ['xs', 'h-7'],
    ['sm', 'h-8'],
    ['md', 'h-9'],
    ['lg', 'h-11'],
  ])('%s is %s with 16px text below md', (size, height) => {
    const c = input({ size }).classes()
    expect(c).toContain(height)
    expect(c).toContain('text-md')
  })
  it('xs keeps room for the toggle despite its tighter padding', () => {
    expect(input({ size: 'xs' }).classes()).toEqual(expect.arrayContaining(['px-2', 'pe-10', 'pointer-coarse:pe-12']))
  })
  it('unknown size falls back to md', () => {
    expect(input({ size: 'x' }).classes()).toContain('h-9')
  })
})

describe('PasswordInput shape', () => {
  it('pill is fully rounded', () => {
    const c = input({ shape: 'pill' }).classes()
    expect(c).toContain('rounded-full')
    expect(c).toContain('px-4')
    expect(c).toContain('pe-10')
  })
  it('square has no radius', () => {
    expect(input({ shape: 'square' }).classes()).toContain('rounded-none')
  })
  it('unknown shape falls back to rounded', () => {
    expect(input({ shape: 'x' }).classes()).toContain('rounded-md')
  })
})

describe('PasswordInput status', () => {
  it.each([
    ['success', 'border-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'Warning'],
  ])('%s: coloured border, an icon left of the toggle, linked screen reader text', (status, border, text) => {
    const w = m({ status })
    const i = w.find('input')
    expect(i.classes()).toEqual(expect.arrayContaining([border, 'pe-16', 'pointer-coarse:pe-20']))
    const icon = w.find('[data-slot=field-status]')
    expect(icon.classes()).toEqual(expect.arrayContaining(['end-9', 'pointer-coarse:end-12']))
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
  it('the toggle keeps its name, pressed state and room next to the icon', () => {
    const w = m({ status: 'success' })
    const b = w.find('button')
    expect(b.attributes('aria-label')).toBe('Show password')
    expect(b.attributes('aria-pressed')).toBe('false')
    expect(b.classes()).toContain('end-2')
  })
  it('statusLabel replaces the screen reader text', () => {
    expect(m({ status: 'success', statusLabel: 'Stark' }).find('[data-slot=field-status] .sr-only').text()).toBe('Stark')
  })
  it('unknown status behaves as default', () => {
    const w = m({ status: 'weird' })
    expect(w.find('input').attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('merges the status id with the Field hint and a caller aria-describedby', () => {
    const inField = mount(Field, { props: { id: 'f', hint: 'Hint' }, slots: { default: () => h(PasswordInput, { status: 'warning' }) } }).find('input')
    expect(inField.attributes('aria-describedby')).toMatch(/^f-hint f-status$/)
    const own = mount(PasswordInput, { props: { status: 'success' }, attrs: { 'aria-label': 'x', 'aria-describedby': 'mine' } }).find('input')
    expect(own.attributes('aria-describedby')).toMatch(/^mine .*-status$/)
  })
  it('without a status or a hint there is no aria-describedby', () => {
    expect(input().attributes('aria-describedby')).toBeUndefined()
  })
})

describe('PasswordInput combinations and class override', () => {
  it('underline and pill: underline wins', () => {
    const c = input({ variant: 'underline', shape: 'pill' }).classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-none', 'px-0']))
    expect(c).not.toContain('rounded-full')
  })
  it('filled, pill and lg compose', () => {
    expect(input({ variant: 'filled', shape: 'pill', size: 'lg' }).classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full', 'h-11']))
  })
  it('success and xs compose', () => {
    expect(input({ status: 'success', size: 'xs' }).classes()).toEqual(expect.arrayContaining(['h-7', 'border-success', 'pe-16']))
  })
  it('inputClass wins over variant classes', () => {
    const c = input({ variant: 'filled', size: 'lg', inputClass: 'bg-card h-20' }).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-card', 'h-20']))
    expect(c).not.toContain('bg-muted')
    expect(c).not.toContain('h-11')
  })
  it('the class prop still styles the wrapper only', () => {
    const w = m({ variant: 'filled', class: 'max-w-xs' })
    expect(w.classes()).toContain('max-w-xs')
    expect(w.find('input').classes()).not.toContain('max-w-xs')
  })
})

describe('PasswordInput edge cases', () => {
  it('disabled disables the input and the toggle with a status', () => {
    const w = m({ status: 'error', disabled: true })
    expect(w.find('input').attributes('disabled')).toBeDefined()
    expect(w.find('button').attributes('disabled')).toBeDefined()
  })
  it('readonly keeps the toggle usable', async () => {
    const w = m({ readonly: true, status: 'success' })
    await w.find('button').trigger('click')
    expect(w.find('input').attributes('type')).toBe('text')
  })
  it('a long password keeps the input shrinkable', () => {
    const w = mount(PasswordInput, { props: { modelValue: 'p'.repeat(300), status: 'warning', visible: true }, attrs: { 'aria-label': 'x' } })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['w-full', 'min-w-0']))
  })
})

describe('PasswordInput variations keep the contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
  ])('a %s PasswordInput without a name still throws', async (_n, props) => {
    configureStrictMode('throw')
    await mountTree(() => h(PasswordInput, props as Record<string, unknown>))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('PasswordInput: needs an accessible name')
  })
  it('a blank showLabel still throws on a variation', async () => {
    configureStrictMode('throw')
    await mountTree(() => h(PasswordInput, { shape: 'pill', showLabel: ' ', 'aria-label': 'Password' }))
    expect(errors).toHaveLength(1)
  })
})
