import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendBadge from './TrendBadge.vue'
import { trendBadgeVariants } from './variants'

const make = (props: Record<string, unknown> = {}, slots?: Record<string, string>) => mount(TrendBadge, { props, slots })
const sr = (w: ReturnType<typeof make>) => w.find('[data-slot="trend-badge-sr"]').text()
const val = (w: ReturnType<typeof make>) => w.find('[data-slot="trend-badge-value"]')

describe('TrendBadge', () => {
  describe('good path', () => {
    it('renders up trend as good by default with sr text', () => {
      const w = make({ direction: 'up', value: 12.34 })
      expect(w.attributes('data-slot')).toBe('trend-badge')
      expect(w.attributes('data-direction')).toBe('up')
      expect(w.attributes('data-tone')).toBe('good')
      expect(w.classes()).toContain('text-success')
      expect(val(w).text()).toBe('12.3')
      expect(sr(w)).toBe('Increase of 12.3')
      expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    })

    it('down is bad by default', () => {
      const w = make({ direction: 'down', value: 5 })
      expect(w.attributes('data-tone')).toBe('bad')
      expect(w.classes()).toContain('text-destructive')
      expect(sr(w)).toBe('Decrease of 5')
    })

    it('goodWhen=down and inverse make a decrease good', () => {
      expect(make({ direction: 'down', value: 5, goodWhen: 'down' }).attributes('data-tone')).toBe('good')
      expect(make({ direction: 'down', value: 5, inverse: true }).attributes('data-tone')).toBe('good')
      expect(make({ direction: 'up', value: 5, inverse: true }).attributes('data-tone')).toBe('bad')
    })

    it('goodWhen=none and flat are neutral', () => {
      expect(make({ direction: 'up', value: 5, goodWhen: 'none' }).attributes('data-tone')).toBe('neutral')
      const flat = make({ direction: 'flat', value: 0 })
      expect(flat.attributes('data-tone')).toBe('neutral')
      expect(flat.classes()).toContain('text-muted-foreground')
      expect(sr(flat)).toBe('No change')
    })

    it('derives direction from the sign of value', () => {
      expect(make({ value: 3 }).attributes('data-direction')).toBe('up')
      const down = make({ value: -3 })
      expect(down.attributes('data-direction')).toBe('down')
      expect(val(down).text()).toBe('3') // sign not printed
      expect(make({ value: 0 }).attributes('data-direction')).toBe('flat')
    })

    it('formats percent, compact and currency via Intl', () => {
      expect(val(make({ value: 12.5, format: 'percent', locale: 'en-US' })).text()).toMatch(/12\.5\s?%/)
      expect(val(make({ value: 1500000, format: 'compact', locale: 'en-US' })).text()).toBe('1.5M')
      expect(val(make({ value: 1234.5, format: 'currency', currency: 'USD', locale: 'en-US', fractionDigits: 2 })).text()).toBe('$1,234.50')
      expect(val(make({ value: 1234.567, locale: 'de-DE', fractionDigits: 2 })).text()).toBe('1.234,57')
    })

    it('renders arrow-only when value is not provided, and a default slot', () => {
      const w = make({ direction: 'up' })
      expect(val(w).exists()).toBe(false)
      expect(sr(w)).toBe('Increase')
      const s = make({ direction: 'down', value: 2 }, { default: 'custom' })
      expect(val(s).text()).toBe('custom')
    })

    it('uses a different arrow path per direction', () => {
      const d = (dir: string) => make({ direction: dir }).find('path').attributes('d')
      expect(new Set([d('up'), d('down'), d('flat')]).size).toBe(3)
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(TrendBadge, { props: { value: 1, class: 'bg-primary px-8' }, attrs: { id: 'x', 'data-test': 'y' } })
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-success/10')
      expect(w.classes()).toContain('px-8')
      expect(w.attributes('id')).toBe('x')
      expect(w.attributes('data-test')).toBe('y')
    })

    it('supports variants and sizes', () => {
      expect(make({ value: 1, variant: 'solid' }).classes()).toContain('bg-success')
      expect(make({ value: -1, variant: 'solid' }).classes()).toContain('bg-destructive')
      expect(make({ value: 0, variant: 'solid' }).classes()).toContain('bg-muted-foreground')
      expect(make({ value: 1, variant: 'ghost' }).classes()).toContain('text-success')
      expect(make({ value: 1, size: 'sm' }).classes()).toContain('text-xs')
      expect(make({ value: 1, size: 'lg' }).classes()).toContain('text-base')
    })

    it('exports usable variants function', () => {
      expect(trendBadgeVariants({ tone: 'bad', variant: 'soft' })).toContain('bg-destructive/10')
    })
  })

  describe('bad path', () => {
    it.each([null, NaN, Infinity, -Infinity])('renders a dash and "No data" for %s', (v) => {
      const w = make({ value: v, direction: 'up' })
      expect(val(w).text()).toBe('–')
      expect(sr(w)).toBe('No data')
      expect(w.attributes('data-tone')).toBe('neutral')
      expect(w.attributes('data-direction')).toBe('flat')
    })

    it('ignores an invalid direction and falls back to the sign', () => {
      expect(make({ direction: 'sideways' as never, value: -2 }).attributes('data-direction')).toBe('down')
      expect(make({ direction: 'sideways' as never }).attributes('data-direction')).toBe('flat')
    })

    it('falls back for invalid locale and currency without throwing', () => {
      expect(val(make({ value: 1234.5, locale: 'not_a_locale!!' })).text()).toMatch(/1,?234\.5/)
      expect(val(make({ value: 5, format: 'currency', currency: 'XXXXXX' })).text()).toBe('5')
      expect(val(make({ value: 5, format: 'currency' })).text()).toBe('5')
    })

    it('clamps / repairs fractionDigits', () => {
      expect(val(make({ value: 1.23456, fractionDigits: -3 })).text()).toBe('1')
      expect(val(make({ value: 1.23456, fractionDigits: 99 })).text()).toBe('1.23456')
      expect(val(make({ value: 1.23456, fractionDigits: 1.5 })).text()).toBe('1.2')
    })
  })

  describe('edge cases', () => {
    it('handles huge, tiny and negative zero values', () => {
      expect(val(make({ value: 1e21, format: 'compact', locale: 'en-US' })).text()).toBeTruthy()
      expect(val(make({ value: 0.0001 })).text()).toBe('0')
      const nz = make({ value: -0 })
      expect(nz.attributes('data-direction')).toBe('flat')
    })

    it('reacts to prop updates', async () => {
      const w = make({ value: 1 })
      expect(w.attributes('data-tone')).toBe('good')
      await w.setProps({ value: -1 })
      expect(w.attributes('data-tone')).toBe('bad')
    })
  })
})
