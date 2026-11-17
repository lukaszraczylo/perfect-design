import { cva, type VariantProps } from '../../../lib/cva'
import { merged, resolveSurfaceGap, type SurfaceGap } from '../shared/surface'

export const TESTIMONIAL_GRID_LAYOUTS = ['grid', 'masonry', 'columns'] as const
export type TestimonialGridLayout = (typeof TESTIMONIAL_GRID_LAYOUTS)[number]

const testimonialGridBase = cva('', {
  variants: {
    layout: {
      grid: 'grid gap-6 [&>*]:h-full',
      masonry: 'gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid',
      columns: 'flex flex-col gap-6 md:flex-row md:[&>*]:flex-1',
    },
    columns: { 1: '', 2: '', 3: '' },
    gap: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    // `gap: md` keeps the original spacing (gap-6); sm and lg scale it. Masonry also spaces rows with a bottom margin.
    { layout: ['grid', 'columns'], gap: 'sm', class: 'gap-4' },
    { layout: ['grid', 'columns'], gap: 'lg', class: 'gap-8' },
    { layout: 'masonry', gap: 'sm', class: 'gap-4 [&>*]:mb-4' },
    { layout: 'masonry', gap: 'lg', class: 'gap-8 [&>*]:mb-8' },
    { layout: 'grid', columns: 1, class: 'grid-cols-1' },
    { layout: 'grid', columns: 2, class: 'grid-cols-1 sm:grid-cols-2' },
    { layout: 'grid', columns: 3, class: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
    { layout: 'masonry', columns: 1, class: 'columns-1' },
    { layout: 'masonry', columns: 2, class: 'columns-1 sm:columns-2' },
    { layout: 'masonry', columns: 3, class: 'columns-1 sm:columns-2 lg:columns-3' },
  ],
  defaultVariants: { layout: 'grid', columns: 3, gap: 'md' },
})

/** Container classes. Conflict-free output (later classes win). */
export const testimonialGridVariants = merged(testimonialGridBase)

export type TestimonialGridGap = SurfaceGap
export const resolveTestimonialGridGap = resolveSurfaceGap

export type TestimonialGridVariants = VariantProps<typeof testimonialGridBase>
export type TestimonialGridColumns = NonNullable<TestimonialGridVariants['columns']>
