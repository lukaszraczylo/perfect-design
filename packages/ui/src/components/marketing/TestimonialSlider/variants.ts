import { cva, type VariantProps } from '../../../lib/cva'

export const testimonialSliderTrackVariants = cva(
  'flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden',
)

export const testimonialSlideVariants = cva('min-w-0 shrink-0 snap-start', {
  variants: {
    perView: {
      1: 'basis-full',
      2: 'basis-full md:basis-[calc(50%-0.5rem)]',
      3: 'basis-full md:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.667rem)]',
    },
  },
  defaultVariants: { perView: 1 },
})

export const TESTIMONIAL_SLIDER_ALIGNS = ['start', 'center', 'end'] as const
export type TestimonialSliderAlign = (typeof TESTIMONIAL_SLIDER_ALIGNS)[number]

/** Where the previous/next buttons sit under the track. `end` is the original look. */
export const testimonialSliderControlsVariants = cva('flex', {
  variants: { align: { start: 'justify-start gap-2', center: 'justify-center gap-2', end: 'justify-end gap-2' } },
  defaultVariants: { align: 'end' },
})

/** Unknown values fall back to `end`. */
export function resolveTestimonialSliderAlign(value: unknown): TestimonialSliderAlign {
  return (TESTIMONIAL_SLIDER_ALIGNS as readonly unknown[]).includes(value) ? (value as TestimonialSliderAlign) : 'end'
}

export type TestimonialSlideVariants = VariantProps<typeof testimonialSlideVariants>
export type TestimonialSliderPerView = NonNullable<TestimonialSlideVariants['perView']>
