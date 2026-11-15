import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingCard from './PricingCard.vue'
import { PRICING_CARD_VARIANTS, pricingCardAmountVariants, pricingCardVariants, resolvePricingCardShape, resolvePricingCardSize } from './variants'

const m = (props: Record<string, unknown> = {}) => mount(PricingCard, { props: { name: 'Sample plan', price: '$XX', period: '/month', features: ['Sample feature'], ...props } })
const amount = (w: ReturnType<typeof m>) => w.find('[data-slot="pricing-card-amount"]')

describe('PricingCard size and shape', () => {
  it('defaults keep the original classes and report md / rounded', () => {
    const w = m()
    expect(w.classes().join(' ')).toBe('relative flex flex-col text-card-foreground gap-6 rounded-lg border bg-card p-6')
    expect(amount(w).attributes('class')).toBe('font-bold tracking-tight text-4xl')
    expect([w.attributes('data-size'), w.attributes('data-shape')]).toEqual(['md', 'rounded'])
  })
  it.each(PRICING_CARD_VARIANTS)('%s: the exported cva equals the default output with explicit md and rounded', (variant) => {
    expect(pricingCardVariants({ variant })).toBe(pricingCardVariants({ variant, size: 'md', shape: 'rounded' }))
    expect(pricingCardAmountVariants({ variant })).toBe(pricingCardAmountVariants({ variant, size: 'md' }))
  })
  describe('size', () => {
    it.each([
      ['default', 'sm', 'p-4', 'gap-4', 'text-3xl'],
      ['default', 'lg', 'p-8', 'gap-8', 'text-5xl'],
      ['highlighted', 'sm', 'p-4', 'gap-4', 'text-3xl'],
      ['outline', 'lg', 'p-8', 'gap-8', 'text-5xl'],
      ['compact', 'sm', 'p-3', 'gap-3', 'text-xl'],
      ['compact', 'lg', 'p-6', 'gap-5', 'text-3xl'],
    ] as const)('%s size %s sets %s, %s and the price %s', (variant, size, padding, gap, price) => {
      const w = m({ variant, size })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes()).toEqual(expect.arrayContaining([padding, gap]))
      expect(w.classes().filter((c) => /^p-\d/.test(c))).toEqual([padding])
      expect(w.classes().filter((c) => /^gap-\d/.test(c))).toEqual([gap])
      expect(amount(w).classes()).toContain(price)
      expect(amount(w).classes().filter((c) => /^text-/.test(c))).toEqual([price])
    })
    it('minimal scales its gap, and its padding only once emphasised', () => {
      expect(m({ variant: 'minimal', size: 'sm' }).classes()).toContain('gap-4')
      expect(m({ variant: 'minimal', size: 'lg' }).classes()).toContain('gap-7')
      expect(m({ variant: 'minimal', size: 'lg' }).classes().join(' ')).not.toMatch(/\bp-\d/)
      const emphasised = m({ variant: 'minimal', size: 'lg', highlighted: true })
      expect(emphasised.classes()).toEqual(expect.arrayContaining(['p-8', 'border-primary']))
      expect(emphasised.classes()).not.toContain('p-6')
      expect(m({ variant: 'minimal', size: 'sm', highlighted: true }).classes()).toContain('p-4')
    })
    it('unknown size falls back to md', () => {
      const w = m({ size: 'xl' })
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toContain('p-6')
      expect(resolvePricingCardSize(undefined)).toBe('md')
    })
  })
  describe('shape', () => {
    it.each(['default', 'highlighted', 'outline', 'compact'] as const)('%s: square removes the radius', (variant) => {
      const w = m({ variant, shape: 'square' })
      expect(w.attributes('data-shape')).toBe('square')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
    })
    it('square also wins over the frame an emphasised minimal card gains; minimal alone has no radius', () => {
      expect(m({ variant: 'minimal' }).classes().join(' ')).not.toMatch(/rounded/)
      const w = m({ variant: 'minimal', highlighted: true, shape: 'square' })
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
    })
    it('unknown shape falls back to rounded', () => {
      expect(m({ shape: 'pill' }).classes()).toContain('rounded-lg')
      expect(resolvePricingCardShape(3)).toBe('rounded')
    })
  })
  describe('combinations, override and contracts', () => {
    it('size, shape and highlight do not conflict; class wins', () => {
      const w = m({ size: 'lg', shape: 'square', highlighted: true })
      expect(w.classes()).toEqual(expect.arrayContaining(['p-8', 'rounded-none', 'border-primary', 'ring-1', 'ring-primary']))
      const o = m({ size: 'lg', shape: 'square', class: 'p-1 rounded-md' })
      expect(o.classes()).toEqual(expect.arrayContaining(['p-1', 'rounded-md']))
      expect(o.classes()).not.toContain('p-8')
      expect(o.classes()).not.toContain('rounded-none')
    })
    it.each(['sm', 'lg'] as const)('size %s keeps the plan heading, the price and the feature list', (size) => {
      const w = m({ size, level: 2 })
      expect(w.find('h2').text()).toBe('Sample plan')
      expect(amount(w).text()).toBe('$XX')
      expect(w.findAll('[data-slot="pricing-card-feature"]')).toHaveLength(1)
    })
  })
})
