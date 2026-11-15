import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldStatusIcon from './FieldStatusIcon.vue'
import {
  FIELD_SHAPES,
  FIELD_SIZES,
  FIELD_STATUSES,
  FIELD_VARIANTS,
  fieldLookClasses,
  fieldVariants,
  normalizeFieldSize,
  normalizeShape,
  normalizeStatus,
  normalizeVariant,
} from './field-variants'
import { CONTROL_SIZES } from './field-styles'

describe('shared text-field fragments', () => {
  it('lists the documented values', () => {
    expect(FIELD_VARIANTS).toEqual(['outline', 'filled', 'underline', 'ghost'])
    expect(FIELD_SHAPES).toEqual(['rounded', 'pill', 'square'])
    expect(FIELD_STATUSES).toEqual(['default', 'success', 'warning', 'error'])
    expect(FIELD_SIZES).toEqual(['xs', 'sm', 'md', 'lg'])
  })
  it('fieldVariants() at the defaults is the class string Input has always rendered', () => {
    expect(fieldVariants()).toBe(
      'w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 py-1 h-9 text-md md:text-base pointer-coarse:min-h-11 forced-colors:aria-invalid:border-dashed',
    )
    for (const size of ['sm', 'md', 'lg'] as const) expect(fieldVariants({ size })).toContain(CONTROL_SIZES[size])
  })
  it('fieldVariants covers every value of every dimension', () => {
    expect(fieldVariants({ size: 'xs' })).toContain('h-7')
    expect(fieldVariants({ variant: 'filled' })).toContain('bg-muted')
    expect(fieldVariants({ variant: 'underline', shape: 'pill' })).toContain('rounded-none px-0')
    expect(fieldVariants({ shape: 'pill' })).toContain('rounded-full')
    expect(fieldVariants({ status: 'error' })).toContain('border-destructive')
    expect(fieldVariants({ class: 'extra' })).toMatch(/extra$/)
  })
  it('fieldLookClasses is empty at the defaults and picks the multiline pill radius', () => {
    expect(fieldLookClasses()).toBe('')
    expect(fieldLookClasses({ variant: 'outline', shape: 'rounded', status: 'default' })).toBe('')
    expect(fieldLookClasses({ shape: 'pill' })).toContain('rounded-full')
    expect(fieldLookClasses({ shape: 'pill', multiline: true })).toContain('rounded-xl')
    expect(fieldLookClasses({ variant: 'underline', shape: 'pill' })).not.toContain('rounded-full')
    expect(fieldLookClasses({ status: 'warning' })).toContain('border-warning-foreground')
  })
  it('normalizers fall back for unknown, null and inherited keys', () => {
    for (const bad of ['x', null, undefined, 3, 'toString']) {
      expect(normalizeVariant(bad)).toBe('outline')
      expect(normalizeShape(bad)).toBe('rounded')
      expect(normalizeStatus(bad)).toBe('default')
      expect(normalizeFieldSize(bad)).toBe('md')
    }
    expect(normalizeVariant('ghost')).toBe('ghost')
    expect(normalizeShape('square')).toBe('square')
    expect(normalizeStatus('warning')).toBe('warning')
    expect(normalizeFieldSize('xs')).toBe('xs')
  })
})

describe('FieldStatusIcon', () => {
  it('renders nothing for default and unknown', () => {
    expect(mount(FieldStatusIcon).find('[data-slot="field-status"]').exists()).toBe(false)
    expect(mount(FieldStatusIcon, { props: { status: 'x' as never } }).find('[data-slot="field-status"]').exists()).toBe(false)
  })
  it.each([
    ['success', 'text-success', 'Valid'],
    ['warning', 'text-warning-foreground', 'Warning'],
  ])('%s: decorative icon, hidden text with the given id', (status, color, text) => {
    const w = mount(FieldStatusIcon, { props: { status: status as never, id: 'sid' } })
    expect(w.attributes('data-status')).toBe(status)
    expect(w.classes()).toContain(color)
    expect(w.classes()).toEqual(expect.arrayContaining(['pointer-events-none', 'absolute', 'end-2.5']))
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.find('.sr-only').attributes('id')).toBe('sid')
    expect(w.find('.sr-only').text()).toBe(text)
  })
  it('error has no hidden text; label overrides; class wins', () => {
    const e = mount(FieldStatusIcon, { props: { status: 'error', class: 'end-10' } })
    expect(e.find('.sr-only').exists()).toBe(false)
    expect(e.classes()).toContain('text-destructive')
    expect(e.classes()).toContain('end-10')
    expect(e.classes()).not.toContain('end-2.5')
    expect(mount(FieldStatusIcon, { props: { status: 'success', label: 'Gueltig' } }).find('.sr-only').text()).toBe('Gueltig')
  })
})
