import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Textarea from './Textarea.vue'
import Field from '../Field/Field.vue'
import { cn } from '../../../lib/cn'
import { fieldSurface } from '../../../lib/styles'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { textareaVariants } from './variants'

const DEFAULT_CLASS = cn(fieldSurface, 'min-h-16 py-2 text-md md:text-base', 'forced-colors:aria-invalid:border-dashed', 'resize-y')

const m = (props: Record<string, unknown> = {}) => mount(Textarea, { props, attrs: { 'aria-label': 'Sample' } })
const ta = (props: Record<string, unknown> = {}) => m(props).find('textarea')

describe('Textarea variations: defaults', () => {
  it('keeps the exact default class string and the wrapper root', () => {
    expect(ta().attributes('class')).toBe(DEFAULT_CLASS)
    expect(m().attributes('data-slot')).toBe('textarea-wrapper')
    expect(m().find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('textareaVariants matches the component at the defaults and takes variation props', () => {
    expect(cn(textareaVariants(), 'resize-y')).toBe(DEFAULT_CLASS)
    expect(textareaVariants({ variant: 'filled', size: 'lg' })).toContain('bg-muted')
  })
})

describe('Textarea size', () => {
  it.each([
    ['xs', 'min-h-12', 'md:text-xs'],
    ['sm', 'min-h-14', 'md:text-sm'],
    ['md', 'min-h-16', 'md:text-base'],
    ['lg', 'min-h-20', 'md:text-md'],
  ])('%s sets %s and %s and keeps 16px text below md', (size, minH, text) => {
    const c = ta({ size }).classes()
    expect(c).toContain(minH)
    expect(c).toContain(text)
    expect(c).toContain('text-md')
  })
  it('xs tightens the padding', () => {
    expect(ta({ size: 'xs' }).classes()).toEqual(expect.arrayContaining(['px-2', 'py-1']))
  })
  it('unknown size falls back to md', () => {
    expect(ta({ size: 'giant' }).attributes('class')).toBe(DEFAULT_CLASS)
  })
})

describe('Textarea variant', () => {
  it('filled has a muted fill', () => {
    const c = ta({ variant: 'filled' }).classes()
    expect(c).toContain('bg-muted')
    expect(c).not.toContain('bg-transparent')
  })
  it('underline has only a bottom border that thickens on focus', () => {
    const c = ta({ variant: 'underline' }).classes()
    expect(c).toEqual(expect.arrayContaining(['rounded-none', 'border-0', 'border-b', 'focus-visible:border-b-2', 'forced-colors:border-b-[ButtonText]']))
  })
  it('ghost hides the border until hover or focus', () => {
    const c = ta({ variant: 'ghost' }).classes()
    expect(c).toEqual(expect.arrayContaining(['border-transparent', 'hover:border-input', 'focus-visible:bg-background']))
  })
  it('unknown variant falls back to outline', () => {
    expect(ta({ variant: 'neon' }).attributes('class')).toBe(DEFAULT_CLASS)
  })
})

describe('Textarea shape', () => {
  it('pill is rounded-xl, not a full pill that would clip lines', () => {
    const c = ta({ shape: 'pill' }).classes()
    expect(c).toContain('rounded-xl')
    expect(c).toContain('px-4')
    expect(c).not.toContain('rounded-full')
  })
  it('square has no radius', () => {
    expect(ta({ shape: 'square' }).classes()).toContain('rounded-none')
  })
  it('unknown shape falls back to rounded', () => {
    expect(ta({ shape: 'blob' }).classes()).toContain('rounded-md')
  })
})

describe('Textarea status', () => {
  it.each([
    ['success', 'border-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'Warning'],
  ])('%s: coloured border, top-end icon, linked screen reader text, end padding', (status, border, text) => {
    const w = m({ status })
    const t = w.find('textarea')
    expect(t.classes()).toEqual(expect.arrayContaining([border, 'pe-9']))
    const icon = w.find('[data-slot=field-status]')
    expect(icon.classes()).toEqual(expect.arrayContaining(['top-2.5', 'translate-y-0']))
    expect(icon.find('svg').attributes('aria-hidden')).toBe('true')
    const sr = icon.find('.sr-only')
    expect(sr.text()).toBe(text)
    expect(t.attributes('aria-describedby')).toContain(sr.attributes('id'))
    expect(t.attributes('aria-invalid')).toBeUndefined()
  })
  it('error sets aria-invalid and has an icon without extra text', () => {
    const w = m({ status: 'error' })
    expect(w.find('textarea').attributes('aria-invalid')).toBe('true')
    expect(w.find('textarea').classes()).toContain('border-destructive')
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
    expect(w.find('.sr-only').exists()).toBe(false)
  })
  it('statusLabel replaces the screen reader text', () => {
    expect(m({ status: 'warning', statusLabel: 'Achtung' }).find('.sr-only').text()).toBe('Achtung')
  })
  it('unknown status behaves as default', () => {
    const w = m({ status: 'odd' })
    expect(w.find('textarea').attributes('class')).toBe(DEFAULT_CLASS)
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
  it('merges the status id with the Field hint, the counter and a caller aria-describedby', () => {
    const w = mount(Field, {
      props: { id: 'f', hint: 'Hint' },
      slots: { default: () => h(Textarea, { status: 'success', maxlength: 10, showCount: true, 'aria-describedby': 'mine' }) },
    })
    const ids = w.find('textarea').attributes('aria-describedby')!.split(' ')
    expect(ids[0]).toBe('f-hint')
    expect(ids).toHaveLength(4)
    expect(ids[2]).toMatch(/-status$/)
    expect(ids[3]).toBe('mine')
  })
})

describe('Textarea combinations and class override', () => {
  it('underline wins over shape pill and square', () => {
    for (const shape of ['pill', 'square']) {
      const c = ta({ variant: 'underline', shape }).classes()
      expect(c).toEqual(expect.arrayContaining(['rounded-none', 'px-0']))
      expect(c).not.toContain('rounded-xl')
    }
  })
  it('filled and pill and sm compose', () => {
    expect(ta({ variant: 'filled', shape: 'pill', size: 'sm' }).classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-xl', 'min-h-14']))
  })
  it('success and xs compose', () => {
    expect(ta({ status: 'success', size: 'xs' }).classes()).toEqual(expect.arrayContaining(['border-success', 'min-h-12', 'pe-9']))
  })
  it('the class prop wins over variant classes', () => {
    const c = ta({ variant: 'filled', size: 'lg', class: 'bg-card min-h-40' }).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-card', 'min-h-40']))
    expect(c).not.toContain('bg-muted')
    expect(c).not.toContain('min-h-20')
  })
  it('keeps autosize classes and the counter with a variation', () => {
    const w = m({ variant: 'filled', autosize: true, maxlength: 20, showCount: true, modelValue: 'abc', status: 'success' })
    expect(w.find('textarea').classes()).toEqual(expect.arrayContaining(['resize-none', 'overflow-y-auto', 'bg-muted']))
    expect(w.find('[data-slot=textarea-count]').text()).toBe('3 / 20')
  })
})

describe('Textarea edge cases', () => {
  it('disabled and readonly work with a status', () => {
    const t = ta({ status: 'error', disabled: true, readonly: true })
    expect(t.attributes('disabled')).toBeDefined()
    expect(t.attributes('readonly')).toBeDefined()
  })
  it('long text keeps the full-width wrapper', () => {
    const w = m({ modelValue: 'word '.repeat(400), status: 'warning' })
    expect(w.classes()).toContain('w-full')
    expect(w.find('textarea').classes()).toEqual(expect.arrayContaining(['w-full', 'min-w-0']))
  })
  it('the status icon appears and disappears with the prop', async () => {
    const w = m()
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
    await w.setProps({ status: 'success' })
    expect(w.find('[data-slot=field-status]').exists()).toBe(true)
    await w.setProps({ status: 'default' })
    expect(w.find('[data-slot=field-status]').exists()).toBe(false)
  })
})

describe('Textarea variations keep the contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['underline', { variant: 'underline' }],
    ['status error', { status: 'error' }],
    ['xs', { size: 'xs' }],
  ])('a %s Textarea without a name still throws', async (_n, props) => {
    configureStrictMode('throw')
    await mountTree(() => h(Textarea, props as Record<string, unknown>))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Textarea: needs an accessible name')
  })
})
