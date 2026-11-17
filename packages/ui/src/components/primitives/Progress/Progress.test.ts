import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { trackSurface } from '../../../lib/styles'
import Progress from './Progress.vue'
import { progressIndicatorVariants, progressInsideValueVariants, progressSegmentVariants, progressVariants } from './variants'

afterEach(() => vi.restoreAllMocks())

const indicator = (w: ReturnType<typeof mount>) => w.find('[data-slot="progress-indicator"]')

describe('Progress', () => {
  describe('good path', () => {
    it('renders a progressbar with aria values', () => {
      const w = mount(Progress, { props: { modelValue: 40 } })
      expect(w.attributes('role')).toBe('progressbar')
      expect(w.attributes('data-slot')).toBe('progress')
      expect(w.attributes('aria-valuenow')).toBe('40')
      expect(w.attributes('aria-valuemin')).toBe('0')
      expect(w.attributes('aria-valuemax')).toBe('100')
      expect(w.find('[data-slot="progress-track"]').exists()).toBe(true)
    })

    it('sets indicator width to the percentage', () => {
      expect(indicator(mount(Progress, { props: { modelValue: 40 } })).attributes('style')).toContain('width: 40%')
    })

    it('respects a custom max', () => {
      const w = mount(Progress, { props: { modelValue: 5, max: 20 } })
      expect(w.attributes('aria-valuemax')).toBe('20')
      expect(indicator(w).attributes('style')).toContain('width: 25%')
    })

    it.each([
      ['neutral', 'bg-muted-foreground'],
      ['primary', 'bg-primary'],
      ['success', 'bg-success'],
      ['warning', 'bg-warning'],
      ['danger', 'bg-destructive'],
      ['info', 'bg-info'],
    ] as const)('tone %s uses %s', (tone, cls) => {
      expect(indicator(mount(Progress, { props: { modelValue: 10, tone } })).classes()).toContain(cls)
    })

    it.each([
      ['sm', 'h-1'],
      ['md', 'h-2'],
      ['lg', 'h-3'],
    ] as const)('size %s uses %s on the track', (size, cls) => {
      expect(mount(Progress, { props: { modelValue: 1, size } }).find('[data-slot="progress-track"]').classes()).toContain(cls)
    })

    it('reflects state via data-state', async () => {
      const w = mount(Progress, { props: { modelValue: 10 } })
      expect(w.attributes('data-state')).toBe('loading')
      await w.setProps({ modelValue: 100 })
      expect(w.attributes('data-state')).toBe('complete')
    })

    it('shows the rounded percentage with showValue', () => {
      const w = mount(Progress, { props: { modelValue: 1, max: 3, showValue: true } })
      expect(w.find('[data-slot="progress-value"]').text()).toBe('33%')
    })

    it('uses aria-label when label is provided', () => {
      expect(mount(Progress, { props: { modelValue: 10, label: 'Upload' } }).attributes('aria-label')).toBe('Upload')
    })

    it('always has an accessible name: "Progress" without a label', () => {
      expect(mount(Progress, { props: { modelValue: 10 } }).attributes('aria-label')).toBe('Progress')
      expect(mount(Progress, { props: { modelValue: null } }).attributes('aria-label')).toBe('Progress')
    })

    it('does not add the default name when aria-labelledby or aria-label is supplied', () => {
      const a = mount(Progress, { props: { modelValue: 10 }, attrs: { 'aria-labelledby': 'x' } })
      expect(a.attributes('aria-label')).not.toBe('Progress') // reka falls back to the percentage; aria-labelledby wins anyway
      expect(a.attributes('aria-labelledby')).toBe('x')
      expect(mount(Progress, { props: { modelValue: 10 }, attrs: { 'aria-label': 'Upload' } }).attributes('aria-label')).toBe('Upload')
    })
  })

  describe('indeterminate', () => {
    it.each([null, undefined])('modelValue %s renders the indeterminate animation', (v) => {
      const w = mount(Progress, { props: { modelValue: v } })
      expect(w.attributes('data-state')).toBe('indeterminate')
      expect(w.attributes('aria-valuenow')).toBeUndefined()
      expect(indicator(w).classes()).toContain('animate-ds-indeterminate')
      expect(indicator(w).attributes('style')).toBeUndefined()
    })

    it('is motion-reduce safe', () => {
      expect(indicator(mount(Progress)).classes()).toContain('motion-reduce:animate-none')
    })

    it('does not show a value even with showValue', () => {
      expect(mount(Progress, { props: { showValue: true } }).find('[data-slot="progress-value"]').exists()).toBe(false)
    })

    it('switching to determinate drops the animation', async () => {
      const w = mount(Progress)
      await w.setProps({ modelValue: 50 })
      expect(indicator(w).classes()).not.toContain('animate-ds-indeterminate')
      expect(indicator(w).attributes('style')).toContain('width: 50%')
    })
  })

  describe('customisation', () => {
    it('merges class on the root and lets it override', () => {
      const w = mount(Progress, { props: { modelValue: 1, class: 'w-48 gap-1 custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('w-48')
      expect(w.classes()).not.toContain('w-full')
      expect(w.classes()).not.toContain('gap-3')
    })

    it('passes attributes through', () => {
      const w = mount(Progress, { props: { modelValue: 1 }, attrs: { id: 'p', 'data-test': 'x', 'aria-labelledby': 'lbl' } })
      expect(w.attributes('id')).toBe('p')
      expect(w.attributes('data-test')).toBe('x')
      expect(w.attributes('aria-labelledby')).toBe('lbl')
    })

    it('renders as another element with `as`', () => {
      expect(mount(Progress, { props: { modelValue: 1, as: 'section' } }).element.tagName).toBe('SECTION')
    })

    it('exports variants for reuse', () => {
      expect(progressVariants({ size: 'lg' })).toContain('h-3')
      expect(progressVariants()).toContain('h-2')
      expect(progressIndicatorVariants({ tone: 'danger' })).toContain('bg-destructive')
      expect(progressIndicatorVariants()).toContain('bg-primary')
    })
  })

  describe('bad path (values are sanitised, no reka console errors)', () => {
    it('clamps negatives to 0', async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})
      const w = mount(Progress, { props: { modelValue: -20 } })
      await nextTick()
      expect(w.attributes('aria-valuenow')).toBe('0')
      expect(indicator(w).attributes('style')).toContain('width: 0%')
      expect(err).not.toHaveBeenCalled()
    })

    it('clamps values above max', async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})
      const w = mount(Progress, { props: { modelValue: 250 } })
      await nextTick()
      expect(w.attributes('aria-valuenow')).toBe('100')
      expect(indicator(w).attributes('style')).toContain('width: 100%')
      expect(err).not.toHaveBeenCalled()
    })

    it('treats NaN as 0', async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})
      const w = mount(Progress, { props: { modelValue: Number.NaN } })
      await nextTick()
      expect(w.attributes('aria-valuenow')).toBe('0')
      expect(err).not.toHaveBeenCalled()
    })

    it('clamps +/-Infinity', () => {
      expect(mount(Progress, { props: { modelValue: Infinity } }).attributes('aria-valuenow')).toBe('100')
      expect(mount(Progress, { props: { modelValue: -Infinity } }).attributes('aria-valuenow')).toBe('0')
    })

    it.each([0, -5, Number.NaN, Infinity])('invalid max %s falls back to 100', async (max) => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})
      const w = mount(Progress, { props: { modelValue: 50, max } })
      await nextTick()
      expect(w.attributes('aria-valuemax')).toBe('100')
      expect(indicator(w).attributes('style')).toContain('width: 50%')
      expect(err).not.toHaveBeenCalled()
    })

    it('clamps to a custom max', () => {
      const w = mount(Progress, { props: { modelValue: 99, max: 10 } })
      expect(w.attributes('aria-valuenow')).toBe('10')
    })

    it('empty label is ignored', () => {
      expect(mount(Progress, { props: { modelValue: 10, label: '' } }).attributes('aria-label')).toBe('Progress')
    })
  })

  describe('edge cases', () => {
    it('0 is determinate, not indeterminate', () => {
      const w = mount(Progress, { props: { modelValue: 0 } })
      expect(w.attributes('data-state')).toBe('loading')
      expect(w.attributes('aria-valuenow')).toBe('0')
    })

    it('fractional values render a fractional width and a rounded label', () => {
      const w = mount(Progress, { props: { modelValue: 12.5, showValue: true } })
      expect(indicator(w).attributes('style')).toContain('width: 12.5%')
      expect(w.find('[data-slot="progress-value"]').text()).toMatch(/^1[23]%$/)
    })

    it('showValue with 100 shows 100%', () => {
      expect(mount(Progress, { props: { modelValue: 100, showValue: true } }).find('[data-slot="progress-value"]').text()).toBe('100%')
    })

    it('rapid value updates settle on the latest value', async () => {
      const w = mount(Progress, { props: { modelValue: 0 } })
      for (let i = 1; i <= 20; i++) await w.setProps({ modelValue: i * 5 })
      expect(w.attributes('aria-valuenow')).toBe('100')
    })

    it('unmounts cleanly', () => {
      const w = mount(Progress, { props: { modelValue: 1 } })
      expect(() => w.unmount()).not.toThrow()
    })
  })
})

describe('Progress variations', () => {
  const track = (w: ReturnType<typeof mount>) => w.find('[data-slot="progress-track"]')
  const segments = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="progress-segment"]')
  const fills = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="progress-segment-fill"]')

  describe('sizes', () => {
    it.each([
      ['xs', 'h-0.5'],
      ['xl', 'h-5'],
    ] as const)('size %s uses %s on the track', (size, cls) => {
      expect(track(mount(Progress, { props: { modelValue: 1, size } })).classes()).toContain(cls)
      expect(progressVariants({ size })).toContain(cls)
    })

    it('unknown size falls back to md', () => {
      const w = mount(Progress, { props: { modelValue: 1, size: 'huge' as never } })
      expect(track(w).classes()).toContain('h-2')
    })

    it('unknown tone falls back to primary', () => {
      const w = mount(Progress, { props: { modelValue: 1, tone: 'purple' as never } })
      expect(indicator(w).classes()).toContain('bg-primary')
    })
  })

  describe('striped / animated', () => {
    it('is off by default', () => {
      const c = indicator(mount(Progress, { props: { modelValue: 10 } })).classes().join(' ')
      expect(c).not.toContain('progress-stripe')
      expect(c).not.toContain('ds-progress-stripes')
    })

    it('striped is accepted but draws no gradient (regression: gradients were removed)', () => {
      const c = indicator(mount(Progress, { props: { modelValue: 10, striped: true } })).classes().join(' ')
      expect(c).not.toMatch(/gradient|--progress-stripe|bg-\[/)
      expect(c).not.toContain('animate-pulse')
    })

    it('animated pulses the fill and is reduced-motion safe', () => {
      const w = mount(Progress, { props: { modelValue: 10, animated: true } })
      const c = indicator(w).classes().join(' ')
      expect(c).not.toMatch(/gradient|--progress-stripe/)
      expect(c).toContain('animate-pulse')
      expect(indicator(w).classes()).toContain('motion-reduce:animate-none')
    })

    it('keeps the tone colour under stripes', () => {
      expect(indicator(mount(Progress, { props: { modelValue: 10, animated: true, tone: 'success' } })).classes()).toContain('bg-success')
    })

    it('indeterminate keeps its own animation and ignores `animated`', () => {
      const w = mount(Progress, { props: { animated: true } })
      expect(indicator(w).classes()).toContain('animate-ds-indeterminate')
      expect(indicator(w).classes().join(' ')).not.toContain('ds-progress-stripes')
    })
  })

  describe('value position', () => {
    it('inside renders the percentage in the filled bar with a tone-matched text colour', () => {
      const w = mount(Progress, { props: { modelValue: 60, size: 'xl', showValue: true, valuePosition: 'inside', tone: 'success' } })
      const value = indicator(w).find('[data-slot="progress-value"]')
      expect(value.text()).toBe('60%')
      expect(indicator(w).classes()).toContain('text-success-foreground')
      expect(w.findAll('[data-slot="progress-value"]')).toHaveLength(1)
    })

    it.each([
      ['neutral', 'text-background'],
      ['primary', 'text-primary-foreground'],
      ['warning', 'text-warning-foreground'],
      ['danger', 'text-destructive-foreground'],
      ['info', 'text-info-foreground'],
    ] as const)('inside text colour for tone %s is %s', (tone, cls) => {
      const w = mount(Progress, { props: { modelValue: 50, showValue: true, valuePosition: 'inside', tone } })
      expect(indicator(w).classes()).toContain(cls)
      expect(progressInsideValueVariants({ tone })).toContain(cls)
    })

    it('inside without showValue renders no text', () => {
      const w = mount(Progress, { props: { modelValue: 60, valuePosition: 'inside' } })
      expect(w.find('[data-slot="progress-value"]').exists()).toBe(false)
    })

    it('inside is hidden while indeterminate', () => {
      expect(mount(Progress, { props: { showValue: true, valuePosition: 'inside' } }).find('[data-slot="progress-value"]').exists()).toBe(false)
    })

    it('top renders a header with the label and the value above the bar', () => {
      const w = mount(Progress, { props: { modelValue: 72, label: 'Storage', showValue: true, valuePosition: 'top' } })
      expect(w.classes()).toContain('flex-col')
      expect(w.classes()).not.toContain('items-center')
      expect(w.classes()).not.toContain('gap-3')
      const header = w.find('[data-slot="progress-header"]')
      expect(header.find('[data-slot="progress-label"]').text()).toBe('Storage')
      expect(header.find('[data-slot="progress-value"]').text()).toBe('72%')
      expect(w.element.firstElementChild).toBe(header.element)
      expect(w.attributes('aria-label')).toBe('Storage')
    })

    it('top with only a label shows no value', () => {
      const w = mount(Progress, { props: { modelValue: 10, label: 'Only label', valuePosition: 'top' } })
      expect(w.find('[data-slot="progress-label"]').exists()).toBe(true)
      expect(w.find('[data-slot="progress-value"]').exists()).toBe(false)
    })

    it('top with only a value shows no label text', () => {
      const w = mount(Progress, { props: { modelValue: 10, showValue: true, valuePosition: 'top' } })
      expect(w.find('[data-slot="progress-label"]').exists()).toBe(false)
      expect(w.find('[data-slot="progress-value"]').text()).toBe('10%')
    })

    it('top with neither label nor value renders no header', () => {
      expect(mount(Progress, { props: { modelValue: 10, valuePosition: 'top' } }).find('[data-slot="progress-header"]').exists()).toBe(false)
    })

    it('top indeterminate shows the label but no value', () => {
      const w = mount(Progress, { props: { label: 'Syncing', showValue: true, valuePosition: 'top' } })
      expect(w.find('[data-slot="progress-label"]').text()).toBe('Syncing')
      expect(w.find('[data-slot="progress-value"]').exists()).toBe(false)
    })

    it('unknown valuePosition behaves like end', () => {
      const w = mount(Progress, { props: { modelValue: 5, showValue: true, valuePosition: 'left' as never } })
      expect(w.classes()).toContain('items-center')
      expect(w.element.lastElementChild!.getAttribute('data-slot')).toBe('progress-value')
    })

    it('class still overrides the top layout', () => {
      const w = mount(Progress, { props: { modelValue: 5, label: 'x', valuePosition: 'top', class: 'gap-4' } })
      expect(w.classes()).toContain('gap-4')
      expect(w.classes()).not.toContain('gap-1.5')
    })
  })

  describe('segmented', () => {
    it('renders N segments and no single indicator', () => {
      const w = mount(Progress, { props: { modelValue: 50, segments: 5 } })
      expect(segments(w)).toHaveLength(5)
      expect(indicator(w).exists()).toBe(false)
      expect(track(w).attributes('data-segments')).toBe('5')
      expect(track(w).classes()).toContain('gap-1')
      expect(track(w).classes()).not.toContain('bg-muted')
      expect(w.attributes('aria-valuenow')).toBe('50')
    })

    it('fills whole segments then a partial one', () => {
      const w = mount(Progress, { props: { modelValue: 50, segments: 4 } })
      expect(fills(w).map((f) => f.attributes('style'))).toEqual(['width: 100%;', 'width: 100%;', 'width: 0%;', 'width: 0%;'])
      const p = mount(Progress, { props: { modelValue: 30, segments: 4 } })
      expect(fills(p).map((f) => f.attributes('style'))).toEqual(['width: 100%;', 'width: 20%;', 'width: 0%;', 'width: 0%;'])
    })

    it('0 and 100 fill none and all', () => {
      expect(fills(mount(Progress, { props: { modelValue: 0, segments: 3 } })).every((f) => f.attributes('style')!.includes('width: 0%'))).toBe(true)
      expect(fills(mount(Progress, { props: { modelValue: 100, segments: 3 } })).every((f) => f.attributes('style')!.includes('width: 100%'))).toBe(true)
    })

    it('uses tone and size', () => {
      const w = mount(Progress, { props: { modelValue: 50, segments: 3, tone: 'warning', size: 'lg' } })
      expect(fills(w)[0]!.classes()).toContain('bg-warning')
      expect(track(w).classes()).toContain('h-3')
      expect(progressSegmentVariants()).toContain(trackSurface)
    })

    it('striped segments draw no gradient', () => {
      const w = mount(Progress, { props: { modelValue: 50, segments: 3, striped: true } })
      expect(fills(w)[0]!.classes().join(' ')).not.toMatch(/gradient|--progress-stripe/)
    })

    it('indeterminate pulses every segment with a stagger', () => {
      const w = mount(Progress, { props: { segments: 3 } })
      expect(w.attributes('data-state')).toBe('indeterminate')
      expect(fills(w).every((f) => f.classes().includes('animate-pulse') && f.classes().includes('motion-reduce:animate-none'))).toBe(true)
      expect(fills(w)[2]!.attributes('style')).toContain('animation-delay: 240ms')
    })

    it('showValue stays at the end; inside falls back to end', () => {
      const w = mount(Progress, { props: { modelValue: 50, segments: 4, showValue: true, valuePosition: 'inside' } })
      expect(w.element.lastElementChild!.getAttribute('data-slot')).toBe('progress-value')
      expect(w.findAll('[data-slot="progress-value"]')).toHaveLength(1)
    })

    it('top works with segments', () => {
      const w = mount(Progress, { props: { modelValue: 50, segments: 4, label: 'Steps', showValue: true, valuePosition: 'top' } })
      expect(w.find('[data-slot="progress-header"]').text()).toContain('50%')
    })

    it.each([0, 1, -3, Number.NaN, Infinity, undefined])('segments=%s renders a normal bar', (segs) => {
      const w = mount(Progress, { props: { modelValue: 50, segments: segs as number } })
      expect(segments(w)).toHaveLength(0)
      expect(indicator(w).exists()).toBe(true)
    })

    it('floors fractional counts and caps at 50', () => {
      expect(segments(mount(Progress, { props: { modelValue: 1, segments: 4.9 } }))).toHaveLength(4)
      expect(segments(mount(Progress, { props: { modelValue: 1, segments: 500 } }))).toHaveLength(50)
    })

    it('clamped values still fill correctly', () => {
      const w = mount(Progress, { props: { modelValue: 999, segments: 3 } })
      expect(w.attributes('aria-valuenow')).toBe('100')
      expect(fills(w).every((f) => f.attributes('style')!.includes('width: 100%'))).toBe(true)
    })

    it('updates fills reactively', async () => {
      const w = mount(Progress, { props: { modelValue: 0, segments: 2 } })
      await w.setProps({ modelValue: 100 })
      expect(fills(w).every((f) => f.attributes('style')!.includes('width: 100%'))).toBe(true)
    })
  })

  it('exports variant helpers for reuse', () => {
    expect(progressIndicatorVariants({ tone: 'info', striped: true })).not.toContain('--progress-stripe')
    expect(progressIndicatorVariants()).not.toContain('animate-pulse')
    expect(progressIndicatorVariants({ animated: true })).toContain('animate-pulse')
  })
})

describe('Progress forced-colors fallback', () => {
  it('track and fill carry borders in forced-colors mode (backgrounds alone are not enough)', () => {
    expect(progressVariants()).toContain('forced-colors:border')
    expect(progressIndicatorVariants()).toContain('forced-colors:border-2')
  })
})

describe('Progress indeterminate variant', () => {
  it('slide is the default and keeps its classes', () => {
    const w = mount(Progress, { props: { label: 'x' } })
    expect(indicator(w).classes()).toContain('animate-ds-indeterminate')
    expect(indicator(w).classes()).not.toContain('animate-ds-sweep')
    expect(w.find('[data-slot="progress-track"]').attributes('data-variant')).toBeUndefined()
  })

  it('sweep uses the sweep animation on an absolutely positioned bar', () => {
    const w = mount(Progress, { props: { label: 'x', variant: 'sweep' } })
    expect(indicator(w).classes()).toEqual(expect.arrayContaining(['animate-ds-sweep', 'absolute', 'motion-reduce:animate-none', 'motion-reduce:w-full']))
    expect(indicator(w).classes()).not.toContain('animate-ds-indeterminate')
    expect(w.find('[data-slot="progress-track"]').attributes('data-variant')).toBe('sweep')
    expect(w.attributes('data-state')).toBe('indeterminate')
  })

  it('unknown variant falls back to slide', () => {
    const w = mount(Progress, { props: { label: 'x', variant: 'zigzag' as never } })
    expect(indicator(w).classes()).toContain('animate-ds-indeterminate')
  })

  it('has no effect when determinate', () => {
    const w = mount(Progress, { props: { label: 'x', variant: 'sweep', modelValue: 30 } })
    expect(indicator(w).classes()).not.toContain('animate-ds-sweep')
    expect(w.find('[data-slot="progress-track"]').attributes('data-variant')).toBeUndefined()
    expect(indicator(w).attributes('style')).toContain('width: 30%')
  })

  it('has no effect on segmented bars', () => {
    const w = mount(Progress, { props: { label: 'x', variant: 'sweep', segments: 3 } })
    expect(w.find('[data-slot="progress-indicator"]').exists()).toBe(false)
    expect(w.find('[data-slot="progress-track"]').attributes('data-variant')).toBeUndefined()
  })

  it('combines with tone and size', () => {
    const w = mount(Progress, { props: { label: 'x', variant: 'sweep', tone: 'success', size: 'lg' } })
    expect(indicator(w).classes()).toEqual(expect.arrayContaining(['bg-success', 'animate-ds-sweep']))
    expect(w.find('[data-slot="progress-track"]').classes()).toContain('h-3')
  })
})
