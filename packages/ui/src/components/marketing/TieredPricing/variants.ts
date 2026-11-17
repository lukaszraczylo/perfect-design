import { cva, type VariantProps } from '../../../lib/cva'

export const TIERED_PRICING_VARIANTS = ['table', 'steps'] as const
export const TIERED_PRICING_SIZES = ['sm', 'md', 'lg'] as const
export type TieredPricingVariant = (typeof TIERED_PRICING_VARIANTS)[number]
export type TieredPricingSize = (typeof TIERED_PRICING_SIZES)[number]

export const tieredPricingVariants = cva('flex w-full flex-col', {
  variants: {
    variant: { table: '', steps: '' },
    size: { sm: 'gap-2 text-xs', md: 'gap-3 text-sm', lg: 'gap-4 text-base' },
  },
  defaultVariants: { variant: 'table', size: 'md' },
})

/** Table cell padding per size. */
export const tieredPricingCellVariants = cva('border-b border-border align-baseline', {
  variants: { size: { sm: 'px-2 py-1.5', md: 'px-3 py-2', lg: 'px-4 py-3' } },
  defaultVariants: { size: 'md' },
})

/** One step of the ladder; stacked below `sm`, side by side above. */
export const tieredPricingStepVariants = cva('flex min-w-0 flex-1 flex-col rounded-lg border border-border bg-card text-card-foreground', {
  variants: { size: { sm: 'gap-1 p-2', md: 'gap-1.5 p-3', lg: 'gap-2 p-4' } },
  defaultVariants: { size: 'md' },
})

export type TieredPricingVariants = VariantProps<typeof tieredPricingVariants>

export const resolveTieredPricingVariant = (v: unknown): TieredPricingVariant => ((TIERED_PRICING_VARIANTS as readonly unknown[]).includes(v) ? (v as TieredPricingVariant) : 'table')
export const resolveTieredPricingSize = (v: unknown): TieredPricingSize => ((TIERED_PRICING_SIZES as readonly unknown[]).includes(v) ? (v as TieredPricingSize) : 'md')
