import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import MediaFrame from './MediaFrame.vue'
import { useContractHarness } from '../shared/contract-harness/testing'
import {
  mediaFrameAppearanceNames,
  mediaFrameBarVariants,
  mediaFrameDotVariants,
  mediaFrameNotchVariants,
  mediaFrameShapeNames,
  mediaFrameSizeNames,
  mediaFrameTitleVariants,
  mediaFrameVariantNames,
  mediaFrameVariants,
} from './variants'

const { errors, open } = useContractHarness()
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
})
const mountWith = (props: Record<string, unknown> = {}, slots: Record<string, string> = { default: '<p>Content</p>' }) => (w = mount(MediaFrame, { props: { title: 'localhost/app', ...props }, slots }))
const bar = () => w!.find('[data-slot="media-frame-bar"]')
const dots = () => w!.findAll('[data-slot="media-frame-dots"] > span')
const title = () => w!.find('[data-slot="media-frame-title"]')
const notch = () => w!.find('[data-slot="media-frame-notch"]')

describe('MediaFrame variations', () => {
  describe('defaults are unchanged', () => {
    it('browser keeps the original frame, bar, dots and title classes', () => {
      mountWith()
      expect([...w!.classes()].sort()).toEqual(['bg-card', 'border', 'flex', 'flex-col', 'min-w-0', 'overflow-hidden', 'relative', 'rounded-lg', 'text-card-foreground'])
      expect([...bar().classes()].sort()).toEqual(['bg-muted', 'border-b', 'flex', 'gap-3', 'items-center', 'px-3', 'py-2'])
      expect(dots()).toHaveLength(3)
      expect([...dots()[0].classes()].sort()).toEqual(['bg-muted-foreground/40', 'rounded-full', 'size-2.5'])
      expect([...title().classes()].sort()).toEqual(['bg-background', 'border', 'flex-1', 'min-w-0', 'px-3', 'py-1', 'rounded-md', 'text-center', 'text-muted-foreground', 'text-xs', 'truncate'])
      for (const [a, v] of [['data-size', 'md'], ['data-shape', 'rounded'], ['data-appearance', 'bordered'], ['data-variant', 'browser']]) expect(w!.attributes(a)).toBe(v)
    })
    it('window title and phone frame keep their original classes', () => {
      mountWith({ variant: 'window' })
      expect([...title().classes()].sort()).toEqual(['flex-1', 'font-mono', 'min-w-0', 'text-center', 'text-muted-foreground', 'text-xs', 'truncate'])
      w!.unmount()
      mountWith({ variant: 'phone' })
      expect([...w!.classes()].sort()).toEqual(['bg-card', 'border-8', 'border-foreground', 'flex', 'flex-col', 'max-w-72', 'min-w-0', 'mx-auto', 'overflow-hidden', 'relative', 'rounded-xl', 'text-card-foreground', 'w-full'])
      expect([...notch().classes()].sort()).toEqual(['absolute', 'bg-foreground', 'h-5', 'inset-x-0', 'mx-auto', 'rounded-b-lg', 'top-0', 'w-24', 'z-10'])
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'px-2', 'py-1.5', 'size-2', 'text-xs'],
      ['md', 'px-3', 'py-2', 'size-2.5', 'text-xs'],
      ['lg', 'px-4', 'py-3', 'size-3', 'text-sm'],
    ] as const)('%s sets chrome padding %s %s, dots %s and title text %s', (size, px, py, dot, text) => {
      mountWith({ size })
      expect(bar().classes()).toEqual(expect.arrayContaining([px, py]))
      expect(bar().classes().filter((c) => /^p[xy]-/.test(c))).toHaveLength(2)
      for (const d of dots()) {
        expect(d.classes()).toContain(dot)
        expect(d.classes().filter((c) => /^size-/.test(c))).toEqual([dot])
      }
      expect(title().classes()).toContain(text)
      expect(w!.attributes('data-size')).toBe(size)
    })
    it.each([
      ['sm', 'max-w-56', 'h-4', 'w-20'],
      ['md', 'max-w-72', 'h-5', 'w-24'],
      ['lg', 'max-w-80', 'h-6', 'w-28'],
    ] as const)('phone %s is %s wide with a %s %s notch', (size, max, h, wd) => {
      mountWith({ variant: 'phone', size })
      expect(w!.classes()).toContain(max)
      expect(w!.classes().filter((c) => /^max-w-/.test(c))).toEqual([max])
      expect(notch().classes()).toEqual(expect.arrayContaining([h, wd]))
    })
    it('size does not set a phone width on the other variants', () => {
      for (const variant of ['browser', 'window', 'plain'] as const) {
        mountWith({ variant, size: 'lg' })
        expect(w!.classes().filter((c) => /^max-w-/.test(c))).toEqual([])
        w!.unmount()
      }
      w = undefined
    })
    it('plain has no chrome at any size', () => {
      mountWith({ variant: 'plain', size: 'lg' })
      expect(bar().exists()).toBe(false)
    })
    it('an unknown size falls back to md', () => {
      mountWith({ size: 'xl' })
      expect(w!.attributes('data-size')).toBe('md')
      expect(bar().classes()).toContain('px-3')
    })
  })

  describe('shape', () => {
    it.each([
      ['browser', 'rounded-lg'],
      ['window', 'rounded-lg'],
      ['plain', 'rounded-lg'],
      ['phone', 'rounded-xl'],
    ] as const)('%s is %s when rounded', (variant, cls) => {
      mountWith({ variant, shape: 'rounded' })
      expect(w!.classes().filter((c) => /^rounded-/.test(c))).toEqual([cls])
    })
    it.each(mediaFrameVariantNames)('%s has no radius when square', (variant) => {
      mountWith({ variant, shape: 'square' })
      expect(w!.classes().filter((c) => /^rounded-/.test(c))).toEqual(['rounded-none'])
      expect(w!.attributes('data-shape')).toBe('square')
    })
    it('square keeps overflow-hidden so the content is still clipped to the frame', () => {
      mountWith({ shape: 'square' })
      expect(w!.classes()).toContain('overflow-hidden')
    })
    it('an unknown shape falls back to rounded', () => {
      mountWith({ shape: 'pill' })
      expect(w!.attributes('data-shape')).toBe('rounded')
      expect(w!.classes()).toContain('rounded-lg')
    })
  })

  describe('appearance', () => {
    it.each(['browser', 'window', 'plain'] as const)('%s bordered has a border and borderless drops it but keeps a forced-colors border', (variant) => {
      mountWith({ variant, appearance: 'bordered' })
      expect(w!.classes()).toContain('border')
      expect(w!.classes()).not.toContain('forced-colors:border')
      w!.unmount()
      mountWith({ variant, appearance: 'borderless' })
      expect(w!.classes()).not.toContain('border')
      expect(w!.classes()).toContain('forced-colors:border')
      expect(w!.attributes('data-appearance')).toBe('borderless')
    })
    it('the chrome bar keeps its own separator in a borderless frame', () => {
      mountWith({ appearance: 'borderless' })
      expect(bar().classes()).toContain('border-b')
    })
    it('the phone keeps its bezel in both appearances', () => {
      for (const appearance of mediaFrameAppearanceNames) {
        mountWith({ variant: 'phone', appearance })
        expect(w!.classes()).toEqual(expect.arrayContaining(['border-8', 'border-foreground']))
        expect(w!.classes()).not.toContain('forced-colors:border')
        w!.unmount()
      }
      w = undefined
    })
    it('an unknown appearance falls back to bordered', () => {
      mountWith({ appearance: 'glass' })
      expect(w!.attributes('data-appearance')).toBe('bordered')
      expect(w!.classes()).toContain('border')
    })
  })

  describe('combinations, overrides and contracts', () => {
    const combos = mediaFrameVariantNames.flatMap((variant) => mediaFrameSizeNames.flatMap((size) => mediaFrameShapeNames.map((shape) => [variant, size, shape] as const)))
    it.each(combos)('%s at size %s with shape %s renders the content in one figure with one radius', (variant, size, shape) => {
      mountWith({ variant, size, shape, appearance: 'borderless', elevated: true })
      expect(w!.element.tagName).toBe('FIGURE')
      expect(w!.find('[data-slot="media-frame-content"]').text()).toBe('Content')
      expect(w!.classes().filter((c) => /^rounded-/.test(c))).toHaveLength(1)
      expect(w!.classes()).toContain('shadow-md')
    })
    it('chrome stays decorative at every size: dots and notch are aria-hidden', () => {
      for (const size of mediaFrameSizeNames) {
        mountWith({ size }, {})
        expect(w!.find('[data-slot="media-frame-dots"]').attributes('aria-hidden')).toBe('true')
        w!.unmount()
        mountWith({ size, variant: 'phone' }, {})
        expect(notch().attributes('aria-hidden')).toBe('true')
        w!.unmount()
      }
      w = undefined
    })
    it('the class prop and contentClass still win', () => {
      mountWith({ shape: 'square', appearance: 'borderless', class: 'rounded-xl border-2 custom', contentClass: 'p-4' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['rounded-xl', 'border-2', 'custom']))
      expect(w!.classes()).not.toContain('rounded-none')
      expect(w!.find('[data-slot="media-frame-content"]').classes()).toContain('p-4')
    })
    it('a long title truncates and empty slots render an empty content area at every size', () => {
      for (const size of mediaFrameSizeNames) {
        mountWith({ size, title: 'x'.repeat(500) }, {})
        expect(title().classes()).toEqual(expect.arrayContaining(['truncate', 'min-w-0']))
        expect(w!.find('[data-slot="media-frame-content"]').text()).toBe('')
        w!.unmount()
      }
      w = undefined
    })
    it('the alt contract holds in every variation', async () => {
      await open(MediaFrame, { src: '/s.png', variant: 'phone', size: 'lg', shape: 'square', appearance: 'borderless' })
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('requires an `alt` string')
      await open(MediaFrame, { src: '/s.png', alt: 'Settings page', variant: 'phone', size: 'sm', shape: 'square' })
      expect(errors).toEqual([])
      await open(MediaFrame, { src: '/s.png', alt: '', size: 'lg' })
      expect(errors).toEqual([])
    })
    it('the image keeps its alt when it comes from src', () => {
      w = mount(MediaFrame, { props: { src: '/s.png', alt: 'Settings page', size: 'lg', shape: 'square' } })
      expect(w.find('img').attributes('alt')).toBe('Settings page')
    })
  })

  describe('cva helpers', () => {
    it('defaults equal the component defaults', () => {
      expect(mediaFrameVariants()).toContain('rounded-lg')
      expect(mediaFrameBarVariants()).toContain('px-3')
      expect(mediaFrameDotVariants()).toContain('size-2.5')
      expect(mediaFrameTitleVariants()).toContain('rounded-md')
      expect(mediaFrameNotchVariants()).toContain('h-5')
    })
    it('no combination has two radii, arbitrary values or blur', () => {
      for (const variant of mediaFrameVariantNames) {
        for (const shape of mediaFrameShapeNames) {
          for (const appearance of mediaFrameAppearanceNames) {
            const c = mediaFrameVariants({ variant, shape, appearance }).split(' ')
            expect(c.filter((x) => /^rounded-/.test(x))).toHaveLength(1)
            expect(c.join(' ')).not.toMatch(/\[|blur|gradient/)
          }
        }
      }
    })
  })
})
