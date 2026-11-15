import { cva, type VariantProps } from '../../../lib/cva'

/** One cell swatch (and one legend swatch). `shape` square keeps the original `rounded-xs`; circle is a dot. */
export const heatmapCellVariants = cva('block', {
  variants: {
    shape: { square: 'rounded-xs', circle: 'rounded-full' },
    size: { sm: 'size-3', md: 'size-4', lg: 'size-6' },
  },
  defaultVariants: { shape: 'square', size: 'md' },
})

/** Spacing between cells: `sm` 1px, `md` 2px (default), `lg` 4px. */
export const heatmapTableVariants = cva('border-separate', {
  variants: { gap: { sm: 'border-spacing-px', md: 'border-spacing-0.5', lg: 'border-spacing-1' } },
  defaultVariants: { gap: 'md' },
})

export type HeatmapCellVariants = VariantProps<typeof heatmapCellVariants>
export type HeatmapSize = NonNullable<HeatmapCellVariants['size']>
export type HeatmapShape = NonNullable<HeatmapCellVariants['shape']>
export type HeatmapGap = NonNullable<VariantProps<typeof heatmapTableVariants>['gap']>
