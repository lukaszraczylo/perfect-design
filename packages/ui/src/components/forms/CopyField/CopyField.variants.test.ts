import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import CopyField from './CopyField.vue'
import Field from '../Field/Field.vue'
import { cn } from '../../../lib/cn'
import { fieldSurface } from '../../../lib/styles'
import { configureStrictMode } from '../../../lib/contract'
import { CONTROL_SIZES, forcedInvalid } from '../Field/field-styles'
import { useStrictHarness } from '../testing'
import { copyFieldButtonVariants, copyFieldVariants } from './variants'

/** The input and button class strings rendered before variations existed. */
const DEFAULT_INPUT = cn(fieldSurface, 'rounded-e-none py-1 font-mono', CONTROL_SIZES.md, 'md:text-sm', forcedInvalid)
const DEFAULT_BUTTON = cn(
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-e-md border border-s-0 border-input bg-secondary px-3 text-sm font-medium whitespace-nowrap text-secondary-foreground transition-colors outline-hidden hover:bg-secondary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50',
  'h-9 pointer-coarse:min-h-11',
)

const m = (props: Record<string, unknown> = {}) => mount(CopyField, { props: { value: 'sample-value', ...props }, attrs: { 'aria-label': 'Value' } })
const input = (props: Record<string, unknown> = {}) => m(props).find('input')
const button = (props: Record<string, unknown> = {}) => m(props).find('button')

describe('CopyField variations: defaults', () => {
  it('keeps the exact default input and button class strings', () => {
    const w = m()
    expect(w.find('input').attributes('class')).toBe(DEFAULT_INPUT)
    expect(w.find('button').attributes('class')).toBe(DEFAULT_BUTTON)
    expect(w.attributes('data-slot')).toBe('copy-field')
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
    expect(cn(copyFieldVariants())).toBe(DEFAULT_INPUT)
    expect(cn(copyFieldButtonVariants())).toBe(DEFAULT_BUTTON)
  })
  it('the input stays a direct flex item of the root (the wrapper has no box)', () => {
    const w = m()
    expect(w.find('input').element.parentElement!.classList.contains('contents')).toBe(true)
  })
})

describe('CopyField variant', () => {
  it('filled gives the input a muted fill and keeps the secondary button', () => {
    const w = m({ variant: 'filled' })
    expect(w.find('input').classes()).toContain('bg-muted')
    expect(w.find('button').classes()).toEqual(expect.arrayContaining(['bg-secondary', 'border-input']))
  })
  it('underline makes both a bottom-border line', () => {
    const w = m({ variant: 'underline' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['border-0', 'border-b', 'rounded-none', 'focus-visible:border-b-2']))
    const b = w.find('button').classes()
    expect(b).toEqual(expect.arrayContaining(['border-0', 'border-b', 'bg-transparent', 'text-foreground', 'rounded-none', 'hover:bg-accent', 'hover:text-accent-foreground', 'forced-colors:border-b-[ButtonText]']))
    expect(b).not.toContain('bg-secondary')
  })
  it('ghost makes the button a borderless text button', () => {
    const w = m({ variant: 'ghost' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['border-transparent', 'hover:border-input']))
    expect(w.find('button').classes()).toEqual(expect.arrayContaining(['border-transparent', 'bg-transparent', 'text-foreground', 'hover:bg-accent']))
  })
  it('every variant keeps a focus indicator on the button', () => {
    for (const variant of ['outline', 'filled', 'underline', 'ghost']) {
      expect(button({ variant }).classes().some((c) => c.startsWith('focus-visible:'))).toBe(true)
    }
  })
  it('unknown variant falls back to outline', () => {
    const w = m({ variant: 'x' })
    expect(w.find('input').attributes('class')).toBe(DEFAULT_INPUT)
    expect(w.find('button').attributes('class')).toBe(DEFAULT_BUTTON)
  })
})

describe('CopyField size', () => {
  it.each([
    ['xs', 'h-7', 'md:text-xs'],
    ['sm', 'h-8', 'md:text-sm'],
    ['md', 'h-9', 'md:text-sm'],
    ['lg', 'h-11', 'md:text-sm'],
  ])('%s sets the height %s on the input and the button', (size, height, text) => {
    const w = m({ size })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining([height, text, 'text-md']))
    expect(w.find('button').classes()).toContain(height)
  })
  it('xs keeps the touch target on both', () => {
    const w = m({ size: 'xs' })
    expect(w.find('input').classes()).toContain('pointer-coarse:min-h-11')
    expect(w.find('button').classes()).toEqual(expect.arrayContaining(['pointer-coarse:min-h-11', 'text-xs']))
  })
  it('unknown size falls back to md', () => {
    expect(input({ size: 'x' }).classes()).toContain('h-9')
    expect(button({ size: 'x' }).classes()).toContain('h-9')
  })
})

describe('CopyField shape', () => {
  it('pill rounds the start of the input and the end of the button, never the joint', () => {
    const w = m({ shape: 'pill' })
    const i = w.find('input').classes()
    expect(i).toEqual(expect.arrayContaining(['rounded-full', 'px-4', 'rounded-e-none']))
    expect(w.find('button').classes()).toEqual(expect.arrayContaining(['rounded-e-full', 'pe-4']))
    expect(w.find('button').classes()).not.toContain('rounded-e-md')
  })
  it('square has no radius on the input or the button', () => {
    const w = m({ shape: 'square' })
    expect(w.find('input').classes()).toContain('rounded-none')
    expect(w.find('button').classes()).toContain('rounded-e-none')
    expect(w.find('button').classes()).not.toContain('rounded-e-md')
  })
  it('unknown shape falls back to rounded', () => {
    expect(button({ shape: 'x' }).classes()).toContain('rounded-e-md')
  })
})

describe('CopyField status', () => {
  it.each([
    ['success', 'border-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'Warning'],
  ])('%s: coloured border on input and button, an icon at the end of the input, linked screen reader text', (status, border, text) => {
    const w = m({ status })
    const i = w.find('input')
    expect(i.classes()).toEqual(expect.arrayContaining([border, 'pe-9']))
    expect(w.find('button').classes()).toContain(border)
    expect(w.find('button').classes()).not.toContain('border-input')
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
  it('the icon sits inside a relative box around the input, left of the button', () => {
    const w = m({ status: 'success' })
    const box = w.find('input').element.parentElement!
    expect(box.className).toContain('relative')
    expect(box.querySelector('[data-slot=field-status]')).not.toBeNull()
    expect(box.contains(w.find('button').element)).toBe(false)
  })
  it('statusLabel replaces the screen reader text', () => {
    expect(m({ status: 'warning', statusLabel: 'Achtung' }).find('[data-slot=field-status] .sr-only').text()).toBe('Achtung')
  })
  it('unknown status behaves as default', () => {
    const w = m({ status: 'weird' })
    expect(w.find('input').attributes('class')).toBe(DEFAULT_INPUT)
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('merges the status id with the Field hint and a caller aria-describedby', () => {
    const inField = mount(Field, { props: { id: 'f', hint: 'Hint' }, slots: { default: () => h(CopyField, { value: 'x', status: 'success' }) } }).find('input')
    expect(inField.attributes('aria-describedby')).toMatch(/^f-hint copy-field-.*-status$/)
    const own = mount(CopyField, { props: { value: 'x', status: 'warning' }, attrs: { 'aria-label': 'x', 'aria-describedby': 'mine' } }).find('input')
    expect(own.attributes('aria-describedby')).toMatch(/^mine copy-field-.*-status$/)
  })
  it('the copied text colour is only set after copying', () => {
    const w = m({ status: 'success' })
    expect(w.find('button').classes()).not.toContain('text-success')
  })
})

describe('CopyField combinations and class override', () => {
  it('underline and pill: underline wins on both parts', () => {
    const w = m({ variant: 'underline', shape: 'pill' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['rounded-none', 'px-0']))
    expect(w.find('input').classes()).not.toContain('rounded-full')
    expect(w.find('button').classes()).toContain('rounded-none')
    expect(w.find('button').classes()).not.toContain('rounded-e-full')
  })
  it('filled, pill and lg compose', () => {
    const w = m({ variant: 'filled', shape: 'pill', size: 'lg' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full', 'h-11']))
    expect(w.find('button').classes()).toEqual(expect.arrayContaining(['rounded-e-full', 'h-11']))
  })
  it('success and xs compose', () => {
    const w = m({ status: 'success', size: 'xs' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['h-7', 'border-success', 'pe-9']))
    expect(w.find('button').classes()).toEqual(expect.arrayContaining(['h-7', 'border-success']))
  })
  it('inputClass wins over variant classes and class styles the wrapper only', () => {
    const w = m({ variant: 'filled', size: 'lg', inputClass: 'bg-card h-20', class: 'max-w-sm' })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['bg-card', 'h-20']))
    expect(w.find('input').classes()).not.toContain('bg-muted')
    expect(w.classes()).toContain('max-w-sm')
  })
})

describe('CopyField edge cases', () => {
  it('copying and the live region still work with a variation', async () => {
    const original = navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} }, configurable: true })
    const w = m({ variant: 'underline', shape: 'pill', status: 'success' })
    await w.find('button').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.emitted('copy')?.[0]).toEqual(['sample-value'])
    expect(w.find('button').classes()).toContain('text-success')
    expect(w.find('[data-slot=copy-field-status]').attributes('role')).toBe('status')
    Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true })
  })
  it('disabled disables the input and the button with a status', () => {
    const w = m({ status: 'error', disabled: true })
    expect(w.find('input').attributes('disabled')).toBeDefined()
    expect(w.find('button').attributes('disabled')).toBeDefined()
  })
  it('a long value keeps the input shrinkable and the iconOnly label hidden', () => {
    const w = m({ value: 'k'.repeat(500), status: 'warning', iconOnly: true })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['w-full', 'min-w-0']))
    expect(w.find('button span').classes()).toContain('sr-only')
  })
  it('masked values keep the password type under a status', () => {
    expect(m({ mask: true, status: 'success' }).find('input').attributes('type')).toBe('password')
  })
})

describe('CopyField variations keep the contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
  ])('a %s CopyField without a name still throws', async (_n, props) => {
    configureStrictMode('throw')
    await mountTree(() => h(CopyField, { value: 'x', ...(props as Record<string, unknown>) }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('CopyField: needs an accessible name')
  })
  it('a blank label still throws on a variation', async () => {
    configureStrictMode('throw')
    await mountTree(() => h(CopyField, { value: 'x', shape: 'pill', label: ' ', 'aria-label': 'Value' }))
    expect(errors).toHaveLength(1)
  })
})
