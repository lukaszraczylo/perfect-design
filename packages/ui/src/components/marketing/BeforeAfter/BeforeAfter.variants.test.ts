import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import BeforeAfter from './BeforeAfter.vue'
import { useContractHarness } from '../shared/contract-harness/testing'
import {
  BEFORE_AFTER_APPEARANCES,
  BEFORE_AFTER_ORIENTATIONS,
  BEFORE_AFTER_SHAPES,
  BEFORE_AFTER_SIZES,
  BEFORE_AFTER_TONES,
  BEFORE_AFTER_VARIANTS,
  beforeAfterCaptionVariants,
  beforeAfterHandleVariants,
  beforeAfterKnobVariants,
  beforeAfterLabelVariants,
  beforeAfterLineVariants,
  beforeAfterVariants,
} from './variants'

const { errors, open } = useContractHarness()
const base = { before: '/b.jpg', after: '/a.jpg', beforeAlt: 'Old layout', afterAlt: 'New layout' }
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
})
const mountWith = (props: Record<string, unknown> = {}) => (w = mount(BeforeAfter, { props: { ...base, ...props } }))
const slider = () => w!.find('[role="slider"]')
const knob = () => w!.find('[data-slot="before-after-knob"]')
const line = () => slider().find('span')
const before = () => w!.find('[data-slot="before-after-before-label"]')
const after = () => w!.find('[data-slot="before-after-after-label"]')

describe('BeforeAfter variations', () => {
  describe('defaults are unchanged', () => {
    it('root, handle, line, knob and chips keep their original classes', () => {
      mountWith()
      expect([...w!.classes()].sort()).toEqual(['bg-muted', 'border', 'cursor-ew-resize', 'overflow-hidden', 'relative', 'rounded-lg', 'select-none', 'touch-pan-y', 'w-full'])
      expect([...slider().classes()].sort()).toEqual(['-translate-x-1/2', 'absolute', 'focus-visible:-outline-offset-2', 'focus-visible:outline-2', 'focus-visible:outline-ring', 'focus-visible:outline-solid', 'group', 'inset-y-0', 'outline-hidden', 'w-10'])
      expect([...line().classes()].sort()).toEqual(['-translate-x-1/2', 'absolute', 'bg-background', 'inset-y-0', 'left-1/2', 'w-0.5'])
      expect(knob().classes()).toEqual(
        expect.arrayContaining(['absolute', 'left-1/2', 'top-1/2', 'flex', 'size-9', '-translate-x-1/2', '-translate-y-1/2', 'items-center', 'justify-center', 'gap-0.5', 'rounded-full', 'border', 'bg-background', 'text-foreground', 'group-focus-visible:border-ring', 'group-focus-visible:ring-3', 'group-focus-visible:ring-ring/40', 'forced-colors:group-focus-visible:outline-2', 'forced-colors:group-focus-visible:outline-offset-2']),
      )
      expect([...before().classes()].sort()).toEqual(['absolute', 'bg-background', 'border', 'font-medium', 'left-3', 'pointer-events-none', 'px-2', 'py-0.5', 'rounded-md', 'text-foreground', 'text-xs', 'top-3'])
      for (const [attr, value] of [['data-variant', 'overlay'], ['data-size', 'md'], ['data-shape', 'rounded'], ['data-tone', 'default'], ['data-appearance', 'knob'], ['data-orientation', 'horizontal']]) expect(w!.attributes(attr)).toBe(value)
    })
  })

  describe('variant (label placement)', () => {
    it('overlay shows a chip in the corner of each image and no caption bar', () => {
      mountWith({ variant: 'overlay' })
      expect(before().classes()).toContain('left-3')
      expect(after().classes()).toContain('right-3')
      expect(w!.find('[data-slot="before-after-captions"]').exists()).toBe(false)
    })
    it('bar docks one opaque strip along the bottom with both labels in physical order', () => {
      mountWith({ variant: 'bar' })
      const strip = w!.find('[data-slot="before-after-captions"]')
      expect(strip.classes()).toEqual(expect.arrayContaining(['absolute', 'inset-x-0', 'bottom-0', 'border-t', 'bg-background', 'text-foreground', 'justify-between']))
      expect(strip.attributes('aria-hidden')).toBe('true')
      expect(strip.attributes('dir')).toBe('ltr')
      expect(strip.findAll('[data-slot$="-label"]').map((n) => n.text())).toEqual(['Before', 'After'])
      expect(before().classes()).not.toContain('absolute')
      expect(before().attributes('dir')).toBe('auto')
      expect(w!.attributes('data-variant')).toBe('bar')
    })
    it('bar has no blur, translucency or shadow', () => {
      mountWith({ variant: 'bar' })
      expect(w!.html()).not.toMatch(/blur|backdrop|shadow-|bg-background\//)
    })
    it('none renders no labels but the slider still names both sides', () => {
      mountWith({ variant: 'none', beforeLabel: 'Old', afterLabel: 'New' })
      expect(before().exists()).toBe(false)
      expect(after().exists()).toBe(false)
      expect(w!.find('[data-slot="before-after-captions"]').exists()).toBe(false)
      expect(slider().attributes('aria-valuetext')).toBe('50% Old, 50% New')
      expect(w!.attributes('data-variant')).toBe('none')
    })
    it('showLabels=false wins over every placement', () => {
      for (const variant of BEFORE_AFTER_VARIANTS) {
        mountWith({ variant, showLabels: false })
        expect(before().exists()).toBe(false)
        expect(w!.find('[data-slot="before-after-captions"]').exists()).toBe(false)
        expect(w!.attributes('data-variant')).toBe('none')
        w!.unmount()
      }
      w = undefined
    })
    it('an unknown variant falls back to overlay', () => {
      mountWith({ variant: 'below' })
      expect(w!.attributes('data-variant')).toBe('overlay')
      expect(before().classes()).toContain('absolute')
    })
    it('labels stay decorative in every placement', () => {
      for (const variant of ['overlay', 'bar'] as const) {
        mountWith({ variant })
        const holders = variant === 'bar' ? [w!.find('[data-slot="before-after-captions"]')] : [before(), after()]
        for (const h of holders) expect(h.attributes('aria-hidden')).toBe('true')
        w!.unmount()
      }
      w = undefined
    })
    it('long and unicode labels truncate inside the bar instead of overflowing', () => {
      mountWith({ variant: 'bar', beforeLabel: '前'.repeat(200), afterLabel: 'x'.repeat(300) })
      expect(before().classes()).toEqual(expect.arrayContaining(['min-w-0', 'truncate']))
      expect(after().classes()).toEqual(expect.arrayContaining(['min-w-0', 'truncate']))
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'w-8', 'size-7', 'text-xs'],
      ['md', 'w-10', 'size-9', 'text-xs'],
      ['lg', 'w-12', 'size-11', 'text-sm'],
    ] as const)('%s sets handle %s, knob %s and chip text %s', (size, handle, knobCls, text) => {
      mountWith({ size })
      expect(slider().classes()).toContain(handle)
      expect(slider().classes().filter((c) => /^w-\d/.test(c))).toEqual([handle])
      expect(knob().classes()).toContain(knobCls)
      expect(knob().classes().filter((c) => /^size-/.test(c))).toEqual([knobCls])
      expect(before().classes()).toContain(text)
      expect(w!.attributes('data-size')).toBe(size)
    })
    it.each([
      ['sm', 'h-8'],
      ['md', 'h-10'],
      ['lg', 'h-12'],
    ] as const)('vertical %s sizes the hit area by height', (size, cls) => {
      mountWith({ size, orientation: 'vertical' })
      expect(slider().classes()).toContain(cls)
      expect(slider().classes().filter((c) => /^(w|h)-\d/.test(c))).toEqual([cls])
    })
    it('every size keeps a hit area of at least 2rem (above the 24px target)', () => {
      for (const size of BEFORE_AFTER_SIZES) expect(beforeAfterHandleVariants({ size })).toMatch(/\bw-(8|10|12)\b/)
    })
    it('bar caption padding and text follow the size', () => {
      for (const [size, text] of [['sm', 'text-xs'], ['md', 'text-xs'], ['lg', 'text-sm']] as const) {
        mountWith({ size, variant: 'bar' })
        expect(w!.find('[data-slot="before-after-captions"]').classes()).toContain(text)
        w!.unmount()
      }
      w = undefined
    })
    it('an unknown size falls back to md', () => {
      mountWith({ size: 'xl' })
      expect(slider().classes()).toContain('w-10')
      expect(w!.attributes('data-size')).toBe('md')
    })
  })

  describe('shape', () => {
    it('rounded uses rounded-lg on the frame and rounded-md chips', () => {
      mountWith({ shape: 'rounded' })
      expect(w!.classes()).toContain('rounded-lg')
      expect(before().classes()).toContain('rounded-md')
    })
    it('square removes the radius from the frame and the chips', () => {
      mountWith({ shape: 'square' })
      expect(w!.classes()).toContain('rounded-none')
      expect(w!.classes()).not.toContain('rounded-lg')
      expect(before().classes()).toContain('rounded-none')
      expect(before().classes()).not.toContain('rounded-md')
      expect(w!.attributes('data-shape')).toBe('square')
    })
    it('the knob stays round in both shapes (it is a grip, not a corner)', () => {
      for (const shape of BEFORE_AFTER_SHAPES) {
        mountWith({ shape })
        expect(knob().classes()).toContain('rounded-full')
        w!.unmount()
      }
      w = undefined
    })
    it('an unknown shape falls back to rounded', () => {
      mountWith({ shape: 'pill' })
      expect(w!.classes()).toContain('rounded-lg')
      expect(w!.attributes('data-shape')).toBe('rounded')
    })
    it('the class prop still overrides the radius', () => {
      mountWith({ shape: 'square', class: 'rounded-xl' })
      expect(w!.classes()).toContain('rounded-xl')
      expect(w!.classes()).not.toContain('rounded-none')
    })
  })

  describe('tone', () => {
    it('default is a background-coloured line and grip', () => {
      mountWith({ tone: 'default' })
      expect(line().classes()).toContain('bg-background')
      expect(knob().classes()).toEqual(expect.arrayContaining(['bg-background', 'text-foreground']))
    })
    it('primary uses primary with primary-foreground text', () => {
      mountWith({ tone: 'primary' })
      expect(line().classes()).toContain('bg-primary')
      expect(line().classes()).not.toContain('bg-background')
      expect(knob().classes()).toEqual(expect.arrayContaining(['bg-primary', 'text-primary-foreground', 'border-primary']))
      expect(knob().classes()).not.toContain('bg-background')
      expect(w!.attributes('data-tone')).toBe('primary')
    })
    it('neutral uses the foreground colour with background text', () => {
      mountWith({ tone: 'neutral' })
      expect(line().classes()).toContain('bg-foreground')
      expect(knob().classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background', 'border-foreground']))
      expect(knob().classes()).not.toContain('text-foreground')
    })
    it('an unknown tone falls back to default', () => {
      mountWith({ tone: 'danger' })
      expect(line().classes()).toContain('bg-background')
      expect(w!.attributes('data-tone')).toBe('default')
    })
    it('every tone keeps the focus ring and the forced-colors outline on the grip', () => {
      for (const tone of BEFORE_AFTER_TONES) {
        mountWith({ tone })
        expect(knob().classes()).toEqual(expect.arrayContaining(['group-focus-visible:ring-3', 'forced-colors:group-focus-visible:outline-2']))
        w!.unmount()
      }
      w = undefined
    })
  })

  describe('appearance (handle style)', () => {
    it('knob has two arrow icons and a round grip', () => {
      mountWith({ appearance: 'knob' })
      expect(knob().findAll('svg')).toHaveLength(2)
      expect(knob().classes()).toEqual(expect.arrayContaining(['rounded-full', 'size-9']))
      expect(knob().attributes('aria-hidden')).toBe('true')
    })
    it('bar is a short rounded grip with no icons', () => {
      mountWith({ appearance: 'bar' })
      expect(knob().findAll('svg')).toHaveLength(0)
      expect(knob().classes()).toEqual(expect.arrayContaining(['h-8', 'w-2', 'rounded-full']))
      expect(knob().classes().join(' ')).not.toMatch(/size-/)
      expect(line().classes()).toContain('w-0.5')
    })
    it('bar rotates its grip for the vertical divider', () => {
      mountWith({ appearance: 'bar', orientation: 'vertical', size: 'lg' })
      expect(knob().classes()).toEqual(expect.arrayContaining(['h-2.5', 'w-10']))
      expect(line().classes()).toContain('h-0.5')
    })
    it('line renders no grip and a thicker line; the handle outline is its focus indicator', () => {
      mountWith({ appearance: 'line' })
      expect(knob().exists()).toBe(false)
      expect(line().classes()).toContain('w-1')
      expect(line().classes()).not.toContain('w-0.5')
      expect(slider().classes()).toEqual(expect.arrayContaining(['outline-hidden', 'focus-visible:outline-2', 'focus-visible:outline-solid', 'focus-visible:-outline-offset-2', 'focus-visible:outline-ring']))
      expect(w!.attributes('data-appearance')).toBe('line')
    })
    it('line vertical uses a taller line class and still has the handle hit area', () => {
      mountWith({ appearance: 'line', orientation: 'vertical' })
      expect(line().classes()).toContain('h-1')
      expect(slider().classes()).toContain('h-10')
    })
    it('every appearance has the same inset focus outline on the handle, and knob and bar add the grip ring', () => {
      for (const appearance of BEFORE_AFTER_APPEARANCES) {
        mountWith({ appearance })
        expect(slider().classes()).toEqual(expect.arrayContaining(['outline-hidden', 'focus-visible:outline-2', 'focus-visible:outline-solid', 'focus-visible:-outline-offset-2', 'focus-visible:outline-ring']))
        if (appearance !== 'line') expect(knob().classes()).toEqual(expect.arrayContaining(['group-focus-visible:ring-3', 'group-focus-visible:border-ring']))
        w!.unmount()
      }
      w = undefined
    })
    it('an unknown appearance falls back to knob', () => {
      mountWith({ appearance: 'diamond' })
      expect(w!.attributes('data-appearance')).toBe('knob')
      expect(knob().findAll('svg')).toHaveLength(2)
    })
  })

  describe('a11y and behaviour hold in every variation', () => {
    const combos = BEFORE_AFTER_APPEARANCES.flatMap((appearance) => BEFORE_AFTER_VARIANTS.flatMap((variant) => BEFORE_AFTER_ORIENTATIONS.map((orientation) => ({ appearance, variant, orientation }))))
    it.each(combos)('slider role, name, value text and tab stop: %o', (combo) => {
      mountWith({ ...combo, tone: 'primary', size: 'sm', shape: 'square' })
      expect(slider().attributes('role')).toBe('slider')
      expect(slider().attributes('tabindex')).toBe('0')
      expect(slider().attributes('aria-label')).toBe('Image comparison slider')
      expect(slider().attributes('aria-valuetext')).toBe('50% Before, 50% After')
      expect(slider().attributes('aria-orientation')).toBe(combo.orientation)
      expect(w!.find('[data-slot="before-after-before"]').attributes('alt')).toBe('Old layout')
      expect(w!.find('[data-slot="before-after-after"]').attributes('alt')).toBe('New layout')
    })
    it('keyboard operation works with the line handle and the caption bar', async () => {
      mountWith({ appearance: 'line', variant: 'bar' })
      await slider().trigger('keydown', { key: 'ArrowRight' })
      expect(slider().attributes('aria-valuenow')).toBe('52')
      await slider().trigger('keydown', { key: 'End' })
      expect(slider().attributes('aria-valuenow')).toBe('100')
      await slider().trigger('keydown', { key: 'Home' })
      expect(slider().attributes('aria-valuenow')).toBe('0')
      expect(w!.emitted('update:modelValue')!.at(-1)).toEqual([0])
    })
    it('pointer drag still works with the caption bar and square frame', async () => {
      mountWith({ variant: 'bar', shape: 'square' })
      vi.spyOn(w!.element, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 200, top: 0, right: 200, bottom: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })
      const e = new MouseEvent('pointerdown', { clientX: 50, bubbles: true, button: 0 })
      Object.assign(e, { pointerId: 1 })
      w!.element.dispatchEvent(e)
      await w!.vm.$nextTick()
      expect(slider().attributes('aria-valuenow')).toBe('25')
    })
  })

  describe('combinations and class override', () => {
    it.each(BEFORE_AFTER_SIZES.flatMap((size) => BEFORE_AFTER_ORIENTATIONS.map((orientation) => [size, orientation] as const)))('size %s with orientation %s has one hit-area dimension', (size, orientation) => {
      mountWith({ size, orientation })
      expect(slider().classes().filter((c) => /^(w|h)-\d/.test(c))).toHaveLength(1)
    })
    it('tone with appearance bar keeps one background and one text colour', () => {
      mountWith({ tone: 'neutral', appearance: 'bar' })
      expect(knob().classes().filter((c) => /^bg-/.test(c))).toEqual(['bg-foreground'])
      expect(knob().classes().filter((c) => /^text-/.test(c))).toEqual(['text-background'])
    })
    it('shape square with variant bar and size lg composes', () => {
      mountWith({ shape: 'square', variant: 'bar', size: 'lg', orientation: 'vertical' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['rounded-none', 'cursor-ns-resize', 'touch-pan-x']))
      expect(w!.find('[data-slot="before-after-captions"]').classes()).toContain('text-sm')
    })
    it('the class prop wins over variant classes and attrs fall through', () => {
      mountWith({ class: 'border-0 custom', shape: 'square' })
      expect(w!.classes()).toContain('custom')
      expect(w!.classes()).not.toContain('border')
    })
    it('switching every dimension live keeps one slider and the position', async () => {
      mountWith({ start: 35 })
      for (const appearance of BEFORE_AFTER_APPEARANCES) for (const variant of BEFORE_AFTER_VARIANTS) await w!.setProps({ appearance, variant })
      expect(w!.findAll('[role="slider"]')).toHaveLength(1)
      expect(slider().attributes('aria-valuenow')).toBe('35')
    })
  })

  describe('cva helpers', () => {
    it('beforeAfterVariants / handle / line / label / caption / knob defaults match the component', () => {
      expect(beforeAfterVariants()).toContain('rounded-lg')
      expect(beforeAfterHandleVariants()).toContain('w-10')
      expect(beforeAfterLineVariants()).toContain('bg-background')
      expect(beforeAfterLabelVariants()).toContain('rounded-md')
      expect(beforeAfterCaptionVariants()).toContain('px-3')
      expect(beforeAfterKnobVariants()).toContain('size-9')
    })
    it('the line knob helper is hidden', () => {
      expect(beforeAfterKnobVariants({ appearance: 'line' })).toContain('hidden')
    })
    it('uses tokens only: no arbitrary values, gradients, blur or shadows', () => {
      const all = [
        ...BEFORE_AFTER_TONES.flatMap((tone) => BEFORE_AFTER_APPEARANCES.flatMap((appearance) => BEFORE_AFTER_SIZES.map((size) => beforeAfterKnobVariants({ tone, appearance, size })))),
        ...BEFORE_AFTER_SHAPES.map((shape) => beforeAfterVariants({ shape })),
        ...BEFORE_AFTER_SIZES.map((size) => beforeAfterCaptionVariants({ size })),
      ].join(' ')
      expect(all).not.toMatch(/\[|gradient|blur|shadow|rounded-(2xl|3xl)/)
    })
  })

  describe('contracts stay enforced in every variation', () => {
    const looks = { variant: 'bar', size: 'lg', shape: 'square', tone: 'primary', appearance: 'line', orientation: 'vertical' }
    it('a missing beforeAlt or afterAlt still throws', async () => {
      await open(BeforeAfter, { before: '/b.jpg', after: '/a.jpg', afterAlt: 'After', ...looks })
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('requires a `beforeAlt` string')
      await open(BeforeAfter, { before: '/b.jpg', beforeAlt: 'Before', after: '/a.jpg', ...looks })
      expect(errors[0].message).toContain('requires a `afterAlt` string')
    })
    it('an empty label still throws and a descriptive or empty alt passes', async () => {
      await open(BeforeAfter, { label: '', ...looks })
      expect(errors[0].message).toContain('requires')
      await open(BeforeAfter, { ...base, afterAlt: '', ...looks })
      expect(errors).toEqual([])
    })
  })
})
