import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import CountBadge from './CountBadge.vue'
import { countBadgeVariants } from './variants'

const TONES = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const
const base = { count: 5, label: '5 items' }
const classesOf = (props: Record<string, unknown>) => mount(CountBadge, { props: { ...base, ...props } }).classes()
const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

const SOLID = {
  neutral: ['bg-foreground', 'text-background'],
  primary: ['bg-primary', 'text-primary-foreground'],
  success: ['bg-success', 'text-success-foreground'],
  warning: ['bg-warning', 'text-warning-foreground'],
  danger: ['bg-destructive', 'text-destructive-foreground'],
  info: ['bg-info', 'text-info-foreground'],
} as const
const SOFT = {
  neutral: ['bg-muted', 'text-muted-foreground'],
  primary: ['bg-primary/10', 'text-primary'],
  success: ['bg-success/15', 'text-success'],
  warning: ['bg-warning/20', 'text-warning-foreground'],
  danger: ['bg-destructive/10', 'text-destructive'],
  info: ['bg-info/15', 'text-info'],
} as const
const OUTLINE = {
  neutral: ['border-border', 'text-muted-foreground'],
  primary: ['border-primary/50', 'text-primary'],
  success: ['border-success/50', 'text-success'],
  warning: ['border-warning', 'text-warning-foreground'],
  danger: ['border-destructive/50', 'text-destructive'],
  info: ['border-info/50', 'text-info'],
} as const

describe('CountBadge variations', () => {
  describe('default output is frozen', () => {
    it('no variant props: primary, solid, md, pill', () => {
      expect(set(classesOf({}).join(' '))).toEqual(
        set(
          'relative inline-flex shrink-0 items-center justify-center border font-medium whitespace-nowrap tabular-nums select-none forced-colors:border-current border-transparent text-xs leading-none rounded-full h-5 min-w-5 px-1.5 bg-primary text-primary-foreground',
        ),
      )
    })
    it('explicit defaults equal implicit defaults', () => {
      expect(classesOf({ tone: 'primary', appearance: 'solid', size: 'md', shape: 'pill', dot: false })).toEqual(classesOf({}))
    })
  })

  describe('tone x appearance', () => {
    it.each(TONES)('solid %s', (tone) => {
      const c = classesOf({ tone, appearance: 'solid' })
      expect(c).toEqual(expect.arrayContaining([...SOLID[tone], 'border-transparent']))
    })
    it.each(TONES)('soft %s', (tone) => {
      expect(classesOf({ tone, appearance: 'soft' })).toEqual(expect.arrayContaining([...SOFT[tone], 'border-transparent']))
    })
    it.each(TONES)('outline %s has a page background and a toned border', (tone) => {
      const c = classesOf({ tone, appearance: 'outline' })
      expect(c).toEqual(expect.arrayContaining([...OUTLINE[tone], 'bg-background']))
      expect(c.some((x) => /^bg-(primary|success|warning|destructive|info|foreground|muted)/.test(x))).toBe(false)
    })
    it('warning keeps dark-mode text colour for soft and outline', () => {
      expect(classesOf({ tone: 'warning', appearance: 'soft' })).toContain('dark:text-warning')
      expect(classesOf({ tone: 'warning', appearance: 'outline' })).toContain('dark:text-warning')
    })
    it('every appearance and tone combination differs from every other', () => {
      const seen = new Set<string>()
      for (const a of ['solid', 'soft', 'outline'] as const) for (const t of TONES) seen.add(classesOf({ appearance: a, tone: t }).join(' '))
      expect(seen.size).toBe(18)
    })
    it('unknown tone and appearance fall back to the defaults', () => {
      expect(classesOf({ tone: 'rainbow' })).toEqual(classesOf({}))
      expect(classesOf({ appearance: 'glass' })).toEqual(classesOf({}))
    })
    it('a tone class replaces nothing it should not: no two background colours', () => {
      for (const t of TONES) {
        const bgs = classesOf({ tone: t }).filter((x) => /^bg-/.test(x))
        expect(bgs, t).toHaveLength(1)
      }
    })
  })

  describe('size', () => {
    it.each([
      ['sm', ['h-4', 'min-w-4', 'px-1', 'text-2xs']],
      ['md', ['h-5', 'min-w-5', 'px-1.5', 'text-xs']],
      ['lg', ['h-7', 'min-w-7', 'px-2.5', 'text-base']],
    ] as const)('%s', (size, cls) => {
      const c = classesOf({ size })
      expect(c).toEqual(expect.arrayContaining([...cls]))
      expect(c.filter((x) => /^h-\d/.test(x))).toHaveLength(1)
      expect(c.filter((x) => /^text-(2xs|xs|sm|base)$/.test(x))).toHaveLength(1)
    })
    it.each([
      ['sm', 'size-1.5'],
      ['md', 'size-2'],
      ['lg', 'size-2.5'],
    ] as const)('dot %s is a fixed square without padding', (size, cls) => {
      const c = classesOf({ dot: true, size })
      expect(c).toContain(cls)
      expect(c).toContain('p-0')
      expect(c.some((x) => /^(h|min-w)-\d/.test(x))).toBe(false)
      expect(c.some((x) => /^px-/.test(x))).toBe(false)
    })
    it('unknown size falls back to md', () => {
      expect(classesOf({ size: 'huge' })).toEqual(classesOf({}))
    })
  })

  describe('shape', () => {
    it('pill is rounded-full with padding', () => {
      const c = classesOf({ shape: 'pill' })
      expect(c).toContain('rounded-full')
      expect(c).toContain('px-1.5')
    })
    it('circle is rounded-full with minimal padding', () => {
      const c = classesOf({ shape: 'circle' })
      expect(c).toContain('rounded-full')
      expect(c).toContain('px-0.5')
      expect(c).not.toContain('px-1.5')
      expect(c).toContain('min-w-5')
    })
    it('square uses the control radius', () => {
      const c = classesOf({ shape: 'square' })
      expect(c).toContain('rounded-md')
      expect(c).not.toContain('rounded-full')
      expect(c).toContain('px-1.5')
    })
    it('square dot uses a smaller radius', () => {
      const c = classesOf({ shape: 'square', dot: true })
      expect(c).toContain('rounded-xs')
      expect(c).not.toContain('rounded-md')
      expect(c).not.toContain('rounded-full')
    })
    it('unknown shape falls back to pill', () => {
      expect(classesOf({ shape: 'blob' })).toEqual(classesOf({}))
    })
    it('circle keeps the text visible for 99+ (min-width, no fixed width)', () => {
      const c = classesOf({ shape: 'circle', count: 500 })
      expect(c.some((x) => /^w-\d/.test(x))).toBe(false)
    })
  })

  describe('dot appearance', () => {
    it('soft dot gets a border in its own colour', () => {
      expect(classesOf({ dot: true, appearance: 'soft', tone: 'success' })).toContain('border-current')
      expect(classesOf({ dot: true, appearance: 'soft' })).not.toContain('border-transparent')
    })
    it('solid and outline dots keep their borders', () => {
      expect(classesOf({ dot: true, appearance: 'solid' })).toContain('border-transparent')
      expect(classesOf({ dot: true, appearance: 'outline', tone: 'danger' })).toEqual(expect.arrayContaining(['border-destructive/50', 'bg-background']))
    })
    it('a non-dot soft badge keeps the transparent border', () => {
      expect(classesOf({ appearance: 'soft' })).toContain('border-transparent')
      expect(classesOf({ appearance: 'soft' })).not.toContain('border-current')
    })
  })

  describe('accessibility classes', () => {
    it('forced-colors keeps a visible border for every appearance', () => {
      for (const a of ['solid', 'soft', 'outline'] as const) {
        const c = classesOf({ appearance: a })
        expect(c).toContain('border')
        expect(c).toContain('forced-colors:border-current')
      }
    })
    it('tabular figures and no wrap in every size and shape', () => {
      for (const size of ['sm', 'md', 'lg'] as const)
        for (const shape of ['pill', 'circle', 'square'] as const) expect(classesOf({ size, shape })).toEqual(expect.arrayContaining(['tabular-nums', 'whitespace-nowrap']))
    })
    it('every combination keeps accessible text: hidden number plus sr-only label', () => {
      for (const dot of [false, true])
        for (const shape of ['pill', 'circle', 'square'] as const) {
          const w = mount(CountBadge, { props: { ...base, dot, shape } })
          expect(w.find('[data-slot="count-badge-label"]').text()).toBe('5 items')
          if (!dot) expect(w.find('[data-slot="count-badge-text"]').attributes('aria-hidden')).toBe('true')
        }
    })
  })

  describe('cross product and class override', () => {
    it('lg + circle + soft + danger + 99+', () => {
      const c = classesOf({ size: 'lg', shape: 'circle', appearance: 'soft', tone: 'danger', count: 1000 })
      expect(c).toEqual(expect.arrayContaining(['h-7', 'min-w-7', 'px-0.5', 'rounded-full', 'bg-destructive/10', 'text-destructive', 'text-base']))
    })
    it('sm + square + outline + info', () => {
      const c = classesOf({ size: 'sm', shape: 'square', appearance: 'outline', tone: 'info' })
      expect(c).toEqual(expect.arrayContaining(['h-4', 'px-1', 'rounded-md', 'border-info/50', 'text-info', 'bg-background']))
    })
    it('class wins over every dimension', () => {
      const c = classesOf({ size: 'lg', shape: 'square', tone: 'danger', class: 'h-10 rounded-none bg-pink-500' })
      expect(c).toEqual(expect.arrayContaining(['h-10', 'rounded-none', 'bg-pink-500']))
      expect(c).not.toContain('h-7')
      expect(c).not.toContain('rounded-md')
      expect(c).not.toContain('bg-destructive')
    })
  })

  describe('countBadgeVariants outside the component', () => {
    it('returns the same classes as the component after cn()', () => {
      const props = { tone: 'success', appearance: 'soft', size: 'lg', shape: 'circle', dot: true } as const
      expect(set(cn(countBadgeVariants(props)))).toEqual(set(classesOf({ ...props }).join(' ')))
    })
    it('can be used on a plain element without a component', () => {
      expect(countBadgeVariants({ tone: 'danger' })).toContain('bg-destructive')
      expect(countBadgeVariants({})).toContain('bg-primary')
    })
  })
})
