import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import SearchInput from './SearchInput.vue'
import Field from '../Field/Field.vue'
import { cn } from '../../../lib/cn'
import { fieldSurface } from '../../../lib/styles'
import { configureStrictMode } from '../../../lib/contract'
import { CONTROL_SIZES, forcedInvalid } from '../Field/field-styles'
import { useStrictHarness } from '../testing'
import { searchInputVariants } from './variants'

/** The class string the input rendered before variations existed. */
const DEFAULT_CLASS = cn(
  fieldSurface,
  'py-1 ps-9 pe-9 pointer-coarse:pe-12 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
  CONTROL_SIZES.md,
  forcedInvalid,
)

const m = (props: Record<string, unknown> = {}) => mount(SearchInput, { props, attrs: { 'aria-label': 'Search' } })
const input = (props: Record<string, unknown> = {}) => m(props).find('input')

describe('SearchInput variations: defaults', () => {
  it('keeps the exact default input class string, the icon offset and the wrapper', () => {
    const w = m()
    expect(w.find('input').attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.find('[data-slot=search-input-icon]').classes()).toEqual(expect.arrayContaining(['start-3', 'pointer-events-none', 'absolute', 'text-muted-foreground']))
    expect(w.attributes('data-slot')).toBe('search-input')
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
    expect(cn(searchInputVariants())).toBe(DEFAULT_CLASS)
  })
})

describe('SearchInput variant', () => {
  it('filled has a muted fill', () => {
    const c = input({ variant: 'filled' }).classes()
    expect(c).toContain('bg-muted')
    expect(c).not.toContain('bg-transparent')
  })
  it('underline has a bottom border only, thickens on focus, and its icon sits flush at the start', () => {
    const w = m({ variant: 'underline' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['border-0', 'border-b', 'rounded-none', 'focus-visible:border-b-2', 'ps-7', 'pe-9', 'forced-colors:border-b-[ButtonText]']))
    expect(w.find('[data-slot=search-input-icon]').classes()).toContain('start-0')
  })
  it('ghost is borderless until hover and fills on focus', () => {
    expect(input({ variant: 'ghost' }).classes()).toEqual(expect.arrayContaining(['border-transparent', 'hover:border-input', 'focus-visible:bg-background']))
  })
  it('keeps room for the icon and the clear button in every variant', () => {
    for (const variant of ['outline', 'filled', 'underline', 'ghost']) {
      const c = input({ variant }).classes()
      expect(c.some((x) => x.startsWith('ps-'))).toBe(true)
      expect(c.some((x) => x.startsWith('pe-'))).toBe(true)
    }
  })
  it('unknown variant falls back to outline', () => {
    expect(input({ variant: 'x' }).attributes('class')).toBe(DEFAULT_CLASS)
  })
})

describe('SearchInput size', () => {
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
  it('xs keeps room for the icon and the clear button despite its tighter padding', () => {
    expect(input({ size: 'xs' }).classes()).toEqual(expect.arrayContaining(['px-2', 'ps-9', 'pe-9', 'pointer-coarse:pe-12']))
  })
  it('xs with an underline still sets the flush icon padding last', () => {
    expect(input({ size: 'xs', variant: 'underline' }).classes()).toEqual(expect.arrayContaining(['ps-7', 'pe-9']))
  })
  it('unknown size falls back to md', () => {
    expect(input({ size: 'x' }).classes()).toContain('h-9')
  })
})

describe('SearchInput shape', () => {
  it('pill is fully rounded and moves the icon and text in', () => {
    const w = m({ shape: 'pill' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['rounded-full', 'ps-10', 'pe-9']))
    expect(w.find('[data-slot=search-input-icon]').classes()).toContain('start-4')
  })
  it('square has no radius and keeps the default padding', () => {
    const w = m({ shape: 'square' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['rounded-none', 'ps-9', 'pe-9']))
    expect(w.find('[data-slot=search-input-icon]').classes()).toContain('start-3')
  })
  it('unknown shape falls back to rounded', () => {
    expect(input({ shape: 'x' }).classes()).toContain('rounded-md')
  })
})

describe('SearchInput status', () => {
  it.each([
    ['success', 'border-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'Warning'],
  ])('%s: coloured border, an icon left of the clear button, linked screen reader text', (status, border, text) => {
    const w = m({ status, modelValue: 'abc' })
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
  it('the clear button keeps its name and still clears with a status', async () => {
    const w = m({ status: 'success', modelValue: 'abc' })
    const b = w.find('[data-slot=search-input-clear]')
    expect(b.attributes('aria-label')).toBe('Clear search')
    await b.trigger('click')
    expect(w.emitted('clear')).toHaveLength(1)
  })
  it('statusLabel replaces the screen reader text', () => {
    expect(m({ status: 'warning', statusLabel: 'Achtung' }).find('[data-slot=field-status] .sr-only').text()).toBe('Achtung')
  })
  it('unknown status behaves as default', () => {
    const w = m({ status: 'weird' })
    expect(w.find('input').attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('merges the status id with the Field hint and a caller aria-describedby', () => {
    const inField = mount(Field, { props: { id: 'f', hint: 'Hint' }, slots: { default: () => h(SearchInput, { status: 'success' }) } }).find('input')
    expect(inField.attributes('aria-describedby')).toMatch(/^f-hint .*-status$/)
    const own = mount(SearchInput, { props: { status: 'success' }, attrs: { 'aria-label': 'x', 'aria-describedby': 'mine' } }).find('input')
    expect(own.attributes('aria-describedby')).toMatch(/^mine .*-status$/)
  })
  it('without a status or a hint there is no aria-describedby', () => {
    expect(input().attributes('aria-describedby')).toBeUndefined()
  })
})

describe('SearchInput combinations and class override', () => {
  it('underline and pill: underline wins', () => {
    const w = m({ variant: 'underline', shape: 'pill' })
    const c = w.find('input').classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-none', 'px-0', 'ps-7']))
    expect(c).not.toContain('rounded-full')
    expect(c).not.toContain('ps-10')
    expect(w.find('[data-slot=search-input-icon]').classes()).toContain('start-0')
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

describe('SearchInput edge cases', () => {
  it('disabled hides the clear button even with a status', () => {
    const w = m({ status: 'error', disabled: true, modelValue: 'abc' })
    expect(w.find('input').attributes('disabled')).toBeDefined()
    expect(w.find('[data-slot=search-input-clear]').exists()).toBe(false)
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
  })
  it('a long query keeps the input shrinkable', () => {
    const w = mount(SearchInput, { props: { modelValue: 'q'.repeat(300), status: 'warning' }, attrs: { 'aria-label': 'x' } })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['w-full', 'min-w-0']))
  })
  it('the landmark still works on a variation', () => {
    const w = m({ landmark: true, shape: 'pill' })
    expect(w.attributes('role')).toBe('search')
  })
})

describe('SearchInput variations keep the contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
  ])('a %s SearchInput without a name still throws', async (_n, props) => {
    configureStrictMode('throw')
    await mountTree(() => h(SearchInput, props as Record<string, unknown>))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SearchInput: needs an accessible name')
  })
  it('a blank clearLabel still throws on a variation', async () => {
    configureStrictMode('throw')
    await mountTree(() => h(SearchInput, { shape: 'pill', clearLabel: ' ', 'aria-label': 'Search' }))
    expect(errors).toHaveLength(1)
  })
})
