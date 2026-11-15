import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingGrid from './PricingGrid.vue'
import { PRICING_CARD_VARIANTS } from '../PricingCard/variants'

const plans = [
  { name: 'Plan A', price: '$0', features: ['One'] },
  { name: 'Plan B', price: '$5', features: ['Two'], yearlyPrice: '$50' },
]

describe('PricingGrid variant', () => {
  it('exposes the resolved card variant as data-variant (default when omitted)', () => {
    expect(mount(PricingGrid, { props: { plans } }).attributes('data-variant')).toBe('default')
  })
  it.each(PRICING_CARD_VARIANTS)('variant %s reaches every generated card and the root', (variant) => {
    const w = mount(PricingGrid, { props: { plans, variant } })
    expect(w.attributes('data-variant')).toBe(variant)
    expect(w.findAll('[data-slot="pricing-card"]').map((c) => c.attributes('data-variant'))).toEqual([variant, variant])
  })
  it('is on the wrapper when the billing toggle is shown', () => {
    const w = mount(PricingGrid, { props: { plans, variant: 'compact', showToggle: true } })
    expect(w.attributes('data-variant')).toBe('compact')
    expect(w.find('[data-slot="pricing-grid-items"]').exists()).toBe(true)
  })
  it('reports the setting for slot cards too, and falls back for unknown values', () => {
    expect(mount(PricingGrid, { props: { variant: 'minimal' }, slots: { default: '<div>x</div>' } }).attributes('data-variant')).toBe('minimal')
    expect(mount(PricingGrid, { props: { plans, variant: 'nope' as 'minimal' } }).attributes('data-variant')).toBe('default')
  })
  it('a plan own variant still wins over the grid variant', () => {
    const w = mount(PricingGrid, { props: { plans: [{ ...plans[0], variant: 'outline' as const }, plans[1]], variant: 'minimal' } })
    expect(w.findAll('[data-slot="pricing-card"]').map((c) => c.attributes('data-variant'))).toEqual(['outline', 'minimal'])
  })
})

describe('PricingGrid size and shape', () => {
  const cards = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="pricing-card"]')
  it('defaults report md / rounded and pass them to the cards', () => {
    const w = mount(PricingGrid, { props: { plans } })
    expect([w.attributes('data-size'), w.attributes('data-shape')]).toEqual(['md', 'rounded'])
    expect(cards(w).map((c) => c.attributes('data-size'))).toEqual(['md', 'md'])
  })
  it('size and shape reach every generated card and the root', () => {
    const w = mount(PricingGrid, { props: { plans, size: 'lg', shape: 'square' } })
    expect([w.attributes('data-size'), w.attributes('data-shape')]).toEqual(['lg', 'square'])
    for (const c of cards(w)) expect(c.classes()).toEqual(expect.arrayContaining(['p-8', 'rounded-none']))
  })
  it('is on the wrapper with the billing toggle, and a plan own size wins', () => {
    const w = mount(PricingGrid, { props: { plans: [{ ...plans[0], size: 'sm' as const }, plans[1]], size: 'lg', showToggle: true } })
    expect(w.attributes('data-size')).toBe('lg')
    expect(cards(w).map((c) => c.attributes('data-size'))).toEqual(['sm', 'lg'])
  })
  it('unknown values fall back; slot content still reports the grid setting', () => {
    const w = mount(PricingGrid, { props: { plans, size: 'x' as 'sm', shape: 'x' as 'square' } })
    expect([w.attributes('data-size'), w.attributes('data-shape')]).toEqual(['md', 'rounded'])
    expect(mount(PricingGrid, { props: { size: 'sm' }, slots: { default: '<div>x</div>' } }).attributes('data-size')).toBe('sm')
  })
})
