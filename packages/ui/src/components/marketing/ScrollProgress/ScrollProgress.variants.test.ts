import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ScrollProgress from './ScrollProgress.vue'
import {
  SCROLL_PROGRESS_SIZES,
  SCROLL_PROGRESS_TONES,
  SCROLL_PROGRESS_VARIANTS,
  scrollProgressBarVariants,
  scrollProgressVariants,
} from './variants'

let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
  vi.restoreAllMocks()
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})
const bar = () => w!.find('[data-slot="scroll-progress-bar"]')
const mountWith = (props: Record<string, unknown> = {}) => (w = mount(ScrollProgress, { props }))

describe('ScrollProgress variations', () => {
  describe('defaults are unchanged', () => {
    it('root keeps the original classes (bar, md, top, primary)', () => {
      mountWith()
      expect([...w!.classes()].sort()).toEqual(['bg-transparent', 'fixed', 'h-1', 'inset-x-0', 'pointer-events-none', 'top-0', 'z-(--z-overlay)'])
      expect(w!.attributes('data-variant')).toBe('bar')
      expect(w!.attributes('data-size')).toBe('md')
      expect(w!.attributes('data-tone')).toBe('primary')
      expect(w!.attributes('data-position')).toBe('top')
    })
    it('the fill keeps the original classes', () => {
      mountWith()
      expect([...bar().classes()].sort()).toEqual(
        ['bg-primary', 'forced-colors:border-b-4', 'forced-colors:border-current', 'h-full', 'motion-safe:duration-100', 'motion-safe:transition-transform', 'origin-left', 'rtl:origin-right', 'w-full'].sort(),
      )
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'h-0.5'],
      ['md', 'h-1'],
      ['lg', 'h-1.5'],
    ] as const)('%s sets the thickness %s and only that height class', (size, cls) => {
      mountWith({ size })
      expect(w!.classes()).toContain(cls)
      expect(w!.classes().filter((c) => /^h-/.test(c))).toEqual([cls])
      expect(w!.attributes('data-size')).toBe(size)
    })
    it('an unknown size falls back to md', () => {
      mountWith({ size: 'huge' })
      expect(w!.classes()).toContain('h-1')
      expect(w!.attributes('data-size')).toBe('md')
    })
  })

  describe('tone', () => {
    it.each([
      ['primary', 'bg-primary'],
      ['neutral', 'bg-foreground'],
      ['success', 'bg-success'],
      ['info', 'bg-info'],
    ] as const)('%s fills with %s and no other fill colour', (tone, cls) => {
      mountWith({ tone })
      expect(bar().classes()).toContain(cls)
      expect(bar().classes().filter((c) => /^bg-/.test(c))).toEqual([cls])
      expect(w!.attributes('data-tone')).toBe(tone)
    })
    it('an unknown tone falls back to primary', () => {
      mountWith({ tone: 'purple' })
      expect(bar().classes()).toContain('bg-primary')
      expect(w!.attributes('data-tone')).toBe('primary')
    })
    it('every tone keeps the progressbar role, name and value text (colour is not the signal)', () => {
      for (const tone of SCROLL_PROGRESS_TONES) {
        mountWith({ tone })
        expect(w!.attributes('role')).toBe('progressbar')
        expect(w!.attributes('aria-label')).toBe('Reading progress')
        expect(w!.attributes('aria-valuetext')).toBe('0%')
        w!.unmount()
      }
      w = undefined
    })
  })

  describe('variant', () => {
    it('bar is a flush strip with a transparent track and square ends', () => {
      mountWith({ variant: 'bar' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['inset-x-0', 'bg-transparent', 'top-0']))
      expect(w!.classes()).not.toContain('rounded-full')
      expect(bar().classes()).not.toContain('rounded-full')
    })
    it('rounded clips and rounds the strip and the fill, still flush with the edge', () => {
      mountWith({ variant: 'rounded' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['inset-x-0', 'overflow-hidden', 'rounded-full', 'bg-transparent', 'top-0']))
      expect(bar().classes()).toContain('rounded-full')
      expect(w!.attributes('data-variant')).toBe('rounded')
    })
    it('inset floats a muted rounded track away from the edge and the viewport sides', () => {
      mountWith({ variant: 'inset' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['inset-x-4', 'top-2', 'overflow-hidden', 'rounded-full', 'bg-muted']))
      expect(w!.classes()).not.toContain('inset-x-0')
      expect(w!.classes()).not.toContain('top-0')
      expect(bar().classes()).toContain('rounded-full')
    })
    it('inset at the bottom uses a bottom gap, not top-0 or bottom-0', () => {
      mountWith({ variant: 'inset', position: 'bottom' })
      expect(w!.classes()).toContain('bottom-2')
      expect(w!.classes()).not.toContain('bottom-0')
      expect(w!.classes()).not.toContain('top-2')
    })
    it('an unknown variant falls back to bar', () => {
      mountWith({ variant: 'pill' })
      expect(w!.attributes('data-variant')).toBe('bar')
      expect(w!.classes()).not.toContain('rounded-full')
    })
    it('the rounded and inset variants keep the visible fill rules for forced-colors and reduced motion', () => {
      for (const variant of SCROLL_PROGRESS_VARIANTS) {
        mountWith({ variant })
        expect(bar().classes()).toEqual(expect.arrayContaining(['forced-colors:border-b-4', 'forced-colors:border-current', 'motion-safe:transition-transform', 'rtl:origin-right']))
        expect(bar().classes()).not.toContain('transition-transform')
        w!.unmount()
      }
      w = undefined
    })
    it('every variant stays non-interactive and fixed', () => {
      for (const variant of SCROLL_PROGRESS_VARIANTS) {
        mountWith({ variant })
        expect(w!.classes()).toEqual(expect.arrayContaining(['pointer-events-none', 'fixed']))
        w!.unmount()
      }
      w = undefined
    })
  })

  describe('position', () => {
    it('top and bottom stay mutually exclusive for flush variants', () => {
      mountWith({ position: 'bottom', variant: 'rounded' })
      expect(w!.classes()).toContain('bottom-0')
      expect(w!.classes()).not.toContain('top-0')
    })
    it('an unknown position falls back to top', () => {
      mountWith({ position: 'left' })
      expect(w!.classes()).toContain('top-0')
      expect(w!.attributes('data-position')).toBe('top')
    })
  })

  describe('combinations and class override', () => {
    it.each(SCROLL_PROGRESS_SIZES.flatMap((size) => SCROLL_PROGRESS_VARIANTS.map((variant) => [size, variant] as const)))('size %s with variant %s has one height and one inset rule', (size, variant) => {
      mountWith({ size, variant })
      expect(w!.classes().filter((c) => /^h-/.test(c))).toHaveLength(1)
      expect(w!.classes().filter((c) => /^inset-x-/.test(c))).toHaveLength(1)
      expect(w!.classes().filter((c) => /^(top|bottom)-/.test(c))).toHaveLength(1)
    })
    it('tone with variant keeps one fill colour and the rounded end', () => {
      mountWith({ tone: 'success', variant: 'inset', size: 'lg' })
      expect(bar().classes()).toEqual(expect.arrayContaining(['bg-success', 'rounded-full']))
      expect(w!.classes()).toContain('h-1.5')
    })
    it('the class prop wins over variant classes', () => {
      mountWith({ size: 'lg', variant: 'inset', class: 'h-2 inset-x-8 static' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['h-2', 'inset-x-8', 'static']))
      expect(w!.classes()).not.toContain('h-1.5')
      expect(w!.classes()).not.toContain('inset-x-4')
      expect(w!.classes()).not.toContain('fixed')
    })
    it('the progress value still tracks scrolling in every variant', async () => {
      vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
      vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(1000)
      mountWith({ variant: 'inset', tone: 'info', size: 'sm' })
      Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await nextTick()
      expect(w!.attributes('aria-valuenow')).toBe('50')
      expect(bar().attributes('style')).toContain('scaleX(0.5)')
    })
    it('the label contract holds in every variation', () => {
      mountWith({ variant: 'rounded', size: 'sm', tone: 'neutral', label: 'Lesefortschritt' })
      expect(w!.attributes('aria-label')).toBe('Lesefortschritt')
    })
  })

  describe('cva helpers', () => {
    it('scrollProgressVariants() with no arguments equals the defaults', () => {
      expect(scrollProgressVariants()).toBe(scrollProgressVariants({ variant: 'bar', size: 'md', position: 'top' }))
      expect(scrollProgressVariants({ class: 'extra' })).toMatch(/ extra$/)
    })
    it('scrollProgressBarVariants maps every tone', () => {
      expect(SCROLL_PROGRESS_TONES.map((tone) => scrollProgressBarVariants({ tone }).match(/bg-\w+/)![0])).toEqual(['bg-primary', 'bg-foreground', 'bg-success', 'bg-info'])
    })
    it('uses tokens only: no arbitrary values, gradients, blur or shadows', () => {
      const all = SCROLL_PROGRESS_VARIANTS.flatMap((variant) => SCROLL_PROGRESS_TONES.map((tone) => scrollProgressVariants({ variant }) + ' ' + scrollProgressBarVariants({ variant, tone }))).join(' ')
      expect(all).not.toMatch(/\[|gradient|blur|shadow|glow/)
    })
  })
})
