import { cva, type VariantProps } from '../../../lib/cva'

/** Root of a RadarChart (the figure). `size` sets the space between caption, plot, legend and the hidden data table. */
export const radarChartVariants = cva('flex w-full min-w-0 flex-col', {
  variants: { size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' } },
  defaultVariants: { size: 'md' },
})

export type RadarChartVariants = VariantProps<typeof radarChartVariants>
export type RadarChartSize = NonNullable<RadarChartVariants['size']>
/** `line` outlines each series, `area` adds a soft fill, `dots` draws only the markers on the axes. */
export type RadarChartVariant = 'line' | 'area' | 'dots'
/** Shape of the rings: straight segments between the axes or full circles. */
export type RadarChartShape = 'polygon' | 'circle'
export type RadarLevels = 3 | 4 | 5 | 6

export const RADAR_VARIANTS: readonly RadarChartVariant[] = ['line', 'area', 'dots']
export const RADAR_SHAPES: readonly RadarChartShape[] = ['polygon', 'circle']
export const RADAR_SIZES: readonly RadarChartSize[] = ['sm', 'md', 'lg']

/** ViewBox height per `size`. The radar is square, so the width of the container only limits it when it is narrower. */
export const RADAR_HEIGHTS: Record<RadarChartSize, number> = { sm: 220, md: 300, lg: 380 }
