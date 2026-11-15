import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendBadge from './TrendBadge.vue'
import { TREND_BADGE_SHAPES, TREND_BADGE_SIZES, TREND_BADGE_VARIANTS, trendBadgeVariants } from './index'

const mk = (props: Record<string, unknown> = {}) => mount(TrendBadge, { props: { value: 5, ...props } as never })

describe('TrendBadge outline variant and shape dimension', () => {
  it('lists the values', () => {
    expect([...TREND_BADGE_VARIANTS]).toEqual(['soft', 'solid', 'ghost', 'outline'])
    expect([...TREND_BADGE_SHAPES]).toEqual(['rounded', 'pill', 'square'])
    expect([...TREND_BADGE_SIZES]).toEqual(['sm', 'md', 'lg'])
  })
  it('keeps the default class string', () => {
    expect(mk().attributes('class')).toBe('inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md font-medium tabular-nums [&_svg]:shrink-0 px-2 py-0.5 text-sm [&_svg]:size-3.5 bg-success/10 text-success')
  })

  describe('outline', () => {
    it.each([
      [5, 'border-success/50 text-success'],
      [-5, 'border-destructive/50 text-destructive'],
      [0, 'border-border text-muted-foreground'],
    ])('value %s -> %s with a border and no fill', (value, cls) => {
      const w = mk({ variant: 'outline', value })
      expect(w.classes()).toEqual(expect.arrayContaining(['border', 'bg-transparent', ...cls.split(' ')]))
      expect(w.classes().some((c) => /^bg-(success|destructive|muted)/.test(c))).toBe(false)
    })
    it('still states the change in text, not only colour', () => {
      expect(mk({ variant: 'outline', value: -3 }).find('[data-slot="trend-badge-sr"]').text()).toBe('Decrease of 3')
      expect(mk({ variant: 'outline', value: -3 }).find('svg').attributes('aria-hidden')).toBe('true')
    })
    it('inverse flips the tone as in the other variants', () => {
      expect(mk({ variant: 'outline', value: 5, inverse: true }).classes()).toContain('border-destructive/50')
    })
  })

  describe('shape', () => {
    it('pill replaces rounded-md', () => {
      const w = mk({ shape: 'pill' })
      expect(w.classes()).toContain('rounded-full')
      expect(w.classes()).not.toContain('rounded-md')
    })
    it('square removes the radius', () => {
      const w = mk({ shape: 'square' })
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-md')
    })
    it('rounded equals the default', () => expect(mk({ shape: 'rounded' }).html()).toBe(mk().html()))
    it('unknown shape, variant and size fall back to the default', () => expect(mk({ shape: 'blob', variant: 'neon', size: 'huge' }).html()).toBe(mk().html()))
  })

  describe('combinations', () => {
    it.each(TREND_BADGE_VARIANTS)('%s x pill x lg', (variant) => {
      const w = mk({ variant, shape: 'pill', size: 'lg' })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-full', 'text-base']))
    })
    it('class wins over shape', () => {
      const w = mk({ shape: 'pill', class: 'rounded-lg' })
      expect(w.classes()).toContain('rounded-lg')
      expect(w.classes()).not.toContain('rounded-full')
    })
  })

  it('the helper accepts shape and the outline variant', () => {
    expect(trendBadgeVariants({ variant: 'outline', tone: 'good', shape: 'pill' })).toContain('border-success/50')
    expect(trendBadgeVariants({ shape: 'pill' })).toContain('rounded-full')
  })
  it('missing and invalid values still render in every shape', () => {
    for (const shape of TREND_BADGE_SHAPES) {
      expect(mk({ shape, value: null }).find('[data-slot="trend-badge-sr"]').text()).toBe('No data')
      expect(mk({ shape, value: undefined, direction: 'down' }).attributes('data-direction')).toBe('down')
    }
  })
})
