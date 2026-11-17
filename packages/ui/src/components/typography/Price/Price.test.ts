import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import { Price, formatPrice, priceVariants, significantFractionDigits, resolvePriceSize, resolvePriceTone } from './index'
import * as barrel from '../index'

const mountPrice = (props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) => mount(Price, { props: props as never, slots: slots as never })
const text = (props: Record<string, unknown>) => mountPrice(props).find('[data-slot=price-amount]').text()

describe('Price good path', () => {
  it('renders data-slot parts and tabular figures', () => {
    const w = mountPrice({ amount: 20, period: '/month' })
    expect(w.element.tagName).toBe('SPAN')
    expect(w.attributes('data-slot')).toBe('price')
    expect(w.classes()).toContain('tabular-nums')
    expect(w.find('[data-slot=price-amount]').text()).toBe('$20')
    expect(w.find('[data-slot=price-period]').text()).toBe('/month')
  })
  it('exports from the typography barrel', () => expect(barrel.Price).toBe(Price))
  it('shows no digits for whole amounts and two otherwise', () => {
    expect(text({ amount: 49 })).toBe('$49')
    expect(text({ amount: 49.5 })).toBe('$49.50')
    expect(text({ amount: 0.4 })).toBe('$0.40')
  })
  it('honours explicit digits', () => {
    expect(text({ amount: 49, minimumFractionDigits: 2 })).toBe('$49.00')
    expect(text({ amount: 49.567, maximumFractionDigits: 0 })).toBe('$50')
    expect(text({ amount: 0.0004, minimumFractionDigits: 4, maximumFractionDigits: 4 })).toBe('$0.0004')
    expect(text({ amount: 3, maximumFractionDigits: 3 })).toBe('$3')
  })
  it('formats other currencies and locales', () => {
    expect(text({ amount: 1234.5, currency: 'eur', locale: 'de-DE' })).toBe('1.234,50 €')
    expect(text({ amount: 1500, currency: 'JPY', locale: 'ja-JP' })).toMatch(/1,500/)
  })
  it('supports compact notation', () => {
    expect(text({ amount: 1200000, notation: 'compact' })).toBe('$1.2M')
    expect(text({ amount: 1200000, notation: 'compact', maximumFractionDigits: 0 })).toBe('$1M')
  })
  it('shows freeLabel only for zero', () => {
    expect(text({ amount: 0, freeLabel: 'Free' })).toBe('Free')
    expect(text({ amount: 0 })).toBe('$0')
    expect(text({ amount: 1, freeLabel: 'Free' })).toBe('$1')
  })
  it('struck-through previous price with screen reader text', () => {
    const w = mountPrice({ amount: 20, compareAt: 30 })
    const s = w.find('[data-slot=price-compare]')
    expect(s.text()).toBe('$30')
    expect(s.attributes('aria-hidden')).toBe('true')
    expect(s.classes()).toContain('line-through')
    expect(w.find('.sr-only').text()).toBe('Was $30, now')
  })
  it('slot overrides the amount text', () => {
    const w = mountPrice({ amount: 20, period: '/mo' }, { default: () => h('em', 'From $20') })
    expect(w.find('[data-slot=price-amount]').text()).toBe('From $20')
    expect(w.find('[data-slot=price-period]').exists()).toBe(true)
  })
  it('uses the ConfigProvider locale unless locale is set', () => {
    const w = mount({ components: { ConfigProvider, Price }, template: '<ConfigProvider locale="de-DE"><Price :amount="1234.5" currency="EUR" /><Price :amount="1234.5" locale="en-US" /></ConfigProvider>' })
    const t = w.findAll('[data-slot=price-amount]').map((n) => n.text())
    expect(t[0]).toBe('1.234,50 €')
    expect(t[1]).toBe('$1,234.50')
  })
})

describe('Price customisation', () => {
  it('merges class last and passes attributes', () => {
    const w = mountPrice({ amount: 1, class: 'text-destructive', 'aria-label': 'Sample' })
    expect(w.classes()).toContain('text-destructive')
    expect(w.classes()).not.toContain('text-foreground')
    expect(w.attributes('aria-label')).toBe('Sample')
  })
  it('supports as', () => expect(mountPrice({ amount: 1, as: 'strong' }).element.tagName).toBe('STRONG'))
  it('size and tone change the classes and data attributes', () => {
    const w = mountPrice({ amount: 1, size: 'xl', tone: 'primary' })
    expect(w.classes()).toEqual(expect.arrayContaining(['text-5xl', 'text-primary']))
    expect(w.attributes('data-size')).toBe('xl')
    expect(w.attributes('data-tone')).toBe('primary')
  })
  it('priceVariants is reusable on plain elements', () => expect(priceVariants({ size: 'sm' })).toContain('text-base'))
})

describe('Price bad path', () => {
  it.each([null, undefined, Number.NaN, Infinity, -Infinity, '12' as never])('amount %s renders the fallback', (amount) => {
    const w = mountPrice({ amount })
    expect(w.find('[data-slot=price-amount]').text()).toBe('—')
    expect(w.attributes('data-invalid')).toBe('true')
  })
  it('names the default dash "No price" and a custom fallback is plain text', () => {
    const dash = mountPrice({ amount: null }).find('[data-slot=price-amount]')
    expect(dash.attributes('role')).toBe('img')
    expect(dash.attributes('aria-label')).toBe('No price')
    const custom = mountPrice({ amount: null, fallback: 'Custom' }).find('[data-slot=price-amount]')
    expect(custom.text()).toBe('Custom')
    expect(custom.attributes('role')).toBeUndefined()
  })
  it('invalid currency renders a plain number without throwing', () => {
    expect(text({ amount: 12.5, currency: 'DOLLARS' })).toBe('12.50')
    expect(text({ amount: 12, currency: '' })).toBe('12')
    expect(text({ amount: 12, currency: 42 })).toBe('12')
  })
  it('bad locale falls back to en-US', () => expect(text({ amount: 1234.5, locale: 'not a locale!!' })).toBe('$1,234.50'))
  it('unknown size and tone fall back to the defaults', () => {
    const w = mountPrice({ amount: 1, size: 'huge', tone: 'loud' })
    expect(w.attributes('data-size')).toBe('md')
    expect(w.attributes('data-tone')).toBe('default')
    expect(resolvePriceSize('x')).toBe('md')
    expect(resolvePriceTone('x')).toBe('default')
  })
  it('ignores compareAt when the amount or compareAt is invalid', () => {
    expect(mountPrice({ amount: null, compareAt: 30 }).find('[data-slot=price-compare]').exists()).toBe(false)
    expect(mountPrice({ amount: 20, compareAt: Number.NaN }).find('[data-slot=price-compare]').exists()).toBe(false)
  })
  it('ignores unknown notation', () => expect(text({ amount: 1200000, notation: 'weird' })).toBe('$1,200,000'))
  it('renders no period element when period is empty', () => expect(mountPrice({ amount: 1, period: '' }).find('[data-slot=price-period]').exists()).toBe(false))
})

describe('Price edge cases', () => {
  it('huge and tiny amounts', () => {
    expect(text({ amount: 1e15 })).toBe('$1,000,000,000,000,000')
    expect(text({ amount: Number.MAX_SAFE_INTEGER })).toBe('$9,007,199,254,740,991')
    expect(text({ amount: 0.001 })).toBe('$0.00')
  })
  it('negative amounts and negative zero', () => {
    expect(text({ amount: -5 })).toBe('-$5')
    expect(text({ amount: -0, freeLabel: 'Free' })).toBe('Free')
  })
  it('RTL locale renders digits of the locale', () => {
    const w = mountPrice({ amount: 1234, currency: 'EGP', locale: 'ar-EG' })
    expect(w.text().length).toBeGreaterThan(0)
  })
  it('updates when props change', async () => {
    const w = mountPrice({ amount: 1 })
    await w.setProps({ amount: 2.5 })
    expect(w.find('[data-slot=price-amount]').text()).toBe('$2.50')
  })
})

describe('formatPrice and significantFractionDigits', () => {
  it('formats strings', () => {
    expect(formatPrice(20)).toBe('$20')
    expect(formatPrice(null)).toBe('—')
    expect(formatPrice(Number.NaN, { fallback: 'n/a' })).toBe('n/a')
    expect(formatPrice(0, { freeLabel: 'Free' })).toBe('Free')
    expect(formatPrice(1234.5, { currency: 'EUR', locale: 'de-DE' })).toBe('1.234,50 €')
    expect(formatPrice(5, { currency: 'zz' })).toBe('5')
  })
  it('finds the fewest digits that show a rate exactly', () => {
    expect(significantFractionDigits(0.4)).toBe(2)
    expect(significantFractionDigits(0.004)).toBe(3)
    expect(significantFractionDigits(0.0004)).toBe(4)
    expect(significantFractionDigits(0.123456789)).toBe(6)
    expect(significantFractionDigits(Number.NaN)).toBe(2)
  })
})
