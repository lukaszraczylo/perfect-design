import { cva, type VariantProps } from '../../../lib/cva'

/** Root of a ScatterChart (the figure). `size` sets the space between caption, plot, legend and the hidden data table. */
export const scatterChartVariants = cva('flex w-full min-w-0 flex-col', {
  variants: { size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' } },
  defaultVariants: { size: 'md' },
})

export type ScatterChartVariants = VariantProps<typeof scatterChartVariants>
export type ScatterChartSize = NonNullable<ScatterChartVariants['size']>
export type ScatterChartVariant = 'scatter' | 'bubble' | 'connected'
export type ScatterGrid = 'none' | 'horizontal' | 'vertical' | 'full' | 'dashed'

export const SCATTER_VARIANTS: readonly ScatterChartVariant[] = ['scatter', 'bubble', 'connected']
export const SCATTER_GRIDS: readonly ScatterGrid[] = ['none', 'horizontal', 'vertical', 'full', 'dashed']
export const SCATTER_SIZES: readonly ScatterChartSize[] = ['sm', 'md', 'lg']

/** ViewBox height per `size` (1 unit = 1 CSS px, so a point is as tall as it looks). */
export const SCATTER_HEIGHTS: Record<ScatterChartSize, number> = { sm: 200, md: 280, lg: 360 }
/** Marker radius of `scatter` and `connected` per `size`. */
export const SCATTER_RADIUS: Record<ScatterChartSize, number> = { sm: 3.5, md: 4.5, lg: 6 }
/** Smallest and largest bubble radius per `size`. */
export const BUBBLE_RADIUS: Record<ScatterChartSize, [number, number]> = { sm: [3, 12], md: [4, 18], lg: [5, 24] }
