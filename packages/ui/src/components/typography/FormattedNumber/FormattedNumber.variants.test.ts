import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import FormattedNumber from './FormattedNumber.vue'
import { formattedNumberSizes, formattedNumberTones, formattedNumberVariantNames, formattedNumberVariants, formattedNumberWeights } from './variants'

const num = (props: Record<string, unknown> = {}) => mount(FormattedNumber, { props: { value: 1234, ...props } as never })
const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

describe('FormattedNumber variations', () => {
  it('default output is unchanged', () => {
    expect(set(num().classes().join(' '))).toEqual(set('whitespace-nowrap tabular-nums'))
    expect(set(formattedNumberVariants())).toEqual(set('whitespace-nowrap tabular-nums'))
    expect(num().find('bdi').text()).toBe('1,234')
  })

  describe('variant', () => {
    it('mono uses the monospace font', () => expect(num({ variant: 'mono' }).classes()).toContain('font-mono'))
    it('outline draws a hairline box with logical-safe padding', () => {
      const c = num({ variant: 'outline' }).classes()
      expect(c).toEqual(expect.arrayContaining(['border', 'border-border', 'rounded-md', 'px-1.5', 'py-0.5']))
    })
    it('plain adds nothing', () => expect(num({ variant: 'plain' }).classes()).toEqual(num().classes()))
    it('every value renders distinct output', () => {
      expect(new Set(formattedNumberVariantNames.map((variant) => num({ variant }).html())).size).toBe(formattedNumberVariantNames.length)
    })
    it('unknown falls back to plain', () => expect(num({ variant: 'soft' }).classes()).toEqual(num().classes()))
  })

  describe('size', () => {
    it.each(formattedNumberSizes.filter((s) => s !== 'inherit'))('size %s', (size) => expect(num({ size }).classes()).toContain(`text-${size}`))
    it('inherit adds no text size', () => expect(num({ size: 'inherit' }).classes().some((c) => /^text-(xs|sm|base|md|lg|xl|2xl)$/.test(c))).toBe(false))
    it('unknown falls back to inherit', () => expect(num({ size: 'huge' }).classes()).toEqual(num().classes()))
  })

  describe('tone', () => {
    it.each([
      ['muted', 'text-muted-foreground'],
      ['positive', 'text-success'],
      ['negative', 'text-destructive'],
    ] as const)('tone %s uses %s', (tone, cls) => expect(num({ tone }).classes()).toContain(cls))

    it('positive shows a plus sign so colour is not the only signal', () => expect(num({ tone: 'positive' }).text()).toBe('+1,234'))
    it('negative shows its minus sign', () => expect(num({ tone: 'negative', value: -5 }).text()).toBe('-5'))
    it('zero gets no sign', () => expect(num({ tone: 'positive', value: 0 }).text()).toBe('0'))
    it('muted and default leave the sign alone', () => {
      expect(num({ tone: 'muted' }).text()).toBe('1,234')
      expect(num({ tone: 'default' }).text()).toBe('1,234')
    })
    it('an explicit signDisplay wins over the tone default', () => expect(num({ tone: 'positive', signDisplay: 'never' }).text()).toBe('1,234'))

    describe('auto', () => {
      it('positive value is success with a plus', () => {
        const w = num({ tone: 'auto', value: 12 })
        expect(w.classes()).toContain('text-success')
        expect(w.text()).toBe('+12')
      })
      it('negative value is destructive with a minus', () => {
        const w = num({ tone: 'auto', value: -12 })
        expect(w.classes()).toContain('text-destructive')
        expect(w.text()).toBe('-12')
      })
      it('zero has no status colour', () => {
        const c = num({ tone: 'auto', value: 0 }).classes()
        expect(c).not.toContain('text-success')
        expect(c).not.toContain('text-destructive')
      })
      it('works for bigint and numeric strings', () => {
        expect(num({ tone: 'auto', value: -3n }).classes()).toContain('text-destructive')
        expect(num({ tone: 'auto', value: '7' }).classes()).toContain('text-success')
      })
      it('an invalid value has no sign or status colour', () => {
        const w = num({ tone: 'auto', value: NaN })
        expect(w.classes()).not.toContain('text-success')
        expect(w.text()).toBe('n/a')
      })
    })

    it('every documented tone is accepted', () => expect(formattedNumberTones).toEqual(['default', 'muted', 'positive', 'negative', 'auto']))
    it('unknown falls back to default', () => expect(num({ tone: 'rainbow' }).classes()).toEqual(num().classes()))
  })

  describe('weight', () => {
    it.each([
      ['normal', 'font-normal'],
      ['medium', 'font-medium'],
      ['semibold', 'font-semibold'],
      ['bold', 'font-bold'],
    ] as const)('weight %s', (weight, cls) => expect(num({ weight }).classes()).toContain(cls))
    it('unset adds no weight', () => expect(num().classes().some((c) => c.startsWith('font-'))).toBe(false))
    it('unknown adds no weight', () => expect(num({ weight: 'heavy' }).classes().some((c) => c.startsWith('font-'))).toBe(false))
    it('lists exactly the documented weights', () => expect(formattedNumberWeights).toHaveLength(4))
  })

  describe('combinations', () => {
    it.each(formattedNumberVariantNames.flatMap((variant) => formattedNumberTones.map((tone) => [variant, tone] as const)))('variant %s with tone %s does not conflict', (variant, tone) => {
      const c = num({ variant, tone, size: 'lg', weight: 'bold', value: 5 }).classes()
      expect(c).toEqual(expect.arrayContaining(['text-lg', 'font-bold', 'whitespace-nowrap']))
      expect(new Set(c).size).toBe(c.length)
    })
    it('class beats size and tone', () => {
      const c = num({ size: 'sm', tone: 'negative', class: 'text-lg text-foreground' }).classes()
      expect(c).toContain('text-lg')
      expect(c).toContain('text-foreground')
      expect(c).not.toContain('text-sm')
      expect(c).not.toContain('text-destructive')
    })
    it('cva output merges cleanly for plain elements', () => {
      expect(cn(formattedNumberVariants({ size: 'sm' }), 'text-lg')).toContain('text-lg')
      expect(cn(formattedNumberVariants({ size: 'sm' }), 'text-lg')).not.toContain('text-sm')
    })
  })

  describe('edge cases', () => {
    it('a long number stays on one line', () => expect(num({ value: 123456789012345678901234567890n }).classes()).toContain('whitespace-nowrap'))
    it('empty fallback keeps an empty root', () => expect(num({ value: NaN, fallback: '' }).text()).toBe(''))
    it('uses only token colours', () => {
      for (const tone of formattedNumberTones) expect(num({ tone }).classes().join(' ')).not.toMatch(/#[0-9a-f]{3,6}|rgb|hsl|gradient/)
    })
  })
})
