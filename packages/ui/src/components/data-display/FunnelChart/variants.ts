import { cva, type VariantProps } from '../../../lib/cva'

/** Root of a FunnelChart (the figure). `size` sets the space between caption, plot and the hidden data table. */
export const funnelChartVariants = cva('flex w-full min-w-0 flex-col', {
  variants: { size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' } },
  defaultVariants: { size: 'md' },
})

export type FunnelChartVariants = VariantProps<typeof funnelChartVariants>
export type FunnelChartSize = NonNullable<FunnelChartVariants['size']>
/** `funnel` joins the stages into one shape, `pyramid` stacks it the other way round (first stage at the base), `bars` aligns the stages to the start, `steps` centres a rectangle per stage. */
export type FunnelChartVariant = 'funnel' | 'pyramid' | 'bars' | 'steps'
export type FunnelChartOrientation = 'vertical' | 'horizontal'
/** Space between stages: 2, 4 or 8 viewBox units. */
export type FunnelChartGap = 'sm' | 'md' | 'lg'
export type FunnelLabelPlacement = 'inside' | 'beside'

export const FUNNEL_VARIANTS: readonly FunnelChartVariant[] = ['funnel', 'pyramid', 'bars', 'steps']
export const FUNNEL_ORIENTATIONS: readonly FunnelChartOrientation[] = ['vertical', 'horizontal']
export const FUNNEL_SIZES: readonly FunnelChartSize[] = ['sm', 'md', 'lg']
export const FUNNEL_GAPS: readonly FunnelChartGap[] = ['sm', 'md', 'lg']
export const FUNNEL_PLACEMENTS: readonly FunnelLabelPlacement[] = ['inside', 'beside']

/** Height of one stage (vertical) per `size`. */
export const FUNNEL_ROW_HEIGHT: Record<FunnelChartSize, number> = { sm: 32, md: 44, lg: 56 }
/** Height of the shapes (horizontal) per `size`, without the text under them. */
export const FUNNEL_PLOT_HEIGHT: Record<FunnelChartSize, number> = { sm: 96, md: 144, lg: 200 }
export const FUNNEL_GAP_PX: Record<FunnelChartGap, number> = { sm: 2, md: 4, lg: 8 }
