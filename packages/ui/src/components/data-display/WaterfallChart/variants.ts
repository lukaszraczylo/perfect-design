import { cva, type VariantProps } from '../../../lib/cva'

/** Root of a WaterfallChart (the figure). `size` sets the space between caption, plot, legend and the hidden data table. */
export const waterfallChartVariants = cva('flex w-full min-w-0 flex-col', {
  variants: { size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' } },
  defaultVariants: { size: 'md' },
})

export type WaterfallChartVariants = VariantProps<typeof waterfallChartVariants>
export type WaterfallChartSize = NonNullable<WaterfallChartVariants['size']>
/** `bars` floating bars, `steps` a staircase of the running total, `lollipop` a stem with a head at the new level. */
export type WaterfallChartVariant = 'bars' | 'steps' | 'lollipop'
export type WaterfallChartOrientation = 'vertical' | 'horizontal'
/** Space between bars: `sm` wide bars, `lg` narrow bars. */
export type WaterfallChartGap = 'sm' | 'md' | 'lg'

export const WATERFALL_VARIANTS: readonly WaterfallChartVariant[] = ['bars', 'steps', 'lollipop']
export const WATERFALL_ORIENTATIONS: readonly WaterfallChartOrientation[] = ['vertical', 'horizontal']
export const WATERFALL_SIZES: readonly WaterfallChartSize[] = ['sm', 'md', 'lg']
export const WATERFALL_GAPS: readonly WaterfallChartGap[] = ['sm', 'md', 'lg']

/** Height of one bar's row (horizontal) per `size`. */
export const WATERFALL_ROW_HEIGHT: Record<WaterfallChartSize, number> = { sm: 24, md: 32, lg: 40 }
