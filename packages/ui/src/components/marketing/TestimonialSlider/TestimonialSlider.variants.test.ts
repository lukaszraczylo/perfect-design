import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TestimonialSlider from './TestimonialSlider.vue'
import { TESTIMONIAL_SLIDER_ALIGNS, resolveTestimonialSliderAlign, testimonialSliderControlsVariants } from './variants'
import { TESTIMONIAL_VARIANTS } from '../Testimonial/variants'

const items = [
  { quote: 'Sample one.', author: 'Customer one' },
  { quote: 'Sample two.', author: 'Customer two' },
]
const m = (props: Record<string, unknown> = {}) => mount(TestimonialSlider, { props: { items, ...props } })

describe('TestimonialSlider variant hook, size, tone, shape and align', () => {
  it('defaults keep the original controls row and report the settings', () => {
    const w = m()
    expect(w.find('[data-slot="testimonial-slider-controls"]').attributes('class')).toBe('flex justify-end gap-2')
    expect([w.attributes('data-variant'), w.attributes('data-size'), w.attributes('data-tone'), w.attributes('data-shape'), w.attributes('data-align')]).toEqual(['card', 'md', 'default', 'rounded', 'end'])
  })
  it.each(TESTIMONIAL_VARIANTS)('variant %s reaches every slide and the root', (variant) => {
    const w = m({ variant })
    expect(w.attributes('data-variant')).toBe(variant)
    expect(w.findAll('[data-slot="testimonial"]').map((t) => t.attributes('data-variant'))).toEqual([variant, variant])
  })
  it('variant is reported for slot slides too, unknown falls back to card', () => {
    expect(mount(TestimonialSlider, { props: { variant: 'quote' }, slots: { default: '<div>x</div>' } }).attributes('data-variant')).toBe('quote')
    expect(m({ variant: 'nope' }).attributes('data-variant')).toBe('card')
  })
  it('size, tone and shape reach every generated slide', () => {
    const w = m({ size: 'sm', tone: 'primary', shape: 'square' })
    expect([w.attributes('data-size'), w.attributes('data-tone'), w.attributes('data-shape')]).toEqual(['sm', 'primary', 'square'])
    for (const t of w.findAll('[data-slot="testimonial"]')) {
      expect(t.classes()).toEqual(expect.arrayContaining(['p-4', 'bg-primary', 'text-primary-foreground', 'rounded-none']))
    }
    expect(w.findAll('[data-slot="testimonial-slider-slide"]')).toHaveLength(2)
  })
  it('unknown size, tone, shape and align fall back', () => {
    const w = m({ size: 'x', tone: 'x', shape: 'x', align: 'x' })
    expect([w.attributes('data-size'), w.attributes('data-tone'), w.attributes('data-shape'), w.attributes('data-align')]).toEqual(['md', 'default', 'rounded', 'end'])
  })
  describe('align of the controls', () => {
    it.each(TESTIMONIAL_SLIDER_ALIGNS)('%s sets the justify class and keeps both buttons named', (align) => {
      const w = m({ align })
      const row = w.find('[data-slot="testimonial-slider-controls"]')
      expect(row.classes()).toEqual(expect.arrayContaining(['flex', 'gap-2', `justify-${align}`]))
      expect(row.findAll('button').map((b) => b.attributes('aria-label'))).toEqual(['Previous testimonial', 'Next testimonial'])
      expect(testimonialSliderControlsVariants({ align })).toContain(`justify-${align}`)
    })
    it('controls=false hides the row regardless of align', () => {
      expect(m({ align: 'center', controls: false }).find('[data-slot="testimonial-slider-controls"]').exists()).toBe(false)
    })
    it('resolves unknown values to end', () => {
      expect(resolveTestimonialSliderAlign('middle')).toBe('end')
      expect(resolveTestimonialSliderAlign('start')).toBe('start')
    })
  })
  it('keeps the carousel semantics with a tone and perView combined', () => {
    const w = m({ tone: 'muted', perView: 2, size: 'lg' })
    expect(w.attributes('role')).toBe('region')
    expect(w.attributes('aria-roledescription')).toBe('carousel')
    expect(w.find('[data-slot="testimonial-slider-track"]').attributes('tabindex')).toBe('0')
    expect(w.find('[data-slot="testimonial-slider-slide"]').classes()).toContain('basis-full')
    expect(w.find('[data-slot="testimonial"]').classes()).toContain('bg-muted')
  })
})
