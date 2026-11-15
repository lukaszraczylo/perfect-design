import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingCard from './PricingCard.vue'
import { PRICING_CARD_VARIANTS, pricingCardAmountVariants, pricingCardFeaturesVariants, pricingCardVariants, resolvePricingCardVariant } from './variants'
import { hasAmount, normalizeBilling, resolvePrice } from './pricing'

describe('PricingCard slop regressions', () => {
  it.each(['default', 'highlighted', 'outline', 'minimal', 'compact'] as const)('%s: no shadow, glow, coloured ring or xl radius', (variant) => {
    for (const highlighted of [false, true]) {
      const w = mount(PricingCard, { props: { name: 'Sample plan', price: 'Price', variant, highlighted } })
      expect(w.classes().join(' ')).not.toMatch(/shadow|ring-primary\/|ring-2|rounded-(xl|2xl|3xl)/)
    }
  })
  it('the emphasised card keeps a solid primary border (visible in forced-colors mode)', () => {
    const w = mount(PricingCard, { props: { name: 'Sample plan', highlighted: true, badge: 'Recommended' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['border-primary', 'ring-1', 'ring-primary']))
    expect(w.find('[data-slot="pricing-card-badge"]').text()).toBe('Recommended')
  })
})

describe('PricingCard', () => {
  describe('good path', () => {
    it('renders name, price, period, description, features and cta', () => {
      const w = mount(PricingCard, {
        props: { name: 'Pro', price: '$29', period: '/month', description: 'For teams', features: ['A', 'B'] },
        slots: { cta: '<button>Buy</button>' },
      })
      expect(w.element.tagName).toBe('ARTICLE')
      expect(w.attributes('data-slot')).toBe('pricing-card')
      expect(w.find('h3').text()).toBe('Pro')
      expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('$29')
      expect(w.find('[data-slot="pricing-card-period"]').text()).toBe('/month')
      expect(w.find('[data-slot="pricing-card-description"]').text()).toBe('For teams')
      expect(w.findAll('[data-slot="pricing-card-feature"]')).toHaveLength(2)
      expect(w.find('[data-slot="pricing-card-feature"] svg').exists()).toBe(true)
      expect(w.find('[data-slot="pricing-card-cta"] button').exists()).toBe(true)
    })
    it('highlighted adds data attribute and emphasis', () => {
      const w = mount(PricingCard, { props: { highlighted: true, badge: 'Popular' } })
      expect(w.attributes('data-highlighted')).toBeDefined()
      expect(w.classes()).toContain('border-primary')
      expect(w.find('[data-slot="pricing-card-badge"]').text()).toBe('Popular')
      expect(mount(PricingCard).attributes('data-highlighted')).toBeUndefined()
    })
    it('excluded features are marked and announced', () => {
      const w = mount(PricingCard, { props: { features: ['In', { label: 'Out', included: false }, { label: 'Obj' }] } })
      const rows = w.findAll('[data-slot="pricing-card-feature"]')
      expect(rows.map((r) => r.attributes('data-included'))).toEqual(['true', 'false', 'true'])
      expect(rows[1].find('.sr-only').text()).toBe('(Not included)')
      expect(rows[1].find('.line-through').exists()).toBe(true)
      expect(rows[0].find('.sr-only').exists()).toBe(false)
    })
    it('slots override name and price; default slot renders', () => {
      const w = mount(PricingCard, { slots: { name: '<b>N</b>', price: '<i>P</i>', default: '<p id="x"/>' } })
      expect(w.find('b').exists() && w.find('i').exists() && w.find('#x').exists()).toBe(true)
    })
  })
  describe('customisation', () => {
    it('merges class and attrs', () => {
      const w = mount(PricingCard, { props: { class: 'p-2 custom' }, attrs: { role: 'listitem' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('p-6')
      expect(w.attributes('role')).toBe('listitem')
    })
    it('custom heading level and excluded label', () => {
      const w = mount(PricingCard, { props: { name: 'x', level: 2, excludedLabel: 'Nein', features: [{ label: 'a', included: false }] } })
      expect(w.find('h2').exists()).toBe(true)
      expect(w.find('.sr-only').text()).toBe('(Nein)')
    })
  })
  describe('bad path', () => {
    it('empty card has no price, no features, no cta', () => {
      const w = mount(PricingCard)
      for (const part of ['price', 'features', 'cta', 'badge', 'name']) expect(w.find(`[data-slot="pricing-card-${part}"]`).exists()).toBe(false)
    })
    it('ignores empty or malformed features', () => {
      // @ts-expect-error deliberately invalid entries
      const w = mount(PricingCard, { props: { features: ['', null, { nolabel: 1 }, 'ok'] } })
      expect(w.findAll('[data-slot="pricing-card-feature"]')).toHaveLength(1)
    })
    it('price 0 is still shown, empty string is not', () => {
      expect(mount(PricingCard, { props: { price: 0 } }).find('[data-slot="pricing-card-amount"]').text()).toBe('0')
      expect(mount(PricingCard, { props: { price: '' } }).find('[data-slot="pricing-card-price"]').exists()).toBe(false)
    })
    it('price without period omits the period', () => {
      expect(mount(PricingCard, { props: { price: 'Free' } }).find('[data-slot="pricing-card-period"]').exists()).toBe(false)
    })
    it('invalid level falls back to h3', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(PricingCard, { props: { name: 'x', level: 10 } }).find('h3').exists()).toBe(true)
    })
  })
  describe('edge cases', () => {
    it('100 features, long and unicode text', () => {
      const many = Array.from({ length: 100 }, (_, i) => `Feature ${i}`)
      expect(mount(PricingCard, { props: { features: many } }).findAll('li')).toHaveLength(100)
      const w = mount(PricingCard, { props: { name: '名'.repeat(500), price: '€1.000,00', features: ['🎉'.repeat(100)] } })
      expect(w.find('h3').text()).toHaveLength(500)
    })
    it('duplicate feature labels', () => {
      expect(mount(PricingCard, { props: { features: ['x', 'x'] } }).findAll('li')).toHaveLength(2)
    })
  })

  describe('variants', () => {
    const base = { name: 'Pro', price: '$29', period: '/mo', features: ['A', { label: 'B', included: false }] }
    it('defaults to the default variant', () => {
      const w = mount(PricingCard, { props: base })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'p-6']))
      expect(w.attributes('data-highlighted')).toBeUndefined()
    })
    const expectations: Record<string, string[]> = {
      default: ['bg-card', 'gap-6'],
      highlighted: ['border-primary', 'ring-1', 'ring-primary'],
      outline: ['border-2', 'bg-transparent'],
      minimal: ['gap-5', 'py-2'],
      compact: ['p-4', 'text-sm'],
    }
    it.each(PRICING_CARD_VARIANTS)('variant %s renders all parts', (variant) => {
      const w = mount(PricingCard, { props: { ...base, variant }, slots: { cta: '<button>Go</button>' } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.classes()).toEqual(expect.arrayContaining(expectations[variant]))
      expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('$29')
      expect(w.findAll('[data-slot="pricing-card-feature"]')).toHaveLength(2)
      expect(w.find('[data-slot="pricing-card-cta"] button').exists()).toBe(true)
      expect(pricingCardVariants({ variant })).toContain(expectations[variant][0])
    })
    it('variant="highlighted" equals highlighted prop', () => {
      const a = mount(PricingCard, { props: { ...base, variant: 'highlighted' } })
      const b = mount(PricingCard, { props: { ...base, highlighted: true } })
      expect(a.attributes('data-highlighted')).toBeDefined()
      expect(a.classes().sort()).toEqual(b.classes().sort().filter((c) => c))
    })
    it('highlighted prop overlays any variant', () => {
      for (const variant of ['outline', 'compact', 'minimal'] as const) {
        const w = mount(PricingCard, { props: { variant, highlighted: true } })
        expect(w.classes()).toContain('border-primary')
        expect(w.attributes('data-highlighted')).toBeDefined()
      }
      const m = mount(PricingCard, { props: { variant: 'minimal', highlighted: true } })
      expect(m.classes()).toEqual(expect.arrayContaining(['border', 'rounded-lg', 'p-6']))
    })
    it('compact uses smaller amount and tighter features', () => {
      const w = mount(PricingCard, { props: { ...base, variant: 'compact' } })
      expect(w.find('[data-slot="pricing-card-amount"]').classes()).toContain('text-2xl')
      expect(w.find('[data-slot="pricing-card-features"]').classes()).toContain('gap-1.5')
      expect(mount(PricingCard, { props: base }).find('[data-slot="pricing-card-amount"]').classes()).toContain('text-4xl')
      expect(pricingCardAmountVariants({ variant: 'compact' })).toContain('text-2xl')
      expect(pricingCardFeaturesVariants({ variant: 'compact' })).toContain('text-xs')
    })
    it('variant classes are overridable via class', () => {
      const w = mount(PricingCard, { props: { variant: 'outline', class: 'border-4 bg-muted' } })
      expect(w.classes()).toContain('border-4')
      expect(w.classes()).toContain('bg-muted')
      expect(w.classes()).not.toContain('border-2')
      expect(w.classes()).not.toContain('bg-transparent')
    })
  })
  describe('yearly pricing', () => {
    const plan = { name: 'Pro', price: '$29', period: '/month', yearlyPrice: '$24', yearlyPeriod: '/month, billed yearly', yearlyNote: 'Billed $290 yearly' }
    it('shows the monthly price by default', () => {
      const w = mount(PricingCard, { props: plan })
      expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('$29')
      expect(w.find('[data-slot="pricing-card-period"]').text()).toBe('/month')
      expect(w.find('[data-slot="pricing-card-note"]').exists()).toBe(false)
      expect(w.find('[data-slot="pricing-card-price"]').attributes('data-billing')).toBe('monthly')
    })
    it('switches to yearly price, period and note', async () => {
      const w = mount(PricingCard, { props: { ...plan, billing: 'yearly' } })
      expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('$24')
      expect(w.find('[data-slot="pricing-card-period"]').text()).toBe('/month, billed yearly')
      expect(w.find('[data-slot="pricing-card-note"]').text()).toBe('Billed $290 yearly')
      expect(w.find('[data-slot="pricing-card-price"]').attributes('data-billing')).toBe('yearly')
      await w.setProps({ billing: 'monthly' })
      expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('$29')
    })
    it('yearly period falls back to period; yearly price 0 is valid', () => {
      const w = mount(PricingCard, { props: { price: '$9', period: '/mo', yearlyPrice: 0, billing: 'yearly' } })
      expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('0')
      expect(w.find('[data-slot="pricing-card-period"]').text()).toBe('/mo')
    })
    it('plans without a yearly price keep their price in yearly mode', () => {
      const w = mount(PricingCard, { props: { price: 'Free', billing: 'yearly', yearlyNote: 'ignored' } })
      expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('Free')
      expect(w.find('[data-slot="pricing-card-note"]').exists()).toBe(false)
      expect(w.find('[data-slot="pricing-card-price"]').attributes('data-billing')).toBe('monthly')
    })
    it('unknown billing means monthly', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(PricingCard, { props: { ...plan, billing: 'weekly' } })
      expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('$29')
    })
    it('empty / NaN yearly price is ignored', () => {
      expect(mount(PricingCard, { props: { price: '$5', yearlyPrice: '', billing: 'yearly' } }).find('[data-slot="pricing-card-amount"]').text()).toBe('$5')
      expect(mount(PricingCard, { props: { price: '$5', yearlyPrice: NaN, billing: 'yearly' } }).find('[data-slot="pricing-card-amount"]').text()).toBe('$5')
    })
    it('price slot receives the resolved values', () => {
      const w = mount(PricingCard, {
        props: { ...plan, billing: 'yearly' },
        slots: { price: '<template #price="{ price, period, billing, yearly }"><b>{{ price }}|{{ period }}|{{ billing }}|{{ yearly }}</b></template>' },
      })
      expect(w.find('b').text()).toBe('$24|/month, billed yearly|yearly|true')
    })
    it('helpers', () => {
      expect(normalizeBilling('yearly')).toBe('yearly')
      expect(normalizeBilling('x')).toBe('monthly')
      expect(normalizeBilling('x', 'yearly')).toBe('yearly')
      expect(hasAmount(0)).toBe(true)
      expect(hasAmount('')).toBe(false)
      expect(hasAmount(null)).toBe(false)
      expect(hasAmount(NaN)).toBe(false)
      expect(resolvePrice({}, 'yearly')).toEqual({ amount: undefined, period: undefined, yearly: false })
      expect(resolvePrice({ price: 5, period: '' }, 'monthly')).toEqual({ amount: 5, period: undefined, yearly: false })
    })
  })
  describe('variants: bad path and edge cases', () => {
    it('unknown variant falls back to default', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(PricingCard, { props: { name: 'x', variant: 'neon' } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.classes()).toContain('bg-card')
      for (const v of [undefined, null, 3, 'HIGHLIGHTED']) expect(resolvePricingCardVariant(v)).toBe('default')
      expect(resolvePricingCardVariant('compact')).toBe('compact')
    })
    it('every variant renders an empty card safely', () => {
      for (const variant of PRICING_CARD_VARIANTS) {
        const w = mount(PricingCard, { props: { variant, features: [] } })
        expect(w.find('[data-slot="pricing-card-features"]').exists()).toBe(false)
      }
    })
    it('long text, unicode and 100 features in every variant', () => {
      const many = Array.from({ length: 100 }, (_, i) => `F${i}`)
      for (const variant of PRICING_CARD_VARIANTS) {
        const w = mount(PricingCard, { props: { variant, name: '名'.repeat(300), price: '€1.000,00', yearlyPrice: '€9.999,00', billing: 'yearly', features: many } })
        expect(w.findAll('li')).toHaveLength(100)
        expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('€9.999,00')
      }
    })
    it('rapidly toggling billing and variant ends in a consistent state, unmount is safe', async () => {
      const w = mount(PricingCard, { props: { price: '$1', yearlyPrice: '$2' } })
      for (let i = 0; i < 50; i++) await w.setProps({ billing: i % 2 ? 'monthly' : 'yearly', variant: PRICING_CARD_VARIANTS[i % 5] })
      expect(w.find('[data-slot="pricing-card-amount"]').text()).toBe('$1')
      expect(() => w.unmount()).not.toThrow()
    })
  })
})
