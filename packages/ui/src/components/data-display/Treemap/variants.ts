import { cva, type VariantProps } from '../../../lib/cva'

/** Root of the treemap. `variant` and `size` are also written as data attributes so CSS can hook on them. */
export const treemapVariants = cva('flex w-full min-w-0 flex-col gap-2', {
  variants: {
    variant: { flat: '', nested: '', outline: '' },
    size: { sm: '', md: '', lg: '' },
  },
  defaultVariants: { variant: 'flat', size: 'md' },
})

/** The tile shape. `flat` and `nested` are tinted tiles with a background coloured seam, `outline` is a soft tile with a tone coloured edge. */
export const treemapCellVariants = cva('', {
  variants: {
    variant: {
      flat: 'stroke-background stroke-1',
      nested: 'stroke-background stroke-1',
      outline: 'stroke-2',
    },
  },
  defaultVariants: { variant: 'flat' },
})

export type TreemapVariantProps = VariantProps<typeof treemapVariants>
export type TreemapVariant = NonNullable<TreemapVariantProps['variant']>
export type TreemapSize = NonNullable<TreemapVariantProps['size']>
export type TreemapGap = 'none' | 'sm' | 'md' | 'lg'
export type TreemapColorBy = 'depth' | 'series'
export type TreemapLabels = 'auto' | 'none'

export const TREEMAP_VARIANTS: readonly TreemapVariant[] = ['flat', 'nested', 'outline']
export const TREEMAP_SIZES: readonly TreemapSize[] = ['sm', 'md', 'lg']
export const TREEMAP_GAPS: readonly TreemapGap[] = ['none', 'sm', 'md', 'lg']
export const TREEMAP_COLOR_BY: readonly TreemapColorBy[] = ['depth', 'series']
export const TREEMAP_LABELS: readonly TreemapLabels[] = ['auto', 'none']

/** Viewbox height per `size` (an explicit `height` wins). */
export const TREEMAP_HEIGHTS: Record<TreemapSize, number> = { sm: 200, md: 300, lg: 420 }

/** Space between neighbouring tiles in px. */
export const TREEMAP_GAP_PX: Record<TreemapGap, number> = { none: 0, sm: 1, md: 2, lg: 4 }
