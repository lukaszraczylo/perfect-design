import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import StatCounter from './StatCounter.vue'
import StatGrid from '../StatGrid/StatGrid.vue'
import { useContractHarness } from '../shared/contract-harness/testing'
import { STAT_COUNTER_ALIGNS, STAT_COUNTER_SIZES, STAT_COUNTER_TONES, statCounterVariants } from './variants'

const { errors, open } = useContractHarness()
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
  vi.unstubAllGlobals()
})
const mountWith = (props: Record<string, unknown> = {}) => (w = mount(StatCounter, { props: { value: 1234, ...props } }))

describe('StatCounter variations', () => {
  describe('defaults are unchanged', () => {
    it('is an inline span with only tabular-nums, so it inherits size and colour', () => {
      mountWith()
      expect(w!.element.tagName).toBe('SPAN')
      expect(w!.classes()).toEqual(['tabular-nums'])
      expect(w!.text()).toBe('1,234')
      expect(w!.attributes('data-size')).toBeUndefined()
      expect(w!.attributes('data-align')).toBeUndefined()
      expect(w!.attributes('data-tone')).toBe('default')
    })
    it('inside StatGrid it stays unstyled so the grid value size applies', () => {
      const g = mount(StatGrid, { props: { items: [{ value: 5, label: 'Sample' }] } })
      expect(g.find('[data-slot="stat-counter"]').classes()).toEqual(['tabular-nums'])
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'text-2xl'],
      ['md', 'text-4xl'],
      ['lg', 'text-6xl'],
    ] as const)('%s sets %s with semibold tight figures', (size, cls) => {
      mountWith({ size })
      expect(w!.classes()).toEqual(expect.arrayContaining([cls, 'font-semibold', 'tracking-tight', 'tabular-nums']))
      expect(w!.classes().filter((c) => /^text-(2xl|4xl|6xl)$/.test(c))).toEqual([cls])
      expect(w!.attributes('data-size')).toBe(size)
    })
    it('stays inline: size alone does not make it a block', () => {
      mountWith({ size: 'lg' })
      expect(w!.classes()).not.toContain('block')
    })
    it('an unknown size is ignored and the figure inherits', () => {
      mountWith({ size: 'huge' })
      expect(w!.classes()).toEqual(['tabular-nums'])
      expect(w!.attributes('data-size')).toBeUndefined()
    })
  })

  describe('tone', () => {
    it.each([
      ['primary', 'text-primary'],
      ['muted', 'text-muted-foreground'],
      ['success', 'text-success'],
      ['info', 'text-info'],
      ['danger', 'text-destructive'],
    ] as const)('%s uses the %s token only', (tone, cls) => {
      mountWith({ tone })
      expect(w!.classes()).toContain(cls)
      expect(w!.classes().filter((c) => /^text-/.test(c))).toEqual([cls])
      expect(w!.attributes('data-tone')).toBe(tone)
    })
    it('default adds no colour class', () => {
      mountWith({ tone: 'default', size: 'md' })
      expect(w!.classes().filter((c) => /^text-(primary|muted|success|info|destructive)/.test(c))).toEqual([])
    })
    it('an unknown tone falls back to default', () => {
      mountWith({ tone: 'warning' })
      expect(w!.attributes('data-tone')).toBe('default')
      expect(w!.classes()).toEqual(['tabular-nums'])
    })
    it('only uses tokens that the contrast test covers (primary, muted-foreground, success, info, destructive)', () => {
      for (const tone of STAT_COUNTER_TONES) expect(statCounterVariants({ tone })).not.toMatch(/text-warning|-\d{3}\b|\[/)
    })
  })

  describe('align', () => {
    it.each([
      ['start', 'text-start'],
      ['center', 'text-center'],
      ['end', 'text-end'],
    ] as const)('%s makes the figure a block with %s', (align, cls) => {
      mountWith({ align })
      expect(w!.classes()).toEqual(expect.arrayContaining(['block', cls]))
      expect(w!.attributes('data-align')).toBe(align)
    })
    it('uses logical alignment only', () => {
      for (const align of STAT_COUNTER_ALIGNS) expect(statCounterVariants({ align })).not.toMatch(/text-(left|right)/)
    })
    it('an unknown align is ignored and the figure stays inline', () => {
      mountWith({ align: 'justify' })
      expect(w!.classes()).not.toContain('block')
      expect(w!.attributes('data-align')).toBeUndefined()
    })
  })

  describe('static, formatting and contracts hold in every variation', () => {
    it('never animates or observes: no IntersectionObserver or requestAnimationFrame is used', () => {
      const io = vi.fn()
      const raf = vi.fn()
      vi.stubGlobal('IntersectionObserver', io)
      vi.stubGlobal('requestAnimationFrame', raf)
      mountWith({ size: 'lg', tone: 'success', align: 'center', animate: true, duration: 500 })
      expect(io).not.toHaveBeenCalled()
      expect(raf).not.toHaveBeenCalled()
      expect(w!.text()).toBe('1,234')
    })
    it('prefix, suffix, decimals, locale and fallback still apply', () => {
      mountWith({ value: 12.5, decimals: 1, prefix: '$', suffix: '%', size: 'sm', tone: 'info' })
      expect(w!.text()).toBe('$12.5%')
      w!.unmount()
      mountWith({ value: 1234.5, decimals: 2, locale: 'de-DE', size: 'md' })
      expect(w!.text()).toBe('1.234,50')
      w!.unmount()
      mountWith({ value: Number.NaN, fallback: 'not reported', size: 'lg', tone: 'danger' })
      expect(w!.text()).toBe('not reported')
    })
    it('every size, tone and align combination renders the same text', () => {
      for (const size of STAT_COUNTER_SIZES) {
        for (const tone of STAT_COUNTER_TONES) {
          for (const align of STAT_COUNTER_ALIGNS) {
            mountWith({ size, tone, align })
            expect(w!.text()).toBe('1,234')
            expect(w!.classes().filter((c) => /^text-(2xl|4xl|6xl)$/.test(c))).toHaveLength(1)
            w!.unmount()
          }
        }
      }
      w = undefined
    })
    it('the class prop wins over size, tone and align', () => {
      mountWith({ size: 'lg', tone: 'success', align: 'center', class: 'text-sm text-foreground text-end custom' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['text-sm', 'text-foreground', 'text-end', 'custom']))
      expect(w!.classes()).not.toContain('text-6xl')
      expect(w!.classes()).not.toContain('text-success')
      expect(w!.classes()).not.toContain('text-center')
    })
    it('a huge number and a long unicode prefix do not break the largest size', () => {
      mountWith({ value: Number.MAX_SAFE_INTEGER, size: 'lg', prefix: '株式会社'.repeat(20) })
      expect(w!.text().length).toBeGreaterThan(80)
    })
    it('a non-finite value still throws the contract error in a styled counter, unless a fallback is set', async () => {
      await open(StatCounter, { value: Number.NaN, size: 'lg', tone: 'danger', align: 'center' })
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('requires a finite number')
      await open(StatCounter, { value: Number.NaN, fallback: 'not reported', size: 'lg' })
      expect(errors).toEqual([])
    })
  })

  describe('cva helper', () => {
    it('with no arguments it is the original class', () => {
      expect(statCounterVariants()).toBe('tabular-nums')
    })
  })
})
