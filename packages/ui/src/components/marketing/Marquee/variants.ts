import { cva, type VariantProps } from '../../../lib/cva'

export const MARQUEE_DIRECTIONS = ['left', 'right', 'up', 'down'] as const
export const MARQUEE_SIZES = ['sm', 'md', 'lg'] as const
/** Seconds per loop for each `speed` preset. An explicit `duration` always wins. */
export const MARQUEE_SPEEDS = { slow: 60, normal: 30, fast: 15 } as const
export const MARQUEE_GAPS = { none: '0rem', sm: '1rem', md: '2rem', lg: '3rem' } as const
export const MARQUEE_DEFAULT_DURATION = 30

export type MarqueeDirection = (typeof MARQUEE_DIRECTIONS)[number]
export type MarqueeSize = (typeof MARQUEE_SIZES)[number]
export type MarqueeSpeed = keyof typeof MARQUEE_SPEEDS
export type MarqueeGap = keyof typeof MARQUEE_GAPS

/** Root: the strip (viewport) plus the pause control row. Vertical strips need a height: `h-64` by default, override with `class`. */
export const marqueeVariants = cva('pd-marquee relative flex w-full flex-col gap-1', {
  variants: {
    axis: {
      horizontal: '',
      vertical: 'h-64',
    },
    /** Kept for API compatibility: the edge mask now lives on the viewport (see `marqueeViewportVariants`). */
    fade: { true: '', false: '' },
  },
  defaultVariants: { axis: 'horizontal', fade: true },
})

/**
 * The clipping window around the moving track. The fade mask follows the axis and lives here (not on the root)
 * so the pause button is never faded out. Under reduced motion the track stops and this window scrolls by hand.
 */
export const marqueeViewportVariants = cva('flex w-full min-w-0 overflow-hidden', {
  variants: {
    axis: {
      horizontal: 'motion-reduce:overflow-x-auto',
      vertical: 'min-h-0 flex-1 flex-col motion-reduce:overflow-y-auto',
    },
    fade: { true: '', false: '' },
  },
  compoundVariants: [
    { axis: 'horizontal', fade: true, class: '[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]' },
    { axis: 'vertical', fade: true, class: '[mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]' },
  ],
  defaultVariants: { axis: 'horizontal', fade: true },
})

export const marqueeTrackVariants = cva('pd-marquee-track flex shrink-0', {
  variants: { axis: { horizontal: 'w-max', vertical: 'h-max w-full flex-col' } },
  defaultVariants: { axis: 'horizontal' },
})

export const marqueeCopyVariants = cva('pd-marquee-copy flex shrink-0 items-center', {
  variants: { axis: { horizontal: '', vertical: 'flex-col' } },
  defaultVariants: { axis: 'horizontal' },
})

/** Text items rendered from the `items` prop. */
export const marqueeItemVariants = cva('whitespace-nowrap font-semibold text-muted-foreground', {
  variants: { size: { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' } },
  defaultVariants: { size: 'md' },
})

export type MarqueeVariants = VariantProps<typeof marqueeVariants>

