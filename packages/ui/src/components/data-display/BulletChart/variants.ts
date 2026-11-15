import { cva, type VariantProps } from '../../../lib/cva'

/** Root of a bullet chart. `size` sets the gap between the title, the plot, the legend and the notes. */
export const bulletChartVariants = cva('flex w-full min-w-0 flex-col', {
  variants: {
    size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' },
    variant: { horizontal: '', vertical: '' },
  },
  defaultVariants: { size: 'md', variant: 'horizontal' },
})

export type BulletChartVariants = VariantProps<typeof bulletChartVariants>
export type BulletChartSize = NonNullable<BulletChartVariants['size']>
export type BulletChartVariant = NonNullable<BulletChartVariants['variant']>
export const BULLET_SIZES: readonly BulletChartSize[] = ['sm', 'md', 'lg']
export const BULLET_VARIANTS: readonly BulletChartVariant[] = ['horizontal', 'vertical']

/**
 * Geometry per `size` (viewBox units, 1 unit = 1 CSS px): `band` is the thickness of the range bands, `pitch` the distance
 * between two horizontal rows, `col` the width of a vertical column and `plot` the height of a vertical plot.
 */
export const BULLET_METRICS: Record<BulletChartSize, { band: number; pitch: number; col: number; plot: number }> = {
  sm: { band: 16, pitch: 28, col: 44, plot: 120 },
  md: { band: 24, pitch: 40, col: 60, plot: 180 },
  lg: { band: 32, pitch: 52, col: 80, plot: 240 },
}
