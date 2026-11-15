import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { FIELDS, ITEMS, mountBar, q, qa, slot } from './testing'
import FilterChip from './FilterChip.vue'
import { FILTER_BAR_SIZES, FILTER_BAR_VARIANTS, filterBarListVariants, filterBarVariants, filterChipRemoveVariants, filterChipVariants } from './index'
import { normalizeFilterSize, normalizeFilterVariant } from './variants'

const set = (el: Element | null) => new Set((el?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean))
const has = (el: Element | null, ...classes: string[]) => classes.forEach((c) => expect(set(el).has(c), c).toBe(true))
const lacks = (el: Element | null, ...classes: string[]) => classes.forEach((c) => expect(set(el).has(c), c).toBe(false))
const root = () => slot('filter-bar')
const chip = () => q('[data-slot="filter-chip"]')

describe('FilterBar variations', () => {
  describe('defaults', () => {
    it('renders the default look', () => {
      mountBar({ modelValue: ITEMS() })
      has(root(), 'flex', 'w-full', 'min-w-0', 'flex-wrap', 'items-center', 'gap-2', 'text-sm')
      expect(root()!.getAttribute('data-variant')).toBe('default')
      expect(root()!.getAttribute('data-size')).toBe('md')
      has(slot('filter-bar-list'), 'flex', 'flex-wrap', 'gap-2', 'max-w-full', 'min-w-0')
      has(chip(), 'inline-flex', 'max-w-full', 'border', 'rounded-md', 'border-border', 'bg-muted', 'ps-2.5', 'pe-0.5', 'text-foreground', 'text-sm')
      has(slot('filter-bar-add'), 'border', 'h-8', 'pointer-coarse:min-h-11')
      has(slot('filter-bar-clear'), 'h-8', 'hover:bg-accent')
    })
    it('the exported variants match the rendered default', () => {
      mountBar({ modelValue: ITEMS() })
      expect(set(root())).toEqual(new Set(filterBarVariants().split(/\s+/)))
      expect(set(slot('filter-bar-list'))).toEqual(new Set(filterBarListVariants().split(/\s+/)))
      const expected = new Set(filterChipVariants().split(/\s+/))
      for (const c of expected) expect(set(chip()).has(c), c).toBe(true)
    })
  })

  describe('variant', () => {
    it('compact tightens gaps, padding and corners', () => {
      mountBar({ modelValue: ITEMS(), variant: 'compact' })
      has(root(), 'gap-1')
      lacks(root(), 'gap-2')
      has(slot('filter-bar-list'), 'gap-1')
      has(chip(), 'gap-0.5', 'rounded-sm', 'ps-1.5', 'bg-muted', 'border-border')
      lacks(chip(), 'rounded-md', 'ps-2.5')
      expect(root()!.getAttribute('data-variant')).toBe('compact')
      // ghost buttons, no border
      lacks(slot('filter-bar-add'), 'border')
      has(slot('filter-bar-add'), 'hover:bg-accent')
    })
    it('inline is flat with a bottom rule and link-style buttons', () => {
      mountBar({ modelValue: ITEMS(), variant: 'inline' })
      has(root(), 'gap-x-3', 'gap-y-1')
      has(chip(), 'border-0', 'border-b', 'rounded-none', 'bg-transparent', 'ps-0', 'forced-colors:border-b-[ButtonText]')
      lacks(chip(), 'bg-muted', 'rounded-md')
      has(slot('filter-bar-add'), 'text-primary', 'hover:underline')
      has(slot('filter-bar-clear'), 'text-primary')
    })
    it.each([...FILTER_BAR_VARIANTS])('%s keeps the 44px touch height on the buttons and a 24px remove button', (variant) => {
      mountBar({ modelValue: ITEMS(), variant })
      has(slot('filter-bar-add'), 'pointer-coarse:min-h-11')
      has(slot('filter-bar-clear'), 'pointer-coarse:min-h-11')
      has(q('[data-slot="filter-chip-remove"]'), 'size-6', 'pointer-coarse:size-8')
    })
    it.each(['wide', '', null, 3, undefined])('an unknown variant (%s) falls back to default', (variant) => {
      mountBar({ modelValue: ITEMS(), variant })
      has(root(), 'gap-2')
      has(chip(), 'rounded-md', 'ps-2.5')
      expect(root()!.getAttribute('data-variant')).toBe('default')
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'text-xs', 'h-6'],
      ['md', 'text-sm', 'h-8'],
      ['lg', 'text-base', 'h-9'],
    ])('%s sets %s on the text and %s on the buttons', (size, text, height) => {
      mountBar({ modelValue: ITEMS(), size })
      has(root(), text)
      has(chip(), text)
      has(slot('filter-bar-add'), height)
      has(slot('filter-bar-clear'), height)
      expect(root()!.getAttribute('data-size')).toBe(size)
    })
    it('an unknown size falls back to md', () => {
      mountBar({ modelValue: ITEMS(), size: 'huge' })
      has(root(), 'text-sm')
      has(chip(), 'text-sm')
      expect(root()!.getAttribute('data-size')).toBe('md')
    })
    it('xs buttons keep 24px', () => {
      mountBar({ modelValue: ITEMS(), size: 'sm' })
      has(slot('filter-bar-add'), 'h-6', 'pointer-coarse:min-h-11')
    })
  })

  describe('two dimensions together', () => {
    it.each(FILTER_BAR_VARIANTS.flatMap((v) => FILTER_BAR_SIZES.map((s) => [v, s] as const)))('%s + %s', (variant, size) => {
      mountBar({ modelValue: ITEMS(), variant, size })
      expect(root()!.getAttribute('data-variant')).toBe(variant)
      expect(root()!.getAttribute('data-size')).toBe(size)
      expect(chip()!.getAttribute('data-variant')).toBe(variant)
      expect(qa('[data-slot="filter-chip"]')).toHaveLength(3)
    })
    it('every combination renders a different root class string per dimension', () => {
      const seen = new Set<string>()
      for (const v of FILTER_BAR_VARIANTS) for (const s of FILTER_BAR_SIZES) seen.add(filterBarVariants({ variant: v, size: s }))
      expect(seen.size).toBe(9)
    })
  })

  describe('class and accessibility', () => {
    it('class wins over variant classes on the bar', () => {
      mountBar({ variant: 'compact', class: 'gap-6 text-base' })
      has(root(), 'gap-6', 'text-base')
      lacks(root(), 'gap-1', 'text-sm')
    })
    it('uses logical properties only', () => {
      mountBar({ modelValue: ITEMS(), variant: 'inline' })
      const all = [...document.body.querySelectorAll('[class]')].map((e) => e.getAttribute('class')).join(' ')
      expect(all).not.toMatch(/(^|\s)(ml|mr|pl|pr|left|right|text-left|text-right|border-l|border-r|rounded-l|rounded-r)(-|\s|$)/)
    })
    it('every variant has a forced-colors safe boundary: a border or a focus outline', () => {
      for (const v of FILTER_BAR_VARIANTS) {
        mountBar({ modelValue: ITEMS(), variant: v })
        expect(set(chip()).has(v === 'inline' ? 'border-b' : 'border')).toBe(true)
        has(q('[data-slot="filter-chip-remove"]'), 'outline-hidden', 'focus-visible:ring-3', 'forced-colors:hover:outline')
        document.body.innerHTML = ''
      }
    })
    it('the chip text wraps instead of truncating', () => {
      mountBar({ modelValue: ITEMS() })
      has(q('[data-slot="filter-chip-label"]'), 'break-words', 'min-w-0')
      lacks(q('[data-slot="filter-chip-label"]'), 'truncate')
    })
  })

  describe('normalizers and exports', () => {
    it('normalise unknown values', () => {
      expect(normalizeFilterVariant('x')).toBe('default')
      expect(normalizeFilterVariant('inline')).toBe('inline')
      expect(normalizeFilterSize('x')).toBe('md')
      expect(normalizeFilterSize('lg')).toBe('lg')
    })
    it('the variants can style plain elements', () => {
      expect(filterChipVariants({ variant: 'inline', size: 'lg' })).toContain('border-b')
      expect(filterChipRemoveVariants()).toContain('size-6')
    })
  })

  describe('FilterChip variants', () => {
    it.each([...FILTER_BAR_VARIANTS])('renders %s', (variant) => {
      const w = mount(FilterChip, { props: { label: 'Status is Open', variant } })
      expect(w.attributes('data-variant')).toBe(variant)
    })
    it('falls back for unknown values and class wins', () => {
      const w = mount(FilterChip, { props: { label: 'x', variant: 'nope' as never, size: 'nope' as never, class: 'rounded-full text-lg' } })
      has(w.element, 'rounded-full', 'text-lg', 'bg-muted')
      lacks(w.element, 'rounded-md', 'text-sm')
      expect(w.attributes('data-variant')).toBe('default')
    })
  })
})

void FIELDS
