import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { TieredPricing, tieredPricingVariants } from './index'
import * as barrel from '../index'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'

const TIERS = [
  { upTo: 1000, rate: 0.5 },
  { upTo: 10000, rate: 0.4 },
  { upTo: null, rate: 0.3 },
]
const mountTiers = (props: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
  mount(TieredPricing, { props: { tiers: TIERS, caption: 'Sample tiers', ...props } as never, ...extra })
const rows = (w: ReturnType<typeof mountTiers>) => w.findAll('[data-slot=tiered-pricing-tier]')

describe('TieredPricing good path', () => {
  it('renders a named table in a focusable scroll region', () => {
    const w = mountTiers({ unit: 'requests' })
    expect(w.attributes('data-slot')).toBe('tiered-pricing')
    const region = w.find('[data-slot=tiered-pricing-scroll]')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.attributes('aria-label')).toBe('Sample tiers')
    expect(w.find('caption').text()).toBe('Sample tiers')
    expect(w.findAll('th[scope=col]').map((t) => t.text())).toEqual(['Usage (requests)', 'Rate per unit'])
    expect(rows(w)).toHaveLength(3)
  })
  it('exports from the marketing barrel', () => expect(barrel.TieredPricing).toBe(TieredPricing))
  it('labels the ranges', () => {
    const w = mountTiers()
    expect(w.findAll('[data-slot=tiered-pricing-range]').map((r) => r.text())).toEqual(['Up to 1,000', 'Over 1,000 to 10,000', 'Over 10,000'])
  })
  it('formats rates', () => {
    expect(mountTiers().findAll('[data-slot=tiered-pricing-rate]').map((r) => r.text())).toEqual(['$0.50', '$0.40', '$0.30'])
  })
  it('explains the mode', () => {
    expect(mountTiers().find('[data-slot=tiered-pricing-note]').text()).toContain('only the units that fall inside')
    expect(mountTiers({ mode: 'volume' }).find('[data-slot=tiered-pricing-note]').text()).toContain('rate of the tier your total reaches')
  })
  it('shows no marker and no total without usage', () => {
    const w = mountTiers()
    expect(w.find('[data-slot=tiered-pricing-marker]').exists()).toBe(false)
    expect(w.find('[data-slot=tiered-pricing-total]').exists()).toBe(false)
    expect(w.find('[role=status]').exists()).toBe(true)
  })
  it('graduated usage marks each tier reached with text and an icon, and shows the total', () => {
    const w = mountTiers({ usage: 12500, unit: 'requests' })
    expect(w.findAll('[data-active=true]')).toHaveLength(3)
    const marker = w.find('[data-slot=tiered-pricing-marker]')
    expect(marker.text()).toContain('Your usage')
    expect(marker.find('svg').exists()).toBe(true)
    expect(marker.text()).toContain('(1,000 requests)')
    expect(w.find('[role=status]').text()).toBe('Total for 12,500 requests: $4,850')
  })
  it('volume usage marks only the tier reached', () => {
    const w = mountTiers({ usage: 12500, mode: 'volume', unit: 'requests' })
    expect(rows(w).map((r) => r.attributes('data-active'))).toEqual([undefined, undefined, 'true'])
    expect(w.find('[data-slot=tiered-pricing-marker]').text()).not.toContain('(')
    expect(w.find('[role=status]').text()).toBe('Total for 12,500 requests: $3,750')
  })
  it('usage exactly on a boundary stays in the lower tier (volume)', () => {
    const w = mountTiers({ usage: 1000, mode: 'volume' })
    expect(rows(w).map((r) => r.attributes('data-active'))).toEqual(['true', undefined, undefined])
    expect(w.find('[role=status]').text()).toBe('Total for 1,000: $500')
  })
  it('updates the total when usage changes, inside the one status region', async () => {
    const w = mountTiers({ usage: 500 })
    expect(w.findAll('[role=status]')).toHaveLength(1)
    expect(w.find('[role=status]').text()).toContain('$250')
    await w.setProps({ usage: 1001 })
    expect(w.find('[role=status]').text()).toContain('$500.40')
  })
  it('flat fee column appears only when a tier has a flat fee', () => {
    expect(mountTiers().findAll('th[scope=col]')).toHaveLength(2)
    const w = mountTiers({ tiers: [{ upTo: 10, rate: 5, flat: 20 }, { upTo: null, rate: 3 }] })
    expect(w.findAll('th[scope=col]').map((t) => t.text())).toContain('Flat fee')
    expect(w.findAll('[data-slot=tiered-pricing-flat]').map((c) => c.text())).toEqual(['$20', ''])
  })
  it('sorts unsorted tiers for display', () => {
    const w = mountTiers({ tiers: [TIERS[2], TIERS[0], TIERS[1]] })
    expect(w.findAll('[data-slot=tiered-pricing-range]')[0].text()).toBe('Up to 1,000')
  })
  it('a single open tier reads "All usage"', () => {
    expect(mountTiers({ tiers: [{ upTo: null, rate: 1 }] }).find('[data-slot=tiered-pricing-range]').text()).toBe('All usage')
  })
})

describe('TieredPricing variants', () => {
  it('steps renders a named ordered list', () => {
    const w = mountTiers({ variant: 'steps', usage: 5000 })
    const ol = w.find('ol')
    expect(ol.attributes('aria-label')).toBe('Sample tiers')
    expect(ol.classes()).toEqual(expect.arrayContaining(['flex-col', 'sm:flex-row']))
    expect(ol.findAll('li')).toHaveLength(3)
    expect(w.find('table').exists()).toBe(false)
    expect(w.findAll('li[data-active=true]')).toHaveLength(2)
    expect(w.find('li[data-active=true]').text()).toContain('Your usage')
  })
  it('steps show flat fees', () => {
    expect(mountTiers({ variant: 'steps', tiers: [{ upTo: null, rate: 1, flat: 9 }] }).find('[data-slot=tiered-pricing-flat]').text()).toContain('$9')
  })
  it.each(['sm', 'md', 'lg'])('size %s sets data-size', (size) => expect(mountTiers({ size }).attributes('data-size')).toBe(size))
  it('variant and size change the output', () => {
    expect(mountTiers({ variant: 'steps' }).html()).not.toBe(mountTiers().html())
    expect(mountTiers({ size: 'lg' }).html()).not.toBe(mountTiers({ size: 'sm' }).html())
    expect(tieredPricingVariants({ size: 'sm' })).toContain('text-xs')
  })
})

describe('TieredPricing customisation', () => {
  it('merges class last and passes attributes to the root', () => {
    const w = mountTiers({ class: 'gap-10', id: 'tiers', 'data-testid': 't' })
    expect(w.classes()).toContain('gap-10')
    expect(w.classes()).not.toContain('gap-3')
    expect(w.attributes('id')).toBe('tiers')
    expect(w.attributes('data-testid')).toBe('t')
  })
  it('aria-label replaces caption as the name', () => {
    const w = mountTiers({ caption: undefined, 'aria-label': 'Named by attribute' })
    expect(w.find('[data-slot=tiered-pricing-scroll]').attributes('aria-label')).toBe('Named by attribute')
    expect(w.attributes('aria-label')).toBeUndefined()
  })
  it('aria-labelledby names the region', () => {
    const w = mountTiers({ caption: undefined, 'aria-labelledby': 'heading-id' })
    const region = w.find('[data-slot=tiered-pricing-scroll]')
    expect(region.attributes('aria-labelledby')).toBe('heading-id')
    expect(region.attributes('aria-label')).toBeUndefined()
  })
  it('uses the ConfigProvider locale and labels', () => {
    const w = mount({
      components: { ConfigProvider, TieredPricing },
      template: `<ConfigProvider locale="de-DE" :labels="{ 'TieredPricing.yourUsage': 'Ihre Nutzung' }"><TieredPricing caption="x" currency="EUR" :usage="1500" :tiers="tiers" /></ConfigProvider>`,
      data: () => ({ tiers: TIERS }),
    })
    expect(w.find('[data-slot=tiered-pricing-rate]').text()).toBe('0,50 €')
    expect(w.find('[data-slot=tiered-pricing-range]').text()).toContain('1.000')
    expect(w.find('[data-slot=tiered-pricing-marker]').text()).toContain('Ihre Nutzung')
  })
})

describe('TieredPricing bad path', () => {
  it('empty tiers render a message and no table', () => {
    const w = mountTiers({ tiers: [] })
    expect(w.find('[data-slot=tiered-pricing-empty]').text()).toBe('No tiers defined.')
    expect(w.find('table').exists()).toBe(false)
    expect(w.find('[data-slot=tiered-pricing-total]').exists()).toBe(false)
  })
  it('missing or malformed tiers do not throw', () => {
    expect(() => mountTiers({ tiers: undefined })).not.toThrow()
    expect(mountTiers({ tiers: [null, { upTo: 'x', rate: 1 }] as never }).find('[data-slot=tiered-pricing-empty]').exists()).toBe(true)
  })
  it('unknown variant, size and mode fall back', () => {
    const w = mountTiers({ variant: 'grid', size: 'huge', mode: 'weird' })
    expect(w.attributes('data-variant')).toBe('table')
    expect(w.attributes('data-size')).toBe('md')
    expect(w.attributes('data-mode')).toBe('graduated')
  })
  it('invalid currency renders plain numbers', () => expect(mountTiers({ currency: 'nope' }).find('[data-slot=tiered-pricing-rate]').text()).toBe('0.50'))
  it('negative usage shows a zero total and no marker', () => {
    const w = mountTiers({ usage: -5 })
    expect(w.find('[role=status]').text()).toBe('Total for 0: $0')
    expect(w.find('[data-slot=tiered-pricing-marker]').exists()).toBe(false)
  })
  it.each([Number.NaN, Infinity])('usage %s shows nothing', (usage) => {
    const w = mountTiers({ usage })
    expect(w.find('[data-slot=tiered-pricing-total]').exists()).toBe(false)
    expect(w.find('[data-slot=tiered-pricing-marker]').exists()).toBe(false)
  })
  it('falls back to a default name when none is given', () => {
    expect(mountTiers({ caption: '  ' }).find('[data-slot=tiered-pricing-scroll]').attributes('aria-label')).toBe('Tiered pricing')
  })
})

describe('TieredPricing edge cases', () => {
  it('huge usage and rates', () => {
    const w = mountTiers({ usage: 1e12, mode: 'volume' })
    expect(w.find('[role=status]').text()).toBe('Total for 1,000,000,000,000: $300,000,000,000')
  })
  it('tiny rates keep their digits', () => {
    expect(mountTiers({ tiers: [{ upTo: null, rate: 0.0004 }] }).find('[data-slot=tiered-pricing-rate]').text()).toBe('$0.0004')
  })
  it('right-to-left container renders', () => {
    const w = mount({ components: { TieredPricing }, template: '<div dir="rtl"><TieredPricing caption="x" locale="ar-EG" :usage="1500" :tiers="tiers" /></div>', data: () => ({ tiers: TIERS }) })
    expect(w.find('[data-slot=tiered-pricing-range]').text().length).toBeGreaterThan(0)
    expect(w.find('th[scope=col]').classes()).toContain('text-start')
  })
  it('usage on each boundary for graduated pricing', () => {
    const w = mountTiers({ usage: 10000 })
    expect(rows(w).map((r) => r.attributes('data-active'))).toEqual(['true', 'true', undefined])
    expect(w.find('[role=status]').text()).toBe('Total for 10,000: $4,100')
  })
  it('usage of exactly 0 has a total of zero and no marker', () => {
    const w = mountTiers({ usage: 0 })
    expect(w.find('[role=status]').text()).toBe('Total for 0: $0')
    expect(w.find('[data-slot=tiered-pricing-marker]').exists()).toBe(false)
  })
  it('does not mutate the tiers prop', () => {
    const tiers = [TIERS[2], TIERS[0], TIERS[1]]
    const copy = JSON.stringify(tiers)
    mountTiers({ tiers })
    expect(JSON.stringify(tiers)).toBe(copy)
  })
})
