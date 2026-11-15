import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import RelativeTime from './RelativeTime.vue'
import { relativeTimeSizes, relativeTimeTones, relativeTimeVariantNames, relativeTimeVariants } from './variants'

const rt = (props: Record<string, unknown> = {}) => mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', now: '2025-06-15T12:00:00Z', ...props } as never })
const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

describe('RelativeTime variations', () => {
  it('default output is unchanged', () => {
    expect(set(rt().classes().join(' '))).toEqual(['tabular-nums'])
    expect(set(relativeTimeVariants())).toEqual(['tabular-nums'])
  })

  describe('variant', () => {
    it('muted uses the secondary colour', () => expect(rt({ variant: 'muted' }).classes()).toContain('text-muted-foreground'))
    it('dotted underlines with a dotted decoration', () => expect(rt({ variant: 'dotted' }).classes()).toEqual(expect.arrayContaining(['underline', 'decoration-dotted', 'underline-offset-4'])))
    it('plain adds nothing', () => expect(rt({ variant: 'plain' }).classes()).toEqual(rt().classes()))
    it('every value renders different markup', () => expect(new Set(relativeTimeVariantNames.map((variant) => rt({ variant }).html())).size).toBe(relativeTimeVariantNames.length))
    it('unknown falls back to plain', () => expect(rt({ variant: 'fancy' }).classes()).toEqual(rt().classes()))
  })

  describe('size', () => {
    it.each(relativeTimeSizes.filter((s) => s !== 'inherit'))('size %s', (size) => expect(rt({ size }).classes()).toContain(`text-${size}`))
    it('inherit adds no text size', () => expect(rt({ size: 'inherit' }).classes().some((c) => /^text-/.test(c))).toBe(false))
    it('unknown falls back to inherit', () => expect(rt({ size: 'giant' }).classes()).toEqual(rt().classes()))
  })

  describe('tone', () => {
    it.each([
      ['primary', 'text-primary'],
      ['success', 'text-success'],
      ['warning', 'text-warning-foreground'],
      ['danger', 'text-destructive'],
      ['info', 'text-info'],
    ] as const)('tone %s uses %s', (tone, cls) => expect(rt({ tone }).classes()).toContain(cls))
    it('warning has a dark-mode colour', () => expect(rt({ tone: 'warning' }).classes()).toContain('dark:text-warning'))
    it('default adds no colour', () => expect(rt({ tone: 'default' }).classes()).toEqual(rt().classes()))
    it('unknown falls back to default', () => expect(rt({ tone: 'rainbow' }).classes()).toEqual(rt().classes()))
    it('tone beats the muted variant colour', () => {
      const c = rt({ variant: 'muted', tone: 'success' }).classes()
      expect(c).toContain('text-success')
      expect(c).not.toContain('text-muted-foreground')
    })
  })

  describe('combinations', () => {
    it.each(relativeTimeVariantNames.flatMap((variant) => relativeTimeTones.map((tone) => [variant, tone] as const)))('variant %s with tone %s', (variant, tone) => {
      const c = rt({ variant, tone, size: 'lg' }).classes()
      expect(c).toEqual(expect.arrayContaining(['text-lg', 'tabular-nums']))
      expect(new Set(c).size).toBe(c.length)
    })
    it('class beats size', () => {
      const c = rt({ size: 'sm', class: 'text-lg' }).classes()
      expect(c).toContain('text-lg')
      expect(c).not.toContain('text-sm')
    })
    it('cva output merges for plain elements', () => expect(cn(relativeTimeVariants({ size: 'sm' }), 'text-lg')).not.toContain('text-sm'))
  })

  describe('edge cases', () => {
    it('variants do not change the text or datetime', () => {
      for (const variant of relativeTimeVariantNames) {
        const w = rt({ variant })
        expect(w.text()).toBe('3 minutes ago')
        expect(w.attributes('datetime')).toBe('2025-06-15T11:57:00.000Z')
      }
    })
    it('an invalid value keeps the variant styling', () => expect(rt({ datetime: 'nope', variant: 'muted' }).classes()).toContain('text-muted-foreground'))
    it('uses token colours only', () => {
      for (const tone of relativeTimeTones) expect(rt({ tone }).classes().join(' ')).not.toMatch(/#[0-9a-f]{3,6}|rgb|hsl|gradient/)
    })
  })
})
