import { cva, type VariantProps } from '../../../lib/cva'

/** Root: optional billing toggle above the comparison table. */
export const pricingTableVariants = cva('flex w-full flex-col items-center gap-6')

export type PricingTableVariants = VariantProps<typeof pricingTableVariants>
