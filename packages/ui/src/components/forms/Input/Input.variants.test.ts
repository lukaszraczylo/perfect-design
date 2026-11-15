import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Input from './Input.vue'
import Field from '../Field/Field.vue'
import { cn } from '../../../lib/cn'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { inputVariants } from './variants'
import { fieldVariants } from '../Field/field-variants'

const DEFAULT_CLASS =
  'w-full min-w-0 rounded-md border border-input bg-transparent px-3 shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 py-1 h-9 text-md md:text-base pointer-coarse:min-h-11 forced-colors:aria-invalid:border-dashed'

const m = (props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) =>
  mount(Input, { props, slots: slots as never, attrs: { 'aria-label': 'Sample' } })

describe('Input variations: defaults', () => {
  it('keeps the exact default class string and a bare <input> root', () => {
    const w = m()
    expect(w.element.tagName).toBe('INPUT')
    expect(w.attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.find('[data-slot=input-wrapper]').exists()).toBe(false)
  })
  it('inputVariants is the shared fieldVariants and matches the component at the defaults', () => {
    expect(inputVariants).toBe(fieldVariants)
    expect(cn(inputVariants())).toBe(DEFAULT_CLASS)
  })
})

describe('Input variant', () => {
  it('filled adds a muted fill and drops the shadow', () => {
    const c = m({ variant: 'filled' }).classes()
    expect(c).toContain('bg-muted')
    expect(c).toContain('dark:bg-card') // dark: >= 1.15:1 from the outline fill (dark:bg-input/30), see filled-dark.test.ts
    expect(c).not.toContain('dark:bg-muted')
    expect(c).not.toContain('dark:bg-input/30')
    expect(m().classes()).toContain('dark:bg-input/30')
    expect(c).toContain('shadow-none')
    expect(c).not.toContain('bg-transparent')
  })
  it('underline keeps only a bottom border, thickens it on focus and keeps a forced-colors colour', () => {
    const c = m({ variant: 'underline' }).classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-none', 'border-0', 'border-b', 'px-0', 'focus-visible:border-b-2', 'forced-colors:border-b-[ButtonText]']))
    expect(c).not.toContain('rounded-md')
  })
  it('ghost hides the border until hover and fills on focus', () => {
    const c = m({ variant: 'ghost' }).classes()
    expect(c).toEqual(expect.arrayContaining(['border-transparent', 'hover:border-input', 'focus-visible:bg-background', 'forced-colors:border-[ButtonText]']))
  })
  it('every variant keeps a focus indicator class', () => {
    for (const variant of ['outline', 'filled', 'underline', 'ghost']) {
      expect(m({ variant }).classes().some((c) => c.startsWith('focus-visible:border-'))).toBe(true)
    }
  })
  it('unknown variant falls back to outline', () => {
    expect(m({ variant: 'bogus' }).attributes('class')).toBe(DEFAULT_CLASS)
  })
})

describe('Input size', () => {
  it.each([
    ['xs', 'h-7', 'md:text-xs'],
    ['sm', 'h-8', 'md:text-sm'],
    ['md', 'h-9', 'md:text-base'],
    ['lg', 'h-11', 'text-md'],
  ])('%s is %s with 16px text below md', (size, h7, text) => {
    const c = m({ size }).classes()
    expect(c).toContain(h7)
    expect(c).toContain(text)
    expect(c).toContain('text-md')
  })
  it('xs keeps the 44px touch target and tighter padding', () => {
    const c = m({ size: 'xs' }).classes()
    expect(c).toContain('pointer-coarse:min-h-11')
    expect(c).toContain('px-2')
  })
  it('unknown size falls back to md', () => {
    expect(m({ size: 'huge' }).classes()).toContain('h-9')
  })
})

describe('Input shape', () => {
  it('pill is fully rounded with more side padding', () => {
    const c = m({ shape: 'pill' }).classes()
    expect(c).toContain('rounded-full')
    expect(c).toContain('px-4')
    expect(c).not.toContain('rounded-md')
  })
  it('square has no radius', () => {
    const c = m({ shape: 'square' }).classes()
    expect(c).toContain('rounded-none')
    expect(c).not.toContain('rounded-md')
  })
  it('unknown shape falls back to rounded', () => {
    expect(m({ shape: 'oval' }).classes()).toContain('rounded-md')
  })
})

describe('Input status', () => {
  it('default adds no wrapper, no icon and no padding', () => {
    const w = m({ status: 'default' })
    expect(w.element.tagName).toBe('INPUT')
    expect(w.classes()).not.toContain('pe-9')
  })
  it.each([
    ['success', 'border-success', 'text-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'text-warning-foreground', 'Warning'],
  ])('%s has a coloured border, an icon and screen reader text referenced by aria-describedby', (status, border, iconColour, text) => {
    const w = m({ status })
    expect(w.element.tagName).toBe('SPAN')
    expect(w.attributes('data-slot')).toBe('input-wrapper')
    expect(w.find('input').classes()).toContain(border)
    expect(w.find('input').classes()).toContain('pe-9')
    const icon = w.find('[data-slot=field-status]')
    expect(icon.attributes('data-status')).toBe(status)
    expect(icon.classes()).toContain(iconColour)
    expect(icon.find('svg').attributes('aria-hidden')).toBe('true')
    const sr = icon.find('.sr-only')
    expect(sr.text()).toBe(text)
    expect(w.find('input').attributes('aria-describedby')).toContain(sr.attributes('id'))
    expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
  })
  it('error sets aria-invalid and shows an icon without extra screen reader text', () => {
    const w = m({ status: 'error' })
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(w.find('input').classes()).toContain('border-destructive')
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
    expect(w.find('.sr-only').exists()).toBe(false)
    expect(w.find('input').attributes('aria-describedby')).toBeUndefined()
  })
  it('statusLabel replaces the screen reader text', () => {
    const w = m({ status: 'success', statusLabel: 'Gueltig' })
    expect(w.find('.sr-only').text()).toBe('Gueltig')
  })
  it('unknown status falls back to the bare default input', () => {
    const w = m({ status: 'maybe' })
    expect(w.element.tagName).toBe('INPUT')
    expect(w.attributes('class')).toBe(DEFAULT_CLASS)
  })
  it('appends the status id to the Field hint and to a caller aria-describedby', () => {
    const inField = mount(Field, { props: { id: 'f', hint: 'Hint' }, slots: { default: () => h(Input, { status: 'success' }) } }).find('input')
    expect(inField.attributes('aria-describedby')).toMatch(/^f-hint input-.*-status$/)
    const own = mount(Input, { props: { status: 'warning' }, attrs: { 'aria-label': 'x', 'aria-describedby': 'mine' } }).find('input')
    expect(own.attributes('aria-describedby')).toMatch(/^mine input-.*-status$/)
  })
  it('status error inside a Field keeps the Field error wiring', () => {
    const w = mount(Field, { props: { id: 'f', error: 'Bad' }, slots: { default: () => h(Input, { status: 'error' }) } }).find('input')
    expect(w.attributes('aria-describedby')).toBe('f-error')
    expect(w.attributes('aria-invalid')).toBe('true')
  })
})

describe('Input prefix and suffix slots', () => {
  it('prefix wraps the input, is decorative and reserves start padding', () => {
    const w = m({}, { prefix: () => '$' })
    expect(w.attributes('data-slot')).toBe('input-wrapper')
    const prefix = w.find('[data-slot=input-prefix]')
    expect(prefix.text()).toBe('$')
    expect(prefix.attributes('aria-hidden')).toBe('true')
    expect(prefix.classes()).toEqual(expect.arrayContaining(['pointer-events-none', 'absolute', 'start-3']))
    expect(w.find('input').classes()).toContain('ps-9')
    expect(w.find('input').classes()).not.toContain('pe-9')
    expect(w.find('[data-slot=input-suffix]').exists()).toBe(false)
  })
  it('suffix reserves end padding', () => {
    const w = m({}, { suffix: () => 'kg' })
    const suffix = w.find('[data-slot=input-suffix]')
    expect(suffix.text()).toBe('kg')
    expect(suffix.attributes('aria-hidden')).toBe('true')
    expect(suffix.classes()).toContain('end-3')
    expect(w.find('input').classes()).toContain('pe-9')
    expect(w.find('input').classes()).not.toContain('ps-9')
  })
  it('suffix and status put the icon left of the suffix', () => {
    const w = m({ status: 'success' }, { suffix: () => 'kg' })
    expect(w.find('[data-slot=field-status]').classes()).toContain('end-10')
    expect(w.find('input').classes()).toContain('pe-16')
  })
  it('an empty slot still wraps but renders no text', () => {
    const w = m({}, { prefix: () => '' })
    expect(w.find('[data-slot=input-prefix]').text()).toBe('')
    expect(w.find('input').exists()).toBe(true)
  })
  it('the wrapper never captures the click: the input keeps the id, value and model', async () => {
    const w = mount(Input, { props: { modelValue: 'abc' }, attrs: { 'aria-label': 'x', id: 'own' }, slots: { prefix: () => '@' } })
    const input = w.find('input')
    expect(input.attributes('id')).toBe('own')
    expect((input.element as HTMLInputElement).value).toBe('abc')
    await input.setValue('next')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['next'])
  })
  it('flush underline puts the slots at the edge, pill moves them in', () => {
    const flush = m({ variant: 'underline' }, { prefix: () => '@', suffix: () => '%' })
    expect(flush.find('[data-slot=input-prefix]').classes()).toContain('start-0')
    expect(flush.find('[data-slot=input-suffix]').classes()).toContain('end-0')
    expect(flush.find('input').classes()).toEqual(expect.arrayContaining(['ps-7', 'pe-7']))
    const pill = m({ shape: 'pill' }, { prefix: () => '@', suffix: () => '%' })
    expect(pill.find('[data-slot=input-prefix]').classes()).toContain('start-4')
    expect(pill.find('input').classes()).toEqual(expect.arrayContaining(['ps-10', 'pe-10']))
  })
  it('flush underline and pill place the status icon at their own edge', () => {
    expect(m({ variant: 'underline', status: 'error' }).find('[data-slot=field-status]').classes()).toContain('end-0')
    expect(m({ shape: 'pill', status: 'error' }).find('[data-slot=field-status]').classes()).toContain('end-4')
    expect(m({ variant: 'underline', status: 'error' }).find('input').classes()).toContain('pe-7')
  })
})

describe('Input combinations', () => {
  it('underline wins over shape: no radius, no side padding', () => {
    const c = m({ variant: 'underline', shape: 'pill' }).classes()
    expect(c).toContain('rounded-none')
    expect(c).toContain('px-0')
    expect(c).not.toContain('rounded-full')
  })
  it('filled and pill and lg compose', () => {
    const c = m({ variant: 'filled', shape: 'pill', size: 'lg' }).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full', 'h-11']))
  })
  it('success and xs compose with a wrapper and padding', () => {
    const w = m({ status: 'success', size: 'xs' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['h-7', 'border-success', 'pe-9']))
  })
  it('ghost and warning keep the status border over the transparent one', () => {
    const c = m({ variant: 'ghost', status: 'warning' }).find('input').classes()
    expect(c).toContain('border-warning-foreground')
    expect(c).not.toContain('border-transparent')
  })
  it('the class prop wins over variant classes', () => {
    const c = m({ variant: 'filled', shape: 'pill', class: 'bg-card rounded-sm h-20' }).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-card', 'rounded-sm', 'h-20']))
    expect(c).not.toContain('bg-muted')
    expect(c).not.toContain('rounded-full')
    expect(c).not.toContain('h-9')
  })
  it('the class prop lands on the input, not the wrapper', () => {
    const w = m({ status: 'success', class: 'max-w-xs' })
    expect(w.find('input').classes()).toContain('max-w-xs')
    expect(w.classes()).not.toContain('max-w-xs')
  })
})

describe('Input edge cases', () => {
  it('disabled and readonly stay on the input inside a wrapper', () => {
    const w = m({ status: 'success', disabled: true, readonly: true })
    expect(w.find('input').attributes('disabled')).toBeDefined()
    expect(w.find('input').attributes('readonly')).toBeDefined()
  })
  it('long text keeps the min-w-0 and w-full that prevent overflow', () => {
    const w = mount(Input, { props: { modelValue: 'x'.repeat(500), status: 'error' }, attrs: { 'aria-label': 'x' } })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['w-full', 'min-w-0']))
    expect(w.classes()).toContain('w-full')
  })
  it('switching status on and off swaps between the bare and wrapped render and keeps the value', async () => {
    const w = mount(Input, { props: { modelValue: 'kept' }, attrs: { 'aria-label': 'x' } })
    expect(w.element.tagName).toBe('INPUT')
    await w.setProps({ status: 'warning' })
    expect((w.find('input').element as HTMLInputElement).value).toBe('kept')
    expect(w.element.tagName).toBe('SPAN')
    await w.setProps({ status: 'default' })
    expect(w.element.tagName).toBe('INPUT')
  })
  it('identifier types keep autocorrect off inside the wrapper and a cleared model empties the input', async () => {
    const w = mount(Input, { props: { type: 'email', status: 'success', modelValue: 'a@b.c' }, attrs: { 'aria-label': 'x' } })
    expect(w.find('input').attributes()).toMatchObject({ autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false' })
    await w.setProps({ modelValue: null })
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
  })
  it('a wrapped number input emits numbers', async () => {
    const w = mount(Input, { props: { type: 'number', status: 'warning' }, attrs: { 'aria-label': 'x' } })
    await w.find('input').setValue('7')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([7])
  })
  it('listeners and data attributes still reach the input', async () => {
    let focused = false
    const w = mount(Input, { props: { status: 'success' }, attrs: { 'aria-label': 'x', 'data-test': 'y', onFocus: () => (focused = true) } })
    expect(w.find('input').attributes('data-test')).toBe('y')
    await w.find('input').trigger('focus')
    expect(focused).toBe(true)
  })
})

describe('Input variations keep the contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
    ['xs', { size: 'xs' }],
  ])('a %s Input without a name still throws', async (_n, props) => {
    configureStrictMode('throw')
    await mountTree(() => h(Input, props as Record<string, unknown>))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Input: needs an accessible name')
  })
  it('a named variation does not throw', async () => {
    await mountTree(() => h(Input, { shape: 'pill', status: 'success', 'aria-label': 'Name' }, { prefix: () => '@' }))
    expect(errors).toEqual([])
  })
})
