import { cva, type VariantProps } from '../../../lib/cva'

/** Rendered width of a sparkline; `md` (w-24) is the long-standing default and `class` still wins. */
export const sparklineVariants = cva('inline-block h-auto', {
  variants: {
    size: {
      sm: 'w-16 shrink-0 align-middle',
      md: 'w-24 shrink-0 align-middle',
      lg: 'w-32 shrink-0 align-middle',
    },
  },
  defaultVariants: { size: 'md' },
})

export type SparklineVariants = VariantProps<typeof sparklineVariants>
export type SparklineSize = NonNullable<SparklineVariants['size']>
export type SparklineVariant = 'line' | 'area' | 'bar' | 'winloss'
