import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Classes of the content element (the inner box that fills the ratio). The defaults add nothing, so a plain
 * `AspectRatio` keeps its original markup.
 *
 * - `rounded`: corner radius plus `overflow-hidden`, so media is clipped to the corners. `full` with a square ratio is a circle.
 * - `variant`: `plain` (default), `bordered` (1px border) or `muted` (placeholder surface; keeps a forced-colors border).
 * - `fit`: how a direct `img` or `video` child fills the box: `cover` crops, `contain` letterboxes, `fill` stretches.
 */
export const aspectRatioVariants = cva('', {
  variants: {
    rounded: {
      none: '',
      md: 'overflow-hidden rounded-md',
      lg: 'overflow-hidden rounded-lg',
      full: 'overflow-hidden rounded-full',
    },
    variant: {
      plain: '',
      bordered: 'border border-border',
      muted: 'bg-muted text-muted-foreground forced-colors:border',
    },
    fit: {
      none: '',
      cover: '[&>img]:size-full [&>img]:object-cover [&>video]:size-full [&>video]:object-cover',
      contain: '[&>img]:size-full [&>img]:object-contain [&>video]:size-full [&>video]:object-contain',
      fill: '[&>img]:size-full [&>img]:object-fill [&>video]:size-full [&>video]:object-fill',
    },
  },
  defaultVariants: { rounded: 'none', variant: 'plain', fit: 'none' },
})

export type AspectRatioVariants = VariantProps<typeof aspectRatioVariants>
export type AspectRatioRounded = NonNullable<AspectRatioVariants['rounded']>
export type AspectRatioVariant = NonNullable<AspectRatioVariants['variant']>
export type AspectRatioFit = NonNullable<AspectRatioVariants['fit']>
