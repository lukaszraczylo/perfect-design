import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Root of a DonutChart. `auto` (default) puts the legend beside the ring and wraps it underneath when there is no room,
 * `inline` keeps it beside the ring and truncates long labels, `stacked` always puts it under the ring.
 */
export const donutChartVariants = cva('flex', {
  variants: {
    layout: {
      auto: 'flex-wrap items-center gap-4',
      inline: 'min-w-0 flex-nowrap items-center gap-4',
      stacked: 'min-w-0 flex-col items-start gap-4',
    },
  },
  defaultVariants: { layout: 'auto' },
})

/** Wrapper of the ring and its centre text. A half ring is as wide as the full one and half as high. */
export const donutFigureVariants = cva('relative shrink-0', {
  variants: {
    variant: { full: '', half: '' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: 'full', size: 'sm', class: 'size-28' },
    { variant: 'full', size: 'md', class: 'size-40' },
    { variant: 'full', size: 'lg', class: 'size-56' },
    { variant: 'half', size: 'sm', class: 'h-14 w-28' },
    { variant: 'half', size: 'md', class: 'h-20 w-40' },
    { variant: 'half', size: 'lg', class: 'h-28 w-56' },
  ],
  defaultVariants: { variant: 'full', size: 'md' },
})

export const donutLegendVariants = cva('grid gap-1.5 text-sm', {
  variants: { layout: { auto: '', inline: 'min-w-0 flex-1 grid-cols-1', stacked: 'w-full grid-cols-1' } },
  defaultVariants: { layout: 'auto' },
})

export type DonutChartVariants = VariantProps<typeof donutChartVariants> & VariantProps<typeof donutFigureVariants>
export type DonutLayout = NonNullable<VariantProps<typeof donutChartVariants>['layout']>
export type DonutVariant = NonNullable<VariantProps<typeof donutFigureVariants>['variant']>
export type DonutSize = NonNullable<VariantProps<typeof donutFigureVariants>['size']>
