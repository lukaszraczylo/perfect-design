import { cva, type VariantProps } from '../../../lib/cva'

export const SCROLL_PROGRESS_POSITIONS = ['top', 'bottom'] as const
export const SCROLL_PROGRESS_SIZES = ['sm', 'md', 'lg'] as const
export const SCROLL_PROGRESS_TONES = ['primary', 'neutral', 'success', 'info'] as const
export const SCROLL_PROGRESS_VARIANTS = ['bar', 'rounded', 'inset'] as const

export type ScrollProgressPosition = (typeof SCROLL_PROGRESS_POSITIONS)[number]
export type ScrollProgressSize = (typeof SCROLL_PROGRESS_SIZES)[number]
export type ScrollProgressTone = (typeof SCROLL_PROGRESS_TONES)[number]
export type ScrollProgressVariant = (typeof SCROLL_PROGRESS_VARIANTS)[number]

/**
 * The strip pinned to the viewport edge. `bar` is the original flush strip, `rounded` rounds the ends of the fill,
 * `inset` floats a rounded track away from the edge and the viewport sides (`gap`). Thickness comes from `size`.
 */
export const scrollProgressVariants = cva('pointer-events-none fixed z-(--z-overlay)', {
  variants: {
    variant: {
      bar: 'inset-x-0 bg-transparent',
      rounded: 'inset-x-0 overflow-hidden rounded-full bg-transparent',
      inset: 'inset-x-4 overflow-hidden rounded-full bg-muted',
    },
    size: { sm: 'h-0.5', md: 'h-1', lg: 'h-1.5' },
    position: { top: '', bottom: '' },
  },
  compoundVariants: [
    { variant: ['bar', 'rounded'], position: 'top', class: 'top-0' },
    { variant: ['bar', 'rounded'], position: 'bottom', class: 'bottom-0' },
    { variant: 'inset', position: 'top', class: 'top-2' },
    { variant: 'inset', position: 'bottom', class: 'bottom-2' },
  ],
  defaultVariants: { variant: 'bar', size: 'md', position: 'top' },
})

/**
 * The fill. Scaled on the x axis from the start edge (mirrored in right-to-left pages). In forced-colors mode the
 * background is replaced by the system colours, so the fill is also drawn as a bottom border in the text colour.
 */
export const scrollProgressBarVariants = cva(
  'h-full w-full origin-left rtl:origin-right motion-safe:transition-transform motion-safe:duration-100 forced-colors:border-b-4 forced-colors:border-current',
  {
    variants: {
      tone: { primary: 'bg-primary', neutral: 'bg-foreground', success: 'bg-success', info: 'bg-info' },
      variant: { bar: '', rounded: 'rounded-full', inset: 'rounded-full' },
    },
    defaultVariants: { tone: 'primary', variant: 'bar' },
  },
)

export type ScrollProgressVariants = VariantProps<typeof scrollProgressVariants>
