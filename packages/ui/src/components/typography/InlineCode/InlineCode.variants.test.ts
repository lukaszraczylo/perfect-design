import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import InlineCode from './InlineCode.vue'
import { inlineCodeSizes, inlineCodeTones, inlineCodeVariantNames, inlineCodeVariants } from './variants'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

describe('InlineCode variations', () => {
  it('default output is unchanged', () => {
    const original = 'rounded-sm bg-muted px-1 py-0.5 font-mono text-sm font-medium text-foreground break-words'
    expect(set(mount(InlineCode).classes().join(' '))).toEqual(set(original))
    expect(set(cn(inlineCodeVariants()))).toEqual(set(original))
    expect(mount(InlineCode, { slots: { default: 'x' } }).element.children).toHaveLength(0)
  })

  describe('variant', () => {
    it('outline has a hairline border and no fill', () => {
      const c = mount(InlineCode, { props: { variant: 'outline' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['border', 'border-border', 'bg-transparent', 'px-1']))
      expect(c).not.toContain('bg-muted')
    })
    it('plain drops the chip: no fill, no horizontal padding', () => {
      const c = mount(InlineCode, { props: { variant: 'plain' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['bg-transparent', 'px-0', 'font-mono']))
      expect(c).not.toContain('bg-muted')
      expect(c).not.toContain('px-1')
      expect(c).not.toContain('border')
    })
    it('unknown variant falls back to default', () => {
      const c = mount(InlineCode, { props: { variant: 'soft' as never } }).classes()
      expect(c).toContain('bg-muted')
      expect(c).not.toContain('bg-transparent')
    })
  })

  describe('size', () => {
    it.each([
      ['xs', 'text-xs'],
      ['sm', 'text-sm'],
      ['md', 'text-base'],
      ['lg', 'text-md'],
    ] as const)('%s uses %s', (size, cls) => {
      const c = mount(InlineCode, { props: { size } }).classes()
      expect(c.filter((x) => /^text-(xs|sm|base|md)$/.test(x))).toEqual([cls])
    })
    it('unknown size falls back to sm', () => {
      expect(mount(InlineCode, { props: { size: 'jumbo' as never } }).classes()).toContain('text-sm')
    })
  })

  describe('tone', () => {
    const TINT = {
      primary: ['bg-primary/10', 'text-primary'],
      success: ['bg-success/15', 'text-success'],
      danger: ['bg-destructive/10', 'text-destructive'],
      info: ['bg-info/15', 'text-info'],
    } as const
    it.each(Object.entries(TINT))('default variant tints the chip for %s and drops bg-muted', (tone, expected) => {
      const c = mount(InlineCode, { props: { tone: tone as never } }).classes()
      expect(c).toEqual(expect.arrayContaining([...expected]))
      expect(c).not.toContain('bg-muted')
    })
    it.each(Object.entries(TINT))('outline variant colours border and text for %s', (tone, expected) => {
      const c = mount(InlineCode, { props: { variant: 'outline', tone: tone as never } }).classes()
      expect(c).toContain(expected[1])
      expect(c.some((x) => /^border-(primary|success|destructive|info)\/50$/.test(x))).toBe(true)
      expect(c).not.toContain('border-border')
      expect(c).toContain('bg-transparent')
    })
    it.each(Object.entries(TINT))('plain variant colours only the text for %s', (tone, expected) => {
      const c = mount(InlineCode, { props: { variant: 'plain', tone: tone as never } }).classes()
      expect(c).toContain(expected[1])
      expect(c.some((x) => x.startsWith('bg-') && x !== 'bg-transparent')).toBe(false)
    })
    it('neutral is the default look', () => {
      expect(set(mount(InlineCode, { props: { tone: 'neutral' } }).classes().join(' '))).toEqual(set(mount(InlineCode).classes().join(' ')))
    })
    it('unknown tone falls back to neutral', () => {
      const c = mount(InlineCode, { props: { tone: 'warning' as never } }).classes()
      expect(c).toContain('bg-muted')
      expect(c.some((x) => x.includes('warning'))).toBe(false)
    })
  })

  describe('combinations', () => {
    it('every variant x size x tone mounts and keeps one background decision', () => {
      for (const variant of inlineCodeVariantNames)
        for (const size of inlineCodeSizes)
          for (const tone of inlineCodeTones) {
            const c = mount(InlineCode, { props: { variant, size, tone } }).classes()
            expect(c.filter((x) => /^bg-/.test(x))).toHaveLength(1)
            expect(c.filter((x) => /^text-(xs|sm|base|md)$/.test(x))).toHaveLength(1)
            expect(c).toEqual(expect.arrayContaining(['font-mono', 'break-words']))
          }
    })
    it('class prop wins over variant, size and tone', () => {
      const c = mount(InlineCode, { props: { variant: 'outline', tone: 'primary', size: 'lg', class: 'border-success text-xs text-foreground' } }).classes()
      expect(c).toContain('border-success')
      expect(c).not.toContain('border-primary/50')
      expect(c).toContain('text-xs')
      expect(c).not.toContain('text-md')
      expect(c).toContain('text-foreground')
      expect(c).not.toContain('text-primary')
    })
    it('as and asChild keep the variants', () => {
      expect(mount(InlineCode, { props: { as: 'kbd', variant: 'outline' } }).element.tagName).toBe('KBD')
      const w = mount(InlineCode, { props: { asChild: true, tone: 'info' }, slots: { default: '<samp>x</samp>' } })
      expect(w.element.tagName).toBe('SAMP')
      expect(w.classes()).toContain('text-info')
    })
    it('long unbroken text still wraps in every variant', () => {
      for (const variant of inlineCodeVariantNames) {
        const w = mount(InlineCode, { props: { variant }, slots: { default: 'a'.repeat(4000) } })
        expect(w.text()).toHaveLength(4000)
        expect(w.classes()).toContain('break-words')
      }
    })
    it('inlineCodeVariants is reusable through cn()', () => {
      const merged = cn(inlineCodeVariants({ tone: 'success' }))
      expect(merged).toContain('bg-success/15')
      expect(merged).not.toContain('bg-muted')
    })
  })
})
