import { cva, type VariantProps } from '../../../lib/cva'

export const pricingGridVariants = cva('mx-auto grid items-stretch gap-6', {
  variants: {
    columns: {
      1: 'max-w-md',
      2: 'sm:grid-cols-2',
      3: 'md:grid-cols-2 lg:grid-cols-3',
      4: 'md:grid-cols-2 xl:grid-cols-4',
    },
  },
  defaultVariants: { columns: 3 },
})

/** Wrapper used when the billing toggle is shown above the plans. */
export const pricingGridWrapperVariants = cva('flex flex-col items-center gap-8')

export type PricingGridVariants = VariantProps<typeof pricingGridVariants>
export type PricingGridColumns = NonNullable<PricingGridVariants['columns']>
