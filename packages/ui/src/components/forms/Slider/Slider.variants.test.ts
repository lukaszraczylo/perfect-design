import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Slider from './Slider.vue'
import Field from '../Field/Field.vue'
import * as barrel from './index'
import {
  SLIDER_SIZES,
  SLIDER_TONES,
  normalizeSliderOrientation,
  normalizeSliderSize,
  normalizeSliderTone,
  sliderBubbleVariants,
  sliderMarkVariants,
  sliderMarksVariants,
  sliderRangeVariants,
  sliderThumbVariants,
  sliderTrackVariants,
  sliderVariants,
} from './variants'

let wrapper: VueWrapper | undefined
async function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  wrapper = mount(Slider, { props: { modelValue: [40], ...props }, attrs: { 'aria-label': 'Sample level', ...attrs }, attachTo: document.body })
  await nextTick()
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const root = (w: VueWrapper) => w.find('[data-slot="slider"]')
const track = (w: VueWrapper) => w.find('[data-slot="slider-track"]')
const range = (w: VueWrapper) => w.find('[data-slot="slider-range"]')
const thumb = (w: VueWrapper, i = 0) => w.findAll('[role=slider]')[i]
const marks = (w: VueWrapper) => w.findAll('[data-slot="slider-mark"]')
const press = async (el: Element, key: string) => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await Promise.resolve()
}

describe('Slider variations', () => {
  describe('defaults', () => {
    it('keeps the original root, track, range and thumb classes', async () => {
      const w = await make()
      expect(root(w).classes().join(' ')).toBe('relative flex touch-none items-center select-none data-disabled:opacity-50 min-h-6 w-full pointer-coarse:min-h-11')
      expect(track(w).classes()).toEqual(expect.arrayContaining(['relative', 'grow', 'overflow-hidden', 'rounded-full', 'bg-muted', 'forced-color-adjust-none', 'h-1.5', 'w-full']))
      expect(range(w).classes().join(' ')).toBe('absolute forced-color-adjust-none h-full bg-primary')
      expect(thumb(w).classes()).toEqual(expect.arrayContaining(['block', 'size-6', 'shrink-0', 'rounded-full', 'border-2', 'border-primary', 'bg-background', 'focus-visible:ring-4']))
    })

    it('renders no marks, no value bubble and no data-size / data-tone attributes', async () => {
      const w = await make()
      expect(w.find('[data-slot="slider-marks"]').exists()).toBe(false)
      expect(w.find('[data-slot="slider-value"]').exists()).toBe(false)
      expect(root(w).attributes('data-size')).toBeUndefined()
      expect(root(w).attributes('data-tone')).toBeUndefined()
      expect(thumb(w).attributes('aria-valuetext')).toBeUndefined()
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'h-1', 'size-6'],
      ['md', 'h-1.5', 'size-6'],
      ['lg', 'h-2.5', 'size-7'],
    ])('%s sets track thickness %s and thumb %s', async (size, trackClass, thumbClass) => {
      const w = await make({ size })
      expect(track(w).classes()).toContain(trackClass)
      expect(thumb(w).classes()).toContain(thumbClass)
    })

    it('exposes data-size for non-default sizes only', async () => {
      expect(root(await make({ size: 'lg' })).attributes('data-size')).toBe('lg')
      wrapper!.unmount()
      expect(root(await make({ size: 'md' })).attributes('data-size')).toBeUndefined()
    })

    it('keeps every thumb at least 24px (size-6 or larger)', async () => {
      for (const size of SLIDER_SIZES) {
        const w = await make({ size })
        expect(thumb(w).classes().some((c) => c === 'size-6' || c === 'size-7')).toBe(true)
        w.unmount()
      }
    })

    it('gives the vertical track the same thickness steps on the width axis', async () => {
      expect(track(await make({ size: 'sm', orientation: 'vertical' })).classes()).toContain('w-1')
      wrapper!.unmount()
      expect(track(await make({ size: 'lg', orientation: 'vertical' })).classes()).toContain('w-2.5')
    })

    it('falls back to md for an unknown size', async () => {
      const w = await make({ size: 'huge' })
      expect(track(w).classes()).toContain('h-1.5')
      expect(root(w).attributes('data-size')).toBeUndefined()
      expect(normalizeSliderSize('huge')).toBe('md')
    })
  })

  describe('tone', () => {
    it.each([
      ['primary', 'bg-primary', 'border-primary'],
      ['success', 'bg-success', 'border-success'],
      ['danger', 'bg-destructive', 'border-destructive'],
      ['neutral', 'bg-foreground', 'border-foreground'],
      ['info', 'bg-info', 'border-info'],
    ])('%s colours the range %s and the thumb border %s', async (tone, rangeClass, borderClass) => {
      const w = await make({ tone })
      expect(range(w).classes()).toContain(rangeClass)
      expect(thumb(w).classes()).toContain(borderClass)
      for (const other of SLIDER_TONES.filter((t) => t !== tone)) {
        const o = { primary: 'primary', success: 'success', danger: 'destructive', neutral: 'foreground', info: 'info' }[other]
        expect(range(w).classes()).not.toContain(`bg-${o}`)
      }
    })

    it('exposes data-tone for non-default tones only', async () => {
      expect(root(await make({ tone: 'success' })).attributes('data-tone')).toBe('success')
      wrapper!.unmount()
      expect(root(await make({ tone: 'primary' })).attributes('data-tone')).toBeUndefined()
    })

    it('invalid always wins over the tone with the destructive colour and aria-invalid', async () => {
      const w = await make({ tone: 'success', invalid: true })
      expect(range(w).classes()).toContain('bg-destructive')
      expect(range(w).classes()).not.toContain('bg-success')
      expect(thumb(w).classes()).toContain('border-destructive')
      expect(thumb(w).attributes('aria-invalid')).toBe('true')
    })

    it('falls back to primary for an unknown tone', async () => {
      const w = await make({ tone: 'purple' })
      expect(range(w).classes()).toContain('bg-primary')
      expect(normalizeSliderTone('purple')).toBe('primary')
    })

    it('every tone still moves with the keyboard and reports the new value', async () => {
      for (const tone of SLIDER_TONES) {
        const w = await make({ tone })
        await press(thumb(w).element, 'ArrowRight')
        expect(thumb(w).attributes('aria-valuenow')).toBe('41')
        expect(w.emitted('update:modelValue')?.[0]).toEqual([[41]])
        w.unmount()
      }
    })
  })

  describe('orientation', () => {
    it('vertical stacks on the column axis and has a minimum height', async () => {
      const w = await make({ orientation: 'vertical' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['flex-col', 'h-full', 'min-h-44', 'pointer-coarse:min-w-11']))
      expect(range(w).classes()).toContain('w-full')
      expect(thumb(w).attributes('aria-orientation')).toBe('vertical')
    })

    it('falls back to horizontal for an unknown orientation', async () => {
      const w = await make({ orientation: 'diagonal' })
      expect(root(w).classes()).toContain('min-h-6')
      expect(thumb(w).attributes('aria-orientation')).toBe('horizontal')
      expect(normalizeSliderOrientation('diagonal')).toBe('horizontal')
    })

    it('arrow keys still step vertically', async () => {
      const w = await make({ orientation: 'vertical' })
      await press(thumb(w).element, 'ArrowUp')
      expect(thumb(w).attributes('aria-valuenow')).toBe('41')
    })
  })

  describe('marks', () => {
    it('renders one aria-hidden tick per entry of a number array, positioned from the left', async () => {
      const w = await make({ marks: [0, 25, 50, 100] })
      const group = w.find('[data-slot="slider-marks"]')
      expect(group.attributes('aria-hidden')).toBe('true')
      expect(marks(w).map((m) => m.attributes('style'))).toEqual(['left: 0%;', 'left: 25%;', 'left: 50%;', 'left: 100%;'])
      expect(w.findAll('[data-slot="slider-mark-label"]')).toHaveLength(0)
    })

    it('prints labels for `{ value, label }` entries only', async () => {
      const w = await make({ marks: [{ value: 0, label: 'Low' }, { value: 50 }, { value: 100, label: 'High' }] })
      expect(marks(w)).toHaveLength(3)
      expect(w.findAll('[data-slot="slider-mark-label"]').map((l) => l.text())).toEqual(['Low', 'High'])
    })

    it('marks every step with `true`', async () => {
      const w = await make({ marks: true, min: 0, max: 10, step: 2, modelValue: [4] })
      expect(marks(w)).toHaveLength(6)
      expect(marks(w)[3].attributes('style')).toBe('left: 60%;')
    })

    it('marks only the ends with `true` when there would be more than 50 intervals', async () => {
      const w = await make({ marks: true, min: 0, max: 100, step: 1 })
      expect(marks(w).map((m) => m.attributes('style'))).toEqual(['left: 0%;', 'left: 100%;'])
    })

    it('handles fractional steps without float noise', async () => {
      const w = await make({ marks: true, min: 0, max: 1, step: 0.1, modelValue: [0.3] })
      expect(marks(w)).toHaveLength(11)
      expect(marks(w)[3].attributes('style')).toBe('left: 30%;')
    })

    it('drops out of range, duplicate, non-finite and malformed entries', async () => {
      const w = await make({ marks: [-5, 0, 0, 50, 150, Number.NaN, { value: 60, label: '  ' }, null, { label: 'x' }] as never })
      expect(marks(w).map((m) => m.attributes('style'))).toEqual(['left: 0%;', 'left: 50%;', 'left: 60%;'])
      expect(w.findAll('[data-slot="slider-mark-label"]')).toHaveLength(0)
    })

    it('renders nothing for an empty list, a flat scale or a non-array value', async () => {
      expect((await make({ marks: [] })).find('[data-slot="slider-marks"]').exists()).toBe(false)
      wrapper!.unmount()
      expect((await make({ marks: true, min: 5, max: 5, modelValue: [5] })).find('[data-slot="slider-marks"]').exists()).toBe(false)
      wrapper!.unmount()
      expect((await make({ marks: 'yes' as never })).find('[data-slot="slider-marks"]').exists()).toBe(false)
    })

    it('inverted flips the positions', async () => {
      const w = await make({ marks: [0, 25], inverted: true })
      expect(marks(w).map((m) => m.attributes('style'))).toEqual(['left: 100%;', 'left: 75%;'])
    })

    it('vertical marks sit on the bottom axis and use the end side', async () => {
      const w = await make({ marks: [0, 50], orientation: 'vertical' })
      expect(marks(w).map((m) => m.attributes('style'))).toEqual(['bottom: 0%;', 'bottom: 50%;'])
      expect(w.find('[data-slot="slider-marks"]').classes()).toEqual(expect.arrayContaining(['inset-y-3', 'end-0', 'w-12']))
      expect(root(w).classes()).toContain('pe-12')
    })

    it('reserves room below a horizontal track and keeps the thumb inset aligned', async () => {
      const w = await make({ marks: [0, 100] })
      expect(root(w).classes()).toContain('pb-5')
      expect(w.find('[data-slot="slider-marks"]').classes()).toEqual(expect.arrayContaining(['inset-x-3', 'bottom-0', 'pointer-events-none']))
    })

    it('uses only covered colour pairs for the ticks and labels', async () => {
      const w = await make({ marks: [{ value: 0, label: 'Low' }] })
      expect(marks(w)[0].classes()).toContain('text-muted-foreground')
      expect(marks(w)[0].find('span').classes()).toContain('bg-muted-foreground')
    })

    it('announces the label of the mark under the thumb as aria-valuetext', async () => {
      const w = await make({ marks: [{ value: 0, label: 'Quiet' }, { value: 40, label: 'Medium' }] })
      expect(thumb(w).attributes('aria-valuetext')).toBe('Medium')
      await press(thumb(w).element, 'ArrowRight')
      expect(thumb(w).attributes('aria-valuetext')).toBeUndefined()
    })

    it('keeps the thumb name, value and keyboard behaviour with marks', async () => {
      const w = await make({ marks: [0, 100] })
      expect(thumb(w).attributes('aria-label')).toBe('Sample level')
      await press(thumb(w).element, 'End')
      expect(thumb(w).attributes('aria-valuenow')).toBe('100')
    })
  })

  describe('showValue and formatValue', () => {
    it('shows the value in an aria-hidden bubble inside the thumb', async () => {
      const w = await make({ showValue: true })
      const bubble = thumb(w).find('[data-slot="slider-value"]')
      expect(bubble.text()).toBe('40')
      expect(bubble.attributes('aria-hidden')).toBe('true')
      expect(bubble.classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background', 'tabular-nums', 'pointer-events-none', 'bottom-full']))
      expect(root(w).classes()).toContain('pt-8')
    })

    it('updates the bubble when the value changes and keeps aria-valuenow numeric', async () => {
      const w = await make({ showValue: true })
      await press(thumb(w).element, 'ArrowRight')
      expect(thumb(w).find('[data-slot="slider-value"]').text()).toBe('41')
      expect(thumb(w).attributes('aria-valuenow')).toBe('41')
    })

    it('renders one bubble per thumb of a range', async () => {
      const w = await make({ showValue: true, modelValue: [20, 80], thumbLabels: ['Low', 'High'] }, { 'aria-label': undefined })
      expect(w.findAll('[data-slot="slider-value"]').map((b) => b.text())).toEqual(['20', '80'])
    })

    it('formats the bubble and the spoken value with formatValue', async () => {
      const w = await make({ showValue: true, formatValue: (v: number) => `${v}%` })
      expect(thumb(w).find('[data-slot="slider-value"]').text()).toBe('40%')
      expect(thumb(w).attributes('aria-valuetext')).toBe('40%')
      expect(thumb(w).attributes('aria-valuenow')).toBe('40')
    })

    it('formatValue without showValue still sets aria-valuetext and shows no bubble', async () => {
      const w = await make({ formatValue: (v: number) => `${v} units` })
      expect(w.find('[data-slot="slider-value"]').exists()).toBe(false)
      expect(thumb(w).attributes('aria-valuetext')).toBe('40 units')
    })

    it('a mark label wins over formatValue for aria-valuetext', async () => {
      const w = await make({ formatValue: (v: number) => `${v}%`, marks: [{ value: 40, label: 'Medium' }] })
      expect(thumb(w).attributes('aria-valuetext')).toBe('Medium')
    })

    it('vertical puts the bubble beside the thumb with logical spacing', async () => {
      const w = await make({ showValue: true, orientation: 'vertical' })
      expect(thumb(w).find('[data-slot="slider-value"]').classes()).toEqual(expect.arrayContaining(['end-full', 'me-2']))
      expect(root(w).classes()).toContain('ps-12')
    })

    it('shows a long formatted value without breaking the line', async () => {
      const w = await make({ showValue: true, formatValue: () => 'A very long formatted sample value' })
      expect(thumb(w).find('[data-slot="slider-value"]').classes()).toContain('whitespace-nowrap')
    })
  })

  describe('combinations', () => {
    it('size lg + tone info + marks + bubble + vertical compose without losing structure', async () => {
      const w = await make({ size: 'lg', tone: 'info', marks: [0, 50, 100], showValue: true, orientation: 'vertical' })
      expect(range(w).classes()).toContain('bg-info')
      expect(track(w).classes()).toContain('w-2.5')
      expect(thumb(w).classes()).toEqual(expect.arrayContaining(['size-7', 'border-info']))
      expect(root(w).classes()).toEqual(expect.arrayContaining(['flex-col', 'ps-12', 'pe-12']))
      expect(marks(w)).toHaveLength(3)
    })

    it('a range with tone, marks and bubbles keeps one named thumb per value', async () => {
      const w = await make({ tone: 'neutral', marks: [0, 100], showValue: true, modelValue: [10, 90], thumbLabels: ['Minimum', 'Maximum'] }, { 'aria-label': undefined })
      expect(w.findAll('[role=slider]').map((t) => t.attributes('aria-label'))).toEqual(['Minimum', 'Maximum'])
      expect(range(w).classes()).toContain('bg-foreground')
    })

    it('inside a Field the thumb is still named by the label and described by the hint', async () => {
      const w = mount({ components: { Field, Slider }, template: '<Field label="Level" hint="Sample hint" id="lvl"><Slider :model-value="[40]" tone="success" show-value :marks="[0,100]" /></Field>' }, { attachTo: document.body })
      await nextTick()
      wrapper = w as unknown as VueWrapper
      const t = w.find('[role=slider]')
      expect(t.attributes('aria-labelledby')).toBeTruthy()
      expect(t.attributes('aria-describedby')).toContain('lvl-hint')
    })
  })

  describe('class and attributes', () => {
    it('class wins over variant classes on the root', async () => {
      const w = await make({ marks: [0, 100], showValue: true, class: 'pb-0 pt-0 w-48' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['pb-0', 'pt-0', 'w-48']))
      expect(root(w).classes()).not.toContain('pb-5')
      expect(root(w).classes()).not.toContain('pt-8')
      expect(root(w).classes()).not.toContain('w-full')
    })

    it('passes aria-label and data attributes through', async () => {
      const w = await make({ tone: 'success' }, { 'data-testid': 'level' })
      expect(root(w).attributes('data-testid')).toBe('level')
    })
  })

  describe('disabled and readonly states', () => {
    it('disabled keeps the tone, dims through data-disabled and ignores keys', async () => {
      const w = await make({ tone: 'success', disabled: true })
      expect(range(w).classes()).toContain('bg-success')
      expect(root(w).attributes('data-disabled')).toBeDefined()
      await press(thumb(w).element, 'ArrowRight')
      expect(thumb(w).attributes('aria-valuenow')).toBe('40')
    })
  })

  describe('exports and helpers', () => {
    it('exposes the variant functions from the barrel', () => {
      expect(barrel.sliderVariants).toBe(sliderVariants)
      expect(barrel.sliderThumbVariants).toBe(sliderThumbVariants)
      expect(barrel.SLIDER_TONES).toEqual(['primary', 'success', 'danger', 'neutral', 'info'])
      expect(barrel.SLIDER_SIZES).toEqual(['sm', 'md', 'lg'])
    })

    it('variant helpers return plain class strings and let `class` win', () => {
      expect(sliderRangeVariants({ tone: 'info' })).toBe('absolute forced-color-adjust-none h-full bg-info')
      expect(sliderRangeVariants()).toContain('bg-primary')
      expect(sliderTrackVariants({ size: 'sm', orientation: 'vertical' })).toContain('w-1')
      expect(sliderThumbVariants({ tone: 'danger', size: 'lg' })).toEqual(expect.stringContaining('size-7'))
      expect(sliderThumbVariants()).toContain('border-primary')
      expect(sliderVariants({ orientation: 'horizontal', bubble: true, marks: true })).toContain('pt-8 pb-5')
      expect(sliderVariants({ orientation: 'vertical', bubble: true, marks: true })).toContain('ps-12 pe-12')
      expect(sliderMarksVariants()).toContain('bottom-0')
      expect(sliderMarkVariants({ orientation: 'vertical' })).toContain('flex-row')
      expect(sliderBubbleVariants({ orientation: 'vertical' })).toContain('end-full')
      expect(sliderBubbleVariants({ class: 'extra' })).toContain('extra')
    })
  })
})
