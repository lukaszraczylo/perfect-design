import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CtaBand from './CtaBand.vue'
import { ctaBandHeadlineVariants, ctaBandVariantNames, ctaBandVariants, resolveCtaBandShape, resolveCtaBandSize } from './variants'

const m = (props: Record<string, unknown> = {}) => mount(CtaBand, { props: { headline: 'Open the catalogue', ...props }, slots: { actions: '<a href="/x">Open</a>' } })
const headline = (w: ReturnType<typeof m>) => w.find('[data-slot="cta-band-headline"]')

describe('CtaBand size and shape', () => {
  it('defaults keep the original classes and report md / rounded', () => {
    const w = m()
    expect(w.classes().join(' ')).toBe('rounded-lg px-6 py-12 sm:px-12 sm:py-16 bg-primary text-primary-foreground')
    expect(headline(w).attributes('class')).toBe('text-balance break-words font-semibold tracking-tight text-3xl sm:text-4xl')
    expect([w.attributes('data-size'), w.attributes('data-shape')]).toEqual(['md', 'rounded'])
  })
  it.each(ctaBandVariantNames)('%s: exported cva equals the default output with explicit md and rounded', (variant) => {
    expect(ctaBandVariants({ variant })).toBe(ctaBandVariants({ variant, size: 'md', shape: 'rounded' }))
    expect(ctaBandHeadlineVariants({ variant })).toBe(ctaBandHeadlineVariants({ variant, size: 'md' }))
  })
  describe('size', () => {
    it.each([
      ['band', 'sm', 'py-10', 'py-16'],
      ['band', 'lg', 'py-24', 'py-16'],
      ['card', 'sm', 'py-8', 'py-12'],
      ['card', 'lg', 'py-16', 'py-12'],
      ['newsletter', 'sm', 'py-8', 'py-12'],
      ['split', 'sm', 'py-8', 'py-10'],
      ['split', 'lg', 'py-14', 'py-10'],
      ['inline', 'sm', 'py-3', 'py-4'],
      ['inline', 'lg', 'py-6', 'py-4'],
    ] as const)('%s size %s uses %s instead of %s', (variant, size, wanted, replaced) => {
      const w = m({ variant, size })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes()).toContain(wanted)
      expect(w.classes()).not.toContain(replaced)
      expect(w.classes().filter((c) => /^py-/.test(c))).toHaveLength(1)
    })
    it('headline scales with size in every layout', () => {
      expect(headline(m({ size: 'sm' })).classes()).toEqual(expect.arrayContaining(['text-2xl', 'sm:text-3xl']))
      expect(headline(m({ size: 'lg' })).classes()).toEqual(expect.arrayContaining(['text-4xl', 'sm:text-5xl']))
      expect(headline(m({ size: 'lg' })).classes()).not.toContain('text-3xl')
      expect(headline(m({ variant: 'inline', size: 'sm' })).classes()).toContain('text-base')
      expect(headline(m({ variant: 'inline', size: 'lg' })).classes()).toContain('text-xl')
      expect(headline(m({ variant: 'split', size: 'lg' })).classes()).toContain('lg:col-start-1')
    })
    it('unknown size falls back to md', () => {
      const w = m({ size: 'xxl' })
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toContain('py-12')
      expect(resolveCtaBandSize(null)).toBe('md')
    })
  })
  describe('shape', () => {
    it.each(['card', 'split', 'inline', 'newsletter'] as const)('%s: square removes the radius', (variant) => {
      const w = m({ variant, shape: 'square' })
      expect(w.attributes('data-shape')).toBe('square')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
    })
    it('band has no radius either way; unknown shape falls back', () => {
      expect(m({ variant: 'band' }).classes().join(' ')).not.toMatch(/rounded/)
      expect(m({ shape: 'pill' }).classes()).toContain('rounded-lg')
      expect(resolveCtaBandShape(undefined)).toBe('rounded')
    })
  })
  describe('combinations, override and contracts', () => {
    it('size, shape and tone do not conflict; class wins', () => {
      const w = m({ size: 'lg', shape: 'square', tone: 'inverted', variant: 'card' })
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background', 'py-16', 'rounded-none']))
      const o = m({ size: 'lg', shape: 'square', class: 'py-2 rounded-md' })
      expect(o.classes()).toEqual(expect.arrayContaining(['py-2', 'rounded-md']))
      expect(o.classes()).not.toContain('py-16')
      expect(o.classes()).not.toContain('rounded-none')
    })
    it.each(['sm', 'lg'] as const)('size %s keeps the heading level and the action link', (size) => {
      const w = m({ size, level: 3 })
      expect(w.find('h3').text()).toBe('Open the catalogue')
      expect(w.find('[data-slot="cta-band-actions"] a').attributes('href')).toBe('/x')
    })
  })
})
